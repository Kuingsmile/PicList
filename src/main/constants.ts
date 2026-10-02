import { IWindowList as sharedWindowList } from '#/constants/app'
import { IRPCActionType as sharedRpcActions } from '#/constants/rpcActions'

export const ILogType = {
  success: 'success',
  info: 'info',
  warn: 'warn',
  error: 'error',
}

export const ICOREBuildInEvent = {
  UPLOAD_PROGRESS: 'uploadProgress',
  FAILED: 'failed',
  BEFORE_TRANSFORM: 'beforeTransform',
  BEFORE_UPLOAD: 'beforeUpload',
  AFTER_UPLOAD: 'afterUpload',
  FINISHED: 'finished',
  INSTALL: 'install',
  UNINSTALL: 'uninstall',
  UPDATE: 'update',
  NOTIFICATION: 'notification',
  REMOVE: 'remove',
}

export const IPicGoHelperType = {
  afterUploadPlugins: 'afterUploadPlugins',
  beforeTransformPlugins: 'beforeTransformPlugins',
  beforeUploadPlugins: 'beforeUploadPlugins',
  uploader: 'uploader',
  transformer: 'transformer',
}

export const IRPCType = {
  INVOKE: 'INVOKE',
  SEND: 'SEND',
}

export const IShortUrlServer = {
  C1N: 'c1n',
  YOURLS: 'yourls',
  CFWORKER: 'cf_worker',
  SINK: 'sink',
}

export const commonTaskStatus = {
  queuing: 'queuing',
  failed: 'failed',
  canceled: 'canceled',
  paused: 'paused',
}

// manage task status

export const uploadTaskSpecialStatus = {
  uploading: 'uploading',
  uploaded: 'uploaded',
}

export const downloadTaskSpecialStatus = {
  downloading: 'downloading',
  downloaded: 'downloaded',
}

export const IWindowList = {
  ...sharedWindowList,
  ABOUT_WINDOW: 'ABOUT_WINDOW',
  UPDATE_WINDOW: 'UPDATE_WINDOW',
}

export const IRPCActionType = {
  ...sharedRpcActions,
  GET_SYSTEM_THEME: 'GET_SYSTEM_THEME',
  SET_SYSTEM_THEME: 'SET_SYSTEM_THEME',
  APPLY_THEME: 'APPLY_THEME',
  THEME_GET_BOOTSTRAP: 'THEME_GET_BOOTSTRAP',
} as const
