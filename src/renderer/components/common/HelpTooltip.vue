<template>
  <button
    v-tooltip="{ content, markdown: true }"
    type="button"
    :aria-label="t('common.help')"
    class="flex h-[20px] w-[20px] shrink-0 cursor-help items-center justify-center rounded-full p-[2px] text-secondary transition-colors duration-fast hover:bg-accent/10 hover:text-accent"
  >
    <Info :size="16" aria-hidden="true" />
  </button>
</template>

<script setup lang="ts">
import { Info } from '@lucide/vue'
import { useI18n } from 'vue-i18n'

import { vTooltip } from '@/directives/tooltip'

defineProps<{ content: string }>()
const { t } = useI18n()
</script>
