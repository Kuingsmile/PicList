import { defineStore } from 'pinia'

import { getConfig } from '@/manage/services/configService'

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
