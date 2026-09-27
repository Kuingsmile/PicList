import type { MaybeRefOrGetter } from 'vue'
import { computed, ref, toValue, watch } from 'vue'

export interface UseVirtualGridOptions {
  items: MaybeRefOrGetter<any[]>
  itemHeight: MaybeRefOrGetter<number>
  rowGap?: MaybeRefOrGetter<number>
  containerHeight: MaybeRefOrGetter<number>
  gridItems?: number | MaybeRefOrGetter<number>
  bufferFactor?: number
}

export function useVirtualGrid(options: UseVirtualGridOptions) {
  const { items, itemHeight, rowGap = 0, containerHeight, gridItems = 1, bufferFactor = 0.5 } = options

  const scrollTop = ref(0)

  const gridCalculations = computed(() => {
    const currentItems = toValue(items)
    const itemsPerRow = Math.max(1, toValue(gridItems) || 1)
    const totalRows = Math.ceil(currentItems.length / itemsPerRow)
    const currentItemHeight = Math.max(1, toValue(itemHeight))
    const gap = Math.max(0, toValue(rowGap))
    const rowStride = currentItemHeight + gap
    const totalHeight = totalRows * currentItemHeight + Math.max(0, totalRows - 1) * gap

    return {
      itemsPerRow,
      totalRows,
      itemHeight: currentItemHeight,
      rowStride,
      totalHeight,
    }
  })

  const visibleRange = computed(() => {
    const { rowStride, totalRows } = gridCalculations.value
    const height = toValue(containerHeight)

    if (!height || !rowStride || totalRows === 0) {
      return { startRow: 0, endRow: 0, visibleRows: 0 }
    }
    const buffer = Math.ceil((height / rowStride) * bufferFactor)
    const offset = Math.min(scrollTop.value, Math.max(0, gridCalculations.value.totalHeight - height))
    const startRow = Math.max(0, Math.floor(offset / rowStride) - buffer)
    const endRow = Math.min(totalRows, Math.ceil((offset + height) / rowStride) + buffer)
    const visibleRows = endRow - startRow
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
    const { rowStride } = gridCalculations.value
    const { startRow } = visibleRange.value
    return startRow * rowStride
  })

  function updateScrollTop(newScrollTop: number) {
    scrollTop.value = Math.max(
      0,
      Math.min(newScrollTop, Math.max(0, gridCalculations.value.totalHeight - toValue(containerHeight))),
    )
  }

  function scrollToItem(index: number) {
    const { itemsPerRow, rowStride } = gridCalculations.value
    const rowIndex = Math.floor(Math.max(0, Math.min(index, toValue(items).length - 1)) / itemsPerRow)
    updateScrollTop(rowIndex * rowStride)
    return scrollTop.value
  }

  function scrollToTop() {
    scrollTop.value = 0
  }

  function scrollToBottom() {
    const { totalHeight } = gridCalculations.value
    scrollTop.value = Math.max(0, totalHeight - toValue(containerHeight))
  }

  watch(
    [() => toValue(containerHeight), () => gridCalculations.value.totalHeight],
    ([newHeight, totalHeight]) => {
      const maxScroll = Math.max(0, totalHeight - newHeight)

      if (scrollTop.value > maxScroll) {
        scrollTop.value = maxScroll
      }
    },
    { flush: 'post' },
  )

  return {
    scrollTop,
    gridCalculations,
    visibleIndexes,
    viewportOffset,
    updateScrollTop,
    scrollToItem,
    scrollToTop,
    scrollToBottom,
  }
}
