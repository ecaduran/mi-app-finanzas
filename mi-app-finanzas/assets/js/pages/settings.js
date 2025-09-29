import { resetData, exportData, importData } from '../utils/storage.js';
import { validateCurrency } from '../utils/validators.js';
import { getData, saveData } from '../utils/storage.js';
import { showModal } from '../components/modals.js';
import { appConfig } from '../config/data.js';
import { renderDashboard } from './dashboard.js';
import { renderExpenses } from './expenses.js';
import { renderBudget } from './budget.js';
import { renderGoals } from './goals.js';
import { renderReports } from './reports.js';

// Manejadores de eventos para evitar duplicados
const eventHandlers = new WeakMap();

export const renderSettings = () => {
    try {
        const data = getData();
        const elements = {
            currencySelect: document.getElementById('currency-select'),
            resetButton: document.getElementById('reset-data'),
            exportButton: document.getElementById('export-data'),
            importInput: document.getElementById('import-data'),
            errorSpan: document.getElementById('settings-error')
        };

        const missingElements = Object.entries(elements).filter(([key, el]) => !el).map(([key]) => key);
        if (missingElements.length) {
            console.error(`Elementos del DOM no encontrados: ${missingElements.join(', ')}`);
            document.getElementById('content').innerHTML = `
                <div role="alert" class="text-red-500 p-4">Error al cargar Configuración: Elementos faltantes</div>
            `;
            return;
        }

        // Limpiar mensaje de error
        elements.errorSpan.classList.add('hidden');
        elements.errorSpan.textContent = '';

        // Rellenar select de monedas
        elements.currencySelect.innerHTML = appConfig.supportedCurrencies.map(c => `
            <option value="${c}" ${c === data.moneda ? 'selected' : ''}>${c}</option>
        `).join('');
        elements.currencySelect.setAttribute('aria-label', 'Seleccionar moneda');
        elements.currencySelect.setAttribute('aria-describedby', 'settings-error');

        // Limpiar eventos previos
        if (eventHandlers.has(elements.currencySelect)) {
            elements.currencySelect.removeEventListener('change', eventHandlers.get(elements.currencySelect));
        }
        if (eventHandlers.has(elements.resetButton)) {
            elements.resetButton.removeEventListener('click', eventHandlers.get(elements.resetButton));
        }
        if (eventHandlers.has(elements.exportButton)) {
            elements.exportButton.removeEventListener('click', eventHandlers.get(elements.exportButton));
        }
        if (eventHandlers.has(elements.importInput)) {
            elements.importInput.removeEventListener('change', eventHandlers.get(elements.importInput));
        }

        // Cambiar moneda
        const currencyHandler = () => {
            const currency = elements.currencySelect.value;
            const validation = validateCurrency(currency);
            if (!validation.valid) {
                elements.errorSpan.textContent = validation.error;
                elements.errorSpan.classList.remove('hidden');
                elements.errorSpan.focus();
                return;
            }
            elements.errorSpan.classList.add('hidden');
            data.moneda = currency;
            saveData(data);
            // Actualizar todas las pantallas
            renderDashboard();
            renderExpenses();
            renderBudget();
            renderGoals();
            renderReports();
        };
        eventHandlers.set(elements.currencySelect, currencyHandler);
        elements.currencySelect.addEventListener('change', currencyHandler);

        // Restablecer datos
        const resetHandler = () => {
            showModal({
                title: 'Restablecer Datos',
                message: '¿Estás seguro de restablecer todos los datos? Esta acción no se puede deshacer.',
                confirmText: 'Restablecer',
                cancelText: 'Cancelar',
                onConfirm: () => {
                    elements.resetButton.disabled = true;
                    elements.resetButton.setAttribute('aria-busy', 'true');
                    if (resetData()) {
                        elements.errorSpan.classList.add('hidden');
                        // Actualizar todas las pantallas
                        renderDashboard();
                        renderExpenses();
                        renderBudget();
                        renderGoals();
                        renderReports();
                    } else {
                        elements.errorSpan.textContent = 'Error al restablecer datos';
                        elements.errorSpan.classList.remove('hidden');
                    }
                    elements.resetButton.disabled = false;
                    elements.resetButton.setAttribute('aria-busy', 'false');
                }
            });
        };
        eventHandlers.set(elements.resetButton, resetHandler);
        elements.resetButton.addEventListener('click', resetHandler);

        // Exportar datos
        const exportHandler = () => {
            elements.exportButton.disabled = true;
            elements.exportButton.setAttribute('aria-busy', 'true');
            showModal({
                title: 'Exportar Datos',
                message: '¿Estás seguro de exportar los datos actuales?',
                confirmText: 'Exportar',
                cancelText: 'Cancelar',
                onConfirm: () => {
                    if (exportData()) {
                        showModal({
                            title: 'Éxito',
                            message: 'Datos exportados correctamente',
                            cancelText: 'Cerrar',
                            confirmText: 'Aceptar',
                            onConfirm: () => {}
                        });
                        elements.errorSpan.classList.add('hidden');
                    } else {
                        elements.errorSpan.textContent = 'Error al exportar datos';
                        elements.errorSpan.classList.remove('hidden');
                    }
                    elements.exportButton.disabled = false;
                    elements.exportButton.setAttribute('aria-busy', 'false');
                }
            });
        };
        eventHandlers.set(elements.exportButton, exportHandler);
        elements.exportButton.addEventListener('click', exportHandler);

        // Importar datos
        const importHandler = (e) => {
            const file = e.target.files[0];
            if (!file) return;
            elements.importInput.disabled = true;
            elements.importInput.setAttribute('aria-busy', 'true');
            showModal({
                title: 'Importar Datos',
                message: '¿Estás seguro de importar los datos? Esto sobrescribirá los datos actuales.',
                confirmText: 'Importar',
                cancelText: 'Cancelar',
                onConfirm: () => {
                    importData(file)
                        .then(() => {
                            showModal({
                                title: 'Éxito',
                                message: 'Datos importados correctamente',
                                cancelText: 'Cerrar',
                                confirmText: 'Aceptar',
                                onConfirm: () => {
                                    elements.errorSpan.classList.add('hidden');
                                    elements.importInput.value = '';
                                    // Actualizar todas las pantallas
                                    renderDashboard();
                                    renderExpenses();
                                    renderBudget();
                                    renderGoals();
                                    renderReports();
                                }
                            });
                        })
                        .catch((error) => {
                            elements.errorSpan.textContent = error.message || 'Error al importar datos';
                            elements.errorSpan.classList.remove('hidden');
                            elements.errorSpan.focus();
                            elements.importInput.value = '';
                        })
                        .finally(() => {
                            elements.importInput.disabled = false;
                            elements.importInput.setAttribute('aria-busy', 'false');
                        });
                },
                onCancel: () => {
                    elements.importInput.value = '';
                    elements.importInput.disabled = false;
                    elements.importInput.setAttribute('aria-busy', 'false');
                }
            });
        };
        eventHandlers.set(elements.importInput, importHandler);
        elements.importInput.addEventListener('change', importHandler);
    } catch (error) {
        console.error('Error en renderSettings:', error);
        document.getElementById('content').innerHTML = `
            <div role="alert" class="text-red-500 p-4">Error al cargar Configuración</div>
        `;
    }
};
