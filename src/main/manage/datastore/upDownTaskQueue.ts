// a singleton class to manage the up/down task queue
// qiniu tcyun aliyun smms imgur github upyun

import path from 'path'
import { app } from 'electron'
import fs from 'fs-extra'
export enum commonTaskStatus {
  queuing = 'queuing',
  failed = 'failed',
  canceled = 'canceled',
  paused = 'paused'
}

export enum uploadTaskSpecialStatus {
  uploading = 'uploading',
  uploaded = 'uploaded'
}

export enum downloadTaskSpecialStatus {
  downloading = 'downloading',
  downloaded = 'downloaded',
}

export type uploadTaskStatus = commonTaskStatus | uploadTaskSpecialStatus
type downloadTaskStatus = commonTaskStatus | downloadTaskSpecialStatus

export interface IUploadTask {
  id: string
  progress: number
  status: uploadTaskStatus
  sourceFilePath: string
  sourceFileName: string
  targetFilePath: string
  targetFileBucket?: string
  response?: any
  cancelToken?: string
  timeConsuming?: number
  alias?: string
  [other: string]: any
}

export interface IDownloadTask {
  id: string
  progress: number
  status: downloadTaskStatus
  sourceFileUrl?: string
  sourceFileName?: string
  sourceConfig?: IStringKeyMap
  targetFilePath?: string
  response?: any
  cancelToken?: string
  timeConsuming?: number
  reseumConfig?: IStringKeyMap
  alias?: string
  [other: string]: any
}

class UpDownTaskQueue {
  /* eslint-disable */
  private static instance: UpDownTaskQueue
  /* eslint-enable */
  private uploadTaskQueue = <IUploadTask[]>[]

  private downloadTaskQueue = <IDownloadTask[]>[]

  private persistPath = path.join(app.getPath('userData'), 'UpDownTaskQueue.json')

  private constructor () {
    this.restore()
  }

  public static getInstance () {
    if (!UpDownTaskQueue.instance) {
      UpDownTaskQueue.instance = new UpDownTaskQueue()
    }
    return UpDownTaskQueue.instance
  }

  getUploadTaskQueue () {
    return UpDownTaskQueue.getInstance().uploadTaskQueue
  }

  getDownloadTaskQueue () {
    return UpDownTaskQueue.getInstance().downloadTaskQueue
  }

  getUploadTask (taskId: string) {
    return UpDownTaskQueue.getInstance().uploadTaskQueue.find(item => item.id === taskId)
  }

  getAllUploadTask () {
    return UpDownTaskQueue.getInstance().uploadTaskQueue
  }

  addUploadTask (task: IUploadTask) {
    UpDownTaskQueue.getInstance().uploadTaskQueue.push(task)
  }

  updateUploadTask (task: Partial<IUploadTask>) {
    const taskIndex = UpDownTaskQueue.getInstance().uploadTaskQueue.findIndex(item => item.id === task.id)
    if (taskIndex !== -1) {
      const taskKeys = Object.keys(task)
      taskKeys.forEach(key => {
        if (key !== 'id') {
          UpDownTaskQueue.getInstance().uploadTaskQueue[taskIndex][key] = task[key]
        }
      })
    }
  }

  removeUploadTask (taskId: string) {
    const taskIndex = UpDownTaskQueue.getInstance().uploadTaskQueue.findIndex(item => item.id === taskId)
    if (taskIndex !== -1) {
      UpDownTaskQueue.getInstance().uploadTaskQueue.splice(taskIndex, 1)
    }
  }

  removeDownloadTask (taskId: string) {
    const taskIndex = UpDownTaskQueue.getInstance().downloadTaskQueue.findIndex(item => item.id === taskId)
    if (taskIndex !== -1) {
      UpDownTaskQueue.getInstance().downloadTaskQueue.splice(taskIndex, 1)
    }
  }

  getDownloadTask (taskId: string) {
    return UpDownTaskQueue.getInstance().downloadTaskQueue.find(item => item.id === taskId)
  }

  getAllDownloadTask () {
    return UpDownTaskQueue.getInstance().downloadTaskQueue
  }

  addDownloadTask (task: IDownloadTask) {
    UpDownTaskQueue.getInstance().downloadTaskQueue.push(task)
  }

  updateDownloadTask (task: Partial<IDownloadTask>) {
    const taskIndex = UpDownTaskQueue.getInstance().downloadTaskQueue.findIndex(item => item.id === task.id)
    if (taskIndex !== -1) {
      const taskKeys = Object.keys(task)
      taskKeys.forEach(key => {
        if (key !== 'id') {
          UpDownTaskQueue.getInstance().downloadTaskQueue[taskIndex][key] = task[key]
        }
      })
    }
  }

  clearUploadTaskQueue () {
    UpDownTaskQueue.getInstance().uploadTaskQueue = []
  }

  removeUploadedTask () {
    UpDownTaskQueue.getInstance().uploadTaskQueue = UpDownTaskQueue.getInstance().uploadTaskQueue.filter(item => item.status !== uploadTaskSpecialStatus.uploaded && item.status !== commonTaskStatus.canceled && item.status !== commonTaskStatus.failed)
  }

  removeDownloadedTask () {
    UpDownTaskQueue.getInstance().downloadTaskQueue = UpDownTaskQueue.getInstance().downloadTaskQueue.filter(item => item.status !== downloadTaskSpecialStatus.downloaded && item.status !== commonTaskStatus.canceled && item.status !== commonTaskStatus.failed)
  }

  clearDownloadTaskQueue () {
    UpDownTaskQueue.getInstance().downloadTaskQueue = []
  }

  clearAllTaskQueue () {
    this.clearUploadTaskQueue()
    this.clearDownloadTaskQueue()
  }

  persist () {
    try {
      this.checkPersistPath()
      fs.writeFileSync(this.persistPath, JSON.stringify({
        uploadTaskQueue: this.uploadTaskQueue,
        downloadTaskQueue: this.downloadTaskQueue
      }))
    } catch (e) {
      console.log(e)
    }
  }

  private restore () {
    try {
      this.checkPersistPath()
      const persistData = JSON.parse(fs.readFileSync(this.persistPath, { encoding: 'utf-8' }))
      this.uploadTaskQueue = persistData.uploadTaskQueue
      this.downloadTaskQueue = persistData.downloadTaskQueue
    } catch (e) {
      this.uploadTaskQueue = []
      this.downloadTaskQueue = []
    }
  }

  private checkPersistPath () {
    if (!fs.existsSync(this.persistPath)) {
      fs.writeFileSync(this.persistPath, JSON.stringify({
        uploadTaskQueue: this.uploadTaskQueue,
        downloadTaskQueue: this.downloadTaskQueue
      }))
    }
    try {
      JSON.parse(fs.readFileSync(this.persistPath, { encoding: 'utf-8' }))
    } catch (e) {
      fs.writeFileSync(this.persistPath, JSON.stringify({
        uploadTaskQueue: this.uploadTaskQueue,
        downloadTaskQueue: this.downloadTaskQueue
      }))
    }
  }
}

export default UpDownTaskQueue
