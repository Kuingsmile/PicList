<!-- eslint-disable vue/no-v-html -->
<template>
  <div
    id="config-form"
    ref="formRef"
    class="no-scrollbar flex h-full w-full flex-1 overflow-auto"
    :aria-busy="isLoading"
  >
    <SettingSection class="h-full flex-1 border-none! shadow-none!" only-one-row>
      <SettingCard v-if="loadFailed">
        <div role="status" class="flex items-center justify-between gap-3 text-sm text-main">
          <span>{{ t('pages.configForm.loadFailed') }}</span>
          <CustomButton :text="t('pages.gallery.refresh')" :loading="isLoading" @click="handleConfig(configProp)" />
        </div>
      </SettingCard>
      <SettingCard v-else-if="isLoading">
        <p role="status" class="m-0 text-sm text-secondary">{{ t('pages.configForm.loading') }}</p>
      </SettingCard>
      <SettingCard v-if="mode === 'picbed'">
        <CustomInput
          v-model="ruleForm._configName"
          :title="t('pages.configForm.configName')"
          :placeholder="t('pages.configForm.configNamePlaceholder')"
          required
          :disabled="isLoading || loadFailed"
          :aria-invalid="!!validationErrors._configName"
          :aria-describedby="validationErrors._configName ? errorId('_configName') : undefined"
          :class="{ 'border-error!': validationErrors._configName }"
          @blur="validateForm"
          @input="clearFieldError('_configName')"
        />
        <template v-if="validationErrors._configName" #extra>
          <div :id="errorId('_configName')" class="mt-1 text-xs text-error">
            {{ validationErrors._configName }}
          </div>
        </template>
      </SettingCard>

      <!-- Dynamic Config Fields -->
      <SettingCard v-for="(item, index) in configList" :key="item.name + index" :p1="item.type === 'confirm'">
        <CustomInput
          v-if="item.type === 'input' || item.type === 'password'"
          v-model="ruleForm[item.name]"
          type="text"
          :disabled="isLoading || loadFailed"
          :aria-invalid="!!validationErrors[item.name]"
          :aria-describedby="validationErrors[item.name] ? errorId(item.name) : undefined"
          :placeholder="item.message || item.name"
          :class="{ 'border-error!': validationErrors[item.name] }"
          :title="item.alias || item.name"
          :required="item.required || false"
          :tips="item.tips"
          @blur="validateForm"
          @input="clearFieldError(item.name)"
        />
        <CustomSwitch
          v-if="item.type === 'confirm'"
          v-model="ruleForm[item.name]"
          :disabled="isLoading || loadFailed"
          :aria-invalid="!!validationErrors[item.name]"
          :aria-describedby="validationErrors[item.name] ? errorId(item.name) : undefined"
          :title="item.alias || item.name"
          :description="item.message || ''"
          no-border
          small
          :required="item.required || false"
          :tips="item.tips"
          @change="clearFieldError(item.name)"
        >
          <template #switch-text>
            <span class="text-[0.925rem] font-semibold text-secondary">
              {{ ruleForm[item.name] ? item.confirmText || 'Yes' : item.cancelText || 'No' }}
            </span>
          </template>
        </CustomSwitch>
        <CustomSelect
          v-if="item.type === 'list' && item.choices"
          v-model="ruleForm[item.name]"
          :disabled="isLoading || loadFailed"
          :aria-invalid="!!validationErrors[item.name]"
          :aria-describedby="validationErrors[item.name] ? errorId(item.name) : undefined"
          :title="item.alias || item.name"
          :placeholder="item.message || item.name"
          :class="{ 'border-danger': validationErrors[item.name] }"
          :required="item.required || false"
          :select-list="
            item.choices.map(choice => ({
              value: choice.value ?? choice,
              label: choice.name ?? choice.value ?? choice,
            }))
          "
          :icon="null"
          @change="clearFieldError(item.name)"
        >
          <template #pre-info>
            <option value="" disabled>
              {{ item.message || item.name }}
            </option>
          </template>
        </CustomSelect>
        <MultiSelect
          v-if="item.type === 'checkbox' && item.choices"
          v-model:choosed="ruleForm[item.name]"
          :disabled="isLoading || loadFailed"
          :aria-invalid="!!validationErrors[item.name]"
          :aria-describedby="validationErrors[item.name] ? errorId(item.name) : undefined"
          :title="item.alias || item.name"
          :zero-placeholder="item.message || item.name"
          :icon="null"
          :required="item.required || false"
          :all-list="
            item.choices.map(choice => ({
              type: choice.value ?? choice,
              name: choice.name ?? choice.value ?? choice,
            }))
          "
          @change="clearFieldError(item.name)"
        />

        <!-- Validation Error -->
        <template v-if="validationErrors[item.name]" #extra>
          <div :id="errorId(item.name)" class="mt-1 text-xs text-error">
            {{ validationErrors[item.name] }}
          </div>
        </template>
      </SettingCard>
      <slot name="extra-config" />
      <slot />
    </SettingSection>
  </div>
</template>

<script lang="ts" setup>
import { cloneDeep, union } from 'lodash-es'
import { nextTick, onBeforeUnmount, reactive, ref, useId, useTemplateRef, watch } from 'vue'
import { useI18n } from 'vue-i18n'
import { useRoute } from 'vue-router'

import CustomButton from '@/components/common/CustomButton.vue'
import CustomInput from '@/components/common/CustomInput.vue'
import CustomSelect from '@/components/common/CustomSelect.vue'
import CustomSwitch from '@/components/common/CustomSwitch.vue'
import MultiSelect from '@/components/common/MultiSelect.vue'
import SettingCard from '@/components/common/SettingCard.vue'
import SettingSection from '@/components/common/SettingSection.vue'
import { getConfig } from '@/services/configService'

interface IProps {
  config: IPicGoPluginConfig[]
  type: 'uploader' | 'transformer' | 'plugin'
  id: string
  mode?: 'picbed' | 'plugin'
}

const { config: configProp, type, id, mode = 'picbed' } = defineProps<IProps>()

const $route = useRoute()
const { t } = useI18n()

const configList = ref<IPicGoPluginConfig[]>([])
const ruleForm = reactive<IStringKeyMap>({})
const validationErrors = reactive<IStringKeyMap>({})
const isLoading = ref(true)
const loadFailed = ref(false)
const formRef = useTemplateRef('formRef')
const formId = useId()
const errorId = (field: string) => `${formId}-error-${encodeURIComponent(field)}`
let loadVersion = 0

// Watch for config changes
watch(
  [() => configProp, () => type, () => id, () => mode, () => $route.params.configId],
  () => {
    void handleConfig(configProp)
  },
  {
    deep: true,
    immediate: true,
  },
)

function validateField(fieldName: string, value: any, config?: IPicGoPluginConfig): string | null {
  if (fieldName === '_configName') {
    if (typeof value !== 'string' || value.trim() === '') {
      return t('pages.configForm.configNameRequired')
    }
    return null
  }

  if (
    config?.required &&
    (value === undefined ||
      value === null ||
      (typeof value === 'string' && value.trim() === '') ||
      (Array.isArray(value) && value.length === 0))
  ) {
    return t('pages.configForm.fieldRequired', { name: config.alias || config.name })
  }

  return null
}

function validateForm(): boolean {
  const errors: IStringKeyMap = {}

  const configNameError = mode === 'picbed' ? validateField('_configName', ruleForm._configName) : null
  if (configNameError) {
    errors._configName = configNameError
  }

  configList.value.forEach(config => {
    const error = validateField(config.name, ruleForm[config.name], config)
    if (error) {
      errors[config.name] = error
    }
  })
  for (const key in validationErrors) delete validationErrors[key]

  Object.assign(validationErrors, errors)

  return Object.keys(errors).length === 0
}

function clearFieldError(fieldName: string) {
  if (validationErrors[fieldName]) {
    delete validationErrors[fieldName]
  }
}

async function validate(): Promise<IStringKeyMap | false> {
  if (isLoading.value || loadFailed.value) return false
  if (validateForm()) return ruleForm
  await nextTick()
  formRef.value?.querySelector<HTMLElement>('[aria-invalid="true"]')?.focus()
  return false
}

function getConfigType() {
  switch (type) {
    case 'plugin': {
      return id
    }
    case 'uploader': {
      return `picBed.${id}`
    }
    case 'transformer': {
      return `transformer.${id}`
    }
    default:
      return 'unknown'
  }
}

async function handleConfig(val: IPicGoPluginConfig[]) {
  const version = ++loadVersion
  isLoading.value = true
  loadFailed.value = false
  try {
    const config = await getCurConfigFormData()
    if (version !== loadVersion) return
    for (const key of Object.keys(ruleForm)) delete ruleForm[key]
    for (const key of Object.keys(validationErrors)) delete validationErrors[key]
    Object.assign(ruleForm, config)
    configList.value = cloneDeep(val).map(item => {
      let defaultValue = item.default !== undefined ? item.default : item.type === 'checkbox' ? [] : null
      if (item.type === 'checkbox') {
        const defaults = item.choices?.filter((i: any) => i.checked).map((i: any) => i.value) || []
        defaultValue = union(Array.isArray(defaultValue) ? defaultValue : [], defaults)
      }
      if (config[item.name] !== undefined) {
        defaultValue = config[item.name]
      }
      ruleForm[item.name] = defaultValue
      return item
    })
  } catch {
    if (version === loadVersion) loadFailed.value = true
  } finally {
    if (version === loadVersion) isLoading.value = false
  }
}

async function getCurConfigFormData() {
  if (mode === 'plugin') {
    return (await getConfig<IStringKeyMap>(getConfigType())) || {}
  } else {
    const configId = $route.params.configId
    if (!configId) return {}
    const curTypeConfigList = await getConfig<IStringKeyMap[]>(`uploader.${id}.configList`)
    const selected = Array.isArray(curTypeConfigList) ? curTypeConfigList.find(i => i?._id === configId) : undefined
    if (!selected) throw new Error('The selected configuration is unavailable')
    return selected
  }
}

function updateRuleForm(key: string, value: any) {
  if (isLoading.value || loadFailed.value) return false
  ruleForm[key] = value
  clearFieldError(key)
  return true
}

onBeforeUnmount(() => loadVersion++)

defineExpose({
  updateRuleForm,
  validate,
  getConfigType,
  isLoading,
  loadFailed,
})
</script>
