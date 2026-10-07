import path from 'node:path'
import type { Readable } from 'node:stream'
import { fileURLToPath } from 'node:url'

import { defaultDir, exeDir, exePath, isPortable } from '@core/datastore/dirs'
import picgo from '@core/picgo'
import logger from '@core/picgo/logger'
import windowManager from 'apis/app/window/windowManager'
import axios from 'axios'
import { app } from 'electron'
import updater from 'electron-updater'
import fs from 'fs-extra'
import pkg from 'root/package.json'
import yaml from 'yaml'

import { II18nLanguage } from '#/constants/app'
import { TITLE_BAR_UPDATE_PROGRESS, UPDATE_PROGRESS } from '#/constants/ipcChannels'
import { IWindowList } from '~/constants'
import { configPaths } from '~/utils/configPaths'
import {
  downloadPortableArchive,
  extractPortableArchive,
  isNewerPortableVersion,
  portableArchitecture,
  type PortableUpdate,
  portableVersion,
  selectPortableUpdate,
  startPortableInstaller,
  validatePortableAsset,
  validatePortablePayload,
} from '~/utils/portableUpdate'

const dirname = path.dirname(fileURLToPath(import.meta.url))
const RELEASE_URL = 'https://release.piclist.cn'
const UPDATE_URL = `${RELEASE_URL}/latest`
const MAX_CHANGELOG_LENGTH = 8000

type UpdateNotification =
  | { type: 'update-available'; title: string; version: string; releaseNotes: string }
  | { type: 'update-downloaded'; title: string; message: string }
  | { type: 'update-error'; title: string; version?: string; message: string }

let portableUpdate: PortableUpdate | undefined
let checkingPortableUpdate = false
let downloadingPortableUpdate = false
let autoUpdaterConfigured = false
let updateNotificationId = 0

const showUpdateInfo = (info: UpdateNotification, notificationId = ++updateNotificationId) => {
  if (notificationId !== updateNotificationId) return
  const updateWindow = windowManager.create(IWindowList.UPDATE_WINDOW)
  if (!updateWindow || updateWindow.isDestroyed()) return

  const send = () => {
    if (
      notificationId === updateNotificationId &&
      !updateWindow.isDestroyed() &&
      !updateWindow.webContents.isDestroyed()
    ) {
      updateWindow.webContents.send('SHOW_UPDATE_INFO', info)
    }
  }
  if (updateWindow.webContents.isLoading()) {
    updateWindow.webContents.once('did-finish-load', send)
  } else {
    send()
  }
  updateWindow.show()
}

const getUpdateLanguage = () => picgo.getConfig<string>(configPaths.settings.language) || II18nLanguage.ZH_CN

const getReleaseNotes = async (lang: string): Promise<string> => {
  let updateLog = ''
  try {
    const url =
      lang === II18nLanguage.ZH_CN ? `${RELEASE_URL}/currentVersion.md` : `${RELEASE_URL}/currentVersion_en.md`
    const res = await axios.get(url, { responseType: 'text', timeout: 10_000, maxContentLength: 1024 * 1024 })
    if (typeof res.data === 'string') updateLog = res.data
  } catch {
    logger.error('Could not fetch the update changelog')
  }

  if (updateLog.length <= MAX_CHANGELOG_LENGTH) return updateLog
  const truncatePoint = updateLog.lastIndexOf('\n', MAX_CHANGELOG_LENGTH)
  const displayLog = updateLog.slice(0, truncatePoint > 0 ? truncatePoint : MAX_CHANGELOG_LENGTH)
  const truncatedNote =
    lang === II18nLanguage.ZH_CN
      ? '\n\n... (更多详情请查看完整更新日志)'
      : '\n\n... (See full changelog for more details)'
  return displayLog + truncatedNote
}

const updateAvailableHandler = async (info: Pick<updater.UpdateInfo, 'version'>) => {
  // A slow changelog request must not overwrite a newer notification or a completed download.
  const notificationId = ++updateNotificationId
  const lang = getUpdateLanguage()
  const releaseNotes = await getReleaseNotes(lang)
  showUpdateInfo(
    {
      type: 'update-available',
      title: lang === II18nLanguage.ZH_CN ? '发现新版本' : 'New Update Available',
      version: info.version,
      releaseNotes,
    },
    notificationId,
  )
}

const progressHandler = (progressObj: Pick<updater.ProgressInfo, 'percent'>) => {
  const percent = {
    progress: progressObj.percent,
  }
  windowManager.get(IWindowList.SETTING_WINDOW)?.webContents?.send(TITLE_BAR_UPDATE_PROGRESS, percent)
  windowManager.get(IWindowList.UPDATE_WINDOW)?.webContents?.send(UPDATE_PROGRESS, percent)
}

const downloadedHandler = () => {
  const lang = getUpdateLanguage()
  showUpdateInfo({
    type: 'update-downloaded',
    title: lang === II18nLanguage.ZH_CN ? '更新已下载' : 'Update Downloaded',
    message:
      lang === II18nLanguage.ZH_CN
        ? '更新已下载完成，将在下次重启应用时安装。是否立即重启？'
        : 'The update has been downloaded and will be installed on the next app restart. Would you like to restart now?',
  })
}

export function setupAutoUpdater(): void {
  if (isPortable() || autoUpdaterConfigured) return

  const { autoUpdater } = updater
  autoUpdater.setFeedURL({ provider: 'generic', url: UPDATE_URL, channel: 'latest' })
  autoUpdater.forceDevUpdateConfig = true
  autoUpdater.autoDownload = false
  autoUpdater.on('update-available', updateAvailableHandler)
  autoUpdater.on('download-progress', progressHandler)
  autoUpdater.on('update-downloaded', downloadedHandler)
  autoUpdater.on('error', () => logger.error('Application update failed'))
  autoUpdaterConfigured = true
}

export async function checkUpdateAndNotify(): Promise<void> {
  if (checkingPortableUpdate || downloadingPortableUpdate) return
  checkingPortableUpdate = true
  // A failed check or an ineligible release must never leave an old selection active.
  portableUpdate = undefined
  try {
    portableArchitecture(process.platform, process.arch)
    const res = await axios.get(`${UPDATE_URL}/latest.yml`, {
      responseType: 'text',
      timeout: 10_000,
      maxContentLength: 1024 * 1024,
    })
    const document = yaml.parseDocument(res.data)
    if (document.errors.length) throw new Error('Invalid portable update manifest')
    portableUpdate = selectPortableUpdate(document.toJSON(), pkg.version, process.platform, process.arch)
    if (portableUpdate) await updateAvailableHandler(portableUpdate)
  } finally {
    checkingPortableUpdate = false
  }
}

/** Reads the release manifest without opening the update window. */
export async function checkForUpdates(): Promise<IUpdateCheckResult> {
  const res = await axios.get(`${UPDATE_URL}/latest.yml`, {
    responseType: 'text',
    timeout: 10_000,
    maxContentLength: 1024 * 1024,
  })
  const document = yaml.parseDocument(res.data)
  if (document.errors.length) throw new Error('Invalid update manifest')
  const latestVersion = portableVersion((document.toJSON() as { version?: unknown } | null)?.version)
  return {
    currentVersion: pkg.version,
    latestVersion,
    hasUpdate: isNewerPortableVersion(pkg.version, latestVersion),
  }
}

/** Opens the regular update window, which offers release notes and the download. */
export async function showUpdateDetails(): Promise<void> {
  if (isPortable()) {
    await checkUpdateAndNotify()
  } else {
    await updater.autoUpdater.checkForUpdates()
  }
}

export async function downloadAndInstallUpdate(): Promise<void> {
  if (checkingPortableUpdate || downloadingPortableUpdate) return
  downloadingPortableUpdate = true
  let stage: string | undefined
  let installerStarted = false
  try {
    const update = selectPortableUpdate(portableUpdate, pkg.version, process.platform, process.arch)
    if (!update) throw new Error('No newer portable update selected')
    progressHandler({ percent: 0 })
    const releaseRes = await axios.get(
      `https://api.github.com/repos/Kuingsmile/PicList/releases/tags/${encodeURIComponent(`v${update.version}`)}`,
      {
        headers: {
          Accept: 'application/vnd.github.v3+json',
          'User-Agent': 'PicList-Updater',
        },
        timeout: 15_000,
        maxContentLength: 4 * 1024 * 1024,
      },
    )
    const expected = validatePortableAsset(releaseRes.data, update)
    const updatesDir = path.join(defaultDir(), 'updates')
    await fs.ensureDir(updatesDir)
    stage = await fs.mkdtemp(path.join(updatesDir, 'portable-'))
    const archive = path.join(stage, update.file)
    const download = await axios.get<Readable>(`${UPDATE_URL}/${encodeURIComponent(update.file)}`, {
      responseType: 'stream',
      timeout: 60_000,
      decompress: false,
      headers: { 'Accept-Encoding': 'identity' },
    })
    await downloadPortableArchive(download.data, archive, expected, percent => {
      progressHandler({ percent })
    })
    const resourcesDir = path.join(dirname, '../../resources').replace('app.asar', 'app.asar.unpacked')
    const extractor = path.join(stage, '7za.exe')
    await fs.copyFile(path.join(resourcesDir, '7za.exe'), extractor)
    const payload = path.join(stage, 'payload')
    await extractPortableArchive(extractor, archive, payload)
    await validatePortablePayload(payload, path.basename(exePath()))
    await fs.copyFile(path.join(resourcesDir, 'portable-update.ps1'), path.join(stage, 'install.ps1'))
    await fs.writeJson(path.join(stage, 'install.json'), {
      installDir: exeDir(),
      executableName: path.basename(exePath()),
      processId: process.pid,
    })
    await startPortableInstaller(stage)
    await fs.writeFile(path.join(stage, 'install-authorized'), '')
    installerStarted = true
    logger.info('Portable update staged; installer is waiting for application exit')
    app.quit()
  } catch {
    // Once the helper owns the stage, its backup and journal must survive failures.
    if (stage && !installerStarted) {
      try {
        await fs.remove(stage)
      } catch {
        logger.error('Could not remove the failed portable update stage')
      }
    }
    logger.error('Portable update failed; the current installation has been preserved')
    const lang = getUpdateLanguage()
    showUpdateInfo({
      type: 'update-error',
      title: lang === II18nLanguage.ZH_CN ? '更新失败' : 'Update Failed',
      version: portableUpdate?.version,
      message:
        lang === II18nLanguage.ZH_CN
          ? '无法准备更新。当前安装未被修改，请重试或前往下载页面。'
          : 'The update could not be prepared. Your current installation is unchanged. Retry or visit the download page.',
    })
  } finally {
    if (!installerStarted) downloadingPortableUpdate = false
  }
}
