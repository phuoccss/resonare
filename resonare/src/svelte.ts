import { createSubscriber } from 'svelte/reactivity'

import type { ThemeStore, ThemeStoreConfig } from '.'

/**
 * Returns the store's state (`themes`, `resolvedThemes`,
 * `resolvedSystemThemes`), each read through `.current`, and its methods.
 * `.current` is reactive in templates, `$derived` and `$effect`, and the store
 * is subscribed only while something reads it. Hydration needs nothing extra:
 * Svelte fixes any markup that differs from the server's.
 *
 * @example
 *   <script lang="ts">
 *   import { useResonare } from 'resonare/svelte'
 *
 *   const { themes, setThemes } = useResonare(store)
 *   </script>
 *
 *   <p>Color mode: {themes.current.colorMode}</p>
 *   <button onclick={() => setThemes({ colorMode: 'dark' })}>Dark</button>
 */
export function useResonare<T extends ThemeStoreConfig>(store: ThemeStore<T>) {
  const {
    destroy,
    getSnapshot,
    restore,
    setThemes,
    subscribe,
    sync,
    toPersist,
    updateSystemOption,
  } = store

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
    themes: {
      get current() {
        return read().themes
      },
    },
    resolvedThemes: {
      get current() {
        return read().resolvedThemes
      },
    },
    resolvedSystemThemes: {
      get current() {
        return read().resolvedSystemThemes
      },
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
