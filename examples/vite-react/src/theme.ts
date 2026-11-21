import { createInlineThemeScript } from 'resonare/lite'
import {
  combine,
  disableTransitions,
  setClassNames,
  setColorScheme,
  setThemeColor,
} from 'resonare/lite/effects'

// class="dark" in dark mode, no class in light mode.
export const applyTheme = combine(
  setClassNames({ light: null }),
  setColorScheme(),
  setThemeColor({ light: '#ffffff', dark: '#0a0a0a' }),
  disableTransitions()
)

// Imported by vite.config.ts, so keep this module free of browser-only code.
export const themeScript = createInlineThemeScript({ handler: applyTheme })
