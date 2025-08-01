<template>
  <el-form
    label-position="top"
    require-asterisk-position="right"
    label-width="10vw"
    size="default"
    :model="waterMarkForm"
  >
    <el-form-item :label="$t('UPLOAD_PAGE_IMAGE_PROCESS_SKIP_PROCESS_EXT_LIST')">
      <el-input
        v-model="skipProcessForm.skipProcessExtList"
        type="textarea"
        :autosize="{ minRows: 2, maxRows: 4 }"
      />
      <div class="text-xs text-gray-500">
        {{ $t('UPLOAD_PAGE_IMAGE_PROCESS_SKIP_PROCESS_EXT_LIST_TIPS') }}
      </div>
    </el-form-item>
    <el-form-item :label="$t('UPLOAD_PAGE_IMAGE_PROCESS_ISADDWM')">
      <el-switch
        v-model="waterMarkForm.isAddWatermark"
        :style="switchStyle"
      />
    </el-form-item>
    <el-form-item
      v-show="waterMarkForm.isAddWatermark"
      :label="$t('UPLOAD_PAGE_IMAGE_PROCESS_WMTYPE')"
    >
      <el-radio-group v-model="waterMarkForm.watermarkType">
        <el-radio value="text">
          {{ $t('UPLOAD_PAGE_IMAGE_PROCESS_WMTYPE_TEXT') }}
        </el-radio>
        <el-radio value="image">
          {{ $t('UPLOAD_PAGE_IMAGE_PROCESS_WMTYPE_IMAGE') }}
        </el-radio>
      </el-radio-group>
    </el-form-item>
    <el-form-item
      v-show="waterMarkForm.isAddWatermark"
      :label="$t('UPLOAD_PAGE_IMAGE_PROCESS_ISFULLSCREEN_WM')"
    >
      <el-switch
        v-model="waterMarkForm.isFullScreenWatermark"
        :style="switchStyle"
      />
    </el-form-item>
    <el-form-item
      v-show="waterMarkForm.isAddWatermark"
      :label="$t('UPLOAD_PAGE_IMAGE_PROCESS_WMDEGREE')"
    >
      <el-input-number
        v-model="waterMarkForm.watermarkDegree"
        :step="1"
      />
    </el-form-item>
    <el-form-item
      v-show="waterMarkForm.isAddWatermark && waterMarkForm.watermarkType === 'text'"
      :label="$t('UPLOAD_PAGE_IMAGE_PROCESS_WMTEXT')"
    >
      <el-input v-model="waterMarkForm.watermarkText" />
    </el-form-item>
    <el-form-item
      v-show="waterMarkForm.isAddWatermark && waterMarkForm.watermarkType === 'text'"
      :label="$t('UPLOAD_PAGE_IMAGE_PROCESS_WMTEXT_FONT_PATH')"
    >
      <el-input v-model="waterMarkForm.watermarkFontPath" />
    </el-form-item>
    <el-form-item
      v-show="waterMarkForm.isAddWatermark"
      :label="$t('UPLOAD_PAGE_IMAGE_PROCESS_WMRATIO')"
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
      :label="$t('UPLOAD_PAGE_IMAGE_PROCESS_WMCOLOR')"
    >
      <el-color-picker
        v-model="waterMarkForm.watermarkColor"
        show-alpha
      />
    </el-form-item>
    <el-form-item
      v-show="waterMarkForm.isAddWatermark && waterMarkForm.watermarkType === 'image'"
      :label="$t('UPLOAD_PAGE_IMAGE_PROCESS_WMPATH')"
    >
      <el-input v-model="waterMarkForm.watermarkImagePath" />
    </el-form-item>
    <el-form-item
      v-show="waterMarkForm.isAddWatermark"
      :label="$t('UPLOAD_PAGE_IMAGE_PROCESS_WMPOSITION')"
    >
      <el-radio-group v-model="waterMarkForm.watermarkPosition">
        <el-radio
          v-for="item in waterMarkPositionMap"
          :key="item[0]"
          :value="item[0]"
        >
          {{ item[1] }}
        </el-radio>
      </el-radio-group>
    </el-form-item>
    <el-form-item :label="$t('UPLOAD_PAGE_IMAGE_PROCESS_ISREMOVEEXIF')">
      <el-switch
        v-model="compressForm.isRemoveExif"
        :style="switchStyle"
      />
    </el-form-item>
    <el-form-item :label="$t('UPLOAD_PAGE_IMAGE_PROCESS_QUALITY')">
      <el-input-number
        v-model="compressForm.quality"
        :min="1"
        :max="100"
        :step="1"
      />
    </el-form-item>
    <el-form-item :label="$t('UPLOAD_PAGE_IMAGE_PROCESS_ISCONVERT')">
      <el-switch
        v-model="compressForm.isConvert"
        :style="switchStyle"
      />
    </el-form-item>
    <el-form-item
      v-show="compressForm.isConvert"
      :label="$t('UPLOAD_PAGE_IMAGE_PROCESS_CONVERTFORMAT')"
    >
      <el-select
        v-model="compressForm.convertFormat"
        :persistent="false"
        teleported
      >
        <el-option
          v-for="item in availableFormat"
          :key="item"
          :label="item"
          :value="item"
        />
      </el-select>
    </el-form-item>
    <el-form-item
      v-show="compressForm.isConvert"
      :label="$t('UPLOAD_PAGE_IMAGE_PROCESS_CONVERTFORMAT_SPECIFIC')"
    >
      <el-input
        v-model="formatConvertObj"
        placeholder="{&quot;jpg&quot;: &quot;png&quot;, &quot;png&quot;: &quot;jpg&quot;}"
        type="textarea"
        :autosize="{ minRows: 2, maxRows: 4 }"
      />
    </el-form-item>
    <el-form-item :label="$t('UPLOAD_PAGE_IMAGE_PROCESS_ISFLIP')">
      <el-switch
        v-model="compressForm.isFlip"
        :style="switchStyle"
      />
    </el-form-item>
    <el-form-item :label="$t('UPLOAD_PAGE_IMAGE_PROCESS_ISFLOP')">
      <el-switch
        v-model="compressForm.isFlop"
        :style="switchStyle"
      />
    </el-form-item>
    <el-form-item :label="$t('UPLOAD_PAGE_IMAGE_PROCESS_ISRESIZE')">
      <el-switch
        v-model="compressForm.isReSize"
        :style="switchStyle"
      />
    </el-form-item>
    <el-form-item
      v-show="compressForm.isReSize"
      :label="$t('UPLOAD_PAGE_IMAGE_PROCESS_RESIZEWIDTH')"
    >
      <el-input-number
        v-model="compressForm.reSizeWidth"
        :min="0"
      />
    </el-form-item>
    <el-form-item
      v-show="compressForm.isReSize"
      :label="$t('UPLOAD_PAGE_IMAGE_PROCESS_RESIZEHEIGHT')"
    >
      <el-input-number
        v-model="compressForm.reSizeHeight"
        :min="0"
      />
    </el-form-item>
    <el-form-item
      v-show="compressForm.isReSize && compressForm.reSizeHeight! > 0 && compressForm.reSizeWidth === 0"
      :label="$t('UPLOAD_PAGE_IMAGE_PROCESS_SKIPRESIZEOfSMALLIMG_HEIGHT')"
    >
      <el-switch
        v-model="compressForm.skipReSizeOfSmallImg"
        :style="switchStyle"
      />
    </el-form-item>
    <el-form-item
      v-show="compressForm.isReSize && compressForm.reSizeWidth! > 0 && compressForm.reSizeHeight === 0"
      :label="$t('UPLOAD_PAGE_IMAGE_PROCESS_SKIPRESIZEOfSMALLIMG_WIDTH')"
    >
      <el-switch
        v-model="compressForm.skipReSizeOfSmallImg"
        :style="switchStyle"
      />
    </el-form-item>
    <el-form-item :label="$t('UPLOAD_PAGE_IMAGE_PROCESS_ISRESIZEBYPERCENT')">
      <el-switch
        v-model="compressForm.isReSizeByPercent"
        :style="switchStyle"
      />
    </el-form-item>
    <el-form-item
      v-show="compressForm.isReSizeByPercent"
      :label="$t('UPLOAD_PAGE_IMAGE_PROCESS_RESIZEPERCENT')"
    >
      <el-input-number
        v-model="compressForm.reSizePercent"
        :min="0"
      />
    </el-form-item>
    <el-form-item :label="$t('UPLOAD_PAGE_IMAGE_PROCESS_ISROTATE')">
      <el-switch
        v-model="compressForm.isRotate"
        :style="switchStyle"
      />
    </el-form-item>
    <el-form-item
      v-show="compressForm.isRotate"
      :label="$t('UPLOAD_PAGE_IMAGE_PROCESS_ROTATEDEGREE')"
    >
      <el-input-number
        v-model="compressForm.rotateDegree"
        :step="1"
      />
    </el-form-item>
    <el-form-item>
      <el-button
        type="primary"
        @click="handleSaveConfig"
      >
        {{ $t('UPLOAD_PAGE_IMAGE_PROCESS_CONFIRM') }}
      </el-button>
      <el-button @click="closeDialog">
        {{ $t('UPLOAD_PAGE_IMAGE_PROCESS_CANCEL') }}
      </el-button>
    </el-form-item>
  </el-form>
</template>

<script lang="ts" setup>
import type { IBuildInCompressOptions, IBuildInWaterMarkOptions } from 'piclist'
import { onBeforeMount, reactive, ref, toRaw } from 'vue'
import { useI18n } from 'vue-i18n'

import { getConfig, saveConfig } from '@/utils/dataSender'
import { configPaths } from '#/utils/configPaths'
const { t } = useI18n()
const imageProcessDialogVisible = defineModel<boolean>()

const waterMarkPositionMap = new Map([
  ['north', t('UPLOAD_PAGE_IMAGE_PROCESS_POSITION_TOP')],
  ['northeast', t('UPLOAD_PAGE_IMAGE_PROCESS_POSITION_TOP_RIGHT')],
  ['southeast', t('UPLOAD_PAGE_IMAGE_PROCESS_POSITION_BOTTOM_RIGHT')],
  ['south', t('UPLOAD_PAGE_IMAGE_PROCESS_POSITION_BOTTOM')],
  ['southwest', t('UPLOAD_PAGE_IMAGE_PROCESS_POSITION_BOTTOM_LEFT')],
  ['northwest', t('UPLOAD_PAGE_IMAGE_PROCESS_POSITION_TOP_LEFT')],
  ['west', t('UPLOAD_PAGE_IMAGE_PROCESS_POSITION_LEFT')],
  ['east', t('UPLOAD_PAGE_IMAGE_PROCESS_POSITION_RIGHT')],
  ['centre', t('UPLOAD_PAGE_IMAGE_PROCESS_POSITION_CENTER')]
])
const imageExtList = ['jpg', 'jpeg', 'png', 'webp', 'bmp', 'tiff', 'tif', 'svg', 'ico', 'avif', 'heif', 'heic']
const availableFormat = [
  'avif',
  'dz',
  'fits',
  'gif',
  'heif',
  'input',
  'jpeg',
  'jpg',
  'jp2',
  'jxl',
  'magick',
  'openslide',
  'pdf',
  'png',
  'ppm',
  'raw',
  'svg',
  'tiff',
  'tif',
  'v',
  'webp'
]

const waterMarkForm = reactive<IBuildInWaterMarkOptions>({
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

const compressForm = reactive<IBuildInCompressOptions>({
  quality: 100,
  isConvert: false,
  convertFormat: 'jpg',
  isReSize: false,
  reSizeWidth: 500,
  reSizeHeight: 500,
  skipReSizeOfSmallImg: false,
  isReSizeByPercent: false,
  reSizePercent: 50,
  isRotate: false,
  rotateDegree: 0,
  isRemoveExif: false,
  isFlip: false,
  isFlop: false
})
const formatConvertObj = ref('{}')

const skipProcessForm = reactive({
  skipProcessExtList: 'zip,rar,7z,tar,gz,tar.gz,tar.bz2,tar.xz'
})

const waterMarkFormKeys = Object.keys(waterMarkForm) as (keyof typeof waterMarkForm)[]
const compressFormKeys = Object.keys(compressForm) as (keyof typeof compressForm)[]
const skipProcessFormKeys = Object.keys(skipProcessForm) as (keyof typeof skipProcessForm)[]

const switchStyle = '--el-switch-on-color: #13ce66; --el-switch-off-color: #ff4949;'

function handleSaveConfig () {
  let iformatConvertObj = {}
  try {
    iformatConvertObj = JSON.parse(formatConvertObj.value)
  } catch (error) {}
  const formatConvertObjEntries = Object.entries(iformatConvertObj)
  const formatConvertObjEntriesFilter = formatConvertObjEntries.filter((item: any) => {
    return imageExtList.includes(item[0]) && availableFormat.includes(item[1])
  })
  const formatConvertObjFilter = Object.fromEntries(formatConvertObjEntriesFilter)
  formatConvertObj.value = JSON.stringify(formatConvertObjFilter)
  compressForm.formatConvertObj = formatConvertObjFilter
  saveConfig(configPaths.buildIn.compress, toRaw(compressForm))
  saveConfig(configPaths.buildIn.watermark, toRaw(waterMarkForm))
  saveConfig(configPaths.buildIn.skipProcess, toRaw(skipProcessForm))
  closeDialog()
}

async function initData () {
  const compress = await getConfig<any>(configPaths.buildIn.compress)
  const watermark = await getConfig<any>(configPaths.buildIn.watermark)
  const skipProcess = await getConfig<any>(configPaths.buildIn.skipProcess)
  if (compress) {
    compressFormKeys.forEach(key => {
      compressForm[key] = compress[key] ?? compressForm[key]
    })
    try {
      if (typeof compress.formatConvertObj === 'object') {
        formatConvertObj.value = JSON.stringify(compress.formatConvertObj)
      } else {
        formatConvertObj.value = compress.formatConvertObj ?? '{}'
      }
    } catch (error) {
      formatConvertObj.value = '{}'
    }
  }
  if (watermark) {
    waterMarkFormKeys.forEach(key => {
      waterMarkForm[key] = watermark[key] ?? waterMarkForm[key]
    })
    waterMarkForm.watermarkColor = watermark.watermarkColor === '' ? '#CCCCCC73' : watermark.watermarkColor
  }
  if (skipProcess) {
    skipProcessFormKeys.forEach(key => {
      skipProcessForm[key] = skipProcess[key] ?? skipProcessForm[key]
    })
  }
}

function closeDialog () {
  imageProcessDialogVisible.value = false
}

onBeforeMount(async () => {
  await initData()
})
</script>
