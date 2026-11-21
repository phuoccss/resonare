import { expect, test } from '@playwright/test'

import {
  FRAMEWORKS,
  THEME_COLORS,
  blockExternalScripts,
  collectHydrationWarnings,
  htmlState,
  saveBeforeLoad,
  waitForHydration,
} from './helpers'

const KEY = 'demo-lite'

test.describe('resonare/lite', () => {
  test('applies the saved theme before any app script runs', async ({
    page,
  }) => {
    await page.emulateMedia({ colorScheme: 'light' })

    await saveBeforeLoad(page, KEY, 'dark')

    await blockExternalScripts(page)

    await page.goto('/lite/')

    expect(await htmlState(page)).toMatchObject({
      data: { theme: 'dark', system: 'light' },
      colorScheme: 'dark',
      themeColors: [THEME_COLORS.dark, THEME_COLORS.dark],
    })
  })

  test('follows the OS preference while on system', async ({ page }) => {
    await page.emulateMedia({ colorScheme: 'light' })

    await page.goto('/lite/')

    await waitForHydration(page)

    await expect(page.locator('html')).toHaveAttribute('data-theme', 'light')

    await page.emulateMedia({ colorScheme: 'dark' })

    await expect(page.locator('html')).toHaveAttribute('data-theme', 'dark')

    await expect(page.locator('html')).toHaveAttribute('data-system', 'dark')
  })

  test('hydrates every framework without warnings', async ({ page }) => {
    await saveBeforeLoad(page, KEY, 'dark')

    const warnings = collectHydrationWarnings(page)

    await page.goto('/lite/')

    await waitForHydration(page)

    for (const framework of FRAMEWORKS) {
      await expect(page.locator(`#${framework}-dark`)).toBeChecked()
    }

    expect(warnings).toEqual([])
  })

  for (const framework of FRAMEWORKS) {
    test(`${framework}: changes the theme for every framework and saves it`, async ({
      page,
    }) => {
      await page.emulateMedia({ colorScheme: 'light' })

      await page.goto('/lite/')

      await waitForHydration(page)

      await page.locator(`label[for="${framework}-dark"]`).click()

      await expect(page.locator('html')).toHaveAttribute('data-theme', 'dark')

      for (const other of FRAMEWORKS) {
        await expect(page.locator(`#${other}-dark`)).toBeChecked()
      }

      expect(await htmlState(page)).toMatchObject({
        colorScheme: 'dark',
        themeColors: [THEME_COLORS.dark, THEME_COLORS.dark],
      })

      await page.reload()

      await waitForHydration(page)

      await expect(page.locator('html')).toHaveAttribute('data-theme', 'dark')

      await expect(page.locator(`#${framework}-dark`)).toBeChecked()
    })
  }
})
