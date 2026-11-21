import { createThemeStore } from 'resonare/lite'

import { applyTheme } from './theme'

export const store = createThemeStore()

if (import.meta.client) {
  store.subscribe(applyTheme)

  store.restore()

  store.sync()
}
