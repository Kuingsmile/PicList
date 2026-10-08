<template>
  <SettingSection
    :icon="Scaling"
    :title="t('pages.imageProcess.studio.resizeTitle')"
    :description="t('pages.imageProcess.guide.categoryHints.transform')"
  >
    <ProcessingField field="compress.isReSize" p1 class="col-span-full" :inactive="dimensionsInactive">
      <CustomSwitch
        v-model="form.compress.isReSize"
        :title="t('pages.imageProcess.guide.resizeDimensions')"
        :description="t('pages.imageProcess.studio.resizeDimensionsHint')"
        no-border
        small
      />
    </ProcessingField>
    <template v-if="form.compress.isReSize">
      <ProcessingField field="compress.reSizeWidth">
        <CustomInput
          v-model.number="form.compress.reSizeWidth"
          type="number"
          min="0"
          class="pr-10"
          :title="t('pages.imageProcess.studio.width')"
          :placeholder="t('pages.imageProcess.studio.autoPlaceholder')"
        >
          <template #input-extra><span :class="unitClass" aria-hidden="true">px</span></template>
        </CustomInput>
      </ProcessingField>
      <ProcessingField field="compress.reSizeHeight">
        <CustomInput
          v-model.number="form.compress.reSizeHeight"
          type="number"
          min="0"
          class="pr-10"
          :title="t('pages.imageProcess.studio.height')"
          :placeholder="t('pages.imageProcess.studio.autoPlaceholder')"
        >
          <template #input-extra><span :class="unitClass" aria-hidden="true">px</span></template>
        </CustomInput>
      </ProcessingField>
      <ProcessingField v-if="heightOnly" field="compress.longEdgeAsHeight" p1 class="col-span-full">
        <CustomSwitch
          v-model="form.compress.longEdgeAsHeight"
          :title="t('pages.imageProcess.studio.longEdge')"
          :description="t('pages.imageProcess.studio.longEdgeHint')"
          no-border
          small
        />
      </ProcessingField>
    </template>
    <ProcessingField field="compress.isReSizeByPercent" p1 class="col-span-full">
      <CustomSwitch
        v-model="form.compress.isReSizeByPercent"
        :title="t('pages.imageProcess.guide.resizePercent')"
        :description="t('pages.imageProcess.guide.percentHint')"
        no-border
        small
      />
    </ProcessingField>
    <ProcessingField v-if="form.compress.isReSizeByPercent" field="compress.reSizePercent" class="col-span-full">
      <CustomRange
        v-model.number="form.compress.reSizePercent"
        :title="t('pages.imageProcess.studio.scale')"
        :min="1"
        :max="500"
        :step="1"
        :show-value="`${form.compress.reSizePercent}%`"
        min-label="1%"
        max-label="500%"
      />
      <div class="mt-1 flex flex-wrap gap-1.5" role="group" :aria-label="t('pages.imageProcess.studio.scalePresets')">
        <button
          v-for="percent in percentPresets"
          :key="percent"
          type="button"
          :aria-pressed="form.compress.reSizePercent === percent"
          :class="chipClass"
          @click="form.compress.reSizePercent = percent"
        >
          {{ percent }}%
        </button>
      </div>
    </ProcessingField>
    <ProcessingField v-if="resizing" field="compress.skipReSizeOfSmallImg" p1 class="col-span-full">
      <CustomSwitch
        v-model="form.compress.skipReSizeOfSmallImg"
        :title="t('pages.imageProcess.studio.noEnlarge')"
        :description="t('pages.imageProcess.studio.noEnlargeHint')"
        no-border
        small
      />
    </ProcessingField>
  </SettingSection>

  <SettingSection
    :icon="RotateCw"
    :title="t('pages.imageProcess.guide.orientation')"
    :description="t('pages.imageProcess.studio.orientationDescription')"
  >
    <ProcessingField field="compress.isFlop" p1>
      <CustomSwitch
        v-model="form.compress.isFlop"
        :title="t('pages.imageProcess.studio.mirror')"
        :description="t('pages.imageProcess.studio.mirrorHint')"
        no-border
        small
      />
    </ProcessingField>
    <ProcessingField field="compress.isFlip" p1>
      <CustomSwitch
        v-model="form.compress.isFlip"
        :title="t('pages.imageProcess.studio.flip')"
        :description="t('pages.imageProcess.studio.flipHint')"
        no-border
        small
      />
    </ProcessingField>
    <ProcessingField field="compress.isRotate" p1 :class="{ 'col-span-full': !form.compress.isRotate }">
      <CustomSwitch
        v-model="form.compress.isRotate"
        :title="t('pages.imageProcess.studio.rotate')"
        :description="t('pages.imageProcess.studio.rotateHint')"
        no-border
        small
      />
    </ProcessingField>
    <ProcessingField v-if="form.compress.isRotate" field="compress.rotateDegree">
      <CustomRange
        v-model.number="form.compress.rotateDegree"
        :title="t('pages.imageProcess.transform.rotationDegree')"
        :min="-360"
        :max="360"
        :step="1"
        :show-value="`${form.compress.rotateDegree}°`"
      />
      <div class="mt-1 flex flex-wrap gap-1.5" role="group" :aria-label="t('pages.imageProcess.studio.anglePresets')">
        <button
          v-for="degree in anglePresets"
          :key="degree"
          type="button"
          :aria-pressed="form.compress.rotateDegree === degree"
          :class="chipClass"
          @click="form.compress.rotateDegree = degree"
        >
          {{ degree }}°
        </button>
      </div>
    </ProcessingField>
  </SettingSection>
</template>

<script setup lang="ts">
import { RotateCw, Scaling } from '@lucide/vue'
import { computed } from 'vue'
import { useI18n } from 'vue-i18n'

import CustomInput from '@/components/common/CustomInput.vue'
import CustomRange from '@/components/common/CustomRange.vue'
import CustomSwitch from '@/components/common/CustomSwitch.vue'
import SettingSection from '@/components/common/SettingSection.vue'
import { useImageProcessContext } from '@/components/imageProcess/context'
import ProcessingField from '@/components/imageProcess/ProcessingField.vue'

const { t } = useI18n()
const { form } = useImageProcessContext()

const unitClass = 'pointer-events-none absolute top-1/2 right-3 -translate-y-1/2 text-xs font-semibold text-tertiary'
const chipClass =
  'cursor-pointer rounded-md border border-border px-2 py-0.5 text-xs font-semibold text-secondary tabular-nums transition-colors duration-fast hover:border-accent hover:text-accent focus-visible:focus-ring aria-pressed:border-accent aria-pressed:bg-accent aria-pressed:text-white'
const percentPresets = [25, 50, 75, 150, 200]
const anglePresets = [-90, 90, 180]

const width = computed(() => Number(form.compress.reSizeWidth) || 0)
const height = computed(() => Number(form.compress.reSizeHeight) || 0)
const heightOnly = computed(() => height.value > 0 && width.value === 0)
const resizing = computed(() => form.compress.isReSize || form.compress.isReSizeByPercent)
const dimensionsInactive = computed(() =>
  form.compress.isReSize && form.compress.isReSizeByPercent ? t('pages.imageProcess.preview.percentagePriority') : '',
)
</script>
