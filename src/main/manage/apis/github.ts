import { setTimeout as delay } from 'node:timers/promises'

import fs from 'fs-extra'
import got from 'got'

import { trimPath } from '#/utils/url'
import UpDownTaskQueue from '~/manage/datastore/upDownTaskQueue'
import type { ListingContext } from '~/manage/listingRequest'
import { TransferError } from '~/manage/transferScheduler'
import {
  ConcurrencyPromisePool,
  createDownloadTask,
  encodeObjectPath,
  formatError,
  getAgent,
  getOptions,
  getPublicObjectUrl,
  gotUpload,
  isUploadResponseObject,
  isUploadResponseString,
  NewDownloader,
} from '~/manage/utils/common'
import { ManageLogger } from '~/manage/utils/logger'
import { MIB, scheduleUploadBatch } from '~/manage/utils/uploadFile'
import { isImage } from '~/utils/filesystem'
import { formatHttpProxy } from '~/utils/network'

class GithubApi {
  token: string
  username: string
  logger: ManageLogger
  proxy: any
  proxyStr: string | undefined
  baseUrl = 'https://api.github.com'
  commonHeaders: IStringKeyMap

  constructor(token: string, username: string, proxy: string | undefined, logger: ManageLogger) {
    this.logger = logger
    this.token = token.startsWith('Bearer ') ? token : `Bearer ${token}`.trim()
    this.username = username
    this.proxy = proxy
    this.proxyStr = formatHttpProxy(proxy, 'string') as string | undefined
    this.commonHeaders = {
      Authorization: this.token,
      Accept: 'application/vnd.github+json',
    }
  }

  private repositoryUrl(fullName: string): string {
    if (!/^[\w.-]+\/[\w.-]+$/.test(fullName)) throw new Error('Expected a GitHub repository in owner/repo format')
    return `${this.baseUrl}/repos/${fullName}`
  }

  private contentsUrl(fullName: string, key: string): string {
    return `${this.repositoryUrl(fullName)}/contents/${encodeObjectPath(trimPath(key))}`
  }

  private publicUrl(key: string, branch: string, fullName: string, cdnUrl?: string): string {
    const placeholder = /\{(username|repo|branch|path)\}/g
    if (cdnUrl && placeholder.test(cdnUrl)) {
      const [owner, repo] = fullName.split('/')
      const values: Record<string, string> = { username: owner, repo, branch, path: encodeObjectPath(key) }
      return cdnUrl.replace(placeholder, (_, name: string) => values[name])
    }
    return getPublicObjectUrl(cdnUrl || `https://raw.githubusercontent.com/${fullName}/${branch}`, key)
  }

  formatFolder(item: any, slicedPrefix: string, branch: string, repo: string, cdnUrl: string | undefined) {
    const key = `${slicedPrefix ? `${slicedPrefix}/` : ''}${item.path}/`
    return {
      ...item,
      Key: key,
      url: this.publicUrl(key, branch, repo, cdnUrl),
      key,
      fileSize: 0,
      formatedTime: '',
      fileName: item.path,
      isDir: true,
      checked: false,
      isImage: false,
      match: false,
    }
  }

  formatFile(item: any, slicedPrefix: string, branch: string, repo: string, cdnUrl: string | undefined) {
    const key = slicedPrefix === '' ? item.path : `${slicedPrefix}/${item.path}`
    return {
      ...item,
      Key: key,
      key,
      fileSize: item.size,
      formatedTime: '',
      fileName: item.path,
      isDir: false,
      checked: false,
      match: false,
      isImage: isImage(item.path),
      rawUrl: item.url,
      url: this.publicUrl(key, branch, repo, cdnUrl),
    }
  }

  /**
   * get repo list
   */
  async getBucketList(): Promise<any> {
    let initPage = 1
    let res
    const result = [] as any[]
    do {
      res = (await got(
        `${this.baseUrl}/user/repos`,
        getOptions(
          'GET',
          this.commonHeaders,
          { page: initPage, per_page: 100 },
          'json',
          undefined,
          undefined,
          this.proxy,
        ),
      )) as any
      if (res.statusCode === 200) {
        res.body.forEach((item: any) => {
          result.push({
            ...item,
            Name: item.full_name,
            Location: item.id,
            CreationDate: item.created_at,
          })
        })
      } else {
        return []
      }
      initPage++
    } while (res.body.length > 0)
    return result
  }

  /**
   * 获取branch列表
   */
  async getBucketDomain(param: IStringKeyMap): Promise<any> {
    const repoUrl = this.repositoryUrl(param.bucketName)
    let initPage = 1
    let res
    const result = [] as string[]
    do {
      res = (await got(
        `${repoUrl}/branches`,
        getOptions(
          'GET',
          this.commonHeaders,
          { page: initPage, per_page: 100 },
          'json',
          undefined,
          undefined,
          this.proxy,
        ),
      )) as any
      if (res.statusCode === 200) {
        res.body.forEach((item: any) => result.push(item.name))
      } else {
        return []
      }
      initPage++
    } while (res.body.length > 0)
    return result
  }

  async getBucketListRecursively(configMap: IStringKeyMap, listing: ListingContext): Promise<any> {
    const { bucketName: repo, customUrl: branch, prefix, cdnUrl } = configMap
    const repoUrl = this.repositoryUrl(repo)
    const slicedPrefix = prefix.replace(/(^\/+|\/+$)/g, '')
    const result = {
      fullList: [] as any,
      success: false,
      finished: false,
    }
    const treeQueue = [slicedPrefix]
    while (treeQueue.length) {
      if (listing.signal.aborted) {
        result.finished = true
        return result
      }
      const currentPrefix = treeQueue.shift()!
      const res = (await listing.wait(() =>
        got(`${repoUrl}/git/trees/${branch}:${encodeObjectPath(currentPrefix)}`, {
          ...getOptions('GET', this.commonHeaders, {}, 'json', undefined, undefined, this.proxy),
          signal: listing.signal,
        }),
      )) as any
      if (res && res.statusCode === 200) {
        const { tree } = res.body
        tree.forEach((item: any) => {
          if (item.type === 'tree') {
            treeQueue.push(currentPrefix ? `${currentPrefix}/${item.path}` : item.path)
          } else {
            result.fullList.push(this.formatFile(item, currentPrefix, branch, repo, cdnUrl))
          }
        })
        await listing.publish(result)
        result.fullList = []
      } else {
        result.finished = true
        await listing.publish(result)
        result.fullList = []
        return
      }
    }
    result.success = true
    result.finished = true
    await listing.publish(result)
    result.fullList = []
  }

  async getBucketListBackstage(configMap: IStringKeyMap, listing: ListingContext): Promise<any> {
    const { bucketName: repo, customUrl: branch, prefix, cdnUrl } = configMap
    const repoUrl = this.repositoryUrl(repo)
    const slicedPrefix = prefix.replace(/(^\/+|\/+$)/g, '')
    const result = {
      fullList: [] as any,
      success: false,
      finished: false,
    }
    const res = (await listing.wait(() =>
      got(`${repoUrl}/git/trees/${branch}:${encodeObjectPath(slicedPrefix)}`, {
        ...getOptions('GET', this.commonHeaders, undefined, 'json', undefined, undefined, this.proxy),
        signal: listing.signal,
      }),
    )) as any
    if (res && res.statusCode === 200) {
      res.body.tree.forEach((item: any) => {
        if (item.type === 'tree') {
          result.fullList.push(this.formatFolder(item, slicedPrefix, branch, repo, cdnUrl))
        } else {
          result.fullList.push(this.formatFile(item, slicedPrefix, branch, repo, cdnUrl))
        }
      })
    } else {
      result.finished = true
      await listing.publish(result)
      result.fullList = []
      return
    }
    result.success = true
    result.finished = true
    await listing.publish(result)
    result.fullList = []
  }

  /**
   * 删除文件
   * @param configMap
   * configMap = {
   * bucketName: string,
   * region: string,
   * key: string
   * }
   */
  async deleteBucketFile(configMap: IStringKeyMap): Promise<boolean> {
    const { bucketName: repo, githubBranch: branch, key, DeleteHash: sha } = configMap
    const body = {
      message: 'deleted by PicList',
      sha,
      branch,
    }
    const res = await got(
      this.contentsUrl(repo, key),
      getOptions('DELETE', this.commonHeaders, undefined, 'json', JSON.stringify(body), undefined, this.proxy),
    )
    return res.statusCode === 200
  }

  /**
   * create a new tree to delete a folder
   * @param configMap
   */
  async deleteBucketFolder(configMap: IStringKeyMap): Promise<boolean> {
    const { githubBranch: branch, key } = configMap
    const repoUrl = this.repositoryUrl(configMap.bucketName)
    // get sha of the branch
    const refRes = (await got(
      `${repoUrl}/git/refs/heads/${branch}`,
      getOptions('GET', this.commonHeaders, undefined, 'json', undefined, undefined, this.proxy),
    )) as any
    if (refRes.statusCode !== 200) return false
    const refSha = refRes.body.object.sha
    // get sha of the root tree
    const rootRes = (await got(
      `${repoUrl}/branches/${branch}`,
      getOptions('GET', this.commonHeaders, undefined, 'json', undefined, undefined, this.proxy),
    )) as any
    if (rootRes.statusCode !== 200) return false
    const rootSha = rootRes.body.commit.commit.tree.sha
    // TODO: if there are more than 10000 files in the folder, it will be truncated
    // Rare cases, not considered for now
    // get sha of the folder tree
    const treeRes = (await got(
      `${repoUrl}/git/trees/${branch}:${key.replace(/(^\/+|\/+$)/g, '')}`,
      getOptions(
        'GET',
        this.commonHeaders,
        {
          recursive: true,
        },
        'json',
        undefined,
        undefined,
        this.proxy,
      ),
    )) as any
    if (treeRes.statusCode !== 200) return false
    const oldTree = treeRes.body.tree
    // create a new tree
    const newTree = oldTree
      .filter((item: any) => item.type === 'blob')
      .map((item: any) => ({
        path: `${key.replace(/(^\/+|\/+$)/g, '')}/${item.path}`,
        mode: item.mode,
        type: item.type,
        sha: null,
      }))
    const newTreeShaRes = (await got(
      `${repoUrl}/git/trees`,
      getOptions(
        'POST',
        this.commonHeaders,
        undefined,
        'json',
        JSON.stringify({
          base_tree: rootSha,
          tree: newTree,
        }),
        undefined,
        this.proxy,
      ),
    )) as any
    if (newTreeShaRes.statusCode !== 201) return false
    const newTreeSha = newTreeShaRes.body.sha
    // create a new commit
    const commitRes = (await got(
      `${repoUrl}/git/commits`,
      getOptions(
        'POST',
        this.commonHeaders,
        undefined,
        'json',
        JSON.stringify({
          message: 'deleted by PicList',
          tree: newTreeSha,
          parents: [refSha],
        }),
        undefined,
        this.proxy,
      ),
    )) as any
    if (commitRes.statusCode !== 201) return false
    const commitSha = commitRes.body.sha
    // update the branch
    const updateRefRes = (await got(
      `${repoUrl}/git/refs/heads/${branch}`,
      getOptions(
        'PATCH',
        this.commonHeaders,
        undefined,
        'json',
        JSON.stringify({
          sha: commitSha,
        }),
        undefined,
        this.proxy,
      ),
    )) as any
    return updateRefRes.statusCode === 200
  }

  /**
   * 获取预签名url
   * @param configMap
   * configMap = {
   * bucketName: string,
   * region: string,
   * key: string,
   * expires: number,
   * customUrl: string
   * }
   */
  async getPreSignedUrl(configMap: IStringKeyMap): Promise<string> {
    const { bucketName: repo, customUrl: branch, key, rawUrl, githubPrivate: isPrivate } = configMap
    if (!isPrivate) return rawUrl
    const res = (await got(
      this.contentsUrl(repo, key),
      getOptions(
        'GET',
        this.commonHeaders,
        {
          ref: branch,
        },
        'json',
        undefined,
        undefined,
        this.proxy,
      ),
    )) as any
    return res.statusCode === 200 ? res.body.download_url : ''
  }

  /**
   * 新建文件夹
   * @param configMap
   */
  async createBucketFolder(configMap: IStringKeyMap): Promise<boolean> {
    const { bucketName: repo, githubBranch: branch, key } = configMap
    const base64Content = Buffer.from('created by PicList').toString('base64')
    const body = {
      message: `created a new folder named ${key} by PicList`,
      content: base64Content,
      branch,
    }
    const res = await got(
      this.contentsUrl(repo, `${key}/.gitkeep`),
      getOptions('PUT', this.commonHeaders, undefined, 'json', JSON.stringify(body), undefined, this.proxy),
    )
    return res.statusCode === 201
  }

  /**
   * 上传文件
   * @param configMap
   */
  async uploadBucketFile(configMap: IStringKeyMap): Promise<boolean> {
    const instance = UpDownTaskQueue.getInstance()
    let shouldDelay = false
    return scheduleUploadBatch(
      configMap,
      {
        provider: 'github',
        account: [this.baseUrl, this.username],
        normalizeKey: true,
        maxFileSize: 100 * MIB - 1,
        accountConcurrency: 1,
        memory: file => file.fileSize * 6 + MIB,
      },
      async (file, { id, signal }) => {
        const { bucketName: repo, githubBranch: branch, key, filePath } = file
        if (shouldDelay) await delay(3000, undefined, { signal })
        shouldDelay = true
        const result = await gotUpload(instance, id, {
          prepare: () => ({
            url: this.contentsUrl(repo, key),
            method: 'PUT',
            body: JSON.stringify({
              message: 'uploaded by PicList',
              branch,
              content: fs.readFileSync(filePath, { encoding: 'base64' }),
            }),
            headers: this.commonHeaders,
            agent: getAgent(this.proxy),
          }),
          validateResponse: (body, statusCode) =>
            (statusCode === 200 || statusCode === 201) &&
            isUploadResponseObject(body) &&
            isUploadResponseObject(body.content) &&
            isUploadResponseString(body.content.sha) &&
            isUploadResponseObject(body.commit) &&
            isUploadResponseString(body.commit.sha),
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
      const { bucketName: repo, customUrl: branch, key, fileName, githubPrivate, githubUrl } = item
      const sourceId = JSON.stringify([item.region, repo, branch, key, fileName])
      const task = createDownloadTask(instance, sourceId, downloadPath, fileName, downloadConflictPolicy, this.logger)
      if (!task) continue
      const { id, destination } = task
      let downloadUrl: string
      if (githubPrivate) {
        downloadUrl = await this.getPreSignedUrl({ ...item, rawUrl: githubUrl })
      } else {
        downloadUrl = githubUrl
      }
      promises.push(
        () =>
          new Promise((resolve, reject) => {
            NewDownloader(instance, downloadUrl, id, destination, this.logger, this.proxyStr).then((res: boolean) => {
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
      this.logger.error(
        formatError(error, {
          class: 'GithubApi',
          method: 'downloadBucketFile',
        }),
      )
    })
    return true
  }
}

export default GithubApi
