import { readFileSync } from 'node:fs'
import { join } from 'node:path'
import { describe, expect, it } from 'vite-plus/test'

const packageRoot = join(import.meta.dirname, '..')

const read = (path: string): string => {
  return readFileSync(join(packageRoot, path), 'utf8')
}

const llms = read('llms.txt')

const entries = Object.entries(
  (
    JSON.parse(read('package.json')) as {
      exports: Record<string, { import: string }>
    }
  ).exports
)

// The examples are kept as files in the demo, where they are type-checked
// against the package like any app would use it.
const EXAMPLES = ['setup.ts', 'lite.ts']

describe('llms.txt', () => {
  it.each(entries)(
    'should mention the %s entry and its exports',
    async (entry, { import: file }) => {
      const name = entry === '.' ? 'resonare' : `resonare/${entry.slice(2)}`

      expect(llms, `llms.txt should name ${name}`).toContain(`\`${name}\``)

      const module = (await import(
        /* @vite-ignore */ join(packageRoot, file)
      )) as Record<string, unknown>

      const missing = Object.keys(module).filter((exported) => {
        return !new RegExp(`\\b${exported}\\b`).test(llms)
      })

      expect(missing, `add these ${name} exports to llms.txt`).toEqual([])
    }
  )

  it('should keep its examples identical to the type-checked copies', () => {
    const blocks = [...llms.matchAll(/```ts\n([\s\S]*?)```/g)].map((match) => {
      return match[1]
    })

    const files = EXAMPLES.map((example) => {
      return read(`../demo/src/llms-examples/${example}`)
    })

    expect(
      blocks,
      'llms.txt examples must match demo/src/llms-examples/* exactly'
    ).toEqual(files)
  })
})
