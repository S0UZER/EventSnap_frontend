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

const showQrBtn = document.getElementById('showQrBtn');
const qrModal = document.getElementById('qrModal');
const closeQrModal = document.getElementById('closeQrModal');
const copyQrLinkBtn = document.getElementById('copyQrLinkBtn');
const eventQrContainer = document.getElementById('eventQrContainer');

const loginModal = document.getElementById('loginModal');
const closeLoginModalBtn = document.getElementById('closeLoginModal');
const switchToRegisterLink = document.getElementById('switchToRegister');
const switchToLoginLink = document.getElementById('switchToLogin');

const mobileBurger = document.getElementById('mobileBurger');
const sidebarOverlay = document.getElementById('sidebarOverlay');
const gallerySort = document.getElementById('gallerySort');
const fileBtn = document.querySelector('.sidebar__btn--file');

const lightbox = document.getElementById('lightbox');
const lightboxImage = document.getElementById('lightboxImage');
const lightboxCaption = document.getElementById('lightboxCaption');
const lightboxClose = document.getElementById('lightboxClose');
const lightboxPrev = document.getElementById('lightboxPrev');
const lightboxNext = document.getElementById('lightboxNext');

const defaultCover = './img/main_page/empty-photo-icon.svg';
const organizerName = 'Вы';
const participantName = 'Участник';

let events = [];
let currentEventId = null;
let selectedPhotoFiles = [];
let selectedCreateCoverFile = null;
let uploadContext = 'organizer';
let photosSortOrder = 'newest';
let lightboxPhotos = [];
let lightboxIndex = 0;
let handledJoinToken = null;

const localCoverUrls = new Map();

function getInitials(name) {
    return (name || '')
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

function buildStartsAt(dateValue) {
    if (!dateValue) {
        return null;
    }

    return new Date(`${dateValue}T00:00:00`).toISOString();
}

function setControlLoading(button, isLoading, loadingText) {
    if (!button) return;

    if (isLoading) {
        button.dataset.originalText = button.textContent;
        button.textContent = loadingText;
        button.disabled = true;
        return;
    }

    button.textContent = button.dataset.originalText || button.textContent;
    button.disabled = false;
}

function getCurrentUser() {
    return auth?.getUser?.() ?? null;
}

function isOrganizer(rawEvent) {
    const user = getCurrentUser();
    return Boolean(user?.id && rawEvent?.organizer_id === user.id);
}

function normalizeEvent(rawEvent) {
    const organizer = isOrganizer(rawEvent);
    const place = rawEvent.venue_name || rawEvent.venue_address || '';

    return {
        id: rawEvent.id,
        raw: rawEvent,
        name: rawEvent.title || 'Без названия',
        description: rawEvent.description || '',
        place,
        date: rawEvent.starts_at || '',
        cover: localCoverUrls.get(rawEvent.id) || rawEvent.cover_url || rawEvent.cover || defaultCover,
        coverS3Key: rawEvent.cover_s3_key || null,
        accessRole: organizer ? 'organizer' : 'participant',
        moderationEnabled: Boolean(rawEvent.moderation_enabled),
        qrToken: rawEvent.qr_token || '',
        participants: [],
        photos: [],
        pendingPhotos: [],
        loaded: false,
    };
}

function upsertEvent(rawEvent) {
    const normalized = normalizeEvent(rawEvent);
    const index = events.findIndex((event) => event.id === normalized.id);

    if (index === -1) {
        events.push(normalized);
        return normalized;
    }

    const existing = events[index];
    events[index] = {
        ...existing,
        ...normalized,
        participants: existing.participants || [],
        photos: existing.photos || [],
        pendingPhotos: existing.pendingPhotos || [],
        loaded: existing.loaded,
    };
    return events[index];
}

function getCurrentEvent() {
    return events.find((event) => event.id === currentEventId) ?? null;
}

function normalizeParticipant(rawParticipant) {
    return {
        id: rawParticipant.user_id,
        name: rawParticipant.display_name || 'Участник',
        role: rawParticipant.role || 'participant',
        joinedAt: rawParticipant.joined_at || '',
    };
}

function normalizePhoto(rawPhoto, event) {
    const user = getCurrentUser();
    const isOwn = Boolean(user?.id && rawPhoto.uploader_id === user.id);
    const src = rawPhoto.original_url || rawPhoto.thumbnail_url || defaultCover;

    return {
        id: rawPhoto.id,
        raw: rawPhoto,
        src,
        name: rawPhoto.original_filename || 'Фото',
        author: isOwn ? organizerName : participantName,
        ownerType: isOwn ? 'participant' : 'organizer',
        isOwn,
        canDelete: event?.accessRole === 'organizer' || isOwn,
        moderationStatus: rawPhoto.moderation_status || 'approved',
        moderationComment: rawPhoto.moderation_comment || '',
        createdAt: rawPhoto.created_at || '',
    };
}

function eventPayloadFromForm(inputs) {
    const title = inputs[0].value.trim() || 'Без названия';
    const description = inputs[1].value.trim();
    const place = inputs[2].value.trim();
    const date = inputs[3].value;

    return {
        title,
        description: description || null,
        venue_name: place || null,
        venue_address: null,
        starts_at: buildStartsAt(date),
        ends_at: null,
    };
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

async function loadEventsFromBackend() {
    if (!auth.isLoggedIn()) {
        events = [];
        currentEventId = null;
        renderEvents();
        return;
    }

    if (events.length === 0) {
        renderEventsSkeleton();
    }

    try {
        const response = await api.events.list({ role: 'all', limit: 100 });
        events = (response.items || []).map(normalizeEvent);
        renderEvents();
    } catch (err) {
        if (err.status !== 401) {
            console.error('[events] load failed', err);
            showToast(`Не удалось загрузить мероприятия: ${err.message}`, 'error');
        }
    }
}

async function hydrateEvent(eventId) {
    const rawEvent = await api.events.get(eventId);
    const event = upsertEvent(rawEvent);

    const requests = [
        api.gallery.get(eventId),
        api.photos.list(eventId, { limit: 100 }),
        api.events.participants(eventId, { limit: 100 }),
    ];

    if (event.accessRole === 'organizer') {
        requests.push(api.photos.pending(eventId, { limit: 100 }));
    }

    const [galleryResult, photosResult, participantsResult, pendingResult] = await Promise.allSettled(requests);

    if (galleryResult.status === 'fulfilled') {
        event.moderationEnabled = Boolean(galleryResult.value.moderation_enabled);
    }

    if (photosResult.status === 'fulfilled') {
        event.photos = (photosResult.value.items || []).map((photo) => normalizePhoto(photo, event));
    }

    if (participantsResult.status === 'fulfilled') {
        event.participants = (participantsResult.value.items || []).map(normalizeParticipant);
    }

    if (pendingResult?.status === 'fulfilled') {
        event.pendingPhotos = (pendingResult.value.items || []).map((photo) => normalizePhoto(photo, event));
    } else if (event.accessRole !== 'organizer') {
        event.pendingPhotos = [];
    }

    event.loaded = true;
    return event;
}

async function refreshCurrentEvent() {
    if (!currentEventId) {
        return null;
    }

    const event = await hydrateEvent(currentEventId);
    renderCurrentEvent();
    renderUserEvent();
    renderEvents();
    return event;
}

function renderEventsSkeleton(count) {
    if (!eventsGrid) return;
    count = count || 4;
    eventsGrid.innerHTML = '';
    eventsEmpty?.classList.add('events-empty--hidden');
    for (let i = 0; i < count; i++) {
        const card = document.createElement('div');
        card.className = 'event-card event-card--skeleton';
        card.innerHTML = `
            <div class="event-card__img"></div>
            <div class="skeleton-bar" style="height:16px;width:70%;margin-top:8px;"></div>
            <div class="skeleton-bar" style="height:14px;width:45%;margin-top:8px;"></div>
        `;
        eventsGrid.appendChild(card);
    }
}

function renderEvents() {
    if (!eventsGrid) return;

    eventsGrid.innerHTML = '';
    eventsEmpty?.classList.toggle('events-empty--hidden', events.length > 0);

    events.forEach((event) => {
        const card = document.createElement('article');
        card.className = 'event-card';
        card.innerHTML = `
            <div class="event-card__img">
                <img src="" alt="">
            </div>
            <span class="event-card__name"></span>
            <div class="event-card__meta">
                <span class="event-card__badge"></span>
                <span class="event-card__badge"></span>
            </div>
        `;

        const img = card.querySelector('img');
        const name = card.querySelector('.event-card__name');
        const badges = card.querySelectorAll('.event-card__badge');

        img.src = event.cover || defaultCover;
        img.alt = event.name;
        name.textContent = event.name;
        badges[0].textContent = formatEventDate(event.date);
        badges[1].textContent = event.place || 'Без адреса';

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

    if (createCoverInput) {
        createCoverInput.value = '';
    }

    if (createCoverPreview) {
        if (createCoverPreview.src?.startsWith('blob:')) URL.revokeObjectURL(createCoverPreview.src);
        createCoverPreview.src = '';
    }

    createCoverPreviewWrap?.classList.add('create-cover__preview--hidden');

    if (createCoverFileName) {
        createCoverFileName.textContent = '';
        createCoverFileName.classList.add('create-cover__file--hidden');
    }
}

async function handleCreateCoverSelection(file) {
    if (!file || !file.type.match(/image\/(jpeg|png)/)) {
        return;
    }

    try {
        const editedFile = await openImageEditor(file);

        selectedCreateCoverFile = editedFile;
        if (createCoverPreview.src?.startsWith('blob:')) URL.revokeObjectURL(createCoverPreview.src);
        createCoverPreview.src = URL.createObjectURL(editedFile);
        createCoverPreviewWrap.classList.remove('create-cover__preview--hidden');
        createCoverFileName.textContent = editedFile.name;
        createCoverFileName.classList.remove('create-cover__file--hidden');
    } catch (err) {
        if (err !== 'cancelled') {
            console.error('Ошибка редактирования:', err);
            showToast('Не удалось обработать изображение', 'error');
        }
    } finally {
        createCoverInput.value = '';
    }
}

function resetAddPhotoModal() {
    selectedPhotoFiles = [];
    addPhotoForm?.reset();

    if (addPhotoInput) {
        addPhotoInput.value = '';
    }

    if (photoPreview) {
        if (photoPreview.src?.startsWith('blob:')) URL.revokeObjectURL(photoPreview.src);
        photoPreview.src = '';
    }

    photoPreviewWrap?.classList.add('upload-modal__preview--hidden');

    if (selectedPhotoName) {
        selectedPhotoName.textContent = '';
        selectedPhotoName.classList.add('upload-modal__file--hidden');
    }
}

function isEventViewOpen() {
    return viewEvent && !viewEvent.classList.contains('view--hidden');
}

function isUserEventViewOpen() {
    return viewUserEvent && !viewUserEvent.classList.contains('view--hidden');
}

function updateAddPhotoModalState() {
    const hasOpenEvent = (isEventViewOpen() || isUserEventViewOpen()) && Boolean(getCurrentEvent());

    if (addPhotoHint) {
        addPhotoHint.textContent = hasOpenEvent
            ? (uploadContext === 'participant'
                ? 'Выберите изображение, чтобы добавить его в галерею как участник'
                : 'Выберите изображение, чтобы добавить его в текущее мероприятие')
            : 'Сначала откройте мероприятие, а потом загрузите в него фотографию';
        addPhotoHint.classList.toggle('upload-modal__hint--warning', !hasOpenEvent);
    }

    if (selectPhotoBtn) {
        selectPhotoBtn.disabled = !hasOpenEvent;
    }

    if (savePhotoBtn) {
        savePhotoBtn.disabled = !hasOpenEvent || selectedPhotoFiles.length === 0;
    }
}

function openAddPhotoModal(context = 'organizer') {
    uploadContext = context;
    resetAddPhotoModal();
    updateAddPhotoModalState();
    addPhotoModal?.classList.add('active');
}

function closeUploadModal() {
    addPhotoModal?.classList.remove('active');
    resetAddPhotoModal();
}

async function handleSelectedPhotos(files) {
    const validFiles = Array.from(files ?? []).filter((file) => file.type.match(/image\/(jpeg|png)/));

    if (validFiles.length === 0) {
        return;
    }

    const editedFiles = [];

    for (const file of validFiles) {
        try {
            const edited = await openImageEditor(file);
            editedFiles.push(edited);
        } catch (err) {
            if (err === 'cancelled') {
                continue;
            }

            console.error('Ошибка редактирования:', err);
            showToast('Не удалось обработать одно из изображений', 'error');
        }
    }

    if (editedFiles.length === 0) {
        addPhotoInput.value = '';
        return;
    }

    selectedPhotoFiles = editedFiles;
    if (photoPreview.src?.startsWith('blob:')) URL.revokeObjectURL(photoPreview.src);
    photoPreview.src = URL.createObjectURL(editedFiles[0]);
    photoPreviewWrap.classList.remove('upload-modal__preview--hidden');
    selectedPhotoName.textContent = editedFiles.length === 1
        ? editedFiles[0].name
        : `${editedFiles.length} файлов выбрано. Первый: ${editedFiles[0].name}`;
    selectedPhotoName.classList.remove('upload-modal__file--hidden');
    updateAddPhotoModalState();
}

function getImageSize(file) {
    return new Promise((resolve) => {
        const img = new Image();
        const objectUrl = URL.createObjectURL(file);

        img.onload = () => {
            const size = { width: img.naturalWidth, height: img.naturalHeight };
            URL.revokeObjectURL(objectUrl);
            resolve(size);
        };

        img.onerror = () => {
            URL.revokeObjectURL(objectUrl);
            resolve({});
        };

        img.src = objectUrl;
    });
}

function releaseLocalCoverUrl(eventId) {
    const url = localCoverUrls.get(eventId);
    if (url) {
        URL.revokeObjectURL(url);
        localCoverUrls.delete(eventId);
    }
}

async function uploadCover(eventId, file) {
    const upload = await api.events.createCoverUploadUrl(eventId, file.type || 'image/jpeg');
    await api.uploadToPresignedUrl(upload.upload_url, file, upload);
    releaseLocalCoverUrl(eventId);
    localCoverUrls.set(eventId, URL.createObjectURL(file));
    return api.events.completeCoverUpload(eventId, upload.s3_key);
}

async function uploadPhoto(event, file) {
    const size = await getImageSize(file);
    const upload = await api.photos.createUploadUrl(event.id, file, size);
    await api.uploadToPresignedUrl(upload.upload_url, file, upload);
    return api.photos.complete(upload.photo_id, upload.s3_key);
}

function createParticipantCard(participant) {
    const card = document.createElement('article');
    card.className = 'participant-card';
    card.innerHTML = `
        <div class="participant-card__avatar"></div>
        <div>
            <p class="participant-card__name"></p>
            <p class="participant-card__role"></p>
        </div>
    `;

    card.querySelector('.participant-card__avatar').textContent = getInitials(participant.name);
    card.querySelector('.participant-card__name').textContent = participant.name;
    card.querySelector('.participant-card__role').textContent = participant.role === 'organizer'
        ? 'Организатор'
        : 'Участник';

    return card;
}

function renderParticipants(event) {
    if (!participantsList || !participantsCount) return;

    participantsList.innerHTML = '';
    participantsCount.textContent = String(event.participants.length);

    event.participants.forEach((participant) => {
        participantsList.appendChild(createParticipantCard(participant));
    });
}

function photoSortValue(photo) {
    const value = new Date(photo.createdAt).getTime();
    return Number.isNaN(value) ? 0 : value;
}

function createPhotoCard(photo, photosForLightbox) {
    const item = document.createElement('article');
    const canDelete = Boolean(photo.canDelete);
    item.className = 'photo-item';
    item.innerHTML = `
        <img src="" alt="">
        ${canDelete ? '<div class="photo-item__actions"><button class="photo-item__delete" type="button">Удалить</button></div>' : ''}
        <div class="photo-item__footer">
            <span class="photo-item__name"></span>
            <span class="photo-item__status"></span>
        </div>
    `;

    const img = item.querySelector('img');
    img.src = photo.src || defaultCover;
    img.alt = photo.name;
    item.querySelector('.photo-item__name').textContent = photo.name;
    item.querySelector('.photo-item__status').textContent = photo.moderationStatus === 'pending'
        ? 'На модерации'
        : 'Одобрено';

    const deleteButton = item.querySelector('.photo-item__delete');

    if (deleteButton) {
        deleteButton.addEventListener('click', async (e) => {
            e.stopPropagation();

            if (!confirm('Удалить это фото?')) return;

            try {
                await api.photos.delete(photo.id);
                await refreshCurrentEvent();
            } catch (err) {
                showToast(`Не удалось удалить фото: ${err.message}`, 'error');
            }
        });
    }

    img.addEventListener('click', () => {
        const index = photosForLightbox.findIndex((itemPhoto) => itemPhoto.id === photo.id);
        openLightbox(photosForLightbox, index);
    });

    return item;
}

function createUserPhotoCard(photo, photosForLightbox) {
    const item = document.createElement('article');
    const canDelete = Boolean(photo.isOwn);
    item.className = 'photo-item';
    item.innerHTML = `
        <img src="" alt="">
        ${canDelete ? '<div class="photo-item__actions"><button class="photo-item__delete" type="button">Удалить</button></div>' : ''}
        <div class="photo-item__footer">
            <span class="photo-item__name"></span>
            <span class="photo-item__status"></span>
        </div>
    `;

    const img = item.querySelector('img');
    img.src = photo.src || defaultCover;
    img.alt = photo.name;
    item.querySelector('.photo-item__name').textContent = photo.name;
    item.querySelector('.photo-item__status').textContent = photo.isOwn ? 'Ваше фото' : 'Галерея';

    const deleteButton = item.querySelector('.photo-item__delete');

    if (deleteButton) {
        deleteButton.addEventListener('click', async (e) => {
            e.stopPropagation();

            if (!confirm('Удалить это фото?')) return;

            try {
                await api.photos.delete(photo.id);
                await refreshCurrentEvent();
            } catch (err) {
                showToast(`Не удалось удалить фото: ${err.message}`, 'error');
            }
        });
    }

    img.addEventListener('click', () => {
        const index = photosForLightbox.findIndex((itemPhoto) => itemPhoto.id === photo.id);
        openLightbox(photosForLightbox, index);
    });

    return item;
}

function renderGallery(event) {
    if (!photosGrid || !galleryCount || !galleryEmpty) return;

    photosGrid.innerHTML = '';
    galleryCount.textContent = String(event.photos.length);
    galleryEmpty.classList.toggle('event-empty-state--hidden', event.photos.length > 0);

    const sorted = [...event.photos].sort((a, b) => {
        return photosSortOrder === 'newest'
            ? photoSortValue(b) - photoSortValue(a)
            : photoSortValue(a) - photoSortValue(b);
    });

    sorted.forEach((photo) => {
        photosGrid.appendChild(createPhotoCard(photo, sorted));
    });
}

function renderUserGallery(event) {
    if (!userPhotosGrid || !userGalleryCount || !userGalleryEmpty) return;

    userPhotosGrid.innerHTML = '';
    userGalleryCount.textContent = String(event.photos.length);
    userGalleryEmpty.classList.toggle('event-empty-state--hidden', event.photos.length > 0);

    event.photos.forEach((photo) => {
        userPhotosGrid.appendChild(createUserPhotoCard(photo, event.photos));
    });
}

function setModerationUI(event) {
    if (!moderationToggle || !moderationStatusText || !moderationPanel) return;

    const organizer = event.accessRole === 'organizer';

    moderationToggle.classList.toggle('moderation-toggle--active', event.moderationEnabled);
    moderationToggle.setAttribute('aria-pressed', String(event.moderationEnabled));
    moderationToggle.disabled = !organizer;
    moderationStatusText.textContent = event.moderationEnabled
        ? 'Новые фото попадают в очередь и ждут одобрения организатора'
        : 'Все новые фото сразу попадают в галерею';
    moderationPanel.style.display = organizer && event.moderationEnabled ? 'block' : 'none';
}

function renderModerationQueue(event) {
    if (!moderationList || !moderationCount || !moderationEmpty || !moderationPanel) return;

    moderationList.innerHTML = '';
    moderationCount.textContent = String(event.pendingPhotos.length);
    moderationEmpty.classList.toggle('event-empty-state--hidden', event.pendingPhotos.length > 0);
    setModerationUI(event);

    if (event.accessRole !== 'organizer' || !event.moderationEnabled) {
        return;
    }

    event.pendingPhotos.forEach((photo) => {
        const card = document.createElement('article');
        card.className = 'moderation-card';
        card.innerHTML = `
            <div class="moderation-card__preview">
                <img src="" alt="">
            </div>
            <div class="moderation-card__content">
                <div>
                    <h3 class="moderation-card__title"></h3>
                    <p class="moderation-card__meta"></p>
                </div>
                <textarea class="moderation-card__comment" placeholder="Комментарий для отклонения или заметка для участника"></textarea>
                <div class="moderation-card__actions">
                    <button class="moderation-card__button moderation-card__button--approve" type="button">Одобрить</button>
                    <button class="moderation-card__button moderation-card__button--reject" type="button">Отклонить</button>
                </div>
            </div>
        `;

        card.querySelector('img').src = photo.src || defaultCover;
        card.querySelector('img').alt = photo.name;
        card.querySelector('.moderation-card__title').textContent = photo.name;
        card.querySelector('.moderation-card__meta').textContent = `Статус: ${photo.moderationStatus}. Ожидает публикации в галерее.`;

        const approveButton = card.querySelector('.moderation-card__button--approve');
        const rejectButton = card.querySelector('.moderation-card__button--reject');
        const commentField = card.querySelector('.moderation-card__comment');

        approveButton.addEventListener('click', async () => {
            setControlLoading(approveButton, true, 'Одобряем...');

            try {
                await api.photos.approve(photo.id, commentField.value.trim() || null);
                await refreshCurrentEvent();
            } catch (err) {
                showToast(`Не удалось одобрить фото: ${err.message}`, 'error');
            } finally {
                setControlLoading(approveButton, false);
            }
        });

        rejectButton.addEventListener('click', async () => {
            const comment = commentField.value.trim() || 'Фото отклонено организатором';
            setControlLoading(rejectButton, true, 'Отклоняем...');

            try {
                await api.photos.reject(photo.id, comment);
                await refreshCurrentEvent();
            } catch (err) {
                showToast(`Не удалось отклонить фото: ${err.message}`, 'error');
            } finally {
                setControlLoading(rejectButton, false);
            }
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

    const organizer = event.accessRole === 'organizer';
    deleteEventBtn.style.display = organizer ? '' : 'none';
    openParticipantViewBtn.style.display = organizer ? '' : 'none';
    adminAddPhotoBtn.style.display = organizer ? '' : 'none';

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

async function openEvent(eventId, { addHistory = true } = {}) {
    if (addHistory) {
        history.pushState(null, '', `#event/${eventId}`);
    }
    currentEventId = eventId;
    viewList.classList.add('view--hidden');
    viewUserEvent.classList.add('view--hidden');
    viewEvent.classList.remove('view--hidden');

    const existing = getCurrentEvent();
    if (existing) {
        renderCurrentEvent();
    }

    try {
        await refreshCurrentEvent();
    } catch (err) {
        showToast(`Не удалось открыть мероприятие: ${err.message}`, 'error');
    }
}

async function openUserEvent(eventId, { addHistory = true } = {}) {
    if (addHistory) {
        history.pushState(null, '', `#event/${eventId}/participant`);
    }
    currentEventId = eventId;
    viewList.classList.add('view--hidden');
    viewEvent.classList.add('view--hidden');
    viewUserEvent.classList.remove('view--hidden');

    const existing = getCurrentEvent();
    if (existing) {
        renderUserEvent();
    }

    try {
        await refreshCurrentEvent();
    } catch (err) {
        showToast(`Не удалось открыть мероприятие: ${err.message}`, 'error');
    }
}

async function deleteCurrentEvent() {
    const event = getCurrentEvent();

    if (!event) {
        return;
    }

    await api.events.delete(event.id);
    releaseLocalCoverUrl(event.id);
    currentEventId = null;
    viewEvent.classList.add('view--hidden');
    viewUserEvent.classList.add('view--hidden');
    viewList.classList.remove('view--hidden');
    await loadEventsFromBackend();
}

function extractQrToken(value) {
    const trimmed = (value || '').trim();

    if (!trimmed) {
        return '';
    }

    try {
        const url = new URL(trimmed, window.location.href);
        const token = url.searchParams.get('qr_token') || url.searchParams.get('token');

        if (token) {
            return token;
        }

        const parts = url.pathname.split('/').filter(Boolean);
        return parts[parts.length - 1] || trimmed;
    } catch (err) {
        console.error('[qr] token parse failed', err);
        return trimmed.split('/').filter(Boolean).pop() || trimmed;
    }
}

function getQrTokenFromLocation() {
    const params = new URLSearchParams(window.location.search);
    return params.get('qr_token') || params.get('token') || '';
}

function clearJoinTokenFromLocation() {
    if (!window.history?.replaceState) {
        return;
    }

    const url = new URL(window.location.href);
    url.searchParams.delete('qr_token');
    url.searchParams.delete('token');
    window.history.replaceState(null, '', url.toString());
}

function buildFrontendJoinUrl(qrToken) {
    const url = new URL(window.location.href);
    url.search = '';
    url.hash = '';
    url.searchParams.set('qr_token', qrToken);
    return url.toString();
}

async function joinByQrToken(qrToken) {
    const response = await api.events.join(qrToken);
    const event = upsertEvent(response.event);
    await loadEventsFromBackend();
    await openUserEvent(event.id);
    return response;
}

async function joinFromLocationIfNeeded() {
    const qrToken = getQrTokenFromLocation();

    if (!qrToken || handledJoinToken === qrToken || !auth.isLoggedIn()) {
        return;
    }

    handledJoinToken = qrToken;

    try {
        await joinByQrToken(qrToken);
        clearJoinTokenFromLocation();
    } catch (err) {
        showToast(`Не удалось присоединиться к мероприятию: ${err.message}`, 'error');
    }
}

async function openQrModal(event) {
    try {
        const joinData = await api.events.joinLink(event.id);
        const link = buildFrontendJoinUrl(joinData.qr_token);

        eventQrContainer.innerHTML = '';
        new QRCode(eventQrContainer, {
            text: link,
            width: 188,
            height: 188,
            colorDark: '#111827',
            colorLight: '#ffffff',
            correctLevel: QRCode.CorrectLevel.M,
        });

        if (eventQrValue) {
            eventQrValue.textContent = link;
        }

        qrModal.classList.add('active');
    } catch (err) {
        showToast(`Не удалось получить QR-ссылку: ${err.message}`, 'error');
    }
}

function openMobileSidebar() {
    sidebar?.classList.add('sidebar--mobile-open');
    sidebar?.classList.add('sidebar--expanded');
    sidebarOverlay?.classList.add('active');
    mobileBurger?.classList.add('mobile-burger--active');
}

function closeMobileSidebar() {
    sidebar?.classList.remove('sidebar--mobile-open');
    sidebar?.classList.remove('sidebar--expanded');
    sidebarOverlay?.classList.remove('active');
    mobileBurger?.classList.remove('mobile-burger--active');
}

function openLightbox(photos, startIndex) {
    if (!photos || photos.length === 0) return;

    lightboxPhotos = photos;
    lightboxIndex = Math.max(0, startIndex);
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

    lightboxImage.style.opacity = '0';
    setTimeout(() => {
        lightboxImage.src = photo.src || defaultCover;
        lightboxImage.alt = photo.name;
        lightboxCaption.textContent = `${photo.name} — ${lightboxIndex + 1} из ${lightboxPhotos.length}`;
        lightboxImage.style.opacity = '1';
    }, 100);
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

if (toggleBtn) {
    toggleBtn.addEventListener('click', () => {
        if (sidebar.classList.contains('sidebar--mobile-open')) {
            closeMobileSidebar();
        } else {
            sidebar.classList.toggle('sidebar--expanded');
        }
    });
}

if (openCreateModal) {
    openCreateModal.addEventListener('click', () => {
        closeMobileSidebar();
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
        closeMobileSidebar();
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
    joinEventForm.addEventListener('submit', async (event) => {
        event.preventDefault();

        const qrToken = extractQrToken(joinEventCode.value);
        const submitButton = joinEventForm.querySelector('button[type="submit"]');

        if (!qrToken) {
            showToast('Введите код или ссылку мероприятия', 'info');
            return;
        }

        setControlLoading(submitButton, true, 'Добавляем...');

        try {
            await joinByQrToken(qrToken);
            joinEventForm.reset();
            joinModal.classList.remove('active');
        } catch (err) {
            showToast(`Не удалось добавить мероприятие: ${err.message}`, 'error');
        } finally {
            setControlLoading(submitButton, false);
        }
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

        const submitButton = createForm.querySelector('button[type="submit"]');
        const inputs = createForm.querySelectorAll('.create-modal__input');

        setControlLoading(submitButton, true, 'Создаем...');

        try {
            let rawEvent = await api.events.create(eventPayloadFromForm(inputs));

            if (selectedCreateCoverFile) {
                rawEvent = await uploadCover(rawEvent.id, selectedCreateCoverFile);
            }

            const newEvent = upsertEvent(rawEvent);
            await loadEventsFromBackend();
            resetCreateModal();
            createModal.classList.remove('active');
            await openEvent(newEvent.id);
        } catch (err) {
            showToast(`Не удалось создать мероприятие: ${err.message}`, 'error');
        } finally {
            setControlLoading(submitButton, false);
        }
    });
}

if (backToList) {
    backToList.addEventListener('click', () => {
        history.pushState(null, '', '#home');
        viewEvent.classList.add('view--hidden');
        viewUserEvent.classList.add('view--hidden');
        viewList.classList.remove('view--hidden');
        currentEventId = null;
        loadEventsFromBackend();
    });
}

if (backToAdminView) {
    backToAdminView.addEventListener('click', () => {
        const currentEvent = getCurrentEvent();

        if (!currentEvent) {
            return;
        }

        if (currentEvent.accessRole === 'organizer') {
            openEvent(currentEvent.id);
            return;
        }

        history.pushState(null, '', '#home');
        viewEvent.classList.add('view--hidden');
        viewUserEvent.classList.add('view--hidden');
        viewList.classList.remove('view--hidden');
        currentEventId = null;
    });
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

        if (!link) {
            return;
        }

        navigator.clipboard?.writeText(link)
            .then(() => {
                copyQrLinkBtn.textContent = 'Скопировано!';
                setTimeout(() => {
                    copyQrLinkBtn.textContent = 'Скопировать ссылку';
                }, 1800);
            })
            .catch((err) => {
                console.error('[clipboard] copy failed', err);
                prompt('Скопируйте ссылку', link);
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

        setControlLoading(savePhotoBtn, true, 'Загрузка...');

        try {
            for (const file of selectedPhotoFiles) {
                await uploadPhoto(currentEvent, file);
            }

            await refreshCurrentEvent();
            closeUploadModal();
        } catch (err) {
            console.error('Ошибка загрузки фото:', err);
            showToast(`Не удалось загрузить фото: ${err.message}`, 'error');
        } finally {
            setControlLoading(savePhotoBtn, false);
            updateAddPhotoModalState();
        }
    });
}

if (moderationToggle) {
    moderationToggle.addEventListener('click', async () => {
        const currentEvent = getCurrentEvent();

        if (!currentEvent || currentEvent.accessRole !== 'organizer') {
            return;
        }

        moderationToggle.disabled = true;

        try {
            const gallery = await api.gallery.update(currentEvent.id, {
                moderation_enabled: !currentEvent.moderationEnabled,
            });
            currentEvent.moderationEnabled = Boolean(gallery.moderation_enabled);
            await refreshCurrentEvent();
        } catch (err) {
            showToast(`Не удалось обновить настройки галереи: ${err.message}`, 'error');
        } finally {
            moderationToggle.disabled = false;
        }
    });
}

if (deleteEventBtn) {
    deleteEventBtn.addEventListener('click', async () => {
        const currentEvent = getCurrentEvent();
        if (!currentEvent) return;
        if (!confirm(`Удалить мероприятие «${currentEvent.name}»? Это действие нельзя отменить.`)) return;

        try {
            await deleteCurrentEvent();
        } catch (err) {
            showToast(`Не удалось удалить мероприятие: ${err.message}`, 'error');
        }
    });
}

if (fileBtn) {
    fileBtn.addEventListener('click', () => {
        history.pushState(null, '', '#home');
        viewEvent?.classList.add('view--hidden');
        viewUserEvent?.classList.add('view--hidden');
        viewList?.classList.remove('view--hidden');
        currentEventId = null;
        loadEventsFromBackend();
    });
}

if (openModalBtn) {
    openModalBtn.addEventListener('click', () => {
        modal.classList.add('active');
    });
}

if (closeModalBtn) {
    closeModalBtn.addEventListener('click', () => {
        if (!isGateActive()) {
            modal.classList.remove('active');
        }
    });
}

if (modal) {
    modal.addEventListener('click', (event) => {
        if (event.target === modal && !isGateActive()) {
            modal.classList.remove('active');
        }
    });
}

if (gallerySort) {
    gallerySort.addEventListener('click', (e) => {
        const btn = e.target.closest('.gallery-sort__btn');
        if (!btn) return;
        const order = btn.dataset.sort;
        if (order === photosSortOrder) return;
        photosSortOrder = order;
        gallerySort.querySelectorAll('.gallery-sort__btn').forEach((button) => {
            button.classList.toggle('gallery-sort__btn--active', button.dataset.sort === order);
        });
        const currentEvent = getCurrentEvent();
        if (currentEvent) renderGallery(currentEvent);
    });
}

if (mobileBurger) {
    mobileBurger.addEventListener('click', openMobileSidebar);
}

if (sidebarOverlay) {
    sidebarOverlay.addEventListener('click', closeMobileSidebar);
}

if (closeLoginModalBtn) {
    closeLoginModalBtn.addEventListener('click', () => {
        if (!isGateActive()) {
            loginModal.classList.remove('active');
        }
    });
}

if (loginModal) {
    loginModal.addEventListener('click', (e) => {
        if (e.target === loginModal && !isGateActive()) {
            loginModal.classList.remove('active');
        }
    });
}

if (switchToRegisterLink) {
    switchToRegisterLink.addEventListener('click', (e) => {
        e.preventDefault();
        loginModal.classList.remove('active');
        modal.classList.add('active');
    });
}

if (switchToLoginLink) {
    switchToLoginLink.addEventListener('click', (e) => {
        e.preventDefault();
        modal.classList.remove('active');
        loginModal.classList.add('active');
    });
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

if (lightbox) {
    lightbox.addEventListener('click', (e) => {
        if (e.target === lightbox) {
            closeLightbox();
        }
    });
}

document.addEventListener('keydown', (e) => {
    if (!lightbox.classList.contains('active')) return;

    if (e.key === 'Escape') closeLightbox();
    if (e.key === 'ArrowLeft') lightboxGoPrev();
    if (e.key === 'ArrowRight') lightboxGoNext();
});

// Touch swipe for lightbox (left/right = nav, down = close)
if (lightbox) {
    let _touchStartX = 0;
    let _touchStartY = 0;

    lightbox.addEventListener('touchstart', (e) => {
        _touchStartX = e.changedTouches[0].clientX;
        _touchStartY = e.changedTouches[0].clientY;
    }, { passive: true });

    lightbox.addEventListener('touchend', (e) => {
        const dx = e.changedTouches[0].clientX - _touchStartX;
        const dy = e.changedTouches[0].clientY - _touchStartY;

        if (Math.abs(dx) > Math.abs(dy) && Math.abs(dx) > 50) {
            if (dx < 0) lightboxGoNext();
            else lightboxGoPrev();
        } else if (dy > 80 && Math.abs(dy) > Math.abs(dx)) {
            closeLightbox();
        }
    }, { passive: true });
}

function parseRoute() {
    const hash = window.location.hash.replace(/^#\/?/, '');
    if (!hash || hash === 'home') return { page: 'home' };
    if (hash === 'login') return { page: 'login' };
    const parts = hash.split('/');
    if (parts[0] === 'event' && parts[1]) {
        return parts[2] === 'participant'
            ? { page: 'user-event', id: parts[1] }
            : { page: 'event', id: parts[1] };
    }
    return { page: 'home' };
}

window.addEventListener('popstate', async () => {
    if (!auth.isLoggedIn()) return;
    const route = parseRoute();
    if (route.page === 'event') {
        await openEvent(route.id, { addHistory: false });
    } else if (route.page === 'user-event') {
        await openUserEvent(route.id, { addHistory: false });
    } else {
        viewEvent?.classList.add('view--hidden');
        viewUserEvent?.classList.add('view--hidden');
        viewList?.classList.remove('view--hidden');
        currentEventId = null;
        await loadEventsFromBackend();
    }
});

window.addEventListener('eventsnap:auth-changed', async () => {
    if (!auth.isLoggedIn()) {
        events = [];
        currentEventId = null;
        renderEvents();
        return;
    }

    await joinFromLocationIfNeeded();

    if (!currentEventId) {
        await loadEventsFromBackend();
    }
});

document.addEventListener('DOMContentLoaded', async () => {
    setSidebarButtonLabels();
    renderEvents();

    if (!window.location.hash) {
        history.replaceState(null, '', '#home');
    }

    if (auth.isLoggedIn()) {
        await joinFromLocationIfNeeded();
        await loadEventsFromBackend();

        const route = parseRoute();
        if (route.page === 'event') {
            await openEvent(route.id, { addHistory: false });
        } else if (route.page === 'user-event') {
            await openUserEvent(route.id, { addHistory: false });
        }
    }
});

// Prevent main-content scroll when any modal or overlay is open
(function initScrollLock() {
    const mainContent = document.querySelector('.main-content');
    const allModals = document.querySelectorAll('.modal, .lightbox, #editorModal');
    const observer = new MutationObserver(() => {
        const anyOpen = Array.from(allModals).some(m => m.classList.contains('active'));
        mainContent?.classList.toggle('modal-open', anyOpen);
    });
    allModals.forEach(m => observer.observe(m, { attributes: true, attributeFilter: ['class'] }));
})();
