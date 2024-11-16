import { app } from 'electron'
import fs from 'fs-extra'
import http from 'http'
import { marked } from 'marked'
import path from 'path'

import { dbPathDir } from '@core/datastore/dbChecker'
import picgo from '@core/picgo'
import logger from '@core/picgo/logger'

import { AESHelper } from '~/utils/aesHelper'
import { changeCurrentUploader } from '~/utils/handleUploaderConfig'

import { uploadChoosedFiles, uploadClipboardFiles } from 'apis/app/uploader/apis'
import windowManager from 'apis/app/window/windowManager'

import { markdownContent } from '~/server/apiDoc'
import router from '~/server/router'
import { deleteChoosedFiles, handleResponse } from '~/server/utils'

import { configPaths } from '#/utils/configPaths'

const appPath = app.getPath('userData')
const serverTempDir = path.join(appPath, 'serverTemp')

const STORE_PATH = dbPathDir()
const LOG_PATH = path.join(STORE_PATH, 'piclist.log')

const errorMessage = `upload error. see ${LOG_PATH} for more detail.`
const deleteErrorMessage = `delete error. see ${LOG_PATH} for more detail.`

async function responseForGet({ response }: { response: http.ServerResponse }) {
  response.writeHead(200, { 'Content-Type': 'text/html; charset=utf-8' })
  const htmlContent = marked(markdownContent)
  response.write(htmlContent)
  response.end()
}

router.get('/', responseForGet)
router.get('/upload', responseForGet)

router.post(
  '/upload',
  async ({
    response,
    list = [],
    urlparams
  }: {
    response: IHttpResponse
    list?: string[]
    urlparams?: URLSearchParams
  }): Promise<void> => {
    try {
      const picbed = urlparams?.get('picbed')
      const passedKey = urlparams?.get('key')
      const serverKey = picgo.getConfig<string>(configPaths.settings.serverKey) || ''
      const useShortUrl = picgo.getConfig<boolean>(configPaths.settings.useShortUrl)
      if (serverKey && passedKey !== serverKey) {
        handleResponse({
          response,
          body: {
            success: false,
            message: 'server key is uncorrect'
          }
        })
        return
      }
      let currentPicBedType = ''
      let currentPicBedConfig = {} as IStringKeyMap
      let currentPicBedConfigId = ''
      let needRestore = false
      if (picbed) {
        const currentPicBed = picgo.getConfig<IStringKeyMap>('picBed') || ({} as IStringKeyMap)
        currentPicBedType = currentPicBed.uploader || currentPicBed.current || 'smms'
        currentPicBedConfig = currentPicBed[currentPicBedType] || ({} as IStringKeyMap)
        currentPicBedConfigId = currentPicBedConfig._id
        const configName = urlparams?.get('configName') || currentPicBed[picbed]?._configName
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
        const res = useShortUrl ? result.fullResult.shortUrl || result.url : result.url
        const fullResult = result.fullResult
        fullResult.imgUrl = useShortUrl ? fullResult.shortUrl || fullResult.imgUrl : fullResult.imgUrl
        logger.info('[PicList Server] upload result:', res)
        if (res) {
          const treatedFullResult = {
            isEncrypted: 1,
            EncryptedData: new AESHelper().encrypt(JSON.stringify(fullResult)),
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
          return useShortUrl ? item.fullResult.shortUrl || item.url : item.url
        })
        const fullResult = result.map((item: any) => {
          const treatedItem = {
            isEncrypted: 1,
            EncryptedData: new AESHelper().encrypt(JSON.stringify(item.fullResult)),
            ...item.fullResult
          }
          delete treatedItem.config
          treatedItem.imgUrl = useShortUrl ? treatedItem.shortUrl || treatedItem.imgUrl : treatedItem.imgUrl
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
  }
)

router.post(
  '/delete',
  async ({ response, list = [] }: { response: IHttpResponse; list?: IStringKeyMap[] }): Promise<void> => {
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
      const aesHelper = new AESHelper()
      const treatList = list.map(item => {
        if (!item.isEncrypted) return item
        return JSON.parse(aesHelper.decrypt(item.EncryptedData))
      })
      const result = await deleteChoosedFiles(treatList)
      const successCount = result.filter(item => item).length
      const failCount = result.length - successCount
      handleResponse({
        response,
        body: {
          success: !!successCount,
          message: successCount ? `delete success: ${successCount}, fail: ${failCount}` : deleteErrorMessage
        }
      })
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
  }
)

router.any('/heartbeat', async ({ response }: { response: IHttpResponse }) => {
  handleResponse({
    response,
    body: {
      success: true,
      result: 'alive'
    }
  })
})

export default router
