<template>
  <div class="no-scrollbar flex h-full w-full flex-col gap-4 overflow-auto p-4">
    <!-- Info Section -->
    <div
      class="flex items-center justify-center rounded-md border border-border-secondary bg-bg-secondary p-2 shadow-md"
    >
      <InfoIcon :size="20" />
      <p class="m-0 text-sm leading-[1.5] font-semibold text-secondary">
        {{ supportedPicBedList[activeName].explain }}
      </p>
    </div>
    <div
      class="flex items-center justify-center rounded-md border border-border-secondary bg-bg-secondary p-2 shadow-md"
    >
      <LinkIcon :size="20" />
      <p class="m-0 text-sm leading-[1.5] font-semibold text-secondary">
        {{ supportedPicBedList[activeName].referenceText }}
        <button class="link-button" @click="handleReferenceClick(supportedPicBedList[activeName].refLink)">
          {{ supportedPicBedList[activeName].refLink }}
        </button>
      </p>
    </div>
    <div class="border-none">
      <div class="grid w-full grid-cols-1 gap-3">
        <SettingCard>
          <CustomInput
            v-model.trim="configResult[activeName + '.alias']"
            type="text"
            :placeholder="supportedPicBedList[activeName].configOptions.alias.placeholder || ''"
            :title="supportedPicBedList[activeName].configOptions.alias.description"
            :required="supportedPicBedList[activeName].configOptions.alias.required"
            :class="{ 'border-danger': formErrors[activeName + '.' + 'alias'] }"
            @blur="validateField(activeName, 'alias')"
            @input="clearFieldError(activeName + '.alias')"
          />
          <template v-if="formErrors[activeName + '.' + 'alias']" #extra>
            <div class="mt-1 text-xs text-danger">
              {{ formErrors[activeName + '.' + 'alias'] }}
            </div>
          </template>
        </SettingCard>
        <template v-for="option in supportedPicBedList[activeName].options" :key="option">
          <SettingCard
            v-if="supportedPicBedList[activeName].configOptions[option].type === 'string' && option !== 'alias'"
          >
            <CustomInput
              v-model.trim="configResult[activeName + '.' + option]"
              type="text"
              :placeholder="supportedPicBedList[activeName].configOptions[option].placeholder || ''"
              :class="{ 'border-danger': formErrors[activeName + '.' + option] }"
              :title="supportedPicBedList[activeName].configOptions[option].description"
              :required="supportedPicBedList[activeName].configOptions[option].required"
              :disabled="!!supportedPicBedList[activeName].configOptions[option].disabled"
              @blur="validateField(activeName, option)"
              @input="clearFieldError(activeName + '.' + option)"
            />
            <template v-if="formErrors[activeName + '.' + option]" #extra>
              <div class="mt-1 text-xs text-danger">
                {{ formErrors[activeName + '.' + option] }}
              </div>
            </template>
          </SettingCard>
        </template>
        <template v-for="option in supportedPicBedList[activeName].options" :key="option">
          <SettingCard v-if="supportedPicBedList[activeName].configOptions[option].type === 'number'">
            <CustomInput
              v-model.number="configResult[activeName + '.' + option]"
              type="number"
              :placeholder="supportedPicBedList[activeName].configOptions[option].placeholder || ''"
              :class="{ 'border-danger': formErrors[activeName + '.' + option] }"
              :title="supportedPicBedList[activeName].configOptions[option].description"
              :required="supportedPicBedList[activeName].configOptions[option].required"
              @blur="validateField(activeName, option)"
              @input="clearFieldError(activeName + '.' + option)"
            />
            <template v-if="formErrors[activeName + '.' + option]" #extra>
              <div class="mt-1 text-xs text-danger">
                {{ formErrors[activeName + '.' + option] }}
              </div>
            </template>
          </SettingCard>
        </template>
        <template v-for="option in supportedPicBedList[activeName].options" :key="option">
          <SettingCard v-if="supportedPicBedList[activeName].configOptions[option].type === 'boolean'" p1>
            <CustomSwitch
              v-model="configResult[activeName + '.' + option]"
              no-border
              small
              :required="supportedPicBedList[activeName].configOptions[option].required"
              :title="supportedPicBedList[activeName].configOptions[option].description"
              :tips="supportedPicBedList[activeName].configOptions[option].tooltip || ''"
              @update:model-value="validateField(activeName, option)"
            >
            </CustomSwitch>
          </SettingCard>
        </template>
        <template v-for="option in supportedPicBedList[activeName].options" :key="option">
          <SettingCard v-if="supportedPicBedList[activeName].configOptions[option].type === 'select'">
            <CustomSelect
              v-model="configResult[activeName + '.' + option]"
              :title="supportedPicBedList[activeName].configOptions[option].description"
              :required="supportedPicBedList[activeName].configOptions[option].required"
              :select-list="
                Object.entries(supportedPicBedList[activeName].configOptions[option].selectOptions || {}).map(
                  ([key, value]) => ({
                    value: key,
                    label: value as string,
                  }),
                )
              "
              :class="{ 'border-danger': formErrors[activeName + '.' + option] }"
              @change="validateField(activeName, option)"
            >
              <template #pre-info>
                <option value="" disabled>
                  {{ t('pages.manage.login.selectPlaceholder') }}
                </option>
              </template>
            </CustomSelect>
            <template v-if="formErrors[activeName + '.' + option]" #extra>
              <div class="mt-1 text-xs text-danger">
                {{ formErrors[activeName + '.' + option] }}
              </div>
            </template>
          </SettingCard>
        </template>
      </div>
    </div>
    <!-- Action Buttons -->
    <div class="flex flex-wrap items-center justify-end gap-4">
      <div class="flex gap-4">
        <div v-if="currentAliasList.length > 0" class="w-40">
          <SingleSelect
            v-model="selectedAlias"
            :title="t('pages.manage.login.import')"
            :key-list="currentAliasList"
            :custom-front-icon="DownloadIcon"
          />
        </div>
        <CustomButton
          type="primary"
          :text="t('pages.manage.login.save')"
          :icon="SaveIcon"
          @click="handleConfigChange(activeName)"
        />
        <CustomButton
          class="bg-danger/70"
          :text="t('pages.manage.login.reset')"
          :icon="RotateCcwIcon"
          @click="handleConfigReset(activeName)"
        />
        <CustomButton class="bg-warning/70" :text="t('common.cancel')" :icon="XIcon" @click="cancelEditMode" />
      </div>
    </div>
  </div>
</template>

<script setup lang="ts">
import { DownloadIcon, InfoIcon, LinkIcon, RotateCcwIcon, SaveIcon, XIcon } from 'lucide-vue-next'
import { onMounted, reactive, ref, watch } from 'vue'
import { useI18n } from 'vue-i18n'

import CustomButton from '@/components/common/CustomButton.vue'
import CustomInput from '@/components/common/CustomInput.vue'
import CustomSelect from '@/components/common/CustomSelect.vue'
import CustomSwitch from '@/components/common/CustomSwitch.vue'
import SettingCard from '@/components/common/SettingCard.vue'
import SingleSelect from '@/components/common/SingleSelect.vue'
import useMessage from '@/hooks/useMessage'
import { useManageStore } from '@/manage/store/manageStore'
import { supportedPicBedList } from '@/manage/utils/constants'
import { getConfig, saveConfig } from '@/manage/utils/dataSender'
import { formatEndpoint } from '@/utils/common'
import { IRPCActionType } from '@/utils/enum'

const { t } = useI18n()
const manageStore = useManageStore()
const message = useMessage()
const formErrors = reactive({} as IStringKeyMap)
const configResult: IStringKeyMap = reactive({})
const existingConfiguration = reactive({} as IStringKeyMap)
const currentAliasList = reactive([] as string[])
const dataForTable = reactive([] as any[])
const editMode = defineModel<boolean>('editMode')
const selectedAlias = ref('')

const { aliasName, activeName } = defineProps<{
  aliasName: string
  activeName: string
}>()

watch(selectedAlias, newAlias => {
  if (newAlias) {
    handleConfigImport(newAlias)
  }
})

const handleReferenceClick = (url: string) => window.electron.sendRPC(IRPCActionType.OPEN_URL, url)

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

async function handleConfigChange(name: string) {
  if (!validateAllFields(name)) {
    notifyUser(t('pages.manage.login.noRequiredMsg'), 'error')
    return
  }

  const aliasList = getAliasList()
  const allKeys = Object.keys(supportedPicBedList[name].configOptions)
  const resultMap: IStringKeyMap = {}

  for (const key of allKeys) {
    const resultKey = name + '.' + key
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
          password: password?.[i] || '',
        }
      }
    }
  }
  if (resultMap.transformedConfig) {
    resultMap.transformedConfig = JSON.stringify(resultMap.transformedConfig)
  }
  saveConfig(`picBed.${resultMap.alias}`, resultMap)
  await manageStore.refreshConfig()
  await getExistingConfig(activeName)
  dataForTable.length = 0
  getDataForTable()
  if (aliasList.includes(resultMap.alias)) {
    notifyUser(`${t('pages.manage.login.configChangeMsg')}${resultMap.alias}`, 'warning')
  } else {
    notifyUser(`${t('pages.manage.login.configSaveMsg')}${resultMap.alias}`, 'success')
  }
  editMode.value = false
}

const notifyUser = (msg: string, type: 'success' | 'error' | 'warning' = 'success') => {
  message[type](`${msg}`)
}

function getDataForTable() {
  for (const key in existingConfiguration) {
    dataForTable.push({ ...(existingConfiguration[key] as IStringKeyMap) })
  }
}

async function getExistingConfig(name: string) {
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
  handleConfigImport(aliasName)
}

function handleConfigImport(alias: string) {
  const selectedConfig = existingConfiguration[alias]
  if (!selectedConfig) return

  supportedPicBedList[selectedConfig.picBedName].options.forEach((option: any) => {
    if (selectedConfig[option] !== undefined) {
      configResult[selectedConfig.picBedName + '.' + option] = selectedConfig[option]
    }
  })
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

function getAliasList() {
  return Object.values(existingConfiguration).map(item => item.alias)
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

const cancelEditMode = () => {
  editMode.value = false
}

onMounted(async () => {
  getExistingConfig(activeName)
  await manageStore.refreshConfig()
})
</script>
