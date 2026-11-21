# AGENTS.md

Guidance for coding agents working on this repo. For how to _use_ the library, read `resonare/llms.txt` (shipped in the npm package and served at `/llms.txt` on the demo site) and `resonare/README.md`.

## Layout

- `resonare/`: the published package.
  - `src/index.ts`: full store, `createInlineThemeScript`, types
  - `src/lite.ts`: light / dark / system store
  - `src/effects-core.ts`: shared effect machinery and `run*` functions
  - `src/effects.ts`, `src/lite-effects.ts`: thin entries over the core
  - `src/{react,solid,svelte,vue}.ts` and `src/lite-*.ts`: framework bindings
  - `src/storage.ts`, `src/utils.ts`: storage adapters, constants and script helpers
- `demo/`: Astro site that uses every binding; deployed by the publish workflow.
- `README.md` at the root is a symlink to `resonare/README.md`.

## Commands

pnpm is pinned in `devEngines`; use it, not npm. Vite+ (`vp`) does formatting, lint, type check, build and tests.

```sh
pnpm i
pnpm --filter resonare build   # tests import ../dist, so build before testing
pnpm --filter resonare test
pnpm exec vp check             # format + lint + type check, repo-wide (what CI runs)
pnpm format                    # write formatting
pnpm --filter resonare size    # size-limit for dist/index.js and dist/lite.js
pnpm turbo build               # package + demo
```

A pre-commit hook (`.vite-hooks/pre-commit`, installed by `prepare`) runs `vp check --fix` on staged files. CI (`.github/workflows/ci.yml`) runs build, `vp check` and tests on pull requests and before every publish.

## Rules

- **Inline-script code must be self-contained.** `restoreScript`, every `run*`/select function in `effects-core.ts`, and handlers are turned into source with `toScriptFunction`. They can't reference imports, module constants or outer variables; pass data through JSON options. Minification must keep them working, so test through the built `dist` and run generated scripts with `new Function(script)()` in tests.
- **Watch bundle size.** `dist/index.js` (1.4 KB) and `dist/lite.js` (0.8 KB) have size limits. Types are free; runtime code in the core isn't. Prefer type-level features and keep effects out of the core entries.
- **Effects:** implement once in `effects-core.ts`, then add a thin factory to both `effects.ts` (with the opt-in config generic) and `lite-effects.ts`. Name them verb + noun (`setThemeColor`, `disableTransitions`). Keep the public API typed and the runtime loose, using the cast pattern already there.
- **Style** (enforced by `vp check`):
  - Arrow functions with block bodies.
  - Blank lines between statements.
  - `Array<T>`, not `T[]`.
  - `import type` for type-only imports.
  - No `any`, except deliberately loose public types, which carry an `oxlint-disable-next-line` comment with the reason.
  - No comments in GitHub workflow files.
- **Docs:** when the public API changes, update `resonare/README.md` and `resonare/llms.txt` together. `tests/llms.test.ts` fails when an entry point or export is missing from `llms.txt`, or when its code examples differ from `demo/src/llms-examples/*`. Those files are the type-checked copies, so edit both.

## Commits and releases

- Conventional commits (`feat:`, `fix:`, `chore:`, `ci:`, …).
- Add a changeset (`pnpm changeset`) for every user-facing change; `minor` for features, `patch` for fixes.
- Releases go out from `main` through `.github/workflows/publish.yml` (changesets). Either:
  - push a changeset and merge the bot's "chore(release): version packages" PR, or
  - run `GITHUB_TOKEN=$(gh auth token) pnpm changeset:version` locally, commit, and push to `main` to publish in one go.
- Pushes to `main` publish, so work on a branch and open a PR unless asked otherwise.
