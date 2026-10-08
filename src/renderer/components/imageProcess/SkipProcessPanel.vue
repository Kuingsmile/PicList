<template>
  <SettingSection
    :icon="FileX"
    :title="t('pages.imageProcess.design.categoryLabels.skipProcess')"
    :description="t('pages.imageProcess.guide.categoryHints.skipProcess')"
    only-one-row
  >
    <ProcessingField field="skipProcess.skipProcessExtList">
      <label :for="controlId('processing-skip-ext')" class="text-sm font-semibold text-secondary">
        {{ t('pages.imageProcess.studio.extensions') }}
      </label>
      <div
        class="flex min-h-12 flex-wrap items-center gap-1.5 rounded-md border border-border bg-bg-tertiary p-2 transition-all duration-200 ease-apple focus-within:border-accent"
        data-testid="processing-skip-extensions"
        @click="input?.focus()"
      >
        <span
          v-for="extension in extensions"
          :key="extension"
          class="inline-flex items-center gap-0.5 rounded-md bg-accent/10 py-0.5 pr-0.5 pl-2 font-mono text-xs font-semibold text-accent"
        >
          .{{ extension }}
          <button
            type="button"
            class="flex cursor-pointer items-center rounded-sm p-0.5 transition-colors duration-fast hover:bg-accent/20 focus-visible:focus-ring"
            :aria-label="t('pages.imageProcess.studio.removeExtension', { extension })"
            @click.stop="remove(extension)"
          >
            <X :size="12" aria-hidden="true" />
          </button>
        </span>
        <input
          :id="controlId('processing-skip-ext')"
          ref="input"
          v-model="draft"
          class="min-w-32 flex-1 border-none bg-transparent px-1 py-0.5 font-mono text-sm text-main outline-none placeholder:font-sans placeholder:text-tertiary"
          spellcheck="false"
          autocomplete="off"
          :placeholder="t('pages.imageProcess.studio.addExtension')"
          @keydown.enter.prevent="commit"
          @keydown.backspace="removeLastIfEmpty"
          @input="commitOnSeparator"
          @blur="commit"
        />
      </div>
      <p class="text-xs leading-relaxed text-secondary">{{ t('pages.imageProcess.studio.extensionsHint') }}</p>
      <CustomButton
        v-if="scope === 'global'"
        type="secondary"
        class="self-start"
        :icon="RotateCcw"
        :text="t('pages.imageProcess.studio.restoreDefaultExtensions')"
        :disabled="editingSettings.skipProcess.skipProcessExtList.source === 'default'"
        @click="restoreDefaults"
      />
    </ProcessingField>
  </SettingSection>
</template>

<script setup lang="ts">
import { FileX, RotateCcw, X } from '@lucide/vue'
import { computed, ref, useTemplateRef } from 'vue'
import { useI18n } from 'vue-i18n'

import CustomButton from '@/components/common/CustomButton.vue'
import SettingSection from '@/components/common/SettingSection.vue'
import { useImageProcessContext } from '@/components/imageProcess/context'
import ProcessingField from '@/components/imageProcess/ProcessingField.vue'
import { parseSkipProcessExtensions } from '@/utils/imageProcessingConfig'

const { t } = useI18n()
const { form, controlId, scope, editingSettings } = useImageProcessContext()
const input = useTemplateRef('input')
const draft = ref('')

// New input accepts convenient separators; saved lists use the processor's comma-only syntax.
function parseInput(list: string) {
  return list
    .split(/[\s,;]+/)
    .map(extension => extension.trim().replace(/^\.+/, '').toLowerCase())
    .filter(Boolean)
}
const extensions = computed(() => parseSkipProcessExtensions(form.skipProcess.skipProcessExtList))

function save(list: string[]) {
  // Empty strings inherit; a delimiter-only list explicitly skips no extensions.
  form.skipProcess.skipProcessExtList = [...new Set(list)].join(',') || ','
}
function commit() {
  const added = parseInput(draft.value)
  draft.value = ''
  if (added.some(extension => !extensions.value.includes(extension))) save([...extensions.value, ...added])
}
// Typing or pasting a separator turns the finished part into chips straight away.
function commitOnSeparator() {
  if (/[\s,;]/.test(draft.value)) commit()
}
function remove(extension: string) {
  save(extensions.value.filter(item => item !== extension))
}
function removeLastIfEmpty() {
  if (!draft.value && extensions.value.length) remove(extensions.value[extensions.value.length - 1])
}
function restoreDefaults() {
  draft.value = ''
  form.skipProcess.skipProcessExtList = ''
}
</script>
