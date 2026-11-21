<script lang="ts">
  import { themeScript } from '#lib/theme'

  let { children } = $props()

  // `<\/script>` so it doesn't end this <script> block.
  const themeTag = `<script>${themeScript}</script>`
</script>

<!-- Rendered into the server HTML, so it runs before first paint. -->
<svelte:head>
  {@html themeTag}
</svelte:head>

{@render children()}
