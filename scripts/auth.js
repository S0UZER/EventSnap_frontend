const auth = {
    getToken() {
        return localStorage.getItem(CONFIG.TOKEN_KEY);
    },

    getRefreshToken() {
        return localStorage.getItem(CONFIG.REFRESH_TOKEN_KEY);
    },

    getUser() {
        const raw = localStorage.getItem(CONFIG.USER_KEY);

        if (!raw) {
            return null;
        }

        try {
            return JSON.parse(raw);
        } catch (err) {
            console.error('[auth] failed to parse stored user', err);
            localStorage.removeItem(CONFIG.USER_KEY);
            return null;
        }
    },

    isLoggedIn() {
        return Boolean(this.getToken());
    },

    saveSession(tokens, user) {
        api.saveTokens(tokens);
        localStorage.setItem(CONFIG.USER_KEY, JSON.stringify(user));
        window.dispatchEvent(new CustomEvent('eventsnap:auth-changed'));
    },

    logout() {
        api.clearTokens();
        localStorage.removeItem(CONFIG.USER_KEY);
        window.dispatchEvent(new CustomEvent('eventsnap:auth-changed'));
    },

    getDisplayName(user = this.getUser()) {
        if (!user) {
            return '';
        }

        return user.display_name || user.name || user.email || '';
    },

    async loadMe() {
        const user = await api.auth.me();
        localStorage.setItem(CONFIG.USER_KEY, JSON.stringify(user));
        updateAuthUI();
        window.dispatchEvent(new CustomEvent('eventsnap:auth-changed'));
        return user;
    },
};

let authGateActive = false;

function openAuthGate() {
    authGateActive = true;
    const loginModal = document.getElementById('loginModal');
    const closeBtn = document.getElementById('closeLoginModal');

    loginModal?.classList.add('active');

    if (closeBtn) {
        closeBtn.style.display = 'none';
    }

    history.replaceState(null, '', '#login');
}

function closeAuthGate() {
    authGateActive = false;
    document.getElementById('loginModal')?.classList.remove('active');
    document.getElementById('modal')?.classList.remove('active');

    const closeBtn = document.getElementById('closeLoginModal');
    if (closeBtn) {
        closeBtn.style.display = '';
    }

    if (window.location.hash === '#login') {
        history.replaceState(null, '', '#home');
    }
}

function isGateActive() {
    return authGateActive;
}

function setButtonLoading(button, isLoading, loadingText) {
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

function updateAuthUI() {
    const authBlock = document.querySelector('.auth');
    if (!authBlock) return;

    const user = auth.getUser();

    if (user) {
        authBlock.innerHTML = `
            <span class="auth__user"></span>
            <button class="auth__btn auth__btn--login" id="logoutBtn" type="button">Выйти</button>
        `;
        authBlock.querySelector('.auth__user').textContent = auth.getDisplayName(user);
        document.getElementById('logoutBtn').addEventListener('click', () => {
            auth.logout();
            updateAuthUI();
            openAuthGate();
        });
        return;
    }

    authBlock.innerHTML = `
        <button class="auth__btn auth__btn--login" id="openLoginBtn" type="button">Войти</button>
        <button class="auth__btn auth__btn--register" id="openRegisterBtn" type="button">Регистрация</button>
    `;
    document.getElementById('openLoginBtn').addEventListener('click', () => {
        document.getElementById('loginModal')?.classList.add('active');
    });
    document.getElementById('openRegisterBtn').addEventListener('click', () => {
        document.getElementById('modal')?.classList.add('active');
    });
}

function setupAuthForms() {
    const loginForm = document.getElementById('loginForm');

    if (loginForm) {
        loginForm.addEventListener('submit', async (e) => {
            e.preventDefault();

            const email = loginForm.querySelector('input[type="email"]').value.trim();
            const password = loginForm.querySelector('input[type="password"]').value;
            const submitButton = loginForm.querySelector('button[type="submit"]');

            setButtonLoading(submitButton, true, 'Входим...');

            try {
                const { tokens, user } = await api.auth.login({ email, password });
                auth.saveSession(tokens, user);
                closeAuthGate();
                updateAuthUI();
            } catch (err) {
                showToast(err.message || 'Ошибка входа', 'error');
            } finally {
                setButtonLoading(submitButton, false);
            }
        });
    }

    const registerForm = document.querySelector('#modal .modal__form');

    if (registerForm) {
        registerForm.addEventListener('submit', async (e) => {
            e.preventDefault();

            const inputs = registerForm.querySelectorAll('input');
            const email = inputs[0].value.trim();
            const password = inputs[1].value;
            const passwordRepeat = inputs[2].value;
            const displayName = email.split('@')[0] || 'Пользователь';
            const submitButton = registerForm.querySelector('button[type="submit"]');

            if (password !== passwordRepeat) {
                showToast('Пароли не совпадают', 'error');
                return;
            }

            setButtonLoading(submitButton, true, 'Регистрируем...');

            try {
                const { tokens, user } = await api.auth.register({
                    email,
                    password,
                    display_name: displayName,
                });
                auth.saveSession(tokens, user);
                closeAuthGate();
                updateAuthUI();
            } catch (err) {
                showToast(err.message || 'Ошибка регистрации', 'error');
            } finally {
                setButtonLoading(submitButton, false);
            }
        });
    }
}

window.addEventListener('eventsnap:auth-expired', () => {
    updateAuthUI();
    openAuthGate();
});

document.addEventListener('DOMContentLoaded', async () => {
    setupAuthForms();

    if (!auth.isLoggedIn()) {
        updateAuthUI();
        openAuthGate();
        return;
    }

    try {
        await auth.loadMe();
        closeAuthGate();
    } catch (err) {
        auth.logout();
        updateAuthUI();
        openAuthGate();
    }
});
