import react from '@vitejs/plugin-react'
import { defineConfig } from 'vite-plus'

declare global {
  namespace NodeJS {
    interface ProcessEnv {
      CI: string | undefined
    }
  }
}

const isCI = !!process.env.CI

export default defineConfig({
  pack: [
    {
      entry: {
        index: 'src/index.ts',
        react: 'src/react.ts',
        solid: 'src/solid.ts',
        svelte: 'src/svelte.ts',
        vue: 'src/vue.ts',
        lite: 'src/lite.ts',
        'lite-react': 'src/lite-react.ts',
        'lite-solid': 'src/lite-solid.ts',
        'lite-svelte': 'src/lite-svelte.ts',
        'lite-vue': 'src/lite-vue.ts',
      },
      dts: {
        sourcemap: true,
      },
      deps: {
        dts: {
          // `ComputedRef` is declared in `@vue/reactivity` and re-exported by `vue`.
          neverBundle: ['vue', '@vue/reactivity'],
        },
      },

      platform: 'neutral',
      target: 'ES2023',
      plugins: [
        react({
          compiler: true,
          exclude: [
            /[/\\]node_modules[/\\]/,
            /\.d\.ts$/,
            /[/\\](?:lite-)?(?:solid|svelte|vue)\.ts$/,
          ],
        }),
      ],

      clean: isCI,
      minify: isCI,
    },
  ],
  test: {
    environment: 'jsdom',
  },
  resolve: {
    tsconfigPaths: true,
  },
})
