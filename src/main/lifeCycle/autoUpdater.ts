import { spawn } from 'node:child_process'
import { createHash } from 'node:crypto'
import path from 'node:path'
import { fileURLToPath } from 'node:url'

import { defaultDir, exeDir, exePath, isPortable } from '@core/datastore/dirs'
import picgo from '@core/picgo'
import logger from '@core/picgo/logger'
import windowManager from 'apis/app/window/windowManager'
import axios, { AxiosRequestConfig } from 'axios'
import { app } from 'electron'
import updater from 'electron-updater'
import fs from 'fs-extra'
import pkg from 'root/package.json'
import yaml from 'yaml'

import { configPaths } from '~/utils/configPaths'
import { II18nLanguage, IWindowList } from '~/utils/enum'
const dirname = path.dirname(fileURLToPath(import.meta.url))

let newVersion = ''
const updateAvailableHandler = async (info: updater.UpdateInfo) => {
  const lang = picgo.getConfig<string>(configPaths.settings.language) || II18nLanguage.ZH_CN
  let updateLog = ''
  try {
    const url =
      lang === II18nLanguage.ZH_CN
        ? 'https://release.piclist.cn/currentVersion.md'
        : 'https://release.piclist.cn/currentVersion_en.md'
    const res = await axios.get(url)
    updateLog = res.data
  } catch (e: any) {
    logger.error(e)
  }

  const maxLogLength = 8000
  let displayLog = updateLog
  let truncatedNote = ''

  if (updateLog.length > maxLogLength) {
    const truncatePoint = updateLog.lastIndexOf('\n', maxLogLength)
    displayLog = updateLog.substring(0, truncatePoint > 0 ? truncatePoint : maxLogLength)
    truncatedNote =
      lang === II18nLanguage.ZH_CN
        ? '\n\n... (更多详情请查看完整更新日志)'
        : '\n\n... (See full changelog for more details)'
  }

  windowManager.create(IWindowList.UPDATE_WINDOW)
  const updateWindow = windowManager.get(IWindowList.UPDATE_WINDOW)

  updateWindow?.webContents.once('did-finish-load', () => {
    updateWindow.webContents.send('SHOW_UPDATE_INFO', {
      type: 'update-available',
      title: lang === II18nLanguage.ZH_CN ? '发现新版本' : 'New Update Available',
      version: info.version,
      releaseNotes: displayLog + truncatedNote,
    })
  })

  updateWindow?.show()
}

const progressHandler = (progressObj: updater.ProgressInfo) => {
  const percent = {
    progress: progressObj.percent,
  }
  windowManager.get(IWindowList.SETTING_WINDOW)?.webContents?.send('updateProgress', percent)
  windowManager.get(IWindowList.UPDATE_WINDOW)?.webContents?.send('UPDATE_PROGRESS', percent)
}

const downloadedHandler = () => {
  const lang = picgo.getConfig<string>(configPaths.settings.language) || II18nLanguage.ZH_CN

  if (!windowManager.has(IWindowList.UPDATE_WINDOW)) {
    windowManager.create(IWindowList.UPDATE_WINDOW)
  }
  const updateWindow = windowManager.get(IWindowList.UPDATE_WINDOW)

  const sendUpdateInfo = () => {
    updateWindow?.webContents.send('SHOW_UPDATE_INFO', {
      type: 'update-downloaded',
      title: lang === II18nLanguage.ZH_CN ? '更新已下载' : 'Update Downloaded',
      message:
        lang === II18nLanguage.ZH_CN
          ? '更新已下载完成，将在下次重启应用时安装。是否立即重启？'
          : 'The update has been downloaded and will be installed on the next app restart. Would you like to restart now?',
    })
  }

  if (updateWindow?.webContents.isLoading()) {
    updateWindow.webContents.once('did-finish-load', sendUpdateInfo)
  } else {
    sendUpdateInfo()
  }

  if (!updateWindow?.isVisible()) {
    updateWindow?.show()
  }
}

export async function setupAutoUpdater() {
  if (!isPortable()) {
    updater.autoUpdater.setFeedURL({
      provider: 'generic',
      url: 'https://release.piclist.cn/latest',
      channel: 'latest',
    })

    updater.autoUpdater.forceDevUpdateConfig = true
    updater.autoUpdater.autoDownload = false
    updater.autoUpdater.on('update-available', updateAvailableHandler)
    updater.autoUpdater.on('download-progress', progressHandler)
    updater.autoUpdater.on('update-downloaded', downloadedHandler)
    updater.autoUpdater.on('error', err => {
      logger.error(err)
    })
  }
}

export async function checkUpdateAndNotify(): Promise<void> {
  const url = 'https://release.piclist.cn/latest/latest.yml'
  const res = await axios.get(url, {
    headers: { 'Content-Type': 'application/octet-stream' },
    responseType: 'text',
  })
  const latest = yaml.parseDocument(res.data).toJSON() as unknown as updater.UpdateInfo
  const currentVersion = pkg.version
  if (latest.version !== currentVersion) {
    newVersion = latest.version
    updateAvailableHandler(latest)
  }
}

export async function downloadAndInstallUpdate(): Promise<void> {
  const baseUrl = 'https://release.piclist.cn/latest'
  const fileMap = {
    'win32-x64': `PicList-Setup-${newVersion.replace(/^v/, '')}-x64-portable.7z`,
    'win32-arm64': `PicList-Setup-${newVersion.replace(/^v/, '')}-arm64-portable.7z`,
  } as Record<string, string>
  const file = fileMap[`${process.platform}-${process.arch}`]
  if (!file) {
    logger.error('No update file available for this platform and architecture.')
    return
  }
  const apiUrl = `https://api.github.com/repos/Kuingsmile/PicList/releases/tags/v${newVersion.replace(/^v/, '')}`
  const apiReqConfig: AxiosRequestConfig = {
    headers: {
      Accept: 'application/vnd.github.v3+json',
      'User-Agent': 'PicList-Updater',
    },
  }
  try {
    progressHandler({ percent: 0 } as updater.ProgressInfo)
    const releaseRes = await axios.get(apiUrl, apiReqConfig)
    const assets: { name: string; digest?: string }[] = releaseRes.data.assets || []
    const matchedAsset = assets.find(asset => asset.name === file)
    if (!matchedAsset || !matchedAsset.digest) {
      logger.error('No sha256 digest found for the update asset.')
      return
    }
    const expectedHash = matchedAsset.digest.split(':')[1].toLowerCase()
    const targetFilePath = path.join(defaultDir(), file)
    if (!fs.existsSync(targetFilePath)) {
      const downloadRes = await axios.get(`${baseUrl}/${file}`, {
        responseType: 'arraybuffer',
        headers: { 'Content-Type': 'application/octet-stream' },
        onDownloadProgress: progressEvent => {
          const percentCompleted = (progressEvent.loaded / (progressEvent.total || 1)) * 100
          progressHandler({ percent: percentCompleted } as updater.ProgressInfo)
        },
      })
      await fs.writeFile(targetFilePath, downloadRes.data)
    }
    const fileBuffer = await fs.readFile(targetFilePath)
    const sha256 = createHash('sha256').update(fileBuffer).digest('hex').toLowerCase()
    if (sha256 !== expectedHash) {
      await fs.remove(targetFilePath)
      logger.error('Downloaded file hash does not match expected hash. Update aborted.')
      return
    }
    progressHandler({ percent: 100 } as updater.ProgressInfo)
    const zipFilePath = path.join(dirname, '../../resources/7za.exe').replace('app.asar', 'app.asar.unpacked')
    await fs.copyFile(zipFilePath, path.join(defaultDir(), '7za.exe'))
    logger.info('Starting update installation...')
    spawn(
      'cmd',
      [
        '/C',
        `"timeout /t 2 /nobreak >nul && "${path.join(defaultDir(), '7za.exe')}" x -o"${exeDir()}" -y "${path.join(defaultDir(), file)}" & start "" "${exePath()}""`,
      ],
      {
        detached: true,
        shell: true,
        stdio: 'ignore',
      },
    ).unref()
    app.quit()
  } catch (error: any) {
    await fs.remove(path.join(defaultDir(), file))
    logger.error('Error downloading update:', String(error))
  }
}
