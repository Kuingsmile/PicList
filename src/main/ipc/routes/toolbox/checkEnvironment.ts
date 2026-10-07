import path from 'node:path'

import { dataDir } from '@core/datastore/dirs'
import type { IpcMainEvent } from 'electron'
import fs from 'fs-extra'

import { IToolboxItemCheckStatus, IToolboxItemType } from '#/constants/app'
import { t } from '~/i18n'
import { sendToolboxResWithType } from '~/ipc/routes/toolbox/utils'
import server from '~/server'

function checkDataDirWritable(): IToolboxCheckRes {
  const dirPath = dataDir()
  const probePath = path.join(dirPath, `.piclist-write-test-${process.pid}`)
  try {
    fs.writeFileSync(probePath, '')
    fs.removeSync(probePath)
    return {
      type: IToolboxItemType.IS_DATA_DIR_NOT_WRITABLE,
      status: IToolboxItemCheckStatus.SUCCESS,
      msg: t('main.toolbox.dataDirWritableTips', { path: dirPath }),
      value: dirPath,
    }
  } catch (_e) {
    return {
      type: IToolboxItemType.IS_DATA_DIR_NOT_WRITABLE,
      status: IToolboxItemCheckStatus.ERROR,
      msg: t('main.toolbox.dataDirNotWritableTips', { path: dirPath }),
      value: dirPath,
    }
  }
}

function checkUploadServer(): IToolboxCheckRes {
  const { enabled, listening, configuredPort, port } = server.getStatus()
  const type = IToolboxItemType.HAS_PROBLEM_WITH_UPLOAD_SERVER
  if (!enabled) {
    return { type, status: IToolboxItemCheckStatus.SUCCESS, msg: t('main.toolbox.uploadServerDisabledTips') }
  }
  if (!listening) {
    return {
      type,
      status: IToolboxItemCheckStatus.ERROR,
      msg: t('main.toolbox.uploadServerNotRunningTips', { port: configuredPort }),
    }
  }
  return {
    type,
    status: IToolboxItemCheckStatus.SUCCESS,
    msg:
      port === configuredPort
        ? t('main.toolbox.uploadServerRunningTips', { port })
        : t('main.toolbox.uploadServerFallbackPortTips', { port, configuredPort }),
  }
}

export const checkEnvironmentMap: IToolboxCheckerMap<string> = {
  [IToolboxItemType.IS_DATA_DIR_NOT_WRITABLE]: async (event: IpcMainEvent) => {
    const sendToolboxRes = sendToolboxResWithType(IToolboxItemType.IS_DATA_DIR_NOT_WRITABLE)
    sendToolboxRes(event, { status: IToolboxItemCheckStatus.LOADING })
    const { type: _type, ...res } = checkDataDirWritable()
    sendToolboxRes(event, res)
  },
  [IToolboxItemType.HAS_PROBLEM_WITH_UPLOAD_SERVER]: async (event: IpcMainEvent) => {
    const sendToolboxRes = sendToolboxResWithType(IToolboxItemType.HAS_PROBLEM_WITH_UPLOAD_SERVER)
    sendToolboxRes(event, { status: IToolboxItemCheckStatus.LOADING })
    const { type: _type, ...res } = checkUploadServer()
    sendToolboxRes(event, res)
  },
}

export const fixEnvironmentMap: IToolboxFixMap<string> = {
  [IToolboxItemType.HAS_PROBLEM_WITH_UPLOAD_SERVER]: async () => {
    await server.restart()
    return checkUploadServer()
  },
}
