<template>
  <div class="image-process-settings">
    <!-- Header -->
    <div class="settings-header">
      <div class="header-content">
        <Settings
          :size="24"
          class="header-icon"
        />
        <div>
          <h1>{{ $t('pages.imageProcess.title') }}</h1>
          <p>{{ $t('pages.imageProcess.description') }}</p>
        </div>
      </div>
      <div class="header-actions">
        <button
          class="btn btn-secondary"
          @click="closeDialog"
        >
          {{ $t('pages.imageProcess.cancel') }}
        </button>
        <button
          class="btn btn-primary"
          @click="handleSaveConfig"
        >
          <Save :size="16" />
          {{ $t('pages.imageProcess.confirm') }}
        </button>
      </div>
    </div>

    <!-- Tab Navigation -->
    <div class="tab-navigation">
      <button
        v-for="tab in tabs"
        :key="tab.id"
        class="tab-button"
        :class="{ active: activeTab === tab.id }"
        @click="activeTab = tab.id"
      >
        <component
          :is="tab.icon"
          :size="18"
        />
        <span>{{ tab.label }}</span>
      </button>
    </div>

    <!-- Settings Content -->
    <div class="settings-content">
      <!-- General Settings Tab -->
      <div
        v-if="activeTab === 'general'"
        class="tab-content"
      >
        <div class="settings-section">
          <h2>{{ $t('pages.imageProcess.general.skipProcessExtList') }}</h2>
          <div class="form-group">
            <label>{{ $t('pages.imageProcess.general.skipProcessExtListLabel') }}</label>
            <textarea
              v-model="skipProcessForm.skipProcessExtList"
              class="form-textarea"
              rows="3"
              :placeholder="'zip,rar,7z,tar,gz'"
            />
            <small>{{ $t('pages.imageProcess.general.skipProcessExtListPlaceholder') }}</small>
          </div>
        </div>

        <div class="settings-section">
          <h2>{{ $t('pages.imageProcess.general.basicImageProcessing') }}</h2>

          <div class="form-grid">
            <div class="form-group">
              <label class="switch-label">
                <input
                  v-model="compressForm.isRemoveExif"
                  type="checkbox"
                  class="switch-input"
                >
                <span class="switch-slider" />
                <div class="switch-content">
                  <span class="switch-title">{{ $t('pages.imageProcess.general.isRemoveExif') }}</span>
                </div>
              </label>
            </div>

            <div class="form-group">
              <label>{{ $t('pages.imageProcess.general.quality') }}</label>
              <input
                v-model.number="compressForm.quality"
                type="range"
                min="1"
                max="100"
                class="form-range"
              >
              <div class="range-value">
                {{ compressForm.quality }}%
              </div>
            </div>
          </div>
        </div>

        <div class="settings-section">
          <h2>{{ $t('pages.imageProcess.general.formatConversion') }}</h2>

          <div class="form-group">
            <label class="switch-label">
              <input
                v-model="compressForm.isConvert"
                type="checkbox"
                class="switch-input"
              >
              <span class="switch-slider" />
              <div class="switch-content">
                <span class="switch-title">{{ $t('pages.imageProcess.general.isConvert') }}</span>
              </div>
            </label>
          </div>

          <div
            v-if="compressForm.isConvert"
            class="form-grid"
          >
            <div class="form-group">
              <label>{{ $t('pages.imageProcess.general.destinationFormat') }}</label>
              <select
                v-model="compressForm.convertFormat"
                class="form-input"
              >
                <option
                  v-for="format in availableFormat"
                  :key="format"
                  :value="format"
                >
                  {{ format.toUpperCase() }}
                </option>
              </select>
            </div>

            <div class="form-group">
              <label>{{ $t('pages.imageProcess.general.specificFormatConversion') }}</label>
              <textarea
                v-model="formatConvertObj"
                class="form-textarea"
                rows="3"
                placeholder="{&quot;jpg&quot;: &quot;png&quot;, &quot;png&quot;: &quot;jpg&quot;}"
              />
            </div>
          </div>
        </div>
      </div>

      <!-- Watermark Tab -->
      <div
        v-if="activeTab === 'watermark'"
        class="tab-content"
      >
        <div class="settings-section">
          <h2>{{ $t('pages.imageProcess.watermark.title') }}</h2>
          <p>{{ $t('pages.imageProcess.watermark.description') }}</p>

          <div class="form-group">
            <label class="switch-label">
              <input
                v-model="waterMarkForm.isAddWatermark"
                type="checkbox"
                class="switch-input"
              >
              <span class="switch-slider" />
              <div class="switch-content">
                <span class="switch-title">{{ $t('pages.imageProcess.watermark.isAdd') }}</span>
              </div>
            </label>
          </div>

          <div
            v-if="waterMarkForm.isAddWatermark"
            class="watermark-settings"
          >
            <div class="form-group">
              <label>{{ $t('pages.imageProcess.watermark.type') }}</label>
              <div class="radio-group">
                <label class="radio-option">
                  <input
                    v-model="waterMarkForm.watermarkType"
                    type="radio"
                    value="text"
                    class="radio-input"
                  >
                  <span class="radio-indicator" />
                  <span class="radio-label">{{ $t('pages.imageProcess.watermark.text') }}</span>
                </label>
                <label class="radio-option">
                  <input
                    v-model="waterMarkForm.watermarkType"
                    type="radio"
                    value="image"
                    class="radio-input"
                  >
                  <span class="radio-indicator" />
                  <span class="radio-label">{{ $t('pages.imageProcess.watermark.image') }}</span>
                </label>
              </div>
            </div>

            <div class="form-grid">
              <div class="form-group">
                <label class="switch-label">
                  <input
                    v-model="waterMarkForm.isFullScreenWatermark"
                    type="checkbox"
                    class="switch-input"
                  >
                  <span class="switch-slider" />
                  <div class="switch-content">
                    <span class="switch-title">{{ $t('pages.imageProcess.watermark.isFullScreen') }}</span>
                  </div>
                </label>
              </div>

              <div class="form-group">
                <label>{{ $t('pages.imageProcess.watermark.degree') }}</label>
                <input
                  v-model.number="waterMarkForm.watermarkDegree"
                  type="range"
                  min="-360"
                  max="360"
                  class="form-range"
                >
                <div class="range-value">
                  {{ waterMarkForm.watermarkDegree }}°
                </div>
              </div>

              <div class="form-group">
                <label>{{ $t('pages.imageProcess.watermark.scaleRatio') }}</label>
                <input
                  v-model.number="waterMarkForm.watermarkScaleRatio"
                  type="range"
                  min="0"
                  max="1"
                  step="0.01"
                  class="form-range"
                >
                <div class="range-value">
                  {{ Math.round((waterMarkForm.watermarkScaleRatio || 0) * 100) }}%
                </div>
              </div>
            </div>

            <!-- Text Watermark Settings -->
            <div
              v-if="waterMarkForm.watermarkType === 'text'"
              class="form-grid"
            >
              <div class="form-group">
                <label>{{ $t('pages.imageProcess.watermark.inputText') }}</label>
                <input
                  v-model="waterMarkForm.watermarkText"
                  type="text"
                  class="form-input"
                  :placeholder="$t('pages.imageProcess.watermark.inputTextPlaceholder')"
                >
              </div>

              <div class="form-group">
                <label>{{ $t('pages.imageProcess.watermark.textFontPath') }}</label>
                <input
                  v-model="waterMarkForm.watermarkFontPath"
                  type="text"
                  class="form-input"
                  :placeholder="$t('pages.imageProcess.watermark.textFontPathPlaceholder')"
                >
              </div>

              <div class="form-group">
                <label>{{ $t('pages.imageProcess.watermark.color') }}</label>
                <div class="color-input-group">
                  <input
                    v-model="waterMarkForm.watermarkColor"
                    type="color"
                    class="form-color"
                  >
                  <input
                    v-model="waterMarkForm.watermarkColor"
                    type="text"
                    class="form-input"
                    placeholder="#CCCCCC73"
                  >
                </div>
              </div>
            </div>

            <!-- Image Watermark Settings -->
            <div
              v-if="waterMarkForm.watermarkType === 'image'"
              class="form-group"
            >
              <label>{{ $t('pages.imageProcess.watermark.imagePath') }}</label>
              <input
                v-model="waterMarkForm.watermarkImagePath"
                type="text"
                class="form-input"
                :placeholder="$t('pages.imageProcess.watermark.imagePathPlaceholder')"
              >
            </div>

            <!-- Watermark Position -->
            <div class="form-group">
              <label>{{ $t('pages.imageProcess.watermark.position') }}</label>
              <div class="position-grid">
                <button
                  v-for="[key, label] in waterMarkPositionMap"
                  :key="key"
                  type="button"
                  class="position-button"
                  :class="{ active: waterMarkForm.watermarkPosition === key }"
                  @click="waterMarkForm.watermarkPosition = key as any"
                >
                  {{ label }}
                </button>
              </div>
            </div>
          </div>
        </div>
      </div>

      <!-- Transform Tab -->
      <div
        v-if="activeTab === 'transform'"
        class="tab-content"
      >
        <div class="settings-section">
          <h2>{{ $t('pages.imageProcess.transform.title') }}</h2>
          <p>{{ $t('pages.imageProcess.transform.description') }}</p>

          <div class="form-grid">
            <div class="form-group">
              <label class="switch-label">
                <input
                  v-model="compressForm.isFlip"
                  type="checkbox"
                  class="switch-input"
                >
                <span class="switch-slider" />
                <div class="switch-content">
                  <span class="switch-title">{{ $t('pages.imageProcess.transform.isFlip') }}</span>
                </div>
              </label>
            </div>

            <div class="form-group">
              <label class="switch-label">
                <input
                  v-model="compressForm.isFlop"
                  type="checkbox"
                  class="switch-input"
                >
                <span class="switch-slider" />
                <div class="switch-content">
                  <span class="switch-title">{{ $t('pages.imageProcess.transform.isFlop') }}</span>
                </div>
              </label>
            </div>
          </div>
        </div>

        <div class="settings-section">
          <h2>{{ $t('pages.imageProcess.transform.rotationTitle') }}</h2>
          <p>{{ $t('pages.imageProcess.transform.rotationDescription') }}</p>

          <div class="form-group">
            <label class="switch-label">
              <input
                v-model="compressForm.isRotate"
                type="checkbox"
                class="switch-input"
              >
              <span class="switch-slider" />
              <div class="switch-content">
                <span class="switch-title">{{ $t('pages.imageProcess.transform.isRotate') }}</span>
              </div>
            </label>
          </div>

          <div
            v-if="compressForm.isRotate"
            class="form-group"
          >
            <label>{{ $t('pages.imageProcess.transform.rotationDegree') }}</label>
            <input
              v-model.number="compressForm.rotateDegree"
              type="range"
              min="-360"
              max="360"
              class="form-range"
            >
            <div class="range-value">
              {{ compressForm.rotateDegree }}°
            </div>
          </div>
        </div>

        <div class="settings-section">
          <h2>{{ $t('pages.imageProcess.transform.resizeTitle') }}</h2>
          <p>{{ $t('pages.imageProcess.transform.resizeDescription') }}</p>

          <div class="form-group">
            <label class="switch-label">
              <input
                v-model="compressForm.isReSize"
                type="checkbox"
                class="switch-input"
              >
              <span class="switch-slider" />
              <div class="switch-content">
                <span class="switch-title">{{ $t('pages.imageProcess.transform.isResize') }}</span>
              </div>
            </label>
          </div>

          <div
            v-if="compressForm.isReSize"
            class="resize-settings"
          >
            <div class="form-grid">
              <div class="form-group">
                <label>{{ $t('pages.imageProcess.transform.resizeWidth') }}</label>
                <input
                  v-model.number="compressForm.reSizeWidth"
                  type="number"
                  min="0"
                  class="form-input"
                >
              </div>

              <div class="form-group">
                <label>{{ $t('pages.imageProcess.transform.resizeHeight') }}</label>
                <input
                  v-model.number="compressForm.reSizeHeight"
                  type="number"
                  min="0"
                  class="form-input"
                >
              </div>
            </div>

            <div
              v-if="((compressForm.reSizeHeight || 0) > 0 && (compressForm.reSizeWidth || 0) === 0) || ((compressForm.reSizeWidth || 0) > 0 && (compressForm.reSizeHeight || 0) === 0)"
              class="form-group"
            >
              <label class="switch-label">
                <input
                  v-model="compressForm.skipReSizeOfSmallImg"
                  type="checkbox"
                  class="switch-input"
                >
                <span class="switch-slider" />
                <div class="switch-content">
                  <span class="switch-title">{{ $t('pages.imageProcess.transform.skipResizeOfSmallImgHeight') }}</span>
                </div>
              </label>
            </div>
          </div>
        </div>

        <div class="settings-section">
          <h2>{{ $t('pages.imageProcess.transform.percentageResize') }}</h2>

          <div class="form-group">
            <label class="switch-label">
              <input
                v-model="compressForm.isReSizeByPercent"
                type="checkbox"
                class="switch-input"
              >
              <span class="switch-slider" />
              <div class="switch-content">
                <span class="switch-title">{{ $t('pages.imageProcess.transform.isResizeByPercent') }}</span>
                <span class="switch-description">{{ $t('pages.imageProcess.transform.isResizeByPercentHint') }}</span>
              </div>
            </label>
          </div>

          <div
            v-if="compressForm.isReSizeByPercent"
            class="form-group"
          >
            <label>{{ $t('pages.imageProcess.transform.resizePercent') }}</label>
            <input
              v-model.number="compressForm.reSizePercent"
              type="range"
              min="1"
              max="500"
              class="form-range"
            >
            <div class="range-value">
              {{ compressForm.reSizePercent }}%
            </div>
          </div>
        </div>
      </div>
    </div>
  </div>
</template>

<script lang="ts" setup>
import { Image, RotateCw, Save, Settings } from 'lucide-vue-next'
import type { IBuildInCompressOptions, IBuildInWaterMarkOptions } from 'piclist'
import { computed, onBeforeMount, reactive, ref, toRaw } from 'vue'
import { useI18n } from 'vue-i18n'

import { configPaths } from '@/utils/configPaths'
import { getConfig, saveConfig } from '@/utils/dataSender'

const { t } = useI18n()
const imageProcessDialogVisible = defineModel<boolean>()
const activeTab = ref('general')

const tabs = computed(() => [
  {
    id: 'general',
    label: t('pages.imageProcess.generalSettings'),
    icon: Settings
  },
  {
    id: 'watermark',
    label: t('pages.imageProcess.watermarkSettings'),
    icon: Image
  },
  {
    id: 'transform',
    label: t('pages.imageProcess.transformSettings'),
    icon: RotateCw
  }
])

const waterMarkPositionMap = new Map([
  ['north', t('pages.imageProcess.watermark.positionOptions.top')],
  ['northeast', t('pages.imageProcess.watermark.positionOptions.topRight')],
  ['southeast', t('pages.imageProcess.watermark.positionOptions.bottomRight')],
  ['south', t('pages.imageProcess.watermark.positionOptions.bottom')],
  ['southwest', t('pages.imageProcess.watermark.positionOptions.bottomLeft')],
  ['northwest', t('pages.imageProcess.watermark.positionOptions.topLeft')],
  ['west', t('pages.imageProcess.watermark.positionOptions.left')],
  ['east', t('pages.imageProcess.watermark.positionOptions.right')],
  ['centre', t('pages.imageProcess.watermark.positionOptions.center')]
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

<style scoped>
.image-process-settings {
  padding: 1.5rem;
  min-height: 100vh;
  background: var(--color-surface);
  color: var(--color-text-primary);
  overflow-y: auto;
}

/* Header */
.settings-header {
  display: flex;
  justify-content: space-between;
  align-items: center;
  background: var(--color-surface);
  border-radius: 12px;
  padding: 1.5rem;
  margin-bottom: 1.5rem;
  box-shadow: 0 2px 8px rgba(0, 0, 0, 0.1);
  border: 1px solid var(--color-border);
}

.header-content {
  display: flex;
  align-items: center;
  gap: 1rem;
}

.header-icon {
  color: var(--color-accent);
}

.settings-header h1 {
  margin: 0;
  font-size: 1.5rem;
  font-weight: 600;
  color: var(--color-text-primary);
}

.settings-header p {
  margin: 0;
  color: var(--color-text-secondary);
  font-size: 0.875rem;
}

.header-actions {
  display: flex;
  gap: 0.75rem;
}

/* Tab Navigation */
.tab-navigation {
  display: flex;
  background: var(--color-background-primary);
  border-radius: 12px;
  padding: 0.25rem;
  margin-bottom: 1.5rem;
  box-shadow: 0 2px 8px rgba(0, 0, 0, 0.1);
  border: 1px solid var(--color-border);
}

.tab-button {
  display: flex;
  align-items: center;
  gap: 0.5rem;
  padding: 0.75rem 1rem;
  background: transparent;
  border: none;
  border-radius: 8px;
  color: var(--color-text-secondary);
  font-size: 0.875rem;
  font-weight: 500;
  cursor: pointer;
  transition: all 0.2s ease;
  flex: 1;
  justify-content: center;
}

.tab-button:hover {
  color: var(--color-text-primary);
  background: var(--color-background-primary);
}

.tab-button.active {
  background: #409eff;
  color: white;
  box-shadow: 0 2px 4px rgba(64, 158, 255, 0.3);
}

/* Settings Content */
.settings-content {
  display: flex;
  flex-direction: column;
}

.tab-content {
  display: flex;
  flex-direction: column;
  gap: 1.5rem;
}

.settings-section {
  background: var(--color-background-primary);
  border-radius: 12px;
  padding: 1.5rem;
  box-shadow: 0 2px 8px var(--color-border);
  border: 1px solid var(--color-border);
}

.settings-section h2 {
  margin: 0 0 0.5rem 0;
  font-size: 1.125rem;
  font-weight: 600;
  color: var(--color-text-primary);
}

.settings-section p {
  margin: 0 0 1.5rem 0;
  color: var(--color-text-secondary);
  font-size: 0.875rem;
}

/* Form Elements */
.form-group {
  margin-bottom: 1.5rem;
}

.form-group:last-child {
  margin-bottom: 0;
}

.form-group > label:not(.switch-label):not(.radio-option) {
  display: block;
  margin-bottom: 0.5rem;
  font-size: 0.875rem;
  font-weight: 500;
  color: var(--color-text-primary);
}

.form-input,
.form-textarea {
  width: 100%;
  padding: 0.75rem;
  border: 1px solid var(--color-border);
  border-radius: 8px;
  background: var(--color-background-primary);
  color: var(--color-text-primary);
  font-size: 0.875rem;
  transition: all 0.2s ease;
  box-sizing: border-box;
}

.form-input:focus,
.form-textarea:focus {
  outline: none;
  border-color: var(--color-blue-common);
  box-shadow: 0 0 0 2px var(--el-color-primary-light-9, rgba(64, 158, 255, 0.2));
}

.form-textarea {
  resize: vertical;
  min-height: 80px;
}

.form-range {
  width: 100%;
  height: 6px;
  border-radius: 3px;
  background: #e4e7ed;
  outline: none;
  margin-bottom: 0.5rem;
  -webkit-appearance: none;
  appearance: none;
}

.form-range::-webkit-slider-thumb {
  -webkit-appearance: none;
  appearance: none;
  width: 20px;
  height: 20px;
  border-radius: 50%;
  background: var(--color-blue-common);
  cursor: pointer;
  box-shadow: 0 2px 4px rgba(0, 0, 0, 0.2);
  border: 2px solid #ffffff;
}

.form-range::-moz-range-thumb {
  width: 20px;
  height: 20px;
  border-radius: 50%;
  background: var(--color-blue-common);
  cursor: pointer;
  border: 2px solid #ffffff;
  box-shadow: 0 2px 4px rgba(0, 0, 0, 0.2);
}

.range-value {
  display: inline-block;
  padding: 0.25rem 0.5rem;
  background: var(--color-blue-common);
  color: white;
  border-radius: 4px;
  font-size: 0.75rem;
  font-weight: 500;
  margin-bottom: 0.5rem;
  min-width: 3rem;
  text-align: center;
}

.form-color {
  width: 60px;
  height: 40px;
  border: 1px solid var(--color-border);
  border-radius: 6px;
  background: transparent;
  cursor: pointer;
  padding: 0;
}

.form-color:focus {
  outline: none;
  border-color: var(--color-blue-common);
  box-shadow: 0 0 0 2px rgba(64, 158, 255, 0.2);
}

.color-input-group {
  display: flex;
  gap: 0.75rem;
  align-items: center;
}

.color-input-group .form-input {
  flex: 1;
}

/* Grid Layout */
.form-grid {
  display: grid;
  grid-template-columns: repeat(auto-fit, minmax(250px, 1fr));
  gap: 1.5rem;
}

/* Switch Component */
.switch-label {
  display: flex;
  align-items: center;
  gap: 1rem;
  cursor: pointer;
  padding: 1rem;
  border: 1px solid var(--color-border);
  border-radius: 8px;
  transition: all 0.2s ease;
  background: var(--color-background-primary);
}

.switch-label:hover {
  border-color: var(--color-blue-common);
  background: var(--color-surface);
}

.switch-input {
  display: none;
}

.switch-slider {
  position: relative;
  width: 44px;
  height: 24px;
  background: var(--color-border-darker);
  border-radius: 12px;
  transition: all 0.3s ease;
  flex-shrink: 0;
}

.switch-slider::before {
  content: '';
  position: absolute;
  top: 2px;
  left: 2px;
  width: 20px;
  height: 20px;
  background: #ffffff;
  border-radius: 50%;
  transition: all 0.3s ease;
  box-shadow: 0 2px 4px rgba(0, 0, 0, 0.2);
}

.switch-input:checked + .switch-slider {
  background: var(--color-blue-common);
}

.switch-input:checked + .switch-slider::before {
  transform: translateX(20px);
}

.switch-content {
  display: flex;
  flex-direction: column;
  gap: 0.25rem;
  flex: 1;
}

.switch-title {
  font-size: 0.9rem;
  font-weight: 500;
  color: var(--color-text-primary);
  line-height: 1.4;
}

.switch-description {
  font-size: 0.75rem;
  color: var(--color-text-secondary);
  line-height: 1.3;
}

/* Radio Group */
.radio-group {
  display: flex;
  gap: 1rem;
  flex-wrap: wrap;
}

.radio-option {
  display: flex;
  align-items: center;
  gap: 0.5rem;
  cursor: pointer;
  padding: 0.5rem 0.75rem;
  border: 1px solid var(--color-border);
  border-radius: 6px;
  transition: all 0.2s ease;
  background: var(--color-background-primary);
}

.radio-option:hover {
  border-color: var(--color-blue-common);
  background: rgba(64, 158, 255, 0.1);
}

.radio-input {
  display: none;
}

.radio-indicator {
  width: 16px;
  height: 16px;
  border: 2px solid var(--color-border);
  border-radius: 50%;
  transition: all 0.2s ease;
  position: relative;
  background: var(--color-background-primary);
}

.radio-input:checked + .radio-indicator {
  border-color: var(--color-blue-common);
  background: var(--color-background-primary);
}

.radio-input:checked + .radio-indicator::after {
  content: '';
  position: absolute;
  top: 50%;
  left: 50%;
  transform: translate(-50%, -50%);
  width: 8px;
  height: 8px;
  background: var(--color-blue-common);
  border-radius: 50%;
}

.radio-label {
  font-size: 0.875rem;
  color: var(--color-text-primary);
  font-weight: 500;
}

/* Position Grid */
.position-grid {
  display: grid;
  grid-template-columns: repeat(3, 1fr);
  gap: 0.5rem;
  max-width: 300px;
}

.position-button {
  padding: 0.75rem;
  background: var(--color-background-primary);
  border: 1px solid var(--color-border);
  border-radius: 6px;
  color: var(--color-text-secondary);
  font-size: 0.75rem;
  cursor: pointer;
  transition: all 0.2s ease;
  text-align: center;
  font-weight: 500;
}

.position-button:hover {
  border-color: var(--color-blue-common);
  color: var(--color-text-primary);
  background: rgba(64, 158, 255, 0.1);
}

.position-button.active {
  background: var(--color-blue-common);
  border-color: var(--color-blue-common);
  color: white;
  box-shadow: 0 2px 4px rgba(64, 158, 255, 0.3);
}

/* Buttons */
.btn {
  display: inline-flex;
  align-items: center;
  gap: 0.5rem;
  padding: 0.75rem 1rem;
  border: 1px solid var(--color-border);
  border-radius: 6px;
  background: var(--color-background-primary);
  color: var(--color-text-primary);
  font-size: 0.875rem;
  font-weight: 500;
  cursor: pointer;
  transition: all 0.2s ease;
  text-decoration: none;
}

.btn:hover {
  background: var(--color-background-secondary);
  border-color: var(--color-blue-common);
}

.btn-primary {
  background: var(--color-blue-common);
  border-color: var(--color-blue-common);
  color: white;
}

.btn-primary:hover {
  background: var(--color-primary);
  border-color: var(--color-primary);
}

.btn-secondary {
  background: var(--color-background-primary);
  border-color: var(--color-border);
  color: var(--color-text-secondary);
}

.btn-secondary:hover {
  background: var(--color-background-secondary);
  border-color: var(--color-border-secondary);
  color: var(--color-text-primary);
}

/* Small text */
small {
  display: block;
  margin-top: 0.25rem;
  font-size: 0.75rem;
  color: var(--color-text-tertiary);
  line-height: 1.4;
}

/* Watermark and Resize settings groups */
.watermark-settings,
.resize-settings {
  margin-top: 1rem;
  padding-top: 1rem;
  border-top: 1px solid var(--color-border-secondary);
}

/* Responsive Design */
@media (max-width: 768px) {
  .image-process-settings {
    padding: 1rem;
  }

  .settings-header {
    flex-direction: column;
    gap: 1rem;
    align-items: stretch;
  }

  .header-actions {
    justify-content: stretch;
  }

  .header-actions .btn {
    flex: 1;
    justify-content: center;
  }

  .tab-navigation {
    flex-direction: column;
  }

  .form-grid {
    grid-template-columns: 1fr;
  }

  .radio-group {
    flex-direction: column;
  }

  .color-input-group {
    flex-direction: column;
    align-items: stretch;
  }
}

/* Dark mode adjustments */
:root.dark .image-process-settings,
:root.auto.dark .image-process-settings {
  background: var(--color-background-secondary);
}

:root.dark .settings-header,
:root.dark .tab-navigation,
:root.dark .settings-section,
:root.auto.dark .settings-header,
:root.auto.dark .tab-navigation,
:root.auto.dark .settings-section {
  background: var(--color-background-tertiary);
  border-color: var(--color-border);
}

:root.dark .form-input,
:root.dark .form-textarea,
:root.auto.dark .form-input,
:root.auto.dark .form-textarea {
  background: var(--color-surface);
  border-color: var(--color-border);
  color: var(--color-text-primary);
}

:root.dark .switch-slider::before,
:root.auto.dark .switch-slider::before {
  background: var(--color-surface);
}

:root.dark .btn-secondary,
:root.auto.dark .btn-secondary {
  background: var(--color-surface);
  border-color: var(--color-border);
  color: var(--color-text-secondary);
}

:root.dark .btn-secondary:hover,
:root.auto.dark .btn-secondary:hover {
  background: var(--color-background-tertiary);
  border-color: var(--color-border-hover);
  color: var(--color-text-primary);
}

:root.dark .switch-label,
:root.auto.dark .switch-label {
  background: var(--color-surface);
  border-color: var(--color-border);
  color: var(--color-text-secondary);
}
:root.dark .switch-title,
:root.auto.dark .switch-title {
  color: var(--color-text-primary);
}

:root.dark .switch-description,
:root.auto.dark .switch-description {
  color: var(--color-text-secondary);
}

:root.dark .position-button,
:root.auto.dark .position-button {
  background: var(--color-surface);
  border-color: var(--color-border);
  color: var(--color-text-secondary);
}

:root.dark .position-button:hover,
:root.auto.dark .position-button:hover {
  border-color: var(--color-primary);
  color: var(--color-text-primary);
  background: var(--color-background-tertiary);
}

:root.dark .position-button.active,
:root.auto.dark .position-button.active {
  background: var(--color-primary);
  border-color: var(--color-primary);
  color: var(--color-text-inverse);
}

:root.dark .radio-group,
:root.auto.dark .radio-group {
  background: var(--color-background-tertiary);
  border-color: var(--color-border);
  color: var(--color-text-secondary);
}
</style>
