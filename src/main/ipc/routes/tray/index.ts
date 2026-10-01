import { uploadClipboardFiles } from 'apis/app/uploader/apis'

import { IRPCActionType, IRPCType } from '~/constants'
import { RPCRouter } from '~/ipc/router'
import { generateShortUrl } from '~/services/shortUrls'
import { UploadJob } from '~/services/uploads/uploadJob'
import { setTrayToolTip } from '~/utils/tray'

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
    handler: async (evt: IIPCEvent) => {
      await uploadClipboardFiles(undefined, new UploadJob({ origin: evt.sender }), {
        copy: true,
        notification: 'individual',
        clearClipboard: true,
        useBuiltinClipboard: true,
      })
    },
  },
]

trayRouter.addBatch(trayRoutes)

export { trayRouter }
