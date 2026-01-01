import path from 'node:path'

import { dbPathChecker, defaultConfigPath } from '@core/datastore/dbChecker'
import fs from 'fs-extra'

import { sendToolboxResWithType } from '~/events/rpc/routes/toolbox/utils'
import { T as $t } from '~/i18n'
import { IToolboxItemCheckStatus, IToolboxItemType } from '~/utils/enum'
import { CLIPBOARD_IMAGE_FOLDER } from '~/utils/static'

const sendToolboxRes = sendToolboxResWithType(IToolboxItemType.HAS_PROBLEM_WITH_CLIPBOARD_PIC_UPLOAD)

const defaultClipboardImagePath = path.join(defaultConfigPath, CLIPBOARD_IMAGE_FOLDER)

export const checkClipboardUploadMap: IToolboxCheckerMap<string> = {
  [IToolboxItemType.HAS_PROBLEM_WITH_CLIPBOARD_PIC_UPLOAD]: async event => {
    sendToolboxRes(event, {
      status: IToolboxItemCheckStatus.LOADING,
    })
    const configFilePath = dbPathChecker()
    if (fs.existsSync(configFilePath)) {
      const dirPath = path.dirname(configFilePath)
      const clipboardImagePath = path.join(dirPath, CLIPBOARD_IMAGE_FOLDER)
      if (fs.existsSync(clipboardImagePath)) {
        sendToolboxRes(event, {
          status: IToolboxItemCheckStatus.SUCCESS,
          msg: $t('TOOLBOX_CHECK_CLIPBOARD_FILE_PATH_TIPS', {
            path: clipboardImagePath,
          }),
          value: clipboardImagePath,
        })
      } else {
        sendToolboxRes(event, {
          status: IToolboxItemCheckStatus.ERROR,
          msg: $t('TOOLBOX_CHECK_CLIPBOARD_FILE_PATH_NOT_EXIST_TIPS', {
            path: clipboardImagePath,
          }),
          value: path.dirname(clipboardImagePath),
        })
      }
    } else {
      sendToolboxRes(event, {
        status: IToolboxItemCheckStatus.ERROR,
        msg: $t('TOOLBOX_CHECK_CLIPBOARD_FILE_PATH_NOT_EXIST_TIPS', {
          path: defaultClipboardImagePath,
        }),
        value: path.dirname(defaultClipboardImagePath),
      })
    }
  },
}

export const fixClipboardUploadMap: IToolboxFixMap<string> = {
  [IToolboxItemType.HAS_PROBLEM_WITH_CLIPBOARD_PIC_UPLOAD]: async () => {
    const configFilePath = dbPathChecker()
    const dirPath = path.dirname(configFilePath)
    const clipboardImagePath = path.join(dirPath, CLIPBOARD_IMAGE_FOLDER)
    try {
      fs.mkdirsSync(clipboardImagePath)
      return {
        type: IToolboxItemType.HAS_PROBLEM_WITH_CLIPBOARD_PIC_UPLOAD,
        status: IToolboxItemCheckStatus.SUCCESS,
      }
    } catch (_e) {
      return {
        type: IToolboxItemType.HAS_PROBLEM_WITH_CLIPBOARD_PIC_UPLOAD,
        status: IToolboxItemCheckStatus.ERROR,
        msg: $t('TOOLBOX_CHECK_CLIPBOARD_FILE_PATH_ERROR_TIPS', {
          path: clipboardImagePath,
        }),
        value: path.dirname(clipboardImagePath),
      }
    }
  },
}
