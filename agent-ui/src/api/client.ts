import axios from 'axios'
import { authme } from '../lib/authme'

const BASE_URL = import.meta.env.VITE_API_URL ?? 'http://localhost:3000'

export const apiClient = axios.create({
  baseURL: BASE_URL,
  headers: {
    'Content-Type': 'application/json',
  },
})

// Request interceptor — inject Bearer token + remap pageSize→limit
apiClient.interceptors.request.use(
  (config) => {
    const token = authme.getAccessToken()
    if (token) {
      config.headers.Authorization = `Bearer ${token}`
    }
    // API uses 'limit' not 'pageSize' for pagination
    if (config.params?.pageSize != null) {
      config.params.limit = config.params.pageSize
      delete config.params.pageSize
    }
    return config
  },
  (error) => Promise.reject(error),
)

// Response interceptor — handle 401
apiClient.interceptors.response.use(
  (response) => response,
  (error) => {
    if (error.response?.status === 401) {
      window.location.href = '/login'
    }
    return Promise.reject(error)
  },
)

export default apiClient
