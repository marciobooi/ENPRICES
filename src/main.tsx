import { createRoot } from 'react-dom/client'
import { HelmetProvider } from 'react-helmet-async'
import './index.css'
import App from './App.tsx'

// Initialize i18n
import './i18n'

// Initialize ECL components (EU preset)
import '@ecl/preset-eu/dist/scripts/ecl-eu.js'

createRoot(document.getElementById('root')!).render(
    <HelmetProvider>
        <App />
    </HelmetProvider>
)
