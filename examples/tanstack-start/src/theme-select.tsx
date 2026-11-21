import { useResonare } from 'resonare/lite/react'

import { store } from './theme'

export function ThemeSelect() {
  const { theme, resolvedTheme, setTheme } = useResonare(store)

  return (
    <>
      <select
        aria-label='Theme'
        data-testid='theme'
        value={theme}
        onChange={(event) => {
          setTheme(event.target.value as typeof theme)
        }}
      >
        <option value='system'>System</option>
        <option value='light'>Light</option>
        <option value='dark'>Dark</option>
      </select>
      <p data-testid='resolved'>{resolvedTheme}</p>
    </>
  )
}
