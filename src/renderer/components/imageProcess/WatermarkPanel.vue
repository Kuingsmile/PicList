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
        :description="t('pages.imageProcess.studio.watermarkToggleHint')"
        small
        no-border
      />
    </ProcessingField>
    <template v-if="form.watermark.isAddWatermark">
      <ProcessingField field="watermark.watermarkType">
        <span :id="controlId('watermark-type')" class="text-sm font-semibold text-secondary">
          {{ t('pages.imageProcess.studio.watermarkType') }}
        </span>
        <div
          class="flex gap-1 rounded-lg border border-border-secondary p-1"
          role="group"
          :aria-labelledby="controlId('watermark-type')"
        >
          <CustomButton
            type="tab"
            class="px-2"
            :icon="Type"
            :text="t('pages.imageProcess.watermark.text')"
            :active="isText"
            @click="form.watermark.watermarkType = 'text'"
          />
          <CustomButton
            type="tab"
            class="px-2"
            :icon="ImageIcon"
            :text="t('pages.imageProcess.watermark.image')"
            :active="!isText"
            @click="form.watermark.watermarkType = 'image'"
          />
        </div>
      </ProcessingField>
      <ProcessingField v-if="isText" field="watermark.watermarkText">
        <CustomInput
          v-model="form.watermark.watermarkText"
          :title="t('pages.imageProcess.studio.watermarkText')"
          :placeholder="t('pages.imageProcess.studio.watermarkTextPlaceholder')"
        />
      </ProcessingField>
      <ProcessingField v-else field="watermark.watermarkImagePath">
        <FilePathInput
          v-model="form.watermark.watermarkImagePath"
          accept="image/*"
          :title="t('pages.imageProcess.studio.watermarkImage')"
          :placeholder="t('pages.imageProcess.studio.watermarkImagePlaceholder')"
        />
      </ProcessingField>
      <ProcessingField field="watermark.watermarkPosition" class="col-span-full">
        <span :id="controlId('watermark-position')" class="text-sm font-semibold text-secondary">
          {{ t('pages.imageProcess.studio.position') }}
        </span>
        <div class="flex flex-wrap items-center gap-x-5 gap-y-3">
          <div
            class="grid aspect-4/3 w-40 shrink-0 grid-cols-3 grid-rows-3 gap-1 rounded-lg border border-border-secondary bg-bg-tertiary p-1"
            role="group"
            :aria-labelledby="controlId('watermark-position')"
            data-testid="processing-watermark-position"
          >
            <CustomButton
              v-for="position in watermarkPositions"
              :key="position"
              v-tooltip="formatWatermarkPosition(position, t)"
              type="tab"
              class="min-w-0 p-0"
              :aria-label="formatWatermarkPosition(position, t)"
              :active="form.watermark.watermarkPosition === position"
              @click="form.watermark.watermarkPosition = position"
            >
              <span class="h-2 w-2 rounded-full bg-current opacity-50 group-data-[active=true]:opacity-100" />
            </CustomButton>
          </div>
          <div class="flex min-w-[min(100%,180px)] flex-1 flex-col gap-1">
            <strong class="text-sm font-semibold text-main">
              {{ formatWatermarkPosition(form.watermark.watermarkPosition, t) }}
            </strong>
            <p class="text-xs leading-relaxed text-secondary">
              {{
                t(
                  form.watermark.isFullScreenWatermark
                    ? 'pages.imageProcess.studio.positionTiledHint'
                    : 'pages.imageProcess.studio.positionHint',
                )
              }}
            </p>
          </div>
        </div>
      </ProcessingField>
    </template>
  </SettingSection>

  <SettingSection
    v-if="form.watermark.isAddWatermark"
    :icon="Palette"
    :title="t('pages.imageProcess.studio.appearanceTitle')"
    :description="t('pages.imageProcess.studio.appearanceDescription')"
  >
    <template v-if="isText">
      <ProcessingField field="watermark.watermarkColor">
        <CustomInput
          v-model="form.watermark.watermarkColor"
          :title="t('pages.imageProcess.studio.color')"
          :tips="t('pages.imageProcess.studio.colorHint')"
          placeholder="#CCCCCC73"
          class="pl-12 font-mono"
        >
          <template #input-extra>
            <input
              :value="pickerColor"
              type="color"
              :aria-label="t('pages.imageProcess.studio.color')"
              class="absolute top-1/2 left-2 h-8 w-8 -translate-y-1/2 cursor-pointer rounded-md border border-border bg-transparent p-0.5 focus-visible:focus-ring"
              @input="setPickerColor(($event.target as HTMLInputElement).value)"
            />
          </template>
        </CustomInput>
      </ProcessingField>
      <ProcessingField field="watermark.watermarkFontPath" :unsupported="scope === 'provider'">
        <FilePathInput
          v-model="form.watermark.watermarkFontPath"
          accept=".ttf,.otf,.woff"
          :title="t('pages.imageProcess.studio.font')"
          :tips="t('pages.imageProcess.studio.fontHint')"
          :placeholder="t('pages.imageProcess.studio.fontPlaceholder')"
        />
      </ProcessingField>
    </template>
    <ProcessingField
      v-else
      field="watermark.watermarkImageOpacity"
      class="col-span-full"
      :inactive="Number(form.watermark.watermarkImageOpacity) > 0 ? '' : t('pages.imageProcess.studio.opacityZero')"
    >
      <CustomRange
        v-model.number="form.watermark.watermarkImageOpacity"
        :title="t('pages.imageProcess.studio.opacity')"
        :min="0"
        :max="255"
        :step="1"
        :show-value="formatOpacity(form.watermark.watermarkImageOpacity)"
        min-label="0%"
        max-label="100%"
      />
    </ProcessingField>
    <ProcessingField field="watermark.watermarkScaleRatio">
      <CustomRange
        v-model.number="form.watermark.watermarkScaleRatio"
        :title="t('pages.imageProcess.studio.size')"
        :min="0.01"
        :max="1"
        :step="0.01"
        :show-value="`${Math.round((form.watermark.watermarkScaleRatio || 0) * 100)}%`"
        :min-label="t('pages.imageProcess.studio.sizeMin')"
        :max-label="t('pages.imageProcess.studio.sizeMax')"
      />
    </ProcessingField>
    <ProcessingField field="watermark.watermarkDegree">
      <CustomRange
        v-model.number="form.watermark.watermarkDegree"
        :title="t('pages.imageProcess.studio.angle')"
        :min="-360"
        :max="360"
        :step="1"
        :show-value="`${form.watermark.watermarkDegree}°`"
        min-label="-360°"
        max-label="360°"
      />
    </ProcessingField>
    <ProcessingField field="watermark.isFullScreenWatermark" p1 class="col-span-full">
      <CustomSwitch
        v-model="form.watermark.isFullScreenWatermark"
        :title="t('pages.imageProcess.studio.tile')"
        :description="t('pages.imageProcess.studio.tileHint')"
        small
        no-border
      />
    </ProcessingField>
  </SettingSection>
</template>

<script setup lang="ts">
import { Image as ImageIcon, Palette, Stamp, Type } from '@lucide/vue'
import { computed } from 'vue'
import { useI18n } from 'vue-i18n'

import CustomButton from '@/components/common/CustomButton.vue'
import CustomInput from '@/components/common/CustomInput.vue'
import CustomRange from '@/components/common/CustomRange.vue'
import CustomSwitch from '@/components/common/CustomSwitch.vue'
import SettingSection from '@/components/common/SettingSection.vue'
import { useImageProcessContext } from '@/components/imageProcess/context'
import FilePathInput from '@/components/imageProcess/FilePathInput.vue'
import ProcessingField from '@/components/imageProcess/ProcessingField.vue'
import { vTooltip } from '@/directives/tooltip'
import { formatOpacity, formatWatermarkPosition, watermarkPositions } from '@/utils/imageProcessingPresentation'

const { t } = useI18n()
const { form, scope, controlId } = useImageProcessContext()

const isText = computed(() => form.watermark.watermarkType === 'text')

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
