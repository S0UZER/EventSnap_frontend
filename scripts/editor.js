
const imageEditor = {
    modal: null,
    canvas: null,
    ctx: null,
    zoomSlider: null,
    cancelBtn: null,
    closeBtn: null,
    applyBtn: null,
    resetBtn: null,
    tabCropBtn: null,
    tabFilterBtn: null,
    cropStep: null,
    filterStep: null,
    filterPreviewCanvas: null,
    filterList: null,
    filterIntensity: null,
    filterIntensityWrap: null,

    _resolve: null,
    _reject: null,
    _originalFile: null,
    _croppedCanvas: null,
    _selectedFilterId: 'original',
    _filterIntensity: 1,

    _img: null,
    _imgX: 0,
    _imgY: 0,
    _imgScale: 1,
    _fitScale: 1,
    _cropBox: null,   
    _dragState: null, 
    _animFrame: null,

    HANDLE: 8,      
    MIN_CROP: 20,  

    init() {
        this.modal = document.getElementById('editorModal');
        this.canvas = document.getElementById('editorImage');
        this.zoomSlider = document.getElementById('editorZoomSlider');
        this.cancelBtn = document.getElementById('editorCancelBtn');
        this.closeBtn = document.getElementById('editorCloseBtn');
        this.applyBtn = document.getElementById('editorApplyBtn');
        this.resetBtn = document.getElementById('editorResetBtn');
        this.tabCropBtn = document.getElementById('editorTabCrop');
        this.tabFilterBtn = document.getElementById('editorTabFilter');
        this.cropStep = document.getElementById('editorCropStep');
        this.filterStep = document.getElementById('editorFilterStep');
        this.filterPreviewCanvas = document.getElementById('editorFilterPreview');
        this.filterList = document.getElementById('editorFilterList');
        this.filterIntensity = document.getElementById('editorFilterIntensity');
        this.filterIntensityWrap = document.getElementById('editorFilterIntensityWrap');

        if (!this.modal) return;

        this.cancelBtn?.addEventListener('click', () => this._cancel());
        this.closeBtn?.addEventListener('click', () => this._cancel());
        this.modal.addEventListener('click', (e) => {
            if (e.target === this.modal) this._cancel();
        });
        document.addEventListener('keydown', (e) => {
            if (!this.modal?.classList.contains('active')) return;
            if (e.key === 'Escape') this._cancel();
        });

        this.applyBtn?.addEventListener('click', () => this._apply());
        this.resetBtn?.addEventListener('click', () => this._reset());

        if (this.zoomSlider) {
            this.zoomSlider.addEventListener('input', () => {
                if (!this._img) return;
                const v = parseFloat(this.zoomSlider.value);
                const newScale = v >= 0
                    ? this._fitScale * (1 + v * 3)
                    : this._fitScale * (1 + v * 0.7);
                const cx = this.canvas.width / 2;
                const cy = this.canvas.height / 2;
                this._setScale(Math.max(this._fitScale * 0.3, newScale), cx, cy);
                this._scheduleDraw();
            });
        }

        this._setupCanvasEvents();

        this.tabCropBtn?.addEventListener('click', () => this._goToCropStep());
        this.tabFilterBtn?.addEventListener('click', () => this._goToFilterStep());

        if (this.filterIntensity) {
            this.filterIntensity.addEventListener('input', () => {
                this._filterIntensity = parseFloat(this.filterIntensity.value);
                this._redrawFilterPreview();
            });
        }
    },

    open(file) {
        return new Promise((resolve, reject) => {
            if (!this.modal) this.init();
            if (!this.modal) {
                reject(new Error('Редактор не инициализирован'));
                return;
            }
            if (!file?.type.startsWith('image/')) {
                reject(new Error('Это не изображение'));
                return;
            }

            this._resolve = resolve;
            this._reject = reject;
            this._originalFile = file;
            this._croppedCanvas = null;
            this._selectedFilterId = 'original';
            this._filterIntensity = 1;
            this._img = null;

            const reader = new FileReader();
            reader.onload = (e) => {
                const img = new Image();
                img.onload = () => {
                    this.modal.classList.add('active');
                    this._goToCropStep();
                    requestAnimationFrame(() => this._setupCropCanvas(img));
                };
                img.onerror = () => reject(new Error('Не удалось загрузить изображение'));
                img.src = e.target.result;
            };
            reader.onerror = () => reject(new Error('Не удалось прочитать файл'));
            reader.readAsDataURL(file);
        });
    },

    _setupCropCanvas(img) {
        this._img = img;
        const container = this.canvas?.parentElement;
        if (!container || !this.canvas) return;

        const rect = container.getBoundingClientRect();
        const cw = Math.round(rect.width) || 600;
        const ch = Math.round(rect.height) || Math.round(cw * 0.65);

        this.canvas.width = cw;
        this.canvas.height = ch;
        this.ctx = this.canvas.getContext('2d');

        const sx = cw / img.naturalWidth;
        const sy = ch / img.naturalHeight;
        this._fitScale = Math.min(sx, sy);
        this._imgScale = this._fitScale;
        this._imgX = (cw - img.naturalWidth * this._imgScale) / 2;
        this._imgY = (ch - img.naturalHeight * this._imgScale) / 2;

        const iw = img.naturalWidth * this._imgScale;
        const ih = img.naturalHeight * this._imgScale;
        this._cropBox = {
            x: this._imgX + iw * 0.1,
            y: this._imgY + ih * 0.1,
            w: iw * 0.8,
            h: ih * 0.8,
        };

        if (this.zoomSlider) this.zoomSlider.value = 0;
        this._draw();
    },

    _setupCanvasEvents() {
        if (!this.canvas) return;

        const getPos = (e) => {
            const r = this.canvas.getBoundingClientRect();
            return {
                x: (e.clientX - r.left) * (this.canvas.width / r.width),
                y: (e.clientY - r.top) * (this.canvas.height / r.height),
            };
        };

        const getTouchPos = (e) => {
            const t = e.touches[0] || e.changedTouches[0];
            const r = this.canvas.getBoundingClientRect();
            return {
                x: (t.clientX - r.left) * (this.canvas.width / r.width),
                y: (t.clientY - r.top) * (this.canvas.height / r.height),
            };
        };

        const startDrag = (x, y) => {
            if (!this._img || !this._cropBox) return;
            const type = this._hitTest(x, y);
            this._dragState = {
                type, startX: x, startY: y,
                startImgX: this._imgX, startImgY: this._imgY,
                startCrop: { ...this._cropBox },
            };
        };

        const moveDrag = (x, y) => {
            if (!this._dragState) return;
            const { type, startX, startY, startImgX, startImgY, startCrop } = this._dragState;
            const dx = x - startX;
            const dy = y - startY;

            if (type === 'image') {
                this._imgX = startImgX + dx;
                this._imgY = startImgY + dy;
            } else if (type === 'box') {
                this._cropBox = {
                    x: Math.max(0, Math.min(startCrop.x + dx, this.canvas.width - startCrop.w)),
                    y: Math.max(0, Math.min(startCrop.y + dy, this.canvas.height - startCrop.h)),
                    w: startCrop.w,
                    h: startCrop.h,
                };
            } else {
                this._resizeCrop(type, dx, dy, startCrop);
            }
            this._scheduleDraw();
        };

        this.canvas.addEventListener('mousedown', (e) => {
            e.preventDefault();
            startDrag(...Object.values(getPos(e)));
        });

        document.addEventListener('mousemove', (e) => {
            const cropVisible = this.cropStep && !this.cropStep.classList.contains('editor-modal__step--hidden');
            if (!cropVisible || !this._img) return;
            const { x, y } = getPos(e);
            if (!this._dragState) {
                this._setCursor(this._hitTest(x, y));
            } else {
                moveDrag(x, y);
            }
        });

        document.addEventListener('mouseup', () => {
            this._dragState = null;
        });

        this.canvas.addEventListener('wheel', (e) => {
            e.preventDefault();
            if (!this._img) return;
            const { x, y } = getPos(e);
            const factor = e.deltaY < 0 ? 1.1 : 0.9;
            this._setScale(
                Math.max(this._fitScale * 0.3, Math.min(this._imgScale * factor, this._fitScale * 5)),
                x, y
            );
            this._scheduleDraw();
        }, { passive: false });

        this.canvas.addEventListener('touchstart', (e) => {
            e.preventDefault();
            startDrag(...Object.values(getTouchPos(e)));
        }, { passive: false });

        this.canvas.addEventListener('touchmove', (e) => {
            e.preventDefault();
            moveDrag(...Object.values(getTouchPos(e)));
        }, { passive: false });

        this.canvas.addEventListener('touchend', () => {
            this._dragState = null;
        });
    },

    _resizeCrop(type, dx, dy, s) {
        const cw = this.canvas.width;
        const ch = this.canvas.height;
        let { x, y, w, h } = s;

        if (type === 'l' || type === 'tl' || type === 'bl') {
            const nx = Math.max(0, Math.min(s.x + dx, s.x + s.w - this.MIN_CROP));
            w = s.w - (nx - s.x);
            x = nx;
        }
        if (type === 'r' || type === 'tr' || type === 'br') {
            w = Math.max(this.MIN_CROP, Math.min(s.w + dx, cw - x));
        }
        if (type === 't' || type === 'tl' || type === 'tr') {
            const ny = Math.max(0, Math.min(s.y + dy, s.y + s.h - this.MIN_CROP));
            h = s.h - (ny - s.y);
            y = ny;
        }
        if (type === 'b' || type === 'bl' || type === 'br') {
            h = Math.max(this.MIN_CROP, Math.min(s.h + dy, ch - y));
        }

        this._cropBox = { x, y, w, h };
    },

    _setScale(newScale, cx, cy) {
        const ratio = newScale / this._imgScale;
        this._imgScale = newScale;
        this._imgX = cx - (cx - this._imgX) * ratio;
        this._imgY = cy - (cy - this._imgY) * ratio;
    },

    _setCursor(type) {
        const map = {
            tl: 'nwse-resize', tr: 'nesw-resize',
            bl: 'nesw-resize', br: 'nwse-resize',
            t: 'ns-resize', b: 'ns-resize',
            l: 'ew-resize', r: 'ew-resize',
            box: 'move', image: 'grab',
        };
        if (this.canvas) this.canvas.style.cursor = map[type] || 'default';
    },

    _getHandles() {
        const { x, y, w, h } = this._cropBox;
        return {
            tl: [x, y], tr: [x + w, y], bl: [x, y + h], br: [x + w, y + h],
            t: [x + w / 2, y], b: [x + w / 2, y + h],
            l: [x, y + h / 2], r: [x + w, y + h / 2],
        };
    },

    _hitTest(mx, my) {
        const hs = this.HANDLE + 4;
        for (const [type, [hx, hy]] of Object.entries(this._getHandles())) {
            if (Math.abs(mx - hx) <= hs && Math.abs(my - hy) <= hs) return type;
        }
        const { x, y, w, h } = this._cropBox;
        if (mx >= x && mx <= x + w && my >= y && my <= y + h) return 'box';
        return 'image';
    },

    _scheduleDraw() {
        if (this._animFrame) return;
        this._animFrame = requestAnimationFrame(() => {
            this._animFrame = null;
            this._draw();
        });
    },

    _draw() {
        if (!this.ctx || !this._img || !this._cropBox) return;
        const { ctx, canvas, _img: img, _imgX: ix, _imgY: iy, _imgScale: is, _cropBox: c } = this;
        const cw = canvas.width;
        const ch = canvas.height;

        ctx.clearRect(0, 0, cw, ch);

        ctx.drawImage(img, ix, iy, img.naturalWidth * is, img.naturalHeight * is);

  
        ctx.fillStyle = 'rgba(0,0,0,0.55)';
        ctx.fillRect(0, 0, cw, c.y);
        ctx.fillRect(0, c.y + c.h, cw, ch - c.y - c.h);
        ctx.fillRect(0, c.y, c.x, c.h);
        ctx.fillRect(c.x + c.w, c.y, cw - c.x - c.w, c.h);


        ctx.strokeStyle = '#fff';
        ctx.lineWidth = 1.5;
        ctx.strokeRect(c.x, c.y, c.w, c.h);

        ctx.strokeStyle = 'rgba(255,255,255,0.35)';
        ctx.lineWidth = 0.5;
        ctx.beginPath();
        for (let i = 1; i < 3; i++) {
            ctx.moveTo(c.x + c.w * i / 3, c.y);
            ctx.lineTo(c.x + c.w * i / 3, c.y + c.h);
            ctx.moveTo(c.x, c.y + c.h * i / 3);
            ctx.lineTo(c.x + c.w, c.y + c.h * i / 3);
        }
        ctx.stroke();

        const hs = this.HANDLE;
        ctx.fillStyle = '#fff';
        Object.values(this._getHandles()).forEach(([hx, hy]) => {
            ctx.fillRect(hx - hs / 2, hy - hs / 2, hs, hs);
        });
    },

    _reset() {
        if (!this._img || !this.canvas) return;
        const cw = this.canvas.width;
        const ch = this.canvas.height;
        this._fitScale = Math.min(cw / this._img.naturalWidth, ch / this._img.naturalHeight);
        this._imgScale = this._fitScale;
        this._imgX = (cw - this._img.naturalWidth * this._imgScale) / 2;
        this._imgY = (ch - this._img.naturalHeight * this._imgScale) / 2;
        const iw = this._img.naturalWidth * this._imgScale;
        const ih = this._img.naturalHeight * this._imgScale;
        this._cropBox = { x: this._imgX + iw * 0.1, y: this._imgY + ih * 0.1, w: iw * 0.8, h: ih * 0.8 };
        if (this.zoomSlider) this.zoomSlider.value = 0;
        this._scheduleDraw();
    },

    _getCroppedCanvas() {
        if (!this._img || !this._cropBox) return null;
        const { _img: img, _imgX, _imgY, _imgScale, _cropBox: c } = this;

        const sx = (c.x - _imgX) / _imgScale;
        const sy = (c.y - _imgY) / _imgScale;
        const sw = c.w / _imgScale;
        const sh = c.h / _imgScale;

        const csx = Math.max(0, sx);
        const csy = Math.max(0, sy);
        const csw = Math.min(sw - (csx - sx), img.naturalWidth - csx);
        const csh = Math.min(sh - (csy - sy), img.naturalHeight - csy);

        if (csw <= 0 || csh <= 0) return null;

        const maxDim = 2048;
        const outW = Math.min(Math.round(csw), maxDim);
        const outH = Math.min(Math.round(csh), maxDim);

        const out = document.createElement('canvas');
        out.width = outW;
        out.height = outH;
        out.getContext('2d').drawImage(img, csx, csy, csw, csh, 0, 0, outW, outH);
        return out;
    },

    _goToCropStep() {
        this.cropStep?.classList.remove('editor-modal__step--hidden');
        this.filterStep?.classList.add('editor-modal__step--hidden');
        this.tabCropBtn?.classList.add('editor-modal__tab--active');
        this.tabFilterBtn?.classList.remove('editor-modal__tab--active');
        if (this.applyBtn) this.applyBtn.textContent = 'Дальше';
    },

    _goToFilterStep() {
        const cropped = this._getCroppedCanvas();
        if (!cropped || cropped.width === 0) {
            alert('Не удалось получить обрезанное изображение. Попробуйте ещё раз.');
            return;
        }
        this._croppedCanvas = cropped;

        this.cropStep?.classList.add('editor-modal__step--hidden');
        this.filterStep?.classList.remove('editor-modal__step--hidden');
        this.tabCropBtn?.classList.remove('editor-modal__tab--active');
        this.tabFilterBtn?.classList.add('editor-modal__tab--active');
        if (this.applyBtn) this.applyBtn.textContent = 'Готово';

        this._renderFilterList();
        this._redrawFilterPreview();
    },

    _renderFilterList() {
        if (!this.filterList || !this._croppedCanvas) return;
        this.filterList.innerHTML = '';
        const previews = buildFilterPreviews(this._croppedCanvas, 96);

        previews.forEach((preview) => {
            const item = document.createElement('button');
            item.type = 'button';
            item.className = 'editor-filter-item';
            if (preview.id === this._selectedFilterId) item.classList.add('editor-filter-item--active');
            item.innerHTML = `
                <div class="editor-filter-item__img"><img src="${preview.dataUrl}" alt="${preview.name}"></div>
                <span class="editor-filter-item__name">${preview.name}</span>
            `;
            item.addEventListener('click', () => {
                this._selectedFilterId = preview.id;
                this._filterIntensity = 1;
                if (this.filterIntensity) this.filterIntensity.value = 1;
                this.filterList.querySelectorAll('.editor-filter-item').forEach((el) => {
                    el.classList.remove('editor-filter-item--active');
                });
                item.classList.add('editor-filter-item--active');
                this.filterIntensityWrap?.classList.toggle('editor-modal__intensity--hidden', preview.id === 'original');
                this._redrawFilterPreview();
            });
            this.filterList.appendChild(item);
        });

        this.filterIntensityWrap?.classList.toggle('editor-modal__intensity--hidden', this._selectedFilterId === 'original');
    },

    _redrawFilterPreview() {
        if (!this.filterPreviewCanvas || !this._croppedCanvas) return;
        const src = this._croppedCanvas;
        const container = this.filterPreviewCanvas.parentElement;
        const maxW = container.clientWidth;
        const maxH = container.clientHeight || 400;
        const scale = Math.min(maxW / src.width, maxH / src.height, 1);

        this.filterPreviewCanvas.width = Math.round(src.width * scale);
        this.filterPreviewCanvas.height = Math.round(src.height * scale);

        const tmp = document.createElement('canvas');
        tmp.width = this.filterPreviewCanvas.width;
        tmp.height = this.filterPreviewCanvas.height;
        tmp.getContext('2d').drawImage(src, 0, 0, tmp.width, tmp.height);

        const ctx = this.filterPreviewCanvas.getContext('2d');
        ctx.clearRect(0, 0, this.filterPreviewCanvas.width, this.filterPreviewCanvas.height);
        ctx.drawImage(applyFilterToCanvas(tmp, this._selectedFilterId, this._filterIntensity), 0, 0);
    },

    _apply() {
        const onCropStep = this.cropStep && !this.cropStep.classList.contains('editor-modal__step--hidden');
        if (onCropStep) {
            this._goToFilterStep();
            return;
        }

        if (!this._croppedCanvas) {
            alert('Нет изображения для сохранения');
            return;
        }

        const finalCanvas = applyFilterToCanvas(this._croppedCanvas, this._selectedFilterId, this._filterIntensity);
        finalCanvas.toBlob((blob) => {
            if (!blob) {
                alert('Не удалось сохранить изображение');
                return;
            }
            const name = (this._originalFile?.name || 'photo.jpg').replace(/\.[^.]+$/, '');
            const file = new File([blob], `${name}.jpg`, { type: 'image/jpeg', lastModified: Date.now() });
            const resolve = this._resolve;
            this._close();
            resolve?.(file);
        }, 'image/jpeg', 0.9);
    },

    _cancel() {
        const reject = this._reject;
        this._close();
        reject?.('cancelled');
    },

    _close() {
        this.modal?.classList.remove('active');
        if (this._animFrame) {
            cancelAnimationFrame(this._animFrame);
            this._animFrame = null;
        }
        if (this.ctx && this.canvas) {
            this.ctx.clearRect(0, 0, this.canvas.width, this.canvas.height);
        }
        if (this.filterList) this.filterList.innerHTML = '';
        this._img = null;
        this._cropBox = null;
        this._dragState = null;
        this._croppedCanvas = null;
        this._resolve = null;
        this._reject = null;
        this._originalFile = null;
        this._selectedFilterId = 'original';
        this._filterIntensity = 1;
    },
};

function openImageEditor(file) {
    return imageEditor.open(file);
}

document.addEventListener('DOMContentLoaded', () => {
    imageEditor.init();
});
