import { isReactive, isRef, toRaw, unref } from 'vue'
import { sendToMain } from './dataSender'
import { OPEN_URL } from '~/universal/events/constants'

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

export const openURL = (url: string) => {
  sendToMain(OPEN_URL, url)
}
