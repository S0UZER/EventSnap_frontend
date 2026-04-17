// ===== Хранилище токена =====
const auth = {
    getToken() {
        return localStorage.getItem(CONFIG.TOKEN_KEY);
    },
    getUser() {
        const raw = localStorage.getItem(CONFIG.USER_KEY);
        return raw ? JSON.parse(raw) : null;
    },
    isLoggedIn() {
        return !!this.getToken();
    },
    saveSession(token, user) {
        localStorage.setItem(CONFIG.TOKEN_KEY, token);
        localStorage.setItem(CONFIG.USER_KEY, JSON.stringify(user));
    },
    logout() {
        localStorage.removeItem(CONFIG.TOKEN_KEY);
        localStorage.removeItem(CONFIG.USER_KEY);
    },
};

// ===== Мок API (пока бэка нет) =====
// Когда бэк будет готов — заменим тело функций на fetch()
const mockApi = {
    login(email, password) {
        return new Promise((resolve, reject) => {
            setTimeout(() => {
                if (!email || !password) {
                    reject(new Error('Заполните email и пароль'));
                    return;
                }
                // имитация успешного логина
                resolve({
                    token: 'mock_token_' + Date.now(),
                    user: { email, name: email.split('@')[0] },
                });
            }, 300);
        });
    },
    register(email, password) {
        return new Promise((resolve, reject) => {
            setTimeout(() => {
                if (!email || !password) {
                    reject(new Error('Заполните email и пароль'));
                    return;
                }
                resolve({
                    token: 'mock_token_' + Date.now(),
                    user: { email, name: email.split('@')[0] },
                });
            }, 300);
        });
    },
};

// ===== Auth Gate =====
// Блокирует модалку от закрытия пока юзер не залогинен
let authGateActive = false;

function openAuthGate() {
    authGateActive = true;
    const loginModal = document.getElementById('loginModal');
    loginModal.classList.add('active');
    // скрываем кнопку "назад" — некуда возвращаться
    const closeBtn = document.getElementById('closeLoginModal');
    if (closeBtn) closeBtn.style.display = 'none';
}

function closeAuthGate() {
    authGateActive = false;
    document.getElementById('loginModal').classList.remove('active');
    document.getElementById('modal').classList.remove('active');
    // возвращаем кнопку "назад"
    const closeBtn = document.getElementById('closeLoginModal');
    if (closeBtn) closeBtn.style.display = '';
}

// Блокируем закрытие модалок по клику на затемнение пока gate активен
function isGateActive() {
    return authGateActive;
}

// ===== Обновление UI по статусу логина =====
function updateAuthUI() {
    const authBlock = document.querySelector('.auth');
    if (!authBlock) return;

    const user = auth.getUser();
    if (user) {
        // Залогинен — показываем имя и выход
        authBlock.innerHTML = `
            <span class="auth__user">${user.name}</span>
            <button class="auth__btn auth__btn--login" id="logoutBtn">Выйти</button>
        `;
        document.getElementById('logoutBtn').addEventListener('click', () => {
            auth.logout();
            updateAuthUI();
            openAuthGate();
        });
    } else {
        // Не залогинен — кнопки входа и регистрации
        authBlock.innerHTML = `
            <button class="auth__btn auth__btn--login" id="openLoginBtn">Войти</button>
            <button class="auth__btn auth__btn--register" id="openRegisterBtn">Регистрация</button>
        `;
        document.getElementById('openLoginBtn').addEventListener('click', () => {
            document.getElementById('loginModal').classList.add('active');
        });
        document.getElementById('openRegisterBtn').addEventListener('click', () => {
            document.getElementById('modal').classList.add('active');
        });
    }
}

// ===== Обработка форм =====
function setupAuthForms() {
    // Форма входа
    const loginForm = document.getElementById('loginForm');
    if (loginForm) {
        loginForm.addEventListener('submit', async (e) => {
            e.preventDefault();
            const email = loginForm.querySelector('input[type="email"]').value;
            const password = loginForm.querySelector('input[type="password"]').value;
            try {
                const { token, user } = await mockApi.login(email, password);
                auth.saveSession(token, user);
                closeAuthGate();
                updateAuthUI();
            } catch (err) {
                alert(err.message);
            }
        });
    }

    // Форма регистрации
    const registerForm = document.querySelector('#modal .modal__form');
    if (registerForm) {
        registerForm.addEventListener('submit', async (e) => {
            e.preventDefault();
            const inputs = registerForm.querySelectorAll('input');
            const email = inputs[0].value;
            const password = inputs[1].value;
            const passwordRepeat = inputs[2].value;
            if (password !== passwordRepeat) {
                alert('Пароли не совпадают');
                return;
            }
            try {
                const { token, user } = await mockApi.register(email, password);
                auth.saveSession(token, user);
                closeAuthGate();
                updateAuthUI();
            } catch (err) {
                alert(err.message);
            }
        });
    }
}

// ===== Запуск при загрузке страницы =====
document.addEventListener('DOMContentLoaded', () => {
    updateAuthUI();
    setupAuthForms();

    if (!auth.isLoggedIn()) {
        openAuthGate();
    }
});