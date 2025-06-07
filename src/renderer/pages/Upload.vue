<template>
  <div id="upload-view">
    <el-row :gutter="16" align="middle">
      <el-col :span="24">
        <div class="view-title">
          <el-tooltip placement="top" effect="light" :content="$T('UPLOAD_VIEW_HINT')" :persistent="false" teleported>
            <span id="upload-view-title" @click="handlePicBedNameClick(picBedName, picBedConfigName)">
              {{ picBedName }} - {{ picBedConfigName || 'Default' }}
            </span>
          </el-tooltip>
          <el-icon style="cursor: pointer; margin-left: 4px" @click="handleChangePicBed">
            <CaretBottom />
          </el-icon>
          <el-button
            type="primary"
            round
            size="small"
            class="quick-upload"
            style="margin-left: 6px"
            @click="handleImageProcess"
          >
            {{ $T('UPLOAD_PAGE_IMAGE_PROCESS_NAME') }}
          </el-button>
        </div>
        <div
          id="upload-area"
          :class="{ 'is-dragover': dragover }"
          @drop.prevent="onDrop"
          @dragover.prevent="dragover = true"
          @dragleave.prevent="dragover = false"
        >
          <div id="upload-dragger" @click="openUplodWindow">
            <el-icon>
              <UploadFilled />
            </el-icon>
            <div class="upload-dragger__text">
              {{ $T('DRAG_FILE_TO_HERE') }}
              <span>{{ $T('CLICK_TO_UPLOAD') }}</span>
            </div>
            <input id="file-uploader" type="file" multiple @change="onChange" />
          </div>
        </div>
        <el-progress
          :percentage="progress"
          :show-text="false"
          class="upload-progress"
          :class="{ show: showProgress }"
          :status="showError ? 'exception' : undefined"
        />
        <div class="paste-style">
          <div class="el-col-12">
            <div class="paste-style__text">
              {{ $T('LINK_FORMAT') }}
            </div>
            <el-radio-group v-model="pasteStyle" size="small" @change="handlePasteStyleChange">
              <el-radio-button v-for="(item, key) in pasteFormatList" :key="key" :value="key" :title="item">
                {{ key }}
              </el-radio-button>
            </el-radio-group>
            <el-radio-group v-model="useShortUrl" size="small" @change="handleUseShortUrlChange">
              <el-radio-button :value="true" style="border-radius: 5px">
                {{ $T('UPLOAD_SHORT_URL') }}
              </el-radio-button>
              <el-radio-button :value="false" style="border-radius: 5px">
                {{ $T('UPLOAD_NORMAL_URL') }}
              </el-radio-button>
            </el-radio-group>
          </div>
          <div class="el-col-8">
            <div class="paste-style__text">
              {{ $T('QUICK_UPLOAD') }}
            </div>
            <el-button
              type="primary"
              round
              size="small"
              class="quick-upload"
              style="width: 50%"
              @click="uploadClipboardFiles"
            >
              {{ $T('CLIPBOARD_PICTURE') }}
            </el-button>
            <el-button
              type="primary"
              round
              size="small"
              class="quick-upload"
              style="width: 46%; margin-left: 6px"
              @click="uploadURLFiles"
            >
              URL
            </el-button>
          </div>
        </div>
      </el-col>
    </el-row>
    <el-dialog
      v-model="imageProcessDialogVisible"
      :title="$T('UPLOAD_PAGE_IMAGE_PROCESS_DIALOG_TITLE')"
      width="50%"
      draggable
      center
      align-center
      append-to-body
    >
      <ImageProcessSetting v-model="imageProcessDialogVisible" />
    </el-dialog>
  </div>
</template>

<script lang="ts" setup>
import { ipcRenderer, IpcRendererEvent } from 'electron'
import { ElMessage as $message } from 'element-plus'
import { UploadFilled, CaretBottom } from '@element-plus/icons-vue'
import { ref, onBeforeMount, onBeforeUnmount, watch } from 'vue'
import { useRouter } from 'vue-router'

import ImageProcessSetting from '@/components/ImageProcessSetting.vue'
import { T as $T } from '@/i18n'
import { PICBEDS_PAGE } from '@/router/config'
import $bus from '@/utils/bus'
import { sendRPC, triggerRPC } from '@/utils/common'
import { getConfig, saveConfig } from '@/utils/dataSender'
import { picBedGlobal, updatePicBedGlobal } from '@/utils/global'

import { SHOW_INPUT_BOX, SHOW_INPUT_BOX_RESPONSE } from '#/events/constants'
import { IPasteStyle, IRPCActionType } from '#/types/enum'
import { isUrl } from '#/utils/common'
import { configPaths } from '#/utils/configPaths'
import { useDragEventListeners } from '@/utils/drag'

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

onBeforeMount(() => {
  updatePicBedGlobal()
  ipcRenderer.on('uploadProgress', (_event: IpcRendererEvent, _progress: number) => {
    if (_progress !== -1) {
      showProgress.value = true
      progress.value = _progress
    } else {
      progress.value = 100
      showError.value = true
    }
  })
  getUseShortUrl()
  getPasteStyle()
  getDefaultPicBed()
  ipcRenderer.on('syncPicBed', () => {
    getDefaultPicBed()
  })
  $bus.on(SHOW_INPUT_BOX_RESPONSE, handleInputBoxValue)
})

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
  const configList = await triggerRPC<IUploaderConfigItem>(IRPCActionType.PICBED_GET_CONFIG_LIST, currentPicBed)
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
  ipcRenderer.removeAllListeners('uploadProgress')
  ipcRenderer.removeAllListeners('syncPicBed')
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
      const str = e.dataTransfer.getData(items[0].type)
      if (isUrl(str)) {
        sendRPC(IRPCActionType.UPLOAD_CHOOSED_FILES, [{ path: str }])
      } else {
        $message.error($T('TIPS_DRAG_VALID_PICTURE_OR_URL'))
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
    sendRPC(IRPCActionType.UPLOAD_CHOOSED_FILES, [
      {
        path: urlMatch[1]
      }
    ])
  } else {
    $message.error($T('TIPS_DRAG_VALID_PICTURE_OR_URL'))
  }
}

function openUplodWindow() {
  document.getElementById('file-uploader')!.click()
}

function onChange(e: any) {
  ipcSendFiles(e.target.files)
  ;(document.getElementById('file-uploader') as HTMLInputElement).value = ''
}

function ipcSendFiles(files: FileList) {
  const sendFiles: IFileWithPath[] = []
  Array.from(files).forEach(item => {
    const obj = {
      name: item.name,
      path: item.path
    }
    sendFiles.push(obj)
  })
  sendRPC(IRPCActionType.UPLOAD_CHOOSED_FILES, sendFiles)
}

async function getPasteStyle() {
  pasteStyle.value = (await getConfig(configPaths.settings.pasteStyle)) || IPasteStyle.MARKDOWN
  pasteFormatList.value.Custom = (await getConfig(configPaths.settings.customLink)) || '![$fileName]($url)'
}

async function getUseShortUrl() {
  useShortUrl.value = (await getConfig(configPaths.settings.useShortUrl)) || false
}

async function handleUseShortUrlChange() {
  saveConfig({
    [configPaths.settings.useShortUrl]: useShortUrl.value
  })
}

function handlePasteStyleChange(val: string | number | boolean | undefined) {
  saveConfig({
    [configPaths.settings.pasteStyle]: val || IPasteStyle.MARKDOWN
  })
}

function uploadClipboardFiles() {
  sendRPC(IRPCActionType.UPLOAD_CLIPBOARD_FILES_FROM_UPLOAD_PAGE)
}

async function uploadURLFiles() {
  const str = await navigator.clipboard.readText()
  $bus.emit(SHOW_INPUT_BOX, {
    value: isUrl(str) ? str : '',
    title: $T('TIPS_INPUT_URL'),
    placeholder: $T('TIPS_HTTP_PREFIX')
  })
}

function handleInputBoxValue(val: string) {
  if (val === '') return
  if (isUrl(val)) {
    sendRPC(IRPCActionType.UPLOAD_CHOOSED_FILES, [
      {
        path: val
      }
    ])
  } else {
    $message.error($T('TIPS_INPUT_VALID_URL'))
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
  sendRPC(IRPCActionType.SHOW_UPLOAD_PAGE_MENU)
}
</script>

<script lang="ts">
export default {
  name: 'UploadPage'
}
</script>

<style lang="stylus">
.view-title
  display flex
  color #eee
  font-size 20px
  text-align center
  margin 10px auto
  align-items center
  justify-content center
#upload-view-title
  &:hover
    cursor pointer
    color #409EFF
#upload-view
  position absolute
  left 142px
  right 0
  height 100%
  .view-title
    margin 10vh auto 10px
  #upload-area
    height 50vh
    border 2px dashed #dddddd
    border-radius 8px
    text-align center
    width 60vw
    margin 0 auto
    color #dddddd
    cursor pointer
    transition all .2s ease-in-out
    align-items center
    #upload-dragger
      height 100%
      item-align center
    &.is-dragover,
    &:hover
      border 2px dashed #A4D8FA
      background-color rgba(164, 216, 250, 0.3)
      color #fff
    i
      height 80%
      font-size 10vh
      margin 0
    span
      color #409EFF
  #file-uploader
    display none
  .upload-progress
    opacity 0
    transition all .2s ease-in-out
    width 450px
    margin 20px auto 0
    &.show
      opacity 1
    .el-progress-bar__inner
      transition all .2s ease-in-out
  .paste-style
    justify-content center
    text-align center
    margin-top 16px
    display flex
    align-items flex-end
    &__text
      font-size 12px
      color #eeeeee
      margin-bottom 4px
  .el-radio-button:first-child
    .el-radio-button__inner
      border-left none
  .el-radio-button:first-child
    .el-radio-button__inner
      border-left none
      border-radius 14px 0 0 14px
  .el-radio-button:last-child
    .el-radio-button__inner
      border-left none
      border-radius 0 14px 14px 0
  .el-icon-caret-bottom
    cursor pointer
</style>
