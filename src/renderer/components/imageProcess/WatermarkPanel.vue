<template>
  <SettingSection
    :icon="Stamp"
    :title="t('pages.imageProcess.watermarkSettings')"
    :description="t('pages.imageProcess.guide.categoryHints.watermark')"
  >
    <ProcessingField field="watermark.isAddWatermark" p1 class="col-span-full">
      <CustomSwitch
        v-model="form.watermark.isAddWatermark"
        :title="t('pages.imageProcess.guide.watermarkToggle')"
        small
        no-border
      />
    </ProcessingField>
    <template v-if="form.watermark.isAddWatermark">
      <ProcessingField field="watermark.watermarkType" class="col-span-full">
        <span class="text-sm font-semibold text-secondary">{{ t('pages.imageProcess.watermark.type') }}</span>
        <div class="grid grid-cols-2 gap-3">
          <CustomRadioOption
            v-model="form.watermark.watermarkType"
            :name="controlId('watermark-type')"
            value="text"
            :title="t('pages.imageProcess.watermark.text')"
          />
          <CustomRadioOption
            v-model="form.watermark.watermarkType"
            :name="controlId('watermark-type')"
            value="image"
            :title="t('pages.imageProcess.watermark.image')"
          />
        </div>
      </ProcessingField>
      <ProcessingField v-if="isText" field="watermark.watermarkText">
        <CustomInput
          v-model="form.watermark.watermarkText"
          :title="t('pages.imageProcess.watermark.inputText')"
          :placeholder="t('pages.imageProcess.watermark.inputTextPlaceholder')"
        />
      </ProcessingField>
      <ProcessingField v-else field="watermark.watermarkImagePath">
        <CustomInput
          v-model="form.watermark.watermarkImagePath"
          :title="t('pages.imageProcess.watermark.imagePath')"
          :placeholder="t('pages.imageProcess.watermark.imagePathPlaceholder')"
        />
      </ProcessingField>
      <ProcessingField field="watermark.watermarkPosition" :class="{ 'row-span-2': isText }">
        <span :id="controlId('watermark-position')" class="text-sm font-semibold text-secondary">
          {{ t('pages.imageProcess.watermark.position') }}
        </span>
        <div
          class="grid grid-cols-3 gap-1 rounded-lg border border-border-secondary p-1"
          role="group"
          :aria-labelledby="controlId('watermark-position')"
        >
          <CustomButton
            v-for="[key, label] in positions"
            :key
            type="tab"
            class="px-1 py-2.5"
            :active="form.watermark.watermarkPosition === key"
            :text="label"
            @click="form.watermark.watermarkPosition = key"
          />
        </div>
      </ProcessingField>
      <ProcessingField v-if="isText" field="watermark.watermarkFontPath" :unsupported="scope === 'provider'">
        <CustomInput
          v-model="form.watermark.watermarkFontPath"
          :title="t('pages.imageProcess.watermark.textFontPath')"
          :placeholder="t('pages.imageProcess.watermark.textFontPathPlaceholder')"
        />
      </ProcessingField>
    </template>
  </SettingSection>

  <SettingSection
    v-if="form.watermark.isAddWatermark"
    :icon="Palette"
    :title="t('pages.imageProcess.studio.appearanceTitle')"
    :description="t('pages.imageProcess.studio.appearanceDescription')"
  >
    <ProcessingField v-if="isText" field="watermark.watermarkColor">
      <CustomInput
        v-model="form.watermark.watermarkColor"
        :title="t('pages.imageProcess.watermark.color')"
        placeholder="#CCCCCC73"
        class="pl-12"
      >
        <template #input-extra>
          <input
            :value="pickerColor"
            type="color"
            :aria-label="t('pages.imageProcess.watermark.color')"
            class="absolute top-1/2 left-2 h-8 w-8 -translate-y-1/2 cursor-pointer rounded-md border border-border bg-transparent p-0.5 focus-visible:focus-ring"
            @input="setPickerColor(($event.target as HTMLInputElement).value)"
          />
        </template>
      </CustomInput>
    </ProcessingField>
    <ProcessingField v-else field="watermark.watermarkImageOpacity">
      <CustomRange
        v-model.number="form.watermark.watermarkImageOpacity"
        :title="t('pages.imageProcess.watermark.imageOpacity')"
        :min="0"
        :max="255"
        :step="1"
        :show-value="`${form.watermark.watermarkImageOpacity || 0}`"
      />
    </ProcessingField>
    <ProcessingField field="watermark.watermarkScaleRatio">
      <CustomRange
        v-model.number="form.watermark.watermarkScaleRatio"
        :title="t('pages.imageProcess.watermark.scaleRatio')"
        :min="0"
        :max="1"
        :step="0.01"
        :show-value="`${Math.round((form.watermark.watermarkScaleRatio || 0) * 100)}%`"
      />
    </ProcessingField>
    <ProcessingField field="watermark.watermarkDegree">
      <CustomRange
        v-model.number="form.watermark.watermarkDegree"
        :title="t('pages.imageProcess.watermark.degree')"
        :min="-360"
        :max="360"
        :step="1"
        :show-value="`${form.watermark.watermarkDegree}°`"
      />
    </ProcessingField>
    <ProcessingField field="watermark.isFullScreenWatermark" p1>
      <CustomSwitch
        v-model="form.watermark.isFullScreenWatermark"
        :title="t('pages.imageProcess.watermark.isFullScreen')"
        small
        no-border
      />
    </ProcessingField>
  </SettingSection>
</template>

<script setup lang="ts">
import { Palette, Stamp } from '@lucide/vue'
import { computed } from 'vue'
import { useI18n } from 'vue-i18n'

import CustomButton from '@/components/common/CustomButton.vue'
import CustomInput from '@/components/common/CustomInput.vue'
import CustomRadioOption from '@/components/common/CustomRadioOption.vue'
import CustomRange from '@/components/common/CustomRange.vue'
import CustomSwitch from '@/components/common/CustomSwitch.vue'
import SettingSection from '@/components/common/SettingSection.vue'
import { useImageProcessContext } from '@/components/imageProcess/context'
import ProcessingField from '@/components/imageProcess/ProcessingField.vue'

const { t } = useI18n()
const { form, scope, controlId } = useImageProcessContext()

const isText = computed(() => form.watermark.watermarkType === 'text')
const positions = computed(() =>
  (
    [
      ['northwest', 'topLeft'],
      ['north', 'top'],
      ['northeast', 'topRight'],
      ['west', 'left'],
      ['centre', 'center'],
      ['east', 'right'],
      ['southwest', 'bottomLeft'],
      ['south', 'bottom'],
      ['southeast', 'bottomRight'],
    ] as const
  ).map(([key, label]) => [key, t(`pages.imageProcess.watermark.positionOptions.${label}`)] as const),
)

// The native picker has no alpha channel, so keep any #RRGGBBAA transparency while picking.
const pickerColor = computed(() => {
  const color = String(form.watermark.watermarkColor || '')
  return /^#[\da-f]{6}/i.test(color) ? color.slice(0, 7) : '#cccccc'
})
function setPickerColor(color: string) {
  const alpha = /^#[\da-f]{6}([\da-f]{2})$/i.exec(String(form.watermark.watermarkColor || ''))?.[1] ?? ''
  form.watermark.watermarkColor = `${color.toUpperCase()}${alpha}`
}
</script>
