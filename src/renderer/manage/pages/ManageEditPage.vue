<template>
  <div class="no-scrollbar flex h-full w-full flex-col gap-4 overflow-auto p-4">
    <!-- Info Section -->
    <div
      class="flex items-center justify-center rounded-md border border-border-secondary bg-bg-secondary p-2 shadow-md"
    >
      <InfoIcon :size="15" class="mr-1" />
      <p class="m-0 text-sm leading-[1.5] font-semibold text-secondary">
        {{ supportedPicBedList[platformName].explain }}
      </p>
    </div>
    <div
      class="flex items-center justify-center rounded-md border border-border-secondary bg-bg-secondary p-2 shadow-md"
    >
      <LinkIcon :size="15" class="mr-1" />
      <p class="m-0 text-sm leading-[1.5] font-semibold text-secondary">
        {{ supportedPicBedList[platformName].referenceText }}
        <button class="link-button" @click="handleReferenceClick(supportedPicBedList[platformName].refLink)">
          {{ supportedPicBedList[platformName].refLink }}
        </button>
      </p>
    </div>
    <div class="border-none">
      <div class="grid w-full grid-cols-1 gap-3">
        <SettingCard>
          <CustomInput
            v-model.trim="configResult.alias"
            type="text"
            :placeholder="supportedPicBedList[platformName].configOptions.alias.placeholder || ''"
            :title="supportedPicBedList[platformName].configOptions.alias.description"
            :required="supportedPicBedList[platformName].configOptions.alias.required"
            :class="{ 'border-danger': formErrors.alias }"
            @blur="validateField(platformName, 'alias')"
            @input="clearFieldError('alias')"
          />
          <template v-if="formErrors.alias" #extra>
            <div class="mt-1 text-xs text-danger">
              {{ formErrors.alias }}
            </div>
          </template>
        </SettingCard>
        <template v-for="option in supportedPicBedList[platformName].options" :key="option">
          <SettingCard
            v-if="supportedPicBedList[platformName].configOptions[option].type === 'string' && option !== 'alias'"
          >
            <CustomInput
              v-model.trim="configResult[option]"
              type="text"
              :placeholder="supportedPicBedList[platformName].configOptions[option].placeholder || ''"
              :class="{ 'border-danger': formErrors[option] }"
              :title="supportedPicBedList[platformName].configOptions[option].description"
              :required="supportedPicBedList[platformName].configOptions[option].required"
              :disabled="!!supportedPicBedList[platformName].configOptions[option].disabled"
              :tips="supportedPicBedList[platformName].configOptions[option].tooltip || ''"
              @blur="validateField(platformName, option)"
              @input="clearFieldError(option)"
            />
            <template v-if="formErrors[option]" #extra>
              <div class="mt-1 text-xs text-danger">
                {{ formErrors[option] }}
              </div>
            </template>
          </SettingCard>
        </template>
        <template v-for="option in supportedPicBedList[platformName].options" :key="option">
          <SettingCard v-if="supportedPicBedList[platformName].configOptions[option].type === 'number'">
            <CustomInput
              v-model.number="configResult[option]"
              type="number"
              :placeholder="supportedPicBedList[platformName].configOptions[option].placeholder || ''"
              :class="{ 'border-danger': formErrors[option] }"
              :title="supportedPicBedList[platformName].configOptions[option].description"
              :required="supportedPicBedList[platformName].configOptions[option].required"
              :tips="supportedPicBedList[platformName].configOptions[option].tooltip || ''"
              @blur="validateField(platformName, option)"
              @input="clearFieldError(option)"
            />
            <template v-if="formErrors[option]" #extra>
              <div class="mt-1 text-xs text-danger">
                {{ formErrors[option] }}
              </div>
            </template>
          </SettingCard>
        </template>
        <template v-for="option in supportedPicBedList[platformName].options" :key="option">
          <SettingCard v-if="supportedPicBedList[platformName].configOptions[option].type === 'boolean'" p1>
            <CustomSwitch
              v-model="configResult[option]"
              no-border
              small
              :required="supportedPicBedList[platformName].configOptions[option].required"
              :title="supportedPicBedList[platformName].configOptions[option].description"
              :tips="supportedPicBedList[platformName].configOptions[option].tooltip || ''"
              @update:model-value="validateField(platformName, option)"
            >
            </CustomSwitch>
          </SettingCard>
        </template>
        <template v-for="option in supportedPicBedList[platformName].options" :key="option">
          <SettingCard v-if="supportedPicBedList[platformName].configOptions[option].type === 'select'">
            <CustomSelect
              v-model="configResult[option]"
              :title="supportedPicBedList[platformName].configOptions[option].description"
              :required="supportedPicBedList[platformName].configOptions[option].required"
              :select-list="
                Object.entries(supportedPicBedList[platformName].configOptions[option].selectOptions || {}).map(
                  ([key, value]) => ({
                    value: key,
                    label: value as string,
                  }),
                )
              "
              :class="{ 'border-danger': formErrors[option] }"
              @change="validateField(platformName, option)"
            >
              <template #pre-info>
                <option value="" disabled>
                  {{ t('pages.manage.login.selectPlaceholder') }}
                </option>
              </template>
            </CustomSelect>
            <template v-if="formErrors[option]" #extra>
              <div class="mt-1 text-xs text-danger">
                {{ formErrors[option] }}
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
          @click="handleConfigChange()"
        />
        <CustomButton
          class="bg-danger/70"
          :text="t('pages.manage.login.reset')"
          :icon="RotateCcwIcon"
          @click="handleConfigReset()"
        />
        <CustomButton class="bg-warning/70" :text="t('common.cancel')" :icon="XIcon" @click="cancelEditMode" />
      </div>
    </div>
  </div>
</template>

<script setup lang="ts">
import { DownloadIcon, InfoIcon, LinkIcon, RotateCcwIcon, SaveIcon, XIcon } from '@lucide/vue'
import { computed, onMounted, ref, watch } from 'vue'
import { useI18n } from 'vue-i18n'

import CustomButton from '@/components/common/CustomButton.vue'
import CustomInput from '@/components/common/CustomInput.vue'
import CustomSelect from '@/components/common/CustomSelect.vue'
import CustomSwitch from '@/components/common/CustomSwitch.vue'
import SettingCard from '@/components/common/SettingCard.vue'
import SingleSelect from '@/components/common/SingleSelect.vue'
import useMessage from '@/hooks/useMessage'
import { useManageStore } from '@/manage/store/manageStore'
import { getSupportedPicBedList } from '@/manage/utils/constants'
import { getConfig, saveConfig } from '@/manage/utils/dataSender'
import { formatEndpoint } from '@/utils/common'
import { IRPCActionType } from '@/utils/enum'

const editMode = defineModel<boolean>('editMode')
const emit = defineEmits<(e: 'update:editMode', value: boolean) => void>()

const { aliasName, platformName } = defineProps<{
  aliasName: string
  platformName: string
}>()

const { t } = useI18n()
const supportedPicBedList = computed(() => getSupportedPicBedList(t))
const manageStore = useManageStore()
const message = useMessage()
const formErrors = ref<IStringKeyMap>({})
const configResult = ref<IStringKeyMap>({})
const existingConfiguration = ref<IStringKeyMap>({})
const currentAliasList = ref<string[]>([])
const selectedAlias = ref('')

watch(selectedAlias, newAlias => {
  if (newAlias) {
    handleConfigImport(newAlias)
  }
})

const handleReferenceClick = (url: string) => window.electron.sendRPC(IRPCActionType.OPEN_URL, url)

const validateField = (picBedName: string, optionKey: string) => {
  const configOption = supportedPicBedList.value[picBedName]?.configOptions?.[optionKey]
  const value = configResult.value[optionKey]

  if (!configOption) return

  delete formErrors.value[optionKey]

  if (configOption.required) {
    if (configOption.type === 'boolean') {
    } else if (!value || value === '') {
      formErrors.value[optionKey] = t('pages.manage.constant.pleaseInput', { name: configOption.description })
      return
    }
  }

  if (configOption.rule && Array.isArray(configOption.rule)) {
    for (const rule of configOption.rule) {
      if (rule.validator) {
        try {
          rule.validator(rule, value, (error: Error | null) => {
            if (error) {
              formErrors.value[optionKey] = error.message
            }
          })
        } catch (e) {
          console.error('Validation error:', e)
        }
      } else if (rule.type === 'number' && value !== undefined && value !== '') {
        if (isNaN(Number(value))) {
          formErrors.value[optionKey] = rule.message || t('pages.manage.constant.itemsPPBeNumber')
          return
        }
      }
    }
  }

  if (optionKey === 'alias' && value) {
    const reg = /^[\p{Unified_Ideograph}_a-zA-Z0-9-]+$/u
    if (!reg.test(value)) {
      formErrors.value[optionKey] = t('pages.manage.login.aliasMsg')
    }
  }

  if (optionKey === 'itemsPerPage' && value !== undefined && value !== '') {
    const numValue = Number(value)
    if (numValue < 20 || numValue > 1000) {
      formErrors.value[optionKey] = t('pages.manage.login.itemsPerPageMsg')
    }
  }
}

const clearFieldError = (fieldKey: string) => {
  delete formErrors.value[fieldKey]
}

async function handleConfigChange() {
  if (!validateAllFields(platformName)) {
    notifyUser(t('pages.manage.login.noRequiredMsg'), 'error')
    return
  }

  const aliasList = Object.values(existingConfiguration.value).map(item => item.alias)
  const allKeys = Object.keys(supportedPicBedList.value[platformName].configOptions)
  const resultMap: IStringKeyMap = {}
  if (aliasList.includes(configResult.value.alias) && aliasName !== configResult.value.alias) {
    notifyUser(t('pages.manage.login.aliasExistMsg'), 'error')
    return
  }

  for (const key of allKeys) {
    if (key === 'customUrl' && configResult.value[key] !== undefined && configResult.value[key] !== '') {
      if (platformName !== 'upyun') {
        configResult.value[key] = formatEndpoint(configResult.value[key], false)
      }
    }

    if (
      supportedPicBedList.value[platformName].configOptions[key].default !== undefined &&
      configResult.value[key] === ''
    ) {
      resultMap[key] = supportedPicBedList.value[platformName].configOptions[key].default
    } else if (configResult.value[key] === undefined) {
      if (supportedPicBedList.value[platformName].configOptions[key].default !== undefined) {
        resultMap[key] = supportedPicBedList.value[platformName].configOptions[key].default
      } else {
        resultMap[key] = ''
      }
    } else {
      resultMap[key] = configResult.value[key]
    }
  }
  resultMap.picBedName = platformName
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
  await getExistingConfig(platformName)
  notifyUser(`${t('pages.manage.login.configSaveMsg')}${resultMap.alias}`, 'success')
  editMode.value = false
  emit('update:editMode', false)
}

const notifyUser = (msg: string, type: 'success' | 'error' | 'warning' = 'success') => {
  message[type](`${msg}`)
}

async function getExistingConfig(name: string) {
  const newList: string[] = []
  const result = await getConfig<any>('picBed')
  const newConfiguration: IStringKeyMap = {}
  if (!result || typeof result !== 'object' || Object.keys(result).length === 0) {
    newConfiguration[name] = { fail: '暂无配置' }
  } else {
    for (const key in result) {
      if (result[key].picBedName === name) {
        newConfiguration[key] = result[key]
        newList.push(result[key].alias)
      }
    }
  }
  existingConfiguration.value = newConfiguration
  currentAliasList.value = newList
  handleConfigImport(aliasName)
}

function handleConfigImport(alias: string) {
  if (alias === '') {
    supportedPicBedList.value[platformName].options.forEach((option: any) => {
      const defaultValue = supportedPicBedList.value[platformName].configOptions[option].default
      if (defaultValue !== undefined && option !== 'alias') {
        configResult.value[option] = defaultValue
      }
    })
    return
  }
  const selectedConfig = existingConfiguration.value[alias]
  if (!selectedConfig) return

  supportedPicBedList.value[selectedConfig.picBedName].options.forEach((option: any) => {
    if (selectedConfig[option] !== undefined) {
      configResult.value[option] = selectedConfig[option]
    }
  })
}

const validateAllFields = (picBedName: string): boolean => {
  const options = supportedPicBedList.value[picBedName]?.options || []
  let isValid = true

  for (const option of options) {
    validateField(picBedName, option)
    if (formErrors.value[`${picBedName}.${option}`]) {
      isValid = false
    }
  }

  return isValid
}

const handleConfigReset = () => {
  const keys = Object.keys(formErrors.value).filter(key => key.startsWith(platformName))
  keys.forEach(key => {
    delete formErrors.value[key]
  })

  const configKeys = Object.keys(configResult.value).filter(key => key.startsWith(platformName))
  configKeys.forEach(key => {
    delete configResult.value[key]
  })

  initializeDefaultValues()
}

const initializeDefaultValues = () => {
  if (!supportedPicBedList.value[platformName]) return

  const options = supportedPicBedList.value[platformName].options || []
  for (const option of options) {
    const configOption = supportedPicBedList.value[platformName].configOptions[option]

    if (configResult.value[option] === undefined || configResult.value[option] === '') {
      if (configOption.default !== undefined) {
        configResult.value[option] = configOption.default
      } else if (configOption.type === 'boolean') {
        configResult.value[option] = false
      } else if (configOption.type === 'number') {
        configResult.value[option] = 0
      } else {
        configResult.value[option] = ''
      }
    }
  }
}

const cancelEditMode = () => {
  editMode.value = false
}

onMounted(async () => {
  getExistingConfig(platformName)
  await manageStore.refreshConfig()
})
</script>
