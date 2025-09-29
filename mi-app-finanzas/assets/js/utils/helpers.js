import { appConfig } from '../config/data.js';
import { formatCurrency, formatDate, formatCategory } from './formatters.js';
import { getData } from './storage.js';

// Obtener nombre del mes desde una clave YYYY-MM
export const getMonthName = (monthKey) => {
    try {
        if (!monthKey || !/^\d{4}-\d{2}$/.test(monthKey)) {
            return monthKey || 'Mes inválido';
        }
        const [year, month] = monthKey.split('-').map(Number);
        if (month < 1 || month > 12) {
            return monthKey;
        }
        const monthNames = [
            'Enero', 'Febrero', 'Marzo', 'Abril', 'Mayo', 'Junio',
            'Julio', 'Agosto', 'Septiembre', 'Octubre', 'Noviembre', 'Diciembre'
        ];
        return `${monthNames[month - 1]} ${year}`;
    } catch (error) {
        console.error('Error en getMonthName:', error);
        return monthKey || 'Mes inválido';
    }
};

// Validar monto (positivo y no vacío)
export const validateAmount = (amount) => {
    try {
        const num = Number(amount);
        if (isNaN(num)) {
            return { valid: false, error: 'El monto debe ser un número' };
        }
        if (num <= 0) {
            return { valid: false, error: 'El monto debe ser mayor a 0' };
        }
        return { valid: true, error: '' };
    } catch (error) {
        console.error('Error en validateAmount:', error);
        return { valid: false, error: 'Error al validar el monto' };
    }
};

// Validar categoría (debe estar en las categorías definidas)
export const validateCategory = (category) => {
    try {
        if (!category || typeof category !== 'string') {
            return { valid: false, error: 'La categoría es requerida' };
        }
        if (!Object.keys(appConfig.categoryEmojis).includes(category)) {
            return { valid: false, error: 'Categoría no válida' };
        }
        return { valid: true, error: '' };
    } catch (error) {
        console.error('Error en validateCategory:', error);
        return { valid: false, error: 'Error al validar la categoría' };
    }
};

// Generar HTML para botones rápidos
export const generateQuickButtons = (category, atajos, moneda) => {
    try {
        if (!atajos || !atajos[category] || !atajos[category].length) {
            return `<p class="text-gray-500 col-span-2 md:col-span-3">Seleccione una categoría</p>`;
        }
        return atajos[category].map(amount => `
            <button class="btn bg-blue-500 category-${category}" data-monto="${amount}" aria-label="Añadir gasto de ${formatCurrency(amount, moneda)} en ${formatCategory(category)}">
                ${formatCurrency(amount, moneda)}
            </button>
        `).join('');
    } catch (error) {
        console.error('Error en generateQuickButtons:', error);
        return `<p class="text-red-500 col-span-2 md:col-span-3">Error al generar botones rápidos</p>`;
    }
};

// Generar HTML para lista de gastos recientes
export const generateRecentExpenses = (expenses, moneda) => {
    try {
        if (!expenses || !expenses.length) {
            return `<li class="text-gray-500">No hay gastos recientes</li>`;
        }
        return expenses.slice(-5).reverse().map(g => `
            <li class="p-2 flex justify-between items-center">
                <span class="category-${g.categoria}">
                    ${formatCurrency(g.monto, moneda)} - ${formatCategory(g.categoria)}${g.nota ? ` (${g.nota})` : ''} - ${formatDate(g.fecha, 'short')}
                </span>
                <button class="btn bg-red-500 text-xs" data-id="${g.id}" data-action="delete" aria-label="Eliminar gasto de ${formatCurrency(g.monto, moneda)} en ${formatCategory(g.categoria)}">
                    Eliminar
                </button>
            </li>
        `).join('');
    } catch (error) {
        console.error('Error en generateRecentExpenses:', error);
        return `<li class="text-red-500">Error al mostrar gastos recientes</li>`;
    }
};

// Obtener clave del mes siguiente o anterior
export const getAdjacentMonth = (currentMonth, offset) => {
    try {
        if (!currentMonth || !/^\d{4}-\d{2}$/.test(currentMonth)) {
            throw new Error('Formato de mes inválido');
        }
        const [year, month] = currentMonth.split('-').map(Number);
        if (month < 1 || month > 12) {
            throw new Error('Mes inválido');
        }
        const date = new Date(year, month - 1 + offset);
        return `${date.getFullYear()}-${String(date.getMonth() + 1).padStart(2, '0')}`;
    } catch (error) {
        console.error('Error en getAdjacentMonth:', error);
        return currentMonth;
    }
};

// Calcular porcentaje de gasto por categoría
export const calculateCategoryPercentage = (gastado, asignado) => {
    try {
        const g = Number(gastado) || 0;
        const a = Number(asignado) || 0;
        return a > 0 ? ((g / a) * 100).toFixed(0) : 0;
    } catch (error) {
        console.error('Error en calculateCategoryPercentage:', error);
        return 0;
    }
};