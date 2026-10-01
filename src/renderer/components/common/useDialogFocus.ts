import {
  computed,
  type MaybeRefOrGetter,
  nextTick,
  onBeforeUnmount,
  onUnmounted,
  shallowRef,
  toValue,
  useId,
  watch,
} from 'vue'

const openDialogs = shallowRef<string[]>([])

export function useDialogFocus(open: MaybeRefOrGetter<boolean>) {
  let returnFocus: HTMLElement | null = null
  const dialogId = `dialog-${useId()}`
  const isTopmost = computed(() => openDialogs.value.at(-1) === dialogId)
  const unregister = () => {
    openDialogs.value = openDialogs.value.filter(id => id !== dialogId)
  }

  watch(
    () => toValue(open),
    visible => {
      unregister()
      if (visible) {
        const active = document.activeElement
        // Queued prompts can reopen before their previous leave transition finishes.
        if (
          active instanceof HTMLElement &&
          active.closest('[data-dialog-id]')?.getAttribute('data-dialog-id') !== dialogId
        ) {
          returnFocus = active
        }
        openDialogs.value = [...openDialogs.value, dialogId]
      }
    },
    { immediate: true, flush: 'sync' },
  )

  async function restoreFocus(force = false) {
    await nextTick()
    if ((force || !toValue(open)) && returnFocus?.isConnected && !returnFocus.closest('[inert]')) {
      returnFocus.focus({ preventScroll: true })
      returnFocus = null
    }
  }

  onBeforeUnmount(unregister)
  onUnmounted(() => void restoreFocus(true))
  return { dialogId, isTopmost, restoreFocus: () => restoreFocus() }
}
