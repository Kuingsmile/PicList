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
          :title="t('pages.imageProcess.transform.resizeWidth')"
          placeholder="0"
        />
      </ProcessingField>
      <ProcessingField field="compress.reSizeHeight">
        <CustomInput
          v-model.number="form.compress.reSizeHeight"
          type="number"
          min="0"
          :title="t('pages.imageProcess.transform.resizeHeight')"
          placeholder="0"
        />
      </ProcessingField>
      <ProcessingField v-if="heightOnly" field="compress.longEdgeAsHeight" p1>
        <CustomSwitch
          v-model="form.compress.longEdgeAsHeight"
          :title="t('pages.imageProcess.transform.longEdgeAsHeight')"
          no-border
          small
        />
      </ProcessingField>
      <ProcessingField v-if="heightOnly || widthOnly" field="compress.skipReSizeOfSmallImg" p1>
        <CustomSwitch
          v-model="form.compress.skipReSizeOfSmallImg"
          :title="t('pages.imageProcess.transform.skipResizeOfSmallImgHeight')"
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
        :title="t('pages.imageProcess.transform.resizePercent')"
        :min="1"
        :max="500"
        :step="1"
        :show-value="`${form.compress.reSizePercent}%`"
      />
    </ProcessingField>
  </SettingSection>

  <SettingSection
    :icon="RotateCw"
    :title="t('pages.imageProcess.guide.orientation')"
    :description="t('pages.imageProcess.transform.rotationDescription')"
  >
    <ProcessingField field="compress.isFlip" p1>
      <CustomSwitch v-model="form.compress.isFlip" :title="t('pages.imageProcess.transform.isFlip')" no-border small />
    </ProcessingField>
    <ProcessingField field="compress.isFlop" p1>
      <CustomSwitch v-model="form.compress.isFlop" :title="t('pages.imageProcess.transform.isFlop')" no-border small />
    </ProcessingField>
    <ProcessingField field="compress.isRotate" p1 :class="{ 'col-span-full': !form.compress.isRotate }">
      <CustomSwitch
        v-model="form.compress.isRotate"
        :title="t('pages.imageProcess.transform.isRotate')"
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

const width = computed(() => Number(form.compress.reSizeWidth) || 0)
const height = computed(() => Number(form.compress.reSizeHeight) || 0)
const heightOnly = computed(() => height.value > 0 && width.value === 0)
const widthOnly = computed(() => width.value > 0 && height.value === 0)
const dimensionsInactive = computed(() =>
  form.compress.isReSize && form.compress.isReSizeByPercent ? t('pages.imageProcess.preview.percentagePriority') : '',
)
</script>
