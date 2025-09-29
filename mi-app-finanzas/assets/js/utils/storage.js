import { initialData, appConfig } from '../config/data.js';
import { showModal } from '../components/modals.js';

// Clave de almacenamiento
const STORAGE_KEY = 'financeAppData';
const EXPORT_FILE_NAME = 'finance-app-data';

// Cache de datos para optimizar accesos
let cachedData = null;

// Obtener datos desde localStorage o devolver initialData
export const getData = () => {
    try {
        if (cachedData) {
            return cachedData;
        }
        const data = localStorage.getItem(STORAGE_KEY);
        if (!data) {
            console.log('No se encontraron datos en localStorage, usando initialData');
            cachedData = { ...initialData };
            return cachedData;
        }
        const parsedData = JSON.parse(data);
        if (validateData(parsedData)) {
            cachedData = parsedData;
            return cachedData;
        }
        console.warn('Datos inválidos en localStorage, usando initialData');
        cachedData = { ...initialData };
        return cachedData;
    } catch (error) {
        console.error('Error al obtener datos de localStorage:', error);
        cachedData = { ...initialData };
        return cachedData;
    }
};

// Guardar datos en localStorage
export const saveData = (data) => {
    try {
        if (!validateData(data)) {
            console.warn('Datos inválidos, no se guardarán');
            return false;
        }
        localStorage.setItem(STORAGE_KEY, JSON.stringify(data));
        cachedData = { ...data }; // Actualizar caché
        return true;
    } catch (error) {
        console.error('Error al guardar datos en localStorage:', error);
        return false;
    }
};

// Validar la estructura de los datos
const validateData = (data) => {
    try {
        if (!data || typeof data !== 'object') {
            return false;
        }
        const requiredKeys = ['ingresos', 'gastos', 'presupuestos', 'metas', 'moneda', 'atajos'];
        const isValid = requiredKeys.every(key => key in data);
        if (!isValid) {
            return false;
        }
        // Validaciones adicionales
        if (!Array.isArray(data.ingresos) || !Array.isArray(data.gastos) || !Array.isArray(data.metas)) {
            return false;
        }
        if (typeof data.presupuestos !== 'object' || data.presupuestos === null) {
            return false;
        }
        if (!appConfig.supportedCurrencies.includes(data.moneda)) {
            return false;
        }
        if (typeof data.atajos !== 'object' || data.atajos === null) {
            return false;
        }
        const validCategories = Object.keys(appConfig.categoryEmojis);
        return Object.keys(data.atajos).every(cat => 
            validCategories.includes(cat) && Array.isArray(data.atajos[cat])
        );
    } catch (error) {
        console.error('Error al validar datos:', error);
        return false;
    }
};

// Restablecer datos a initialData
export const resetData = () => {
    try {
        localStorage.setItem(STORAGE_KEY, JSON.stringify(initialData));
        cachedData = { ...initialData };
        showModal({
            title: 'Datos Restablecidos',
            message: 'Los datos han sido restablecidos a su estado inicial.',
            confirmText: 'Aceptar',
            cancelText: 'Cerrar',
            onConfirm: () => {},
            onCancel: () => {}
        });
        return true;
    } catch (error) {
        console.error('Error al restablecer datos:', error);
        showModal({
            title: 'Error',
            message: 'No se pudieron restablecer los datos. Intenta de nuevo.',
            confirmText: 'Aceptar',
            cancelText: 'Cerrar',
            onConfirm: () => {},
            onCancel: () => {}
        });
        return false;
    }
};

// Exportar datos como JSON
export const exportData = () => {
    try {
        const data = getData();
        const blob = new Blob([JSON.stringify(data, null, 2)], { type: 'application/json' });
        const url = URL.createObjectURL(blob);
        const link = document.createElement('a');
        link.href = url;
        link.download = `${EXPORT_FILE_NAME}_${new Date().toISOString().slice(0, 10)}.json`;
        link.click();
        URL.revokeObjectURL(url);
        showModal({
            title: 'Exportación Exitosa',
            message: 'Los datos han sido exportados correctamente.',
            confirmText: 'Aceptar',
            cancelText: 'Cerrar',
            onConfirm: () => {},
            onCancel: () => {}
        });
        return true;
    } catch (error) {
        console.error('Error al exportar datos:', error);
        showModal({
            title: 'Error',
            message: 'No se pudieron exportar los datos. Intenta de nuevo.',
            confirmText: 'Aceptar',
            cancelText: 'Cerrar',
            onConfirm: () => {},
            onCancel: () => {}
        });
        return false;
    }
};

// Importar datos desde un archivo JSON
export const importData = (file) => {
    return new Promise((resolve, reject) => {
        try {
            if (!file || !file.name.endsWith('.json')) {
                reject(new Error('Por favor, selecciona un archivo JSON'));
                return;
            }
            const reader = new FileReader();
            reader.onload = (event) => {
                try {
                    const data = JSON.parse(event.target.result);
                    if (validateData(data)) {
                        saveData(data);
                        showModal({
                            title: 'Importación Exitosa',
                            message: 'Los datos han sido importados correctamente.',
                            confirmText: 'Aceptar',
                            cancelText: 'Cerrar',
                            onConfirm: () => resolve(true),
                            onCancel: () => resolve(true)
                        });
                    } else {
                        reject(new Error('Formato de datos inválido'));
                    }
                } catch (error) {
                    reject(new Error('Error al parsear el archivo JSON'));
                }
            };
            reader.onerror = () => reject(new Error('Error al leer el archivo'));
            reader.readAsText(file);
        } catch (error) {
            console.error('Error al importar datos:', error);
            reject(error);
        }
    });
};
