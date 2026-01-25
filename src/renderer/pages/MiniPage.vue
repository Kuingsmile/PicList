<template>
  <div
    id="mini-page"
    class="relative box-border h-screen w-screen cursor-pointer overflow-hidden border-4 border-white bg-accent bg-center bg-no-repeat text-center text-[40px] leading-[100vh]"
    :class="[osGlobal === 'linux' ? 'rounded-none bg-size-[100vh_100vw]' : 'rounded-full bg-size-[90vh_90vw]']"
  >
    <div
      ref="uploadArea"
      class="h-full w-full transition-all duration-200 ease-in-out"
      :class="{
        'bg-[rgba(0,0,0,0.3)]': dragover,
        'bg-[linear-gradient(to_top,#409EFF_50%,#fff_51%)] bg-size-[200%]': isShowingProgress,
        'rounded-none': osGlobal === 'linux',
        'rounded-full': osGlobal !== 'linux',
      }"
      :style="{ backgroundPosition: '0 ' + progress + '%' }"
      @drop.prevent="onDrop"
      @dragover.prevent="dragover = true"
      @dragleave.prevent="dragover = false"
    >
      <img
        v-if="!dragover && !isShowingProgress"
        :src="logoPath ? logoPath : './squareLogo.png'"
        class="block h-full w-full [image-rendering:-webkit-optimize-contrast]"
        :class="osGlobal === 'linux' ? 'rounded-none' : 'rounded-full'"
        draggable="false"
        @dragstart.prevent
      />
      <div id="upload-dragger" class="h-full" @dblclick="openUploadWindow">
        <input id="file-uploader" type="file" class="hidden" multiple @change="onChange" />
      </div>
    </div>
  </div>
</template>

<script lang="ts" setup>
import type { IConfig } from 'piclist'
import { onBeforeMount, onBeforeUnmount, ref, useTemplateRef, watch } from 'vue'

import { osGlobal } from '@/hooks/useGlobal'
import { isUrl } from '@/utils/common'
import { getConfig } from '@/utils/dataSender'
import { useDragEventListeners } from '@/utils/drag'
import { IRPCActionType } from '@/utils/enum'

const logoPath = ref('')
const dragover = ref(false)
const progress = ref(0)
const isShowingProgress = ref(false)
const draggingState = ref(false)
const wX = ref(-1)
const wY = ref(-1)
const screenX = ref(-1)
const screenY = ref(-1)
const uploadArea = useTemplateRef<HTMLDivElement>('uploadArea')

useDragEventListeners(uploadArea)

let removeListeners: () => void = () => {}

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

const uploadProgressHandler = (p: number) => {
  if (p !== -1) {
    isShowingProgress.value = true
    progress.value = p
  } else {
    progress.value = 100
  }
}

const updateMiniIconHandler = async () => {
  await initLogoPath()
}

watch(progress, val => {
  if (val === 100) {
    setTimeout(() => {
      isShowingProgress.value = false
    }, 1000)
    setTimeout(() => {
      progress.value = 0
    }, 1200)
  }
})

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
  // @ts-expect-error file-uploader
  document.getElementById('file-uploader').click()
}

function onChange(e: any) {
  ipcSendFiles(e.target.files)
  // @ts-expect-error file-uploader
  document.getElementById('file-uploader').value = ''
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
  window.electron.ipcRendererOn('updateMiniIcon', updateMiniIconHandler)
  window.addEventListener('mousedown', handleMouseDown, false)
  window.addEventListener('mousemove', handleMouseMove, false)
  window.addEventListener('mouseup', handleMouseUp, false)
  await initLogoPath()
})

onBeforeUnmount(() => {
  removeListeners()
  window.electron.ipcRendererRemoveAllListeners('updateMiniIcon')
  window.removeEventListener('mousedown', handleMouseDown, false)
  window.removeEventListener('mousemove', handleMouseMove, false)
  window.removeEventListener('mouseup', handleMouseUp, false)
})
</script>

<script lang="ts">
export default {
  name: 'MiniPage',
}
</script>
