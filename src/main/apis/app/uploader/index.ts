import dayjs from 'dayjs'
import { BrowserWindow, clipboard, ipcMain, Notification, WebContents } from 'electron'
import fs from 'fs-extra'
import path from 'path'
import { IPicGo } from 'piclist'
import util from 'util'
import writeFile from 'write-file-atomic'

import windowManager from 'apis/app/window/windowManager'

import db from '@core/datastore'
import picgo from '@core/picgo'
import logger from '@core/picgo/logger'

import { T } from '~/i18n'
import { showNotification, getClipboardFilePath, calcDurationRange } from '~/utils/common'

import { GET_RENAME_FILE_NAME, RENAME_FILE_NAME, TALKING_DATA_EVENT } from '#/events/constants'
import { ICOREBuildInEvent, IWindowList } from '#/types/enum'
import { configPaths } from '#/utils/configPaths'
import { CLIPBOARD_IMAGE_FOLDER } from '#/utils/static'

const waitForRename = (window: BrowserWindow, id: number): Promise<string | null> => {
  return new Promise(resolve => {
    ipcMain.once(`${RENAME_FILE_NAME}${id}`, (_: Event, newName: string) => {
      resolve(newName)
      window.close()
    })
    window.on('close', () => {
      resolve(null)
      ipcMain.removeAllListeners(`${RENAME_FILE_NAME}${id}`)
      windowManager.deleteById(window.id)
    })
  })
}

const handleTalkingData = (webContents: WebContents, options: IAnalyticsData) => {
  const { type, fromClipboard, count, duration } = options
  const data: ITalkingDataOptions = {
    EventId: 'upload',
    Label: type,
    MapKv: {
      by: fromClipboard ? 'clipboard' : 'files',
      count,
      duration: calcDurationRange(duration || 0),
      type
    }
  }
  webContents.send(TALKING_DATA_EVENT, data)
}

class Uploader {
  private webContents: WebContents | null = null

  constructor() {
    this.init()
  }

  init() {
    picgo.on(ICOREBuildInEvent.NOTIFICATION, (message: Electron.NotificationConstructorOptions | undefined) => {
      new Notification(message).show()
    })

    picgo.on(ICOREBuildInEvent.UPLOAD_PROGRESS, (progress: any) => {
      this.webContents?.send('uploadProgress', progress)
    })

    picgo.on(ICOREBuildInEvent.BEFORE_TRANSFORM, () => {
      if (db.get(configPaths.settings.uploadNotification)) {
        const notification = new Notification({
          title: T('UPLOAD_PROGRESS'),
          body: T('UPLOADING')
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
                ipcMain.on(GET_RENAME_FILE_NAME, evt => {
                  try {
                    if (evt.sender.id === window.webContents.id) {
                      logger.info('rename window ready, wait for rename...')
                      window.webContents.send(RENAME_FILE_NAME, fileName, item.fileName, window.webContents.id)
                    }
                  } catch (e: any) {
                    logger.error(e)
                  }
                })
                name = await waitForRename(window, window.webContents.id)
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
      const startTime = Date.now()
      const ctx = await picgo.uploadReturnCtx(img, skipProcess)
      if (!Array.isArray(ctx.output) || !ctx.output.some((item: ImgInfo) => item.imgUrl)) return false

      if (this.webContents) {
        handleTalkingData(this.webContents, {
          fromClipboard: !img,
          type: db.get(configPaths.picBed.uploader) || db.get(configPaths.picBed.current) || 'smms',
          count: img ? img.length : 1,
          duration: Date.now() - startTime
        } as IAnalyticsData)
      }

      ctx.output.forEach((item: ImgInfo) => {
        item.config = JSON.parse(JSON.stringify(db.get(`picBed.${item.type}`)))
      })

      return ctx
    } catch (e: any) {
      logger.error(e)
      setTimeout(() => {
        showNotification({
          title: T('UPLOAD_FAILED'),
          body: util.format(e.stack),
          clickToCopy: true
        })
      }, 500)
      return false
    } finally {
      ipcMain.removeAllListeners(GET_RENAME_FILE_NAME)
    }
  }

  async upload(img?: IUploadOption): Promise<ImgInfo[] | false> {
    try {
      const startTime = Date.now()
      const output = await picgo.upload(img)
      if (!Array.isArray(output) || !output.some((item: ImgInfo) => item.imgUrl)) return false

      if (this.webContents) {
        handleTalkingData(this.webContents, {
          fromClipboard: !img,
          type: db.get(configPaths.picBed.uploader) || db.get(configPaths.picBed.current) || 'smms',
          count: img ? img.length : 1,
          duration: Date.now() - startTime
        } as IAnalyticsData)
      }
      output.forEach((item: ImgInfo) => {
        item.config = JSON.parse(JSON.stringify(db.get(`picBed.${item.type}`)))
      })
      return output.filter(item => item.imgUrl)
    } catch (e: any) {
      logger.error(e)
      setTimeout(() => {
        showNotification({
          title: T('UPLOAD_FAILED'),
          body: util.format(e.stack),
          clickToCopy: true
        })
      }, 500)
      return false
    } finally {
      ipcMain.removeAllListeners(GET_RENAME_FILE_NAME)
    }
  }
}

export default new Uploader()
