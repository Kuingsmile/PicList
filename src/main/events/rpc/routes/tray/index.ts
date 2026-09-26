import { uploadClipboardFiles } from 'apis/app/uploader/apis'

import { RPCRouter } from '~/events/rpc/router'
import { generateShortUrl, setTrayToolTip } from '~/utils/common'
import { IRPCActionType, IRPCType } from '~/utils/enum'
import { UploadJob } from '~/utils/uploadJob'

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
