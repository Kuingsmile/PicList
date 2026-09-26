// a singleton class to manage the up/down task queue
// qiniu tcyun aliyun smms imgur github upyun

import path from 'node:path'

import { dataDir } from '@core/datastore/dirs'

import { commonTaskStatus, downloadTaskSpecialStatus, uploadTaskSpecialStatus } from '~/utils/enum'
import { TaskCheckpoint } from '~/utils/taskCheckpoint'

import { finishImportedFileUpload, retainImportedFileForUpload } from '../utils/urlImportFiles'
import { decodeManagementCheckpoint, managementTaskMetadata, retainManagementHistory } from './taskMetadata'

class UpDownTaskQueue {
  private static instance: UpDownTaskQueue

  private uploadTaskQueue = [] as IUploadTask[]

  private downloadTaskQueue = [] as IDownloadTask[]

  private checkpoint = new TaskCheckpoint({
    file: path.join(dataDir(), 'UpDownTaskQueue.json'),
    decode: decodeManagementCheckpoint,
    snapshot: () => ({
      uploadTaskQueue: this.uploadTaskQueue.map(managementTaskMetadata),
      downloadTaskQueue: this.downloadTaskQueue.map(managementTaskMetadata),
    }),
    onError: () => console.error('Management task checkpoint unavailable'),
  })

  private constructor() {
    const restored = this.checkpoint.load()
    if (restored) {
      this.uploadTaskQueue = restored.uploadTaskQueue
      this.downloadTaskQueue = restored.downloadTaskQueue
      this.persist()
    }
  }

  static getInstance() {
    if (!UpDownTaskQueue.instance) {
      UpDownTaskQueue.instance = new UpDownTaskQueue()
    }
    return UpDownTaskQueue.instance
  }

  getUploadTaskQueue() {
    return UpDownTaskQueue.getInstance().uploadTaskQueue
  }

  getDownloadTaskQueue() {
    return UpDownTaskQueue.getInstance().downloadTaskQueue
  }

  getUploadTask(taskId: string) {
    return UpDownTaskQueue.getInstance().uploadTaskQueue.find(item => item.id === taskId)
  }

  getAllUploadTask() {
    return UpDownTaskQueue.getInstance().uploadTaskQueue
  }

  addUploadTask(task: IUploadTask) {
    retainImportedFileForUpload(task.sourceFilePath, task.id)
    UpDownTaskQueue.getInstance().uploadTaskQueue.push(task)
    task.createdAt ??= Date.now()
    this.persist()
  }

  updateUploadTask(task: Partial<IUploadTask>) {
    const taskIndex = UpDownTaskQueue.getInstance().uploadTaskQueue.findIndex(item => item.id === task.id)
    if (taskIndex !== -1) {
      const current = UpDownTaskQueue.getInstance().uploadTaskQueue[taskIndex]
      if (['uploaded', 'failed', 'canceled'].includes(current.status)) return
      const taskKeys = Object.keys(task)
      taskKeys.forEach(key => {
        if (key !== 'id') {
          UpDownTaskQueue.getInstance().uploadTaskQueue[taskIndex][key] = task[key]
        }
      })
      if (['uploaded', 'failed', 'canceled'].includes(current.status)) current.completedAt = Date.now()
      this.persist()
    }
    // Providers finish asynchronously, even if the visible task list was cleared.
    if (
      task.id &&
      (task.status === uploadTaskSpecialStatus.uploaded ||
        task.status === commonTaskStatus.failed ||
        task.status === commonTaskStatus.canceled)
    ) {
      finishImportedFileUpload(task.id)
    }
  }

  removeUploadTask(taskId: string) {
    const taskIndex = UpDownTaskQueue.getInstance().uploadTaskQueue.findIndex(item => item.id === taskId)
    if (taskIndex !== -1) {
      UpDownTaskQueue.getInstance().uploadTaskQueue.splice(taskIndex, 1)
      this.persist()
    }
  }

  removeDownloadTask(taskId: string) {
    const taskIndex = UpDownTaskQueue.getInstance().downloadTaskQueue.findIndex(item => item.id === taskId)
    if (taskIndex !== -1) {
      UpDownTaskQueue.getInstance().downloadTaskQueue.splice(taskIndex, 1)
      this.persist()
    }
  }

  getDownloadTask(taskId: string) {
    return UpDownTaskQueue.getInstance().downloadTaskQueue.find(item => item.id === taskId)
  }

  getAllDownloadTask() {
    return UpDownTaskQueue.getInstance().downloadTaskQueue
  }

  addDownloadTask(task: IDownloadTask) {
    UpDownTaskQueue.getInstance().downloadTaskQueue.push(task)
    task.createdAt ??= Date.now()
    this.persist()
  }

  updateDownloadTask(task: Partial<IDownloadTask>) {
    const taskIndex = UpDownTaskQueue.getInstance().downloadTaskQueue.findIndex(item => item.id === task.id)
    if (taskIndex !== -1) {
      const current = this.downloadTaskQueue[taskIndex]
      if (['downloaded', 'failed', 'canceled'].includes(current.status)) return
      const taskKeys = Object.keys(task)
      taskKeys.forEach(key => {
        if (key !== 'id') {
          UpDownTaskQueue.getInstance().downloadTaskQueue[taskIndex][key] = task[key]
        }
      })
      if (['downloaded', 'failed', 'canceled'].includes(current.status)) current.completedAt = Date.now()
      this.persist()
    }
  }

  clearUploadTaskQueue() {
    UpDownTaskQueue.getInstance().uploadTaskQueue = []
    this.persist()
  }

  removeUploadedTask() {
    UpDownTaskQueue.getInstance().uploadTaskQueue = UpDownTaskQueue.getInstance().uploadTaskQueue.filter(
      item =>
        item.status !== uploadTaskSpecialStatus.uploaded &&
        item.status !== commonTaskStatus.canceled &&
        item.status !== commonTaskStatus.failed,
    )
    this.persist()
  }

  removeDownloadedTask() {
    UpDownTaskQueue.getInstance().downloadTaskQueue = UpDownTaskQueue.getInstance().downloadTaskQueue.filter(
      item =>
        item.status !== downloadTaskSpecialStatus.downloaded &&
        item.status !== commonTaskStatus.canceled &&
        item.status !== commonTaskStatus.failed,
    )
    this.persist()
  }

  clearDownloadTaskQueue() {
    UpDownTaskQueue.getInstance().downloadTaskQueue = []
    this.persist()
  }

  clearAllTaskQueue() {
    this.clearUploadTaskQueue()
    this.clearDownloadTaskQueue()
  }

  persist() {
    this.uploadTaskQueue = retainManagementHistory(this.uploadTaskQueue)
    this.downloadTaskQueue = retainManagementHistory(this.downloadTaskQueue)
    this.checkpoint.schedule()
  }

  async flush(): Promise<void> {
    this.persist()
    await this.checkpoint.flush()
  }
}

export default UpDownTaskQueue
