<template>
  <div ref="containerRef" class="virtual-scroller" @scroll="handleScroll">
    <table
      v-if="viewMode === 'table'"
      class="virtual-table"
      :style="{ minWidth: `${tableMinWidth}px` }"
      :aria-label="tableLabel"
      :aria-rowcount="items.length + 1"
    >
      <slot name="columns" />
      <thead ref="headerRef">
        <slot name="header" />
      </thead>
      <tbody>
        <tr v-if="viewportOffset > 0" aria-hidden="true">
          <td :colspan="tableColumns" class="virtual-spacer" :style="{ height: `${viewportOffset}px` }" />
        </tr>
        <slot v-for="index in visibleIndexes" :key="itemKey(items[index], index)" :item="items[index]" :index="index" />
        <tr v-if="bottomSpace > 0" aria-hidden="true">
          <td :colspan="tableColumns" class="virtual-spacer" :style="{ height: `${bottomSpace}px` }" />
        </tr>
      </tbody>
    </table>
    <div v-else class="virtual-content" :style="{ height: `${gridCalculations.totalHeight}px` }">
      <div class="virtual-viewport" :style="viewportStyle">
        <div
          v-for="index in visibleIndexes"
          :key="itemKey(items[index], index)"
          :style="{ height: `${itemHeight}px`, minWidth: 0 }"
        >
          <slot :item="items[index]" :index="index" />
        </div>
      </div>
    </div>
  </div>
</template>

<script setup lang="ts">
import {
  computed,
  nextTick,
  onActivated,
  onBeforeUnmount,
  onDeactivated,
  onMounted,
  ref,
  useTemplateRef,
  watch,
} from 'vue'

import { useVirtualGrid } from '@/composables/useVirtualGrid'

interface Breakpoint {
  min: number
  cols: number
}

export interface ScrollAnchor {
  key: string | number
  index: number
  fraction: number
}

const {
  items,
  itemHeight,
  gridBreakpoints = [],
  bufferFactor = 0.5,
  keyField = 'id',
  itemPadding = 8,
  viewMode = 'grid',
  tableColumns = 1,
  tableMinWidth = 800,
  tableLabel = '',
} = defineProps<{
  items: any[]
  itemHeight: number
  gridBreakpoints?: Breakpoint[]
  bufferFactor?: number
  keyField?: string
  itemPadding?: number
  viewMode?: 'list' | 'grid' | 'table'
  tableColumns?: number
  tableMinWidth?: number
  tableLabel?: string
}>()

const emit = defineEmits<(e: 'visibleIndexesChange', indexes: number[]) => void>()
const containerRef = useTemplateRef('containerRef')
const headerRef = useTemplateRef('headerRef')
const containerHeight = ref(0)
const containerWidth = ref(0)
let observer: ResizeObserver | undefined
let anchor: ScrollAnchor | undefined
let restoring = false
let restoreVersion = 0
let active = true

const itemKey = (item: any, index: number): string | number => item?.[keyField] ?? index
const itemKeys = computed(() => items.map(itemKey))
const sortedBreakpoints = computed(() => [...gridBreakpoints].sort((a, b) => a.min - b.min))
const effectiveCols = computed(() => {
  if (viewMode !== 'grid') return 1
  let cols = 1
  for (const bp of sortedBreakpoints.value) {
    if (containerWidth.value >= bp.min) cols = Math.max(1, bp.cols)
  }
  return cols
})

const { gridCalculations, visibleIndexes, viewportOffset, scrollTop, updateScrollTop } = useVirtualGrid({
  items: () => items,
  itemHeight: () => itemHeight,
  rowGap: () => (viewMode === 'grid' ? itemPadding : 0),
  containerHeight,
  gridItems: effectiveCols,
  bufferFactor,
})

const bottomSpace = computed(() =>
  Math.max(0, gridCalculations.value.totalHeight - viewportOffset.value - visibleIndexes.value.length * itemHeight),
)
const viewportStyle = computed(() => ({
  transform: `translateY(${viewportOffset.value}px)`,
  display: 'grid',
  gridTemplateColumns: `repeat(${effectiveCols.value}, minmax(0, 1fr))`,
  gap: viewMode === 'grid' ? `${itemPadding}px` : '0',
}))

function captureAnchor(): ScrollAnchor | undefined {
  const { rowStride, itemsPerRow } = gridCalculations.value
  const row = Math.floor(scrollTop.value / rowStride)
  const index = Math.min(items.length - 1, row * itemsPerRow)
  if (index < 0) return undefined
  return { key: itemKey(items[index], index), index, fraction: (scrollTop.value - row * rowStride) / rowStride }
}

function scrollToOffset(offset: number) {
  const container = containerRef.value
  if (!container) return
  updateScrollTop(offset)
  container.scrollTop = scrollTop.value
  updateScrollTop(container.scrollTop)
  anchor = captureAnchor()
}

async function restoreAnchor(saved = anchor) {
  if (!active) return
  const version = ++restoreVersion
  restoring = true
  await nextTick()
  if (version !== restoreVersion || !containerRef.value) return
  measure()
  // Wait for the new spacer height before assigning scrollTop (the browser clamps it).
  await nextTick()
  if (version !== restoreVersion || !containerRef.value) return
  const found = saved ? itemKeys.value.indexOf(saved.key) : -1
  const index = Math.max(0, Math.min(items.length - 1, found < 0 ? (saved?.index ?? 0) : found))
  const { rowStride, itemsPerRow } = gridCalculations.value
  scrollToOffset((Math.floor(index / itemsPerRow) + (saved?.fraction ?? 0)) * rowStride)
  restoring = false
}

function measure() {
  const container = containerRef.value
  if (!container) return
  const style = getComputedStyle(container)
  containerWidth.value = container.clientWidth - parseFloat(style.paddingLeft) - parseFloat(style.paddingRight)
  containerHeight.value = Math.max(
    0,
    container.clientHeight -
      parseFloat(style.paddingTop) -
      parseFloat(style.paddingBottom) -
      (headerRef.value?.offsetHeight ?? 0),
  )
}

function handleScroll() {
  if (restoring || !containerRef.value) return
  updateScrollTop(containerRef.value.scrollTop)
  anchor = captureAnchor()
}

function scrollTo(index: number, align: 'start' | 'nearest' = 'start') {
  const { rowStride, itemsPerRow } = gridCalculations.value
  const top = Math.floor(Math.max(0, Math.min(index, items.length - 1)) / itemsPerRow) * rowStride
  if (align === 'nearest' && top >= scrollTop.value && top + itemHeight <= scrollTop.value + containerHeight.value)
    return
  scrollToOffset(align === 'nearest' && top > scrollTop.value ? top + itemHeight - containerHeight.value : top)
}

function refresh() {
  if (!active) return
  measure()
  void restoreAnchor()
}

watch(
  [itemKeys, () => itemHeight, () => viewMode, effectiveCols],
  () => {
    void restoreAnchor()
  },
  { flush: 'pre' },
)
watch(visibleIndexes, indexes => emit('visibleIndexesChange', indexes), { immediate: true, flush: 'post' })

onMounted(() => {
  observer = new ResizeObserver(refresh)
  observer.observe(containerRef.value!)
  refresh()
})
onActivated(() => {
  active = true
  refresh()
})
onDeactivated(() => {
  active = false
  restoreVersion++
  restoring = false
})
onBeforeUnmount(() => {
  active = false
  restoreVersion++
  observer?.disconnect()
})

defineExpose({
  scrollTo,
  scrollToTop: () => scrollToOffset(0),
  scrollToBottom: () => scrollToOffset(gridCalculations.value.totalHeight),
  refresh,
  captureAnchor,
  restoreAnchor,
  pageSize: computed(() => Math.max(1, Math.floor(containerHeight.value / itemHeight))),
})
</script>

<style scoped>
.virtual-scroller {
  position: relative;
  overflow: auto;
  min-height: 0;
  min-width: 0;
  overflow-anchor: none;
  contain: layout style;
}

.virtual-content {
  position: relative;
  width: 100%;
}

.virtual-viewport {
  position: absolute;
  inset: 0 auto auto 0;
  width: 100%;
}

.virtual-table {
  width: 100%;
  table-layout: fixed;
  border-spacing: 0;
  border-collapse: separate;
}

thead {
  position: sticky;
  top: 0;
  z-index: 3;
}

.virtual-spacer {
  padding: 0;
  border: 0;
  line-height: 0;
}
</style>
