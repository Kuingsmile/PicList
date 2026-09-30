import { GalleryDB } from '@core/datastore'
import picgo from '@core/picgo'
import logger from '@core/picgo/logger'
import windowManager from 'apis/app/window/windowManager'
import ALLApi from 'apis/delete/allApi'
import GuiApi from 'apis/gui'
import { Notification } from 'electron'

import { t } from '~/i18n/index'
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
    'access-control-allow-origin': '*',
  },
  body = {
    success: false,
  },
}: {
  response: IHttpResponse
  statusCode?: number
  header?: IObj
  body?: any
}) => {
  if (body?.success === false) {
    logger.warn('[PicList Server] request failed, see piclist.log for more detail ↑')
  }
  response.writeHead(statusCode, header)
  response.write(JSON.stringify(body))
  response.end()
}

export const ensureHTTPLink = (url: string): string => {
  return url.startsWith('http') ? url : `http://${url}`
}

export const deleteChoosedFiles = async (list: ImgInfo[]): Promise<boolean[]> => {
  const result: boolean[] = []
  for (const item of list) {
    if (item.id) {
      try {
        const dbStore = GalleryDB.getInstance()
        const file = await dbStore.getById<ImgInfo>(item.id)
        if (!file) {
          logger.warn('[PicList Server] delete failed: gallery record was not found')
          result.push(false)
          continue
        }
        if (picgo.getConfig<boolean>(configPaths.settings.deleteCloudFile)) {
          if (file.type !== undefined && picBedsCanbeDeleted.includes(file.type)) {
            // Keep the saved provider metadata available until remote deletion is acknowledged.
            const deleted = await ALLApi.delete(file)
            try {
              const notification = new Notification({
                title: t(deleted ? 'main.notification.deleteSuccess' : 'main.notification.error'),
                body: deleted
                  ? t('main.notification.cloudSyncDeleteSucceed')
                  : t('main.notification.cloudSyncDeleteFailed'),
              })
              notification.show()
            } catch (_error) {
              logger.warn('[PicList Server] cloud deletion notification failed')
            }
            if (!deleted) {
              logger.warn('[PicList Server] cloud deletion failed; gallery record retained for retry')
              result.push(false)
              continue
            }
          }
        }
        await dbStore.removeById(item.id)
        setTimeout(() => {
          picgo.emit(ICOREBuildInEvent.REMOVE, [file], GuiApi.getInstance())
        }, 500)
        result.push(true)
      } catch (_error) {
        logger.error('[PicList Server] delete failed while deleting the cloud file or updating the gallery')
        result.push(false)
      }
    } else {
      logger.warn('[PicList Server] delete failed: upload result has no gallery ID')
      result.push(false)
    }
  }
  windowManager.get(IWindowList.SETTING_WINDOW)?.webContents?.send('updateGallery')
  return result
}
