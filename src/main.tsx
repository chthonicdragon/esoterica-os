import React from 'react'
import ReactDOM from 'react-dom/client'
import { Toaster } from 'react-hot-toast'
import App from './App'
import { AppProviders } from './contexts'
import './index.css'

if (typeof window !== 'undefined' && 'serviceWorker' in navigator) {
  window.addEventListener('load', () => {
    navigator.serviceWorker
      .register('/sw.js')
      .then((registration) => {
        // Force an update check so old workers with stale cache logic are replaced quickly.
        void registration.update()

        if (registration.waiting) {
          registration.waiting.postMessage({ type: 'SKIP_WAITING' })
        }

        registration.addEventListener('updatefound', () => {
          const newWorker = registration.installing
          if (!newWorker) return

          newWorker.addEventListener('statechange', () => {
            if (newWorker.state === 'installed' && navigator.serviceWorker.controller) {
              newWorker.postMessage({ type: 'SKIP_WAITING' })
            }
          })
        })
      })
      .catch((error) => {
        console.warn('Service worker registration failed:', error)
      })

    let reloadedBySw = false
    navigator.serviceWorker.addEventListener('controllerchange', () => {
      if (reloadedBySw) return
      reloadedBySw = true
      window.location.reload()
    })
  })
}

ReactDOM.createRoot(document.getElementById('root')!).render(
  <React.StrictMode>
    <AppProviders>
      <Toaster position="top-right" />
      <App />
    </AppProviders>
  </React.StrictMode>,
)
