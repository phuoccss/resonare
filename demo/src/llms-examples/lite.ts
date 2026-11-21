import { createInlineThemeScript, createThemeStore } from 'resonare/lite'
import {
  combine,
  disableTransitions,
  setClassNames,
  setColorScheme,
  setThemeColor,
} from 'resonare/lite/effects'

// class="dark" in dark mode (for Tailwind / shadcn), nothing in light mode
export const applyTheme = combine(
  setClassNames({ light: null }),
  setColorScheme(),
  setThemeColor({ light: '#fff', dark: '#000' }),
  disableTransitions()
)

export const themeScript = createInlineThemeScript({
  key: 'my-app',
  handler: applyTheme,
})

export const store = createThemeStore()

if (typeof window !== 'undefined') {
  store.subscribe(applyTheme)

  store.restore()

  store.sync()
}
