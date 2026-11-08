import { afterEach, beforeEach, describe, expect, it, vi } from 'vite-plus/test'

import { createInlineThemeScript, createThemeStore } from '../dist/lite'
import { mockStorage, setSystemColorScheme } from './utils'

const OPTIONS = {
  storage: () => {
    return mockStorage
  },
} as const

describe('ThemeStore', () => {
  beforeEach(() => {
    vi.clearAllMocks()

    setSystemColorScheme('light')
  })

  afterEach(() => {
    vi.restoreAllMocks()
  })

  it('should create a ThemeStore instance', () => {
    const themeStore = createThemeStore(OPTIONS)

    expect(themeStore).toBeDefined()
  })

  it('should default to system and resolve against the OS', () => {
    const themeStore = createThemeStore(OPTIONS)

    expect(themeStore.getSnapshot().theme).toBe('system')

    expect(themeStore.getSnapshot().resolvedTheme).toBe('light')

    expect(themeStore.getSnapshot().systemTheme).toBe('light')
  })

  it('should set theme', () => {
    const themeStore = createThemeStore(OPTIONS)

    themeStore.setTheme('dark')

    expect(themeStore.getSnapshot().theme).toBe('dark')

    expect(themeStore.getSnapshot().resolvedTheme).toBe('dark')

    expect(mockStorage.set).toHaveBeenCalledWith('dark')

    expect(mockStorage.broadcast).toHaveBeenCalledWith('dark')

    themeStore.setTheme((current) => {
      return current === 'light' ? 'dark' : 'light'
    })

    expect(themeStore.getSnapshot().theme).toBe('light')
  })

  it('should respond to OS preferences', () => {
    setSystemColorScheme('dark')

    const themeStore = createThemeStore(OPTIONS)

    expect(themeStore.getSnapshot().resolvedTheme).toBe('dark')

    expect(themeStore.getSnapshot().systemTheme).toBe('dark')
  })

  it('should restore from persisted state', () => {
    setSystemColorScheme('dark')

    const themeStore = createThemeStore({
      ...OPTIONS,
      persisted: 'light',
    })

    expect(themeStore.getSnapshot().theme).toBe('light')

    expect(themeStore.getSnapshot().resolvedTheme).toBe('light')

    expect(themeStore.getSnapshot().systemTheme).toBe('dark')
  })

  it('should restore from storage', () => {
    setSystemColorScheme('dark')

    mockStorage.get.mockReturnValue('light')

    const themeStore = createThemeStore(OPTIONS)

    themeStore.restore()

    expect(themeStore.getSnapshot().theme).toBe('light')

    expect(themeStore.getSnapshot().resolvedTheme).toBe('light')
  })

  it('should do nothing when restoring from empty storage', () => {
    mockStorage.get.mockReturnValue(null)

    const themeStore = createThemeStore(OPTIONS)

    themeStore.setTheme('light')

    themeStore.restore()

    expect(themeStore.getSnapshot().theme).toBe('light')
  })

  it('should keep a fixed server snapshot that ignores media and storage', () => {
    setSystemColorScheme('dark')

    mockStorage.get.mockReturnValue('dark')

    const themeStore = createThemeStore(OPTIONS)

    const serverSnapshot = themeStore.getServerSnapshot()

    expect(serverSnapshot).toEqual({
      theme: 'system',
      resolvedTheme: 'light',
      systemTheme: 'light',
    })

    themeStore.restore()

    themeStore.setTheme('light')

    expect(themeStore.getServerSnapshot()).toBe(serverSnapshot)
  })

  it('should subscribe and unsubscribe to theme changes', () => {
    const themeStore = createThemeStore(OPTIONS)

    const mockListener = vi.fn()

    const unsubscribe = themeStore.subscribe(mockListener)

    themeStore.setTheme('dark')

    unsubscribe()

    themeStore.setTheme('light')

    expect(mockListener).toHaveBeenNthCalledWith(1, {
      theme: 'dark',
      resolvedTheme: 'dark',
      systemTheme: 'light',
    })

    expect(mockListener).toHaveBeenCalledTimes(1)
  })

  it('should resolve the system theme even when it is not selected', () => {
    setSystemColorScheme('dark')

    const themeStore = createThemeStore(OPTIONS)

    themeStore.setTheme('light')

    expect(themeStore.getSnapshot().systemTheme).toBe('dark')
  })
})

describe('createInlineThemeScript', () => {
  afterEach(() => {
    vi.restoreAllMocks()
  })

  it('should fall back to system when storage is blocked', () => {
    setSystemColorScheme('dark')

    vi.spyOn(window, 'localStorage', 'get').mockImplementation(() => {
      throw new DOMException('The operation is insecure.', 'SecurityError')
    })

    new Function(
      createInlineThemeScript({
        key: 'test',
        handler: (value) => {
          ;(globalThis as any).__inlineThemeResult = value
        },
      })
    )()

    expect((globalThis as any).__inlineThemeResult).toEqual({
      theme: 'system',
      resolvedTheme: 'dark',
      systemTheme: 'dark',
    })
  })

  it('should escape the key and accept a method shorthand handler', () => {
    const key = "it's</script>"

    localStorage.setItem(key, 'dark')

    const inlineScript = createInlineThemeScript({
      key,
      handler(value) {
        ;(globalThis as any).__inlineThemeResult = value
      },
    })

    expect(inlineScript).not.toContain('</script>')

    new Function(inlineScript)()

    expect((globalThis as any).__inlineThemeResult.theme).toBe('dark')

    localStorage.clear()
  })
})
