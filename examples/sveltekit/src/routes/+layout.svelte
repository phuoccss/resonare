<script lang="ts">
  import { themeScriptTag } from '#lib/theme'

  let { children } = $props()
</script>

<!-- Rendered into the server HTML, so it runs before first paint. -->
<svelte:head>
  {@html themeScriptTag}
</svelte:head>

{@render children()}
