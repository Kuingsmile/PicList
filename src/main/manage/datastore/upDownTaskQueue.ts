import path from 'node:path'

import { dataDir } from '@core/datastore/dirs'

import { MANAGE_DOWNLOAD_TASKS_CHANGED, MANAGE_UPLOAD_TASKS_CHANGED } from '#/constants/ipcChannels'
import { TaskCheckpoint } from '~/services/taskCheckpoint'

import { finishImportedFileUpload, retainImportedFileForUpload } from '../utils/urlImportFiles'
import { decodeManagementCheckpoint, isTerminalManagementTask, managementTaskMetadata } from './taskMetadata'
import { TransferTaskList } from './transferTaskList'

class UpDownTaskQueue {
  private static instance: UpDownTaskQueue
  readonly uploads = new TransferTaskList<IUploadTask>(MANAGE_UPLOAD_TASKS_CHANGED, () => this.checkpoint.schedule())
  readonly downloads = new TransferTaskList<IDownloadTask>(MANAGE_DOWNLOAD_TASKS_CHANGED, () =>
    this.checkpoint.schedule(),
  )

  private checkpoint = new TaskCheckpoint({
    file: path.join(dataDir(), 'UpDownTaskQueue.json'),
    decode: decodeManagementCheckpoint,
    snapshot: () => ({
      uploadTaskQueue: this.uploads.all().map(managementTaskMetadata),
      downloadTaskQueue: this.downloads.all().map(managementTaskMetadata),
    }),
    onError: () => console.error('Management task checkpoint unavailable'),
  })

  private constructor() {
    const restored = this.checkpoint.load()
    if (restored) {
      this.uploads.restore(restored.uploadTaskQueue)
      this.downloads.restore(restored.downloadTaskQueue)
      this.checkpoint.schedule()
    }
  }

  static getInstance() {
    return (UpDownTaskQueue.instance ??= new UpDownTaskQueue())
  }

  getAllUploadTask() {
    return this.uploads.all()
  }

  addUploadTask(task: IUploadTask) {
    retainImportedFileForUpload(task.sourceFilePath, task.id)
    this.uploads.add(task)
  }

  updateUploadTask(task: Partial<IUploadTask>) {
    this.uploads.update(task)
    // Providers can finish after the user clears the visible list.
    if (task.id && isTerminalManagementTask(task.status)) finishImportedFileUpload(task.id)
  }

  removeDownloadTask(taskId: string) {
    this.downloads.removeWhere(task => task.id === taskId)
  }

  getDownloadTask(taskId: string) {
    return this.downloads.get(taskId)
  }

  getAllDownloadTask() {
    return this.downloads.all()
  }

  addDownloadTask(task: IDownloadTask) {
    this.downloads.add(task)
  }

  updateDownloadTask(task: Partial<IDownloadTask>) {
    this.downloads.update(task)
  }

  clearUploadTaskQueue() {
    this.uploads.removeWhere(() => true)
  }

  removeUploadedTask() {
    this.uploads.removeWhere(task => isTerminalManagementTask(task.status))
  }

  removeDownloadedTask() {
    this.downloads.removeWhere(task => isTerminalManagementTask(task.status))
  }

  clearDownloadTaskQueue() {
    this.downloads.removeWhere(() => true)
  }

  flush(): Promise<void> {
    const prunedUploads = this.uploads.pruneHistory()
    const prunedDownloads = this.downloads.pruneHistory()
    if (prunedUploads || prunedDownloads) this.checkpoint.schedule()
    return this.checkpoint.flush()
  }
}

export default UpDownTaskQueue
