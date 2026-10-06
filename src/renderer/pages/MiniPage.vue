<template>
  <div
    id="mini-page"
    class="mini-page box-border h-screen w-screen cursor-pointer overflow-hidden rounded-full border-2 border-white/90 bg-(--color-accent,#007aff) select-none [&.mini-page-square]:rounded-none"
    :class="{ 'mini-page-square': osGlobal === 'linux' }"
  >
    <div
      ref="uploadArea"
      class="mini-upload-area relative h-full w-full overflow-hidden rounded-[inherit]"
      @drop.prevent="onDrop"
      @dragover.prevent="dragover = true"
      @dragleave.prevent="dragover = false"
    >
      <img
        :src="logoPath ? logoPath : './squareLogo.png'"
        class="mini-logo pointer-events-none block h-full w-full object-cover [transition:opacity_200ms_ease,transform_250ms_ease] motion-reduce:transition-none [&.mini-logo-hidden]:scale-85 [&.mini-logo-hidden]:opacity-0"
        :class="{ 'mini-logo-hidden': isShowingProgress || dragover }"
        :aria-hidden="isShowingProgress || dragover"
        alt="PicList"
        draggable="false"
        @dragstart.prevent
      />
      <Transition
        enter-active-class="[transition:opacity_200ms_ease,transform_250ms_ease] motion-reduce:transition-none"
        leave-active-class="[transition:opacity_200ms_ease,transform_250ms_ease] motion-reduce:transition-none"
        enter-from-class="opacity-0 scale-90"
        leave-to-class="opacity-0 scale-90"
      >
        <div
          v-if="isShowingProgress"
          class="mini-progress pointer-events-none absolute inset-0 rounded-[inherit] bg-[radial-gradient(circle_at_35%_20%,#243e62,#101d33_80%)] text-(--progress-color) [--progress-color:#86ddff] [&.mini-progress-cancelled]:[--progress-color:#efcb85] [&.mini-progress-cancelled_.mini-progress-value]:stroke-(--progress-color) [&.mini-progress-completed]:[--progress-color:#73e6b1] [&.mini-progress-completed_.mini-progress-value]:stroke-(--progress-color) [&.mini-progress-failed]:[--progress-color:#ff909b] [&.mini-progress-failed_.mini-progress-value]:stroke-(--progress-color)"
          :class="`mini-progress-${uploadState}`"
          :role="uploadState === 'uploading' ? 'progressbar' : 'status'"
          :aria-label="progressLabel"
          :aria-valuenow="uploadState === 'uploading' && !isIndeterminate ? progress : undefined"
          :aria-valuemin="uploadState === 'uploading' ? 0 : undefined"
          :aria-valuemax="uploadState === 'uploading' ? 100 : undefined"
        >
          <svg
            class="mini-progress-ring absolute inset-0 h-full w-full -rotate-90 overflow-visible fill-none stroke-3"
            viewBox="0 0 64 64"
            aria-hidden="true"
          >
            <defs>
              <linearGradient :id="gradientId" x1="0" y1="0" x2="1" y2="1">
                <stop offset="0%" stop-color="#80edff" />
                <stop offset="100%" stop-color="#5795ff" />
              </linearGradient>
            </defs>
            <circle class="mini-progress-track stroke-white/12" cx="32" cy="32" r="27" />
            <circle
              v-show="!isIndeterminate"
              class="mini-progress-value [stroke-dasharray:100] [stroke-linecap:round] [transition:stroke-dashoffset_450ms_cubic-bezier(0.22,1,0.36,1),stroke_200ms_ease] motion-reduce:transition-none"
              cx="32"
              cy="32"
              r="27"
              pathLength="100"
              :stroke="`url(#${gradientId})`"
              :stroke-dashoffset="100 - progress"
            />
            <circle
              v-if="uploadState === 'uploading'"
              class="mini-progress-orbit origin-center animate-mini-orbit stroke-[#dff9ff]/75 [stroke-dasharray:3_97] [stroke-linecap:round] motion-reduce:hidden motion-reduce:animate-none [&.mini-progress-indeterminate]:[animation-duration:1.4s] [&.mini-progress-indeterminate]:[stroke-dasharray:22_78]"
              :class="{ 'mini-progress-indeterminate': isIndeterminate }"
              cx="32"
              cy="32"
              r="27"
              pathLength="100"
            />
          </svg>
          <div
            class="mini-progress-content absolute inset-0 flex flex-col items-center justify-center gap-px"
            aria-hidden="true"
          >
            <template v-if="uploadState === 'uploading'">
              <ArrowUp
                class="mini-upload-arrow animate-mini-upload-lift motion-reduce:animate-none"
                :size="14"
                :stroke-width="2.5"
              />
              <span
                v-if="isIndeterminate"
                class="mini-progress-stage max-w-[44px] truncate text-[8px] leading-[1.5] font-semibold"
                >{{ phaseLabel }}</span
              >
              <span
                v-else
                class="mini-progress-percent text-[16px] leading-[1.15] font-bold text-white tabular-nums [&>span]:ml-px [&>span]:text-[9px] [&>span]:font-medium [&>span]:text-[#bfd3ee]"
                >{{ progress }}<span>%</span></span
              >
            </template>
            <Check
              v-else-if="uploadState === 'completed'"
              class="mini-result-icon animate-mini-result-in motion-reduce:animate-none"
              :size="27"
              :stroke-width="2.5"
            />
            <X
              v-else-if="uploadState === 'failed'"
              class="mini-result-icon animate-mini-result-in motion-reduce:animate-none"
              :size="25"
              :stroke-width="2.5"
            />
            <Minus
              v-else
              class="mini-result-icon animate-mini-result-in motion-reduce:animate-none"
              :size="25"
              :stroke-width="2.5"
            />
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
          class="mini-drop-indicator pointer-events-none absolute inset-[4px] grid place-items-center rounded-[inherit] border-2 border-dashed border-[#a9e8ff] bg-[#152d4f] text-white"
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
import { ArrowUp, Check, Minus, Upload, X } from '@lucide/vue'
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
  removeListeners = window.electron.ipcRendererOn(UPLOAD_PROGRESS, uploadProgressHandler)
  removeIconListener = window.electron.ipcRendererOn(UPDATE_MINI_ICON, updateMiniIconHandler)
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
