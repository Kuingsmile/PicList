<template>
  <div
    id="mini-page"
    class="group box-border h-screen w-screen overflow-hidden rounded-full border-2 border-white/90 bg-accent/50 outline-none select-none [.is-square]:rounded-none"
    :class="[{ 'is-square': osGlobal === 'linux' }, isMoving ? 'cursor-grabbing' : 'cursor-pointer']"
    tabindex="0"
    role="button"
    :aria-label="t('pages.upload.clickToUpload')"
    @keydown="onKeydown"
    @mouseenter="isHovered = true"
    @mouseleave="onMouseLeave"
  >
    <div
      ref="uploadArea"
      class="relative h-full w-full overflow-hidden rounded-[inherit]"
      @drop.prevent="onDrop"
      @dragover.prevent="dragover = true"
      @dragleave.prevent="dragover = false"
    >
      <img
        :src="logoPath || './squareLogo.png'"
        class="pointer-events-none block h-full w-full object-cover [transition:opacity_200ms_ease,transform_250ms_ease] motion-reduce:transition-none"
        :class="isLogoHidden ? 'scale-85 opacity-0' : isPressed ? 'scale-94' : isMoving ? '' : 'group-hover:scale-106'"
        :aria-hidden="isLogoHidden"
        alt="PicList"
        draggable="false"
        @dragstart.prevent
      />
      <div
        v-show="!isLogoHidden"
        class="pointer-events-none absolute inset-0 rounded-[inherit] ring-accent transition-colors duration-200 ring-inset group-hover:bg-white/10 group-focus-visible:ring-2 motion-reduce:transition-none"
        :class="{ 'bg-black/10': isPressed }"
        aria-hidden="true"
      />
      <Transition
        enter-active-class="[transition:opacity_200ms_ease,transform_250ms_ease] motion-reduce:transition-none"
        leave-active-class="[transition:opacity_200ms_ease,transform_250ms_ease] motion-reduce:transition-none"
        enter-from-class="opacity-0 scale-90"
        leave-to-class="opacity-0 scale-90"
      >
        <div
          v-if="isShowingProgress"
          class="pointer-events-none absolute inset-0 rounded-[inherit] bg-[radial-gradient(circle_at_35%_20%,color-mix(in_srgb,var(--progress-color)_24%,#1d3354),#0e1a2e_80%)] text-(--progress-color)"
          :style="{ '--progress-color': tone.color }"
          :role="uploadState === 'uploading' ? 'progressbar' : 'status'"
          :aria-label="progressLabel"
          :aria-valuenow="uploadState === 'uploading' && !isIndeterminate ? progress : undefined"
          :aria-valuemin="uploadState === 'uploading' ? 0 : undefined"
          :aria-valuemax="uploadState === 'uploading' ? 100 : undefined"
        >
          <svg
            class="absolute inset-0 h-full w-full -rotate-90 overflow-visible fill-none stroke-3 [stroke-linecap:round]"
            viewBox="0 0 64 64"
            aria-hidden="true"
          >
            <defs>
              <linearGradient :id="gradientId" x1="0" y1="0" x2="1" y2="1">
                <stop offset="0%" :stop-color="tone.from" class="[transition:stop-color_300ms_ease]" />
                <stop offset="100%" :stop-color="tone.to" class="[transition:stop-color_300ms_ease]" />
              </linearGradient>
            </defs>
            <circle class="stroke-white/10" cx="32" cy="32" r="27" />
            <g v-if="isIndeterminate" class="origin-center animate-mini-orbit [animation-duration:1.4s]">
              <circle
                class="blur-[2px] motion-reduce:hidden"
                :stroke="ringStroke"
                stroke-opacity="0.6"
                cx="32"
                cy="32"
                r="27"
                pathLength="100"
                stroke-dasharray="24 76"
              />
              <circle :stroke="ringStroke" cx="32" cy="32" r="27" pathLength="100" stroke-dasharray="24 76" />
            </g>
            <g v-else-if="progress > 0">
              <circle
                class="blur-[2px] [transition:stroke-dashoffset_450ms_cubic-bezier(0.22,1,0.36,1)] motion-reduce:hidden motion-reduce:transition-none"
                :class="uploadState === 'uploading' ? 'animate-mini-ring-breathe' : 'opacity-70'"
                :stroke="ringStroke"
                cx="32"
                cy="32"
                r="27"
                pathLength="100"
                stroke-dasharray="100"
                :stroke-dashoffset="100 - progress"
              />
              <circle
                class="[transition:stroke-dashoffset_450ms_cubic-bezier(0.22,1,0.36,1)] motion-reduce:transition-none"
                :stroke="ringStroke"
                cx="32"
                cy="32"
                r="27"
                pathLength="100"
                stroke-dasharray="100"
                :stroke-dashoffset="100 - progress"
              />
            </g>
          </svg>
          <div class="absolute inset-0 flex flex-col items-center justify-center gap-px" aria-hidden="true">
            <template v-if="uploadState === 'uploading'">
              <span v-if="fileCount" class="text-[8px] leading-[14px] font-semibold text-[#c3d4ec] tabular-nums">{{
                fileCount
              }}</span>
              <component
                :is="isSecondary ? DatabaseBackup : ArrowUp"
                v-else
                class="animate-mini-upload-lift motion-reduce:animate-none"
                :size="14"
                :stroke-width="2.5"
              />
              <span v-if="isIndeterminate" class="max-w-[44px] truncate text-[8px] leading-[1.5] font-semibold">{{
                phaseLabel
              }}</span>
              <span
                v-else
                class="text-[16px] leading-[1.15] font-bold text-white tabular-nums [&>span]:ml-px [&>span]:text-[9px] [&>span]:font-medium [&>span]:text-[#c3d4ec]"
                >{{ displayedProgress }}<span>%</span></span
              >
            </template>
            <template v-else>
              <span class="animate-mini-result-in motion-reduce:animate-none">
                <component
                  :is="resultIcon"
                  :class="{ 'animate-mini-shake motion-reduce:animate-none': uploadState === 'failed' }"
                  :size="fileCount ? 22 : 26"
                  :stroke-width="2.5"
                />
              </span>
              <span v-if="fileCount" class="text-[8px] leading-[1.4] font-semibold text-[#c3d4ec] tabular-nums">{{
                fileCount
              }}</span>
            </template>
          </div>
        </div>
      </Transition>
      <Transition
        enter-active-class="[transition:opacity_200ms_ease,transform_250ms_ease] motion-reduce:transition-none"
        leave-active-class="[transition:opacity_200ms_ease,transform_250ms_ease] motion-reduce:transition-none"
        enter-from-class="opacity-0 scale-90"
        leave-to-class="opacity-0 scale-90"
      >
        <div
          v-if="dragover"
          class="pointer-events-none absolute inset-[4px] grid place-items-center rounded-[inherit] border-2 border-dashed border-[#a9e8ff] bg-[#152d4f] text-white"
          aria-hidden="true"
        >
          <Upload :size="25" />
        </div>
      </Transition>
      <input id="file-uploader" ref="fileInput" type="file" class="hidden" multiple @change="onChange" />
    </div>
  </div>
</template>

<script lang="ts" setup>
import { ArrowUp, Check, DatabaseBackup, Minus, Upload, X } from '@lucide/vue'
import { TransitionPresets, usePreferredReducedMotion, useTransition } from '@vueuse/core'
import type { IConfig } from 'piclist'
import { computed, onBeforeMount, onBeforeUnmount, ref, useId, useTemplateRef } from 'vue'
import { useI18n } from 'vue-i18n'

import { useDragEventListeners } from '@/composables/useDragEventListeners'
import { osGlobal } from '@/composables/useGlobal'
import { getConfig } from '@/services/configService'
import { createUploadProgressTracker, type UploadProgressState } from '@/utils/uploadProgress'
import { UPDATE_MINI_ICON, UPLOAD_PROGRESS } from '#/constants/ipcChannels'
import { IRPCActionType } from '#/constants/rpcActions'
import { isUrl } from '#/utils/url'

defineOptions({ name: 'MiniPage' })

const logoPath = ref('')
const dragover = ref(false)
const progress = ref(0)
const progressState = ref<UploadProgressState>()
const isIndeterminate = computed(() => uploadState.value === 'uploading' && !!progressState.value?.indeterminate)
const phaseLabel = computed(() => t(`pages.upload.progress.${progressState.value?.phase || 'preparing'}`))
const uploadState = ref<'idle' | 'uploading' | 'completed' | 'failed' | 'cancelled'>('idle')
const isShowingProgress = computed(() => uploadState.value !== 'idle')
const isLogoHidden = computed(() => isShowingProgress.value || dragover.value)
const fileCount = computed(() => {
  const state = progressState.value
  return state && state.totalFiles > 1 ? `${Math.min(state.completedFiles, state.totalFiles)}/${state.totalFiles}` : ''
})
const isSecondary = computed(
  () => uploadState.value === 'uploading' && progressState.value?.destination === 'secondary',
)
// color drives the icon and text, from/to drive the ring gradient
const TONES = {
  primary: { color: '#86ddff', from: '#80edff', to: '#5795ff' },
  secondary: { color: '#cbb9ff', from: '#e2ccff', to: '#8b7bff' },
  completed: { color: '#73e6b1', from: '#a2f5cc', to: '#3fcf8e' },
  failed: { color: '#ff909b', from: '#ffb4a2', to: '#ff5f7a' },
  cancelled: { color: '#efcb85', from: '#f7e0a8', to: '#e5a84a' },
}
const tone = computed(() =>
  uploadState.value === 'uploading' || uploadState.value === 'idle'
    ? TONES[isSecondary.value ? 'secondary' : 'primary']
    : TONES[uploadState.value],
)
const RESULT_ICONS = { completed: Check, failed: X, cancelled: Minus }
const resultIcon = computed(() =>
  uploadState.value in RESULT_ICONS ? RESULT_ICONS[uploadState.value as keyof typeof RESULT_ICONS] : Check,
)
const reducedMotion = usePreferredReducedMotion()
const tweenedProgress = useTransition(progress, {
  duration: 450,
  easing: TransitionPresets.easeOutCubic,
  disabled: computed(() => reducedMotion.value === 'reduce'),
})
const displayedProgress = computed(() => Math.round(tweenedProgress.value))
const gradientId = useId()
const ringStroke = `url(#${gradientId})`
const { t } = useI18n()
const progressLabel = computed(() => {
  if (dragover.value) return t('pages.upload.dragFileToHere')
  switch (uploadState.value) {
    case 'uploading':
      return [
        progressState.value?.destination === 'secondary' ? t('pages.upload.progress.secondary') : '',
        phaseLabel.value,
        fileCount.value,
        isIndeterminate.value ? '' : `${progress.value}%`,
      ]
        .filter(Boolean)
        .join(' · ')
    case 'completed':
      return t('common.fileTable.tasks.uploaded')
    case 'failed':
      return t('common.fileTable.tasks.failed')
    case 'cancelled':
      return t('common.fileTable.tasks.canceled')
    default:
      return t('pages.upload.clickToUpload')
  }
})
// Pointer travel (px) before a press becomes a window move instead of a click
const MOVE_THRESHOLD = 3
const isPressed = ref(false)
const isMoving = ref(false)
let pointerStart: { button: number; pageX: number; pageY: number; screenX: number; screenY: number } | null = null
let pendingWindowPos: { x: number; y: number } | undefined
let moveFrame = 0
const uploadArea = useTemplateRef<HTMLDivElement>('uploadArea')
const fileInput = useTemplateRef<HTMLInputElement>('fileInput')

useDragEventListeners(uploadArea)

let removeListeners: () => void = () => {}
let removeIconListener: () => void = () => {}

async function initLogoPath() {
  const config = await getConfig<IConfig>()
  if (config && config.settings?.isCustomMiniIcon && config.settings?.customMiniIcon) {
    logoPath.value =
      'data:image/jpg;base64,' +
      (await window.electron.triggerRPC(IRPCActionType.MANAGE_CONVERT_PATH_TO_BASE64, config.settings.customMiniIcon))
  }
}

const trackUploadProgress = createUploadProgressTracker()
let progressHideTimer: ReturnType<typeof setTimeout> | undefined
const isHovered = ref(false)
let hideOnLeave = false

function scheduleProgressHide(delay: number) {
  clearTimeout(progressHideTimer)
  progressHideTimer = setTimeout(() => {
    // keep the result readable while the pointer rests on the widget
    if (isHovered.value) {
      hideOnLeave = true
      return
    }
    uploadState.value = 'idle'
    // reset once the overlay has faded out, so the next batch starts from an empty ring
    progressHideTimer = setTimeout(() => {
      progress.value = 0
      progressState.value = undefined
    }, 300)
  }, delay)
}

function onMouseLeave() {
  isHovered.value = false
  if (hideOnLeave) {
    hideOnLeave = false
    scheduleProgressHide(600)
  }
}

const uploadProgressHandler = (event: IUploadProgress) => {
  clearTimeout(progressHideTimer)
  hideOnLeave = false
  const state = trackUploadProgress(event)
  progressState.value = state
  progress.value = state.progress
  uploadState.value = state.activeCount
    ? 'uploading'
    : state.failed
      ? 'failed'
      : state.cancelled
        ? 'cancelled'
        : 'completed'
  if (!state.activeCount) scheduleProgressHide(state.failed ? 2800 : 1600)
}

const updateMiniIconHandler = async () => {
  await initLogoPath()
}

function onDrop(e: DragEvent) {
  dragover.value = false

  // send files first
  if (e.dataTransfer?.files?.length) {
    ipcSendFiles(e.dataTransfer.files)
  } else if (e.dataTransfer?.items) {
    const items = e.dataTransfer.items
    if (items.length === 2 && items[0].type === 'text/uri-list') {
      handleURLDrag(items, e.dataTransfer)
    } else if (items[0].type === 'text/plain') {
      const str = e.dataTransfer!.getData(items[0].type)
      if (isUrl(str)) {
        window.electron.sendRPC(IRPCActionType.UPLOAD_CHOOSED_FILES, [{ path: str }])
      }
    }
  }
}

function handleURLDrag(items: DataTransferItemList, dataTransfer: DataTransfer) {
  // text/html
  // Use this data to get a more precise URL
  const urlString = dataTransfer.getData(items[1].type)
  const urlMatch = urlString.match(/<img.*src="(.*?)"/)
  if (urlMatch) {
    window.electron.sendRPC(IRPCActionType.UPLOAD_CHOOSED_FILES, [
      {
        path: urlMatch[1],
      },
    ])
  }
}

function openUploadWindow() {
  fileInput.value?.click()
}

function onChange(e: Event) {
  const input = e.target as HTMLInputElement
  if (input.files?.length) ipcSendFiles(input.files)
  input.value = ''
}

function ipcSendFiles(files: FileList) {
  const sendFiles: IFileWithPath[] = []
  Array.from(files).forEach(item => {
    const obj = {
      name: item.name,
      path: window.electron.showFilePath(item),
    }
    sendFiles.push(obj)
  })
  window.electron.sendRPC(IRPCActionType.UPLOAD_CHOOSED_FILES, sendFiles)
}

function handleMouseDown(e: MouseEvent) {
  pointerStart = { button: e.button, pageX: e.pageX, pageY: e.pageY, screenX: e.screenX, screenY: e.screenY }
  isPressed.value = e.button === 0
  isMoving.value = false
}

function handleMouseMove(e: MouseEvent) {
  // only the left button moves the window
  if (pointerStart?.button !== 0) return
  e.preventDefault()
  e.stopPropagation()
  if (!isMoving.value) {
    if (Math.hypot(e.screenX - pointerStart.screenX, e.screenY - pointerStart.screenY) < MOVE_THRESHOLD) return
    isMoving.value = true
    isPressed.value = false
  }
  pendingWindowPos = { x: e.screenX - pointerStart.pageX, y: e.screenY - pointerStart.pageY }
  // coalesce mousemove bursts into one window move per frame
  moveFrame ||= requestAnimationFrame(flushWindowPos)
}

function flushWindowPos() {
  cancelAnimationFrame(moveFrame)
  moveFrame = 0
  if (!pendingWindowPos) return
  window.electron.sendRPC(IRPCActionType.SET_MINI_WINDOW_POS, { ...pendingWindowPos, width: 64, height: 64 })
  pendingWindowPos = undefined
}

function resetPointer() {
  pointerStart = null
  isPressed.value = false
  isMoving.value = false
}

function handleMouseUp() {
  if (!pointerStart) return
  const { button } = pointerStart
  const moved = isMoving.value
  resetPointer()
  if (moved) {
    flushWindowPos()
  } else if (button === 0) {
    openUploadWindow()
  } else if (button === 2) {
    openContextMenu()
  }
}

function onKeydown(e: KeyboardEvent) {
  if (e.key === 'Enter' || e.key === ' ') {
    e.preventDefault()
    openUploadWindow()
  } else if (e.key === 'ContextMenu' || (e.shiftKey && e.key === 'F10')) {
    e.preventDefault()
    openContextMenu()
  }
}

function openContextMenu() {
  window.electron.sendRPC(IRPCActionType.SHOW_MINI_PAGE_MENU)
}

onBeforeMount(async () => {
  removeListeners = window.electron.ipcRendererOn(UPLOAD_PROGRESS, uploadProgressHandler)
  removeIconListener = window.electron.ipcRendererOn(UPDATE_MINI_ICON, updateMiniIconHandler)
  window.electron.sendRPC(IRPCActionType.UPLOAD_PROGRESS_SUBSCRIBE)
  window.addEventListener('mousedown', handleMouseDown, false)
  window.addEventListener('mousemove', handleMouseMove, false)
  window.addEventListener('mouseup', handleMouseUp, false)
  window.addEventListener('blur', resetPointer, false)
  await initLogoPath()
})

onBeforeUnmount(() => {
  clearTimeout(progressHideTimer)
  cancelAnimationFrame(moveFrame)
  window.electron.sendRPC(IRPCActionType.UPLOAD_PROGRESS_UNSUBSCRIBE)
  removeListeners()
  removeIconListener()
  window.removeEventListener('mousedown', handleMouseDown, false)
  window.removeEventListener('mousemove', handleMouseMove, false)
  window.removeEventListener('mouseup', handleMouseUp, false)
  window.removeEventListener('blur', resetPointer, false)
})
</script>
