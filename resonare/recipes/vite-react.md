# resonare + Vite + React

A light / dark / system toggle with no flash on load, for a client-side Vite + React app, using `resonare/lite`.

This recipe is the [`examples/vite-react`](https://github.com/phuoccss/resonare/tree/main/examples/vite-react) app, which CI builds and tests in a browser on every change: the saved theme is applied before any app script runs, the page hydrates without warnings, the toggle saves, `system` follows the OS, and tabs stay in sync.

## 1. Theme script

Effects and the inline script. `vite.config.ts` imports this module, so it must not touch browser APIs.

```ts src/theme.ts
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

// Imported by vite.config.ts, so keep this module free of browser-only code.
export const themeScript = createInlineThemeScript({ handler: applyTheme })
```

## 2. Script in `index.html`

A Vite app's JavaScript is loaded as module scripts, which run after the first paint. So the theme script has to be in `index.html` itself, as a classic inline script. A small plugin puts it there at build and dev time:

```ts vite.config.ts
import react from '@vitejs/plugin-react'
import { defineConfig } from 'vite'

import { themeScript } from './src/theme'

export default defineConfig({
  plugins: [
    react(),
    {
      // Module scripts run after first paint, so put the theme script in
      // index.html itself, as a classic inline script at the top of <head>.
      name: 'theme-script',
      transformIndexHtml: () => {
        return [
          { tag: 'script', children: themeScript, injectTo: 'head-prepend' },
        ]
      },
    },
  ],
})
```

Rendering `<script dangerouslySetInnerHTML={{ __html: themeScript }} />` from a React component does **not** work here: React builds the page in the browser, after the first paint, and a script it inserts that way is never executed. That pattern needs server rendering (e.g. the Next.js recipe).

## 3. Store

```ts src/store.ts
import { createThemeStore } from 'resonare/lite'

import { applyTheme } from './theme'

export const store = createThemeStore()

store.subscribe(applyTheme)

store.restore()

store.sync()
```

## 4. Toggle

```tsx src/theme-select.tsx
import { useResonare } from 'resonare/lite/react'

import { store } from './store'

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

Render it anywhere, e.g. from `src/main.tsx`:

```tsx src/main.tsx
import { StrictMode } from 'react'
import { createRoot } from 'react-dom/client'

import { ThemeSelect } from './theme-select'

createRoot(document.getElementById('root')!).render(
  <StrictMode>
    <main>
      <h1>resonare + Vite + React</h1>
      <ThemeSelect />
    </main>
  </StrictMode>
)
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
