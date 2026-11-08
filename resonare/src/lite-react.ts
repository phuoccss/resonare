import * as React from 'react'

import type { ThemeStore } from './lite'

/**
 * Returns the store's current state (see `store.getSnapshot()`) and its
 * methods, and re-renders the component when the state changes. Server
 * rendering and hydration are handled automatically.
 *
 * @example
 *   import { createThemeStore } from 'resonare/lite'
 *   import { useResonare } from 'resonare/lite/react'
 *
 *   const store = createThemeStore()
 *
 *   function ThemeToggle() {
 *     const { resolvedTheme, setTheme } = useResonare(store)
 *
 *     return (
 *       <button
 *         onClick={() => {
 *           setTheme(resolvedTheme === 'dark' ? 'light' : 'dark')
 *         }}
 *       >
 *         {resolvedTheme}
 *       </button>
 *     )
 *   }
 */
export function useResonare(store: ThemeStore) {
  const {
    destroy,
    getServerSnapshot,
    getSnapshot,
    restore,
    setTheme,
    subscribe,
    sync,
  } = store

  const snapshot = React.useSyncExternalStore(
    subscribe,
    getSnapshot,
    getServerSnapshot
  )

  return { ...snapshot, destroy, restore, setTheme, subscribe, sync }
}
