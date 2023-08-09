import fs from 'fs-extra'
import path from 'path'
import mime from 'mime-types'
import axios from 'axios'
import { app } from 'electron'
import crypto from 'crypto'
import got, { OptionsOfTextResponseBody, RequestError } from 'got'
import { Stream } from 'stream'
import { promisify } from 'util'
import UpDownTaskQueue,
{
  uploadTaskSpecialStatus,
  commonTaskStatus,
  downloadTaskSpecialStatus
} from '../datastore/upDownTaskQueue'
import { ManageLogger } from '../utils/logger'
import { formatHttpProxy, IHTTPProxy } from '@/manage/utils/common'
import { HttpsProxyAgent, HttpProxyAgent } from 'hpagent'
import http from 'http'
import https from 'https'
import Downloader from 'nodejs-file-downloader'

export const getFSFile = async (
  filePath: string,
  stream: boolean = false
): Promise<IStringKeyMap> => {
  try {
    return {
      extension: path.extname(filePath),
      fileName: path.basename(filePath),
      buffer: stream
        ? fs.createReadStream(filePath)
        : await fs.readFile(filePath),
      success: true
    }
  } catch (e) {
    return {
      success: false
    }
  }
}

export function isInputConfigValid (config: any): boolean {
  return typeof config === 'object' &&
    !Array.isArray(config) &&
    Object.keys(config).length > 0
}

export const getFileMimeType = (filePath: string): string => mime.lookup(filePath) || 'application/octet-stream'

const checkTempFolderExist = async () => {
  const tempPath = path.join(app.getPath('downloads'), 'piclistTemp')
  try {
    await fs.access(tempPath)
  } catch (e) {
    await fs.mkdir(tempPath)
  }
}

export const downloadFileFromUrl = async (urls: string[]) => {
  const tempPath = path.join(app.getPath('downloads'), 'piclistTemp')
  await checkTempFolderExist()
  const result = [] as string[]
  for (let i = 0; i < urls.length; i++) {
    const finishDownload = promisify(Stream.finished)
    const fileName = path.basename(urls[i]).split('?')[0]
    const filePath = path.join(tempPath, fileName)
    const writer = fs.createWriteStream(filePath)
    const res = await axios({
      method: 'get',
      url: urls[i],
      responseType: 'stream'
    })
    res.data.pipe(writer)
    await finishDownload(writer)
    result.push(filePath)
  }
  return result
}

export const clearTempFolder = () => fs.emptyDirSync(path.join(app.getPath('downloads'), 'piclistTemp'))

export const md5 = (str: string, code: 'hex' | 'base64'): string => crypto.createHash('md5').update(str).digest(code)

export const hmacSha1Base64 = (secretKey: string, stringToSign: string) : string => crypto.createHmac('sha1', secretKey).update(Buffer.from(stringToSign, 'utf8')).digest('base64')

export const NewDownloader = async (
  instance: UpDownTaskQueue,
  preSignedUrl: string,
  id : string,
  savedFilePath: string,
  logger?: ManageLogger,
  proxy?: string,
  headers?: any
) : Promise<boolean> => {
  const options = {
    url: preSignedUrl,
    directory: path.dirname(savedFilePath),
    fileName: path.basename(savedFilePath),
    cloneFiles: false,
    onProgress: (percentage: string) => {
      instance.updateDownloadTask({
        id,
        progress: Math.floor(Number(percentage)),
        status: downloadTaskSpecialStatus.downloading
      })
    },
    maxAttempts: 3
  } as any
  if (proxy) {
    options.proxy = proxy
  }
  if (headers) {
    options.headers = headers
  }
  const downloader = new Downloader(options)
  try {
    await downloader.download()
    instance.updateDownloadTask({
      id,
      progress: 100,
      status: downloadTaskSpecialStatus.downloaded,
      finishTime: new Date().toLocaleString()
    })
    return true
  } catch (e: any) {
    logger?.error(formatError(e, { method: 'NewDownloader' }))
    fs.remove(savedFilePath)
    instance.updateDownloadTask({
      id,
      progress: 0,
      status: commonTaskStatus.failed,
      response: formatError(e, { method: 'NewDownloader' }),
      finishTime: new Date().toLocaleString()
    })
    return false
  }
}

export const gotUpload = async (
  instance: UpDownTaskQueue,
  url: string,
  method: 'PUT' | 'POST',
  body: any,
  headers: any,
  id: string,
  logger?: ManageLogger,
  timeout: number = 30000,
  throwHttpErrors: boolean = false,
  agent: any = {}
) => {
  got(
    url,
    {
      headers,
      method,
      body,
      timeout: {
        lookup: timeout
      },
      throwHttpErrors,
      agent
    }
  )
    .on('uploadProgress', (progress: any) => {
      instance.updateUploadTask({
        id,
        progress: Math.floor(progress.percent * 100),
        status: uploadTaskSpecialStatus.uploading
      })
    })
    .then((res: any) => {
      instance.updateUploadTask({
        id,
        progress: res?.statusCode === 200 || res?.statusCode === 201 ? 100 : 0,
        status: res?.statusCode === 200 || res?.statusCode === 201 ? uploadTaskSpecialStatus.uploaded : commonTaskStatus.failed,
        finishTime: new Date().toLocaleString()
      })
    })
    .catch((err: any) => {
      logger?.error(formatError(err, { method: 'gotUpload' }))
      instance.updateUploadTask({
        id,
        progress: 0,
        response: formatError(err, { method: 'gotUpload' }),
        status: commonTaskStatus.failed,
        finishTime: new Date().toLocaleString()
      })
    })
}

export const formatError = (err: any, params:IStringKeyMap) => {
  if (err instanceof RequestError) {
    return {
      ...params,
      message: err.message ?? '',
      name: 'RequestError',
      code: err.code,
      stack: err.stack ?? '',
      timings: err.timings ?? {}
    }
  } else if (err instanceof Error) {
    return {
      ...params,
      name: err.name ?? '',
      message: err.message ?? '',
      stack: err.stack ?? ''
    }
  }
  if (typeof err === 'object') {
    return `${JSON.stringify(err)}${JSON.stringify(params)}`
  }
  return `${String(err)}${JSON.stringify(params)}`
}

export const trimPath = (path: string) => path.replace(/^\/+|\/+$/g, '').replace(/\/+/g, '/')

const commonOptions = {
  keepAlive: true,
  keepAliveMsecs: 1000,
  scheduling: 'lifo' as 'lifo' | 'fifo' | undefined
} as any

export const getAgent = (proxy:any, https: boolean = true): {
  https?: HttpsProxyAgent
  http?: HttpProxyAgent
} => {
  const formatProxy = formatHttpProxy(proxy, 'string') as any
  const commonResult = {
    https: undefined,
    http: undefined
  }
  if (!formatProxy) return commonResult
  commonOptions.proxy = formatProxy.replace('127.0.0.1', 'localhost')
  if (https) {
    return {
      https: new HttpsProxyAgent({
        ...commonOptions,
        rejectUnauthorized: false
      }),
      http: undefined
    }
  }
  return {
    http: new HttpProxyAgent({
      ...commonOptions
    }),
    https: undefined
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
          port: formatProxy.port
        })
      }
      : {
        agent: new https.Agent({
          rejectUnauthorized: false,
          keepAlive: true
        })
      }
  }
  return formatProxy
    ? {
      agent: new http.Agent({
        ...commonOptions,
        host: formatProxy.host,
        port: formatProxy.port
      })
    }
    : {
      agent: new http.Agent({
        ...commonOptions
      })
    }
}

export function getOptions (
  method?: string,
  headers?: IStringKeyMap,
  searchParams?: IStringKeyMap,
  responseType?: string,
  body?: any,
  timeout?: number,
  proxy?: any
): OptionsOfTextResponseBody {
  return {
    ...(method && { method: method.toUpperCase() }),
    ...(headers && { headers }),
    ...(searchParams && { searchParams }),
    ...(body && { body }),
    ...(responseType && { responseType }),
    ...(timeout !== undefined ? { timeout: { request: timeout } } : { timeout: { request: 30000 } }),
    ...(proxy && { agent: Object.fromEntries(Object.entries(getAgent(proxy)).filter(([, v]) => v !== undefined)) }),
    throwHttpErrors: false
  }
}

export const formatEndpoint = (endpoint: string, sslEnabled: boolean): string =>
  !/^https?:\/\//.test(endpoint)
    ? `${sslEnabled ? 'https' : 'http'}://${endpoint}`
    : sslEnabled
      ? endpoint.replace('http://', 'https://')
      : endpoint.replace('https://', 'http://')

export class ConcurrencyPromisePool {
  limit: number
  queue: any[]
  runningNum: number
  results: any[]

  constructor (limit: number) {
    this.limit = limit
    this.queue = []
    this.runningNum = 0
    this.results = []
  }

  all (promises: any[] = []) {
    return new Promise((resolve, reject) => {
      for (const promise of promises) {
        this._run(promise, resolve, reject)
      }
    })
  }

  _run (promise: any, resolve: any, reject: any) {
    if (this.runningNum >= this.limit) {
      this.queue.push(promise)
      return
    }
    this.runningNum += 1
    promise()
      .then((res: any) => {
        this.results.push(res)
        --this.runningNum
        if (this.queue.length === 0 && this.runningNum === 0) {
          return resolve(this.results)
        }
        if (this.queue.length > 0) {
          this._run(this.queue.shift(), resolve, reject)
        }
      })
      .catch(reject)
  }
}
