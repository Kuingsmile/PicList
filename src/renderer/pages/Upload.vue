<template>
  <div id="upload-view">
    <el-row
      :gutter="16"
      align="middle"
    >
      <el-col
        :span="24"
      >
        <div class="view-title">
          <el-tooltip
            placement="top"
            effect="light"
            :content="$T('UPLOAD_VIEW_HINT')"
          >
            <span
              id="upload-view-title"
              @click="handlePicBedNameClick(picBedName, picBedConfigName)"
            >
              {{ $T('PICTURE_UPLOAD') }} - {{ picBedName }} - {{ picBedConfigName }}
            </span>
          </el-tooltip>
          <el-icon
            style="cursor: pointer; margin-left: 4px;"
            @click="handleChangePicBed"
          >
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
            图片处理
          </el-button>
        </div>
        <div
          id="upload-area"
          :class="{ 'is-dragover': dragover }"
          @drop.prevent="onDrop"
          @dragover.prevent="dragover = true"
          @dragleave.prevent="dragover = false"
        >
          <div
            id="upload-dragger"
            @click="openUplodWindow"
          >
            <el-icon>
              <UploadFilled />
            </el-icon>
            <div class="upload-dragger__text">
              {{ $T('DRAG_FILE_TO_HERE') }} <span>{{ $T('CLICK_TO_UPLOAD') }}</span>
            </div>
            <input
              id="file-uploader"
              type="file"
              multiple
              @change="onChange"
            >
          </div>
        </div>
        <el-progress
          :percentage="progress"
          :show-text="false"
          class="upload-progress"
          :class="{ 'show': showProgress }"
          :status="showError ? 'exception' : undefined"
        />
        <div class="paste-style">
          <div class="el-col-12">
            <div class="paste-style__text">
              {{ $T('LINK_FORMAT') }}
            </div>
            <el-radio-group
              v-model="pasteStyle"
              size="small"
              @change="handlePasteStyleChange"
            >
              <el-radio-button
                label="markdown"
                title="![alt](url)"
              >
                Markdown
              </el-radio-button>
              <el-radio-button
                label="HTML"
                title="<img src='url'/>"
              />
              <el-radio-button
                label="URL"
                title="http://test.com/test.png"
              />
              <el-radio-button
                label="UBB"
                title="[img]url[/img]"
              />
              <el-radio-button
                label="Custom"
                :title="customLink"
              />
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
      title="图片处理设置"
      width="50%"
      draggable
      center
      align-center
    >
      <el-form
        label-position="top"
        require-asterisk-position="right"
        label-width="10vw"
        size="default"
        :model="waterMarkForm"
      >
        <el-form-item label="是否添加水印">
          <el-switch
            v-model="waterMarkForm.isAddWatermark"
            active-color="#13ce66"
            inactive-color="#ff4949"
          />
        </el-form-item>
        <el-form-item
          v-show="waterMarkForm.isAddWatermark"
          label="水印类型"
        >
          <el-radio-group v-model="waterMarkForm.watermarkType">
            <el-radio label="text">
              文字
            </el-radio>
            <el-radio label="image">
              图片
            </el-radio>
          </el-radio-group>
        </el-form-item>
        <el-form-item
          v-show="waterMarkForm.isAddWatermark"
          label="是否全屏水印"
        >
          <el-switch
            v-model="waterMarkForm.isFullScreenWatermark"
            active-color="#13ce66"
            inactive-color="#ff4949"
          />
        </el-form-item>
        <el-form-item
          v-show="waterMarkForm.isAddWatermark"
          label="水印角度"
        >
          <el-input-number
            v-model="waterMarkForm.watermarkDegree"
            :step="1"
          />
        </el-form-item>
        <el-form-item
          v-show="waterMarkForm.isAddWatermark && waterMarkForm.watermarkType === 'text'"
          label="水印文字"
        >
          <el-input v-model="waterMarkForm.watermarkText" />
        </el-form-item>
        <el-form-item
          v-show="waterMarkForm.isAddWatermark && waterMarkForm.watermarkType === 'text'"
          label="水印字体路径(留空默认黑体，第一次需下载字体文件)"
        >
          <el-input v-model="waterMarkForm.watermarkFontPath" />
        </el-form-item>
        <el-form-item
          v-show="waterMarkForm.isAddWatermark"
          label="水印占原图比例"
        >
          <el-input-number
            v-model="waterMarkForm.watermarkScaleRatio"
            :min="0"
            :max="1"
            :step="0.01"
          />
        </el-form-item>
        <el-form-item
          v-show="waterMarkForm.isAddWatermark && waterMarkForm.watermarkType === 'text'"
          label="水印颜色，请从取色器中选择"
        >
          <el-color-picker
            v-model="waterMarkForm.watermarkColor"
            show-alpha
          />
        </el-form-item>
        <el-form-item
          v-show="waterMarkForm.isAddWatermark && waterMarkForm.watermarkType === 'image'"
          label="水印图片路径(留空使用默认图片)"
        >
          <el-input v-model="waterMarkForm.watermarkImagePath" />
        </el-form-item>
        <el-form-item
          v-show="waterMarkForm.isAddWatermark"
          label="水印位置"
        >
          <el-radio-group
            v-model="waterMarkForm.watermarkPosition"
          >
            <el-radio
              v-for="item in waterMarkPositionMap"
              :key="item[0]"
              :label="item[0]"
            >
              {{ item[1] }}
            </el-radio>
          </el-radio-group>
        </el-form-item>
        <el-form-item label="是否移除Eixf信息">
          <el-switch
            v-model="compressForm.isRemoveExif"
            active-color="#13ce66"
            inactive-color="#ff4949"
          />
        </el-form-item>
        <el-form-item label="压缩质量">
          <el-input-number
            v-model="compressForm.quality"
            :min="0"
            :max="100"
            :step="1"
          />
        </el-form-item>
        <el-form-item label="是否转换格式">
          <el-switch
            v-model="compressForm.isConvert"
            active-color="#13ce66"
            inactive-color="#ff4949"
          />
        </el-form-item>
        <el-form-item
          v-show="compressForm.isConvert"
          label="选择转换目的格式"
        >
          <el-select v-model="compressForm.convertFormat">
            <el-option
              v-for="item in availableFormat"
              :key="item"
              :label="item"
              :value="item"
            />
          </el-select>
        </el-form-item>
        <el-form-item label="是否按固定尺寸调整图片">
          <el-switch
            v-model="compressForm.isReSize"
            active-color="#13ce66"
            inactive-color="#ff4949"
          />
        </el-form-item>
        <el-form-item
          v-show="compressForm.isReSize"
          label="调整尺寸宽度"
        >
          <el-input-number
            v-model="compressForm.reSizeWidth"
            :min="0"
          />
        </el-form-item>
        <el-form-item
          v-show="compressForm.isReSize"
          label="调整尺寸高度"
        >
          <el-input-number
            v-model="compressForm.reSizeHeight"
            :min="0"
          />
        </el-form-item>
        <el-form-item label="是否按比例调整尺寸，优先级高于固定尺寸">
          <el-switch
            v-model="compressForm.isReSizeByPercent"
            active-color="#13ce66"
            inactive-color="#ff4949"
          />
        </el-form-item>
        <el-form-item
          v-show="compressForm.isReSizeByPercent"
          label="调整尺寸比例, 输入50表示50%"
        >
          <el-input-number
            v-model="compressForm.reSizePercent"
            :min="0"
          />
        </el-form-item>
        <el-form-item
          label="是否旋转"
        >
          <el-switch
            v-model="compressForm.isRotate"
            active-color="#13ce66"
            inactive-color="#ff4949"
          />
        </el-form-item>
        <el-form-item
          v-show="compressForm.isRotate"
          label="旋转角度"
        >
          <el-input-number
            v-model="compressForm.rotateDegree"
            :step="1"
          />
        </el-form-item>
        <el-form-item>
          <el-button
            type="primary"
            @click="handelSaveConfig"
          >
            保存
          </el-button>
          <el-button @click="closeDialog">
            取消
          </el-button>
        </el-form-item>
      </el-form>
    </el-dialog>
  </div>
</template>
<script lang="ts" setup>
import { UploadFilled, CaretBottom } from '@element-plus/icons-vue'
import {
  ipcRenderer,
  IpcRendererEvent
} from 'electron'
import { ref, reactive, onBeforeMount, onBeforeUnmount, watch, toRaw } from 'vue'
import { T as $T } from '@/i18n'
import $bus from '@/utils/bus'
import {
  SHOW_INPUT_BOX,
  SHOW_INPUT_BOX_RESPONSE,
  SHOW_UPLOAD_PAGE_MENU,
  GET_PICBEDS
} from '~/universal/events/constants'
import {
  isUrl
} from '~/universal/utils/common'
import { ElMessage as $message } from 'element-plus'
import { getConfig, saveConfig, sendToMain } from '@/utils/dataSender'
import { IBuildInCompressOptions, IBuildInWaterMarkOptions } from 'piclist'
import { useRouter } from 'vue-router'
import { PICBEDS_PAGE } from '@/router/config'
const $router = useRouter()

const imageProcessDialogVisible = ref(false)

const waterMarkPositionMap = new Map([
  ['north', '上'],
  ['northeast', '右上'],
  ['southeast', '右下'],
  ['south', '下'],
  ['southwest', '左下'],
  ['northwest', '左上'],
  ['west', '左'],
  ['east', '右'],
  ['centre', '中']
])

const availableFormat = ['avif', 'dz', 'fits', 'gif', 'heif', 'input', 'jpeg', 'jpg', 'jp2', 'jxl', 'magick', 'openslide', 'pdf', 'png', 'ppm', 'raw', 'svg', 'tiff', 'tif', 'v', 'webp']

const waterMarkForm = reactive<any>({
  isAddWatermark: false,
  watermarkType: 'text',
  isFullScreenWatermark: false,
  watermarkDegree: 0,
  watermarkText: '',
  watermarkFontPath: '',
  watermarkScaleRatio: 0.15,
  watermarkColor: '#CCCCCC73',
  watermarkImagePath: '',
  watermarkPosition: 'southeast'
})

const compressForm = reactive<any>({
  quality: 100,
  isConvert: false,
  convertFormat: 'jpg',
  isReSize: false,
  reSizeWidth: 500,
  reSizeHeight: 500,
  isReSizeByPercent: false,
  reSizePercent: 50,
  isRotate: false,
  rotateDegree: 0,
  isRemoveExif: false
})

function closeDialog () {
  imageProcessDialogVisible.value = false
}

function handelSaveConfig () {
  saveConfig('buildIn.compress', toRaw(compressForm))
  saveConfig('buildIn.watermark', toRaw(waterMarkForm))
  closeDialog()
}

async function initData () {
  const compress = await getConfig<IBuildInCompressOptions>('buildIn.compress')
  const watermark = await getConfig<IBuildInWaterMarkOptions>('buildIn.watermark')
  if (compress) {
    compressForm.quality = compress.quality ?? 100
    compressForm.isConvert = compress.isConvert ?? false
    compressForm.convertFormat = compress.convertFormat ?? 'jpg'
    compressForm.isReSize = compress.isReSize ?? false
    compressForm.reSizeWidth = compress.reSizeWidth ?? 500
    compressForm.reSizeHeight = compress.reSizeHeight ?? 500
    compressForm.isReSizeByPercent = compress.isReSizeByPercent ?? false
    compressForm.reSizePercent = compress.reSizePercent ?? 50
    compressForm.isRotate = compress.isRotate ?? false
    compressForm.rotateDegree = compress.rotateDegree ?? 0
    compressForm.isRemoveExif = compress.isRemoveExif ?? false
  }
  if (watermark) {
    waterMarkForm.isAddWatermark = watermark.isAddWatermark ?? false
    waterMarkForm.watermarkType = watermark.watermarkType ?? 'text'
    waterMarkForm.isFullScreenWatermark = watermark.isFullScreenWatermark ?? false
    waterMarkForm.watermarkDegree = watermark.watermarkDegree ?? 0
    waterMarkForm.watermarkText = watermark.watermarkText ?? ''
    waterMarkForm.watermarkFontPath = watermark.watermarkFontPath ?? ''
    waterMarkForm.watermarkScaleRatio = watermark.watermarkScaleRatio ?? 0.15
    waterMarkForm.watermarkColor = watermark.watermarkColor === undefined || watermark.watermarkColor === '' ? '#CCCCCC73' : watermark.watermarkColor
    waterMarkForm.watermarkImagePath = watermark.watermarkImagePath ?? ''
    waterMarkForm.watermarkPosition = watermark.watermarkPosition ?? 'southeast'
  }
}

const dragover = ref(false)
const progress = ref(0)
const showProgress = ref(false)
const showError = ref(false)
const pasteStyle = ref('')
const picBed = ref<IPicBedType[]>([])
const picBedName = ref('')
const customLink = ref('')
const picBedConfigName = ref('')

onBeforeMount(() => {
  ipcRenderer.on('uploadProgress', (_event: IpcRendererEvent, _progress: number) => {
    if (_progress !== -1) {
      showProgress.value = true
      progress.value = _progress
    } else {
      progress.value = 100
      showError.value = true
    }
  })
  getPasteStyle()
  getDefaultPicBed()
  ipcRenderer.on('syncPicBed', () => {
    getDefaultPicBed()
  })
  sendToMain(GET_PICBEDS)
  ipcRenderer.on(GET_PICBEDS, getPicBeds)
  $bus.on(SHOW_INPUT_BOX_RESPONSE, handleInputBoxValue)
  initData()
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

async function handlePicBedNameClick (picBedName: string, picBedConfigName: string) {
  const currentPicBed = await getConfig<string>('picBed.current')
  const currentPicBedConfig = await getConfig<any[]>(`uploader.${currentPicBed}`) as any || {}
  const configList = currentPicBedConfig.configList || []
  const config = configList.find((item: any) => item._configName === picBedConfigName)
  $router.push({
    name: PICBEDS_PAGE,
    params: {
      type: currentPicBed,
      configId: config._id
    },
    query: {
      defaultConfigId: currentPicBedConfig.defaultId || ''
    }
  })
  console.log(configList, picBedConfigName)
}

onBeforeUnmount(() => {
  $bus.off(SHOW_INPUT_BOX_RESPONSE)
  ipcRenderer.removeAllListeners('uploadProgress')
  ipcRenderer.removeAllListeners('syncPicBed')
  ipcRenderer.removeListener(GET_PICBEDS, getPicBeds)
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

function openUplodWindow () {
  document.getElementById('file-uploader')!.click()
}

function onChange (e: any) {
  ipcSendFiles(e.target.files);
  (document.getElementById('file-uploader') as HTMLInputElement).value = ''
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

async function getPasteStyle () {
  pasteStyle.value = await getConfig('settings.pasteStyle') || 'markdown'
  customLink.value = await getConfig('settings.customLink') || '$url'
}

function handlePasteStyleChange (val: string | number | boolean) {
  saveConfig({
    'settings.pasteStyle': val
  })
}

function uploadClipboardFiles () {
  sendToMain('uploadClipboardFilesFromUploadPage')
}

async function uploadURLFiles () {
  const str = await navigator.clipboard.readText()
  $bus.emit(SHOW_INPUT_BOX, {
    value: isUrl(str) ? str : '',
    title: $T('TIPS_INPUT_URL'),
    placeholder: $T('TIPS_HTTP_PREFIX')
  })
}

function handleInputBoxValue (val: string) {
  if (val === '') return
  if (isUrl(val)) {
    sendToMain('uploadChoosedFiles', [{
      path: val
    }])
  } else {
    $message.error($T('TIPS_INPUT_VALID_URL'))
  }
}

async function getDefaultPicBed () {
  const currentPicBed = await getConfig<string>('picBed.current')
  picBed.value.forEach(item => {
    if (item.type === currentPicBed) {
      picBedName.value = item.name
    }
  })
  picBedConfigName.value = await getConfig<string>(`picBed.${currentPicBed}._configName`) || ''
}

function getPicBeds (_event: Event, picBeds: IPicBedType[]) {
  picBed.value = picBeds
  getDefaultPicBed()
}

async function handleChangePicBed () {
  sendToMain(SHOW_UPLOAD_PAGE_MENU)
}
</script>
<script lang="ts">
export default {
  name: 'UploadPage'
}
</script>
<style lang='stylus'>
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
  left 140px
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
