import { setupNavigation } from './components/navigation.js';
import { renderDashboard } from './pages/dashboard.js';
import { getData, saveData } from './utils/storage.js';
import { initialData } from './config/data.js';

document.addEventListener('DOMContentLoaded', () => {
    try {
        // Inicializar datos si no existen en localStorage
        const data = getData();
        if (!data || Object.keys(data).length === 0) {
            saveData(initialData);
        }

        // Configurar navegación
        setupNavigation();

        // Cargar última página visitada o Dashboard por defecto
        const lastPage = sessionStorage.getItem('lastPage') || 'dashboard';
        const validPages = ['dashboard', 'presupuestos', 'gastos', 'metas', 'reportes', 'configuraciones'];
        const initialPage = validPages.includes(lastPage) ? lastPage : 'dashboard';
        
        const pages = document.querySelectorAll('.page');
        const navButtons = document.querySelectorAll('#navigation button[data-page]');
        pages.forEach(page => page.classList.add('hidden'));
        document.getElementById(initialPage).classList.remove('hidden');
        navButtons.forEach(btn => {
            btn.setAttribute('aria-current', btn.dataset.page === initialPage ? 'true' : 'false');
        });

        // Renderizar página inicial
        const pageRenderers = {
            dashboard: renderDashboard,
            presupuestos: () => import('./pages/budget.js').then(module => module.renderBudget()),
            gastos: () => import('./pages/expenses.js').then(module => module.renderExpenses()),
            metas: () => import('./pages/goals.js').then(module => module.renderGoals()),
            reportes: () => import('./pages/reports.js').then(module => module.renderReports()),
            configuraciones: () => import('./pages/settings.js').then(module => module.renderSettings())
        };
        
        pageRenderers[initialPage]();
        
        // Guardar página actual en sessionStorage al navegar
        navButtons.forEach(button => {
            button.addEventListener('click', () => {
                sessionStorage.setItem('lastPage', button.dataset.page);
            });
        });

    } catch (error) {
        console.error('Error al inicializar la app:', error);
        document.getElementById('content').innerHTML = `
            <div role="alert" class="text-red-500 p-4">Error al cargar la app. Por favor, recarga la página.</div>
        `;
    }
});
