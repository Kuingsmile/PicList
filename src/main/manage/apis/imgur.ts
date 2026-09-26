import path from 'node:path'

import FormData from 'form-data'
import fs from 'fs-extra'
import got from 'got'

import UpDownTaskQueue from '~/manage/datastore/upDownTaskQueue'
import type { ListingContext } from '~/manage/listingRequest'
import { TransferError } from '~/manage/transferScheduler'
import {
  ConcurrencyPromisePool,
  createDownloadTask,
  formatError,
  getAgent,
  getFileMimeType,
  getOptions,
  gotUpload,
  isUploadResponseObject,
  isUploadResponseString,
  NewDownloader,
} from '~/manage/utils/common'
import ManageLogger from '~/manage/utils/logger'
import { MIB, scheduleUploadBatch } from '~/manage/utils/uploadFile'
import { formatHttpProxy, isImage } from '~/utils/common'

class ImgurApi {
  userName: string
  accessToken: string
  proxy: any
  logger: ManageLogger
  proxyStr: string | undefined
  tokenHeaders: any
  idHeaders: any
  baseUrl = 'https://api.imgur.com/3'

  constructor(userName: string, accessToken: string, proxy: any, logger: ManageLogger) {
    this.userName = userName
    this.accessToken = accessToken.startsWith('Bearer ') ? accessToken : `Bearer ${accessToken}`
    this.proxy = proxy
    this.proxyStr = formatHttpProxy(proxy, 'string') as string | undefined
    this.logger = logger
    this.tokenHeaders = {
      Authorization: this.accessToken,
    }
  }

  formatFile(item: any) {
    const fileName = path.basename(item.link)
    const isImg = isImage(fileName)
    return {
      ...item,
      Key: fileName,
      key: fileName,
      fileName: `${item.name}${path.extname(item.link)}`,
      formatedTime: new Date(item.datetime * 1000).toLocaleString(),
      fileSize: item.size,
      isDir: false,
      checked: false,
      match: false,
      isImage: isImg,
      url: item.link,
      sha: item.deletehash,
    }
  }

  /**
   * get repo list
   */
  async getBucketList(): Promise<any> {
    let initPage = 0
    let res
    const result = [] as any[]
    do {
      res = (await got(
        `${this.baseUrl}/account/${this.userName}/albums/${initPage}`,
        getOptions('GET', this.tokenHeaders, undefined, 'json', undefined, undefined, this.proxy),
      )) as any
      if (!(res.statusCode === 200 && res.body.success)) {
        return []
      }
      result.push(...res.body.data)
      initPage++
    } while (res.body.data.length > 0)
    const finalResult = result.map((item: any) => ({
      ...item,
      Name: item.title,
      Location: item.id,
      CreationDate: item.datetime,
    })) as any[]
    finalResult.push({
      Name: '全部',
      Location: 'unclassified',
      CreationDate: new Date().getTime(),
    })
    return finalResult
  }

  async getBucketListBackstage(configMap: IStringKeyMap, listing: ListingContext): Promise<any> {
    const {
      bucketConfig: { Location: albumHash },
    } = configMap
    let res: any
    const result = {
      fullList: [] as any,
      success: false,
      finished: false,
    }
    if (albumHash !== 'unclassified') {
      res = (await listing.wait(() =>
        got(`${this.baseUrl}/account/${this.userName}/album/${albumHash}`, {
          ...getOptions('GET', this.tokenHeaders, undefined, 'json', undefined, undefined, this.proxy),
          signal: listing.signal,
        }),
      )) as any
      if (res.statusCode === 200 && res.body.success) {
        res.body.data.images.forEach((item: any) => {
          result.fullList.push(this.formatFile(item))
        })
      } else {
        result.finished = true
        await listing.publish(result)
        result.fullList = []
        return
      }
    } else {
      let initPage = 0
      do {
        res = (await listing.wait(() =>
          got(`${this.baseUrl}/account/${this.userName}/images/${initPage}`, {
            ...getOptions('GET', this.tokenHeaders, undefined, 'json', undefined, undefined, this.proxy),
            signal: listing.signal,
          }),
        )) as any
        if (res.statusCode === 200 && res.body.success) {
          res.body.data.forEach((item: any) => {
            result.fullList.push(this.formatFile(item))
          })
          await listing.publish(result)
          result.fullList = []
        } else {
          result.finished = true
          await listing.publish(result)
          result.fullList = []
          return
        }
        initPage++
      } while (res.body.data.length > 0 && !listing.signal.aborted)
    }
    result.success = !listing.signal.aborted
    result.finished = true
    await listing.publish(result)
    result.fullList = []
  }

  async deleteBucketFile(configMap: IStringKeyMap): Promise<boolean> {
    const { DeleteHash: deleteHash } = configMap
    const res = (await got(
      `${this.baseUrl}/account/${this.userName}/image/${deleteHash}`,
      getOptions('DELETE', this.tokenHeaders, undefined, 'json', undefined, undefined, this.proxy),
    )) as any
    return res.statusCode === 200 && res.body.success
  }

  /**
   * 上传文件
   * @param configMap
   */
  async uploadBucketFile(configMap: IStringKeyMap): Promise<boolean> {
    const instance = UpDownTaskQueue.getInstance()
    return scheduleUploadBatch(
      configMap,
      {
        provider: 'imgur',
        account: [this.baseUrl, this.userName, this.accessToken],
        normalizeKey: true,
        maxFileSize: 200 * MIB,
      },
      async (file, { id, signal }) => {
        const { region: albumHash, key, fileName, filePath, fileSize } = file
        const result = await gotUpload(instance, id, {
          prepare: () => {
            const form = new FormData()
            form.append('type', 'file')
            form.append('description', 'uploaded by PicList')
            form.append('name', path.basename(key, path.extname(key)))
            albumHash !== 'unclassified' && form.append('album', albumHash)
            const headers = { ...form.getHeaders(), Authorization: this.accessToken }
            const agent = getAgent(this.proxy)
            const fileOptions = { filename: path.basename(key), contentType: getFileMimeType(fileName) }
            const source = fs.createReadStream(filePath)
            form.append(fileSize > 1024 * 1024 * 10 ? 'video' : 'image', source, fileOptions)
            return { url: `${this.baseUrl}/image`, method: 'POST', body: form, headers, agent, source }
          },
          validateResponse: (body, statusCode) =>
            statusCode === 200 &&
            isUploadResponseObject(body) &&
            body.success === true &&
            body.status === 200 &&
            isUploadResponseObject(body.data) &&
            isUploadResponseString(body.data.id) &&
            isUploadResponseString(body.data.link),
          signal,
          logger: this.logger,
          managed: true,
        })
        if (!result.success) throw new TransferError('provider')
      },
    )
  }

  /**
   * 下载文件
   * @param configMap
   */
  async downloadBucketFile(configMap: IStringKeyMap): Promise<boolean> {
    const { downloadPath, fileArray, maxDownloadFileCount, downloadConflictPolicy = 'rename' } = configMap
    const instance = UpDownTaskQueue.getInstance()
    const promises = [] as any
    for (const item of fileArray) {
      const { bucketName, region, key, fileName, githubUrl: url } = item
      const id = `${bucketName}-${region}-${key}-${fileName}`
      const destination = createDownloadTask(instance, id, downloadPath, fileName, downloadConflictPolicy, this.logger)
      if (!destination) continue
      promises.push(
        () =>
          new Promise((resolve, reject) => {
            NewDownloader(instance, url, id, destination, this.logger, this.proxyStr).then((res: boolean) => {
              if (res) {
                resolve(res)
              } else {
                reject(res)
              }
            })
          }),
      )
    }
    const pool = new ConcurrencyPromisePool(maxDownloadFileCount)
    pool.all(promises).catch(error => {
      this.logger.error(formatError(error, { class: 'ImgurApi', method: 'downloadBucketFile' }))
    })
    return true
  }
}

export default ImgurApi
