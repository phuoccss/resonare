import { mkdirSync, writeFileSync } from 'node:fs'
import { createRequire } from 'node:module'
import { dirname, join } from 'node:path'
import { compile } from 'svelte/compiler'
import { afterEach, describe, expect, it, vi } from 'vite-plus/test'

import type { ThemeStoreConfig } from '../dist'
import { setSystemColorScheme } from './utils'

// Under the `node` condition `svelte` resolves to its server build, which has
// no `mount` or `hydrate` and a no-op `createSubscriber`. Server rendering needs
// that build and the client steps need the browser one, so each step imports
// its own copy of the modules.
const svelteDir = dirname(createRequire(import.meta.url).resolve('svelte'))

const OUT_DIR = join(import.meta.dirname, '../node_modules/.tmp/svelte')

const CONFIG = {
  colorScheme: {
    options: [
      'light',
      'dark',
      {
        value: 'system',
        media: ['(prefers-color-scheme: dark)', 'dark', 'light'],
      },
    ],
    defaultValue: 'system',
  },
} as const satisfies ThemeStoreConfig

const PROBES = {
  full: `<script>
  let { store, useResonare } = $props()

  const { resolvedThemes } = useResonare(store)

  const value = $derived(resolvedThemes.current.colorScheme)
</script>

{#if value === 'dark'}<b>{value}</b>{:else}<i>{value}</i>{/if}
`,
  lite: `<script>
  let { store, useResonare } = $props()

  const { resolvedTheme } = useResonare(store)

  const value = $derived(resolvedTheme.current)
</script>

{#if value === 'dark'}<b>{value}</b>{:else}<i>{value}</i>{/if}
`,
}

type ProbeName = keyof typeof PROBES

function compileProbe(name: ProbeName, generate: 'client' | 'server') {
  const { js } = compile(PROBES[name], {
    generate,
    dev: true,
    filename: `${name}.svelte`,
  })

  const file = join(OUT_DIR, `${name}.${generate}.js`)

  mkdirSync(OUT_DIR, { recursive: true })

  writeFileSync(file, js.code)

  return file
}

/**
 * Fresh store plus a way to switch it to dark, for either flavor. `subscribe`
 * is wrapped so tests can count subscriptions and unsubscriptions.
 */
async function loadBindings(name: ProbeName) {
  const unsubscribe = vi.fn()

  if (name === 'full') {
    const [{ createThemeStore }, { useResonare }] = await Promise.all([
      import('../dist'),
      import('../dist/svelte'),
    ])

    const store = createThemeStore(CONFIG, { storage: null })

    const { subscribe } = store

    store.subscribe = vi.fn((callback: Parameters<typeof subscribe>[0]) => {
      const stop = subscribe(callback)

      return () => {
        unsubscribe()

        stop()
      }
    })

    return {
      store,
      unsubscribe,
      useResonare,
      setDark: () => {
        store.setThemes({ colorScheme: 'dark' })
      },
    }
  }

  const [{ createThemeStore }, { useResonare }] = await Promise.all([
    import('../dist/lite'),
    import('../dist/lite-svelte'),
  ])

  const store = createThemeStore({ storage: null })

  const { subscribe } = store

  store.subscribe = vi.fn((callback: Parameters<typeof subscribe>[0]) => {
    const stop = subscribe(callback)

    return () => {
      unsubscribe()

      stop()
    }
  })

  return {
    store,
    unsubscribe,
    useResonare,
    setDark: () => {
      store.setTheme('dark')
    },
  }
}

/** Re-imports Svelte (and the adapters) from the browser build. */
async function useBrowserSvelte() {
  vi.resetModules()

  vi.doMock('svelte', () => {
    return import(/* @vite-ignore */ join(svelteDir, 'index-client.js'))
  })

  vi.doMock('svelte/reactivity', () => {
    return import(
      /* @vite-ignore */ join(svelteDir, 'reactivity/index-client.js')
    )
  })

  return import('svelte')
}

describe('svelte', () => {
  afterEach(() => {
    vi.doUnmock('svelte')

    vi.doUnmock('svelte/reactivity')

    vi.resetModules()

    vi.unstubAllGlobals()

    vi.restoreAllMocks()
  })

  it.each(['full', 'lite'] as const)(
    '%s should update while mounted and unsubscribe on unmount',
    async (name) => {
      setSystemColorScheme('light')

      const clientFile = compileProbe(name, 'client')

      const { flushSync, mount, tick, unmount } = await useBrowserSvelte()

      const { default: ClientProbe } = await import(
        /* @vite-ignore */ clientFile
      )

      const { store, unsubscribe, useResonare, setDark } =
        await loadBindings(name)

      const container = document.createElement('div')

      const component = mount(ClientProbe, {
        target: container,
        props: { store, useResonare },
      })

      flushSync()

      expect(container.querySelector('i')?.textContent).toBe('light')

      expect(store.subscribe).toHaveBeenCalledOnce()

      setDark()

      flushSync()

      expect(container.querySelector('b')?.textContent).toBe('dark')

      await unmount(component)

      // Svelte tears the subscription down in a microtask.
      await tick()

      expect(unsubscribe).toHaveBeenCalledOnce()
    }
  )

  it.each(['full', 'lite'] as const)(
    '%s should repair server markup while hydrating, without warnings',
    async (name) => {
      const serverFile = compileProbe(name, 'server')

      const clientFile = compileProbe(name, 'client')

      // Servers have no `matchMedia`, so `system` renders as light there.
      vi.stubGlobal('matchMedia', undefined)

      const { render } = await import('svelte/server')

      const { default: ServerProbe } = await import(
        /* @vite-ignore */ serverFile
      )

      const { store, useResonare } = await loadBindings(name)

      const { body } = render(ServerProbe, { props: { store, useResonare } })

      expect(body).toContain('<i>light</i>')

      vi.unstubAllGlobals()

      // The client resolves `system` to dark.
      setSystemColorScheme('dark')

      const { flushSync, hydrate } = await useBrowserSvelte()

      const { default: ClientProbe } = await import(
        /* @vite-ignore */ clientFile
      )

      const container = document.createElement('div')

      container.innerHTML = body

      const warn = vi.spyOn(console, 'warn')

      const error = vi.spyOn(console, 'error')

      const client = await loadBindings(name)

      hydrate(ClientProbe, {
        target: container,
        props: { store: client.store, useResonare: client.useResonare },
      })

      flushSync()

      expect(warn).not.toHaveBeenCalled()

      expect(error).not.toHaveBeenCalled()

      expect(container.querySelector('b')?.textContent).toBe('dark')

      expect(container.querySelector('i')).toBeNull()
    }
  )
})
