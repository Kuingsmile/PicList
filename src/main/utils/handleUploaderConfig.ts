import picgo from '@core/picgo'
import { v4 as uuid } from 'uuid'

import { RpcError } from '#/rpc'
import { commitConfig } from '~/utils/commitConfig'
import { setTrayToolTip, trimValues } from '~/utils/common'
import { configPaths } from '~/utils/configPaths'

const isSecondUploaderConfig = (type: string, id: string): boolean =>
  picgo.getConfig<string>(configPaths.picBed.secondUploader) === type &&
  picgo.getConfig<IStringKeyMap>(configPaths.picBed.secondUploaderConfig)?._id === id

export const handleConfigWithFunction = (config: IPicGoPluginOriginConfig[]): IPicGoPluginConfig[] => {
  for (const i in config) {
    if (typeof config[i].default === 'function') {
      config[i].default = config[i].default()
    }
    if (typeof config[i].choices === 'function') {
      // eslint-disable-next-line @typescript-eslint/no-unsafe-function-type
      config[i].choices = (config[i].choices as Function)()
    }
  }
  return config as IPicGoPluginConfig[]
}

export const completeUploaderMetaConfig = (originData: IStringKeyMap, id?: string): IUploaderConfigListItem => {
  return {
    _configName: 'Default',
    ...trimValues(originData),
    _id: id || uuid(),
    _createdAt: Date.now(),
    _updatedAt: Date.now(),
  }
}

export const changeSecondUploader = (type: string, config?: IStringKeyMap) => {
  if (!type) {
    return
  }
  commitConfig(picgo, {
    [configPaths.picBed.secondUploader]: type,
    ...(config ? { [configPaths.picBed.secondUploaderConfig]: config } : {}),
  })
}

export const changeCurrentUploader = (type: string, config?: IStringKeyMap, id?: string) => {
  if (!type) return
  commitConfig(picgo, {
    [configPaths.picBed.current]: type,
    [configPaths.picBed.uploader]: type,
    ...(id ? { [`uploader.${type}.defaultId`]: id } : {}),
    ...(config ? { [`picBed.${type}`]: config } : {}),
  })
  setTrayToolTip(`${type} ${config?._configName || ''}`)
}

export const selectUploaderConfig = (type: string, id: string) => {
  const { configList } = getUploaderConfigList(type)
  const config = configList.find((item: IStringKeyMap) => item._id === id)
  if (!config) throw new RpcError('NOT_FOUND')
  commitConfig(picgo, {
    [`uploader.${type}.defaultId`]: id,
    [`picBed.${type}`]: config,
  })
}

export const getUploaderConfigList = (type: string): IUploaderConfigItem => {
  if (!type) {
    return {
      configList: [],
      defaultId: '',
    }
  }
  const currentUploaderConfig = picgo.getConfig<IStringKeyMap>(`uploader.${type}`) ?? {}
  let configList = currentUploaderConfig.configList
  let defaultId = currentUploaderConfig.defaultId || ''
  if (!configList) {
    const res = upgradeUploaderConfig(type)
    configList = res.configList
    defaultId = res.defaultId
  }
  return {
    configList,
    defaultId,
  }
}

/**
 * delete uploader config by type & id
 */
export const deleteUploaderConfig = (type: string, id: string): IUploaderConfigItem => {
  const { configList, defaultId } = getUploaderConfigList(type)
  if (!configList.some(item => item._id === id)) throw new RpcError('NOT_FOUND')
  if (configList.length <= 1) throw new RpcError('CONFLICT')
  let newDefaultId = defaultId
  const updatedConfigList = configList.filter((item: IStringKeyMap) => item._id !== id)
  const patch: IStringKeyMap = { [`uploader.${type}.configList`]: updatedConfigList }
  if (id === defaultId) {
    const newDefaultConfig = updatedConfigList[0]
    newDefaultId = newDefaultConfig._id
    patch[`uploader.${type}.defaultId`] = newDefaultId
    patch[`picBed.${type}`] = newDefaultConfig
  }
  commitConfig(picgo, {
    ...patch,
    ...(isSecondUploaderConfig(type, id)
      ? {
          [configPaths.picBed.secondUploader]: '',
          [configPaths.picBed.secondUploaderConfig]: {},
          [configPaths.settings.enableSecondUploader]: false,
        }
      : {}),
  })
  if (id === defaultId && picgo.getConfig<string>(configPaths.picBed.uploader) === type) {
    setTrayToolTip(`${type} ${updatedConfigList[0]._configName || ''}`)
  }
  return {
    configList: updatedConfigList,
    defaultId: newDefaultId,
  }
}

export const duplicateUploaderConfig = (type: string, id: string, newName: string): IUploaderConfigItem => {
  const { configList, defaultId } = getUploaderConfigList(type)
  const originalConfig = configList.find((item: IStringKeyMap) => item._id === id)
  if (!originalConfig) throw new RpcError('NOT_FOUND')

  const duplicatedConfig: IUploaderConfigListItem = {
    ...originalConfig,
    _configName: newName,
    _id: uuid(),
    _createdAt: Date.now(),
    _updatedAt: Date.now(),
  }

  const updatedConfigList = [...configList, duplicatedConfig]

  commitConfig(picgo, {
    [`uploader.${type}.configList`]: updatedConfigList,
  })

  return {
    configList: updatedConfigList,
    defaultId,
  }
}

/**
 * upgrade old uploader config to new format
 */
export const upgradeUploaderConfig = (
  type: string,
): {
  configList: IStringKeyMap[]
  defaultId: string
} => {
  const uploaderConfig = { ...(picgo.getConfig<IStringKeyMap>(`picBed.${type}`) ?? {}) }
  if (!uploaderConfig._id) {
    Object.assign(uploaderConfig, completeUploaderMetaConfig(uploaderConfig))
  }

  const uploaderConfigList = [uploaderConfig]
  commitConfig(picgo, {
    [`uploader.${type}`]: {
      configList: uploaderConfigList,
      defaultId: uploaderConfig._id,
    },
    [`picBed.${type}`]: uploaderConfig,
  })
  return {
    configList: uploaderConfigList,
    defaultId: uploaderConfig._id,
  }
}

export const updateUploaderConfig = (type: string, id: string, config: IStringKeyMap) => {
  const { configList: originalList, defaultId } = getUploaderConfigList(type)
  const configList = originalList.map(item => ({ ...item }))
  const existConfig = configList.find((item: IStringKeyMap) => item._id === id)
  let updatedConfig: IUploaderConfigListItem
  let updatedDefaultId = defaultId
  if (existConfig) {
    updatedConfig = Object.assign(existConfig, trimValues(config), {
      _id: id,
      _createdAt: existConfig._createdAt,
      _updatedAt: Date.now(),
    })
  } else {
    updatedConfig = completeUploaderMetaConfig(config, id)
    updatedDefaultId = updatedConfig._id
    configList.push(updatedConfig)
  }
  commitConfig(picgo, {
    [`uploader.${type}.configList`]: configList,
    [`uploader.${type}.defaultId`]: updatedDefaultId,
    ...(updatedDefaultId === updatedConfig._id ? { [`picBed.${type}`]: updatedConfig } : {}),
    ...(isSecondUploaderConfig(type, id) ? { [configPaths.picBed.secondUploaderConfig]: updatedConfig } : {}),
  })
}

/**
 * Reset selected congfig id to default
 */

export const resetUploaderConfig = (type: string, id: string) => {
  const configList = getUploaderConfigList(type).configList.map(item => ({ ...item }))
  const config = configList.find(item => item._id === id)
  if (!config) throw new RpcError('NOT_FOUND')
  Object.keys(config).forEach(key => {
    if (!['_configName', '_id', '_createdAt', '_updatedAt'].includes(key)) {
      delete config[key]
    }
  })
  const currentDefault = picgo.getConfig<IStringKeyMap>(`picBed.${type}`) ?? {}
  commitConfig(picgo, {
    [`uploader.${type}.configList`]: configList,
    ...(currentDefault._id === id ? { [`picBed.${type}`]: config } : {}),
    ...(isSecondUploaderConfig(type, id) ? { [configPaths.picBed.secondUploaderConfig]: config } : {}),
  })
}
