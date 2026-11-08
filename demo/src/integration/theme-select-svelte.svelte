<script lang='ts'>
  import { onMount } from 'svelte'

  import { useResonare } from 'resonare/svelte'

  import {
    THEME_LABELS,
    connectThemeStore,
    themeStore,
    themesAndOptions,
  } from './shared'

  const SECTION_ID = 'svelte'

  const { themes, setThemes } = useResonare(themeStore)

  onMount(() => {
    return connectThemeStore()
  })
</script>

<div class='theme-select'>
  {#each themesAndOptions as [theme, options] (theme)}
    <label for={`${SECTION_ID}-${theme}`}>
      {THEME_LABELS[theme]}
    </label>
    <select
      id={`${SECTION_ID}-${theme}`}
      name={theme}
      value={themes.current[theme]}
      onchange={(event) => {
        setThemes({
          [theme]: event.currentTarget.value,
        })
      }}
    >
      {#each options as option (option)}
        <option value={option}>{option}</option>
      {/each}
    </select>
  {/each}
</div>
