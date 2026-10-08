<template>
  <div
    id="tray-page"
    class="flex h-screen w-screen flex-col overflow-hidden text-main"
    :class="osGlobal === 'darwin' ? 'bg-bg-tertiary/90' : 'border border-border bg-bg-tertiary'"
  >
    <!-- Header -->
    <header class="relative flex h-11 shrink-0 items-center justify-between gap-2 border-b border-border px-3">
      <div class="flex min-w-0 items-center gap-2">
        <img :src="logoUrl" class="size-5 shrink-0" alt="" draggable="false" />
        <span class="truncate text-sm font-semibold">PicList</span>
      </div>
      <button
        type="button"
        class="flex shrink-0 cursor-pointer items-center gap-1 rounded-md px-2 py-1 text-xs font-medium text-accent focus-ring transition-colors duration-fast ease-apple hover:bg-accent/10"
        @click="openSettingWindow"
      >
        {{ t('pages.tray.openMainWindow') }}
        <ArrowUpRight :size="13" :stroke-width="2.25" aria-hidden="true" />
      </button>
      <div
        v-if="uploadProgress"
        class="absolute inset-x-0 -bottom-px h-0.5 overflow-hidden bg-accent/15"
        role="progressbar"
        :aria-label="t('common.fileTable.tasks.uploading')"
        :aria-valuenow="uploadProgress.indeterminate ? undefined : uploadProgress.progress"
        aria-valuemin="0"
        aria-valuemax="100"
      >
        <div
          v-if="uploadProgress.indeterminate"
          class="h-full w-1/3 animate-upload-progress bg-accent motion-reduce:animate-none"
        />
        <div
          v-else
          class="h-full bg-accent transition-[width] duration-medium ease-standard"
          :style="{ width: `${uploadProgress.progress}%` }"
        />
      </div>
    </header>

    <main class="no-scrollbar flex flex-1 flex-col gap-3 overflow-x-hidden overflow-y-auto p-2.5">
      <!-- Clipboard image waiting for upload -->
      <section v-if="clipboardFiles.length" class="flex flex-col gap-1.5">
        <div class="flex items-center justify-between px-1">
          <h2 class="text-[11px] font-semibold tracking-wide text-tertiary uppercase">
            {{ t('pages.tray.waitForUpload') }}
          </h2>
          <span
            v-if="clipboardFiles.length > 1"
            class="rounded-full bg-accent/10 px-1.5 text-[11px] font-semibold text-accent tabular-nums"
          >
            {{ clipboardFiles.length }}
          </span>
        </div>
        <button
          v-for="(item, index) in clipboardFiles"
          :key="index"
          type="button"
          class="group relative h-28 w-full shrink-0 cursor-pointer overflow-hidden rounded-lg border border-border bg-bg-secondary shadow-sm focus-ring transition-all duration-fast ease-apple hover:border-accent/50 hover:shadow-md disabled:cursor-progress"
          :disabled="clipboardState === 'uploading'"
          :aria-label="clipboardLabel"
          @click="uploadClipboardFiles"
        >
          <img
            v-if="item.imgUrl"
            :src="item.imgUrl"
            class="h-full w-full bg-[repeating-conic-gradient(var(--color-border-secondary)_0_25%,transparent_0_50%)] bg-size-[12px_12px] object-contain"
            alt=""
            draggable="false"
            @error="onImageError"
          />
          <span v-else class="flex h-full w-full flex-col items-center justify-center gap-1.5 px-3 text-secondary">
            <FileIcon :size="26" aria-hidden="true" />
            <span class="max-w-full truncate text-xs font-medium">{{ item.fileName }}</span>
          </span>
          <div
            class="absolute inset-0 flex flex-col items-center justify-center gap-1 text-xs font-semibold text-white transition-opacity duration-fast ease-apple"
            :class="
              clipboardState === 'idle'
                ? 'bg-black/45 opacity-0 group-hover:opacity-100 group-focus-visible:opacity-100'
                : clipboardState === 'failed'
                  ? 'bg-danger/75'
                  : 'bg-black/55'
            "
            aria-hidden="true"
          >
            <LoaderCircle
              v-if="clipboardState === 'uploading'"
              :size="20"
              class="animate-spin motion-reduce:animate-none"
            />
            <RotateCw v-else-if="clipboardState === 'failed'" :size="20" />
            <Upload v-else :size="20" />
            <span class="tabular-nums">{{ clipboardLabel }}</span>
          </div>
        </button>
      </section>

      <!-- Recent uploads -->
      <section class="flex min-h-0 flex-1 flex-col gap-1.5">
        <div class="flex items-center justify-between gap-2 px-1">
          <h2 class="text-[11px] font-semibold tracking-wide text-tertiary uppercase">
            {{ t('pages.tray.uploaded') }}
          </h2>
          <span
            v-if="files.length && pasteStyleLabel"
            class="truncate rounded-full border border-border px-1.5 text-[11px] font-medium text-secondary"
            :title="t('pages.tray.copyFormat')"
          >
            {{ pasteStyleLabel }}
          </span>
        </div>

        <ul v-if="files.length" class="flex flex-col gap-0.5">
          <li v-for="item in files" :key="item.id">
            <button
              type="button"
              class="group flex w-full cursor-pointer items-center gap-2.5 rounded-lg p-1.5 text-left focus-ring transition-colors duration-fast ease-apple hover:bg-accent/10"
              :title="t('pages.tray.clickToCopy')"
              @click="copyTheLink(item)"
            >
              <img
                :src="item.imgUrl"
                class="size-10 shrink-0 rounded-md border border-border-secondary bg-bg-secondary object-cover"
                alt=""
                loading="lazy"
                draggable="false"
                @error="onImageError"
              />
              <span class="flex min-w-0 flex-1 flex-col">
                <span class="truncate text-xs font-medium">{{ item.fileName || item.imgUrl }}</span>
                <span class="truncate text-[11px] text-tertiary">{{ itemMeta(item) }}</span>
              </span>
              <span
                class="grid size-6 shrink-0 place-items-center rounded-md transition-all duration-fast ease-apple"
                :class="
                  copyState[item.id] === 'copied'
                    ? 'text-success'
                    : copyState[item.id] === 'failed'
                      ? 'text-danger'
                      : 'text-tertiary opacity-0 group-hover:text-accent group-hover:opacity-100 group-focus-visible:opacity-100'
                "
              >
                <Check
                  v-if="copyState[item.id] === 'copied'"
                  :size="15"
                  :stroke-width="2.5"
                  class="animate-icon-pop motion-reduce:animate-none"
                />
                <X v-else-if="copyState[item.id] === 'failed'" :size="15" :stroke-width="2.5" />
                <Copy v-else :size="14" />
              </span>
            </button>
          </li>
        </ul>

        <div
          v-else-if="loaded"
          class="flex flex-1 flex-col items-center justify-center gap-2 px-4 pb-6 text-center text-tertiary"
        >
          <div class="grid size-11 place-items-center rounded-full bg-bg-secondary">
            <Images :size="20" />
          </div>
          <p class="text-xs font-semibold text-secondary">{{ t('pages.tray.emptyTitle') }}</p>
          <p class="text-[11px] leading-snug">
            {{ t(osGlobal === 'darwin' ? 'pages.tray.emptyHint' : 'pages.tray.emptyHintWin') }}
          </p>
        </div>
      </section>
    </main>

    <div class="sr-only" role="status" aria-live="polite">{{ liveMessage }}</div>
  </div>
</template>

<script lang="ts" setup>
import { ArrowUpRight, Check, Copy, File as FileIcon, Images, LoaderCircle, RotateCw, Upload, X } from '@lucide/vue'
import dayjs from 'dayjs'
import { computed, onBeforeMount, onBeforeUnmount, reactive, ref } from 'vue'
import { useI18n } from 'vue-i18n'

import { osGlobal, usePicBed } from '@/composables/useGlobal'
import { getInitialLocale } from '@/i18n/locale'
import { getConfig } from '@/services/configService'
import $$db from '@/services/galleryDatabase'
import { configPaths } from '@/utils/configPaths'
import { createUploadProgressTracker, type UploadProgressState } from '@/utils/uploadProgress'
import { IPasteStyle, IWindowList } from '#/constants/app'
import { CLIPBOARD_FILES, UPDATE_FILES, UPLOAD_FILES, UPLOAD_PROGRESS } from '#/constants/ipcChannels'
import { IRPCActionType } from '#/constants/rpcActions'
import { getRawData } from '#/utils/rawData'

defineOptions({ name: 'TrayPage' })

type IResult<T> = T & {
  id: string
  createdAt: number
  updatedAt: number
}

const RECENT_LIMIT = 10
const logoUrl = `${import.meta.env.BASE_URL}roundLogo.png`
const FEEDBACK_DURATION = 1600

const { t, locale } = useI18n()
const { picBedG } = usePicBed()

const files = ref<IResult<ImgInfo>[]>([])
const loaded = ref(false)
const clipboardFiles = ref<ImgInfo[]>([])
const clipboardState = ref<'idle' | 'uploading' | 'failed'>('idle')
const uploadProgress = ref<UploadProgressState>()
const pasteStyle = ref('')
const copyState = reactive<Record<string, 'copied' | 'failed'>>({})
const liveMessage = ref('')

const pasteStyleLabel = computed(() => (pasteStyle.value === IPasteStyle.MARKDOWN ? 'Markdown' : pasteStyle.value))

const clipboardLabel = computed(() => {
  switch (clipboardState.value) {
    case 'uploading': {
      const state = uploadProgress.value
      const label = t('common.fileTable.tasks.uploading')
      return state && !state.indeterminate ? `${label} ${state.progress}%` : label
    }
    case 'failed':
      return t('pages.tray.uploadFailedRetry')
    default:
      return t('pages.upload.clickToUpload')
  }
})

const picBedNames = computed(() => new Map(picBedG.value.map(item => [item.type, item.name])))

function itemMeta(item: IResult<ImgInfo>) {
  const date = dayjs(item.createdAt)
  const time = date.format(
    date.isSame(dayjs(), 'day') ? 'HH:mm' : date.isSame(dayjs(), 'year') ? 'MM/DD HH:mm' : 'YYYY/MM/DD',
  )
  const picBed = item.type ? picBedNames.value.get(item.type) || item.type : ''
  return [picBed, time].filter(Boolean).join(' · ')
}

function openSettingWindow() {
  window.electron.sendRPC(IRPCActionType.OPEN_WINDOW, IWindowList.SETTING_WINDOW)
}

async function getData() {
  // The hidden panel keeps its renderer, so refresh the locale when it reopens.
  locale.value = getInitialLocale(localStorage.getItem('currentLanguage'), navigator.language || 'zh-CN')
  const [result, style] = await Promise.all([
    $$db.get<ImgInfo>({ orderBy: 'desc', limit: RECENT_LIMIT }),
    getConfig<string>(configPaths.settings.pasteStyle),
  ])
  files.value = result?.data ?? []
  pasteStyle.value = style || IPasteStyle.MARKDOWN
  loaded.value = true
}

const feedbackTimers = new Map<string, ReturnType<typeof setTimeout>>()

function showCopyFeedback(id: string, state: 'copied' | 'failed') {
  clearTimeout(feedbackTimers.get(id))
  copyState[id] = state
  liveMessage.value = state === 'copied' ? t('pages.tray.copySuccess') : t('pages.gallery.copyLinkFailed')
  feedbackTimers.set(
    id,
    setTimeout(() => {
      delete copyState[id]
      feedbackTimers.delete(id)
    }, FEEDBACK_DURATION),
  )
}

async function copyTheLink(item: IResult<ImgInfo>) {
  try {
    const result = await window.electron.triggerRPC<[string, string]>(
      IRPCActionType.GALLERY_PASTE_TEXT,
      getRawData(item),
    )
    if (!result?.[0]?.trim()) throw new Error('Missing link')
    showCopyFeedback(item.id, 'copied')
    if (result[1] && result[1] !== item.shortUrl) {
      // Copy has already succeeded; caching the short URL is optional.
      $$db.updateById(item.id, { shortUrl: result[1] }).catch(() => {})
    }
  } catch {
    showCopyFeedback(item.id, 'failed')
  }
}

async function uploadClipboardFiles() {
  if (clipboardState.value === 'uploading') return
  clipboardState.value = 'uploading'
  const result = await window.electron
    .triggerRPC<{ url?: string }>(IRPCActionType.TRAY_UPLOAD_CLIPBOARD_FILES)
    .catch(() => undefined)
  if (result?.url) {
    clipboardState.value = 'idle'
    // The upload already copied its link; flag the new entry once the list refreshes.
    await getData()
    if (files.value[0]) showCopyFeedback(files.value[0].id, 'copied')
  } else {
    // A cancelled upload (e.g. from the rename dialog) is not an error.
    clipboardState.value = uploadProgress.value?.cancelled && !uploadProgress.value.failed ? 'idle' : 'failed'
  }
}

function onImageError(event: Event) {
  const img = event.target as HTMLImageElement
  if (!img.src.endsWith('/errorLoading.png')) img.src = `${import.meta.env.BASE_URL}errorLoading.png`
}

function clipboardFilesHandler(list: ImgInfo[]) {
  clipboardFiles.value = list
  if (clipboardState.value === 'failed') clipboardState.value = 'idle'
}

const trackUploadProgress = createUploadProgressTracker()
let progressHideTimer: ReturnType<typeof setTimeout> | undefined

function uploadProgressHandler(event: IUploadProgress) {
  clearTimeout(progressHideTimer)
  const state = trackUploadProgress(event)
  uploadProgress.value = state
  if (!state.activeCount) {
    progressHideTimer = setTimeout(() => {
      uploadProgress.value = undefined
    }, 400)
  }
}

function onKeydown(e: KeyboardEvent) {
  if (e.key === 'Escape') window.electron.sendRPC(IRPCActionType.HIDE_CURRENT_WINDOW)
}

// Dropping a file on the page would otherwise navigate the window to it.
function preventDrop(e: DragEvent) {
  e.preventDefault()
}

const disposers: (() => void)[] = []

onBeforeMount(async () => {
  disposers.push(
    window.electron.ipcRendererOn(CLIPBOARD_FILES, clipboardFilesHandler),
    window.electron.ipcRendererOn(UPLOAD_FILES, getData),
    window.electron.ipcRendererOn(UPDATE_FILES, getData),
    window.electron.ipcRendererOn(UPLOAD_PROGRESS, uploadProgressHandler),
  )
  window.addEventListener('dragover', preventDrop)
  window.addEventListener('drop', preventDrop)
  window.addEventListener('keydown', onKeydown)
  await getData()
})

onBeforeUnmount(() => {
  disposers.forEach(dispose => dispose())
  clearTimeout(progressHideTimer)
  feedbackTimers.forEach(timer => clearTimeout(timer))
  window.removeEventListener('dragover', preventDrop)
  window.removeEventListener('drop', preventDrop)
  window.removeEventListener('keydown', onKeydown)
})
</script>
