import path from 'node:path'

import { DB_PATH, GalleryDB } from '@core/datastore'
import { dbPathChecker } from '@core/datastore/dbChecker'
import type { IpcMainEvent } from 'electron'
import fs from 'fs-extra'

import type { IToolboxCheckerMap, IToolboxFixMap } from '#/types/rpc'
import { sendToolboxResWithType } from '~/events/rpc/routes/toolbox/utils'
import { T as $t } from '~/i18n'
import { IToolboxItemCheckStatus, IToolboxItemType } from '~/utils/enum'

export const checkFileMap: IToolboxCheckerMap<string> = {
  [IToolboxItemType.IS_CONFIG_FILE_BROKEN]: async (event: IpcMainEvent) => {
    const sendToolboxRes = sendToolboxResWithType(IToolboxItemType.IS_CONFIG_FILE_BROKEN)
    sendToolboxRes(event, {
      status: IToolboxItemCheckStatus.LOADING,
    })
    const configFilePath = dbPathChecker()
    try {
      if (fs.existsSync(configFilePath)) {
        await fs.readJSON(configFilePath)
        sendToolboxRes(event, {
          status: IToolboxItemCheckStatus.SUCCESS,
          msg: $t('TOOLBOX_CHECK_CONFIG_FILE_PATH_TIPS', {
            path: configFilePath,
          }),
          value: configFilePath,
        })
      }
    } catch (_e) {
      sendToolboxRes(event, {
        status: IToolboxItemCheckStatus.ERROR,
        msg: $t('TOOLBOX_CHECK_CONFIG_FILE_BROKEN_TIPS'),
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
        msg: $t('TOOLBOX_CHECK_GALLERY_FILE_PATH_TIPS', {
          path: DB_PATH,
        }),
        value: path.dirname(DB_PATH),
      })
    } else {
      sendToolboxRes(event, {
        status: IToolboxItemCheckStatus.ERROR,
        msg: $t('TOOLBOX_CHECK_GALLERY_FILE_BROKEN_TIPS'),
        value: path.dirname(DB_PATH),
      })
    }
  },
}

export const fixFileMap: IToolboxFixMap<string> = {
  [IToolboxItemType.IS_CONFIG_FILE_BROKEN]: async () => {
    try {
      fs.unlinkSync(dbPathChecker())
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
