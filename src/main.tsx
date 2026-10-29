import { StrictMode } from 'react'
import { createRoot } from 'react-dom/client'
import { registerSW } from 'virtual:pwa-register'
import { TooltipProvider } from '@/components/ui/tooltip'
import App from './App'
import './index.css'

// Optional local-only fonts (git-ignored, absent on the public site). Matches nothing when the folder is missing.
import.meta.glob('./fonts/local/*.css', { eager: true })

// Offline support: the app shell and fonts are cached after the first visit.
registerSW({ immediate: true })

createRoot(document.getElementById('root')!).render(
  <StrictMode>
    <TooltipProvider>
      <App />
    </TooltipProvider>
  </StrictMode>,
)
