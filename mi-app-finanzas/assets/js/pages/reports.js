import { formatCurrency, formatCategory, formatPercentage, formatMonthName } from '../utils/formatters.js';
import { calculateCategoryPercentage } from '../utils/helpers.js';
import { getData } from '../utils/storage.js';
import { showModal } from '../components/modals.js';
import { appConfig } from '../config/data.js';

// Manejadores de eventos para evitar duplicados
const eventHandlers = new WeakMap();

export const renderReports = () => {
    try {
        const data = getData();
        const elements = {
            reportsList: document.getElementById('lista-reportes'),
            chartContainer: document.getElementById('report-chart'),
            mesReporte: document.getElementById('mes-reporte'),
            errorSpan: document.getElementById('reports-error') // Nuevo elemento
        };

        const missingElements = Object.entries(elements).filter(([key, el]) => !el).map(([key]) => key);
        if (missingElements.length) {
            console.error(`Elementos del DOM no encontrados: ${missingElements.join(', ')}`);
            document.getElementById('content').innerHTML = `
                <div role="alert" class="text-red-500 p-4">Error al cargar Reportes: Elementos faltantes</div>
            `;
            return;
        }

        // Limpiar mensaje de error
        elements.errorSpan.classList.add('hidden');
        elements.errorSpan.textContent = '';

        // Rellenar selector de meses
        const months = Object.keys(data.presupuestos).sort((a, b) => b.localeCompare(a));
        elements.mesReporte.innerHTML = months.map(m => `
            <option value="${m}" ${m === months[0] ? 'selected' : ''}>${formatMonthName(m)}</option>
        `).join('');
        elements.mesReporte.setAttribute('aria-label', 'Seleccionar mes para reportes');
        elements.mesReporte.addEventListener('change', () => {
            const selectedMonth = elements.mesReporte.value;
            renderList(selectedMonth);
            renderChart(selectedMonth);
        });

        // Renderizar lista de reportes
        const renderList = (month) => {
            const categories = data.presupuestos[month] || {};
            elements.reportsList.setAttribute('role', 'list');
            elements.reportsList.className = 'grid gap-4 md:grid-cols-2 lg:grid-cols-3';
            elements.reportsList.innerHTML = Object.entries(categories).length
                ? Object.entries(categories).filter(([cat]) => cat !== 'excedente').map(([cat, { asignado, gastado }]) => `
                    <li role="listitem" class="category-${cat} p-4 bg-white rounded-lg shadow flex flex-col md:flex-row justify-between items-center">
                        <span>${formatCategory(cat)}: ${formatCurrency(gastado, data.moneda)} / ${formatCurrency(asignado, data.moneda)}</span>
                        <span class="text-sm ${calculateCategoryPercentage(gastado, asignado) > 100 ? 'text-red-500' : ''}">
                            (${formatPercentage(calculateCategoryPercentage(gastado, asignado))})
                        </span>
                        <button class="btn bg-blue-500 text-xs mt-2 md:mt-0" data-month="${month}" data-category="${cat}" aria-label="Ver detalles de ${formatCategory(cat)} en ${formatMonthName(month)}">
                            Ver
                        </button>
                    </li>
                `).join('')
                : '<li role="listitem" class="text-gray-500 p-4">No hay reportes para este mes</li>';
        };

        // Renderizar gráfico
        const renderChart = (month) => {
            const categories = data.presupuestos[month] || {};
            const chartData = {
                labels: Object.keys(categories).filter(cat => cat !== 'excedente').map(cat => formatCategory(cat)),
                datasets: [{
                    label: 'Gastado',
                    data: Object.entries(categories).filter(([cat]) => cat !== 'excedente').map(([cat, { gastado }]) => gastado),
                    backgroundColor: Object.entries(categories).filter(([cat]) => cat !== 'excedente').map(([cat, { asignado, gastado }]) => {
                        const percentage = calculateCategoryPercentage(gastado, asignado);
                        if (percentage > 100) return appConfig.colors.red;
                        if (percentage > 80) return appConfig.colors.yellow;
                        return appConfig.colors.green;
                    })
                }]
            };

            new Chart(elements.chartContainer, {
                type: 'bar',
                data: chartData,
                options: {
                    responsive: true,
                    plugins: { legend: { display: false } },
                    scales: {
                        y: { beginAtZero: true, title: { display: true, text: `Monto (${data.moneda})` } }
                    }
                }
            });
        };

        // Inicializar con el mes más reciente
        const latestMonth = Object.keys(data.presupuestos).sort().pop() || currentMonth;
        elements.mesReporte.value = latestMonth;
        renderList(latestMonth);
        renderChart(latestMonth);

        // Limpiar eventos previos
        if (eventHandlers.has(elements.mesReporte)) {
            elements.mesReporte.removeEventListener('change', eventHandlers.get(elements.mesReporte));
        }

        // Manejar cambio de mes
        const mesReporteHandler = () => {
            const selectedMonth = elements.mesReporte.value;
            renderList(selectedMonth);
            renderChart(selectedMonth);
        };
        eventHandlers.set(elements.mesReporte, mesReporteHandler);
        elements.mesReporte.addEventListener('change', mesReporteHandler);

        // Manejar botones "Ver"
        document.querySelectorAll('[data-month][data-category]').forEach(btn => {
            if (eventHandlers.has(btn)) {
                btn.removeEventListener('click', eventHandlers.get(btn));
            }
            const handler = () => {
                const month = btn.dataset.month;
                const category = btn.dataset.category;
                const { asignado, gastado } = data.presupuestos[month][category];
                const percentage = calculateCategoryPercentage(gastado, asignado);
                showModal({
                    title: `Detalles de ${formatCategory(category)} (${formatMonthName(month)})`,
                    message: `
                        Gastado: ${formatCurrency(gastado, data.moneda)}<br>
                        Asignado: ${formatCurrency(asignado, data.moneda)}<br>
                        Porcentaje: ${formatPercentage(percentage)}<br>
                        Estado: ${percentage > 100 ? 'Excedido' : percentage > 80 ? 'Advertencia' : 'Bajo control'}
                    `,
                    cancelText: 'Cerrar',
                    onConfirm: () => {}
                });
            };
            eventHandlers.set(btn, handler);
            btn.addEventListener('click', handler);
        });
    } catch (error) {
        console.error('Error en renderReports:', error);
        document.getElementById('content').innerHTML = `
            <div role="alert" class="text-red-500 p-4">Error al cargar Reportes</div>
        `;
    }
};
