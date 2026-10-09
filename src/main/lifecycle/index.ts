import '~/lifecycle/errorHandler'

import path from 'node:path'
import { clearTimeout, setTimeout } from 'node:timers'

import bus from '@core/bus'
import picgo from '@core/picgo'
import logger from '@core/picgo/logger'
import windowManager from 'apis/app/window/windowManager'
import { app, globalShortcut, protocol, screen } from 'electron'
import fs from 'fs-extra'

import { IWindowList } from '~/constants'
import busEventList from '~/events/busEventList'
import { stopFileServer } from '~/fileServer'
import rpcServer from '~/ipc'
import { setupAutoUpdater } from '~/lifecycle/autoUpdater'
import fixPath from '~/lifecycle/fixPath'
import { handleStartUpFiles, initializeStartup } from '~/lifecycle/startup'
import getManageApi from '~/manage'
import UpDownTaskQueue from '~/manage/datastore/upDownTaskQueue'
import { transferScheduler } from '~/manage/transferScheduler'
import { clearTempFolder } from '~/manage/utils/common'
import server from '~/server/index'
import UploadTaskQueueManager from '~/services/uploads/uploadTaskQueue'
import { isAutoStartEnabled, setAutoStart } from '~/utils/autoStart'
import beforeOpen from '~/utils/beforeOpen'
import clipboardPoll from '~/utils/clipboardPoll'
import { configPaths } from '~/utils/configPaths'
import { initI18n } from '~/utils/handleI18n'
import { runScriptInStage } from '~/utils/runScript'
import { CLIPBOARD_IMAGE_FOLDER } from '~/utils/static'
import { pruneGallerySyncSnapshots } from '~/utils/syncSettings'

const isDevelopment = process.env.NODE_ENV !== 'production'
const SHUTDOWN_GRACE_PERIOD_MS = 5000
process.noDeprecation = true

const waitForShutdown = async (operation: Promise<unknown>) => {
  let timer: NodeJS.Timeout | undefined
  try {
    await Promise.race([
      operation,
      new Promise<never>((_, reject) => {
        timer = setTimeout(() => reject(new Error('Shutdown grace period expired')), SHUTDOWN_GRACE_PERIOD_MS)
      }),
    ])
  } finally {
    clearTimeout(timer)
  }
}

const isPointInRect = (point: Electron.Point, rect: Electron.Rectangle) =>
  point.x >= rect.x && point.x < rect.x + rect.width && point.y >= rect.y && point.y < rect.y + rect.height

const isLikelyDockActivation = () => {
  if (process.platform !== 'darwin') return true

  const cursorPoint = screen.getCursorScreenPoint()
  const display = screen.getDisplayNearestPoint(cursorPoint)
  const isInWorkArea = isPointInRect(cursorPoint, display.workArea)
  const isInMenuBar =
    cursorPoint.y >= display.bounds.y &&
    cursorPoint.y < display.workArea.y &&
    cursorPoint.x >= display.workArea.x &&
    cursorPoint.x < display.workArea.x + display.workArea.width

  return !isInWorkArea && !isInMenuBar
}

const syncAutoStart = async () => {
  const enabled = picgo.getConfig<boolean>(configPaths.settings.autoStart) || false
  try {
    if ((await isAutoStartEnabled()) === enabled) return
    logger.warn('Auto-start state mismatch detected; syncing the stored preference')
  } catch {
    logger.error('Failed to check auto-start status; applying the stored preference')
  }

  try {
    await setAutoStart(enabled)
  } catch {
    logger.error('Failed to sync auto-start')
  }
}

class LifeCycle {
  #launchPromise?: Promise<void>
  #preparation?: Promise<void>
  #quitting = false
  #queuesReady = false

  #configureBeforeReady() {
    // Electron accepts a single registration, before any asynchronous preparation.
    protocol.registerSchemesAsPrivileged([
      { scheme: 'picgo', privileges: { secure: true, standard: true } },
      { scheme: 'theme', privileges: { standard: true, secure: true, supportFetchAPI: true } },
    ])
    if (picgo.getConfig<boolean>(configPaths.settings.isDisableGPU)) {
      app.disableHardwareAcceleration()
    }
    if (process.platform === 'win32') {
      app.setAppUserModelId('com.kuingsmile.piclist')
    }
    if (process.env.XDG_CURRENT_DESKTOP?.includes('Unity')) {
      process.env.XDG_CURRENT_DESKTOP = 'Unity'
    }
    setupAutoUpdater()
  }

  async #prepare() {
    // These operations are independent; cleanup must finish before uploads can start.
    await Promise.all([
      fixPath(),
      beforeOpen(),
      fs.emptyDir(path.join(picgo.baseDir, CLIPBOARD_IMAGE_FOLDER)).catch(() => {
        logger.error('Failed to clear the clipboard image directory')
      }),
    ])
    if (this.#quitting) return

    getManageApi()
    UpDownTaskQueue.getInstance()
    // Register journal references before any uploader can prune finalization history.
    UploadTaskQueueManager.getInstance()
    await pruneGallerySyncSnapshots().catch(() => logger.error('Gallery snapshot cleanup failed'))
    this.#queuesReady = true
    initI18n()
    rpcServer.start()
    busEventList.listen()
  }

  #whenRunning(callback: () => void) {
    void this.#launchPromise
      ?.then(() => {
        if (!this.#quitting) callback()
      })
      .catch(() => {
        logger.error('Failed to handle application activation')
      })
  }

  #onRunning() {
    app.on('second-instance', (_, commandLine, workingDirectory) => {
      this.#whenRunning(() => {
        logger.info('detect second instance')
        if (!handleStartUpFiles(commandLine, workingDirectory)) {
          windowManager.create(IWindowList.SETTING_WINDOW)
        }
      })
    })
    app.on('activate', () => {
      this.#whenRunning(() => {
        if (!windowManager.has(IWindowList.SETTING_WINDOW) && isLikelyDockActivation()) {
          windowManager.create(IWindowList.SETTING_WINDOW)
        }
      })
    })
  }

  async #shutdown() {
    // A quit during preparation must not race with starting services or restoring queues.
    await this.#preparation?.catch(() => {})
    const tasks = [
      ['clipboard watcher', () => clipboardPoll.stopListening(false)],
      ['global shortcuts', () => globalShortcut.unregisterAll()],
      ['RPC server', () => rpcServer.stop()],
      ['upload server', () => waitForShutdown(server.shutdown())],
      ['file server', () => waitForShutdown(stopFileServer())],
      [
        'management checkpoints',
        async () => {
          if (!this.#queuesReady) return
          try {
            await waitForShutdown(transferScheduler.shutdown())
          } finally {
            // Uncooperative providers may exceed the grace period; still checkpoint interrupted work.
            await UpDownTaskQueue.getInstance().flush()
          }
        },
      ],
      ['upload checkpoints', () => this.#queuesReady && UploadTaskQueueManager.getInstance().shutdown()],
      ['software-close scripts', () => waitForShutdown(runScriptInStage('onSoftwareClose', picgo, {}))],
    ] as const
    // Wrap each call so a synchronous failure cannot skip the remaining cleanup.
    const results = await Promise.allSettled(tasks.map(async ([, cleanup]) => cleanup()))
    results.forEach((result, index) => {
      if (result.status === 'rejected') logger.error(`Failed to clean up ${tasks[index][0]} before quit`)
    })
  }

  #onQuit() {
    app.on('window-all-closed', () => {})

    let flushed = false
    app.on('before-quit', event => {
      if (flushed) return
      event.preventDefault()
      if (this.#quitting) return
      this.#quitting = true
      void this.#shutdown().finally(() => {
        flushed = true
        app.quit()
      })
    })

    app.on('will-quit', () => {
      try {
        clearTempFolder()
      } catch {
        logger.error('Failed to clear temporary files before quit')
      }
      bus.removeAllListeners()
    })

    // Exit cleanly on request from the development parent process.
    if (isDevelopment) {
      if (process.platform === 'win32') {
        process.on('message', data => {
          if (data === 'graceful-exit') app.quit()
        })
      } else {
        process.on('SIGTERM', () => app.quit())
      }
    }
  }

  async #launch() {
    if (!app.requestSingleInstanceLock()) {
      app.quit()
      return
    }

    this.#configureBeforeReady()
    this.#onRunning()
    this.#onQuit()
    this.#preparation = this.#prepare()
    await this.#preparation
    if (this.#quitting) return
    await app.whenReady()
    if (this.#quitting) return

    initializeStartup()
    void syncAutoStart()
  }

  launchApp(): Promise<void> {
    this.#launchPromise ??= this.#launch()
    return this.#launchPromise
  }
}

const lifeCycle = new LifeCycle()

export { lifeCycle }
