import { createSignal, onCleanup, onMount, sharedConfig } from 'solid-js'

import type { ThemeStore } from './lite'

/**
 * Returns the store's state as signals (`theme()`, `resolvedTheme()`,
 * `systemTheme()`) and its methods. Call it inside a component (or
 * `createRoot`); the subscription ends when that owner is cleaned up. Server
 * rendering and hydration are handled automatically.
 *
 * @example
 *   import { createThemeStore } from 'resonare/lite'
 *   import { useResonare } from 'resonare/lite/solid'
 *
 *   const store = createThemeStore()
 *
 *   function ThemeToggle() {
 *     const { resolvedTheme, setTheme } = useResonare(store)
 *
 *     return (
 *       <button
 *         onClick={() => {
 *           setTheme(resolvedTheme() === 'dark' ? 'light' : 'dark')
 *         }}
 *       >
 *         {resolvedTheme()}
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
    theme: () => {
      return snapshot().theme
    },
    resolvedTheme: () => {
      return snapshot().resolvedTheme
    },
    systemTheme: () => {
      return snapshot().systemTheme
    },
    destroy,
    restore,
    setTheme,
    subscribe,
    sync,
  }
}
