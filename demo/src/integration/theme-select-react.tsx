import * as React from 'react'
import { useResonare } from 'resonare/react'

import {
  THEME_LABELS,
  connectThemeStore,
  themeStore,
  themesAndOptions,
} from './shared'

const SECTION_ID = 'react'

export function ThemeSelect() {
  const { themes, setThemes } = useResonare(themeStore)

  React.useEffect(() => {
    return connectThemeStore()
  }, [])

  return (
    <div className='theme-select'>
      {themesAndOptions.map(([theme, options]) => {
        return (
          <React.Fragment key={theme}>
            <label htmlFor={`${SECTION_ID}-${theme}`}>
              {THEME_LABELS[theme]}
            </label>
            <select
              id={`${SECTION_ID}-${theme}`}
              name={theme}
              onChange={(event) => {
                setThemes({
                  [theme]: event.target.value,
                })
              }}
              value={themes[theme]}
            >
              {options.map((option) => {
                return (
                  <option
                    key={option}
                    value={option}
                  >
                    {option}
                  </option>
                )
              })}
            </select>
          </React.Fragment>
        )
      })}
    </div>
  )
}
