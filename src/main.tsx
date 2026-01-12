import { createRoot } from 'react-dom/client'
import './index.css'
import App from './App.tsx'

// StrictMode removed for performance - it causes double-renders in dev mode
createRoot(document.getElementById('root')!).render(<App />)
