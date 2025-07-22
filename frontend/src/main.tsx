import { QueryClient, QueryClientProvider } from '@tanstack/react-query'
import { GrazProvider } from 'graz'
import { StrictMode } from 'react'
import { createRoot } from 'react-dom/client'

import App from './App.tsx'
import { chains } from './config/chains'

import './index.css'

const queryClient = new QueryClient()

const rootElement = document.getElementById('root')
if (rootElement) {
  createRoot(rootElement).render(
    <StrictMode>
      <GrazProvider
        grazOptions={{
          chains: chains,
        }}
      >
        <QueryClientProvider client={queryClient}>
          <div className="min-w-screen min-h-screen flex justify-center bg-slate-950 text-white">
            <App />
          </div>
        </QueryClientProvider>
      </GrazProvider>
    </StrictMode>,
  )
}
