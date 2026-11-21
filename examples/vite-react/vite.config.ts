import react from '@vitejs/plugin-react'
import { defineConfig } from 'vite'

import { themeScript } from './src/theme'

export default defineConfig({
  plugins: [
    react(),
    {
      // Module scripts run after first paint, so put the theme script in
      // index.html itself, as a classic inline script at the top of <head>.
      name: 'theme-script',
      transformIndexHtml: () => {
        return [
          { tag: 'script', children: themeScript, injectTo: 'head-prepend' },
        ]
      },
    },
  ],
})
