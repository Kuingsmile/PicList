import { uploadChoosedFiles, uploadClipboardFiles } from 'apis/app/uploader/apis'

import type { IIPCEvent } from '#/types/rpc'
import type { IFileWithPath } from '#/types/types'
import { RPCRouter } from '~/events/rpc/router'
import { IRPCActionType, IRPCType } from '~/utils/enum'
import getPicBeds from '~/utils/getPicBeds'

const uploadRouter = new RPCRouter()

const uploadRoutes = [
  {
    action: IRPCActionType.MAIN_GET_PICBED,
    handler: async () => {
      return getPicBeds()
    },
    type: IRPCType.INVOKE
  },
  {
    action: IRPCActionType.UPLOAD_CLIPBOARD_FILES_FROM_UPLOAD_PAGE,
    handler: async () => {
      uploadClipboardFiles()
    }
  },
  {
    action: IRPCActionType.UPLOAD_CHOOSED_FILES,
    handler: async (evt: IIPCEvent, args: [files: IFileWithPath[]]) => {
      return uploadChoosedFiles(evt.sender, args[0])
    }
  }
]

uploadRouter.addBatch(uploadRoutes)

export { uploadRouter }
