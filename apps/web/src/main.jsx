import { StrictMode } from 'react'
import { createRoot } from 'react-dom/client'
import { BrowserRouter } from 'react-router-dom'
import './index.css'
import './i18n'
import App from './App.jsx'

const savedTheme = localStorage.getItem('marketpro-ui')
if (savedTheme) {
  try {
    const parsed = JSON.parse(savedTheme)
    if (parsed?.state?.theme === 'dark') {
      document.documentElement.classList.add('dark')
    }
  } catch {
    // ignore malformed local storage value
  }
}

createRoot(document.getElementById('root')).render(
  <StrictMode>
    <BrowserRouter>
      <App />
    </BrowserRouter>
  </StrictMode>,
)
