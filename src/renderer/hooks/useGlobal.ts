import { readonly, ref } from 'vue'

import { IRPCActionType } from '@/utils/enum'

const osGlobal = ref<string>(window.electron.platform)
const pageReloadCount = ref(0)

interface getPicBedType {
  picBeds: IPicBedType[]
  defaultPicBed: string
  defaultConfigName: string
  defaultId: string
  defaultConfig: IStringKeyMap
}

const _picBeds = ref<IPicBedType[]>([])
const _defaultPicBed = ref<string>('')
const _defaultConfigName = ref<string>('')
const _defaultPicBedId = ref<string>('')
const _defaultConfigG = ref<IStringKeyMap>({})

export function usePicBed() {
  const updatePicBeds = async () => {
    const result = await window.electron.triggerRPC<getPicBedType>(IRPCActionType.MAIN_GET_PICBED)
    if (result) {
      _picBeds.value = result.picBeds
      _defaultPicBed.value = result.defaultPicBed
      _defaultConfigName.value = result.defaultConfigName
      _defaultPicBedId.value = result.defaultId
      _defaultConfigG.value = result.defaultConfig
    }
  }
  return {
    picBedG: readonly(_picBeds),
    defaultPicBedG: readonly(_defaultPicBed),
    defaultConfigNameG: readonly(_defaultConfigName),
    defaultIdG: readonly(_defaultPicBedId),
    defaultConfigG: readonly(_defaultConfigG),
    updatePicBeds,
  }
}

async function updatePageReloadCount() {
  pageReloadCount.value++
}

export { osGlobal, pageReloadCount, updatePageReloadCount }
