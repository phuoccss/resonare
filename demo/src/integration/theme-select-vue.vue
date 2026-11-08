<script setup lang="ts">
import { useResonare } from 'resonare/vue'
import { onMounted, onUnmounted } from 'vue'

import {
  THEME_LABELS,
  connectThemeStore,
  themeStore,
  themesAndOptions,
} from './shared'

const SECTION_ID = 'vue'

const { themes, setThemes } = useResonare(themeStore, { hydrate: true })

let disconnect: (() => void) | undefined

onMounted(() => {
  disconnect = connectThemeStore()
})

onUnmounted(() => {
  disconnect?.()
})

function onChange(theme: keyof typeof THEME_LABELS, event: Event) {
  const target = event.target

  if (!(target instanceof HTMLSelectElement)) {
    return
  }

  setThemes({
    [theme]: target.value,
  })
}
</script>

<template>
  <div class="theme-select">
    <template
      v-for="[theme, options] in themesAndOptions"
      :key="theme"
    >
      <label :for="`${SECTION_ID}-${theme}`">
        {{ THEME_LABELS[theme] }}
      </label>
      <select
        :id="`${SECTION_ID}-${theme}`"
        :name="theme"
        :value="themes[theme]"
        @change="onChange(theme, $event)"
      >
        <option
          v-for="option in options"
          :key="option"
          :value="option"
        >
          {{ option }}
        </option>
      </select>
    </template>
  </div>
</template>
