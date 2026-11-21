import { createFileRoute } from '@tanstack/react-router'

import { ThemeSelect } from '../theme-select'

export const Route = createFileRoute('/')({
  component: Page,
})

function Page() {
  return (
    <main>
      <h1>resonare + TanStack Start</h1>
      <ThemeSelect />
    </main>
  )
}
