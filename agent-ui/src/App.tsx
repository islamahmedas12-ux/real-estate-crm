import { BrowserRouter, Routes, Route } from 'react-router-dom'
import { Toaster } from 'react-hot-toast'
import { QueryClient, QueryClientProvider } from '@tanstack/react-query'
import { ThemeProvider } from './context/ThemeContext'
import { AuthProvider } from './context/AuthContext'
import { ProtectedRoute } from './components/ProtectedRoute'
import { Layout } from './components/layout/Layout'
import { ErrorBoundary } from './components/ui/ErrorBoundary'

import LoginPage from './pages/LoginPage'
import DashboardPage from './pages/DashboardPage'
import PropertiesPage from './pages/PropertiesPage'
import LeadsPage from './pages/LeadsPage'
import ClientsPage from './pages/ClientsPage'
import ContractsPage from './pages/ContractsPage'
import ActivitiesPage from './pages/ActivitiesPage'

const queryClient = new QueryClient({
  defaultOptions: {
    queries: {
      retry: 2,
      refetchOnWindowFocus: false,
    },
  },
})

export default function App() {
  return (
    <QueryClientProvider client={queryClient}>
      <ThemeProvider>
        <BrowserRouter>
          <AuthProvider>
            <ErrorBoundary>
              <Routes>
                {/* Public */}
                <Route path="/login" element={<LoginPage />} />

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
                </Route>
              </Routes>
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
    </QueryClientProvider>
  )
}
