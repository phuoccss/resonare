import { StrictMode } from 'react'
import { createRoot } from 'react-dom/client'

import { ThemeSelect } from './theme-select'

createRoot(document.getElementById('root')!).render(
  <StrictMode>
    <main>
      <h1>resonare + Vite + React</h1>
      <ThemeSelect />
    </main>
  </StrictMode>
)
