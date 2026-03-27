// Auth
export interface User {
  id: string
  email: string
  name: string
  role: 'admin' | 'agent' | 'manager'
  avatar?: string
}

export interface AuthState {
  user: User | null
  token: string | null
  isAuthenticated: boolean
  isLoading: boolean
}

export interface LoginCredentials {
  email: string
  password: string
}

export interface LoginResponse {
  access_token: string
  user: User
}

// Generic API
export interface ApiError {
  message: string
  statusCode: number
  errors?: Record<string, string[]>
}

export interface PaginatedResponse<T> {
  data: T[]
  total: number
  page: number
  pageSize: number
  totalPages: number
}

// Table
export interface Column<T = Record<string, unknown>> {
  key: string
  header: string
  render?: (value: unknown, row: T) => React.ReactNode
  sortable?: boolean
  width?: string
}

// Theme
export type Theme = 'light' | 'dark'

// Navigation
export interface NavItem {
  label: string
  path: string
  icon: React.ComponentType<{ size?: number; className?: string }>
  children?: NavItem[]
}
