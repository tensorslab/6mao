import React from 'react'
import { createRoot } from 'react-dom/client'
import '../../shared/styles.css'
import { installElectronApiFallback } from '../../shared/electronApiFallback'
import { App } from './App'

installElectronApiFallback()

createRoot(document.getElementById('root')!).render(
  <React.StrictMode>
    <App />
  </React.StrictMode>
)
