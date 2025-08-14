import { ref } from 'vue'

import { IRPCActionType } from '@/utils/enum'
import type { IPicBedType } from '#/types/types'

const osGlobal = ref<string>(window.electron.platform)

const picBedGlobal = ref<IPicBedType[]>([])
const pageReloadCount = ref(0)

async function updatePicBedGlobal () {
  picBedGlobal.value = (await window.electron.triggerRPC<IPicBedType[]>(IRPCActionType.MAIN_GET_PICBED))!
}

async function updatePageReloadCount () {
  pageReloadCount.value++
}

export { osGlobal, pageReloadCount, picBedGlobal, updatePageReloadCount, updatePicBedGlobal }
