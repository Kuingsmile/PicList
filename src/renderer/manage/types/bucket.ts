import type { Ref } from 'vue'
export type ISortTypeList = 'name' | 'size' | 'time' | 'ext' | 'check' | 'init' | 'provider' | 'status'

export interface BucketFile extends IObj {
  key: string
  fileName: string
  isImage: boolean
  isDir: boolean
  checked: boolean
}

export interface BucketLocation {
  configMap: Ref<Record<string, any>>
  currentPrefix: Ref<string>
  currentPicBedName: Ref<string>
  currentCustomDomain: Ref<string>
}

export interface BucketViewLifecycle {
  getGeneration: () => number
  isDisposed: () => boolean
}
