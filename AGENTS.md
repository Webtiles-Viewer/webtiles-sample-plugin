# AGENTS.md

Guidance for coding agents (and people) working in a WebTiles plugin repository. This file comes from the template
[`webtiles-sample-plugin`](https://github.com/Webtiles-Viewer/webtiles-sample-plugin); keep it when you start a plugin
from it, and add your plugin's own notes at the end.

## What WebTiles is

[WebTiles](https://github.com/Webtiles-Viewer/webtiles) is a browser-based viewer for whole-slide images (WSI), the
gigapixel slides of digital pathology (SVS, NDPI, MIRAX, DICOM, …). It runs **entirely client-side**: slides are
decoded in the browser, only the tiles in view, and **nothing is uploaded to a server**. There is no backend, and a
plugin must not add one. It runs at <https://webtiles.eu>.

Features ship as **plugins** on a public API, modelled on Obsidian's plugin system. Even the slide formats are a
plugin (OpenSlide compiled to WebAssembly), and so are annotations. A plugin is one ES module the host imports at
runtime; the API reaches it as a `ctx` object.

## What exists today

The ecosystem is being built. Work with what exists; don't build stand-ins for what is coming.

| Piece | State | Until then |
|---|---|---|
| `@webtiles-viewer/plugin-api` (types, tiny runtime, `/testing` mock, manifest schema) | `0.1.0-alpha.2` on GitHub Packages (private) | a classic `read:packages` token, see README; public npm is webtiles#261 |
| Developer mode: load `dist/` from a folder or a URL | in WebTiles and on webtiles.eu | — |
| Live reload, `?dev=` links | webtiles#265 | press Reload in Settings → Plugins |
| `@webtiles-viewer/eslint-plugin` | webtiles#262 | `eslint.config.js` has the import rule by hand |
| `@webtiles-viewer/test-host` (browser tests of a plugin in a real host) | webtiles#266 | unit tests against `/testing`, plus a manual check in developer mode |
| Release workflow (tag → attested draft GitHub release) | `.github/workflows/release.yml`, untested until the first tag | check the first run and the draft by hand |
| Automated admission to webtiles.eu, `?plugins=` links | official plugins first (webtiles#251–#256, ADR-0003/0004) | developer mode |
| Community catalog (browse and install inside WebTiles) | v0.2.2, opens at `plugin-api` 1.0 | share the built `dist/` and load it in developer mode |

Expect alpha API changes. They are listed in the package's `CHANGELOG.md`.

## Where this is going: how a plugin reaches users

WebTiles' plugin path (ADR-0004) is Obsidian's, with draw.io's loading on top. Build for the end state now; the
template already has the shape each step needs.

1. **Today: developer mode.** You, or a colleague with your built `dist/`, load the plugin in Settings → Plugins. It
   shows a DEV badge and stays in that browser.
2. **Next, tooling:** the API on public npm (webtiles#261: then `.npmrc`'s registry line and the token go), the
   official ESLint rules (#262), `?dev=` links with live reload (#265), and the test host for browser tests (#266).
   Each replaces a stopgap marked in this repo.
3. **Then, admission to webtiles.eu.** A plugin is submitted once (a reviewed entry in the host's
   `plugins/registry.json`, with its approved permissions). After that, **every tag is a release with no person in
   the loop**: a scheduled job finds the new GitHub release, verifies its attestation (built by this repo's
   `release.yml` at that tag), checks the manifest, the bundle contract, the size and the permissions, runs the
   lifecycle checks in a real host, and publishes it on webtiles.eu. A person looks only at a new plugin, a version that
   asks for more permissions or network origins, a yank, or a flagged scan. Target: tag to live in 30 minutes or less.
4. **Users then load it draw.io style:** `https://webtiles.eu/?plugins=<id>` turns it on for one visit, "Keep on"
   keeps it, and `?plugins=<id>@<version>` tries a specific version. A user can pin a version; otherwise they get
   `current`. A prerelease (`0.2.0-beta.1`) is admitted but never becomes `current`: testers reach it through the
   link or a pin. `?safe` starts WebTiles without plugins.
5. **Finally, the community catalog** (v0.2.2): browse, install, update and uninstall inside WebTiles. It opens to
   third-party plugins when `plugin-api` reaches 1.0.

What that asks of a plugin, and what this template already does:

- **Releases are tags of the version**, made with `npm version`, built and attested by `release.yml`. Never upload
  release files by hand: admission refuses what the workflow didn't build.
- **Install and uninstall happen without a reload,** so the lifecycle contract below is checked on every release.
- **Permissions are declared exactly.** They are a disclosure today, become enforced (ADR-0004 §5), and a new one
  needs review. Ask for what the code uses, no more.
- **The manifest `id` never changes,** and per-slide data is keyed by `slideKey`, so updates and uninstall's data
  cleanup find it.

### Planned API changes to expect

These are decided (ADR-0004) but not shipped. Don't build around them, and adopt them when they land:

- **`networkOrigins`:** the `network` permission becomes a list of origins in the manifest, and webtiles.eu's
  Content-Security-Policy allows only admitted origins.
- **`ctx.storage.saveSoon(key, value)`:** a debounced save that the host flushes at unload. Until then, don't hand-roll
  a debounce that can lose the last edit: write directly, or flush pending writes in `onunload`.
- **`onSession` replay after `onload`:** the host will replay already-open sessions only after `onload` resolves. Until
  then, register what a session handler needs before calling `ctx.workspace.onSession`.

## Layout

```
manifest.json          the plugin's manifest (ADR-0001 §9): id, name, version, apiVersion, minAppVersion, permissions…
versions.json          plugin version → { apiVersion, minAppVersion }, one entry per release (written by `npm version`)
styles.css             optional CSS; every class prefixed `wt-<id>-`; colours from the host's `--wt-*` tokens
src/main.ts            the entry: `export default definePlugin({ onload(ctx), onunload? })`
test/*.test.ts         Vitest unit tests against @webtiles-viewer/plugin-api/testing
scripts/check-bundle.mjs   the bundle contract on dist/ (CI runs it)
scripts/dev.mjs        `npm run dev`: watch build + a CORS server for developer mode's "Load from URL…"
scripts/version-bump.mjs   `npm version`'s hook: copies the version into manifest.json and versions.json
vite.config.ts         library build to dist/main.js, and copies manifest.json (without `$schema`) and styles.css
.github/workflows/ci.yml   lint, typecheck, test, build, bundle contract
.github/workflows/release.yml   on a version tag: check, build, attest, draft a GitHub release with dist/'s files
.npmrc                 maps @webtiles-viewer to GitHub Packages (no token here, ever); bare-version tags
```

`dist/` is the plugin as WebTiles loads it: `manifest.json`, `main.js`, `styles.css` and any declared `assets`. It
is built, never committed.

## Commands

Node 26 (`.nvmrc`). `npm install`, then:

- `npm run check`: lint, typecheck, tests, build and bundle contract. **Run it before every commit**; CI runs the
  same steps.
- `npm run dev`: watch build plus a server for "Load from URL…" (port 5174).
- `npm version <x.y.z>`: release bump of `package.json`, `manifest.json` and `versions.json`, committed and tagged
  `x.y.z` (no `v`). Pushing the tag (`git push --follow-tags`) runs `release.yml`, which drafts the release; review it
  and publish.

## The bundle contract (ADR-0001 §8)

The host imports `main.js` from a `blob:` URL, and nothing else resolves against it. So:

- **One ES module with a default export**, `export default definePlugin({ … })`. No code splitting.
- **No imports in the output**: no bare (`import x from 'lib'`), relative or remote imports, and no dynamic
  `import()`. Bundle every dependency into `main.js`. The host pre-scans the code and refuses one that imports.
- **No `import.meta`** (`import.meta.url` is `blob:`). Load extra files you declare in the manifest's `assets` with
  `ctx.assets.getUrl(path)`.
- `@webtiles-viewer/plugin-api` is the one package you import in `src/`. Its types vanish at build time, and
  `definePlugin` and the error classes are tiny and get inlined. Never import WebTiles' host code, and never import
  `/testing` outside tests (ESLint enforces both).
- Source maps are inline (`vite.config.ts`): DevTools names the code `webtiles-plugin://<id>/main.js`.

`npm run check:bundle` enforces all of this on `dist/`, plus the files and the version agreement below.

## Writing plugin code

The API is typed and documented in `node_modules/@webtiles-viewer/plugin-api/dist/index.d.ts`; its README covers
pixels, workers, errors and the mock. Read those before guessing. The rules that matter most:

- **Everything goes through `ctx`**, and everything you register through it is undone when the plugin unloads. A
  user can turn a plugin off and on without a reload, so it must leave nothing behind: register disposers on a
  scope (`scope.register(…)`), and use `onunload` only for what you created outside `ctx`.
- **Per pane, use `ctx.workspace.onSession((session, scope) => …)`.** The scope ends when the pane closes (before the
  viewer is destroyed); hang per-pane listeners, layers and workers on it.
- **Coordinates are level-0 pixels, top-left origin**, in every API. Level 0 is full resolution (ADR-0001 §15).
  `info.levels` (the slide's own pyramid, `readRegion`) and `tiles.levels` (the viewer's power-of-two tiles,
  `getTile`) are different index spaces.
- **Per-slide data is keyed by `session.info.slideKey`** (`ctx.storage.slide(key)`), which is stable across file
  names, sessions and machines. Never key data by the pane id or the file name. Plugin-wide data:
  `ctx.storage.loadData()` / `saveData()`.
- **UI is plain DOM.** The host hands you `HTMLElement`s (`ctx.ui.addToSlot`, `addButton`, modals, settings rows)
  and you return disposers. No host React. Use the UI kit in `ctx.ui` (notices, menus, quick pick, confirm, setting
  rows) so your plugin looks like the host.
- **CSS:** every class starts with `wt-<id>-`, and colours come from the host's `--wt-*` theme tokens (e.g.
  `var(--wt-color-text-muted)`), so light and dark mode work. No raw colours.
- **Heavy work runs in a worker** (`ctx.workers`, and `session.slide.createPixelPort()` for pixels), with
  transferable buffers, never on the main thread.
- **Match API errors by `err.code`**, not `instanceof`: your bundle has its own copy of the classes.
- **Ids:** commands, tools and slots take a local id; the global id is `<plugin id>:<local id>`.
- **Permissions** in `manifest.json` (`slide-pixels`, `network`, `storage`, `clipboard`, `filesystem`) are what the
  plugin uses, shown to the user. They are a disclosure today and enforced later (ADR-0004), so declare exactly what
  the code uses. `network` is for fetches to other origins; webtiles.eu is cross-origin isolated, so such a server
  must send CORS headers.

## Tests

- **Unit tests** in `test/`, with Vitest and `@webtiles-viewer/plugin-api/testing`: `createMockPluginContext()`
  gives a `ctx`, `fireSessionOpen()` opens a pane, `fireViewportChange()` and `fireBeforeDestroy()` drive it, and
  `ctx.mock` records what the plugin did (`notifications`, `commands`, `slots`, `errors`, storage…). End each test
  with `ctx.dispose()` and `expect(ctx.mock.errors).toEqual([])`. A test that mounts UI starts with
  `// @vitest-environment happy-dom`.
- **The lifecycle contract** (ADR-0004 §6), which admission will check in a real host with `expectLifecycleContract`
  (webtiles#266). Keep the two tests in `test/main.test.ts` that cover it, and extend them as the plugin grows:
  - **turned on with a slide already open:** the plugin catches up on panes that are open already;
  - **turned off:** nothing is left behind (no command, slot, listener, layer or worker), and no error;
  - and once you store data: an edit made just before turning the plugin off is not lost.
- Every feature gets a test in the same change. The mock is slide-free, so all of it runs on CI.
- **In a real host:** until the test host (webtiles#266) exists, check a change by hand in developer mode (README →
  "Run it in WebTiles"), and say so in the PR.

## Versions and releases

- `manifest.json` `version`, `package.json` `version` and the newest `versions.json` entry are the same version.
  `npm version` keeps them in step, and `check:bundle` fails when they drift.
- `apiVersion` is a semver range of `@webtiles-viewer/plugin-api` (`^0.1.0` today); the host loads the plugin only when
  its API satisfies it. `minAppVersion` is the oldest WebTiles the plugin works in. Change them in `manifest.json`
  **before** `npm version`, which copies them into `versions.json`.
- The manifest `id` keys the plugin's stored data: never change it after a first release.

## Renaming the template

When you start a plugin from this template:

1. `manifest.json`: `id` (lowercase kebab-case, 3–64 characters, must not contain `webtiles`, which is reserved for
   official plugins), `name`, `description`, `author`, `authorUrl`, `repository` (`owner/name`), `permissions`.
2. `package.json`: `name` (e.g. `webtiles-<id>`), `description`; keep `"private": true` unless you publish it.
3. `styles.css` and `src/`: the `wt-sample-` prefix becomes `wt-<id>-`.
4. Replace `src/main.ts` and `test/main.test.ts` with your plugin, and this file's and the README's sample-specific
   lines with yours.
5. `npm run check`.

## Conventions

- One change per branch and pull request; keep `main` green (`npm run check`).
- Never commit a token, `.env` or `dist/`. The token for GitHub Packages lives in `~/.npmrc` on your machine and in
  the repository secret `WEBTILES_PACKAGES_TOKEN` for CI.
- Keep this template minimal, commented and correct: everything in it is copied into every new plugin.

## Design documents

The binding design lives in the WebTiles host repository (`Webtiles-Viewer/webtiles`, private for now; a maintainer
can share it): ADR-0001 (plugin architecture), ADR-0002 (every slide format is a plugin), ADR-0004 (the third-party
plugin path: public npm, test host, admission, permissions). Cite them as "ADR-0001 §N". Where this file and an ADR
differ, the ADR wins.
