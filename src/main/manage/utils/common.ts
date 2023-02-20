import fs from 'fs-extra'
import path from 'path'
import mime from 'mime-types'
import axios from 'axios'
import { app } from 'electron'
import crypto from 'crypto'
import got, { RequestError } from 'got'
import { Stream } from 'stream'
import { promisify } from 'util'
import UpDownTaskQueue,
{
  uploadTaskSpecialStatus,
  commonTaskStatus,
  downloadTaskSpecialStatus
} from '../datastore/upDownTaskQueue'
import { ManageLogger } from '../utils/logger'
import { formatHttpProxy } from '@/manage/utils/common'
import { HttpsProxyAgent, HttpProxyAgent } from 'hpagent'

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

export const isInputConfigValid = (config: any): boolean => {
  if (
    typeof config === 'object' &&
    !Array.isArray(config) &&
    Object.keys(config).length > 0
  ) {
    return true
  }
  return false
}

export const getFileMimeType = (filePath: string): string => {
  return mime.lookup(filePath) || 'application/octet-stream'
}

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

export const gotDownload = async (
  instance: UpDownTaskQueue,
  preSignedUrl: string,
  fileStream: fs.WriteStream,
  id : string,
  savedFilePath: string,
  logger?: ManageLogger,
  param?: any,
  agent: any = {}
) => {
  got(
    preSignedUrl,
    {
      isStream: true,
      throwHttpErrors: false,
      searchParams: param,
      agent: agent || {}
    }
  )
    .on('downloadProgress', (progress: any) => {
      instance.updateDownloadTask({
        id,
        progress: Math.floor(progress.percent * 100),
        status: downloadTaskSpecialStatus.downloading
      })
    })
    .pipe(fileStream)
    .on('close', () => {
      instance.updateDownloadTask({
        id,
        progress: 100,
        status: downloadTaskSpecialStatus.downloaded,
        finishTime: new Date().toLocaleString()
      })
    })
    .on('error', (err: any) => {
      logger && logger.error(formatError(err, { method: 'gotDownload' }))
      fs.remove(savedFilePath)
      instance.updateDownloadTask({
        id,
        progress: 0,
        status: commonTaskStatus.failed,
        response: formatError(err, { method: 'gotDownload' }),
        finishTime: new Date().toLocaleString()
      })
    })
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
        progress: res && (res.statusCode === 200 || res.statusCode === 201) ? 100 : 0,
        status: res && (res.statusCode === 200 || res.statusCode === 201) ? uploadTaskSpecialStatus.uploaded : commonTaskStatus.failed,
        finishTime: new Date().toLocaleString()
      })
    })
    .catch((err: any) => {
      logger && logger.error(formatError(err, { method: 'gotUpload' }))
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
  } else {
    if (typeof err === 'object') {
      return JSON.stringify(err) + JSON.stringify(params)
    } else {
      return String(err) + JSON.stringify(params)
    }
  }
}

export const trimPath = (path: string) => path.replace(/^\/+|\/+$/g, '').replace(/\/+/g, '/')

export const getAgent = (proxy:any, https: boolean = true) => {
  const formatProxy = formatHttpProxy(proxy, 'string') as any
  if (https) {
    return formatProxy
      ? {
        https: new HttpsProxyAgent({
          keepAlive: true,
          keepAliveMsecs: 1000,
          rejectUnauthorized: false,
          scheduling: 'lifo' as 'lifo' | 'fifo' | undefined,
          proxy: formatProxy.replace('127.0.0.1', 'localhost')
        })
      }
      : {}
  } else {
    return formatProxy
      ? {
        http: new HttpProxyAgent({
          keepAlive: true,
          keepAliveMsecs: 1000,
          scheduling: 'lifo' as 'lifo' | 'fifo' | undefined,
          proxy: formatProxy.replace('127.0.0.1', 'localhost')
        })
      }
      : {}
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
) {
  const options = {
    method: method?.toUpperCase(),
    headers,
    searchParams,
    agent: getAgent(proxy),
    timeout: {
      request: timeout || 30000
    },
    body,
    throwHttpErrors: false,
    responseType
  } as IStringKeyMap
  Object.keys(options).forEach(key => {
    options[key] === undefined && delete options[key]
  })
  return options
}
