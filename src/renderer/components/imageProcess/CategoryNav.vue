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
      class="group flex min-w-0 shrink-0 cursor-pointer items-center gap-2.5 rounded-md px-3 py-2.5 text-left text-sm font-medium text-secondary transition-all duration-fast ease-apple hover:bg-accent/10 hover:text-main focus-visible:focus-ring aria-pressed:bg-accent aria-pressed:text-white aria-pressed:hover:bg-accent"
      @click="select(category.id)"
    >
      <component :is="category.icon" :size="17" class="shrink-0" aria-hidden="true" />
      <span class="min-w-0 flex-1 truncate">{{ category.label }}</span>
      <span
        v-if="category.customized"
        v-tooltip="t('pages.imageProcess.studio.customizedCount', { count: category.customized })"
        class="h-2 w-2 shrink-0 rounded-full bg-accent group-aria-pressed:bg-white"
        role="img"
        :aria-label="t('pages.imageProcess.studio.customizedCount', { count: category.customized })"
      />
      <span
        class="shrink-0 rounded-full px-2 py-0.5 text-[11px] font-semibold tabular-nums"
        :class="
          category.status.active
            ? 'bg-accent/15 text-accent group-aria-pressed:bg-white/25 group-aria-pressed:text-white'
            : 'bg-bg-tertiary text-tertiary group-aria-pressed:bg-white/15 group-aria-pressed:text-white/80'
        "
        >{{ category.status.text }}</span
      >
    </button>
  </nav>
</template>

<script setup lang="ts">
import { FileText, Image, RotateCw, Settings, Sliders } from '@lucide/vue'
import { computed } from 'vue'
import { useI18n } from 'vue-i18n'

import {
  globalOrConfigCategories,
  type ProcessingCategory,
  useImageProcessContext,
} from '@/components/imageProcess/context'
import { vTooltip } from '@/directives/tooltip'
import type { ProcessingGroup, ResolvedProcessingOption } from '@/utils/imageProcessingConfig'

const { t } = useI18n()
const { scope, editingSettings, activeCategory, view } = useImageProcessContext()

const generalKeys = ['quality', 'isRemoveExif', 'isConvert', 'convertFormat', 'formatConvertObj']
const categoryFields: Record<ProcessingCategory, [ProcessingGroup, string[] | null][]> = {
  general: [['compress', generalKeys]],
  watermark: [['watermark', null]],
  transform: [['compress', null]],
  skipProcess: [['skipProcess', null]],
  rename: [
    ['rename', null],
    ['naming', null],
  ],
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

function onOff(active: boolean) {
  return { active, text: t(`pages.imageProcess.studio.${active ? 'on' : 'off'}`) }
}

function status(id: ProcessingCategory) {
  const { compress: c, watermark: w, skipProcess, rename, naming } = editingSettings.value
  switch (id) {
    case 'general':
      return {
        active: Number(c.quality.value) < 100 || !!c.isConvert.value || !!c.isRemoveExif.value,
        text: `${c.quality.value}%${c.isConvert.value ? ` · ${String(c.convertFormat.value).toUpperCase()}` : ''}`,
      }
    case 'watermark':
      return onOff(!!w.isAddWatermark.value)
    case 'transform':
      return onOff([c.isReSize, c.isReSizeByPercent, c.isFlip, c.isFlop, c.isRotate].some(option => !!option.value))
    case 'skipProcess': {
      const count = String(skipProcess.skipProcessExtList.value)
        .split(',')
        .filter(ext => ext.trim()).length
      return count ? { active: true, text: String(count) } : onOff(false)
    }
    case 'rename':
      return onOff([naming.autoRename, naming.manualRename, rename.enable].some(option => !!option.value))
  }
}

const categories = computed(() =>
  (
    [
      { id: 'general', label: t('pages.imageProcess.design.categoryLabels.general'), icon: Settings },
      { id: 'watermark', label: t('pages.imageProcess.watermarkSettings'), icon: Image },
      { id: 'transform', label: t('pages.imageProcess.design.categoryLabels.transform'), icon: RotateCw },
      { id: 'skipProcess', label: t('pages.imageProcess.design.categoryLabels.skipProcess'), icon: FileText },
      { id: 'rename', label: t('pages.imageProcess.renameSettings'), icon: Sliders },
    ] as const
  ).map(category => {
    const unsupported = scope.value === 'provider' && globalOrConfigCategories.includes(category.id)
    return {
      ...category,
      customized: unsupported ? 0 : customizedCount(category.id),
      status: unsupported ? { active: false, text: '—' } : status(category.id),
    }
  }),
)

function select(id: ProcessingCategory) {
  activeCategory.value = id
  view.value = 'edit'
}
</script>
