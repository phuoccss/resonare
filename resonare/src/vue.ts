import {
  type ComputedRef,
  computed,
  getCurrentInstance,
  onMounted,
  onScopeDispose,
  onUnmounted,
  shallowRef,
} from 'vue'

import type { ThemeStore, ThemeStoreConfig, Themes } from '.'

type UseResonareOptions = {
  /**
   * Set this in server-rendered apps. The first render then uses the server
   * state so hydration matches the server HTML, and switches to the live state
   * once mounted. Leave it off in client-only apps, where it would show the
   * server state for one frame.
   */
  hydrate?: boolean
}

/**
 * Returns the store's state as computed refs (`themes`, `resolvedThemes`,
 * `resolvedSystemThemes`) and its methods. Call it in `setup` (or inside an
 * `effectScope`); the subscription ends when the component unmounts or the
 * scope stops.
 *
 * @example
 *   <script setup lang="ts">
 *   import { useResonare } from 'resonare/vue'
 *
 *   // hydrate: true only in server-rendered apps
 *   const { themes, setThemes } = useResonare(store, { hydrate: true })
 *   </script>
 *
 *   <template>
 *   <p>Color mode: {{ themes.colorMode }}</p>
 *   <button @click="setThemes({ colorMode: 'dark' })">Dark</button>
 *   </template>
 */
export function useResonare<T extends ThemeStoreConfig>(
  store: ThemeStore<T>,
  { hydrate = false }: UseResonareOptions = {}
) {
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

  const instance = getCurrentInstance()

  const snapshot = shallowRef(
    hydrate && instance ? getServerSnapshot() : getSnapshot()
  )

  let unsubscribe: (() => unknown) | undefined

  const start = () => {
    snapshot.value = getSnapshot()

    unsubscribe = subscribe((value) => {
      snapshot.value = value
    })
  }

  const stop = () => {
    unsubscribe?.()
  }

  // Components subscribe on mount, which never runs during server rendering,
  // so the server never holds a subscription. Lifecycle hooks are used because
  // server rendering may set up components without an active effect scope.
  if (instance) {
    onMounted(start)

    onUnmounted(stop)
  } else {
    start()

    onScopeDispose(stop)
  }

  return {
    themes: computed(() => {
      return snapshot.value.themes
    }) as ComputedRef<Themes<T>>,
    resolvedThemes: computed(() => {
      return snapshot.value.resolvedThemes
    }) as ComputedRef<Themes<T>>,
    resolvedSystemThemes: computed(() => {
      return snapshot.value.resolvedSystemThemes
    }) as ComputedRef<
      ReturnType<ThemeStore<T>['getSnapshot']>['resolvedSystemThemes']
    >,
    destroy,
    restore,
    setThemes,
    subscribe,
    sync,
    toPersist,
    updateSystemOption,
  }
}
