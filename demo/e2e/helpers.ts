import { type Page, expect } from '@playwright/test'

export const FRAMEWORKS = ['react', 'solid', 'svelte', 'vue'] as const

/** Colors `setThemeColor` uses in the demo. */
export const THEME_COLORS = { light: '#f5f5f5', dark: '#0a0a0a' } as const

/** Astro drops `ssr` from an island once it has hydrated. */
export const waitForHydration = async (page: Page): Promise<void> => {
  await expect(page.locator('astro-island')).not.toHaveCount(0)

  await expect(page.locator('astro-island[ssr]')).toHaveCount(0)
}

/** Keeps the page to server HTML plus inline scripts: no island hydrates. */
export const blockExternalScripts = async (page: Page): Promise<void> => {
  await page.route('**/*.{js,mjs}', (route) => {
    return route.abort()
  })
}

export const saveBeforeLoad = async (
  page: Page,
  key: string,
  value: string
): Promise<void> => {
  await page.addInitScript(
    ([storageKey, storageValue]) => {
      // Only seed once, so reloads keep what the page saved. Storage throws
      // on documents without an origin, such as about:blank.
      try {
        if (!sessionStorage.getItem('seeded')) {
          localStorage.setItem(storageKey!, storageValue!)

          sessionStorage.setItem('seeded', '1')
        }
      } catch {}
    },
    [key, value]
  )
}

export const htmlState = async (page: Page) => {
  return page.evaluate(() => {
    const root = document.documentElement

    return {
      data: { ...root.dataset },
      colorScheme: root.style.colorScheme,
      themeColors: [
        ...document.querySelectorAll<HTMLMetaElement>(
          'meta[name="theme-color"]'
        ),
      ].map((meta) => {
        return meta.content
      }),
    }
  })
}

/** Records the transition-blocking style that `disableTransitions` adds. */
export const watchTransitionStyle = async (page: Page): Promise<void> => {
  await page.evaluate(() => {
    const log: Array<string> = []

    Object.assign(window, { __transitionLog: log })

    new MutationObserver((mutations) => {
      for (const mutation of mutations) {
        for (const node of mutation.addedNodes) {
          if (node.textContent?.includes('transition:none')) {
            log.push('added')
          }
        }

        for (const node of mutation.removedNodes) {
          if (node.textContent?.includes('transition:none')) {
            log.push('removed')
          }
        }
      }
    }).observe(document.head, { childList: true })
  })
}

export const transitionLog = async (page: Page): Promise<Array<string>> => {
  return page.evaluate(() => {
    return (window as unknown as { __transitionLog: Array<string> })
      .__transitionLog
  })
}

/**
 * Hydration problems React, Vue, Svelte and Solid report in the console. The
 * demo is a production build, where React only logs minified error codes
 * (418, 419, 423, 425: hydration failed or mismatched).
 */
const HYDRATION_PROBLEM =
  /hydrat|mismatch|did not match|react\.dev\/errors\/4(18|19|23|25)\b/i

/** Collects hydration warnings and uncaught page errors while loading. */
export const collectHydrationWarnings = (page: Page): Array<string> => {
  const messages: Array<string> = []

  page.on('console', (message) => {
    if (HYDRATION_PROBLEM.test(message.text())) {
      messages.push(`${message.type()}: ${message.text()}`)
    }
  })

  page.on('pageerror', (error) => {
    messages.push(`pageerror: ${error.message}`)
  })

  return messages
}
