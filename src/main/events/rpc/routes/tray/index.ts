import { Notification } from 'electron'

import { RPCRouter } from '~/events/rpc/router'
import { generateShortUrl, setTrayToolTip, handleCopyUrl } from '~/utils/common'

import { IRPCActionType, IRPCType, IPasteStyle, IWindowList } from '#/types/enum'

import db, { GalleryDB } from '@core/datastore'

import uploader from 'apis/app/uploader'
import windowManager from 'apis/app/window/windowManager'

import { T } from '~/i18n'

import pasteTemplate from '~/utils/pasteTemplate'

import { configPaths } from '#/utils/configPaths'

const trayRouter = new RPCRouter()

const trayRoutes = [
  {
    action: IRPCActionType.TRAY_SET_TOOL_TIP,
    handler: async (_: IIPCEvent, args: [text: string]) => {
      setTrayToolTip(args[0])
    }
  },
  {
    action: IRPCActionType.TRAY_GET_SHORT_URL,
    handler: async (_: IIPCEvent, args: [url: string]) => {
      return await generateShortUrl(args[0])
    },
    type: IRPCType.INVOKE
  },
  {
    action: IRPCActionType.TRAY_UPLOAD_CLIPBOARD_FILES,
    handler: async () => {
      const trayWindow = windowManager.get(IWindowList.TRAY_WINDOW)!
      // macOS use builtin clipboard is OK
      const img = await uploader.setWebContents(trayWindow.webContents).uploadWithBuildInClipboard()
      if (img !== false) {
        const pasteStyle = db.get(configPaths.settings.pasteStyle) || IPasteStyle.MARKDOWN
        const [pasteText, shortUrl] = await pasteTemplate(pasteStyle, img[0], db.get(configPaths.settings.customLink))
        img[0].shortUrl = shortUrl
        handleCopyUrl(pasteText)
        const isShowResultNotification =
          db.get(configPaths.settings.uploadResultNotification) === undefined
            ? true
            : !!db.get(configPaths.settings.uploadResultNotification)
        if (isShowResultNotification) {
          const notification = new Notification({
            title: T('UPLOAD_SUCCEED'),
            body: shortUrl || img[0].imgUrl!
            // icon: file[0]
            // icon: img[0].imgUrl
          })
          notification.show()
        }
        await GalleryDB.getInstance().insert(img[0])
        trayWindow.webContents.send('clipboardFiles', [])
        if (windowManager.has(IWindowList.SETTING_WINDOW)) {
          windowManager.get(IWindowList.SETTING_WINDOW)!.webContents.send('updateGallery')
        }
      }
      trayWindow.webContents.send('uploadFiles')
    }
  }
]

trayRouter.addBatch(trayRoutes)

export { trayRouter }
