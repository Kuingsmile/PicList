import { EventEmitter } from 'node:events'

import type { IpcMainInvokeEvent, WebContents } from 'electron'
import { afterEach, beforeEach, describe, expect, it, vi } from 'vitest'

import {
  getRendererEntryUrl,
  isTrustedRendererSender,
  isTrustedRendererUrl,
  protectRendererNavigation,
} from '../src/main/utils/rendererSecurity'

const state = vi.hoisted(() => ({
  app: { isPackaged: true },
  fromWebContents: vi.fn(),
}))

vi.mock('electron', () => ({
  app: state.app,
  BrowserWindow: { fromWebContents: state.fromWebContents },
}))

beforeEach(() => {
  state.app.isPackaged = true
  state.fromWebContents.mockReturnValue({})
})

afterEach(() => {
  vi.unstubAllEnvs()
})

describe('privileged renderer boundary', () => {
  it('trusts only the packaged app document and its hash routes', () => {
    const entry = getRendererEntryUrl()

    expect(isTrustedRendererUrl(entry)).toBe(true)
    expect(isTrustedRendererUrl(`${entry}#main-page/manage`)).toBe(true)
    expect(isTrustedRendererUrl(`${entry}?untrusted=1`)).toBe(false)
    expect(isTrustedRendererUrl(new URL('./remote.html', entry).href)).toBe(false)
    expect(isTrustedRendererUrl('https://example.com/index.html')).toBe(false)
    expect(isTrustedRendererUrl('data:text/html,<h1>remote</h1>')).toBe(false)
    expect(isTrustedRendererUrl('about:blank')).toBe(false)
    expect(isTrustedRendererUrl('invalid')).toBe(false)
  })

  it('trusts only the configured document in development and ignores it in packaged builds', () => {
    vi.stubEnv('ELECTRON_RENDERER_URL', 'http://127.0.0.1:30303')
    state.app.isPackaged = false

    expect(isTrustedRendererUrl('http://127.0.0.1:30303/#main-page/upload')).toBe(true)
    expect(isTrustedRendererUrl('http://127.0.0.1:30303/other.html')).toBe(false)
    expect(isTrustedRendererUrl('http://127.0.0.1:30304/')).toBe(false)
    expect(isTrustedRendererUrl('http://127.0.0.1:30303.evil.example/')).toBe(false)
    expect(isTrustedRendererUrl('http://user@127.0.0.1:30303/')).toBe(false)

    state.app.isPackaged = true
    expect(isTrustedRendererUrl('http://127.0.0.1:30303/')).toBe(false)
  })

  it('rejects RPC from remote documents, subframes, detached frames and non-window senders', () => {
    const mainFrame = { url: `${getRendererEntryUrl()}#main-page/upload` }
    const sender = { mainFrame, isDestroyed: () => false }
    const event = { sender, senderFrame: mainFrame } as unknown as IpcMainInvokeEvent

    expect(isTrustedRendererSender(event)).toBe(true)
    mainFrame.url = 'https://example.com/'
    expect(isTrustedRendererSender(event)).toBe(false)
    mainFrame.url = getRendererEntryUrl()
    expect(isTrustedRendererSender({ ...event, senderFrame: { ...mainFrame } } as IpcMainInvokeEvent)).toBe(false)
    expect(isTrustedRendererSender({ ...event, senderFrame: null })).toBe(false)
    state.fromWebContents.mockReturnValue(null)
    expect(isTrustedRendererSender(event)).toBe(false)
    state.fromWebContents.mockReturnValue({})
    sender.isDestroyed = () => true
    expect(isTrustedRendererSender(event)).toBe(false)
  })

  it('blocks remote navigations, redirects, subframes and new windows', () => {
    const contents = Object.assign(new EventEmitter(), { setWindowOpenHandler: vi.fn() })
    protectRendererNavigation(contents as unknown as WebContents)
    const event = { preventDefault: vi.fn() }

    for (const name of ['will-navigate', 'will-redirect']) {
      event.preventDefault.mockClear()
      contents.emit(name, event, `${getRendererEntryUrl()}#update-page`)
      expect(event.preventDefault).not.toHaveBeenCalled()
      contents.emit(name, event, 'https://example.com')
      expect(event.preventDefault).toHaveBeenCalledOnce()
    }

    event.preventDefault.mockClear()
    contents.emit('will-frame-navigate', { ...event, isMainFrame: false, url: getRendererEntryUrl() })
    expect(event.preventDefault).toHaveBeenCalledOnce()
    expect(contents.setWindowOpenHandler.mock.calls[0][0]({ url: 'https://example.com' })).toEqual({ action: 'deny' })
  })
})
