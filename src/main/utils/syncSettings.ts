import { app } from 'electron'
import fs from 'fs-extra'
import path from 'path'
import axios from 'axios'
import db from '~/main/apis/core/datastore'
import { HttpsProxyAgent } from 'hpagent'
import { Octokit } from '@octokit/rest'
import logger from 'apis/core/picgo/logger'

interface SyncConfig {
  type: string
  file?: string
  username: string
  repo: string
  branch: string
  token: string
  proxy?: string,
  interval?: number
}

const STORE_PATH = app.getPath('userData')

const configFileNames = [
  'data.json',
  'data.bak.json',
  'manage.json',
  'manage.bak.json'
]

function getOctokit (syncConfig: SyncConfig) {
  const { token, proxy } = syncConfig
  return new Octokit({
    auth: token,
    request: {
      agent: proxy
        ? new HttpsProxyAgent({
          keepAlive: true,
          keepAliveMsecs: 1000,
          rejectUnauthorized: false,
          proxy: proxy.replace('127.0.0.1', 'localhost'),
          scheduling: 'lifo'
        })
        : undefined
    }
  })
}

function getSyncConfig () {
  return db.get('settings.sync') || {
    type: 'github',
    username: '',
    repo: '',
    branch: '',
    token: '',
    proxy: ''
  }
}

function syncConfigValidator (syncConfig: SyncConfig) {
  const { type, username, repo, branch, token } = syncConfig
  return type && username && repo && branch && token
}

async function uploadLocalToRemote (syncConfig: SyncConfig, fileName: string) {
  const localFilePath = path.join(STORE_PATH, fileName)
  if (!fs.existsSync(localFilePath)) {
    return false
  }
  const { username, repo, branch, token, type } = syncConfig
  if (type === 'gitee') {
    try {
      const url = `https://gitee.com/api/v5/repos/${username}/${repo}/contents/${fileName}`
      const res = await axios.post(url, {
        access_token: token,
        branch,
        content: fs.readFileSync(localFilePath, { encoding: 'base64' }),
        message: `upload ${fileName} from PicList`
      })
      return res.status >= 200 && res.status < 300
    } catch (error: any) {
      logger.error(error)
      return false
    }
  } else {
    const octokit = getOctokit(syncConfig)
    try {
      const res = await octokit.rest.repos.createOrUpdateFileContents({
        owner: username,
        repo,
        path: fileName,
        message: `upload ${fileName} from PicList`,
        content: fs.readFileSync(localFilePath, { encoding: 'base64' }),
        branch
      })
      return res.status >= 200 && res.status < 300
    } catch (error: any) {
      logger.error(error)
      return false
    }
  }
}

async function updateLocalToRemote (syncConfig: SyncConfig, fileName: string) {
  const localFilePath = path.join(STORE_PATH, fileName)
  if (!fs.existsSync(localFilePath)) {
    return false
  }
  const { username, repo, branch, token, type } = syncConfig
  if (type === 'gitee') {
    const url = `https://gitee.com/api/v5/repos/${username}/${repo}/contents/${fileName}`
    const shaRes = await axios.get(url, {
      params: {
        access_token: token,
        ref: branch
      }
    })
    if (shaRes.status < 200 || shaRes.status > 300) {
      return false
    }
    const sha = shaRes.data.sha
    const res = await axios.put(url, {
      owner: username,
      repo,
      path: fileName,
      message: `update ${fileName} from PicList`,
      content: fs.readFileSync(localFilePath, { encoding: 'base64' }),
      branch,
      sha,
      access_token: token
    })
    if (res.status >= 200 && res.status < 300) {
      return true
    }
    return false
  } else {
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
      owner: username,
      repo,
      path: fileName,
      message: `update ${fileName} from PicList`,
      content: fs.readFileSync(localFilePath, { encoding: 'base64' }),
      branch,
      sha
    })
    return res.status === 200
  }
}

async function downloadRemoteToLocal (syncConfig: SyncConfig, fileName: string) {
  const localFilePath = path.join(STORE_PATH, fileName)
  const { username, repo, branch, token, proxy, type } = syncConfig
  if (type === 'gitee') {
    const url = `https://gitee.com/api/v5/repos/${username}/${repo}/contents/${fileName}`
    const res = await axios.get(url, {
      params: {
        access_token: token,
        ref: branch
      }
    })
    if (res.status >= 200 && res.status < 300) {
      const content = res.data.content
      await fs.writeFile(localFilePath, Buffer.from(content, 'base64'))
      return true
    }
    return false
  } else {
    const octokit = getOctokit(syncConfig)
    try {
      const res = await octokit.rest.repos.getContent({
        owner: username,
        repo,
        path: fileName,
        ref: branch
      })
      if (res.status === 200) {
        const data = res.data as any
        const downloadUrl = data.download_url
        const downloadRes = await axios.get(downloadUrl, {
          httpsAgent: proxy
            ? new HttpsProxyAgent({
              keepAlive: true,
              keepAliveMsecs: 1000,
              rejectUnauthorized: false,
              proxy: proxy.replace('127.0.0.1', 'localhost'),
              scheduling: 'lifo'
            })
            : undefined
        })
        if (downloadRes.status >= 200 && downloadRes.status < 300) {
          await fs.writeFile(localFilePath, JSON.stringify(downloadRes.data, null, 2))
          return true
        }
      }
      return false
    } catch (error: any) {
      logger.error(error)
      return false
    }
  }
}

async function uploadFile (fileName: string, all = false) {
  const syncConfig = getSyncConfig()
  if (!syncConfigValidator(syncConfig)) {
    logger.error('sync config is invalid')
    return 0
  }
  let successCount = 0
  if (all) {
    for (const file of configFileNames) {
      const result = await uploadFunc(syncConfig, file)
      if (result) {
        successCount++
      }
    }
    logger.info(`upload all files at ${new Date().toLocaleString()}`)
    return successCount
  } else {
    const ressult = await uploadFunc(syncConfig, fileName)
    return ressult ? 1 : 0
  }
}

async function uploadFunc (syncConfig: SyncConfig, fileName: string) {
  let result = false
  try {
    result = await updateLocalToRemote(syncConfig, fileName)
  } catch (error: any) {
    result = await uploadLocalToRemote(syncConfig, fileName)
  }
  if (!result) {
    logger.error(`upload ${fileName} failed`)
    return false
  } else {
    logger.info(`upload ${fileName} success`)
    return true
  }
}

async function downloadFile (fileName: string, all = false) {
  const syncConfig = getSyncConfig()
  if (!syncConfigValidator(syncConfig)) {
    logger.error('sync config is invalid')
    return 0
  }
  if (all) {
    let successCount = 0
    for (const file of configFileNames) {
      const result = await downloadFunc(syncConfig, file)
      if (result) {
        successCount++
      }
    }
    logger.info(`download all files at ${new Date().toLocaleString()}`)
    return successCount
  } else {
    const result = await downloadFunc(syncConfig, fileName)
    return result ? 1 : 0
  }
}

async function downloadFunc (syncConfig: SyncConfig, fileName: string) {
  const result = await downloadRemoteToLocal(syncConfig, fileName)
  if (!result) {
    logger.error(`download ${fileName} failed`)
    return false
  } else {
    logger.info(`download ${fileName} success`)
    return true
  }
}

export {
  uploadFile,
  downloadFile
}
