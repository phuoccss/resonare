# resonare + SvelteKit

A light / dark / system toggle with no flash on load, for a SvelteKit app (written against SvelteKit 3, which uses `#lib` imports), using `resonare/lite`.

This recipe is the [`examples/sveltekit`](https://github.com/phuoccss/resonare/tree/main/examples/sveltekit) app, which CI builds and tests in a browser on every change: the saved theme is applied before any app script runs, the page hydrates without warnings, the toggle saves, `system` follows the OS, and tabs stay in sync.

## 1. Theme module

```ts src/lib/theme.ts
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

export const themeScript = createInlineThemeScript({ handler: applyTheme })

// For {@html} in <svelte:head>. Built here, not in a .svelte file, where
// the closing tag would end the component's own <script> block.
export const themeScriptTag = `<script>${themeScript}</script>`
```

## 2. Store

The browser-only calls are guarded, so the server never touches `localStorage`.

```ts src/lib/store.ts
import { createThemeStore } from 'resonare/lite'

import { applyTheme } from './theme'

export const store = createThemeStore()

if (typeof window !== 'undefined') {
  store.subscribe(applyTheme)

  store.restore()

  store.sync()
}
```

## 3. Script in `<head>`

`<svelte:head>` in the root layout is rendered into the server HTML, so the script runs before first paint. The tag itself is built in `theme.ts` (`themeScriptTag` above): written in a `.svelte` file, its closing `</script>` would end the component's own `<script>` block.

```svelte src/routes/+layout.svelte
<script lang="ts">
  import { themeScriptTag } from '#lib/theme'

  let { children } = $props()
</script>

<!-- Rendered into the server HTML, so it runs before first paint. -->
<svelte:head>
  {@html themeScriptTag}
</svelte:head>

{@render children()}
```

## 4. Toggle

Svelte state is read through `.current`.

```svelte src/routes/+page.svelte
<script lang="ts">
  import { useResonare } from 'resonare/lite/svelte'

  import { store } from '#lib/store'

  const { theme, resolvedTheme, setTheme } = useResonare(store)
</script>

<main>
  <h1>resonare + SvelteKit</h1>
  <select
    aria-label="Theme"
    data-testid="theme"
    value={theme.current}
    onchange={(event) => {
      setTheme(event.currentTarget.value as typeof theme.current)
    }}
  >
    <option value="system">System</option>
    <option value="light">Light</option>
    <option value="dark">Dark</option>
  </select>
  <p data-testid="resolved">{resolvedTheme.current}</p>
</main>
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
- **Toggle:** `useResonare` from `resonare/svelte` returns `themes`, `resolvedThemes` and `setThemes` instead of `theme`, `resolvedTheme` and `setTheme`.

Where the script goes and the framework-specific details above stay the same. The full-version setup is in `llms.txt` ("Setup") and the README ("Quick start").
