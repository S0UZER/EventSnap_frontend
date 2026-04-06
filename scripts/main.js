const sidebar = document.querySelector('.sidebar');
const collapseBtn = document.getElementById('sidebarCollapse');

collapseBtn?.addEventListener('click', () => {
    sidebar.classList.toggle('collapsed');
});
