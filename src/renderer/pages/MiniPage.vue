<template>
  <div id="mini-page" class="mini-page" :class="{ 'mini-page-square': osGlobal === 'linux' }" :title="progressLabel">
    <div
      ref="uploadArea"
      class="mini-upload-area"
      @drop.prevent="onDrop"
      @dragover.prevent="dragover = true"
      @dragleave.prevent="dragover = false"
    >
      <img
        :src="logoPath ? logoPath : './squareLogo.png'"
        class="mini-logo"
        :class="{ 'mini-logo-hidden': isShowingProgress || dragover }"
        :aria-hidden="isShowingProgress || dragover"
        alt="PicList"
        draggable="false"
        @dragstart.prevent
      />
      <Transition name="mini-progress">
        <div
          v-if="isShowingProgress"
          class="mini-progress"
          :class="`mini-progress-${uploadState}`"
          :role="uploadState === 'uploading' ? 'progressbar' : 'status'"
          :aria-label="progressLabel"
          :aria-valuenow="uploadState === 'uploading' && !isIndeterminate ? progress : undefined"
          :aria-valuemin="uploadState === 'uploading' ? 0 : undefined"
          :aria-valuemax="uploadState === 'uploading' ? 100 : undefined"
        >
          <svg class="mini-progress-ring" viewBox="0 0 64 64" aria-hidden="true">
            <defs>
              <linearGradient :id="gradientId" x1="0" y1="0" x2="1" y2="1">
                <stop offset="0%" stop-color="#80edff" />
                <stop offset="100%" stop-color="#5795ff" />
              </linearGradient>
            </defs>
            <circle class="mini-progress-track" cx="32" cy="32" r="27" />
            <circle
              v-show="!isIndeterminate"
              class="mini-progress-value"
              cx="32"
              cy="32"
              r="27"
              pathLength="100"
              :stroke="`url(#${gradientId})`"
              :stroke-dashoffset="100 - progress"
            />
            <circle
              v-if="uploadState === 'uploading'"
              class="mini-progress-orbit"
              :class="{ 'mini-progress-indeterminate': isIndeterminate }"
              cx="32"
              cy="32"
              r="27"
              pathLength="100"
            />
          </svg>
          <div class="mini-progress-content" aria-hidden="true">
            <template v-if="uploadState === 'uploading'">
              <ArrowUp class="mini-upload-arrow" :size="14" :stroke-width="2.5" />
              <span v-if="isIndeterminate" class="mini-progress-stage">{{ phaseLabel }}</span>
              <span v-else class="mini-progress-percent">{{ progress }}<span>%</span></span>
            </template>
            <Check v-else-if="uploadState === 'completed'" class="mini-result-icon" :size="27" :stroke-width="2.5" />
            <X v-else-if="uploadState === 'failed'" class="mini-result-icon" :size="25" :stroke-width="2.5" />
            <Minus v-else class="mini-result-icon" :size="25" :stroke-width="2.5" />
          </div>
        </div>
      </Transition>
      <Transition name="mini-progress">
        <div v-if="dragover" class="mini-drop-indicator" aria-hidden="true">
          <Upload :size="25" />
        </div>
      </Transition>
      <input id="file-uploader" ref="fileInput" type="file" class="hidden" multiple @change="onChange" />
    </div>
  </div>
</template>

<script lang="ts" setup>
import { ArrowUp, Check, Minus, Upload, X } from '@lucide/vue'
import type { IConfig } from 'piclist'
import { computed, onBeforeMount, onBeforeUnmount, ref, useId, useTemplateRef } from 'vue'
import { useI18n } from 'vue-i18n'

import { useDragEventListeners } from '@/composables/useDragEventListeners'
import { osGlobal } from '@/composables/useGlobal'
import { getConfig } from '@/services/configService'
import { createUploadProgressTracker, type UploadProgressState } from '@/utils/uploadProgress'
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
const gradientId = useId()
const { t } = useI18n()
const progressLabel = computed(() => {
  if (dragover.value) return t('pages.upload.dragFileToHere')
  switch (uploadState.value) {
    case 'uploading':
      return [
        progressState.value?.destination === 'secondary' ? t('pages.upload.progress.secondary') : '',
        phaseLabel.value,
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
const draggingState = ref(false)
const wX = ref(-1)
const wY = ref(-1)
const screenX = ref(-1)
const screenY = ref(-1)
const uploadArea = useTemplateRef<HTMLDivElement>('uploadArea')
const fileInput = useTemplateRef<HTMLInputElement>('fileInput')

useDragEventListeners(uploadArea)

let removeListeners: () => void = () => {}
let removeIconListener: () => void = () => {}

async function initLogoPath() {
  const config = await getConfig<IConfig>()
  if (config) {
    if (config.settings?.isCustomMiniIcon && config.settings?.customMiniIcon) {
      logoPath.value =
        'data:image/jpg;base64,' +
        (await window.electron.triggerRPC(IRPCActionType.MANAGE_CONVERT_PATH_TO_BASE64, config.settings.customMiniIcon))
    }
  }
}

const trackUploadProgress = createUploadProgressTracker()
let progressHideTimer: ReturnType<typeof setTimeout> | undefined
const uploadProgressHandler = (event: IUploadProgress) => {
  clearTimeout(progressHideTimer)
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
  if (!state.activeCount) {
    progressHideTimer = setTimeout(
      () => {
        uploadState.value = 'idle'
      },
      state.failed ? 2400 : 1600,
    )
  }
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
  draggingState.value = true
  wX.value = e.pageX
  wY.value = e.pageY
  screenX.value = e.screenX
  screenY.value = e.screenY
}

function handleMouseMove(e: MouseEvent) {
  e.preventDefault()
  e.stopPropagation()
  if (draggingState.value) {
    const xLoc = e.screenX - wX.value
    const yLoc = e.screenY - wY.value
    window.electron.sendRPC(IRPCActionType.SET_MINI_WINDOW_POS, {
      x: xLoc,
      y: yLoc,
      width: 64,
      height: 64,
    })
  }
}

function handleMouseUp(e: MouseEvent) {
  draggingState.value = false
  if (screenX.value === e.screenX && screenY.value === e.screenY) {
    if (e.button === 0) {
      // left mouse
      openUploadWindow()
    } else {
      openContextMenu()
    }
  }
}

function openContextMenu() {
  window.electron.sendRPC(IRPCActionType.SHOW_MINI_PAGE_MENU)
}

onBeforeMount(async () => {
  removeListeners = window.electron.ipcRendererOn('uploadProgress', uploadProgressHandler)
  removeIconListener = window.electron.ipcRendererOn('updateMiniIcon', updateMiniIconHandler)
  window.electron.sendRPC(IRPCActionType.UPLOAD_PROGRESS_SUBSCRIBE)
  window.addEventListener('mousedown', handleMouseDown, false)
  window.addEventListener('mousemove', handleMouseMove, false)
  window.addEventListener('mouseup', handleMouseUp, false)
  await initLogoPath()
})

onBeforeUnmount(() => {
  clearTimeout(progressHideTimer)
  window.electron.sendRPC(IRPCActionType.UPLOAD_PROGRESS_UNSUBSCRIBE)
  removeListeners()
  removeIconListener()
  window.removeEventListener('mousedown', handleMouseDown, false)
  window.removeEventListener('mousemove', handleMouseMove, false)
  window.removeEventListener('mouseup', handleMouseUp, false)
})
</script>

<style scoped>
.mini-page {
  box-sizing: border-box;
  width: 100vw;
  height: 100vh;
  overflow: hidden;
  cursor: pointer;
  border: 2px solid rgb(255 255 255 / 90%);
  border-radius: 50%;
  background: var(--color-accent, #007aff);
  user-select: none;
}

.mini-page-square {
  border-radius: 0;
}

.mini-upload-area {
  position: relative;
  width: 100%;
  height: 100%;
  overflow: hidden;
  border-radius: inherit;
}

.mini-logo {
  display: block;
  width: 100%;
  height: 100%;
  object-fit: cover;
  pointer-events: none;
  transition:
    opacity 200ms ease,
    transform 250ms ease;
}

.mini-logo-hidden {
  opacity: 0;
  transform: scale(0.85);
}

.mini-progress {
  --progress-color: #86ddff;

  position: absolute;
  inset: 0;
  border-radius: inherit;
  background: radial-gradient(circle at 35% 20%, #243e62, #101d33 80%);
  color: var(--progress-color);
  pointer-events: none;
}

.mini-progress-ring {
  position: absolute;
  inset: 0;
  width: 100%;
  height: 100%;
  overflow: visible;
  fill: none;
  stroke-width: 3;
  transform: rotate(-90deg);
}

.mini-progress-track {
  stroke: rgb(255 255 255 / 12%);
}

.mini-progress-value {
  stroke-dasharray: 100;
  stroke-linecap: round;
  transition:
    stroke-dashoffset 450ms cubic-bezier(0.22, 1, 0.36, 1),
    stroke 200ms ease;
}

.mini-progress-orbit {
  stroke: rgb(223 249 255 / 75%);
  stroke-dasharray: 3 97;
  stroke-linecap: round;
  transform-origin: center;
  animation: mini-orbit 2.4s linear infinite;
}

.mini-progress-indeterminate {
  stroke-dasharray: 22 78;
  animation-duration: 1.4s;
}

.mini-progress-stage {
  max-width: 44px;
  overflow: hidden;
  font-size: 8px;
  font-weight: 600;
  line-height: 1.5;
  text-overflow: ellipsis;
  white-space: nowrap;
}

.mini-progress-content {
  position: absolute;
  inset: 0;
  display: flex;
  flex-direction: column;
  align-items: center;
  justify-content: center;
  gap: 1px;
}

.mini-upload-arrow {
  animation: mini-upload-lift 1.4s ease-in-out infinite;
}

.mini-progress-percent {
  color: #ffffff;
  font-size: 16px;
  font-weight: 700;
  font-variant-numeric: tabular-nums;
  line-height: 1.15;
}

.mini-progress-percent span {
  margin-left: 1px;
  color: #bfd3ee;
  font-size: 9px;
  font-weight: 500;
}

.mini-progress-completed {
  --progress-color: #73e6b1;
}

.mini-progress-failed {
  --progress-color: #ff909b;
}

.mini-progress-cancelled {
  --progress-color: #efcb85;
}

.mini-progress-completed .mini-progress-value,
.mini-progress-failed .mini-progress-value,
.mini-progress-cancelled .mini-progress-value {
  stroke: var(--progress-color);
}

.mini-result-icon {
  animation: mini-result-in 300ms cubic-bezier(0.16, 1, 0.3, 1) both;
}

.mini-drop-indicator {
  position: absolute;
  inset: 4px;
  display: grid;
  place-items: center;
  border: 2px dashed #a9e8ff;
  border-radius: inherit;
  background: #152d4f;
  color: #ffffff;
  pointer-events: none;
}

.mini-progress-enter-active,
.mini-progress-leave-active {
  transition:
    opacity 200ms ease,
    transform 250ms ease;
}

.mini-progress-enter-from,
.mini-progress-leave-to {
  opacity: 0;
  transform: scale(0.9);
}

@keyframes mini-orbit {
  to {
    transform: rotate(360deg);
  }
}

@keyframes mini-upload-lift {
  0%,
  100% {
    opacity: 0.65;
    transform: translateY(1px);
  }

  50% {
    opacity: 1;
    transform: translateY(-2px);
  }
}

@keyframes mini-result-in {
  from {
    opacity: 0;
    transform: scale(0.6);
  }

  to {
    opacity: 1;
    transform: scale(1);
  }
}

@media (prefers-reduced-motion: reduce) {
  .mini-logo,
  .mini-progress-value,
  .mini-progress-enter-active,
  .mini-progress-leave-active {
    transition: none;
  }

  .mini-progress-orbit,
  .mini-upload-arrow,
  .mini-result-icon {
    animation: none;
  }

  .mini-progress-orbit {
    display: none;
  }
}
</style>
