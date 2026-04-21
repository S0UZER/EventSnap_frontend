// ===== Редактор изображений (кроп + зум + фильтры) =====
// Использует Cropper.js + filters.js
//
// API:
//   openImageEditor(file) -> Promise<File>
//     На вход: File
//     На выход: новый File с обрезанным + отфильтрованным изображением (JPEG)
//     Если пользователь отменил — Promise reject с 'cancelled'

const imageEditor = {
    // DOM
    modal: null,
    imageEl: null,
    cropper: null,
    zoomSlider: null,
    cancelBtn: null,
    closeBtn: null,
    applyBtn: null,
    resetBtn: null,
    // Вкладки
    tabCropBtn: null,
    tabFilterBtn: null,
    cropStep: null,
    filterStep: null,
    // Фильтры
    filterPreviewCanvas: null,
    filterList: null,
    filterIntensity: null,
    filterIntensityWrap: null,

    // Состояние
    _resolve: null,
    _reject: null,
    _originalFile: null,
    _croppedCanvas: null,
    _selectedFilterId: 'original',
    _filterIntensity: 1,

    init() {
        this.modal = document.getElementById('editorModal');
        this.imageEl = document.getElementById('editorImage');
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

        if (!this.modal) {
            console.error('imageEditor: модалка #editorModal не найдена');
            return;
        }

        this.cancelBtn?.addEventListener('click', () => this._cancel());
        this.closeBtn?.addEventListener('click', () => this._cancel());
        this.modal.addEventListener('click', (e) => {
            if (e.target === this.modal) this._cancel();
        });
        document.addEventListener('keydown', (e) => {
            if (!this.modal.classList.contains('active')) return;
            if (e.key === 'Escape') this._cancel();
        });

        this.applyBtn?.addEventListener('click', () => this._apply());

        this.resetBtn?.addEventListener('click', () => {
            if (this.cropper) {
                this.cropper.reset();
                if (this.zoomSlider) this.zoomSlider.value = 0;
            }
        });

        if (this.zoomSlider) {
            this.zoomSlider.addEventListener('input', (e) => {
                if (!this.cropper) return;
                const value = parseFloat(e.target.value);
                const zoom = value < 0 ? 1 + value * 0.5 : 1 + value * 2;
                this.cropper.zoomTo(zoom);
            });
        }

        this.tabCropBtn?.addEventListener('click', () => this._goToCropStep());
        this.tabFilterBtn?.addEventListener('click', () => this._goToFilterStep());

        if (this.filterIntensity) {
            this.filterIntensity.addEventListener('input', (e) => {
                this._filterIntensity = parseFloat(e.target.value);
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
            if (!file || !file.type.startsWith('image/')) {
                reject(new Error('Это не изображение'));
                return;
            }

            this._resolve = resolve;
            this._reject = reject;
            this._originalFile = file;
            this._croppedCanvas = null;
            this._selectedFilterId = 'original';
            this._filterIntensity = 1;

            const reader = new FileReader();
            reader.onload = (e) => {
                this.imageEl.src = e.target.result;
                this.modal.classList.add('active');
                this._goToCropStep();

                if (this.cropper) {
                    this.cropper.destroy();
                    this.cropper = null;
                }

                const initCropper = () => {
                    this.cropper = new Cropper(this.imageEl, {
                        viewMode: 1,
                        dragMode: 'crop',
                        autoCrop: true,
                        autoCropArea: 0.8,
                        background: false,
                        responsive: true,
                        movable: true,
                        rotatable: false,
                        scalable: true,
                        zoomable: true,
                        zoomOnWheel: true,
                        wheelZoomRatio: 0.1,
                        toggleDragModeOnDblclick: false,
                        checkOrientation: false,
                        ready: () => {
                            if (this.zoomSlider) this.zoomSlider.value = 0;
                        },
                    });
                };

                if (this.imageEl.complete && this.imageEl.naturalWidth > 0) {
                    requestAnimationFrame(initCropper);
                } else {
                    this.imageEl.onload = () => requestAnimationFrame(initCropper);
                }
            };
            reader.onerror = () => reject(new Error('Не удалось прочитать файл'));
            reader.readAsDataURL(file);
        });
    },

    _goToCropStep() {
        this.cropStep?.classList.remove('editor-modal__step--hidden');
        this.filterStep?.classList.add('editor-modal__step--hidden');
        this.tabCropBtn?.classList.add('editor-modal__tab--active');
        this.tabFilterBtn?.classList.remove('editor-modal__tab--active');
        if (this.applyBtn) this.applyBtn.textContent = 'Дальше';
    },

    _goToFilterStep() {
        if (!this.cropper) return;

        const croppedCanvas = this.cropper.getCroppedCanvas({
            maxWidth: 2048,
            maxHeight: 2048,
            imageSmoothingQuality: 'high',
        });

        if (!croppedCanvas || croppedCanvas.width === 0) {
            alert('Не удалось получить обрезанное изображение. Выделите область заново.');
            return;
        }

        this._croppedCanvas = croppedCanvas;

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
            if (preview.id === this._selectedFilterId) {
                item.classList.add('editor-filter-item--active');
            }
            item.innerHTML = `
                <div class="editor-filter-item__img">
                    <img src="${preview.dataUrl}" alt="${preview.name}">
                </div>
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

                if (this.filterIntensityWrap) {
                    this.filterIntensityWrap.classList.toggle(
                        'editor-modal__intensity--hidden',
                        preview.id === 'original'
                    );
                }

                this._redrawFilterPreview();
            });
            this.filterList.appendChild(item);
        });

        if (this.filterIntensityWrap) {
            this.filterIntensityWrap.classList.toggle(
                'editor-modal__intensity--hidden',
                this._selectedFilterId === 'original'
            );
        }
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

        const previewSource = document.createElement('canvas');
        previewSource.width = this.filterPreviewCanvas.width;
        previewSource.height = this.filterPreviewCanvas.height;
        const previewSourceCtx = previewSource.getContext('2d');
        previewSourceCtx.drawImage(
            src,
            0,
            0,
            this.filterPreviewCanvas.width,
            this.filterPreviewCanvas.height
        );

        const ctx = this.filterPreviewCanvas.getContext('2d');
        ctx.clearRect(0, 0, this.filterPreviewCanvas.width, this.filterPreviewCanvas.height);
        const filteredPreview = applyFilterToCanvas(
            previewSource,
            this._selectedFilterId,
            this._filterIntensity
        );
        ctx.drawImage(filteredPreview, 0, 0);
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

        const finalCanvas = applyFilterToCanvas(
            this._croppedCanvas,
            this._selectedFilterId,
            this._filterIntensity
        );

        finalCanvas.toBlob((blob) => {
            if (!blob) {
                alert('Не удалось сохранить изображение');
                return;
            }

            const origName = this._originalFile?.name || 'photo.jpg';
            const nameWithoutExt = origName.replace(/\.[^.]+$/, '');
            const newFile = new File([blob], `${nameWithoutExt}.jpg`, {
                type: 'image/jpeg',
                lastModified: Date.now(),
            });

            const resolve = this._resolve;
            this._close();
            resolve?.(newFile);
        }, 'image/jpeg', 0.9);
    },

    _cancel() {
        const reject = this._reject;
        this._close();
        reject?.('cancelled');
    },

    _close() {
        this.modal?.classList.remove('active');
        if (this.cropper) {
            this.cropper.destroy();
            this.cropper = null;
        }
        if (this.imageEl) {
            this.imageEl.src = '';
            this.imageEl.onload = null;
        }
        if (this.filterList) this.filterList.innerHTML = '';
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
