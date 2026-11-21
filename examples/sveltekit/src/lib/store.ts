import { createThemeStore } from 'resonare/lite'

import { applyTheme } from './theme'

export const store = createThemeStore()

if (typeof window !== 'undefined') {
  store.subscribe(applyTheme)

  store.restore()

  store.sync()
}
