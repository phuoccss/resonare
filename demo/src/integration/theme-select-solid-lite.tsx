/** @jsxImportSource solid-js */

import { useResonare } from 'resonare/lite/solid'
import { onCleanup, onMount } from 'solid-js'

import { connectLiteThemeStore, liteThemeStore } from './shared'

const SECTION_ID = 'solid'

export function ThemeSelect() {
  const { theme, setTheme } = useResonare(liteThemeStore)

  onMount(() => {
    onCleanup(connectLiteThemeStore())
  })

  const checked = (value: string) => {
    return theme() === value
  }

  return (
    <div class='theme-toggle'>
      <input
        type='radio'
        name={`${SECTION_ID}-theme`}
        id={`${SECTION_ID}-system`}
        value='system'
        checked={checked('system')}
        onChange={() => {
          setTheme('system')
        }}
      />

      <label for={`${SECTION_ID}-system`}>
        <svg
          width='24'
          height='24'
          aria-hidden='true'
          data-system='light'
        >
          <use href='#sun' />
        </svg>

        <svg
          width='24'
          height='24'
          aria-hidden='true'
          data-system='dark'
        >
          <use href='#moon' />
        </svg>

        <span>System</span>
      </label>

      <input
        type='radio'
        name={`${SECTION_ID}-theme`}
        id={`${SECTION_ID}-light`}
        value='light'
        checked={checked('light')}
        onChange={() => {
          setTheme('light')
        }}
      />

      <label for={`${SECTION_ID}-light`}>
        <svg
          width='24'
          height='24'
          aria-hidden='true'
        >
          <use href='#sun' />
        </svg>

        <span>Light</span>
      </label>

      <input
        type='radio'
        name={`${SECTION_ID}-theme`}
        id={`${SECTION_ID}-dark`}
        value='dark'
        checked={checked('dark')}
        onChange={() => {
          setTheme('dark')
        }}
      />

      <label for={`${SECTION_ID}-dark`}>
        <svg
          width='24'
          height='24'
          aria-hidden='true'
        >
          <use href='#moon' />
        </svg>

        <span>Dark</span>
      </label>
    </div>
  )
}
