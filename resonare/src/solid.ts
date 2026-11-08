import { createSignal, onCleanup, onMount, sharedConfig } from 'solid-js'

import type { ThemeStore, ThemeStoreConfig } from '.'

/**
 * Returns the store's state as signals (`themes()`, `resolvedThemes()`,
 * `resolvedSystemThemes()`) and its methods. Call it inside a component (or
 * `createRoot`); the subscription ends when that owner is cleaned up. Server
 * rendering and hydration are handled automatically.
 *
 * @example
 *   import { useResonare } from 'resonare/solid'
 *
 *   function ColorModeToggle() {
 *     const { themes, setThemes } = useResonare(store)
 *
 *     const toggle = () => {
 *       const isDark = themes().colorMode === 'dark'
 *
 *       setThemes({ colorMode: isDark ? 'light' : 'dark' })
 *     }
 *
 *     return <button onClick={toggle}>{themes().colorMode}</button>
 *   }
 */
export function useResonare<T extends ThemeStoreConfig>(store: ThemeStore<T>) {
  const {
    destroy,
    getServerSnapshot,
    getSnapshot,
    restore,
    setThemes,
    subscribe,
    sync,
    toPersist,
    updateSystemOption,
  } = store

  // Match the server HTML while rendering on the server or hydrating, then
  // switch to the live snapshot once mounted.
  const hydrating = !!sharedConfig.context

  const [snapshot, setSnapshot] = createSignal(
    hydrating ? getServerSnapshot() : getSnapshot()
  )

  const unsubscribe = subscribe((value) => {
    setSnapshot(() => {
      return value
    })
  })

  onCleanup(unsubscribe)

  if (hydrating) {
    onMount(() => {
      setSnapshot(() => {
        return getSnapshot()
      })
    })
  }

  return {
    themes: () => {
      return snapshot().themes
    },
    resolvedThemes: () => {
      return snapshot().resolvedThemes
    },
    resolvedSystemThemes: () => {
      return snapshot().resolvedSystemThemes
    },
    destroy,
    restore,
    setThemes,
    subscribe,
    sync,
    toPersist,
    updateSystemOption,
  }
}
