import { computed, onScopeDispose, type Ref, ref, shallowRef, watch } from 'vue'

import { prepareGalleryItems } from '@/utils/galleryItems'
import { IRPCActionType } from '#/constants/rpcActions'
import { GALLERY_READ_LIMIT } from '#/galleryQuery'

export async function fetchGalleryRows(ids: string[]) {
  const rows = await window.electron.triggerRPC<ImgInfo[]>(IRPCActionType.GALLERY_GET_ROWS, ids)
  if (!Array.isArray(rows) || rows.length !== ids.length) throw new Error('Gallery records changed')
  return rows
}

export function useGalleryWindow(
  ids: Ref<string[]>,
  visibleIndexes: Ref<number[]>,
  previewIndex: Ref<number | undefined>,
  active: Ref<boolean>,
) {
  const rows = shallowRef(new Map<string, IGalleryItem>())
  const failed = ref(false)
  let reading = false
  let disposed = false
  let generation = 0
  const wanted = computed(() => {
    const keys = new Set<string>()
    if (!active.value) return keys
    const records = ids.value
    const slide = previewIndex.value
    if (slide !== undefined) {
      for (const key of records.slice(Math.max(0, slide - 2), slide + 3)) keys.add(key)
    }
    const indexes = visibleIndexes.value
    const first = Math.min(indexes[0] ?? 0, Math.max(0, records.length - 1))
    const last = indexes.at(-1) ?? first
    // Advance the read-ahead window in blocks so moving one row doesn't issue another IPC.
    const block = 64
    const start = Math.max(0, (Math.floor(first / block) - 1) * block)
    const end = (Math.floor(last / block) + 2) * block
    for (const key of records.slice(start, end)) keys.add(key)
    return keys
  })

  async function fill() {
    if (reading || disposed) return
    reading = true
    try {
      while (!disposed) {
        const target = wanted.value
        const version = generation
        const missing = [...target].filter(key => !rows.value.has(key)).slice(0, GALLERY_READ_LIMIT)
        const retained = new Map([...rows.value].filter(([key]) => target.has(key)))
        if (!missing.length) {
          if (retained.size !== rows.value.size) rows.value = retained
          failed.value = false
          return
        }
        try {
          const batch = await fetchGalleryRows(missing)
          if (disposed || version !== generation) continue
          for (const item of prepareGalleryItems(batch)) {
            if (wanted.value.has(item.key)) retained.set(item.key, item)
          }
          rows.value = retained
        } catch {
          if (target !== wanted.value || version !== generation) continue
          failed.value = true
          return
        }
      }
    } finally {
      reading = false
    }
  }

  watch(wanted, fill)
  onScopeDispose(() => {
    disposed = true
  })
  function reset() {
    generation++
    rows.value = new Map()
    failed.value = false
    void fill()
  }
  return { rows, failed, reset }
}
