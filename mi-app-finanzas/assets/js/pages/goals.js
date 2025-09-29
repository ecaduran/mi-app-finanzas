import { formatCurrency, formatDate, formatPercentage } from '../utils/formatters.js';
import { validateGoal, validateDate } from '../utils/validators.js';
import { getData, saveData } from '../utils/storage.js';
import { showFormModal } from '../components/modals.js';

// Manejadores de eventos para evitar duplicados
const eventHandlers = new WeakMap();

export const renderGoals = () => {
    try {
        const data = getData();
        const elements = {
            goalsList: document.getElementById('lista-metas'),
            addButton: document.getElementById('add-meta'),
            errorSpan: document.getElementById('goals-error') // Nuevo elemento
        };

        const missingElements = Object.entries(elements).filter(([key, el]) => !el).map(([key]) => key);
        if (missingElements.length) {
            console.error(`Elementos del DOM no encontrados: ${missingElements.join(', ')}`);
            document.getElementById('content').innerHTML = `
                <div role="alert" class="text-red-500 p-4">Error al cargar Metas: Elementos faltantes</div>
            `;
            return;
        }

        // Renderizar lista de metas
        const renderList = () => {
            elements.goalsList.setAttribute('role', 'list');
            elements.goalsList.className = 'grid gap-4 md:grid-cols-2 lg:grid-cols-3';
            elements.goalsList.innerHTML = data.metas.length
                ? data.metas.map((m, index) => {
                    const porcentaje = m.total > 0 ? (m.progreso / m.total) * 100 : 0;
                    const progressColor = porcentaje < 70 ? 'bg-green-500' : porcentaje < 100 ? 'bg-yellow-500' : 'bg-red-500';
                    return `
                        <li role="listitem" class="p-4 bg-white rounded-lg shadow flex flex-col">
                            <div class="flex justify-between items-center mb-2">
                                <span class="font-medium">${m.nombre}: ${formatCurrency(m.progreso, data.moneda)} / ${formatCurrency(m.total, data.moneda)}</span>
                                <span class="text-sm ${porcentaje >= 100 ? 'text-red-500' : 'text-gray-600'}">${formatPercentage(porcentaje)}</span>
                            </div>
                            <progress value="${porcentaje}" max="100" class="w-full h-2 ${progressColor}" aria-valuenow="${porcentaje.toFixed(0)}" aria-valuetext="${formatPercentage(porcentaje)} completado"></progress>
                            <p class="text-sm text-gray-600 mt-1">Plazo: ${formatDate(m.plazo, 'long')}</p>
                            <div class="flex gap-2 mt-2">
                                <button class="btn bg-blue-500 text-xs" data-index="${index}" data-action="edit" aria-label="Editar meta ${m.nombre}">Editar</button>
                                <button class="btn bg-green-500 text-xs" data-index="${index}" data-action="contribute" aria-label="Contribuir a meta ${m.nombre}">Contribuir</button>
                            </div>
                        </li>
                    `;
                }).join('')
                : '<li role="listitem" class="text-gray-500 p-4">No hay metas</li>';

            // Añadir eventos a botones de edición y contribución
            document.querySelectorAll('[data-action="edit"]').forEach(btn => {
                if (eventHandlers.has(btn)) {
                    btn.removeEventListener('click', eventHandlers.get(btn));
                }
                const handler = () => {
                    const index = Number(btn.dataset.index);
                    const meta = data.metas[index];
                    showFormModal({
                        title: `Editar Meta: ${meta.nombre}`,
                        fields: [
                            { id: 'nombre', label: 'Nombre', type: 'text', value: meta.nombre, attributes: { 'aria-describedby': 'nombre-error' } },
                            { id: 'total', label: 'Monto Total', type: 'number', value: meta.total, attributes: { 'aria-describedby': 'total-error' } },
                            { id: 'plazo', label: 'Plazo', type: 'date', value: meta.plazo, attributes: { 'aria-describedby': 'plazo-error' } }
                        ],
                        confirmText: 'Guardar',
                        cancelText: 'Cancelar',
                        onSubmit: (values) => {
                            const validations = [
                                validateGoal(values.nombre, values.total, values.plazo),
                                validateDate(values.plazo, true, false) // No fechas pasadas
                            ];
                            const errorFields = ['nombre-error', 'total-error', 'plazo-error'];
                            validations.forEach((v, i) => {
                                const errorEl = document.getElementById(errorFields[i]);
                                if (errorEl) {
                                    errorEl.textContent = v.valid ? '' : v.error;
                                    errorEl.classList.toggle('hidden', v.valid);
                                }
                            });
                            if (validations.some(v => !v.valid)) return;
                            if (Number(values.total) < meta.progreso) {
                                document.getElementById('total-error').textContent = 'El monto total no puede ser menor al progreso actual';
                                document.getElementById('total-error').classList.remove('hidden');
                                return;
                            }
                            data.metas[index] = {
                                nombre: values.nombre,
                                total: Number(values.total),
                                progreso: meta.progreso,
                                plazo: values.plazo
                            };
                            saveData(data);
                            renderList();
                        },
                        onCancel: () => {
                            ['nombre-error', 'total-error', 'plazo-error'].forEach(id => {
                                const errorEl = document.getElementById(id);
                                if (errorEl) {
                                    errorEl.classList.add('hidden');
                                    errorEl.textContent = '';
                                }
                            });
                        }
                    });
                };
                eventHandlers.set(btn, handler);
                btn.addEventListener('click', handler);
            });

            document.querySelectorAll('[data-action="contribute"]').forEach(btn => {
                if (eventHandlers.has(btn)) {
                    btn.removeEventListener('click', eventHandlers.get(btn));
                }
                const handler = () => {
                    const index = Number(btn.dataset.index);
                    const meta = data.metas[index];
                    showFormModal({
                        title: `Contribuir a Meta: ${meta.nombre}`,
                        fields: [
                            { id: 'monto', label: 'Monto a Contribuir', type: 'number', attributes: { 'aria-describedby': 'monto-error' } }
                        ],
                        confirmText: 'Contribuir',
                        cancelText: 'Cancelar',
                        onSubmit: (values) => {
                            const monto = Number(values.monto);
                            if (!validateAmount(monto).valid) {
                                document.getElementById('monto-error').textContent = 'El monto debe ser mayor a 0';
                                document.getElementById('monto-error').classList.remove('hidden');
                                return;
                            }
                            if (monto + meta.progreso > meta.total) {
                                document.getElementById('monto-error').textContent = `El monto excede el restante (${formatCurrency(meta.total - meta.progreso, data.moneda)})`;
                                document.getElementById('monto-error').classList.remove('hidden');
                                return;
                            }
                            data.metas[index].progreso += monto;
                            saveData(data);
                            renderList();
                        },
                        onCancel: () => {
                            const errorEl = document.getElementById('monto-error');
                            if (errorEl) {
                                errorEl.classList.add('hidden');
                                errorEl.textContent = '';
                            }
                        }
                    });
                };
                eventHandlers.set(btn, handler);
                btn.addEventListener('click', handler);
            });
        };

        // Limpiar eventos previos
        if (eventHandlers.has(elements.addButton)) {
            elements.addButton.removeEventListener('click', eventHandlers.get(elements.addButton));
        }

        // Manejar botón de agregar meta
        const addHandler = () => {
            showFormModal({
                title: 'Nueva Meta',
                fields: [
                    { id: 'nombre', label: 'Nombre', type: 'text', attributes: { 'aria-describedby': 'nombre-error' } },
                    { id: 'total', label: 'Monto Total', type: 'number', attributes: { 'aria-describedby': 'total-error' } },
                    { id: 'plazo', label: 'Plazo', type: 'date', attributes: { 'aria-describedby': 'plazo-error' } }
                ],
                confirmText: 'Crear',
                cancelText: 'Cancelar',
                onSubmit: (values) => {
                    const validations = [
                        validateGoal(values.nombre, values.total, values.plazo),
                        validateDate(values.plazo, true, false) // No fechas pasadas
                    ];
                    const errorFields = ['nombre-error', 'total-error', 'plazo-error'];
                    validations.forEach((v, i) => {
                        const errorEl = document.getElementById(errorFields[i]);
                        if (errorEl) {
                            errorEl.textContent = v.valid ? '' : v.error;
                            errorEl.classList.toggle('hidden', v.valid);
                        }
                    });
                    if (validations.some(v => !v.valid)) return;
                    data.metas.push({
                        nombre: values.nombre,
                        total: Number(values.total),
                        progreso: 0,
                        plazo: values.plazo
                    });
                    saveData(data);
                    renderList();
                },
                onCancel: () => {
                    ['nombre-error', 'total-error', 'plazo-error'].forEach(id => {
                        const errorEl = document.getElementById(id);
                        if (errorEl) {
                            errorEl.classList.add('hidden');
                            errorEl.textContent = '';
                        }
                    });
                }
            });
        };
        eventHandlers.set(elements.addButton, addHandler);
        elements.addButton.addEventListener('click', addHandler);

        // Limpiar mensaje de error general
        elements.errorSpan.classList.add('hidden');
        elements.errorSpan.textContent = '';

        // Inicializar lista
        renderList();
    } catch (error) {
        console.error('Error en renderGoals:', error);
        document.getElementById('content').innerHTML = `
            <div role="alert" class="text-red-500 p-4">Error al cargar Metas</div>
        `;
    }
};
