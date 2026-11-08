<script setup lang="ts">
import { useResonare } from 'resonare/lite/vue'
import { onMounted, onUnmounted } from 'vue'

import { connectLiteThemeStore, liteThemeStore } from './shared'

const SECTION_ID = 'vue'

const { theme, setTheme } = useResonare(liteThemeStore, { hydrate: true })

let disconnect: (() => void) | undefined

onMounted(() => {
  disconnect = connectLiteThemeStore()
})

onUnmounted(() => {
  disconnect?.()
})
</script>

<template>
  <div class="theme-toggle">
    <input
      type="radio"
      :name="`${SECTION_ID}-theme`"
      :id="`${SECTION_ID}-system`"
      value="system"
      :checked="theme === 'system'"
      @change="setTheme('system')"
    />

    <label :for="`${SECTION_ID}-system`">
      <svg
        width="24"
        height="24"
        aria-hidden="true"
        focusable="false"
        data-system="light"
      >
        <use href="#sun" />
      </svg>

      <svg
        width="24"
        height="24"
        aria-hidden="true"
        focusable="false"
        data-system="dark"
      >
        <use href="#moon" />
      </svg>

      <span>System</span>
    </label>

    <input
      type="radio"
      :name="`${SECTION_ID}-theme`"
      :id="`${SECTION_ID}-light`"
      value="light"
      :checked="theme === 'light'"
      @change="setTheme('light')"
    />

    <label :for="`${SECTION_ID}-light`">
      <svg
        width="24"
        height="24"
        aria-hidden="true"
        focusable="false"
      >
        <use href="#sun" />
      </svg>

      <span>Light</span>
    </label>

    <input
      type="radio"
      :name="`${SECTION_ID}-theme`"
      :id="`${SECTION_ID}-dark`"
      value="dark"
      :checked="theme === 'dark'"
      @change="setTheme('dark')"
    />

    <label :for="`${SECTION_ID}-dark`">
      <svg
        width="24"
        height="24"
        aria-hidden="true"
        focusable="false"
      >
        <use href="#moon" />
      </svg>

      <span>Dark</span>
    </label>
  </div>
</template>
