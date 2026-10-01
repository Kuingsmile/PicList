import bus from '@core/bus'
import shortKeyHandler from 'apis/app/shortKey/shortKeyHandler'

import { TOGGLE_SHORTKEY_MODIFIED_MODE } from '#/constants/ipcChannels'
import { IRPCActionType, IRPCType } from '~/constants'
import { defineRpcHandler } from '~/ipc/router'

export default [
  {
    action: IRPCActionType.SHORTKEY_GET_LIST,
    handler: async () => {
      await shortKeyHandler.init()
      return shortKeyHandler.getList()
    },
    type: IRPCType.INVOKE,
  },
  {
    action: IRPCActionType.SHORTKEY_GET_TARGETS,
    handler: async () => shortKeyHandler.getTargets(),
    type: IRPCType.INVOKE,
  },
  {
    action: IRPCActionType.SHORTKEY_RETRY,
    handler: async () => {
      await shortKeyHandler.init()
      return shortKeyHandler.refresh(false)
    },
    type: IRPCType.INVOKE,
  },
  {
    action: IRPCActionType.SHORTKEY_UPDATE,
    handler: defineRpcHandler(IRPCActionType.SHORTKEY_UPDATE, async (_, [item, oldKey, from]) => {
      await shortKeyHandler.init()
      return shortKeyHandler.updateShortKey(item, oldKey, from)
    }),
    type: IRPCType.INVOKE,
  },
  {
    action: IRPCActionType.SHORTKEY_BIND_OR_UNBIND,
    handler: defineRpcHandler(IRPCActionType.SHORTKEY_BIND_OR_UNBIND, async (_, [item, from]) => {
      await shortKeyHandler.init()
      return shortKeyHandler.bindOrUnbindShortKey(item, from)
    }),
    type: IRPCType.INVOKE,
  },
  {
    action: IRPCActionType.SHORTKEY_SAVE_CUSTOM,
    handler: defineRpcHandler(IRPCActionType.SHORTKEY_SAVE_CUSTOM, async (_, [config]) => {
      await shortKeyHandler.init()
      return shortKeyHandler.saveCustom(config)
    }),
    type: IRPCType.INVOKE,
  },
  {
    action: IRPCActionType.SHORTKEY_DELETE_CUSTOM,
    handler: defineRpcHandler(IRPCActionType.SHORTKEY_DELETE_CUSTOM, async (_, [id]) => {
      await shortKeyHandler.init()
      return shortKeyHandler.deleteCustom(id)
    }),
    type: IRPCType.INVOKE,
  },
  {
    action: IRPCActionType.SHORTKEY_TOGGLE_SHORTKEY_MODIFIED_MODE,
    handler: async (_: IIPCEvent, [status]: [boolean]) => {
      if (typeof status === 'boolean') bus.emit(TOGGLE_SHORTKEY_MODIFIED_MODE, status)
    },
  },
]
