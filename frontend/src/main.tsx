import { StrictMode } from 'react'
import { createRoot } from 'react-dom/client'
import './index.css'

import App from './App.tsx'

const rootElement = document.getElementById('root')
if (rootElement) {
  createRoot(rootElement).render(
    <StrictMode>
      <div className="min-w-screen min-h-screen flex justify-center bg-slate-950 text-white">
        <App />
      </div>
    </StrictMode>,
  )
}
