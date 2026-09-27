import { computed, onScopeDispose, shallowRef } from 'vue'

import { loadFilePreview, type PreviewKind, type PreviewSource } from '@/manage/utils/filePreview'

export function useFilePreview() {
  const preview = shallowRef<{ kind: PreviewKind; content: string; mimeType?: string }>()
  let controller: AbortController | undefined
  let objectUrl = ''

  function close() {
    controller?.abort()
    controller = undefined
    preview.value = undefined
    if (objectUrl) URL.revokeObjectURL(objectUrl)
    objectUrl = ''
  }

  async function open(kind: PreviewKind, source: PreviewSource) {
    close()
    const request = new AbortController()
    controller = request
    try {
      const content = await loadFilePreview(kind, source, request.signal)
      // Signing RPCs cannot be cancelled; an older request must never reopen a preview.
      if (request.signal.aborted) return
      if (typeof content === 'string') {
        preview.value = { kind, content, mimeType: source.mimeType }
      } else {
        objectUrl = URL.createObjectURL(content)
        // Servers may return application/octet-stream, and blob URLs have no file extension.
        const mimeType = /^(video|audio)\//.test(content.type) ? content.type : source.mimeType
        preview.value = { kind, content: objectUrl, mimeType }
      }
    } catch (error) {
      if (!request.signal.aborted) throw error
    }
  }

  function visible(kind: PreviewKind) {
    return computed({
      get: () => preview.value?.kind === kind,
      set: (value: boolean) => {
        if (!value) close()
      },
    })
  }

  const videoSources = computed(() =>
    preview.value?.kind === 'video' ? [{ src: preview.value.content, type: preview.value.mimeType }] : [],
  )

  onScopeDispose(close)
  return { preview, videoSources, open, close, visible }
}
