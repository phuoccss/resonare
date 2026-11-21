import { readFileSync, readdirSync } from 'node:fs'
import { join } from 'node:path'
import { describe, expect, it } from 'vite-plus/test'

const packageRoot = join(import.meta.dirname, '..')

const examplesRoot = join(packageRoot, '../examples')

const recipes = readdirSync(join(packageRoot, 'recipes'))
  .filter((file) => {
    return file.endsWith('.md')
  })
  .map((file) => {
    return file.slice(0, -'.md'.length)
  })

const examples = readdirSync(examplesRoot, { withFileTypes: true })
  .filter((entry) => {
    return entry.isDirectory() && entry.name !== 'e2e'
  })
  .map((entry) => {
    return entry.name
  })

describe('recipes', () => {
  it('should have one recipe per example app', () => {
    expect(recipes.toSorted()).toEqual(examples.toSorted())
  })

  it('should be listed in llms.txt', () => {
    const llms = readFileSync(join(packageRoot, 'llms.txt'), 'utf8')

    for (const recipe of recipes) {
      expect(llms).toContain(`recipes/${recipe}.md`)
    }
  })

  // Code blocks labelled with a path (```tsx app/layout.tsx) must be the
  // example app's file, which CI builds and tests in a browser.
  it.each(recipes)('%s should match its example app', (recipe) => {
    const markdown = readFileSync(
      join(packageRoot, 'recipes', `${recipe}.md`),
      'utf8'
    )

    const blocks = [...markdown.matchAll(/```\w+ (\S+)\n([\s\S]*?)```/g)]

    expect(blocks.length).toBeGreaterThan(0)

    for (const [, path, code] of blocks) {
      expect(
        code,
        `recipes/${recipe}.md: ${path} differs from examples/${recipe}/${path}`
      ).toBe(readFileSync(join(examplesRoot, recipe!, path!), 'utf8'))
    }
  })
})
