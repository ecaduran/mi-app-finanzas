import { formatCategory, formatCurrency, formatPercentage, formatMonthName } from '../utils/formatters.js';
import { calculateCategoryPercentage } from '../utils/helpers.js';
import { getData } from '../utils/storage.js';
import { appConfig } from '../config/data.js';

// Crear un gráfico de barras para gastos por categoría
export const createBarChart = ({ canvasId, month }) => {
    try {
        const canvas = document.getElementById(canvasId);
        if (!canvas) {
            console.error(`Canvas no encontrado: ${canvasId}`);
            return null;
        }

        const data = getData();
        const categories = data.presupuestos[month] || {};
        const chartData = {
            labels: Object.keys(categories)
                .filter(cat => cat !== 'excedente')
                .map(cat => formatCategory(cat)),
            datasets: [{
                label: 'Gastado',
                data: Object.entries(categories)
                    .filter(([cat]) => cat !== 'excedente')
                    .map(([_, { gastado }]) => gastado),
                backgroundColor: Object.entries(categories)
                    .filter(([cat]) => cat !== 'excedente')
                    .map(([_, { asignado, gastado }]) => {
                        const percentage = calculateCategoryPercentage(gastado, asignado);
                        if (percentage > 100) return appConfig.colors.red;
                        if (percentage > appConfig.alerts.expensePercentageWarning) return appConfig.colors.yellow;
                        return appConfig.colors.green;
                    }),
                borderColor: appConfig.colors.green,
                borderWidth: 1
            }]
        };

        if (!chartData.labels.length) {
            canvas.parentElement.innerHTML = `
                <div role="alert" class="text-gray-500 p-4">No hay datos para mostrar</div>
            `;
            return null;
        }

        canvas.setAttribute('aria-label', `Gráfico de barras de gastos por categoría en ${formatMonthName(month)}`);
        return new Chart(canvas, {
            type: 'bar',
            data: chartData,
            options: {
                responsive: true,
                plugins: {
                    legend: { display: false },
                    title: {
                        display: true,
                        text: `Gastos por Categoría (${formatMonthName(month)})`,
                        font: { size: 16 }
                    }
                },
                scales: {
                    y: {
                        beginAtZero: true,
                        title: { display: true, text: `Monto (${data.moneda})` }
                    },
                    x: { title: { display: true, text: 'Categorías' } }
                }
            }
        });
    } catch (error) {
        console.error('Error en createBarChart:', error);
        const canvas = document.getElementById(canvasId);
        if (canvas) {
            canvas.parentElement.innerHTML = `
                <div role="alert" class="text-red-500 p-4">Error al cargar el gráfico</div>
            `;
        }
        return null;
    }
};

// Crear un gráfico de dona para progreso de metas
export const createDoughnutChart = ({ canvasId }) => {
    try {
        const canvas = document.getElementById(canvasId);
        if (!canvas) {
            console.error(`Canvas no encontrado: ${canvasId}`);
            return null;
        }

        const data = getData();
        const chartData = {
            labels: data.metas.map(meta => meta.nombre),
            datasets: [{
                label: 'Progreso',
                data: data.metas.map(meta => meta.progreso),
                backgroundColor: data.metas.map(meta => {
                    const percentage = meta.total > 0 ? (meta.progreso / meta.total) * 100 : 0;
                    if (percentage >= 100) return appConfig.colors.red;
                    if (percentage >= appConfig.alerts.goalPercentageWarning) return appConfig.colors.yellow;
                    return appConfig.colors.green;
                }),
                borderColor: appConfig.colors.green,
                borderWidth: 1
            }]
        };

        if (!chartData.labels.length) {
            canvas.parentElement.innerHTML = `
                <div role="alert" class="text-gray-500 p-4">No hay metas para mostrar</div>
            `;
            return null;
        }

        canvas.setAttribute('aria-label', 'Gráfico de dona del progreso de metas');
        return new Chart(canvas, {
            type: 'doughnut',
            data: chartData,
            options: {
                responsive: true,
                plugins: {
                    legend: { position: 'right' },
                    title: {
                        display: true,
                        text: 'Progreso de Metas',
                        font: { size: 16 }
                    },
                    tooltip: {
                        callbacks: {
                            label: (context) => {
                                const meta = data.metas[context.dataIndex];
                                return `${meta.nombre}: ${formatCurrency(meta.progreso, data.moneda)} / ${formatCurrency(meta.total, data.moneda)} (${formatPercentage(meta.progreso / meta.total * 100)})`;
                            }
                        }
                    }
                }
            }
        });
    } catch (error) {
        console.error('Error en createDoughnutChart:', error);
        const canvas = document.getElementById(canvasId);
        if (canvas) {
            canvas.parentElement.innerHTML = `
                <div role="alert" class="text-red-500 p-4">Error al cargar el gráfico</div>
            `;
        }
        return null;
    }
};

// Actualizar un gráfico existente
export const updateChart = (chart, newData) => {
    if (!chart) return;
    try {
        chart.data = newData;
        chart.update();
    } catch (error) {
        console.error('Error en updateChart:', error);
    }
};
