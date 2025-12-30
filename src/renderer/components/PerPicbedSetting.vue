<template>
  <div class="per-picbed-setting">
    <div class="map-settings-toggle">
      <button type="button" class="btn btn-secondary btn-small" @click="showSettings = !showSettings">
        <Settings :size="14" />
        {{ t('pages.imageProcess.perPicBed.title') }}
      </button>
    </div>

    <div v-if="showSettings" class="map-settings-panel">
      <h4>{{ t('pages.imageProcess.perPicBed.description') }}</h4>
      <div class="picbed-settings-grid">
        <div v-for="picbed in availablePicbeds" :key="picbed.type" class="picbed-setting-item">
          <label class="picbed-name">{{ picbed.name }}</label>

          <!-- Checkbox input -->
          <label v-if="inputType === 'checkbox'" class="switch-label small">
            <input
              :checked="getMapValue(mapField, picbed.type, defaultValue)"
              type="checkbox"
              class="switch-input"
              @change="e => handleMapChange(picbed.type, (e.target as HTMLInputElement).checked)"
            />
            <span class="switch-slider" />
          </label>

          <!-- Range input -->
          <div v-else-if="inputType === 'range'" class="range-input-container">
            <input
              :value="getMapValue(mapField, picbed.type, defaultValue)"
              type="range"
              :min="rangeMin"
              :max="rangeMax"
              :step="rangeStep"
              class="form-range small"
              @input="e => handleMapChange(picbed.type, parseFloat((e.target as HTMLInputElement).value))"
            />
            <div class="range-value">{{ getMapValue(mapField, picbed.type, defaultValue) }}{{ rangeSuffix }}</div>
          </div>

          <!-- Number input -->
          <input
            v-else-if="inputType === 'number'"
            :value="getMapValue(mapField, picbed.type, defaultValue)"
            type="number"
            :min="numberMin"
            :max="numberMax"
            class="form-input small"
            @input="e => handleMapChange(picbed.type, parseFloat((e.target as HTMLInputElement).value))"
          />

          <!-- Text input -->
          <input
            v-else-if="inputType === 'text'"
            :value="getMapValue(mapField, picbed.type, defaultValue)"
            type="text"
            class="form-input small"
            :placeholder="textPlaceholder"
            @input="e => handleMapChange(picbed.type, (e.target as HTMLInputElement).value)"
          />

          <!-- Color input -->
          <div v-else-if="inputType === 'color'" class="color-input-group small">
            <input
              :value="getMapValue(mapField, picbed.type, defaultValue)"
              type="color"
              class="form-color small"
              @input="e => handleMapChange(picbed.type, (e.target as HTMLInputElement).value)"
            />
            <input
              :value="getMapValue(mapField, picbed.type, defaultValue)"
              type="text"
              class="form-input small"
              @input="e => handleMapChange(picbed.type, (e.target as HTMLInputElement).value)"
            />
          </div>

          <!-- Select input -->
          <select
            v-else-if="inputType === 'select'"
            :value="getMapValue(mapField, picbed.type, defaultValue)"
            class="form-input small"
            @change="e => handleMapChange(picbed.type, (e.target as HTMLSelectElement).value)"
          >
            <option v-for="option in selectOptions" :key="option.value" :value="option.value">
              {{ option.label }}
            </option>
          </select>

          <!-- Radio input -->
          <div v-else-if="inputType === 'radio'" class="radio-group small">
            <label v-for="option in radioOptions" :key="option.value" class="radio-option small">
              <input
                :checked="getMapValue(mapField, picbed.type, defaultValue) === option.value"
                :value="option.value"
                type="radio"
                class="radio-input"
                @change="handleMapChange(picbed.type, option.value)"
              />
              <span class="radio-indicator" />
              <span class="radio-label">{{ option.label }}</span>
            </label>
          </div>
        </div>
      </div>
    </div>
  </div>
</template>

<script lang="ts" setup>
import { Settings } from 'lucide-vue-next'
import { computed, ref } from 'vue'
import { useI18n } from 'vue-i18n'

import { picBedGlobal } from '@/utils/global'

const { t } = useI18n()

interface SelectOption {
  value: string | number
  label: string
}

interface RadioOption {
  value: string | number
  label: string
}

interface Props {
  mapField: Record<string, any> | undefined
  defaultValue: any
  fieldName: string
  formObject: Record<string, any>
  inputType: 'checkbox' | 'range' | 'number' | 'text' | 'color' | 'select' | 'radio'
  rangeMin?: number
  rangeMax?: number
  rangeStep?: number
  rangeSuffix?: string
  numberMin?: number
  numberMax?: number
  textPlaceholder?: string
  selectOptions?: SelectOption[]
  radioOptions?: RadioOption[]
}

withDefaults(defineProps<Props>(), {
  rangeMin: 0,
  rangeMax: 100,
  rangeStep: 1,
  rangeSuffix: '',
  numberMin: 0,
  numberMax: 1000,
  textPlaceholder: '',
  selectOptions: () => [],
  radioOptions: () => [],
})

const emit = defineEmits<{
  mapChange: [picbedType: string, value: any]
}>()

const showSettings = ref(false)

const availablePicbeds = computed(() => {
  return picBedGlobal.value.map(picbed => ({
    type: picbed.type,
    name: picbed.name,
  }))
})

function getMapValue(mapObj: Record<string, any> | undefined, picbedType: string, defaultValue: any) {
  if (!mapObj) return defaultValue
  return mapObj[picbedType] !== undefined ? mapObj[picbedType] : defaultValue
}

function handleMapChange(picbedType: string, value: any) {
  emit('mapChange', picbedType, value)
}
</script>

<style scoped>
/* Component root */
.per-picbed-setting {
  margin-top: 0.5rem;
}

/* Toggle section */
.map-settings-toggle {
  display: flex;
  justify-content: flex-end;
  margin-top: 0.5rem;
}

/* Button styling */
.btn {
  display: inline-flex;
  align-items: center;
  border: 1px solid var(--color-border);
  border-radius: 6px;
  padding: 0.75rem 1rem;
  font-size: 0.875rem;
  font-weight: 500;
  text-decoration: none;
  color: var(--color-text-primary);
  background: var(--color-background-primary);
  transition: all 0.2s ease;
  gap: 0.5rem;
  cursor: pointer;
  line-height: 1;
}

.btn:hover {
  border-color: var(--color-blue-common);
  background: var(--color-background-secondary);
}

.btn-secondary {
  border-color: var(--color-border);
  color: var(--color-text-secondary);
  background: var(--color-background-primary);
}

.btn-secondary:hover {
  border-color: var(--color-border-secondary);
  color: var(--color-text-primary);
  background: var(--color-background-secondary);
}

.btn-small {
  padding: 0.375rem 0.75rem;
  font-size: 0.875rem;
  gap: 0.375rem;
}

/* Settings panel */
.map-settings-panel {
  margin-top: 1rem;
  border: 1px solid var(--color-border);
  border-radius: 8px;
  padding: 1rem;
  background: var(--color-background-secondary);
  box-shadow: 0 2px 8px rgb(0 0 0 / 10%);
}

.map-settings-panel h4 {
  margin: 0 0 1rem;
  font-size: 1rem;
  font-weight: 600;
  color: var(--color-text-primary);
}

/* Grid layout */
.picbed-settings-grid {
  display: grid;
  grid-template-columns: 1fr;
  gap: 0.75rem;
}

.picbed-setting-item {
  display: flex;
  justify-content: space-between;
  align-items: center;
  border: 1px solid var(--color-border);
  border-radius: 6px;
  padding: 0.75rem;
  background: var(--color-background-primary);
  transition: all 0.2s ease;
}

.picbed-setting-item:hover {
  border-color: var(--color-blue-common);
  box-shadow: 0 2px 4px rgb(0 0 0 / 10%);
}

.picbed-name {
  margin: 0;
  min-width: 0;
  font-size: 0.875rem;
  font-weight: 500;
  color: var(--color-text-primary);
  flex: 1;
}

/* Switch component */
.switch-label {
  display: flex;
  align-items: center;
  cursor: pointer;
  user-select: none;
}

.switch-label.small {
  margin: 0;
  padding: 0;
}

.switch-input {
  display: none;
}

.switch-slider {
  position: relative;
  border-radius: 12px;
  width: 44px;
  height: 24px;
  background: var(--color-border-darker);
  transition: all 0.3s ease;
  flex-shrink: 0;
}

.switch-slider::before {
  position: absolute;
  top: 2px;
  left: 2px;
  border-radius: 50%;
  width: 20px;
  height: 20px;
  background: #ffffff;
  box-shadow: 0 2px 4px rgb(0 0 0 / 20%);
  transition: all 0.3s ease;
  content: '';
}

.switch-input:checked + .switch-slider {
  background: var(--color-blue-common);
}

.switch-input:checked + .switch-slider::before {
  transform: translateX(20px);
}

/* Form inputs */
.form-input,
.form-range,
.form-color {
  border: 1px solid var(--color-border);
  border-radius: 6px;
  color: var(--color-text-primary);
  background: var(--color-background-primary);
  outline: none;
  transition: all 0.2s ease;
}

.form-input:focus,
.form-color:focus {
  border-color: var(--color-blue-common);
  box-shadow: 0 0 0 2px rgb(64 158 255 / 20%);
}

.form-input.small {
  padding: 0.375rem 0.5rem;
  width: 100px;
  font-size: 0.875rem;
}

.form-range.small {
  border-radius: 3px;
  width: 100px;
  height: 6px;
  background: var(--color-border-darker);
  appearance: none;
}

.form-range.small::-webkit-slider-thumb {
  border: 2px solid #ffffff;
  border-radius: 50%;
  width: 18px;
  height: 18px;
  background: var(--color-blue-common);
  box-shadow: 0 2px 4px rgb(0 0 0 / 20%);
  appearance: none;
  cursor: pointer;
}

.form-range.small::-moz-range-thumb {
  border: 2px solid #ffffff;
  border-radius: 50%;
  width: 18px;
  height: 18px;
  background: var(--color-blue-common);
  box-shadow: 0 2px 4px rgb(0 0 0 / 20%);
  cursor: pointer;
}

.form-color.small {
  padding: 0;
  width: 40px;
  height: 32px;
  cursor: pointer;
}

/* Range input container */
.range-input-container {
  display: flex;
  align-items: center;
  gap: 0.5rem;
}

.range-value {
  border-radius: 4px;
  padding: 0.125rem 0.25rem;
  min-width: 50px;
  font-size: 0.875rem;
  font-weight: 500;
  text-align: center;
  color: var(--color-text-secondary);
  color: white;
  background: var(--color-blue-common);
}

/* Color input group */
.color-input-group.small {
  display: flex;
  align-items: center;
  gap: 0.5rem;
}

.color-input-group.small .form-input {
  width: 80px;
}

/* Radio group */
.radio-group.small {
  display: flex;
  gap: 0.5rem;
  flex-wrap: wrap;
}

.radio-option.small {
  display: flex;
  align-items: center;
  border: 1px solid var(--color-border);
  border-radius: 4px;
  padding: 0.25rem 0.5rem;
  font-size: 0.75rem;
  background: var(--color-background-primary);
  transition: all 0.2s ease;
  gap: 0.25rem;
  cursor: pointer;
}

.radio-option.small:hover {
  border-color: var(--color-blue-common);
  background: rgb(64 158 255 / 10%);
}

.radio-input {
  display: none;
}

.radio-indicator {
  position: relative;
  border: 2px solid var(--color-border);
  border-radius: 50%;
  width: 14px;
  height: 14px;
  background: var(--color-background-primary);
  transition: all 0.2s ease;
  flex-shrink: 0;
}

.radio-input:checked + .radio-indicator {
  border-color: var(--color-blue-common);
}

.radio-input:checked + .radio-indicator::after {
  position: absolute;
  top: 50%;
  left: 50%;
  border-radius: 50%;
  width: 6px;
  height: 6px;
  background: var(--color-blue-common);
  content: '';
  transform: translate(-50%, -50%);
}

.radio-label {
  font-size: inherit;
  font-weight: 500;
  color: var(--color-text-primary);
}

/* Select styling */
select.form-input {
  cursor: pointer;
  padding-right: 2rem;
  background-image: url("data:image/svg+xml,%3csvg xmlns='http://www.w3.org/2000/svg' fill='none' viewBox='0 0 20 20'%3e%3cpath stroke='%236b7280' stroke-linecap='round' stroke-linejoin='round' stroke-width='1.5' d='M6 8l4 4 4-4'/%3e%3c/svg%3e");
  background-position: right 0.5rem center;
  background-repeat: no-repeat;
  background-size: 1rem;
}

select.form-input:focus {
  background-image: url("data:image/svg+xml,%3csvg xmlns='http://www.w3.org/2000/svg' fill='none' viewBox='0 0 20 20'%3e%3cpath stroke='%23409eff' stroke-linecap='round' stroke-linejoin='round' stroke-width='1.5' d='M6 8l4 4 4-4'/%3e%3c/svg%3e");
}

/* Responsive design */
@media (width <= 768px) {
  .picbed-setting-item {
    flex-direction: column;
    align-items: flex-start;
    gap: 0.75rem;
  }

  .picbed-name {
    margin-bottom: 0.5rem;
  }

  .radio-group.small {
    flex-direction: column;
    width: 100%;
  }

  .range-input-container {
    flex-direction: column;
    align-items: flex-start;
    gap: 0.25rem;
  }

  .color-input-group.small {
    flex-direction: column;
    align-items: flex-start;
  }
}

/* Dark mode styles */
:root.dark .map-settings-panel,
:root.auto.dark .map-settings-panel {
  border-color: var(--color-border);
  background: var(--color-background-tertiary);
  box-shadow: 0 2px 8px rgb(0 0 0 / 30%);
}

:root.dark .picbed-setting-item,
:root.auto.dark .picbed-setting-item {
  border-color: var(--color-border);
  background: var(--color-surface);
}

:root.dark .picbed-setting-item:hover,
:root.auto.dark .picbed-setting-item:hover {
  border-color: var(--color-primary);
  box-shadow: 0 2px 4px rgb(0 0 0 / 30%);
}

:root.dark .form-input,
:root.dark .form-color,
:root.auto.dark .form-input,
:root.auto.dark .form-color {
  border-color: var(--color-border);
  color: var(--color-text-primary);
  background: var(--color-surface);
}

:root.dark .form-input:focus,
:root.dark .form-color:focus,
:root.auto.dark .form-input:focus,
:root.auto.dark .form-color:focus {
  border-color: var(--color-primary);
  box-shadow: 0 0 0 2px rgb(64 158 255 / 30%);
}

:root.dark .btn-secondary,
:root.auto.dark .btn-secondary {
  border-color: var(--color-border);
  color: var(--color-text-secondary);
  background: var(--color-surface);
}

:root.dark .btn-secondary:hover,
:root.auto.dark .btn-secondary:hover {
  border-color: var(--color-border-hover);
  color: var(--color-text-primary);
  background: var(--color-background-tertiary);
}

:root.dark .switch-slider::before,
:root.auto.dark .switch-slider::before {
  background: var(--color-surface);
}

:root.dark .radio-option.small,
:root.auto.dark .radio-option.small {
  border-color: var(--color-border);
  background: var(--color-surface);
}

:root.dark .radio-option.small:hover,
:root.auto.dark .radio-option.small:hover {
  border-color: var(--color-primary);
  background: rgb(64 158 255 / 20%);
}

:root.dark .radio-indicator,
:root.auto.dark .radio-indicator {
  border-color: var(--color-border);
  background: var(--color-surface);
}

:root.dark .radio-input:checked + .radio-indicator,
:root.auto.dark .radio-input:checked + .radio-indicator {
  border-color: var(--color-primary);
}

:root.dark .radio-input:checked + .radio-indicator::after,
:root.auto.dark .radio-input:checked + .radio-indicator::after {
  background: var(--color-primary);
}

:root.dark select.form-input,
:root.auto.dark select.form-input {
  background-image: url("data:image/svg+xml,%3csvg xmlns='http://www.w3.org/2000/svg' fill='none' viewBox='0 0 20 20'%3e%3cpath stroke='%239ca3af' stroke-linecap='round' stroke-linejoin='round' stroke-width='1.5' d='M6 8l4 4 4-4'/%3e%3c/svg%3e");
}

:root.dark select.form-input:focus,
:root.auto.dark select.form-input:focus {
  background-image: url("data:image/svg+xml,%3csvg xmlns='http://www.w3.org/2000/svg' fill='none' viewBox='0 0 20 20'%3e%3cpath stroke='%23409eff' stroke-linecap='round' stroke-linejoin='round' stroke-width='1.5' d='M6 8l4 4 4-4'/%3e%3c/svg%3e");
}
</style>
