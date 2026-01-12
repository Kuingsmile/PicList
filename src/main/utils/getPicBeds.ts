import picgo from '@core/picgo'

import { configPaths } from '~/utils/configPaths'

const getPicBeds = () => {
  const picBedTypes = picgo.helper.uploader.getIdList()
  const defaultPicBed =
    picgo.getConfig<string>(configPaths.picBed.uploader) ||
    picgo.getConfig<string>(configPaths.picBed.current) ||
    'smms'
  const defaultConfig = picgo.getConfig<IStringKeyMap>(`picBed.${defaultPicBed}`) || {}
  const defaultId = defaultConfig._id || ''
  const defaultConfigName = defaultConfig._configName || ''
  const picBedFromDB = picgo.getConfig<IPicBedType[]>(configPaths.picBed.list) || []
  const picBeds = picBedTypes
    .map((item: string) => {
      const visible = picBedFromDB.find((i: IPicBedType) => i.type === item) // object or undefined
      return {
        type: item,
        name: picgo.helper.uploader.get(item)!.name || item,
        visible: visible ? visible.visible : true,
      }
    })
    .sort(a => {
      if (a.type === 'tcyun') {
        return -1
      }
      return 0
    }) as IPicBedType[]
  return { picBeds, defaultPicBed, defaultId, defaultConfigName, defaultConfig }
}

export default getPicBeds
