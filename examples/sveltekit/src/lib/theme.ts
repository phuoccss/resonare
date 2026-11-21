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

export const themeScript = createInlineThemeScript({ handler: applyTheme })

// For {@html} in <svelte:head>. Built here, not in a .svelte file, where
// the closing tag would end the component's own <script> block.
export const themeScriptTag = `<script>${themeScript}</script>`
