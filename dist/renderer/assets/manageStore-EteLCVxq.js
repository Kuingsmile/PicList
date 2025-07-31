import { a$ as defineStore } from "./index-BqdcQlNn.js";
import { g as getConfig } from "./dataSender-Bg45AIFL.js";
const useManageStore = defineStore("manageConfig", {
  state: () => {
    return {
      config: {}
    };
  },
  actions: {
    async refreshConfig() {
      this.config = await getConfig() ?? {};
    }
  },
  persist: true
});
const useFileTransferStore = defineStore("fileTransfer", {
  state: () => {
    return {
      fileTransferList: [],
      success: false,
      finished: false
    };
  },
  actions: {
    refreshFileTransferList(newData) {
      this.fileTransferList = newData.fullList ?? [];
      this.success = newData.success;
      this.finished = newData.finished;
    },
    resetFileTransferList() {
      this.fileTransferList = [];
      this.success = false;
      this.finished = false;
    },
    getFileTransferList() {
      return this.fileTransferList;
    },
    isFinished() {
      return this.finished;
    },
    isSuccess() {
      return this.success;
    }
  }
});
const useDownloadFileTransferStore = defineStore("downloadFileTransfer", {
  state: () => {
    return {
      downloadFileTransferList: [],
      success: false,
      finished: false
    };
  },
  actions: {
    refreshDownloadFileTransferList(newData) {
      this.downloadFileTransferList = newData.fullList ?? [];
      this.success = newData.success;
      this.finished = newData.finished;
    },
    resetDownloadFileTransferList() {
      this.downloadFileTransferList = [];
      this.success = false;
      this.finished = false;
    },
    getDownloadFileTransferList() {
      return this.downloadFileTransferList;
    },
    isFinished() {
      return this.finished;
    },
    isSuccess() {
      return this.success;
    }
  }
});
export {
  useDownloadFileTransferStore as a,
  useFileTransferStore as b,
  useManageStore as u
};
