# resonare

## 0.4.1

### Patch Changes

- [#5](https://github.com/phuoccss/resonare/pull/5) [`7ecffa9`](https://github.com/phuoccss/resonare/commit/7ecffa954d07b7136e102a49d343f14023f7801d) Thanks [@phuoccss](https://github.com/phuoccss)! - Ship `llms.txt`, a short reference for coding agents, in the package.

## 0.4.0

### Minor Changes

- [#1](https://github.com/phuoccss/resonare/pull/1) [`d346683`](https://github.com/phuoccss/resonare/commit/d34668387267408b1293b7d70e7376863ec57d19) Thanks [@phuoccss](https://github.com/phuoccss)! - Add `resonare/effects` and `resonare/lite/effects`: ready-made subscribers (`setDataAttributes`, `setClassNames`, `setColorScheme`, `setThemeColor`, `disableTransitions`) that work both with `store.subscribe` and as the inline script's `handler`, plus `combine` and `defineEffect` for writing your own. Pass the config type (e.g. `setThemeColor<typeof CONFIG>(…)`) to check setting names and values. Listeners now also receive the previous state as a second argument (`undefined` in the inline script).
