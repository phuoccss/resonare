import * as React from 'react'

import type { ThemeStore, ThemeStoreConfig } from '.'

/**
 * Returns the store's current state (see `store.getSnapshot()`) and its
 * methods, and re-renders the component when the state changes. Server
 * rendering and hydration are handled automatically.
 *
 * @example
 *   import { useResonare } from 'resonare/react'
 *
 *   function ColorModeToggle() {
 *     const { themes, setThemes } = useResonare(store)
 *
 *     const next = themes.colorMode === 'dark' ? 'light' : 'dark'
 *
 *     return (
 *       <button
 *         onClick={() => {
 *           setThemes({ colorMode: next })
 *         }}
 *       >
 *         {themes.colorMode}
 *       </button>
 *     )
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

  const snapshot = React.useSyncExternalStore(
    subscribe,
    getSnapshot,
    getServerSnapshot
  )

  return {
    ...snapshot,
    destroy,
    restore,
    setThemes,
    subscribe,
    sync,
    toPersist,
    updateSystemOption,
  }
}
