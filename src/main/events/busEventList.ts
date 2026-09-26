import bus from '@core/bus'
import type { UploadBusRequest, UploadBusResult } from '@core/bus/apis'
import {
  CREATE_APP_MENU,
  GET_SETTING_WINDOW_ID,
  GET_SETTING_WINDOW_ID_RESPONSE,
  GET_WINDOW_ID,
  GET_WINDOW_ID_REPONSE,
  UPLOAD_WITH_CLIPBOARD_FILES,
  UPLOAD_WITH_CLIPBOARD_FILES_RESPONSE,
  UPLOAD_WITH_FILES,
  UPLOAD_WITH_FILES_RESPONSE,
} from '@core/bus/constants'
import { createMenu } from 'apis/app/system'
import { uploadChoosedFiles, uploadClipboardFiles } from 'apis/app/uploader/apis'
import windowManager from 'apis/app/window/windowManager'

import { IWindowList } from '~/utils/enum'
import { UploadJobError } from '~/utils/uploadJob'

function initEventCenter() {
  const eventList: any = {
    'picgo:upload': () => uploadClipboardFiles(),
    [UPLOAD_WITH_CLIPBOARD_FILES]: busCallUploadClipboardFiles,
    [UPLOAD_WITH_FILES]: busCallUploadFiles,
    [GET_WINDOW_ID]: busCallGetWindowId,
    [GET_SETTING_WINDOW_ID]: busCallGetSettingWindowId,
    [CREATE_APP_MENU]: createMenu,
  }
  for (const i in eventList) {
    bus.on(i, eventList[i])
  }
}

async function replyToUpload(request: UploadBusRequest, event: string, upload: () => Promise<string[]>) {
  let reply: UploadBusResult
  try {
    request.job.throwIfStopped()
    const result = await upload()
    request.job.throwIfStopped()
    reply = { jobId: request.job.context.id, success: result.length > 0, result }
  } catch (error) {
    reply = {
      jobId: request.job.context.id,
      success: false,
      error: error instanceof UploadJobError ? error.reason : 'failed',
    }
  }
  bus.emit(event, reply)
}

async function busCallUploadClipboardFiles(request: UploadBusRequest) {
  await replyToUpload(request, UPLOAD_WITH_CLIPBOARD_FILES_RESPONSE, async () => {
    const result = await uploadClipboardFiles(undefined, request.job)
    return result.url ? [result.url] : []
  })
}

async function busCallUploadFiles(request: UploadBusRequest) {
  await replyToUpload(request, UPLOAD_WITH_FILES_RESPONSE, async () => {
    const result = await uploadChoosedFiles(request.job.context.origin, request.files || [], undefined, request.job)
    return result.map(item => item.url)
  })
}

function busCallGetWindowId() {
  const win = windowManager.getAvailableWindow()
  bus.emit(GET_WINDOW_ID_REPONSE, win?.id)
}

function busCallGetSettingWindowId() {
  const settingWindow = windowManager.get(IWindowList.SETTING_WINDOW)
  bus.emit(GET_SETTING_WINDOW_ID_RESPONSE, settingWindow?.id)
}

export default {
  listen() {
    initEventCenter()
  },
}
