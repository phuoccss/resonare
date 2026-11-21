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

type Config = typeof CONFIG

export const applyThemes = combine(
  setDataAttributes(),
  setColorScheme<Config>(),
  setThemeColor<Config>({ values: { light: '#fff', dark: '#000' } }),
  disableTransitions<Config>()
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
