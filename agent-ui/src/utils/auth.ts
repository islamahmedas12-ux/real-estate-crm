import type { User } from '../types'

export function loadStoredAuth(): { user: User | null; token: string | null } {
  try {
    const token = localStorage.getItem('access_token')
    const userRaw = localStorage.getItem('user')
    const user: User | null = userRaw ? JSON.parse(userRaw) : null
    return { token, user }
  } catch {
    return { token: null, user: null }
  }
}
