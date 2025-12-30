import { GalleryDB } from '@core/datastore'
import picgo from '@core/picgo'
import GuiApi from 'apis/gui'
import { clipboard } from 'electron'

import type { IIPCEvent } from '#/types/rpc'
import type { ImgInfo } from '#/types/types'
import { RPCRouter } from '~/events/rpc/router'
import { configPaths } from '~/utils/configPaths'
import { ICOREBuildInEvent, IPasteStyle, IRPCActionType, IRPCType } from '~/utils/enum'
import pasteTemplate from '~/utils/pasteTemplate'
interface IFilter {
  orderBy?: 'asc' | 'desc'
  limit?: number
  offset?: number
}

interface IObject {
  id?: string
  [propName: string]: any
}
const galleryRouter = new RPCRouter()

const galleryRoutes = [
  {
    action: IRPCActionType.GALLERY_PASTE_TEXT,
    handler: async (_: IIPCEvent, args: [item: ImgInfo, copy?: boolean]) => {
      const [item, copy = true] = args
      const pasteStyle = picgo.getConfig<string>(configPaths.settings.pasteStyle) || IPasteStyle.MARKDOWN
      const customLink = picgo.getConfig<string>(configPaths.settings.customLink)
      const [txt, shortUrl] = await pasteTemplate(pasteStyle, item, customLink)
      if (copy) {
        clipboard.writeText(txt)
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
