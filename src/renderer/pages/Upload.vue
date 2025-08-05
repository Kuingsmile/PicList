<template>
  <div class="upload-container">
    <!-- Header Card -->
    <div class="upload-card header-card">
      <div class="card-header">
        <div class="provider-section">
          <button
            class="provider-button"
            :title="$t('pages.upload.uploadViewHint')"
            @click="handlePicBedNameClick(picBedName, picBedConfigName)"
          >
            <div class="provider-info">
              <span class="provider-name">{{ picBedName }}</span>
              <span class="provider-config">{{ picBedConfigName || 'Default' }}</span>
            </div>
            <ChevronDownIcon
              :size="16"
              class="provider-arrow"
            />
          </button>
        </div>
        <div class="header-actions">
          <button
            class="action-button secondary"
            @click="handleImageProcess"
          >
            <Settings :size="16" />
            <span>{{ $t('pages.upload.imageProcessName') }}</span>
          </button>
          <button
            class="action-button"
            @click="handleChangePicBed"
          >
            <DatabaseIcon :size="16" />
            <span>{{ $t('pages.upload.changePicBed') }}</span>
          </button>
        </div>
      </div>
    </div>

    <!-- Main Upload Card -->
    <div class="upload-card main-card">
      <div
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
              {{ $t('pages.upload.dragFileToHere') }}
            </h3>
            <p class="upload-subtitle">
              {{ $t('pages.upload.clickToUpload') }}
            </p>
            <div class="upload-formats">
              <span class="format-label">{{ $t('pages.upload.uploadHint') }}</span>
            </div>
          </div>
        </div>
        <input
          id="file-uploader"
          ref="fileInput"
          type="file"
          multiple
          style="display: none"
          @change="onChange"
        >
      </div>

      <!-- Progress Bar -->
      <transition name="progress">
        <div
          v-if="showProgress"
          class="progress-container"
        >
          <div class="progress-bar">
            <div
              class="progress-fill"
              :class="{ 'progress-error': showError }"
              :style="{ width: `${progress}%` }"
            />
          </div>
          <span class="progress-text">
            {{ showError ? $t('pages.upload.uploadFailed') : `${progress}%` }}
          </span>
        </div>
      </transition>
    </div>

    <!-- Quick Actions Card -->
    <div class="upload-card actions-card">
      <div class="card-header">
        <h4 class="card-title">
          {{ $t('pages.upload.quickUpload') }}
        </h4>
      </div>
      <div class="quick-actions">
        <button
          class="quick-action-button"
          @click="uploadClipboardFiles"
        >
          <ClipboardIcon :size="20" />
          <span>{{ $t('pages.upload.clipboardPicture') }}</span>
        </button>
        <button
          class="quick-action-button"
          @click="uploadURLFiles"
        >
          <LinkIcon :size="20" />
          <span>{{ $t('pages.upload.urlUpload') }}</span>
        </button>
      </div>
    </div>

    <!-- Settings Card -->
    <div class="upload-card settings-card">
      <div class="card-header">
        <h4 class="card-title">
          {{ $t('pages.upload.linkFormat') }}
        </h4>
      </div>
      <div class="settings-content">
        <!-- Format Options -->
        <div class="setting-group">
          <label class="setting-label">{{ $t('pages.upload.outputFormat') }}</label>
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
          <label class="setting-label">{{ $t('pages.upload.urlType.title') }}</label>
          <div class="url-toggle">
            <button
              class="toggle-button"
              :class="{ active: !useShortUrl }"
              @click="updateUrlType(false)"
            >
              <span>{{ $t('pages.upload.urlType.normal') }}</span>
            </button>
            <button
              class="toggle-button"
              :class="{ active: useShortUrl }"
              @click="updateUrlType(true)"
            >
              <span>{{ $t('pages.upload.urlType.short') }}</span>
            </button>
          </div>
        </div>
      </div>
    </div>

    <!-- Image Process Dialog -->
    <transition name="modal">
      <div
        v-if="imageProcessDialogVisible"
        class="modal-overlay"
        @click="imageProcessDialogVisible = false"
      >
        <div
          class="modal-container"
          @click.stop
        >
          <div class="modal-header">
            <h3 class="modal-title">
              {{ $t('pages.imageProcess.title') }}
            </h3>
            <button
              class="modal-close"
              @click="imageProcessDialogVisible = false"
            >
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
import type { IpcRendererEvent } from 'electron'
import { ElMessage as $message } from 'element-plus'
import { ChevronDownIcon, ClipboardIcon, DatabaseIcon, LinkIcon, Settings, UploadCloudIcon, XIcon } from 'lucide-vue-next'
import { onBeforeMount, onBeforeUnmount, ref, watch } from 'vue'
import { useI18n } from 'vue-i18n'
import { useRouter } from 'vue-router'

import ImageProcessSetting from '@/components/ImageProcessSetting.vue'
import { PICBEDS_PAGE } from '@/router/config'
import $bus from '@/utils/bus'
import { getConfig, saveConfig } from '@/utils/dataSender'
import { useDragEventListeners } from '@/utils/drag'
import { picBedGlobal, updatePicBedGlobal } from '@/utils/global'
import { SHOW_INPUT_BOX, SHOW_INPUT_BOX_RESPONSE } from '#/events/constants'
import { IPasteStyle, IRPCActionType } from '#/types/enum'
import { IFileWithPath, IUploaderConfigItem } from '#/types/types'
import { isUrl } from '#/utils/common'
import { configPaths } from '#/utils/configPaths'

const { t } = useI18n()
useDragEventListeners()
const $router = useRouter()

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

const pasteFormatList = ref({
  [IPasteStyle.MARKDOWN]: '![alt](url)',
  [IPasteStyle.HTML]: '<img src="url"/>',
  [IPasteStyle.URL]: 'http://test.com/test.png',
  [IPasteStyle.UBB]: '[img]url[/img]',
  [IPasteStyle.CUSTOM]: ''
})

watch(picBedGlobal, () => {
  getDefaultPicBed()
})

const uploadProgressHandler = (_event: IpcRendererEvent, _progress: number) => {
  if (_progress !== -1) {
    showProgress.value = true
    progress.value = _progress
  } else {
    progress.value = 100
    showError.value = true
  }
}

const syncPicBedHandler = () => {
  getDefaultPicBed()
}

onBeforeMount(() => {
  updatePicBedGlobal()
  window.electron.ipcRendererOn('uploadProgress', uploadProgressHandler)
  getUseShortUrl()
  getPasteStyle()
  getDefaultPicBed()
  window.electron.ipcRendererOn('syncPicBed', syncPicBedHandler)
  $bus.on(SHOW_INPUT_BOX_RESPONSE, handleInputBoxValue)
})

const handleImageProcess = () => {
  imageProcessDialogVisible.value = true
}

watch(progress, onProgressChange)

function onProgressChange (val: number) {
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

async function handlePicBedNameClick (_picBedName: string, picBedConfigName: string | undefined) {
  const formatedpicBedConfigName = picBedConfigName || 'Default'
  const currentPicBed = await getConfig<string>(configPaths.picBed.current)
  const currentPicBedConfig = ((await getConfig<any[]>(`uploader.${currentPicBed}`)) as any) || {}
  const configList = await window.electron.triggerRPC<IUploaderConfigItem>(IRPCActionType.PICBED_GET_CONFIG_LIST, currentPicBed)
  const currentConfigList = configList?.configList ?? []
  const config = currentConfigList.find((item: any) => item._configName === formatedpicBedConfigName)
  $router.push({
    name: PICBEDS_PAGE,
    params: {
      type: currentPicBed,
      configId: config?._id || ''
    },
    query: {
      defaultConfigId: currentPicBedConfig.defaultId || ''
    }
  })
}

onBeforeUnmount(() => {
  $bus.off(SHOW_INPUT_BOX_RESPONSE)
  window.electron.ipcRendererRemoveListener('uploadProgress', uploadProgressHandler)
  window.electron.ipcRendererRemoveListener('syncPicBed', syncPicBedHandler)
})

function onDrop (e: DragEvent) {
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
        $message.error(t('pages.upload.dragValidPictureOrUrl'))
      }
    }
  }
}

function handleURLDrag (items: DataTransferItemList, dataTransfer: DataTransfer) {
  // text/html
  // Use this data to get a more precise URL
  const urlString = dataTransfer.getData(items[1].type)
  const urlMatch = urlString.match(/<img.*src="(.*?)"/)
  if (urlMatch) {
    window.electron.sendRPC(IRPCActionType.UPLOAD_CHOOSED_FILES, [
      {
        path: urlMatch[1]
      }
    ])
  } else {
    $message.error(t('pages.upload.dragValidPictureOrUrl'))
  }
}

function openUplodWindow () {
  fileInput.value?.click()
}

function onChange (e: any) {
  ipcSendFiles(e.target.files)
  ;(fileInput.value as HTMLInputElement).value = ''
}

function ipcSendFiles (files: FileList) {
  const sendFiles: IFileWithPath[] = []
  Array.from(files).forEach(item => {
    const obj = {
      name: item.name,
      path: window.electron.showFilePath(item)
    }
    sendFiles.push(obj)
  })
  window.electron.sendRPC(IRPCActionType.UPLOAD_CHOOSED_FILES, sendFiles)
}

async function getPasteStyle () {
  pasteStyle.value = (await getConfig(configPaths.settings.pasteStyle)) || IPasteStyle.MARKDOWN
  pasteFormatList.value.Custom = (await getConfig(configPaths.settings.customLink)) || '![$fileName]($url)'
}

async function getUseShortUrl () {
  useShortUrl.value = (await getConfig(configPaths.settings.useShortUrl)) || false
}

function updatePasteStyle (style: string) {
  pasteStyle.value = style
  saveConfig({
    [configPaths.settings.pasteStyle]: style || IPasteStyle.MARKDOWN
  })
}

function updateUrlType (shortUrl: boolean) {
  useShortUrl.value = shortUrl
  saveConfig({
    [configPaths.settings.useShortUrl]: shortUrl
  })
}

function uploadClipboardFiles () {
  window.electron.sendRPC(IRPCActionType.UPLOAD_CLIPBOARD_FILES_FROM_UPLOAD_PAGE)
}

async function uploadURLFiles () {
  const str = await navigator.clipboard.readText()
  $bus.emit(SHOW_INPUT_BOX, {
    value: isUrl(str) ? str : '',
    title: t('pages.upload.inputUrlTip'),
    placeholder: t('pages.upload.httpPrefixTip')
  })
}

function handleInputBoxValue (val: string) {
  if (val === '') return
  if (isUrl(val)) {
    window.electron.sendRPC(IRPCActionType.UPLOAD_CHOOSED_FILES, [
      {
        path: val
      }
    ])
  } else {
    $message.error(t('pages.upload.inputValidUrl'))
  }
}

async function getDefaultPicBed () {
  const currentPicBed = await getConfig<string>(configPaths.picBed.current)
  picBedGlobal.value.forEach(item => {
    if (item.type === currentPicBed) {
      picBedName.value = item.name
    }
  })
  picBedConfigName.value = (await getConfig<string>(`picBed.${currentPicBed}._configName`)) || ''
}

async function handleChangePicBed () {
  window.electron.sendRPC(IRPCActionType.SHOW_UPLOAD_PAGE_MENU)
}
</script>

<script lang="ts">
export default {
  name: 'UploadPage'
}
</script>

<style scoped>
/* Global scrolling behavior */
html, body {
  overflow-x: hidden;
}

/* Container */
.upload-container {
  padding: 1rem;
  width: 100%;
  margin: 0;
  display: flex;
  flex-direction: column;
  gap: 1.25rem;
  min-height: 100vh;
  box-sizing: border-box;
  overflow-y: auto;
}

/* Card Base */
.upload-card {
  background: var(--color-surface);
  border: 1px solid var(--color-border-secondary);
  border-radius: var(--radius-xl);
  overflow: hidden;
  transition: var(--transition-medium);
  box-shadow: var(--shadow-sm);
}

.upload-card:hover {
  box-shadow: var(--shadow-md);
  border-color: var(--color-border);
}

/* Compact cards styling */
.actions-card,
.settings-card {
  border-radius: var(--radius-lg);
}

.actions-card .card-header,
.settings-card .card-header {
  padding: 0.875rem 1.25rem;
}

/* Header Card */
.header-card .card-header {
  display: flex;
  align-items: center;
  justify-content: space-between;
  padding: 1rem 1.5rem;
  border-bottom: 1px solid var(--color-border-secondary);
  flex-wrap: wrap;
  gap: 1rem;
}

.provider-section {
  flex: 1;
}

.provider-button {
  display: flex;
  align-items: center;
  gap: 0.75rem;
  padding: 0.75rem 1rem;
  background: var(--color-surface-elevated);
  border: 1px solid var(--color-border);
  border-radius: var(--radius-lg);
  cursor: pointer;
  transition: var(--transition-fast);
  font-family: inherit;
  width: auto;
  min-width: 200px;
  flex-shrink: 0;
}

.provider-button:hover {
  background: var(--color-surface);
  border-color: var(--color-accent);
  transform: translateY(-1px);
  box-shadow: var(--shadow-sm);
}

.provider-info {
  display: flex;
  flex-direction: column;
  align-items: flex-start;
  flex: 1;
}

.provider-name {
  font-size: 0.875rem;
  font-weight: 600;
  color: var(--color-text-primary);
  line-height: 1.2;
}

.provider-config {
  font-size: 0.75rem;
  color: var(--color-text-secondary);
  line-height: 1.2;
}

.provider-arrow {
  color: var(--color-text-secondary);
  transition: var(--transition-fast);
}

.provider-button:hover .provider-arrow {
  color: var(--color-accent);
  transform: rotate(180deg);
}

.header-actions {
  display: flex;
  align-items: center;
  gap: 0.75rem;
  flex-wrap: wrap;
}

.action-button {
  display: flex;
  align-items: center;
  gap: 0.5rem;
  padding: 0.625rem 1rem;
  background: var(--color-accent);
  color: white;
  border: none;
  border-radius: var(--radius-md);
  font-size: 0.875rem;
  font-weight: 500;
  cursor: pointer;
  transition: var(--transition-fast);
  font-family: inherit;
}

.action-button:hover {
  background: var(--color-accent-hover);
  transform: translateY(-1px);
  box-shadow: var(--shadow-md);
}

.action-button.secondary {
  background: var(--color-surface-elevated);
  color: var(--color-text-primary);
  border: 1px solid var(--color-border);
}

.action-button.secondary:hover {
  background: var(--color-surface);
  border-color: var(--color-accent);
  color: var(--color-accent);
}

/* Main Upload Card */
.main-card {
  min-height: 300px;
}

.upload-zone {
  position: relative;
  padding: 3rem 2rem;
  cursor: pointer;
  transition: var(--transition-medium);
  border: 2px dashed var(--color-border);
  border-radius: var(--radius-xl);
  background: linear-gradient(135deg, var(--color-surface) 0%, var(--color-background-secondary) 100%);
  margin: 1rem;
}

.upload-zone:hover,
.upload-zone.drag-active {
  border-color: var(--color-accent);
  background: linear-gradient(135deg, var(--color-surface-elevated) 0%, rgba(0, 122, 255, 0.05) 100%);
  transform: translateY(-2px);
  box-shadow: var(--shadow-lg);
}

.upload-content {
  display: flex;
  flex-direction: column;
  align-items: center;
  gap: 1.5rem;
  text-align: center;
}

.upload-icon {
  width: 80px;
  height: 80px;
  border-radius: 50%;
  background: linear-gradient(135deg, var(--color-accent) 0%, rgba(0, 122, 255, 0.8) 100%);
  display: flex;
  align-items: center;
  justify-content: center;
  color: white;
  transition: var(--transition-medium);
}

.upload-zone:hover .upload-icon,
.upload-zone.drag-active .upload-icon {
  transform: scale(1.1);
}

.upload-text {
  display: flex;
  flex-direction: column;
  gap: 0.75rem;
}

.upload-title {
  font-size: 1.25rem;
  font-weight: 600;
  color: var(--color-text-primary);
  margin: 0;
  letter-spacing: -0.025em;
}

.upload-subtitle {
  font-size: 0.875rem;
  color: var(--color-text-secondary);
  margin: 0;
}

.upload-formats {
  display: flex;
  flex-direction: column;
  gap: 0.25rem;
  margin-top: 0.5rem;
}

.format-label {
  font-size: 0.75rem;
  font-weight: 500;
  color: var(--color-text-secondary);
  text-transform: uppercase;
  letter-spacing: 0.025em;
}

/* Progress */
.progress-container {
  margin: 1rem 1.5rem;
  padding: 1rem;
  background: var(--color-surface-elevated);
  border-radius: var(--radius-lg);
  border: 1px solid var(--color-border-secondary);
}

.progress-bar {
  height: 6px;
  background: var(--color-border-secondary);
  border-radius: 3px;
  overflow: hidden;
  margin-bottom: 0.5rem;
}

.progress-fill {
  height: 100%;
  background: linear-gradient(90deg, var(--color-accent) 0%, var(--color-primary) 100%);
  border-radius: 3px;
  transition: width var(--transition-medium);
}

.progress-fill.progress-error {
  background: var(--color-danger);
}

.progress-text {
  font-size: 0.875rem;
  font-weight: 500;
  color: var(--color-text-secondary);
  text-align: center;
  display: block;
}

/* Quick Actions Card */
.card-header {
  padding: 1rem 1.5rem;
  border-bottom: 1px solid var(--color-border-secondary);
}

.card-title {
  font-size: 0.9rem;
  font-weight: 600;
  color: var(--color-text-primary);
  margin: 0;
  letter-spacing: -0.025em;
}

.quick-actions {
  padding: 1rem 1.5rem;
  display: grid;
  grid-template-columns: repeat(auto-fit, minmax(160px, 1fr));
  gap: 0.75rem;
}

.quick-action-button {
  display: flex;
  flex-direction: row;
  align-items: center;
  gap: 0.5rem;
  padding: 0.875rem 1rem;
  background: var(--color-surface-elevated);
  border: 1px solid var(--color-border);
  border-radius: var(--radius-lg);
  cursor: pointer;
  transition: var(--transition-medium);
  font-family: inherit;
  text-align: left;
}

.quick-action-button:hover {
  background: var(--color-surface);
  border-color: var(--color-accent);
  transform: translateY(-2px);
  box-shadow: var(--shadow-md);
}

.quick-action-button span {
  font-size: 0.8rem;
  font-weight: 500;
  color: var(--color-text-primary);
}

/* Settings Card */
.settings-content {
  padding: 1.25rem 1.5rem;
  display: flex;
  flex-direction: column;
  gap: 1.5rem;
}

.setting-group {
  display: flex;
  flex-direction: column;
  gap: 0.75rem;
}

@media (min-width: 768px) {
  .settings-content {
    display: grid;
    grid-template-columns: 1fr 1fr;
    gap: 1.5rem;
    align-items: start;
  }

  .quick-actions {
    grid-template-columns: repeat(auto-fit, minmax(180px, 1fr));
  }
}

@media (min-width: 1024px) {
  .upload-container {
    padding: 1.5rem 2rem;
    max-width: 1200px;
    margin: 0 auto;
  }

  .quick-actions {
    grid-template-columns: repeat(auto-fit, minmax(200px, 1fr));
  }

  .settings-content {
    gap: 2rem;
  }
}

.setting-label {
  font-size: 0.875rem;
  font-weight: 500;
  color: var(--color-text-primary);
  margin: 0;
}

.format-buttons {
  display: grid;
  grid-template-columns: repeat(auto-fit, minmax(70px, 1fr));
  gap: 0.4rem;
}

.format-button {
  padding: 0.4rem 0.75rem;
  background: var(--color-surface-elevated);
  border: 1px solid var(--color-border);
  border-radius: var(--radius-md);
  font-size: 0.7rem;
  font-weight: 500;
  color: var(--color-text-secondary);
  cursor: pointer;
  transition: var(--transition-fast);
  font-family: 'SF Mono', Monaco, 'Cascadia Code', 'Roboto Mono', Consolas, 'Courier New', monospace;
}

.format-button:hover {
  border-color: var(--color-accent);
  color: var(--color-text-primary);
}

.format-button.active {
  background: var(--color-accent);
  border-color: var(--color-accent);
  color: white;
}

.url-toggle {
  display: flex;
  background: var(--color-surface-elevated);
  border: 1px solid var(--color-border);
  border-radius: var(--radius-md);
  overflow: hidden;
  width: 100%;
}

.toggle-button {
  flex: 1;
  padding: 0.625rem 0.875rem;
  background: transparent;
  border: none;
  font-size: 0.8rem;
  font-weight: 500;
  color: var(--color-text-secondary);
  cursor: pointer;
  transition: var(--transition-fast);
  font-family: inherit;
}

.toggle-button:hover {
  color: var(--color-text-primary);
}

.toggle-button.active {
  background: var(--color-accent);
  color: white;
}

.toggle-button:first-child.active {
  border-top-left-radius: calc(var(--radius-md) - 1px);
  border-bottom-left-radius: calc(var(--radius-md) - 1px);
}

.toggle-button:last-child.active {
  border-top-right-radius: calc(var(--radius-md) - 1px);
  border-bottom-right-radius: calc(var(--radius-md) - 1px);
}

/* Modal */
.modal-overlay {
  position: fixed;
  inset: 0;
  background: rgba(0, 0, 0, 0.5);
  z-index: 1000;
  display: flex;
  align-items: center;
  justify-content: center;
  padding: 2rem;
  overflow-y: auto;
}

.modal-container {
  background: var(--color-surface);
  border-radius: var(--radius-2xl);
  border: 1px solid var(--color-border);
  box-shadow: var(--shadow-xl);
  max-width: 90vw;
  width: 80vw;
  height: 80vh;
  max-height: 90vh;
  overflow: hidden;
  margin: auto;
}

.modal-header {
  display: flex;
  align-items: center;
  justify-content: space-between;
  padding: 1.5rem 2rem;
  border-bottom: 1px solid var(--color-border-secondary);
}

.modal-title {
  font-size: 1.25rem;
  font-weight: 600;
  color: var(--color-text-primary);
  margin: 0;
}

.modal-close {
  display: flex;
  align-items: center;
  justify-content: center;
  width: 32px;
  height: 32px;
  background: var(--color-surface-elevated);
  border: 1px solid var(--color-border);
  border-radius: 50%;
  cursor: pointer;
  transition: var(--transition-fast);
  color: var(--color-text-secondary);
}

.modal-close:hover {
  background: var(--color-surface);
  border-color: var(--color-danger);
  color: var(--color-danger);
}

.modal-content {
  padding: 0.2rem;
  overflow-y: auto;
  max-height: calc(90vh - 120px);
  scrollbar-width: none;
  -ms-overflow-style: none;
}

.modal-content::-webkit-scrollbar {
  display: none;
}

/* Transitions */
.progress-enter-active,
.progress-leave-active {
  transition: all var(--transition-medium);
}

.progress-enter-from,
.progress-leave-to {
  opacity: 0;
  transform: translateY(-10px);
}

.modal-enter-active,
.modal-leave-active {
  transition: all var(--transition-medium);
}

.modal-enter-from,
.modal-leave-to {
  opacity: 0;
  transform: scale(0.95);
}

/* Responsive Design */
@media (max-width: 768px) {
  .upload-container {
    padding: 0.75rem;
    gap: 1rem;
  }

  .header-card .card-header {
    flex-direction: column;
    align-items: stretch;
  }

  .provider-section {
    order: 1;
  }

  .header-actions {
    order: 2;
    justify-content: stretch;
  }

  .action-button {
    flex: 1;
    justify-content: center;
  }

  .upload-zone {
    padding: 2rem 1rem;
    margin: 0.75rem;
  }

  .upload-icon {
    width: 60px;
    height: 60px;
  }

  .quick-actions {
    grid-template-columns: 1fr;
    padding: 0.875rem 1rem;
  }

  .settings-content {
    grid-template-columns: 1fr !important;
    padding: 1rem 1.25rem;
  }

  .format-buttons {
    display: grid;
    grid-template-columns: repeat(auto-fit, minmax(60px, 1fr));
  }

  .modal-overlay {
    padding: 1rem;
  }

  .modal-header,
  .modal-content {
    padding: 1.5rem;
  }
}

@media (max-width: 480px) {
  .upload-container {
    padding: 0.5rem;
  }

  .upload-zone {
    margin: 0.5rem;
    padding: 1.5rem 1rem;
  }

  .upload-title {
    font-size: 1.125rem;
  }

  .quick-action-button {
    padding: 0.75rem 0.875rem;
  }

  .action-button {
    padding: 0.5rem 0.75rem;
    font-size: 0.8rem;
  }

  .provider-button {
    min-width: unset;
    width: 100%;
  }
}

/* Dark mode adjustments */
:root.dark .upload-zone,
:root.auto.dark .upload-zone {
  background: linear-gradient(135deg, var(--color-background-secondary) 0%, var(--color-background-tertiary) 100%);
}

:root.dark .upload-zone:hover,
:root.dark .upload-zone.drag-active,
:root.auto.dark .upload-zone:hover,
:root.auto.dark .upload-zone.drag-active {
  background: linear-gradient(135deg, var(--color-surface) 0%, rgba(0, 122, 255, 0.1) 100%);
}

/* Animation for upload icon */
@keyframes float {
  0%, 100% {
    transform: translateY(0px);
  }
  50% {
    transform: translateY(-10px);
  }
}

.upload-zone.drag-active .upload-icon {
  animation: float 1.5s ease-in-out infinite;
}

/* Accessibility */
@media (prefers-reduced-motion: reduce) {
  *,
  *::before,
  *::after {
    animation-duration: 0.01ms !important;
    animation-iteration-count: 1 !important;
    transition-duration: 0.01ms !important;
  }
}

/* Focus styles for keyboard navigation */
.provider-button:focus-visible,
.action-button:focus-visible,
.quick-action-button:focus-visible,
.format-button:focus-visible,
.toggle-button:focus-visible,
.modal-close:focus-visible {
  outline: 2px solid var(--color-accent);
  outline-offset: 2px;
}

.upload-zone:focus-visible {
  outline: 2px solid var(--color-accent);
  outline-offset: 4px;
}
</style>
