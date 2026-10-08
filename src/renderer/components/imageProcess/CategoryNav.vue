<template>
  <nav
    class="flex min-w-0 flex-col gap-1 rounded-2xl border border-border-secondary p-2 shadow-md"
    :aria-label="t('pages.imageProcess.design.categories')"
  >
    <button
      v-for="category in categories"
      :key="category.id"
      type="button"
      :data-testid="'processing-category-' + category.id"
      :aria-pressed="view === 'edit' && activeCategory === category.id"
      :title="`${category.label} · ${category.status.text}`"
      :class="itemClass"
      @click="openCategory(category.id)"
    >
      <component :is="categoryIcons[category.id]" :size="18" :class="iconClass" aria-hidden="true" />
      <span class="flex min-w-0 flex-1 flex-col">
        <span class="truncate text-sm font-medium">{{ category.label }}</span>
        <span
          class="truncate text-xs"
          :class="
            category.status.active
              ? 'font-medium text-accent group-aria-pressed:text-white/90'
              : 'text-tertiary group-aria-pressed:text-white/70'
          "
          >{{ category.status.text }}</span
        >
      </span>
      <span
        v-if="category.customized"
        v-tooltip="t('pages.imageProcess.studio.customizedCount', { count: category.customized })"
        class="h-2 w-2 shrink-0 rounded-full bg-accent ring-2 ring-accent/20 group-aria-pressed:bg-white group-aria-pressed:ring-white/30"
        role="img"
        :aria-label="t('pages.imageProcess.studio.customizedCount', { count: category.customized })"
      />
    </button>
    <hr class="mx-2 my-1 border-border-secondary @max-[640px]:hidden" />
    <button
      type="button"
      data-testid="processing-review"
      :aria-pressed="view === 'review'"
      :class="itemClass"
      @click="view = 'review'"
    >
      <Eye :size="18" :class="iconClass" aria-hidden="true" />
      <span class="flex min-w-0 flex-1 flex-col">
        <span class="truncate text-sm font-medium">{{ t('pages.imageProcess.design.finalSettings') }}</span>
        <span class="truncate text-xs text-tertiary group-aria-pressed:text-white/70">
          {{ t('pages.imageProcess.studio.reviewCaption') }}
        </span>
      </span>
    </button>
  </nav>
</template>

<script setup lang="ts">
import { Eye } from '@lucide/vue'
import { computed } from 'vue'
import { useI18n } from 'vue-i18n'

import {
  categoryIcons,
  globalOrConfigCategories,
  processingCategories,
  type ProcessingCategory,
  useImageProcessContext,
} from '@/components/imageProcess/context'
import { vTooltip } from '@/directives/tooltip'
import {
  parseSkipProcessExtensions,
  type ProcessingGroup,
  type ResolvedProcessingOption,
} from '@/utils/imageProcessingConfig'
import { processingSummaries } from '@/utils/imageProcessingPresentation'

const { t } = useI18n()
const { scope, editingSettings, activeCategory, view, openCategory } = useImageProcessContext()

const itemClass =
  'group flex min-w-0 shrink-0 cursor-pointer items-center gap-3 rounded-lg px-3 py-2 text-left text-main transition-all duration-fast ease-apple hover:bg-accent/10 focus-visible:focus-ring aria-pressed:bg-accent aria-pressed:text-white aria-pressed:shadow-sm aria-pressed:hover:bg-accent @max-[640px]:max-w-[220px]'
const iconClass = 'shrink-0 text-secondary group-hover:text-main group-aria-pressed:text-white'

const generalKeys = ['quality', 'isRemoveExif', 'isConvert', 'convertFormat', 'formatConvertObj']
const categoryFields: Record<ProcessingCategory, [ProcessingGroup, string[] | null][]> = {
  general: [['compress', generalKeys]],
  transform: [['compress', null]],
  watermark: [['watermark', null]],
  rename: [
    ['rename', null],
    ['naming', null],
  ],
  skipProcess: [['skipProcess', null]],
}

function customizedCount(id: ProcessingCategory) {
  if (scope.value === 'global') return 0
  return categoryFields[id].reduce((count, [group, keys]) => {
    const options = editingSettings.value[group] as Record<string, ResolvedProcessingOption>
    return (
      count +
      Object.entries(options).filter(
        ([key, option]) =>
          option.source === scope.value &&
          (keys ? keys.includes(key) : !(id === 'transform' && generalKeys.includes(key))),
      ).length
    )
  }, 0)
}

const studio = 'pages.imageProcess.studio'
const summaries = computed(
  () => new Map(processingSummaries(editingSettings.value, t).map(summary => [summary.id, summary])),
)

function status(id: ProcessingCategory): { active: boolean; text: string } {
  const { compress: c, skipProcess } = editingSettings.value
  const off = t(`${studio}.off`)
  switch (id) {
    case 'general': {
      const parts = [`${c.quality.value}%`]
      if (c.isConvert.value) parts.push(String(c.convertFormat.value).toUpperCase())
      if (c.isRemoveExif.value) parts.push(t(`${studio}.nav.noExif`))
      return {
        active: Number(c.quality.value) < 100 || !!c.isConvert.value || !!c.isRemoveExif.value,
        text: parts.join(' · '),
      }
    }
    case 'transform': {
      const parts: string[] = []
      if (summaries.value.get('dimensions')!.active) {
        if (c.isReSizeByPercent.value) parts.push(`${c.reSizePercent.value}%`)
        else {
          const auto = t(`${studio}.nav.auto`)
          parts.push(`${Number(c.reSizeWidth.value) || auto} × ${Number(c.reSizeHeight.value) || auto}`)
        }
      }
      if (c.isRotate.value && Number(c.rotateDegree.value)) parts.push(`${c.rotateDegree.value}°`)
      if (c.isFlip.value || c.isFlop.value) parts.push(t(`${studio}.nav.flipped`))
      return { active: parts.length > 0, text: parts.join(' · ') || off }
    }
    case 'watermark':
    case 'rename': {
      const summary = summaries.value.get(id === 'rename' ? 'naming' : id)!
      return { active: summary.active, text: summary.value }
    }
    case 'skipProcess': {
      const count = parseSkipProcessExtensions(skipProcess.skipProcessExtList.value).length
      return { active: count > 0, text: t(`${studio}.nav.extensions`, count) }
    }
  }
}

const categories = computed(() =>
  processingCategories.map(id => {
    const unsupported = scope.value === 'provider' && globalOrConfigCategories.includes(id)
    return {
      id,
      label: t(`pages.imageProcess.design.categoryLabels.${id}`),
      customized: unsupported ? 0 : customizedCount(id),
      status: unsupported ? { active: false, text: t(`${studio}.nav.notPerService`) } : status(id),
    }
  }),
)
</script>
