import './env'
import { StrictMode } from 'react'
import { createRoot } from 'react-dom/client'
import { QueryClient, QueryClientProvider } from '@tanstack/react-query'
import './i18n'
import App from './App.tsx'
import './index.css'

// Single canonical QueryClient instance for the entire agent-ui.
// Defaults: retry=2 for failed queries, staleTime=5 min so data stays
// usable across route navigations, refetchOnWindowFocus=false to avoid
// noisy background refreshes.
const queryClient = new QueryClient({
  defaultOptions: {
    queries: {
      retry: 2,
      staleTime: 5 * 60 * 1000,
      refetchOnWindowFocus: false,
    },
  },
})

createRoot(document.getElementById('root')!).render(
  <StrictMode>
    <QueryClientProvider client={queryClient}>
      <App queryClient={queryClient} />
    </QueryClientProvider>
  </StrictMode>,
)