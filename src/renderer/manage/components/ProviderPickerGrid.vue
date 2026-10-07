<template>
  <div class="grid grid-cols-[repeat(auto-fill,minmax(150px,1fr))] gap-3">
    <button
      v-for="provider in providers"
      :key="provider.key"
      type="button"
      class="group/provider flex cursor-pointer flex-col items-center gap-2.5 rounded-xl border border-border-secondary bg-bg-secondary px-3 py-4 text-center shadow-sm transition-all duration-fast ease-apple hover:-translate-y-px hover:border-accent hover:shadow-md focus-visible:focus-ring"
      @click="emit('select', provider.key)"
    >
      <span
        class="flex h-[44px] w-[44px] items-center justify-center rounded-lg border border-border-secondary bg-bg-tertiary transition-transform duration-fast ease-apple group-hover/provider:scale-105"
      >
        <img :src="`./assets/${provider.icon}.webp`" class="h-[26px] w-[26px] object-contain" alt="" />
      </span>
      <span class="w-full truncate text-sm font-semibold text-main">{{ provider.name }}</span>
      <span class="text-xs text-tertiary tabular-nums">
        {{ t('pages.manage.login.savedCount', counts[provider.key] ?? 0) }}
      </span>
    </button>
  </div>
</template>

<script setup lang="ts">
import { useI18n } from 'vue-i18n'

const { providers, counts } = defineProps<{
  providers: { key: string; name: string; icon: string }[]
  counts: Record<string, number>
}>()

const emit = defineEmits<{ select: [key: string] }>()

const { t } = useI18n()
</script>
