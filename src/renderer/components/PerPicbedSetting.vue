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

import { usePicBed } from '@/hooks/useGlobal'

const { t } = useI18n()
const { picBedG } = usePicBed()

interface SelectOption {
  value: string | number
  label: string
}

interface RadioOption {
  value: string | number
  label: string
}

const {
  mapField,
  defaultValue,
  globalValue,
  inputType,
  rangeMin = 0,
  rangeMax = 100,
  rangeStep = 1,
  rangeSuffix = '',
  numberMin = 0,
  numberMax = 1000,
  textPlaceholder = '',
  selectOptions = [],
  radioOptions = [],
} = defineProps<Props>()

interface Props {
  mapField: Record<string, any> | undefined
  defaultValue: any
  fieldName: string
  globalValue: any
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

const emit = defineEmits<{
  mapChange: [picbedType: string, value: any]
}>()

const showSettings = ref(false)

const availablePicbeds = computed(() => {
  return picBedG.value.map(picbed => ({
    type: picbed.type,
    name: picbed.name,
  }))
})

function getMapValue(mapObj: Record<string, any> | undefined, picbedType: string, defaultValue: any) {
  if (!mapObj) return defaultValue
  return mapObj[picbedType] !== undefined ? mapObj[picbedType] : globalValue !== undefined ? globalValue : defaultValue
}

function handleMapChange(picbedType: string, value: any) {
  emit('mapChange', picbedType, value)
}
</script>

<style scoped src="./css/PerPicbedSetting.css"></style>
