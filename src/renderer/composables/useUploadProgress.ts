import { computed, onBeforeMount, onBeforeUnmount, ref } from 'vue'
import { useI18n } from 'vue-i18n'

import { createUploadProgressTracker, type UploadProgressState } from '@/utils/uploadProgress'

export function useUploadProgress() {
  const { t } = useI18n()
  const progress = ref(0)
  const showProgress = ref(false)
  const showError = ref(false)
  const progressState = ref<UploadProgressState>()
  const trackUploadProgress = createUploadProgressTracker()
  let progressVersion = 0
  let progressHideTimer: ReturnType<typeof setTimeout> | undefined
  let progressResetTimer: ReturnType<typeof setTimeout> | undefined
  let removeProgressListener: () => void = () => {}

  const progressLabel = computed(() => {
    const state = progressState.value
    if (!state) return t('pages.upload.progress.preparing')
    if (!state.activeCount) {
      if (state.failed) return t('pages.upload.uploadFailed')
      if (state.cancelled) return t('common.fileTable.tasks.canceled')
      return t('common.fileTable.tasks.uploaded')
    }
    const phase = t(`pages.upload.progress.${state.phase}`)
    return state.destination === 'secondary' ? `${t('pages.upload.progress.secondary')} · ${phase}` : phase
  })

  function clearProgressTimers() {
    clearTimeout(progressHideTimer)
    clearTimeout(progressResetTimer)
    progressHideTimer = undefined
    progressResetTimer = undefined
  }

  function scheduleProgressReset() {
    const version = progressVersion
    progressHideTimer = setTimeout(() => {
      progressHideTimer = undefined
      if (version !== progressVersion) return
      showProgress.value = false
      showError.value = false
    }, 1000)
    progressResetTimer = setTimeout(() => {
      progressResetTimer = undefined
      if (version !== progressVersion) return
      progress.value = 0
    }, 1200)
  }

  function handleUploadProgress(event: IUploadProgress) {
    progressVersion++
    const state = trackUploadProgress(event)
    progressState.value = state
    showProgress.value = true
    showError.value = !state.activeCount && state.failed
    progress.value = state.progress
    clearProgressTimers()
    if (!state.activeCount) scheduleProgressReset()
  }

  onBeforeMount(() => {
    removeProgressListener = window.electron.ipcRendererOn('uploadProgress', handleUploadProgress)
  })

  onBeforeUnmount(() => {
    clearProgressTimers()
    removeProgressListener()
  })

  return { progress, showProgress, showError, progressState, progressLabel }
}
