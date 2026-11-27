// `npm run dev`: rebuild dist/ on every change and serve it for WebTiles' developer mode, "Load from URL…".
// The host fetches the files in CORS mode, so the server sends Access-Control-Allow-Origin; it also sends
// Cross-Origin-Resource-Policy for hosts with COEP require-corp (ADR-0004 §2). From an https: page
// (webtiles.eu) the browser asks before it reaches localhost: Chrome and Firefox show a local-network prompt
// (Access-Control-Allow-Private-Network answers Chrome's preflight), and Safari refuses. Run WebTiles locally to
// avoid both. After a rebuild, press Reload in Settings → Plugins (live reload is webtiles#265).
import { build, preview } from 'vite'

const PORT = Number(process.env.PORT ?? 5174)

await build({ build: { watch: {} }, logLevel: 'warn' })
const server = await preview({
  preview: {
    port: PORT,
    strictPort: true,
    cors: true,
    headers: {
      'Cross-Origin-Resource-Policy': 'cross-origin',
      'Access-Control-Allow-Private-Network': 'true',
      'Cache-Control': 'no-store',
    },
  },
})
const url = server.resolvedUrls?.local[0] ?? `http://localhost:${PORT}/`
console.log(`\nServing dist/ at ${url}\nIn WebTiles: Settings → Plugins → Developer mode → Load from URL… → ${url}\n`)
