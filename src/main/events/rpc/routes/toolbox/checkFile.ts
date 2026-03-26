import path from 'node:path'

import { DB_PATH, GalleryDB } from '@core/datastore'
import { appConfigPath } from '@core/datastore/dirs'
import type { IpcMainEvent } from 'electron'
import fs from 'fs-extra'

import { sendToolboxResWithType } from '~/events/rpc/routes/toolbox/utils'
import { t } from '~/i18n'
import { IToolboxItemCheckStatus, IToolboxItemType } from '~/utils/enum'

export const checkFileMap: IToolboxCheckerMap<string> = {
  [IToolboxItemType.IS_CONFIG_FILE_BROKEN]: async (event: IpcMainEvent) => {
    const sendToolboxRes = sendToolboxResWithType(IToolboxItemType.IS_CONFIG_FILE_BROKEN)
    sendToolboxRes(event, {
      status: IToolboxItemCheckStatus.LOADING,
    })
    const configFilePath = appConfigPath()
    try {
      if (fs.existsSync(configFilePath)) {
        await fs.readJSON(configFilePath)
        sendToolboxRes(event, {
          status: IToolboxItemCheckStatus.SUCCESS,
          msg: t('main.toolbox.checkConfigFilePathTips', {
            path: configFilePath,
          }),
          value: configFilePath,
        })
      }
    } catch (_e) {
      sendToolboxRes(event, {
        status: IToolboxItemCheckStatus.ERROR,
        msg: t('main.toolbox.configFileBrokenTips'),
        value: path.dirname(configFilePath),
      })
    }
  },
  [IToolboxItemType.IS_GALLERY_FILE_BROKEN]: async event => {
    const sendToolboxRes = sendToolboxResWithType(IToolboxItemType.IS_GALLERY_FILE_BROKEN)
    sendToolboxRes(event, {
      status: IToolboxItemCheckStatus.LOADING,
    })
    const galleryDB = GalleryDB.getInstance()
    if (galleryDB.errorList.length === 0) {
      sendToolboxRes(event, {
        status: IToolboxItemCheckStatus.SUCCESS,
        msg: t('main.toolbox.checkGalleryFilePathTips', {
          path: DB_PATH,
        }),
        value: path.dirname(DB_PATH),
      })
    } else {
      sendToolboxRes(event, {
        status: IToolboxItemCheckStatus.ERROR,
        msg: t('main.toolbox.galleryFileBrokenTips'),
        value: path.dirname(DB_PATH),
      })
    }
  },
}

export const fixFileMap: IToolboxFixMap<string> = {
  [IToolboxItemType.IS_CONFIG_FILE_BROKEN]: async () => {
    try {
      fs.unlinkSync(appConfigPath())
    } catch (_e) {
      // do nothing
    }
    return {
      type: IToolboxItemType.IS_CONFIG_FILE_BROKEN,
      status: IToolboxItemCheckStatus.SUCCESS,
    }
  },
  [IToolboxItemType.IS_GALLERY_FILE_BROKEN]: async () => {
    try {
      fs.unlinkSync(DB_PATH)
    } catch (_e) {
      // do nothing
    }
    return {
      type: IToolboxItemType.IS_GALLERY_FILE_BROKEN,
      status: IToolboxItemCheckStatus.SUCCESS,
    }
  },
}
