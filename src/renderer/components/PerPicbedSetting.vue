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
  radioOptions: () => []
})

const emit = defineEmits<{
  mapChange: [picbedType: string, value: any]
}>()

const showSettings = ref(false)

const availablePicbeds = computed(() => {
  return picBedGlobal.value.map(picbed => ({
    type: picbed.type,
    name: picbed.name
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
  gap: 0.5rem;
  padding: 0.75rem 1rem;
  border: 1px solid var(--color-border);
  border-radius: 6px;
  background: var(--color-background-primary);
  color: var(--color-text-primary);
  font-size: 0.875rem;
  font-weight: 500;
  cursor: pointer;
  transition: all 0.2s ease;
  text-decoration: none;
  line-height: 1;
}

.btn:hover {
  background: var(--color-background-secondary);
  border-color: var(--color-blue-common);
}

.btn-secondary {
  background: var(--color-background-primary);
  border-color: var(--color-border);
  color: var(--color-text-secondary);
}

.btn-secondary:hover {
  background: var(--color-background-secondary);
  border-color: var(--color-border-secondary);
  color: var(--color-text-primary);
}

.btn-small {
  padding: 0.375rem 0.75rem;
  font-size: 0.875rem;
  gap: 0.375rem;
}

/* Settings panel */
.map-settings-panel {
  margin-top: 1rem;
  padding: 1rem;
  border: 1px solid var(--color-border);
  border-radius: 8px;
  background: var(--color-background-secondary);
  box-shadow: 0 2px 8px rgba(0, 0, 0, 0.1);
}

.map-settings-panel h4 {
  margin: 0 0 1rem 0;
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
  align-items: center;
  justify-content: space-between;
  padding: 0.75rem;
  border: 1px solid var(--color-border);
  border-radius: 6px;
  background: var(--color-background-primary);
  transition: all 0.2s ease;
}

.picbed-setting-item:hover {
  border-color: var(--color-blue-common);
  box-shadow: 0 2px 4px rgba(0, 0, 0, 0.1);
}

.picbed-name {
  font-size: 0.875rem;
  font-weight: 500;
  color: var(--color-text-primary);
  margin: 0;
  flex: 1;
  min-width: 0;
}

/* Switch component */
.switch-label {
  display: flex;
  align-items: center;
  cursor: pointer;
  user-select: none;
}

.switch-label.small {
  padding: 0;
  margin: 0;
}

.switch-input {
  display: none;
}

.switch-slider {
  position: relative;
  width: 44px;
  height: 24px;
  background: var(--color-border-darker);
  border-radius: 12px;
  transition: all 0.3s ease;
  flex-shrink: 0;
}

.switch-slider::before {
  content: '';
  position: absolute;
  top: 2px;
  left: 2px;
  width: 20px;
  height: 20px;
  background: #ffffff;
  border-radius: 50%;
  transition: all 0.3s ease;
  box-shadow: 0 2px 4px rgba(0, 0, 0, 0.2);
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
  background: var(--color-background-primary);
  color: var(--color-text-primary);
  transition: all 0.2s ease;
  outline: none;
}

.form-input:focus,
.form-color:focus {
  border-color: var(--color-blue-common);
  box-shadow: 0 0 0 2px rgba(64, 158, 255, 0.2);
}

.form-input.small {
  width: 100px;
  padding: 0.375rem 0.5rem;
  font-size: 0.875rem;
}

.form-range.small {
  width: 100px;
  height: 6px;
  -webkit-appearance: none;
  appearance: none;
  background: var(--color-border-darker);
  border-radius: 3px;
}

.form-range.small::-webkit-slider-thumb {
  -webkit-appearance: none;
  appearance: none;
  width: 18px;
  height: 18px;
  border-radius: 50%;
  background: var(--color-blue-common);
  cursor: pointer;
  box-shadow: 0 2px 4px rgba(0, 0, 0, 0.2);
  border: 2px solid #ffffff;
}

.form-range.small::-moz-range-thumb {
  width: 18px;
  height: 18px;
  border-radius: 50%;
  background: var(--color-blue-common);
  cursor: pointer;
  border: 2px solid #ffffff;
  box-shadow: 0 2px 4px rgba(0, 0, 0, 0.2);
}

.form-color.small {
  width: 40px;
  height: 32px;
  cursor: pointer;
  padding: 0;
}

/* Range input container */
.range-input-container {
  display: flex;
  align-items: center;
  gap: 0.5rem;
}

.range-value {
  min-width: 50px;
  font-size: 0.875rem;
  color: var(--color-text-secondary);
  text-align: center;
  padding: 0.125rem 0.25rem;
  background: var(--color-blue-common);
  color: white;
  border-radius: 4px;
  font-weight: 500;
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
  gap: 0.25rem;
  cursor: pointer;
  padding: 0.25rem 0.5rem;
  border: 1px solid var(--color-border);
  border-radius: 4px;
  transition: all 0.2s ease;
  background: var(--color-background-primary);
  font-size: 0.75rem;
}

.radio-option.small:hover {
  border-color: var(--color-blue-common);
  background: rgba(64, 158, 255, 0.1);
}

.radio-input {
  display: none;
}

.radio-indicator {
  width: 14px;
  height: 14px;
  border: 2px solid var(--color-border);
  border-radius: 50%;
  transition: all 0.2s ease;
  position: relative;
  background: var(--color-background-primary);
  flex-shrink: 0;
}

.radio-input:checked + .radio-indicator {
  border-color: var(--color-blue-common);
}

.radio-input:checked + .radio-indicator::after {
  content: '';
  position: absolute;
  top: 50%;
  left: 50%;
  transform: translate(-50%, -50%);
  width: 6px;
  height: 6px;
  background: var(--color-blue-common);
  border-radius: 50%;
}

.radio-label {
  font-size: inherit;
  color: var(--color-text-primary);
  font-weight: 500;
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
@media (max-width: 768px) {
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
  background: var(--color-background-tertiary);
  border-color: var(--color-border);
  box-shadow: 0 2px 8px rgba(0, 0, 0, 0.3);
}

:root.dark .picbed-setting-item,
:root.auto.dark .picbed-setting-item {
  background: var(--color-surface);
  border-color: var(--color-border);
}

:root.dark .picbed-setting-item:hover,
:root.auto.dark .picbed-setting-item:hover {
  border-color: var(--color-primary);
  box-shadow: 0 2px 4px rgba(0, 0, 0, 0.3);
}

:root.dark .form-input,
:root.dark .form-color,
:root.auto.dark .form-input,
:root.auto.dark .form-color {
  background: var(--color-surface);
  border-color: var(--color-border);
  color: var(--color-text-primary);
}

:root.dark .form-input:focus,
:root.dark .form-color:focus,
:root.auto.dark .form-input:focus,
:root.auto.dark .form-color:focus {
  border-color: var(--color-primary);
  box-shadow: 0 0 0 2px rgba(64, 158, 255, 0.3);
}

:root.dark .btn-secondary,
:root.auto.dark .btn-secondary {
  background: var(--color-surface);
  border-color: var(--color-border);
  color: var(--color-text-secondary);
}

:root.dark .btn-secondary:hover,
:root.auto.dark .btn-secondary:hover {
  background: var(--color-background-tertiary);
  border-color: var(--color-border-hover);
  color: var(--color-text-primary);
}

:root.dark .switch-slider::before,
:root.auto.dark .switch-slider::before {
  background: var(--color-surface);
}

:root.dark .radio-option.small,
:root.auto.dark .radio-option.small {
  background: var(--color-surface);
  border-color: var(--color-border);
}

:root.dark .radio-option.small:hover,
:root.auto.dark .radio-option.small:hover {
  border-color: var(--color-primary);
  background: rgba(64, 158, 255, 0.2);
}

:root.dark .radio-indicator,
:root.auto.dark .radio-indicator {
  background: var(--color-surface);
  border-color: var(--color-border);
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
