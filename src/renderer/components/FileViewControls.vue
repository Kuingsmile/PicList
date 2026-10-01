<template>
  <div class="file-view-controls">
    <div class="view-buttons" :aria-label="t('common.fileTable.view')" role="group">
      <button type="button" :aria-pressed="viewMode === 'grid'" @click="viewMode = 'grid'">
        <GridIcon :size="14" />{{ t('common.fileTable.grid') }}
      </button>
      <button type="button" :aria-pressed="viewMode === 'table'" @click="viewMode = 'table'">
        <ListIcon :size="14" />{{ t('common.fileTable.table') }}
      </button>
    </div>
    <label v-if="viewMode === 'table'">
      {{ t('common.fileTable.density') }}
      <select v-model="density">
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

<style scoped>
.file-view-controls,
.view-buttons,
label,
button {
  display: flex;
  align-items: center;
  gap: 6px;
}

.file-view-controls {
  flex-wrap: wrap;
  font-size: 12px;
  color: var(--color-text-secondary);
}

button,
select {
  min-height: 30px;
  padding: 4px 8px;
  border: 1px solid var(--color-border);
  border-radius: 4px;
  color: inherit;
  background: var(--color-background-secondary);
}

button {
  cursor: pointer;
}

button[aria-pressed='true'] {
  color: white;
  background: var(--color-accent);
  border-color: var(--color-accent);
}

button:focus-visible,
select:focus-visible {
  outline: 2px solid var(--color-accent);
  outline-offset: 2px;
}
</style>
