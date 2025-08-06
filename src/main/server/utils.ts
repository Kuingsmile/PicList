import db, { GalleryDB } from '@core/datastore'
import picgo from '@core/picgo'
import logger from '@core/picgo/logger'
import windowManager from 'apis/app/window/windowManager'
import ALLApi from 'apis/delete/allApi'
import GuiApi from 'apis/gui'
import { Notification } from 'electron'

import type { IHttpResponse, ImgInfo, IObj } from '#/types/types'
import { T as $t } from '~/i18n/index'
import { configPaths } from '~/utils/configPaths'
import { ICOREBuildInEvent, IWindowList } from '~/utils/enum'
import { picBedsCanbeDeleted } from '~/utils/static'

export const handleResponse = ({
  response,
  statusCode = 200,
  header = {
    'Content-Type': 'application/json',
    'access-control-allow-headers': '*',
    'access-control-allow-methods': 'POST, GET, OPTIONS',
    'access-control-allow-origin': '*'
  },
  body = {
    success: false
  }
}: {
  response: IHttpResponse
  statusCode?: number
  header?: IObj
  body?: any
}) => {
  if (body?.success === false) {
    logger.warn('[PicList Server] upload failed, see piclist.log for more detail ↑')
  }
  response.writeHead(statusCode, header)
  response.write(JSON.stringify(body))
  response.end()
}

export const ensureHTTPLink = (url: string): string => {
  return url.startsWith('http') ? url : `http://${url}`
}

export const deleteChoosedFiles = async (list: ImgInfo[]): Promise<boolean[]> => {
  const result = []
  for (const item of list) {
    if (item.id) {
      try {
        const dbStore = GalleryDB.getInstance()
        const file = await dbStore.getById(item.id)
        await dbStore.removeById(item.id)
        if (await db.get(configPaths.settings.deleteCloudFile)) {
          if (item.type !== undefined && picBedsCanbeDeleted.includes(item.type)) {
            const noteFunc = (value: boolean) => {
              const notification = new Notification({
                title: $t('MANAGE_BUCKET_BATCH_DELETE_ERROR_MSG_MSG2'),
                body: $t(value ? 'GALLERY_SYNC_DELETE_NOTICE_SUCCEED' : 'GALLERY_SYNC_DELETE_NOTICE_FAILED')
              })
              notification.show()
            }
            setTimeout(() => {
              ALLApi.delete(item).then(noteFunc)
            }, 0)
          }
        }
        setTimeout(() => {
          picgo.emit(ICOREBuildInEvent.REMOVE, [file], GuiApi.getInstance())
        }, 500)
        result.push(true)
      } catch (e) {
        result.push(false)
      }
    }
  }
  if (windowManager.has(IWindowList.SETTING_WINDOW)) {
    windowManager.get(IWindowList.SETTING_WINDOW)!.webContents?.send('updateGallery')
  }
  return result
}
