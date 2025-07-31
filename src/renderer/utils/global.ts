import { ref } from 'vue'

import { IRPCActionType } from '#/types/enum'
import { IPicBedType } from '#/types/types'

console.log('global.ts loaded', window.node.crypto.randomBytes(16).toString('hex'))
const osGlobal = ref<string>(window.electron.sendRpcSync(IRPCActionType.GET_PLATFORM))

const picBedGlobal = ref<IPicBedType[]>([])
const pageReloadCount = ref(0)

async function updatePicBedGlobal () {
  picBedGlobal.value = (await window.electron.triggerRPC<IPicBedType[]>(IRPCActionType.MAIN_GET_PICBED))!
}

async function updatePageReloadCount () {
  pageReloadCount.value++
}

export { osGlobal, pageReloadCount, picBedGlobal, updatePageReloadCount, updatePicBedGlobal }
