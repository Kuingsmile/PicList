<template>
  <div class="flex h-full w-full flex-col items-center justify-center gap-4 px-6 py-12 text-center" role="status">
    <div
      class="inline-flex h-[72px] w-[72px] items-center justify-center rounded-2xl border-2 border-dashed border-border bg-surface-elevated text-tertiary"
    >
      <component :is="icon" :size="32" aria-hidden="true" />
    </div>
    <div>
      <h3 class="mb-2 text-lg font-semibold text-main">{{ title || t('pages.manage.empty.noData') }}</h3>
      <p v-if="!noDesc" class="m-0 max-w-[420px] text-sm text-secondary">
        {{ description || t('pages.manage.empty.noDataDesc') }}
      </p>
    </div>
    <div v-if="$slots.default" class="flex flex-wrap justify-center gap-3">
      <slot />
    </div>
  </div>
</template>

<script lang="ts" setup>
import { FolderOpenIcon } from '@lucide/vue'
import type { Component } from 'vue'
import { useI18n } from 'vue-i18n'

defineSlots<{ default?: () => unknown }>()

const {
  noDesc = false,
  icon = FolderOpenIcon,
  title = '',
  description = '',
} = defineProps<{
  noDesc?: boolean
  icon?: Component
  title?: string
  description?: string
}>()

const { t } = useI18n()
</script>
