import React from 'react'
import { createRoot } from 'react-dom/client'
import { QueryClient, QueryClientProvider } from '@tanstack/react-query'
import '../../shared/styles.css'
import { installElectronApiFallback } from '../../shared/electronApiFallback'
import { App } from './App'
import { ErrorBoundary } from './components/ErrorBoundary'

const queryClient = new QueryClient()
installElectronApiFallback()

createRoot(document.getElementById('root')!).render(
  <React.StrictMode>
    <ErrorBoundary>
      <QueryClientProvider client={queryClient}>
        <App />
      </QueryClientProvider>
    </ErrorBoundary>
  </React.StrictMode>
)
