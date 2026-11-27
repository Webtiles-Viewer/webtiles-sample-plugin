import { definePlugin, type SlideSessionApi } from '@webtiles-viewer/plugin-api'

/** What this plugin stores per slide, under `ctx.storage.slide(slideKey)`. */
interface SlideNotes {
  opened: number
}

/**
 * The sample plugin: a zoom readout in the status bar, and a command (with a hotkey) that says how big the active
 * slide is and how often it was opened. Replace it with your own; keep the shape.
 *
 * Everything registered through `ctx` (and every `scope`) is undone when the plugin unloads, so a plugin can be
 * turned off and on again without a page reload. `onunload` is only for what you created outside `ctx`.
 */
export default definePlugin({
  onload(ctx) {
    // Per pane: count the openings of each slide. `slideKey` is stable across sessions, file names and devices.
    ctx.workspace.onSession(async (session) => {
      const store = ctx.storage.slide(session.info.slideKey)
      const notes = (await store.get<SlideNotes>('notes')) ?? { opened: 0 }
      await store.set('notes', { opened: notes.opened + 1 })
    })

    ctx.commands.register({
      id: 'describe-slide',
      name: 'Describe the active slide',
      hotkeys: ['Mod+Alt+I'],
      // A pane command gets the active session and is disabled while no slide is open.
      scope: 'pane',
      run: async (session) => {
        if (!session) return
        const notes = await ctx.storage.slide(session.info.slideKey).get<SlideNotes>('notes')
        ctx.ui.notify(describe(session, notes?.opened ?? 0))
      },
    })

    ctx.ui.addToSlot('app.statusBar', {
      id: 'zoom',
      title: 'Zoom',
      mount(el, { scope }) {
        el.classList.add('wt-sample-zoom')
        const show = () => {
          const zoom = ctx.workspace.activeSession?.viewport.getZoom()
          el.textContent = zoom === undefined ? '' : `${Math.round(zoom * 100)}%`
        }
        // A session scope ends when its pane closes; the slot's scope when the slot unmounts.
        ctx.workspace.onSession((session, sessionScope) => {
          sessionScope.register(session.viewport.onDidChange(show))
        })
        scope.register(ctx.workspace.onDidChangeActiveSession(show))
        show()
      },
    })
  },
})

/** Image sizes are level-0 pixels: level 0 is always full resolution. */
export function describe(session: SlideSessionApi, opened: number): string {
  const { width, height } = session.info
  const { name } = session.entry
  const size = `${width.toLocaleString('en')} × ${height.toLocaleString('en')} px`
  return `${name}: ${size}, opened ${opened} ${opened === 1 ? 'time' : 'times'}`
}
