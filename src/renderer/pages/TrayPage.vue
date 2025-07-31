<template>
  <div id="tray-page">
    <div
      class="open-main-window"
      @click="openSettingWindow"
    >
      {{ $T('OPEN_MAIN_WINDOW') }}
    </div>
    <div class="content">
      <div
        v-if="clipboardFiles.length > 0"
        class="wait-upload-img"
      >
        <div class="list-title">
          {{ $T('WAIT_TO_UPLOAD') }}
        </div>
        <div
          v-for="(item, index) in clipboardFiles"
          :key="index"
          class="img-list"
        >
          <div
            class="upload-img__container"
            :class="{ upload: uploadFlag }"
            @click="uploadClipboardFiles"
          >
            <img
              :src="item.imgUrl"
              class="upload-img"
            >
          </div>
        </div>
      </div>
      <div class="uploaded-img">
        <div class="list-title">
          {{ $T('ALREADY_UPLOAD') }}
        </div>
        <div
          v-for="item in files"
          :key="item.imgUrl"
          class="img-list"
        >
          <div
            class="upload-img__container"
            @click="copyTheLink(item)"
          >
            <img
              v-lazy="item.imgUrl"
              class="upload-img"
            >
            <div
              class="upload-img__title"
              :title="item.fileName"
            >
              {{ item.fileName }}
            </div>
          </div>
        </div>
      </div>
    </div>
  </div>
</template>

<script lang="ts" setup>
import type { IpcRendererEvent } from 'electron'
import { onBeforeMount, onBeforeUnmount, reactive, ref } from 'vue'

import { T as $T } from '@/i18n/index'
import { getConfig } from '@/utils/dataSender'
import $$db from '@/utils/db'
import { IPasteStyle, IRPCActionType, IWindowList } from '#/types/enum'
import { ImgInfo } from '#/types/types'
import { handleUrlEncode } from '#/utils/common'
import { configPaths } from '#/utils/configPaths'

type IResult<T> = T & {
  id: string
  createdAt: number
  updatedAt: number
}
const files = ref<IResult<ImgInfo>[]>([])
const notification = reactive({
  title: $T('COPY_LINK_SUCCEED'),
  body: ''
})

const clipboardFiles = ref<ImgInfo[]>([])
const uploadFlag = ref(false)

function openSettingWindow () {
  window.electron.sendRPC(IRPCActionType.OPEN_WINDOW, IWindowList.SETTING_WINDOW)
}

async function getData () {
  files.value = (await $$db.get<ImgInfo>({ orderBy: 'desc', limit: 5 }))!.data
}

const formatCustomLink = (customLink: string, item: ImgInfo) => {
  const fileName = item.fileName!.replace(new RegExp(`\\${item.extname}$`), '')
  const url = item.url || item.imgUrl
  const extName = item.extname
  const formatObj = {
    url,
    fileName,
    extName
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

async function copyTheLink (item: ImgInfo) {
  const pasteStyle = (await getConfig<IPasteStyle>(configPaths.settings.pasteStyle)) || IPasteStyle.MARKDOWN
  const customLink = await getConfig<string>(configPaths.settings.customLink)
  const txt = await pasteTemplate(pasteStyle, item, customLink)
  window.electron.clipboard.writeText(txt)
  const myNotification = new Notification(notification.title, notification)
  myNotification.onclick = () => {
    return true
  }
}

async function pasteTemplate (style: IPasteStyle, item: ImgInfo, customLink: string | undefined) {
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
  const tpl = {
    markdown: `![](${url})`,
    HTML: `<img src="${url}"/>`,
    URL: url,
    UBB: `[IMG]${url}[/IMG]`,
    Custom: formatCustomLink(_customLink, {
      ...item,
      url
    })
  }
  return tpl[style]
}

function disableDragFile () {
  window.addEventListener(
    'dragover',
    e => {
      e = e || event
      e.preventDefault()
    },
    false
  )
  window.addEventListener(
    'drop',
    e => {
      e = e || event
      e.preventDefault()
    },
    false
  )
}

function uploadClipboardFiles () {
  if (uploadFlag.value) {
    return
  }
  uploadFlag.value = true
  window.electron.sendRPC(IRPCActionType.TRAY_UPLOAD_CLIPBOARD_FILES)
}

const dragFilesHandler = async (_: IpcRendererEvent, _files: string[]) => {
  for (const file of _files) {
    await $$db.insert(file)
  }
  files.value = (await $$db.get<ImgInfo>({
    orderBy: 'desc',
    limit: 5
  }))!.data
}

const clipboardFilesHandler = (_: IpcRendererEvent, files: ImgInfo[]) => {
  clipboardFiles.value = files
}

const uploadFilesHandler = async () => {
  files.value = (await $$db.get<ImgInfo>({
    orderBy: 'desc',
    limit: 5
  }))!.data
  uploadFlag.value = false
}

const updateFilesHandler = () => {
  getData()
}

onBeforeMount(() => {
  disableDragFile()
  getData()
  window.electron.ipcRendererOn('dragFiles', dragFilesHandler)
  window.electron.ipcRendererOn('clipboardFiles', clipboardFilesHandler)
  window.electron.ipcRendererOn('uploadFiles', uploadFilesHandler)
  window.electron.ipcRendererOn('updateFiles', updateFilesHandler)
})

onBeforeUnmount(() => {
  window.electron.ipcRendererRemoveListener('dragFiles', dragFilesHandler)
  window.electron.ipcRendererRemoveListener('clipboardFiles', clipboardFilesHandler)
  window.electron.ipcRendererRemoveListener('uploadFiles', uploadFilesHandler)
  window.electron.ipcRendererRemoveListener('updateFiles', updateFilesHandler)
})
</script>

<script lang="ts">
export default {
  name: 'TrayPage'
}
</script>

<style lang="stylus">
body::-webkit-scrollbar
  width 0px
#tray-page
  background-color transparent
  .open-main-window
    background #000
    height 20px
    line-height 20px
    text-align center
    color #858585
    font-size 12px
    cursor pointer
    transition all .2s ease-in-out
    &:hover
      color: #fff;
      background #49B1F5
  .list-title
    text-align center
    color #858585
    font-size 12px
    padding 6px 0
    position relative
    &:before
      content ''
      position absolute
      height 1px
      width calc(100% - 36px)
      bottom 0
      left 18px
      background #858585
  // .header-arrow
  //   position absolute
  //   top 12px
  //   left 50%
  //   margin-left -10px
  //   width: 0;
  //   height: 0;
  //   border-left: 10px solid transparent
  //   border-right: 10px solid transparent
  //   border-bottom: 10px solid rgba(255,255,255, 1)
  .content
    position absolute
    top 20px
    width 100%
  .img-list
    padding 4px 8px
    display flex
    justify-content space-between
    align-items center
    // height 45px
    cursor pointer
    transition all .2s ease-in-out
    &:hover
      background #49B1F5
      .upload-img__index
        color #fff
    .upload-img__container
      display flex
      flex-direction column
      justify-content center
      align-items center
  .upload-img
    max-width 100%
    object-fit scale-down
    margin 0 auto
    &__container
      display flex
      flex-direction column
      justify-content center
      align-items center
      width 100%
      padding 8px 8px 4px
      height 100%
      &.upload
        cursor not-allowed
    &__title
      text-align center
      overflow hidden
      text-overflow ellipsis
      white-space nowrap
      color #ddd
      font-size 14px
      margin-top 4px
</style>
