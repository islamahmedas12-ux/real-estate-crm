import { BrowserRouter, Routes, Route, Navigate } from 'react-router-dom'
import { Toaster } from 'react-hot-toast'
import { QueryClient } from '@tanstack/react-query'
import { lazy, Suspense, useEffect } from 'react'
import { useTranslation } from 'react-i18next'
import { ThemeProvider } from './context/ThemeContext'
import { AuthProvider } from './context/AuthContext'
import { ProtectedRoute } from './components/ProtectedRoute'
import { Layout } from './components/layout/Layout'
import { ErrorBoundary } from './components/ui/ErrorBoundary'
import { LoadingSpinner } from './components/ui/LoadingSpinner'

const LoginPage = lazy(() => import('./pages/LoginPage'))
const CallbackPage = lazy(() => import('./pages/CallbackPage'))
const DashboardPage = lazy(() => import('./pages/DashboardPage'))
const PropertiesPage = lazy(() => import('./pages/PropertiesPage'))
const LeadsPage = lazy(() => import('./pages/LeadsPage'))
const ClientsPage = lazy(() => import('./pages/ClientsPage'))
const ContractsPage = lazy(() => import('./pages/ContractsPage'))
const ActivitiesPage = lazy(() => import('./pages/ActivitiesPage'))

const PageLoader = () => (
  <div className="flex items-center justify-center h-full">
    <LoadingSpinner message="Loading..." />
  </div>
)

export default function App({ queryClient }: { queryClient: QueryClient }) {
  const { i18n } = useTranslation()
  useEffect(() => {
    document.documentElement.dir = i18n.language === 'ar' ? 'rtl' : 'ltr'
  }, [i18n.language])

  return (
    <ThemeProvider>
      <BrowserRouter>
        <AuthProvider queryClient={queryClient}>
          <ErrorBoundary>
            <Suspense fallback={<PageLoader />}>
              <Routes>
                {/* Public */}
                <Route path="/login" element={<LoginPage />} />
                <Route path="/callback" element={<CallbackPage />} />

                {/* Protected — wrapped in Layout */}
                <Route
                  path="/"
                  element={
                    <ProtectedRoute>
                      <Layout />
                    </ProtectedRoute>
                  }
                >
                  <Route index element={<DashboardPage />} />
                  <Route path="properties" element={<PropertiesPage />} />
                  <Route path="leads" element={<LeadsPage />} />
                  <Route path="clients" element={<ClientsPage />} />
                  <Route path="contracts" element={<ContractsPage />} />
                  <Route path="activities" element={<ActivitiesPage />} />
                  <Route path="*" element={<Navigate to="/" replace />} />
                </Route>

                {/* Catch-all for routes outside the layout */}
                <Route path="*" element={<Navigate to="/login" replace />} />
              </Routes>
            </Suspense>
          </ErrorBoundary>

          <Toaster
            position="top-right"
            toastOptions={{
              duration: 4000,
              style: {
                borderRadius: '10px',
                background: '#1f2937',
                color: '#f9fafb',
                fontSize: '14px',
              },
            }}
          />
        </AuthProvider>
      </BrowserRouter>
    </ThemeProvider>
  )
}