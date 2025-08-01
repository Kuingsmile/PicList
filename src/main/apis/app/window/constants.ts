const isDevelopment = process.env.NODE_ENV !== 'production'

export const MANUAL_WINDOW_URL =
  process.env.NODE_ENV === 'development'
    ? 'http://localhost:3000/documents'
    : 'index.html/documents'

export const MINI_WINDOW_URL = isDevelopment
  ? 'http://localhost:3000/mini-page'
  : 'index.html/mini-page'

export const RENAME_WINDOW_URL =
  process.env.NODE_ENV === 'development'
    ? 'http://localhost:3000/rename-page'
    : 'index.html/rename-page'

export const SETTING_WINDOW_URL = isDevelopment
  ? 'http://localhost:3000/main-page/upload'
  : 'index.html/main-page/upload'

export const TRAY_WINDOW_URL = isDevelopment ? 'http://localhost:3000' : 'index.html'

console.log(TRAY_WINDOW_URL)

export const TOOLBOX_WINDOW_URL =
  process.env.NODE_ENV === 'development'
    ? 'http://localhost:3000/toolbox-page'
    : 'index.html/toolbox-page'
