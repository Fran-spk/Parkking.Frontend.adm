import { StrictMode } from 'react'
import { createRoot } from 'react-dom/client'
import './index.css'
import App from './App.jsx'
import 'react-datepicker/dist/react-datepicker.css'
import { applyParkkingTheme } from './theme/parkking.theme.js'

applyParkkingTheme()

document.querySelector('html').setAttribute('lang', 'es')

if (import.meta.env.PROD && "serviceWorker" in navigator) {
  window.addEventListener("load", () => {
    navigator.serviceWorker.register("/sw.js").catch(() => {});
  });
}
createRoot(document.getElementById('root')).render(
  <StrictMode>
    <App />
  </StrictMode>,
)
