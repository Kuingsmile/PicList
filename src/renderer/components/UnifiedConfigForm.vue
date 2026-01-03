<!-- eslint-disable vue/no-v-html -->
<template>
  <div id="config-form" :class="[{ white: props.colorMode === 'white' }]">
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
import { reactive, ref, toRefs, watch } from 'vue'
import { useI18n } from 'vue-i18n'
import { useRoute } from 'vue-router'

import { getConfig } from '@/utils/dataSender'

interface IProps {
  config: any[]
  type: 'uploader' | 'transformer' | 'plugin'
  id: string
  colorMode?: 'white' | 'dark'
  mode?: 'picbed' | 'plugin'
  showTooltips?: boolean
}

const props = withDefaults(defineProps<IProps>(), {
  colorMode: undefined,
  mode: 'picbed',
  showTooltips: true,
})

const $route = useRoute()
const { t } = useI18n()

const configList = ref<IPicGoPluginConfig[]>([])
const ruleForm = reactive<IStringKeyMap>({})
const validationErrors = reactive<IStringKeyMap>({})
const visibleTooltips = reactive<Record<string, boolean>>({})

// Watch for config changes
watch(
  toRefs(props.config),
  (val: IPicGoPluginConfig[]) => {
    handleConfig(val)
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

  Object.keys(validationErrors).forEach(key => {
    delete validationErrors[key]
  })

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
  switch (props.type) {
    case 'plugin': {
      return props.id
    }
    case 'uploader': {
      return `picBed.${props.id}`
    }
    case 'transformer': {
      return `transformer.${props.id}`
    }
    default:
      return 'unknown'
  }
}

async function handleConfig(val: IPicGoPluginConfig[]) {
  const config = await getCurConfigFormData()
  const configId = props.mode === 'picbed' ? $route.params.configId : null

  Object.assign(ruleForm, config)

  if (val.length > 0) {
    configList.value = cloneDeep(val).map(item => {
      // For plugin mode, don't check configId
      if (props.mode === 'plugin' || !configId) {
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
  if (props.mode === 'plugin') {
    return (await getConfig<IStringKeyMap>(`${props.id}`)) || {}
  } else {
    const configId = $route.params.configId
    const curTypeConfigList = (await getConfig<IStringKeyMap[]>(`uploader.${props.id}.configList`)) || []
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

<style scoped>
#config-form {
  width: 100%;
}

.config-form {
  display: flex;
  flex-direction: column;
  gap: 1.5rem;
}

/* Form Groups */
.form-group {
  display: flex;
  flex-direction: column;
  gap: 0.5rem;
}

.form-group.required .form-label::after {
  content: ' *';
  color: var(--color-error, #ef4444);
}

.form-label-wrapper {
  display: flex;
  align-items: center;
  gap: 0.5rem;
}

.form-label {
  font-size: 0.875rem;
  font-weight: 500;
  color: var(--color-text-primary);
  line-height: 1.25;
}

.form-control {
  display: flex;
  flex-direction: column;
  gap: 0.5rem;
}

/* Tooltip Styles */
.tooltip-wrapper {
  position: relative;
}

.info-icon {
  display: flex;
  justify-content: center;
  align-items: center;
  border-radius: 50%;
  padding: 2px;
  color: var(--color-text-secondary);
  transition: var(--transition-fast);
  cursor: pointer;
}

.info-icon:hover {
  color: var(--color-accent);
  background: rgb(0 122 255 / 10%);
}

.tooltip-content {
  position: absolute;
  top: 100%;
  left: 0;
  z-index: 1000;
  border: 1px solid var(--color-border);
  border-radius: var(--radius-md);
  padding: 0.75rem;
  min-width: 200px;
  max-width: 300px;
  font-size: 0.75rem;
  color: var(--color-text-primary);
  background: var(--color-surface-elevated);
  box-shadow: var(--shadow-lg);
  line-height: 1.4;
}

/* Input Styles */
.form-input {
  border: 1px solid var(--color-border);
  border-radius: var(--radius-md);
  padding: 0.75rem 1rem;
  width: 100%;
  font-size: 0.875rem;
  font-family: inherit;
  color: var(--color-text-primary);
  background: var(--color-surface-elevated);
  transition: var(--transition-fast);
}

.form-input:focus {
  border-color: var(--color-accent);
  outline: none;
  box-shadow: 0 0 0 2px rgb(0 122 255 / 20%);
}

.form-input::placeholder {
  color: var(--color-text-secondary);
}

.form-input.error {
  border-color: var(--color-error, #ef4444);
}

.form-input.error:focus {
  box-shadow: 0 0 0 2px rgb(239 68 68 / 20%);
}

/* Select Styles */
.select-wrapper {
  position: relative;
}

.form-select {
  border: 1px solid var(--color-border);
  border-radius: var(--radius-md);
  padding: 0.75rem 2.5rem 0.75rem 1rem;
  width: 100%;
  font-size: 0.875rem;
  font-family: inherit;
  color: var(--color-text-primary);
  background: var(--color-surface-elevated);
  transition: var(--transition-fast);
  appearance: none;
  cursor: pointer;
}

.form-select:focus {
  border-color: var(--color-accent);
  outline: none;
  box-shadow: 0 0 0 2px rgb(0 122 255 / 20%);
}

.form-select.error {
  border-color: var(--color-error, #ef4444);
}

.form-select.error:focus {
  box-shadow: 0 0 0 2px rgb(239 68 68 / 20%);
}

.select-arrow {
  position: absolute;
  top: 50%;
  right: 1rem;
  color: var(--color-text-secondary);
  transition: var(--transition-fast);
  transform: translateY(-50%);
  pointer-events: none;
}

.select-wrapper:hover .select-arrow,
.form-select:focus + .select-arrow {
  color: var(--color-accent);
}

/* Checkbox Group Styles */
.checkbox-group {
  display: flex;
  flex-direction: column;
  gap: 0.75rem;
  padding: 0.5rem 0;
}

.checkbox-item {
  display: flex;
  align-items: center;
}

.checkbox-label {
  display: flex;
  align-items: center;
  gap: 0.75rem;
  cursor: pointer;
  font-size: 0.875rem;
  color: var(--color-text-primary);
  transition: var(--transition-fast);
}

.checkbox-label:hover {
  color: var(--color-accent);
}

.checkbox-input {
  position: absolute;
  opacity: 0;
  cursor: pointer;
}

.checkbox-custom {
  position: relative;
  border: 2px solid var(--color-border);
  border-radius: var(--radius-sm);
  width: 1.25rem;
  height: 1.25rem;
  background: var(--color-surface-elevated);
  transition: var(--transition-fast);
  flex-shrink: 0;
}

.checkbox-custom::after {
  position: absolute;
  top: 0;
  left: 3px;
  border: solid white;
  border-width: 0 2px 2px 0;
  width: 6px;
  height: 10px;
  opacity: 0;
  transition: var(--transition-fast);
  content: '';
  transform: rotate(45deg);
}

.checkbox-input:checked + .checkbox-custom {
  border-color: var(--color-accent);
  background: var(--color-accent);
}

.checkbox-input:checked + .checkbox-custom::after {
  opacity: 1;
}

.checkbox-input:focus + .checkbox-custom {
  box-shadow: 0 0 0 2px rgb(0 122 255 / 20%);
}

.checkbox-text {
  flex: 1;
}

/* Switch Styles */
.switch-label {
  display: flex;
  align-items: center;
  gap: 1rem;
  cursor: pointer;
  font-size: 0.875rem;
  color: var(--color-text-primary);
}

.switch-input {
  position: absolute;
  opacity: 0;
  cursor: pointer;
}

.switch-slider {
  position: relative;
  border-radius: 0.75rem;
  width: 3rem;
  height: 1.5rem;
  background: var(--color-border);
  transition: var(--transition-fast);
  flex-shrink: 0;
}

.switch-button {
  position: absolute;
  top: 2px;
  left: 2px;
  border-radius: 50%;
  width: 1.25rem;
  height: 1.25rem;
  background: white;
  box-shadow: var(--shadow-sm);
  transition: var(--transition-fast);
}

.switch-input:checked + .switch-slider {
  background: var(--color-accent);
}

.switch-input:checked + .switch-slider .switch-button {
  transform: translateX(1.5rem);
}

.switch-input:focus + .switch-slider {
  box-shadow: 0 0 0 2px rgb(0 122 255 / 20%);
}

.switch-text {
  font-weight: 500;
  color: var(--color-text-secondary);
}

.switch-input:checked ~ .switch-text {
  color: var(--color-accent);
}

/* Error Message */
.error-message {
  margin-top: 0.25rem;
  font-size: 0.75rem;
  color: var(--color-error, #ef4444);
}

/* White theme adjustments */
.white .form-input,
.white .form-select {
  border-color: #dddddd;
  background: white;
}

.white .form-input:focus,
.white .form-select:focus {
  border-color: var(--color-accent);
}

.white .checkbox-custom {
  border-color: #dddddd;
  background: white;
}

.white .switch-slider {
  background: #dddddd;
}

.white .tooltip-content {
  border-color: #dddddd;
  background: white;
}

/* Responsive Design */
@media (width <= 768px) {
  .config-form {
    gap: 1.25rem;
  }

  .form-input,
  .form-select {
    padding: 0.625rem 0.875rem;
  }

  .form-select {
    padding-right: 2.25rem;
  }

  .tooltip-content {
    min-width: 150px;
    max-width: 250px;
  }
}

/* Dark mode adjustments */
:root.dark .form-input,
:root.auto.dark .form-input,
:root.dark .form-select,
:root.auto.dark .form-select {
  border-color: var(--color-border);
  background: var(--color-surface-elevated);
}

:root.dark .checkbox-custom,
:root.auto.dark .checkbox-custom {
  border-color: var(--color-border);
  background: var(--color-surface-elevated);
}

:root.dark .switch-slider,
:root.auto.dark .switch-slider {
  background: var(--color-border);
}

:root.dark .tooltip-content,
:root.auto.dark .tooltip-content {
  border-color: var(--color-border);
  background: var(--color-surface-elevated);
}

/* Focus styles for accessibility */
.form-input:focus-visible,
.form-select:focus-visible,
.checkbox-input:focus-visible + .checkbox-custom,
.switch-input:focus-visible + .switch-slider,
.info-icon:focus-visible {
  outline: 2px solid var(--color-accent);
  outline-offset: 2px;
}
</style>
