/* eslint-disable react-refresh/only-export-components */
import React, { createContext, useContext, useCallback } from 'react'
import { QueryClient } from '@tanstack/react-query'
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

function AuthContextBridge({ children, queryClient }: { children: React.ReactNode; queryClient: QueryClient }) {
  const { isAuthenticated, isLoading, login, logout, getToken } = useAuthme()
  const authmeUser = useUser()

  const user: User | null = authmeUser
    ? {
        id: authmeUser.sub ?? '',
        email: authmeUser.email ?? '',
        name: authmeUser.name ?? authmeUser.preferred_username ?? '',
        role: ((authmeUser as Record<string, unknown>)['role'] as 'admin' | 'agent' | 'manager') ?? 'agent',
      }
    : null

  const token = getToken?.() ?? null

  const handleLogout = useCallback(() => {
    queryClient.clear()
    localStorage.clear()
    logout()
  }, [queryClient, logout])

  return (
    <AuthContext.Provider
      value={{
        user,
        token,
        isAuthenticated,
        isLoading,
        login,
        logout: handleLogout,
      }}
    >
      {children}
    </AuthContext.Provider>
  )
}

export function AuthProvider({ children, queryClient }: { children: React.ReactNode; queryClient: QueryClient }) {
  return (
    <AuthmeProvider client={authme}>
      <AuthContextBridge queryClient={queryClient}>{children}</AuthContextBridge>
    </AuthmeProvider>
  )
}

export function useAuth(): AuthContextValue {
  const ctx = useContext(AuthContext)
  if (!ctx) throw new Error('useAuth must be used within AuthProvider')
  return ctx
}