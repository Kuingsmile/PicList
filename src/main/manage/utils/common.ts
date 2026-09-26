import crypto from 'node:crypto'
import http from 'node:http'
import https from 'node:https'
import path from 'node:path'
import type { Readable } from 'node:stream'
import { finished, pipeline } from 'node:stream/promises'

import fs from 'fs-extra'
import got, { OptionsOfTextResponseBody, RequestError } from 'got'
import { HttpProxyAgent, HttpsProxyAgent } from 'hpagent'
import mime from 'mime'

import { isS3SignedUrl } from '#/utils/url'
import UpDownTaskQueue from '~/manage/datastore/upDownTaskQueue'
import { ManageLogger } from '~/manage/utils/logger'
import { formatHttpProxy } from '~/utils/common'
import { commonTaskStatus, downloadTaskSpecialStatus, uploadTaskSpecialStatus } from '~/utils/enum'

import {
  createDownloadDestination,
  type DownloadConflictPolicy,
  type DownloadDestination,
  DownloadPathError,
  downloadToFile,
  type DownloadTransfer,
  resolveDownloadPath,
} from './downloadFile'

export { clearTempFolder, downloadFileFromUrl } from './urlImportFiles'

export const getFSFile = async (filePath: string, stream: boolean = false): Promise<IStringKeyMap> => {
  try {
    return {
      extension: path.extname(filePath),
      fileName: path.basename(filePath),
      buffer: stream ? fs.createReadStream(filePath) : await fs.readFile(filePath),
      success: true,
    }
  } catch (_e) {
    return {
      success: false,
    }
  }
}

export function isInputConfigValid(config: any): boolean {
  return typeof config === 'object' && !Array.isArray(config) && Object.keys(config).length > 0
}

export const getFileMimeType = (filePath: string): string => mime.getType(filePath) || 'application/octet-stream'

export const md5 = (str: string, code: 'hex' | 'base64'): string => crypto.createHash('md5').update(str).digest(code)

export const hmacSha1Base64 = (secretKey: string, stringToSign: string): string =>
  crypto.createHmac('sha1', secretKey).update(Buffer.from(stringToSign, 'utf8')).digest('base64')

// Download errors can contain signed URLs, credentials or response bodies. Keep
// task responses and logs limited to a safe reason and an optional system code.
const downloadError = (error: unknown) => ({
  name: 'DownloadError',
  method: 'downloadBucketFile',
  message: error instanceof DownloadPathError ? error.message : 'Download failed',
  ...((error as NodeJS.ErrnoException)?.code && /^[A-Z0-9_]+$/.test((error as NodeJS.ErrnoException).code!)
    ? { code: (error as NodeJS.ErrnoException).code }
    : {}),
})

const failDownloadTask = (instance: UpDownTaskQueue, id: string, error: unknown, logger?: ManageLogger) => {
  const response = downloadError(error)
  logger?.error(response)
  instance.updateDownloadTask({
    id,
    progress: 0,
    status: commonTaskStatus.failed,
    response,
    finishTime: new Date().toLocaleString(),
  })
}

export function createDownloadTask(
  instance: UpDownTaskQueue,
  id: string,
  root: string,
  fileName: string,
  policy: DownloadConflictPolicy = 'rename',
  logger?: ManageLogger,
): DownloadDestination | undefined {
  if (instance.getDownloadTask(id)) return undefined
  instance.addDownloadTask({ id, progress: 0, status: commonTaskStatus.queuing, sourceFileName: fileName })
  try {
    const destination = createDownloadDestination(root, fileName, policy)
    instance.updateDownloadTask({ id, targetFilePath: resolveDownloadPath(root, fileName) })
    return destination
  } catch (error) {
    failDownloadTask(instance, id, error, logger)
    return undefined
  }
}

export const runDownloadTask = async (
  instance: UpDownTaskQueue,
  id: string,
  destination: DownloadDestination,
  transfer: DownloadTransfer,
  logger?: ManageLogger,
): Promise<boolean> => {
  try {
    const result = await downloadToFile(destination, transfer)
    instance.updateDownloadTask({
      id,
      progress: 100,
      status: downloadTaskSpecialStatus.downloaded,
      targetFilePath: result.filePath,
      response: { skipped: result.skipped },
      finishTime: new Date().toLocaleString(),
    })
    return true
  } catch (error) {
    failDownloadTask(instance, id, error, logger)
    return false
  }
}

export const NewDownloader = async (
  instance: UpDownTaskQueue,
  preSignedUrl: string,
  id: string,
  destination: DownloadDestination,
  logger?: ManageLogger,
  proxy?: string,
  headers?: any,
): Promise<boolean> =>
  runDownloadTask(
    instance,
    id,
    destination,
    async (_partPath, createWriteStream) => {
      const url = isS3SignedUrl(preSignedUrl) ? preSignedUrl : encodeURI(preSignedUrl)
      for (let attempt = 0; attempt < 3; attempt++) {
        const output = createWriteStream()
        try {
          const stream = got.stream(url, {
            headers,
            ...(proxy && { agent: getAgent(proxy, url.startsWith('https:')) }),
            timeout: { socket: 6000 },
            // Retry the entire pipeline so failed attempts cannot append data.
            retry: { limit: 0 },
          })
          stream.on('downloadProgress', progress => {
            instance.updateDownloadTask({
              id,
              progress: Math.min(99, Math.floor(progress.percent * 100)),
              status: downloadTaskSpecialStatus.downloading,
            })
          })
          await pipeline(stream, output)
          return
        } catch (error) {
          output.destroy()
          await finished(output).catch(() => {})
          if (attempt === 2) throw error
        }
      }
    },
    logger,
  )

type UploadFailureReason = 'request' | 'timeout' | 'http' | 'response' | 'provider' | 'aborted'

export type UploadResult =
  | { success: true; status: 'uploaded'; statusCode: number }
  | { success: false; status: 'failed' | 'canceled'; reason: UploadFailureReason; statusCode?: number }

interface UploadRequest extends Pick<OptionsOfTextResponseBody, 'body' | 'headers' | 'agent'> {
  url: string
  method: 'PUT' | 'POST'
  // FormData does not close its underlying file when the request is aborted.
  source?: Readable
}

export interface UploadOptions {
  // Prepare inside the task boundary so file-read and signing errors also finish the task.
  prepare: () => UploadRequest
  validateResponse: (body: unknown, statusCode: number) => boolean
  signal?: AbortSignal
  timeout?: { request?: number; response?: number }
  logger?: ManageLogger
}

export const isUploadResponseObject = (value: unknown): value is Record<string, unknown> =>
  typeof value === 'object' && value !== null && !Array.isArray(value)

export const isUploadResponseString = (value: unknown): value is string =>
  typeof value === 'string' && value.trim().length > 0

export const gotUpload = async (
  instance: UpDownTaskQueue,
  id: string,
  { prepare, validateResponse, signal, timeout, logger }: UploadOptions,
): Promise<UploadResult> => {
  let request: UploadRequest | undefined
  let statusCode: number | undefined
  let settled = false
  let result: UploadResult
  const fail = (reason: UploadFailureReason): UploadResult => ({
    success: false,
    status: reason === 'aborted' ? 'canceled' : 'failed',
    reason,
    ...(statusCode === undefined ? {} : { statusCode }),
  })
  try {
    signal?.throwIfAborted()
    request = prepare()
    signal?.throwIfAborted()
    const { url, source: _source, ...options } = request
    const response = await got(url, {
      ...options,
      signal,
      timeout: {
        lookup: 30000,
        request: timeout?.request ?? 30000,
        response: timeout?.response ?? 30000,
      },
      // Uploads may create commits or consume streams; never replay them automatically.
      retry: { limit: 0 },
      followRedirect: false,
      throwHttpErrors: false,
    }).on('uploadProgress', progress => {
      if (settled || signal?.aborted) return
      instance.updateUploadTask({
        id,
        progress: Math.min(99, Math.floor(progress.percent * 100)),
        status: uploadTaskSpecialStatus.uploading,
      })
    })
    statusCode = response.statusCode
    signal?.throwIfAborted()
    if (statusCode < 200 || statusCode >= 300) {
      result = fail('http')
    } else {
      try {
        const body: unknown = JSON.parse(response.body)
        // A validator throwing is an invalid provider response, never an upload success.
        result = validateResponse(body, statusCode)
          ? { success: true, status: 'uploaded', statusCode }
          : fail('provider')
      } catch {
        result = fail('response')
      }
    }
  } catch (error) {
    result = fail(
      signal?.aborted ? 'aborted' : error instanceof RequestError && error.code === 'ETIMEDOUT' ? 'timeout' : 'request',
    )
  } finally {
    settled = true
    if (request?.source) {
      request.source.destroy()
      await finished(request.source, { cleanup: true }).catch(() => {})
    }
  }
  // Cancellation can also arrive while the input file is closing.
  if (signal?.aborted) result = fail('aborted')
  // Never persist/log raw errors or provider bodies: they can contain credentials or file contents.
  instance.updateUploadTask({
    id,
    progress: result.success ? 100 : 0,
    status: result.status,
    response: result,
    finishTime: new Date().toLocaleString(),
  })
  if (!result.success && result.status !== 'canceled') {
    try {
      logger?.error(JSON.stringify({ method: 'gotUpload', ...result }))
    } catch {} // Logging must not change a completed upload result.
  }
  return result
}

export const formatError = (err: any, params: IStringKeyMap) => {
  if (err instanceof RequestError) {
    return {
      ...params,
      message: err.message ?? '',
      name: 'RequestError',
      code: err.code,
      stack: err.stack ?? '',
      timings: err.timings ?? {},
    }
  } else if (err instanceof Error) {
    return {
      ...params,
      name: err.name ?? '',
      message: err.message ?? '',
      stack: err.stack ?? '',
    }
  }
  if (typeof err === 'object') {
    return `${JSON.stringify(err)}${JSON.stringify(params)}`
  }
  return `${String(err)}${JSON.stringify(params)}`
}

const commonOptions = {
  keepAlive: true,
  keepAliveMsecs: 1000,
  scheduling: 'lifo' as 'lifo' | 'fifo' | undefined,
} as any

export const getAgent = (
  proxy: any,
  https: boolean = true,
): {
  https?: HttpsProxyAgent
  http?: HttpProxyAgent
} => {
  const formatProxy = formatHttpProxy(proxy, 'string') as any
  const commonResult = {
    https: undefined,
    http: undefined,
  }
  if (!formatProxy) return commonResult
  commonOptions.proxy = formatProxy.replace('127.0.0.1', 'localhost')
  if (https) {
    return {
      https: new HttpsProxyAgent({
        ...commonOptions,
        rejectUnauthorized: false,
      }),
      http: undefined,
    }
  }
  return {
    http: new HttpProxyAgent({
      ...commonOptions,
    }),
    https: undefined,
  }
}

export const getInnerAgent = (proxy: any, sslEnabled: boolean = true) => {
  const formatProxy = formatHttpProxy(proxy, 'object') as IHTTPProxy
  if (sslEnabled) {
    return formatProxy
      ? {
          agent: new https.Agent({
            ...commonOptions,
            rejectUnauthorized: false,
            host: formatProxy.host,
            port: formatProxy.port,
          }),
        }
      : {
          agent: new https.Agent({
            rejectUnauthorized: false,
            keepAlive: true,
          }),
        }
  }
  return formatProxy
    ? {
        agent: new http.Agent({
          ...commonOptions,
          host: formatProxy.host,
          port: formatProxy.port,
        }),
      }
    : {
        agent: new http.Agent({
          ...commonOptions,
        }),
      }
}

export function getOptions(
  method?: string,
  headers?: IStringKeyMap,
  searchParams?: IStringKeyMap,
  responseType?: string,
  body?: any,
  timeout?: number,
  proxy?: any,
): OptionsOfTextResponseBody {
  return {
    ...(method && { method: method.toUpperCase() }),
    ...(headers && { headers }),
    ...(searchParams && { searchParams }),
    ...(body && { body }),
    ...(responseType && { responseType }),
    ...(timeout !== undefined ? { timeout: { request: timeout } } : { timeout: { request: 30000 } }),
    ...(proxy && {
      agent: Object.fromEntries(Object.entries(getAgent(proxy)).filter(([, v]) => v !== undefined)),
    }),
    throwHttpErrors: false,
  }
}

export class ConcurrencyPromisePool {
  readonly limit: number
  queue: (() => void)[]
  runningNum: number

  constructor(limit: number) {
    if (!Number.isInteger(limit) || limit <= 0) {
      throw new RangeError('Concurrency limit must be a positive integer')
    }
    this.limit = limit
    this.queue = []
    this.runningNum = 0
  }

  // Reject on the first failure, while allowing all queued tasks to finish.
  all<T>(tasks: (() => T | PromiseLike<T>)[] = []): Promise<T[]> {
    return Promise.all(tasks.map(task => this._run(task)))
  }

  private _run<T>(task: () => T | PromiseLike<T>): Promise<T> {
    return new Promise((resolve, reject) => {
      const run = () => {
        this.runningNum += 1
        Promise.resolve()
          .then(task)
          .then(resolve, reject)
          .finally(() => {
            --this.runningNum
            this.queue.shift()?.()
          })
      }

      if (this.runningNum >= this.limit) {
        this.queue.push(run)
      } else {
        run()
      }
    })
  }
}
