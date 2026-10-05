<template>
  <div class="relative no-scrollbar flex h-full w-full items-center justify-center">
    <div
      class="relative z-1 no-scrollbar flex h-full w-full flex-col items-center justify-start gap-6 overflow-auto rounded-xl border-none p-6 shadow-sm"
    >
      <!-- Header Card -->
      <div
        class="flex w-full flex-wrap items-center justify-between gap-4 rounded-2xl border border-border-secondary px-6 py-4 shadow-md max-md:flex-col max-md:items-stretch max-md:p-5"
      >
        <div class="flex max-w-[calc(100%-300px)] flex-1 flex-wrap items-center gap-2 max-md:order-1">
          <button
            class="provider-button group/provider flex w-auto min-w-[150px] shrink-0 cursor-pointer items-center gap-3 rounded-lg bg-bg-secondary px-4 py-2 font-[inherit] shadow-sm duration-fast ease-standard hover:-translate-y-px hover:bg-accent/30 hover:text-white hover:shadow-sm focus-visible:focus-ring max-xs:w-full max-xs:min-w-[100px]"
            :title="t('pages.upload.uploadViewHint')"
            @click="openPicBedSettings"
          >
            <div class="flex flex-1 flex-col items-start">
              <span class="text-sm leading-[1.2] font-semibold text-main group-hover/provider:text-white">{{
                picBedName
              }}</span>
              <span class="text-xs leading-[1.2] text-secondary group-hover/provider:text-white">{{
                defaultConfigNameG || 'Default'
              }}</span>
            </div>
            <EditIcon :size="16" class="text-secondary duration-fast ease-standard group-hover/provider:text-white" />
          </button>
          <div
            class="flex h-[22px] w-[22px] shrink-0 cursor-pointer items-center justify-center rounded-lg border border-border bg-surface font-[inherit] text-secondary duration-fast ease-standard hover:-translate-y-px hover:bg-accent/30 hover:text-white data-[disabled=true]:pointer-events-none data-[disabled=true]:cursor-not-allowed data-[disabled=true]:opacity-50"
            :title="t('pages.upload.addToFavorites')"
            :data-disabled="favoritePicbeds.length >= MAX_FAVORITE_PICBEDS || isCurrentPicBedInFavorites"
            @click="addCurrentPicbedToFavorites"
          >
            <component
              :is="isCurrentPicBedInFavorites ? CheckIcon : PlusIcon"
              :size="14"
              class="duration-fast ease-standard"
            />
          </div>
          <transition-group
            name="badges-slide"
            tag="div"
            class="flex max-w-[calc(100%-300px)] flex-wrap items-center gap-[0.2rem] [.has-many]:max-w-[300px]"
            :class="{ 'has-many': favoritePicbeds.length >= 4 }"
            enter-active-class="transition-all duration-200 ease-apple"
            leave-active-class="transition-all duration-200 ease-apple"
            enter-from-class="opacity-0"
            leave-to-class="opacity-0"
          >
            <button
              v-for="picbedType in favoritePicbeds"
              :key="picbedType.id"
              class="group/badge relative flex w-[85px] shrink-0 cursor-pointer items-center gap-2 overflow-hidden rounded-md bg-bg-secondary pt-1.5 pr-2 pb-1.5 pl-3 text-xs font-medium whitespace-nowrap text-secondary shadow-sm transition-all duration-fast ease-standard select-none hover:-translate-y-px hover:border-accent-hover hover:bg-accent/30 hover:text-white [.is-active]:border-[0.1rem] [.is-active]:border-accent-hover [.is-active]:font-semibold [.show-delete]:pr-2"
              :class="{ 'is-active': isCurrentPicbed(picbedType), 'show-delete': longPressedBadge === picbedType.id }"
              :title="t('pages.upload.longPressToRemoveFromFavorites') + getPicbedName(picbedType)"
              @click="handleBadgeClick(picbedType)"
              @mousedown="startBadgeLongPress(picbedType)"
              @mouseup="endBadgeLongPress"
              @mouseleave="endBadgeLongPress"
              @touchstart="startBadgeLongPress(picbedType, $event)"
              @touchend="endBadgeLongPress"
              @touchcancel="endBadgeLongPress"
            >
              <div class="min-w-0 flex-1 overflow-hidden">
                <div
                  class="flex overflow-hidden text-ellipsis whitespace-nowrap group-hover/badge:w-fit group-hover/badge:animate-[badge-scroll_5s_linear_infinite] group-hover/badge:text-clip"
                >
                  <span class="leading-none whitespace-nowrap group-hover/badge:pr-[20px]">{{
                    getPicbedName(picbedType)
                  }}</span>
                  <span class="hidden leading-none whitespace-nowrap group-hover/badge:block">{{
                    getPicbedName(picbedType)
                  }}</span>
                </div>
              </div>
              <button
                v-if="longPressedBadge === picbedType.id"
                class="flex shrink-0 animate-[fade-in_0.2s_ease-in] cursor-pointer items-center justify-center rounded-full border-none bg-transparent p-0.5 text-inherit duration-fast ease-standard hover:bg-danger/20 hover:text-danger"
                :title="t('pages.upload.removeFromFavorites')"
                @click.stop="removePicbedFromFavorites(picbedType)"
              >
                <XIcon :size="12" />
              </button>
            </button>
          </transition-group>
        </div>
        <div class="flex flex-wrap items-center gap-3 max-md:order-2 max-md:justify-stretch">
          <button
            class="segmented-button flex cursor-pointer items-center gap-2 rounded-md border-r border-none border-r-border-secondary bg-bg-secondary px-4 py-2.5 font-[inherit] text-sm font-medium whitespace-nowrap text-secondary shadow-sm duration-fast ease-standard last:border-r-0 hover:bg-accent/30 hover:text-white"
            :title="t('pages.imageProcess.editor.title')"
            @click="handleImageProcess"
          >
            <Settings :size="16" />
            <span>{{ t('pages.imageProcess.editor.title') }}</span>
          </button>
          <PicBedSwitcher />
        </div>
      </div>

      <!-- Main Upload Card -->
      <div
        class="flex min-h-[230px] w-full flex-1 flex-wrap items-center justify-center gap-4 rounded-2xl border border-border-secondary px-6 py-4 shadow-md max-md:flex-col max-md:items-stretch max-md:p-5"
      >
        <div
          id="upload-area"
          ref="uploadArea"
          class="group/upload relative flex h-full w-full cursor-pointer items-center justify-center rounded-xl border-2 border-dashed border-border bg-bg-secondary px-1 py-12 duration-medium ease-standard focus-visible:focus-ring focus-visible:outline-offset-4 max-md:px-4 max-md:py-8 max-xs:px-2 max-xs:py-6 [:hover,.drag-active]:border-accent [:hover,.drag-active]:bg-[linear-gradient(135deg,var(--color-surface-elevated)_0%,color-mix(in_srgb,var(--color-accent),transparent_95%)_100%)] [:hover,.drag-active]:shadow-lg [:hover,.drag-active&]:translate-y-[-2px]"
          :class="{ 'drag-active': dragover }"
          @drop.prevent="onDrop"
          @dragover.prevent="dragover = true"
          @dragleave.prevent="dragover = false"
          @click="openUploadWindow"
        >
          <div class="flex flex-col items-center justify-center gap-6 text-center">
            <div
              class="flex h-[80px] w-[80px] items-center justify-center rounded-full bg-accent text-white duration-medium ease-standard group-[:hover,.drag-active]/upload:animate-[float_1.5s_ease-in-out_infinite] max-md:h-[60px] max-md:w-[60px]"
            >
              <UploadCloudIcon :size="48" />
            </div>
            <div class="flex flex-col gap-2">
              <h3 class="m-0 text-xl font-semibold tracking-tight text-main max-xs:text-lg">
                {{ t('pages.upload.dragFileToHere') }}
              </h3>
              <p class="m-0 text-sm text-secondary">
                {{ ' ' }}
              </p>
              <div class="mt-2 flex flex-col gap-1">
                <span class="text-xs font-medium tracking-wide text-secondary uppercase">{{
                  t('pages.upload.uploadHint')
                }}</span>
              </div>
            </div>
          </div>
          <input id="file-uploader" ref="fileInput" type="file" multiple class="hidden" @change="handleFileSelection" />
        </div>
      </div>

      <!-- Progress Bar -->
      <div
        v-if="showProgress"
        class="flex w-full flex-wrap items-center justify-between gap-4 rounded-2xl border border-border-secondary p-0 shadow-md"
      >
        <div class="flex w-full flex-col gap-2 rounded-lg border border-border bg-surface p-3">
          <div class="flex w-full items-center justify-between gap-3 text-sm">
            <span class="font-medium text-main">{{ progressLabel }}</span>
            <span
              v-if="
                !progressState?.indeterminate &&
                (progressState?.activeCount || (!progressState?.failed && !progressState?.cancelled))
              "
              class="font-semibold text-secondary tabular-nums"
            >
              {{ Math.round(progress) }}%
            </span>
          </div>
          <div
            class="h-2 w-full overflow-hidden rounded-lg bg-bg-secondary"
            :role="progressState?.activeCount ? 'progressbar' : 'status'"
            :aria-label="progressLabel"
            :aria-valuenow="progressState?.activeCount && !progressState.indeterminate ? progress : undefined"
            :aria-valuemin="progressState?.activeCount ? 0 : undefined"
            :aria-valuemax="progressState?.activeCount ? 100 : undefined"
          >
            <div
              class="h-full rounded-lg bg-[linear-gradient(90deg,var(--color-accent)_0%,var(--color-primary)_50%)] transition-[width] duration-300 ease-standard data-[error=true]:bg-danger data-[error=true]:bg-none motion-reduce:transition-none"
              :class="{ 'upload-progress-indeterminate': progressState?.indeterminate }"
              :data-error="showError"
              :style="{ width: progressState?.indeterminate ? '35%' : `${progress}%` }"
            />
          </div>
          <div
            v-if="progressState?.totalFiles"
            class="flex flex-wrap justify-between gap-2 text-xs text-secondary tabular-nums"
          >
            <span>{{
              t('pages.upload.progress.files', {
                completed: progressState.completedFiles,
                total: progressState.totalFiles,
              })
            }}</span>
            <span v-if="progressState.totalBytes !== null">
              {{ formatSize(progressState.transferredBytes) }} / {{ formatSize(progressState.totalBytes) }}
            </span>
          </div>
        </div>
      </div>

      <!-- Quick Actions Card -->
      <div
        class="flex w-full flex-col flex-wrap items-center justify-between gap-2 rounded-2xl border border-border-secondary px-6 py-4 shadow-md max-md:items-stretch max-md:p-5"
      >
        <div class="flex w-full items-start p-0">
          <h4 class="m-0 text-[0.9rem] font-semibold tracking-tight text-main">
            {{ t('pages.upload.quickUpload') }}
          </h4>
        </div>
        <div class="flex w-full flex-1 flex-row flex-wrap items-center justify-center gap-4 max-md:gap-3 max-md:px-5">
          <button
            class="quick-action-button group relative flex flex-1 cursor-pointer items-center gap-2 rounded-lg border border-border-secondary bg-bg-secondary px-4 py-3.5 text-left font-[inherit] duration-medium ease-standard hover:translate-y-[-2px] hover:bg-accent/30 hover:shadow-md focus-visible:focus-ring max-xs:px-3.5 max-xs:py-3"
            @click="uploadClipboardFiles"
          >
            <ClipboardIcon class="shrink-0 text-accent group-hover:text-white" :size="15" />
            <span class="text-sm font-medium text-secondary group-hover:text-white">{{
              t('pages.upload.clipboardPicture')
            }}</span>
          </button>
          <button
            class="quick-action-button group relative flex flex-1 cursor-pointer items-center gap-2 rounded-lg border border-border-secondary bg-bg-secondary px-4 py-3.5 text-left font-[inherit] duration-medium ease-standard hover:translate-y-[-2px] hover:bg-accent/30 hover:shadow-md focus-visible:focus-ring max-xs:px-3.5 max-xs:py-3"
            @click="uploadURLFiles"
          >
            <LinkIcon class="shrink-0 text-accent group-hover:text-white" :size="15" />
            <span class="text-sm font-medium text-secondary group-hover:text-white">{{
              t('pages.upload.urlUpload')
            }}</span>
          </button>
          <UploadTaskQueue />
        </div>
      </div>

      <!-- Settings Card -->
      <div
        class="flex w-full flex-row flex-wrap items-center justify-between gap-0 rounded-2xl border border-border-secondary px-6 py-4 shadow-md max-md:flex-col max-md:items-stretch max-md:p-5"
      >
        <div class="flex w-full items-start p-0">
          <h4 class="m-0 text-[0.9rem] font-semibold tracking-tight text-main">
            {{ t('pages.upload.linkFormat') }}
          </h4>
        </div>
        <div class="flex w-full flex-row gap-2 p-2">
          <!-- Format Options -->
          <div class="flex flex-1 flex-col gap-3">
            <label class="m-0 text-xs font-medium text-secondary">{{ t('pages.upload.outputFormat') }}</label>
            <div class="flex flex-row">
              <button
                v-for="(format, key) in pasteFormatList"
                :key
                class="flex-1 cursor-pointer rounded-md border border-border-secondary bg-bg-secondary px-1 py-1 font-['SF_Mono',Monaco,'Cascadia_Code','Roboto_Mono',Consolas,'Courier_New',monospace] text-[0.7rem] font-medium text-secondary duration-fast ease-standard hover:bg-accent/30 hover:text-white focus-visible:focus-ring data-[active=true]:border-accent data-[active=true]:bg-accent data-[active=true]:text-white"
                :data-active="pasteStyle === key"
                :title="format"
                @click="updatePasteStyle(key)"
              >
                {{ key }}
              </button>
            </div>
          </div>

          <!-- URL Length Options -->
          <div class="flex flex-1 flex-col gap-3">
            <label class="m-0 text-xs font-medium text-secondary">{{ t('pages.upload.urlType.title') }}</label>
            <div class="flex w-full overflow-hidden rounded-md border border-border-secondary bg-bg-secondary">
              <button
                class="flex-1 cursor-pointer border-0 bg-transparent py-1 font-[inherit] text-xs font-medium text-secondary duration-fast ease-standard hover:bg-accent/30 hover:text-white focus-visible:focus-ring data-[active=true]:bg-accent data-[active=true]:text-white"
                :data-active="!useShortUrl"
                @click="updateUrlType(false)"
              >
                <span>{{ t('pages.upload.urlType.normal') }}</span>
              </button>
              <button
                class="flex-1 cursor-pointer border-0 bg-transparent py-1 font-[inherit] text-xs font-medium text-secondary duration-fast ease-standard hover:bg-accent/30 hover:text-white focus-visible:focus-ring data-[active=true]:bg-accent data-[active=true]:text-white"
                :data-active="useShortUrl"
                @click="updateUrlType(true)"
              >
                <span>{{ t('pages.upload.urlType.short') }}</span>
              </button>
            </div>
          </div>
        </div>
      </div>
    </div>
    <!-- Image Process Dialog -->
    <ImageProcessDialog
      v-model:visible="imageProcessDialogVisible"
      :config-id="defaultIdG"
      :current-picbed-name="defaultPicBedG"
    />
  </div>
</template>

<script lang="ts" setup>
import { CheckIcon, ClipboardIcon, EditIcon, LinkIcon, PlusIcon, Settings, UploadCloudIcon, XIcon } from '@lucide/vue'
import { computed, defineAsyncComponent, onBeforeMount, onBeforeUnmount, ref, useTemplateRef } from 'vue'
import { useI18n } from 'vue-i18n'
import { useRouter } from 'vue-router'

import PicBedSwitcher from '@/components/PicBedSwitcher.vue'
import UploadTaskQueue from '@/components/UploadTaskQueue.vue'
import { useDragEventListeners } from '@/composables/useDragEventListeners'
import { MAX_FAVORITE_PICBEDS, useFavoritePicbeds } from '@/composables/useFavoritePicbeds'
import { usePicBed } from '@/composables/useGlobal'
import useMessage from '@/composables/useMessage'
import { useUploadProgress } from '@/composables/useUploadProgress'
import { PICBEDS_PAGE } from '@/router/config'
import { getConfig, saveConfig } from '@/services/configService'
import $bus from '@/utils/bus'
import { configPaths } from '@/utils/configPaths'
import { getUploadFiles } from '@/utils/uploadFiles'
import { IPasteStyle } from '#/constants/app'
import { SHOW_INPUT_BOX, SHOW_INPUT_BOX_RESPONSE } from '#/constants/ipcChannels'
import { IRPCActionType } from '#/constants/rpcActions'
import { isUrl } from '#/utils/url'

defineOptions({ name: 'UploadPage' })

const ImageProcessDialog = defineAsyncComponent(() => import('@/components/ImageProcessDialog.vue'))

const uploadArea = useTemplateRef('uploadArea')
const fileInput = useTemplateRef('fileInput')
useDragEventListeners(uploadArea)

const $router = useRouter()
const { t } = useI18n()
const message = useMessage()
const { picBedG, defaultPicBedG, defaultConfigNameG, defaultIdG, updatePicBeds } = usePicBed()
const {
  favoritePicbeds,
  longPressedBadge,
  isCurrentPicBedInFavorites,
  addCurrentPicbedToFavorites,
  removePicbedFromFavorites,
  getPicbedName,
  isCurrentPicbed,
  handleBadgeClick,
  startBadgeLongPress,
  endBadgeLongPress,
} = useFavoritePicbeds()
const { progress, showProgress, showError, progressState, progressLabel } = useUploadProgress()

const imageProcessDialogVisible = ref(false)
const dragover = ref(false)
const useShortUrl = ref(false)
const pasteStyle = ref(IPasteStyle.MARKDOWN)
const pasteFormatList = ref<Record<string, string>>({
  [IPasteStyle.MARKDOWN]: '![alt](url)',
  [IPasteStyle.HTML]: '<img src="url"/>',
  [IPasteStyle.URL]: 'http://test.com/test.png',
  [IPasteStyle.UBB]: '[img]url[/img]',
  [IPasteStyle.CUSTOM]: '',
})

const picBedName = computed(() => {
  if (!picBedG.value || picBedG.value.length === 0) return ''
  const provider = picBedG.value.find(item => item.type === defaultPicBedG.value)
  return provider ? provider.name : defaultPicBedG.value
})

function handleImageProcess() {
  imageProcessDialogVisible.value = true
}

async function openPicBedSettings() {
  const uploader = await getConfig<IUploaderConfigItem>(`uploader.${defaultPicBedG.value}`)
  $router.push({
    name: PICBEDS_PAGE,
    params: {
      type: defaultPicBedG.value,
      configId: defaultIdG.value,
    },
    query: {
      defaultConfigId: uploader?.defaultId || '',
    },
  })
}

function onDrop(event: DragEvent) {
  dragover.value = false
  const dataTransfer = event.dataTransfer
  if (!dataTransfer) return

  // Local files take precedence over dragged text or HTML.
  if (dataTransfer.files?.length) {
    uploadFiles(dataTransfer.files)
    return
  }

  const items = dataTransfer.items
  if (!items?.length) return
  if (items.length === 2 && items[0].type === 'text/uri-list') {
    handleURLDrag(items, dataTransfer)
    return
  }
  if (items[0].type !== 'text/plain') return

  const url = dataTransfer.getData(items[0].type)
  if (!isUrl(url)) {
    message.error(t('pages.upload.dragValidPictureOrUrl'))
    return
  }
  window.electron.sendRPC(IRPCActionType.UPLOAD_CHOOSED_FILES, [{ path: url }])
}

function handleURLDrag(items: DataTransferItemList, dataTransfer: DataTransfer) {
  const html = dataTransfer.getData(items[1].type)
  const imageMatch = html.match(/<img.*src="(.*?)"/)
  if (!imageMatch) {
    message.error(t('pages.upload.dragValidPictureOrUrl'))
    return
  }
  window.electron.sendRPC(IRPCActionType.UPLOAD_CHOOSED_FILES, [{ path: imageMatch[1] }])
}

function openUploadWindow() {
  fileInput.value?.click()
}

function handleFileSelection(event: Event) {
  const input = event.target as HTMLInputElement
  if (input.files) uploadFiles(input.files)
  if (fileInput.value) fileInput.value.value = ''
}

function uploadFiles(files: FileList) {
  window.electron.sendRPC(IRPCActionType.UPLOAD_CHOOSED_FILES, getUploadFiles(files))
}

async function loadUploadSettings() {
  const settings = await getConfig<{ pasteStyle?: string; customLink?: string; useShortUrl?: boolean }>('settings')
  pasteStyle.value = settings?.pasteStyle || IPasteStyle.MARKDOWN
  pasteFormatList.value.Custom = settings?.customLink || '![$fileName]($url)'
  useShortUrl.value = settings?.useShortUrl || false
}

async function updatePasteStyle(style: string) {
  pasteStyle.value = style
  await saveConfig({
    [configPaths.settings.pasteStyle]: style || IPasteStyle.MARKDOWN,
  })
}

async function updateUrlType(shortUrl: boolean) {
  useShortUrl.value = shortUrl
  await saveConfig({
    [configPaths.settings.useShortUrl]: shortUrl,
  })
}

function uploadClipboardFiles() {
  window.electron.sendRPC(IRPCActionType.UPLOAD_CLIPBOARD_FILES_FROM_UPLOAD_PAGE)
}

async function uploadURLFiles() {
  const text = await navigator.clipboard.readText()
  $bus.emit(SHOW_INPUT_BOX, {
    value: isUrl(text) ? text : '',
    title: t('pages.upload.inputUrlTip'),
    placeholder: t('pages.upload.httpPrefixTip') + '\n' + t('pages.upload.multipleUrlsHint'),
    multiLine: true,
  })
}

function showInvalidUrls(urls: string[]) {
  if (!urls.length) return
  const errorMessage =
    urls.length === 1
      ? t('pages.upload.inputValidUrl') + ': ' + urls[0]
      : t('pages.upload.invalidUrlsFound', {
          count: urls.length,
          urls: urls.slice(0, 3).join(', ') + (urls.length > 3 ? '...' : ''),
        })
  message.error(errorMessage)
}

function handleInputBoxValue(value: string) {
  const validUrls: string[] = []
  const invalidUrls: string[] = []
  for (const line of value.split('\n')) {
    const url = line.trim()
    if (!url) continue
    if (isUrl(url)) validUrls.push(url)
    else invalidUrls.push(url)
  }

  showInvalidUrls(invalidUrls)
  if (!validUrls.length) return

  window.electron.sendRPC(
    IRPCActionType.UPLOAD_CHOOSED_FILES,
    validUrls.map(path => ({ path })),
  )
  if (validUrls.length > 1) {
    message.success(t('pages.upload.uploadingMultipleUrls', { count: validUrls.length }))
  }
}

function formatSize(bytes: number): string {
  if (bytes === 0) return '0 B'
  const unitSize = 1024
  const units = ['B', 'KB', 'MB', 'GB']
  const unitIndex = Math.floor(Math.log(bytes) / Math.log(unitSize))
  return parseFloat((bytes / Math.pow(unitSize, unitIndex)).toFixed(1)) + ' ' + units[unitIndex]
}

let removeSyncPicBedListener: () => void = () => {}

onBeforeMount(async () => {
  removeSyncPicBedListener = window.electron.ipcRendererOn('syncPicBed', () => {
    updatePicBeds()
  })
  $bus.on(SHOW_INPUT_BOX_RESPONSE, handleInputBoxValue)
  await loadUploadSettings()
})

onBeforeUnmount(() => {
  $bus.off(SHOW_INPUT_BOX_RESPONSE)
  removeSyncPicBedListener()
})
</script>
