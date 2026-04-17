// Хранилище событий в localStorage
const storage = {
    EVENTS_KEY: 'eventsnap_events',
    NEXT_ID_KEY: 'eventsnap_next_id',

    loadEvents() {
        try {
            const raw = localStorage.getItem(this.EVENTS_KEY);
            return raw ? JSON.parse(raw) : [];
        } catch (err) {
            console.error('Ошибка загрузки событий:', err);
            return [];
        }
    },

    saveEvents(events) {
        try {
            localStorage.setItem(this.EVENTS_KEY, JSON.stringify(events));
        } catch (err) {
            console.error('Ошибка сохранения событий:', err);
        }
    },

    loadNextId() {
        const raw = localStorage.getItem(this.NEXT_ID_KEY);
        return raw ? parseInt(raw, 10) : 1;
    },

    saveNextId(id) {
        localStorage.setItem(this.NEXT_ID_KEY, String(id));
    },
};