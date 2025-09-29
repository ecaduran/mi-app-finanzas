import { appConfig } from '../config/data.js';
import { getData } from './storage.js';

// Lista de nombres de meses para evitar dependencia de appConfig.monthNames
const monthNames = [
    'Enero', 'Febrero', 'Marzo', 'Abril', 'Mayo', 'Junio',
    'Julio', 'Agosto', 'Septiembre', 'Octubre', 'Noviembre', 'Diciembre'
];

// Cache de formatters para mejorar rendimiento
const currencyFormatters = new Map();
const dateFormatters = new Map();

// Formatear moneda según la moneda seleccionada
export const formatCurrency = (amount, currency = null) => {
    try {
        const effectiveCurrency = currency || getData().moneda || 'USD';
        if (!appConfig.supportedCurrencies.includes(effectiveCurrency)) {
            console.warn(`Moneda no soportada: ${effectiveCurrency}. Usando USD.`);
            return formatCurrency(amount, 'USD');
        }
        
        if (!currencyFormatters.has(effectiveCurrency)) {
            currencyFormatters.set(effectiveCurrency, new Intl.NumberFormat('es-CL', {
                style: 'currency',
                currency: effectiveCurrency,
                minimumFractionDigits: 0,
                maximumFractionDigits: 2
            }));
        }
        
        return currencyFormatters.get(effectiveCurrency).format(amount ?? 0);
    } catch (error) {
        console.error('Error en formatCurrency:', error);
        return `${amount ?? 0} ${effectiveCurrency || 'USD'}`;
    }
};

// Formatear fecha según el formato configurado
export const formatDate = (dateStr, format = 'long') => {
    try {
        if (!dateStr || typeof dateStr !== 'string') return 'Sin fecha';
        const date = new Date(dateStr);
        if (isNaN(date.getTime())) return 'Fecha inválida';
        
        const key = `${format}-${'es-CL'}`;
        if (!dateFormatters.has(key)) {
            const options = format === 'short' 
                ? { year: 'numeric', month: '2-digit', day: '2-digit' }
                : { year: 'numeric', month: 'long', day: 'numeric' };
            dateFormatters.set(key, new Intl.DateTimeFormat('es-CL', options));
        }
        
        return format === 'YYYY-MM-DD' 
            ? date.toISOString().slice(0, 10)
            : dateFormatters.get(key).format(date);
    } catch (error) {
        console.error('Error en formatDate:', error);
        return dateStr || 'Sin fecha';
    }
};

// Formatear porcentaje
export const formatPercentage = (value) => {
    try {
        const num = Number(value);
        if (isNaN(num)) return '0%';
        return `${num.toFixed(0)}%`;
    } catch (error) {
        console.error('Error en formatPercentage:', error);
        return '0%';
    }
};

// Formatear nombre de categoría (sin emoji para accesibilidad)
export const formatCategory = (category) => {
    try {
        if (!appConfig.categoryEmojis[category]) {
            console.warn(`Categoría no encontrada: ${category}`);
            return category.charAt(0).toUpperCase() + category.slice(1);
        }
        return category.charAt(0).toUpperCase() + category.slice(1);
    } catch (error) {
        console.error('Error en formatCategory:', error);
        return category || 'Desconocido';
    }
};

// Formatear nombre del mes desde una clave YYYY-MM
export const formatMonthName = (monthKey) => {
    try {
        if (!monthKey || !/^\d{4}-\d{2}$/.test(monthKey)) {
            return monthKey || 'Mes inválido';
        }
        const [year, month] = monthKey.split('-').map(Number);
        if (month < 1 || month > 12) {
            return monthKey;
        }
        return `${monthNames[month - 1]} ${year}`;
    } catch (error) {
        console.error('Error en formatMonthName:', error);
        return monthKey || 'Mes inválido';
    }
};
