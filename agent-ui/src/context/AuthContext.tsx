import React, { createContext, useContext } from 'react'
import { AuthProvider as AuthmeProvider, useAuth as useAuthme, useUser } from 'authme-sdk/react'
import { authme } from '../lib/authme'
import type { User } from '../types'

interface AuthContextValue {
  user: User | null
  token: string | null
  isAuthenticated: boolean
  isLoading: boolean
  login: () => Promise<void>
  logout: () => void
}

const AuthContext = createContext<AuthContextValue | null>(null)

function AuthContextBridge({ children }: { children: React.ReactNode }) {
  const { isAuthenticated, isLoading, login, logout, getToken } = useAuthme()
  const authmeUser = useUser()

  // Map AuthMe user profile to our internal User type
  const user: User | null = authmeUser
    ? {
        id: authmeUser.sub ?? '',
        email: authmeUser.email ?? '',
        name: authmeUser.name ?? authmeUser.preferred_username ?? '',
        role: ((authmeUser as Record<string, unknown>)['role'] as 'admin' | 'agent' | 'manager') ?? 'agent',
      }
    : null

  const token = getToken?.() ?? null

  return (
    <AuthContext.Provider
      value={{
        user,
        token,
        isAuthenticated,
        isLoading,
        login: () => login(),
        logout,
      }}
    >
      {children}
    </AuthContext.Provider>
  )
}

export function AuthProvider({ children }: { children: React.ReactNode }) {
  return (
    <AuthmeProvider client={authme}>
      <AuthContextBridge>{children}</AuthContextBridge>
    </AuthmeProvider>
  )
}

export function useAuth(): AuthContextValue {
  const ctx = useContext(AuthContext)
  if (!ctx) throw new Error('useAuth must be used within AuthProvider')
  return ctx
}
