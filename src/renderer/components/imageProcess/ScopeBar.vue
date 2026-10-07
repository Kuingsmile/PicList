<template>
  <section
    class="flex w-full flex-col gap-3 rounded-2xl border border-border-secondary px-4 py-3 shadow-md"
    :aria-label="t('pages.imageProcess.design.applyTo')"
  >
    <div class="flex flex-wrap items-end gap-x-6 gap-y-3">
      <div class="flex min-w-[min(100%,360px)] flex-[1.4] flex-col gap-2">
        <span :id="controlId('scope-label')" class="text-[0.925rem] leading-[1.4] font-semibold text-secondary">
          {{ t('pages.imageProcess.studio.applyTo') }}
        </span>
        <div
          class="flex gap-1 rounded-lg border border-border-secondary p-1"
          role="group"
          :aria-labelledby="controlId('scope-label')"
        >
          <CustomButton
            v-for="level in scopes"
            :key="level"
            type="tab"
            :data-testid="'processing-scope-' + level"
            :icon="scopeIcons[level]"
            :text="t('pages.imageProcess.guide.scopeLabels.' + level)"
            :active="scope === level"
            class="px-2"
            @click="scope = level"
          />
        </div>
      </div>
      <div class="grid min-w-[min(100%,320px)] flex-1 grid-cols-2 gap-3">
        <div class="flex min-w-0 flex-col gap-2">
          <SingleSelect
            v-model="targetProvider"
            data-testid="processing-provider"
            :title="t('pages.imageProcess.design.service')"
            :fronticon="false"
            :select-list="providerOptions"
          />
        </div>
        <div class="flex min-w-0 flex-col gap-2">
          <SingleSelect
            v-model="selectedConfigId"
            data-testid="processing-configuration"
            :title="t('pages.imageProcess.design.uploader')"
            :fronticon="false"
            :placeholder="t('pages.imageProcess.editor.noSavedConfig')"
            :select-list="configOptions"
          />
        </div>
      </div>
    </div>
    <p class="flex items-start gap-2 text-xs leading-relaxed text-secondary" data-testid="processing-scope-hint">
      <component :is="scopeIcons[scope]" :size="14" class="mt-px shrink-0 text-accent" aria-hidden="true" />
      <span class="min-w-0 flex-1 wrap-anywhere">{{ scopeHint }}</span>
      <HelpTooltip :content="t('pages.imageProcess.design.inheritanceHelp')" />
    </p>
  </section>
</template>

<script setup lang="ts">
import { Globe, Layers, UserRound } from '@lucide/vue'
import { computed } from 'vue'
import { useI18n } from 'vue-i18n'

import CustomButton from '@/components/common/CustomButton.vue'
import HelpTooltip from '@/components/common/HelpTooltip.vue'
import SingleSelect from '@/components/common/SingleSelect.vue'
import { useImageProcessContext } from '@/components/imageProcess/context'
import type { ProcessingScope } from '@/utils/imageProcessingConfig'

const { t } = useI18n()
const { scope, providers, configurationOptions, targetProvider, selectedConfigId, previewUploader, controlId } =
  useImageProcessContext()

const scopes: ProcessingScope[] = ['global', 'provider', 'config']
const scopeIcons = { global: Globe, provider: Layers, config: UserRound }
const providerOptions = computed(() => providers.value.map(({ type, name }) => ({ value: type, label: name })))
const configOptions = computed(() =>
  configurationOptions.value.map(({ id, name }) => ({
    value: id,
    label: name || t('pages.imageProcess.preview.unnamedConfig'),
  })),
)
const scopeHint = computed(() =>
  t('pages.imageProcess.design.scopeHints.' + scope.value, {
    provider: previewUploader.value.providerName,
    config: previewUploader.value.configName || t('pages.imageProcess.preview.unnamedConfig'),
  }),
)
</script>
