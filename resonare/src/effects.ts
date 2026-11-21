import {
  type ClassMap,
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
import type {
  ResolvedThemeValue,
  ThemeSnapshot,
  ThemeStoreConfig,
} from './index'

export { type Effect, combine }

/** Any store's state; effects don't depend on a particular config. */
type AnySnapshot = { resolvedThemes: Record<string, unknown> }

/** The settings of `T`. */
type SettingKey<T extends ThemeStoreConfig> = Extract<keyof T, string>

/**
 * What setting `K` resolves to, as the string a map is looked up with. Any
 * string when no config type is given.
 */
type ValueKey<
  T extends ThemeStoreConfig,
  K extends keyof T,
> = string extends keyof T
  ? string
  : `${Extract<ResolvedThemeValue<T, K>, string | number | boolean>}`

/** `O` only when `T` has a `colorScheme` setting, the default `key`. */
type WithDefaultKey<
  T extends ThemeStoreConfig,
  O,
> = 'colorScheme' extends keyof T ? O : never

/** Options may be left out only when the default `key` exists. */
type OptionalArgs<T extends ThemeStoreConfig, O> = 'colorScheme' extends keyof T
  ? [options?: O]
  : [options: O]

type ColorSchemeOptions<T extends ThemeStoreConfig> =
  | {
      [K in SettingKey<T>]: {
        /** The setting to follow; defaults to `'colorScheme'`. */
        key: K
        /** Maps values that aren't valid `color-scheme` values. */
        values?: Partial<Record<ValueKey<T, K>, string>>
      }
    }[SettingKey<T>]
  | WithDefaultKey<
      T,
      {
        key?: undefined
        values?: Partial<Record<ValueKey<T, 'colorScheme' & keyof T>, string>>
      }
    >

type ThemeColorSource<V extends string> =
  | {
      /** A color for every value the setting can resolve to. */
      values: Record<V, string>
      cssVar?: never
    }
  | {
      /** A CSS variable on `<html>` holding the color. */
      cssVar: string
      values?: never
    }

type ThemeColorOptions<T extends ThemeStoreConfig> =
  | {
      [K in SettingKey<T>]: {
        /** The setting to follow; defaults to `'colorScheme'`. */
        key: K
      } & ThemeColorSource<ValueKey<T, K>>
    }[SettingKey<T>]
  | WithDefaultKey<
      T,
      { key?: undefined } & ThemeColorSource<
        ValueKey<T, 'colorScheme' & keyof T>
      >
    >

type ClassNamesOptions<T extends ThemeStoreConfig> = {
  [K in SettingKey<T>]?: Partial<Record<ValueKey<T, K>, string | null>>
}

type TransitionsOptions<T extends ThemeStoreConfig> = {
  /** The settings whose change cuts transitions; defaults to `['colorScheme']`. */
  keys: Array<SettingKey<T>>
}

const selectKey = (state: AnySnapshot, options: { key?: string }): string => {
  return state.resolvedThemes[options.key ?? 'colorScheme'] as string
}

/**
 * Turns `run(state, prev, options)` into a factory of effects that work both
 * with `store.subscribe` and as (part of) the inline script's `handler`.
 * `run` is copied into the script as source code, so it can't use variables
 * from outside the function; pass what it needs through `options`, which must
 * be JSON-serializable. `prev` is `undefined` on first paint.
 *
 * @example
 *   const fontSize = defineEffect<typeof CONFIG, { scale: number }>(
 *     ({ resolvedThemes }, _prev, { scale }) => {
 *       const px = { sm: 14, md: 16, lg: 18 }[resolvedThemes.fontSize] * scale
 *       document.documentElement.style.fontSize = `${px}px`
 *     }
 *   )
 *
 *   const applyThemes = combine(setDataAttributes(), fontSize({ scale: 1 }))
 */
export const defineEffect = defineCoreEffect as <
  T extends ThemeStoreConfig = ThemeStoreConfig,
  O extends object = Record<never, never>,
>(
  run: (
    state: ThemeSnapshot<T>,
    prev: ThemeSnapshot<T> | undefined,
    options: O
  ) => void
) => (options?: O) => Effect

/**
 * Writes every resolved setting to a `data-*` attribute on `<html>`, e.g.
 * `data-color-scheme="dark"`.
 */
export const setDataAttributes = (): Effect => {
  return createEffect(
    (state: AnySnapshot): Record<string, unknown> => {
      return state.resolvedThemes
    },
    runDataAttributes,
    {}
  )
}

/**
 * Adds a class on `<html>` for each mapped setting, chosen by its resolved
 * value, e.g. `class="dark"` for Tailwind's or shadcn's `.dark` selectors.
 * Values that aren't mapped (or map to `null`) add no class. Every class in
 * the map is removed when it no longer applies, so the classes stay right
 * even if the page started with stale ones. Pass the config type to check
 * settings and values.
 *
 * @example
 *   setClassNames<typeof CONFIG>({
 *     colorScheme: { dark: 'dark', 'dark-dimmed': 'dark' },
 *     contrast: { high: 'high-contrast' },
 *   })
 */
export const setClassNames = ((classes: ClassMap): Effect => {
  return createEffect(
    (state: AnySnapshot): Record<string, unknown> => {
      return state.resolvedThemes
    },
    runClassNames,
    classes
  )
}) as <T extends ThemeStoreConfig = ThemeStoreConfig>(
  classes: ClassNamesOptions<T>
) => Effect

/**
 * Sets the CSS `color-scheme` of `<html>`, so scrollbars, form controls and
 * the default canvas match. Follows `key` (default `'colorScheme'`); map
 * custom values with `values`, e.g. `{ 'dark-dimmed': 'dark' }`. Pass the
 * config type to check `key` and `values`.
 */
export const setColorScheme = ((
  options: { key?: string; values?: Record<string, string> } = {}
): Effect => {
  return createEffect(selectKey, runColorScheme, options)
}) as <T extends ThemeStoreConfig = ThemeStoreConfig>(
  ...args: OptionalArgs<T, ColorSchemeOptions<T>>
) => Effect

/**
 * Keeps `<meta name="theme-color">` in sync with `key` (default
 * `'colorScheme'`), so the browser UI follows the user's choice rather than
 * the OS. Existing tags (media-based ones included) all get the color; with
 * none, one is added. Give a color for every value, or `cssVar` to read one
 * from `<html>` (list this after the effect that sets your attributes). Pass
 * the config type to check `key` and that no value is missing a color.
 */
export const setThemeColor = ((options: {
  key?: string
  values?: Record<string, string>
  cssVar?: string
}): Effect => {
  return createEffect(selectKey, runThemeColor, options)
}) as <T extends ThemeStoreConfig = ThemeStoreConfig>(
  options: ThemeColorOptions<T>
) => Effect

/**
 * Turns off CSS transitions for one frame when any of `keys` (default
 * `['colorScheme']`) changes, so colors switch at once instead of animating.
 * Does nothing on first paint or when other settings change. Pass the config
 * type to check `keys`.
 */
export const disableTransitions = ((
  options: { keys?: Array<string> } = {}
): Effect => {
  return createEffect(
    (state: AnySnapshot, { keys }: { keys: Array<string> }): string => {
      return JSON.stringify(
        keys.map((key) => {
          return state.resolvedThemes[key]
        })
      )
    },
    runDisableTransitions,
    { keys: options.keys ?? ['colorScheme'] },
    true
  )
}) as <T extends ThemeStoreConfig = ThemeStoreConfig>(
  ...args: OptionalArgs<T, Partial<TransitionsOptions<T>>>
) => Effect
