<template>
  <div :data-processing-field="field" class="processing-field rounded-lg border border-border bg-bg-tertiary p-3">
    <fieldset class="m-0 flex min-w-0 flex-col gap-2 border-none p-0" :disabled="unsupported">
      <slot />
    </fieldset>
    <p v-if="unsupported" class="mt-3 text-xs text-secondary">
      {{ t('pages.imageProcess.editor.globalOrConfigOnly') }}
    </p>
    <div v-else class="mt-3 flex flex-wrap items-center justify-between gap-2 border-t border-border/60 pt-2 text-xs">
      <span class="flex min-w-0 items-center gap-1.5 wrap-anywhere text-secondary">
        <Link2 v-if="shared" :size="12" />
        <span :class="shared ? '' : 'font-medium text-accent'">{{ sourceLabel(option.source) }}</span>
      </span>
      <button
        v-if="scope !== 'global' && option.source === scope"
        type="button"
        data-action="inherit"
        class="cursor-pointer rounded-sm text-accent hover:underline"
        @click="$emit('inherit')"
      >
        {{ t('pages.imageProcess.design.restoreShared') }}
      </button>
      <span v-else-if="shared" class="text-secondary">{{ t('pages.imageProcess.design.editToCustomize') }}</span>
    </div>
    <div
      v-if="masked"
      class="mt-2 rounded-md bg-accent/5 p-2 text-xs leading-relaxed wrap-anywhere"
      data-testid="processing-masked-value"
    >
      <p>
        {{ t('pages.imageProcess.design.maskedValue', { value: finalValue, source: sourceLabel(finalOption.source) }) }}
      </p>
      <button
        type="button"
        class="mt-1 cursor-pointer font-medium text-accent hover:underline"
        @click="$emit('editSource', finalOption.source === 'default' ? 'global' : finalOption.source)"
      >
        {{ t('pages.imageProcess.design.editWinning') }} <span aria-hidden="true">→</span>
      </button>
    </div>
  </div>
</template>

<script setup lang="ts">
import { Link2 } from '@lucide/vue'
import { computed } from 'vue'
import { useI18n } from 'vue-i18n'

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
  option,
  scope,
  field,
  uploader,
  effectiveSettings,
  unsupported = false,
} = defineProps<{
  option: ResolvedProcessingOption
  scope: ProcessingScope
  field: string
  uploader: ProcessingUploader
  effectiveSettings: ResolvedImageProcessingConfig
  p1?: boolean
  unsupported?: boolean
}>()
defineEmits<{ inherit: []; editSource: [scope: ProcessingScope] }>()
const { t } = useI18n()
const shared = computed(() => scope !== 'global' && option.source !== scope)
function sourceLabel(source: ProcessingConfigSource) {
  return t(`pages.imageProcess.design.sources.${source}`, {
    provider: uploader.providerName || uploader.type,
    config: uploader.configName || t('pages.imageProcess.preview.unnamedConfig'),
  })
}
const finalOption = computed(() => {
  const [group, key] = field.split('.')
  return (effectiveSettings[group as ProcessingGroup] as Record<string, ResolvedProcessingOption>)[key]
})
const masked = computed(() => !unsupported && finalOption.value.source !== option.source)
const finalValue = computed(() => formatProcessingValue(field.split('.')[1], finalOption.value.value, t))
</script>

<style scoped>
/* Keep switches keyboard-accessible inside this editor. */
fieldset :deep(input[type='checkbox'].hidden) {
  position: absolute;
  display: block;
  width: 1px;
  height: 1px;
  opacity: 0;
}

fieldset :deep(label:has(input:focus-visible)) {
  outline: 2px solid var(--color-accent);
  outline-offset: 2px;
}
</style>
