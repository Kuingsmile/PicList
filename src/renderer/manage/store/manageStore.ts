import { defineStore } from 'pinia'

import { getConfig } from '@/manage/utils/dataSender'

export const useManageStore = defineStore('manageConfig', {
  state: () => {
    return {
      config: {} as IStringKeyMap,
    }
  },
  actions: {
    async refreshConfig() {
      this.config = (await getConfig()) ?? {}
    },
  },
  persist: true,
})
