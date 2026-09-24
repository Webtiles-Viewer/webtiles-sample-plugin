# AGENTS.md

Guidance for AI agents working on this repository.

## What this repo is

`webtiles-sample-plugin` is the **template repository** for [WebTiles](https://github.com/micheldore/webtiles) plugins,
the equivalent of [`obsidian-sample-plugin`](https://github.com/obsidianmd/obsidian-sample-plugin). It is the starting
point for every plugin: new plugin repos are created from it with "Use this template". It is loaded in the host through
**developer mode** and is **not published to npm**.

Work is tracked on the host board, not here: [micheldore/webtiles#117](https://github.com/micheldore/webtiles/issues/117).

## Design source of truth (read first)

The plugin API is designed in the host repo, `micheldore/webtiles`. These documents are binding:

- [ADR-0001: plugin architecture](https://github.com/micheldore/webtiles/blob/main/docs/adr/0001-plugin-architecture.md).
  Cite it as "ADR-0001 §N". If the ADR and anything here disagree, the ADR wins.
- [`docs/plugins/api-design.md`](https://github.com/micheldore/webtiles/blob/main/docs/plugins/api-design.md): the
  public API sketch (MUST/SHOULD/LATER tiers, owning issues).
- [`docs/plugins/paper-plugin-check.md`](https://github.com/micheldore/webtiles/blob/main/docs/plugins/paper-plugin-check.md):
  a full plugin written against the sketch, and the gaps it found.

Consume the API **only** from the published `@webtiles/plugin-api` package. Never import host internals.

## Bundle contract (ADR-0001 §8, summary)

- `main.js` is a **single ES module**: `export default definePlugin({ onload(ctx), onunload?, api? })`.
- **No bare or remote imports.** The API arrives as `ctx`; bundle everything else. The type-only import of
  `@webtiles/plugin-api` is fine.
- `manifest.json` (ADR-0001 §9) with a required `apiVersion` semver range; optional `styles.css` with every class
  prefixed `wt-<id>-`; declared `assets` via `ctx.assets.getUrl(name)`; `versions.json` at the repo root.
- Coordinates are **level-0 pixels, top-left origin**; level 0 is full resolution (ADR-0001 §15).

Because this is a template, everything here is copied into new plugins. Keep it minimal, commented and correct.

## Conventions (copied from the host repo)

- **Don't add an AI/agent co-author or attribution trailer to commits.** No `Co-Authored-By: Claude …` (or any
  tool/agent) line and no "Generated with" footer. Commits are authored under the human committer only.
- **One issue → one branch → one PR.** Branch name is `<issue-number>-<kebab-case-title>`. Never push feature work
  straight to `main`.
- Only touch **this** repository with `gh`/`git`. Pass `-R Webtiles-Viewer/webtiles-sample-plugin` explicitly on every
  `gh` command, and confirm `git remote get-url origin` before pushing.

## Repo visibility

This repo is **private** for now. While it is private, only the maintainer can use it as a template, and the host's CI
cannot check it out without an extra credential. It has to be public before community plugin authors (v0.2.2) can use
it.
