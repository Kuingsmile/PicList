import { onBeforeUnmount, onMounted, type Ref } from 'vue'

export function useDragEventListeners(dropZoneRef: Ref<HTMLElement | null>) {
  function disableDrag(e: DragEvent) {
    const dropzone = dropZoneRef.value
    if (!dropzone || !dropzone.contains(e.target as Node)) {
      e.preventDefault()
      if (e.dataTransfer) {
        e.dataTransfer.effectAllowed = 'none'
        e.dataTransfer.dropEffect = 'none'
      }
    }
  }

  onMounted(() => {
    window.addEventListener('dragenter', disableDrag, false)
    window.addEventListener('dragover', disableDrag, false)
    window.addEventListener('drop', disableDrag, false)
  })

  onBeforeUnmount(() => {
    window.removeEventListener('dragenter', disableDrag, false)
    window.removeEventListener('dragover', disableDrag, false)
    window.removeEventListener('drop', disableDrag, false)
  })
}
