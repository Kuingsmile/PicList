import { randomUUID } from 'node:crypto'
import path from 'node:path'

import { GalleryDB } from '@core/datastore'
import { dataDir } from '@core/datastore/dirs'
import picgo from '@core/picgo'
import windowManager from 'apis/app/window/windowManager'
import { app, Notification, safeStorage, type WebContents } from 'electron'
import fs from 'fs-extra'
import { cloneDeep, get } from 'lodash-es'
import type { IPicGo } from 'piclist'

import { t } from '~/i18n'
import { handleCopyUrl, handleUrlEncodeWithSetting } from '~/utils/common'
import { IPasteStyle, IWindowList } from '~/utils/enum'
import pasteTemplate from '~/utils/pasteTemplate'
import { runScriptInStage } from '~/utils/runScript'
import {
  isRecord,
  quarantineTaskStore,
  TASK_HISTORY_LIMIT,
  TASK_HISTORY_MAX_AGE,
  writeAtomicTaskFile,
} from '~/utils/taskCheckpoint'
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

export function isUploadFinalization(value: unknown): value is UploadFinalization {
  return (
    isRecord(value) &&
    typeof value.id === 'string' &&
    /^[\w-]+$/.test(value.id) &&
    Number.isInteger(value.revision) &&
    value.revision >= 0 &&
    Array.isArray(value.items) &&
    value.items.length > 0 &&
    value.items.every(
      item =>
        isRecord(item) &&
        ['ctx', 'backupCtx'].includes(item.role) &&
        isRecord(item.image) &&
        typeof item.image.id === 'string' &&
        isUploadUrl(item.image.imgUrl) &&
        Array.isArray(item.completedScripts) &&
        item.completedScripts.every((script: unknown) => typeof script === 'string') &&
        ['prepared', 'inserted', 'hooksCompleted'].every(
          key => item[key] === undefined || typeof item[key] === 'boolean',
        ) &&
        (item.sourcePath === undefined || typeof item.sourcePath === 'string') &&
        (item.pasteText === undefined || typeof item.pasteText === 'string'),
    ) &&
    Array.isArray(value.inputs) &&
    value.inputs.every(input => typeof input === 'string') &&
    Array.isArray(value.deletedSources) &&
    value.deletedSources.every(source => typeof source === 'string') &&
    isRecord(value.picBeds) &&
    isRecord(value.preferences) &&
    typeof value.preferences.copy === 'boolean' &&
    ['none', 'individual', 'batch'].includes(value.preferences.notification) &&
    isRecord(value.settings) &&
    typeof value.settings.deleteLocalFile === 'boolean' &&
    typeof value.settings.pasteStyle === 'string' &&
    typeof value.settings.notify === 'boolean' &&
    ['completed', 'effectsCompleted'].every(key => value[key] === undefined || typeof value[key] === 'boolean')
  )
}

export class FinalizationStorageUnavailableError extends Error {
  constructor() {
    super('Secure storage is unavailable; unlock the OS key store before retrying.')
  }
}

export function assertFinalizationStorageAvailable(): void {
  // Electron's Linux basic_text fallback provides no secret protection.
  if (
    !safeStorage.isEncryptionAvailable() ||
    (process.platform === 'linux' && safeStorage.getSelectedStorageBackend() === 'basic_text')
  ) {
    throw new FinalizationStorageUnavailableError()
  }
}

export async function saveUploadFinalization(state: UploadFinalization): Promise<void> {
  if (!isUploadFinalization(state)) throw new Error('Invalid upload finalization')
  await app.whenReady()
  assertFinalizationStorageAvailable()
  const file = journalPath(state.id)
  // Plugin result metadata and hook snapshots can contain credentials. Keep them out of plaintext task stores.
  const ciphertext = safeStorage.encryptString(JSON.stringify(state)).toString('base64')
  await writeAtomicTaskFile(
    file,
    JSON.stringify({ version: 1, savedAt: Date.now(), completed: !!state.completed, ciphertext }),
  )
  if (state.completed) scheduleJournalCleanup()
}

export async function loadUploadFinalization(id: string): Promise<UploadFinalization | undefined> {
  const pending = pendingFinalizations.get(id)
  const file = journalPath(id)
  let data: unknown
  try {
    data = JSON.parse(await fs.readFile(file, 'utf8'))
  } catch (error: any) {
    if (error.code === 'ENOENT') {
      // Quarantining a bad receipt must not make a later retry mistake it for a never-completed transfer.
      const files = await fs.readdir(path.dirname(file)).catch((error: NodeJS.ErrnoException) => {
        if (error.code === 'ENOENT') return []
        throw new Error('Upload finalization is unavailable')
      })
      if (files.some(name => name.startsWith(`${id}.json.corrupt-`))) {
        // eslint-disable-next-line preserve-caught-error -- Do not attach the original error's private path.
        throw new Error('Upload finalization is quarantined')
      }
      return pending
    }
    if (error instanceof SyntaxError) quarantineTaskStore(file)
    // eslint-disable-next-line preserve-caught-error -- Parser errors can contain credentials from a legacy journal.
    throw new Error('Upload finalization is unavailable')
  }
  const encrypted = isRecord(data) && Object.hasOwn(data, 'version')
  if (isRecord(data) && encrypted) {
    if (data.version !== 1 || typeof data.ciphertext !== 'string' || !/^[A-Za-z0-9+/]+={0,2}$/.test(data.ciphertext)) {
      quarantineTaskStore(file)
      throw new Error('Invalid upload finalization')
    }
    await app.whenReady()
    assertFinalizationStorageAvailable()
    // A locked/different OS key store is not corruption. Preserve its ciphertext for later recovery.
    let plaintext: string
    try {
      plaintext = safeStorage.decryptString(Buffer.from(data.ciphertext, 'base64'))
    } catch {
      throw new Error('Upload finalization cannot be decrypted')
    }
    try {
      data = JSON.parse(plaintext)
    } catch {
      quarantineTaskStore(file)
      throw new Error('Invalid upload finalization')
    }
  }
  if (!isUploadFinalization(data) || data.id !== id) {
    quarantineTaskStore(file)
    throw new Error('Invalid upload finalization')
  }
  const saved = pending && pending.revision > data.revision ? pending : data
  // Upgrade existing plaintext journals before any recovered side effects run.
  if (!encrypted) await saveUploadFinalization(saved)
  return saved
}

let queueFinalizations = new Set<string>()
let cleanupTimer: NodeJS.Timeout | undefined

export function protectQueueFinalizations(ids: string[]): void {
  queueFinalizations = new Set(ids)
  scheduleJournalCleanup()
}

function scheduleJournalCleanup(): void {
  if (cleanupTimer) return
  cleanupTimer = setTimeout(() => {
    cleanupTimer = undefined
    void pruneUploadFinalizations().catch(() => console.error('Upload finalization history cleanup failed'))
  }, 2000)
  cleanupTimer.unref()
}

export async function pruneUploadFinalizations(): Promise<void> {
  const directory = path.join(dataDir(), 'uploadFinalizations')
  const files = await fs.readdir(directory).catch((error: NodeJS.ErrnoException) => {
    if (error.code === 'ENOENT') return []
    throw new Error('Upload finalization history unavailable')
  })
  const completed: { id: string; time: number }[] = []
  for (const file of files) {
    if (!/^[\w-]+\.json$/.test(file)) continue
    const id = file.slice(0, -5)
    if (queueFinalizations.has(id) || activeFinalizations.has(id) || pendingFinalizations.has(id)) continue
    const data = await fs.readJSON(path.join(directory, file)).catch(() => undefined)
    if (!isRecord(data) || data.completed !== true) continue
    const time = typeof data.savedAt === 'number' ? data.savedAt : (await fs.stat(path.join(directory, file))).mtimeMs
    completed.push({ id, time })
  }
  completed.sort((a, b) => b.time - a.time)
  for (const [index, { id, time }] of completed.entries()) {
    if (index < TASK_HISTORY_LIMIT && time >= Date.now() - TASK_HISTORY_MAX_AGE) continue
    if (queueFinalizations.has(id) || activeFinalizations.has(id) || pendingFinalizations.has(id)) continue
    await fs.unlink(journalPath(id)).catch((error: NodeJS.ErrnoException) => {
      if (error.code !== 'ENOENT') throw new Error('Upload finalization history cleanup failed')
    })
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
