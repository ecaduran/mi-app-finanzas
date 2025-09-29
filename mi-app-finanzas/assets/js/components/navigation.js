import { renderDashboard } from '../pages/dashboard.js';
import { renderBudget } from '../pages/budget.js';
import { renderExpenses } from '../pages/expenses.js';
import { renderGoals } from '../pages/goals.js';
import { renderReports } from '../pages/reports.js';
import { renderSettings } from '../pages/settings.js';

const eventHandlers = new WeakMap();

export const setupNavigation = () => {
    // Mapa de páginas a funciones de renderizado
    const pageRenderMap = {
        dashboard: renderDashboard,
        presupuestos: renderBudget,
        gastos: renderExpenses,
        metas: renderGoals,
        reportes: renderReports,
        configuraciones: renderSettings // Corregido de 'config' a 'configuraciones'
    };

    // Seleccionar páginas y botones
    const pages = document.querySelectorAll('.page');
    const navButtons = document.querySelectorAll('#navigation button[data-page]');

    // Función para mostrar una página y renderizar su contenido
    const showPage = (pageId) => {
        try {
            // Ocultar todas las páginas
            pages.forEach(page => page.classList.add('hidden'));

            // Mostrar la página solicitada
            const targetPage = document.getElementById(pageId);
            if (!targetPage) {
                console.error(`Página no encontrada: ${pageId}`);
                document.getElementById('content').innerHTML = `
                    <div role="alert" class="text-red-500 p-4">Página no encontrada</div>
                `;
                return;
            }
            targetPage.classList.remove('hidden');

            // Resaltar botón activo
            navButtons.forEach(btn => {
                btn.classList.remove('bg-blue-700', 'text-white');
                btn.classList.add('bg-blue-600', 'text-white');
                btn.setAttribute('aria-current', 'false');
                if (btn.dataset.page === pageId) {
                    btn.classList.add('bg-blue-700');
                    btn.classList.remove('bg-blue-600');
                    btn.setAttribute('aria-current', 'true');
                }
            });

            // Renderizar contenido
            const renderFn = pageRenderMap[pageId];
            if (renderFn) {
                renderFn();
            } else {
                console.warn(`No hay función de renderizado para: ${pageId}`);
                targetPage.innerHTML = `
                    <div role="alert" class="text-red-500 p-4">Error al cargar la página: ${pageId}</div>
                `;
            }

            // Actualizar URL (hash)
            window.location.hash = pageId;
        } catch (error) {
            console.error(`Error al mostrar página ${pageId}:`, error);
            document.getElementById('content').innerHTML = `
                <div role="alert" class="text-red-500 p-4">Error al cargar la página</div>
            `;
        }
    };

    // Limpiar eventos previos para evitar duplicados
    navButtons.forEach(btn => {
        if (eventHandlers.has(btn)) {
            btn.removeEventListener('click', eventHandlers.get(btn));
        }
        const handler = () => showPage(btn.dataset.page);
        eventHandlers.set(btn, handler);
        btn.addEventListener('click', handler);
    });

    // Cargar página desde hash al iniciar
    const initialPage = window.location.hash.slice(1) || 'dashboard';
    if (pageRenderMap[initialPage]) {
        showPage(initialPage);
    } else {
        showPage('dashboard'); // Fallback al Dashboard
    }

    // Escuchar cambios en el hash
    const hashChangeHandler = () => {
        const pageId = window.location.hash.slice(1) || 'dashboard';
        if (pageRenderMap[pageId]) {
            showPage(pageId);
        }
    };
    window.addEventListener('hashchange', hashChangeHandler);
};
