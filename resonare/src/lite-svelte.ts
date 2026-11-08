import { createSubscriber } from 'svelte/reactivity'

import type { ThemeStore } from './lite'

/**
 * Returns the store's state (`theme`, `resolvedTheme`, `systemTheme`), each
 * read through `.current`, and its methods. `.current` is reactive in
 * templates, `$derived` and `$effect`, and the store is subscribed only while
 * something reads it. Hydration needs nothing extra: Svelte fixes any markup
 * that differs from the server's.
 *
 * @example
 *   <script lang="ts">
 *   import { createThemeStore } from 'resonare/lite'
 *   import { useResonare } from 'resonare/lite/svelte'
 *
 *   const store = createThemeStore()
 *   const { resolvedTheme, setTheme } = useResonare(store)
 *   </script>
 *
 *   <p>Theme: {resolvedTheme.current}</p>
 *   <button onclick={() => setTheme('dark')}>Dark</button>
 */
export function useResonare(store: ThemeStore) {
  const { destroy, getSnapshot, restore, setTheme, subscribe, sync } = store

  const track = createSubscriber((update) => {
    return subscribe(() => {
      update()
    })
  })

  const read = () => {
    track()

    return getSnapshot()
  }

  return {
    theme: {
      get current() {
        return read().theme
      },
    },
    resolvedTheme: {
      get current() {
        return read().resolvedTheme
      },
    },
    systemTheme: {
      get current() {
        return read().systemTheme
      },
    },
    destroy,
    restore,
    setTheme,
    subscribe,
    sync,
  }
}
