import { randomUUID } from 'node:crypto'
import path from 'node:path'

import { GalleryDB } from '@core/datastore'
import { dataDir } from '@core/datastore/dirs'
import picgo from '@core/picgo'
import windowManager from 'apis/app/window/windowManager'
import { Notification, type WebContents } from 'electron'
import fs from 'fs-extra'
import { cloneDeep, get } from 'lodash-es'
import type { IPicGo } from 'piclist'
import writeFile from 'write-file-atomic'

import { t } from '~/i18n'
import { handleCopyUrl, handleUrlEncodeWithSetting } from '~/utils/common'
import { IPasteStyle, IWindowList } from '~/utils/enum'
import pasteTemplate from '~/utils/pasteTemplate'
import { runScriptInStage } from '~/utils/runScript'
import { sendToWindow } from '~/utils/uploadJob'
import { getUploadedSourcePath, isUploadUrl } from '~/utils/uploadResult'

export interface UploadFinalizationPreferences {
  copy: boolean
  notification: 'none' | 'individual' | 'batch'
  clearClipboard?: boolean
}

export const interactiveUploadPreferences: UploadFinalizationPreferences = { copy: true, notification: 'batch' }
export const backgroundUploadPreferences: UploadFinalizationPreferences = { copy: false, notification: 'none' }

interface FinalizationItem {
  role: 'ctx' | 'backupCtx'
  image: ImgInfo
  sourcePath?: string
  pasteText?: string
  prepared?: boolean
  inserted?: boolean
  hooksCompleted?: boolean
  completedScripts: string[]
}

// Only data belongs in the journal: never persist an IPicGo instance, buffers, or WebContents.
export interface UploadFinalization {
  id: string
  revision: number
  items: FinalizationItem[]
  inputs: string[]
  picBeds: Partial<Record<'ctx' | 'backupCtx', IStringKeyMap>>
  preferences: UploadFinalizationPreferences
  settings: { deleteLocalFile: boolean; pasteStyle: string; customLink?: string; notify: boolean }
  deletedSources: string[]
  effectsCompleted?: boolean
  completed?: boolean
}

export class UploadFinalizationError extends Error {
  readonly stage = 'finalization'

  constructor(
    readonly finalization: UploadFinalization,
    cause: unknown,
  ) {
    super('Remote upload completed, but finalization failed. Retry finalization without uploading again.', { cause })
  }
}

export function createUploadFinalization(
  result: IuploadReturnCtxResult,
  inputs: readonly string[],
  preferences: UploadFinalizationPreferences,
  id: string = randomUUID(),
): UploadFinalization {
  const settings = picgo.getConfig<any>()?.settings || {}
  const sourceInputs = result.sourceInputs || [...inputs]
  const state: UploadFinalization = {
    id,
    revision: 0,
    items: [],
    inputs: [...sourceInputs],
    picBeds: {},
    preferences: { ...preferences },
    settings: {
      deleteLocalFile: !!settings.deleteLocalFile,
      pasteStyle: settings.pasteStyle || IPasteStyle.MARKDOWN,
      customLink: settings.customLink,
      notify: settings.uploadResultNotification !== false,
    },
    deletedSources: [],
  }
  for (const role of ['ctx', 'backupCtx'] as const) {
    const ctx = result[role]
    const output = ctx?.output || []
    if (ctx) state.picBeds[role] = cloneDeep(ctx.getConfig<IStringKeyMap>('picBed') || {})
    output.forEach((image, index) => {
      if (!isUploadUrl(image?.imgUrl)) return
      const { buffer: _buffer, base64Image: _base64Image, ...metadata } = image
      state.items.push({
        role,
        // New IDs distinguish repeated uploads, while retries reuse these exact records.
        image: { ...cloneDeep(metadata), id: randomUUID() },
        sourcePath: getUploadedSourcePath(sourceInputs, image, index, output.length),
        completedScripts: [],
      })
    })
  }
  if (!state.items.length) throw new Error('Upload failed - no result returned')
  return state
}

function journalPath(id: string): string {
  if (!/^[\w-]+$/.test(id)) throw new Error('Invalid upload finalization ID')
  return path.join(dataDir(), 'uploadFinalizations', `${id}.json`)
}

export async function saveUploadFinalization(state: UploadFinalization): Promise<void> {
  const file = journalPath(state.id)
  await fs.ensureDir(path.dirname(file))
  await writeFile(file, JSON.stringify(state))
}

export async function loadUploadFinalization(id: string): Promise<UploadFinalization | undefined> {
  const pending = pendingFinalizations.get(id)
  try {
    const saved: UploadFinalization = await fs.readJSON(journalPath(id))
    return pending && pending.revision > saved.revision ? pending : saved
  } catch (error: any) {
    if (error.code === 'ENOENT') return pending
    throw error
  }
}

function restoredContext(state: UploadFinalization, role: FinalizationItem['role']): IPicGo {
  // Hooks retried after restart see the original uploader configuration and outputs.
  const ctx: IPicGo = Object.create(picgo)
  const config = { ...picgo.getConfig<any>(), picBed: cloneDeep(state.picBeds[role] || {}) }
  ctx.getConfig = (key?: string) => (key ? get(config, key) : config)
  ctx.input = [...state.inputs]
  ctx.rawInput = [...state.inputs]
  ctx.rawInputPath = [...state.inputs]
  ctx.output = state.items.filter(item => item.role === role).map(item => cloneDeep(item.image))
  ctx.processedInput = cloneDeep(ctx.output)
  return ctx
}

function resultItems(state: UploadFinalization): FinalizationItem[] {
  const primary = state.items.filter(item => item.role === 'ctx')
  // A successful secondary upload still needs finalization when the primary failed.
  return primary.length ? primary : state.items
}

function publishGallery(origin?: WebContents): void {
  const tray = windowManager.get(IWindowList.TRAY_WINDOW)?.webContents
  const setting = windowManager.get(IWindowList.SETTING_WINDOW)?.webContents
  sendToWindow(tray, 'uploadFiles')
  sendToWindow(setting, 'updateGallery')
  if (origin && origin !== tray && origin !== setting) {
    sendToWindow(origin, 'uploadFiles')
    sendToWindow(origin, 'updateGallery')
  }
}

function notifySuccess(state: UploadFinalization): void {
  if (!state.settings.notify || state.preferences.notification === 'none') return
  const items = resultItems(state)
  if (state.preferences.notification === 'batch' && items.length > 3) {
    new Notification({ title: t('main.notification.multipleUploadSuccess', { num: items.length }), body: '' }).show()
  } else {
    for (const { image } of items) {
      new Notification({ title: t('main.notification.uploadSuccess'), body: image.shortUrl || image.imgUrl! }).show()
    }
  }
}

interface FinalizationOptions {
  contexts?: IuploadReturnCtxResult
  origin?: WebContents
  assertActive?: () => void
  checkpoint?: () => void | Promise<void>
}

const activeFinalizations = new Map<string, Promise<IStringKeyMap[]>>()
// Retain failed results even if the very first journal write failed. Successful requests release this memory.
const pendingFinalizations = new Map<string, UploadFinalization>()

// This function never performs a transfer. The same saved state can be retried after any failure.
export function finalizeUpload(state: UploadFinalization, options: FinalizationOptions = {}): Promise<IStringKeyMap[]> {
  const active = activeFinalizations.get(state.id)
  if (active) return active
  pendingFinalizations.set(state.id, state)
  const pending = finishUpload(state, options)
    .then(results => {
      pendingFinalizations.delete(state.id)
      return results
    })
    .finally(() => activeFinalizations.delete(state.id))
  activeFinalizations.set(state.id, pending)
  return pending
}

async function finishUpload(state: UploadFinalization, options: FinalizationOptions): Promise<IStringKeyMap[]> {
  const assertActive = () => options.assertActive?.()
  const checkpoint = async () => {
    state.revision++
    await saveUploadFinalization(state)
    await options.checkpoint?.()
    assertActive()
  }
  try {
    // Save the completed remote result before formatting, gallery writes, hooks or source deletion.
    await checkpoint()
    for (const item of state.items) {
      assertActive()
      if (!item.prepared) {
        const [text, shortUrl] = await pasteTemplate(state.settings.pasteStyle, item.image, state.settings.customLink)
        item.image.shortUrl = shortUrl
        item.pasteText = text
        item.prepared = true
        await checkpoint()
      }
      if (!item.inserted) {
        const db = GalleryDB.getInstance()
        // An insert can commit before a journal write fails. Its stable ID makes recovery idempotent.
        item.image = (await db.getById(item.image.id!)) || (await db.insert(cloneDeep(item.image)))
        item.inserted = true
        await checkpoint()
      }
    }
    assertActive()
    publishGallery(options.origin)
    // All primary and secondary metadata must be durable before hooks and cleanup.
    for (const item of state.items) {
      assertActive()
      if (item.hooksCompleted) continue
      const ctx = options.contexts?.[item.role] || restoredContext(state, item.role)
      ctx.output = state.items.filter(output => output.role === item.role).map(output => cloneDeep(output.image))
      await runScriptInStage(
        'onUploadSuccess',
        ctx,
        { galleryItem: cloneDeep(item.image), finalizationId: state.id },
        {
          completedScripts: item.completedScripts,
          onScriptCompleted: async script => {
            item.completedScripts.push(script)
            await checkpoint()
          },
          throwOnError: true,
        },
      )
      item.hooksCompleted = true
      await checkpoint()
    }
    // A failed checkpoint or hook never authorizes deleting a source.
    await checkpoint()
    if (state.settings.deleteLocalFile) {
      const sources = new Set(state.items.map(item => item.sourcePath).filter((source): source is string => !!source))
      for (const source of sources) {
        assertActive()
        if (state.deletedSources.includes(source) || !path.isAbsolute(source)) continue
        try {
          // Only unlink files; never recursively remove a directory supplied as an upload input.
          await fs.unlink(source)
        } catch (error: any) {
          if (error.code !== 'ENOENT') throw error
        }
        state.deletedSources.push(source)
        await checkpoint()
      }
    }
    assertActive()
    if (!state.effectsCompleted) {
      if (state.preferences.clearClipboard) {
        sendToWindow(windowManager.get(IWindowList.TRAY_WINDOW)?.webContents, 'clipboardFiles', [])
      }
      if (state.preferences.copy)
        handleCopyUrl(
          resultItems(state)
            .map(item => item.pasteText)
            .join('\n'),
        )
      notifySuccess(state)
      state.effectsCompleted = true
    }
    state.completed = true
    await checkpoint()
    return resultItems(state).map(({ image }) => ({
      url: handleUrlEncodeWithSetting(image.imgUrl!),
      fullResult: cloneDeep(image),
    }))
  } catch (error) {
    // Preserve cancellation semantics at the request boundary.
    assertActive()
    throw new UploadFinalizationError(state, error)
  }
}
