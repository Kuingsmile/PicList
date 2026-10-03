<template>
  <div :data-processing-field="field" class="processing-field rounded-xl border border-border bg-bg-tertiary p-4">
    <fieldset class="m-0 flex min-w-0 flex-col gap-2 border-none p-0" :disabled="unsupported">
      <slot />
    </fieldset>
    <p v-if="unsupported" class="mt-3 text-xs text-secondary">
      {{ t('pages.imageProcess.editor.globalOrConfigOnly') }}
    </p>
    <div
      v-else-if="showSource || customized"
      class="processing-field-source mt-2 flex flex-wrap items-center justify-between gap-2 text-xs"
    >
      <span v-if="showSource" class="flex min-w-0 items-center gap-1.5 wrap-anywhere text-secondary">
        <Link2 v-if="shared" :size="12" />
        <span :class="shared ? '' : 'font-medium text-accent'">{{ sourceLabel(option.source) }}</span>
      </span>
      <button
        v-if="customized"
        type="button"
        data-action="inherit"
        class="ml-auto cursor-pointer rounded-sm text-accent hover:underline"
        @click="$emit('inherit')"
      >
        {{ t('pages.imageProcess.design.restoreShared') }}
      </button>
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

defineSlots<{
  default?: () => unknown
}>()

const {
  option,
  scope,
  field,
  uploader,
  effectiveSettings,
  unsupported = false,
  showSource = false,
} = defineProps<{
  option: ResolvedProcessingOption
  scope: ProcessingScope
  field: string
  uploader: ProcessingUploader
  effectiveSettings: ResolvedImageProcessingConfig
  p1?: boolean
  unsupported?: boolean
  showSource?: boolean
}>()
defineEmits<{ inherit: []; editSource: [scope: ProcessingScope] }>()
const { t } = useI18n()
const shared = computed(() => scope !== 'global' && option.source !== scope)
const customized = computed(() => scope !== 'global' && option.source === scope)
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
@reference '../index.css';

/* Keep switches keyboard-accessible inside this editor. */
fieldset :deep(input[type='checkbox'].hidden),
fieldset :deep(input[type='radio'].hidden) {
  @apply absolute block h-px w-px opacity-0;
}

fieldset :deep(label:has(input:focus-visible)) {
  @apply outline-2 outline-offset-2 outline-accent outline-solid;
}

fieldset :deep(> div > label:has(input[type='checkbox'])) {
  @apply w-full flex-row-reverse justify-between gap-[16px] p-0;
}

fieldset :deep(> div:has(> label > input[type='checkbox'])) {
  @apply w-full py-[4px];
}

fieldset :deep(> div > label > div) {
  @apply mr-auto;
}

fieldset :deep(input[type='range']:focus-visible) {
  @apply outline-2 outline-offset-4 outline-accent outline-solid;
}
</style>
