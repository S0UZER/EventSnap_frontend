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

const events = [];
let currentEventId = null;
let selectedPhotoFiles = [];
let selectedCreateCoverFile = null;
let nextEventId = 1;
let uploadContext = 'organizer';

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

function handleCreateCoverSelection(file) {
    if (!file || !file.type.match(/image\/(jpeg|png)/)) {
        return;
    }

    selectedCreateCoverFile = file;
    createCoverPreview.src = URL.createObjectURL(file);
    createCoverPreviewWrap.classList.remove('create-cover__preview--hidden');
    createCoverFileName.textContent = file.name;
    createCoverFileName.classList.remove('create-cover__file--hidden');
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

function handleSelectedPhotos(files) {
    const validFiles = Array.from(files ?? []).filter((file) => file.type.match(/image\/(jpeg|png)/));

    if (validFiles.length === 0) {
        return;
    }

    selectedPhotoFiles = validFiles;
    photoPreview.src = URL.createObjectURL(validFiles[0]);
    photoPreviewWrap.classList.remove('upload-modal__preview--hidden');
    selectedPhotoName.textContent = validFiles.length === 1
        ? validFiles[0].name
        : `${validFiles.length} файлов выбрано. Первый: ${validFiles[0].name}`;
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
        cover: selectedCreateCoverFile ? URL.createObjectURL(selectedCreateCoverFile) : defaultCover,
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

function createPhotoCard(photo) {
    const item = document.createElement('article');
    item.className = 'photo-item';
    item.innerHTML = `
        <img src="${photo.src}" alt="${photo.name}">
        <div class="photo-item__footer">
            <span class="photo-item__name">${photo.name}</span>
            <span class="photo-item__status">Одобрено</span>
        </div>
    `;
    return item;
}

function createUserPhotoCard(photo) {
    const item = document.createElement('article');
    item.className = 'photo-item';
    item.innerHTML = `
        <img src="${photo.src}" alt="${photo.name}">
        ${photo.ownerType === 'participant' ? '<div class="photo-item__actions"><button class="photo-item__delete" type="button">Удалить</button></div>' : ''}
        <div class="photo-item__footer">
            <span class="photo-item__name">${photo.name}</span>
            <span class="photo-item__status">${photo.ownerType === 'participant' ? 'Ваше фото' : 'Организатор'}</span>
        </div>
    `;

    const deleteButton = item.querySelector('.photo-item__delete');

    if (deleteButton) {
        deleteButton.addEventListener('click', () => {
            const currentEvent = getCurrentEvent();

            if (!currentEvent) {
                return;
            }

            currentEvent.photos = currentEvent.photos.filter((eventPhoto) => eventPhoto.id !== photo.id);
            renderCurrentEvent();
            renderUserEvent();
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

    event.photos.forEach((photo) => {
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
    eventQrValue.textContent = event.qrValue;
    eventQrImage.src = buildQrSvg(event.qrValue);

    renderParticipants(event);
    renderGallery(event);
    renderModerationQueue(event);
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
    createForm.addEventListener('submit', (event) => {
        event.preventDefault();
        const inputs = createForm.querySelectorAll('.create-modal__input');
        const newEvent = createEventFromForm(inputs);
        events.push(newEvent);
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
    addPhotoForm.addEventListener('submit', (event) => {
        event.preventDefault();

        const currentEvent = getCurrentEvent();

        if (!currentEvent || selectedPhotoFiles.length === 0) {
            updateAddPhotoModalState();
            return;
        }

        const newPhotos = selectedPhotoFiles.map((file, index) => ({
            id: Date.now() + index,
            src: URL.createObjectURL(file),
            name: file.name,
            author: uploadContext === 'participant' ? participantName : organizerName,
            ownerType: uploadContext === 'participant' ? 'participant' : 'organizer',
        }));

        if (currentEvent.moderationEnabled) {
            currentEvent.pendingPhotos.unshift(...newPhotos);
        } else {
            currentEvent.photos.unshift(...newPhotos);

            if (uploadContext === 'organizer' && newPhotos[0]) {
                currentEvent.cover = newPhotos[0].src;
            }
        }

        renderCurrentEvent();
        renderUserEvent();
        renderEvents();
        closeUploadModal();
    });
}

if (moderationToggle) {
    moderationToggle.addEventListener('click', () => {
        const currentEvent = getCurrentEvent();

        if (!currentEvent) {
            return;
        }

        currentEvent.moderationEnabled = !currentEvent.moderationEnabled;
        renderCurrentEvent();
    });
}

if (deleteEventBtn) {
    deleteEventBtn.addEventListener('click', () => {
        const currentEvent = getCurrentEvent();

        if (!currentEvent) {
            return;
        }

        deleteCurrentEvent();
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

setSidebarButtonLabels();
renderEvents();

// ===== Модалка входа =====
const loginModal = document.getElementById('loginModal');
const openLoginBtn = document.querySelector('.auth__btn--login');
const closeLoginModalBtn = document.getElementById('closeLoginModal');
const switchToRegisterLink = document.getElementById('switchToRegister');
const switchToLoginLink = document.getElementById('switchToLogin');

// Открыть модалку входа
if (openLoginBtn) {
    openLoginBtn.addEventListener('click', () => {
        loginModal.classList.add('active');
    });
}

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