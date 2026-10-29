import { StrictMode } from 'react'
import { createRoot } from 'react-dom/client'
import './index.css'
import App from './App.jsx'

// Display the application inside the root element from index.html.
createRoot(document.getElementById('root')).render(
  // Enable extra React checks during development.
  <StrictMode>
    <App />
  </StrictMode>,
)
