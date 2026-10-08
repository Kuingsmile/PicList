<template>
  <div class="flex flex-col gap-1">
    <span :id="controlId('format-rules')" class="text-sm font-semibold text-secondary">
      {{ t('pages.imageProcess.studio.formatRules') }}
    </span>
    <p class="text-xs leading-relaxed text-secondary">{{ t('pages.imageProcess.studio.formatRulesHint') }}</p>
  </div>
  <ul
    v-if="rules.length"
    class="flex flex-wrap gap-2"
    :aria-labelledby="controlId('format-rules')"
    data-testid="processing-format-rules"
  >
    <li
      v-for="[from, to] in rules"
      :key="from"
      class="inline-flex items-center gap-1.5 rounded-md border border-border bg-bg-tertiary py-1 pr-1 pl-2.5 font-mono text-xs font-semibold text-main"
    >
      {{ from.toUpperCase() }}
      <ArrowRight :size="12" class="text-tertiary" aria-hidden="true" />
      <span class="text-accent">{{ String(to).toUpperCase() }}</span>
      <button
        type="button"
        class="ml-0.5 flex cursor-pointer items-center rounded-sm p-0.5 text-tertiary transition-colors duration-fast hover:bg-danger/10 hover:text-danger focus-visible:focus-ring"
        :aria-label="
          t('pages.imageProcess.studio.removeRule', { from: from.toUpperCase(), to: String(to).toUpperCase() })
        "
        @click="removeRule(from)"
      >
        <X :size="12" aria-hidden="true" />
      </button>
    </li>
  </ul>
  <p v-else class="text-xs text-tertiary">{{ t('pages.imageProcess.studio.noFormatRules') }}</p>
  <div class="mt-1 flex flex-wrap items-end gap-x-2 gap-y-3">
    <div class="flex min-w-[110px] flex-1 flex-col gap-2">
      <SingleSelect
        v-model="draftFrom"
        :title="t('pages.imageProcess.studio.ruleFrom')"
        :fronticon="false"
        :select-list="fromOptions"
      />
    </div>
    <ArrowRight :size="16" class="mb-2 shrink-0 text-tertiary" aria-hidden="true" />
    <div class="flex min-w-[110px] flex-1 flex-col gap-2">
      <SingleSelect
        v-model="draftTo"
        :title="t('pages.imageProcess.studio.ruleTo')"
        :fronticon="false"
        :select-list="toOptions"
      />
    </div>
    <CustomButton
      type="secondary"
      class="py-1.5"
      :icon="rules.some(([from]) => from === draftFrom) ? RefreshCw : Plus"
      :text="t(`pages.imageProcess.studio.${rules.some(([from]) => from === draftFrom) ? 'replaceRule' : 'addRule'}`)"
      @click="addRule"
    />
  </div>
</template>

<script setup lang="ts">
import { ArrowRight, Plus, RefreshCw, X } from '@lucide/vue'
import { computed, ref, watch } from 'vue'
import { useI18n } from 'vue-i18n'

import CustomButton from '@/components/common/CustomButton.vue'
import SingleSelect from '@/components/common/SingleSelect.vue'
import { useImageProcessContext } from '@/components/imageProcess/context'
import { convertibleExtensions, outputFormats } from '@/utils/imageProcessingConfig'

const { t } = useI18n()
const { form, controlId } = useImageProcessContext()

const rules = computed(() => Object.entries(form.compress.formatConvertObj as Record<string, string>))
const fromOptions = computed(() =>
  convertibleExtensions.map(extension => ({
    value: extension,
    label: rules.value.some(([from]) => from === extension)
      ? `${extension.toUpperCase()} · ${t('pages.imageProcess.studio.hasRule')}`
      : extension.toUpperCase(),
  })),
)
const toOptions = outputFormats.map(format => ({ value: format, label: format.toUpperCase() }))

const draftFrom = ref('png')
const draftTo = ref('webp')
// Compare contents so parsing legacy JSON strings doesn't reset the draft on unrelated edits.
watch(
  () => JSON.stringify(form.compress.formatConvertObj),
  () => {
    const current = rules.value
    draftFrom.value = convertibleExtensions.find(extension => !current.some(([from]) => from === extension)) ?? 'png'
  },
  { immediate: true },
)

// The resolved rules can share their object with the saved config, so always write a fresh copy.
function addRule() {
  form.compress.formatConvertObj = { ...Object.fromEntries(rules.value), [draftFrom.value]: draftTo.value }
}
function removeRule(extension: string) {
  form.compress.formatConvertObj = Object.fromEntries(rules.value.filter(([from]) => from !== extension))
}
</script>
