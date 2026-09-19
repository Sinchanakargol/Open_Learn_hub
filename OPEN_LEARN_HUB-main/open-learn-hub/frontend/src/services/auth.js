import api from './api'

export const loginApi = (email, password) => api.post('/auth/login', { email, password })
export const registerApi = (name, email, password, role) => api.post('/auth/register', { name, email, password, role })
export const meApi = () => api.get('/auth/me')
