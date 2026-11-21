import { createThemeStore } from 'resonare/lite'

import { applyTheme } from './theme'

export const store = createThemeStore()

store.subscribe(applyTheme)

store.restore()

store.sync()
