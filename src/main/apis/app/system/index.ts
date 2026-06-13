import { GalleryDB } from '@core/datastore'
import picgo from '@core/picgo'
import uploader from 'apis/app/uploader'
import { uploadClipboardFiles } from 'apis/app/uploader/apis'
import windowManager from 'apis/app/window/windowManager'
import {
  app,
  clipboard,
  dialog,
  Menu,
  MenuItem,
  MenuItemConstructorOptions,
  nativeTheme,
  Notification,
  Tray,
} from 'electron'
import fs from 'fs-extra'
import { cloneDeep } from 'lodash-es'
import pkg from 'root/package.json'

import { buildPicBedListMenu } from '~/events/remotes/menu'
import { t } from '~/i18n'
import clipboardPoll from '~/utils/clipboardPoll'
import { ensureFilePath, handleCopyUrl, setTray, tray } from '~/utils/common'
import { configPaths } from '~/utils/configPaths'
import { IPasteStyle, IWindowList } from '~/utils/enum'
import { isMacOSVersionGreaterThanOrEqualTo } from '~/utils/getMacOSVersion'
import pasteTemplate from '~/utils/pasteTemplate'
import { runScriptInStage } from '~/utils/runScript'
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
        { label: t('main.menu.openMainWindow'), click: openMainWindow },
        {
          label: t('main.menu.restartApp'),
          click() {
            app.relaunch()
            app.exit(0)
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
          app.exit(0)
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
          dialog.showMessageBox({
            title: 'PicList',
            message: 'PicList',
            buttons: ['Ok'],
            detail: `Version: ${pkg.version}\nAuthor: Kuingsmile\nGithub: https://github.com/Kuingsmile/PicList`,
          })
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
      if (process.platform === 'darwin') {
        toggleWindow(bounds)
        const trayWindow = windowManager.get(IWindowList.TRAY_WINDOW)
        if (!trayWindow) return
        if (trayWindow.webContents.isLoading()) {
          trayWindow.webContents.once('did-finish-load', () => {
            sendClipboardFiles()
          })
        } else {
          sendClipboardFiles()
        }
      } else {
        windowManager.get(IWindowList.TRAY_WINDOW)?.hide()
        const autoCloseMiniWindow =
          picgo.getConfig<boolean | undefined>(configPaths.settings.autoCloseMiniWindow) || false
        if (autoCloseMiniWindow) {
          windowManager.get(IWindowList.MINI_WINDOW)?.close()
        }
        windowManager.create(IWindowList.SETTING_WINDOW)
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
        const allConfig = picgo.getConfig<any>() || {}
        const pasteStyle = allConfig.settings?.pasteStyle || IPasteStyle.MARKDOWN
        const rawInput = cloneDeep(files)
        const trayWindow = windowManager.get(IWindowList.TRAY_WINDOW)
        const res = await uploader.setWebContents(trayWindow?.webContents).uploadReturnCtx(files)
        const imgs = res.ctx?.output ? res.ctx.output : false
        const backImgs = res.backupCtx?.output ? res.backupCtx.output : false
        const deleteLocalFile = allConfig.settings?.deleteLocalFile || false
        if (imgs !== false) {
          const pasteText: string[] = []
          for (let i = 0; i < imgs.length; i++) {
            if (deleteLocalFile) {
              await fs.remove(rawInput[i])
            }
            const [pasteTextItem, shortUrl] = await pasteTemplate(pasteStyle, imgs[i], allConfig.settings?.customLink)
            imgs[i].shortUrl = shortUrl
            pasteText.push(pasteTextItem)
            const isShowResultNotification =
              allConfig.settings?.uploadResultNotification === undefined
                ? true
                : !!allConfig.settings?.uploadResultNotification
            if (isShowResultNotification) {
              const notification = new Notification({
                title: t('main.notification.uploadSuccess'),
                body: shortUrl || imgs[i].imgUrl!,
                // icon: files[i]
              })
              setTimeout(() => {
                notification.show()
              }, i * 100)
            }
            const inserted = await GalleryDB.getInstance().insert(imgs[i])
            runScriptInStage('onUploadSuccess', res.ctx || picgo, { galleryItem: inserted })
          }
          handleCopyUrl(pasteText.join('\n'))
          trayWindow?.webContents.send('dragFiles', imgs)
        }
        if (backImgs !== false) {
          for (const backImg of backImgs) {
            await GalleryDB.getInstance().insert(backImg)
          }
          trayWindow?.webContents.send('dragFiles', backImgs)
        }
      })
    }
  } else if (process.platform === 'linux') {
    // click事件在Ubuntu上无法触发，Unity不支持（在Mac和Windows上可以触发）
    // 需要使用 setContextMenu 设置菜单
    createContextMenu()
    tray?.setContextMenu(contextMenu)
  }
}

function toggleWindow(bounds: IBounds) {
  let trayWindow = windowManager.get(IWindowList.TRAY_WINDOW)
  if (!trayWindow) {
    trayWindow = windowManager.create(IWindowList.TRAY_WINDOW)
  }
  if (!trayWindow) return
  if (trayWindow.isVisible()) {
    trayWindow.hide()
  } else {
    trayWindow.setPosition(bounds.x - 98 + 11, bounds.y, false)
    if (trayWindow.webContents.isLoading()) {
      trayWindow.webContents.once('did-finish-load', () => {
        trayWindow.webContents.send('updateFiles')
      })
    } else {
      trayWindow.webContents.send('updateFiles')
    }
    trayWindow.show()
    trayWindow.focus()
  }
}

async function sendClipboardFiles() {
  const img = clipboard.readImage()
  const obj: ImgInfo[] = []
  if (!img.isEmpty()) {
    // 从剪贴板来的图片默认转为png
    // https://github.com/electron/electron/issues/9035
    const imgPath = clipboard.read('public.file-url')
    if (imgPath) {
      const decodePath = ensureFilePath(imgPath)
      if (decodePath === imgPath) {
        obj.push({
          imgUrl: imgPath,
        })
      } else {
        if (decodePath !== '') {
          // 带有中文的路径，无法直接被img.src所使用，会被转义
          const base64 = await fs.readFile(decodePath.replace('file://', ''), { encoding: 'base64' })
          obj.push({
            imgUrl: `data:image/png;base64,${base64}`,
          })
        }
      }
    } else {
      const imgUrl = img.toDataURL()
      obj.push({
        width: img.getSize().width,
        height: img.getSize().height,
        imgUrl,
      })
    }
  }
  windowManager.get(IWindowList.TRAY_WINDOW)?.webContents.send('clipboardFiles', obj)
}
