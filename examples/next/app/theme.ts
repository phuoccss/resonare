import { createInlineThemeScript, createThemeStore } from 'resonare/lite'
import {
  combine,
  disableTransitions,
  setClassNames,
  setColorScheme,
  setThemeColor,
} from 'resonare/lite/effects'

// class="dark" in dark mode, no class in light mode.
const applyTheme = combine(
  setClassNames({ light: null }),
  setColorScheme(),
  setThemeColor({ light: '#ffffff', dark: '#0a0a0a' }),
  disableTransitions()
)

export const themeScript = createInlineThemeScript({ handler: applyTheme })

export const store = createThemeStore()

if (typeof window !== 'undefined') {
  store.subscribe(applyTheme)

  store.restore()

  store.sync()
}
