import { toScriptFunction, toScriptJson } from './utils'

/**
 * A listener that also works in the inline script: its `toString()` returns
 * self-contained source (the function plus its options as JSON), which
 * `createInlineThemeScript` embeds instead of the closure.
 */
// `any` by default so one effect fits any store's `subscribe` and the inline
// script's `handler`, whatever the config.
// oxlint-disable-next-line typescript/no-explicit-any
export type Effect<S = any> = (state: S, prev?: S) => void

type Select<S, O, V> = (state: S, options: O) => V

// Options come before `prev` so the inline script, where there is never a
// previous state, can leave it out.
type Run<O, V> = (value: V, options: O, prev?: V) => void

/**
 * Script source of an effect with nothing to do on first paint; `combine`
 * leaves it out of the script.
 */
const NOOP = '()=>{}'

/**
 * Each effect's script source as a statement block using the state `s`, so
 * `combine` can join effects without wrapping each in a function. An empty
 * string means "nothing to do on first paint".
 */
const blocks = new WeakMap<Effect, string>()

const withBlock = <S>(listener: Effect<S>, block: string): Effect<S> => {
  blocks.set(listener, block)

  listener.toString = () => {
    return block ? `s=>${block}` : NOOP
  }

  return listener
}

/**
 * Builds an effect from `select`, which picks the value the effect cares
 * about from the state (so the same `run` serves the full and lite stores),
 * and `run`, which applies it. Both are copied into the inline script as
 * source code, so neither may use variables from outside the function.
 * `options` must be JSON-serializable. With `skipFirstPaint`, the effect only
 * reacts to changes and stays out of the inline script.
 */
export const createEffect = <S, O extends object, V>(
  select: Select<S, O, V>,
  run: Run<O, V>,
  options: O,
  skipFirstPaint?: boolean
): Effect => {
  const json = toScriptJson(options)

  // Empty options are cheaper written out than kept in a variable.
  const o = json === '{}' ? json : 'o'

  const call = `(${toScriptFunction(run)})((${toScriptFunction(select)})(s,${o}),${o})`

  return withBlock<S>(
    (state, prev) => {
      run(
        select(state, options),
        options,
        prev === undefined ? undefined : select(prev, options)
      )
    },
    skipFirstPaint ? '' : o === 'o' ? `{const o=${json};${call}}` : `{${call}}`
  )
}

/**
 * Turns `run(state, prev, options)` into a factory of effects that work both
 * with `store.subscribe` and as (part of) the inline script's `handler`.
 * `run` is copied into the script as source code, so it can't use variables
 * from outside the function; pass what it needs through `options`, which must
 * be JSON-serializable. `prev` is `undefined` on first paint.
 */
export const defineEffect = <S, O extends object = Record<never, never>>(
  run: (state: S, prev: S | undefined, options: O) => void
) => {
  return (options = {} as O): Effect<S> => {
    return withBlock<S>(
      (state, prev) => {
        run(state, prev, options)
      },
      `{(${toScriptFunction(run)})(s,void 0,${toScriptJson(options)})}`
    )
  }
}

/**
 * Runs several listeners in order as one. The result works with
 * `store.subscribe` and as the inline script's `handler`, as long as every
 * part does (effects, or plain self-contained functions).
 */
export const combine = <S>(...listeners: Array<Effect<S>>): Effect<S> => {
  const parts = listeners
    .map((listener) => {
      // Plain functions have no block; call them with the state.
      return blocks.get(listener) ?? `(${toScriptFunction(listener)})(s);`
    })
    .filter(Boolean)

  return withBlock<S>(
    (state, prev) => {
      for (const listener of listeners) {
        listener(state, prev)
      }
    },
    parts.length === 1 && parts[0]!.startsWith('{')
      ? parts[0]!
      : parts.length > 0
        ? `{${parts.join('')}}`
        : ''
  )
}

// Shared `run` functions. Each is stringified into the inline script, so it
// must stay self-contained.

export const runDataAttributes: Run<object, Record<string, unknown>> = (
  values
) => {
  for (const key in values) {
    document.documentElement.dataset[key] = String(values[key])
  }
}

/** Setting → resolved value → class name (`null` or missing: no class). */
export type ClassMap = Record<
  string,
  Partial<Record<string, string | null>> | undefined
>

export const runClassNames: Run<ClassMap, Record<string, unknown>> = (
  values,
  classes
) => {
  const { classList } = document.documentElement

  for (const key in classes) {
    const names = classes[key] ?? {}

    const current = names[String(values[key])]

    // Every class the setting can add is listed, so drop all but the current
    // one; this also corrects classes rendered by the server or left over.
    for (const value in names) {
      const name = names[value]

      if (name && name !== current) {
        classList.remove(name)
      }
    }

    if (current) {
      classList.add(current)
    }
  }
}

export const runColorScheme: Run<
  { values?: Record<string, string> },
  string
> = (value, { values }) => {
  document.documentElement.style.colorScheme = values?.[value] ?? value
}

export const runThemeColor: Run<
  { values?: Record<string, string>; cssVar?: string },
  string
> = (value, { values, cssVar }) => {
  const color = cssVar
    ? getComputedStyle(document.documentElement).getPropertyValue(cssVar).trim()
    : values?.[value]

  if (!color) {
    return
  }

  // Safari picks up `content` changes on existing tags, but not reliably tags
  // being added, removed or losing `media`. So set every tag, media-based
  // ones included: whichever matches the OS then shows the user's choice.
  const metas = document.querySelectorAll<HTMLMetaElement>(
    'meta[name="theme-color"]'
  )

  if (metas.length) {
    metas.forEach((meta) => {
      meta.content = color
    })

    return
  }

  const meta = document.createElement('meta')

  meta.name = 'theme-color'

  meta.content = color

  document.head.append(meta)
}

export const runDisableTransitions: Run<object, string> = (
  value,
  _options,
  prev
) => {
  // Nothing animates on first paint, and other settings changing must not
  // cut their transitions short.
  if (prev === undefined || prev === value) {
    return
  }

  const style = document.createElement('style')

  style.textContent = '*,*::before,*::after{transition:none!important}'

  document.head.append(style)

  // Remove once a frame has been styled with the new theme, so no listener
  // order or late attribute change can start a transition.
  requestAnimationFrame(() => {
    requestAnimationFrame(() => {
      style.remove()
    })
  })
}
