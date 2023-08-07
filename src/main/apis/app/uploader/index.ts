// External dependencies
import dayjs from 'dayjs'
import util from 'util'
import path from 'path'
import writeFile from 'write-file-atomic'
import fse from 'fs-extra'

// Electron modules
import {
  Notification,
  BrowserWindow,
  ipcMain,
  WebContents,
  clipboard
} from 'electron'

// Custom utilities and modules
import picgo from '@core/picgo'
import db from '~/main/apis/core/datastore'
import windowManager from 'apis/app/window/windowManager'
import { showNotification, getClipboardFilePath } from '~/main/utils/common'
import logger from '@core/picgo/logger'
import { T } from '~/main/i18n'
import { CLIPBOARD_IMAGE_FOLDER } from '~/universal/utils/static'

// Custom types/enums
import { IWindowList } from '#/types/enum'

// External utility functions
import { IPicGo } from 'piclist'
import {
  GET_RENAME_FILE_NAME,
  RENAME_FILE_NAME
} from '~/universal/events/constants'

const waitForRename = (window: BrowserWindow, id: number): Promise<string|null> => {
  return new Promise((resolve) => {
    const windowId = window.id
    ipcMain.once(`${RENAME_FILE_NAME}${id}`, (evt: Event, newName: string) => {
      resolve(newName)
      window.close()
    })
    window.on('close', () => {
      resolve(null)
      ipcMain.removeAllListeners(`${RENAME_FILE_NAME}${id}`)
      windowManager.deleteById(windowId)
    })
  })
}

class Uploader {
  private webContents: WebContents | null = null
  // private uploading: boolean = false
  constructor () {
    this.init()
  }

  init () {
    picgo.on('notification', (message: Electron.NotificationConstructorOptions | undefined) => {
      const notification = new Notification(message)
      notification.show()
    })

    picgo.on('uploadProgress', (progress: any) => {
      this.webContents?.send('uploadProgress', progress)
    })
    picgo.on('beforeTransform', () => {
      if (db.get('settings.uploadNotification')) {
        const notification = new Notification({
          title: T('UPLOAD_PROGRESS'),
          body: T('UPLOADING')
        })
        notification.show()
      }
    })
    picgo.helper.beforeUploadPlugins.register('renameFn', {
      handle: async (ctx: IPicGo) => {
        const rename = db.get('settings.rename')
        const autoRename = db.get('settings.autoRename')
        if (autoRename || rename) {
          await Promise.all(ctx.output.map(async (item, index) => {
            let name: undefined | string | null
            let fileName: string | undefined
            if (autoRename) {
              fileName = dayjs().add(index, 'ms').format('YYYYMMDDHHmmSSS') + item.extname
            } else {
              fileName = item.fileName
            }
            if (rename) {
              const window = windowManager.create(IWindowList.RENAME_WINDOW)!
              logger.info('create rename window')
              ipcMain.on(GET_RENAME_FILE_NAME, (evt) => {
                if (evt.sender.id === window.webContents.id) {
                  logger.info('rename window ready, wait for rename...')
                  window.webContents.send(RENAME_FILE_NAME, fileName, item.fileName, window.webContents.id)
                }
              })
              name = await waitForRename(window, window.webContents.id)
            }
            item.fileName = name || fileName
          }))
        }
      }
    })
  }

  setWebContents (webContents: WebContents) {
    this.webContents = webContents
    return this
  }

  /**
   * use electron's clipboard image to upload
   */
  async uploadWithBuildInClipboard (): Promise<ImgInfo[]|false> {
    let filePath = ''
    try {
      const imgPath = getClipboardFilePath()
      if (!imgPath) {
        const nativeImage = clipboard.readImage()
        if (nativeImage.isEmpty()) {
          return false
        }
        const buffer = nativeImage.toPNG()
        const baseDir = picgo.baseDir
        const fileName = `${dayjs().format('YYYYMMDDHHmmSSS')}.png`
        filePath = path.join(baseDir, CLIPBOARD_IMAGE_FOLDER, fileName)
        await writeFile(filePath, buffer)
        return await this.upload([filePath])
      } else {
        return await this.upload([imgPath])
      }
    } catch (e: any) {
      logger.error(e)
      return false
    } finally {
      if (filePath) {
        fse.unlink(filePath)
      }
    }
  }

  async upload (img?: IUploadOption): Promise<ImgInfo[]|false> {
    try {
      const output = await picgo.upload(img)
      if (Array.isArray(output) && output.some((item: ImgInfo) => item.imgUrl)) {
        output.forEach((item: ImgInfo) => {
          item.config = JSON.parse(JSON.stringify(db.get(`picBed.${item.type}`)))
        })
        return output.filter(item => item.imgUrl)
      } else {
        return false
      }
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
