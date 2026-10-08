<template>
  <SettingSection
    :icon="Gauge"
    :title="t('pages.imageProcess.studio.qualityTitle')"
    :description="t('pages.imageProcess.studio.qualityDescription')"
  >
    <ProcessingField field="compress.quality" class="col-span-full">
      <span :id="controlId('quality-presets')" class="text-sm font-semibold text-secondary">
        {{ t('pages.imageProcess.guide.qualityPresets') }}
      </span>
      <div
        class="flex gap-1 rounded-lg border border-border-secondary p-1"
        role="group"
        :aria-labelledby="controlId('quality-presets')"
      >
        <CustomButton
          v-for="quality in qualityPresets"
          :key="quality"
          type="tab"
          class="px-2"
          :active="form.compress.quality === quality"
          @click="form.compress.quality = quality"
        >
          <span class="flex flex-col items-center leading-tight">
            <strong class="text-sm">{{ quality }}%</strong>
            <span class="text-xs font-normal opacity-80">{{ t('pages.imageProcess.guide.presets.' + quality) }}</span>
          </span>
        </CustomButton>
      </div>
      <CustomRange
        :id="controlId('processing-quality')"
        v-model.number="form.compress.quality"
        class="mt-3"
        :title="t('pages.imageProcess.studio.customQuality')"
        :min="1"
        :max="100"
        :step="1"
        :show-value="`${form.compress.quality}%`"
        :min-label="t('pages.imageProcess.guide.presets.70')"
        :max-label="t('pages.imageProcess.guide.presets.100')"
      />
    </ProcessingField>
    <ProcessingField field="compress.isRemoveExif" p1 class="col-span-full">
      <CustomSwitch
        v-model="form.compress.isRemoveExif"
        :title="t('pages.imageProcess.studio.removeExif')"
        :description="t('pages.imageProcess.studio.removeExifHint')"
        small
        no-border
      />
    </ProcessingField>
  </SettingSection>

  <SettingSection
    :icon="FileImage"
    :title="t('pages.imageProcess.studio.formatTitle')"
    :description="t('pages.imageProcess.studio.formatDescription')"
  >
    <ProcessingField field="compress.isConvert" p1 :class="{ 'col-span-full': !form.compress.isConvert }">
      <CustomSwitch
        v-model="form.compress.isConvert"
        :title="t('pages.imageProcess.guide.convert')"
        :description="t('pages.imageProcess.guide.convertHint')"
        small
        no-border
      />
    </ProcessingField>
    <template v-if="form.compress.isConvert">
      <ProcessingField field="compress.convertFormat">
        <SingleSelect
          v-model="form.compress.convertFormat"
          :title="t('pages.imageProcess.studio.convertTo')"
          :fronticon="false"
          :tight="false"
          :select-list="formatOptions"
        />
      </ProcessingField>
      <ProcessingField field="compress.formatConvertObj" class="col-span-full">
        <FormatRulesEditor />
      </ProcessingField>
    </template>
  </SettingSection>
</template>

<script setup lang="ts">
import { FileImage, Gauge } from '@lucide/vue'
import { useI18n } from 'vue-i18n'

import CustomButton from '@/components/common/CustomButton.vue'
import CustomRange from '@/components/common/CustomRange.vue'
import CustomSwitch from '@/components/common/CustomSwitch.vue'
import SettingSection from '@/components/common/SettingSection.vue'
import SingleSelect from '@/components/common/SingleSelect.vue'
import { useImageProcessContext } from '@/components/imageProcess/context'
import FormatRulesEditor from '@/components/imageProcess/FormatRulesEditor.vue'
import ProcessingField from '@/components/imageProcess/ProcessingField.vue'
import { outputFormats } from '@/utils/imageProcessingConfig'

const { t } = useI18n()
const { form, controlId } = useImageProcessContext()

const qualityPresets = [70, 85, 100]
const formatOptions = outputFormats.map(format => ({ value: format, label: format.toUpperCase() }))
</script>
