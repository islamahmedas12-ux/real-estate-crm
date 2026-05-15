import { BrowserRouter, Routes, Route, Navigate } from 'react-router-dom'
import { Toaster } from 'react-hot-toast'
import { QueryClient, QueryClientProvider } from '@tanstack/react-query'
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
const PropertiesListPage = lazy(() => import('./pages/properties/PropertiesListPage'))
const PropertyDetailPage = lazy(() => import('./pages/properties/PropertyDetailPage'))
const PropertyFormPage = lazy(() => import('./pages/properties/PropertyFormPage'))
const ClientsListPage = lazy(() => import('./pages/clients/ClientsListPage'))
const ClientDetailPage = lazy(() => import('./pages/clients/ClientDetailPage'))
const ClientFormPage = lazy(() => import('./pages/clients/ClientFormPage'))
const LeadsListPage = lazy(() => import('./pages/leads/LeadsListPage'))
const LeadsKanbanPage = lazy(() => import('./pages/leads/LeadsKanbanPage'))
const LeadDetailPage = lazy(() => import('./pages/leads/LeadDetailPage'))
const LeadFormPage = lazy(() => import('./pages/leads/LeadFormPage'))
const ContractsListPage = lazy(() => import('./pages/contracts/ContractsListPage'))
const ContractDetailPage = lazy(() => import('./pages/contracts/ContractDetailPage'))
const ContractFormPage = lazy(() => import('./pages/contracts/ContractFormPage'))
const InvoicesListPage = lazy(() => import('./pages/invoices/InvoicesListPage'))
const InvoiceDetailPage = lazy(() => import('./pages/invoices/InvoiceDetailPage'))
const ReportsPage = lazy(() => import('./pages/reports/ReportsPage'))
const AgentsListPage = lazy(() => import('./pages/agents/AgentsListPage'))
const AgentDetailPage = lazy(() => import('./pages/agents/AgentDetailPage'))
const SettingsPage = lazy(() => import('./pages/settings/SettingsPage'))

const queryClient = new QueryClient({
  defaultOptions: {
    queries: {
      retry: 2,
      refetchOnWindowFocus: false,
    },
  },
})

const PageLoader = () => (
  <div className="flex items-center justify-center h-full">
    <LoadingSpinner message="Loading..." />
  </div>
)

export default function App() {
  const { i18n } = useTranslation()
  useEffect(() => {
    document.documentElement.dir = i18n.language === 'ar' ? 'rtl' : 'ltr'
  }, [i18n.language])

  return (
    <QueryClientProvider client={queryClient}>
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
                    <Route path="properties" element={<PropertiesListPage />} />
                    <Route path="properties/new" element={<PropertyFormPage />} />
                    <Route path="properties/:id" element={<PropertyDetailPage />} />
                    <Route path="properties/:id/edit" element={<PropertyFormPage />} />
                    <Route path="clients" element={<ClientsListPage />} />
                    <Route path="clients/new" element={<ClientFormPage />} />
                    <Route path="clients/:id" element={<ClientDetailPage />} />
                    <Route path="clients/:id/edit" element={<ClientFormPage />} />
                    <Route path="leads" element={<LeadsListPage />} />
                    <Route path="leads/kanban" element={<LeadsKanbanPage />} />
                    <Route path="leads/new" element={<LeadFormPage />} />
                    <Route path="leads/:id" element={<LeadDetailPage />} />
                    <Route path="leads/:id/edit" element={<LeadFormPage />} />
                    <Route path="contracts" element={<ContractsListPage />} />
                    <Route path="contracts/new" element={<ContractFormPage />} />
                    <Route path="contracts/:id" element={<ContractDetailPage />} />
                    <Route path="contracts/:id/edit" element={<ContractFormPage />} />
                    <Route path="invoices" element={<InvoicesListPage />} />
                    <Route path="invoices/:id" element={<InvoiceDetailPage />} />
                    <Route path="reports" element={<ReportsPage />} />
                    <Route path="agents" element={<AgentsListPage />} />
                    <Route path="agents/:id" element={<AgentDetailPage />} />
                    <Route path="settings" element={<SettingsPage />} />
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
    </QueryClientProvider>
  )
}