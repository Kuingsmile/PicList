// External dependencies
import bus from '@core/bus'

// Electron modules

// Custom utilities and modules
import {
  uploadClipboardFiles,
  uploadChoosedFiles
} from 'apis/app/uploader/apis'
import {
  createMenu
} from 'apis/app/system'
import windowManager from 'apis/app/window/windowManager'

// Custom types/enums
import { IWindowList } from '#/types/enum'

// External utility functions
import {
  UPLOAD_WITH_FILES,
  UPLOAD_WITH_FILES_RESPONSE,
  UPLOAD_WITH_CLIPBOARD_FILES,
  UPLOAD_WITH_CLIPBOARD_FILES_RESPONSE,
  GET_WINDOW_ID,
  GET_WINDOW_ID_REPONSE,
  GET_SETTING_WINDOW_ID,
  GET_SETTING_WINDOW_ID_RESPONSE,
  CREATE_APP_MENU
} from '@core/bus/constants'

function initEventCenter () {
  const eventList: any = {
    'picgo:upload': uploadClipboardFiles,
    [UPLOAD_WITH_CLIPBOARD_FILES]: busCallUploadClipboardFiles,
    [UPLOAD_WITH_FILES]: busCallUploadFiles,
    [GET_WINDOW_ID]: busCallGetWindowId,
    [GET_SETTING_WINDOW_ID]: busCallGetSettingWindowId,
    [CREATE_APP_MENU]: createMenu
  }
  for (const i in eventList) {
    bus.on(i, eventList[i])
  }
}

async function busCallUploadClipboardFiles () {
  const result = await uploadClipboardFiles()
  const imgUrl = result.url
  bus.emit(UPLOAD_WITH_CLIPBOARD_FILES_RESPONSE, imgUrl)
}

async function busCallUploadFiles (pathList: IFileWithPath[]) {
  const win = windowManager.getAvailableWindow()
  const result = await uploadChoosedFiles(win.webContents, pathList)
  const urls = result.map((item: any) => item.url)
  bus.emit(UPLOAD_WITH_FILES_RESPONSE, urls)
}

function busCallGetWindowId () {
  const win = windowManager.getAvailableWindow()
  bus.emit(GET_WINDOW_ID_REPONSE, win.id)
}

function busCallGetSettingWindowId () {
  const settingWindow = windowManager.get(IWindowList.SETTING_WINDOW)!
  bus.emit(GET_SETTING_WINDOW_ID_RESPONSE, settingWindow.id)
}

export default {
  listen () {
    initEventCenter()
  }
}
