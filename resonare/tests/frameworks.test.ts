import { act, createElement } from 'react'
import { createRoot as createReactRoot, hydrateRoot } from 'react-dom/client'
import { renderToString as renderReactToString } from 'react-dom/server'
import { createRoot, sharedConfig } from 'solid-js'
import { afterEach, beforeEach, describe, expect, it, vi } from 'vite-plus/test'
import { createApp, createSSRApp, effectScope, h, nextTick } from 'vue'
import { renderToString as renderVueToString } from 'vue/server-renderer'

import { type ThemeStoreConfig, createThemeStore } from '../dist'
import { createThemeStore as createLiteThemeStore } from '../dist/lite'
import { useResonare as useLiteReact } from '../dist/lite-react'
import { useResonare as useLiteSolid } from '../dist/lite-solid'
import { useResonare as useLiteVue } from '../dist/lite-vue'
import { useResonare as useReact } from '../dist/react'
import { useResonare as useSolid } from '../dist/solid'
import { useResonare as useVue } from '../dist/vue'
import { mockStorage, setSystemColorScheme } from './utils'

// Under the `node` condition `solid-js` resolves to its server build, where
// `onMount` never runs; test against the browser build instead.
vi.mock(import('solid-js'), () => {
  // @ts-expect-error -- the dist path ships no declarations of its own
  return import('solid-js/dist/solid.js')
})

const CONFIG = {
  colorScheme: {
    options: ['light', 'dark'],
    defaultValue: 'light',
  },
} as const satisfies ThemeStoreConfig

const OPTIONS = {
  storage: () => {
    return mockStorage
  },
} as const

const SYSTEM_CONFIG = {
  colorScheme: {
    options: [
      'light',
      'dark',
      {
        value: 'system',
        media: ['(prefers-color-scheme: dark)', 'dark', 'light'],
      },
    ],
    defaultValue: 'system',
  },
} as const satisfies ThemeStoreConfig

Object.assign(globalThis, { IS_REACT_ACT_ENVIRONMENT: true })

describe('framework integrations', () => {
  beforeEach(() => {
    vi.clearAllMocks()

    setSystemColorScheme('light')
  })

  afterEach(() => {
    vi.restoreAllMocks()
  })

  describe('react', () => {
    it('should subscribe to themes and stop after unmount', () => {
      const store = createThemeStore(CONFIG, OPTIONS)

      const container = document.createElement('div')

      const root = createReactRoot(container)

      let colorScheme = ''

      let resolvedColorScheme = ''

      let setThemes = store.setThemes

      function Probe() {
        const api = useReact(store)

        colorScheme = api.themes.colorScheme

        resolvedColorScheme = api.resolvedThemes.colorScheme

        setThemes = api.setThemes

        return null
      }

      act(() => {
        root.render(createElement(Probe))
      })

      expect(colorScheme).toBe('light')

      expect(resolvedColorScheme).toBe('light')

      act(() => {
        setThemes({ colorScheme: 'dark' })
      })

      expect(colorScheme).toBe('dark')

      act(() => {
        root.unmount()
      })

      store.setThemes({ colorScheme: 'light' })

      expect(colorScheme).toBe('dark')
    })
  })

  describe('solid', () => {
    it('should subscribe to themes and stop after cleanup', () => {
      const store = createThemeStore(CONFIG, OPTIONS)

      createRoot((dispose) => {
        const { themes, resolvedThemes, setThemes } = useSolid(store)

        expect(themes()).toEqual({ colorScheme: 'light' })

        expect(resolvedThemes()).toEqual({ colorScheme: 'light' })

        setThemes({ colorScheme: 'dark' })

        expect(themes().colorScheme).toBe('dark')

        dispose()

        store.setThemes({ colorScheme: 'light' })

        expect(themes().colorScheme).toBe('dark')
      })
    })
  })

  describe('vue', () => {
    it('should subscribe to themes and stop when the scope is disposed', () => {
      const store = createThemeStore(CONFIG, OPTIONS)

      const scope = effectScope()

      const api = scope.run(() => {
        return useVue(store)
      })!

      expect(api.themes.value).toEqual({ colorScheme: 'light' })

      expect(api.resolvedThemes.value).toEqual({ colorScheme: 'light' })

      api.setThemes({ colorScheme: 'dark' })

      expect(api.themes.value.colorScheme).toBe('dark')

      scope.stop()

      store.setThemes({ colorScheme: 'light' })

      expect(api.themes.value.colorScheme).toBe('dark')
    })
  })

  describe('lite react', () => {
    it('should subscribe to the theme and stop after unmount', () => {
      const store = createLiteThemeStore(OPTIONS)

      const container = document.createElement('div')

      const root = createReactRoot(container)

      let theme = ''

      let resolvedTheme = ''

      let systemTheme = ''

      let setTheme = store.setTheme

      function Probe() {
        const api = useLiteReact(store)

        theme = api.theme

        resolvedTheme = api.resolvedTheme

        systemTheme = api.systemTheme

        setTheme = api.setTheme

        return null
      }

      act(() => {
        root.render(createElement(Probe))
      })

      expect(theme).toBe('system')

      expect(resolvedTheme).toBe('light')

      expect(systemTheme).toBe('light')

      act(() => {
        setTheme('dark')
      })

      expect(theme).toBe('dark')

      expect(resolvedTheme).toBe('dark')

      act(() => {
        root.unmount()
      })

      store.setTheme('light')

      expect(theme).toBe('dark')
    })
  })

  describe('lite solid', () => {
    it('should subscribe to the theme and stop after cleanup', () => {
      const store = createLiteThemeStore(OPTIONS)

      createRoot((dispose) => {
        const { theme, resolvedTheme, systemTheme, setTheme } =
          useLiteSolid(store)

        expect(theme()).toBe('system')

        expect(resolvedTheme()).toBe('light')

        expect(systemTheme()).toBe('light')

        setTheme('dark')

        expect(theme()).toBe('dark')

        expect(resolvedTheme()).toBe('dark')

        dispose()

        store.setTheme('light')

        expect(theme()).toBe('dark')
      })
    })
  })

  describe('lite vue', () => {
    it('should subscribe to the theme and stop when the scope is disposed', () => {
      const store = createLiteThemeStore(OPTIONS)

      const scope = effectScope()

      const api = scope.run(() => {
        return useLiteVue(store)
      })!

      expect(api.theme.value).toBe('system')

      expect(api.resolvedTheme.value).toBe('light')

      expect(api.systemTheme.value).toBe('light')

      api.setTheme('dark')

      expect(api.theme.value).toBe('dark')

      expect(api.resolvedTheme.value).toBe('dark')

      scope.stop()

      store.setTheme('light')

      expect(api.theme.value).toBe('dark')
    })
  })

  describe('hydration', () => {
    beforeEach(() => {
      // The client resolves `system` to dark; the server cannot know that.
      setSystemColorScheme('dark')
    })

    it('react should hydrate from the server snapshot without errors', async () => {
      const store = createThemeStore(SYSTEM_CONFIG, OPTIONS)

      function Probe() {
        return createElement(
          'span',
          null,
          useReact(store).resolvedThemes.colorScheme
        )
      }

      const container = document.createElement('div')

      container.innerHTML = renderReactToString(createElement(Probe))

      expect(container.textContent).toBe('light')

      const onRecoverableError = vi.fn()

      await act(async () => {
        hydrateRoot(container, createElement(Probe), { onRecoverableError })
      })

      expect(onRecoverableError).not.toHaveBeenCalled()

      expect(container.textContent).toBe('dark')
    })

    it('lite react should hydrate from the server snapshot without errors', async () => {
      const store = createLiteThemeStore(OPTIONS)

      function Probe() {
        return createElement('span', null, useLiteReact(store).resolvedTheme)
      }

      const container = document.createElement('div')

      container.innerHTML = renderReactToString(createElement(Probe))

      expect(container.textContent).toBe('light')

      const onRecoverableError = vi.fn()

      await act(async () => {
        hydrateRoot(container, createElement(Probe), { onRecoverableError })
      })

      expect(onRecoverableError).not.toHaveBeenCalled()

      expect(container.textContent).toBe('dark')
    })

    it('solid should start from the server snapshot while hydrating', () => {
      const store = createThemeStore(SYSTEM_CONFIG, OPTIONS)

      const liteStore = createLiteThemeStore(OPTIONS)

      let resolvedThemes!: ReturnType<
        typeof useSolid<typeof SYSTEM_CONFIG>
      >['resolvedThemes']

      let resolvedTheme!: ReturnType<typeof useLiteSolid>['resolvedTheme']

      sharedConfig.context = {} as typeof sharedConfig.context

      try {
        createRoot(() => {
          resolvedThemes = useSolid(store).resolvedThemes

          resolvedTheme = useLiteSolid(liteStore).resolvedTheme

          expect(resolvedThemes().colorScheme).toBe('light')

          expect(resolvedTheme()).toBe('light')
        })
      } finally {
        sharedConfig.context = undefined
      }

      // `onMount` has run once the root finished creating.
      expect(resolvedThemes().colorScheme).toBe('dark')

      expect(resolvedTheme()).toBe('dark')
    })

    it('solid should use the live snapshot outside hydration', () => {
      const store = createThemeStore(SYSTEM_CONFIG, OPTIONS)

      createRoot((dispose) => {
        expect(useSolid(store).resolvedThemes().colorScheme).toBe('dark')

        dispose()
      })
    })

    it.each([
      {
        name: 'vue',
        use: () => {
          const { resolvedThemes } = useVue(
            createThemeStore(SYSTEM_CONFIG, OPTIONS),
            { hydrate: true }
          )

          return () => {
            return resolvedThemes.value.colorScheme
          }
        },
      },
      {
        name: 'lite vue',
        use: () => {
          const { resolvedTheme } = useLiteVue(createLiteThemeStore(OPTIONS), {
            hydrate: true,
          })

          return () => {
            return resolvedTheme.value
          }
        },
      },
    ])(
      '$name should hydrate from the server snapshot without warnings',
      async ({ use }) => {
        // Server render and hydration each run `setup`, with their own store.
        const component = {
          setup() {
            const read = use()

            return () => {
              return h('span', read())
            }
          },
        }

        const html = await renderVueToString(createSSRApp(component))

        expect(html).toBe('<span>light</span>')

        const container = document.createElement('div')

        container.innerHTML = html

        const app = createSSRApp(component)

        const warnHandler = vi.fn()

        app.config.warnHandler = warnHandler

        const consoleError = vi
          .spyOn(console, 'error')
          .mockImplementation(() => {})

        app.mount(container)

        await nextTick()

        expect(warnHandler).not.toHaveBeenCalled()

        expect(consoleError).not.toHaveBeenCalled()

        expect(container.textContent).toBe('dark')
      }
    )

    it('vue should use the live snapshot without hydrate', () => {
      const store = createThemeStore(SYSTEM_CONFIG, OPTIONS)

      const scope = effectScope()

      const api = scope.run(() => {
        return useVue(store)
      })!

      expect(api.resolvedThemes.value.colorScheme).toBe('dark')

      scope.stop()
    })
  })

  describe('vue subscription lifetime', () => {
    it('should not subscribe during server rendering', async () => {
      const store = createThemeStore(CONFIG, OPTIONS)

      const subscribe = vi.spyOn(store, 'subscribe')

      await renderVueToString(
        createSSRApp({
          setup() {
            const { themes } = useVue(store)

            return () => {
              return h('span', themes.value.colorScheme)
            }
          },
        })
      )

      expect(subscribe).not.toHaveBeenCalled()
    })

    it('should subscribe on mount and unsubscribe on unmount', async () => {
      const store = createThemeStore(CONFIG, OPTIONS)

      const unsubscribe = vi.fn()

      const subscribe = vi.spyOn(store, 'subscribe').mockImplementation(() => {
        return unsubscribe
      })

      const app = createApp({
        setup() {
          const { themes } = useVue(store)

          expect(subscribe).not.toHaveBeenCalled()

          return () => {
            return h('span', themes.value.colorScheme)
          }
        },
      })

      app.mount(document.createElement('div'))

      expect(subscribe).toHaveBeenCalledOnce()

      app.unmount()

      expect(unsubscribe).toHaveBeenCalledOnce()
    })
  })
})
