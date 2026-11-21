import { afterEach, beforeEach, describe, expect, it, vi } from 'vite-plus/test'

import {
  type ThemeStoreConfig,
  createInlineThemeScript,
  createThemeStore,
} from '../dist'
import {
  combine,
  defineEffect,
  disableTransitions,
  setClassNames,
  setColorScheme,
  setDataAttributes,
  setThemeColor,
} from '../dist/effects'
import {
  createInlineThemeScript as createLiteInlineThemeScript,
  createThemeStore as createLiteThemeStore,
} from '../dist/lite'
import {
  combine as liteCombine,
  defineEffect as liteDefineEffect,
  disableTransitions as liteDisableTransitions,
  setClassNames as liteSetClassNames,
  setColorScheme as liteSetColorScheme,
  setDataAttributes as liteSetDataAttributes,
  setThemeColor as liteSetThemeColor,
} from '../dist/lite-effects'
import { setSystemColorScheme } from './utils'

const CONFIG = {
  colorScheme: {
    options: [
      {
        value: 'system',
        media: ['(prefers-color-scheme: dark)', 'dark', 'light'],
      },
      'light',
      'dark',
      'dark-dimmed',
    ],
  },
  contrast: {
    options: ['standard', 'high'],
  },
} as const satisfies ThemeStoreConfig

const root = document.documentElement

const themeColorMetas = () => {
  return [
    ...document.querySelectorAll<HTMLMetaElement>('meta[name="theme-color"]'),
  ]
}

const transitionStyles = () => {
  return [...document.head.querySelectorAll('style')].filter((style) => {
    return style.textContent?.includes('transition:none')
  })
}

const nextFrames = async () => {
  for (let i = 0; i < 3; i++) {
    await new Promise((resolve) => {
      requestAnimationFrame(resolve)
    })
  }
}

beforeEach(() => {
  setSystemColorScheme('dark')

  localStorage.clear()

  document.head.innerHTML = ''

  for (const key of Object.keys(root.dataset)) {
    delete root.dataset[key]
  }

  root.removeAttribute('style')

  root.removeAttribute('class')
})

afterEach(() => {
  vi.restoreAllMocks()
})

describe('prev', () => {
  it('should pass the previous snapshot to listeners', () => {
    const store = createThemeStore(CONFIG, { storage: null })

    const listener = vi.fn()

    const before = store.getSnapshot()

    store.subscribe(listener)

    store.setThemes({ contrast: 'high' })

    expect(listener).toHaveBeenCalledWith(store.getSnapshot(), before)
  })

  it('should pass the previous snapshot to lite listeners', () => {
    const store = createLiteThemeStore({ storage: null })

    const listener = vi.fn()

    const before = store.getSnapshot()

    store.subscribe(listener)

    store.setTheme('light')

    expect(listener).toHaveBeenCalledWith(store.getSnapshot(), before)
  })
})

describe('resonare/effects', () => {
  const applyThemes = combine(
    setDataAttributes(),
    setColorScheme({ values: { 'dark-dimmed': 'dark' } }),
    setThemeColor({
      values: { light: '#fff', dark: '#000', 'dark-dimmed': '#111' },
    }),
    disableTransitions()
  )

  it('should apply the state from the inline script', () => {
    localStorage.setItem(
      'test',
      JSON.stringify({ themes: { contrast: 'high' } })
    )

    new Function(
      createInlineThemeScript({
        key: 'test',
        config: CONFIG,
        handler: applyThemes,
      })
    )()

    expect(root.dataset['colorScheme']).toBe('dark')

    expect(root.dataset['contrast']).toBe('high')

    expect(root.style.colorScheme).toBe('dark')

    expect(
      themeColorMetas().map((meta) => {
        return meta.content
      })
    ).toEqual(['#000'])

    // First paint: nothing to cut short.
    expect(transitionStyles()).toHaveLength(0)
  })

  it('should apply changes from the store', async () => {
    const store = createThemeStore(CONFIG, { storage: null })

    store.subscribe(applyThemes)

    store.setThemes({ colorScheme: 'dark-dimmed' })

    expect(root.dataset['colorScheme']).toBe('dark-dimmed')

    expect(root.style.colorScheme).toBe('dark')

    expect(
      themeColorMetas().map((meta) => {
        return meta.content
      })
    ).toEqual(['#111'])

    expect(transitionStyles()).toHaveLength(1)

    await nextFrames()

    expect(transitionStyles()).toHaveLength(0)
  })

  it('should not disable transitions when another setting changes', () => {
    const store = createThemeStore(CONFIG, { storage: null })

    store.subscribe(disableTransitions())

    store.setThemes({ contrast: 'high' })

    expect(transitionStyles()).toHaveLength(0)
  })

  it('should disable transitions when any of the keys changes', () => {
    const store = createThemeStore(CONFIG, { storage: null })

    store.subscribe(
      disableTransitions<typeof CONFIG>({ keys: ['colorScheme', 'contrast'] })
    )

    store.setThemes({ contrast: 'high' })

    expect(transitionStyles()).toHaveLength(1)
  })

  it('should update media-based theme-color tags in place', () => {
    document.head.innerHTML = `
      <meta name="theme-color" content="#fff" media="(prefers-color-scheme: light)">
      <meta name="theme-color" content="#000" media="(prefers-color-scheme: dark)">
    `

    const before = themeColorMetas()

    const store = createThemeStore(CONFIG, { storage: null })

    store.subscribe(setThemeColor({ values: { light: '#eee', dark: '#222' } }))

    // The OS prefers dark; the user's light choice must win in both tags.
    store.setThemes({ colorScheme: 'light' })

    const metas = themeColorMetas()

    expect(metas).toEqual(before)

    expect(
      metas.map((meta) => {
        return [meta.content, meta.getAttribute('media')]
      })
    ).toEqual([
      ['#eee', '(prefers-color-scheme: light)'],
      ['#eee', '(prefers-color-scheme: dark)'],
    ])
  })

  it('should add a theme-color tag when there is none', () => {
    const store = createThemeStore(CONFIG, { storage: null })

    store.subscribe(setThemeColor({ values: { light: '#eee', dark: '#222' } }))

    store.setThemes({ colorScheme: 'light' })

    store.setThemes({ colorScheme: 'dark' })

    expect(
      themeColorMetas().map((meta) => {
        return meta.content
      })
    ).toEqual(['#222'])
  })

  it('should set class names from the map', () => {
    const classes = setClassNames<typeof CONFIG>({
      colorScheme: { dark: 'dark', 'dark-dimmed': 'dark' },
      contrast: { high: 'high-contrast' },
    })

    // Stale classes, e.g. rendered by the server, are corrected on first paint.
    root.classList.add('app', 'high-contrast')

    new Function(
      createInlineThemeScript({ key: 'test', config: CONFIG, handler: classes })
    )()

    expect(root.className).toBe('app dark')

    const store = createThemeStore(CONFIG, { storage: null })

    store.subscribe(classes)

    // Unmapped values add no class.
    store.setThemes({ colorScheme: 'light', contrast: 'high' })

    expect([...root.classList].sort()).toEqual(['app', 'high-contrast'])

    // Values sharing a class keep it.
    store.setThemes({ colorScheme: 'dark' })

    store.setThemes({ colorScheme: 'dark-dimmed' })

    expect([...root.classList].sort()).toEqual(['app', 'dark', 'high-contrast'])

    store.setThemes({ contrast: 'standard' })

    expect([...root.classList].sort()).toEqual(['app', 'dark'])
  })

  it('should read theme-color from a CSS variable', () => {
    root.style.setProperty('--background', ' #123456 ')

    const store = createThemeStore(CONFIG, { storage: null })

    store.subscribe(setThemeColor({ cssVar: '--background' }))

    store.setThemes({ colorScheme: 'light' })

    expect(themeColorMetas()[0]!.content).toBe('#123456')
  })

  it('should follow a custom key', () => {
    const config = {
      mode: { options: ['light', 'dark'] },
    } as const satisfies ThemeStoreConfig

    const store = createThemeStore(config, { storage: null })

    store.subscribe(setColorScheme({ key: 'mode' }))

    store.setThemes({ mode: 'dark' })

    expect(root.style.colorScheme).toBe('dark')
  })

  it('should serialize custom effects with their options', () => {
    const setFontSize = defineEffect<typeof CONFIG, { px: number }>(
      (_state, prev, { px }) => {
        document.documentElement.dataset['fontSize'] =
          `${px}:${prev ? 'update' : 'initial'}`
      }
    )

    const script = createInlineThemeScript({
      key: 'test',
      config: CONFIG,
      handler: combine(setFontSize({ px: 18 }), (state) => {
        document.documentElement.dataset['plain'] =
          state.resolvedThemes.contrast
      }),
    })

    new Function(script)()

    expect(root.dataset['fontSize']).toBe('18:initial')

    expect(root.dataset['plain']).toBe('standard')

    const store = createThemeStore(CONFIG, { storage: null })

    store.subscribe(setFontSize({ px: 20 }))

    store.setThemes({ contrast: 'high' })

    expect(root.dataset['fontSize']).toBe('20:update')
  })

  it('should leave first-paint no-ops out of the inline script', () => {
    const script = createInlineThemeScript({
      config: CONFIG,
      handler: combine(setDataAttributes(), disableTransitions()),
    })

    expect(script).not.toContain('transition:none')

    new Function(script)()

    expect(root.dataset['colorScheme']).toBe('dark')

    // Alone, it still yields a function the script can call.
    new Function(
      createInlineThemeScript({ config: CONFIG, handler: disableTransitions() })
    )()

    expect(transitionStyles()).toHaveLength(0)
  })

  it('should escape options for an inline <script>', () => {
    const script = createInlineThemeScript({
      config: CONFIG,
      handler: setThemeColor({ values: { dark: '</script>' } }),
    })

    expect(script).not.toContain('</script>')

    new Function(script)()

    expect(themeColorMetas()[0]!.content).toBe('</script>')
  })
})

describe('resonare/lite/effects', () => {
  const applyTheme = liteCombine(
    liteSetDataAttributes(),
    liteSetColorScheme(),
    liteSetThemeColor({ light: '#fff', dark: '#000' }),
    liteDisableTransitions()
  )

  it('should apply the state from the inline script', () => {
    localStorage.setItem('test', 'light')

    new Function(
      createLiteInlineThemeScript({ key: 'test', handler: applyTheme })
    )()

    expect(root.dataset['theme']).toBe('light')

    expect(root.style.colorScheme).toBe('light')

    expect(
      themeColorMetas().map((meta) => {
        return meta.content
      })
    ).toEqual(['#fff'])

    expect(transitionStyles()).toHaveLength(0)
  })

  it('should apply changes from the store', async () => {
    const store = createLiteThemeStore({ storage: null })

    store.subscribe(applyTheme)

    store.setTheme('light')

    expect(root.dataset['theme']).toBe('light')

    expect(root.style.colorScheme).toBe('light')

    expect(themeColorMetas()[0]!.content).toBe('#fff')

    expect(transitionStyles()).toHaveLength(1)

    await nextFrames()

    expect(transitionStyles()).toHaveLength(0)
  })

  it('should not disable transitions when the resolved theme is unchanged', () => {
    // The OS prefers dark, so system -> dark resolves to dark both times.
    const store = createLiteThemeStore({ storage: null })

    store.subscribe(liteDisableTransitions())

    store.setTheme('dark')

    expect(transitionStyles()).toHaveLength(0)
  })

  it('should skip a class mapped to null', () => {
    const store = createLiteThemeStore({ storage: null })

    store.subscribe(liteSetClassNames({ light: null }))

    store.setTheme('dark')

    expect(root.className).toBe('dark')

    store.setTheme('light')

    expect(root.className).toBe('')
  })

  it('should keep the default class when given undefined', () => {
    const lightClass: string | undefined = undefined

    // In the inline script too, where JSON drops `undefined`.
    new Function(
      createLiteInlineThemeScript({
        key: 'test',
        handler: liteSetClassNames({ light: lightClass, dark: 'night' }),
      })
    )()

    expect(root.className).toBe('night')

    const store = createLiteThemeStore({ storage: null })

    store.subscribe(liteSetClassNames({ light: lightClass, dark: 'night' }))

    store.setTheme('light')

    expect(root.className).toBe('light')
  })

  it('should swap class names', () => {
    localStorage.setItem('test', 'light')

    new Function(
      createLiteInlineThemeScript({ key: 'test', handler: liteSetClassNames() })
    )()

    expect(root.className).toBe('light')

    const store = createLiteThemeStore({ storage: null, persisted: 'light' })

    store.subscribe(liteSetClassNames())

    store.setTheme('dark')

    expect(root.className).toBe('dark')
  })

  it('should use a custom attribute name', () => {
    const store = createLiteThemeStore({ storage: null })

    store.subscribe(liteSetDataAttributes({ key: 'colorScheme' }))

    store.setTheme('light')

    expect(root.dataset['colorScheme']).toBe('light')
  })

  it('should serialize custom effects with their options', () => {
    const marker = liteDefineEffect<{ light: string; dark: string }>(
      ({ resolvedTheme }, _prev, options) => {
        document.documentElement.dataset['marker'] = options[resolvedTheme]
      }
    )

    new Function(
      createLiteInlineThemeScript({
        key: 'test',
        handler: marker({ light: 'sun', dark: 'moon' }),
      })
    )()

    expect(root.dataset['marker']).toBe('moon')
  })
})

describe('types', () => {
  it('should check settings and values against the config', () => {
    type C = typeof CONFIG

    setClassNames<C>({ colorScheme: { dark: 'dark' } })

    // @ts-expect-error: unknown setting
    setClassNames<C>({ colourScheme: { dark: 'dark' } })

    // @ts-expect-error: `system` never appears in resolved values
    setClassNames<C>({ colorScheme: { system: 'system' } })

    setColorScheme<C>()

    setColorScheme<C>({ key: 'contrast', values: { high: 'dark' } })

    // @ts-expect-error: values must belong to the chosen key
    setColorScheme<C>({ key: 'contrast', values: { dark: 'dark' } })

    setThemeColor<C>({
      values: { light: '#fff', dark: '#000', 'dark-dimmed': '#111' },
    })

    // @ts-expect-error: every value needs a color
    setThemeColor<C>({ values: { light: '#fff', dark: '#000' } })

    // @ts-expect-error: `values` and `cssVar` are exclusive
    setThemeColor<C>({ cssVar: '--bg', values: { light: '#fff' } })

    disableTransitions<C>({ keys: ['colorScheme', 'contrast'] })

    // @ts-expect-error: unknown setting
    disableTransitions<C>({ keys: ['mode'] })

    const MODE = {
      mode: { options: ['light', 'dark'] },
    } as const satisfies ThemeStoreConfig

    setColorScheme<typeof MODE>({ key: 'mode' })

    // @ts-expect-error: without a `colorScheme` setting, `key` is required
    setColorScheme<typeof MODE>()

    // Without a config type, anything goes.
    setThemeColor({ key: 'whatever', values: { a: '#fff' } })
  })
})
