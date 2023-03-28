import router from './router'
import {
  handleResponse
} from './utils'
import logger from '@core/picgo/logger'
import windowManager from 'apis/app/window/windowManager'
import { uploadChoosedFiles, uploadClipboardFiles, deleteChoosedFiles } from 'apis/app/uploader/apis'
import path from 'path'
import { dbPathDir } from 'apis/core/datastore/dbChecker'
const STORE_PATH = dbPathDir()
const LOG_PATH = path.join(STORE_PATH, 'piclist.log')
// import AllAPI from '../../renderer/apis/allApi'

const errorMessage = `upload error. see ${LOG_PATH} for more detail.`
const deleteErrorMessage = `delete error. see ${LOG_PATH} for more detail.`

router.post('/upload', async ({
  response,
  list = []
} : {
  response: IHttpResponse,
  list?: string[]
}): Promise<void> => {
  try {
    if (list.length === 0) {
      // upload with clipboard
      logger.info('[PicList Server] upload clipboard file')
      const result = await uploadClipboardFiles()
      const res = result.url
      const fullResult = result.fullResult
      logger.info('[PicList Server] upload result:', res)
      if (res) {
        handleResponse({
          response,
          body: {
            success: true,
            result: [res],
            fullResult: [fullResult]
          }
        })
      } else {
        handleResponse({
          response,
          body: {
            success: false,
            message: errorMessage
          }
        })
      }
    } else {
      logger.info('[PicList Server] upload files in list')
      //  upload with files
      const pathList = list.map(item => {
        return {
          path: item
        }
      })
      const win = windowManager.getAvailableWindow()
      const result = await uploadChoosedFiles(win.webContents, pathList)
      const res = result.map(item => {
        return item.url
      })
      const fullResult = result.map((item: any) => {
        return item.fullResult
      })
      logger.info('[PicList Server] upload result', res.join(' ; '))
      if (res.length) {
        handleResponse({
          response,
          body: {
            success: true,
            result: res,
            fullResult
          }
        })
      } else {
        handleResponse({
          response,
          body: {
            success: false,
            message: errorMessage
          }
        })
      }
    }
  } catch (err: any) {
    logger.error(err)
    handleResponse({
      response,
      body: {
        success: false,
        message: errorMessage
      }
    })
  }
})

router.post('/delete', async ({
  response,
  list = []
} : {
  response: IHttpResponse,
  list?: IStringKeyMap[]
}): Promise<void> => {
  if (list.length === 0) {
    handleResponse({
      response,
      body: {
        success: false,
        message: 'no file to delete'
      }
    })
    return
  }
  try {
    const result = await deleteChoosedFiles(list)
    const successCount = result.filter(item => item).length
    const failCount = result.filter(item => !item).length
    if (successCount) {
      handleResponse({
        response,
        body: {
          success: true,
          message: `delete success: ${successCount}, fail: ${failCount}`
        }
      })
    } else {
      handleResponse({
        response,
        body: {
          success: false,
          message: deleteErrorMessage
        }
      })
    }
  } catch (err: any) {
    logger.error(err)
    handleResponse({
      response,
      body: {
        success: false,
        message: deleteErrorMessage
      }
    })
  }
})

router.post('/heartbeat', async ({
  response
} : {
  response: IHttpResponse,
}) => {
  handleResponse({
    response,
    body: {
      success: true,
      result: 'alive'
    }
  })
})

export default router
