import { DEFAULT_KEY } from './constants'
import { toScriptFunction, toScriptJson } from './script'
import { type StorageAdapterCreate, localStorageAdapter } from './storage'

export * from './storage'

type ThemeValue = string | number | boolean

type ThemeOption<T extends ThemeValue = string> = {
  value: T
  media?: readonly [string, T, T]
}

type ThemeConfig<T extends ThemeValue = string> =
  | {
      options: ReadonlyArray<T | ThemeOption<T>>
      defaultValue?: T
    }
  | { defaultValue: T; options?: never }

/**
 * Config for `createThemeStore`. Each key is a theme setting (`colorMode`,
 * `contrast`, …) with either:
 *
 * - `options`: the allowed values, plus an optional `defaultValue` (otherwise the
 *   first option). One option may be a `{ value, media }` object: when it is
 *   selected, the setting follows a media query, using `media[1]` while the
 *   query matches and `media[2]` while it doesn't.
 * - `defaultValue` alone: a free value of that type, such as a number.
 *
 * @example
 *   const config = {
 *     colorMode: {
 *       options: [
 *         'light',
 *         'dark',
 *         {
 *           value: 'system',
 *           media: ['(prefers-color-scheme: dark)', 'dark', 'light'],
 *         },
 *       ],
 *       defaultValue: 'system',
 *     },
 *     contrast: {
 *       options: ['normal', 'more'],
 *     },
 *     sidebarWidth: {
 *       defaultValue: 240,
 *     },
 *   } as const satisfies ThemeStoreConfig
 */
export type ThemeStoreConfig = Record<
  string,
  ThemeConfig<string> | ThemeConfig<number> | ThemeConfig<boolean>
>

/**
 * The selected value of each setting, as passed to `setThemes` (e.g.
 * `colorMode: 'system'`). Inferred from your `ThemeStoreConfig`.
 */
export type Themes<T extends ThemeStoreConfig> = {
  [K in keyof T]: T[K] extends { options: ReadonlyArray<infer U> }
    ? U extends ThemeOption
      ? U['value']
      : U
    : T[K] extends { defaultValue: infer U }
      ? U extends string
        ? string
        : U extends number
          ? number
          : boolean
      : never
}

type ThemeKeysWithSystemOption<T extends ThemeStoreConfig> = {
  [K in keyof T]: T[K] extends { options: ReadonlyArray<infer U> }
    ? U extends { media: ReadonlyArray<unknown> }
      ? K
      : never
    : never
}[keyof T]

type NonSystemOptionValues<
  T extends ThemeStoreConfig,
  K extends keyof T,
> = T[K] extends { options: ReadonlyArray<infer U> }
  ? U extends ThemeValue
    ? U
    : U extends ThemeOption
      ? U extends { media: ReadonlyArray<unknown> }
        ? never
        : U['value']
      : never
  : never

/**
 * For each setting with a `media` option, the value that option currently
 * resolves to, whether or not it is selected.
 */
type ResolvedSystemThemes<T extends ThemeStoreConfig> = {
  [K in ThemeKeysWithSystemOption<T>]: NonSystemOptionValues<T, K>
}

/** Runtime state for each dimension that defines a `media` option. */
type SystemOptions = Record<
  string,
  {
    value: string
    mediaQuery: string
    pair: [string, string]
    defaultPair: [string, string]
  }
>

type Snapshot<T extends ThemeStoreConfig> = {
  themes: Themes<T>
  resolvedThemes: Themes<T>
  resolvedSystemThemes: ResolvedSystemThemes<T>
}

type Listener<T extends ThemeStoreConfig> = (value: Snapshot<T>) => void

type PersistedSystemOptionPairs = Record<string, [string, string]>

type PersistedState<T extends ThemeStoreConfig> = {
  themes: Partial<Themes<T>>
  systemOptions: PersistedSystemOptionPairs
}

type ThemeStoreOptions<T extends ThemeStoreConfig> = {
  persisted?: Partial<PersistedState<T>>
  storage?: StorageAdapterCreate | null
}

type ThemeAndOptions<T extends ThemeStoreConfig> = Array<
  {
    [K in keyof T]: [
      K,
      Array<
        T[K] extends { options: ReadonlyArray<infer U> }
          ? U extends ThemeOption
            ? U['value']
            : U
          : never
      >,
    ]
  }[keyof T]
>

/**
 * Lists each setting with its option values (`{ value, media }` options become
 * their `value`). Useful for rendering a picker for every setting.
 *
 * @example
 *   import { getThemesAndOptions } from 'resonare'
 *
 *   getThemesAndOptions({
 *     colorMode: {
 *       options: [
 *         'light',
 *         'dark',
 *         {
 *           value: 'system',
 *           media: ['(prefers-color-scheme: dark)', 'dark', 'light'],
 *         },
 *       ],
 *     },
 *   })
 *   // [['colorMode', ['light', 'dark', 'system']]]
 */
export function getThemesAndOptions<T extends ThemeStoreConfig>(config: T) {
  return Object.entries(config).map(([themeKey, themeConfig]) => {
    return [
      themeKey,
      (themeConfig.options || []).map((option) => {
        return typeof option === 'object' ? option.value : option
      }),
    ]
  }) as ThemeAndOptions<T>
}

/**
 * Returns each setting's default: its `defaultValue`, or else its first
 * option.
 *
 * @example
 *   import { getDefaultThemes } from 'resonare'
 *
 *   getDefaultThemes({
 *     colorMode: { options: ['light', 'dark'], defaultValue: 'dark' },
 *   }) // { colorMode: 'dark' }
 */
export function getDefaultThemes<T extends ThemeStoreConfig>(config: T) {
  return Object.fromEntries(
    Object.entries(config).map(([themeKey, themeConfig]) => {
      return [
        themeKey,
        themeConfig.defaultValue ??
          (typeof themeConfig.options[0] === 'object'
            ? themeConfig.options[0].value
            : themeConfig.options[0]),
      ]
    })
  ) as Themes<T>
}

/**
 * Creates a store for the settings in `config`. It saves changes through
 * `storage` (`localStorage` under the key `'resonare'` by default; `null`
 * disables saving), resolves `media` options in the browser, and notifies
 * subscribers.
 *
 * Read state with `getSnapshot()` or `subscribe`.
 *
 * @example
 *   import { createThemeStore, localStorageAdapter } from 'resonare'
 *
 *   const store = createThemeStore(
 *     {
 *       colorMode: {
 *         options: [
 *           'light',
 *           'dark',
 *           {
 *             value: 'system',
 *             media: ['(prefers-color-scheme: dark)', 'dark', 'light'],
 *           },
 *         ],
 *         defaultValue: 'system',
 *       },
 *     },
 *     { storage: localStorageAdapter({ key: 'my-app' }) }
 *   )
 *
 *   // In the browser: load the saved choice and follow other tabs.
 *   store.restore()
 *   store.sync()
 *
 *   store.subscribe(({ resolvedThemes }) => {
 *     document.documentElement.dataset.colorMode = resolvedThemes.colorMode
 *   })
 *
 *   store.setThemes({ colorMode: 'dark' })
 */
export function createThemeStore<T extends ThemeStoreConfig>(
  config: T,
  {
    persisted = {},
    storage: createStorage = localStorageAdapter({ key: DEFAULT_KEY }),
  }: ThemeStoreOptions<T> = {}
) {
  const defaultThemes = getDefaultThemes(config)

  let currentThemes: Themes<T> = { ...defaultThemes, ...persisted.themes }

  const systemOptions: SystemOptions = {}

  for (const themeKey in config) {
    const systemOption = (config[themeKey]!.options || []).find(
      (option): option is Required<ThemeOption> => {
        return typeof option === 'object' && !!option.media
      }
    )

    if (systemOption) {
      const {
        value,
        media: [mediaQuery, optionWhenMatched, optionWhenNotMatched],
      } = systemOption

      const defaultPair: [string, string] = [
        optionWhenMatched,
        optionWhenNotMatched,
      ]

      systemOptions[themeKey] = {
        value,
        mediaQuery,
        pair: [...(persisted.systemOptions?.[themeKey] ?? defaultPair)],
        defaultPair,
      }
    }
  }

  const mediaQueryLists: Record<string, MediaQueryList> = {}

  const listeners = new Set<Listener<T>>()

  const abortController = new AbortController()

  const storage = createStorage?.({ abortController })

  const resolveSystemOption = (themeKey: string, server?: boolean): string => {
    const { mediaQuery, pair } = systemOptions[themeKey]!

    // No media support (e.g. on the server): use the "not matched" value.
    if (server || typeof matchMedia === 'undefined') {
      return pair[1]
    }

    let mqList = mediaQueryLists[mediaQuery]

    if (!mqList) {
      mqList = mediaQueryLists[mediaQuery] = matchMedia(mediaQuery)

      mqList.addEventListener(
        'change',
        () => {
          setThemesAndNotify()
        },
        abortController
      )
    }

    return pair[mqList.matches ? 0 : 1]
  }

  const createSnapshot = (server?: boolean): Snapshot<T> => {
    const resolvedSystemThemes: Record<string, string> = {}

    const resolvedThemes = { ...currentThemes } as Record<string, ThemeValue>

    for (const themeKey in systemOptions) {
      resolvedSystemThemes[themeKey] = resolveSystemOption(themeKey, server)

      if (resolvedThemes[themeKey] === systemOptions[themeKey]!.value) {
        resolvedThemes[themeKey] = resolvedSystemThemes[themeKey]
      }
    }

    return {
      themes: currentThemes,
      resolvedThemes: resolvedThemes as Themes<T>,
      resolvedSystemThemes: resolvedSystemThemes as ResolvedSystemThemes<T>,
    }
  }

  const serverSnapshot = createSnapshot(true)

  let snapshot = createSnapshot()

  const setThemesAndNotify = (themes?: Partial<Themes<T>>): void => {
    currentThemes = { ...currentThemes, ...themes }

    snapshot = createSnapshot()

    for (const listener of listeners) {
      listener(snapshot)
    }
  }

  /** Applies saved state; ignores empty or malformed input. */
  const applyStored = (stored: string | null | undefined): void => {
    let parsed: PersistedState<T> | undefined

    try {
      parsed = stored ? JSON.parse(stored) : undefined
    } catch {}

    if (!parsed?.themes || typeof parsed.themes !== 'object') {
      return
    }

    for (const themeKey in parsed.systemOptions) {
      const pair = parsed.systemOptions[themeKey]

      if (pair && systemOptions[themeKey]) {
        systemOptions[themeKey].pair = pair
      }
    }

    setThemesAndNotify(parsed.themes)
  }

  const toPersist = (): PersistedState<T> => {
    const pairs: PersistedSystemOptionPairs = {}

    for (const themeKey in systemOptions) {
      pairs[themeKey] = [...systemOptions[themeKey]!.pair]
    }

    return { themes: { ...currentThemes }, systemOptions: pairs }
  }

  const setThemes = (
    themes:
      | Partial<Themes<T>>
      | ((currentThemes: Themes<T>) => Partial<Themes<T>>)
  ): void => {
    setThemesAndNotify(
      typeof themes === 'function' ? themes(currentThemes) : themes
    )

    if (storage) {
      const stored = JSON.stringify(toPersist())

      storage.set(stored)

      storage.broadcast?.(stored)
    }
  }

  return {
    /**
     * Current state:
     *
     * - `themes`: the selected value of each setting (e.g. `'system'`).
     * - `resolvedThemes`: the same with `media` options resolved (e.g. `'dark'`).
     * - `resolvedSystemThemes`: what each `media` option resolves to, even when
     *   it isn't selected.
     *
     * Returns the same object until the next change.
     */
    getSnapshot: (): Snapshot<T> => {
      return snapshot
    },

    /**
     * The state as rendered on the server: defaults plus `persisted`, with
     * `media` options resolved to their "not matched" value. It never changes,
     * so hydration can match the server HTML even after `restore()`.
     */
    getServerSnapshot: (): Snapshot<T> => {
      return serverSnapshot
    },

    /**
     * Updates the given settings (others keep their value), saves to storage,
     * and notifies subscribers.
     *
     * @example
     *   store.setThemes({ colorMode: 'dark' })
     *
     *   store.setThemes((current) => ({
     *     colorMode: current.colorMode === 'dark' ? 'light' : 'dark',
     *   }))
     */
    setThemes,

    /**
     * Changes which values a `media` option resolves to: `[whenMatched,
     * whenNotMatched]`, replacing `media[1]` and `media[2]` from the config.
     * Saved like `setThemes`.
     *
     * @example
     *   // system now picks 'dark-dimmed' when the OS prefers dark
     *   store.updateSystemOption('colorMode', ['dark-dimmed', 'light'])
     */
    updateSystemOption: <K extends ThemeKeysWithSystemOption<T>>(
      themeKey: K,
      pair: [NonSystemOptionValues<T, K>, NonSystemOptionValues<T, K>]
    ): void => {
      systemOptions[themeKey as string]!.pair = [...pair]

      setThemes({})
    },

    /**
     * The state to save, e.g. to a database: pass it back as `persisted` when
     * creating the store.
     */
    toPersist,

    /**
     * Loads the saved state from storage. Does nothing when nothing is saved.
     * Call it in the browser, e.g. after hydration.
     */
    restore: (): void => {
      applyStored(storage?.get())
    },

    /**
     * Calls `callback` with the new state (see `getSnapshot`) after every
     * change, including OS preference changes. Returns an unsubscribe
     * function.
     */
    subscribe: (callback: Listener<T>): (() => void) => {
      listeners.add(callback)

      return () => {
        listeners.delete(callback)
      }
    },

    /**
     * Applies changes saved by other tabs (if the storage adapter supports
     * it); when another tab clears the saved state, resets to the config
     * defaults. Returns a function that stops syncing, or `undefined` when the
     * adapter can't sync.
     */
    sync: (): (() => void) | undefined => {
      return storage?.watch?.((stored) => {
        // `null` means another tab cleared the stored preferences.
        if (stored === null) {
          for (const themeKey in systemOptions) {
            const systemOption = systemOptions[themeKey]!

            systemOption.pair = systemOption.defaultPair
          }

          setThemesAndNotify(defaultThemes)
        } else {
          applyStored(stored)
        }
      })
    },

    /**
     * Removes all subscribers and stops listening to media queries and
     * storage. The store doesn't update after this.
     */
    destroy: (): void => {
      listeners.clear()

      abortController.abort()
    },
  }
}

export type ThemeStore<T extends ThemeStoreConfig> = ReturnType<
  typeof createThemeStore<T>
>

const restoreScript = <T extends ThemeValue>(
  params: Array<
    [string, Array<[string, T] | [string, T, T, string, T, T]>, Listener<any>]
  >
) => {
  params.forEach(([key, flattenedConfig, handler]) => {
    let persisted: any

    // Blocked storage or bad JSON must not stop the handler from running.
    try {
      persisted = JSON.parse(localStorage.getItem(key)!)
    } catch {}

    handler(
      flattenedConfig.reduce<{
        themes: Record<string, ThemeValue>
        resolvedThemes: Record<string, ThemeValue>
        resolvedSystemThemes: Record<string, ThemeValue>
      }>(
        (
          acc,
          [
            themeKey,
            initial,
            systemOptionValue,
            mediaQuery,
            optionWhenMatched,
            optionWhenNotMatched,
          ]
        ) => {
          const currentValue = persisted?.themes?.[themeKey] ?? initial

          acc.resolvedThemes[themeKey] = acc.themes[themeKey] = currentValue

          if (mediaQuery != null) {
            const pair = persisted?.systemOptions?.[themeKey] ?? [
              optionWhenMatched!,
              optionWhenNotMatched!,
            ]

            const systemTheme = matchMedia(mediaQuery).matches
              ? pair[0]
              : pair[1]

            acc.resolvedSystemThemes[themeKey] = systemTheme

            if (currentValue === systemOptionValue) {
              acc.resolvedThemes[themeKey] = systemTheme
            }
          }

          return acc
        },
        { themes: {}, resolvedThemes: {}, resolvedSystemThemes: {} }
      )
    )
  })
}

/** One store for `createInlineThemeScript`. */
export type ThemeScriptParameter = {
  /** The store's `localStorage` key; defaults to `'resonare'`. */
  key?: string
  /** The same config passed to `createThemeStore`. */
  config: ThemeStoreConfig
  /**
   * Applies the state to the page; receives the same value as `subscribe`.
   * It is copied into the script as source code, so it can't use variables
   * from outside the function.
   */
  handler: Listener<any>
}

/**
 * Returns the source of a small script that reads the saved state from
 * `localStorage` and runs `handler` with it. Put it in an inline `<script>` in
 * the `<head>` so the page has the right theme before first paint. Pass an
 * array to set up several stores.
 *
 * Use the same handler with `store.subscribe` to keep the page updated after
 * that.
 *
 * @example
 *   import { createInlineThemeScript } from 'resonare'
 *
 *   // config: the same object passed to createThemeStore
 *   const themeScript = createInlineThemeScript({
 *     key: 'my-app',
 *     config,
 *     handler: ({ resolvedThemes }) => {
 *       const root = document.documentElement
 *       root.dataset.colorMode = resolvedThemes.colorMode
 *     },
 *   })
 *
 *   // In <head>:
 *   // <script dangerouslySetInnerHTML={{ __html: themeScript }} />
 */
export function createInlineThemeScript(
  themeScriptParameters: ThemeScriptParameter | Array<ThemeScriptParameter>
) {
  const serializedArgs = (
    Array.isArray(themeScriptParameters)
      ? themeScriptParameters
      : [themeScriptParameters]
  ).map(({ key = DEFAULT_KEY, config, handler }) => {
    const flattenedConfig = Object.entries(config).map(
      ([themeKey, { options, defaultValue }]) => {
        const firstOption = options?.[0]

        const resolvedInitialValue =
          defaultValue ??
          (typeof firstOption === 'object' ? firstOption.value : firstOption!)

        const systemOption = options?.find(
          (option): option is Required<ThemeOption> => {
            return typeof option === 'object' && !!option.media
          }
        )

        if (systemOption) {
          const { value, media } = systemOption

          return [themeKey, resolvedInitialValue, value, ...media]
        }

        return [themeKey, resolvedInitialValue]
      }
    )

    return `[${toScriptJson(key)},${toScriptJson(flattenedConfig)},${toScriptFunction(handler)}]`
  })

  return `(${restoreScript})([${serializedArgs}])`
}
