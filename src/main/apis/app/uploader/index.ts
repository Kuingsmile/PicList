import path from 'node:path'
import util from 'node:util'

import db from '@core/datastore'
import picgo from '@core/picgo'
import logger from '@core/picgo/logger'
import windowManager from 'apis/app/window/windowManager'
import dayjs from 'dayjs'
import { BrowserWindow, clipboard, ipcMain, IpcMainEvent, Notification, WebContents } from 'electron'
import fs from 'fs-extra'
import type { IPicGo } from 'piclist'
import writeFile from 'write-file-atomic'

import type { ImgInfo, IUploadOption } from '#/types/types'
import { GET_RENAME_FILE_NAME, RENAME_FILE_NAME } from '~/events/constant'
import { T as $t } from '~/i18n'
import { getClipboardFilePath, showNotification } from '~/utils/common'
import { configPaths } from '~/utils/configPaths'
import { ICOREBuildInEvent, IWindowList } from '~/utils/enum'
import { IpcManager } from '~/utils/ipcManager'
import { CLIPBOARD_IMAGE_FOLDER } from '~/utils/static'

const waitForRename = (window: BrowserWindow, id: number): Promise<string | null> => {
  return new Promise(resolve => {
    // Use IpcManager for better cleanup tracking
    const cleanup = IpcManager.once(`${RENAME_FILE_NAME}${id}`, (_: IpcMainEvent, newName: string) => {
      resolve(newName)
      window.close()
    }, `rename-${id}`)

    window.on('close', () => {
      resolve(null)
      // Clean up the specific rename context
      IpcManager.cleanupContext(`rename-${id}`)
      windowManager.deleteById(window.id)
    })
  })
}

class Uploader {
  private webContents: WebContents | null = null

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
      if (db.get(configPaths.settings.uploadNotification)) {
        const notification = new Notification({
          title: $t('UPLOAD_PROGRESS'),
          body: $t('UPLOADING')
        })
        notification.show()
      }
    })

    picgo.helper.beforeUploadPlugins.register('renameFn', {
      handle: async (ctx: IPicGo) => {
        const rename = db.get(configPaths.settings.rename)
        const autoRename = db.get(configPaths.settings.autoRename)
        if (autoRename || rename) {
          await Promise.all(
            ctx.output.map(async (item, index) => {
              let name: undefined | string | null
              const fileName = autoRename
                ? `${dayjs().add(index, 'ms').format('YYYYMMDDHHmmssSSS')}${item.extname}`
                : item.fileName
              if (rename) {
                const window = windowManager.create(IWindowList.RENAME_WINDOW)!
                const windowId = window.webContents.id
                
                // Use IpcManager for safer listener management
                IpcManager.on(GET_RENAME_FILE_NAME, (evt, _) => {
                  try {
                    if (evt.sender.id === windowId) {
                      logger.info('rename window ready, wait for rename...')
                      window.webContents.send(RENAME_FILE_NAME, fileName, item.fileName, windowId)
                    }
                  } catch (e: any) {
                    logger.error(e)
                  }
                }, `rename-window-${windowId}`)
                
                name = await waitForRename(window, windowId)
              }
              item.fileName = name || fileName
            })
          )
        }
      }
    })
  }

  setWebContents(webContents: WebContents) {
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

  /**
   * use electron's clipboard image to upload
   */
  async uploadWithBuildInClipboard(): Promise<ImgInfo[] | false> {
    let imgPath: string | false = false
    try {
      imgPath = await this.getClipboardImagePath()
      if (!imgPath) return false
      return await this.upload([imgPath])
    } catch (e: any) {
      logger.error(e)
      return false
    } finally {
      if (imgPath && imgPath.startsWith(path.join(picgo.baseDir, CLIPBOARD_IMAGE_FOLDER))) {
        fs.remove(imgPath)
      }
    }
  }

  async uploadWithBuildInClipboardReturnCtx(img?: IUploadOption, skipProcess = false): Promise<IPicGo | false> {
    let imgPath: string | false = false
    try {
      imgPath = await this.getClipboardImagePath()
      if (!imgPath) return false
      return await this.uploadReturnCtx(img ?? [imgPath], skipProcess)
    } catch (e: any) {
      logger.error(e)
      return false
    } finally {
      if (imgPath && imgPath.startsWith(path.join(picgo.baseDir, CLIPBOARD_IMAGE_FOLDER))) {
        fs.remove(imgPath)
      }
    }
  }

  async uploadReturnCtx(img?: IUploadOption, skipProcess = false): Promise<IPicGo | false> {
    try {
      const ctx = await picgo.uploadReturnCtx(img, skipProcess)
      if (!Array.isArray(ctx.output) || !ctx.output.some((item: ImgInfo) => item.imgUrl)) return false

      ctx.output.forEach((item: ImgInfo) => {
        item.config = JSON.parse(JSON.stringify(db.get(`picBed.${item.type}`)))
      })

      return ctx
    } catch (e: any) {
      logger.error(e)
      setTimeout(() => {
        showNotification({
          title: $t('UPLOAD_FAILED'),
          body: util.format(e.stack),
          clickToCopy: true
        })
      }, 500)
      return false
    } finally {
      // Use IpcManager for safer cleanup
      IpcManager.removeAllListeners(GET_RENAME_FILE_NAME)
    }
  }

  async upload(img?: IUploadOption): Promise<ImgInfo[] | false> {
    try {
      const output = await picgo.upload(img)
      if (!Array.isArray(output) || !output.some((item: ImgInfo) => item.imgUrl)) return false
      output.forEach((item: ImgInfo) => {
        item.config = JSON.parse(JSON.stringify(db.get(`picBed.${item.type}`)))
      })
      return output.filter(item => item.imgUrl)
    } catch (e: any) {
      logger.error(e)
      setTimeout(() => {
        showNotification({
          title: $t('UPLOAD_FAILED'),
          body: util.format(e.stack),
          clickToCopy: true
        })
      }, 500)
      return false
    } finally {
      // Use IpcManager for safer cleanup
      IpcManager.removeAllListeners(GET_RENAME_FILE_NAME)
    }
  }
}

export default new Uploader()
