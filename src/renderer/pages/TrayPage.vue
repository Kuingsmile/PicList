<template>
  <div
    id="tay-page"
    class="font-[-apple-system,BlinkMacSystemFont,'Segoe UI',Roboto,sans-serif] no-scrollbar flex h-[350px] w-[196px] flex-col overflow-hidden bg-bg-tertiary/95"
  >
    <!-- Header -->
    <div
      class="rounded-b-0 flex min-h-[32px] cursor-pointer items-center justify-between bg-tertiary/95 px-3 py-2 transition-all duration-fast ease-apple hover:shadow-md"
      @click="openSettingWindow"
    >
      <div class="flex flex-1 items-center gap-2">
        <span class="text-xs font-semibold text-white opacity-95">
          {{ t('pages.tray.openMainWindow') }}
        </span>
      </div>
      <div
        class="flex items-center text-white opacity-80 transition-transform duration-fast ease-apple hover:translate-x-px"
      >
        <svg width="14" height="14" viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="4">
          <path d="m9 18 6-6-6-6" />
        </svg>
      </div>
    </div>

    <!-- Content -->
    <div class="no-scrollbar flex-1 overflow-x-hidden overflow-y-auto p-2">
      <!-- Clipboard Files Section -->
      <div v-if="clipboardFiles.length > 0" class="mb-3 last:mb-0">
        <div class="mb-1 flex items-center justify-between px-2">
          <div class="text-xs font-semibold text-gray-600 uppercase">
            {{ t('pages.tray.waitForUpload') }}
          </div>
          <div class="rounded-full bg-blue-100 px-2 py-0.5 text-xs font-semibold text-accent">
            {{ clipboardFiles.length }}
          </div>
        </div>
        <div class="grid grid-cols-1 gap-1">
          <div
            v-for="(item, index) in clipboardFiles"
            :key="index"
            class="group/one relative cursor-pointer overflow-hidden rounded-md border border-border-secondary bg-white/80 transition-all duration-fast ease-apple hover:border-accent/30 hover:shadow-md"
            :class="{ uploading: uploadFlag }"
            @click="uploadClipboardFiles"
          >
            <div class="relative h-16 w-full overflow-hidden">
              <img
                :src="item.imgUrl"
                class="h-full w-full object-cover transition-all duration-fast ease-apple group-hover/one:scale-105"
                @error="onImageError"
              />
              <div v-if="uploadFlag" class="absolute inset-0 flex items-center justify-center bg-white/90">
                <div
                  class="h-[16px] w-[16px] animate-spin rounded-full border-2 border-t-2 border-gray-400 border-t-transparent"
                />
              </div>
            </div>
          </div>
        </div>
      </div>

      <!-- Uploaded Files Section -->
      <div class="mb-3">
        <div class="mb-1.5 flex items-center justify-between px-0.5">
          <div class="text-xs font-semibold text-gray-600 uppercase">
            {{ t('pages.tray.uploaded') }}
          </div>
        </div>
        <div class="flex w-full flex-col items-center gap-3">
          <div
            v-for="item in files"
            :key="item.imgUrl"
            class="group/two relative w-full flex-1 cursor-pointer overflow-hidden rounded-md border border-border-secondary bg-white/80 transition-all duration-fast ease-apple hover:border-accent/30 hover:shadow-md"
            @click="copyTheLink(item)"
          >
            <div class="relative flex h-[75px] w-full flex-col overflow-hidden">
              <img
                :src="item.imgUrl"
                class="h-[60px] w-full object-cover transition-all duration-fast ease-apple group-hover/two:scale-105"
                @error="onImageError"
              />
              <div
                class="flex items-start justify-between bg-white/70 p-1 transition-all duration-fast ease-apple group-hover/two:opacity-100"
              >
                <div class="overflow-hidden text-[0.6rem] font-medium text-ellipsis whitespace-nowrap text-secondary">
                  {{ item.fileName }}
                </div>
                <div class="flex items-center text-accent opacity-80">
                  <svg width="11" height="11" viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2">
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
  img.src = './errorLoading.png'
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
  window.electron.ipcRendererOn('dragFiles', dragFilesHandler)
  window.electron.ipcRendererOn('clipboardFiles', clipboardFilesHandler)
  window.electron.ipcRendererOn('uploadFiles', uploadFilesHandler)
  window.electron.ipcRendererOn('updateFiles', updateFilesHandler)
  disableDragFile()
  await getData()
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
