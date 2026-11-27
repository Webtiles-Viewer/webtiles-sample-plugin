# webtiles-sample-plugin

The template for [WebTiles](https://github.com/Webtiles-Viewer/webtiles) plugins, WebTiles' counterpart of Obsidian's
[`obsidian-sample-plugin`](https://github.com/obsidianmd/obsidian-sample-plugin). WebTiles is a browser-based viewer
for whole-slide images, the gigapixel slides of digital pathology. A plugin adds features to it through a public API.

The sample plugin shows the zoom of the active pane in the status bar and adds a command, "Describe the active
slide" (`Mod+Alt+I`), that names the slide's size and how often it was opened. It is small on purpose: replace it
with your own.

> **Status:** an early template. The plugin API is `0.1.0-alpha`, and some of the tooling a plugin will get is still
> being built (see [AGENTS.md → "What exists today"](AGENTS.md#what-exists-today)). The layout and commands here are
> the ones that tooling will use.

## Start a plugin

1. **Use this template** → create your repository (e.g. `webtiles-<your-plugin>`).
2. **Get read access to the API package.** Until it moves to public npm, `@webtiles-viewer/plugin-api` is on GitHub
   Packages and private:
   - ask a WebTiles maintainer for read access to the `Webtiles-Viewer` organisation's packages;
   - create a **classic** personal access token with only the `read:packages` scope (GitHub Packages refuses
     fine-grained tokens for npm);
   - add it to `~/.npmrc` on your machine, never to the project:

     ```ini
     //npm.pkg.github.com/:_authToken=<your token>
     ```

   The project's `.npmrc` already sends the `@webtiles-viewer` scope to GitHub Packages. For CI in your repository,
   add the same kind of token as the repository secret `WEBTILES_PACKAGES_TOKEN`.
3. **Install and check**, with Node 26 (`.nvmrc`):

   ```bash
   npm install
   npm run check   # lint, typecheck, tests, build, bundle contract
   ```

4. **Make it yours:** see [AGENTS.md → "Renaming the template"](AGENTS.md#renaming-the-template).

## Run it in WebTiles

`npm run build` writes the plugin to `dist/` (`manifest.json`, `main.js`, `styles.css`). Load it in WebTiles with
developer mode:

1. Open WebTiles, then Settings (`Mod+,`) → Plugins, and turn on **Developer mode** (read the consent dialog).
2. Either **Load plugin folder…** and pick `dist/` (Chromium; in Firefox and Safari pick the three files), or run
   `npm run dev` and use **Load from URL…** with `http://localhost:5174/`.
3. After a change, press **Reload** in the same section. The plugin is stored in the browser, so a page reload keeps
   it.

`npm run dev` rebuilds `dist/` on every change and serves it with CORS. Against a WebTiles running on your own machine
it works in every browser. From `https://webtiles.eu`, Chrome and Firefox ask before the page may reach `localhost`,
and Safari refuses; "Load plugin folder…" works everywhere.

## Commands

| Command | What it does |
|---|---|
| `npm run dev` | rebuild on change and serve `dist/` on port 5174 (`PORT=…` to change) for "Load from URL…" |
| `npm run build` | build `dist/` |
| `npm test` | unit tests with Vitest, against the API's `/testing` mock (no browser, no slide) |
| `npm run lint` / `npm run typecheck` | ESLint / `tsc` |
| `npm run check:bundle` | the bundle contract: one ES module with no imports, the files in `dist/`, matching versions |
| `npm run check` | all of the above, as CI runs it |
| `npm version <x.y.z>` | bump `package.json`, `manifest.json` and `versions.json`, commit, and tag `x.y.z` |
| `git push --follow-tags` | after `npm version`: the tag runs `release.yml`, which drafts an attested GitHub release |

## Docs

- [AGENTS.md](AGENTS.md): how this repo is built and the rules a plugin follows. Written for coding agents, and just
  as useful to read yourself.
- The `@webtiles-viewer/plugin-api` README (`node_modules/@webtiles-viewer/plugin-api/README.md` after an install):
  the API, its errors and the `/testing` mock. Every API member has TSDoc, so your editor shows it.

## License

[MIT](LICENSE)
