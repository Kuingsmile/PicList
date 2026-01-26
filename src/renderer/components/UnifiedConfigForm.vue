<!-- eslint-disable vue/no-v-html -->
<template>
  <div id="config-form" class="no-scrollbar flex h-full w-full flex-1 overflow-auto">
    <SettingSection class="h-full flex-1 border-none! shadow-none!" only-one-row>
      <SettingCard>
        <CustomInput
          v-model="ruleForm._configName"
          :title="t('pages.configForm.configName')"
          :placeholder="t('pages.configForm.configNamePlaceholder')"
          required
          :class="{ 'border-error!': validationErrors._configName }"
          @blur="validateForm"
          @input="clearFieldError('_configName')"
        />
        <template v-if="validationErrors._configName" #extra>
          <div class="mt-1 text-xs text-error">
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
          :title="item.alias || item.name"
          :placeholder="item.message || item.name"
          :class="{ 'border-danger': validationErrors[item.name] }"
          :required="item.required || false"
          :select-list="
            item.choices.map(choice => ({
              value: choice.value || choice,
              label: choice.name || choice.value || choice,
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
          :title="item.alias || item.name"
          :zero-placeholder="item.message || item.name"
          :icon="null"
          :required="item.required || false"
          :all-list="
            item.choices.map(choice => ({
              type: choice.value || choice,
              name: choice.name || choice.value || choice,
            }))
          "
          @change="clearFieldError(item.name)"
        />

        <!-- Validation Error -->
        <template v-if="validationErrors[item.name]" #extra>
          <div class="mt-1 text-xs text-error">
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
import { reactive, ref, watch } from 'vue'
import { useI18n } from 'vue-i18n'
import { useRoute } from 'vue-router'

import CustomInput from '@/components/common/CustomInput.vue'
import CustomSelect from '@/components/common/CustomSelect.vue'
import CustomSwitch from '@/components/common/CustomSwitch.vue'
import MultiSelect from '@/components/common/MultiSelect.vue'
import SettingCard from '@/components/common/SettingCard.vue'
import SettingSection from '@/components/common/SettingSection.vue'
import { getConfig } from '@/utils/dataSender'

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

// Watch for config changes
watch(
  () => configProp,
  newVal => {
    handleConfig(newVal)
  },
  {
    deep: true,
    immediate: true,
  },
)

function validateField(fieldName: string, value: any, _?: IPicGoPluginConfig): string | null {
  if (fieldName === '_configName') {
    if (!value || value.trim() === '') {
      return t('pages.configForm.configNameRequired')
    }
    return null
  }

  return null
}

function validateForm(): boolean {
  const errors: IStringKeyMap = {}

  const configNameError = validateField('_configName', ruleForm._configName)
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
  return new Promise(resolve => {
    const isValid = validateForm()
    if (isValid) {
      resolve(ruleForm)
    } else {
      resolve(false)
    }
  })
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
  const config = await getCurConfigFormData()
  const configId = mode === 'picbed' ? $route.params.configId : null

  Object.assign(ruleForm, config)

  if (val.length > 0) {
    configList.value = cloneDeep(val).map(item => {
      // For plugin mode, don't check configId
      if (mode === 'plugin' || !configId) {
        let defaultValue = item.default !== undefined ? item.default : item.type === 'checkbox' ? [] : null

        if (item.type === 'checkbox') {
          const defaults = item.choices?.filter((i: any) => i.checked).map((i: any) => i.value) || []
          defaultValue = union(defaultValue, defaults)
        }

        if (config && config[item.name] !== undefined) {
          defaultValue = config[item.name]
        }

        ruleForm[item.name] = defaultValue
        return item
      }

      let defaultValue = item.default !== undefined ? item.default : item.type === 'checkbox' ? [] : null

      if (item.type === 'checkbox') {
        const defaults = item.choices?.filter((i: any) => i.checked).map((i: any) => i.value) || []
        defaultValue = union(defaultValue, defaults)
      }

      if (config && config[item.name] !== undefined) {
        defaultValue = config[item.name]
      }

      ruleForm[item.name] = defaultValue
      return item
    })
  }
}

async function getCurConfigFormData() {
  if (mode === 'plugin') {
    return (await getConfig<IStringKeyMap>(`${id}`)) || {}
  } else {
    const configId = $route.params.configId
    const curTypeConfigList = (await getConfig<IStringKeyMap[]>(`uploader.${id}.configList`)) || []
    return curTypeConfigList.find(i => i._id === configId) || {}
  }
}

function updateRuleForm(key: string, value: any) {
  try {
    ruleForm[key] = value
    clearFieldError(key)
  } catch (e) {
    console.log(e)
  }
}

defineExpose({
  updateRuleForm,
  validate,
  getConfigType,
})
</script>
