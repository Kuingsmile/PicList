<template>
  <SettingSection
    :icon="FileX"
    :title="t('pages.imageProcess.general.skipProcessExtList')"
    :description="t('pages.imageProcess.guide.categoryHints.skipProcess')"
    only-one-row
  >
    <ProcessingField field="skipProcess.skipProcessExtList">
      <label :for="controlId('processing-skip-ext')" class="text-sm font-semibold text-secondary">
        {{ t('pages.imageProcess.studio.extensions') }}
      </label>
      <textarea
        :id="controlId('processing-skip-ext')"
        v-model="form.skipProcess.skipProcessExtList"
        class="box-border min-h-[90px] w-full resize-y rounded-md border border-border bg-bg-tertiary p-3 font-mono text-sm text-main transition-all duration-200 ease-apple focus:border-accent focus-visible:focus-ring"
        rows="3"
        spellcheck="false"
        placeholder="zip,rar,7z,tar,gz"
      />
      <p class="text-xs leading-relaxed text-secondary">
        {{ t('pages.imageProcess.general.skipProcessExtListPlaceholder') }}
      </p>
      <ul
        v-if="extensions.length"
        class="flex flex-wrap gap-1.5"
        :aria-label="t('pages.imageProcess.studio.extensions')"
      >
        <li
          v-for="extension in extensions"
          :key="extension"
          class="rounded-md bg-accent/10 px-2 py-0.5 font-mono text-xs font-semibold text-accent"
        >
          .{{ extension }}
        </li>
      </ul>
    </ProcessingField>
  </SettingSection>
</template>

<script setup lang="ts">
import { FileX } from '@lucide/vue'
import { computed } from 'vue'
import { useI18n } from 'vue-i18n'

import SettingSection from '@/components/common/SettingSection.vue'
import { useImageProcessContext } from '@/components/imageProcess/context'
import ProcessingField from '@/components/imageProcess/ProcessingField.vue'

const { t } = useI18n()
const { form, controlId } = useImageProcessContext()

const extensions = computed(() => [
  ...new Set(
    String(form.skipProcess.skipProcessExtList || '')
      .split(',')
      .map(extension => extension.trim().replace(/^\./, ''))
      .filter(Boolean),
  ),
])
</script>
