<template>
  <SettingSection :icon="Shuffle" :title="t(prefix + 'presets')" :description="t(prefix + 'presetsHint')" only-one-row>
    <ProcessingField field="watermark.watermarkPresets">
      <div v-if="!watermark.randomWatermark" class="flex flex-wrap items-end gap-2">
        <CustomInput
          v-model="name"
          class="min-w-0"
          :title="t(prefix + 'presetName')"
          :placeholder="defaultName"
          @keydown.enter.prevent="addPreset"
        />
        <CustomButton type="secondary" :icon="Plus" :text="t(prefix + 'savePreset')" @click="addPreset" />
      </div>
      <ul v-if="watermark.watermarkPresets.length" class="divide-y divide-border">
        <li v-for="(preset, index) in watermark.watermarkPresets" :key="index" class="flex items-center gap-2 py-2">
          <label class="flex min-w-0 flex-1 cursor-pointer items-center gap-2 text-sm text-main">
            <input
              type="checkbox"
              class="accent-accent"
              :checked="preset.enabled"
              @change="togglePreset(index, ($event.target as HTMLInputElement).checked)"
            />
            <span class="min-w-0 wrap-anywhere">{{ preset.name || t(prefix + preset.watermarkType) }}</span>
            <span class="shrink-0 text-xs text-secondary">{{ t(prefix + preset.watermarkType) }}</span>
          </label>
          <CustomButton
            type="secondary"
            :icon="Trash2"
            :aria-label="t(prefix + 'removePreset', { name: preset.name })"
            @click="watermark.watermarkPresets = watermark.watermarkPresets.filter((_, i) => i !== index)"
          />
        </li>
      </ul>
      <p
        v-if="watermark.randomWatermark && !watermark.watermarkPresets.some(preset => preset.enabled)"
        class="text-sm text-secondary"
      >
        {{ t(prefix + 'noChecked') }}
      </p>
    </ProcessingField>
  </SettingSection>
</template>

<script setup lang="ts">
import { Plus, Shuffle, Trash2 } from '@lucide/vue'
import { computed, ref, watch } from 'vue'
import { useI18n } from 'vue-i18n'

import CustomButton from '@/components/common/CustomButton.vue'
import CustomInput from '@/components/common/CustomInput.vue'
import SettingSection from '@/components/common/SettingSection.vue'
import { useImageProcessContext } from '@/components/imageProcess/context'
import ProcessingField from '@/components/imageProcess/ProcessingField.vue'
import type { WatermarkPreset } from '@/utils/imageProcessingConfig'

const { t } = useI18n()
const { form, scope, targetProvider, selectedConfigId } = useImageProcessContext()
const { watermark } = form
const prefix = 'pages.imageProcess.watermark.'
const name = ref('')
watch([scope, targetProvider, selectedConfigId], () => {
  name.value = ''
})
const defaultName = computed(
  () =>
    (watermark.watermarkType === 'image'
      ? watermark.watermarkImagePath.split(/[\\/]/).pop()
      : watermark.watermarkText) || t(prefix + watermark.watermarkType),
)

function addPreset() {
  const preset: WatermarkPreset = {
    name: name.value.trim() || defaultName.value,
    enabled: true,
    watermarkType: watermark.watermarkType === 'image' ? 'image' : 'text',
    watermarkText: watermark.watermarkText,
    watermarkFontSize: watermark.watermarkFontSize,
    watermarkFontPath: watermark.watermarkFontPath,
    watermarkColor: watermark.watermarkColor,
    watermarkImagePath: watermark.watermarkImagePath,
    watermarkImageOpacity: watermark.watermarkImageOpacity,
    watermarkScaleRatio: watermark.watermarkScaleRatio,
    watermarkPosition: watermark.watermarkPosition as WatermarkPreset['watermarkPosition'],
    watermarkDegree: watermark.watermarkDegree,
    isFullScreenWatermark: watermark.isFullScreenWatermark,
  }
  watermark.watermarkPresets = [...watermark.watermarkPresets, preset]
  name.value = ''
}

function togglePreset(index: number, enabled: boolean) {
  watermark.watermarkPresets = watermark.watermarkPresets.map((preset, i) =>
    i === index ? { ...preset, enabled } : preset,
  )
}
</script>
