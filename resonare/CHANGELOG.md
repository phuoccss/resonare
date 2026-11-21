# resonare

## 0.5.0

### Minor Changes

- [#12](https://github.com/phuoccss/resonare/pull/12) [`3d13f6a`](https://github.com/phuoccss/resonare/commit/3d13f6a5cfcf502e3f6a478771461388eb2002a0) Thanks [@phuoccss](https://github.com/phuoccss)! - `combine<typeof CONFIG>(…)` from `resonare/effects` now checks the setting names and values of every effect inside it, so the config type no longer has to be repeated on each effect. `Effect` from `resonare/effects` now takes the config type (`Effect<typeof CONFIG>`) instead of the state type.

### Patch Changes

- [#11](https://github.com/phuoccss/resonare/pull/11) [`8ac7a78`](https://github.com/phuoccss/resonare/commit/8ac7a78d255b905743d3f1e851dbe0f4612205ea) Thanks [@phuoccss](https://github.com/phuoccss)! - Ship tested framework recipes (`recipes/next.md`, `vite-react.md`, `sveltekit.md`, `nuxt.md`, `tanstack-start.md`) in the package and link them from `llms.txt`.

## 0.4.1

### Patch Changes

- [#5](https://github.com/phuoccss/resonare/pull/5) [`7ecffa9`](https://github.com/phuoccss/resonare/commit/7ecffa954d07b7136e102a49d343f14023f7801d) Thanks [@phuoccss](https://github.com/phuoccss)! - Ship `llms.txt`, a short reference for coding agents, in the package.

## 0.4.0

### Minor Changes

- [#1](https://github.com/phuoccss/resonare/pull/1) [`d346683`](https://github.com/phuoccss/resonare/commit/d34668387267408b1293b7d70e7376863ec57d19) Thanks [@phuoccss](https://github.com/phuoccss)! - Add `resonare/effects` and `resonare/lite/effects`: ready-made subscribers (`setDataAttributes`, `setClassNames`, `setColorScheme`, `setThemeColor`, `disableTransitions`) that work both with `store.subscribe` and as the inline script's `handler`, plus `combine` and `defineEffect` for writing your own. Pass the config type (e.g. `setThemeColor<typeof CONFIG>(…)`) to check setting names and values. Listeners now also receive the previous state as a second argument (`undefined` in the inline script).
