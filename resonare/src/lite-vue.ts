import {
  type ComputedRef,
  computed,
  getCurrentInstance,
  onMounted,
  onScopeDispose,
  onUnmounted,
  shallowRef,
} from 'vue'

import type { ThemeStore } from './lite'

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
 * Returns the store's state as computed refs (`theme`, `resolvedTheme`,
 * `systemTheme`) and its methods. Call it in `setup` (or inside an
 * `effectScope`); the subscription ends when the component unmounts or the
 * scope stops.
 *
 * @example
 *   <script setup lang="ts">
 *   import { createThemeStore } from 'resonare/lite'
 *   import { useResonare } from 'resonare/lite/vue'
 *
 *   const store = createThemeStore()
 *
 *   // hydrate: true only in server-rendered apps
 *   const { resolvedTheme, setTheme } = useResonare(store, { hydrate: true })
 *   </script>
 *
 *   <template>
 *   <p>Theme: {{ resolvedTheme }}</p>
 *   <button @click="setTheme('dark')">Dark</button>
 *   </template>
 */
export function useResonare(
  store: ThemeStore,
  { hydrate = false }: UseResonareOptions = {}
) {
  const {
    destroy,
    getServerSnapshot,
    getSnapshot,
    restore,
    setTheme,
    subscribe,
    sync,
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
    theme: computed(() => {
      return snapshot.value.theme
    }) as ComputedRef<ReturnType<ThemeStore['getSnapshot']>['theme']>,
    resolvedTheme: computed(() => {
      return snapshot.value.resolvedTheme
    }) as ComputedRef<ReturnType<ThemeStore['getSnapshot']>['resolvedTheme']>,
    systemTheme: computed(() => {
      return snapshot.value.systemTheme
    }) as ComputedRef<ReturnType<ThemeStore['getSnapshot']>['systemTheme']>,
    destroy,
    restore,
    setTheme,
    subscribe,
    sync,
  }
}
