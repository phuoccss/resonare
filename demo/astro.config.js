import cloudflare from '@astrojs/cloudflare'
import react from '@astrojs/react'
import solid from '@astrojs/solid-js'
import svelte from '@astrojs/svelte'
import vue from '@astrojs/vue'
import { defineConfig } from 'astro/config'

export default defineConfig({
  adapter: cloudflare(),
  devToolbar: {
    enabled: false,
  },
  vite: {
    plugins: [
      {
        name: 'keep-react-refresh-out-of-vue',
        configResolved(config) {
          const jsx = config.oxc?.jsx

          if (!jsx || typeof jsx !== 'object' || !jsx.refresh) {
            return
          }

          // @vitejs/plugin-vue compiles <script lang="ts"> with transformWithOxc
          // and spreads this config. React refresh then wraps Vue modules in
          // $RefreshSig$, which the Cloudflare dev worker evaluates without the
          // browser preamble. Swap the object so Vue sees refresh off. Vite's
          // oxc plugin already captured the original object for React files.
          config.oxc.jsx = {
            ...jsx,
            refresh: false,
          }
        },
      },
    ],
  },
  integrations: [
    react({
      include: ['**/theme-select-react*.tsx'],
    }),
    solid({
      include: ['**/theme-select-solid*.tsx'],
    }),
    svelte(),
    vue(),
  ],
  session: false,
})
