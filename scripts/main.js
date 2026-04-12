const sidebar = document.getElementById('sidebar');
const toggleBtn = document.getElementById('sidebarToggle');

console.log('sidebar:', sidebar);
console.log('toggleBtn:', toggleBtn);

toggleBtn.addEventListener('click', () => {
    sidebar.classList.toggle('sidebar--expanded');
    console.log('toggled:', sidebar.classList.contains('sidebar--expanded'));
});
