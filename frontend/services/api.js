import axios from 'axios'
import { getToken, clearAuth } from '../lib/auth'

const api = axios.create({
  baseURL: process.env.NEXT_PUBLIC_API_URL || 'http://localhost:3001',
})

api.interceptors.request.use((config) => {
  const token = getToken()
  if (token) config.headers.Authorization = `Bearer ${token}`
  return config
})

api.interceptors.response.use(
  (res) => res,
  (err) => {
    if (err.response?.status === 401) {
      const isPublicPage = ['/booking', '/confirmation'].some((p) =>
        window.location.pathname.startsWith(p)
      )
      if (!isPublicPage) {
        clearAuth()
        window.location.href = '/login'
      }
    }
    return Promise.reject(err)
  }
)

export default api
