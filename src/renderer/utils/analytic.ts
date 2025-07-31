import pkg from 'root/package.json'

import { handleTalkingDataEvent } from '@/utils/common'
import { TALKING_DATA_APPID, TALKING_DATA_EVENT } from '#/events/constants'
import { ITalkingDataOptions } from '#/types/types'

const { version } = pkg

export const initTalkingData = () => {
  setTimeout(() => {
    const talkingDataScript = document.createElement('script')

    talkingDataScript.src = `http://sdk.talkingdata.com/app/h5/v1?appid=${TALKING_DATA_APPID}&vn=${version}&vc=${version}`

    const head = document.getElementsByTagName('head')[0]
    head.appendChild(talkingDataScript)
  }, 0)
}

window.electron.ipcRendererOn(TALKING_DATA_EVENT, (_, data: ITalkingDataOptions) => {
  handleTalkingDataEvent(data)
})
