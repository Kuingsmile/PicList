import picgo from '@core/picgo'

const getPicBeds = () => {
  const picBedTypes = picgo.helper.uploader.getIdList()
  const allConfig = picgo.getConfig<any>() || {}
  const defaultPicBed = allConfig.picBed?.uploader || allConfig.picBed?.current || 'smms'
  const defaultConfig = allConfig.picBed?.[defaultPicBed] || {}
  const defaultId = defaultConfig._id || ''
  const defaultConfigName = defaultConfig._configName || ''
  const picBedFromDB = allConfig.picBed?.list || []
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
