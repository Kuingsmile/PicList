import type { Ref } from 'vue'
import { computed, isRef, ref, watch } from 'vue'

export interface UseVirtualGridOptions {
  items: Ref<any[]>
  itemHeight: number
  containerHeight: Ref<number>
  gridItems?: number | Ref<number>
  bufferFactor?: number
}

export function useVirtualGrid (options: UseVirtualGridOptions) {
  const {
    items,
    itemHeight,
    containerHeight,
    gridItems = 1,
    bufferFactor = 0.5
  } = options

  const gridItemsRef = isRef(gridItems) ? gridItems : ref(gridItems)
  const scrollTop = ref(0)

  const gridCalculations = computed(() => {
    const itemsPerRow = Math.max(1, gridItemsRef.value || 1)
    const totalRows = Math.ceil(items.value.length / itemsPerRow)
    const rowHeight = itemHeight
    const totalHeight = totalRows * rowHeight

    return {
      itemsPerRow,
      totalRows,
      rowHeight,
      totalHeight
    }
  })

  const visibleRange = computed(() => {
    const { rowHeight, totalRows } = gridCalculations.value
    const height = containerHeight.value

    if (!height || !rowHeight || totalRows === 0) {
      return { startRow: 0, endRow: 0, visibleRows: 0 }
    }

    const buffer = Math.ceil(height / rowHeight * bufferFactor)
    const startRow = Math.max(0, Math.floor(scrollTop.value / rowHeight) - buffer)
    const visibleRows = Math.ceil(height / rowHeight) + buffer * 2
    const endRow = Math.min(totalRows, startRow + visibleRows)

    return { startRow, endRow, visibleRows }
  })

  const visibleIndexes = computed(() => {
    const { itemsPerRow } = gridCalculations.value
    const { startRow, endRow } = visibleRange.value
    const indexes: number[] = []

    for (let rowIndex = startRow; rowIndex < endRow; rowIndex++) {
      for (let col = 0; col < itemsPerRow; col++) {
        const itemIndex = rowIndex * itemsPerRow + col
        if (itemIndex < items.value.length) {
          indexes.push(itemIndex)
        }
      }
    }

    return indexes
  })

  const viewportOffset = computed(() => {
    const { rowHeight } = gridCalculations.value
    const { startRow } = visibleRange.value
    return startRow * rowHeight
  })

  function updateScrollTop (newScrollTop: number) {
    scrollTop.value = newScrollTop
  }

  function scrollToItem (index: number) {
    const { itemsPerRow, rowHeight } = gridCalculations.value
    const rowIndex = Math.floor(index / itemsPerRow)
    scrollTop.value = rowIndex * rowHeight
  }

  function scrollToTop () {
    scrollTop.value = 0
  }

  function scrollToBottom () {
    const { totalHeight } = gridCalculations.value
    scrollTop.value = Math.max(0, totalHeight - containerHeight.value)
  }

  watch(containerHeight, () => {
    const { totalHeight } = gridCalculations.value
    if (scrollTop.value > totalHeight - containerHeight.value) {
      scrollTop.value = Math.max(0, totalHeight - containerHeight.value)
    }
  })

  return {
    gridCalculations,
    visibleIndexes,
    viewportOffset,
    updateScrollTop,
    scrollToItem,
    scrollToTop,
    scrollToBottom
  }
}
