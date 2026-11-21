import { defineConfig, devices } from '@playwright/test'

const isCI = !!process.env['CI']

/** Each example app, built and served in production mode on its own port. */
const EXAMPLES = [
  { name: 'next', port: 4401 },
  { name: 'vite-react', port: 4402 },
  { name: 'sveltekit', port: 4403 },
  { name: 'nuxt', port: 4404 },
  { name: 'tanstack-start', port: 4405 },
]

export default defineConfig({
  testDir: 'tests',
  forbidOnly: isCI,
  retries: isCI ? 1 : 0,
  reporter: isCI ? 'github' : 'list',
  use: { trace: 'retain-on-failure' },
  projects: EXAMPLES.map(({ name, port }) => {
    return {
      name,
      use: {
        ...devices['Desktop Chrome'],
        baseURL: `http://localhost:${port}`,
      },
    }
  }),
  webServer: EXAMPLES.map(({ name, port }) => {
    return {
      command: `pnpm --filter example-${name} build && pnpm --filter example-${name} start`,
      url: `http://localhost:${port}`,
      reuseExistingServer: !isCI,
      timeout: 300_000,
    }
  }),
})
