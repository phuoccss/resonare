# resonare + Nuxt

A light / dark / system toggle with no flash on load, for a Nuxt 4 app, using `resonare/lite`.

This recipe is the [`examples/nuxt`](https://github.com/phuoccss/resonare/tree/main/examples/nuxt) app, which CI builds and tests in a browser on every change: the saved theme is applied before any app script runs, the page hydrates without warnings, the toggle saves, `system` follows the OS, and tabs stay in sync.

## 1. Theme module

Effects and the inline script. `nuxt.config.ts` imports this module, so it must not touch browser APIs.

```ts app/theme.ts
import { createInlineThemeScript } from 'resonare/lite'
import {
  combine,
  disableTransitions,
  setClassNames,
  setColorScheme,
  setThemeColor,
} from 'resonare/lite/effects'

// class="dark" in dark mode, no class in light mode.
export const applyTheme = combine(
  setClassNames({ light: null }),
  setColorScheme(),
  setThemeColor({ light: '#ffffff', dark: '#0a0a0a' }),
  disableTransitions()
)

// Imported by nuxt.config.ts, so keep this module free of browser-only code.
export const themeScript = createInlineThemeScript({ handler: applyTheme })
```

## 2. Script in `<head>`

`app.head` puts the script in every server-rendered page:

```ts nuxt.config.ts
import { themeScript } from './app/theme'

export default defineNuxtConfig({
  compatibilityDate: '2026-11-01',
  app: {
    head: {
      // In every server-rendered page, so it runs before first paint.
      script: [{ innerHTML: themeScript }],
    },
  },
})
```

## 3. Store

Guarded with `import.meta.client`, so the server never touches `localStorage`.

```ts app/store.ts
import { createThemeStore } from 'resonare/lite'

import { applyTheme } from './theme'

export const store = createThemeStore()

if (import.meta.client) {
  store.subscribe(applyTheme)

  store.restore()

  store.sync()
}
```

## 4. Toggle

Pass `{ hydrate: true }` to `useResonare` in any server-rendered Vue app. It renders the server state first so hydration matches, then switches to the saved theme. Without it, Vue reports "Hydration completed but contains mismatches" whenever the saved theme differs from the server's.

```vue app/app.vue
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
```

## Styling

`setClassNames({ light: null })` puts a `dark` class on `<html>` in dark mode and no class in light mode, so style from that class rather than from component state:

```css
.dark {
  --background: #0a0a0a;
  --foreground: #ededed;
}
```

With Tailwind, point its dark variant at the class: `@custom-variant dark (&:where(.dark, .dark *));`. If you'd rather style from an attribute, use `setDataAttributes()` in place of `setClassNames` (not alongside it): it writes `data-theme="dark"`, so select on `:root[data-theme='dark']`.

## More than light / dark?

`resonare/lite` covers a single light / dark / system preference. For more settings (contrast, spacing, sidebar width) or custom values such as `dark-dimmed`, switch to the full `resonare`. Only the theme module and the toggle change:

- **Theme module:** describe the settings in a config, import the effects from `resonare/effects`, and pass the config to `createInlineThemeScript({ config, handler })` and `createThemeStore(config)`. Map classes per setting, e.g. `setClassNames({ colorScheme: { dark: 'dark' } })`.
- **Toggle:** `useResonare` from `resonare/vue` returns `themes`, `resolvedThemes` and `setThemes` instead of `theme`, `resolvedTheme` and `setTheme`.

Where the script goes and the framework-specific details above stay the same. The full-version setup is in `llms.txt` ("Setup") and the README ("Quick start").
