import { DEFAULT_LITE_KEY } from './constants'
import { toScriptFunction, toScriptJson } from './script'
import { type StorageAdapterCreate, localStorageAdapter } from './storage'

export * from './storage'

type Theme = 'system' | 'light' | 'dark'

type ResolvedTheme = 'light' | 'dark'

type Snapshot = {
  theme: Theme
  resolvedTheme: ResolvedTheme
  systemTheme: ResolvedTheme
}

type Listener = (value: Snapshot) => void

type ThemeStoreOptions = {
  persisted?: Theme
  storage?: StorageAdapterCreate | null
}

/**
 * Creates a store for a single light / dark / system preference. It saves
 * changes through `storage` (`localStorage` under the key `'resonare/lite'` by
 * default; `null` disables saving), follows `prefers-color-scheme` while the
 * preference is `system`, and notifies subscribers.
 *
 * Read state with `getSnapshot()` or `subscribe`.
 *
 * @example
 *   import { createThemeStore, localStorageAdapter } from 'resonare/lite'
 *
 *   const store = createThemeStore({
 *     storage: localStorageAdapter({ key: 'my-app' }),
 *   })
 *
 *   // In the browser: load the saved choice and follow other tabs.
 *   store.restore()
 *   store.sync()
 *
 *   store.subscribe(({ resolvedTheme }) => {
 *     document.documentElement.dataset.theme = resolvedTheme
 *   })
 *
 *   store.setTheme('dark')
 */
export function createThemeStore({
  persisted,
  storage: createStorage = localStorageAdapter({ key: DEFAULT_LITE_KEY }),
}: ThemeStoreOptions = {}) {
  let theme: Theme = persisted ?? 'system'

  let mediaQuery: MediaQueryList | undefined

  const listeners = new Set<Listener>()

  const abortController = new AbortController()

  const storage = createStorage?.({ abortController })

  // No media support (e.g. on the server): `system` is `light`.
  const resolveSystemTheme = (server?: boolean): ResolvedTheme => {
    if (server || typeof matchMedia === 'undefined') {
      return 'light'
    }

    if (!mediaQuery) {
      mediaQuery = matchMedia('(prefers-color-scheme: dark)')

      mediaQuery.addEventListener(
        'change',
        () => {
          setThemeAndNotify(theme)
        },
        abortController
      )
    }

    return mediaQuery.matches ? 'dark' : 'light'
  }

  const createSnapshot = (server?: boolean): Snapshot => {
    const systemTheme = resolveSystemTheme(server)

    return {
      theme,
      resolvedTheme: theme === 'system' ? systemTheme : theme,
      systemTheme,
    }
  }

  const serverSnapshot = createSnapshot(true)

  let snapshot = createSnapshot()

  const setThemeAndNotify = (next: Theme): void => {
    theme = next

    snapshot = createSnapshot()

    for (const listener of listeners) {
      listener(snapshot)
    }
  }

  return {
    /**
     * Current state:
     *
     * - `theme`: the selected preference (`'system'`, `'light'` or `'dark'`).
     * - `resolvedTheme`: `'light'` or `'dark'`, with `system` resolved.
     * - `systemTheme`: the OS preference, even when `system` isn't selected.
     *
     * Returns the same object until the next change.
     */
    getSnapshot: (): Snapshot => {
      return snapshot
    },

    /**
     * The state as rendered on the server: `persisted` (or `system`), with the
     * OS preference taken as `light`. It never changes, so hydration can match
     * the server HTML even after `restore()`.
     */
    getServerSnapshot: (): Snapshot => {
      return serverSnapshot
    },

    /**
     * Sets the preference, saves it to storage, and notifies subscribers.
     *
     * @example
     *   store.setTheme('dark')
     *   store.setTheme((current) => (current === 'dark' ? 'light' : 'dark'))
     */
    setTheme: (next: Theme | ((current: Theme) => Theme)): void => {
      setThemeAndNotify(typeof next === 'function' ? next(theme) : next)

      storage?.set(theme)

      storage?.broadcast?.(theme)
    },

    /**
     * Loads the saved preference from storage. Does nothing when nothing is
     * saved. Call it in the browser, e.g. after hydration.
     */
    restore: (): void => {
      const stored = storage?.get() as Theme | null | undefined

      if (stored) {
        setThemeAndNotify(stored)
      }
    },

    /**
     * Calls `callback` with the new state (see `getSnapshot`) after every
     * change, including OS preference changes. Returns an unsubscribe
     * function.
     */
    subscribe: (callback: Listener): (() => void) => {
      listeners.add(callback)

      return () => {
        listeners.delete(callback)
      }
    },

    /**
     * Applies changes saved by other tabs (if the storage adapter supports
     * it); when another tab clears the saved value, resets to `system`.
     * Returns a function that stops syncing, or `undefined` when the adapter
     * can't sync.
     */
    sync: (): (() => void) | undefined => {
      return storage?.watch?.((stored) => {
        setThemeAndNotify((stored ?? 'system') as Theme)
      })
    },

    /**
     * Removes all subscribers and stops listening to the OS preference and
     * storage. The store doesn't update after this.
     */
    destroy: (): void => {
      listeners.clear()

      abortController.abort()
    },
  }
}

export type ThemeStore = ReturnType<typeof createThemeStore>

const restoreScript = (key: string, handler: Listener) => {
  let theme: Theme = 'system'

  // Blocked storage must not stop the handler from running.
  try {
    theme = (localStorage.getItem(key) ?? theme) as Theme
  } catch {}

  const systemTheme = matchMedia('(prefers-color-scheme: dark)').matches
    ? 'dark'
    : 'light'

  const resolvedTheme = theme === 'system' ? systemTheme : theme

  handler({ theme, resolvedTheme, systemTheme })
}

/** Options for `createInlineThemeScript`. */
export type ThemeScriptParameter = {
  /** The store's `localStorage` key; defaults to `'resonare/lite'`. */
  key?: string
  /**
   * Applies the state to the page; receives the same value as `subscribe`.
   * It is copied into the script as source code, so it can't use variables
   * from outside the function.
   */
  handler: Listener
}

/**
 * Returns the source of a small script that reads the saved preference from
 * `localStorage` and runs `handler` with it. Put it in an inline `<script>` in
 * the `<head>` so the page has the right theme before first paint.
 *
 * Use the same handler with `store.subscribe` to keep the page updated after
 * that.
 *
 * @example
 *   import { createInlineThemeScript, createThemeStore } from 'resonare/lite'
 *
 *   const handler = ({ resolvedTheme }) => {
 *     document.documentElement.dataset.theme = resolvedTheme
 *   }
 *
 *   const themeScript = createInlineThemeScript({ key: 'my-app', handler })
 *   // In <head>:
 *   // <script dangerouslySetInnerHTML={{ __html: themeScript }} />
 *
 *   const store = createThemeStore()
 *   store.subscribe(handler)
 */
export function createInlineThemeScript({
  key = DEFAULT_LITE_KEY,
  handler,
}: ThemeScriptParameter) {
  return `(${restoreScript})(${toScriptJson(key)},${toScriptFunction(handler)})`
}
