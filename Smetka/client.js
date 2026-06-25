import axios from 'axios'

const api = axios.create({
    baseURL: 'http://localhost:5000/api'
})

// Автоматично добавя JWT токена към всяка заявка
api.interceptors.request.use(config => {
    const token = localStorage.getItem('token')
    if (token) config.headers.Authorization = `Bearer ${token}`
    return config
})

// При 401 — изчиства токена и праща към login
api.interceptors.response.use(
    response => response,
    error => {
        if (error.response?.status === 401) {
            localStorage.removeItem('token')
            localStorage.removeItem('user')
            window.location.href = '/login'
        }
        return Promise.reject(error)
    }
)

// ── Auth ──────────────────────────────────────────────────────────────────────
export const authApi = {
    register: (data) => api.post('/auth/register', data),
    login: (data) => api.post('/auth/login', data),
}

// ── Bills ─────────────────────────────────────────────────────────────────────
export const billsApi = {
    getAll: (type) => api.get('/bills', { params: { type } }),
    getSummary: () => api.get('/bills/summary'),
    create: (data) => api.post('/bills', data),
    delete: (id) => api.delete(`/bills/${id}`),
}

// ── Chat ──────────────────────────────────────────────────────────────────────
export const chatApi = {
    send: (message) => api.post('/chat', { message }),
    getHistory: (limit) => api.get('/chat/history', { params: { limit } }),
    clearHistory: () => api.delete('/chat/history'),
}