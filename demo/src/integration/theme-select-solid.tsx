/** @jsxImportSource solid-js */

import { useResonare } from 'resonare/solid'
import { For, onCleanup, onMount } from 'solid-js'

import {
  THEME_LABELS,
  connectThemeStore,
  themeStore,
  themesAndOptions,
} from './shared'

const SECTION_ID = 'solid'

export function ThemeSelect() {
  const { themes, setThemes } = useResonare(themeStore)

  onMount(() => {
    onCleanup(connectThemeStore())
  })

  return (
    <div class='theme-select'>
      <For each={themesAndOptions}>
        {([theme, options]) => {
          return (
            <>
              <label for={`${SECTION_ID}-${theme}`}>
                {THEME_LABELS[theme]}
              </label>
              <select
                id={`${SECTION_ID}-${theme}`}
                name={theme}
                onChange={(event) => {
                  setThemes({
                    [theme]: event.currentTarget.value,
                  })
                }}
                value={themes()[theme]}
              >
                <For each={options}>
                  {(option) => {
                    return <option value={option}>{option}</option>
                  }}
                </For>
              </select>
            </>
          )
        }}
      </For>
    </div>
  )
}
