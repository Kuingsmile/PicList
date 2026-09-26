import http from 'node:http'

import { appLogPath } from '@core/datastore/dirs'
import picgo from '@core/picgo'
import logger from '@core/picgo/logger'
import { uploadChoosedFiles, uploadClipboardFiles } from 'apis/app/uploader/apis'
import windowManager from 'apis/app/window/windowManager'
import { marked } from 'marked'

import { markdownContent } from '~/server/apiDoc'
import router from '~/server/router'
import { deleteChoosedFiles, handleResponse } from '~/server/utils'
import { AESHelper } from '~/utils/aesHelper'
import {
  backgroundUploadPreferences,
  finalizeUpload,
  loadUploadFinalization,
  UploadFinalizationError,
} from '~/utils/uploadFinalizer'
import { UploadJob } from '~/utils/uploadJob'
import { isUploadUrl } from '~/utils/uploadResult'

const LOG_PATH = appLogPath()

const errorMessage = `upload error. see ${LOG_PATH} for more detail.`
const deleteErrorMessage = `delete error. see ${LOG_PATH} for more detail.`

function respondToUpload(
  response: IHttpResponse,
  results: IStringKeyMap[],
  useShortUrl: boolean,
  expectedCount = results.length,
) {
  const urls = results.map(item => (useShortUrl ? item.fullResult.shortUrl || item.url : item.url))
  if (!urls.length || urls.length !== expectedCount || !urls.every(isUploadUrl)) {
    handleResponse({ response, body: { success: false, message: errorMessage } })
    return
  }
  const fullResult = results.map(({ fullResult }) => {
    const item = {
      isEncrypted: 1,
      EncryptedData: new AESHelper().encrypt(JSON.stringify(fullResult)),
      ...fullResult,
    }
    delete item.config
    item.imgUrl = useShortUrl ? item.shortUrl || item.imgUrl : item.imgUrl
    return item
  })
  handleResponse({ response, body: { success: true, result: urls, fullResult } })
}

// Upload rate-limiting state
let runningUploads = 0
const uploadWaitQueue: (() => void)[] = []
let lastUploadFinishTime = 0

async function withUploadRateLimit<T>(fn: () => Promise<T>): Promise<T> {
  const allConfig = picgo.getConfig<any>() || {}
  const maxConcurrency: number = allConfig.settings?.serverMaxConcurrency || 0
  const uploadInterval: number = allConfig.settings?.serverUploadInterval || 0
  if (maxConcurrency > 0) {
    if (runningUploads >= maxConcurrency) {
      await new Promise<void>(resolve => uploadWaitQueue.push(resolve))
    }
    runningUploads++
  }

  if (uploadInterval > 0) {
    const wait = uploadInterval - (Date.now() - lastUploadFinishTime)
    if (wait > 0) {
      await new Promise(resolve => setTimeout(resolve, wait))
    }
  }

  try {
    return await fn()
  } finally {
    if (maxConcurrency > 0) {
      runningUploads--
      const next = uploadWaitQueue.shift()
      if (next) next()
    }
    lastUploadFinishTime = Date.now()
  }
}

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
    urlparams,
  }: {
    response: IHttpResponse
    list?: string[]
    urlparams?: URLSearchParams
  }): Promise<void> => {
    try {
      await withUploadRateLimit(async () => {
        const allConfig = picgo.getConfig<any>() || {}
        const uploadOptions = {
          picBed: urlparams?.get('picbed') || undefined,
          configName: urlparams?.get('configName') || undefined,
        }
        const passedKey = urlparams?.get('key')
        const serverKey = allConfig.settings?.serverKey || ''
        const useShortUrl = allConfig.settings?.useShortUrl
        if (serverKey && passedKey !== serverKey) {
          handleResponse({
            response,
            body: {
              success: false,
              message: 'server key is uncorrect',
            },
          })
          return
        }
        const job = new UploadJob({
          profile: uploadOptions,
          origin: windowManager.getAvailableWindow()?.webContents,
        })
        const finalizationId = urlparams?.get('finalizationId')
        if (finalizationId) {
          const state = await loadUploadFinalization(finalizationId)
          if (!state) {
            handleResponse({ response, statusCode: 404, body: { success: false, message: 'Finalization not found' } })
            return
          }
          const results = await job.run(() => finalizeUpload(state, { assertActive: () => job.throwIfStopped() }))
          respondToUpload(response, results, !!useShortUrl)
          return
        }
        if (list.length === 0) {
          logger.info('[PicList Server] upload clipboard file')
          const result = await uploadClipboardFiles(uploadOptions, job, backgroundUploadPreferences)
          if (job.failure) throw job.failure
          respondToUpload(response, [result], !!useShortUrl)
        } else {
          logger.info('[PicList Server] upload files in list')
          const result = await uploadChoosedFiles(
            job.context.origin,
            list.map(path => ({ path })),
            uploadOptions,
            job,
            backgroundUploadPreferences,
          )
          if (job.failure) throw job.failure
          respondToUpload(response, result, !!useShortUrl, list.length)
        }
      })
    } catch (err: any) {
      if (err instanceof UploadFinalizationError) {
        logger.error('[PicList Server] remote upload completed; finalization failed')
        handleResponse({
          response,
          body: {
            success: false,
            stage: 'finalization',
            finalizationId: err.finalization.id,
            message: 'Remote upload completed. Retry with finalizationId to finish without uploading again.',
          },
        })
        return
      }
      logger.error(err)
      handleResponse({
        response,
        body: {
          success: false,
          message: errorMessage,
        },
      })
    }
  },
)

router.post('/delete', async ({ response, list = [] }: { response: IHttpResponse; list?: unknown }): Promise<void> => {
  if (!Array.isArray(list) || list.length === 0) {
    const message = 'delete requires a non-empty list of upload fullResult objects'
    logger.warn(`[PicList Server] ${message}`)
    handleResponse({
      response,
      statusCode: 400,
      body: {
        success: false,
        message,
      },
    })
    return
  }
  try {
    const aesHelper = new AESHelper()
    const treatList: ImgInfo[] = []
    for (const item of list) {
      let decoded = item
      if (item && typeof item === 'object' && item.isEncrypted) {
        decoded = JSON.parse(aesHelper.decrypt(item.EncryptedData))
      }
      if (
        !decoded ||
        typeof decoded !== 'object' ||
        Array.isArray(decoded) ||
        typeof decoded.id !== 'string' ||
        !decoded.id
      ) {
        const message = 'delete requires upload fullResult objects with gallery IDs; URL strings are not supported'
        logger.warn(`[PicList Server] ${message}`)
        handleResponse({ response, statusCode: 400, body: { success: false, message } })
        return
      }
      treatList.push(decoded)
    }
    const result = await deleteChoosedFiles(treatList)
    const successCount = result.filter(item => item).length
    const failCount = result.length - successCount
    if (failCount) logger.warn(`[PicList Server] delete failed for ${failCount} of ${result.length} items`)
    handleResponse({
      response,
      body: {
        success: !!successCount,
        message: successCount ? `delete success: ${successCount}, fail: ${failCount}` : deleteErrorMessage,
      },
    })
  } catch (err: any) {
    logger.error(err)
    handleResponse({
      response,
      body: {
        success: false,
        message: deleteErrorMessage,
      },
    })
  }
})

router.any('/heartbeat', async ({ response }: { response: IHttpResponse }) => {
  handleResponse({
    response,
    body: {
      success: true,
      result: 'alive',
    },
  })
})

export default router
