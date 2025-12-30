<template>
  <div id="tray-page">
    <!-- Header -->
    <div class="tray-header" @click="openSettingWindow">
      <div class="header-content">
        <span class="header-text">
          {{ t('pages.tray.openMainWindow') }}
        </span>
      </div>
      <div class="header-arrow">
        <svg width="14" height="14" viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2">
          <path d="m9 18 6-6-6-6" />
        </svg>
      </div>
    </div>

    <!-- Content -->
    <div class="tray-content">
      <!-- Clipboard Files Section -->
      <div v-if="clipboardFiles.length > 0" class="section">
        <div class="section-header">
          <div class="section-title">
            {{ t('pages.tray.waitForUpload') }}
          </div>
          <div class="section-badge">
            {{ clipboardFiles.length }}
          </div>
        </div>
        <div class="image-grid">
          <div
            v-for="(item, index) in clipboardFiles"
            :key="index"
            class="image-item"
            :class="{ uploading: uploadFlag }"
            @click="uploadClipboardFiles"
          >
            <div class="image-container">
              <img :src="item.imgUrl" class="image" @error="onImageError" />
              <div v-if="uploadFlag" class="upload-overlay">
                <div class="spinner" />
              </div>
            </div>
          </div>
        </div>
      </div>

      <!-- Uploaded Files Section -->
      <div class="section">
        <div class="section-header">
          <div class="section-title">
            {{ t('pages.tray.uploaded') }}
          </div>
        </div>
        <div class="image-grid">
          <div v-for="item in files" :key="item.imgUrl" class="image-item" @click="copyTheLink(item)">
            <div class="image-container">
              <img v-lazy="item.imgUrl" class="image" @error="onImageError" />
              <div class="image-overlay">
                <div class="image-title" :title="item.fileName">
                  {{ item.fileName }}
                </div>
                <div class="copy-indicator">
                  <svg width="12" height="12" viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2">
                    <rect x="9" y="9" width="13" height="13" rx="2" ry="2" />
                    <path d="M5 15H4a2 2 0 0 1-2-2V4a2 2 0 0 1 2-2h9a2 2 0 0 1 2 2v1" />
                  </svg>
                </div>
              </div>
            </div>
          </div>
        </div>
      </div>
    </div>
  </div>
</template>

<script lang="ts" setup>
import { onBeforeMount, onBeforeUnmount, reactive, ref } from 'vue'
import { useI18n } from 'vue-i18n'

import { handleUrlEncode } from '@/utils/common'
import { configPaths } from '@/utils/configPaths'
import { getConfig } from '@/utils/dataSender'
import $$db from '@/utils/db'
import { IPasteStyle, IRPCActionType, IWindowList } from '@/utils/enum'
import type { ImgInfo } from '#/types/types'

const { t } = useI18n()

type IResult<T> = T & {
  id: string
  createdAt: number
  updatedAt: number
}
const files = ref<IResult<ImgInfo>[]>([])
const notification = reactive({
  title: t('pages.tray.copySuccess'),
  body: '',
})

const clipboardFiles = ref<ImgInfo[]>([])
const uploadFlag = ref(false)

function openSettingWindow() {
  window.electron.sendRPC(IRPCActionType.OPEN_WINDOW, IWindowList.SETTING_WINDOW)
}

async function getData() {
  files.value = (await $$db.get<ImgInfo>({ orderBy: 'desc', limit: 10 }))!.data
}

const formatCustomLink = (customLink: string, item: ImgInfo) => {
  const fileName = item.fileName!.replace(new RegExp(`\\${item.extname}$`), '')
  const url = item.url || item.imgUrl
  const extName = item.extname
  const formatObj = {
    url,
    fileName,
    extName,
  }
  const keys = Object.keys(formatObj) as ['url', 'fileName', 'extName']
  keys.forEach(item => {
    if (customLink.indexOf(`$${item}`) !== -1) {
      const reg = new RegExp(`\\$${item}`, 'g')
      customLink = customLink.replace(reg, formatObj[item])
    }
  })
  return customLink
}

async function copyTheLink(item: ImgInfo) {
  const pasteStyle = (await getConfig<string>(configPaths.settings.pasteStyle)) || IPasteStyle.MARKDOWN
  const customLink = await getConfig<string>(configPaths.settings.customLink)
  const txt = await pasteTemplate(pasteStyle, item, customLink)
  window.electron.clipboard.writeText(txt)
  const myNotification = new Notification(notification.title, notification)
  myNotification.onclick = () => {
    return true
  }
}

async function pasteTemplate(style: string, item: ImgInfo, customLink: string | undefined) {
  let url = item.url || item.imgUrl
  if (item.type === 'aws-s3' || item.type === 'aws-s3-plist') {
    url = item.imgUrl || item.url || ''
  }
  if ((await getConfig(configPaths.settings.encodeOutputURL)) === true) {
    url = handleUrlEncode(url)
  }
  const useShortUrl = (await getConfig(configPaths.settings.useShortUrl)) || false
  if (useShortUrl) {
    url = (await window.electron.triggerRPC<string>(IRPCActionType.TRAY_GET_SHORT_URL, url)) || url
  }
  notification.body = url
  const _customLink = customLink || '![$fileName]($url)'
  const tpl: Record<string, string> = {
    markdown: `![](${url})`,
    HTML: `<img src="${url}"/>`,
    URL: url,
    UBB: `[IMG]${url}[/IMG]`,
    Custom: formatCustomLink(_customLink, {
      ...item,
      url,
    }),
  }
  return tpl[style]
}

function disableDragFile() {
  window.addEventListener(
    'dragover',
    e => {
      e = e || event
      e.preventDefault()
    },
    false,
  )
  window.addEventListener(
    'drop',
    e => {
      e = e || event
      e.preventDefault()
    },
    false,
  )
}

function uploadClipboardFiles() {
  if (uploadFlag.value) {
    return
  }
  uploadFlag.value = true
  window.electron.sendRPC(IRPCActionType.TRAY_UPLOAD_CLIPBOARD_FILES)
}

function onImageError(event: Event) {
  const img = event.target as HTMLImageElement
  img.style.display = 'none'
}

const dragFilesHandler = async (_files: string[]) => {
  for (const file of _files) {
    await $$db.insert(file)
  }
  files.value = (await $$db.get<ImgInfo>({
    orderBy: 'desc',
    limit: 5,
  }))!.data
}

const clipboardFilesHandler = (files: ImgInfo[]) => {
  clipboardFiles.value = files
}

const uploadFilesHandler = async () => {
  files.value = (await $$db.get<ImgInfo>({
    orderBy: 'desc',
    limit: 5,
  }))!.data
  uploadFlag.value = false
}

const updateFilesHandler = () => {
  getData()
}

onBeforeMount(async () => {
  disableDragFile()
  await getData()
  window.electron.ipcRendererOn('dragFiles', dragFilesHandler)
  window.electron.ipcRendererOn('clipboardFiles', clipboardFilesHandler)
  window.electron.ipcRendererOn('uploadFiles', uploadFilesHandler)
  window.electron.ipcRendererOn('updateFiles', updateFilesHandler)
})

onBeforeUnmount(() => {
  window.electron.ipcRendererRemoveAllListeners('dragFiles')
  window.electron.ipcRendererRemoveAllListeners('clipboardFiles')
  window.electron.ipcRendererRemoveAllListeners('uploadFiles')
  window.electron.ipcRendererRemoveAllListeners('updateFiles')
})
</script>

<script lang="ts">
export default {
  name: 'TrayPage',
}
</script>

<style lang="stylus" scoped>
/* Global styles */
body::-webkit-scrollbar
  width 0px

#tray-page
  width 196px
  height 350px
  background rgba(255, 255, 255, 0.95)
  backdrop-filter blur(20px)
  display flex
  flex-direction column
  overflow hidden
  font-family -apple-system, BlinkMacSystemFont, 'Segoe UI', 'Roboto', sans-serif

/* Header */
.tray-header
  background var(--color-text-tertiary)
  padding 8px 12px
  cursor pointer
  transition all 0.2s ease
  display flex
  align-items center
  justify-content space-between
  min-height 32px
  border-radius 0 0 8px 8px

  &:hover
    transform translateY(-1px)
    box-shadow 0 4px 6px rgba(102, 126, 234, 0.3)

.header-content
  display flex
  align-items center
  gap 8px
  flex 1

.header-text
  color white
  font-size 11px
  font-weight 500
  opacity 0.95

.header-arrow
  color white
  opacity 0.8
  transition transform 0.2s ease
  display flex
  align-items center

.tray-header:hover .header-arrow
  transform translateX(2px)

/* Content */
.tray-content
  flex 1
  padding 8px
  overflow-y auto
  overflow-x hidden

.tray-content::-webkit-scrollbar
  width 4px

.tray-content::-webkit-scrollbar-track
  background rgba(0, 0, 0, 0.05)
  border-radius 2px

.tray-content::-webkit-scrollbar-thumb
  background rgba(0, 0, 0, 0.2)
  border-radius 2px

  &:hover
    background rgba(0, 0, 0, 0.3)

/* Section */
.section
  margin-bottom 12px

  &:last-child
    margin-bottom 0

.section-header
  display flex
  align-items center
  justify-content space-between
  margin-bottom 6px
  padding 0 2px

.section-title
  font-size 10px
  font-weight 600
  color #666
  text-transform uppercase
  letter-spacing 0.5px

.section-badge
  background rgba(102, 126, 234, 0.1)
  color #667eea
  font-size 9px
  font-weight 600
  padding 2px 6px
  border-radius 8px
  min-width 16px
  text-align center

/* Image Grid */
.image-grid
  display grid
  grid-template-columns repeat(2, 1fr)
  gap 6px

.image-item
  position relative
  cursor pointer
  border-radius 6px
  overflow hidden
  transition all 0.2s ease
  background rgba(255, 255, 255, 0.8)
  border 1px solid rgba(0, 0, 0, 0.08)

  &:hover
    transform translateY(-2px)
    box-shadow 0 4px 12px rgba(0, 0, 0, 0.15)
    border-color rgba(102, 126, 234, 0.3)

  &.uploading
    cursor not-allowed
    opacity 0.7

.image-container
  position relative
  width 100%
  height 60px
  overflow hidden

.image
  width 100%
  height 100%
  object-fit cover
  transition transform 0.2s ease

.image-item:hover .image
  transform scale(1.05)

/* Upload Overlay */
.upload-overlay
  position absolute
  top 0
  left 0
  right 0
  bottom 0
  background rgba(255, 255, 255, 0.9)
  display flex
  align-items center
  justify-content center

.spinner
  width 16px
  height 16px
  border 2px solid rgba(102, 126, 234, 0.2)
  border-left-color #667eea
  border-radius 50%
  animation spin 1s linear infinite

@keyframes spin
  0%
    transform rotate(0deg)
  100%
    transform rotate(360deg)

/* Image Overlay */
.image-overlay
  position absolute
  bottom 0
  left 0
  right 0
  background linear-gradient(transparent, rgba(0, 0, 0, 0.7))
  padding 6px 4px 4px
  display flex
  align-items flex-end
  justify-content space-between
  transform translateY(100%)
  transition transform 0.2s ease

.image-item:hover .image-overlay
  transform translateY(0)

.image-title
  color white
  font-size 9px
  font-weight 500
  max-width 60px
  overflow hidden
  text-overflow ellipsis
  white-space nowrap
  line-height 1.2

.copy-indicator
  color white
  opacity 0.8
  display flex
  align-items center

/* Responsive adjustments for very small content */
@media (max-width: 200px)
  .image-grid
    grid-template-columns 1fr

  .header-text
    font-size 10px

  .section-title
    font-size 9px

/* Dark theme support */
@media (prefers-color-scheme: dark)
  #tray-page
    background rgba(30, 30, 30, 0.95)
    color #fff

  .section-title
    color #999

  .image-item
    background rgba(40, 40, 40, 0.8)
    border-color rgba(255, 255, 255, 0.1)

    &:hover
      border-color rgba(102, 126, 234, 0.5)

  .tray-content::-webkit-scrollbar-track
    background rgba(255, 255, 255, 0.05)

  .tray-content::-webkit-scrollbar-thumb
    background rgba(255, 255, 255, 0.2)

    &:hover
      background rgba(255, 255, 255, 0.3)
</style>
