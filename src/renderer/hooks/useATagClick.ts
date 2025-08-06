import { onMounted, onUnmounted } from 'vue'

import { IRPCActionType } from '@/utils/enum'

export function useATagClick () {
  const handleATagClick = (e: MouseEvent) => {
    if (e.target instanceof HTMLAnchorElement) {
      if (e.target.href) {
        e.preventDefault()
        window.electron.sendRPC(IRPCActionType.OPEN_URL, e.target.href)
      }
    }
  }
  onMounted(() => {
    document.addEventListener('click', handleATagClick)
  })
  onUnmounted(() => {
    document.removeEventListener('click', handleATagClick)
  })
}
