const sidebar = document.getElementById('sidebar');
const toggleBtn = document.getElementById('sidebarToggle');

console.log('sidebar:', sidebar);
console.log('toggleBtn:', toggleBtn);

toggleBtn.addEventListener('click', () => {
    sidebar.classList.toggle('sidebar--expanded');
    console.log('toggled:', sidebar.classList.contains('sidebar--expanded'));
});
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

