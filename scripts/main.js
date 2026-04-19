const sidebar = document.getElementById('sidebar');
const toggleBtn = document.getElementById('sidebarToggle');
const addBtn = document.querySelector('.sidebar__btn--add');
const createBtn = document.querySelector('.sidebar__btn--create');

const openCreateModal = document.getElementById('openCreateModal');
const createModal = document.getElementById('createModal');
const closeCreateModal = document.getElementById('closeCreateModal');
const createForm = createModal?.querySelector('.create-modal__form');
const createCoverInput = document.getElementById('createCoverInput');
const selectCreateCoverBtn = document.getElementById('selectCreateCoverBtn');
const createCoverPreviewWrap = document.getElementById('createCoverPreviewWrap');
const createCoverPreview = document.getElementById('createCoverPreview');
const createCoverFileName = document.getElementById('createCoverFileName');

const addPhotoModal = document.getElementById('addPhotoModal');
const joinModal = document.getElementById('joinModal');
const openJoinModal = document.getElementById('openJoinModal');
const closeJoinModal = document.getElementById('closeJoinModal');
const joinEventForm = document.getElementById('joinEventForm');
const joinEventCode = document.getElementById('joinEventCode');
const joinEventName = document.getElementById('joinEventName');
const closeAddPhotoModal = document.getElementById('closeAddPhotoModal');
const addPhotoForm = document.getElementById('addPhotoForm');
const addPhotoInput = document.getElementById('addPhotoInput');
const selectPhotoBtn = document.getElementById('selectPhotoBtn');
const photoPreviewWrap = document.getElementById('photoPreviewWrap');
const photoPreview = document.getElementById('photoPreview');
const selectedPhotoName = document.getElementById('selectedPhotoName');
const savePhotoBtn = document.getElementById('savePhotoBtn');
const addPhotoHint = document.getElementById('addPhotoHint');

const eventsGrid = document.getElementById('eventsGrid');
const eventsEmpty = document.getElementById('eventsEmpty');
const viewList = document.getElementById('viewList');
const viewEvent = document.getElementById('viewEvent');
const viewUserEvent = document.getElementById('viewUserEvent');
const backToList = document.getElementById('backToList');
const backToAdminView = document.getElementById('backToAdminView');

const eventTitle = document.getElementById('eventTitle');
const eventCoverImage = document.getElementById('eventCoverImage');
const eventDateBadge = document.getElementById('eventDateBadge');
const eventPlaceBadge = document.getElementById('eventPlaceBadge');
const eventDescription = document.getElementById('eventDescription');
const eventQrImage = document.getElementById('eventQrImage');
const eventQrValue = document.getElementById('eventQrValue');
const participantsList = document.getElementById('participantsList');
const participantsCount = document.getElementById('participantsCount');
const galleryCount = document.getElementById('galleryCount');
const adminAddPhotoBtn = document.getElementById('adminAddPhotoBtn');
const photosGrid = document.getElementById('photosGrid');
const galleryEmpty = document.getElementById('galleryEmpty');
const moderationPanel = document.getElementById('moderationPanel');
const moderationList = document.getElementById('moderationList');
const moderationCount = document.getElementById('moderationCount');
const moderationEmpty = document.getElementById('moderationEmpty');
const moderationToggle = document.getElementById('moderationToggle');
const moderationStatusText = document.getElementById('moderationStatusText');
const deleteEventBtn = document.getElementById('deleteEventBtn');
const openParticipantViewBtn = document.getElementById('openParticipantViewBtn');

const userEventTitle = document.getElementById('userEventTitle');
const userEventCoverImage = document.getElementById('userEventCoverImage');
const userEventDateBadge = document.getElementById('userEventDateBadge');
const userEventPlaceBadge = document.getElementById('userEventPlaceBadge');
const userEventDescription = document.getElementById('userEventDescription');
const userAddPhotoBtn = document.getElementById('userAddPhotoBtn');
const userPhotosGrid = document.getElementById('userPhotosGrid');
const userGalleryCount = document.getElementById('userGalleryCount');
const userGalleryEmpty = document.getElementById('userGalleryEmpty');

const openModalBtn = document.getElementById('openModal');
const modal = document.getElementById('modal');
const closeModalBtn = document.getElementById('closeModal');

const defaultCover = './img/main_page/empty-events.png';
const organizerName = 'Вы';
const participantName = 'Участник';

const participantPool = [
    { name: 'Алина Сергеева', role: 'Организатор' },
    { name: 'Максим Громов', role: 'Гость по QR' },
    { name: 'Ева Латыпова', role: 'Участник' },
    { name: 'Илья Волков', role: 'Фотограф' },
];

const events = storage.loadEvents();
let currentEventId = null;
let selectedPhotoFiles = [];
let selectedCreateCoverFile = null;
let nextEventId = storage.loadNextId();
let uploadContext = 'organizer';
let photosSortOrder = 'newest';

function getInitials(name) {
    return name
        .split(' ')
        .filter(Boolean)
        .slice(0, 2)
        .map((part) => part[0]?.toUpperCase() ?? '')
        .join('');
}

function formatEventDate(value) {
    if (!value) {
        return 'Дата не указана';
    }

    const date = new Date(value);

    if (Number.isNaN(date.getTime())) {
        return value;
    }

    return date.toLocaleDateString('ru-RU', {
        day: 'numeric',
        month: 'long',
        year: 'numeric',
    });
}

function fileToBase64(file) {
    return new Promise((resolve, reject) => {
        const reader = new FileReader();
        reader.onload = () => resolve(reader.result);
        reader.onerror = () => reject(new Error('Не удалось прочитать файл'));
        reader.readAsDataURL(file);
    });
}

function base64ToFile(base64, filename = 'photo.jpg') {
    // Разбираем data URL: "data:image/jpeg;base64,...."
    const [header, data] = base64.split(',');
    const mimeMatch = header.match(/:(.*?);/);
    const mime = mimeMatch ? mimeMatch[1] : 'image/jpeg';

    // Декодируем base64 в байты
    const byteString = atob(data);
    const bytes = new Uint8Array(byteString.length);
    for (let i = 0; i < byteString.length; i += 1) {
        bytes[i] = byteString.charCodeAt(i);
    }

    return new File([bytes], filename, { type: mime });
}

function hashString(value) {
    let hash = 0;

    for (let index = 0; index < value.length; index += 1) {
        hash = (hash << 5) - hash + value.charCodeAt(index);
        hash |= 0;
    }

    return Math.abs(hash);
}

function buildQrSvg(seed) {
    const size = 21;
    const cell = 8;
    const margin = 12;
    const svgSize = size * cell + margin * 2;
    let rects = '';

    const isFinderCell = (x, y, startX, startY) => {
        const relX = x - startX;
        const relY = y - startY;
        const inSquare = relX >= 0 && relX < 7 && relY >= 0 && relY < 7;

        if (!inSquare) {
            return false;
        }

        const isBorder = relX === 0 || relX === 6 || relY === 0 || relY === 6;
        const isCenter = relX >= 2 && relX <= 4 && relY >= 2 && relY <= 4;
        return isBorder || isCenter;
    };

    for (let y = 0; y < size; y += 1) {
        for (let x = 0; x < size; x += 1) {
            const inFinder =
                isFinderCell(x, y, 0, 0) ||
                isFinderCell(x, y, size - 7, 0) ||
                isFinderCell(x, y, 0, size - 7);
            const hash = hashString(`${seed}-${x}-${y}`);
            const shouldFill = inFinder || hash % 3 === 0 || (x + y + hash) % 7 === 0;

            if (!shouldFill) {
                continue;
            }

            rects += `<rect x="${margin + x * cell}" y="${margin + y * cell}" width="${cell}" height="${cell}" rx="1.5" fill="#111827"/>`;
        }
    }

    const svg = `
        <svg xmlns="http://www.w3.org/2000/svg" width="${svgSize}" height="${svgSize}" viewBox="0 0 ${svgSize} ${svgSize}" fill="none">
            <rect width="${svgSize}" height="${svgSize}" rx="28" fill="white"/>
            ${rects}
        </svg>
    `;

    return `data:image/svg+xml;charset=UTF-8,${encodeURIComponent(svg)}`;
}

function isEventViewOpen() {
    return viewEvent && !viewEvent.classList.contains('view--hidden');
}

function isUserEventViewOpen() {
    return viewUserEvent && !viewUserEvent.classList.contains('view--hidden');
}

function getCurrentEvent() {
    return events.find((event) => event.id === currentEventId) ?? null;
}

function setSidebarButtonLabels() {
    if (createBtn) {
        createBtn.querySelector('img')?.setAttribute('alt', 'Создать событие');
        const createLabel = createBtn.querySelector('.sidebar__label');

        if (createLabel) {
            createLabel.textContent = 'Создать событие';
        }
    }

    if (addBtn) {
        addBtn.querySelector('img')?.setAttribute('alt', 'Присоединиться');
        const addLabel = addBtn.querySelector('.sidebar__label');

        if (addLabel) {
            addLabel.textContent = 'Присоединиться';
        }
    }

    if (savePhotoBtn) {
        savePhotoBtn.textContent = 'Добавить фотографии';
    }
}

function persistEvents() {
    storage.saveEvents(events);
    storage.saveNextId(nextEventId);
}

function renderEvents() {
    eventsGrid.innerHTML = '';
    eventsEmpty?.classList.toggle('events-empty--hidden', events.length > 0);

    events.forEach((event) => {
        const card = document.createElement('article');
        card.className = 'event-card';
        card.innerHTML = `
            <div class="event-card__img">
                <img src="${event.cover || defaultCover}" alt="${event.name}">
            </div>
            <span class="event-card__name">${event.name}</span>
            <div class="event-card__meta">
                <span class="event-card__badge">${formatEventDate(event.date)}</span>
                <span class="event-card__badge">${event.place || 'Без адреса'}</span>
            </div>
        `;

        card.addEventListener('click', () => {
            if (event.accessRole === 'participant') {
                openUserEvent(event.id);
                return;
            }

            openEvent(event.id);
        });
        eventsGrid.appendChild(card);
    });
}

function resetCreateModal() {
    selectedCreateCoverFile = null;
    createForm?.reset();
    createCoverInput.value = '';
    createCoverPreview.src = '';
    createCoverPreviewWrap.classList.add('create-cover__preview--hidden');
    createCoverFileName.textContent = '';
    createCoverFileName.classList.add('create-cover__file--hidden');
}

async function handleCreateCoverSelection(file) {
    if (!file || !file.type.match(/image\/(jpeg|png)/)) {
        return;
    }

    try {
        // Открываем редактор перед сохранением
        const editedFile = await openImageEditor(file);

        selectedCreateCoverFile = editedFile;
        createCoverPreview.src = URL.createObjectURL(editedFile);
        createCoverPreviewWrap.classList.remove('create-cover__preview--hidden');
        createCoverFileName.textContent = editedFile.name;
        createCoverFileName.classList.remove('create-cover__file--hidden');
    } catch (err) {
        if (err !== 'cancelled') {
            console.error('Ошибка редактирования:', err);
            alert('Не удалось обработать изображение');
        }
        // Если отменили — сбрасываем input, чтобы можно было выбрать тот же файл заново
        createCoverInput.value = '';
    }
}

function resetAddPhotoModal() {
    selectedPhotoFiles = [];
    addPhotoForm?.reset();
    addPhotoInput.value = '';
    photoPreview.src = '';
    photoPreviewWrap.classList.add('upload-modal__preview--hidden');
    selectedPhotoName.textContent = '';
    selectedPhotoName.classList.add('upload-modal__file--hidden');
}

function updateAddPhotoModalState() {
    const hasOpenEvent = (isEventViewOpen() || isUserEventViewOpen()) && Boolean(getCurrentEvent());
    addPhotoHint.textContent = hasOpenEvent
        ? (uploadContext === 'participant'
            ? 'Выберите изображение, чтобы добавить его в галерею как участник'
            : 'Выберите изображение, чтобы добавить его в текущее мероприятие')
        : 'Сначала откройте мероприятие, а потом загрузите в него фотографию';
    addPhotoHint.classList.toggle('upload-modal__hint--warning', !hasOpenEvent);
    selectPhotoBtn.disabled = !hasOpenEvent;
    savePhotoBtn.disabled = !hasOpenEvent || selectedPhotoFiles.length === 0;
}

function openAddPhotoModal(context = 'organizer') {
    uploadContext = context;
    resetAddPhotoModal();
    updateAddPhotoModalState();
    addPhotoModal.classList.add('active');
}

function closeUploadModal() {
    addPhotoModal.classList.remove('active');
    resetAddPhotoModal();
}

async function handleSelectedPhotos(files) {
    const validFiles = Array.from(files ?? []).filter((file) => file.type.match(/image\/(jpeg|png)/));

    if (validFiles.length === 0) {
        return;
    }

    // Прогоняем каждое фото через редактор по очереди
    const editedFiles = [];
    for (const file of validFiles) {
        try {
            const edited = await openImageEditor(file);
            editedFiles.push(edited);
        } catch (err) {
            if (err === 'cancelled') {
                // Пользователь отменил это конкретное фото — просто пропускаем
                continue;
            }
            console.error('Ошибка редактирования:', err);
            alert('Не удалось обработать одно из изображений');
        }
    }

    if (editedFiles.length === 0) {
        // Все отменили — чистим input
        addPhotoInput.value = '';
        return;
    }

    selectedPhotoFiles = editedFiles;
    photoPreview.src = URL.createObjectURL(editedFiles[0]);
    photoPreviewWrap.classList.remove('upload-modal__preview--hidden');
    selectedPhotoName.textContent = editedFiles.length === 1
        ? editedFiles[0].name
        : `${editedFiles.length} файлов выбрано. Первый: ${editedFiles[0].name}`;
    selectedPhotoName.classList.remove('upload-modal__file--hidden');
    updateAddPhotoModalState();
}

function createDemoParticipants() {
    return participantPool.slice(0, 3).map((participant) => ({ ...participant }));
}

function createEventFromForm(inputs) {
    const name = inputs[0].value.trim() || 'Без названия';
    const description = inputs[1].value.trim();
    const place = inputs[2].value.trim();
    const date = inputs[3].value;

    return {
        id: nextEventId++,
        name,
        description,
        place,
        date,
        cover: defaultCover,
        accessRole: 'organizer',
        moderationEnabled: false,
        qrValue: `eventsnap://event/${Date.now()}-${Math.random().toString(36).slice(2, 8)}`,
        participants: createDemoParticipants(),
        photos: [],
        pendingPhotos: [],
        lastModerationComment: '',
    };
}

function createJoinedEvent(code, customName) {
    const suffix = code.trim() || `event-${Date.now()}`;
    const fallbackName = customName.trim() || 'Добавленное мероприятие';

    return {
        id: nextEventId++,
        name: fallbackName,
        description: 'Мероприятие добавлено в ваш список по коду или ссылке. Здесь вы можете смотреть галерею и загружать свои фотографии.',
        place: 'Онлайн по QR / ссылке',
        date: '',
        cover: defaultCover,
        accessRole: 'participant',
        moderationEnabled: false,
        qrValue: `eventsnap://joined/${suffix.replace(/\s+/g, '-').toLowerCase()}`,
        participants: [
            { name: 'Организатор события', role: 'Организатор' },
            { name: participantName, role: 'Участник' },
        ],
        photos: [],
        pendingPhotos: [],
        lastModerationComment: '',
    };
}

function createParticipantMarkup(participant) {
    return `
        <article class="participant-card">
            <div class="participant-card__avatar">${getInitials(participant.name)}</div>
            <div>
                <p class="participant-card__name">${participant.name}</p>
                <p class="participant-card__role">${participant.role}</p>
            </div>
        </article>
    `;
}

async function editExistingPhoto(photo) {
    try {
        // Превращаем base64 обратно в File
        const file = base64ToFile(photo.src, photo.name || 'photo.jpg');

        // Открываем редактор
        const editedFile = await openImageEditor(file);

        // Новый base64 из отредактированного файла
        const newBase64 = await fileToBase64(editedFile);

        // Перезаписываем src у фото в массиве (id сохраняем)
        const currentEvent = getCurrentEvent();
        if (!currentEvent) return;

        const target = currentEvent.photos.find((p) => p.id === photo.id);
        if (target) {
            target.src = newBase64;
            target.name = editedFile.name;
        }

        persistEvents();
        renderCurrentEvent();
        renderUserEvent();
        renderEvents();
    } catch (err) {
        if (err !== 'cancelled') {
            console.error('Ошибка редактирования существующего фото:', err);
            alert('Не удалось отредактировать фото');
        }
    }
}

function createPhotoCard(photo) {
    const item = document.createElement('article');
    item.className = 'photo-item';
    item.innerHTML = `
        <img src="${photo.src}" alt="${photo.name}">
        <div class="photo-item__actions">
            <button class="photo-item__edit" type="button">Редактировать</button>
            <button class="photo-item__delete" type="button">Удалить</button>
        </div>
        <div class="photo-item__footer">
            <span class="photo-item__name">${photo.name}</span>
            <span class="photo-item__status">Одобрено</span>
        </div>
    `;

    // Клик по "Редактировать"
    const editButton = item.querySelector('.photo-item__edit');
    if (editButton) {
        editButton.addEventListener('click', (e) => {
            e.stopPropagation();
            editExistingPhoto(photo);
        });
    }

    // Клик по "Удалить"
    const deleteButton = item.querySelector('.photo-item__delete');
    if (deleteButton) {
        deleteButton.addEventListener('click', (e) => {
            e.stopPropagation();

            const currentEvent = getCurrentEvent();
            if (!currentEvent) return;

            if (!confirm('Удалить это фото?')) return;

            currentEvent.photos = currentEvent.photos.filter((eventPhoto) => eventPhoto.id !== photo.id);
            persistEvents();
            renderCurrentEvent();
            renderEvents();
        });
    }

    // Клик по картинке — открыть lightbox
    const img = item.querySelector('img');
    if (img) {
        img.addEventListener('click', () => {
            const currentEvent = getCurrentEvent();
            if (!currentEvent) return;
            const index = currentEvent.photos.findIndex((p) => p.id === photo.id);
            openLightbox(currentEvent.photos, index);
        });
    }

    return item;
}

function createUserPhotoCard(photo) {
    const item = document.createElement('article');
    item.className = 'photo-item';

    // Кнопки показываем только для своих фото
    const actionsMarkup = photo.ownerType === 'participant'
        ? `<div class="photo-item__actions">
               <button class="photo-item__edit" type="button">Редактировать</button>
               <button class="photo-item__delete" type="button">Удалить</button>
           </div>`
        : '';

    item.innerHTML = `
        <img src="${photo.src}" alt="${photo.name}">
        ${actionsMarkup}
        <div class="photo-item__footer">
            <span class="photo-item__name">${photo.name}</span>
            <span class="photo-item__status">${photo.ownerType === 'participant' ? 'Ваше фото' : 'Организатор'}</span>
        </div>
    `;

    // Редактировать — только для своих
    const editButton = item.querySelector('.photo-item__edit');
    if (editButton) {
        editButton.addEventListener('click', (e) => {
            e.stopPropagation();
            editExistingPhoto(photo);
        });
    }

    // Удалить — только для своих
    const deleteButton = item.querySelector('.photo-item__delete');
    if (deleteButton) {
        deleteButton.addEventListener('click', (e) => {
            e.stopPropagation();
            const currentEvent = getCurrentEvent();
            if (!currentEvent) return;

            currentEvent.photos = currentEvent.photos.filter((eventPhoto) => eventPhoto.id !== photo.id);
            persistEvents();
            renderCurrentEvent();
            renderUserEvent();
        });
    }

    // Клик по картинке — lightbox
    const img = item.querySelector('img');
    if (img) {
        img.addEventListener('click', () => {
            const currentEvent = getCurrentEvent();
            if (!currentEvent) return;
            const index = currentEvent.photos.findIndex((p) => p.id === photo.id);
            openLightbox(currentEvent.photos, index);
        });
    }

    return item;
}

function renderParticipants(event) {
    participantsCount.textContent = String(event.participants.length);
    participantsList.innerHTML = event.participants.map(createParticipantMarkup).join('');
}

function renderGallery(event) {
    photosGrid.innerHTML = '';
    galleryCount.textContent = String(event.photos.length);
    galleryEmpty.classList.toggle('event-empty-state--hidden', event.photos.length > 0);

    const sorted = [...event.photos].sort((a, b) =>
        photosSortOrder === 'newest' ? b.id - a.id : a.id - b.id
    );

    sorted.forEach((photo) => {
        photosGrid.appendChild(createPhotoCard(photo));
    });
}

function renderUserGallery(event) {
    userPhotosGrid.innerHTML = '';
    userGalleryCount.textContent = String(event.photos.length);
    userGalleryEmpty.classList.toggle('event-empty-state--hidden', event.photos.length > 0);

    event.photos.forEach((photo) => {
        userPhotosGrid.appendChild(createUserPhotoCard(photo));
    });
}

function setModerationUI(event) {
    moderationToggle.classList.toggle('moderation-toggle--active', event.moderationEnabled);
    moderationToggle.setAttribute('aria-pressed', String(event.moderationEnabled));
    moderationStatusText.textContent = event.moderationEnabled
        ? 'Новые фото попадают в очередь и ждут одобрения организатора'
        : 'Все новые фото сразу попадают в галерею';
    moderationPanel.style.display = event.moderationEnabled ? 'block' : 'none';
}

function renderModerationQueue(event) {
    moderationList.innerHTML = '';
    moderationCount.textContent = String(event.pendingPhotos.length);
    moderationEmpty.classList.toggle('event-empty-state--hidden', event.pendingPhotos.length > 0);
    setModerationUI(event);

    if (!event.moderationEnabled) {
        return;
    }

    event.pendingPhotos.forEach((photo) => {
        const card = document.createElement('article');
        card.className = 'moderation-card';
        card.innerHTML = `
            <div class="moderation-card__preview">
                <img src="${photo.src}" alt="${photo.name}">
            </div>
            <div class="moderation-card__content">
                <div>
                    <h3 class="moderation-card__title">${photo.name}</h3>
                    <p class="moderation-card__meta">Загрузил: ${photo.author}. Ожидает публикации в галерее.</p>
                </div>
                <textarea class="moderation-card__comment" placeholder="Комментарий для отклонения или заметка для участника"></textarea>
                <div class="moderation-card__actions">
                    <button class="moderation-card__button moderation-card__button--approve" type="button">Одобрить</button>
                    <button class="moderation-card__button moderation-card__button--reject" type="button">Отклонить</button>
                </div>
            </div>
        `;

        const approveButton = card.querySelector('.moderation-card__button--approve');
        const rejectButton = card.querySelector('.moderation-card__button--reject');
        const commentField = card.querySelector('.moderation-card__comment');

        approveButton.addEventListener('click', () => {
            const currentEvent = getCurrentEvent();

            if (!currentEvent) {
                return;
            }

            currentEvent.pendingPhotos = currentEvent.pendingPhotos.filter((item) => item.id !== photo.id);
            currentEvent.photos.unshift({
                id: photo.id,
                src: photo.src,
                name: photo.name,
                author: photo.author,
                ownerType: photo.ownerType,
            });

            if (!currentEvent.cover || currentEvent.cover === defaultCover) {
                currentEvent.cover = photo.src;
            }

            persistEvents();
            renderCurrentEvent();
            renderUserEvent();
            renderEvents();
        });

        rejectButton.addEventListener('click', () => {
            const currentEvent = getCurrentEvent();

            if (!currentEvent) {
                return;
            }

            const comment = commentField.value.trim();
            currentEvent.pendingPhotos = currentEvent.pendingPhotos.filter((item) => item.id !== photo.id);

            if (comment) {
                currentEvent.lastModerationComment = comment;
            }

            persistEvents();
            renderCurrentEvent();
        });

        moderationList.appendChild(card);
    });
}

function renderCurrentEvent() {
    const event = getCurrentEvent();

    if (!event) {
        return;
    }

    eventTitle.textContent = event.name;
    eventCoverImage.src = event.cover || defaultCover;
    eventDateBadge.textContent = formatEventDate(event.date);
    eventPlaceBadge.textContent = event.place || 'Место не указано';
    eventDescription.textContent = event.description || 'Описание мероприятия пока не заполнено.';

    renderGallery(event);
}

function renderUserEvent() {
    const event = getCurrentEvent();

    if (!event) {
        return;
    }

    userEventTitle.textContent = event.name;
    userEventCoverImage.src = event.cover || defaultCover;
    userEventDateBadge.textContent = formatEventDate(event.date);
    userEventPlaceBadge.textContent = event.place || 'Место не указано';
    userEventDescription.textContent = event.description || 'Описание мероприятия пока не заполнено.';
    renderUserGallery(event);
}

function openEvent(eventId) {
    currentEventId = eventId;
    renderCurrentEvent();
    viewList.classList.add('view--hidden');
    viewUserEvent.classList.add('view--hidden');
    viewEvent.classList.remove('view--hidden');
}

function openUserEvent(eventId) {
    currentEventId = eventId;
    renderUserEvent();
    viewList.classList.add('view--hidden');
    viewEvent.classList.add('view--hidden');
    viewUserEvent.classList.remove('view--hidden');
}

function deleteCurrentEvent() {
    const index = events.findIndex((event) => event.id === currentEventId);

    if (index === -1) {
        return;
    }

    events.splice(index, 1);
    persistEvents();
    currentEventId = null;
    viewEvent.classList.add('view--hidden');
    viewUserEvent.classList.add('view--hidden');
    viewList.classList.remove('view--hidden');
    renderEvents();
}

if (toggleBtn) {
    toggleBtn.addEventListener('click', () => {
        sidebar.classList.toggle('sidebar--expanded');
    });
}

if (openCreateModal) {
    openCreateModal.addEventListener('click', () => {
        resetCreateModal();
        createModal.classList.add('active');
    });
}

if (closeCreateModal) {
    closeCreateModal.addEventListener('click', () => {
        createModal.classList.remove('active');
        resetCreateModal();
    });
}

if (createModal) {
    createModal.addEventListener('click', (event) => {
        if (event.target === createModal) {
            createModal.classList.remove('active');
            resetCreateModal();
        }
    });
}

if (openJoinModal) {
    openJoinModal.addEventListener('click', () => {
        joinModal.classList.add('active');
    });
}

if (closeJoinModal) {
    closeJoinModal.addEventListener('click', () => {
        joinModal.classList.remove('active');
        joinEventForm?.reset();
    });
}

if (joinModal) {
    joinModal.addEventListener('click', (event) => {
        if (event.target === joinModal) {
            joinModal.classList.remove('active');
            joinEventForm?.reset();
        }
    });
}

if (joinEventForm) {
    joinEventForm.addEventListener('submit', (event) => {
        event.preventDefault();

        const joinedEvent = createJoinedEvent(joinEventCode.value, joinEventName.value);
        events.push(joinedEvent);
        persistEvents();
        renderEvents();
        joinEventForm.reset();
        joinModal.classList.remove('active');
        openUserEvent(joinedEvent.id);
    });
}

if (selectCreateCoverBtn) {
    selectCreateCoverBtn.addEventListener('click', () => {
        createCoverInput.click();
    });
}

if (createCoverInput) {
    createCoverInput.addEventListener('change', () => {
        handleCreateCoverSelection(createCoverInput.files?.[0]);
    });
}

if (createForm) {
    createForm.addEventListener('submit', async (event) => {
        event.preventDefault();
        const inputs = createForm.querySelectorAll('.create-modal__input');
        const newEvent = createEventFromForm(inputs);

        // Конвертируем обложку в base64 если выбрана
        if (selectedCreateCoverFile) {
            try {
                newEvent.cover = await fileToBase64(selectedCreateCoverFile);
            } catch (err) {
                console.error('Ошибка чтения обложки:', err);
                newEvent.cover = defaultCover;
            }
        }

        events.push(newEvent);
        persistEvents();
        renderEvents();
        resetCreateModal();
        createModal.classList.remove('active');
        openEvent(newEvent.id);
    });
}

if (backToList) {
    backToList.addEventListener('click', () => {
        viewEvent.classList.add('view--hidden');
        viewUserEvent.classList.add('view--hidden');
        viewList.classList.remove('view--hidden');
        currentEventId = null;
    });
}

if (backToAdminView) {
    backToAdminView.addEventListener('click', () => {
        const currentEvent = getCurrentEvent();

        if (!currentEvent) {
            return;
        }

        openEvent(currentEvent.id);
    });
}

const showQrBtn = document.getElementById('showQrBtn');
const qrModal = document.getElementById('qrModal');
const closeQrModal = document.getElementById('closeQrModal');
const copyQrLinkBtn = document.getElementById('copyQrLinkBtn');
const eventQrContainer = document.getElementById('eventQrContainer');

function openQrModal(event) {
    const link = event.qrValue || '';
    eventQrContainer.innerHTML = '';
    new QRCode(eventQrContainer, {
        text: link || 'eventsnap',
        width: 188,
        height: 188,
        colorDark: '#111827',
        colorLight: '#ffffff',
        correctLevel: QRCode.CorrectLevel.M,
    });
    if (eventQrValue) eventQrValue.textContent = link;
    qrModal.classList.add('active');
}

if (showQrBtn) {
    showQrBtn.addEventListener('click', () => {
        const event = getCurrentEvent();
        if (event) openQrModal(event);
    });
}

if (closeQrModal) {
    closeQrModal.addEventListener('click', () => {
        qrModal?.classList.remove('active');
    });
}

if (qrModal) {
    qrModal.addEventListener('click', (e) => {
        if (e.target === qrModal) qrModal.classList.remove('active');
    });
}

if (copyQrLinkBtn) {
    copyQrLinkBtn.addEventListener('click', () => {
        const link = eventQrValue?.textContent || '';
        navigator.clipboard.writeText(link).then(() => {
            copyQrLinkBtn.textContent = 'Скопировано!';
            setTimeout(() => { copyQrLinkBtn.textContent = 'Скопировать ссылку'; }, 1800);
        });
    });
}

if (openParticipantViewBtn) {
    openParticipantViewBtn.addEventListener('click', () => {
        const currentEvent = getCurrentEvent();

        if (!currentEvent) {
            return;
        }

        openUserEvent(currentEvent.id);
    });
}

if (adminAddPhotoBtn) {
    adminAddPhotoBtn.addEventListener('click', () => {
        openAddPhotoModal('organizer');
    });
}

if (userAddPhotoBtn) {
    userAddPhotoBtn.addEventListener('click', () => {
        openAddPhotoModal('participant');
    });
}

if (closeAddPhotoModal) {
    closeAddPhotoModal.addEventListener('click', closeUploadModal);
}

if (addPhotoModal) {
    addPhotoModal.addEventListener('click', (event) => {
        if (event.target === addPhotoModal) {
            closeUploadModal();
        }
    });
}

if (selectPhotoBtn) {
    selectPhotoBtn.addEventListener('click', () => {
        if (!selectPhotoBtn.disabled) {
            addPhotoInput.click();
        }
    });
}

if (addPhotoInput) {
    addPhotoInput.addEventListener('change', () => {
        handleSelectedPhotos(addPhotoInput.files);
    });
}

if (addPhotoForm) {
    addPhotoForm.addEventListener('submit', async (event) => {
        event.preventDefault();

        const currentEvent = getCurrentEvent();

        if (!currentEvent || selectedPhotoFiles.length === 0) {
            updateAddPhotoModalState();
            return;
        }

        // Блокируем кнопку на время загрузки
        savePhotoBtn.disabled = true;
        savePhotoBtn.textContent = 'Загрузка...';

        try {
            // Читаем все файлы параллельно в base64
            const base64Results = await Promise.all(
                selectedPhotoFiles.map((file) => fileToBase64(file))
            );

            const newPhotos = selectedPhotoFiles.map((file, index) => ({
                id: Date.now() + index,
                src: base64Results[index],
                name: file.name,
                author: uploadContext === 'participant' ? participantName : organizerName,
                ownerType: uploadContext === 'participant' ? 'participant' : 'organizer',
            }));

            if (currentEvent.moderationEnabled) {
                currentEvent.pendingPhotos.unshift(...newPhotos);
            } else {
                currentEvent.photos.unshift(...newPhotos);

            }

            persistEvents();
            renderCurrentEvent();
            renderUserEvent();
            renderEvents();
            closeUploadModal();
        } catch (err) {
            console.error('Ошибка загрузки фото:', err);
            alert('Не удалось загрузить фото. Попробуйте ещё раз.');
        } finally {
            // Возвращаем кнопку в исходное состояние
            savePhotoBtn.disabled = false;
            savePhotoBtn.textContent = 'Добавить фотографии';
        }
    });
}

if (moderationToggle) {
    moderationToggle.addEventListener('click', () => {
        const currentEvent = getCurrentEvent();

        if (!currentEvent) {
            return;
        }

        currentEvent.moderationEnabled = !currentEvent.moderationEnabled;
        persistEvents();
        renderCurrentEvent();
    });
}

if (deleteEventBtn) {
    deleteEventBtn.addEventListener('click', () => {
        const currentEvent = getCurrentEvent();
        if (!currentEvent) return;
        if (!confirm(`Удалить мероприятие «${currentEvent.name}»? Это действие нельзя отменить.`)) return;
        deleteCurrentEvent();
    });
}

const fileBtn = document.querySelector('.sidebar__btn--file');
if (fileBtn) {
    fileBtn.addEventListener('click', () => {
        viewEvent?.classList.add('view--hidden');
        viewUserEvent?.classList.add('view--hidden');
        viewList?.classList.remove('view--hidden');
        currentEventId = null;
    });
}

if (openModalBtn) {
    openModalBtn.addEventListener('click', () => {
        modal.classList.add('active');
    });
}

if (closeModalBtn) {
    closeModalBtn.addEventListener('click', () => {
        modal.classList.remove('active');
    });
}

if (modal) {
    modal.addEventListener('click', (event) => {
        if (event.target === modal) {
            modal.classList.remove('active');
        }
    });
}

// ===== Сортировка галереи =====
const gallerySort = document.getElementById('gallerySort');
if (gallerySort) {
    gallerySort.addEventListener('click', (e) => {
        const btn = e.target.closest('.gallery-sort__btn');
        if (!btn) return;
        const order = btn.dataset.sort;
        if (order === photosSortOrder) return;
        photosSortOrder = order;
        gallerySort.querySelectorAll('.gallery-sort__btn').forEach((b) => {
            b.classList.toggle('gallery-sort__btn--active', b.dataset.sort === order);
        });
        const currentEvent = getCurrentEvent();
        if (currentEvent) renderGallery(currentEvent);
    });
}

// ===== Мобильный бургер =====
const mobileBurger = document.getElementById('mobileBurger');
const sidebarOverlay = document.getElementById('sidebarOverlay');

function openMobileSidebar() {
    sidebar.classList.add('sidebar--mobile-open');
    sidebarOverlay.classList.add('active');
}

function closeMobileSidebar() {
    sidebar.classList.remove('sidebar--mobile-open');
    sidebarOverlay.classList.remove('active');
}

if (mobileBurger) {
    mobileBurger.addEventListener('click', openMobileSidebar);
}

if (sidebarOverlay) {
    sidebarOverlay.addEventListener('click', closeMobileSidebar);
}

if (toggleBtn) {
    toggleBtn.addEventListener('click', closeMobileSidebar);
}

setSidebarButtonLabels();
renderEvents();

// ===== Модалка входа =====
const loginModal = document.getElementById('loginModal');
const closeLoginModalBtn = document.getElementById('closeLoginModal');
const switchToRegisterLink = document.getElementById('switchToRegister');
const switchToLoginLink = document.getElementById('switchToLogin');


// Закрыть модалку входа по стрелке назад
if (closeLoginModalBtn) {
    closeLoginModalBtn.addEventListener('click', () => {
        loginModal.classList.remove('active');
    });
}

// Закрыть модалку входа по клику на затемнение
if (loginModal) {
    loginModal.addEventListener('click', (e) => {
        if (e.target === loginModal) {
            loginModal.classList.remove('active');
        }
    });
}

// Переключение "Вход" -> "Регистрация"
if (switchToRegisterLink) {
    switchToRegisterLink.addEventListener('click', (e) => {
        e.preventDefault();
        loginModal.classList.remove('active');
        modal.classList.add('active');
    });
}

// Переключение "Регистрация" -> "Вход"
if (switchToLoginLink) {
    switchToLoginLink.addEventListener('click', (e) => {
        e.preventDefault();
        modal.classList.remove('active');
        loginModal.classList.add('active');
    });
}

// ===== Lightbox (просмотр фото в полный экран) =====
const lightbox = document.getElementById('lightbox');
const lightboxImage = document.getElementById('lightboxImage');
const lightboxCaption = document.getElementById('lightboxCaption');
const lightboxClose = document.getElementById('lightboxClose');
const lightboxPrev = document.getElementById('lightboxPrev');
const lightboxNext = document.getElementById('lightboxNext');

let lightboxPhotos = [];
let lightboxIndex = 0;

function openLightbox(photos, startIndex) {
    if (!photos || photos.length === 0) return;

    lightboxPhotos = photos;
    lightboxIndex = startIndex;

    // Если фото только одно — скрываем стрелки
    lightbox.classList.toggle('lightbox--single', photos.length <= 1);
    lightbox.classList.add('active');
    showLightboxPhoto();
}

function closeLightbox() {
    lightbox.classList.remove('active');
    lightboxImage.src = '';
    lightboxPhotos = [];
}

function showLightboxPhoto() {
    const photo = lightboxPhotos[lightboxIndex];
    if (!photo) return;

    lightboxImage.src = photo.src;
    lightboxImage.alt = photo.name;
    lightboxCaption.textContent = `${photo.name} — ${lightboxIndex + 1} из ${lightboxPhotos.length}`;
}

function lightboxGoPrev() {
    if (lightboxPhotos.length <= 1) return;
    lightboxIndex = (lightboxIndex - 1 + lightboxPhotos.length) % lightboxPhotos.length;
    showLightboxPhoto();
}

function lightboxGoNext() {
    if (lightboxPhotos.length <= 1) return;
    lightboxIndex = (lightboxIndex + 1) % lightboxPhotos.length;
    showLightboxPhoto();
}

if (lightboxClose) {
    lightboxClose.addEventListener('click', closeLightbox);
}

if (lightboxPrev) {
    lightboxPrev.addEventListener('click', lightboxGoPrev);
}

if (lightboxNext) {
    lightboxNext.addEventListener('click', lightboxGoNext);
}

// Клик по фону закрывает
if (lightbox) {
    lightbox.addEventListener('click', (e) => {
        if (e.target === lightbox) {
            closeLightbox();
        }
    });
}

// Клавиатура: Esc, стрелки
document.addEventListener('keydown', (e) => {
    if (!lightbox.classList.contains('active')) return;

    if (e.key === 'Escape') closeLightbox();
    if (e.key === 'ArrowLeft') lightboxGoPrev();
    if (e.key === 'ArrowRight') lightboxGoNext();
});