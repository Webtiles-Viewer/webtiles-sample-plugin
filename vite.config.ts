import { readFileSync } from 'node:fs'
import { defineConfig, type Plugin } from 'vite'

// dist/ is the plugin as WebTiles loads it: manifest.json, main.js and styles.css side by side. Point developer mode
// at this folder (Load plugin folder…) or at `npm run dev`'s URL (Load from URL…).
const pluginFiles = (): Plugin => ({
  name: 'webtiles-plugin-files',
  generateBundle() {
    // `$schema` is for editors only; it is not a manifest field, and the host rejects unknown fields.
    const { $schema: _schema, ...manifest } = JSON.parse(readFileSync('manifest.json', 'utf8'))
    this.emitFile({ type: 'asset', fileName: 'manifest.json', source: `${JSON.stringify(manifest, null, 2)}\n` })
    this.emitFile({ type: 'asset', fileName: 'styles.css', source: readFileSync('styles.css', 'utf8') })
  },
})

// One ES module with no bare or remote imports (ADR-0001 §8): the plugin API arrives as `ctx`, and `definePlugin` is
// inlined. `scripts/check-bundle.mjs` enforces the result.
export default defineConfig({
  plugins: [pluginFiles()],
  build: {
    target: 'es2022',
    outDir: 'dist',
    emptyOutDir: true,
    minify: false,
    // Inline, because the host imports main.js from a blob: URL that a relative source-map URL can't resolve against.
    sourcemap: 'inline',
    lib: {
      entry: 'src/main.ts',
      formats: ['es'],
      fileName: () => 'main.js',
    },
  },
})
