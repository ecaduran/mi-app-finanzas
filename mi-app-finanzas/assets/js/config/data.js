// Clave de almacenamiento en localStorage
export const STORAGE_KEY = 'financeAppData';

// Nombre base para archivos de exportación
export const EXPORT_FILE_NAME = 'finance-app-data';

// Umbrales por defecto para alertas (en porcentaje)
export const DEFAULT_ALERTS = {
    expensePercentageWarning: 70,
    goalPercentageWarning: 80
};

// Colores por defecto para la UI (compatibles con Tailwind)
export const DEFAULT_COLORS = {
    green: 'green-500',
    yellow: 'yellow-500',
    red: 'red-500',
    primary: 'blue-500'
};

// Nombres de meses en español
export const MONTH_NAMES = [
    'Enero', 'Febrero', 'Marzo', 'Abril', 'Mayo', 'Junio',
    'Julio', 'Agosto', 'Septiembre', 'Octubre', 'Noviembre', 'Diciembre'
];

// Formato de fecha por defecto
export const DATE_FORMAT = 'YYYY-MM-DD';

// Límite máximo por defecto para montos (por moneda)
export const MAX_AMOUNT_BY_CURRENCY = {
    USD: 1000000,
    EUR: 1000000,
    COP: 4000000000,
    ARS: 1000000000,
    CLP: 1000000000
};

// Categorías por defecto con emojis
export const CATEGORY_EMOJIS = {
    alimentacion: '🍕',
    transporte: '🚍',
    entretenimiento: '🎬',
    servicios: '💡',
    otros: '📦'
};

// Atajos por defecto por categoría (montos sugeridos)
export const DEFAULT_ATAJOS = {
    alimentacion: [50000, 100000, 200000],
    transporte: [10000, 30000, 50000],
    entretenimiento: [50000, 100000, 200000],
    servicios: [100000, 200000, 500000],
    otros: [50000, 100000, 150000]
};

// Número máximo de gastos recientes a mostrar
export const MAX_RECENT_EXPENSES = 5;

// Número máximo de metas permitidas
export const MAX_METAS = 10;

// Configuración de la aplicación
export const appConfig = {
    supportedCurrencies: ['USD', 'EUR', 'COP', 'ARS', 'CLP'],
    categoryEmojis: CATEGORY_EMOJIS,
    alerts: DEFAULT_ALERTS,
    colors: DEFAULT_COLORS
};

// Datos iniciales de la aplicación
export const initialData = {
    moneda: 'USD',
    ingresos: [],
    gastos: [],
    presupuestos: {},
    metas: [],
    atajos: DEFAULT_ATAJOS,
    excedenteAnterior: 0
};