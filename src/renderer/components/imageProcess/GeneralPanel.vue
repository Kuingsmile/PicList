<template>
  <SettingSection
    :icon="Gauge"
    :title="t('pages.imageProcess.guide.quality')"
    :description="t('pages.imageProcess.guide.categoryHints.general')"
    only-one-row
  >
    <ProcessingField field="compress.quality">
      <CustomRange
        :id="controlId('processing-quality')"
        v-model.number="form.compress.quality"
        :title="t('pages.imageProcess.guide.quality')"
        :min="1"
        :max="100"
        :step="1"
        :show-value="`${form.compress.quality}%`"
      />
      <div
        class="mt-2 flex gap-1 rounded-lg border border-border-secondary p-1"
        role="group"
        :aria-label="t('pages.imageProcess.guide.qualityPresets')"
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
    </ProcessingField>
  </SettingSection>

  <SettingSection
    :icon="FileImage"
    :title="t('pages.imageProcess.studio.formatTitle')"
    :description="t('pages.imageProcess.studio.formatDescription')"
  >
    <ProcessingField field="compress.isConvert" p1>
      <CustomSwitch
        v-model="form.compress.isConvert"
        :title="t('pages.imageProcess.guide.convert')"
        :description="t('pages.imageProcess.guide.convertHint')"
        small
        no-border
      />
    </ProcessingField>
    <ProcessingField v-if="form.compress.isConvert" field="compress.convertFormat">
      <SingleSelect
        v-model="form.compress.convertFormat"
        :title="t('pages.imageProcess.general.destinationFormat')"
        :fronticon="false"
        :tight="false"
        :select-list="formatOptions"
      />
    </ProcessingField>
    <ProcessingField field="compress.isRemoveExif" p1>
      <CustomSwitch
        v-model="form.compress.isRemoveExif"
        :title="t('pages.imageProcess.general.isRemoveExif')"
        small
        no-border
      />
    </ProcessingField>
    <ProcessingField v-if="form.compress.isConvert" field="compress.formatConvertObj" class="col-span-full">
      <label :for="controlId('processing-format-rules')" class="text-sm font-semibold text-secondary">
        {{ t('pages.imageProcess.guide.formatRules') }}
      </label>
      <p class="text-xs text-secondary">{{ t('pages.imageProcess.studio.formatRulesHint') }}</p>
      <textarea
        :id="controlId('processing-format-rules')"
        v-model="rulesDraft"
        :aria-invalid="rulesError"
        class="box-border min-h-[90px] w-full resize-y rounded-md border border-border bg-bg-tertiary p-3 font-mono text-sm text-main transition-all duration-200 ease-apple focus:border-accent focus-visible:focus-ring"
        :class="{ 'border-danger!': rulesError }"
        rows="3"
        spellcheck="false"
        placeholder='{"png": "webp", "jpg": "webp"}'
      />
      <p v-if="rulesError" role="alert" class="text-xs text-danger">
        {{ t('pages.imageProcess.editor.invalidFormatRules') }}
      </p>
    </ProcessingField>
  </SettingSection>
</template>

<script setup lang="ts">
import { FileImage, Gauge } from '@lucide/vue'
import { ref, watch } from 'vue'
import { useI18n } from 'vue-i18n'

import CustomButton from '@/components/common/CustomButton.vue'
import CustomRange from '@/components/common/CustomRange.vue'
import CustomSwitch from '@/components/common/CustomSwitch.vue'
import SettingSection from '@/components/common/SettingSection.vue'
import SingleSelect from '@/components/common/SingleSelect.vue'
import { useImageProcessContext } from '@/components/imageProcess/context'
import ProcessingField from '@/components/imageProcess/ProcessingField.vue'

const { t } = useI18n()
const { form, controlId, updateSetting } = useImageProcessContext()

const qualityPresets = [70, 85, 100]
const imageExtList = ['jpg', 'jpeg', 'png', 'webp', 'bmp', 'tiff', 'tif', 'svg', 'ico', 'avif', 'heif', 'heic']
const availableFormat = [
  'webp',
  'jpg',
  'png',
  'avif',
  'gif',
  'jpeg',
  'tiff',
  'tif',
  'heif',
  'svg',
  'input',
  'dz',
  'fits',
  'jp2',
  'jxl',
  'magick',
  'openslide',
  'pdf',
  'ppm',
  'raw',
  'v',
]
const formatOptions = availableFormat.map(format => ({ value: format, label: format.toUpperCase() }))

function isFormatRules(value: unknown): value is Record<string, string> {
  return (
    !!value &&
    typeof value === 'object' &&
    !Array.isArray(value) &&
    Object.entries(value).every(
      ([extension, format]) =>
        imageExtList.includes(extension) && typeof format === 'string' && availableFormat.includes(format),
    )
  )
}

const rulesDraft = ref('')
const rulesError = ref(false)
// Follow scope changes and "use shared value" without reformatting rules while they are typed.
watch(
  () => JSON.stringify(form.compress.formatConvertObj),
  json => {
    try {
      if (JSON.stringify(JSON.parse(rulesDraft.value)) === json) return
    } catch {
      // An unfinished draft is replaced by the value now in effect.
    }
    rulesDraft.value = JSON.stringify(form.compress.formatConvertObj, null, 2)
    rulesError.value = false
  },
  { immediate: true },
)
watch(rulesDraft, value => {
  let parsed: unknown
  try {
    parsed = JSON.parse(value)
  } catch {
    // Invalid JSON is reported below and keeps the last valid rules.
  }
  rulesError.value = !isFormatRules(parsed)
  if (!rulesError.value && JSON.stringify(parsed) !== JSON.stringify(form.compress.formatConvertObj))
    updateSetting('compress', 'formatConvertObj', parsed as Record<string, string>)
})
</script>
