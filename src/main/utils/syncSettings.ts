import os from 'node:os'
import path from 'node:path'

import db from '@core/datastore'
import logger from '@core/picgo/logger'
import { Octokit } from '@octokit/rest'
import axios from 'axios'
import { app } from 'electron'
import fs from 'fs-extra'
import { HttpsProxyAgent } from 'hpagent'
import { AuthType, createClient, WebDAVClientOptions } from 'webdav'

import type { ISyncConfig } from '#/types/types'
import { extractData, zipData } from '~/utils/common'
import { formatEndpoint } from '~/utils/common'
import { configPaths } from '~/utils/configPaths'

const STORE_PATH = app.getPath('userData')
const tempDir = path.join(os.tmpdir(), `piclist-sync-tmp`)
const db1 = path.join(tempDir, 'db1')
const db2 = path.join(tempDir, 'db2')
const dbMerged = path.join(tempDir, 'db-merged')
const galleryDBList = ['piclist.db', 'piclist.bak.db']

const readFileAsBase64 = (filePath: string) => fs.readFileSync(filePath, { encoding: 'base64' })

const isHttpResSuccess = (res: any) => res.status >= 200 && res.status < 300

const uploadOrUpdateMsg = (fileName: string, isUpdate: boolean = true) =>
  isUpdate ? `update ${fileName} from PicList` : `upload ${fileName} from PicList`

const emptyDir = async (): Promise<void> => {
  await fs.emptyDir(tempDir)
  await fs.emptyDir(db1)
  await fs.emptyDir(db2)
  await fs.emptyDir(dbMerged)
}

const mergeGalleryDB = async (targetFile: string) => {
  try {
    const db1Data = await extractData(path.join(db1, targetFile))
    const db2Data = await extractData(path.join(db2, targetFile))
    const mergedData: any = {
      gallery: [],
      __gallery_KEY__: {},
    }
    const db1Ids = new Set<string>(Object.keys(db1Data.__gallery_KEY__ || {}))
    const db2Ids = new Set<string>(Object.keys(db2Data.__gallery_KEY__ || {}))
    const idSet = new Set<string>([...db1Ids, ...db2Ids])
    for (const id of idSet) {
      if (db2Ids.has(id)) {
        mergedData.gallery.push(db2Data.gallery.find((item: any) => item.id === id))
      } else if (db1Ids.has(id)) {
        mergedData.gallery.push(db1Data.gallery.find((item: any) => item.id === id))
      }
    }
    for (const item of mergedData.gallery) {
      mergedData.__gallery_KEY__[item.id] = 1
    }
    await zipData(mergedData, path.join(dbMerged, targetFile))
    await fs.copyFile(path.join(dbMerged, targetFile), path.join(STORE_PATH, targetFile))
  } catch (err: any) {
    logger.error('merge gallery db failed:', String(err))
  }
}

const getSyncConfig = () =>
  db.get(configPaths.settings.sync) || {
    type: 'github',
    username: '',
    repo: '',
    branch: '',
    token: '',
    proxy: '',
  }

const getProxyagent = (proxy: string | undefined) =>
  proxy
    ? new HttpsProxyAgent({
        keepAlive: true,
        keepAliveMsecs: 1000,
        rejectUnauthorized: false,
        proxy: proxy.replace('127.0.0.1', 'localhost'),
        scheduling: 'lifo',
      })
    : undefined

const getOctokit = (syncConfig: ISyncConfig) =>
  new Octokit({
    auth: syncConfig.token,
    request: {
      agent: getProxyagent(syncConfig.proxy),
    },
  })

const isSyncConfigValidate = ({
  type,
  username,
  repo,
  branch,
  token,
  webdavEndpoint,
  webdavUsername,
  webdavPassword,
  webdavAuthType,
  webdavSslEnabled,
  webdavSavePath,
}: ISyncConfig) => {
  if (type === 'webdav') {
    return (
      type &&
      webdavEndpoint &&
      webdavUsername &&
      webdavPassword &&
      webdavAuthType !== undefined &&
      webdavSslEnabled !== undefined &&
      webdavSavePath !== undefined
    )
  }
  return type && username && repo && branch && token
}

async function uploadLocalToRemote(syncConfig: ISyncConfig, fileName: string) {
  const localFilePath = path.join(STORE_PATH, fileName)
  if (!fs.existsSync(localFilePath)) return false

  const { username, repo, branch, token, type } = syncConfig

  const defaultConfig = {
    content: readFileAsBase64(localFilePath),
    message: uploadOrUpdateMsg(fileName, false),
    branch,
  }
  try {
    switch (type) {
      case 'gitee': {
        const res = await axios.post(`https://gitee.com/api/v5/repos/${username}/${repo}/contents/${fileName}`, {
          ...defaultConfig,
          access_token: token,
        })
        return isHttpResSuccess(res)
      }
      case 'github': {
        const octokit = getOctokit(syncConfig)
        const res = await octokit.rest.repos.createOrUpdateFileContents({
          ...defaultConfig,
          owner: username,
          repo,
          path: fileName,
        })
        return isHttpResSuccess(res)
      }
      case 'gitea': {
        const { endpoint = '' } = syncConfig
        const res = await axios.post(
          `${endpoint}/api/v1/repos/${username}/${repo}/contents/${fileName}`,
          defaultConfig,
          {
            headers: {
              Authorization: `token ${token}`,
            },
          },
        )
        return isHttpResSuccess(res)
      }
      case 'webdav': {
        const {
          webdavEndpoint = '',
          webdavUsername,
          webdavPassword,
          webdavAuthType = 'basic',
          webdavSslEnabled = true,
          webdavSavePath = '',
        } = syncConfig
        const webdavEndpointF = formatEndpoint(webdavEndpoint, webdavSslEnabled)
        const options: WebDAVClientOptions = {
          username: webdavUsername,
          password: webdavPassword,
          ...(webdavAuthType === 'digest' ? { authType: AuthType.Digest } : {}),
        }
        const client = createClient(webdavEndpointF, options)
        const fileContent = fs.readFileSync(localFilePath)
        const remoteFilePath = webdavSavePath
          ? `${webdavSavePath}/${fileName}`.replace(/^\/+|\/+$/g, '').replace(/\/\/+/g, '/')
          : fileName
        const remoteDir = path.dirname(remoteFilePath)
        if (remoteDir !== '/') {
          await client.createDirectory(remoteDir, { recursive: true })
        }
        await client.putFileContents(remoteFilePath, fileContent, { overwrite: true })
        return true
      }
      default:
        return false
    }
  } catch (error: any) {
    logger.error(error)
    return false
  }
}

async function uploadFile(fileName: string[]): Promise<number> {
  const syncConfig = getSyncConfig()
  if (!isSyncConfigValidate(syncConfig)) {
    logger.error('sync config is invalid')
    return 0
  }
  const uploadFunc = async (file: string): Promise<number> => {
    let result = false
    try {
      result = await updateLocalToRemote(syncConfig, file)
    } catch (_e: any) {
      result = await uploadLocalToRemote(syncConfig, file)
    }
    logger.info(`upload ${file} ${result ? 'success' : 'failed'}`)
    return result ? 1 : 0
  }

  let count = 0
  for (const file of fileName) {
    count += await uploadFunc(file)
  }

  return count
}

async function updateLocalToRemote(syncConfig: ISyncConfig, fileName: string) {
  const localFilePath = path.join(STORE_PATH, fileName)
  if (!fs.existsSync(localFilePath)) {
    return false
  }
  const { username, repo, branch, token, type } = syncConfig
  const defaultConfig = {
    branch,
    message: uploadOrUpdateMsg(fileName),
    content: readFileAsBase64(localFilePath),
  }
  switch (type) {
    case 'gitee': {
      const url = `https://gitee.com/api/v5/repos/${username}/${repo}/contents/${fileName}`
      const shaRes = await axios.get(url, {
        params: {
          access_token: token,
          ref: branch,
        },
      })
      if (!isHttpResSuccess(shaRes)) {
        return false
      }
      const sha = shaRes.data.sha
      const res = await axios.put(url, {
        ...defaultConfig,
        owner: username,
        repo,
        path: fileName,
        sha,
        access_token: token,
      })
      return isHttpResSuccess(res)
    }
    case 'github': {
      const octokit = getOctokit(syncConfig)
      const shaRes = await octokit.rest.repos.getContent({
        owner: username,
        repo,
        path: fileName,
        ref: branch,
      })
      if (shaRes.status !== 200) {
        throw new Error('get sha failed')
      }
      const data = shaRes.data as any
      const sha = data.sha
      const res = await octokit.rest.repos.createOrUpdateFileContents({
        ...defaultConfig,
        owner: username,
        repo,
        path: fileName,
        sha,
      })
      return res.status === 200
    }
    case 'gitea': {
      const { endpoint = '' } = syncConfig
      const apiUrl = `${endpoint}/api/v1/repos/${username}/${repo}/contents/${fileName}`
      const headers = {
        Authorization: `token ${token}`,
      }
      const shaRes = await axios.get(apiUrl, {
        headers,
      })
      if (!isHttpResSuccess(shaRes)) {
        throw new Error('get sha failed')
      }
      const data = shaRes.data as any
      const sha = data.sha
      const res = await axios.put(
        apiUrl,
        {
          ...defaultConfig,
          sha,
        },
        {
          headers,
        },
      )
      return isHttpResSuccess(res)
    }
    case 'webdav': {
      const {
        webdavEndpoint = '',
        webdavUsername,
        webdavPassword,
        webdavAuthType = 'basic',
        webdavSslEnabled = true,
        webdavSavePath = '',
      } = syncConfig
      const webdavEndpointF = formatEndpoint(webdavEndpoint, webdavSslEnabled)
      const options: WebDAVClientOptions = {
        username: webdavUsername,
        password: webdavPassword,
      }
      if (webdavAuthType === 'digest') {
        options.authType = AuthType.Digest
      }
      const client = createClient(webdavEndpointF, options)
      const fileContent = fs.readFileSync(localFilePath)
      const remoteFilePath = webdavSavePath
        ? `${webdavSavePath}/${fileName}`.replace(/^\/+|\/+$/g, '').replace(/\/\/+/g, '/')
        : fileName
      const remoteDir = path.dirname(remoteFilePath)
      if (remoteDir !== '/') {
        await client.createDirectory(remoteDir, { recursive: true })
      }
      await client.putFileContents(remoteFilePath, fileContent, { overwrite: true })
      return true
    }
    default:
      return false
  }
}

async function downloadAndWriteFile(url: string, localFilePath: string, config: any, isWriteJson = false) {
  const res = await axios.get(url, config)
  if (isHttpResSuccess(res)) {
    await fs.writeFile(
      localFilePath,
      isWriteJson ? JSON.stringify(res.data, null, 2) : Buffer.from(res.data.content, 'base64'),
    )
    return true
  }
  return false
}

async function downloadRemoteToLocal(syncConfig: ISyncConfig, fileName: string, galleryMode = false) {
  const storePath = galleryMode ? db2 : STORE_PATH
  const localFilePath = path.join(storePath, fileName)
  const { username, repo, branch, token, proxy, type } = syncConfig
  try {
    switch (type) {
      case 'gitee': {
        const url = `https://gitee.com/api/v5/repos/${username}/${repo}/contents/${fileName}`
        const config = {
          params: { access_token: token, ref: branch },
        }
        if (galleryMode) {
          const res = await axios.get(url, config)
          if (isHttpResSuccess(res)) {
            const downloadUrl = res.data.download_url
            const fileRes = await axios.get(downloadUrl, { responseType: 'arraybuffer' })
            if (isHttpResSuccess(fileRes)) {
              await fs.writeFile(localFilePath, fileRes.data)
              return true
            }
          }
          return false
        } else {
          return downloadAndWriteFile(url, localFilePath, config)
        }
      }
      case 'github': {
        const octokit = getOctokit(syncConfig)
        const res = await octokit.rest.repos.getContent({
          owner: username,
          repo,
          path: fileName,
          ref: branch,
        })
        if (res.status === 200) {
          const data = res.data as any
          const downloadUrl = data.download_url
          if (galleryMode) {
            const res = await axios.get(downloadUrl, {
              httpsAgent: getProxyagent(proxy),
              responseType: 'arraybuffer',
            })
            if (isHttpResSuccess(res)) {
              await fs.writeFile(localFilePath, res.data)
              return true
            } else {
              return false
            }
          } else {
            return downloadAndWriteFile(
              downloadUrl,
              localFilePath,
              {
                httpsAgent: getProxyagent(proxy),
              },
              true,
            )
          }
        }
        return false
      }
      case 'gitea': {
        const { endpoint = '', token, username, repo, branch } = syncConfig
        if (galleryMode) {
          const rawUrl = `${endpoint}/api/v1/repos/${username}/${repo}/raw/${fileName}`
          const res = await axios.get(rawUrl, {
            headers: {
              Authorization: `token ${token}`,
            },
            params: {
              ref: branch,
            },
            responseType: 'arraybuffer',
          })
          if (isHttpResSuccess(res)) {
            await fs.writeFile(localFilePath, res.data)
            return true
          }
          return false
        } else {
          const apiUrl = `${endpoint}/api/v1/repos/${username}/${repo}/contents/${fileName}`
          return downloadAndWriteFile(apiUrl, localFilePath, {
            headers: {
              Authorization: `token ${token}`,
            },
            params: {
              ref: branch,
            },
          })
        }
      }
      case 'webdav': {
        const {
          webdavEndpoint = '',
          webdavUsername,
          webdavPassword,
          webdavAuthType = 'basic',
          webdavSslEnabled = true,
          webdavSavePath = '',
        } = syncConfig
        const webdavEndpointF = formatEndpoint(webdavEndpoint, webdavSslEnabled)
        const options: WebDAVClientOptions = {
          username: webdavUsername,
          password: webdavPassword,
        }
        if (webdavAuthType === 'digest') {
          options.authType = AuthType.Digest
        }
        const client = createClient(webdavEndpointF, options)
        const remoteFilePath = (webdavSavePath ? path.join(webdavSavePath, fileName) : fileName).replace(/\\/g, '/')
        const fileContent = await client.getFileContents(remoteFilePath)
        await fs.writeFile(localFilePath, fileContent as Buffer)
        return true
      }
      default:
        return false
    }
  } catch (error: any) {
    logger.error(error)
    return false
  }
}

async function checkCloudFileExist(syncConfig: ISyncConfig, fileName: string) {
  const { username, repo, branch, token, type } = syncConfig
  try {
    switch (type) {
      case 'gitee': {
        const url = `https://gitee.com/api/v5/repos/${username}/${repo}/contents/${fileName}`
        try {
          const res = await axios.get(url, {
            params: { access_token: token, ref: branch },
          })
          return isHttpResSuccess(res)
        } catch (error: any) {
          if (error.response?.status === 404) return false
          throw error
        }
      }
      case 'github': {
        const octokit = getOctokit(syncConfig)
        try {
          const res = await octokit.rest.repos.getContent({
            owner: username,
            repo,
            path: fileName,
            ref: branch,
          })
          return res.status === 200
        } catch (error: any) {
          if (Number(error.status) === 404) return false
          throw error
        }
      }
      case 'gitea': {
        const { endpoint = '' } = syncConfig
        const apiUrl = `${endpoint}/api/v1/repos/${username}/${repo}/contents/${fileName}`
        try {
          const res = await axios.get(apiUrl, {
            headers: { Authorization: `token ${token}` },
            params: { ref: branch },
          })
          return isHttpResSuccess(res)
        } catch (error: any) {
          if (error.response?.status === 404) return false
          throw error
        }
      }
      case 'webdav': {
        const {
          webdavEndpoint = '',
          webdavUsername,
          webdavPassword,
          webdavAuthType = 'basic',
          webdavSslEnabled = true,
          webdavSavePath = '',
        } = syncConfig
        const webdavEndpointF = formatEndpoint(webdavEndpoint, webdavSslEnabled)
        const options: WebDAVClientOptions = {
          username: webdavUsername,
          password: webdavPassword,
        }
        if (webdavAuthType === 'digest') {
          options.authType = AuthType.Digest
        }
        const client = createClient(webdavEndpointF, options)
        const remoteFilePath = (webdavSavePath ? path.join(webdavSavePath, fileName) : fileName).replace(/\\/g, '/')
        const exists = await client.exists(remoteFilePath)
        return exists
      }
      default:
        throw new Error('unsupported sync type')
    }
  } catch (error: any) {
    logger.error(error)
    throw new Error('check file exist failed')
  }
}

async function downloadFile(fileName: string[]): Promise<number> {
  const syncConfig = getSyncConfig()
  if (!isSyncConfigValidate(syncConfig)) {
    logger.error('sync config is invalid')
    return 0
  }

  const downloadFunc = async (file: string): Promise<number> => {
    const result = await downloadRemoteToLocal(syncConfig, file)
    logger.info(`download ${file} ${result ? 'success' : 'failed'}`)
    return result ? 1 : 0
  }

  return (await Promise.all(fileName.map(downloadFunc))).reduce((a, b) => a + b, 0)
}

async function syncGallery(): Promise<number> {
  const syncConfig = getSyncConfig()
  if (!isSyncConfigValidate(syncConfig)) {
    logger.error('sync config is invalid')
    return 0
  }
  let successCount = 0
  for (const file of galleryDBList) {
    await emptyDir()
    try {
      const exists = await checkCloudFileExist(syncConfig, file)
      if (!exists) {
        await uploadLocalToRemote(syncConfig, file)
        logger.info(`gallery db ${file} not exist in cloud, upload local file instead`)
        successCount++
        continue
      }
    } catch (err: any) {
      logger.error(`check gallery db ${file} exist failed:`, String(err))
      continue
    }
    await downloadRemoteToLocal(syncConfig, file, true)
    await fs.copyFile(path.join(STORE_PATH, file), path.join(db1, file))
    await mergeGalleryDB(file)
    await updateLocalToRemote(syncConfig, file)
    logger.info(`sync gallery db ${file} success`)
    successCount++
  }
  return successCount
}

export { downloadFile, syncGallery, uploadFile }
