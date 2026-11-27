import type { Ref } from 'vue'

import { IRPCActionType } from '#/constants/rpcActions'

import { useTransferTaskList } from './useTransferTaskList'

interface TransferTaskOptions {
  tableActive: Ref<boolean>
  layoutStyle: Ref<'grid' | 'table'>
  isShowUploadPanel: Ref<boolean>
  isShowDownloadPanel: Ref<boolean>
  uploadTaskList: Ref<IUploadTask[]>
  downloadTaskList: Ref<IDownloadTask[]>
  downloadDir: () => string
  onSuccess: (action: 'copy' | 'delete') => void
}

export function useTransferTasks(options: TransferTaskOptions) {
  const { tableActive, layoutStyle, isShowUploadPanel, isShowDownloadPanel, uploadTaskList, downloadTaskList } = options

  async function cancelUploadTask(id: string) {
    if (await window.electron.triggerRPC<boolean>(IRPCActionType.MANAGE_CANCEL_UPLOAD_TASK, id)) {
      const task = uploadTaskList.value.find(item => item.id === id)
      if (task) task.cancelRequested = true
    }
  }

  async function cancelDownloadTask(id: string) {
    if (await window.electron.triggerRPC<boolean>(IRPCActionType.MANAGE_CANCEL_DOWNLOAD_TASK, id)) {
      const task = downloadTaskList.value.find(item => item.id === id)
      if (task) task.cancelRequested = true
    }
  }

  const uploadTasks = useTransferTaskList(
    'upload',
    uploadTaskList,
    () => tableActive.value && (layoutStyle.value === 'table' || isShowUploadPanel.value),
  )

  const downloadTasks = useTransferTaskList(
    'download',
    downloadTaskList,
    () => tableActive.value && isShowDownloadPanel.value,
  )

  async function handleCopyUploadingTaskInfo() {
    await window.electron.clipboard.writeText(JSON.stringify(uploadTaskList.value, null, 2))
    options.onSuccess('copy')
  }

  function handleDeleteUploadedTask() {
    window.electron.sendRPC(IRPCActionType.MANAGE_DELETE_UPLOADED_TASK)
    options.onSuccess('delete')
  }

  function handleDeleteAllUploadedTask() {
    window.electron.sendRPC(IRPCActionType.MANAGE_DELETE_ALL_UPLOADED_TASK)
    options.onSuccess('delete')
  }

  async function handleCopyDownloadingTaskInfo() {
    await window.electron.clipboard.writeText(JSON.stringify(downloadTaskList.value, null, 2))
    options.onSuccess('copy')
  }

  function handleDeleteDownloadedTask() {
    window.electron.sendRPC(IRPCActionType.MANAGE_DELETE_DOWNLOADED_TASK)
    options.onSuccess('delete')
  }

  function handleDeleteAllDownloadedTask() {
    window.electron.sendRPC(IRPCActionType.MANAGE_DELETE_ALL_DOWNLOADED_TASK)
    options.onSuccess('delete')
  }

  function handleOpenDownloadedFolder() {
    window.electron.sendRPC(IRPCActionType.MANAGE_OPEN_DOWNLOADED_FOLDER, options.downloadDir())
  }

  return {
    uploadTasks,
    downloadTasks,
    cancelUploadTask,
    cancelDownloadTask,
    handleCopyUploadingTaskInfo,
    handleDeleteUploadedTask,
    handleDeleteAllUploadedTask,
    handleCopyDownloadingTaskInfo,
    handleDeleteDownloadedTask,
    handleDeleteAllDownloadedTask,
    handleOpenDownloadedFolder,
  }
}
