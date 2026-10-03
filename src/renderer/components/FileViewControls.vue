<template>
  <div class="file-view-controls flex flex-wrap items-center gap-[6px] text-[12px] text-secondary">
    <div class="view-buttons flex items-center gap-[6px]" :aria-label="t('common.fileTable.view')" role="group">
      <button
        class="flex min-h-[30px] cursor-pointer items-center gap-[6px] rounded-[4px] border border-border bg-bg-secondary px-[8px] py-[4px] text-inherit focus-visible:outline-2 focus-visible:outline-offset-2 focus-visible:outline-accent focus-visible:outline-solid aria-pressed:border-accent aria-pressed:bg-accent aria-pressed:text-white"
        type="button"
        :aria-pressed="viewMode === 'grid'"
        @click="viewMode = 'grid'"
      >
        <GridIcon :size="14" />{{ t('common.fileTable.grid') }}
      </button>
      <button
        class="flex min-h-[30px] cursor-pointer items-center gap-[6px] rounded-[4px] border border-border bg-bg-secondary px-[8px] py-[4px] text-inherit focus-visible:outline-2 focus-visible:outline-offset-2 focus-visible:outline-accent focus-visible:outline-solid aria-pressed:border-accent aria-pressed:bg-accent aria-pressed:text-white"
        type="button"
        :aria-pressed="viewMode === 'table'"
        @click="viewMode = 'table'"
      >
        <ListIcon :size="14" />{{ t('common.fileTable.table') }}
      </button>
    </div>
    <label v-if="viewMode === 'table'" class="flex items-center gap-[6px]">
      {{ t('common.fileTable.density') }}
      <select
        v-model="density"
        class="min-h-[30px] rounded-[4px] border border-border bg-bg-secondary px-[8px] py-[4px] text-inherit focus-visible:outline-2 focus-visible:outline-offset-2 focus-visible:outline-accent focus-visible:outline-solid"
      >
        <option value="compact">{{ t('common.fileTable.compact') }}</option>
        <option value="comfortable">{{ t('common.fileTable.comfortable') }}</option>
      </select>
    </label>
  </div>
</template>

<script setup lang="ts">
import { GridIcon, ListIcon } from '@lucide/vue'
import { useI18n } from 'vue-i18n'

const viewMode = defineModel<'grid' | 'table'>('viewMode', { required: true })
const density = defineModel<'compact' | 'comfortable'>('density', { required: true })
const { t } = useI18n()
</script>
