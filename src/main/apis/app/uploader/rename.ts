import { randomUUID } from 'node:crypto'

import windowManager from 'apis/app/window/windowManager'
import { ipcMain, type IpcMainEvent } from 'electron'

import { GET_RENAME_FILE_NAME, RENAME_FILE_NAME } from '~/events/constant'
import { IWindowList } from '~/utils/enum'
import { UploadJob, UploadJobError } from '~/utils/uploadJob'

export function waitForRename(job: UploadJob, fileName: string, originalName: string): Promise<string | null> {
  job.throwIfStopped()
  const window = windowManager.create(IWindowList.RENAME_WINDOW)
  if (!window || window.isDestroyed() || window.webContents.isDestroyed()) {
    return Promise.reject(new UploadJobError('failed'))
  }
  const sender = window.webContents
  const jobId = job.context.id
  const dialogId = randomUUID()
  const channel = `${RENAME_FILE_NAME}:${jobId}:${dialogId}`

  return new Promise((resolve, reject) => {
    let settled = false
    const finish = (name: string | null, error?: unknown) => {
      if (settled) return
      settled = true
      ipcMain.removeListener(GET_RENAME_FILE_NAME, onReady)
      ipcMain.removeListener(channel, onRename)
      window.removeListener('closed', onClosed)
      sender.removeListener('destroyed', onClosed)
      job.signal.removeEventListener('abort', onAbort)
      try {
        if (!window.isDestroyed()) window.close()
      } catch {
        // The window may already be closing.
      }
      if (error) reject(error)
      else resolve(name)
    }
    const onReady = (event: IpcMainEvent) => {
      if (event.sender !== sender || sender.isDestroyed()) return
      try {
        sender.send(RENAME_FILE_NAME, { jobId, dialogId, fileName, originalName } satisfies IRenameRequest)
      } catch {
        finish(null, new UploadJobError('failed'))
      }
    }
    const onRename = (event: IpcMainEvent, response: IRenameResponse) => {
      // An invalid sender must not consume the listener or settle another dialog.
      if (event.sender !== sender || sender.isDestroyed()) return
      if (response?.jobId !== jobId || response.dialogId !== dialogId) return
      if (response.name !== null && (typeof response.name !== 'string' || !response.name.trim())) return
      finish(response.name)
    }
    const onClosed = () => finish(null)
    const onAbort = () => finish(null, job.signal.reason)
    ipcMain.on(GET_RENAME_FILE_NAME, onReady)
    ipcMain.on(channel, onRename)
    window.on('closed', onClosed)
    sender.on('destroyed', onClosed)
    job.signal.addEventListener('abort', onAbort, { once: true })
    if (job.signal.aborted) onAbort()
  })
}
