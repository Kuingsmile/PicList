<template>
  <div
    id="mini-page"
  >
    <div
      id="upload-area"
      :class="{ 'is-dragover': dragover, uploading: showProgress, linux: os === 'linux' }"
      :style="{ backgroundPosition: '0 ' + progress + '%'}"
      @drop.prevent="onDrop"
      @dragover.prevent="dragover = true"
      @dragleave.prevent="dragover = false"
    >
      <img
        v-if="!dragover && !showProgress"
        :src="logoPath.value ? logoPath.value : require('../assets/squareLogo.png')"
        style="width: 100%; height: 100%;border-radius: 50%;"
      >
      <div
        id="upload-dragger"
        @dblclick="openUploadWindow"
      >
        <input
          id="file-uploader"
          type="file"
          multiple
          @change="onChange"
        >
      </div>
    </div>
  </div>
</template>
<script lang="ts" setup>
// 国际化函数
import { T as $T } from '@/i18n/index'

// Element Plus 消息框组件
import { ElMessage as $message } from 'element-plus'

// Electron 相关
import {
  ipcRenderer,
  IpcRendererEvent
} from 'electron'

// Vue 生命周期钩子
import { onBeforeUnmount, onBeforeMount, ref, watch, reactive } from 'vue'

// 事件常量
import { SHOW_MINI_PAGE_MENU, SET_MINI_WINDOW_POS } from '~/universal/events/constants'

// 工具函数
import {
  isUrl
} from '~/universal/utils/common'

// 数据发送工具函数
import { getConfig, sendToMain } from '@/utils/dataSender'

// Piclist 配置类型声明
import { IConfig } from 'piclist'

// 数据发送工具函数
import { invokeToMain } from '@/manage/utils/dataSender'

const logoPath = reactive({
  value: ''
})
const dragover = ref(false)
const progress = ref(0)
const showProgress = ref(false)
const showError = ref(false)
const dragging = ref(false)
const wX = ref(-1)
const wY = ref(-1)
const screenX = ref(-1)
const screenY = ref(-1)
const os = ref('')

async function initLogoPath () {
  const config = (await getConfig<IConfig>())!
  if (config !== undefined) {
    if (config.settings?.isCustomMiniIcon && config.settings?.customMiniIcon) {
      logoPath.value = 'data:image/jpg;base64,' + await invokeToMain('convertPathToBase64', config.settings.customMiniIcon)
    }
  }
}

onBeforeMount(async () => {
  os.value = process.platform
  await initLogoPath()
  ipcRenderer.on('uploadProgress', (event: IpcRendererEvent, _progress: number) => {
    if (_progress !== -1) {
      showProgress.value = true
      progress.value = _progress
    } else {
      progress.value = 100
      showError.value = true
    }
  })
  window.addEventListener('mousedown', handleMouseDown, false)
  window.addEventListener('mousemove', handleMouseMove, false)
  window.addEventListener('mouseup', handleMouseUp, false)
})

watch(progress, (val) => {
  if (val === 100) {
    setTimeout(() => {
      showProgress.value = false
      showError.value = false
    }, 1000)
    setTimeout(() => {
      progress.value = 0
    }, 1200)
  }
})

function onDrop (e: DragEvent) {
  dragover.value = false
  const items = e.dataTransfer?.items!
  const files = e.dataTransfer?.files!

  // send files first
  if (files?.length) {
    ipcSendFiles(e.dataTransfer?.files!)
  } else {
    if (items.length === 2 && items[0].type === 'text/uri-list') {
      handleURLDrag(items, e.dataTransfer!)
    } else if (items[0].type === 'text/plain') {
      const str = e.dataTransfer!.getData(items[0].type)
      if (isUrl(str)) {
        sendToMain('uploadChoosedFiles', [{ path: str }])
      } else {
        $message.error($T('TIPS_DRAG_VALID_PICTURE_OR_URL'))
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
    sendToMain('uploadChoosedFiles', [
      {
        path: urlMatch[1]
      }
    ])
  } else {
    $message.error($T('TIPS_DRAG_VALID_PICTURE_OR_URL'))
  }
}

function openUploadWindow () {
  // @ts-ignore
  document.getElementById('file-uploader').click()
}

function onChange (e: any) {
  ipcSendFiles(e.target.files)
  // @ts-ignore
  document.getElementById('file-uploader').value = ''
}

function ipcSendFiles (files: FileList) {
  const sendFiles: IFileWithPath[] = []
  Array.from(files).forEach((item) => {
    const obj = {
      name: item.name,
      path: item.path
    }
    sendFiles.push(obj)
  })
  sendToMain('uploadChoosedFiles', sendFiles)
}

function handleMouseDown (e: MouseEvent) {
  dragging.value = true
  wX.value = e.pageX
  wY.value = e.pageY
  screenX.value = e.screenX
  screenY.value = e.screenY
}

function handleMouseMove (e: MouseEvent) {
  e.preventDefault()
  e.stopPropagation()
  if (dragging.value) {
    const xLoc = e.screenX - wX.value
    const yLoc = e.screenY - wY.value
    sendToMain(SET_MINI_WINDOW_POS, {
      x: xLoc,
      y: yLoc,
      width: 64,
      height: 64
    })
  }
}

function handleMouseUp (e: MouseEvent) {
  dragging.value = false
  if (screenX.value === e.screenX && screenY.value === e.screenY) {
    if (e.button === 0) { // left mouse
      openUploadWindow()
    } else {
      openContextMenu()
    }
  }
}

function openContextMenu () {
  sendToMain(SHOW_MINI_PAGE_MENU)
}

onBeforeUnmount(() => {
  ipcRenderer.removeAllListeners('uploadProgress')
  window.removeEventListener('mousedown', handleMouseDown, false)
  window.removeEventListener('mousemove', handleMouseMove, false)
  window.removeEventListener('mouseup', handleMouseUp, false)
})

</script>
<script lang="ts">
export default {
  name: 'MiniPage'
}
</script>
<style lang='stylus'>
  #mini-page
    background #409EFF
    color #FFF
    height 100vh
    width 100vw
    border-radius 50%
    text-align center
    line-height 100vh
    font-size 40px
    background-size 90vh 90vw
    background-position center center
    background-repeat no-repeat
    position relative
    border 4px solid #fff
    box-sizing border-box
    cursor pointer
    &.linux
      border-radius 0
      background-size 100vh 100vw
    #upload-area
      height 100%
      width 100%
      border-radius 50%
      transition all .2s ease-in-out
      &.linux
        border-radius 0
      &.uploading
        background: linear-gradient(to top, #409EFF 50%, #fff 51%)
        background-size 200%
      #upload-dragger
        height 100%
      &.is-dragover
        background rgba(0,0,0,0.3)
    #file-uploader
      display none
</style>
