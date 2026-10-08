export const IPasteStyle = {
  MARKDOWN: 'markdown',
  HTML: 'HTML',
  URL: 'URL',
  UBB: 'UBB',
  CUSTOM: 'Custom',
}

export const IWindowList = {
  SETTING_WINDOW: 'SETTING_WINDOW',
  TRAY_WINDOW: 'TRAY_WINDOW',
  MINI_WINDOW: 'MINI_WINDOW',
  RENAME_WINDOW: 'RENAME_WINDOW',
  TOOLBOX_WINDOW: 'TOOLBOX_WINDOW',
}

export const IToolboxItemType = {
  IS_CONFIG_FILE_BROKEN: 'IS_CONFIG_FILE_BROKEN',
  IS_GALLERY_FILE_BROKEN: 'IS_GALLERY_FILE_BROKEN',
  HAS_PROBLEM_WITH_CLIPBOARD_PIC_UPLOAD: 'HAS_PROBLEM_WITH_CLIPBOARD_PIC_UPLOAD',
  HAS_PROBLEM_WITH_PROXY: 'HAS_PROBLEM_WITH_PROXY',
  IS_DATA_DIR_NOT_WRITABLE: 'IS_DATA_DIR_NOT_WRITABLE',
  HAS_PROBLEM_WITH_UPLOAD_SERVER: 'HAS_PROBLEM_WITH_UPLOAD_SERVER',
}

export const IToolboxItemCheckStatus = {
  INIT: 'init',
  LOADING: 'loading',
  SUCCESS: 'success',
  ERROR: 'error',
}

export const ISartMode = {
  QUIET: 'quiet',
  MINI: 'mini',
  MAIN: 'main',
  NO_TRAY: 'no-tray',
}

export const ITrayClickAction = {
  PANEL: 'panel',
  MAIN_WINDOW: 'mainWindow',
}

// macOS has always opened the panel from the menu bar; Windows opens the main window.
export const getDefaultTrayClickAction = (platform: string) =>
  platform === 'darwin' ? ITrayClickAction.PANEL : ITrayClickAction.MAIN_WINDOW

export const II18nLanguage = {
  ZH_CN: 'zh-CN',
  ZH_TW: 'zh-TW',
  EN: 'en',
}
