<template>
  <div class="upload-container">
    <!-- Header Card -->
    <div class="upload-card header-card">
      <div class="card-header">
        <div class="provider-section">
          <button
            class="provider-button"
            :title="t('pages.upload.uploadViewHint')"
            @click="handlePicBedNameClick(picBedName, picBedConfigName)"
          >
            <div class="provider-info">
              <span class="provider-name">{{ picBedName }}</span>
              <span class="provider-config">{{ picBedConfigName || 'Default' }}</span>
            </div>
            <EditIcon :size="16" class="provider-arrow" />
          </button>
        </div>
        <div class="header-actions">
          <button class="action-button secondary" @click="handleImageProcess">
            <Settings :size="16" />
            <span>{{ t('pages.upload.imageProcessName') }}</span>
          </button>
          <button class="action-button" @click="handleChangePicBed">
            <ArrowLeftRightIcon :size="16" />
            <span>{{ t('pages.upload.changePicBed') }}</span>
          </button>
        </div>
      </div>
    </div>

    <!-- Main Upload Card -->
    <div class="upload-card main-card">
      <div
        id="upload-area"
        class="upload-zone"
        :class="{ 'drag-active': dragover }"
        @drop.prevent="onDrop"
        @dragover.prevent="dragover = true"
        @dragleave.prevent="dragover = false"
        @click="openUplodWindow"
      >
        <div class="upload-content">
          <div class="upload-icon">
            <UploadCloudIcon :size="48" />
          </div>
          <div class="upload-text">
            <h3 class="upload-title">
              {{ t('pages.upload.dragFileToHere') }}
            </h3>
            <p class="upload-subtitle">
              {{ t('pages.upload.clickToUpload') }}
            </p>
            <div class="upload-formats">
              <span class="format-label">{{ t('pages.upload.uploadHint') }}</span>
            </div>
          </div>
        </div>
        <input id="file-uploader" ref="fileInput" type="file" multiple style="display: none" @change="onChange" />
      </div>

      <!-- Progress Bar -->
      <transition name="progress">
        <div v-if="showProgress" class="progress-container">
          <div class="progress-bar">
            <div class="progress-fill" :class="{ 'progress-error': showError }" :style="{ width: `${progress}%` }" />
          </div>
          <span class="progress-text">
            {{ showError ? t('pages.upload.uploadFailed') : `${progress}%` }}
          </span>
        </div>
      </transition>
    </div>

    <!-- Quick Actions Card -->
    <div class="upload-card actions-card">
      <div class="card-header">
        <h4 class="card-title">
          {{ t('pages.upload.quickUpload') }}
        </h4>
      </div>
      <div class="quick-actions">
        <button class="quick-action-button" @click="uploadClipboardFiles">
          <ClipboardIcon :size="20" />
          <span>{{ t('pages.upload.clipboardPicture') }}</span>
        </button>
        <button class="quick-action-button" @click="uploadURLFiles">
          <LinkIcon :size="20" />
          <span>{{ t('pages.upload.urlUpload') }}</span>
        </button>
      </div>
    </div>

    <!-- Settings Card -->
    <div class="upload-card settings-card">
      <div class="card-header">
        <h4 class="card-title">
          {{ t('pages.upload.linkFormat') }}
        </h4>
      </div>
      <div class="settings-content">
        <!-- Format Options -->
        <div class="setting-group">
          <label class="setting-label">{{ t('pages.upload.outputFormat') }}</label>
          <div class="format-buttons">
            <button
              v-for="(format, key) in pasteFormatList"
              :key="key"
              class="format-button"
              :class="{ active: pasteStyle === key }"
              :title="format"
              @click="updatePasteStyle(key)"
            >
              {{ key }}
            </button>
          </div>
        </div>

        <!-- URL Length Options -->
        <div class="setting-group">
          <label class="setting-label">{{ t('pages.upload.urlType.title') }}</label>
          <div class="url-toggle">
            <button class="toggle-button" :class="{ active: !useShortUrl }" @click="updateUrlType(false)">
              <span>{{ t('pages.upload.urlType.normal') }}</span>
            </button>
            <button class="toggle-button" :class="{ active: useShortUrl }" @click="updateUrlType(true)">
              <span>{{ t('pages.upload.urlType.short') }}</span>
            </button>
          </div>
        </div>
      </div>
    </div>

    <!-- Image Process Dialog -->
    <transition name="modal">
      <div v-if="imageProcessDialogVisible" class="modal-overlay" @click.stop>
        <div class="modal-container" @click.stop>
          <div class="modal-header">
            <h3 class="modal-title">
              {{ t('pages.imageProcess.title') }}
            </h3>
            <button class="modal-close" @click="imageProcessDialogVisible = false">
              <XIcon :size="20" />
            </button>
          </div>
          <div class="modal-content">
            <ImageProcessSetting v-model="imageProcessDialogVisible" />
          </div>
        </div>
      </div>
    </transition>
  </div>
</template>

<script lang="ts" setup>
import {
  ArrowLeftRightIcon,
  ClipboardIcon,
  EditIcon,
  LinkIcon,
  Settings,
  UploadCloudIcon,
  XIcon,
} from 'lucide-vue-next'
import { onBeforeMount, onBeforeUnmount, ref, watch } from 'vue'
import { useI18n } from 'vue-i18n'
import { useRouter } from 'vue-router'

import ImageProcessSetting from '@/components/ImageProcessSetting.vue'
import useMessage from '@/hooks/useMessage'
import { PICBEDS_PAGE } from '@/router/config'
import $bus from '@/utils/bus'
import { isUrl } from '@/utils/common'
import { configPaths } from '@/utils/configPaths'
import { SHOW_INPUT_BOX, SHOW_INPUT_BOX_RESPONSE } from '@/utils/constant'
import { getConfig, saveConfig } from '@/utils/dataSender'
import { useDragEventListeners } from '@/utils/drag'
import { IPasteStyle, IRPCActionType } from '@/utils/enum'
import { picBedGlobal, updatePicBedGlobal } from '@/utils/global'
import type { IFileWithPath, IUploaderConfigItem } from '#/types/types'

useDragEventListeners()
const $router = useRouter()
const { t } = useI18n()
const message = useMessage()

const imageProcessDialogVisible = ref(false)
const useShortUrl = ref(false)
const dragover = ref(false)
const progress = ref(0)
const showProgress = ref(false)
const showError = ref(false)
const pasteStyle = ref('')
const picBedName = ref('')
const picBedConfigName = ref('')
const fileInput = ref<HTMLInputElement>()

const pasteFormatList = ref<Record<string, string>>({
  [IPasteStyle.MARKDOWN]: '![alt](url)',
  [IPasteStyle.HTML]: '<img src="url"/>',
  [IPasteStyle.URL]: 'http://test.com/test.png',
  [IPasteStyle.UBB]: '[img]url[/img]',
  [IPasteStyle.CUSTOM]: '',
})

watch(picBedGlobal, () => {
  getDefaultPicBed()
})

let removeUploadProgressListenerCallback: () => void = () => {}
let removeSyncPicBedListenerCallback: () => void = () => {}

function uploadProgressHandler(p: number): void {
  if (p !== -1) {
    showProgress.value = true
    progress.value = p
  } else {
    progress.value = 100
    showError.value = true
  }
}

function syncPicBedHandler(): void {
  getDefaultPicBed()
}

const handleImageProcess = () => {
  imageProcessDialogVisible.value = true
}

watch(progress, onProgressChange)

function onProgressChange(val: number) {
  if (val === 100) {
    setTimeout(() => {
      showProgress.value = false
      showError.value = false
    }, 1000)
    setTimeout(() => {
      progress.value = 0
    }, 1200)
  }
}

async function handlePicBedNameClick(_picBedName: string, picBedConfigName: string | undefined) {
  const formatedpicBedConfigName = picBedConfigName || 'Default'
  const currentPicBed = await getConfig<string>(configPaths.picBed.current)
  const currentPicBedConfig = ((await getConfig<any[]>(`uploader.${currentPicBed}`)) as any) || {}
  const configList = await window.electron.triggerRPC<IUploaderConfigItem>(
    IRPCActionType.PICBED_GET_CONFIG_LIST,
    currentPicBed,
  )
  const currentConfigList = configList?.configList ?? []
  const config = currentConfigList.find((item: any) => item._configName === formatedpicBedConfigName)
  $router.push({
    name: PICBEDS_PAGE,
    params: {
      type: currentPicBed,
      configId: config?._id || '',
    },
    query: {
      defaultConfigId: currentPicBedConfig.defaultId || '',
    },
  })
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
      const str = e.dataTransfer.getData(items[0].type)
      if (isUrl(str)) {
        window.electron.sendRPC(IRPCActionType.UPLOAD_CHOOSED_FILES, [{ path: str }])
      } else {
        message.error(t('pages.upload.dragValidPictureOrUrl'))
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
  } else {
    message.error(t('pages.upload.dragValidPictureOrUrl'))
  }
}

function openUplodWindow() {
  fileInput.value?.click()
}

function onChange(e: any) {
  ipcSendFiles(e.target.files)
  ;(fileInput.value as HTMLInputElement).value = ''
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

async function getPasteStyle() {
  pasteStyle.value = (await getConfig(configPaths.settings.pasteStyle)) || IPasteStyle.MARKDOWN
  pasteFormatList.value.Custom = (await getConfig(configPaths.settings.customLink)) || '![$fileName]($url)'
}

async function getUseShortUrl() {
  useShortUrl.value = (await getConfig(configPaths.settings.useShortUrl)) || false
}

function updatePasteStyle(style: string) {
  pasteStyle.value = style
  saveConfig({
    [configPaths.settings.pasteStyle]: style || IPasteStyle.MARKDOWN,
  })
}

function updateUrlType(shortUrl: boolean) {
  useShortUrl.value = shortUrl
  saveConfig({
    [configPaths.settings.useShortUrl]: shortUrl,
  })
}

function uploadClipboardFiles() {
  window.electron.sendRPC(IRPCActionType.UPLOAD_CLIPBOARD_FILES_FROM_UPLOAD_PAGE)
}

async function uploadURLFiles() {
  const str = await navigator.clipboard.readText()
  $bus.emit(SHOW_INPUT_BOX, {
    value: isUrl(str) ? str : '',
    title: t('pages.upload.inputUrlTip'),
    placeholder: t('pages.upload.httpPrefixTip') + '\n' + t('pages.upload.multipleUrlsHint'),
    multiLine: true,
  })
}

function handleInputBoxValue(val: string) {
  if (val === '') return

  const urls = val
    .split('\n')
    .map(url => url.trim())
    .filter(url => url !== '')

  if (urls.length === 0) return

  const invalidUrls: string[] = []
  const validUrls: string[] = []

  urls.forEach(url => {
    if (isUrl(url)) {
      validUrls.push(url)
    } else {
      invalidUrls.push(url)
    }
  })

  if (invalidUrls.length > 0) {
    const errorMessage =
      invalidUrls.length === 1
        ? t('pages.upload.inputValidUrl') + ': ' + invalidUrls[0]
        : t('pages.upload.invalidUrlsFound', {
            count: invalidUrls.length,
            urls: invalidUrls.slice(0, 3).join(', ') + (invalidUrls.length > 3 ? '...' : ''),
          })
    message.error(errorMessage)
  }

  if (validUrls.length > 0) {
    const filesToUpload = validUrls.map(url => ({ path: url }))
    window.electron.sendRPC(IRPCActionType.UPLOAD_CHOOSED_FILES, filesToUpload)

    if (validUrls.length > 1) {
      message.success(t('pages.upload.uploadingMultipleUrls', { count: validUrls.length }))
    }
  }
}

async function getDefaultPicBed() {
  const currentPicBed = await getConfig<string>(configPaths.picBed.current)
  picBedGlobal.value.forEach(item => {
    if (item.type === currentPicBed) {
      picBedName.value = item.name
    }
  })
  picBedConfigName.value = (await getConfig<string>(`picBed.${currentPicBed}._configName`)) || ''
}

async function handleChangePicBed() {
  window.electron.sendRPC(IRPCActionType.SHOW_UPLOAD_PAGE_MENU)
}

onBeforeUnmount(() => {
  $bus.off(SHOW_INPUT_BOX_RESPONSE)
  removeUploadProgressListenerCallback()
  removeSyncPicBedListenerCallback()
})

onBeforeMount(() => {
  updatePicBedGlobal()
  getUseShortUrl()
  getPasteStyle()
  getDefaultPicBed()
  removeUploadProgressListenerCallback = window.electron.ipcRendererOn('uploadProgress', uploadProgressHandler)
  removeSyncPicBedListenerCallback = window.electron.ipcRendererOn('syncPicBed', syncPicBedHandler)
  $bus.on(SHOW_INPUT_BOX_RESPONSE, handleInputBoxValue)
})
</script>

<script lang="ts">
export default {
  name: 'UploadPage',
}
</script>

<style scoped src="./css/UploadPage.css"></style>
