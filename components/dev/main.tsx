import * as React from 'react'
import { createRoot } from 'react-dom/client'

import { DevPage } from './dev-page'
import './dev.css'

const host = document.getElementById('root')
if (!host) throw new Error('#root missing from index.html')

createRoot(host).render(
  <React.StrictMode>
    <DevPage />
  </React.StrictMode>,
)
