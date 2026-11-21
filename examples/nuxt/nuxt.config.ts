import { themeScript } from './app/theme'

export default defineNuxtConfig({
  compatibilityDate: '2026-11-01',
  app: {
    head: {
      // In every server-rendered page, so it runs before first paint.
      script: [{ innerHTML: themeScript }],
    },
  },
})
