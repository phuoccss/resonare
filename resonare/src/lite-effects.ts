import {
  type Effect,
  combine,
  createEffect,
  defineEffect as defineCoreEffect,
  runClassNames,
  runColorScheme,
  runDataAttributes,
  runDisableTransitions,
  runThemeColor,
} from './effects-core'
import type { ThemeSnapshot } from './lite'

export { type Effect, combine }

const selectTheme = (state: ThemeSnapshot): string => {
  return state.resolvedTheme
}

/**
 * Turns `run(state, prev, options)` into a factory of effects that work both
 * with `store.subscribe` and as (part of) the inline script's `handler`.
 * `run` is copied into the script as source code, so it can't use variables
 * from outside the function; pass what it needs through `options`, which must
 * be JSON-serializable. `prev` is `undefined` on first paint.
 *
 * @example
 *   const favicon = defineEffect<{ light: string; dark: string }>(
 *     ({ resolvedTheme }, _prev, options) => {
 *       document.querySelector('link[rel=icon]')!.href = options[resolvedTheme]
 *     }
 *   )
 *
 *   const applyTheme = combine(
 *     setDataAttributes(),
 *     favicon({ light: '/light.svg', dark: '/dark.svg' })
 *   )
 */
export const defineEffect = defineCoreEffect as <
  O extends object = Record<never, never>,
>(
  run: (
    state: ThemeSnapshot,
    prev: ThemeSnapshot | undefined,
    options: O
  ) => void
) => (options?: O) => Effect

/**
 * Writes the resolved theme to a `data-*` attribute on `<html>`:
 * `data-theme="dark"` by default, or another name through `key` (e.g.
 * `'colorScheme'` for `data-color-scheme`).
 */
export const setDataAttributes = (options: { key?: string } = {}): Effect => {
  return createEffect(
    (
      state: ThemeSnapshot,
      { key }: { key?: string }
    ): Record<string, unknown> => {
      return { [key ?? 'theme']: state.resolvedTheme }
    },
    runDataAttributes,
    options
  )
}

/**
 * Adds a class for the resolved theme on `<html>`: `light` or `dark` by
 * default, e.g. for Tailwind's or shadcn's `.dark` selectors. Rename them, or
 * pass `null` for no class (e.g. `{ light: null }` for only `.dark`);
 * `undefined` keeps the default. The other theme's class is removed.
 */
export const setClassNames = ({
  light,
  dark,
}: { light?: string | null; dark?: string | null } = {}): Effect => {
  return createEffect(
    (state: ThemeSnapshot): Record<string, unknown> => {
      return { theme: state.resolvedTheme }
    },
    runClassNames,
    {
      theme: {
        light: light === undefined ? 'light' : light,
        dark: dark === undefined ? 'dark' : dark,
      },
    }
  )
}

/**
 * Sets the CSS `color-scheme` of `<html>`, so scrollbars, form controls and
 * the default canvas match.
 */
export const setColorScheme = (): Effect => {
  return createEffect(selectTheme, runColorScheme, {})
}

/**
 * Keeps `<meta name="theme-color">` in sync with the theme, so the browser UI
 * follows the user's choice rather than the OS. Existing tags (media-based
 * ones included) all get the color; with none, one is added. Give a color for
 * each theme, or `cssVar` to read one from `<html>` (list this after the
 * effect that sets your attributes).
 */
export const setThemeColor = (
  options: { light: string; dark: string } | { cssVar: string }
): Effect => {
  return createEffect(
    selectTheme,
    runThemeColor,
    'cssVar' in options ? options : { values: options }
  )
}

/**
 * Turns off CSS transitions for one frame when the theme changes, so colors
 * switch at once instead of animating. Does nothing on first paint.
 */
export const disableTransitions = (): Effect => {
  return createEffect(selectTheme, runDisableTransitions, {}, true)
}
