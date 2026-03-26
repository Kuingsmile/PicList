import bus from '@core/bus'
import shortKeyHandler from 'apis/app/shortKey/shortKeyHandler'
import { Notification } from 'electron'

import { TOGGLE_SHORTKEY_MODIFIED_MODE } from '~/events/constant'
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
    handler: async (_: IIPCEvent, args: [item: IShortKeyConfig, oldKey: string, from: string]) => {
      const [item, oldKey, from] = args
      const result = shortKeyHandler.updateShortKey(item, oldKey, from)
      notificationFunc(result)
      return result
    },
    type: IRPCType.INVOKE,
  },
  {
    action: IRPCActionType.SHORTKEY_BIND_OR_UNBIND,
    handler: async (_: IIPCEvent, args: [item: IShortKeyConfig, from: string]) => {
      const [item, from] = args
      const result = shortKeyHandler.bindOrUnbindShortKey(item, from)
      notificationFunc(result)
    },
  },
  {
    action: IRPCActionType.SHORTKEY_TOGGLE_SHORTKEY_MODIFIED_MODE,
    handler: async (_: IIPCEvent, args: [status: boolean]) => {
      const [status] = args
      bus.emit(TOGGLE_SHORTKEY_MODIFIED_MODE, status)
    },
  },
]
