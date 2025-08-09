<template>
  <div class="login-container">
    <!-- Header Card -->
    <div class="login-card header-card">
      <div class="card-header">
        <div class="header-content">
          <div class="header-icon">
            <DatabaseIcon :size="24" />
          </div>
          <div>
            <h1>{{ t('pages.manage.login.title') }}</h1>
            <p>{{ sortedAllConfigAliasMap.length }} {{ t('pages.manage.login.savedConfigs') }}</p>
          </div>
        </div>
        <div class="header-actions">
          <button
            class="action-button"
            @click="refreshConfigs"
          >
            <RefreshCwIcon :size="16" />
            {{ t('pages.manage.login.refresh') }}
          </button>
        </div>
      </div>
    </div>

    <!-- Navigation Tabs -->
    <div class="login-card tabs-card">
      <div class="tabs-container">
        <div class="tabs-nav-wrapper">
          <div
            ref="tabsNav"
            class="tabs-nav"
          >
            <button
              v-for="item in tabItems"
              :key="item.key"
              class="tab-button"
              :class="{ active: activeName === item.key }"
              @click="handleTabChange(item.key)"
            >
              <FolderIcon
                v-if="item.key === 'login'"
                :size="16"
              />
              <img
                v-else
                :src="`/assets/${item.key}.webp`"
                class="tab-icon"
                :alt="item.name"
              >
              <span>{{ item.name }}</span>
            </button>
          </div>
        </div>
      </div>
    </div>

    <!-- Content Area -->
    <div class="login-card content-card">
      <div class="tab-content">
        <!-- Main Config List Tab -->
        <div
          v-if="activeName === 'login'"
          class="config-list-container"
        >
          <div
            v-if="sortedAllConfigAliasMap.length === 0"
            class="empty-state"
          >
            <div class="empty-icon">
              <DatabaseIcon :size="48" />
            </div>
            <h3>{{ t('pages.manage.login.noConfigs') }}</h3>
            <p>{{ t('pages.manage.login.noConfigsDesc') }}</p>
          </div>
          <div
            v-else
            class="config-grid"
          >
            <div
              v-for="item in sortedAllConfigAliasMap"
              :key="item.alias"
              class="config-item"
            >
              <div class="config-header">
                <img
                  :src="`/assets/${item.picBedName}.webp`"
                  class="config-icon"
                  :alt="item.picBedName"
                >
                <div class="config-info">
                  <h4 class="config-alias">
                    {{ item.alias }}
                  </h4>
                  <p class="config-type">
                    {{ supportedPicBedList[item.picBedName]?.name || item.picBedName }}
                  </p>
                </div>
              </div>

              <div class="config-details">
                <button
                  class="details-button"
                  @click="toggleConfigDetails(item.alias)"
                >
                  <InfoIcon :size="14" />
                  {{ t('pages.manage.login.viewDetails') }}
                  <ChevronDownIcon
                    :size="14"
                    :class="{ rotated: expandedConfigs.includes(item.alias) }"
                  />
                </button>

                <div
                  v-if="expandedConfigs.includes(item.alias)"
                  class="config-table"
                >
                  <div
                    v-for="tableItem in formObjToTableData(item.config)"
                    :key="tableItem.key"
                    class="table-row"
                    @click="copyToClipboard(tableItem.value)"
                  >
                    <span class="table-key">{{ tableItem.key }}</span>
                    <span class="table-value">{{ tableItem.value }}</span>
                  </div>
                </div>
              </div>

              <div class="config-actions">
                <button
                  class="action-button primary"
                  @click="handleConfigClick(item)"
                >
                  <PointerIcon :size="16" />
                  {{ t('pages.manage.login.enter') }}
                </button>
                <button
                  class="action-button danger"
                  @click="handleConfigRemove(item.alias)"
                >
                  <TrashIcon :size="16" />
                  {{ t('pages.manage.login.delete') }}
                </button>
              </div>
            </div>
          </div>
        </div>

        <!-- PicBed Configuration Tabs -->
        <div
          v-else
          class="picbed-config-container"
        >
          <div
            v-if="supportedPicBedList[activeName]"
            class="picbed-config"
          >
            <!-- Info Section -->
            <div class="info-section">
              <div class="info-card primary">
                <InfoIcon :size="20" />
                <p>{{ supportedPicBedList[activeName].explain }}</p>
              </div>
              <div class="info-card reference">
                <LinkIcon :size="20" />
                <p>
                  {{ supportedPicBedList[activeName].referenceText }}
                  <button
                    class="link-button"
                    @click="handleReferenceClick(supportedPicBedList[activeName].refLink)"
                  >
                    {{ supportedPicBedList[activeName].refLink }}
                  </button>
                </p>
              </div>
            </div>

            <!-- Configuration Form -->
            <div class="config-form">
              <div
                v-for="option in supportedPicBedList[activeName].options"
                :key="option"
                class="form-group"
                :class="{ 'has-error': formErrors[activeName + '.' + option] }"
              >
                <label class="form-label">
                  {{ supportedPicBedList[activeName].configOptions[option].description }}
                  <span
                    v-if="supportedPicBedList[activeName].configOptions[option].required"
                    class="required-marker"
                  >*</span>
                  <button
                    v-if="supportedPicBedList[activeName].configOptions[option].tooltip"
                    class="tooltip-button"
                    :title="supportedPicBedList[activeName].configOptions[option].tooltip"
                  >
                    <InfoIcon :size="14" />
                  </button>
                </label>

                <!-- String Input -->
                <input
                  v-if="supportedPicBedList[activeName].configOptions[option].type === 'string'"
                  v-model.trim="configResult[activeName + '.' + option]"
                  type="text"
                  class="form-input"
                  :class="{ error: formErrors[activeName + '.' + option] }"
                  :placeholder="supportedPicBedList[activeName].configOptions[option].placeholder"
                  :disabled="!!supportedPicBedList[activeName].configOptions[option].disabled"
                  @blur="validateField(activeName, option)"
                  @input="clearFieldError(activeName + '.' + option)"
                >

                <!-- Boolean Switch -->
                <label
                  v-else-if="supportedPicBedList[activeName].configOptions[option].type === 'boolean'"
                  class="custom-switch"
                >
                  <input
                    v-model="configResult[activeName + '.' + option]"
                    type="checkbox"
                    @change="validateField(activeName, option)"
                  >
                  <span class="switch-slider" />
                </label>

                <!-- Number Input -->
                <input
                  v-else-if="supportedPicBedList[activeName].configOptions[option].type === 'number'"
                  v-model.number="configResult[activeName + '.' + option]"
                  type="number"
                  class="form-input"
                  :class="{ error: formErrors[activeName + '.' + option] }"
                  :placeholder="supportedPicBedList[activeName].configOptions[option].placeholder"
                  @blur="validateField(activeName, option)"
                  @input="clearFieldError(activeName + '.' + option)"
                >

                <!-- Select Dropdown -->
                <div
                  v-else-if="supportedPicBedList[activeName].configOptions[option].type === 'select'"
                  class="custom-select"
                >
                  <select
                    v-model="configResult[activeName + '.' + option]"
                    class="form-select"
                    :class="{ error: formErrors[activeName + '.' + option] }"
                    @change="validateField(activeName, option)"
                  >
                    <option value="">
                      {{ t('pages.manage.login.selectPlaceholder') }}
                    </option>
                    <option
                      v-for="[key, value] in Object.entries(supportedPicBedList[activeName].configOptions[option].selectOptions)"
                      :key="key"
                      :value="key"
                    >
                      {{ value }}
                    </option>
                  </select>
                </div>

                <!-- Error Message -->
                <div
                  v-if="formErrors[activeName + '.' + option]"
                  class="error-message"
                >
                  {{ formErrors[activeName + '.' + option] }}
                </div>
              </div>
            </div>

            <!-- Action Buttons -->
            <div class="action-section">
              <div class="import-section">
                <div
                  v-if="currentAliasList.length > 0"
                  class="dropdown-container"
                >
                  <button
                    class="dropdown-trigger action-button secondary"
                    @click="toggleImportDropdown"
                  >
                    <DownloadIcon :size="16" />
                    {{ t('pages.manage.login.import') }}
                    <ChevronDownIcon :size="16" />
                  </button>
                  <div
                    v-if="importDropdownOpen"
                    class="dropdown-menu"
                  >
                    <button
                      v-for="alias in currentAliasList"
                      :key="alias"
                      class="dropdown-item"
                      @click="handleConfigImport(alias)"
                    >
                      {{ alias }}
                    </button>
                  </div>
                </div>
              </div>

              <div class="main-actions">
                <button
                  class="action-button primary"
                  @click="handleConfigChange(activeName)"
                >
                  <SaveIcon :size="16" />
                  {{ t('pages.manage.login.save') }}
                </button>
                <button
                  class="action-button danger"
                  @click="handleConfigReset(activeName)"
                >
                  <RotateCcwIcon :size="16" />
                  {{ t('pages.manage.login.reset') }}
                </button>
              </div>
            </div>

            <!-- Existing Configurations Table -->
            <div
              v-if="dataForTable.length > 0"
              class="config-table-section"
            >
              <h3>{{ t('pages.manage.login.configTabTitle') }}</h3>
              <div class="responsive-table">
                <table class="config-table">
                  <thead>
                    <tr>
                      <th
                        v-for="option in supportedPicBedList[activeName].options"
                        :key="option"
                      >
                        {{ supportedPicBedList[activeName].configOptions[option].description }}
                      </th>
                    </tr>
                  </thead>
                  <tbody>
                    <tr
                      v-for="(row, index) in dataForTable"
                      :key="index"
                    >
                      <td
                        v-for="option in supportedPicBedList[activeName].options"
                        :key="option"
                        @click="copyToClipboard(row[option])"
                      >
                        {{ row[option] }}
                      </td>
                    </tr>
                  </tbody>
                </table>
              </div>
            </div>
          </div>
        </div>
      </div>
    </div>
  </div>
</template>

<script lang="ts" setup>
import {
  ChevronDownIcon,
  DatabaseIcon,
  DownloadIcon,
  FolderIcon,
  InfoIcon,
  LinkIcon,
  PointerIcon,
  RefreshCwIcon,
  RotateCcwIcon,
  SaveIcon,
  TrashIcon
} from 'lucide-vue-next'
import { computed, onMounted, reactive, ref } from 'vue'
import { useI18n } from 'vue-i18n'
import { useRouter } from 'vue-router'

import useConfirm from '@/hooks/useConfirm'
import useMessage from '@/hooks/useMessage'
import { useManageStore } from '@/manage/store/manageStore'
import { formObjToTableData } from '@/manage/utils/common'
import { supportedPicBedList } from '@/manage/utils/constants'
import { getConfig, removeConfig, saveConfig } from '@/manage/utils/dataSender'
import { formatEndpoint } from '@/utils/common'
import { getConfig as getPicBedsConfig } from '@/utils/dataSender'
import { IRPCActionType } from '@/utils/enum'
import type { IStringKeyMap, IUploaderConfigListItem } from '#/types/types'

const { t } = useI18n()
const manageStore = useManageStore()
const router = useRouter()
const message = useMessage()
const { confirm } = useConfirm()

const activeName = ref('login')
const expandedConfigs = ref<string[]>([])
const importDropdownOpen = ref(false)
const tabsNav = ref<HTMLElement>()

const configResult: IStringKeyMap = reactive({})
const existingConfiguration = reactive({} as IStringKeyMap)
const dataForTable = reactive([] as any[])
const allConfigAliasMap = reactive({} as IStringKeyMap)
const currentAliasList = reactive([] as string[])
const formErrors = reactive({} as IStringKeyMap)

const sortedAllConfigAliasMap = computed(() => {
  return Object.values(allConfigAliasMap).sort((a, b) => {
    return a.picBedName.localeCompare(b.picBedName)
  })
})

const tabItems = computed(() => {
  const items = [
    {
      key: 'login',
      name: t('pages.manage.login.savedConfigs'),
      icon: null,
      iconComponent: FolderIcon
    }
  ]

  Object.values(supportedPicBedList).forEach((item: any) => {
    items.push({
      key: item.icon,
      name: item.name,
      icon: item.icon,
      iconComponent: null as any
    })
  })

  return items
})

const importedNewConfig: IStringKeyMap = {}

const notifyUser = (msg: string, type: 'success' | 'error' | 'warning' = 'success') => {
  message[type](`${msg}`)
}

const validateField = (picBedName: string, optionKey: string) => {
  const fieldKey = `${picBedName}.${optionKey}`
  const configOption = supportedPicBedList[picBedName]?.configOptions?.[optionKey]
  const value = configResult[fieldKey]

  if (!configOption) return

  delete formErrors[fieldKey]

  if (configOption.required) {
    if (configOption.type === 'boolean') {
    } else if (!value || value === '') {
      formErrors[fieldKey] = t('pages.manage.constant.pleaseInput', { name: configOption.description })
      return
    }
  }

  if (configOption.rule && Array.isArray(configOption.rule)) {
    for (const rule of configOption.rule) {
      if (rule.validator) {
        try {
          rule.validator(rule, value, (error: Error | null) => {
            if (error) {
              formErrors[fieldKey] = error.message
            }
          })
        } catch (e) {
          console.error('Validation error:', e)
        }
      } else if (rule.type === 'number' && value !== undefined && value !== '') {
        if (isNaN(Number(value))) {
          formErrors[fieldKey] = rule.message || t('pages.manage.constant.itemsPPBeNumber')
          return
        }
      }
    }
  }

  if (optionKey === 'alias' && value) {
    const reg = /^[\p{Unified_Ideograph}_a-zA-Z0-9-]+$/u
    if (!reg.test(value)) {
      formErrors[fieldKey] = t('pages.manage.login.aliasMsg')
    }
  }

  if (optionKey === 'itemsPerPage' && value !== undefined && value !== '') {
    const numValue = Number(value)
    if (numValue < 20 || numValue > 1000) {
      formErrors[fieldKey] = t('pages.manage.login.itemsPerPageMsg')
    }
  }
}

const clearFieldError = (fieldKey: string) => {
  delete formErrors[fieldKey]
}

const validateAllFields = (picBedName: string): boolean => {
  const options = supportedPicBedList[picBedName]?.options || []
  let isValid = true

  for (const option of options) {
    validateField(picBedName, option)
    if (formErrors[`${picBedName}.${option}`]) {
      isValid = false
    }
  }

  return isValid
}

const initializeDefaultValues = (picBedName: string) => {
  if (!supportedPicBedList[picBedName]) return

  const options = supportedPicBedList[picBedName].options || []
  for (const option of options) {
    const fieldKey = `${picBedName}.${option}`
    const configOption = supportedPicBedList[picBedName].configOptions[option]

    if (configResult[fieldKey] === undefined || configResult[fieldKey] === '') {
      if (configOption.default !== undefined) {
        configResult[fieldKey] = configOption.default
      } else if (configOption.type === 'boolean') {
        configResult[fieldKey] = false
      } else if (configOption.type === 'number') {
        configResult[fieldKey] = 0
      } else {
        configResult[fieldKey] = ''
      }
    }
  }
}

function getDataForTable () {
  for (const key in existingConfiguration) {
    dataForTable.push({ ...(existingConfiguration[key] as IStringKeyMap) })
  }
}

async function getExistingConfig (name: string) {
  if (name === 'login') {
    getAllConfigAliasArray()
    return
  }
  currentAliasList.length = 0
  const result = await getConfig<any>('picBed')
  for (const key in existingConfiguration) {
    delete existingConfiguration[key]
  }
  if (!result || typeof result !== 'object' || Object.keys(result).length === 0) {
    existingConfiguration[name] = { fail: '暂无配置' }
  } else {
    for (const key in result) {
      if (result[key].picBedName === name) {
        existingConfiguration[key] = result[key]
        currentAliasList.push(result[key].alias)
      }
    }
  }

  dataForTable.length = 0
  getDataForTable()
  handleConfigImport(currentAliasList[0])
}

function getAliasList () {
  return Object.values(existingConfiguration).map(item => item.alias)
}

async function handleConfigChange (name: string) {
  if (!validateAllFields(name)) {
    notifyUser(t('pages.manage.login.noRequiredMsg'), 'error')
    return
  }

  const aliasList = getAliasList()
  const allKeys = Object.keys(supportedPicBedList[name].configOptions)
  const resultMap: IStringKeyMap = {}

  for (const key of allKeys) {
    const resultKey = name + '.' + key
    console.log('Config change detected for:', resultKey)

    if (key === 'customUrl' && configResult[resultKey] !== undefined && configResult[resultKey] !== '') {
      if (name !== 'upyun') {
        configResult[resultKey] = formatEndpoint(configResult[resultKey], false)
      }
    }

    if (supportedPicBedList[name].configOptions[key].default !== undefined && configResult[resultKey] === '') {
      resultMap[key] = supportedPicBedList[name].configOptions[key].default
    } else if (configResult[resultKey] === undefined) {
      if (supportedPicBedList[name].configOptions[key].default !== undefined) {
        resultMap[key] = supportedPicBedList[name].configOptions[key].default
      } else {
        resultMap[key] = ''
      }
    } else {
      resultMap[key] = configResult[resultKey]
    }
  }
  resultMap.picBedName = name
  if (resultMap.bucketName !== undefined) {
    resultMap.transformedConfig = {}
    const bucketName = resultMap.bucketName.split(',')
    const baseDir = resultMap.baseDir?.split(',')
    const area = resultMap.area?.split(',')
    const customUrl = resultMap.customUrl?.split(',')
    const operator = resultMap.operator?.split(',')
    const password = resultMap.password?.split(',')
    for (let i = 0; i < bucketName.length; i++) {
      if (bucketName[i]) {
        resultMap.transformedConfig[bucketName[i]] = {
          baseDir: baseDir?.[i] || '/',
          area: area?.[i] || '',
          customUrl: customUrl?.[i] || '',
          operator: operator?.[i] || '',
          password: password?.[i] || ''
        }
      }
    }
  }
  if (resultMap.transformedConfig) {
    resultMap.transformedConfig = JSON.stringify(resultMap.transformedConfig)
  }
  saveConfig(`picBed.${resultMap.alias}`, resultMap)
  await manageStore.refreshConfig()
  await getExistingConfig(activeName.value)
  dataForTable.length = 0
  getDataForTable()
  if (aliasList.includes(resultMap.alias)) {
    notifyUser(
      `${t('pages.manage.login.configChangeMsg')}${resultMap.alias}`,
      'warning'
    )
  } else {
    notifyUser(
      `${t('pages.manage.login.configSaveMsg')}${resultMap.alias}`,
      'success'
    )
  }
}

const handleConfigReset = (name: string) => {
  const keys = Object.keys(formErrors).filter(key => key.startsWith(name))
  keys.forEach(key => {
    delete formErrors[key]
  })

  const configKeys = Object.keys(configResult).filter(key => key.startsWith(name))
  configKeys.forEach(key => {
    delete configResult[key]
  })

  initializeDefaultValues(name)
}

const handleConfigRemove = async (name: string) => {
  confirm({
    title: t('pages.manage.login.tips'),
    message: t('pages.manage.login.confirmDeleteConfig'),
    type: 'warning',
    confirmButtonText: t('common.confirm'),
    cancelButtonText: t('common.cancel'),
    center: true
  }).then(result => {
    if (!result) return
    try {
      removeConfig('picBed', name)
      notifyUser(
        t('pages.manage.login.deleteConfigSuccessMsg'),
        'success'
      )
      manageStore.refreshConfig()
      getAllConfigAliasArray()
    } catch (error) {
      notifyUser(
        t('pages.manage.login.deleteConfigFailedMsg'),
        'error'
      )
    }
  })
}

const getAllConfigAliasArray = async () => {
  const result = await getConfig<any>('picBed')
  for (const key in allConfigAliasMap) {
    delete allConfigAliasMap[key]
  }
  if (!result) return
  Object.entries(result).forEach(([, value]: [string, any], index) => {
    allConfigAliasMap[index] = {
      alias: value.alias,
      config: value,
      picBedName: value.picBedName
    }
  })
}

const copyToClipboard = (text: string) => {
  navigator.clipboard.writeText(text)
  notifyUser(`${t('pages.manage.login.copySuccess', { text })}`, 'success')
}

const handleReferenceClick = (url: string) => window.electron.sendRPC(IRPCActionType.OPEN_URL, url)

const handleConfigClick = async (item: any) => {
  const alias = item.alias
  const config = JSON.stringify(item.config)
  const picBedName = item.picBedName
  const result = await getConfig<any>('picBed')
  router.push({
    path: '/main-page/manage-main-page',
    query: {
      alias,
      config,
      picBedName,
      allPicBedConfigure: JSON.stringify(result)
    }
  })
}

function handleConfigImport (alias: string) {
  const selectedConfig = existingConfiguration[alias]
  if (!selectedConfig) return

  supportedPicBedList[selectedConfig.picBedName].options.forEach((option: any) => {
    if (selectedConfig[option] !== undefined) {
      configResult[selectedConfig.picBedName + '.' + option] = selectedConfig[option]
    }
  })
}

const handleTabChange = (tabName: string) => {
  activeName.value = tabName
  getExistingConfig(tabName)

  for (const key in formErrors) {
    delete formErrors[key]
  }

  if (tabName !== 'login') {
    initializeDefaultValues(tabName)
  }
}

const toggleConfigDetails = (alias: string) => {
  const index = expandedConfigs.value.indexOf(alias)
  if (index > -1) {
    expandedConfigs.value.splice(index, 1)
  } else {
    expandedConfigs.value.push(alias)
  }
}

const toggleImportDropdown = () => {
  importDropdownOpen.value = !importDropdownOpen.value
}

const refreshConfigs = () => {
  getAllConfigAliasArray()
  notifyUser('Configurations refreshed', 'success')
}

onMounted(() => {
  getCurrentConfigList()
})

async function getCurrentConfigList () {
  await manageStore.refreshConfig()
  const configList = (await getPicBedsConfig<any>('uploader')) ?? {}
  const pbList = [
    'aliyun',
    'aws-s3',
    'aws-s3-plist',
    'github',
    'imgur',
    'local',
    'qiniu',
    'sftpplist',
    'smms',
    'tcyun',
    'upyun',
    'webdavplist'
  ]

  const filteredConfigList = pbList.flatMap(pb => {
    const config = configList[pb]
    return config?.configList?.length ? config.configList.map((item: any) => ({ ...item, type: pb })) : []
  })

  const autoImport = (await getPicBedsConfig<boolean>('settings.autoImport')) || false
  if (autoImport) {
    const autoImportPicBed = initArray(
      (await getPicBedsConfig<string | string[]>('settings.autoImportPicBed')) || '',
      []
    )
    await Promise.all(filteredConfigList.flatMap(config => transUpToManage(config, config.type, autoImportPicBed)))
    if (Object.keys(importedNewConfig).length > 0) {
      const oldConfig = await getConfig<any>('picBed')
      const newConfig = { ...oldConfig, ...importedNewConfig }
      saveConfig('picBed', newConfig)
      await manageStore.refreshConfig()
    }
  }

  await getAllConfigAliasArray()
}

function isImported (alias: string) {
  return Object.values(allConfigAliasMap).some(item => item.alias === alias)
}

function initArray (arrayT: string | string[], defaultValue: string[]) {
  if (!Array.isArray(arrayT)) {
    arrayT = arrayT ? [arrayT] : defaultValue
  }
  return arrayT
}

async function transUpToManage (config: IUploaderConfigListItem, picBedName: string, autoImportPicBed: string[]) {
  const alias = `${
    picBedName === 'webdavplist'
      ? 'webdav'
      : picBedName === 'sftpplist'
        ? 'sftp'
        : picBedName === 'aws-s3' || picBedName === 'aws-s3-plist'
          ? 's3plist'
          : picBedName
  }-${config._configName ?? 'Default'}-imp`
  if (!autoImportPicBed.includes(picBedName) || isImported(alias)) return
  const commonConfig = {
    alias,
    picBedName,
    paging: true
  }
  const resultMap: IStringKeyMap = {}
  switch (picBedName) {
    case 'smms':
      if (!config.token) return
      Object.assign(resultMap, {
        ...commonConfig,
        token: config.token
      })
      break
    case 'aliyun':
      if (!config.accessKeyId || !config.accessKeySecret) return
      Object.assign(resultMap, {
        ...commonConfig,
        accessKeyId: config.accessKeyId,
        accessKeySecret: config.accessKeySecret,
        bucketName: '',
        baseDir: '/',
        itemsPerPage: 50,
        isAutoCustomUrl: !config.customUrl,
        transformedConfig: JSON.stringify(
          config.customUrl
            ? {
                [config.bucket]: {
                  customUrl: config.customUrl
                }
              }
            : {}
        )
      })
      break
    case 'qiniu':
      if (!config.accessKey || !config.secretKey) return
      Object.assign(resultMap, {
        ...commonConfig,
        accessKey: config.accessKey,
        secretKey: config.secretKey,
        bucketName: '',
        baseDir: '/',
        isAutoCustomUrl: false,
        transformedConfig: JSON.stringify({ [config.bucket]: config.url }),
        itemsPerPage: 50
      })
      break
    case 'tcyun':
      if (!config.secretId || !config.secretKey || config.version === 'v4') return
      Object.assign(resultMap, {
        ...commonConfig,
        secretId: config.secretId,
        secretKey: config.secretKey,
        bucketName: '',
        baseDir: '/',
        appId: config.appId,
        isAutoCustomUrl: !config.customUrl,
        transformedConfig: JSON.stringify(
          config.customUrl
            ? {
                [config.bucket]: {
                  customUrl: config.customUrl
                }
              }
            : {}
        ),
        itemsPerPage: 50
      })
      break
    case 'github':
      if (!config.token) return
      Object.assign(resultMap, {
        ...commonConfig,
        token: config.token,
        githubUsername: config.repo.split('/')[0],
        customUrl: '',
        proxy: '',
        itemsPerPage: 50
      })
      break
    case 'upyun':
      if (!config.operator || !config.password) return
      Object.assign(resultMap, {
        ...commonConfig,
        operator: config.operator,
        password: config.password,
        bucketName: config.bucket,
        antiLeechToken: config.antiLeechToken,
        expireTime: config.expireTime,
        baseDir: '/',
        customUrl: config.url,
        transformedConfig: JSON.stringify({
          [config.bucket]: {
            customUrl: config.url,
            baseDir: '/',
            area: '',
            operator: config.operator,
            password: config.password
          }
        }),
        itemsPerPage: 50
      })
      break
    case 'webdavplist':
      if (!config.host) return
      Object.assign(resultMap, {
        ...commonConfig,
        endpoint: formatEndpoint(config.host, config.sslEnabled),
        username: config.username,
        password: config.password,
        bucketName: 'webdav',
        baseDir: config.path || '/',
        webPath: config.webpath || '',
        customUrl: config.customUrl || '',
        sslEnabled: !!config.sslEnabled,
        authType: config.authType || 'basic',
        proxy: '',
        transformedConfig: JSON.stringify({
          webdav: {
            operator: '',
            password: config.password,
            baseDir: config.path || '/',
            customUrl: config.customUrl || '',
            area: ''
          }
        })
      })
      delete resultMap.paging
      break
    case 'local':
      if (!config.path) return
      Object.assign(resultMap, {
        ...commonConfig,
        baseDir: config.path,
        webPath: config.webpath || '',
        customUrl: config.customUrl || '',
        transformedConfig: JSON.stringify({
          local: {
            customUrl: config.customUrl || '',
            baseDir: config.path,
            webPath: config.webpath || ''
          }
        })
      })
      delete resultMap.paging
      break
    case 'sftpplist':
      if (!config.host) return
      Object.assign(resultMap, {
        ...commonConfig,
        picBedName: 'sftp',
        host: config.host,
        port: config.port || 22,
        username: config.username,
        password: config.password,
        privateKey: config.privateKey,
        passphrase: config.passphrase,
        baseDir: config.uploadPath || '/',
        webPath: config.webPath || '',
        customUrl: config.customUrl || '',
        fileMode: config.fileMode || '0664',
        dirMode: config.dirMode || '0775',
        transformedConfig: JSON.stringify({
          sftp: {
            host: config.host,
            port: config.port || 22,
            username: config.username,
            password: config.password,
            privateKey: config.privateKey,
            passphrase: config.passphrase,
            baseDir: config.uploadPath || '/',
            webPath: config.webPath || '',
            customUrl: config.customUrl || '',
            fileMode: config.fileMode || '0664',
            dirMode: config.dirMode || '0775'
          }
        })
      })
      delete resultMap.paging
      break
    case 'aws-s3':
    case 'aws-s3-plist':
      if (!config.accessKeyID || !config.secretAccessKey) return
      Object.assign(resultMap, {
        ...commonConfig,
        picBedName: 's3plist',
        accessKeyId: config.accessKeyID,
        secretAccessKey: config.secretAccessKey,
        endpoint: config.endpoint || '',
        bucketName: '',
        baseDir: '/',
        itemsPerPage: 50,
        proxy: '',
        sslEnabled: config.endpoint ? config.endpoint.startsWith('https') : false,
        aclForUpload: 'public-read',
        s3ForcePathStyle: config.pathStyleAccess,
        dogeCloudSupport: false,
        transformedConfig: JSON.stringify(
          config.urlPrefix
            ? {
                [config.bucketName]: {
                  customUrl: config.urlPrefix
                }
              }
            : {}
        )
      })
      break
    case 'imgur':
      if (!config.username || !config.accessToken) return
      Object.assign(resultMap, {
        ...commonConfig,
        username: config.username,
        accessToken: config.accessToken,
        proxy: ''
      })
      delete resultMap.paging
      break
    default:
      return
  }
  importedNewConfig[alias] = resultMap
}

onMounted(() => {
  getCurrentConfigList()
})
</script>

<style scoped src="./css/LoginPage.css"></style>
