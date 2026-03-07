import React from 'react'
import ReactDOM from 'react-dom/client'
import { Toaster } from 'react-hot-toast'
import App from './App'
import { AppProviders } from './contexts'
import './index.css'

ReactDOM.createRoot(document.getElementById('root')!).render(
  <React.StrictMode>
    <AppProviders>
      <Toaster position="top-right" />
      <App />
    </AppProviders>
  </React.StrictMode>,
)
