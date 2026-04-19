// ===== Фильтры для редактора =====
// Каждый фильтр — это CSS-строка, которую мы применяем к canvas через ctx.filter
// при отрисовке. Интенсивность (0..1) плавно смешивает "оригинал" и "полный фильтр".

const FILTERS = [
    {
        id: 'original',
        name: 'Оригинал',
        css: () => 'none',
    },
    {
        id: 'clarendon',
        name: 'Clarendon',
        css: (k = 1) => `contrast(${1 + 0.2 * k}) saturate(${1 + 0.35 * k}) brightness(${1 + 0.05 * k})`,
    },
    {
        id: 'gingham',
        name: 'Gingham',
        css: (k = 1) => `brightness(${1 + 0.05 * k}) sepia(${0.15 * k}) contrast(${1 - 0.1 * k})`,
    },
    {
        id: 'moon',
        name: 'Moon',
        css: (k = 1) => `grayscale(${1 * k}) contrast(${1 + 0.1 * k}) brightness(${1 + 0.1 * k})`,
    },
    {
        id: 'lark',
        name: 'Lark',
        css: (k = 1) => `contrast(${1 - 0.1 * k}) brightness(${1 + 0.1 * k}) saturate(${1 + 0.15 * k}) hue-rotate(${-10 * k}deg)`,
    },
    {
        id: 'reyes',
        name: 'Reyes',
        css: (k = 1) => `sepia(${0.22 * k}) brightness(${1 + 0.1 * k}) contrast(${1 - 0.15 * k}) saturate(${1 - 0.25 * k})`,
    },
    {
        id: 'juno',
        name: 'Juno',
        css: (k = 1) => `saturate(${1 + 0.4 * k}) contrast(${1 + 0.1 * k}) hue-rotate(${-5 * k}deg)`,
    },
    {
        id: 'slumber',
        name: 'Slumber',
        css: (k = 1) => `saturate(${1 - 0.34 * k}) brightness(${1 + 0.05 * k}) sepia(${0.15 * k})`,
    },
    {
        id: 'crema',
        name: 'Crema',
        css: (k = 1) => `sepia(${0.3 * k}) contrast(${1 - 0.05 * k}) brightness(${1 + 0.1 * k}) saturate(${1 + 0.1 * k})`,
    },
    {
        id: 'ludwig',
        name: 'Ludwig',
        css: (k = 1) => `saturate(${1 - 0.25 * k}) contrast(${1 + 0.1 * k}) brightness(${1 + 0.05 * k}) sepia(${0.05 * k})`,
    },
    {
        id: 'aden',
        name: 'Aden',
        css: (k = 1) => `hue-rotate(${-20 * k}deg) contrast(${1 - 0.1 * k}) saturate(${1 - 0.15 * k}) brightness(${1 + 0.2 * k})`,
    },
    {
        id: 'perpetua',
        name: 'Perpetua',
        css: (k = 1) => `contrast(${1 + 0.1 * k}) saturate(${1 + 0.1 * k}) hue-rotate(${8 * k}deg)`,
    },
    {
        id: 'amaro',
        name: 'Amaro',
        css: (k = 1) => `hue-rotate(${-10 * k}deg) contrast(${1 + 0.09 * k}) brightness(${1 + 0.1 * k}) saturate(${1 + 0.5 * k})`,
    },
    {
        id: 'mayfair',
        name: 'Mayfair',
        css: (k = 1) => `contrast(${1 + 0.1 * k}) saturate(${1 + 0.1 * k}) sepia(${0.15 * k})`,
    },
    {
        id: 'valencia',
        name: 'Valencia',
        css: (k = 1) => `contrast(${1 + 0.08 * k}) brightness(${1 + 0.08 * k}) sepia(${0.08 * k})`,
    },
    {
        id: 'xpro',
        name: 'X-Pro II',
        css: (k = 1) => `sepia(${0.45 * k}) contrast(${1 + 0.3 * k}) saturate(${1 + 0.2 * k}) hue-rotate(${-10 * k}deg)`,
    },
];

// Найти фильтр по id
function getFilterById(id) {
    return FILTERS.find((f) => f.id === id) || FILTERS[0];
}

// Применить фильтр к canvas и вернуть новый canvas
// sourceCanvas — исходный canvas (после кропа)
// filterId — id из FILTERS
// intensity — 0..1
function applyFilterToCanvas(sourceCanvas, filterId, intensity = 1) {
    const filter = getFilterById(filterId);
    const result = document.createElement('canvas');
    result.width = sourceCanvas.width;
    result.height = sourceCanvas.height;

    const ctx = result.getContext('2d');
    ctx.filter = filter.css(intensity);
    ctx.drawImage(sourceCanvas, 0, 0);
    ctx.filter = 'none';

    return result;
}

// Сгенерировать маленькие превью (для полосы фильтров)
// Возвращает массив { id, name, dataUrl }
function buildFilterPreviews(sourceCanvas, previewSize = 96) {
    // Масштабируем исходный canvas до маленького размера — один раз
    const scale = Math.min(previewSize / sourceCanvas.width, previewSize / sourceCanvas.height);
    const smallCanvas = document.createElement('canvas');
    smallCanvas.width = Math.round(sourceCanvas.width * scale);
    smallCanvas.height = Math.round(sourceCanvas.height * scale);
    smallCanvas.getContext('2d').drawImage(sourceCanvas, 0, 0, smallCanvas.width, smallCanvas.height);

    // Для каждого фильтра делаем превью этого маленького canvas
    return FILTERS.map((filter) => {
        const filtered = applyFilterToCanvas(smallCanvas, filter.id, 1);
        return {
            id: filter.id,
            name: filter.name,
            dataUrl: filtered.toDataURL('image/jpeg', 0.7),
        };
    });
}