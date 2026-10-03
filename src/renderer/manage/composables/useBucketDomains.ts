import { ref } from 'vue'

import { getConfig, saveConfig } from '@/manage/services/configService'
import { useManageStore } from '@/manage/stores/manageStore'
import type { BucketLocation, BucketViewLifecycle } from '@/manage/types/bucket'
import { IRPCActionType } from '#/constants/rpcActions'
interface BucketDomainOptions extends Pick<BucketLocation, 'configMap' | 'currentPicBedName'>, BucketViewLifecycle {}
export function useBucketDomains({ configMap, currentPicBedName, getGeneration, isDisposed }: BucketDomainOptions) {
  const manageStore = useManageStore()
  const customDomainList = ref([] as any[])

  const currentCustomDomain = ref('')

  async function handleChangeCustomUrl(generation = getGeneration()) {
    if (['aliyun', 'tcyun', 'qiniu', 's3plist', 'webdavplist', 'local', 'sftp'].includes(currentPicBedName.value)) {
      const currentConfigs = await getConfig<any>('picBed')
      if (isDisposed() || generation !== getGeneration()) return
      const currentConfig = currentConfigs[configMap.value.alias]
      const currentTransformedConfig = JSON.parse(currentConfig.transformedConfig ?? '{}')
      if (currentTransformedConfig[configMap.value.bucketName]) {
        currentTransformedConfig[configMap.value.bucketName].customUrl = currentCustomDomain.value
      } else {
        currentTransformedConfig[configMap.value.bucketName] = {
          customUrl: currentCustomDomain.value,
        }
      }
      currentConfig.transformedConfig = JSON.stringify(currentTransformedConfig)
      if (!(await saveConfig(`picBed.${configMap.value.alias}`, currentConfig))) return
      await manageStore.refreshConfig()
    }
  }

  async function initCustomDomainList(generation = getGeneration()) {
    if (
      (['aliyun', 'tcyun', 'qiniu'].includes(currentPicBedName.value) &&
        (manageStore.config.picBed[configMap.value.alias].isAutoCustomUrl === undefined ||
          manageStore.config.picBed[configMap.value.alias].isAutoCustomUrl === true)) ||
      ['github', 'smms', 'upyun', 'imgur'].includes(currentPicBedName.value)
    ) {
      const param = {
        bucketName: configMap.value.bucketName,
        region: configMap.value.bucketConfig.Location,
      }
      let defaultUrl = ''
      if (currentPicBedName.value === 'tcyun') {
        defaultUrl = `https://${configMap.value.bucketName}.cos.${configMap.value.bucketConfig.Location}.myqcloud.com`
      } else if (currentPicBedName.value === 'aliyun') {
        defaultUrl = `https://${configMap.value.bucketName}.${configMap.value.bucketConfig.Location}.aliyuncs.com`
      } else if (currentPicBedName.value === 'github') {
        defaultUrl = 'main'
      }
      const res = await window.electron.triggerRPC<any>(
        IRPCActionType.MANAGE_GET_BUCKET_DOMAIN,
        configMap.value.alias,
        param,
      )
      if (isDisposed() || generation !== getGeneration()) return
      if (res.length > 0) {
        customDomainList.value.length = 0
        res.forEach((item: any) => {
          if (!/^https?:\/\//.test(item) && currentPicBedName.value !== 'github') {
            item = manageStore.config.settings.isForceCustomUrlHttps ? `https://${item}` : `http://${item}`
          }
          customDomainList.value.push({
            label: item,
            value: item,
          })
        })
        defaultUrl !== '' &&
          currentPicBedName.value !== 'github' &&
          customDomainList.value.push({
            label: defaultUrl,
            value: defaultUrl,
          })
        currentCustomDomain.value = customDomainList.value[0].value
      } else {
        customDomainList.value.length = 0
        customDomainList.value = [
          {
            label: defaultUrl,
            value: defaultUrl,
          },
        ]
        currentCustomDomain.value = defaultUrl
      }
    } else if (['aliyun', 'tcyun', 'qiniu'].includes(currentPicBedName.value)) {
      const currentConfigs = await getConfig<any>('picBed')
      if (isDisposed() || generation !== getGeneration()) return
      const currentConfig = currentConfigs[configMap.value.alias]
      const currentTransformedConfig = JSON.parse(currentConfig.transformedConfig ?? '{}')
      if (currentTransformedConfig[configMap.value.bucketName]) {
        currentCustomDomain.value = currentTransformedConfig[configMap.value.bucketName].customUrl ?? ''
      } else {
        currentCustomDomain.value = ''
      }
    } else if (currentPicBedName.value === 's3plist') {
      const currentConfigs = await getConfig<any>('picBed')
      if (isDisposed() || generation !== getGeneration()) return
      const currentConfig = currentConfigs[configMap.value.alias]
      const currentTransformedConfig = JSON.parse(currentConfig.transformedConfig ?? '{}')
      const configuredDomain =
        currentTransformedConfig[configMap.value.bucketName]?.customUrl || currentConfig.customUrl
      if (configuredDomain) {
        currentCustomDomain.value = configuredDomain
      } else {
        if (manageStore.config.picBed[configMap.value.alias].endpoint) {
          const endpoint = manageStore.config.picBed[configMap.value.alias].endpoint
          const s3ForcePathStyle = manageStore.config.picBed[configMap.value.alias].s3ForcePathStyle
          let url
          if (/^https?:\/\//.test(endpoint)) {
            url = new URL(endpoint)
          } else {
            url = new URL(
              manageStore.config.picBed[configMap.value.alias].sslEnabled
                ? `https://${endpoint}`
                : `http://${endpoint}`,
            )
          }
          if (s3ForcePathStyle) {
            currentCustomDomain.value = `${url.protocol}//${url.hostname}${url.port ? ':' + url.port : ''}/${configMap.value.bucketName}`
          } else {
            currentCustomDomain.value = `${url.protocol}//${configMap.value.bucketName}.${url.hostname}${url.port ? ':' + url.port : ''}`
          }
        } else {
          currentCustomDomain.value = `https://${configMap.value.bucketName}.s3.amazonaws.com`
        }
      }
      await handleChangeCustomUrl()
    } else if (currentPicBedName.value === 'webdavplist') {
      const currentConfigs = await getConfig<any>('picBed')
      if (isDisposed() || generation !== getGeneration()) return
      const currentConfig = currentConfigs[configMap.value.alias]
      const currentTransformedConfig = JSON.parse(currentConfig.transformedConfig ?? '{}')
      if (
        currentTransformedConfig[configMap.value.bucketName] &&
        currentTransformedConfig[configMap.value.bucketName]?.customUrl
      ) {
        currentCustomDomain.value = currentTransformedConfig[configMap.value.bucketName].customUrl
      } else {
        let endpoint = manageStore.config.picBed[configMap.value.alias].endpoint
        if (!/^https?:\/\//.test(endpoint)) {
          endpoint = 'http://' + endpoint
        }
        currentCustomDomain.value = endpoint
      }
      await handleChangeCustomUrl()
    } else if (currentPicBedName.value === 'local' || currentPicBedName.value === 'sftp') {
      const currentConfigs = await getConfig<any>('picBed')
      if (isDisposed() || generation !== getGeneration()) return
      const currentConfig = currentConfigs[configMap.value.alias]
      const currentTransformedConfig = JSON.parse(currentConfig.transformedConfig ?? '{}')
      if (
        currentTransformedConfig[configMap.value.bucketName] &&
        currentTransformedConfig[configMap.value.bucketName]?.customUrl
      ) {
        currentCustomDomain.value = currentTransformedConfig[configMap.value.bucketName].customUrl ?? ''
        if (manageStore.config.settings.isForceCustomUrlHttps && currentCustomDomain.value.startsWith('http://')) {
          currentCustomDomain.value = currentCustomDomain.value.replace('http://', 'https://')
        }
      } else {
        currentCustomDomain.value = ''
      }
      await handleChangeCustomUrl()
    }
  }
  return { customDomainList, currentCustomDomain, handleChangeCustomUrl, initCustomDomainList }
}
