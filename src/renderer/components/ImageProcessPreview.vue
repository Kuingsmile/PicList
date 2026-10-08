<template>
  <section
    v-if="compact"
    class="flex min-w-0 flex-col rounded-2xl border border-border-secondary p-4 shadow-md"
    :aria-label="t('pages.imageProcess.design.finalSettings')"
  >
    <header class="flex items-start gap-2.5">
      <div class="flex h-[30px] w-[30px] shrink-0 items-center justify-center rounded-lg bg-accent text-white">
        <Eye :size="17" aria-hidden="true" />
      </div>
      <div class="min-w-0">
        <h2 class="text-sm font-semibold text-main">{{ t('pages.imageProcess.design.finalSettings') }}</h2>
        <p class="mt-0.5 text-xs wrap-anywhere text-secondary">
          {{ providerName }}<span class="mx-1" aria-hidden="true">/</span
          ><strong class="font-medium text-main">{{ configName }}</strong>
        </p>
      </div>
    </header>
    <dl class="mt-3 flex flex-col" data-testid="processing-live-result">
      <div
        v-for="summary in summaries"
        :key="summary.id"
        class="grid min-w-0 grid-cols-[auto_minmax(0,1fr)] items-center gap-x-2 gap-y-1 border-t border-border py-2.5 first:border-t-0 first:pt-1"
      >
        <dt class="text-xs text-secondary">{{ summary.label }}</dt>
        <dd class="min-w-0 justify-self-end text-right">
          <SourceBadge :source="summary.source" :label="summaryLabel(summary)" />
        </dd>
        <dd
          class="col-span-2 text-sm font-semibold wrap-anywhere"
          :class="summary.active ? 'text-main' : 'text-secondary'"
        >
          {{ summary.value }}
        </dd>
      </div>
    </dl>
    <button
      type="button"
      class="mt-2 flex cursor-pointer items-center justify-center gap-1.5 rounded-md border border-border px-3 py-2 text-sm font-semibold text-main transition-all duration-fast ease-apple hover:border-accent hover:bg-accent/10 focus-visible:focus-ring"
      @click="$emit('review')"
    >
      {{ t('pages.imageProcess.studio.seeDetails') }} <ArrowRight :size="15" aria-hidden="true" />
    </button>
    <p class="mt-3 text-xs leading-relaxed text-tertiary">{{ t('pages.imageProcess.design.configPreviewNote') }}</p>
  </section>

  <section
    v-else
    class="@container flex min-w-0 flex-col gap-4"
    :aria-label="t('pages.imageProcess.design.finalSettings')"
  >
    <SettingSection :icon="Eye" only-one-row>
      <template #title>
        <div class="mb-1 flex flex-wrap items-center gap-x-3 gap-y-1">
          <h2 class="text-lg font-semibold text-main">{{ t('pages.imageProcess.design.finalSettings') }}</h2>
          <span class="flex items-center gap-1.5 text-xs text-secondary">
            <span class="h-1.5 w-1.5 rounded-full bg-accent" aria-hidden="true" />{{
              t('pages.imageProcess.design.live')
            }}
          </span>
        </div>
      </template>
      <template #description>
        <p class="mb-4 text-sm text-secondary">
          {{ t('pages.imageProcess.studio.reviewIntro', { provider: providerName, config: configName }) }}
        </p>
      </template>
      <div class="grid grid-cols-3 gap-3 @max-[720px]:grid-cols-2" data-testid="processing-live-result">
        <button
          v-for="summary in summaries"
          :key="summary.id"
          type="button"
          class="flex min-w-0 cursor-pointer flex-col items-start gap-1.5 rounded-lg border border-border bg-bg-secondary p-3 text-left shadow-sm transition-all duration-fast ease-apple hover:-translate-y-px hover:border-accent focus-visible:focus-ring"
          :aria-label="`${summary.label}: ${summary.value}. ${t('pages.imageProcess.studio.editCategory')}`"
          @click="$emit('edit', editLevel(summary.source), summary.category)"
        >
          <span class="text-xs text-secondary">{{ summary.label }}</span>
          <span class="text-sm font-semibold wrap-anywhere" :class="summary.active ? 'text-main' : 'text-secondary'">
            {{ summary.value }}
          </span>
          <span class="max-w-full"><SourceBadge :source="summary.source" :label="summaryLabel(summary)" /></span>
        </button>
      </div>
      <div
        class="mt-4 flex flex-wrap items-center gap-x-2 gap-y-1.5 rounded-lg bg-bg-tertiary px-3 py-2.5 text-xs text-secondary"
        data-testid="processing-precedence"
      >
        <span class="font-semibold text-main">{{ t('pages.imageProcess.studio.priority') }}</span>
        <template v-for="(level, index) in visibleLevels" :key="level">
          <ChevronRight v-if="index" :size="13" class="text-tertiary" aria-hidden="true" />
          <SourceBadge :source="level" :label="sourceLabel(level)" />
        </template>
        <span class="basis-full text-tertiary">{{ t('pages.imageProcess.studio.priorityHint') }}</span>
      </div>
      <p class="mt-3 text-xs leading-relaxed text-tertiary">{{ t(`${prefix}.outputNote`) }}</p>
    </SettingSection>

    <div class="flex flex-wrap items-center justify-between gap-3 px-1">
      <div>
        <h3 class="text-sm font-semibold text-main">{{ t('pages.imageProcess.design.settingsAndSources') }}</h3>
        <p class="mt-0.5 text-xs text-secondary">{{ t('pages.imageProcess.design.sourceHint') }}</p>
      </div>
      <CustomSwitch
        v-model="showInactive"
        :title="t('pages.imageProcess.design.showInactive')"
        small
        no-border
        no-hover
        tighter
      />
    </div>

    <section
      v-for="group in groups"
      :key="group.id"
      class="overflow-hidden rounded-lg border border-border bg-bg-secondary shadow-sm"
      :aria-labelledby="`${uid}-${group.id}`"
    >
      <header class="flex items-center gap-2.5 border-b border-border px-4 py-3">
        <component :is="categoryIcons[group.id]" :size="17" class="shrink-0 text-accent" aria-hidden="true" />
        <h4 :id="`${uid}-${group.id}`" class="min-w-0 flex-1 truncate text-sm font-semibold text-main">
          {{ group.title }}
        </h4>
        <span class="text-xs text-tertiary">
          {{ t('pages.imageProcess.design.settingCount', visibleRows(group).length) }}
        </span>
        <button
          type="button"
          class="flex cursor-pointer items-center gap-1 rounded-sm text-xs font-semibold text-accent hover:underline focus-visible:focus-ring"
          @click="$emit('edit', undefined, group.id)"
        >
          <PenLine :size="12" aria-hidden="true" />{{ t('pages.imageProcess.design.editSettings') }}
        </button>
      </header>
      <ul>
        <li
          v-for="row in visibleRows(group)"
          :key="row.key"
          :data-preview-field="row.field"
          class="border-t border-border first:border-t-0"
        >
          <div
            class="grid grid-cols-[minmax(0,1.1fr)_minmax(0,1fr)_auto] items-start gap-3 px-4 py-2.5 text-sm @max-[560px]:grid-cols-[minmax(0,1fr)_auto]"
          >
            <div class="min-w-0" :class="row.inactive ? 'text-tertiary' : 'text-main'">
              {{ row.label }}
              <span v-if="row.inactive" class="mt-0.5 block text-xs text-tertiary">{{ row.inactive }}</span>
            </div>
            <div
              class="min-w-0 font-semibold wrap-anywhere whitespace-pre-wrap @max-[560px]:order-3 @max-[560px]:col-span-2"
              :class="row.inactive ? 'text-tertiary' : 'text-main'"
            >
              {{ formatValue(row) }}
            </div>
            <button
              type="button"
              class="flex max-w-[200px] min-w-0 cursor-pointer items-center gap-1 justify-self-end rounded-md focus-visible:focus-ring"
              :aria-expanded="expanded === row.key"
              :aria-controls="`${uid}-chain-${row.key}`"
              :aria-label="t('pages.imageProcess.design.explainValue', { setting: row.label })"
              @click="expanded = expanded === row.key ? '' : row.key"
            >
              <SourceBadge :source="row.option.source" :label="sourceLabel(row.option.source)" />
              <ChevronDown
                :size="13"
                class="shrink-0 text-tertiary transition-transform duration-fast"
                :class="{ 'rotate-180': expanded === row.key }"
                aria-hidden="true"
              />
            </button>
          </div>
          <ol
            v-if="expanded === row.key"
            :id="`${uid}-chain-${row.key}`"
            class="mx-4 mb-3 grid gap-2 rounded-lg bg-bg-tertiary p-2"
            :class="visibleLevels.length === 3 ? 'grid-cols-3' : 'grid-cols-2'"
            :aria-label="t('pages.imageProcess.design.explainValue', { setting: row.label })"
          >
            <li
              v-for="level in visibleLevels"
              :key="level"
              class="flex min-w-0 flex-col gap-1 rounded-md border p-2.5 text-xs"
              :class="
                chainState(level, row, group.id) === 'used'
                  ? 'border-accent bg-accent/8'
                  : 'border-border bg-bg-secondary'
              "
            >
              <span class="flex items-center gap-1 font-medium text-secondary">
                <component :is="levelIcons[level]" :size="12" class="shrink-0" aria-hidden="true" />
                <span class="min-w-0 truncate">{{ sourceLabel(level) }}</span>
              </span>
              <strong
                class="font-semibold wrap-anywhere whitespace-pre-wrap"
                :class="chainState(level, row, group.id) === 'used' ? 'text-accent' : 'text-main'"
              >
                {{ chainValue(level, row, group.id) }}
              </strong>
              <span class="text-tertiary">{{
                t(`pages.imageProcess.studio.chain.${chainState(level, row, group.id)}`)
              }}</span>
              <button
                v-if="chainState(level, row, group.id) !== 'unavailable'"
                type="button"
                class="mt-auto flex cursor-pointer items-center gap-1 self-start rounded-sm pt-1 font-semibold text-accent hover:underline focus-visible:focus-ring"
                @click="$emit('edit', level, group.id, row.field)"
              >
                {{ t('pages.imageProcess.studio.chain.edit') }} <ArrowRight :size="12" aria-hidden="true" />
              </button>
            </li>
          </ol>
        </li>
        <li v-if="!visibleRows(group).length" class="px-4 py-3 text-xs text-tertiary">
          {{ t('pages.imageProcess.studio.allInactive') }}
        </li>
      </ul>
    </section>
  </section>
</template>

<script setup lang="ts">
import { ArrowRight, ChevronDown, ChevronRight, Eye, Globe, Layers, PenLine, UserRound } from '@lucide/vue'
import { computed, ref, useId } from 'vue'
import { useI18n } from 'vue-i18n'

import CustomSwitch from '@/components/common/CustomSwitch.vue'
import SettingSection from '@/components/common/SettingSection.vue'
import { categoryIcons, globalOrConfigCategories, type ProcessingCategory } from '@/components/imageProcess/context'
import SourceBadge from '@/components/imageProcess/SourceBadge.vue'
import type {
  ProcessingConfigSource,
  ProcessingGroup,
  ProcessingScope,
  ProcessingUploader,
  ResolvedImageProcessingConfig,
  ResolvedProcessingOption,
} from '@/utils/imageProcessingConfig'
import {
  formatProcessingSource,
  formatProcessingValue,
  processingSummaries,
  type ProcessingSummary,
} from '@/utils/imageProcessingPresentation'

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
// An edit without a scope keeps the level the editor is already on.
defineEmits<{ review: []; edit: [scope: ProcessingScope | undefined, category: ProcessingCategory, field?: string] }>()
const { t } = useI18n()
const uid = useId()
const prefix = 'pages.imageProcess.preview'
const showInactive = ref(false)
const expanded = ref('')
const levelIcons = { global: Globe, provider: Layers, config: UserRound }
const providerName = computed(() => uploader.providerName || uploader.type)
const configName = computed(() => uploader.configName || t(`${prefix}.unnamedConfig`))
const visibleLevels = computed<ProcessingScope[]>(() =>
  uploader.id ? ['global', 'provider', 'config'] : ['global', 'provider'],
)
const summaries = computed(() => processingSummaries(settings, t))

function sourceLabel(source: ProcessingConfigSource) {
  return formatProcessingSource(source, uploader, t)
}
function summaryLabel(summary: ProcessingSummary) {
  return summary.source ? sourceLabel(summary.source) : t('pages.imageProcess.design.combinedSources')
}
// Edits open at the level whose value is in use; built-in defaults are replaced for everyone.
function editLevel(source?: ProcessingConfigSource) {
  return source === 'default' ? 'global' : source
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

function layerOption(level: ProcessingScope, row: PreviewRow) {
  const [group, key] = row.field.split('.')
  return (layers[level][group as ProcessingGroup] as Record<string, ResolvedProcessingOption>)[key]
}
function chainState(level: ProcessingScope, row: PreviewRow, category: ProcessingCategory) {
  if (level === 'provider' && (globalOrConfigCategories.includes(category) || row.key === 'watermarkFontPath'))
    return 'unavailable'
  const winner = editLevel(row.option.source)
  if (level === winner) return 'used'
  const option = layerOption(level, row)
  const setHere = option.source === level || (level === 'global' && option.source === 'default')
  return setHere ? 'overridden' : 'notSet'
}
function chainValue(level: ProcessingScope, row: PreviewRow, category: ProcessingCategory) {
  const state = chainState(level, row, category)
  if (state === 'unavailable' || state === 'notSet') return '—'
  return formatValue({ ...row, option: layerOption(level, row) })
}

const groups = computed(() => {
  const { compress: c, watermark: w, skipProcess, rename, naming } = settings
  const disabled = t(`${prefix}.inactive`)
  const noResize = !c.isReSize.value && !c.isReSizeByPercent.value
  const dimensionsInactive = c.isReSizeByPercent.value
    ? t(`${prefix}.percentagePriority`)
    : !c.isReSize.value
      ? disabled
      : undefined
  const watermarkInactive = !w.isAddWatermark.value ? disabled : undefined
  const textInactive = watermarkInactive || (w.watermarkType.value !== 'text' ? t(`${prefix}.textOnly`) : undefined)
  const imageInactive = watermarkInactive || (w.watermarkType.value !== 'image' ? t(`${prefix}.imageOnly`) : undefined)
  const row = (
    group: ProcessingGroup,
    key: string,
    label: string,
    option: ResolvedProcessingOption,
    inactive?: string,
  ): PreviewRow => ({ key, field: `${group}.${key}`, label: t(label), option, inactive })
  const studio = 'pages.imageProcess.studio'
  const groups: { id: ProcessingCategory; title: string; rows: PreviewRow[] }[] = [
    {
      id: 'general',
      title: t('pages.imageProcess.design.categoryLabels.general'),
      rows: [
        row('compress', 'quality', `${studio}.summary.quality`, c.quality),
        row('compress', 'isRemoveExif', `${studio}.removeExif`, c.isRemoveExif),
        row('compress', 'isConvert', 'pages.imageProcess.guide.convert', c.isConvert),
        row(
          'compress',
          'convertFormat',
          `${studio}.convertTo`,
          c.convertFormat,
          !c.isConvert.value ? disabled : undefined,
        ),
        row(
          'compress',
          'formatConvertObj',
          `${studio}.formatRules`,
          c.formatConvertObj,
          !c.isConvert.value ? disabled : undefined,
        ),
      ],
    },
    {
      id: 'transform',
      title: t('pages.imageProcess.design.categoryLabels.transform'),
      rows: [
        row(
          'compress',
          'isReSize',
          'pages.imageProcess.guide.resizeDimensions',
          c.isReSize,
          c.isReSizeByPercent.value ? dimensionsInactive : undefined,
        ),
        row('compress', 'reSizeWidth', `${studio}.width`, c.reSizeWidth, dimensionsInactive),
        row('compress', 'reSizeHeight', `${studio}.height`, c.reSizeHeight, dimensionsInactive),
        row(
          'compress',
          'longEdgeAsHeight',
          `${studio}.longEdge`,
          c.longEdgeAsHeight,
          dimensionsInactive || (c.reSizeWidth.value !== 0 ? t(`${prefix}.heightOnly`) : undefined),
        ),
        row('compress', 'isReSizeByPercent', 'pages.imageProcess.guide.resizePercent', c.isReSizeByPercent),
        row(
          'compress',
          'reSizePercent',
          `${studio}.scale`,
          c.reSizePercent,
          !c.isReSizeByPercent.value ? disabled : undefined,
        ),
        row(
          'compress',
          'skipReSizeOfSmallImg',
          `${studio}.noEnlarge`,
          c.skipReSizeOfSmallImg,
          noResize ? disabled : undefined,
        ),
        row('compress', 'isFlop', `${studio}.mirror`, c.isFlop),
        row('compress', 'isFlip', `${studio}.flip`, c.isFlip),
        row('compress', 'isRotate', `${studio}.rotate`, c.isRotate),
        row(
          'compress',
          'rotateDegree',
          'pages.imageProcess.transform.rotationDegree',
          c.rotateDegree,
          !c.isRotate.value ? disabled : undefined,
        ),
      ],
    },
    {
      id: 'watermark',
      title: t('pages.imageProcess.design.categoryLabels.watermark'),
      rows: [
        row('watermark', 'isAddWatermark', 'pages.imageProcess.guide.watermarkToggle', w.isAddWatermark),
        row('watermark', 'watermarkType', `${studio}.watermarkType`, w.watermarkType, watermarkInactive),
        row('watermark', 'watermarkText', `${studio}.watermarkText`, w.watermarkText, textInactive),
        row('watermark', 'watermarkImagePath', `${studio}.watermarkImage`, w.watermarkImagePath, imageInactive),
        row('watermark', 'watermarkPosition', `${studio}.position`, w.watermarkPosition, watermarkInactive),
        row('watermark', 'watermarkColor', `${studio}.color`, w.watermarkColor, textInactive),
        row('watermark', 'watermarkFontPath', `${studio}.font`, w.watermarkFontPath, textInactive),
        row('watermark', 'watermarkImageOpacity', `${studio}.opacity`, w.watermarkImageOpacity, imageInactive),
        row('watermark', 'watermarkScaleRatio', `${studio}.size`, w.watermarkScaleRatio, watermarkInactive),
        row('watermark', 'watermarkDegree', `${studio}.angle`, w.watermarkDegree, watermarkInactive),
        row('watermark', 'isFullScreenWatermark', `${studio}.tile`, w.isFullScreenWatermark, watermarkInactive),
      ],
    },
    {
      id: 'rename',
      title: t('pages.imageProcess.design.categoryLabels.rename'),
      rows: [
        row('rename', 'enable', 'pages.imageProcess.guide.customName', rename.enable),
        row(
          'rename',
          'format',
          `${studio}.pattern`,
          rename.format,
          !rename.enable.value ? disabled : naming.autoRename.value ? t(`${studio}.patternReplaced`) : undefined,
        ),
        row('naming', 'autoRename', 'pages.imageProcess.guide.timestampName', naming.autoRename),
        row('naming', 'manualRename', 'pages.imageProcess.guide.askName', naming.manualRename),
      ],
    },
    {
      id: 'skipProcess',
      title: t('pages.imageProcess.design.categoryLabels.skipProcess'),
      rows: [row('skipProcess', 'skipProcessExtList', `${studio}.extensions`, skipProcess.skipProcessExtList)],
    },
  ]
  return groups
})

function visibleRows(group: { rows: PreviewRow[] }) {
  return group.rows.filter(row => showInactive.value || !row.inactive)
}
</script>
