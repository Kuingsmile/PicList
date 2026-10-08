import path from 'node:path'
import { pathToFileURL } from 'node:url'

import picgo from '@core/picgo'
import { uploadChoosedFiles, uploadClipboardFiles } from 'apis/app/uploader/apis'
import windowManager from 'apis/app/window/windowManager'
import { app, clipboard, Menu, MenuItem, MenuItemConstructorOptions, nativeTheme, screen, Tray } from 'electron'
import fs from 'fs-extra'

import { getDefaultTrayClickAction, ITrayClickAction } from '#/constants/app'
import { CLIPBOARD_FILES, UPDATE_FILES } from '#/constants/ipcChannels'
import { IWindowList } from '~/constants'
import { buildPicBedListMenu } from '~/events/remotes/menu'
import { t } from '~/i18n'
import { UploadJob } from '~/services/uploads/uploadJob'
import { getClipboardFilePath } from '~/utils/clipboard'
import clipboardPoll from '~/utils/clipboardPoll'
import { configPaths } from '~/utils/configPaths'
import { isImage } from '~/utils/filesystem'
import { isMacOSVersionGreaterThanOrEqualTo } from '~/utils/getMacOSVersion'
import { getTrayWindowPosition, isTrayWindowJustHidden, setTray, tray } from '~/utils/tray'
import { hideMiniWindow, openMainWindow, openMiniWindow } from '~/utils/windowHelper'

import menubarPng from '../../../../../resources/menubar.png?asset&asarUnpack'
import menubarNewDarwinTemplate from '../../../../../resources/menubar-newdarwinTemplate.png?asset&asarUnpack'
import menubarNodarwin from '../../../../../resources/menubar-nodarwin.png?asset&asarUnpack'
import uploadPng from '../../../../../resources/upload.png?asset&asarUnpack'
import uploadDarkPng from '../../../../../resources/upload-dark.png?asset&asarUnpack'
let contextMenu: Menu | null

export function setDockMenu() {
  const isListeningClipboard = picgo.getConfig<boolean | undefined>(configPaths.settings.isListeningClipboard) || false
  const dockMenu = Menu.buildFromTemplate([
    {
      label: t('main.menu.openMainWindow'),
      click: openMainWindow,
    },
    {
      label: t('main.menu.startWatchClipboard'),
      click() {
        picgo.saveConfig({ [configPaths.settings.isListeningClipboard]: true })
        clipboardPoll.startListening()
        clipboardPoll.on('change', () => {
          picgo.log.info('clipboard changed')
          uploadClipboardFiles()
        })
        setDockMenu()
      },
      visible: !isListeningClipboard,
    },
    {
      label: t('main.menu.stopWatchClipboard'),
      click() {
        picgo.saveConfig({ [configPaths.settings.isListeningClipboard]: false })
        clipboardPoll.stopListening()
        clipboardPoll.removeAllListeners()
        setDockMenu()
      },
      visible: isListeningClipboard,
    },
  ])
  app.dock?.setMenu(dockMenu)
}

export function createMenu() {
  const submenu = buildPicBedListMenu()
  const appMenu = Menu.buildFromTemplate([
    {
      label: 'PicList',
      submenu: [
        {
          label: t('main.menu.about'),
          click() {
            windowManager.create(IWindowList.ABOUT_WINDOW)
          },
        },
        { type: 'separator' },
        { label: t('main.menu.openMainWindow'), click: openMainWindow },
        {
          label: t('main.menu.restartApp'),
          click() {
            app.relaunch()
            app.quit()
          },
        },
      ],
    },
    { label: t('main.menu.chooseDefaultPicBed'), type: 'submenu', submenu },
    {
      label: 'Edit',
      submenu: [
        { label: 'Undo', accelerator: 'CmdOrCtrl+Z', role: 'undo' },
        { label: 'Redo', accelerator: 'Shift+CmdOrCtrl+Z', role: 'redo' },
        { type: 'separator' },
        { label: 'Cut', accelerator: 'CmdOrCtrl+X', role: 'cut' },
        { label: 'Copy', accelerator: 'CmdOrCtrl+C', role: 'copy' },
        { label: 'Paste', accelerator: 'CmdOrCtrl+V', role: 'paste' },
        { label: 'Select All', accelerator: 'CmdOrCtrl+A', role: 'selectAll' },
      ],
    },
    {
      role: 'windowMenu',
      submenu: [
        { role: 'minimize' },
        { role: 'zoom' },
        { type: 'separator' },
        { role: 'close' },
        { type: 'separator' },
        { role: 'front' },
      ],
    },
    {
      label: t('main.menu.quit'),
      submenu: [{ label: t('main.menu.quit'), role: 'quit' }],
    },
  ])
  Menu.setApplicationMenu(appMenu)
}

export function createContextMenu() {
  const ClipboardWatcher = clipboardPoll
  const isListeningClipboard = picgo.getConfig<boolean | undefined>(configPaths.settings.isListeningClipboard) || false
  const isMiniWindowVisible = windowManager.get(IWindowList.MINI_WINDOW)?.isVisible() || false

  const startWatchClipboard = () => {
    picgo.saveConfig({ [configPaths.settings.isListeningClipboard]: true })
    ClipboardWatcher.startListening()
    ClipboardWatcher.on('change', () => {
      picgo.log.info('clipboard changed')
      uploadClipboardFiles()
    })
    createContextMenu()
  }

  const stopWatchClipboard = () => {
    picgo.saveConfig({ [configPaths.settings.isListeningClipboard]: false })
    ClipboardWatcher.stopListening()
    ClipboardWatcher.removeAllListeners()
    createContextMenu()
  }

  if (process.platform === 'darwin' || process.platform === 'win32') {
    const submenu = buildPicBedListMenu()
    const template: (MenuItemConstructorOptions | MenuItem)[] = [
      { label: t('main.menu.openMainWindow'), click: openMainWindow },
      { label: t('main.menu.chooseDefaultPicBed'), type: 'submenu', submenu },
      {
        label: t('main.menu.startWatchClipboard'),
        click: startWatchClipboard,
        visible: !isListeningClipboard,
      },
      {
        label: t('main.menu.stopWatchClipboard'),
        click: stopWatchClipboard,
        visible: isListeningClipboard,
      },
      {
        label: t('main.menu.restartApp'),
        click() {
          app.relaunch()
          app.quit()
        },
      },
      { label: t('main.menu.quit'), role: 'quit' },
    ]
    if (process.platform === 'win32') {
      template.splice(
        2,
        0,
        {
          label: t('main.menu.openMiniWindow'),
          click() {
            openMiniWindow(false)
          },
          visible: !isMiniWindowVisible,
        },
        {
          label: t('main.menu.hideMiniWindow'),
          click: hideMiniWindow,
          visible: isMiniWindowVisible,
        },
      )
    }
    contextMenu = Menu.buildFromTemplate(template)
  } else if (process.platform === 'linux') {
    // TODO 图床选择功能
    // 由于在Linux难以像在Mac和Windows上那样在点击时构造ContextMenu，
    // 暂时取消这个选单，避免引起和设置中启用的图床不一致

    // TODO 重启应用功能
    // 目前的实现无法正常工作

    contextMenu = Menu.buildFromTemplate([
      { label: t('main.menu.openMainWindow'), click: openMainWindow },
      {
        label: t('main.menu.openMiniWindow'),
        click() {
          openMiniWindow(false)
        },
        visible: !isMiniWindowVisible,
      },
      {
        label: t('main.menu.hideMiniWindow'),
        click: hideMiniWindow,
        visible: isMiniWindowVisible,
      },
      {
        label: t('main.menu.startWatchClipboard'),
        click: startWatchClipboard,
        visible: !isListeningClipboard,
      },
      {
        label: t('main.menu.stopWatchClipboard'),
        click: stopWatchClipboard,
        visible: isListeningClipboard,
      },
      {
        label: t('main.menu.about'),
        click() {
          windowManager.create(IWindowList.ABOUT_WINDOW)
        },
      },
      { label: t('main.menu.quit'), role: 'quit' },
    ])
  }
}

const getTrayIcon = () => {
  if (process.platform === 'darwin') {
    const isMacOSGreaterThan11 = isMacOSVersionGreaterThanOrEqualTo('11')
    return isMacOSGreaterThan11 ? menubarNewDarwinTemplate : menubarPng
  } else {
    return menubarNodarwin
  }
}

export function createTray(tooltip: string) {
  const menubarPic = getTrayIcon()
  setTray(new Tray(menubarPic))
  tray.setToolTip(tooltip)
  // click事件在Mac和Windows上可以触发（在Ubuntu上无法触发，Unity不支持）
  if (process.platform === 'darwin' || process.platform === 'win32') {
    tray.on('right-click', () => {
      windowManager.get(IWindowList.TRAY_WINDOW)?.hide()
      createContextMenu()
      tray?.popUpContextMenu(contextMenu!)
    })

    tray.on('click', (_, bounds) => {
      const clickAction =
        picgo.getConfig<string | undefined>(configPaths.settings.trayClickAction) ||
        getDefaultTrayClickAction(process.platform)
      if (clickAction === ITrayClickAction.PANEL) {
        toggleTrayPanel(bounds)
      } else {
        windowManager.get(IWindowList.TRAY_WINDOW)?.hide()
        openMainWindow()
      }
    })

    tray.on('drag-enter', () => {
      if (nativeTheme.shouldUseDarkColors) {
        tray?.setImage(uploadDarkPng)
      } else {
        tray?.setImage(uploadPng)
      }
    })

    tray.on('drag-end', () => {
      tray?.setImage(getTrayIcon())
    })

    // drop-files only be supported in macOS
    // so the tray window must be available
    if (process.platform === 'darwin') {
      ;(tray as any).on('drop-files', async (_: Event, files: string[]) => {
        const trayWindow = windowManager.get(IWindowList.TRAY_WINDOW)
        await uploadChoosedFiles(
          trayWindow?.webContents,
          files.map(path => ({ path })),
          undefined,
          new UploadJob({ origin: trayWindow?.webContents }),
          { copy: true, notification: 'individual' },
        )
      })
    }
  } else if (process.platform === 'linux') {
    // click事件在Ubuntu上无法触发，Unity不支持（在Mac和Windows上可以触发）
    // 需要使用 setContextMenu 设置菜单
    createContextMenu()
    tray?.setContextMenu(contextMenu)
  }
}

function toggleTrayPanel(bounds: Electron.Rectangle) {
  const existing = windowManager.get(IWindowList.TRAY_WINDOW)
  if (existing?.isVisible()) {
    existing.hide()
    return
  }
  // The click that blurred the open panel should only close it.
  if (isTrayWindowJustHidden()) return
  const trayWindow = existing ?? windowManager.create(IWindowList.TRAY_WINDOW)
  if (!trayWindow) return
  const [width, height] = trayWindow.getSize()
  const { workArea } = screen.getDisplayMatching(bounds)
  const { x, y } = getTrayWindowPosition(bounds, { width, height }, workArea, process.platform === 'darwin' ? 4 : 12)
  trayWindow.setPosition(x, y, false)
  const reveal = () => {
    trayWindow.webContents.send(UPDATE_FILES)
    sendClipboardFiles()
    trayWindow.show()
    trayWindow.focus()
  }
  // Show once rendered, so a new panel never flashes empty.
  if (trayWindow.webContents.isLoading()) {
    trayWindow.webContents.once('did-finish-load', reveal)
  } else {
    reveal()
  }
}

// Preview what the built-in clipboard upload would send: a copied file (Finder/Explorer) or raw image data.
async function sendClipboardFiles() {
  const img = clipboard.readImage()
  const files: ImgInfo[] = []
  const filePath = getClipboardFilePath(img)
  const isFile = filePath
    ? await fs.stat(filePath).then(
        stat => stat.isFile(),
        () => false,
      )
    : false
  if (isFile) {
    const fileName = path.basename(filePath)
    files.push({ fileName, imgUrl: isImage(fileName) ? pathToFileURL(filePath).href : '' })
  } else if (!img.isEmpty()) {
    const { width, height } = img.getSize()
    files.push({ width, height, imgUrl: img.toDataURL() })
  }
  windowManager.get(IWindowList.TRAY_WINDOW)?.webContents.send(CLIPBOARD_FILES, files)
}
