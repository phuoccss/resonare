# resonare + TanStack Start

A light / dark / system toggle with no flash on load, for a TanStack Start (React) app, using `resonare/lite`.

This recipe is the [`examples/tanstack-start`](https://github.com/phuoccss/resonare/tree/main/examples/tanstack-start) app, which CI builds and tests in a browser on every change: the saved theme is applied before any app script runs, the page hydrates without warnings, the toggle saves, `system` follows the OS, and tabs stay in sync.

## 1. Theme module

Effects, the inline script and the store, in one module that the root route and the toggle both import. The browser-only calls are guarded.

```ts src/theme.ts
import { createInlineThemeScript, createThemeStore } from 'resonare/lite'
import {
  combine,
  disableTransitions,
  setClassNames,
  setColorScheme,
  setThemeColor,
} from 'resonare/lite/effects'

// class="dark" in dark mode, no class in light mode.
const applyTheme = combine(
  setClassNames({ light: null }),
  setColorScheme(),
  setThemeColor({ light: '#ffffff', dark: '#0a0a0a' }),
  disableTransitions()
)

export const themeScript = createInlineThemeScript({ handler: applyTheme })

export const store = createThemeStore()

if (typeof window !== 'undefined') {
  store.subscribe(applyTheme)

  store.restore()

  store.sync()
}
```

## 2. Script in `<head>`

`ScriptOnce` renders the script during server rendering only, so it runs before first paint, and removes itself afterwards so hydration has nothing to compare.

```tsx src/routes/__root.tsx
import {
  HeadContent,
  Outlet,
  ScriptOnce,
  Scripts,
  createRootRoute,
} from '@tanstack/react-router'

import { themeScript } from '../theme'

export const Route = createRootRoute({
  head: () => {
    return {
      meta: [
        { charSet: 'utf-8' },
        { name: 'viewport', content: 'width=device-width, initial-scale=1' },
        { title: 'resonare + TanStack Start' },
      ],
    }
  },
  component: RootComponent,
})

function RootComponent() {
  return (
    // The theme script sets attributes on <html> before React hydrates.
    <html
      lang='en'
      suppressHydrationWarning
    >
      <head>
        <ScriptOnce>{themeScript}</ScriptOnce>
        <HeadContent />
      </head>
      <body>
        <Outlet />
        <Scripts />
      </body>
    </html>
  )
}
```

`suppressHydrationWarning` on `<html>` is needed for the same reason as in Next.js: the script sets attributes on `<html>` before React hydrates, which React reports in development. It only affects `<html>` itself, not its children.

## 3. Toggle

`useResonare` renders the server state during hydration, then switches to the saved one, so it never mismatches.

```tsx src/theme-select.tsx
import { useResonare } from 'resonare/lite/react'

import { store } from './theme'

export function ThemeSelect() {
  const { theme, resolvedTheme, setTheme } = useResonare(store)

  return (
    <>
      <select
        aria-label='Theme'
        data-testid='theme'
        value={theme}
        onChange={(event) => {
          setTheme(event.target.value as typeof theme)
        }}
      >
        <option value='system'>System</option>
        <option value='light'>Light</option>
        <option value='dark'>Dark</option>
      </select>
      <p data-testid='resolved'>{resolvedTheme}</p>
    </>
  )
}
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
- **Toggle:** `useResonare` from `resonare/react` returns `themes`, `resolvedThemes` and `setThemes` instead of `theme`, `resolvedTheme` and `setTheme`.

Where the script goes and the framework-specific details above stay the same. The full-version setup is in `llms.txt` ("Setup") and the README ("Quick start").
