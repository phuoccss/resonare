import { expect, test } from '@playwright/test'

import {
  FRAMEWORKS,
  THEME_COLORS,
  blockExternalScripts,
  collectHydrationWarnings,
  htmlState,
  saveBeforeLoad,
  transitionLog,
  waitForHydration,
  watchTransitionStyle,
} from './helpers'

const KEY = 'demo'

const saved = (themes: Record<string, string>): string => {
  return JSON.stringify({ themes })
}

test.describe('resonare (full)', () => {
  test('applies the saved theme before any app script runs', async ({
    page,
  }) => {
    await saveBeforeLoad(
      page,
      KEY,
      saved({ colorScheme: 'dark', contrast: 'high', color: 'blue' })
    )

    await blockExternalScripts(page)

    await page.goto('/')

    await expect(page.locator('astro-island[ssr]')).not.toHaveCount(0)

    expect(await htmlState(page)).toMatchObject({
      data: { colorScheme: 'dark', contrast: 'high', color: 'blue' },
      colorScheme: 'dark',
      themeColors: [THEME_COLORS.dark, THEME_COLORS.dark],
    })
  })

  test('follows the OS preference while on system', async ({ page }) => {
    await page.emulateMedia({ colorScheme: 'dark' })

    await page.goto('/')

    await waitForHydration(page)

    await expect(page.locator('html')).toHaveAttribute(
      'data-color-scheme',
      'dark'
    )

    await page.emulateMedia({ colorScheme: 'light' })

    await expect(page.locator('html')).toHaveAttribute(
      'data-color-scheme',
      'light'
    )

    expect((await htmlState(page)).themeColors).toEqual([
      THEME_COLORS.light,
      THEME_COLORS.light,
    ])
  })

  test('hydrates every framework without warnings', async ({ page }) => {
    // Saved state that differs from the server render is where mismatches show.
    await saveBeforeLoad(page, KEY, saved({ colorScheme: 'dark' }))

    const warnings = collectHydrationWarnings(page)

    await page.goto('/')

    await waitForHydration(page)

    for (const framework of FRAMEWORKS) {
      await expect(page.locator(`#${framework}-colorScheme`)).toHaveValue(
        'dark'
      )
    }

    expect(warnings).toEqual([])
  })

  for (const framework of FRAMEWORKS) {
    test(`${framework}: changes the theme for every framework and saves it`, async ({
      page,
    }) => {
      await page.emulateMedia({ colorScheme: 'light' })

      await page.goto('/')

      await waitForHydration(page)

      await watchTransitionStyle(page)

      await page.locator(`#${framework}-colorScheme`).selectOption('dark')

      await expect(page.locator('html')).toHaveAttribute(
        'data-color-scheme',
        'dark'
      )

      for (const other of FRAMEWORKS) {
        await expect(page.locator(`#${other}-colorScheme`)).toHaveValue('dark')
      }

      expect(await htmlState(page)).toMatchObject({
        colorScheme: 'dark',
        themeColors: [THEME_COLORS.dark, THEME_COLORS.dark],
      })

      await expect
        .poll(() => {
          return transitionLog(page)
        })
        .toEqual(['added', 'removed'])

      await page.reload()

      await waitForHydration(page)

      await expect(page.locator('html')).toHaveAttribute(
        'data-color-scheme',
        'dark'
      )

      await expect(page.locator(`#${framework}-colorScheme`)).toHaveValue(
        'dark'
      )
    })
  }

  test('syncs changes across tabs', async ({ context }) => {
    const [first, second] = [await context.newPage(), await context.newPage()]

    for (const page of [first, second]) {
      await page.goto('/')

      await waitForHydration(page)
    }

    await first.locator('#vue-contrast').selectOption('high')

    await expect(second.locator('html')).toHaveAttribute(
      'data-contrast',
      'high'
    )

    await expect(second.locator('#react-contrast')).toHaveValue('high')
  })
})
