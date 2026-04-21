// ===== Фильтры для редактора =====
// Раньше редактор полагался на CanvasRenderingContext2D.filter,
// но в некоторых WebView/IAB он работает нестабильно или игнорируется.
// Поэтому фильтры ниже применяются вручную через ImageData.

const FILTERS = [
    {
        id: 'original',
        name: 'Оригинал',
        operations: () => [],
    },
    {
        id: 'clarendon',
        name: 'Clarendon',
        operations: (k = 1) => [
            ['contrast', 1 + 0.2 * k],
            ['saturate', 1 + 0.35 * k],
            ['brightness', 1 + 0.05 * k],
        ],
    },
    {
        id: 'gingham',
        name: 'Gingham',
        operations: (k = 1) => [
            ['brightness', 1 + 0.05 * k],
            ['sepia', 0.15 * k],
            ['contrast', 1 - 0.1 * k],
        ],
    },
    {
        id: 'moon',
        name: 'Moon',
        operations: (k = 1) => [
            ['grayscale', 1 * k],
            ['contrast', 1 + 0.1 * k],
            ['brightness', 1 + 0.1 * k],
        ],
    },
    {
        id: 'lark',
        name: 'Lark',
        operations: (k = 1) => [
            ['contrast', 1 - 0.1 * k],
            ['brightness', 1 + 0.1 * k],
            ['saturate', 1 + 0.15 * k],
            ['hueRotate', -10 * k],
        ],
    },
    {
        id: 'reyes',
        name: 'Reyes',
        operations: (k = 1) => [
            ['sepia', 0.22 * k],
            ['brightness', 1 + 0.1 * k],
            ['contrast', 1 - 0.15 * k],
            ['saturate', 1 - 0.25 * k],
        ],
    },
    {
        id: 'juno',
        name: 'Juno',
        operations: (k = 1) => [
            ['saturate', 1 + 0.4 * k],
            ['contrast', 1 + 0.1 * k],
            ['hueRotate', -5 * k],
        ],
    },
    {
        id: 'slumber',
        name: 'Slumber',
        operations: (k = 1) => [
            ['saturate', 1 - 0.34 * k],
            ['brightness', 1 + 0.05 * k],
            ['sepia', 0.15 * k],
        ],
    },
    {
        id: 'crema',
        name: 'Crema',
        operations: (k = 1) => [
            ['sepia', 0.3 * k],
            ['contrast', 1 - 0.05 * k],
            ['brightness', 1 + 0.1 * k],
            ['saturate', 1 + 0.1 * k],
        ],
    },
    {
        id: 'ludwig',
        name: 'Ludwig',
        operations: (k = 1) => [
            ['saturate', 1 - 0.25 * k],
            ['contrast', 1 + 0.1 * k],
            ['brightness', 1 + 0.05 * k],
            ['sepia', 0.05 * k],
        ],
    },
    {
        id: 'aden',
        name: 'Aden',
        operations: (k = 1) => [
            ['hueRotate', -20 * k],
            ['contrast', 1 - 0.1 * k],
            ['saturate', 1 - 0.15 * k],
            ['brightness', 1 + 0.2 * k],
        ],
    },
    {
        id: 'perpetua',
        name: 'Perpetua',
        operations: (k = 1) => [
            ['contrast', 1 + 0.1 * k],
            ['saturate', 1 + 0.1 * k],
            ['hueRotate', 8 * k],
        ],
    },
    {
        id: 'amaro',
        name: 'Amaro',
        operations: (k = 1) => [
            ['hueRotate', -10 * k],
            ['contrast', 1 + 0.09 * k],
            ['brightness', 1 + 0.1 * k],
            ['saturate', 1 + 0.5 * k],
        ],
    },
    {
        id: 'mayfair',
        name: 'Mayfair',
        operations: (k = 1) => [
            ['contrast', 1 + 0.1 * k],
            ['saturate', 1 + 0.1 * k],
            ['sepia', 0.15 * k],
        ],
    },
    {
        id: 'valencia',
        name: 'Valencia',
        operations: (k = 1) => [
            ['contrast', 1 + 0.08 * k],
            ['brightness', 1 + 0.08 * k],
            ['sepia', 0.08 * k],
        ],
    },
    {
        id: 'xpro',
        name: 'X-Pro II',
        operations: (k = 1) => [
            ['sepia', 0.45 * k],
            ['contrast', 1 + 0.3 * k],
            ['saturate', 1 + 0.2 * k],
            ['hueRotate', -10 * k],
        ],
    },
];

function getFilterById(id) {
    return FILTERS.find((filter) => filter.id === id) || FILTERS[0];
}

function clampByte(value) {
    return Math.max(0, Math.min(255, value));
}

function applyBrightness(r, g, b, amount) {
    return [r * amount, g * amount, b * amount];
}

function applyContrast(r, g, b, amount) {
    return [
        ((r / 255 - 0.5) * amount + 0.5) * 255,
        ((g / 255 - 0.5) * amount + 0.5) * 255,
        ((b / 255 - 0.5) * amount + 0.5) * 255,
    ];
}

function applySaturate(r, g, b, amount) {
    const luminance = 0.2126 * r + 0.7152 * g + 0.0722 * b;

    return [
        luminance + (r - luminance) * amount,
        luminance + (g - luminance) * amount,
        luminance + (b - luminance) * amount,
    ];
}

function applyGrayscale(r, g, b, amount) {
    const luminance = 0.2126 * r + 0.7152 * g + 0.0722 * b;

    return [
        r + (luminance - r) * amount,
        g + (luminance - g) * amount,
        b + (luminance - b) * amount,
    ];
}

function applySepia(r, g, b, amount) {
    const sepiaR = 0.393 * r + 0.769 * g + 0.189 * b;
    const sepiaG = 0.349 * r + 0.686 * g + 0.168 * b;
    const sepiaB = 0.272 * r + 0.534 * g + 0.131 * b;

    return [
        r + (sepiaR - r) * amount,
        g + (sepiaG - g) * amount,
        b + (sepiaB - b) * amount,
    ];
}

function rgbToHsl(r, g, b) {
    const rr = r / 255;
    const gg = g / 255;
    const bb = b / 255;
    const max = Math.max(rr, gg, bb);
    const min = Math.min(rr, gg, bb);
    let h = 0;
    let s = 0;
    const l = (max + min) / 2;

    if (max !== min) {
        const delta = max - min;
        s = l > 0.5 ? delta / (2 - max - min) : delta / (max + min);

        switch (max) {
            case rr:
                h = (gg - bb) / delta + (gg < bb ? 6 : 0);
                break;
            case gg:
                h = (bb - rr) / delta + 2;
                break;
            default:
                h = (rr - gg) / delta + 4;
                break;
        }

        h /= 6;
    }

    return [h, s, l];
}

function hueToRgb(p, q, t) {
    let value = t;

    if (value < 0) value += 1;
    if (value > 1) value -= 1;
    if (value < 1 / 6) return p + (q - p) * 6 * value;
    if (value < 1 / 2) return q;
    if (value < 2 / 3) return p + (q - p) * (2 / 3 - value) * 6;
    return p;
}

function hslToRgb(h, s, l) {
    if (s === 0) {
        const gray = l * 255;
        return [gray, gray, gray];
    }

    const q = l < 0.5 ? l * (1 + s) : l + s - l * s;
    const p = 2 * l - q;

    return [
        hueToRgb(p, q, h + 1 / 3) * 255,
        hueToRgb(p, q, h) * 255,
        hueToRgb(p, q, h - 1 / 3) * 255,
    ];
}

function applyHueRotate(r, g, b, degrees) {
    const [h, s, l] = rgbToHsl(r, g, b);
    const rotatedHue = ((h + degrees / 360) % 1 + 1) % 1;
    return hslToRgb(rotatedHue, s, l);
}

function applyOperationsToImageData(imageData, operations) {
    const { data } = imageData;

    for (let i = 0; i < data.length; i += 4) {
        let r = data[i];
        let g = data[i + 1];
        let b = data[i + 2];

        operations.forEach(([type, amount]) => {
            if (type === 'brightness') {
                [r, g, b] = applyBrightness(r, g, b, amount);
                return;
            }

            if (type === 'contrast') {
                [r, g, b] = applyContrast(r, g, b, amount);
                return;
            }

            if (type === 'saturate') {
                [r, g, b] = applySaturate(r, g, b, amount);
                return;
            }

            if (type === 'grayscale') {
                [r, g, b] = applyGrayscale(r, g, b, amount);
                return;
            }

            if (type === 'sepia') {
                [r, g, b] = applySepia(r, g, b, amount);
                return;
            }

            if (type === 'hueRotate') {
                [r, g, b] = applyHueRotate(r, g, b, amount);
            }
        });

        data[i] = clampByte(r);
        data[i + 1] = clampByte(g);
        data[i + 2] = clampByte(b);
    }
}

function applyFilterToCanvas(sourceCanvas, filterId, intensity = 1) {
    const filter = getFilterById(filterId);
    const result = document.createElement('canvas');
    result.width = sourceCanvas.width;
    result.height = sourceCanvas.height;

    const ctx = result.getContext('2d', { willReadFrequently: true });
    ctx.drawImage(sourceCanvas, 0, 0);

    const operations = filter.operations(intensity);

    if (operations.length === 0) {
        return result;
    }

    const imageData = ctx.getImageData(0, 0, result.width, result.height);
    applyOperationsToImageData(imageData, operations);
    ctx.putImageData(imageData, 0, 0);

    return result;
}

function buildFilterPreviews(sourceCanvas, previewSize = 96) {
    const scale = Math.min(previewSize / sourceCanvas.width, previewSize / sourceCanvas.height);
    const smallCanvas = document.createElement('canvas');
    smallCanvas.width = Math.max(1, Math.round(sourceCanvas.width * scale));
    smallCanvas.height = Math.max(1, Math.round(sourceCanvas.height * scale));
    smallCanvas.getContext('2d').drawImage(sourceCanvas, 0, 0, smallCanvas.width, smallCanvas.height);

    return FILTERS.map((filter) => {
        const filtered = applyFilterToCanvas(smallCanvas, filter.id, 1);
        return {
            id: filter.id,
            name: filter.name,
            dataUrl: filtered.toDataURL('image/jpeg', 0.7),
        };
    });
}
