import path from 'node:path'
import util from 'node:util'

import picgo from '@core/picgo'
import logger from '@core/picgo/logger'
import windowManager from 'apis/app/window/windowManager'
import dayjs from 'dayjs'
import { BrowserWindow, clipboard, ipcMain, IpcMainEvent, Notification, WebContents } from 'electron'
import fs from 'fs-extra'
import type { IPicGo } from 'piclist'
import writeFile from 'write-file-atomic'

import { GET_RENAME_FILE_NAME, RENAME_FILE_NAME } from '~/events/constant'
import { T as $t } from '~/i18n'
import { getClipboardFilePath, getUploaderType, showNotification } from '~/utils/common'
import { configPaths } from '~/utils/configPaths'
import { ICOREBuildInEvent, IWindowList } from '~/utils/enum'
import { CLIPBOARD_IMAGE_FOLDER } from '~/utils/static'

const waitForRename = (window: BrowserWindow | undefined, id: number | undefined): Promise<string | null> => {
  return new Promise(resolve => {
    ipcMain.once(`${RENAME_FILE_NAME}${id}`, (_: IpcMainEvent, newName: string) => {
      resolve(newName)
      window?.close()
    })
    window?.on('close', () => {
      resolve(null)
      ipcMain.removeAllListeners(`${RENAME_FILE_NAME}${id}`)
      windowManager.deleteById(window?.id)
    })
  })
}

class Uploader {
  private webContents: WebContents | undefined = undefined

  constructor() {
    this.init()
  }

  init() {
    picgo.on(ICOREBuildInEvent.NOTIFICATION, (message: any) => {
      new Notification(message).show()
    })

    picgo.on(ICOREBuildInEvent.UPLOAD_PROGRESS, (progress: any) => {
      this.webContents?.send('uploadProgress', progress)
    })

    picgo.on(ICOREBuildInEvent.BEFORE_TRANSFORM, () => {
      if (picgo.getConfig<boolean | undefined>(configPaths.settings.uploadNotification)) {
        const notification = new Notification({
          title: $t('UPLOAD_PROGRESS'),
          body: $t('UPLOADING'),
        })
        notification.show()
      }
    })

    picgo.helper.beforeUploadPlugins.register('renameFn', {
      handle: async (ctx: IPicGo) => {
        const uploaderType = getUploaderType(ctx)
        const allConfig = picgo.getConfig<any>() || {}

        const globalRename = allConfig.settings?.rename
        const globalAutoRename = allConfig.settings?.autoRename
        const buildInList = allConfig.buildIn?.list || []
        const idSpecificRename = buildInList.find((item: any) => item.id === uploaderType.id)?.manualRename
        const idSpecificAutoRename = buildInList.find((item: any) => item.id === uploaderType.id)?.autoRename
        const rename = idSpecificRename !== undefined ? !!idSpecificRename : !!globalRename
        const autoRename = idSpecificAutoRename !== undefined ? !!idSpecificAutoRename : !!globalAutoRename
        if (autoRename || rename) {
          await Promise.all(
            ctx.output.map(async (item, index) => {
              let name: undefined | string | null
              const fileName = autoRename
                ? `${dayjs().add(index, 'ms').format('YYYYMMDDHHmmssSSS')}${item.extname}`
                : item.fileName
              if (rename) {
                const window = windowManager.create(IWindowList.RENAME_WINDOW)
                ipcMain.on(GET_RENAME_FILE_NAME, (evt, _) => {
                  try {
                    if (evt.sender.id === window?.webContents.id) {
                      logger.info('rename window ready, wait for rename...')
                      window.webContents.send(RENAME_FILE_NAME, fileName, item.fileName, window.webContents.id)
                    }
                  } catch (e: any) {
                    logger.error(e)
                  }
                })
                name = await waitForRename(window, window?.webContents.id)
              }
              item.fileName = name || fileName
            }),
          )
        }
      },
    })
  }

  setWebContents(webContents: WebContents | undefined) {
    this.webContents = webContents
    return this
  }

  private async getClipboardImagePath(): Promise<string | false> {
    const imgPath = getClipboardFilePath()
    if (imgPath) return imgPath

    const nativeImage = clipboard.readImage()
    if (nativeImage.isEmpty()) return false

    const buffer = nativeImage.toPNG()
    const baseDir = picgo.baseDir
    const fileName = `${dayjs().format('YYYYMMDDHHmmssSSS')}.png`
    const filePath = path.join(baseDir, CLIPBOARD_IMAGE_FOLDER, fileName)
    await writeFile(filePath, buffer)
    return filePath
  }

  async uploadWithBuildInClipboardReturnCtx(img?: IUploadOption): Promise<IuploadReturnCtxResult> {
    let imgPath: string | false = false
    try {
      imgPath = await this.getClipboardImagePath()
      if (!imgPath) return { ctx: undefined, backupCtx: undefined }
      return await this.uploadReturnCtx(img ?? [imgPath])
    } catch (e: any) {
      logger.error(e)
      return { ctx: undefined, backupCtx: undefined }
    } finally {
      if (imgPath && imgPath.startsWith(path.join(picgo.baseDir, CLIPBOARD_IMAGE_FOLDER))) {
        fs.remove(imgPath)
      }
    }
  }

  async uploadReturnCtx(img?: IUploadOption): Promise<IuploadReturnCtxResult> {
    try {
      const result = { ctx: undefined, backupCtx: undefined } as IuploadReturnCtxResult
      const res = await picgo.uploadReturnCtx(img)
      const allConfig = picgo.getConfig<any>() || {}

      if (Array.isArray(res.ctx?.output) && res.ctx?.output.some((item: ImgInfo) => item.imgUrl)) {
        res.ctx.output.forEach((item: ImgInfo) => {
          item.config = JSON.parse(JSON.stringify(allConfig.picBed?.[item.type!]))
        })
        result.ctx = res.ctx
      }

      if (Array.isArray(res.backupCtx?.output) && res.backupCtx?.output.some((item: ImgInfo) => item.imgUrl)) {
        res.backupCtx.output.forEach((item: ImgInfo) => {
          item.config = JSON.parse(JSON.stringify(allConfig.picBed?.[item.type!]))
        })
        result.backupCtx = res.backupCtx
      }
      return result
    } catch (e: any) {
      logger.error(e)
      setTimeout(() => {
        showNotification({
          title: $t('UPLOAD_FAILED'),
          body: util.format(e.stack),
          clickToCopy: true,
        })
      }, 500)
      return { ctx: undefined, backupCtx: undefined } as IuploadReturnCtxResult
    } finally {
      ipcMain.removeAllListeners(GET_RENAME_FILE_NAME)
    }
  }
}

export default new Uploader()
