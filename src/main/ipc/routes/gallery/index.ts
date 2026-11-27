import path from 'node:path'
import { Worker } from 'node:worker_threads'

import { GalleryDB } from '@core/datastore'
import picgo from '@core/picgo'
import type { IFilter, IObject } from '@piclist/store'
import GuiApi from 'apis/gui'
import { clipboard } from 'electron'

import { IPasteStyle } from '#/constants/app'
import { GALLERY_READ_LIMIT, type GalleryQuery, queryGallery } from '#/galleryQuery'
import { galleryTagKey, normalizeGalleryTags } from '#/galleryTags'
import { RpcError } from '#/rpc'
import { ICOREBuildInEvent, IRPCActionType, IRPCType } from '~/constants'
import { defineRpcHandler, RPCRouter } from '~/ipc/router'
import { convertJxlSourceToPngDataUrl } from '~/utils/jxlPreview'
import pasteTemplate from '~/utils/pasteTemplate'
import { runScriptInStage } from '~/utils/runScript'

import searchWorkerPath from './search.worker?modulePath'

const galleryRouter = new RPCRouter()

async function galleryRecords() {
  const data = await GalleryDB.getInstance().read()
  if (!Array.isArray(data?.gallery)) throw new Error('Missing gallery collection')
  return data.gallery
}

// User-entered regular expressions can take arbitrarily long. Keep them off Electron's event loop.
async function searchGallery(records: ImgInfo[], { name, url }: GalleryQuery) {
  if (!name && !url) return
  const fields = records.map(item => [item.id, name ? item.fileName : undefined, url ? item.imgUrl : undefined])
  const worker = new Worker(
    searchWorkerPath.replace(`${path.sep}app.asar${path.sep}`, `${path.sep}app.asar.unpacked${path.sep}`),
    {
      workerData: { name, url, fields },
    },
  )
  const timeout = setTimeout(() => {
    void worker.terminate()
  }, 5000)
  try {
    return await new Promise<Set<string>>((resolve, reject) => {
      worker.once('message', (ids: string[]) => resolve(new Set(ids)))
      worker.once('error', reject)
      worker.once('exit', () => reject(new Error('Gallery search stopped')))
    })
  } finally {
    clearTimeout(timeout)
    void worker.terminate()
  }
}

// Each committed gallery write replaces the collection. Discard its lookup index with that snapshot.
const rowIndexes = new WeakMap<ImgInfo[], Map<string, ImgInfo>>()
const galleryRoutes = [
  {
    action: IRPCActionType.GALLERY_QUERY,
    handler: async (_: IIPCEvent, [query]: [GalleryQuery]) => {
      const records = await galleryRecords()
      const hits = await searchGallery(records, query)
      return queryGallery(records, query, hits)
    },
    type: IRPCType.INVOKE,
  },
  {
    action: IRPCActionType.GALLERY_GET_ROWS,
    handler: async (_: IIPCEvent, [ids]: [string[]]) => {
      if (!Array.isArray(ids) || ids.length > GALLERY_READ_LIMIT) throw new Error('Invalid gallery row request')
      const records = await galleryRecords()
      let rows = rowIndexes.get(records)
      if (!rows) {
        rows = new Map(records.map(item => [item.id!, item]))
        rowIndexes.set(records, rows)
      }
      return ids.flatMap(id => rows.get(id) ?? [])
    },
    type: IRPCType.INVOKE,
  },
  {
    action: IRPCActionType.GALLERY_PASTE_TEXT,
    handler: async (_: IIPCEvent, args: [item: ImgInfo, copy?: boolean]) => {
      const [item, copy = true] = args
      const allConfig = picgo.getConfig<any>() || {}
      const pasteStyle = allConfig.settings?.pasteStyle || IPasteStyle.MARKDOWN
      const customLink = allConfig.settings?.customLink
      const [txt, shortUrl] = await pasteTemplate(pasteStyle, item, customLink)
      if (!txt?.trim()) throw new Error('Gallery link format produced empty text')
      if (copy) {
        await clipboard.writeText(txt)
      }
      return [txt, shortUrl]
    },
    type: IRPCType.INVOKE,
  },
  {
    action: IRPCActionType.GALLERY_REMOVE_FILES,
    handler: async (_: IIPCEvent, args: [files: ImgInfo[]]) => {
      setTimeout(() => {
        picgo.emit(ICOREBuildInEvent.REMOVE, args[0], GuiApi.getInstance())
      }, 500)
    },
  },
  {
    action: IRPCActionType.GALLERY_REMOVE_RUN_SCRIPTS,
    handler: async (_: IIPCEvent, args: [file: ImgInfo]) => {
      await runScriptInStage('onGalleryRemove', picgo, { galleryItem: args[0] })
    },
  },
  {
    action: IRPCActionType.GALLERY_GET_JXL_PREVIEW,
    handler: async (_: IIPCEvent, args: [source: string, isKnownJxl?: boolean]) => {
      try {
        return await convertJxlSourceToPngDataUrl(args[0], args[1])
      } catch (_e) {
        return undefined
      }
    },
    type: IRPCType.INVOKE,
  },
  {
    action: IRPCActionType.GALLERY_GET_DB,
    handler: async (_: IIPCEvent, args: [filter: IFilter]) => {
      const dbStore = GalleryDB.getInstance()
      return await dbStore.get(args[0])
    },
    type: IRPCType.INVOKE,
  },
  {
    action: IRPCActionType.GALLERY_GET_BY_ID_DB,
    handler: async (_: IIPCEvent, args: [id: string]) => {
      const dbStore = GalleryDB.getInstance()
      return await dbStore.getById(args[0])
    },
    type: IRPCType.INVOKE,
  },
  {
    action: IRPCActionType.GALLERY_UPDATE_BY_ID_DB,
    handler: async (_: IIPCEvent, args: [id: string, value: IObject]) => {
      const dbStore = GalleryDB.getInstance()
      return await dbStore.updateById(args[0], args[1])
    },
    type: IRPCType.INVOKE,
  },
  {
    action: IRPCActionType.GALLERY_EDIT_TAGS,
    handler: defineRpcHandler(IRPCActionType.GALLERY_EDIT_TAGS, async (_, [ids, add, remove]) => {
      const selected = new Set(ids)
      const additions = normalizeGalleryTags(add)
      const removals = new Set(remove.map(galleryTagKey))
      if (additions.some(tag => removals.has(galleryTagKey(tag)))) throw new RpcError('INVALID_REQUEST')

      const store = GalleryDB.getInstance()
      await store.withSnapshot(async ({ data }) => {
        const records = data.filter(record => selected.has(record.id))
        if (records.length !== selected.size) throw new RpcError('NOT_FOUND')

        // Merge the requested edits into the current records, including tags added since the editor opened.
        const updates = records.flatMap(record => {
          const current = normalizeGalleryTags(record.galleryTags)
          const kept = current.filter(tag => !removals.has(galleryTagKey(tag)))
          const galleryTags = normalizeGalleryTags([...kept, ...additions])
          const unchanged = galleryTags.length === current.length && galleryTags.every((tag, i) => tag === current[i])
          if (unchanged) return []
          return [{ id: record.id, galleryTags }]
        })
        if (updates.length && (await store.updateMany(updates)).success !== updates.length)
          throw new RpcError('WRITE_FAILED')
      })
      return true
    }),
    type: IRPCType.INVOKE,
  },
  {
    action: IRPCActionType.GALLERY_REMOVE_BY_ID_DB,
    handler: async (_: IIPCEvent, args: [id: string]) => {
      const dbStore = GalleryDB.getInstance()
      return await dbStore.removeById(args[0])
    },
    type: IRPCType.INVOKE,
  },
  {
    action: IRPCActionType.GALLERY_INSERT_DB,
    handler: async (_: IIPCEvent, args: [value: IObject]) => {
      const dbStore = GalleryDB.getInstance()
      return await dbStore.insert(args[0])
    },
    type: IRPCType.INVOKE,
  },
  {
    action: IRPCActionType.GALLERY_INSERT_DB_BATCH,
    handler: async (_: IIPCEvent, args: [value: IObject[]]) => {
      const dbStore = GalleryDB.getInstance()
      return await dbStore.insertMany(args[0])
    },
    type: IRPCType.INVOKE,
  },
]

galleryRouter.addBatch(galleryRoutes)

export { galleryRouter }
