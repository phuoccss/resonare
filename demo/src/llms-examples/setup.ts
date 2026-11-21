import {
  type ThemeStoreConfig,
  createInlineThemeScript,
  createThemeStore,
} from 'resonare'
import {
  combine,
  disableTransitions,
  setColorScheme,
  setDataAttributes,
  setThemeColor,
} from 'resonare/effects'

export const CONFIG = {
  colorScheme: {
    options: [
      {
        value: 'system',
        media: ['(prefers-color-scheme: dark)', 'dark', 'light'],
      },
      'light',
      'dark',
    ],
  },
  contrast: { options: ['standard', 'high'] },
  sidebarWidth: { defaultValue: 240 },
} as const satisfies ThemeStoreConfig

// The config type checks the setting names and values of every effect.
export const applyThemes = combine<typeof CONFIG>(
  setDataAttributes(),
  setColorScheme(),
  setThemeColor({ values: { light: '#fff', dark: '#000' } }),
  disableTransitions()
)

// Render in <head>, e.g. <script dangerouslySetInnerHTML={{ __html: themeScript }} />
export const themeScript = createInlineThemeScript({
  key: 'my-app',
  config: CONFIG,
  handler: applyThemes,
})

export const store = createThemeStore(CONFIG)

if (typeof window !== 'undefined') {
  store.subscribe(applyThemes)

  store.restore()

  store.sync()
}
