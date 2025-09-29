import { appConfig } from '../config/data.js';
import { formatCurrency } from './formatters.js';
import { getData } from './storage.js';

// Validar monto (positivo, no vacío, dentro de límites razonables)
export const validateAmount = (amount, maxAmount = null) => {
    try {
        const num = Number(amount);
        if (isNaN(num)) {
            return { valid: false, error: 'El monto debe ser un número' };
        }
        if (num <= 0) {
            return { valid: false, error: 'El monto debe ser mayor a 0' };
        }
        const currency = getData().moneda || 'USD';
        const defaultMax = { USD: 1000000, EUR: 1000000, COP: 4000000000, ARS: 1000000000, CLP: 1000000000 }[currency] || 1000000;
        const max = maxAmount ?? defaultMax;
        if (num > max) {
            return { valid: false, error: `El monto no puede exceder ${formatCurrency(max, currency)}` };
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
            return { valid: false, error: 'Seleccione una categoría' };
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

// Validar fecha (formato correcto y rango razonable)
export const validateDate = (dateStr, allowFuture = true, allowPast = true) => {
    try {
        if (!dateStr || typeof dateStr !== 'string') {
            return { valid: false, error: 'La fecha es requerida' };
        }
        if (!/^\d{4}-\d{2}-\d{2}$/.test(dateStr)) {
            return { valid: false, error: 'Formato de fecha inválido (use AAAA-MM-DD)' };
        }
        const date = new Date(dateStr);
        if (isNaN(date.getTime())) {
            return { valid: false, error: 'Fecha inválida' };
        }
        const now = new Date();
        const minDate = new Date(2000, 0, 1); // Límite razonable para fechas pasadas
        const maxDate = new Date(now.getFullYear() + 10, now.getMonth(), now.getDate()); // Límite para fechas futuras
        if (!allowFuture && date > now) {
            return { valid: false, error: 'La fecha no puede ser futura' };
        }
        if (!allowPast && date < now) {
            return { valid: false, error: 'La fecha no puede ser pasada' };
        }
        if (date < minDate) {
            return { valid: false, error: 'La fecha es demasiado antigua (mínimo 2000)' };
        }
        if (date > maxDate) {
            return { valid: false, error: 'La fecha es demasiado lejana (máximo 10 años en el futuro)' };
        }
        return { valid: true, error: '' };
    } catch (error) {
        console.error('Error en validateDate:', error);
        return { valid: false, error: 'Error al validar la fecha' };
    }
};

// Validar meta (nombre, monto total, plazo)
export const validateGoal = (name, total, deadline) => {
    try {
        if (!name || typeof name !== 'string' || name.trim().length < 3) {
            return { valid: false, error: 'El nombre de la meta debe tener al menos 3 caracteres' };
        }
        if (name.trim().length > 50) {
            return { valid: false, error: 'El nombre de la meta no puede exceder 50 caracteres' };
        }
        if (!/^[a-zA-Z0-9\s\-_]+$/.test(name.trim())) {
            return { valid: false, error: 'El nombre de la meta solo puede contener letras, números, espacios, guiones o guiones bajos' };
        }
        const amountValidation = validateAmount(total);
        if (!amountValidation.valid) {
            return { valid: false, error: `Monto de la meta: ${amountValidation.error}` };
        }
        const dateValidation = validateDate(deadline, true, false); // Solo fechas futuras
        if (!dateValidation.valid) {
            return { valid: false, error: `Plazo de la meta: ${dateValidation.error}` };
        }
        return { valid: true, error: '' };
    } catch (error) {
        console.error('Error en validateGoal:', error);
        return { valid: false, error: 'Error al validar la meta' };
    }
};

// Validar moneda (debe estar en las monedas soportadas)
export const validateCurrency = (currency) => {
    try {
        if (!currency || typeof currency !== 'string') {
            return { valid: false, error: 'Seleccione una moneda' };
        }
        if (!appConfig.supportedCurrencies.includes(currency)) {
            return { valid: false, error: `Moneda no soportada. Opciones válidas: ${appConfig.supportedCurrencies.join(', ')}` };
        }
        return { valid: true, error: '' };
    } catch (error) {
        console.error('Error en validateCurrency:', error);
        return { valid: false, error: 'Error al validar la moneda' };
    }
};

// Validar presupuesto por categoría (asignado debe ser positivo)
export const validateBudget = (category, assigned) => {
    try {
        const categoryValidation = validateCategory(category);
        if (!categoryValidation.valid) {
            return { valid: false, error: `Categoría: ${categoryValidation.error}` };
        }
        const amountValidation = validateAmount(assigned);
        if (!amountValidation.valid) {
            return { valid: false, error: `Monto asignado: ${amountValidation.error}` };
        }
        return { valid: true, error: '' };
    } catch (error) {
        console.error('Error en validateBudget:', error);
        return { valid: false, error: 'Error al validar el presupuesto' };
    }
};
