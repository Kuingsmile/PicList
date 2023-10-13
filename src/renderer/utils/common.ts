import { isReactive, isRef, toRaw, unref } from 'vue'
import { ipcRenderer } from 'electron'
import { OPEN_URL } from '~/universal/events/constants'

const isDevelopment = process.env.NODE_ENV !== 'production'
export const handleTalkingDataEvent = (data: ITalkingDataOptions) => {
  const { EventId, Label = '', MapKv = {} } = data
  MapKv.from = window.location.href
  window.TDAPP.onEvent(EventId, Label, MapKv)
  if (isDevelopment) {
    console.log('talkingData', data)
  }
}

/**
 * get raw data from reactive or ref
 */
export const getRawData = (args: any): any => {
  if (isRef(args)) return unref(args)
  if (isReactive(args)) return toRaw(args)
  if (Array.isArray(args)) return args.map(getRawData)
  if (typeof args === 'object' && args !== null) {
    const data = {} as Record<string, any>
    for (const key in args) {
      data[key] = getRawData(args[key])
    }
    return data
  }
  return args
}

function sendToMain (channel: string, ...args: any[]) {
  const data = getRawData(args)
  ipcRenderer.send(channel, ...data)
}

export const openURL = (url: string) => {
  sendToMain(OPEN_URL, url)
}
