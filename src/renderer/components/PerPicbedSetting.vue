<template>
  <div class="mt-2">
    <div class="flex justify-end">
      <button
        type="button"
        class="inline-flex cursor-pointer items-center gap-2 rounded-sm border border-border bg-bg px-1 py-2 text-sm leading-none font-medium text-secondary no-underline transition-colors duration-200 ease-apple hover:border-accent hover:bg-surface-elevated hover:text-main"
        @click="showSettings = !showSettings"
      >
        <Settings :size="14" />
        {{ t('pages.imageProcess.perPicBed.title') }}
      </button>
    </div>

    <div v-if="showSettings" class="mt-4 rounded-md border border-border bg-bg-secondary p-4 shadow-sm">
      <h4 class="textsm mb-4 font-semibold text-main">
        {{
          t('pages.imageProcess.perPicBed.defaultValue', {
            value: globalValue !== undefined ? globalValue : defaultValue,
          })
        }}
      </h4>
      <div class="grid grid-cols-1 gap-3">
        <div
          v-for="picbed in availablePicbeds"
          :key="picbed.type"
          class="flex flex-wrap items-center justify-between rounded-sm border border-border bg-bg p-3 transition-all duration-fast ease-apple hover:border-2 hover:border-accent hover:bg-surface"
        >
          <label class="m-0 flex-1 text-sm font-medium text-main">{{ picbed.name }}</label>
          <!-- Checkbox input -->
          <div v-if="inputType === 'checkbox'" class="flex items-center rounded-xl">
            <label
              class="flex cursor-pointer items-center gap-4 rounded-lg border border-border transition-all duration-200 ease-apple"
            >
              <input
                :checked="currentValuesMap[picbed.type]"
                type="checkbox"
                class="peer hidden"
                @change="e => handleMapChange(picbed.type, (e.target as HTMLInputElement).checked)"
              />
              <span
                class="relative h-[21px] w-[44px] shrink-0 rounded-full bg-gray-400/80 shadow-sm transition-all duration-medium ease-standard peer-checked:bg-accent peer-checked:shadow-[inset_0_1px_3px_rgba(0,0,0,0.1),0_2px_8px_color-mix(in_srgb,var(--color-accent),transparent_30%)] before:absolute before:top-[2px] before:left-[2px] before:h-[17px] before:w-[17px] before:rounded-full before:bg-white before:shadow-sm before:transition-all before:duration-200 before:ease-apple before:content-[''] peer-checked:before:translate-x-[24px]"
              />
            </label>
          </div>
          <!-- Range input -->
          <div v-else-if="inputType === 'range'" class="flex flex-wrap items-center gap-2 rounded-sm shadow-sm">
            <input
              :value="currentValuesMap[picbed.type]"
              type="range"
              :min="rangeMin"
              :max="rangeMax"
              :step="rangeStep"
              class="my-3 h-[8px] w-[100px] appearance-none rounded-sm bg-linear-to-l from-accent transition-colors duration-150 ease-apple outline-none [&::--moz-range-thumb]:shadow-sm [&::-moz-range-thumb]:h-[22px] [&::-moz-range-thumb]:w-[22px] [&::-moz-range-thumb]:cursor-pointer [&::-moz-range-thumb]:rounded-full [&::-moz-range-thumb]:border [&::-moz-range-thumb]:border-border [&::-moz-range-thumb]:bg-white [&::-webkit-slider-thumb]:h-[22px] [&::-webkit-slider-thumb]:w-[22px] [&::-webkit-slider-thumb]:cursor-pointer [&::-webkit-slider-thumb]:appearance-none [&::-webkit-slider-thumb]:rounded-full [&::-webkit-slider-thumb]:border [&::-webkit-slider-thumb]:border-border [&::-webkit-slider-thumb]:bg-white [&::-webkit-slider-thumb]:shadow-sm [&::-webkit-slider-thumb]:transition-all [&::-webkit-slider-thumb]:duration-200 [&::-webkit-slider-thumb]:ease-apple [&::-webkit-slider-thumb:hover]:scale-105 [&::-webkit-slider-thumb:hover]:shadow-md"
              @input="e => handleMapChange(picbed.type, parseFloat((e.target as HTMLInputElement).value))"
            />
            <div
              class="inline-flex min-w-14 items-center justify-center rounded-md bg-accent px-1 py-1 text-sm font-semibold text-white shadow-sm"
            >
              {{ currentValuesMap[picbed.type] }}{{ rangeSuffix }}
            </div>
          </div>

          <!-- Number input -->
          <input
            v-else-if="inputType === 'number'"
            :value="currentValuesMap[picbed.type]"
            type="number"
            :min="numberMin"
            :max="numberMax"
            class="w-[100px] rounded-sm border border-border bg-bg p-1 text-sm text-main outline-none placeholder:text-xs focus:border-accent focus:bg-surface"
            @input="e => handleMapChange(picbed.type, parseFloat((e.target as HTMLInputElement).value))"
          />

          <!-- Text input -->
          <input
            v-else-if="inputType === 'text'"
            :value="currentValuesMap[picbed.type]"
            type="text"
            class="w-[100px] rounded-sm border border-border bg-bg p-1 text-sm text-main outline-none placeholder:text-xs focus:border-accent focus:bg-surface"
            :placeholder="textPlaceholder"
            @input="e => handleMapChange(picbed.type, (e.target as HTMLInputElement).value)"
          />

          <!-- Color input -->
          <div v-else-if="inputType === 'color'" class="flex items-center gap-2">
            <input
              :value="currentValuesMap[picbed.type]"
              type="color"
              class="rounded-sm border border-border bg-bg p-1 text-sm text-main outline-none focus:border-accent focus:bg-surface"
              @input="e => handleMapChange(picbed.type, (e.target as HTMLInputElement).value)"
            />
            <input
              :value="currentValuesMap[picbed.type]"
              type="text"
              class="w-[100px] rounded-sm border border-border bg-bg p-1 text-sm text-main outline-none placeholder:text-xs focus:border-accent focus:bg-surface"
              @input="e => handleMapChange(picbed.type, (e.target as HTMLInputElement).value)"
            />
          </div>

          <!-- Select input -->
          <select
            v-else-if="inputType === 'select'"
            :value="currentValuesMap[picbed.type]"
            class="w-[100px] rounded-sm border border-border bg-bg text-sm text-main outline-none placeholder:text-xs focus:border-accent focus:bg-surface"
            @change="e => handleMapChange(picbed.type, (e.target as HTMLSelectElement).value)"
          >
            <option v-for="option in selectOptions" :key="option.value" :value="option.value">
              {{ option.label }}
            </option>
          </select>

          <!-- Radio input -->
          <div v-else-if="inputType === 'radio'" class="flex flex-wrap gap-2">
            <label
              v-for="option in radioOptions"
              :key="option.value"
              class="flex cursor-pointer items-center gap-2.5 rounded-lg border border-border bg-bg px-4 py-3.5 transition-all duration-200 ease-apple hover:border-accent-hover hover:bg-accent/8"
            >
              <input
                :id="`radio-${picbed.type}-${option.value}`"
                :checked="currentValuesMap[picbed.type] === option.value"
                :value="option.value"
                type="radio"
                class="peer hidden"
                @change="handleMapChange(picbed.type, option.value, `radio-${picbed.type}-${option.value}`)"
              />
              <span
                class="relative h-[18px] w-[18px] rounded-full border border-border bg-bg transition-all duration-200 ease-apple peer-checked:border-accent peer-checked:after:absolute peer-checked:after:top-1/2 peer-checked:after:left-1/2 peer-checked:after:h-[10px] peer-checked:after:w-[10px] peer-checked:after:-translate-x-1/2 peer-checked:after:-translate-y-1/2 peer-checked:after:transform peer-checked:after:rounded-full peer-checked:after:bg-accent peer-checked:after:content-['']"
              />
              <span class="text-sm font-medium text-main">{{ option.label }}</span>
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
import { getRawData } from '@/utils/common'

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

interface Props {
  mapField: Record<string, any> | undefined
  defaultValue: any
  fieldName: string
  globalValue?: any
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

const {
  mapField,
  defaultValue,
  globalValue = undefined,
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

const currentValuesMap = computed(() => {
  if (!mapField) return {}

  const result: Record<string, any> = {}
  for (const picbed of availablePicbeds.value) {
    const type = picbed.type
    const val = mapField[type] !== undefined ? mapField[type] : globalValue !== undefined ? globalValue : defaultValue

    result[type] = typeof val === 'object' ? JSON.stringify(getRawData(val)) : val
  }
  return result
})

function handleMapChange(picbedType: string, value: any, id?: string) {
  if (id) {
    const element = document.getElementById(id) as HTMLInputElement | null
    if (element) {
      element.checked = true
    }
    for (const sibling of element?.parentElement?.parentElement?.children || []) {
      const input = sibling.querySelector('input') as HTMLInputElement | null
      if (input && input !== element) {
        input.checked = false
      }
    }
  }
  emit('mapChange', picbedType, value)
}
</script>
