import { formatCurrency, formatCategory, formatDate, formatPercentage } from '../utils/formatters.js';
import { validateAmount, validateCategory, validateDate } from '../utils/validators.js';
import { generateQuickButtons, generateRecentExpenses } from '../utils/helpers.js';
import { getData, saveData } from '../utils/storage.js';
import { showModal } from '../components/modals.js';
import { appConfig } from '../config/data.js';

// Manejadores de eventos para evitar duplicados
const eventHandlers = new WeakMap();

export const renderExpenses = () => {
    try {
        const data = getData();
        const elements = {
            form: document.getElementById('form-gastos'),
            monto: document.getElementById('monto-gasto'),
            categoria: document.getElementById('categoria-gasto'),
            nota: document.getElementById('nota-gasto'),
            fecha: document.getElementById('fecha-gasto'),
            gastosRapidos: document.getElementById('gastos-rapidos'),
            gastosRecientes: document.getElementById('gastos-recientes'),
            montoError: document.getElementById('monto-error'),
            categoriaError: document.getElementById('categoria-error'),
            fechaError: document.getElementById('fecha-error')
        };

        const missingElements = Object.entries(elements).filter(([key, el]) => !el).map(([key]) => key);
        if (missingElements.length) {
            console.error(`Elementos del DOM no encontrados: ${missingElements.join(', ')}`);
            document.getElementById('content').innerHTML = `
                <div role="alert" class="text-red-500 p-4">Error al cargar Gastos: Elementos faltantes</div>
            `;
            return;
        }

        // Renderizar categorías y gastos recientes
        elements.categoria.innerHTML = `
            <option value="">Seleccione una categoría</option>
            ${Object.keys(appConfig.categoryEmojis).map(cat => `
                <option value="${cat}">${formatCategory(cat)}</option>
            `).join('')}
        `;
        elements.gastosRecientes.setAttribute('role', 'list');
        elements.gastosRecientes.setAttribute('aria-label', 'Gastos recientes');
        elements.gastosRecientes.innerHTML = generateRecentExpenses(data.gastos, data.moneda);
        elements.gastosRapidos.setAttribute('role', 'list');
        elements.gastosRapidos.setAttribute('aria-label', 'Botones de gastos rápidos');
        elements.gastosRapidos.innerHTML = generateQuickButtons(elements.categoria.value, data.atajos, data.moneda);

        // Limpiar mensajes de error
        elements.montoError.classList.add('hidden');
        elements.montoError.textContent = '';
        elements.categoriaError.classList.add('hidden');
        elements.categoriaError.textContent = '';
        elements.fechaError.classList.add('hidden');
        elements.fechaError.textContent = '';

        // Manejar cambio de categoría
        const categoriaHandler = () => {
            elements.gastosRapidos.innerHTML = generateQuickButtons(elements.categoria.value, data.atajos, data.moneda);
            bindQuickButtons();
        };
        if (eventHandlers.has(elements.categoria)) {
            elements.categoria.removeEventListener('change', eventHandlers.get(elements.categoria));
        }
        eventHandlers.set(elements.categoria, categoriaHandler);
        elements.categoria.addEventListener('change', categoriaHandler);

        // Manejar botones rápidos
        const bindQuickButtons = () => {
            document.querySelectorAll('.gasto-rapido').forEach(btn => {
                if (eventHandlers.has(btn)) {
                    btn.removeEventListener('click', eventHandlers.get(btn));
                }
                const handler = () => {
                    const monto = Number(btn.dataset.monto);
                    const categoria = elements.categoria.value;
                    const fecha = elements.fecha.value || formatDate(new Date());
                    const validations = [
                        validateAmount(monto),
                        validateCategory(categoria),
                        validateDate(fecha, false, true) // No fechas futuras
                    ];
                    const errorField = ['montoError', 'categoriaError', 'fechaError'];
                    validations.forEach((v, i) => {
                        if (!v.valid) {
                            elements[errorField[i]].textContent = v.error;
                            elements[errorField[i]].classList.remove('hidden');
                        } else {
                            elements[errorField[i]].classList.add('hidden');
                        }
                    });
                    if (validations.some(v => !v.valid)) return;
                    saveAndRender({ monto, categoria, fecha });
                };
                eventHandlers.set(btn, handler);
                btn.addEventListener('click', handler);
            });
        };
        bindQuickButtons();

        // Manejar formulario
        const formHandler = (e) => {
            e.preventDefault();
            const monto = Number(elements.monto.value);
            const categoria = elements.categoria.value;
            const nota = elements.nota.value;
            const fecha = elements.fecha.value || formatDate(new Date());
            const validations = [
                validateAmount(monto),
                validateCategory(categoria),
                validateDate(fecha, false, true) // No fechas futuras
            ];
            const errorField = ['montoError', 'categoriaError', 'fechaError'];
            validations.forEach((v, i) => {
                if (!v.valid) {
                    elements[errorField[i]].textContent = v.error;
                    elements[errorField[i]].classList.remove('hidden');
                } else {
                    elements[errorField[i]].classList.add('hidden');
                }
            });
            if (validations.some(v => !v.valid)) return;
            saveAndRender({ monto, categoria, nota, fecha });
        };
        if (eventHandlers.has(elements.form)) {
            elements.form.removeEventListener('submit', eventHandlers.get(elements.form));
        }
        eventHandlers.set(elements.form, formHandler);
        elements.form.addEventListener('submit', formHandler);

        // Función para guardar y renderizar
        const saveAndRender = ({ monto, categoria, nota = '', fecha }) => {
            const ingresos = data.ingresos.reduce((sum, i) => sum + (Number(i.monto) || 0), 0);
            const currentMonth = fecha.slice(0, 7);
            const budget = data.presupuestos[currentMonth]?.[categoria] || { asignado: 0, gastado: 0 };
            const newGastado = budget.gastado + monto;
            const percentageIngresos = ingresos > 0 ? (monto / ingresos) * 100 : 0;
            const percentagePresupuesto = budget.asignado > 0 ? (newGastado / budget.asignado) * 100 : 0;

            const showConfirmation = (callback) => {
                showModal({
                    title: 'Confirmar Gasto',
                    message: `Este gasto es el ${formatPercentage(percentageIngresos)} de tus ingresos (${formatCurrency(monto, data.moneda)}). ¿Confirmar?`,
                    confirmText: 'Confirmar',
                    cancelText: 'Cancelar',
                    onConfirm: callback
                });
            };

            const saveExpense = () => {
                data.gastos.push({ monto, categoria, nota, fecha });
                data.presupuestos[currentMonth] = data.presupuestos[currentMonth] || {};
                data.presupuestos[currentMonth][categoria] = { asignado: budget.asignado, gastado: newGastado };
                saveData(data);
                elements.form.reset();
                elements.gastosRecientes.innerHTML = generateRecentExpenses(data.gastos, data.moneda);
                elements.gastosRapidos.innerHTML = generateQuickButtons(elements.categoria.value, data.atajos, data.moneda);
                bindQuickButtons();
            };

            if (percentageIngresos > appConfig.alerts.expensePercentageWarning) {
                showConfirmation(() => {
                    if (percentagePresupuesto > 100) {
                        showModal({
                            title: 'Advertencia de Presupuesto',
                            message: `Este gasto excede el presupuesto de ${formatCategory(categoria)} (${formatPercentage(percentagePresupuesto)}). ¿Continuar?`,
                            confirmText: 'Confirmar',
                            cancelText: 'Cancelar',
                            onConfirm: saveExpense
                        });
                    } else {
                        saveExpense();
                    }
                });
            } else if (percentagePresupuesto > 100) {
                showModal({
                    title: 'Advertencia de Presupuesto',
                    message: `Este gasto excede el presupuesto de ${formatCategory(categoria)} (${formatPercentage(percentagePresupuesto)}). ¿Continuar?`,
                    confirmText: 'Confirmar',
                    cancelText: 'Cancelar',
                    onConfirm: saveExpense
                });
            } else {
                saveExpense();
            }
        };
    } catch (error) {
        console.error('Error en renderExpenses:', error);
        document.getElementById('content').innerHTML = `
            <div role="alert" class="text-red-500 p-4">Error al cargar Gastos</div>
        `;
    }
};
