import type { MaybeRefOrGetter } from 'vue'
import { computed, ref, toValue, watch } from 'vue'

export interface UseVirtualGridOptions {
  items: MaybeRefOrGetter<any[]>
  itemHeight: number
  containerHeight: MaybeRefOrGetter<number>
  gridItems?: number | MaybeRefOrGetter<number>
  bufferFactor?: number
}

export function useVirtualGrid(options: UseVirtualGridOptions) {
  const { items, itemHeight, containerHeight, gridItems = 1, bufferFactor = 0.5 } = options

  const scrollTop = ref(0)

  const gridCalculations = computed(() => {
    const currentItems = toValue(items)
    const itemsPerRow = Math.max(1, toValue(gridItems) || 1)
    const totalRows = Math.ceil(currentItems.length / itemsPerRow)
    const totalHeight = totalRows * itemHeight

    return {
      itemsPerRow,
      totalRows,
      itemHeight,
      totalHeight,
    }
  })

  const visibleRange = computed(() => {
    const { itemHeight, totalRows } = gridCalculations.value
    const height = toValue(containerHeight)

    if (!height || !itemHeight || totalRows === 0) {
      return { startRow: 0, endRow: 0, visibleRows: 0 }
    }
    const buffer = Math.ceil((height / itemHeight) * bufferFactor)
    const startRow = Math.max(0, Math.floor(scrollTop.value / itemHeight) - buffer)
    const visibleRows = Math.ceil(height / itemHeight) + buffer * 2
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
        if (itemIndex < toValue(items).length) {
          indexes.push(itemIndex)
        }
      }
    }

    return indexes
  })

  const viewportOffset = computed(() => {
    const { itemHeight } = gridCalculations.value
    const { startRow } = visibleRange.value
    return startRow * itemHeight
  })

  function updateScrollTop(newScrollTop: number) {
    scrollTop.value = newScrollTop
  }

  function scrollToItem(index: number) {
    const { itemsPerRow, itemHeight } = gridCalculations.value
    const rowIndex = Math.floor(index / itemsPerRow)
    scrollTop.value = rowIndex * itemHeight
  }

  function scrollToTop() {
    scrollTop.value = 0
  }

  function scrollToBottom() {
    const { totalHeight } = gridCalculations.value
    scrollTop.value = Math.max(0, totalHeight - toValue(containerHeight))
  }

  watch(
    () => [toValue(containerHeight), toValue(items).length],
    ([newHeight]) => {
      const { totalHeight } = gridCalculations.value
      const maxScroll = Math.max(0, totalHeight - (newHeight as number))

      if (scrollTop.value > maxScroll) {
        scrollTop.value = maxScroll
      }
    },
    { flush: 'post' },
  )

  return {
    gridCalculations,
    visibleIndexes,
    viewportOffset,
    updateScrollTop,
    scrollToItem,
    scrollToTop,
    scrollToBottom,
  }
}
