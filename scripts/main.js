const sidebar = document.getElementById('sidebar');
const toggleBtn = document.getElementById('sidebarToggle');
const addBtn = document.querySelector('.sidebar__btn--add');

console.log('sidebar:', sidebar);
console.log('toggleBtn:', toggleBtn);

toggleBtn.addEventListener('click', () => {
    sidebar.classList.toggle('sidebar--expanded');
    console.log('toggled:', sidebar.classList.contains('sidebar--expanded'));
});
// === МОДАЛКА СОЗДАТЬ МЕРОПРИЯТИЕ ===
const openCreateModal = document.getElementById('openCreateModal');
const createModal = document.getElementById('createModal');
const closeCreateModal = document.getElementById('closeCreateModal');

if (openCreateModal) {
    openCreateModal.addEventListener('click', () => {
        createModal.classList.add('active');
    });
}
if (closeCreateModal) {
    closeCreateModal.addEventListener('click', () => {
        createModal.classList.remove('active');
    });
}
if (createModal) {
    createModal.addEventListener('click', (e) => {
        if (e.target === createModal) createModal.classList.remove('active');
    });
}

// ===== СОЗДАТЬ МЕРОПРИЯТИЕ =====
const createForm = createModal?.querySelector('.create-modal__form');
const eventsGrid = document.getElementById('eventsGrid');
const viewList = document.getElementById('viewList');
const viewEvent = document.getElementById('viewEvent');
const eventTitle = document.getElementById('eventTitle');
const photosGrid = document.getElementById('photosGrid');
const photoInput = document.getElementById('photoInput');
const backToList = document.getElementById('backToList');

function openEvent(name) {
    eventTitle.textContent = name;
    photosGrid.innerHTML = '';
    viewList.classList.add('view--hidden');
    viewEvent.classList.remove('view--hidden');
}

if (backToList) {
    backToList.addEventListener('click', () => {
        viewEvent.classList.add('view--hidden');
        viewList.classList.remove('view--hidden');
    });
}

// Зелёная кнопка — добавить фото если открыто мероприятие
if (addBtn) {
    addBtn.addEventListener('click', () => {
        if (!viewEvent.classList.contains('view--hidden')) {
            photoInput.click();
        }
    });
}

if (photoInput) {
    photoInput.addEventListener('change', () => {
        Array.from(photoInput.files).forEach(file => {
            if (!file.type.match(/image\/(jpeg|png)/)) return;
            const url = URL.createObjectURL(file);
            const item = document.createElement('div');
            item.className = 'photo-item';
            item.innerHTML = `<img src="${url}" alt="${file.name}">`;
            photosGrid.appendChild(item);
        });
        photoInput.value = '';
    });
}

if (createForm) {
    createForm.addEventListener('submit', (e) => {
        e.preventDefault();
        const inputs = createForm.querySelectorAll('.create-modal__input');
        const name = inputs[0].value.trim() || 'Без названия';

        const card = document.createElement('div');
        card.className = 'event-card';
        card.innerHTML = `
            <div class="event-card__img"></div>
            <span class="event-card__name">${name}</span>
        `;
        card.addEventListener('click', () => openEvent(name));

        eventsGrid.appendChild(card);
        createForm.reset();
        createModal.classList.remove('active');
    });
}

// === МОДАЛКА РЕГИСТРАЦИИ ===
const openModalBtn = document.getElementById("openModal");
const modal = document.getElementById("modal");
const closeModalBtn = document.getElementById("closeModal");

// открыть модалку
if (openModalBtn) {
    openModalBtn.addEventListener("click", () => {
        modal.classList.add("active");
    });
}

// закрыть по стрелке
if (closeModalBtn) {
    closeModalBtn.addEventListener("click", () => {
        modal.classList.remove("active");
    });
}

// закрыть по клику вне окна
if (modal) {
    modal.addEventListener("click", (e) => {
        if (e.target === modal) {
            modal.classList.remove("active");
        }
    });
}

