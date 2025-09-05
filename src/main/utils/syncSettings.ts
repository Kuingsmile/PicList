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
import { formatEndpoint } from '~/utils/common'
import { configPaths } from '~/utils/configPaths'

const STORE_PATH = app.getPath('userData')

const readFileAsBase64 = (filePath: string) => fs.readFileSync(filePath, { encoding: 'base64' })

const isHttpResSuccess = (res: any) => res.status >= 200 && res.status < 300
const uploadOrUpdateMsg = (fileName: string, isUpdate: boolean = true) =>
  isUpdate ? `update ${fileName} from PicList` : `upload ${fileName} from PicList`

const getSyncConfig = () => {
  return (
    db.get(configPaths.settings.sync) || {
      type: 'github',
      username: '',
      repo: '',
      branch: '',
      token: '',
      proxy: ''
    }
  )
}

const getProxyagent = (proxy: string | undefined) => {
  return proxy
    ? new HttpsProxyAgent({
        keepAlive: true,
        keepAliveMsecs: 1000,
        rejectUnauthorized: false,
        proxy: proxy.replace('127.0.0.1', 'localhost'),
        scheduling: 'lifo'
      })
    : undefined
}

function getOctokit(syncConfig: ISyncConfig) {
  const { token, proxy } = syncConfig
  return new Octokit({
    auth: token,
    request: {
      agent: getProxyagent(proxy)
    }
  })
}

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
  webdavSavePath
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
  if (!fs.existsSync(localFilePath)) {
    return false
  }
  const { username, repo, branch, token, type } = syncConfig
  const defaultConfig = {
    content: readFileAsBase64(localFilePath),
    message: uploadOrUpdateMsg(fileName, false),
    branch
  }
  try {
    switch (type) {
      case 'gitee': {
        const url = `https://gitee.com/api/v5/repos/${username}/${repo}/contents/${fileName}`
        const res = await axios.post(url, {
          ...defaultConfig,
          access_token: token
        })
        return isHttpResSuccess(res)
      }
      case 'github': {
        const octokit = getOctokit(syncConfig)
        const res = await octokit.rest.repos.createOrUpdateFileContents({
          ...defaultConfig,
          owner: username,
          repo,
          path: fileName
        })
        return isHttpResSuccess(res)
      }
      case 'gitea': {
        const { endpoint = '' } = syncConfig
        const apiUrl = `${endpoint}/api/v1/repos/${username}/${repo}/contents/${fileName}`
        const headers = {
          Authorization: `token ${token}`
        }
        const res = await axios.post(apiUrl, defaultConfig, { headers })
        return isHttpResSuccess(res)
      }
      case 'webdav': {
        const {
          webdavEndpoint = '',
          webdavUsername,
          webdavPassword,
          webdavAuthType = 'basic',
          webdavSslEnabled = true,
          webdavSavePath = ''
        } = syncConfig
        const webdavEndpointF = formatEndpoint(webdavEndpoint, webdavSslEnabled)
        const options: WebDAVClientOptions = {
          username: webdavUsername,
          password: webdavPassword
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
  } catch (error: any) {
    logger.error(error)
    return false
  }
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
    content: readFileAsBase64(localFilePath)
  }
  switch (type) {
    case 'gitee': {
      const url = `https://gitee.com/api/v5/repos/${username}/${repo}/contents/${fileName}`
      const shaRes = await axios.get(url, {
        params: {
          access_token: token,
          ref: branch
        }
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
        access_token: token
      })
      return isHttpResSuccess(res)
    }
    case 'github': {
      const octokit = getOctokit(syncConfig)
      const shaRes = await octokit.rest.repos.getContent({
        owner: username,
        repo,
        path: fileName,
        ref: branch
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
        sha
      })
      return res.status === 200
    }
    case 'gitea': {
      const { endpoint = '' } = syncConfig
      const apiUrl = `${endpoint}/api/v1/repos/${username}/${repo}/contents/${fileName}`
      const headers = {
        Authorization: `token ${token}`
      }
      const shaRes = await axios.get(apiUrl, {
        headers
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
          sha
        },
        {
          headers
        }
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
        webdavSavePath = ''
      } = syncConfig
      const webdavEndpointF = formatEndpoint(webdavEndpoint, webdavSslEnabled)
      const options: WebDAVClientOptions = {
        username: webdavUsername,
        password: webdavPassword
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
    } catch (error: any) {
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

async function downloadAndWriteFile(url: string, localFilePath: string, config: any, isWriteJson = false) {
  const res = await axios.get(url, config)
  if (isHttpResSuccess(res)) {
    await fs.writeFile(
      localFilePath,
      isWriteJson ? JSON.stringify(res.data, null, 2) : Buffer.from(res.data.content, 'base64')
    )
    return true
  }
  return false
}

async function downloadRemoteToLocal(syncConfig: ISyncConfig, fileName: string) {
  const localFilePath = path.join(STORE_PATH, fileName)
  const { username, repo, branch, token, proxy, type } = syncConfig
  try {
    switch (type) {
      case 'gitee': {
        const url = `https://gitee.com/api/v5/repos/${username}/${repo}/contents/${fileName}`
        return downloadAndWriteFile(url, localFilePath, {
          params: {
            access_token: token,
            ref: branch
          }
        })
      }
      case 'github': {
        const octokit = getOctokit(syncConfig)
        const res = await octokit.rest.repos.getContent({
          owner: username,
          repo,
          path: fileName,
          ref: branch
        })
        if (res.status === 200) {
          const data = res.data as any
          const downloadUrl = data.download_url
          return downloadAndWriteFile(
            downloadUrl,
            localFilePath,
            {
              httpsAgent: getProxyagent(proxy)
            },
            true
          )
        }
        return false
      }
      case 'gitea': {
        const { endpoint = '' } = syncConfig
        const apiUrl = `${endpoint}/api/v1/repos/${username}/${repo}/contents/${fileName}`
        return downloadAndWriteFile(apiUrl, localFilePath, {
          headers: {
            Authorization: `token ${token}`
          },
          params: {
            ref: branch
          }
        })
      }
      case 'webdav': {
        const {
          webdavEndpoint = '',
          webdavUsername,
          webdavPassword,
          webdavAuthType = 'basic',
          webdavSslEnabled = true,
          webdavSavePath = ''
        } = syncConfig
        const webdavEndpointF = formatEndpoint(webdavEndpoint, webdavSslEnabled)
        const options: WebDAVClientOptions = {
          username: webdavUsername,
          password: webdavPassword
        }
        if (webdavAuthType === 'digest') {
          options.authType = AuthType.Digest
        }
        console.log(webdavEndpointF, options)
        const client = createClient(webdavEndpointF, options)
        const remoteFilePath = (webdavSavePath ? path.join(webdavSavePath, fileName) : fileName).replace(/\\/g, '/')
        console.log('remoteFilePath', remoteFilePath)
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

export { downloadFile, uploadFile }
