import bus from '@core/bus'
import shortKeyHandler from 'apis/app/shortKey/shortKeyHandler'
import { Notification } from 'electron'

import { TOGGLE_SHORTKEY_MODIFIED_MODE } from '#/events/constants'
import { IRPCActionType, IRPCType } from '#/types/enum'
import { IIPCEvent } from '#/types/rpc'
import { IShortKeyConfig } from '#/types/types'
import { T } from '~/i18n'

const notificationFunc = (result: boolean) => {
  const notification = new Notification({
    title: T(`OPERATION_${result ? 'SUCCEED' : 'FAILED'}`),
    body: T(`TIPS_SHORTCUT_MODIFIED_${result ? 'SUCCEED' : 'CONFLICT'}`)
  })
  notification.show()
}

export default [
  {
    action: IRPCActionType.SHORTKEY_UPDATE,
    handler: async (_: IIPCEvent, args: [item: IShortKeyConfig, oldKey: string, from: string]) => {
      const [item, oldKey, from] = args
      const result = shortKeyHandler.updateShortKey(item, oldKey, from)
      notificationFunc(result)
      return result
    },
    type: IRPCType.INVOKE
  },
  {
    action: IRPCActionType.SHORTKEY_BIND_OR_UNBIND,
    handler: async (_: IIPCEvent, args: [item: IShortKeyConfig, from: string]) => {
      const [item, from] = args
      const result = shortKeyHandler.bindOrUnbindShortKey(item, from)
      notificationFunc(result)
    }
  },
  {
    action: IRPCActionType.SHORTKEY_TOGGLE_SHORTKEY_MODIFIED_MODE,
    handler: async (_: IIPCEvent, args: [status: boolean]) => {
      const [status] = args
      bus.emit(TOGGLE_SHORTKEY_MODIFIED_MODE, status)
    }
  }
]
