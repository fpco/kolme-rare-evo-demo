import { QueryClient, QueryClientProvider } from '@tanstack/react-query'
import { StrictMode } from 'react'
import { createRoot } from 'react-dom/client'
import './index.css'

import App from './App.tsx'

const queryClient = new QueryClient()

const rootElement = document.getElementById('root')
if (rootElement) {
  createRoot(rootElement).render(
    <StrictMode>
      <QueryClientProvider client={queryClient}>
        <div className="min-w-screen min-h-screen flex justify-center bg-slate-950 text-white">
          <App />
        </div>
      </QueryClientProvider>
    </StrictMode>,
  )
}
