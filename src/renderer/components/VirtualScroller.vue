<template>
  <div
    ref="containerRef"
    class="relative overflow-auto will-change-transform contain-[layout_style_paint] [-webkit-overflow-scrolling:touch]"
    @scroll="handleScroll"
  >
    <div class="relative w-full" :style="contentStyles">
      <div
        class="group absolute inset-[0_auto_auto_0] w-full will-change-transform backface-hidden [.is-grid]:grid [.is-grid]:auto-rows-(--row-height,1px) [.is-grid]:grid-cols-[repeat(var(--items-per-row,1),minmax(0,1fr))] [.is-grid]:gap-(--item-gap,0)"
        :class="{ 'is-grid': isGridMode, 'is-list': !isGridMode }"
        :style="viewportStyle"
      >
        <div
          v-for="realIndex in visibleIndexes"
          :key="items[realIndex] && items[realIndex][keyField || 'id'] ? items[realIndex][keyField || 'id'] : realIndex"
          class="w-full"
          :style="itemStyle"
        >
          <slot :item="items[realIndex]" :index="realIndex" />
        </div>
      </div>
    </div>
  </div>
</template>

<script setup lang="ts">
import { computed, onBeforeUnmount, onMounted, ref, useTemplateRef } from 'vue'

import { useVirtualGrid } from '@/hooks/useVirtualGrid'

interface Breakpoint {
  min: number
  cols: number
}

const {
  items,
  itemHeight,
  gridBreakpoints = [],
  bufferFactor = 0.5,
  keyField = 'id',
  itemPadding = 8,
  viewMode = 'grid',
} = defineProps<{
  items: any[]
  itemHeight: number
  gridBreakpoints?: Breakpoint[]
  bufferFactor?: number
  keyField?: string
  itemPadding?: number
  viewMode?: 'list' | 'grid'
}>()

const containerRef = useTemplateRef('containerRef')
const containerHeight = ref(0)
const containerWidth = ref<number>(0)
const parentScrollListeners = ref<HTMLElement[]>([])
const lastScrollTime = ref(0)
let ro: ResizeObserver | null = null

const sortedBreakpoints = computed<Breakpoint[]>(() => [...gridBreakpoints].sort((a, b) => a.min - b.min))

const effectiveCols = computed<number>(() => {
  if (viewMode === 'list') return 1
  const w = containerWidth.value || 0
  let cols = 1
  for (const bp of sortedBreakpoints.value) {
    if (w >= bp.min) cols = Math.max(1, bp.cols)
  }
  return cols
})

const isGridMode = computed(() => effectiveCols.value > 1)

const { gridCalculations, visibleIndexes, viewportOffset, updateScrollTop, scrollToItem, scrollToTop, scrollToBottom } =
  useVirtualGrid({
    items: () => items,
    itemHeight,
    containerHeight,
    gridItems: effectiveCols,
    bufferFactor,
  })

const contentStyles = computed(() => ({
  height: `${gridCalculations.value.totalHeight}px`,
}))

const viewportStyle = computed(() => {
  const base: Record<string, string> = {
    transform: `translateY(${viewportOffset.value}px)`,
  }
  if (isGridMode.value) {
    base['--items-per-row'] = String(effectiveCols.value)
    base['--row-height'] = `${itemHeight}px`
    base['--item-gap'] = `${itemPadding}px`
  }
  return base
})

const itemStyle = computed(() => (isGridMode.value ? {} : { height: `${itemHeight}px` }))

function handleScroll() {
  const c = containerRef.value
  if (!c) return
  updateScrollTop(c.scrollTop)
}

function handlePageScroll() {
  const now = Date.now()
  if (now - lastScrollTime.value < 16) return
  lastScrollTime.value = now

  updateContainerMetrics()
  const el = containerRef.value
  if (!el) return

  const rect = el.getBoundingClientRect()
  const viewportHeight = window.innerHeight

  const intersectionTop = Math.max(0, -rect.top)
  const intersectionBottom = Math.min(rect.height, viewportHeight - rect.top)
  const intersectionHeight = Math.max(0, intersectionBottom - intersectionTop)

  if (intersectionHeight > 0) {
    updateScrollTop(intersectionTop)
  }
}

function updateContainerMetrics() {
  if (!containerRef.value) return
  const rect = containerRef.value.getBoundingClientRect()
  containerWidth.value = rect.width
  containerHeight.value = Math.max(200, window.innerHeight - rect.top - 12)
}

function scrollTo(index: number) {
  scrollToItem(index)
}

function refresh() {
  updateContainerMetrics()
  if (containerRef.value) {
    updateScrollTop(containerRef.value.scrollTop)
  }
  handlePageScroll()
}

onMounted(() => {
  if (!containerRef.value) return
  ro = new ResizeObserver(updateContainerMetrics)
  ro.observe(containerRef.value)

  ro.observe(document.documentElement)
  window.addEventListener('scroll', handlePageScroll, { passive: true })
  let parent = containerRef.value.parentElement
  while (parent) {
    if (parent.scrollHeight > parent.clientHeight) {
      parent.addEventListener('scroll', handlePageScroll, { passive: true })
      parentScrollListeners.value.push(parent)
    }
    parent = parent.parentElement
  }

  updateContainerMetrics()

  window.addEventListener('resize', updateContainerMetrics, { passive: true })
})

onBeforeUnmount(() => {
  if (ro) ro.disconnect()
  window.removeEventListener('resize', updateContainerMetrics)
  window.removeEventListener('scroll', handlePageScroll)
  parentScrollListeners.value.forEach(parent => {
    parent.removeEventListener('scroll', handlePageScroll)
  })
  parentScrollListeners.value = []
})

defineExpose({ scrollTo, scrollToTop, scrollToBottom, refresh })
</script>

<style scoped>
.virtual-scroller {
  position: relative;
  overflow: auto;
  contain: layout style paint;
  will-change: transform;
  -webkit-overflow-scrolling: touch;
}

.virtual-scroller-content {
  position: relative;
  width: 100%;
}

/* Base viewport (list mode) stacks children; offset applied via translateY */
.virtual-scroller-viewport {
  position: absolute;
  inset: 0 auto auto 0;
  will-change: transform;
  backface-visibility: hidden;
  width: 100%;
}

.virtual-scroller-viewport.is-grid {
  display: grid;
  width: 100%;
  grid-template-columns: repeat(var(--items-per-row, 1), minmax(0, 1fr));
  grid-auto-rows: var(--row-height, 1px);
  gap: var(--item-gap, 0);
}

.virtual-scroller-viewport.is-list .virtual-scroller-item {
  width: 100%;
}

.virtual-scroller-viewport.is-grid .virtual-scroller-item {
  width: 100%;
}
</style>
