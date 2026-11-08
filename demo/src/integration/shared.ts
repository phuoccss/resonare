import {
  type ThemeScriptParameter,
  type ThemeStore,
  type ThemeStoreConfig,
  createInlineThemeScript,
  createThemeStore,
  getThemesAndOptions,
  localStorageAdapter,
} from 'resonare'
import {
  type ThemeScriptParameter as LiteThemeScriptParameter,
  type ThemeStore as LiteThemeStore,
  createInlineThemeScript as createLiteInlineThemeScript,
  createThemeStore as createLiteThemeStore,
  localStorageAdapter as liteLocalStorageAdapter,
} from 'resonare/lite'

export const CONFIG = {
  color: {
    options: ['neutral', 'red', 'orange', 'green', 'blue', 'purple', 'pink'],
  },
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
  contrast: {
    options: ['standard', 'high'],
  },
  spacing: {
    options: ['sm', 'md', 'lg'],
    defaultValue: 'md',
  },
  fontSize: {
    options: ['sm', 'md', 'lg'],
    defaultValue: 'md',
  },
} as const satisfies ThemeStoreConfig

export const THEME_LABELS = {
  color: 'color',
  colorScheme: 'color scheme',
  contrast: 'contrast',
  spacing: 'spacing',
  fontSize: 'font size',
} as const satisfies Record<keyof typeof CONFIG, string>

export const themesAndOptions = getThemesAndOptions(CONFIG)

const PARAM = {
  key: 'demo',
  config: CONFIG,
  handler: ({ resolvedThemes }) => {
    const root = document.documentElement

    Object.entries(resolvedThemes).forEach(([key, value]) => {
      root.dataset[key] = String(value)
    })
  },
} as const satisfies ThemeScriptParameter

const LITE_PARAM = {
  key: 'demo-lite',
  handler: ({ resolvedTheme, systemTheme }) => {
    const root = document.documentElement

    root.dataset.theme = resolvedTheme

    root.dataset.system = systemTheme
  },
} as const satisfies LiteThemeScriptParameter

const SLOT = '__resonareDemoStore'

const LITE_SLOT = '__resonareDemoLiteStore'

type DemoScope = typeof globalThis & {
  [SLOT]?: ThemeStore<typeof CONFIG>
  [LITE_SLOT]?: LiteThemeStore
}

const scope = globalThis as DemoScope

export const themeStore = (scope[SLOT] ??= createThemeStore(PARAM.config, {
  storage: localStorageAdapter({ key: PARAM.key }),
}))

export const liteThemeStore = (scope[LITE_SLOT] ??= createLiteThemeStore({
  storage: liteLocalStorageAdapter({ key: LITE_PARAM.key }),
}))

if (typeof window !== 'undefined') {
  themeStore.restore()

  liteThemeStore.restore()
}

export const themeScript = createInlineThemeScript(PARAM)

export const liteThemeScript = createLiteInlineThemeScript(LITE_PARAM)

function connect(
  start: () => {
    stopSync: (() => void) | undefined
    unsubscribe: () => void
  }
) {
  let connections = 0

  let unsubscribe: (() => void) | undefined

  let stopSync: (() => void) | undefined

  return () => {
    connections += 1

    if (connections === 1) {
      const started = start()

      unsubscribe = started.unsubscribe

      stopSync = started.stopSync
    }

    return () => {
      connections -= 1

      if (connections > 0) {
        return
      }

      connections = 0

      stopSync?.()

      unsubscribe?.()

      stopSync = undefined

      unsubscribe = undefined
    }
  }
}

export const connectThemeStore = connect(() => {
  const unsubscribe = themeStore.subscribe(PARAM.handler)

  const stopSync = themeStore.sync()

  themeStore.restore()

  return {
    unsubscribe,
    stopSync,
  }
})

export const connectLiteThemeStore = connect(() => {
  const unsubscribe = liteThemeStore.subscribe(LITE_PARAM.handler)

  const stopSync = liteThemeStore.sync()

  liteThemeStore.restore()

  return {
    unsubscribe,
    stopSync,
  }
})
