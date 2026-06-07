import axios from 'axios'

const api = axios.create({
  baseURL: '/api',
  headers: { 'Content-Type': 'application/json' }
})

export const authApi = {
  register: (data) => api.post('/auth/register', data),
  login:    (data) => api.post('/auth/login', data),
  getUser:  (id)   => api.get(`/auth/user/${id}`),
}

export const kycApi = {
  // Usuario sube sus documentos (multipart)
  submitDocuments: (userId, formData) =>
    api.post(`/kyc/submit/${userId}`, formData, {
      headers: { 'Content-Type': 'multipart/form-data' }
    }),
  // Polling del estado
  getStatus: (userId) => api.get(`/kyc/status/${userId}`),
}

export const adminApi = {
  // Listar usuarios (filtrado por status opcional)
  listUsers: (status = '') =>
    api.get('/admin/kyc/users', { params: status ? { status } : {} }),
  // Tomar decisión sobre un usuario
  decide: (userId, decision, rejectReason = '', adminComment = '') =>
    api.post(`/admin/kyc/decide/${userId}`, { decision, rejectReason, adminComment }),
  // URL para ver documento de un usuario (se usa directo en <img src>)
  documentUrl: (userId, tipo) => `/api/admin/kyc/document/${userId}/${tipo}`,
}
