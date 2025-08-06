import { IpcMainEvent } from 'electron'

import type { IToolboxCheckRes } from '#/types/rpc'
import { IRPCActionType } from '~/utils/enum'

export function sendToolboxResWithType (type: string) {
  return (event: IpcMainEvent, res?: Omit<IToolboxCheckRes, 'type'>) => {
    return event.sender.send(IRPCActionType.TOOLBOX_CHECK_RES, {
      ...res,
      type
    })
  }
}
