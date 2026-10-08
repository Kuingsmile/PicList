import { uploadClipboardFiles } from 'apis/app/uploader/apis'

import { IRPCActionType, IRPCType } from '~/constants'
import { RPCRouter } from '~/ipc/router'
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
    action: IRPCActionType.TRAY_UPLOAD_CLIPBOARD_FILES,
    handler: async (evt: IIPCEvent) => {
      return await uploadClipboardFiles(undefined, new UploadJob({ origin: evt.sender }), {
        copy: true,
        notification: 'individual',
        clearClipboard: true,
        useBuiltinClipboard: true,
      })
    },
    type: IRPCType.INVOKE,
  },
]

trayRouter.addBatch(trayRoutes)

export { trayRouter }
