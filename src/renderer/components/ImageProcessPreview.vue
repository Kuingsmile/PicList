<template>
  <section class="processing-result" :class="{ compact }" :aria-label="t('pages.imageProcess.design.finalSettings')">
    <header class="result-heading">
      <div class="result-icon"><Eye :size="18" aria-hidden="true" /></div>
      <div class="min-w-0">
        <h2>{{ t('pages.imageProcess.design.finalSettings') }}</h2>
        <p class="result-target">
          {{ uploader.providerName || uploader.type }} <span aria-hidden="true">/</span>
          <strong>{{ configName }}</strong>
        </p>
      </div>
      <span v-if="!compact" class="result-live"><span />{{ t('pages.imageProcess.design.live') }}</span>
    </header>
    <p v-if="!compact" class="result-intro">{{ t('pages.imageProcess.design.resultIntro') }}</p>

    <dl class="result-summaries" data-testid="processing-live-result">
      <div v-for="summary in summaries" :key="summary.label" class="result-summary">
        <dt>{{ summary.label }}</dt>
        <dd>
          {{ summary.value }}
          <p>{{ summary.source ? sourceLabel(summary.source) : t('pages.imageProcess.design.combinedSources') }}</p>
        </dd>
      </div>
    </dl>
    <CustomButton
      v-if="compact"
      type="secondary"
      class="mb-3 w-full"
      :text="t('pages.imageProcess.design.reviewAll')"
      @click="$emit('review')"
    >
      <template #extra><ArrowRight :size="15" aria-hidden="true" /></template>
    </CustomButton>
    <p class="result-note">{{ t('pages.imageProcess.design.configPreviewNote') }}</p>

    <template v-if="!compact">
      <div class="result-detail-toolbar">
        <h3>{{ t('pages.imageProcess.design.settingsAndSources') }}</h3>
        <CustomSwitch
          v-model="showInactive"
          :title="t('pages.imageProcess.design.showInactive')"
          small
          no-border
          no-hover
          tighter
        />
      </div>
      <p class="result-source-hint">{{ t('pages.imageProcess.design.sourceHint') }}</p>
      <details v-for="group in groups" :key="group.id" open class="result-group">
        <summary>
          <span>{{ group.title }}</span
          ><span class="result-group-count">{{
            t('pages.imageProcess.design.settingCount', {
              count: group.rows.filter(row => showInactive || !row.inactive).length,
            })
          }}</span
          ><ChevronDown :size="16" />
        </summary>
        <table class="result-table">
          <caption class="sr-only">
            {{
              group.title
            }}
          </caption>
          <thead>
            <tr>
              <th scope="col">{{ t(`${prefix}.setting`) }}</th>
              <th scope="col">{{ t(`${prefix}.value`) }}</th>
              <th scope="col">{{ t('pages.imageProcess.design.whyValue') }}</th>
            </tr>
          </thead>
          <tbody>
            <tr
              v-for="row in group.rows.filter(row => showInactive || !row.inactive)"
              :key="row.key"
              :data-preview-field="row.field"
              :class="{ inactive: row.inactive }"
            >
              <th scope="row">
                {{ row.label }}<span v-if="row.inactive" class="result-inactive">{{ row.inactive }}</span>
              </th>
              <td class="result-value">{{ formatValue(row) }}</td>
              <td>
                <details class="result-origin">
                  <summary :aria-label="t('pages.imageProcess.design.explainValue', { setting: row.label })">
                    <span :class="'origin-' + row.option.source">{{ sourceLabel(row.option.source) }}</span
                    ><ChevronDown :size="12" />
                  </summary>
                  <ol>
                    <li
                      v-for="level in visibleLevels"
                      :key="level"
                      :class="{
                        winner: row.option.source === level || (level === 'global' && row.option.source === 'default'),
                      }"
                    >
                      <span>{{ sourceLabel(level) }}</span>
                      <strong>{{ formatValue({ ...row, option: layerOption(level, row) }) }}</strong>
                      <small v-if="level !== 'global' && layerOption(level, row).source !== level">{{
                        t('pages.imageProcess.design.usesShared')
                      }}</small>
                      <small
                        v-else-if="
                          row.option.source === level || (level === 'global' && row.option.source === 'default')
                        "
                        >{{ t('pages.imageProcess.design.usedValue') }}</small
                      >
                      <small v-else>{{ t('pages.imageProcess.design.replacedBelow') }}</small>
                    </li>
                  </ol>
                  <button
                    type="button"
                    @click="
                      $emit('edit', row.option.source === 'default' ? 'global' : row.option.source, group.id, row.field)
                    "
                  >
                    {{ t('pages.imageProcess.design.editWinning') }} <ArrowRight :size="12" />
                  </button>
                </details>
              </td>
            </tr>
          </tbody>
        </table>
      </details>
      <details class="result-limitations">
        <summary>{{ t('pages.imageProcess.design.aboutPreview') }}</summary>
        <p>{{ t(`${prefix}.outputNote`) }}</p>
      </details>
    </template>
  </section>
</template>

<script setup lang="ts">
import { ArrowRight, ChevronDown, Eye } from '@lucide/vue'
import { computed, ref } from 'vue'
import { useI18n } from 'vue-i18n'

import CustomButton from '@/components/common/CustomButton.vue'
import CustomSwitch from '@/components/common/CustomSwitch.vue'
import type {
  ProcessingConfigSource,
  ProcessingGroup,
  ProcessingScope,
  ProcessingUploader,
  ResolvedImageProcessingConfig,
  ResolvedProcessingOption,
} from '@/utils/imageProcessingConfig'
import { formatProcessingValue } from '@/utils/imageProcessingPresentation'

const {
  settings,
  layers,
  uploader,
  compact = false,
} = defineProps<{
  settings: ResolvedImageProcessingConfig
  layers: Record<ProcessingScope, ResolvedImageProcessingConfig>
  uploader: ProcessingUploader
  compact?: boolean
}>()
defineEmits<{ review: []; edit: [scope: ProcessingScope, category: string, field?: string] }>()
const { t } = useI18n()
const prefix = 'pages.imageProcess.preview'
const showInactive = ref(false)
const configName = computed(() => uploader.configName || t(`${prefix}.unnamedConfig`))
const visibleLevels = computed<ProcessingScope[]>(() =>
  uploader.id ? ['global', 'provider', 'config'] : ['global', 'provider'],
)
function sourceLabel(source: ProcessingConfigSource) {
  return t('pages.imageProcess.design.sources.' + source, {
    provider: uploader.providerName || uploader.type,
    config: configName.value,
  })
}
function layerOption(level: ProcessingScope, row: PreviewRow) {
  const [group, key] = row.field.split('.')
  return (layers[level][group as ProcessingGroup] as Record<string, ResolvedProcessingOption>)[key]
}
function formatValue({ key, option }: PreviewRow) {
  return formatProcessingValue(key, option.value, t)
}

interface PreviewRow {
  key: string
  field: string
  label: string
  option: ResolvedProcessingOption
  inactive?: string
}

const groups = computed(() => {
  const { compress: c, watermark: w, skipProcess, rename, naming } = settings
  const disabled = t(`${prefix}.inactive`)
  const dimensionsInactive = c.isReSizeByPercent.value
    ? t(`${prefix}.percentagePriority`)
    : !c.isReSize.value
      ? disabled
      : undefined
  const watermarkInactive = !w.isAddWatermark.value ? disabled : undefined
  const textInactive = watermarkInactive || (w.watermarkType.value !== 'text' ? t(`${prefix}.textOnly`) : undefined)
  const imageInactive = watermarkInactive || (w.watermarkType.value !== 'image' ? t(`${prefix}.imageOnly`) : undefined)
  const row = (key: string, label: string, option: ResolvedProcessingOption, inactive?: string): PreviewRow => ({
    key,
    field: `${Object.entries(settings).find(([, values]) => key in values)?.[0]}.${key}`,
    label: t(`pages.imageProcess.${label}`),
    option,
    inactive,
  })
  return [
    {
      id: 'general',
      title: t('pages.imageProcess.generalSettings'),
      rows: [
        row('quality', 'general.quality', c.quality),
        row('isRemoveExif', 'general.isRemoveExif', c.isRemoveExif),
        row('isConvert', 'general.isConvert', c.isConvert),
        row('convertFormat', 'general.destinationFormat', c.convertFormat, !c.isConvert.value ? disabled : undefined),
        row('formatConvertObj', 'preview.formatRules', c.formatConvertObj, !c.isConvert.value ? disabled : undefined),
      ],
    },
    {
      id: 'transform',
      title: t('pages.imageProcess.transformSettings'),
      rows: [
        row('isFlip', 'transform.isFlip', c.isFlip),
        row('isFlop', 'transform.isFlop', c.isFlop),
        row('isRotate', 'transform.isRotate', c.isRotate),
        row('rotateDegree', 'transform.rotationDegree', c.rotateDegree, !c.isRotate.value ? disabled : undefined),
        row('isReSizeByPercent', 'transform.isResizeByPercent', c.isReSizeByPercent),
        row(
          'reSizePercent',
          'transform.resizePercent',
          c.reSizePercent,
          !c.isReSizeByPercent.value ? disabled : undefined,
        ),
        row('isReSize', 'transform.isResize', c.isReSize, c.isReSizeByPercent.value ? dimensionsInactive : undefined),
        row('reSizeWidth', 'transform.resizeWidth', c.reSizeWidth, dimensionsInactive),
        row('reSizeHeight', 'transform.resizeHeight', c.reSizeHeight, dimensionsInactive),
        row(
          'longEdgeAsHeight',
          'transform.longEdgeAsHeight',
          c.longEdgeAsHeight,
          dimensionsInactive || (c.reSizeWidth.value !== 0 ? t(`${prefix}.heightOnly`) : undefined),
        ),
        row(
          'skipReSizeOfSmallImg',
          'transform.skipResizeOfSmallImgHeight',
          c.skipReSizeOfSmallImg,
          dimensionsInactive ||
            (c.reSizeWidth.value !== 0 && c.reSizeHeight.value !== 0 ? t(`${prefix}.singleEdgeOnly`) : undefined),
        ),
      ],
    },
    {
      id: 'watermark',
      title: t('pages.imageProcess.watermarkSettings'),
      rows: [
        row('isAddWatermark', 'watermark.isAdd', w.isAddWatermark),
        row('watermarkType', 'watermark.type', w.watermarkType, watermarkInactive),
        row('isFullScreenWatermark', 'watermark.isFullScreen', w.isFullScreenWatermark, watermarkInactive),
        row('watermarkDegree', 'watermark.degree', w.watermarkDegree, watermarkInactive),
        row('watermarkScaleRatio', 'watermark.scaleRatio', w.watermarkScaleRatio, watermarkInactive),
        row('watermarkText', 'watermark.inputText', w.watermarkText, textInactive),
        row('watermarkFontPath', 'watermark.textFontPath', w.watermarkFontPath, textInactive),
        row('watermarkColor', 'watermark.color', w.watermarkColor, textInactive),
        row('watermarkImagePath', 'watermark.imagePath', w.watermarkImagePath, imageInactive),
        row('watermarkImageOpacity', 'watermark.imageOpacity', w.watermarkImageOpacity, imageInactive),
        row('watermarkPosition', 'watermark.position', w.watermarkPosition, watermarkInactive),
      ],
    },
    {
      id: 'skipProcess',
      title: t('pages.imageProcess.skipProcessSettings'),
      rows: [row('skipProcessExtList', 'general.skipProcessExtList', skipProcess.skipProcessExtList)],
    },
    {
      id: 'rename',
      title: t('pages.imageProcess.renameSettings'),
      rows: [
        row('autoRename', 'rename.renameTimestamp', naming.autoRename),
        row('manualRename', 'rename.manualRename', naming.manualRename),
        row('enable', 'preview.advancedRename', rename.enable),
        row('format', 'rename.renameCustomFormat', rename.format, !rename.enable.value ? disabled : undefined),
      ],
    },
  ]
})

function summarySource(...options: ResolvedProcessingOption[]): ProcessingConfigSource | undefined {
  return options.every(option => option.source === options[0].source) ? options[0].source : undefined
}

const summaries = computed(() => {
  const { compress: c, watermark: w } = settings
  let resize = t(`${prefix}.originalDimensions`)
  let resizeSource = summarySource(c.isReSize, c.isReSizeByPercent)
  if (c.isReSizeByPercent.value && Number(c.reSizePercent.value) > 0) {
    resize = t(`${prefix}.percentDimensions`, { value: c.reSizePercent.value })
    resizeSource = summarySource(c.isReSizeByPercent, c.reSizePercent)
  } else if (!c.isReSizeByPercent.value && c.isReSize.value) {
    const width = Number(c.reSizeWidth.value)
    const height = Number(c.reSizeHeight.value)
    resizeSource = summarySource(
      c.isReSize,
      ...(width > 0 ? [c.reSizeWidth] : []),
      ...(height > 0 ? [c.reSizeHeight] : []),
      ...(width === 0 && c.longEdgeAsHeight.value ? [c.longEdgeAsHeight] : []),
    )
    if (width > 0 && height > 0) resize = `${width} × ${height} px`
    else if (width > 0) resize = t(`${prefix}.widthDimensions`, { value: width })
    else if (height > 0)
      resize = t(`${prefix}.${c.longEdgeAsHeight.value ? 'longEdgeDimensions' : 'heightDimensions'}`, { value: height })
  }
  const hasFormatRules = Object.keys(c.formatConvertObj.value).length > 0
  return [
    {
      label: t('pages.imageProcess.design.summaryLabels.quality'),
      value: `${c.quality.value}%`,
      source: c.quality.source,
    },
    { label: t('pages.imageProcess.design.summaryLabels.dimensions'), value: resize, source: resizeSource },
    {
      label: t('pages.imageProcess.design.summaryLabels.format'),
      source: c.isConvert.value
        ? summarySource(c.isConvert, c.convertFormat, ...(hasFormatRules ? [c.formatConvertObj] : []))
        : c.isConvert.source,
      value: c.isConvert.value
        ? `${String(c.convertFormat.value).toUpperCase()}${hasFormatRules ? ` · ${t(`${prefix}.withFormatRules`)}` : ''}`
        : t(`${prefix}.originalFormat`),
    },
    {
      label: t('pages.imageProcess.watermarkSettings'),
      source: w.isAddWatermark.value ? summarySource(w.isAddWatermark, w.watermarkType) : w.isAddWatermark.source,
      value: w.isAddWatermark.value
        ? t(`pages.imageProcess.watermark.${w.watermarkType.value}`)
        : t(`${prefix}.disabled`),
    },
  ]
})
</script>

<style scoped src="./ImageProcessPreview.css"></style>
