<script setup lang="ts">
import { useResonare } from 'resonare/lite/vue'

import { store } from './store'

// hydrate: render the server state first so hydration matches, then switch.
const { theme, resolvedTheme, setTheme } = useResonare(store, {
  hydrate: true,
})

const onChange = (event: Event) => {
  setTheme((event.target as HTMLSelectElement).value as typeof theme.value)
}
</script>

<template>
  <main>
    <h1>resonare + Nuxt</h1>
    <select
      aria-label="Theme"
      data-testid="theme"
      :value="theme"
      @change="onChange"
    >
      <option value="system">System</option>
      <option value="light">Light</option>
      <option value="dark">Dark</option>
    </select>
    <p data-testid="resolved">{{ resolvedTheme }}</p>
  </main>
</template>
