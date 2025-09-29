import { formatCurrency, formatPercentage, formatCategory, formatMonthName } from '../utils/formatters.js';
import { validateBudget } from '../utils/validators.js';
import { getAdjacentMonth, calculateCategoryPercentage } from '../utils/helpers.js';
import { getData, saveData } from '../utils/storage.js';
import { showFormModal } from '../components/modals.js';
import { appConfig } from '../config/data.js';

// Manejadores de eventos para evitar duplicados
const eventHandlers = new WeakMap();

export const renderBudget = () => {
    try {
        const data = getData();
        let currentMonth = new Date().toISOString().slice(0, 7); // Mes actual (YYYY-MM)
        const elements = {
            mesActual: document.getElementById('mes-actual'),
            listaPresupuestos: document.getElementById('lista-presupuestos'),
            mesAnterior: document.getElementById('mes-anterior'),
            mesSiguiente: document.getElementById('mes-siguiente'),
            ajustarPresupuesto: document.getElementById('ajustar-presupuesto'),
            errorSpan: document.getElementById('budget-error'),
            excedenteMes: document.getElementById('excedente-mes')
        };

        const missingElements = Object.entries(elements).filter(([key, el]) => !el).map(([key]) => key);
        if (missingElements.length) {
            console.error(`Elementos del DOM no encontrados: ${missingElements.join(', ')}`);
            document.getElementById('content').innerHTML = `
                <div role="alert" class="text-red-500 p-4">Error al cargar Presupuestos: Elementos faltantes</div>
            `;
            return;
        }

        // Calcular gastos por categoría para el mes actual
        const calculateExpensesByCategory = (month) => {
            const expenses = data.gastos.filter(g => g.fecha.startsWith(month));
            return expenses.reduce((acc, g) => {
                acc[g.categoria] = (acc[g.categoria] || 0) + (Number(g.monto) || 0);
                return acc;
            }, {});
        };

        // Renderizar lista de presupuestos
        const renderList = () => {
            const expensesByCategory = calculateExpensesByCategory(currentMonth);
            const presupuestos = data.presupuestos[currentMonth] || {};
            elements.mesActual.textContent = formatMonthName(currentMonth);
            elements.excedenteMes.textContent = formatCurrency(presupuestos.excedente || 0, data.moneda);
            elements.listaPresupuestos.setAttribute('role', 'list');
            elements.listaPresupuestos.className = 'grid gap-4 md:grid-cols-2 lg:grid-cols-3';
            elements.listaPresupuestos.innerHTML = Object.entries(presupuestos)
                .filter(([cat]) => cat !== 'excedente')
                .length
                ? Object.entries(presupuestos)
                    .filter(([cat]) => cat !== 'excedente')
                    .map(([cat, { asignado }]) => {
                        const gastado = expensesByCategory[cat] || 0;
                        const porcentaje = calculateCategoryPercentage(gastado, asignado);
                        return `
                            <li role="listitem" class="category-${cat} p-4 bg-white rounded-lg shadow flex flex-col md:flex-row justify-between items-center">
                                <span class="font-medium">${formatCategory(cat)}: ${formatCurrency(gastado, data.moneda)} / ${formatCurrency(asignado, data.moneda)}</span>
                                <span class="text-sm ${porcentaje > 100 ? 'text-red-500' : 'text-gray-600'} mt-2 md:mt-0">
                                    (${formatPercentage(porcentaje)})
                                </span>
                                <button class="btn bg-blue-500 text-xs mt-2 md:mt-0" data-category="${cat}" data-action="edit" aria-label="Editar presupuesto de ${formatCategory(cat)}">
                                    Editar
                                </button>
                            </li>
                        `;
                    }).join('')
                : '<li role="listitem" class="text-gray-500 p-4">No hay presupuestos para este mes</li>';

            // Añadir eventos a botones de edición
            document.querySelectorAll('[data-action="edit"]').forEach(btn => {
                if (eventHandlers.has(btn)) {
                    btn.removeEventListener('click', eventHandlers.get(btn));
                }
                const handler = () => {
                    const category = btn.dataset.category;
                    const currentBudget = presupuestos[category]?.asignado || 0;
                    showFormModal({
                        title: `Editar Presupuesto: ${formatCategory(category)}`,
                        fields: [
                            { id: 'asignado', label: 'Monto Asignado', type: 'number', value: currentBudget, attributes: { 'aria-label': 'Monto asignado para el presupuesto' } }
                        ],
                        confirmText: 'Guardar',
                        cancelText: 'Cancelar',
                        onSubmit: (values) => {
                            const validation = validateBudget(category, values.asignado);
                            if (!validation.valid) {
                                document.getElementById('modal-error').textContent = validation.error;
                                document.getElementById('modal-error').classList.remove('hidden');
                                return;
                            }
                            data.presupuestos[currentMonth] = data.presupuestos[currentMonth] || {};
                            data.presupuestos[currentMonth][category] = {
                                asignado: Number(values.asignado),
                                gastado: expensesByCategory[category] || 0
                            };
                            saveData(data);
                            renderList();
                        },
                        onCancel: () => {
                            if (document.getElementById('modal-error')) {
                                document.getElementById('modal-error').classList.add('hidden');
                            }
                        }
                    });
                };
                eventHandlers.set(btn, handler);
                btn.addEventListener('click', handler);
            });
        };

        // Limpiar eventos previos
        if (eventHandlers.has(elements.mesAnterior)) {
            elements.mesAnterior.removeEventListener('click', eventHandlers.get(elements.mesAnterior));
        }
        if (eventHandlers.has(elements.mesSiguiente)) {
            elements.mesSiguiente.removeEventListener('click', eventHandlers.get(elements.mesSiguiente));
        }
        if (eventHandlers.has(elements.ajustarPresupuesto)) {
            elements.ajustarPresupuesto.removeEventListener('click', eventHandlers.get(elements.ajustarPresupuesto));
        }

        // Navegación entre meses
        const anteriorHandler = () => {
            currentMonth = getAdjacentMonth(currentMonth, -1);
            renderList();
        };
        const siguienteHandler = () => {
            currentMonth = getAdjacentMonth(currentMonth, 1);
            renderList();
        };
        const ajustarHandler = () => {
            showFormModal({
                title: 'Ajustar Presupuesto',
                fields: [
                    {
                        id: 'categoria',
                        label: 'Categoría',
                        type: 'select',
                        options: Object.keys(appConfig.categoryEmojis).map(cat => ({
                            value: cat,
                            label: formatCategory(cat)
                        })),
                        attributes: { 'aria-label': 'Seleccionar categoría de presupuesto' }
                    },
                    { id: 'asignado', label: 'Monto Asignado', type: 'number', attributes: { 'aria-label': 'Monto asignado para el presupuesto' } }
                ],
                confirmText: 'Guardar',
                cancelText: 'Cancelar',
                onSubmit: (values) => {
                    const validation = validateBudget(values.categoria, values.asignado);
                    if (!validation.valid) {
                        document.getElementById('modal-error').textContent = validation.error;
                        document.getElementById('modal-error').classList.remove('hidden');
                        return;
                    }
                    data.presupuestos[currentMonth] = data.presupuestos[currentMonth] || {};
                    data.presupuestos[currentMonth][values.categoria] = {
                        asignado: Number(values.asignado),
                        gastado: expensesByCategory[values.categoria] || 0
                    };
                    saveData(data);
                    renderList();
                },
                onCancel: () => {
                    if (document.getElementById('modal-error')) {
                        document.getElementById('modal-error').classList.add('hidden');
                    }
                }
            });
        };

        eventHandlers.set(elements.mesAnterior, anteriorHandler);
        eventHandlers.set(elements.mesSiguiente, siguienteHandler);
        eventHandlers.set(elements.ajustarPresupuesto, ajustarHandler);

        elements.mesAnterior.addEventListener('click', anteriorHandler);
        elements.mesSiguiente.addEventListener('click', siguienteHandler);
        elements.ajustarPresupuesto.addEventListener('click', ajustarHandler);

        // Limpiar mensaje de error general
        elements.errorSpan.classList.add('hidden');
        elements.errorSpan.textContent = '';

        // Inicializar lista
        renderList();
    } catch (error) {
        console.error('Error en renderBudget:', error);
        document.getElementById('content').innerHTML = `
            <div role="alert" class="text-red-500 p-4">Error al cargar Presupuestos</div>
        `;
    }
};
