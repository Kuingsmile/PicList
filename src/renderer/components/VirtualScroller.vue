<template>
  <div ref="containerRef" class="virtual-scroller" :style="{ height: `${containerHeight}px` }" @scroll="handleScroll">
    <div class="virtual-scroller-content" :style="contentStyles">
      <div
        class="virtual-scroller-viewport"
        :class="{ 'is-grid': isGridMode, 'is-list': !isGridMode }"
        :style="viewportStyle"
      >
        <div
          v-for="realIndex in visibleIndexes"
          :key="
            itemsRef[realIndex] && itemsRef[realIndex][props.keyField || 'id']
              ? itemsRef[realIndex][props.keyField || 'id']
              : realIndex
          "
          class="virtual-scroller-item"
          :style="itemStyle"
        >
          <slot :item="itemsRef[realIndex]" :index="realIndex" />
        </div>
      </div>
    </div>
  </div>
</template>

<script setup lang="ts">
import { computed, onBeforeUnmount, onMounted, ref, useTemplateRef, watch } from 'vue'

import { useVirtualGrid } from '@/hooks/useVirtualGrid'

type Item = any
interface Breakpoint {
  min: number
  cols: number
}

const props = withDefaults(
  defineProps<{
    items: Item[]
    itemHeight: number
    height?: number
    gridItems?: number
    gridBreakpoints?: Breakpoint[]
    bufferFactor?: number
    pageMode?: boolean
    keyField?: string
    itemPadding?: number
    viewMode?: 'list' | 'grid'
  }>(),
  {
    height: 400,
    gridItems: 1,
    gridBreakpoints: () => [],
    bufferFactor: 0.5,
    pageMode: false,
    keyField: 'id',
    itemPadding: 0,
    viewMode: 'grid',
  },
)

const containerRef = useTemplateRef('containerRef')
const containerHeight = ref<number>(props.pageMode ? 0 : props.height)
const containerWidth = ref<number>(0)
const parentScrollListeners = ref<HTMLElement[]>([])

const itemsRef = ref<Item[]>(props.items)
watch(
  () => props.items,
  v => {
    itemsRef.value = v
  },
)

const localViewMode = ref<'list' | 'grid'>(props.viewMode)
watch(
  () => props.viewMode,
  v => {
    localViewMode.value = v
  },
)

const sortedBreakpoints = computed<Breakpoint[]>(() => [...props.gridBreakpoints].sort((a, b) => a.min - b.min))

const isForcedList = computed(() => localViewMode.value === 'list')

const effectiveCols = computed<number>(() => {
  if (isForcedList.value) return 1

  const base = Math.max(1, props.gridItems || 1)

  const w = containerWidth.value || 0
  let cols = base
  for (const bp of sortedBreakpoints.value) {
    if (w >= bp.min) cols = Math.max(1, bp.cols)
  }
  return cols
})

const isGridMode = computed(() => effectiveCols.value > 1)

const { gridCalculations, visibleIndexes, viewportOffset, updateScrollTop, scrollToItem, scrollToTop, scrollToBottom } =
  useVirtualGrid({
    items: itemsRef,
    itemHeight: props.itemHeight,
    containerHeight,
    gridItems: effectiveCols,
    bufferFactor: props.bufferFactor,
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
    base['--row-height'] = `${props.itemHeight}px`
    base['--item-gap'] = `${props.itemPadding}px`
  }
  return base
})

const itemStyle = computed(() => (isGridMode.value ? {} : { height: `${props.itemHeight}px` }))

function handleScroll() {
  const c = containerRef.value
  if (!c) return
  updateScrollTop(c.scrollTop)
}

function handlePageScroll() {
  if (!props.pageMode) return
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

let ro: ResizeObserver | null = null
const lastScrollTime = ref(0)

function updateContainerMetrics() {
  const el = containerRef.value
  if (!el) return
  const rect = el.getBoundingClientRect()
  containerWidth.value = rect.width
  if (props.pageMode) {
    containerHeight.value = Math.max(200, window.innerHeight - rect.top - 12)
  } else {
    containerHeight.value = props.height
  }
}

onMounted(() => {
  const el = containerRef.value
  if (!el) return
  ro = new ResizeObserver(updateContainerMetrics)
  ro.observe(el as unknown as Element)
  if (props.pageMode) {
    ro.observe(document.documentElement)
    window.addEventListener('scroll', handlePageScroll, { passive: true })
    let parent = el.parentElement
    while (parent) {
      if (parent.scrollHeight > parent.clientHeight) {
        parent.addEventListener('scroll', handlePageScroll, { passive: true })
        parentScrollListeners.value.push(parent)
      }
      parent = parent.parentElement
    }
  }
  updateContainerMetrics()
  if (props.pageMode) {
    window.addEventListener('resize', updateContainerMetrics, { passive: true })
  }
})

onBeforeUnmount(() => {
  if (ro) ro.disconnect()
  window.removeEventListener('resize', updateContainerMetrics)
  if (props.pageMode) {
    window.removeEventListener('scroll', handlePageScroll)
    parentScrollListeners.value.forEach(parent => {
      parent.removeEventListener('scroll', handlePageScroll)
    })
    parentScrollListeners.value = []
  }
})

function scrollTo(index: number) {
  scrollToItem(index)
}

function setViewMode(mode: 'list' | 'grid') {
  localViewMode.value = mode
}
function toggleViewMode() {
  setViewMode(isGridMode.value ? 'list' : 'grid')
}

function refresh() {
  updateContainerMetrics()
  if (containerRef.value) {
    updateScrollTop(containerRef.value.scrollTop)
  }
  if (props.pageMode) {
    handlePageScroll()
  }
}

defineExpose({ scrollTo, scrollToTop, scrollToBottom, setViewMode, toggleViewMode, refresh })
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
