<template>
  <div
    ref="rootRef"
    class="file-collection flex min-h-0 w-full min-w-0 flex-1 flex-col text-main"
    :style="{ '--file-row-height': `${rowHeight}px` }"
  >
    <VirtualScroller
      ref="scrollerRef"
      class="collection-scroller flex-1"
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
          <col class="w-[44px]" />
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
          <th
            scope="col"
            class="selection-cell h-[36px] overflow-hidden border-b border-border-secondary px-[10px] py-0 text-center text-[12px] [background:linear-gradient(var(--color-background-secondary),var(--color-background-secondary)),var(--color-background-tertiary)]"
          >
            <input
              class="h-[16px] w-[16px] cursor-pointer align-middle accent-accent focus-visible:outline-2 focus-visible:-outline-offset-2 focus-visible:outline-accent focus-visible:outline-solid"
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
            class="h-[36px] overflow-hidden border-b border-border-secondary px-[10px] py-0 text-left text-[12px] [background:linear-gradient(var(--color-background-secondary),var(--color-background-secondary)),var(--color-background-tertiary)]"
            scope="col"
            :aria-sort="sortField === column.key ? (sortAscending ? 'ascending' : 'descending') : 'none'"
          >
            <button
              type="button"
              class="sort-button flex h-[36px] w-full cursor-pointer items-center gap-[6px] border-0 bg-transparent whitespace-nowrap text-inherit focus-visible:outline-2 focus-visible:-outline-offset-2 focus-visible:outline-accent focus-visible:outline-solid"
              @click="emit('sort', column.key)"
            >
              {{ column.label }}
              <span aria-hidden="true">{{ sortField === column.key ? (sortAscending ? '↑' : '↓') : '↕' }}</span>
            </button>
          </th>
          <th
            scope="col"
            class="row-actions sticky right-0 z-1 h-[36px] overflow-hidden border-b border-border-secondary px-[10px] py-0 text-left text-[12px] shadow-[-1px_0_var(--color-border-secondary)] [background:linear-gradient(var(--color-background-secondary),var(--color-background-secondary)),var(--color-background-tertiary)]"
          >
            {{ t('common.fileTable.actions') }}
          </th>
        </tr>
      </template>
      <template #default="{ item, index }">
        <tr
          v-if="viewMode === 'table'"
          class="file-row h-(--file-row-height) text-[13px] [--file-row-background:var(--color-background-primary)] hover:[--file-row-background:var(--color-background-secondary)] focus:outline-2 focus:-outline-offset-2 focus:outline-accent focus:outline-solid [&.is-selected]:text-accent [&.is-selected]:[--file-row-background:var(--color-background-secondary)]"
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
          <td
            class="selection-cell h-(--file-row-height) overflow-hidden border-b border-border-secondary bg-(--file-row-background) px-[10px] py-0 text-center"
          >
            <input
              class="h-[16px] w-[16px] cursor-pointer align-middle accent-accent focus-visible:outline-2 focus-visible:-outline-offset-2 focus-visible:outline-accent focus-visible:outline-solid"
              type="checkbox"
              :tabindex="keyOf(item) === focusKey ? 0 : -1"
              :checked="isSelected(item)"
              :aria-label="t('common.fileTable.selectFile', { name: item.fileName || keyOf(item) })"
              @click.stop="selectRow(item, index, $event, false)"
              @dblclick.stop
            />
          </td>
          <td
            v-for="column in columns"
            :key="column.key"
            class="h-(--file-row-height) overflow-hidden border-b border-border-secondary bg-(--file-row-background) px-[10px] py-0"
            :title="cellText(column, item)"
          >
            <button
              v-if="column.key === 'name'"
              type="button"
              class="file-name flex h-[calc(var(--file-row-height)-2px)] w-full min-w-0 cursor-pointer items-center gap-[8px] border-0 bg-transparent p-0 text-left text-inherit focus-visible:outline-2 focus-visible:-outline-offset-2 focus-visible:outline-accent focus-visible:outline-solid"
              :tabindex="keyOf(item) === focusKey ? 0 : -1"
              :aria-describedby="previewId"
              @focus="emit('preview', item, $event.currentTarget as Element)"
              @blur="emit('previewEnd')"
              @click.stop="emit('open', item, index)"
              @dblclick.stop
            >
              <span
                class="file-icon flex-none"
                title=""
                @mouseenter="emit('preview', item, $event.currentTarget as Element)"
                @mouseleave="emit('previewEnd')"
              >
                <FolderIcon v-if="item.isDir" :size="16" aria-hidden="true" />
                <FileIcon v-else :size="16" aria-hidden="true" />
              </span>
              <span class="file-name-label block truncate">{{ cellText(column, item) }}</span>
            </button>
            <span v-else class="cell-text block truncate">{{ cellText(column, item) }}</span>
          </td>
          <td
            class="row-actions sticky right-0 z-1 h-(--file-row-height) overflow-hidden border-b border-border-secondary px-[10px] py-0 shadow-[-1px_0_var(--color-border-secondary)] [background:linear-gradient(var(--file-row-background),var(--file-row-background)),var(--color-background-tertiary)]"
            @click.stop
            @dblclick.stop
          >
            <div
              class="action-buttons flex items-center justify-end gap-[4px] [&_button]:inline-flex [&_button]:h-[28px] [&_button]:w-[28px] [&_button]:cursor-pointer [&_button]:items-center [&_button]:justify-center [&_button]:rounded-[4px] [&_button]:border-0 [&_button]:bg-transparent [&_button]:p-[4px] [&_button]:text-secondary [&_button:disabled]:cursor-not-allowed [&_button:disabled]:opacity-40 [&_button:focus-visible]:outline-2 [&_button:focus-visible]:-outline-offset-2 [&_button:focus-visible]:outline-accent [&_button:focus-visible]:outline-solid [&_button:hover]:bg-accent [&_button:hover]:text-white"
            >
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
