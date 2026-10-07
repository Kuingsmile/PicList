<template>
  <div
    :data-processing-field="field"
    class="relative flex min-w-0 flex-col rounded-lg border bg-bg-secondary shadow-sm transition-colors duration-fast"
    :class="[p1 ? 'p-1' : 'p-4', customized ? 'border-accent/60' : 'border-border']"
  >
    <fieldset class="m-0 flex min-w-0 flex-col gap-2 border-none p-0" :disabled="unsupported">
      <slot />
    </fieldset>
    <div
      v-if="unsupported || inactive || showSources || customized || masked"
      class="flex flex-col gap-2 text-xs"
      :class="p1 ? 'px-3 pb-3' : 'mt-3'"
    >
      <p v-if="unsupported" class="text-secondary">{{ t('pages.imageProcess.editor.globalOrConfigOnly') }}</p>
      <p v-else-if="inactive" class="text-secondary">{{ inactive }}</p>
      <div v-if="!unsupported && (showSources || customized)" class="flex flex-wrap items-center gap-2">
        <span
          v-if="showSources"
          class="flex min-w-0 items-center gap-1.5 rounded-md px-2 py-1 wrap-anywhere"
          :class="customized ? 'bg-accent/10 font-medium text-accent' : 'bg-bg-tertiary text-secondary'"
        >
          <Link2 v-if="!customized" :size="12" aria-hidden="true" />
          {{ sourceLabel(option.source) }}
        </span>
        <button
          v-if="customized"
          type="button"
          data-action="inherit"
          class="ml-auto flex cursor-pointer items-center gap-1 rounded-sm font-medium text-accent hover:underline focus-visible:focus-ring"
          @click="inheritSetting(field)"
        >
          <Undo2 :size="12" aria-hidden="true" />{{ t('pages.imageProcess.design.restoreShared') }}
        </button>
      </div>
      <div
        v-if="masked"
        class="rounded-md bg-accent/5 p-2 leading-relaxed wrap-anywhere text-secondary"
        data-testid="processing-masked-value"
      >
        <p>
          {{
            t('pages.imageProcess.design.maskedValue', { value: finalValue, source: sourceLabel(finalOption.source) })
          }}
        </p>
        <button
          type="button"
          class="mt-1 cursor-pointer rounded-sm font-medium text-accent hover:underline focus-visible:focus-ring"
          @click="editScope(finalOption.source === 'default' ? 'global' : finalOption.source)"
        >
          {{ t('pages.imageProcess.design.editWinning') }} <span aria-hidden="true">→</span>
        </button>
      </div>
    </div>
  </div>
</template>

<script setup lang="ts">
import { Link2, Undo2 } from '@lucide/vue'
import { computed } from 'vue'
import { useI18n } from 'vue-i18n'

import { useImageProcessContext } from '@/components/imageProcess/context'
import type {
  ProcessingConfigSource,
  ProcessingGroup,
  ResolvedImageProcessingConfig,
  ResolvedProcessingOption,
} from '@/utils/imageProcessingConfig'
import { formatProcessingValue } from '@/utils/imageProcessingPresentation'

defineSlots<{
  default?: () => unknown
}>()

const {
  field,
  unsupported = false,
  inactive = '',
} = defineProps<{
  field: string
  p1?: boolean
  unsupported?: boolean
  inactive?: string
}>()
const { t } = useI18n()
const { scope, previewUploader, editingSettings, effectiveSettings, showSources, inheritSetting, editScope } =
  useImageProcessContext()

function optionIn(settings: ResolvedImageProcessingConfig) {
  const [group, key] = field.split('.')
  return (settings[group as ProcessingGroup] as Record<string, ResolvedProcessingOption>)[key]
}
const option = computed(() => optionIn(editingSettings.value))
const finalOption = computed(() => optionIn(effectiveSettings.value))
const customized = computed(() => !unsupported && scope.value !== 'global' && option.value.source === scope.value)
const masked = computed(() => !unsupported && finalOption.value.source !== option.value.source)
const finalValue = computed(() => formatProcessingValue(field.split('.')[1], finalOption.value.value, t))

function sourceLabel(source: ProcessingConfigSource) {
  return t(`pages.imageProcess.design.sources.${source}`, {
    provider: previewUploader.value.providerName || previewUploader.value.type,
    config: previewUploader.value.configName || t('pages.imageProcess.preview.unnamedConfig'),
  })
}
</script>
