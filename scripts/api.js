class ApiError extends Error {
    constructor(message, status, data = null) {
        super(message);
        this.name = 'ApiError';
        this.status = status;
        this.data = data;
    }
}

const api = {
    get baseUrl() {
        return CONFIG.API_URL.replace(/\/$/, '');
    },

    getAccessToken() {
        return localStorage.getItem(CONFIG.TOKEN_KEY);
    },

    getRefreshToken() {
        return localStorage.getItem(CONFIG.REFRESH_TOKEN_KEY);
    },

    saveTokens(tokens) {
        if (!tokens) return;

        if (tokens.access_token) {
            localStorage.setItem(CONFIG.TOKEN_KEY, tokens.access_token);
        }

        if (tokens.refresh_token) {
            localStorage.setItem(CONFIG.REFRESH_TOKEN_KEY, tokens.refresh_token);
        }
    },

    clearTokens() {
        localStorage.removeItem(CONFIG.TOKEN_KEY);
        localStorage.removeItem(CONFIG.REFRESH_TOKEN_KEY);
    },

    buildUrl(path, query = null) {
        const url = new URL(`${this.baseUrl}${path}`);

        if (query) {
            Object.entries(query).forEach(([key, value]) => {
                if (value !== undefined && value !== null && value !== '') {
                    url.searchParams.set(key, value);
                }
            });
        }

        return url.toString();
    },

    async request(path, options = {}) {
        const {
            method = 'GET',
            body,
            query,
            headers = {},
            auth = true,
            retryOnUnauthorized = true,
        } = options;

        const requestHeaders = { ...headers };

        if (body !== undefined && !(body instanceof FormData) && !requestHeaders['Content-Type']) {
            requestHeaders['Content-Type'] = 'application/json';
        }

        if (auth) {
            const token = this.getAccessToken();
            if (token) {
                requestHeaders.Authorization = `Bearer ${token}`;
            }
        }

        const response = await fetch(this.buildUrl(path, query), {
            method,
            headers: requestHeaders,
            body: body === undefined || body instanceof FormData ? body : JSON.stringify(body),
        });

        if (response.status === 401 && auth && retryOnUnauthorized && await this.refresh()) {
            return this.request(path, {
                method,
                body,
                query,
                headers,
                auth,
                retryOnUnauthorized: false,
            });
        }

        if (response.status === 204) {
            return null;
        }

        const data = await this.parseResponse(response);

        if (!response.ok) {
            throw new ApiError(this.formatError(data, response.status), response.status, data);
        }

        return data;
    },

    async parseResponse(response) {
        const contentType = response.headers.get('content-type') || '';

        if (contentType.includes('application/json')) {
            return response.json();
        }

        const text = await response.text();
        return text ? { detail: text } : null;
    },

    formatError(data, status) {
        if (!data) {
            return `Ошибка запроса (${status})`;
        }

        if (typeof data.detail === 'string') {
            return data.detail;
        }

        if (Array.isArray(data.detail)) {
            return data.detail
                .map((item) => {
                    const field = Array.isArray(item.loc) ? item.loc.slice(1).join('.') : '';
                    return field ? `${field}: ${item.msg}` : item.msg;
                })
                .join('\n');
        }

        if (typeof data.message === 'string') {
            return data.message;
        }

        return `Ошибка запроса (${status})`;
    },

    async refresh() {
        const refreshToken = this.getRefreshToken();

        if (!refreshToken) {
            return false;
        }

        try {
            const response = await fetch(this.buildUrl('/auth/refresh'), {
                method: 'POST',
                headers: { 'Content-Type': 'application/json' },
                body: JSON.stringify({ refresh_token: refreshToken }),
            });

            if (!response.ok) {
                throw new Error('refresh failed');
            }

            const tokens = await response.json();
            this.saveTokens(tokens);
            return true;
        } catch (err) {
            this.clearTokens();
            localStorage.removeItem(CONFIG.USER_KEY);
            window.dispatchEvent(new CustomEvent('eventsnap:auth-expired'));
            return false;
        }
    },

    async uploadToPresignedUrl(uploadUrl, file) {
        const response = await fetch(uploadUrl, {
            method: 'PUT',
            headers: {
                'Content-Type': file.type || 'application/octet-stream',
            },
            body: file,
        });

        if (!response.ok) {
            const text = await response.text().catch(() => '');
            throw new ApiError(text || 'Не удалось загрузить файл в хранилище', response.status);
        }
    },

    auth: {
        register(payload) {
            return api.request('/auth/register', {
                method: 'POST',
                body: payload,
                auth: false,
            });
        },

        login(payload) {
            return api.request('/auth/login', {
                method: 'POST',
                body: payload,
                auth: false,
            });
        },

        me() {
            return api.request('/auth/me');
        },
    },

    events: {
        list(params = {}) {
            return api.request('/events', {
                query: {
                    role: params.role || 'all',
                    limit: params.limit || 50,
                    offset: params.offset || 0,
                },
            });
        },

        get(eventId) {
            return api.request(`/events/${eventId}`);
        },

        create(payload) {
            return api.request('/events', {
                method: 'POST',
                body: payload,
            });
        },

        update(eventId, payload) {
            return api.request(`/events/${eventId}`, {
                method: 'PATCH',
                body: payload,
            });
        },

        delete(eventId) {
            return api.request(`/events/${eventId}`, {
                method: 'DELETE',
            });
        },

        join(qrToken) {
            return api.request('/events/join', {
                method: 'POST',
                body: { qr_token: qrToken },
            });
        },

        joinLink(eventId) {
            return api.request(`/events/${eventId}/join-link`);
        },

        participants(eventId, params = {}) {
            return api.request(`/events/${eventId}/participants`, {
                query: {
                    limit: params.limit || 100,
                    offset: params.offset || 0,
                },
            });
        },

        createCoverUploadUrl(eventId, contentType) {
            return api.request(`/events/${eventId}/cover/upload-url`, {
                method: 'POST',
                body: { content_type: contentType },
            });
        },

        completeCoverUpload(eventId, s3Key) {
            return api.request(`/events/${eventId}/cover/complete`, {
                method: 'POST',
                body: { s3_key: s3Key },
            });
        },
    },

    gallery: {
        get(eventId) {
            return api.request(`/events/${eventId}/gallery`);
        },

        update(eventId, payload) {
            return api.request(`/events/${eventId}/gallery`, {
                method: 'PATCH',
                body: payload,
            });
        },
    },

    photos: {
        list(eventId, params = {}) {
            return api.request(`/events/${eventId}/photos`, {
                query: {
                    limit: params.limit || 100,
                    offset: params.offset || 0,
                },
            });
        },

        pending(eventId, params = {}) {
            return api.request(`/events/${eventId}/photos/pending`, {
                query: {
                    limit: params.limit || 100,
                    offset: params.offset || 0,
                },
            });
        },

        pendingCount(eventId) {
            return api.request(`/events/${eventId}/photos/pending/count`);
        },

        createUploadUrl(eventId, file, size = {}) {
            return api.request(`/events/${eventId}/photos/upload-url`, {
                method: 'POST',
                body: {
                    filename: file.name,
                    content_type: file.type || 'image/jpeg',
                    file_size_bytes: file.size || null,
                    width_px: size.width || null,
                    height_px: size.height || null,
                },
            });
        },

        delete(photoId) {
            return api.request(`/photos/${photoId}`, {
                method: 'DELETE',
            });
        },

        approve(photoId, comment = null) {
            return api.request(`/photos/${photoId}/approve`, {
                method: 'POST',
                body: { comment },
            });
        },

        reject(photoId, comment) {
            return api.request(`/photos/${photoId}/reject`, {
                method: 'POST',
                body: { comment },
            });
        },
    },
};
