import router from './router'
import {
  handleResponse
} from './utils'
import logger from '@core/picgo/logger'
import windowManager from 'apis/app/window/windowManager'
import { uploadChoosedFiles, uploadClipboardFiles, deleteChoosedFiles } from 'apis/app/uploader/apis'
import path from 'path'
import { dbPathDir } from 'apis/core/datastore/dbChecker'
import picgo from '@core/picgo'
import { changeCurrentUploader } from '../utils/handleUploaderConfig'
import { app } from 'electron'
import fs from 'fs-extra'
import { AESHelper } from '../utils/aesHelper'

const appPath = app.getPath('userData')
const serverTempDir = path.join(appPath, 'serverTemp')

const STORE_PATH = dbPathDir()
const LOG_PATH = path.join(STORE_PATH, 'piclist.log')

const errorMessage = `upload error. see ${LOG_PATH} for more detail.`
const deleteErrorMessage = `delete error. see ${LOG_PATH} for more detail.`

router.post('/upload', async ({
  response,
  list = [],
  urlparams
} : {
  response: IHttpResponse,
  list?: string[],
  urlparams?: URLSearchParams
}): Promise<void> => {
  try {
    const picbed = urlparams?.get('picbed')
    const passedKey = urlparams?.get('key')
    const serverKey = picgo.getConfig('settings.serverKey') || ''
    if (serverKey && passedKey !== serverKey) {
      handleResponse({
        response,
        body: {
          success: false,
          message: 'server key is not correct'
        }
      })
      return
    }
    let currentPicBedType = ''
    let currentPicBedConfig = {} as IStringKeyMap
    let currentPicBedConfigId = ''
    let needRestore = false
    if (picbed) {
      const configName = urlparams?.get('configName') || 'Default'
      const currentPicBed = picgo.getConfig<IStringKeyMap>('picBed') || {} as IStringKeyMap
      currentPicBedType = currentPicBed?.current
      currentPicBedConfig = currentPicBed?.[currentPicBedType]
      currentPicBedConfigId = currentPicBedConfig?._id
      if (picbed === currentPicBedType && configName === currentPicBedConfig._configName) {
        // do nothing
      } else {
        needRestore = true
        const picBeds = picgo.getConfig<IStringKeyMap>('uploader')
        const currentPicBedList = picBeds?.[picbed]?.configList
        if (currentPicBedList) {
          const currentConfig = currentPicBedList?.find((item: any) => item._configName === configName)
          if (currentConfig) {
            changeCurrentUploader(picbed, currentConfig, currentConfig._id)
          }
        }
      }
    }
    if (list.length === 0) {
      // upload with clipboard
      logger.info('[PicList Server] upload clipboard file')
      const result = await uploadClipboardFiles()
      const res = result.url
      const fullResult = result.fullResult
      logger.info('[PicList Server] upload result:', res)
      if (res) {
        const treatedFullResult = {
          isAESEncrypted: 1,
          AESEncryptedData: new AESHelper().encrypt(JSON.stringify(fullResult)),
          ...fullResult
        }
        delete treatedFullResult.config
        handleResponse({
          response,
          body: {
            success: true,
            result: [res],
            fullResult: [treatedFullResult]
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
        const treatedItem = {
          isAESEncrypted: 1,
          AESEncryptedData: new AESHelper().encrypt(JSON.stringify(item.fullResult)),
          ...item.fullResult
        }
        delete treatedItem.config
        return treatedItem
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
    fs.emptyDirSync(serverTempDir)
    if (needRestore) {
      changeCurrentUploader(currentPicBedType, currentPicBedConfig, currentPicBedConfigId)
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
    // 区分是否是aes加密的数据，如果不是直接传入list，如果是，解密后再传入
    const treatList = list.map(item => {
      if (item.isAESEncrypted) {
        const aesHelper = new AESHelper()
        const data = aesHelper.decrypt(item.AESEncryptedData)
        return JSON.parse(data)
      } else {
        return item
      }
    })
    const result = await deleteChoosedFiles(treatList)
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
