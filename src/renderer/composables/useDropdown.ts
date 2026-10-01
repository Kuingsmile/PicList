import { onClickOutside, useEventListener } from '@vueuse/core'
import { nextTick, ref } from 'vue'

export function useDropdown({ minWidth = 160, maxHeight = 200 } = {}) {
  const dropdownRef = ref<HTMLElement | null>(null)
  const triggerRef = ref<HTMLButtonElement | null>(null)
  const optionsRef = ref<HTMLElement | null>(null)
  const dropDownOpen = ref(false)
  let search = ''
  let lastSearchTime = 0

  const items = () =>
    Array.from(optionsRef.value?.querySelectorAll<HTMLElement>('[data-dropdown-item]:not(:disabled)') || [])

  function closeDropdown(restoreFocus = false) {
    dropDownOpen.value = false
    search = ''
    if (restoreFocus) triggerRef.value?.focus({ preventScroll: true })
  }

  function updatePosition() {
    if (!dropDownOpen.value || !triggerRef.value || !optionsRef.value) return
    const rect = triggerRef.value.getBoundingClientRect()
    const dropdown = optionsRef.value
    const margin = 8
    const gap = 4
    const viewportWidth = window.innerWidth
    const viewportHeight = window.innerHeight
    const spaceBelow = Math.max(0, viewportHeight - rect.bottom - margin - gap)
    const spaceAbove = Math.max(0, rect.top - margin - gap)
    const above = spaceBelow < Math.min(maxHeight, dropdown.scrollHeight) && spaceAbove > spaceBelow
    const height = Math.max(1, Math.min(maxHeight, above ? spaceAbove : spaceBelow))
    const width = Math.max(1, Math.min(Math.max(rect.width, minWidth), viewportWidth - margin * 2))
    dropdown.style.maxHeight = `${height}px`
    dropdown.style.width = `${width}px`
    const actualHeight = Math.min(dropdown.scrollHeight, height)
    dropdown.style.top = `${Math.max(margin, Math.min(above ? rect.top - actualHeight - gap : rect.bottom + gap, viewportHeight - actualHeight - margin))}px`
    dropdown.style.left = `${Math.max(margin, Math.min(rect.left, viewportWidth - width - margin))}px`
  }

  async function openDropdown(position?: 'first' | 'last') {
    if (triggerRef.value?.disabled) return
    dropDownOpen.value = true
    await nextTick()
    if (!dropDownOpen.value) return
    updatePosition()
    const options = items()
    const selected = options.find(
      item => item.getAttribute('aria-selected') === 'true' || (item instanceof HTMLInputElement && item.checked),
    )
    const target = position === 'last' ? options.at(-1) : position === 'first' ? options[0] : selected || options[0]
    target?.focus({ preventScroll: true })
    target?.scrollIntoView({ block: 'nearest' })
  }

  function toggleDropdown() {
    if (dropDownOpen.value) closeDropdown()
    else void openDropdown()
  }

  function handleTriggerKeydown(event: KeyboardEvent) {
    if (['ArrowDown', 'ArrowUp', 'Home', 'End'].includes(event.key)) {
      event.preventDefault()
      void openDropdown(event.key === 'ArrowUp' || event.key === 'End' ? 'last' : 'first')
    } else if (event.key === 'Escape' && dropDownOpen.value) {
      event.preventDefault()
      event.stopPropagation()
      closeDropdown(true)
    }
  }

  function handleOptionsKeydown(event: KeyboardEvent) {
    if (event.key === 'Escape') {
      event.preventDefault()
      event.stopPropagation()
      closeDropdown(true)
      return
    }
    if (event.key === 'Tab') {
      closeDropdown(true)
      if (event.shiftKey) event.preventDefault()
      return
    }
    const options = items()
    if (options.length === 0) return
    const currentIndex = options.indexOf(document.activeElement as HTMLElement)
    let target: HTMLElement | undefined
    if (event.key === 'ArrowDown') target = options[(currentIndex + 1) % options.length]
    else if (event.key === 'ArrowUp') target = options[(currentIndex - 1 + options.length) % options.length]
    else if (event.key === 'Home') target = options[0]
    else if (event.key === 'End') target = options.at(-1)
    else if (event.key.length === 1 && event.key !== ' ' && !event.ctrlKey && !event.metaKey && !event.altKey) {
      const now = Date.now()
      search = now - lastSearchTime > 500 ? event.key : search + event.key
      lastSearchTime = now
      const query = search.toLocaleLowerCase()
      target = options.find(item =>
        (item.closest('label')?.textContent || item.textContent)?.trim().toLocaleLowerCase().startsWith(query),
      )
    }
    if (target) {
      event.preventDefault()
      target.focus({ preventScroll: true })
      target.scrollIntoView({ block: 'nearest' })
    }
  }

  onClickOutside(dropdownRef, () => closeDropdown())
  useEventListener(window, 'resize', updatePosition)
  useEventListener(document, 'scroll', updatePosition, { capture: true, passive: true })

  return {
    dropdownRef,
    triggerRef,
    optionsRef,
    dropDownOpen,
    toggleDropdown,
    closeDropdown,
    handleTriggerKeydown,
    handleOptionsKeydown,
  }
}
