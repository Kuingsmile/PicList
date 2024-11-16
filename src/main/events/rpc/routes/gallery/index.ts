import { clipboard } from 'electron'

import { GalleryDB } from '@core/datastore'
import picgo from '@core/picgo'
import logger from '@core/picgo/logger'
import { IFilter, IObject } from '@picgo/store/dist/types'
import GuiApi from 'apis/gui'

import { RPCRouter } from '~/events/rpc/router'
import {
  removeFileFromDogeInMain,
  removeFileFromHuaweiInMain,
  removeFileFromS3InMain,
  removeFileFromSFTPInMain
} from '~/utils/deleteFunc'
import pasteTemplate from '~/utils/pasteTemplate'

import { ICOREBuildInEvent, IPasteStyle, IRPCActionType, IRPCType } from '#/types/enum'
import { configPaths } from '#/utils/configPaths'

const galleryRouter = new RPCRouter()

const galleryRoutes = [
  {
    action: IRPCActionType.GALLERY_PASTE_TEXT,
    handler: async (_: IIPCEvent, args: [item: ImgInfo, copy?: boolean]) => {
      const [item, copy = true] = args
      const pasteStyle = picgo.getConfig<IPasteStyle>(configPaths.settings.pasteStyle) || IPasteStyle.MARKDOWN
      const customLink = picgo.getConfig<string>(configPaths.settings.customLink)
      const [txt, shortUrl] = await pasteTemplate(pasteStyle, item, customLink)
      if (copy) {
        clipboard.writeText(txt)
      }
      return [txt, shortUrl]
    },
    type: IRPCType.INVOKE
  },
  {
    action: IRPCActionType.GALLERY_REMOVE_FILES,
    handler: async (_: IIPCEvent, args: [files: ImgInfo[]]) => {
      setTimeout(() => {
        picgo.emit(ICOREBuildInEvent.REMOVE, args[0], GuiApi.getInstance())
      }, 500)
    }
  },
  {
    action: IRPCActionType.GALLERY_GET_DB,
    handler: async (_: IIPCEvent, args: [filter: IFilter]) => {
      const dbStore = GalleryDB.getInstance()
      return await dbStore.get(args[0])
    },
    type: IRPCType.INVOKE
  },
  {
    action: IRPCActionType.GALLERY_GET_BY_ID_DB,
    handler: async (_: IIPCEvent, args: [id: string]) => {
      const dbStore = GalleryDB.getInstance()
      return await dbStore.getById(args[0])
    },
    type: IRPCType.INVOKE
  },
  {
    action: IRPCActionType.GALLERY_UPDATE_BY_ID_DB,
    handler: async (_: IIPCEvent, args: [id: string, value: IObject]) => {
      const dbStore = GalleryDB.getInstance()
      return await dbStore.updateById(args[0], args[1])
    },
    type: IRPCType.INVOKE
  },
  {
    action: IRPCActionType.GALLERY_REMOVE_BY_ID_DB,
    handler: async (_: IIPCEvent, args: [id: string]) => {
      const dbStore = GalleryDB.getInstance()
      return await dbStore.removeById(args[0])
    },
    type: IRPCType.INVOKE
  },
  {
    action: IRPCActionType.GALLERY_INSERT_DB,
    handler: async (_: IIPCEvent, args: [value: IObject]) => {
      const dbStore = GalleryDB.getInstance()
      return await dbStore.insert(args[0])
    },
    type: IRPCType.INVOKE
  },
  {
    action: IRPCActionType.GALLERY_INSERT_DB_BATCH,
    handler: async (_: IIPCEvent, args: [value: IObject[]]) => {
      const dbStore = GalleryDB.getInstance()
      return await dbStore.insertMany(args[0])
    },
    type: IRPCType.INVOKE
  },
  {
    action: IRPCActionType.GALLERY_LOG_DELETE_MSG,
    handler: async (_: IIPCEvent, args: [msg: string, logLevel: ILogType]) => {
      const [msg, logLevel] = args
      console.log(msg, logLevel)
      logger[logLevel](msg)
    }
  },
  {
    action: IRPCActionType.GALLERY_DELETE_SFTP_FILE,
    handler: async (_: IIPCEvent, args: [config: ISftpPlistConfig, fileName: string]) => {
      const [config, fileName] = args
      return await removeFileFromSFTPInMain(config, fileName)
    },
    type: IRPCType.INVOKE
  },
  {
    action: IRPCActionType.GALLERY_DELETE_AWS_S3_FILE,
    handler: async (_: IIPCEvent, args: [configMap: IStringKeyMap]) => {
      return await removeFileFromS3InMain(args[0])
    },
    type: IRPCType.INVOKE
  },
  {
    action: IRPCActionType.GALLERY_DELETE_DOGE_FILE,
    handler: async (_: IIPCEvent, args: [configMap: IStringKeyMap]) => {
      return await removeFileFromDogeInMain(args[0])
    },
    type: IRPCType.INVOKE
  },
  {
    action: IRPCActionType.GALLERY_DELETE_HUAWEI_OSS_FILE,
    handler: async (_: IIPCEvent, args: [configMap: IStringKeyMap]) => {
      return await removeFileFromHuaweiInMain(args[0])
    },
    type: IRPCType.INVOKE
  }
]

galleryRouter.addBatch(galleryRoutes)

export { galleryRouter }
