<!-- eslint-disable vue/no-v-html -->
<template>
  <div id="config-form" :class="[{ white: colorMode === 'white' }]">
    <form class="config-form" @submit.prevent>
      <!-- Config Name Field -->
      <div class="form-group required">
        <label class="form-label">{{ t('pages.configForm.configName') }}</label>
        <div class="form-control">
          <input
            v-model="ruleForm._configName"
            type="text"
            class="form-input"
            :placeholder="t('pages.configForm.configNamePlaceholder')"
            :class="{ error: validationErrors._configName }"
            @input="clearFieldError('_configName')"
          />
          <div v-if="validationErrors._configName" class="error-message">
            {{ validationErrors._configName }}
          </div>
        </div>
      </div>

      <!-- Dynamic Config Fields -->
      <div
        v-for="(item, index) in configList"
        :key="item.name + index"
        class="form-group"
        :class="{ required: item.required }"
      >
        <div class="form-label-wrapper">
          <label class="form-label">{{ item.alias || item.name }}</label>
          <div v-if="showTooltips && item.tips" class="tooltip-wrapper">
            <div class="info-icon" @click="toggleTooltip(item.name + index)">
              <Info :size="20" />
            </div>
            <div
              v-show="visibleTooltips[item.name + index]"
              class="tooltip-content"
              v-html="transformMarkdownToHTML(item.tips)"
            />
          </div>
        </div>

        <div class="form-control">
          <!-- Text/Password Input -->
          <input
            v-if="item.type === 'input' || item.type === 'password'"
            v-model="ruleForm[item.name]"
            type="text"
            class="form-input"
            :placeholder="item.message || item.name"
            :class="{ error: validationErrors[item.name] }"
            @input="clearFieldError(item.name)"
          />

          <!-- Select (Single) -->
          <div v-else-if="item.type === 'list' && item.choices" class="select-wrapper">
            <select
              v-model="ruleForm[item.name]"
              class="form-select"
              :class="{ error: validationErrors[item.name] }"
              @change="clearFieldError(item.name)"
            >
              <option value="" disabled>
                {{ item.message || item.name }}
              </option>
              <option
                v-for="choice in item.choices"
                :key="choice.name || choice.value || choice"
                :value="choice.value || choice"
              >
                {{ choice.name || choice.value || choice }}
              </option>
            </select>
            <div class="select-arrow">
              <ChevronDownIcon :size="20" />
            </div>
          </div>

          <!-- Multi-Select (Checkbox style) -->
          <div v-else-if="item.type === 'checkbox' && item.choices" class="checkbox-group">
            <div v-for="choice in item.choices" :key="choice.value || choice" class="checkbox-item">
              <label class="checkbox-label">
                <input
                  type="checkbox"
                  :value="choice.value || choice"
                  :checked="Array.isArray(ruleForm[item.name]) && ruleForm[item.name].includes(choice.value || choice)"
                  class="checkbox-input"
                  @change="handleCheckboxChange(item.name, choice.value || choice, $event)"
                />
                <span class="checkbox-custom" />
                <span class="checkbox-text">{{ choice.name || choice.value || choice }}</span>
              </label>
            </div>
          </div>

          <!-- Switch/Toggle -->
          <label v-else-if="item.type === 'confirm'" class="switch-label">
            <input
              v-model="ruleForm[item.name]"
              type="checkbox"
              class="switch-input"
              @change="clearFieldError(item.name)"
            />
            <span class="switch-slider">
              <span class="switch-button" />
            </span>
            <span class="switch-text">
              {{ ruleForm[item.name] ? item.confirmText || 'Yes' : item.cancelText || 'No' }}
            </span>
          </label>

          <!-- Validation Error -->
          <div v-if="validationErrors[item.name]" class="error-message">
            {{ validationErrors[item.name] }}
          </div>
        </div>
      </div>
      <slot />
    </form>
  </div>
</template>

<script lang="ts" setup>
import { cloneDeep, union } from 'lodash-es'
import { ChevronDownIcon, Info } from 'lucide-vue-next'
import { marked } from 'marked'
import { reactive, ref, watch } from 'vue'
import { useI18n } from 'vue-i18n'
import { useRoute } from 'vue-router'

import { getConfig } from '@/utils/dataSender'

interface IProps {
  config: IPicGoPluginConfig[]
  type: 'uploader' | 'transformer' | 'plugin'
  id: string
  colorMode?: 'white' | 'dark'
  mode?: 'picbed' | 'plugin'
  showTooltips?: boolean
}

const {
  config: configProp,
  type,
  id,
  colorMode = undefined,
  mode = 'picbed',
  showTooltips = true,
} = defineProps<IProps>()

const $route = useRoute()
const { t } = useI18n()

const configList = ref<IPicGoPluginConfig[]>([])
const ruleForm = reactive<IStringKeyMap>({})
const validationErrors = reactive<IStringKeyMap>({})
const visibleTooltips = reactive<Record<string, boolean>>({})

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
      return 'Configuration name is required'
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

function toggleTooltip(key: string) {
  visibleTooltips[key] = !visibleTooltips[key]

  Object.keys(visibleTooltips).forEach(otherKey => {
    if (otherKey !== key) {
      visibleTooltips[otherKey] = false
    }
  })
}

function handleCheckboxChange(fieldName: string, value: any, event: Event) {
  const target = event.target as HTMLInputElement
  const currentValues = Array.isArray(ruleForm[fieldName]) ? [...ruleForm[fieldName]] : []

  if (target.checked) {
    if (!currentValues.includes(value)) {
      currentValues.push(value)
    }
  } else {
    const index = currentValues.indexOf(value)
    if (index > -1) {
      currentValues.splice(index, 1)
    }
  }

  ruleForm[fieldName] = currentValues
  clearFieldError(fieldName)
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

function transformMarkdownToHTML(markdown: string) {
  try {
    return marked.parse(markdown)
  } catch (_e) {
    return markdown
  }
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

<style scoped src="./css/UnifiedConfigForm.css"></style>
