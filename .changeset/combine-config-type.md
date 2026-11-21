---
'resonare': minor
---

`combine<typeof CONFIG>(…)` from `resonare/effects` now checks the setting names and values of every effect inside it, so the config type no longer has to be repeated on each effect. `Effect` from `resonare/effects` now takes the config type (`Effect<typeof CONFIG>`) instead of the state type.
