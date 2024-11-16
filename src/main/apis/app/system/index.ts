import {
  app,
  clipboard,
  dialog,
  Menu,
  MenuItem,
  MenuItemConstructorOptions,
  nativeTheme,
  Notification,
  Tray
} from 'electron'
import fs from 'fs-extra'
import { cloneDeep } from 'lodash'

import db, { GalleryDB } from '@core/datastore'
import picgo from '@core/picgo'

import uploader from 'apis/app/uploader'
import { handleSecondaryUpload, uploadClipboardFiles } from 'apis/app/uploader/apis'
import windowManager from 'apis/app/window/windowManager'

import { buildPicBedListMenu } from '~/events/remotes/menu'
import { T } from '~/i18n'
import clipboardPoll from '~/utils/clipboardPoll'
import { ensureFilePath, handleCopyUrl, setTray, tray } from '~/utils/common'
import { isMacOSVersionGreaterThanOrEqualTo } from '~/utils/getMacOSVersion'
import pasteTemplate from '~/utils/pasteTemplate'

import { configPaths } from '#/utils/configPaths'
import { IPasteStyle, IWindowList } from '#/types/enum'

import pkg from 'root/package.json'
import { hideMiniWindow, openMainWindow, openMiniWindow } from '~/utils/windowHelper'

let contextMenu: Menu | null

export function setDockMenu() {
  const isListeningClipboard = db.get(configPaths.settings.isListeningClipboard) || false
  const dockMenu = Menu.buildFromTemplate([
    {
      label: T('OPEN_MAIN_WINDOW'),
      click: openMainWindow
    },
    {
      label: T('START_WATCH_CLIPBOARD'),
      click() {
        db.set(configPaths.settings.isListeningClipboard, true)
        clipboardPoll.startListening()
        clipboardPoll.on('change', () => {
          picgo.log.info('clipboard changed')
          uploadClipboardFiles()
        })
        setDockMenu()
      },
      visible: !isListeningClipboard
    },
    {
      label: T('STOP_WATCH_CLIPBOARD'),
      click() {
        db.set(configPaths.settings.isListeningClipboard, false)
        clipboardPoll.stopListening()
        clipboardPoll.removeAllListeners()
        setDockMenu()
      },
      visible: isListeningClipboard
    }
  ])
  app.dock.setMenu(dockMenu)
}

export function createMenu() {
  const submenu = buildPicBedListMenu()
  const appMenu = Menu.buildFromTemplate([
    {
      label: 'PicList',
      submenu: [
        { label: T('OPEN_MAIN_WINDOW'), click: openMainWindow },
        {
          label: T('RELOAD_APP'),
          click() {
            app.relaunch()
            app.exit(0)
          }
        }
      ]
    },
    { label: T('CHOOSE_DEFAULT_PICBED'), type: 'submenu', submenu },
    {
      label: 'Edit',
      submenu: [
        { label: 'Undo', accelerator: 'CmdOrCtrl+Z', role: 'undo' },
        { label: 'Redo', accelerator: 'Shift+CmdOrCtrl+Z', role: 'redo' },
        { type: 'separator' },
        { label: 'Cut', accelerator: 'CmdOrCtrl+X', role: 'cut' },
        { label: 'Copy', accelerator: 'CmdOrCtrl+C', role: 'copy' },
        { label: 'Paste', accelerator: 'CmdOrCtrl+V', role: 'paste' },
        { label: 'Select All', accelerator: 'CmdOrCtrl+A', role: 'selectAll' }
      ]
    },
    {
      label: T('QUIT'),
      submenu: [{ label: T('QUIT'), role: 'quit' }]
    }
  ])
  Menu.setApplicationMenu(appMenu)
}

export function createContextMenu() {
  const ClipboardWatcher = clipboardPoll
  const isListeningClipboard = db.get(configPaths.settings.isListeningClipboard) || false
  const isMiniWindowVisible =
    windowManager.has(IWindowList.MINI_WINDOW) && windowManager.get(IWindowList.MINI_WINDOW)!.isVisible()

  const startWatchClipboard = () => {
    db.set(configPaths.settings.isListeningClipboard, true)
    ClipboardWatcher.startListening()
    ClipboardWatcher.on('change', () => {
      picgo.log.info('clipboard changed')
      uploadClipboardFiles()
    })
    createContextMenu()
  }

  const stopWatchClipboard = () => {
    db.set(configPaths.settings.isListeningClipboard, false)
    ClipboardWatcher.stopListening()
    ClipboardWatcher.removeAllListeners()
    createContextMenu()
  }

  if (process.platform === 'darwin' || process.platform === 'win32') {
    const submenu = buildPicBedListMenu()
    const template: Array<MenuItemConstructorOptions | MenuItem> = [
      { label: T('OPEN_MAIN_WINDOW'), click: openMainWindow },
      { label: T('CHOOSE_DEFAULT_PICBED'), type: 'submenu', submenu },
      {
        label: T('START_WATCH_CLIPBOARD'),
        click: startWatchClipboard,
        visible: !isListeningClipboard
      },
      {
        label: T('STOP_WATCH_CLIPBOARD'),
        click: stopWatchClipboard,
        visible: isListeningClipboard
      },
      {
        label: T('RELOAD_APP'),
        click() {
          app.relaunch()
          app.exit(0)
        }
      },
      { label: T('QUIT'), role: 'quit' }
    ]
    if (process.platform === 'win32') {
      template.splice(
        2,
        0,
        {
          label: T('OPEN_MINI_WINDOW'),
          click() {
            openMiniWindow(false)
          },
          visible: !isMiniWindowVisible
        },
        {
          label: T('HIDE_MINI_WINDOW'),
          click: hideMiniWindow,
          visible: isMiniWindowVisible
        }
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
      { label: T('OPEN_MAIN_WINDOW'), click: openMainWindow },
      {
        label: T('OPEN_MINI_WINDOW'),
        click() {
          openMiniWindow(false)
        },
        visible: !isMiniWindowVisible
      },
      {
        label: T('HIDE_MINI_WINDOW'),
        click: hideMiniWindow,
        visible: isMiniWindowVisible
      },
      {
        label: T('START_WATCH_CLIPBOARD'),
        click: startWatchClipboard,
        visible: !isListeningClipboard
      },
      {
        label: T('STOP_WATCH_CLIPBOARD'),
        click: stopWatchClipboard,
        visible: isListeningClipboard
      },
      {
        label: T('ABOUT'),
        click() {
          dialog.showMessageBox({
            title: 'PicList',
            message: 'PicList',
            buttons: ['Ok'],
            detail: `Version: ${pkg.version}\nAuthor: Kuingsmile\nGithub: https://github.com/Kuingsmile/PicList`
          })
        }
      },
      { label: T('QUIT'), role: 'quit' }
    ])
  }
}

const getTrayIcon = () => {
  if (process.platform === 'darwin') {
    const isMacOSGreaterThan11 = isMacOSVersionGreaterThanOrEqualTo('11')
    return isMacOSGreaterThan11 ? `${__static}/menubar-newdarwinTemplate.png` : `${__static}/menubar.png`
  } else {
    return `${__static}/menubar-nodarwin.png`
  }
}

export function createTray(tooltip: string) {
  const menubarPic = getTrayIcon()
  setTray(new Tray(menubarPic))
  tray.setToolTip(tooltip)
  // click事件在Mac和Windows上可以触发（在Ubuntu上无法触发，Unity不支持）
  if (process.platform === 'darwin' || process.platform === 'win32') {
    tray.on('right-click', () => {
      if (windowManager.has(IWindowList.TRAY_WINDOW)) {
        windowManager.get(IWindowList.TRAY_WINDOW)!.hide()
      }
      createContextMenu()
      tray!.popUpContextMenu(contextMenu!)
    })
    tray.on('click', (_, bounds) => {
      if (process.platform === 'darwin') {
        toggleWindow(bounds)
        setTimeout(async () => {
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
                  imgUrl: imgPath
                })
              } else {
                if (decodePath !== '') {
                  // 带有中文的路径，无法直接被img.src所使用，会被转义
                  const base64 = await fs.readFile(decodePath.replace('file://', ''), { encoding: 'base64' })
                  obj.push({
                    imgUrl: `data:image/png;base64,${base64}`
                  })
                }
              }
            } else {
              const imgUrl = img.toDataURL()
              obj.push({
                width: img.getSize().width,
                height: img.getSize().height,
                imgUrl
              })
            }
          }
          windowManager.get(IWindowList.TRAY_WINDOW)!.webContents.send('clipboardFiles', obj)
        }, 0)
      } else {
        if (windowManager.has(IWindowList.TRAY_WINDOW)) {
          windowManager.get(IWindowList.TRAY_WINDOW)!.hide()
        }
        const settingWindow = windowManager.get(IWindowList.SETTING_WINDOW)
        const autoCloseMiniWindow = db.get(configPaths.settings.autoCloseMiniWindow) || false
        settingWindow!.show()
        settingWindow!.focus()
        if (windowManager.has(IWindowList.MINI_WINDOW) && autoCloseMiniWindow) {
          windowManager.get(IWindowList.MINI_WINDOW)!.hide()
        }
      }
    })

    tray.on('drag-enter', () => {
      if (nativeTheme.shouldUseDarkColors) {
        tray!.setImage(`${__static}/upload-dark.png`)
      } else {
        tray!.setImage(`${__static}/upload.png`)
      }
    })

    tray.on('drag-end', () => {
      tray!.setImage(getTrayIcon())
    })

    // drop-files only be supported in macOS
    // so the tray window must be available
    tray.on('drop-files', async (_: Event, files: string[]) => {
      const pasteStyle = db.get(configPaths.settings.pasteStyle) || IPasteStyle.MARKDOWN
      const rawInput = cloneDeep(files)
      const trayWindow = windowManager.get(IWindowList.TRAY_WINDOW)!
      const { needRestore, ctx } = await handleSecondaryUpload(trayWindow.webContents, files, 'tray')
      let imgs: ImgInfo[] | false = false
      if (needRestore) {
        const res = await uploader
          .setWebContents(trayWindow.webContents)
          .uploadReturnCtx(ctx ? ctx.processedInput : files, true)
        imgs = res ? res.output : false
      } else {
        imgs = await uploader.setWebContents(trayWindow.webContents).upload(files)
      }
      const deleteLocalFile = db.get(configPaths.settings.deleteLocalFile) || false
      if (imgs !== false) {
        const pasteText: string[] = []
        for (let i = 0; i < imgs.length; i++) {
          if (deleteLocalFile) {
            await fs.remove(rawInput[i])
          }
          const [pasteTextItem, shortUrl] = await pasteTemplate(
            pasteStyle,
            imgs[i],
            db.get(configPaths.settings.customLink)
          )
          imgs[i].shortUrl = shortUrl
          pasteText.push(pasteTextItem)
          const isShowResultNotification =
            db.get(configPaths.settings.uploadResultNotification) === undefined
              ? true
              : !!db.get(configPaths.settings.uploadResultNotification)
          if (isShowResultNotification) {
            const notification = new Notification({
              title: T('UPLOAD_SUCCEED'),
              body: shortUrl || imgs[i].imgUrl!
              // icon: files[i]
            })
            setTimeout(() => {
              notification.show()
            }, i * 100)
          }
          await GalleryDB.getInstance().insert(imgs[i])
        }
        handleCopyUrl(pasteText.join('\n'))
        trayWindow.webContents.send('dragFiles', imgs)
      }
    })
    // toggleWindow()
  } else if (process.platform === 'linux') {
    // click事件在Ubuntu上无法触发，Unity不支持（在Mac和Windows上可以触发）
    // 需要使用 setContextMenu 设置菜单
    createContextMenu()
    tray!.setContextMenu(contextMenu)
  }
}

const toggleWindow = (bounds: IBounds) => {
  const trayWindow = windowManager.get(IWindowList.TRAY_WINDOW)!
  if (trayWindow.isVisible()) {
    trayWindow.hide()
  } else {
    trayWindow.setPosition(bounds.x - 98 + 11, bounds.y, false)
    trayWindow.webContents.send('updateFiles')
    trayWindow.show()
    trayWindow.focus()
  }
}
