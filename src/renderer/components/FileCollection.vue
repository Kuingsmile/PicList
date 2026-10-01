<template>
  <div ref="rootRef" class="file-collection" :style="{ '--file-row-height': `${rowHeight}px` }">
    <VirtualScroller
      ref="scrollerRef"
      class="collection-scroller"
      :items
      :item-height="viewMode === 'table' ? rowHeight : gridItemHeight"
      :view-mode="viewMode"
      :grid-breakpoints="gridBreakpoints"
      :key-field="keyField"
      :table-columns="columns.length + 2"
      :table-min-width="columns.reduce((sum, column) => sum + column.width, 44 + actionsWidth)"
      :table-label="label"
      @visible-indexes-change="onVisibleIndexesChange"
    >
      <template #columns>
        <colgroup>
          <col style="width: 44px" />
          <col
            v-for="column in columns"
            :key="column.key"
            :style="column.key === 'name' ? {} : { width: `${column.width}px` }"
          />
          <col :style="{ width: `${actionsWidth}px` }" />
        </colgroup>
      </template>
      <template #header>
        <tr aria-rowindex="1">
          <th scope="col" class="selection-cell">
            <input
              type="checkbox"
              :checked="allSelected"
              :indeterminate="someSelected && !allSelected"
              :aria-label="t('common.fileTable.selectAll')"
              @change="emit('selectAll', !allSelected)"
            />
          </th>
          <th
            v-for="column in columns"
            :key="column.key"
            scope="col"
            :aria-sort="sortField === column.key ? (sortAscending ? 'ascending' : 'descending') : 'none'"
          >
            <button type="button" class="sort-button" @click="emit('sort', column.key)">
              {{ column.label }}
              <span aria-hidden="true">{{ sortField === column.key ? (sortAscending ? '↑' : '↓') : '↕' }}</span>
            </button>
          </th>
          <th scope="col" class="row-actions">{{ t('common.fileTable.actions') }}</th>
        </tr>
      </template>
      <template #default="{ item, index }">
        <tr
          v-if="viewMode === 'table'"
          class="file-row"
          :class="{ 'is-selected': isSelected(item) }"
          :data-file-index="index"
          :aria-rowindex="index + 2"
          :aria-selected="isSelected(item)"
          :aria-describedby="helpId"
          :tabindex="keyOf(item) === focusKey ? 0 : -1"
          @focusin="focusKey = keyOf(item)"
          @click="selectRow(item, index, $event)"
          @dblclick="emit('open', item, index)"
          @keydown="onKeydown($event, index)"
        >
          <td class="selection-cell">
            <input
              type="checkbox"
              :tabindex="keyOf(item) === focusKey ? 0 : -1"
              :checked="isSelected(item)"
              :aria-label="t('common.fileTable.selectFile', { name: item.fileName || keyOf(item) })"
              @click.stop="selectRow(item, index, $event, false)"
              @dblclick.stop
            />
          </td>
          <td v-for="column in columns" :key="column.key" :title="cellText(column, item)">
            <button
              v-if="column.key === 'name'"
              type="button"
              class="file-name"
              :tabindex="keyOf(item) === focusKey ? 0 : -1"
              :aria-describedby="previewId"
              @focus="emit('preview', item, $event.currentTarget as Element)"
              @blur="emit('previewEnd')"
              @click.stop="emit('open', item, index)"
              @dblclick.stop
            >
              <span
                class="file-icon"
                title=""
                @mouseenter="emit('preview', item, $event.currentTarget as Element)"
                @mouseleave="emit('previewEnd')"
              >
                <FolderIcon v-if="item.isDir" :size="16" aria-hidden="true" />
                <FileIcon v-else :size="16" aria-hidden="true" />
              </span>
              <span class="file-name-label">{{ cellText(column, item) }}</span>
            </button>
            <span v-else class="cell-text">{{ cellText(column, item) }}</span>
          </td>
          <td class="row-actions" @click.stop @dblclick.stop>
            <div class="action-buttons">
              <slot name="actions" :item :index :tabindex="keyOf(item) === focusKey ? 0 : -1" />
            </div>
          </td>
        </tr>
        <slot v-else :item :index />
      </template>
    </VirtualScroller>
  </div>
</template>

<script setup lang="ts" generic="T extends { fileName?: string; isDir?: boolean }">
import { FileIcon, FolderIcon } from '@lucide/vue'
import { computed, nextTick, ref, useId, useTemplateRef, watch } from 'vue'
import { useI18n } from 'vue-i18n'

import VirtualScroller from '@/components/VirtualScroller.vue'
import type { FileColumn } from '@/utils/fileCollection'

defineSlots<{
  actions?: (props: { item: T; index: number; tabindex: number }) => unknown
  default?: (props: { item: T; index: number }) => unknown
}>()

const {
  items,
  columns,
  keyField = 'id',
  viewMode,
  density = 'compact',
  gridItemHeight,
  gridBreakpoints,
  isSelected,
  sortField,
  sortAscending,
  label,
  actionsWidth = 144,
  previewId = '',
} = defineProps<{
  items: readonly T[]
  columns: readonly FileColumn<T>[]
  keyField?: string
  viewMode: 'grid' | 'table'
  density?: 'compact' | 'comfortable'
  gridItemHeight: number
  gridBreakpoints: { min: number; cols: number }[]
  isSelected: (item: T) => boolean
  sortField: string
  sortAscending: boolean
  label: string
  actionsWidth?: number
  previewId?: string
}>()

const emit = defineEmits<{
  select: [item: T, selected: boolean]
  selectAll: [selected: boolean]
  sort: [field: string]
  open: [item: T, index: number]
  preview: [item: T, anchor: Element]
  previewEnd: []
  visibleIndexesChange: [indexes: number[]]
}>()
const { t } = useI18n()
const helpId = useId()
const rootRef = useTemplateRef('rootRef')
const scrollerRef = useTemplateRef('scrollerRef')
const rowHeight = computed(() => (density === 'compact' ? 36 : 48))
const focusKey = ref<string | number>()
const rangeAnchor = ref<string | number>()
const keyOf = (item: T): string | number => (item as Record<string, unknown>)[keyField] as string | number
const keys = computed<(string | number)[]>(previous => {
  const current = items.map(keyOf)
  return previous?.length === current.length && current.every((key, index) => key === previous[index])
    ? previous
    : current
})
const allSelected = computed(() => items.length > 0 && items.every(isSelected))
const someSelected = computed(() => items.some(isSelected))

watch(
  keys,
  current => {
    if (!current.includes(focusKey.value!)) focusKey.value = current[0]
    if (!current.includes(rangeAnchor.value!)) rangeAnchor.value = undefined
  },
  { immediate: true },
)

const cellText = (column: FileColumn<T>, item: T) => column.format?.(item) || String(column.value(item) ?? '—')

function selectRange(index: number) {
  const anchor = keys.value.indexOf(rangeAnchor.value!)
  const start = anchor < 0 ? index : anchor
  for (let i = Math.min(start, index); i <= Math.max(start, index); i++) emit('select', items[i], true)
}

function selectRow(item: T, index: number, event: MouseEvent, focus = true) {
  if (event.shiftKey) selectRange(index)
  else {
    rangeAnchor.value = keyOf(item)
    emit('select', item, !isSelected(item))
  }
  focusKey.value = keyOf(item)
  if (focus) (event.currentTarget as HTMLElement).focus({ preventScroll: true })
}

async function focusRow(index: number) {
  focusKey.value = keyOf(items[index])
  scrollerRef.value?.scrollTo(index, 'nearest')
  await nextTick()
  rootRef.value?.querySelector<HTMLElement>(`[data-file-index="${index}"]`)?.focus({ preventScroll: true })
}

function onVisibleIndexesChange(indexes: number[]) {
  // Always keep a visible row in the tab order after scrolling with a mouse.
  if (!indexes.some(index => keyOf(items[index]) === focusKey.value)) {
    const first = scrollerRef.value?.captureAnchor()?.index ?? indexes[0]
    const item = items[first]
    focusKey.value = item ? keyOf(item) : undefined
  }
  emit('visibleIndexesChange', indexes)
}

function onKeydown(event: KeyboardEvent, index: number) {
  // Buttons and checkboxes retain native keyboard behavior.
  if (event.target !== event.currentTarget) return
  const last = items.length - 1
  const page = scrollerRef.value?.pageSize ?? 10
  const destinations: Record<string, number> = {
    ArrowDown: index + 1,
    ArrowUp: index - 1,
    Home: 0,
    End: last,
    PageDown: index + page,
    PageUp: index - page,
  }
  if (event.key in destinations) {
    event.preventDefault()
    const next = Math.max(0, Math.min(last, destinations[event.key]))
    if (event.shiftKey) {
      rangeAnchor.value ??= keyOf(items[index])
      selectRange(next)
    } else rangeAnchor.value = keyOf(items[next])
    void focusRow(next)
  } else if (event.key === ' ') {
    event.preventDefault()
    if (event.shiftKey) selectRange(index)
    else {
      rangeAnchor.value = keyOf(items[index])
      emit('select', items[index], !isSelected(items[index]))
    }
  } else if ((event.ctrlKey || event.metaKey) && event.key.toLowerCase() === 'a') {
    event.preventDefault()
    emit('selectAll', true)
  } else if (event.key === 'Escape') {
    event.preventDefault()
    emit('selectAll', false)
    rangeAnchor.value = undefined
  } else if (event.key === 'Enter') {
    event.preventDefault()
    emit('open', items[index], index)
  }
}

defineExpose({
  refresh: () => scrollerRef.value?.refresh(),
  scrollToTop: () => scrollerRef.value?.scrollToTop(),
  scrollTo: (index: number) => scrollerRef.value?.scrollTo(index),
})
</script>

<style scoped>
.file-collection {
  display: flex;
  flex: 1;
  flex-direction: column;
  min-width: 0;
  min-height: 0;
  width: 100%;
  color: var(--color-text-primary);
}

.collection-scroller {
  flex: 1;
}

/* Themes can make primary/secondary backgrounds transparent; sticky cells need a solid backing. */
th {
  height: 36px;
  text-align: left;
  background:
    linear-gradient(var(--color-background-secondary), var(--color-background-secondary)),
    var(--color-background-tertiary);
  font-size: 12px;
}

th,
td {
  padding: 0 10px;
  border-bottom: 1px solid var(--color-border-secondary);
  overflow: hidden;
}

.sort-button {
  display: flex;
  gap: 6px;
  align-items: center;
  width: 100%;
  height: 36px;
  border: 0;
  background: transparent;
  color: inherit;
  cursor: pointer;
  white-space: nowrap;
}

.selection-cell {
  text-align: center;
}

input[type='checkbox'] {
  width: 16px;
  height: 16px;
  vertical-align: middle;
  accent-color: var(--color-accent);
  cursor: pointer;
}

.file-row {
  --file-row-background: var(--color-background-primary);

  height: var(--file-row-height);
  font-size: 13px;
}

.file-row td {
  height: var(--file-row-height);
  background: var(--file-row-background);
}

.file-row:hover,
.file-row.is-selected {
  --file-row-background: var(--color-background-secondary);
}

.file-row td.row-actions {
  background: linear-gradient(var(--file-row-background), var(--file-row-background)), var(--color-background-tertiary);
}

.file-row.is-selected {
  color: var(--color-accent);
}

.file-row:focus {
  outline: 2px solid var(--color-accent);
  outline-offset: -2px;
}

.file-name {
  display: flex;
  gap: 8px;
  align-items: center;
  width: 100%;
  min-width: 0;
  height: calc(var(--file-row-height) - 2px);
  padding: 0;
  border: 0;
  background: transparent;
  color: inherit;
  text-align: left;
  cursor: pointer;
}

.file-name-label,
.cell-text {
  display: block;
  overflow: hidden;
  white-space: nowrap;
  text-overflow: ellipsis;
}

.file-icon {
  flex: none;
}

.row-actions {
  position: sticky;
  right: 0;
  z-index: 1;
  box-shadow: -1px 0 var(--color-border-secondary);
}

.action-buttons {
  display: flex;
  align-items: center;
  justify-content: flex-end;
  gap: 4px;
}

.action-buttons :deep(button) {
  display: inline-flex;
  align-items: center;
  justify-content: center;
  width: 28px;
  height: 28px;
  padding: 4px;
  border: 0;
  border-radius: 4px;
  background: transparent;
  color: var(--color-text-secondary);
  cursor: pointer;
}

.action-buttons :deep(button:hover) {
  background: var(--color-accent);
  color: white;
}

.action-buttons :deep(button:disabled) {
  opacity: 0.4;
  cursor: not-allowed;
}

button:focus-visible,
input:focus-visible,
.action-buttons :deep(button:focus-visible) {
  outline: 2px solid var(--color-accent);
  outline-offset: -2px;
}
</style>
