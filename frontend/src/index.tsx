import React from 'react'
import { createRoot } from 'react-dom/client'
import App from './App'

// Suppress react-beautiful-dnd defaultProps warning
const originalError = console.error
console.error = (...args) => {
  if (typeof args[0] === 'string' && args[0].includes('defaultProps will be removed')) {
    return
  }
  originalError.call(console, ...args)
}

const container = document.getElementById('root') as HTMLElement
const root = createRoot(container)

root.render(
  <React.StrictMode>
    <App />
  </React.StrictMode>
)
