import { type ObjectDirective, shallowRef } from 'vue'

export type TooltipPlacement = 'top' | 'bottom' | 'left' | 'right'
export interface TooltipOptions {
  content: string
  placement?: TooltipPlacement
  markdown?: boolean
}
type TooltipValue = string | TooltipOptions | null | undefined
interface ActiveTooltip extends TooltipOptions {
  anchor: HTMLElement
  visible: boolean
}

export const tooltipId = 'piclist-custom-tooltip'
export const activeTooltip = shallowRef<ActiveTooltip | null>(null)
let showTimer: ReturnType<typeof setTimeout> | undefined
let hideTimer: ReturnType<typeof setTimeout> | undefined

function removeDescription(anchor: HTMLElement) {
  const ids = (anchor.getAttribute('aria-describedby') || '').split(/\s+/).filter(id => id && id !== tooltipId)
  if (ids.length) anchor.setAttribute('aria-describedby', ids.join(' '))
  else anchor.removeAttribute('aria-describedby')
}

function addDescription(anchor: HTMLElement) {
  const ids = new Set((anchor.getAttribute('aria-describedby') || '').split(/\s+/).filter(Boolean))
  ids.add(tooltipId)
  anchor.setAttribute('aria-describedby', [...ids].join(' '))
}

export function cancelTooltipHide() {
  clearTimeout(hideTimer)
  hideTimer = undefined
}

export function dismissTooltip(anchor?: HTMLElement) {
  if (anchor && activeTooltip.value?.anchor !== anchor) return
  clearTimeout(showTimer)
  showTimer = undefined
  cancelTooltipHide()
  if (activeTooltip.value) removeDescription(activeTooltip.value.anchor)
  activeTooltip.value = null
}

export function scheduleTooltipHide(anchor?: HTMLElement) {
  if (anchor && activeTooltip.value?.anchor !== anchor) return
  // A pending hint should never appear after its trigger has been left.
  clearTimeout(showTimer)
  showTimer = undefined
  cancelTooltipHide()
  hideTimer = setTimeout(() => dismissTooltip(anchor), 140)
}

function showTooltip(anchor: HTMLElement, options: TooltipOptions, delay: number) {
  if (!options.content.trim()) return dismissTooltip(anchor)
  if (activeTooltip.value?.anchor === anchor && activeTooltip.value.visible) {
    cancelTooltipHide()
    addDescription(anchor)
    activeTooltip.value = { ...options, anchor, visible: true }
    return
  }
  dismissTooltip()
  activeTooltip.value = { ...options, anchor, visible: false }
  const reveal = () => {
    showTimer = undefined
    const hint = activeTooltip.value
    if (hint?.anchor !== anchor) return
    if (!anchor.isConnected || !anchor.getClientRects().length) return dismissTooltip(anchor)
    addDescription(anchor)
    activeTooltip.value = { ...hint, visible: true }
  }
  if (delay) showTimer = setTimeout(reveal, delay)
  else reveal()
}

interface TooltipBinding {
  options: TooltipOptions
  overflowOnly: boolean
  hovered: boolean
  focused: boolean
  cleanup: () => void
}
const bindings = new WeakMap<HTMLElement, TooltipBinding>()

function normalize(value: TooltipValue): TooltipOptions {
  return typeof value === 'string' ? { content: value } : value || { content: '' }
}

function canShow(anchor: HTMLElement, binding: TooltipBinding) {
  if (!binding.options.content.trim()) return false
  if (!binding.overflowOnly) return true
  const text = anchor.querySelector<HTMLElement>('[data-tooltip-overflow]') || anchor
  return text.scrollWidth > text.clientWidth || text.scrollHeight > text.clientHeight
}

/** Shared hint behavior without wrappers that would change control or table layout. */
export const vTooltip: ObjectDirective<HTMLElement, TooltipValue> = {
  mounted(anchor, { value, modifiers }) {
    const binding: TooltipBinding = {
      options: normalize(value),
      overflowOnly: !!modifiers.overflow,
      hovered: false,
      focused: false,
      cleanup: () => {},
    }
    const enter = (event: PointerEvent) => {
      if (event.pointerType === 'touch') return
      binding.hovered = true
      if (canShow(anchor, binding)) showTooltip(anchor, binding.options, 350)
    }
    const leave = () => {
      binding.hovered = false
      if (!binding.focused) scheduleTooltipHide(anchor)
    }
    const focus = () => {
      binding.focused = true
      if (canShow(anchor, binding)) showTooltip(anchor, binding.options, 0)
    }
    const blur = (event: FocusEvent) => {
      if (event.relatedTarget instanceof Node && anchor.contains(event.relatedTarget)) return
      binding.focused = false
      if (!binding.hovered) scheduleTooltipHide(anchor)
    }
    const dismiss = () => dismissTooltip(anchor)
    anchor.addEventListener('pointerenter', enter)
    anchor.addEventListener('pointerleave', leave)
    anchor.addEventListener('focusin', focus)
    anchor.addEventListener('focusout', blur)
    anchor.addEventListener('click', dismiss, true)
    binding.cleanup = () => {
      dismiss()
      anchor.removeEventListener('pointerenter', enter)
      anchor.removeEventListener('pointerleave', leave)
      anchor.removeEventListener('focusin', focus)
      anchor.removeEventListener('focusout', blur)
      anchor.removeEventListener('click', dismiss, true)
    }
    bindings.set(anchor, binding)
  },
  updated(anchor, { value, modifiers }) {
    const binding = bindings.get(anchor)
    if (!binding) return
    binding.options = normalize(value)
    binding.overflowOnly = !!modifiers.overflow
    if (activeTooltip.value?.anchor !== anchor) return
    if (!canShow(anchor, binding)) dismissTooltip(anchor)
    else {
      if (activeTooltip.value.visible) addDescription(anchor)
      // Keep the original delay during polling, locale switches and row updates.
      activeTooltip.value = { ...binding.options, anchor, visible: activeTooltip.value.visible }
    }
  },
  beforeUnmount(anchor) {
    bindings.get(anchor)?.cleanup()
    bindings.delete(anchor)
  },
}

declare module 'vue' {
  interface GlobalDirectives {
    vTooltip: typeof vTooltip
  }
}
