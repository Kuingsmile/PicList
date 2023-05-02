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
  file: string
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
  'manage.bak.json',
  'piclist-remote-notice.json',
  'UpDownTaskQueue.json'
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
  const syncConfig = db.get('settings.sync') || {
    type: 'github',
    username: '',
    repo: '',
    branch: '',
    token: '',
    proxy: ''
  }
  return syncConfig
}

function syncConfigValidator (syncConfig: SyncConfig) {
  const { type, file, username, repo, branch, token } = syncConfig
  return type && file && username && repo && branch && token
}

async function getModifiedTime (syncConfig: SyncConfig, filePath: string) {
  const { username, repo, branch, token, type } = syncConfig
  if (type === 'gitee') {
    const url = `https://gitee.com/api/v5/repos/${username}/${repo}/commits`
    const res = await axios.get(url, {
      params: {
        access_token: token,
        ref: branch,
        path: filePath
      }
    })
    const data = res.data
    if (data.length > 0) {
      return data[0].commit.committer.date
    } else {
      return null
    }
  } else {
    const octokit = getOctokit(syncConfig)
    try {
      const res = await octokit.rest.repos.listCommits({
        owner: username,
        repo,
        ref: branch,
        path: filePath,
        per_page: 1
      })
      if (res.status === 200) {
        return res.data.length > 0 ? res.data[0].commit.committer?.date : null
      } else {
        return null
      }
    } catch (error: any) {
      logger.error(error)
      return null
    }
  }
}

async function getModifiedTimeOfLocal (filePath: string) {
  if (!fs.existsSync(filePath)) {
    return new Date(0)
  }
  const stat = await fs.stat(filePath)
  return stat.mtime
}

async function compareNewerFile (syncConfig: SyncConfig, fileName: string): Promise<'upload' | 'download' | 'update' | undefined> {
  const localFilePath = path.join(STORE_PATH, fileName)
  const remoteModifiedTime = await getModifiedTime(syncConfig, fileName)
  if (remoteModifiedTime === null) {
    return 'upload'
  }
  const localModifiedTime = await getModifiedTimeOfLocal(localFilePath)
  if (remoteModifiedTime && localModifiedTime) {
    return Date.parse(remoteModifiedTime) > localModifiedTime.getTime() ? 'download' : 'update'
  } else {
    throw new Error('get modified time failed')
  }
}

async function uploadLocalToRemote (syncConfig: SyncConfig, fileName: string) {
  const localFilePath = path.join(STORE_PATH, fileName)
  const { username, repo, branch, token, type } = syncConfig
  if (type === 'gitee') {
    const url = `https://gitee.com/api/v5/repos/${username}/${repo}/contents/${fileName}`
    const res = await axios.post(url, {
      access_token: token,
      branch,
      content: fs.readFileSync(localFilePath, { encoding: 'base64' }),
      message: `upload ${fileName} from PicList`
    })
    return res.status >= 200 && res.status < 300
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
      return res.status === 200
    } catch (error: any) {
      logger.error(error)
      return false
    }
  }
}

async function updateLocalToRemote (syncConfig: SyncConfig, fileName: string) {
  const localFilePath = path.join(STORE_PATH, fileName)
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
    try {
      const shaRes = await octokit.rest.repos.getContent({
        owner: username,
        repo,
        path: fileName,
        ref: branch
      })
      if (shaRes.status !== 200) {
        return false
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
    } catch (error: any) {
      logger.error(error)
      return false
    }
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

async function syncFile (syncConfig: SyncConfig, fileName: string) {
  const compareResult = await compareNewerFile(syncConfig, fileName)
  let result = false
  if (compareResult === 'upload') {
    result = await uploadLocalToRemote(syncConfig, fileName)
  } else if (compareResult === 'update') {
    result = await updateLocalToRemote(syncConfig, fileName)
  } else if (compareResult === 'download') {
    result = await downloadRemoteToLocal(syncConfig, fileName)
  }
  return result
}

async function syncAllFiles (syncConfig: SyncConfig) {
  for (const file of configFileNames) {
    try {
      const result = await syncFile(syncConfig, file)
      if (result) {
        logger.info(`sync file ${file} success`)
      }
    } catch (error: any) {
      logger.error(`sync file ${file} failed`)
      logger.error(error)
    }
  }
}

async function syncFunc () {
  const syncConfig = await getSyncConfig()
  if (!syncConfigValidator(syncConfig)) {
    return
  }
  await syncAllFiles(syncConfig)
  logger.info(`sync all files at ${new Date().toLocaleString()}`)
}

async function syncInterval () {
  const syncConfig = await getSyncConfig()
  if (!syncConfigValidator(syncConfig)) {
    return
  }
  const syncFunc = async () => {
    await syncAllFiles(syncConfig)
    logger.info(`sync all files at ${new Date().toLocaleString()}`)
  }
  await syncFunc()
  const interval = Number(syncConfig.interval) || 60
  setInterval(async () => {
    syncFunc()
  }, 1000 * 60 * interval)
}

export {
  syncFunc,
  syncInterval
}
