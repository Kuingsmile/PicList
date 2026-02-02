import { GalleryDB } from '@core/datastore'
import picgo from '@core/picgo'
import uploader from 'apis/app/uploader'
import windowManager from 'apis/app/window/windowManager'
import { Notification } from 'electron'

import { RPCRouter } from '~/events/rpc/router'
import { T as $t } from '~/i18n'
import { generateShortUrl, handleCopyUrl, setTrayToolTip } from '~/utils/common'
import { IPasteStyle, IRPCActionType, IRPCType, IWindowList } from '~/utils/enum'
import pasteTemplate from '~/utils/pasteTemplate'

const trayRouter = new RPCRouter()

const trayRoutes = [
  {
    action: IRPCActionType.TRAY_SET_TOOL_TIP,
    handler: async (_: IIPCEvent, args: [text: string]) => {
      setTrayToolTip(args[0])
    },
  },
  {
    action: IRPCActionType.TRAY_GET_SHORT_URL,
    handler: async (_: IIPCEvent, args: [url: string]) => {
      return await generateShortUrl(args[0])
    },
    type: IRPCType.INVOKE,
  },
  {
    action: IRPCActionType.TRAY_UPLOAD_CLIPBOARD_FILES,
    handler: async () => {
      const trayWindow = windowManager.get(IWindowList.TRAY_WINDOW)
      // macOS use builtin clipboard is OK
      const res = await uploader.setWebContents(trayWindow?.webContents).uploadWithBuildInClipboardReturnCtx()
      const img = res.ctx?.output ? res.ctx.output : false
      const backupImgs = res.backupCtx?.output ? res.backupCtx.output : false
      const allConfig = picgo.getConfig<any>() || {}
      if (img !== false) {
        const pasteStyle = allConfig.settings?.pasteStyle || IPasteStyle.MARKDOWN
        const [pasteText, shortUrl] = await pasteTemplate(pasteStyle, img[0], allConfig.settings?.customLink)
        img[0].shortUrl = shortUrl
        handleCopyUrl(pasteText)
        const isShowResultNotification =
          allConfig.settings?.uploadResultNotification === undefined
            ? true
            : !!allConfig.settings?.uploadResultNotification
        if (isShowResultNotification) {
          const notification = new Notification({
            title: $t('UPLOAD_SUCCEED'),
            body: shortUrl || img[0].imgUrl!,
            // icon: file[0]
            // icon: img[0].imgUrl
          })
          notification.show()
        }
        await GalleryDB.getInstance().insert(img[0])
        trayWindow?.webContents.send('clipboardFiles', [])
        if (windowManager.has(IWindowList.SETTING_WINDOW)) {
          windowManager.get(IWindowList.SETTING_WINDOW)?.webContents.send('updateGallery')
        }
        if (backupImgs && backupImgs.length > 0) {
          await GalleryDB.getInstance().insert(backupImgs[0])
          trayWindow?.webContents.send('uploadFiles')
          if (windowManager.has(IWindowList.SETTING_WINDOW)) {
            windowManager.get(IWindowList.SETTING_WINDOW)?.webContents?.send('updateGallery')
          }
        }
      }
      trayWindow?.webContents.send('uploadFiles')
    },
  },
]

trayRouter.addBatch(trayRoutes)

export { trayRouter }
