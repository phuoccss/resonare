import {
  afterEach,
  beforeEach,
  describe,
  expect,
  expectTypeOf,
  it,
  vi,
} from 'vite-plus/test'

import {
  type ThemeStoreConfig,
  createInlineThemeScript,
  createThemeStore,
  getThemesAndOptions,
  localStorageAdapter,
  memoryStorageAdapter,
} from '../dist'
import { mockStorage, setSystemColorScheme } from './utils'

const CONFIG = {
  colorScheme: {
    options: [
      {
        value: 'system',
        media: ['(prefers-color-scheme: dark)', 'dark', 'light'],
      },
      'light',
      'light-modern',
      'dark',
      'dark-modern',
    ],
  },
  contrast: {
    options: ['standard', 'high'],
  },
  sidebar: { defaultValue: 200 },
} as const satisfies ThemeStoreConfig

const OPTIONS = {
  storage: () => {
    return mockStorage
  },
} as const

describe('getThemesAndOptions', () => {
  it('should return the themes and options', () => {
    const themesAndOptions = getThemesAndOptions(CONFIG)

    expect(themesAndOptions).toEqual([
      [
        'colorScheme',
        ['system', 'light', 'light-modern', 'dark', 'dark-modern'],
      ],
      ['contrast', ['standard', 'high']],
      ['sidebar', []],
    ])
  })
})

describe('types', () => {
  it('should accept a config written `as const` without `satisfies`', () => {
    const config = {
      colorScheme: {
        options: [
          'light',
          'dark',
          {
            value: 'system',
            media: ['(prefers-color-scheme: dark)', 'dark', 'light'],
          },
        ],
      },
      size: {
        options: [1, 2, { value: 0, media: ['(min-width: 600px)', 2, 1] }],
      },
    } as const

    const themeStore = createThemeStore(config, { storage: null })

    expectTypeOf(themeStore.getSnapshot().themes.colorScheme).toEqualTypeOf<
      'light' | 'dark' | 'system'
    >()

    expectTypeOf(themeStore.getSnapshot().resolvedSystemThemes).toEqualTypeOf<{
      colorScheme: 'light' | 'dark'
      size: 1 | 2
    }>()
  })
})

describe('ThemeStore', () => {
  beforeEach(() => {
    vi.clearAllMocks()

    setSystemColorScheme('light')
  })

  afterEach(() => {
    vi.restoreAllMocks()
  })

  it('should create a ThemeStore instance', () => {
    const themeStore = createThemeStore(CONFIG, OPTIONS)

    expect(themeStore).toBeDefined()
  })

  it('should get default themes', () => {
    const themeStore = createThemeStore(CONFIG, OPTIONS)

    expect(themeStore.getSnapshot().themes).toEqual({
      colorScheme: 'system',
      contrast: 'standard',
      sidebar: 200,
    })

    expect(themeStore.getSnapshot().resolvedThemes).toEqual({
      colorScheme: 'light',
      contrast: 'standard',
      sidebar: 200,
    })

    expect(themeStore.getSnapshot()).toEqual({
      themes: {
        colorScheme: 'system',
        contrast: 'standard',
        sidebar: 200,
      },
      resolvedThemes: {
        colorScheme: 'light',
        contrast: 'standard',
        sidebar: 200,
      },
      resolvedSystemThemes: {
        colorScheme: 'light',
      },
    })
  })

  it('should set themes', () => {
    const themeStore = createThemeStore(CONFIG, OPTIONS)

    themeStore.setThemes({
      colorScheme: 'dark',
      contrast: 'high',
      sidebar: 300,
    })

    expect(themeStore.getSnapshot().themes).toEqual({
      colorScheme: 'dark',
      contrast: 'high',
      sidebar: 300,
    })

    expect(themeStore.getSnapshot()).toEqual({
      themes: {
        colorScheme: 'dark',
        contrast: 'high',
        sidebar: 300,
      },
      resolvedThemes: {
        colorScheme: 'dark',
        contrast: 'high',
        sidebar: 300,
      },
      resolvedSystemThemes: {
        colorScheme: 'light',
      },
    })

    expect(mockStorage.set).toHaveBeenCalledWith(
      JSON.stringify(themeStore.toPersist())
    )
  })

  it('should respond to OS preferences', () => {
    setSystemColorScheme('dark')

    const themeStore = createThemeStore(CONFIG, OPTIONS)

    expect(themeStore.getSnapshot().resolvedThemes).toEqual({
      colorScheme: 'dark',
      contrast: 'standard',
      sidebar: 200,
    })

    expect(themeStore.getSnapshot()).toEqual({
      themes: {
        colorScheme: 'system',
        contrast: 'standard',
        sidebar: 200,
      },
      resolvedThemes: {
        colorScheme: 'dark',
        contrast: 'standard',
        sidebar: 200,
      },
      resolvedSystemThemes: {
        colorScheme: 'dark',
      },
    })

    themeStore.updateSystemOption('colorScheme', [
      'dark-modern',
      'light-modern',
    ])

    expect(themeStore.getSnapshot().resolvedThemes).toEqual({
      colorScheme: 'dark-modern',
      contrast: 'standard',
      sidebar: 200,
    })

    expect(themeStore.getSnapshot()).toEqual({
      themes: {
        colorScheme: 'system',
        contrast: 'standard',
        sidebar: 200,
      },
      resolvedThemes: {
        colorScheme: 'dark-modern',
        contrast: 'standard',
        sidebar: 200,
      },
      resolvedSystemThemes: {
        colorScheme: 'dark-modern',
      },
    })

    expect(mockStorage.set).toHaveBeenCalledWith(
      JSON.stringify({
        themes: {
          colorScheme: 'system',
          contrast: 'standard',
          sidebar: 200,
        },
        systemOptions: {
          colorScheme: ['dark-modern', 'light-modern'],
        },
      })
    )
  })

  it('should restore from persisted state', () => {
    setSystemColorScheme('dark')

    const themeStore = createThemeStore(CONFIG, {
      ...OPTIONS,
      persisted: {
        themes: {
          colorScheme: 'system',
          contrast: 'high',
          sidebar: 300,
        },
        systemOptions: {
          colorScheme: ['dark-modern', 'light-modern'],
        },
      },
    })

    expect(themeStore.getSnapshot().themes).toEqual({
      colorScheme: 'system',
      contrast: 'high',
      sidebar: 300,
    })

    expect(themeStore.getSnapshot().resolvedThemes).toEqual({
      colorScheme: 'dark-modern',
      contrast: 'high',
      sidebar: 300,
    })
  })

  it('should restore from storage', () => {
    setSystemColorScheme('dark')

    mockStorage.get.mockReturnValue(
      JSON.stringify({
        themes: {
          colorScheme: 'system',
          contrast: 'high',
          sidebar: 300,
        },
        systemOptions: {
          colorScheme: ['dark-modern', 'light-modern'],
        },
      })
    )

    const themeStore = createThemeStore(CONFIG, OPTIONS)

    themeStore.restore()

    expect(themeStore.getSnapshot().themes).toEqual({
      colorScheme: 'system',
      contrast: 'high',
      sidebar: 300,
    })

    expect(themeStore.getSnapshot().resolvedThemes).toEqual({
      colorScheme: 'dark-modern',
      contrast: 'high',
      sidebar: 300,
    })
  })

  it('should do nothing when restoring from empty storage', () => {
    mockStorage.get.mockReturnValue(null)

    const themeStore = createThemeStore(CONFIG, OPTIONS)

    themeStore.setThemes({ colorScheme: 'light' })

    themeStore.restore()

    expect(themeStore.getSnapshot().themes).toEqual({
      colorScheme: 'light',
      contrast: 'standard',
      sidebar: 200,
    })
  })

  it.each(['{oops', 'null', '"light"', '{"themes":null}'])(
    'should ignore malformed storage when restoring: %s',
    (stored) => {
      mockStorage.get.mockReturnValue(stored)

      const themeStore = createThemeStore(CONFIG, OPTIONS)

      expect(() => {
        themeStore.restore()
      }).not.toThrow()

      expect(themeStore.getSnapshot().themes).toEqual({
        colorScheme: 'system',
        contrast: 'standard',
        sidebar: 200,
      })
    }
  )

  it('should keep a fixed server snapshot that ignores media and storage', () => {
    setSystemColorScheme('dark')

    mockStorage.get.mockReturnValue(
      JSON.stringify({ themes: { contrast: 'high' } })
    )

    const themeStore = createThemeStore(CONFIG, {
      ...OPTIONS,
      persisted: { themes: { sidebar: 300 } },
    })

    const serverSnapshot = themeStore.getServerSnapshot()

    expect(serverSnapshot).toEqual({
      themes: { colorScheme: 'system', contrast: 'standard', sidebar: 300 },
      resolvedThemes: {
        colorScheme: 'light',
        contrast: 'standard',
        sidebar: 300,
      },
      resolvedSystemThemes: { colorScheme: 'light' },
    })

    expect(themeStore.getSnapshot().resolvedThemes.colorScheme).toBe('dark')

    themeStore.restore()

    themeStore.setThemes({ colorScheme: 'dark-modern' })

    expect(themeStore.getServerSnapshot()).toBe(serverSnapshot)
  })

  it('should resolve media options to the not-matched value without matchMedia', () => {
    vi.stubGlobal('matchMedia', undefined)

    const themeStore = createThemeStore(CONFIG, {
      ...OPTIONS,
      persisted: {
        systemOptions: { colorScheme: ['dark-modern', 'light-modern'] },
      },
    })

    expect(themeStore.getSnapshot().resolvedThemes.colorScheme).toBe(
      'light-modern'
    )

    expect(themeStore.getSnapshot().resolvedSystemThemes).toEqual({
      colorScheme: 'light-modern',
    })

    vi.unstubAllGlobals()
  })

  it('should not share arrays or objects with callers', () => {
    const persistedPair: [string, string] = ['dark-modern', 'light-modern']

    const themeStore = createThemeStore(CONFIG, {
      ...OPTIONS,
      persisted: { systemOptions: { colorScheme: persistedPair } },
    })

    persistedPair[1] = 'dark'

    const pair: Parameters<typeof themeStore.updateSystemOption>[1] = [
      'dark',
      'light',
    ]

    themeStore.updateSystemOption('colorScheme', pair)

    pair[1] = 'dark-modern'

    const persisted = themeStore.toPersist()

    ;(persisted.themes as Record<string, unknown>)['contrast'] = 'high'

    persisted.systemOptions['colorScheme']![1] = 'dark-modern'

    expect(themeStore.getSnapshot().themes.contrast).toBe('standard')

    expect(themeStore.toPersist().systemOptions).toEqual({
      colorScheme: ['dark', 'light'],
    })

    expect(themeStore.getSnapshot().resolvedSystemThemes).toEqual({
      colorScheme: 'light',
    })
  })

  it('should reset to defaults when another tab clears storage', () => {
    const themeStore = createThemeStore(CONFIG, OPTIONS)

    themeStore.sync()

    themeStore.setThemes({ colorScheme: 'dark', contrast: 'high' })

    themeStore.updateSystemOption('colorScheme', [
      'dark-modern',
      'light-modern',
    ])

    const onRemoteUpdate = mockStorage.watch.mock.calls[0][0]

    onRemoteUpdate(null)

    expect(themeStore.getSnapshot().themes).toEqual({
      colorScheme: 'system',
      contrast: 'standard',
      sidebar: 200,
    })

    expect(themeStore.toPersist().systemOptions).toEqual({
      colorScheme: ['dark', 'light'],
    })
  })

  it('should ignore malformed remote updates when syncing', () => {
    const themeStore = createThemeStore(CONFIG, OPTIONS)

    themeStore.sync()

    const onRemoteUpdate = mockStorage.watch.mock.calls[0][0]

    expect(() => {
      onRemoteUpdate('{oops')
    }).not.toThrow()

    onRemoteUpdate(JSON.stringify({ themes: { contrast: 'high' } }))

    expect(themeStore.getSnapshot().themes.contrast).toBe('high')
  })

  it('should subscribe and unsubscribe to theme changes', () => {
    const themeStore = createThemeStore(CONFIG, OPTIONS)

    const mockListener = vi.fn()

    const unsubscribe = themeStore.subscribe(mockListener)

    themeStore.setThemes({ contrast: 'high' })

    unsubscribe()

    themeStore.setThemes({ contrast: 'standard' })

    expect(mockListener).toHaveBeenNthCalledWith(1, {
      themes: { colorScheme: 'system', contrast: 'high', sidebar: 200 },
      resolvedThemes: { colorScheme: 'light', contrast: 'high', sidebar: 200 },
      resolvedSystemThemes: { colorScheme: 'light' },
    })

    expect(mockListener).toHaveBeenCalledTimes(1)
  })

  it('should resolve system option even when it is not selected', () => {
    setSystemColorScheme('dark')

    const themeStore = createThemeStore(CONFIG, OPTIONS)

    themeStore.setThemes({ colorScheme: 'light' })

    expect(themeStore.getSnapshot().resolvedSystemThemes).toEqual({
      colorScheme: 'dark',
    })

    themeStore.updateSystemOption('colorScheme', [
      'dark-modern',
      'light-modern',
    ])

    expect(themeStore.getSnapshot().resolvedSystemThemes).toEqual({
      colorScheme: 'dark-modern',
    })
  })
})

describe('localStorageAdapter', () => {
  afterEach(() => {
    vi.restoreAllMocks()

    localStorage.clear()
  })

  it('should not throw when storage is blocked', () => {
    vi.spyOn(window, 'localStorage', 'get').mockImplementation(() => {
      throw new DOMException('The operation is insecure.', 'SecurityError')
    })

    const themeStore = createThemeStore(CONFIG, {
      storage: localStorageAdapter({ key: 'test' }),
    })

    expect(() => {
      themeStore.restore()

      themeStore.setThemes({ contrast: 'high' })
    }).not.toThrow()

    expect(themeStore.getSnapshot().themes.contrast).toBe('high')
  })
})

describe('memoryStorageAdapter', () => {
  afterEach(() => {
    vi.restoreAllMocks()
  })

  it('should store remote updates so `get` returns them', async () => {
    const abortController = new AbortController()

    const sender = memoryStorageAdapter({ key: 'test' })({ abortController })

    const receiver = memoryStorageAdapter({ key: 'test' })({ abortController })

    const onRemoteUpdate = vi.fn()

    receiver.watch!(onRemoteUpdate)

    sender.broadcast!('remote')

    await vi.waitFor(() => {
      expect(onRemoteUpdate).toHaveBeenCalledWith('remote')
    })

    expect(receiver.get()).toBe('remote')

    abortController.abort()
  })

  it('should close its channel when the store is destroyed', () => {
    const close = vi.spyOn(BroadcastChannel.prototype, 'close')

    const themeStore = createThemeStore(CONFIG, {
      storage: memoryStorageAdapter({ key: 'test' }),
    })

    expect(close).not.toHaveBeenCalled()

    themeStore.destroy()

    expect(close).toHaveBeenCalledOnce()
  })
})

describe('createInlineThemeScript', () => {
  const script = createInlineThemeScript({
    key: 'test',
    config: CONFIG,
    handler: (value) => {
      ;(globalThis as any).__inlineThemeResult = value
    },
  })

  beforeEach(() => {
    setSystemColorScheme('dark')

    delete (globalThis as any).__inlineThemeResult
  })

  afterEach(() => {
    vi.restoreAllMocks()

    localStorage.clear()
  })

  const defaults = {
    themes: { colorScheme: 'system', contrast: 'standard', sidebar: 200 },
    resolvedThemes: { colorScheme: 'dark', contrast: 'standard', sidebar: 200 },
    resolvedSystemThemes: { colorScheme: 'dark' },
  }

  it('should read persisted themes', () => {
    localStorage.setItem(
      'test',
      JSON.stringify({ themes: { contrast: 'high' } })
    )

    new Function(script)()

    expect((globalThis as any).__inlineThemeResult.themes.contrast).toBe('high')
  })

  it.each(['{oops', 'null'])(
    'should fall back to defaults on malformed storage: %s',
    (stored) => {
      localStorage.setItem('test', stored)

      new Function(script)()

      expect((globalThis as any).__inlineThemeResult).toEqual(defaults)
    }
  )

  it('should fall back to defaults when storage is blocked', () => {
    vi.spyOn(window, 'localStorage', 'get').mockImplementation(() => {
      throw new DOMException('The operation is insecure.', 'SecurityError')
    })

    new Function(script)()

    expect((globalThis as any).__inlineThemeResult).toEqual(defaults)
  })

  it('should escape the key and config for an inline <script>', () => {
    const key = "it's</script><script>alert(1)//"

    localStorage.setItem(key, JSON.stringify({ themes: { contrast: 'high' } }))

    const inlineScript = createInlineThemeScript({
      key,
      config: {
        ...CONFIG,
        contrast: { options: ['standard', 'high', '</script>'] },
      },
      handler: (value) => {
        ;(globalThis as any).__inlineThemeResult = value
      },
    })

    expect(inlineScript).not.toContain('</script>')

    new Function(inlineScript)()

    expect((globalThis as any).__inlineThemeResult.themes.contrast).toBe('high')
  })

  it.each([
    {
      name: 'method shorthand',
      param: {
        handler(value: any) {
          ;(globalThis as any).__inlineThemeResult = value
        },
      },
    },
    {
      name: 'async method shorthand',
      param: {
        async handler(value: any) {
          ;(globalThis as any).__inlineThemeResult = value
        },
      },
    },
    {
      name: 'function expression',
      param: {
        handler: function (value: any) {
          ;(globalThis as any).__inlineThemeResult = value
        },
      },
    },
    {
      name: 'parameterless arrow',
      param: {
        handler: () => {
          ;(globalThis as any).__inlineThemeResult = 'called'
        },
      },
    },
  ])('should accept a $name handler', ({ param }) => {
    new Function(
      createInlineThemeScript({ key: 'test', config: CONFIG, ...param })
    )()

    expect((globalThis as any).__inlineThemeResult).toBeDefined()
  })
})
