import { defineStore } from 'pinia'
import { getConfig } from '../utils/dataSender'

export const useManageStore = defineStore('manageConfig', {
  state: () => {
    return {
      config: {} as IStringKeyMap
    }
  },
  actions: {
    async refreshConfig () {
      this.config = await getConfig() ?? {}
    }
  },
  persist: true
})

export const useFileTransferStore = defineStore('fileTransfer', {
  state: () => {
    return {
      fileTransferList: [] as IStringKeyMap[],
      success: false,
      finished: false
    }
  },
  actions: {
    refreshFileTransferList (newData: IStringKeyMap) {
      this.fileTransferList = newData.fullList ?? []
      this.success = newData.success
      this.finished = newData.finished
    },
    resetFileTransferList () {
      this.fileTransferList = []
      this.success = false
      this.finished = false
    },
    getFileTransferList () {
      return this.fileTransferList
    },
    isFinished () {
      return this.finished
    },
    isSuccess () {
      return this.success
    }
  }
})

export const useDownloadFileTransferStore = defineStore('downloadFileTransfer', {
  state: () => {
    return {
      downloadFileTransferList: [] as IStringKeyMap[],
      success: false,
      finished: false
    }
  },
  actions: {
    refreshDownloadFileTransferList (newData: IStringKeyMap) {
      this.downloadFileTransferList = newData.fullList ?? []
      this.success = newData.success
      this.finished = newData.finished
    },
    resetDownloadFileTransferList () {
      this.downloadFileTransferList = []
      this.success = false
      this.finished = false
    },
    getDownloadFileTransferList () {
      return this.downloadFileTransferList
    },
    isFinished () {
      return this.finished
    },
    isSuccess () {
      return this.success
    }
  }
})
