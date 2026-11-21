<script lang="ts">
  import { useResonare } from 'resonare/lite/svelte'

  import { store } from '#lib/store'

  const { theme, resolvedTheme, setTheme } = useResonare(store)
</script>

<main>
  <h1>resonare + SvelteKit</h1>
  <select
    aria-label="Theme"
    data-testid="theme"
    value={theme.current}
    onchange={(event) => {
      setTheme(event.currentTarget.value as typeof theme.current)
    }}
  >
    <option value="system">System</option>
    <option value="light">Light</option>
    <option value="dark">Dark</option>
  </select>
  <p data-testid="resolved">{resolvedTheme.current}</p>
</main>
