import { type Page, expect, test } from '@playwright/test'

// resonare/lite's default storage key; the saved value is the theme itself.
const KEY = 'resonare/lite'

const THEME_COLORS = { light: '#ffffff', dark: '#0a0a0a' } as const

const DARK_CLASS = /\bdark\b/

const select = (page: Page) => {
  return page.getByTestId('theme')
}

const seed = async (page: Page, theme: string): Promise<void> => {
  await page.addInitScript(
    ([key, value]) => {
      try {
        if (!sessionStorage.getItem('seeded')) {
          localStorage.setItem(key!, value!)

          sessionStorage.setItem('seeded', '1')
        }
      } catch {}
    },
    [KEY, theme]
  )
}

/** What the examples' effects set on <html>. */
const htmlState = async (page: Page) => {
  return page.evaluate(() => {
    const root = document.documentElement

    return {
      dark: root.classList.contains('dark'),
      cssColorScheme: root.style.colorScheme,
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

/** Waits until the app has hydrated: the select reflects the store. */
const waitForApp = async (page: Page): Promise<void> => {
  await expect(select(page)).toBeEnabled()

  await page.waitForLoadState('networkidle')
}

test('applies the saved theme before any app script runs', async ({ page }) => {
  await seed(page, 'dark')

  await page.route('**/*.{js,mjs}', (route) => {
    return route.abort()
  })

  await page.goto('/')

  expect(await htmlState(page)).toEqual({
    dark: true,
    cssColorScheme: 'dark',
    themeColors: [THEME_COLORS.dark],
  })
})

test('hydrates without warnings', async ({ page }) => {
  await seed(page, 'dark')

  const problems: Array<string> = []

  page.on('console', (message) => {
    if (
      /hydrat|mismatch|did not match|react\.dev\/errors\/4(18|19|23|25)\b/i.test(
        message.text()
      )
    ) {
      problems.push(`${message.type()}: ${message.text()}`)
    }
  })

  page.on('pageerror', (error) => {
    problems.push(`pageerror: ${error.message}`)
  })

  await page.goto('/')

  await waitForApp(page)

  await expect(select(page)).toHaveValue('dark')

  await expect(page.getByTestId('resolved')).toHaveText('dark')

  expect(problems).toEqual([])
})

test('changes the theme and keeps it after a reload', async ({ page }) => {
  // The OS prefers dark, so light can only come from the user's choice.
  await page.emulateMedia({ colorScheme: 'dark' })

  await page.goto('/')

  await waitForApp(page)

  await expect(page.locator('html')).toHaveClass(DARK_CLASS)

  await select(page).selectOption('light')

  await expect(page.locator('html')).not.toHaveClass(DARK_CLASS)

  expect(await htmlState(page)).toEqual({
    dark: false,
    cssColorScheme: 'light',
    themeColors: [THEME_COLORS.light],
  })

  await page.reload()

  await waitForApp(page)

  await expect(select(page)).toHaveValue('light')

  expect(await htmlState(page)).toMatchObject({
    dark: false,
    cssColorScheme: 'light',
  })
})

test('follows the OS preference while on system', async ({ page }) => {
  await page.emulateMedia({ colorScheme: 'light' })

  await page.goto('/')

  await waitForApp(page)

  await expect(page.locator('html')).not.toHaveClass(DARK_CLASS)

  await page.emulateMedia({ colorScheme: 'dark' })

  await expect(page.locator('html')).toHaveClass(DARK_CLASS)

  expect((await htmlState(page)).themeColors).toEqual([THEME_COLORS.dark])
})

test('syncs changes across tabs', async ({ context }) => {
  const [first, second] = [await context.newPage(), await context.newPage()]

  for (const page of [first, second]) {
    await page.emulateMedia({ colorScheme: 'light' })

    await page.goto('/')

    await waitForApp(page)
  }

  await expect(second.locator('html')).not.toHaveClass(DARK_CLASS)

  await select(first).selectOption('dark')

  await expect(second.locator('html')).toHaveClass(DARK_CLASS)

  await expect(select(second)).toHaveValue('dark')
})
