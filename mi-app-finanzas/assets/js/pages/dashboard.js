import { formatCurrency, formatPercentage } from '../utils/formatters.js';
import { getData, saveData } from '../utils/storage.js';
import { getAdjacentMonth } from '../utils/helpers.js';
import { showModal } from '../components/modals.js';
import { appConfig } from '../config/data.js';

// Manejadores de eventos para evitar duplicados
const eventHandlers = new WeakMap();

export const renderDashboard = () => {
    try {
        const data = getData();

        // Calcular métricas
        const ingresos = Array.isArray(data.ingresos) ? data.ingresos.reduce((sum, i) => sum + (Number(i.monto) || 0), 0) : 0;
        const gastos = Array.isArray(data.gastos) ? data.gastos.reduce((sum, g) => sum + (Number(g.monto) || 0), 0) : 0;
        const balance = ingresos - gastos;
        const porcentajeGastado = ingresos > 0 ? (gastos / ingresos) * 100 : 0;
        const warningThreshold = appConfig.alerts.expensePercentageWarning || 70;
        const semaforo = porcentajeGastado < warningThreshold ? 'bg-green-500' : porcentajeGastado < 100 ? 'bg-yellow-500' : 'bg-red-500';
        const estadoTexto = porcentajeGastado < warningThreshold ? 'Excelente control financiero' : porcentajeGastado < 100 ? 'Cuidado con tus gastos' : 'Gastos excedidos';

        // Verificar elementos del DOM
        const elements = {
            ingresos: document.getElementById('ingresos'),
            gastos: document.getElementById('gastos'),
            balance: document.getElementById('balance'),
            progresoGasto: document.getElementById('progreso-gasto'),
            porcentajeGasto: document.getElementById('porcentaje-gasto'),
            semaforo: document.getElementById('semaforo'),
            estadoTexto: document.getElementById('estado-texto'),
            excedenteMonto: document.getElementById('excedente-monto'),
            guardarAhorro: document.getElementById('guardar-ahorro'),
            trasladarMes: document.getElementById('trasladar-mes')
        };

        const missingElements = Object.entries(elements).filter(([key, el]) => !el).map(([key]) => key);
        if (missingElements.length) {
            console.error(`Elementos del DOM no encontrados: ${missingElements.join(', ')}`);
            document.getElementById('content').innerHTML = `
                <div role="alert" class="text-red-500 p-4">Error al cargar el Dashboard: Elementos faltantes</div>
            `;
            return;
        }

        // Actualizar DOM
        elements.ingresos.textContent = formatCurrency(ingresos, data.moneda);
        elements.gastos.textContent = formatCurrency(gastos, data.moneda);
        elements.balance.textContent = formatCurrency(balance, data.moneda);
        elements.progresoGasto.value = porcentajeGastado;
        elements.progresoGasto.setAttribute('aria-valuenow', porcentajeGastado.toFixed(0));
        elements.progresoGasto.setAttribute('aria-valuetext', `${formatPercentage(porcentajeGastado)} del presupuesto utilizado`);
        elements.progresoGasto.className = `w-full h-4 ${porcentajeGastado < warningThreshold ? 'progress-green' : porcentajeGastado < 100 ? 'progress-yellow' : 'progress-red'}`;
        elements.porcentajeGasto.textContent = `${formatPercentage(porcentajeGastado)} del presupuesto utilizado`;
        elements.semaforo.className = `semaforo ${semaforo}`;
        elements.semaforo.setAttribute('aria-label', `Estado financiero: ${estadoTexto}`);
        elements.estadoTexto.textContent = estadoTexto;
        elements.excedenteMonto.textContent = formatCurrency(data.excedenteAnterior || 0, data.moneda);

        // Manejador para guardar excedente en una meta
        const guardarHandler = () => {
            if (!data.metas?.length) {
                showModal({
                    title: 'Sin Metas Definidas',
                    message: 'No hay metas definidas. Crea una meta primero en la sección de Metas.',
                    confirmText: 'Aceptar',
                    cancelText: 'Cerrar',
                    onConfirm: () => {},
                    onCancel: () => {}
                });
                return;
            }
            showModal({
                title: 'Guardar Excedente en Meta',
                message: `
                    <label for="meta-select" class="block mb-2">Seleccionar Meta:</label>
                    <select id="meta-select" class="w-full p-2 border rounded">
                        ${data.metas.map((meta, index) => `
                            <option value="${index}">${meta.nombre} (${formatCurrency(meta.total - (meta.progreso || 0), data.moneda)} restante)</option>
                        `).join('')}
                    </select>
                `,
                confirmText: 'Guardar',
                cancelText: 'Cancelar',
                onConfirm: () => {
                    const select = document.getElementById('meta-select');
                    const metaIndex = Number(select.value);
                    data.metas[metaIndex].progreso = (data.metas[metaIndex].progreso || 0) + (data.excedenteAnterior || 0);
                    data.excedenteAnterior = 0;
                    saveData(data);
                    renderDashboard();
                }
            });
        };

        // Manejador para trasladar excedente al próximo mes
        const trasladarHandler = () => {
            const currentMonth = new Date().toISOString().slice(0, 7); // ej. '2025-09'
            const nextMonth = getAdjacentMonth(currentMonth, 1);
            showModal({
                title: 'Trasladar Excedente',
                message: `¿Deseas trasladar ${formatCurrency(data.excedenteAnterior || 0, data.moneda)} al presupuesto de ${nextMonth}?`,
                confirmText: 'Trasladar',
                cancelText: 'Cancelar',
                onConfirm: () => {
                    data.presupuestos[nextMonth] = data.presupuestos[nextMonth] || {};
                    data.presupuestos[nextMonth].excedente = (data.presupuestos[nextMonth].excedente || 0) + (data.excedenteAnterior || 0);
                    data.excedenteAnterior = 0;
                    saveData(data);
                    renderDashboard();
                }
            });
        };

        // Limpiar y asignar eventos
        if (eventHandlers.has(elements.guardarAhorro)) {
            elements.guardarAhorro.removeEventListener('click', eventHandlers.get(elements.guardarAhorro));
        }
        eventHandlers.set(elements.guardarAhorro, guardarHandler);
        elements.guardarAhorro.addEventListener('click', guardarHandler);

        if (eventHandlers.has(elements.trasladarMes)) {
            elements.trasladarMes.removeEventListener('click', eventHandlers.get(elements.trasladarMes));
        }
        eventHandlers.set(elements.trasladarMes, trasladarHandler);
        elements.trasladarMes.addEventListener('click', trasladarHandler);

    } catch (error) {
        console.error('Error en renderDashboard:', error);
        document.getElementById('content').innerHTML = `
            <div role="alert" class="text-red-500 p-4">Error al cargar el Dashboard</div>
        `;
    }
};
