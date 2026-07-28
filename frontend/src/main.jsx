/*
 * RetailIQ Frontend Application
 * File: main.jsx
 * Purpose: React component providing UI layout, state management, or data visualization.
 */
import { StrictMode } from 'react'
import { createRoot } from 'react-dom/client'
import './index.css'
import App from './App.jsx'

createRoot(document.getElementById('root')).render(
  <StrictMode>
    <App />
  </StrictMode>,
)
