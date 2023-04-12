import fs from 'fs-extra'
import {
  app,
  Menu,
  Tray,
  dialog,
  clipboard,
  systemPreferences,
  Notification,
  screen
} from 'electron'
import uploader from 'apis/app/uploader'
import db, { GalleryDB } from '~/main/apis/core/datastore'
import windowManager from 'apis/app/window/windowManager'
import { IWindowList } from '#/types/enum'
import pasteTemplate from '~/main/utils/pasteTemplate'
import pkg from 'root/package.json'
import { ensureFilePath, handleCopyUrl } from '~/main/utils/common'
import { T } from '~/main/i18n'
import { isMacOSVersionGreaterThanOrEqualTo } from '~/main/utils/getMacOSVersion'
import { buildPicBedListMenu } from '~/main/events/remotes/menu'
import clipboardListener from 'clipboard-event'
import clipboardPoll from '~/main/utils/clipboardPoll'
import picgo from '../../core/picgo'
import { uploadClipboardFiles } from '../uploader/apis'
let contextMenu: Menu | null
let tray: Tray | null

export function setDockMenu () {
  const isListeningClipboard = db.get('settings.isListeningClipboard') || false
  const dockMenu = Menu.buildFromTemplate([
    {
      label: T('OPEN_MAIN_WINDOW'),
      click () {
        const settingWindow = windowManager.get(IWindowList.SETTING_WINDOW)
        settingWindow!.show()
        settingWindow!.focus()
        if (windowManager.has(IWindowList.MINI_WINDOW)) {
          windowManager.get(IWindowList.MINI_WINDOW)!.hide()
        }
      }
    },
    {
      label: T('START_WATCH_CLIPBOARD'),
      click () {
        db.set('settings.isListeningClipboard', true)
        clipboardPoll.startListening()
        clipboardPoll.on('change', () => {
          picgo.log.info('clipboard changed')
          uploadClipboardFiles()
        })
        setDockMenu()
      },
      enabled: !isListeningClipboard
    },
    {
      label: T('STOP_WATCH_CLIPBOARD'),
      click () {
        db.set('settings.isListeningClipboard', false)
        clipboardPoll.stopListening()
        clipboardPoll.removeAllListeners()
        setDockMenu()
      },
      enabled: isListeningClipboard
    }
  ])
  app.dock.setMenu(dockMenu)
}

export function createMenu () {
  const submenu = buildPicBedListMenu()
  const appMenu = Menu.buildFromTemplate([
    {
      label: 'PicList',
      submenu: [
        {
          label: T('OPEN_MAIN_WINDOW'),
          click () {
            const settingWindow = windowManager.get(IWindowList.SETTING_WINDOW)
            settingWindow!.show()
            settingWindow!.focus()
            if (windowManager.has(IWindowList.MINI_WINDOW)) {
              windowManager.get(IWindowList.MINI_WINDOW)!.hide()
            }
          }
        },
        {
          label: T('RELOAD_APP'),
          click () {
            app.relaunch()
            app.exit(0)
          }
        }
      ]
    },
    {
      label: T('CHOOSE_DEFAULT_PICBED'),
      type: 'submenu',
      // @ts-ignore
      submenu
    },
    {
      label: 'Edit',
      submenu: [
        { label: 'Undo', accelerator: 'CmdOrCtrl+Z' },
        { label: 'Redo', accelerator: 'Shift+CmdOrCtrl+Z' },
        { type: 'separator' },
        { label: 'Cut', accelerator: 'CmdOrCtrl+X' },
        { label: 'Copy', accelerator: 'CmdOrCtrl+C' },
        { label: 'Paste', accelerator: 'CmdOrCtrl+V' },
        { label: 'Select All', accelerator: 'CmdOrCtrl+A' }
      ]
    },
    {
      label: T('QUIT'),
      submenu: [
        {
          label: T('QUIT'),
          role: 'quit'
        }
      ]
    }
  ])
  Menu.setApplicationMenu(appMenu)
}

export function createContextMenu () {
  const ClipboardWatcher = process.platform === 'win32' ? clipboardListener : clipboardPoll
  const isListeningClipboard = db.get('settings.isListeningClipboard') || false
  if (process.platform === 'darwin' || process.platform === 'win32') {
    const submenu = buildPicBedListMenu()
    const template = [
      {
        label: T('OPEN_MAIN_WINDOW'),
        click () {
          const settingWindow = windowManager.get(IWindowList.SETTING_WINDOW)
          settingWindow!.show()
          settingWindow!.focus()
          if (windowManager.has(IWindowList.MINI_WINDOW)) {
            windowManager.get(IWindowList.MINI_WINDOW)!.hide()
          }
        }
      },
      {
        label: T('CHOOSE_DEFAULT_PICBED'),
        type: 'submenu',
        // @ts-ignore
        submenu
      },
      {
        label: T('START_WATCH_CLIPBOARD'),
        click () {
          db.set('settings.isListeningClipboard', true)
          ClipboardWatcher.startListening()
          ClipboardWatcher.on('change', () => {
            picgo.log.info('clipboard changed')
            uploadClipboardFiles()
          })
          createContextMenu()
        },
        enabled: !isListeningClipboard
      },
      {
        label: T('STOP_WATCH_CLIPBOARD'),
        click () {
          db.set('settings.isListeningClipboard', false)
          ClipboardWatcher.stopListening()
          ClipboardWatcher.removeAllListeners()
          createContextMenu()
        },
        enabled: isListeningClipboard
      },
      {
        label: T('RELOAD_APP'),
        click () {
          app.relaunch()
          app.exit(0)
        }
      },
      // @ts-ignore
      {
        role: 'quit',
        label: T('QUIT')
      }
    ] as any
    if (process.platform === 'win32') {
      template.splice(2, 0,
        {
          label: T('OPEN_MINI_WINDOW'),
          click () {
            const miniWindow = windowManager.get(IWindowList.MINI_WINDOW)!
            miniWindow.removeAllListeners()
            if (db.get('settings.miniWindowOntop')) {
              miniWindow.setAlwaysOnTop(true)
            }
            const { width, height } = screen.getPrimaryDisplay().workAreaSize
            const lastPosition = db.get('settings.miniWindowPosition')
            if (lastPosition) {
              miniWindow.setPosition(lastPosition[0], lastPosition[1])
            } else {
              miniWindow.setPosition(width - 100, height - 100)
            }
            const setPositionFunc = () => {
              const position = miniWindow.getPosition()
              db.set('settings.miniWindowPosition', position)
            }
            miniWindow.on('close', setPositionFunc)
            miniWindow.on('move', setPositionFunc)
            miniWindow.show()
            miniWindow.focus()
          }
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
      {
        label: T('OPEN_MAIN_WINDOW'),
        click () {
          const settingWindow = windowManager.get(IWindowList.SETTING_WINDOW)
          settingWindow!.show()
          settingWindow!.focus()
          if (windowManager.has(IWindowList.MINI_WINDOW)) {
            windowManager.get(IWindowList.MINI_WINDOW)!.hide()
          }
        }
      },
      {
        label: T('OPEN_MINI_WINDOW'),
        click () {
          const miniWindow = windowManager.get(IWindowList.MINI_WINDOW)!
          miniWindow.removeAllListeners()
          if (db.get('settings.miniWindowOntop')) {
            miniWindow.setAlwaysOnTop(true)
          }
          const { width, height } = screen.getPrimaryDisplay().workAreaSize
          const lastPosition = db.get('settings.miniWindowPosition')
          if (lastPosition) {
            miniWindow.setPosition(lastPosition[0], lastPosition[1])
          } else {
            miniWindow.setPosition(width - 100, height - 100)
          }
          const setPositionFunc = () => {
            const position = miniWindow.getPosition()
            db.set('settings.miniWindowPosition', position)
          }
          miniWindow.on('close', setPositionFunc)
          miniWindow.on('move', setPositionFunc)
          miniWindow.show()
          miniWindow.focus()
        }
      },
      {
        label: T('START_WATCH_CLIPBOARD'),
        click () {
          db.set('settings.isListeningClipboard', true)
          ClipboardWatcher.startListening()
          ClipboardWatcher.on('change', () => {
            picgo.log.info('clipboard changed')
            uploadClipboardFiles()
          })
          createContextMenu()
        },
        enabled: !isListeningClipboard
      },
      {
        label: T('STOP_WATCH_CLIPBOARD'),
        click () {
          db.set('settings.isListeningClipboard', false)
          ClipboardWatcher.stopListening()
          ClipboardWatcher.removeAllListeners()
          createContextMenu()
        },
        enabled: isListeningClipboard
      },
      {
        label: T('ABOUT'),
        click () {
          dialog.showMessageBox({
            title: 'PicList',
            message: 'PicList',
            buttons: ['Ok'],
            detail: `Version: ${pkg.version}\nAuthor: Kuingsmile\nGithub: https://github.com/Kuingsmile/PicList`
          })
        }
      },
      // @ts-ignore
      {
        role: 'quit',
        label: T('QUIT')
      }
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

export function createTray () {
  const menubarPic = getTrayIcon()
  tray = new Tray(menubarPic)
  // click事件在Mac和Windows上可以触发（在Ubuntu上无法触发，Unity不支持）
  if (process.platform === 'darwin' || process.platform === 'win32') {
    tray.on('right-click', () => {
      if (windowManager.has(IWindowList.TRAY_WINDOW)) {
        windowManager.get(IWindowList.TRAY_WINDOW)!.hide()
      }
      createContextMenu()
      tray!.popUpContextMenu(contextMenu!)
    })
    tray.on('click', (event, bounds) => {
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
        settingWindow!.show()
        settingWindow!.focus()
        if (windowManager.has(IWindowList.MINI_WINDOW)) {
          windowManager.get(IWindowList.MINI_WINDOW)!.hide()
        }
      }
    })

    tray.on('drag-enter', () => {
      if (systemPreferences.isDarkMode()) {
        tray!.setImage(`${__static}/upload-dark.png`)
      } else {
        tray!.setImage(`${__static}/upload.png`)
      }
    })

    tray.on('drag-end', () => {
      tray!.setImage(`${__static}/menubar.png`)
    })

    // drop-files only be supported in macOS
    // so the tray window must be available
    tray.on('drop-files', async (event: Event, files: string[]) => {
      const pasteStyle = db.get('settings.pasteStyle') || 'markdown'
      const trayWindow = windowManager.get(IWindowList.TRAY_WINDOW)!
      const imgs = await uploader
        .setWebContents(trayWindow.webContents)
        .upload(files)
      if (imgs !== false) {
        const pasteText: string[] = []
        for (let i = 0; i < imgs.length; i++) {
          pasteText.push(pasteTemplate(pasteStyle, imgs[i], db.get('settings.customLink')))
          const notification = new Notification({
            title: T('UPLOAD_SUCCEED'),
            body: imgs[i].imgUrl!
            // icon: files[i]
          })
          setTimeout(() => {
            notification.show()
          }, i * 100)
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
