import { onMounted, onUnmounted } from 'vue'

import { IRPCActionType } from '@/utils/enum'

export function useATagClick() {
  const handleATagClick = (e: MouseEvent) => {
    if (e.defaultPrevented || !(e.target instanceof Element)) return
    const anchor = e.target.closest<HTMLAnchorElement>('a[href]')
    if (!anchor?.href || anchor.hasAttribute('download')) return
    let target: URL
    try {
      target = new URL(anchor.href)
    } catch {
      return
    }
    const current = new URL(window.location.href)
    // Same-document links retain native hash scrolling and router navigation.
    if (target.origin === current.origin && target.pathname === current.pathname && target.search === current.search)
      return
    e.preventDefault()
    window.electron.sendRPC(IRPCActionType.OPEN_URL, anchor.href)
  }

  onMounted(() => {
    document.addEventListener('click', handleATagClick)
  })

  onUnmounted(() => {
    document.removeEventListener('click', handleATagClick)
  })
}
