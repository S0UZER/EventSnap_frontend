(function () {
    function getStack() {
        return document.getElementById('toastStack');
    }

    function showToast(message, type, duration) {
        type = type || 'info';
        duration = duration || 3500;

        const el = document.createElement('div');
        el.className = 'toast toast--' + type;
        el.textContent = message;
        getStack()?.appendChild(el);

        requestAnimationFrame(() => el.classList.add('toast--visible'));

        setTimeout(function () {
            el.classList.remove('toast--visible');
            el.addEventListener('transitionend', function () { el.remove(); }, { once: true });
        }, duration);
    }

    window.showToast = showToast;
})();
