<template>
  <Teleport to="body">
    <div
      v-if="activeTooltip?.visible"
      :id="tooltipId"
      ref="tooltipRef"
      role="tooltip"
      class="group/tooltip fixed z-100000 w-max max-w-[min(320px,calc(100vw-16px))] animate-tooltip-appear rounded-[10px] border border-border bg-(--tooltip-surface) text-[12px] leading-[1.55] font-medium wrap-anywhere text-main shadow-[0_4px_12px_rgb(0_0_0/8%),0_12px_32px_rgb(0_0_0/12%)] backdrop-blur-[20px] backdrop-saturate-140 select-text [--tooltip-surface:color-mix(in_srgb,var(--color-surface-elevated)_96%,var(--color-accent))] no-drag-region motion-reduce:animate-none"
      :data-placement="position.placement"
      :style="{
        left: `${position.left}px`,
        top: `${position.top}px`,
        visibility: ready ? 'visible' : 'hidden',
        '--tooltip-arrow': `${position.arrow}px`,
      }"
      @pointerenter="cancelTooltipHide"
      @pointerleave="scheduleTooltipHide()"
    >
      <span
        class="absolute size-[8px] rotate-45 border-border bg-(--tooltip-surface) group-data-[placement=bottom]/tooltip:top-[-5px] group-data-[placement=bottom]/tooltip:left-[calc(var(--tooltip-arrow)-4px)] group-data-[placement=bottom]/tooltip:border-t group-data-[placement=bottom]/tooltip:border-l group-data-[placement=left]/tooltip:top-[calc(var(--tooltip-arrow)-4px)] group-data-[placement=left]/tooltip:right-[-5px] group-data-[placement=left]/tooltip:border-t group-data-[placement=left]/tooltip:border-r group-data-[placement=right]/tooltip:top-[calc(var(--tooltip-arrow)-4px)] group-data-[placement=right]/tooltip:left-[-5px] group-data-[placement=right]/tooltip:border-b group-data-[placement=right]/tooltip:border-l group-data-[placement=top]/tooltip:bottom-[-5px] group-data-[placement=top]/tooltip:left-[calc(var(--tooltip-arrow)-4px)] group-data-[placement=top]/tooltip:border-r group-data-[placement=top]/tooltip:border-b"
        aria-hidden="true"
      />
      <div
        v-if="activeTooltip.markdown"
        class="relative max-h-[calc(100vh-18px)] overflow-auto rounded-[inherit] px-[12px] py-[8px] whitespace-normal [&_a]:text-accent [&_a]:underline [&_img]:max-w-full [&_p]:m-0 [&_p+p]:mt-[6px]"
        v-html="markdownHtml"
      />
      <div
        v-else
        class="relative max-h-[calc(100vh-18px)] overflow-auto rounded-[inherit] px-[12px] py-[8px] whitespace-pre-line"
      >
        {{ activeTooltip.content }}
      </div>
    </div>
  </Teleport>
</template>

<script setup lang="ts">
import { useEventListener } from '@vueuse/core'
import { computed, nextTick, onBeforeUnmount, ref, useTemplateRef, watch } from 'vue'

import {
  activeTooltip,
  cancelTooltipHide,
  dismissTooltip,
  scheduleTooltipHide,
  tooltipId,
  type TooltipPlacement,
} from '@/directives/tooltip'
import { renderMarkdown } from '@/utils/markdown'

const tooltipRef = useTemplateRef('tooltipRef')
const ready = ref(false)
const position = ref({ left: 0, top: 0, arrow: 0, placement: 'top' as TooltipPlacement })
const markdownHtml = computed(() => {
  if (!activeTooltip.value?.markdown) return ''
  try {
    return renderMarkdown(activeTooltip.value.content, false)
  } catch (_error) {
    return ''
  }
})
let frame: number | undefined

function updatePosition() {
  const hint = activeTooltip.value
  const tooltip = tooltipRef.value
  if (!hint?.visible || !tooltip) return
  if (!hint.anchor.isConnected || !hint.anchor.getClientRects().length) return dismissTooltip()

  const anchor = hint.anchor.getBoundingClientRect()
  const { width, height } = tooltip.getBoundingClientRect()
  const margin = 8
  const gap = 10
  const viewportWidth = document.documentElement.clientWidth
  const viewportHeight = document.documentElement.clientHeight
  const spaces = {
    top: anchor.top - gap - margin,
    bottom: viewportHeight - anchor.bottom - gap - margin,
    left: anchor.left - gap - margin,
    right: viewportWidth - anchor.right - gap - margin,
  }
  let placement = hint.placement || 'top'
  const opposite: Record<TooltipPlacement, TooltipPlacement> = {
    top: 'bottom',
    bottom: 'top',
    left: 'right',
    right: 'left',
  }
  const vertical = placement === 'top' || placement === 'bottom'
  const size = vertical ? height : width
  if (spaces[placement] < size && spaces[opposite[placement]] > spaces[placement]) placement = opposite[placement]

  let left = anchor.left + (anchor.width - width) / 2
  let top = anchor.top + (anchor.height - height) / 2
  if (placement === 'top') top = anchor.top - height - gap
  else if (placement === 'bottom') top = anchor.bottom + gap
  else if (placement === 'left') left = anchor.left - width - gap
  else left = anchor.right + gap
  left = Math.max(margin, Math.min(left, viewportWidth - width - margin))
  top = Math.max(margin, Math.min(top, viewportHeight - height - margin))
  const center = vertical ? anchor.left + anchor.width / 2 - left : anchor.top + anchor.height / 2 - top
  const arrow = Math.max(12, Math.min(center, (vertical ? width : height) - 12))
  const previous = position.value
  if (left !== previous.left || top !== previous.top || arrow !== previous.arrow || placement !== previous.placement) {
    position.value = { left, top, arrow, placement }
  }
  ready.value = true
  // Follow moving controls and dismiss hints whose ancestors become hidden.
  frame = requestAnimationFrame(updatePosition)
}

watch(activeTooltip, async (hint, previous, onCleanup) => {
  let cancelled = false
  onCleanup(() => {
    cancelled = true
    if (frame !== undefined) cancelAnimationFrame(frame)
  })
  if (frame !== undefined) cancelAnimationFrame(frame)
  if (hint?.anchor !== previous?.anchor) ready.value = false
  await nextTick()
  if (!cancelled) updatePosition()
})

function dismissOutsideTooltip(event: Event) {
  if (event.target instanceof Node && tooltipRef.value?.contains(event.target)) return
  dismissTooltip()
}

useEventListener(window, 'scroll', dismissOutsideTooltip, { capture: true })
useEventListener(window, 'resize', () => dismissTooltip())
useEventListener(window, 'blur', () => dismissTooltip())
useEventListener(document, 'pointerdown', dismissOutsideTooltip, { capture: true })
useEventListener(document, 'keydown', event => {
  if (event.key === 'Escape') dismissTooltip()
})
useEventListener(document, 'visibilitychange', () => {
  if (document.hidden) dismissTooltip()
})
onBeforeUnmount(() => {
  if (frame !== undefined) cancelAnimationFrame(frame)
  dismissTooltip()
})
</script>
