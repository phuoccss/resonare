<script lang='ts'>
  import { onMount } from 'svelte'

  import { useResonare } from 'resonare/lite/svelte'

  import { connectLiteThemeStore, liteThemeStore } from './shared'

  const SECTION_ID = 'svelte'

  const { theme, setTheme } = useResonare(liteThemeStore)

  onMount(() => {
    return connectLiteThemeStore()
  })
</script>

<div class='theme-toggle'>
  <input
    type='radio'
    name={`${SECTION_ID}-theme`}
    id={`${SECTION_ID}-system`}
    value='system'
    checked={theme.current === 'system'}
    onchange={() => {
      setTheme('system')
    }}
  />

  <label for={`${SECTION_ID}-system`}>
    <svg
      width='24'
      height='24'
      aria-hidden='true'
      focusable='false'
      data-system='light'
    >
      <use href='#sun' />
    </svg>

    <svg
      width='24'
      height='24'
      aria-hidden='true'
      focusable='false'
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
    checked={theme.current === 'light'}
    onchange={() => {
      setTheme('light')
    }}
  />

  <label for={`${SECTION_ID}-light`}>
    <svg
      width='24'
      height='24'
      aria-hidden='true'
      focusable='false'
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
    checked={theme.current === 'dark'}
    onchange={() => {
      setTheme('dark')
    }}
  />

  <label for={`${SECTION_ID}-dark`}>
    <svg
      width='24'
      height='24'
      aria-hidden='true'
      focusable='false'
    >
      <use href='#moon' />
    </svg>

    <span>Dark</span>
  </label>
</div>
