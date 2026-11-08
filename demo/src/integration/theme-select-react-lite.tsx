import * as React from 'react'
import { useResonare } from 'resonare/lite/react'

import { connectLiteThemeStore, liteThemeStore } from './shared'

const SECTION_ID = 'react'

const svgProps = {
  width: '24',
  height: '24',
  'aria-hidden': true,
  focusable: 'false',
} as const

export function ThemeSelect() {
  const { theme, setTheme } = useResonare(liteThemeStore)

  React.useEffect(() => {
    return connectLiteThemeStore()
  }, [])

  return (
    <div className='theme-toggle'>
      <input
        type='radio'
        name={`${SECTION_ID}-theme`}
        id={`${SECTION_ID}-system`}
        value='system'
        checked={theme === 'system'}
        onChange={() => {
          setTheme('system')
        }}
      />

      <label htmlFor={`${SECTION_ID}-system`}>
        <svg
          {...svgProps}
          data-system='light'
        >
          <use href='#sun' />
        </svg>

        <svg
          {...svgProps}
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
        checked={theme === 'light'}
        onChange={() => {
          setTheme('light')
        }}
      />

      <label htmlFor={`${SECTION_ID}-light`}>
        <svg {...svgProps}>
          <use href='#sun' />
        </svg>

        <span>Light</span>
      </label>

      <input
        type='radio'
        name={`${SECTION_ID}-theme`}
        id={`${SECTION_ID}-dark`}
        value='dark'
        checked={theme === 'dark'}
        onChange={() => {
          setTheme('dark')
        }}
      />

      <label htmlFor={`${SECTION_ID}-dark`}>
        <svg {...svgProps}>
          <use href='#moon' />
        </svg>

        <span>Dark</span>
      </label>
    </div>
  )
}
