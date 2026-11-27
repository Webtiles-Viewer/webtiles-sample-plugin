// @vitest-environment happy-dom
import { describe, expect, it } from 'vitest'
import type { SlideKey } from '@webtiles-viewer/plugin-api'
import { createMockPluginContext, fireBeforeDestroy, fireSessionOpen, fireViewportChange } from '@webtiles-viewer/plugin-api/testing'
import manifest from '../manifest.json'
import plugin from '../src/main'

// The /testing mock plays the host: it gives the plugin a `ctx`, opens panes, and records what the plugin did.
describe('the sample plugin', () => {
  it('counts openings per slide and describes the active slide', async () => {
    const ctx = createMockPluginContext({ manifest: { id: manifest.id } })
    await plugin.onload(ctx)

    const first = await fireSessionOpen(ctx, { info: { slideKey: 'mock:a', width: 50000, height: 40000 }, entry: { name: 'a.svs' } })
    fireBeforeDestroy(first)
    const session = await fireSessionOpen(ctx, { info: { slideKey: 'mock:a', width: 50000, height: 40000 }, entry: { name: 'a.svs' } })
    expect(await ctx.storage.slide('mock:a' as SlideKey).get('notes')).toEqual({ opened: 2 })

    await ctx.commands.execute(`${manifest.id}:describe-slide`)
    expect(ctx.mock.notifications.map((n) => n.message)).toEqual(['a.svs: 50,000 × 40,000 px, opened 2 times'])

    fireBeforeDestroy(session)
    ctx.dispose()
    expect(ctx.mock.errors).toEqual([])
  })

  it('shows the active pane’s zoom in the status bar, and clears it when the pane closes', async () => {
    const ctx = createMockPluginContext({ manifest: { id: manifest.id } })
    await plugin.onload(ctx)
    const statusBar = document.createElement('div')
    ctx.mock.mountSlot('app.statusBar', statusBar)
    expect(statusBar.textContent).toBe('')

    const session = await fireSessionOpen(ctx)
    fireViewportChange(session, { zoom: 0.25 })
    expect(statusBar.textContent).toBe('25%')

    fireBeforeDestroy(session)
    expect(statusBar.textContent).toBe('')
    ctx.dispose()
    expect(ctx.mock.errors).toEqual([])
  })

  it('declares a hotkey for its command', async () => {
    const ctx = createMockPluginContext({ manifest: { id: manifest.id } })
    await plugin.onload(ctx)
    expect(ctx.mock.commands.map((c) => [c.definition.id, c.definition.hotkeys])).toEqual([['describe-slide', ['Mod+Alt+I']]])
    ctx.dispose()
  })

  // The lifecycle contract (ADR-0004 §6): a user can turn a plugin on while slides are open and off at any time,
  // without a page reload. WebTiles' automated admission will check both in a real host (`expectLifecycleContract`,
  // webtiles#266); these tests check the same against the mock.
  it('works when turned on with a slide already open', async () => {
    const ctx = createMockPluginContext({ manifest: { id: manifest.id } })
    const session = await fireSessionOpen(ctx, { info: { slideKey: 'mock:a' } })
    fireViewportChange(session, { zoom: 0.5 })

    await plugin.onload(ctx)
    const statusBar = document.createElement('div')
    ctx.mock.mountSlot('app.statusBar', statusBar)
    expect(statusBar.textContent).toBe('50%')
    fireViewportChange(session, { zoom: 2 })
    expect(statusBar.textContent).toBe('200%')
    expect(await ctx.storage.slide('mock:a' as SlideKey).get('notes')).toEqual({ opened: 1 })

    ctx.dispose()
    expect(ctx.mock.errors).toEqual([])
  })

  it('leaves nothing behind when turned off', async () => {
    const ctx = createMockPluginContext({ manifest: { id: manifest.id } })
    await plugin.onload(ctx)
    const statusBar = document.createElement('div')
    ctx.mock.mountSlot('app.statusBar', statusBar)
    const session = await fireSessionOpen(ctx)
    fireViewportChange(session, { zoom: 0.25 })

    ctx.dispose()
    expect(ctx.mock.commands.every((c) => c.disposed)).toBe(true)
    expect(ctx.mock.slots.every((s) => s.disposed)).toBe(true)
    // No listener survives: a viewport change after unload changes nothing.
    fireViewportChange(session, { zoom: 1 })
    expect(statusBar.textContent).not.toBe('100%')
    expect(ctx.mock.errors).toEqual([])
  })
})
