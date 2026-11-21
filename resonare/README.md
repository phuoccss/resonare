# Resonare [![Version](https://img.shields.io/npm/v/resonare.svg?labelColor=cb0000&color=000)](https://www.npmjs.com/package/resonare) [![bundle size](https://img.shields.io/bundlejs/size/resonare?labelColor=007ec6&color=000)](https://bundlejs.com/?q=resonare)

A small state store for themes and user preferences: color scheme, contrast, spacing, sidebar width, or any other setting your UI offers. [Check out the demo](https://resonare.phuoccss.workers.dev).

Using a coding agent? Point it at [`llms.txt`](https://github.com/phuoccss/resonare/blob/main/resonare/llms.txt): a short reference with the rules agents most often get wrong. It ships in the package (`node_modules/resonare/llms.txt`) and is served at [`/llms.txt`](https://resonare.phuoccss.workers.dev/llms.txt) on the demo site.

## Features

- **Any number of settings**, each with its own options and default
- **Follows the OS** through media queries, e.g. `system` resolves to `light` or `dark`
- **No flash on page load:** an inline script applies saved settings before first paint
- **Saves choices** in `localStorage` by default, or anywhere you like (`sessionStorage`, memory, cookies, your server)
- **Syncs across tabs and windows**
- **Server rendering** without hydration mismatches
- **Framework bindings** for React, Solid, Svelte and Vue, or use it with plain JavaScript
- **Type-safe:** option values are inferred from your config
- **Lite version** for when all you need is light / dark / system
- **Ready-made effects** for `data-*` attributes, `color-scheme`, `<meta name="theme-color">` and switching without transition flashes

## Installation

```bash
npm i resonare
# or
pnpm add resonare
# or
yarn add resonare
```

The framework bindings need React 19+, Solid 1.6+, Svelte 5.7+ or Vue 3.2+.

## Quick start

### 1. Describe your settings

Each key is a setting. List its `options`; the first one is the default unless you set `defaultValue`. One option can follow a media query: `media: [query, valueWhenMatched, valueWhenNotMatched]`.

```ts
// theme.ts
import { type ThemeStoreConfig } from 'resonare'
import {
  combine,
  disableTransitions,
  setColorScheme,
  setDataAttributes,
  setThemeColor,
} from 'resonare/effects'

export const CONFIG = {
  colorScheme: {
    options: [
      {
        value: 'system',
        media: ['(prefers-color-scheme: dark)', 'dark', 'light'],
      },
      'light',
      'dark',
    ],
  },
  contrast: {
    options: ['standard', 'high'],
  },
} as const satisfies ThemeStoreConfig

export const applyThemes = combine(
  setDataAttributes(),
  setColorScheme(),
  setThemeColor({ values: { light: '#fff', dark: '#000' } }),
  disableTransitions()
)
```

Then style your page from those attributes:

```css
:root[data-color-scheme='dark'] {
  --background: #000;
}
```

### 2. Add the inline script

The script reads the saved settings and runs your handler before the page is painted, so users never see the wrong theme. Put it in the `<head>`:

```ts
import { createInlineThemeScript } from 'resonare'

import { CONFIG, applyThemes } from './theme'

export const themeScript = createInlineThemeScript({
  config: CONFIG,
  handler: applyThemes,
})
```

```tsx
// React
<script dangerouslySetInnerHTML={{ __html: themeScript }} />

// TanStack Start
import { ScriptOnce } from '@tanstack/react-router'

<ScriptOnce>{themeScript}</ScriptOnce>

// Astro
<script is:inline set:html={themeScript} />
```

### 3. Create the store

```ts
import { createThemeStore } from 'resonare'

import { CONFIG, applyThemes } from './theme'

export const store = createThemeStore(CONFIG)

if (typeof window !== 'undefined') {
  store.subscribe(applyThemes) // keep the page in sync with every change
  store.restore() // load the saved settings
  store.sync() // follow changes made in other tabs
}
```

### 4. Use it in your UI

```tsx
import { useResonare } from 'resonare/react'

function ColorSchemeSelect() {
  const { themes, setThemes } = useResonare(store)

  return (
    <select
      value={themes.colorScheme}
      onChange={(e) => {
        setThemes({ colorScheme: e.target.value as typeof themes.colorScheme })
      }}
    >
      <option value='system'>System</option>
      <option value='light'>Light</option>
      <option value='dark'>Dark</option>
    </select>
  )
}
```

See [Frameworks](#frameworks) for Solid, Svelte and Vue.

Complete, tested setups for [Next.js](https://github.com/phuoccss/resonare/blob/main/resonare/recipes/next.md), [Vite + React](https://github.com/phuoccss/resonare/blob/main/resonare/recipes/vite-react.md), [SvelteKit](https://github.com/phuoccss/resonare/blob/main/resonare/recipes/sveltekit.md), [Nuxt](https://github.com/phuoccss/resonare/blob/main/resonare/recipes/nuxt.md) and [TanStack Start](https://github.com/phuoccss/resonare/blob/main/resonare/recipes/tanstack-start.md) are in `recipes/`. They use `resonare/lite` for a light / dark / system toggle, and each one is an example app that CI builds and tests in a browser.

## Effects

`resonare/effects` (and `resonare/lite/effects`) has the side effects most apps need when the theme changes. Each one works both with `store.subscribe` and as the inline script's `handler`, so the page is right on first paint and stays right afterwards. Combine them into one handler with `combine(...)`; they run in order.

| Effect                                                 | What it does                                                                                                                                                                                                                                                                           |
| ------------------------------------------------------ | -------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------- |
| `setDataAttributes()`                                  | Writes every resolved setting to `<html>`, e.g. `data-color-scheme="dark"`                                                                                                                                                                                                             |
| `setClassNames({ [setting]: { [value]: className } })` | Adds a class on `<html>` per mapped setting, chosen by its resolved value, e.g. `{ colorScheme: { dark: 'dark', 'dark-dimmed': 'dark' } }` for Tailwind's or shadcn's `.dark`. Unmapped values (or `null`) add no class, and every mapped class is removed once it no longer applies   |
| `setColorScheme({ key?, values? })`                    | Sets the CSS `color-scheme` on `<html>`, so scrollbars and form controls match. Map custom values with `values: { 'dark-dimmed': 'dark' }`                                                                                                                                             |
| `setThemeColor({ key?, values })`                      | Keeps `<meta name="theme-color">` in sync, so the browser's toolbar follows the user's choice instead of the OS. It sets the `content` of every theme-color tag, media-based ones included (Safari picks up content changes, not added or removed tags), and adds one if there is none |
| `setThemeColor({ key?, cssVar })`                      | The same, reading the color from a CSS variable on `<html>`. List it after `setDataAttributes()`, and put the inline script after your stylesheet so the variable is there on first paint                                                                                              |
| `disableTransitions({ keys? })`                        | Turns off CSS transitions for one frame when any of `keys` (default `['colorScheme']`) changes, so colors switch at once instead of animating. Does nothing on first paint or when other settings change                                                                               |

`key` is the setting that holds the color scheme and defaults to `'colorScheme'`. Put any theme-color tags before the inline script, so it finds them on first paint.

Pass your config's type to `combine` to check the setting names and values of every effect inside it, e.g. a typo in a value, a stale option after a rename, or a value with no theme color:

```ts
const applyThemes = combine<typeof CONFIG>(
  setClassNames({ colorScheme: { dark: 'dark' } }),
  setColorScheme({ values: { 'dark-dimmed': 'dark' } }),
  setThemeColor({
    values: { light: '#fff', dark: '#000', 'dark-dimmed': '#111' },
  }), // every value needs a color
  disableTransitions({ keys: ['colorScheme', 'contrast'] })
)
```

An effect used on its own takes the type directly, e.g. `store.subscribe(setThemeColor<typeof CONFIG>({ … }))`. Effects with no config type fit anywhere.

### Your own effects

A plain handler can't use variables from outside itself, because it is copied into the inline script as source code. `defineEffect` gets around that: it copies your function together with its options, which must be JSON-serializable.

```ts
import { combine, defineEffect, setDataAttributes } from 'resonare/effects'

const favicon = defineEffect<typeof CONFIG, Record<string, string>>(
  ({ resolvedThemes }, prev, icons) => {
    document.querySelector<HTMLLinkElement>('link[rel=icon]')!.href =
      icons[resolvedThemes.colorScheme]!
  }
)

export const applyThemes = combine(
  setDataAttributes(),
  favicon({ light: '/icon-light.svg', dark: '/icon-dark.svg' })
)
```

Every listener receives the state before the change as its second argument (`prev`). It is `undefined` in the inline script, which makes "only on a real change" logic easy.

To animate the switch with a [view transition](https://developer.mozilla.org/docs/Web/API/View_Transition_API), wrap the setter: subscribers run synchronously, so the new theme is applied inside the callback.

```ts
document.startViewTransition(() => {
  store.setThemes({ colorScheme: 'dark' })
})
```

## State

Every listener, snapshot and binding gives you three views of the state:

| Field                  | Example                                           | Meaning                                                                                                       |
| ---------------------- | ------------------------------------------------- | ------------------------------------------------------------------------------------------------------------- |
| `themes`               | `{ colorScheme: 'system', contrast: 'standard' }` | What the user selected                                                                                        |
| `resolvedThemes`       | `{ colorScheme: 'dark', contrast: 'standard' }`   | The same, with media options resolved. Use this to style the page                                             |
| `resolvedSystemThemes` | `{ colorScheme: 'dark' }`                         | What each media option resolves to right now, even when it isn't selected. Useful for showing "System (dark)" |

## API

### `createThemeStore(config, options?)`

```ts
const store = createThemeStore(CONFIG, {
  // Where to save settings. Defaults to localStorage under the key 'resonare'.
  // Pass null to not save at all.
  storage: localStorageAdapter({ key: 'my-app' }),

  // Initial state, e.g. loaded from your database (see Server-side persistence).
  persisted: savedState,
})
```

| Method                                                   | Description                                                                                                                   |
| -------------------------------------------------------- | ----------------------------------------------------------------------------------------------------------------------------- |
| `getSnapshot()`                                          | Current [state](#state). Returns the same object until the next change                                                        |
| `getServerSnapshot()`                                    | The state as rendered on the server (see [Server-side rendering](#server-side-rendering))                                     |
| `setThemes(partial)`                                     | Updates the given settings, saves them and notifies subscribers. Also accepts a function: `setThemes((current) => ({ ... }))` |
| `updateSystemOption(key, [whenMatched, whenNotMatched])` | Changes what a media option resolves to, e.g. `updateSystemOption('colorScheme', ['dark-dimmed', 'light'])`                   |
| `subscribe(callback)`                                    | Calls `callback(state, prev)` after every change, including OS preference changes. Returns an unsubscribe function            |
| `restore()`                                              | Loads the saved state from storage. Does nothing when nothing is saved                                                        |
| `sync()`                                                 | Applies changes made in other tabs. Returns a function that stops syncing                                                     |
| `toPersist()`                                            | The state to save elsewhere; pass it back as `persisted`                                                                      |
| `destroy()`                                              | Removes all subscribers and listeners                                                                                         |

### `createInlineThemeScript(params)`

Returns the source of the inline script.

```ts
createInlineThemeScript({
  key: 'my-app', // the store's storage key; defaults to 'resonare'
  config: CONFIG, // the same config as the store
  handler: applyThemes, // receives the same state as subscribe
})
```

- The handler is copied into the script as source code, so it can't use variables from outside the function. Define any constants inside it.
- The script only reads `localStorage`. With other storage, apply settings on the server instead (see [Server-side persistence](#server-side-persistence)).
- To run several independent stores, e.g. separate settings for different sections of a page, pass an array with one entry per store, each with its own `key`.

### Helpers

```ts
import { getDefaultThemes, getThemesAndOptions } from 'resonare'

getThemesAndOptions(CONFIG)
// [['colorScheme', ['system', 'light', 'dark']], ['contrast', ['standard', 'high']]]

getDefaultThemes(CONFIG)
// { colorScheme: 'system', contrast: 'standard' }
```

`getThemesAndOptions` is handy for rendering a picker for every setting.

### Settings without options

A setting can have just a `defaultValue`, for free values such as numbers:

```ts
const CONFIG = {
  sidebarWidth: { defaultValue: 240 },
} as const satisfies ThemeStoreConfig

store.setThemes({ sidebarWidth: 320 })
```

### Storage

| Adapter                                                | Use it when                                                                          |
| ------------------------------------------------------ | ------------------------------------------------------------------------------------ |
| `localStorageAdapter({ key })` (default)               | Settings should survive reloads in this browser. Syncs across tabs                   |
| `localStorageAdapter({ key, type: 'sessionStorage' })` | Settings should last only for the tab's session                                      |
| `memoryStorageAdapter({ key })`                        | You save settings yourself (e.g. to your server) but still want tabs to stay in sync |
| `null`                                                 | You don't want anything saved                                                        |

If storage is blocked or full, reads return nothing and writes are skipped; the store keeps working in memory.

You can write your own adapter. It receives an `AbortController` that is aborted when the store is destroyed. `watch` and `broadcast` are optional and only needed for `sync()`. For example, a cookie lets your server read the settings:

```ts
import { type StorageAdapterCreate } from 'resonare'

const cookieStorage: StorageAdapterCreate = () => ({
  get: () => {
    const value = document.cookie.match(/(?:^|; )theme=([^;]*)/)?.[1]

    return value ? decodeURIComponent(value) : null
  },
  set: (value) => {
    document.cookie = `theme=${encodeURIComponent(value)}; path=/; max-age=31536000`
  },
})

const store = createThemeStore(CONFIG, { storage: cookieStorage })
```

## Frameworks

Every binding takes a store and returns its state plus its methods (`setThemes`, `restore`, `sync`, …).

### React

```tsx
import { useResonare } from 'resonare/react'

const { themes, resolvedThemes, setThemes } = useResonare(store)
```

Re-renders when the state changes. Server rendering is handled automatically.

### Solid

```tsx
import { useResonare } from 'resonare/solid'

const { themes, setThemes } = useResonare(store)

return <p>{themes().colorScheme}</p>
```

State values are signals. Call it inside a component; the subscription ends when the component is cleaned up.

### Svelte

```svelte
<script lang="ts">
  import { useResonare } from 'resonare/svelte'

  const { themes, setThemes } = useResonare(store)
</script>

<p>{themes.current.colorScheme}</p>
<button onclick={() => setThemes({ colorScheme: 'dark' })}>Dark</button>
```

Read state through `.current`. It's reactive in templates, `$derived` and `$effect`, and the store is only subscribed while something reads it.

### Vue

```vue
<script setup lang="ts">
import { useResonare } from 'resonare/vue'

const { themes, setThemes } = useResonare(store, { hydrate: true })
</script>

<template>
  <p>{{ themes.colorScheme }}</p>
  <button @click="setThemes({ colorScheme: 'dark' })">Dark</button>
</template>
```

State values are computed refs. Call it in `setup`. Pass `{ hydrate: true }` only in server-rendered apps (see below).

## Server-side rendering

The server can't know the user's OS preference or what's saved in their browser. It renders the defaults (plus `persisted`, if you pass it), with media options resolved to their "not matched" value: `system` renders as `light`. `getServerSnapshot()` returns exactly that state, and it never changes.

The bindings use it so that hydration matches the server HTML, then switch to the live state:

- **React** and **Solid:** automatic.
- **Svelte:** nothing needed; Svelte fixes mismatched markup while hydrating.
- **Vue:** pass `useResonare(store, { hydrate: true })`. Leave it off in client-only apps, where it would show the server state for one frame.

To avoid a flash of the wrong theme:

- **Change the page with `store.subscribe(handler)`**, using the same handler as the inline script. Don't set `data-*` attributes from values returned by `useResonare`: until hydration finishes, those are the server values.
- **Style theme-dependent markup with CSS** keyed off those attributes, rather than branching on `resolvedThemes`. For example, render both a sun and a moon icon and hide one with `[data-color-scheme='dark'] .sun { display: none }`.
- **Pass the same `persisted` on the server and the client.** If it's per user (e.g. from a cookie), create one store per request instead of sharing a module-level store.

## Server-side persistence

To save settings to your own backend instead of the browser, load them on the server and pass them as `persisted`. Render the page's theme attributes on the server from `store.getServerSnapshot().resolvedThemes`; the page then arrives with the right theme, so the inline script isn't needed for saved settings.

```tsx
import { createThemeStore, memoryStorageAdapter } from 'resonare'
import { useResonare } from 'resonare/react'

export function ThemeSelect({ savedState }) {
  const [store] = React.useState(() => {
    return createThemeStore(CONFIG, {
      persisted: savedState, // from your database
      // Tab sync in the browser only; null skips it (and on the server)
      storage:
        typeof window === 'undefined'
          ? null
          : memoryStorageAdapter({ key: 'my-app' }),
    })
  })

  const { themes, setThemes } = useResonare(store)

  React.useEffect(() => {
    const unsubscribe = store.subscribe(applyThemes)
    const stopSync = store.sync()

    return () => {
      stopSync?.()
      unsubscribe()
    }
  }, [store])

  return (
    <select
      value={themes.colorScheme}
      onChange={async (e) => {
        setThemes({ colorScheme: e.target.value as typeof themes.colorScheme })
        await saveToDatabase(store.toPersist())
      }}
    >
      {/* options */}
    </select>
  )
}
```

`system` still depends on the OS preference, which the server can't see. If you offer it, keep the inline script so it can resolve `system` before paint.

## Lite

For a single light / dark / system preference, `resonare/lite` is smaller and needs no config.

```ts
import { createInlineThemeScript, createThemeStore } from 'resonare/lite'
import {
  combine,
  disableTransitions,
  setColorScheme,
  setDataAttributes,
  setThemeColor,
} from 'resonare/lite/effects'

// data-theme="dark", plus the same effects as the full version.
const applyTheme = combine(
  setDataAttributes(),
  setColorScheme(),
  setThemeColor({ light: '#fff', dark: '#000' }),
  disableTransitions()
)

// Put this in the <head>, as above.
export const themeScript = createInlineThemeScript({ handler: applyTheme })

export const store = createThemeStore()

if (typeof window !== 'undefined') {
  store.subscribe(applyTheme)
  store.restore()
  store.sync()
}

store.setTheme('dark')
store.setTheme((current) => (current === 'dark' ? 'light' : 'dark'))
```

The state has three fields:

| Field           | Values                          | Meaning                                              |
| --------------- | ------------------------------- | ---------------------------------------------------- |
| `theme`         | `'system' \| 'light' \| 'dark'` | What the user selected                               |
| `resolvedTheme` | `'light' \| 'dark'`             | The same, with `system` resolved                     |
| `systemTheme`   | `'light' \| 'dark'`             | The OS preference, even when `system` isn't selected |

The store has the same methods as the full one, except `setTheme` instead of `setThemes` and no `updateSystemOption` or `toPersist`. It saves to `localStorage` under the key `'resonare/lite'` by default, and the same `storage` and `persisted` options apply (`persisted` is just the theme, e.g. `'dark'`).

The bindings live under `resonare/lite/react`, `resonare/lite/solid`, `resonare/lite/svelte` and `resonare/lite/vue`, and the effects under `resonare/lite/effects`. They work like the full ones, except that `setDataAttributes({ key })` names the attribute (`data-theme` by default), `setClassNames({ light?, dark? })` adds `light` or `dark` (rename them, or pass `null` for no class; `undefined` keeps the default), `setThemeColor` takes `{ light, dark }` or `{ cssVar }`, and there's no `key`, `keys` or config type elsewhere.

## Changing options later

Saved values are used as they are: Resonare doesn't check them against your config. If you rename or remove an option, migrate the saved data yourself. A small script before the theme script works well, since it runs before both the inline script and the store read the data:

```html
<script>
  try {
    const saved = JSON.parse(localStorage.getItem('my-app'))

    if (saved?.themes?.colorScheme === 'dark-modern') {
      saved.themes.colorScheme = 'dark'
      localStorage.setItem('my-app', JSON.stringify(saved))
    }
  } catch {}
</script>
```

## License

MIT
