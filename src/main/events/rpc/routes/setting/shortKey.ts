import bus from '@core/bus'
import shortKeyHandler from 'apis/app/shortKey/shortKeyHandler'
import { Notification } from 'electron'

import { RpcError } from '#/rpc'
import { TOGGLE_SHORTKEY_MODIFIED_MODE } from '~/events/constant'
import { defineRpcHandler } from '~/events/rpc/router'
import { t } from '~/i18n'
import { IRPCActionType, IRPCType } from '~/utils/enum'

const notificationFunc = (result: boolean) => {
  const notification = new Notification({
    title: result ? t('main.strings.operationSuccess') : t('main.strings.operationFailed'),
    body: result ? t('main.strings.shortcutModifiedSuccess') : t('main.strings.shortcutModifiedConflict'),
  })
  notification.show()
}

export default [
  {
    action: IRPCActionType.SHORTKEY_UPDATE,
    handler: defineRpcHandler(
      IRPCActionType.SHORTKEY_UPDATE,
      async (_: IIPCEvent, args: [item: IShortKeyConfig, oldKey: string, from: string]) => {
        const [item, oldKey, from] = args
        const result = shortKeyHandler.updateShortKey(item, oldKey, from)
        if (!result) throw new RpcError('CONFLICT')
        notificationFunc(result)
        return true
      },
    ),
    type: IRPCType.INVOKE,
  },
  {
    action: IRPCActionType.SHORTKEY_BIND_OR_UNBIND,
    handler: defineRpcHandler(
      IRPCActionType.SHORTKEY_BIND_OR_UNBIND,
      async (_: IIPCEvent, args: [item: IShortKeyConfig, from: string]) => {
        const [item, from] = args
        const result = shortKeyHandler.bindOrUnbindShortKey(item, from)
        if (!result) throw new RpcError('CONFLICT')
        notificationFunc(result)
        return true
      },
    ),
    type: IRPCType.INVOKE,
  },
  {
    action: IRPCActionType.SHORTKEY_TOGGLE_SHORTKEY_MODIFIED_MODE,
    handler: async (_: IIPCEvent, args: [status: boolean]) => {
      const [status] = args
      bus.emit(TOGGLE_SHORTKEY_MODIFIED_MODE, status)
    },
  },
]
