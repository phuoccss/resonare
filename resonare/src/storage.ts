import { DEFAULT_KEY } from './constants'

/**
 * Where a store saves its state. Values are strings: the full store saves
 * JSON, the lite store saves the theme name.
 */
export type StorageAdapter = {
  /** Returns the saved value, or `null` when nothing is saved. */
  get: () => string | null
  /** Saves a value. */
  set: (value: string) => void
  /** Optional: tells other tabs about a value just saved with `set`. */
  broadcast?: (value: string) => void
  /**
   * Optional: calls `cb` when another tab saves a value (`null` when it clears
   * it). Returns a function that stops watching. Used by `store.sync()`.
   */
  watch?: (cb: (value: string | null) => void) => () => void
}

/**
 * What a store's `storage` option takes: a function that creates the adapter.
 * `abortController` is aborted when the store is destroyed; use it to remove
 * listeners.
 */
export type StorageAdapterCreate = ({
  abortController,
}: {
  abortController: AbortController
}) => StorageAdapter

/**
 * Shape of the built-in adapters such as `localStorageAdapter`: takes options
 * (like the key) and returns a {@link StorageAdapterCreate}.
 */
export type StorageAdapterCreator<Options> = (
  options: Options
) => StorageAdapterCreate

/**
 * Saves the store in `localStorage` (default) or `sessionStorage` under `key`,
 * and supports `store.sync()` across tabs. If storage is blocked or full,
 * reads return nothing and writes are skipped.
 *
 * @example
 *   import { createThemeStore, localStorageAdapter } from 'resonare'
 *
 *   const store = createThemeStore(
 *     { colorMode: { options: ['light', 'dark'] } },
 *     { storage: localStorageAdapter({ key: 'app', type: 'localStorage' }) }
 *   )
 */
export const localStorageAdapter: StorageAdapterCreator<{
  key: string
  type?: 'localStorage' | 'sessionStorage'
}> = ({ key, type = 'localStorage' }) => {
  return ({ abortController }) => {
    return {
      // Storage access throws when it is blocked (e.g. cookies disabled,
      // sandboxed iframes) or full.
      get: () => {
        try {
          return window[type].getItem(key)
        } catch {
          return null
        }
      },

      set: (value) => {
        try {
          window[type].setItem(key, value)
        } catch {}
      },

      watch: (cb) => {
        const listener = (e: StorageEvent) => {
          if (e.storageArea === window[type] && e.key === key) {
            cb(e.newValue)
          }
        }

        // Passing the controller as options (it has `signal`) removes the
        // listener when the store is destroyed.
        addEventListener('storage', listener, abortController)

        return () => {
          removeEventListener('storage', listener)
        }
      },
    }
  }
}

/**
 * Keeps the store in memory only, and supports `store.sync()` across tabs
 * through `BroadcastChannel`. Use it when you save the state yourself (e.g.
 * `toPersist()` to a database) and don't want it in `localStorage`.
 *
 * @example
 *   import { createThemeStore, memoryStorageAdapter } from 'resonare'
 *
 *   const store = createThemeStore(
 *     { colorMode: { options: ['light', 'dark'] } },
 *     { storage: memoryStorageAdapter({ key: 'app' }) }
 *   )
 */
export const memoryStorageAdapter: StorageAdapterCreator<{
  key: string
}> = ({ key }) => {
  return ({ abortController }) => {
    const storage = new Map<string, string>()

    const channel = new BroadcastChannel(DEFAULT_KEY)

    // An open channel keeps a Node process alive.
    abortController.signal.addEventListener('abort', () => {
      channel.close()
    })

    return {
      get: () => {
        return storage.get(key) ?? null
      },

      set: (value) => {
        storage.set(key, value)
      },

      broadcast: (value) => {
        channel.postMessage({ key, value })
      },

      watch: (cb) => {
        const listener = (e: MessageEvent) => {
          if (e.data.key === key) {
            storage.set(key, e.data.value)

            cb(e.data.value)
          }
        }

        channel.addEventListener('message', listener)

        return () => {
          channel.removeEventListener('message', listener)
        }
      },
    }
  }
}
