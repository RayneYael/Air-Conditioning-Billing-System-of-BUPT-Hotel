import { StrictMode } from 'react'
import { createRoot } from 'react-dom/client'
import { toast, ToastContainer } from 'react-toastify';
import App from './App.jsx'
import './index.css'

createRoot(document.getElementById('root')).render(
  <StrictMode>
    <App />
    <ToastContainer />
  </StrictMode>,
)
