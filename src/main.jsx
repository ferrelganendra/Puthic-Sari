import React from 'react'
import ReactDOM from 'react-dom/client'
import { HelmetProvider } from 'react-helmet-async'
import App from './App.jsx'
import './index.css'
import ErrorBoundary from './components/ErrorBoundary.jsx'

ReactDOM.createRoot(document.getElementById('root')).render(
 <React.StrictMode>
  <HelmetProvider>
   <ErrorBoundary>
    <App />
   </ErrorBoundary>
  </HelmetProvider>
 </React.StrictMode>,
)
