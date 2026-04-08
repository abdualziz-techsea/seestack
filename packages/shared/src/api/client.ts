import axios from 'axios'

// In development with Vite proxy, use empty baseURL so requests like /api/v1/...
// go through the proxy. In production, use the configured API URL.
const BASE_URL = import.meta.env?.VITE_API_URL ?? ''

export const apiClient = axios.create({
  baseURL: BASE_URL,
  headers: { 'Content-Type': 'application/json' },
  timeout: 10_000,
})

// Request interceptor — attach JWT
apiClient.interceptors.request.use((config) => {
  const token = localStorage.getItem('seestack_token')
  if (token) config.headers.Authorization = `Bearer ${token}`
  return config
})

// Response interceptor — unwrap backend wrapper { success, data, meta }
apiClient.interceptors.response.use(
  (response) => {
    if (response.data && typeof response.data === 'object' && 'success' in response.data) {
      response.data = response.data.data
    }
    return response
  },
  (error) => {
    if (error.response?.status === 401) {
      localStorage.removeItem('seestack_token')
      window.location.href = '/login'
    }
    return Promise.reject(error.response?.data ?? error)
  }
)

// Ingest client — uses API key instead of JWT
export const ingestClient = axios.create({
  baseURL: BASE_URL,
  headers: { 'Content-Type': 'application/json' },
  timeout: 3_000,
})
