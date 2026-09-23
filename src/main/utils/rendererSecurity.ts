import { app, BrowserWindow, type IpcMainEvent, type IpcMainInvokeEvent, type WebContents } from 'electron'

export function getRendererEntryUrl(): string {
  if (!app.isPackaged && process.env.ELECTRON_RENDERER_URL) {
    return process.env.ELECTRON_RENDERER_URL
  }
  // Main-process modules are bundled into out/main/index.js.
  return new URL('../renderer/index.html', import.meta.url).href
}

export function isTrustedRendererUrl(url: string): boolean {
  try {
    const candidate = new URL(url)
    const expected = new URL(getRendererEntryUrl())
    // Vue uses hash routing; only the exact application document is trusted.
    candidate.hash = ''
    expected.hash = ''
    return candidate.href === expected.href
  } catch {
    return false
  }
}

export function isTrustedRendererSender(event: IpcMainEvent | IpcMainInvokeEvent): boolean {
  const { sender, senderFrame } = event
  return (
    !sender.isDestroyed() &&
    !!BrowserWindow.fromWebContents(sender) &&
    senderFrame !== null &&
    senderFrame === sender.mainFrame &&
    isTrustedRendererUrl(senderFrame.url)
  )
}

export function protectRendererNavigation(contents: WebContents): void {
  contents.on('will-navigate', (event, url) => {
    if (!isTrustedRendererUrl(url)) event.preventDefault()
  })
  contents.on('will-redirect', (event, url) => {
    if (!isTrustedRendererUrl(url)) event.preventDefault()
  })
  contents.on('will-frame-navigate', event => {
    if (!event.isMainFrame || !isTrustedRendererUrl(event.url)) event.preventDefault()
  })
  contents.setWindowOpenHandler(() => ({ action: 'deny' }))
}
