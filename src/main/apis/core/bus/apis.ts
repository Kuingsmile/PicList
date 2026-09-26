import {
  GET_SETTING_WINDOW_ID,
  GET_SETTING_WINDOW_ID_RESPONSE,
  GET_WINDOW_ID,
  GET_WINDOW_ID_REPONSE,
  UPLOAD_WITH_CLIPBOARD_FILES,
  UPLOAD_WITH_CLIPBOARD_FILES_RESPONSE,
  UPLOAD_WITH_FILES,
  UPLOAD_WITH_FILES_RESPONSE,
} from '@core/bus/constants'
import bus from '@core/bus/index'
import windowManager from 'apis/app/window/windowManager'

import { UploadJob, UploadJobError, type UploadJobOptions, withUploadJob } from '~/utils/uploadJob'

export interface UploadBusRequest {
  job: UploadJob
  files?: IFileWithPath[]
}

export interface UploadBusResult {
  jobId: string
  success: boolean
  result?: string[]
  error?: 'failed' | 'cancelled' | 'timeout'
}

function requestUpload(
  requestEvent: string,
  responseEvent: string,
  options: UploadJobOptions = {},
  files?: IFileWithPath[],
): Promise<UploadBusResult> {
  const job = new UploadJob({ ...options, origin: options.origin ?? windowManager.getAvailableWindow()?.webContents })
  return withUploadJob(
    job,
    () =>
      new Promise<UploadBusResult>((resolve, reject) => {
        let settled = false
        const finish = (reply?: UploadBusResult, error?: unknown) => {
          if (settled) return
          settled = true
          bus.removeListener(responseEvent, onResponse)
          job.signal.removeEventListener('abort', onAbort)
          if (reply) resolve(reply)
          else reject(error)
        }
        const onResponse = (reply: UploadBusResult) => {
          if (reply?.jobId !== job.context.id) return
          if (!reply.success) finish(undefined, new UploadJobError(reply.error || 'failed'))
          else finish(reply)
        }
        const onAbort = () => finish(undefined, job.signal.reason)
        bus.on(responseEvent, onResponse)
        job.signal.addEventListener('abort', onAbort, { once: true })
        try {
          job.throwIfStopped()
          bus.emit(requestEvent, { job, files } satisfies UploadBusRequest)
        } catch (error) {
          finish(undefined, error)
        }
      }),
    () => ({
      jobId: job.context.id,
      success: false,
      error: job.signal.reason instanceof UploadJobError ? job.signal.reason.reason : 'failed',
    }),
  )
}

export const uploadWithClipboardFiles = (options?: UploadJobOptions): Promise<UploadBusResult> =>
  requestUpload(UPLOAD_WITH_CLIPBOARD_FILES, UPLOAD_WITH_CLIPBOARD_FILES_RESPONSE, options)

export const uploadWithFiles = (pathList: IFileWithPath[], options?: UploadJobOptions): Promise<UploadBusResult> =>
  requestUpload(UPLOAD_WITH_FILES, UPLOAD_WITH_FILES_RESPONSE, options, pathList)

// get available window id:
// miniWindow or settingWindow or trayWindow
export const getWindowId = (): Promise<number> => {
  return new Promise(resolve => {
    bus.once(GET_WINDOW_ID_REPONSE, (id: number) => {
      resolve(id)
    })
    bus.emit(GET_WINDOW_ID)
  })
}

// get settingWindow id:
export const getSettingWindowId = (): Promise<number> => {
  return new Promise(resolve => {
    bus.once(GET_SETTING_WINDOW_ID_RESPONSE, (id: number) => {
      resolve(id)
    })
    bus.emit(GET_SETTING_WINDOW_ID)
  })
}
