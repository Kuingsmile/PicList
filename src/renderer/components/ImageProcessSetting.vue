<template>
  <div class="image-process-settings">
    <!-- Header -->
    <div class="settings-header">
      <div class="header-content">
        <Settings :size="24" class="header-icon" />
        <div>
          <h1>{{ $t('pages.imageProcess.title') }}</h1>
          <p>{{ $t('pages.imageProcess.description') }}</p>
        </div>
      </div>
      <div class="header-actions">
        <button class="btn btn-secondary" @click="closeDialog">
          {{ $t('pages.imageProcess.cancel') }}
        </button>
        <button class="btn btn-primary" @click="handleSaveConfig">
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
        <component :is="tab.icon" :size="18" />
        <span>{{ tab.label }}</span>
      </button>
    </div>

    <!-- Settings Content -->
    <div class="settings-content">
      <!-- General Settings Tab -->
      <div v-if="activeTab === 'general'" class="tab-content">
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
                <input v-model="compressForm.isRemoveExif" type="checkbox" class="switch-input" />
                <span class="switch-slider" />
                <div class="switch-content">
                  <span class="switch-title">{{ $t('pages.imageProcess.general.isRemoveExif') }}</span>
                </div>
              </label>

              <PerPicbedSetting
                :map-field="compressForm.isRemoveExifMap"
                :default-value="false"
                field-name="isRemoveExif"
                :form-object="compressForm"
                input-type="checkbox"
                @map-change="
                  (picbedType, value) => safeSetMapValue(compressForm, 'isRemoveExif', picbedType, value, false)
                "
              />
            </div>

            <div class="form-group">
              <label>{{ $t('pages.imageProcess.general.quality') }}</label>
              <input v-model.number="compressForm.quality" type="range" min="1" max="100" class="form-range" />
              <div class="range-value">{{ compressForm.quality }}%</div>

              <PerPicbedSetting
                :map-field="compressForm.qualityMap"
                :default-value="100"
                field-name="quality"
                :form-object="compressForm"
                input-type="range"
                :range-min="1"
                :range-max="100"
                :range-step="1"
                range-suffix="%"
                @map-change="(picbedType, value) => safeSetMapValue(compressForm, 'quality', picbedType, value, 100)"
              />
            </div>
          </div>
        </div>

        <div class="settings-section">
          <h2>{{ $t('pages.imageProcess.general.formatConversion') }}</h2>

          <div class="form-group">
            <label class="switch-label">
              <input v-model="compressForm.isConvert" type="checkbox" class="switch-input" />
              <span class="switch-slider" />
              <div class="switch-content">
                <span class="switch-title">{{ $t('pages.imageProcess.general.isConvert') }}</span>
              </div>
            </label>

            <PerPicbedSetting
              :map-field="compressForm.isConvertMap"
              :default-value="false"
              field-name="isConvert"
              :form-object="compressForm"
              input-type="checkbox"
              @map-change="(picbedType, value) => safeSetMapValue(compressForm, 'isConvert', picbedType, value, false)"
            />
          </div>

          <div v-if="compressForm.isConvert" class="form-grid">
            <div class="form-group">
              <label>{{ $t('pages.imageProcess.general.destinationFormat') }}</label>
              <select v-model="compressForm.convertFormat" class="form-input">
                <option v-for="format in availableFormat" :key="format" :value="format">
                  {{ format.toUpperCase() }}
                </option>
              </select>

              <PerPicbedSetting
                :map-field="compressForm.convertFormatMap"
                default-value="jpg"
                field-name="convertFormat"
                :form-object="compressForm"
                input-type="select"
                :select-options="availableFormat.map(format => ({ value: format, label: format.toUpperCase() }))"
                @map-change="
                  (picbedType, value) => safeSetMapValue(compressForm, 'convertFormat', picbedType, value, 'jpg')
                "
              />
            </div>

            <div class="form-group">
              <label>{{ $t('pages.imageProcess.general.specificFormatConversion') }}</label>
              <textarea
                v-model="formatConvertObj"
                class="form-textarea"
                rows="3"
                placeholder='{"jpg": "png", "png": "jpg"}'
              />

              <PerPicbedSetting
                :map-field="compressForm.formatConvertObjMap"
                :default-value="'{}'"
                field-name="formatConvertObj"
                :form-object="compressForm"
                input-type="text"
                text-placeholder="{}"
                @map-change="
                  (picbedType, value) => safeSetMapValue(compressForm, 'formatConvertObj', picbedType, value, '{}')
                "
              />
            </div>
          </div>
        </div>
      </div>

      <!-- Watermark Tab -->
      <div v-if="activeTab === 'watermark'" class="tab-content">
        <div class="settings-section">
          <h2>{{ $t('pages.imageProcess.watermark.title') }}</h2>
          <p>{{ $t('pages.imageProcess.watermark.description') }}</p>

          <div class="form-group">
            <label class="switch-label">
              <input v-model="waterMarkForm.isAddWatermark" type="checkbox" class="switch-input" />
              <span class="switch-slider" />
              <div class="switch-content">
                <span class="switch-title">{{ $t('pages.imageProcess.watermark.isAdd') }}</span>
              </div>
            </label>

            <PerPicbedSetting
              :map-field="waterMarkForm.isAddWatermarkMap"
              :default-value="false"
              field-name="isAddWatermark"
              :form-object="waterMarkForm"
              input-type="checkbox"
              @map-change="
                (picbedType, value) => safeSetMapValue(waterMarkForm, 'isAddWatermark', picbedType, value, false)
              "
            />
          </div>

          <div v-if="waterMarkForm.isAddWatermark" class="watermark-settings">
            <div class="form-group">
              <label>{{ $t('pages.imageProcess.watermark.type') }}</label>
              <div class="radio-group">
                <label class="radio-option">
                  <input v-model="waterMarkForm.watermarkType" type="radio" value="text" class="radio-input" />
                  <span class="radio-indicator" />
                  <span class="radio-label">{{ $t('pages.imageProcess.watermark.text') }}</span>
                </label>
                <label class="radio-option">
                  <input v-model="waterMarkForm.watermarkType" type="radio" value="image" class="radio-input" />
                  <span class="radio-indicator" />
                  <span class="radio-label">{{ $t('pages.imageProcess.watermark.image') }}</span>
                </label>
              </div>

              <PerPicbedSetting
                :map-field="waterMarkForm.watermarkTypeMap"
                default-value="text"
                field-name="watermarkType"
                :form-object="waterMarkForm"
                input-type="radio"
                :radio-options="[
                  { value: 'text', label: $t('pages.imageProcess.watermark.text') },
                  { value: 'image', label: $t('pages.imageProcess.watermark.image') },
                ]"
                @map-change="
                  (picbedType, value) => safeSetMapValue(waterMarkForm, 'watermarkType', picbedType, value, 'text')
                "
              />
            </div>

            <div class="form-grid">
              <div class="form-group">
                <label class="switch-label">
                  <input v-model="waterMarkForm.isFullScreenWatermark" type="checkbox" class="switch-input" />
                  <span class="switch-slider" />
                  <div class="switch-content">
                    <span class="switch-title">{{ $t('pages.imageProcess.watermark.isFullScreen') }}</span>
                  </div>
                </label>

                <PerPicbedSetting
                  :map-field="waterMarkForm.isFullScreenWatermarkMap"
                  :default-value="false"
                  field-name="isFullScreenWatermark"
                  :form-object="waterMarkForm"
                  input-type="checkbox"
                  @map-change="
                    (picbedType, value) =>
                      safeSetMapValue(waterMarkForm, 'isFullScreenWatermark', picbedType, value, false)
                  "
                />
              </div>

              <div class="form-group">
                <label>{{ $t('pages.imageProcess.watermark.degree') }}</label>
                <input
                  v-model.number="waterMarkForm.watermarkDegree"
                  type="range"
                  min="-360"
                  max="360"
                  class="form-range"
                />
                <div class="range-value">{{ waterMarkForm.watermarkDegree }}°</div>

                <PerPicbedSetting
                  :map-field="waterMarkForm.watermarkDegreeMap"
                  :default-value="0"
                  field-name="watermarkDegree"
                  :form-object="waterMarkForm"
                  input-type="range"
                  :range-min="-360"
                  :range-max="360"
                  :range-step="1"
                  range-suffix="°"
                  @map-change="
                    (picbedType, value) => safeSetMapValue(waterMarkForm, 'watermarkDegree', picbedType, value, 0)
                  "
                />
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
                />
                <div class="range-value">{{ Math.round((waterMarkForm.watermarkScaleRatio || 0) * 100) }}%</div>

                <PerPicbedSetting
                  :map-field="waterMarkForm.watermarkScaleRatioMap"
                  :default-value="0.15"
                  field-name="watermarkScaleRatio"
                  :form-object="waterMarkForm"
                  input-type="range"
                  :range-min="0"
                  :range-max="1"
                  :range-step="0.01"
                  range-suffix="%"
                  @map-change="
                    (picbedType, value) =>
                      safeSetMapValue(waterMarkForm, 'watermarkScaleRatio', picbedType, value, 0.15)
                  "
                />
              </div>
            </div>

            <div v-if="waterMarkForm.watermarkType === 'text'" class="form-grid">
              <div class="form-group">
                <label>{{ $t('pages.imageProcess.watermark.inputText') }}</label>
                <input
                  v-model="waterMarkForm.watermarkText"
                  type="text"
                  class="form-input"
                  :placeholder="$t('pages.imageProcess.watermark.inputTextPlaceholder')"
                />

                <!-- Per-picbed settings for watermarkText -->
                <PerPicbedSetting
                  :map-field="waterMarkForm.watermarkTextMap"
                  :default-value="''"
                  field-name="watermarkText"
                  :form-object="waterMarkForm"
                  input-type="text"
                  :text-placeholder="$t('pages.imageProcess.watermark.inputTextPlaceholder')"
                  @map-change="
                    (picbedType, value) => safeSetMapValue(waterMarkForm, 'watermarkText', picbedType, value, '')
                  "
                />
              </div>

              <div class="form-group">
                <label>{{ $t('pages.imageProcess.watermark.textFontPath') }}</label>
                <input
                  v-model="waterMarkForm.watermarkFontPath"
                  type="text"
                  class="form-input"
                  :placeholder="$t('pages.imageProcess.watermark.textFontPathPlaceholder')"
                />

                <PerPicbedSetting
                  :map-field="waterMarkForm.watermarkFontPathMap"
                  :default-value="''"
                  field-name="watermarkFontPath"
                  :form-object="waterMarkForm"
                  input-type="text"
                  :text-placeholder="$t('pages.imageProcess.watermark.textFontPathPlaceholder')"
                  @map-change="
                    (picbedType, value) => safeSetMapValue(waterMarkForm, 'watermarkFontPath', picbedType, value, '')
                  "
                />
              </div>

              <div class="form-group">
                <label>{{ $t('pages.imageProcess.watermark.color') }}</label>
                <div class="color-input-group">
                  <input v-model="waterMarkForm.watermarkColor" type="color" class="form-color" />
                  <input
                    v-model="waterMarkForm.watermarkColor"
                    type="text"
                    class="form-input"
                    placeholder="#CCCCCC73"
                  />
                </div>

                <PerPicbedSetting
                  :map-field="waterMarkForm.watermarkColorMap"
                  :default-value="'#CCCCCC73'"
                  field-name="watermarkColor"
                  :form-object="waterMarkForm"
                  input-type="color"
                  @map-change="
                    (picbedType, value) =>
                      safeSetMapValue(waterMarkForm, 'watermarkColor', picbedType, value, '#CCCCCC73')
                  "
                />
              </div>
            </div>

            <!-- Image Watermark Settings -->
            <div v-if="waterMarkForm.watermarkType === 'image'" class="form-group">
              <label>{{ $t('pages.imageProcess.watermark.imagePath') }}</label>
              <input
                v-model="waterMarkForm.watermarkImagePath"
                type="text"
                class="form-input"
                :placeholder="$t('pages.imageProcess.watermark.imagePathPlaceholder')"
              />

              <PerPicbedSetting
                :map-field="waterMarkForm.watermarkImagePathMap"
                :default-value="''"
                field-name="watermarkImagePath"
                :form-object="waterMarkForm"
                input-type="text"
                :text-placeholder="$t('pages.imageProcess.watermark.imagePathPlaceholder')"
                @map-change="
                  (picbedType, value) => safeSetMapValue(waterMarkForm, 'watermarkImagePath', picbedType, value, '')
                "
              />
            </div>

            <div v-if="waterMarkForm.watermarkType === 'image'" class="form-group">
              <label>{{ $t('pages.imageProcess.watermark.imageOpacity') }}</label>
              <input
                v-model.number="waterMarkForm.watermarkImageOpacity"
                type="range"
                min="0"
                max="255"
                step="1"
                class="form-range"
              />
              <div class="range-value">
                {{ waterMarkForm.watermarkImageOpacity || 0 }}
              </div>

              <PerPicbedSetting
                :map-field="waterMarkForm.watermarkImageOpacityMap"
                :default-value="255"
                field-name="watermarkImageOpacity"
                :form-object="waterMarkForm"
                input-type="range"
                :range-min="0"
                :range-max="255"
                :range-step="1"
                @map-change="
                  (picbedType, value) => safeSetMapValue(waterMarkForm, 'watermarkImageOpacity', picbedType, value, 255)
                "
              />
            </div>

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

              <!-- Per-picbed settings for watermarkPosition -->
              <PerPicbedSetting
                :map-field="waterMarkForm.watermarkPositionMap"
                :default-value="'southeast'"
                field-name="watermarkPosition"
                :form-object="waterMarkForm"
                input-type="select"
                :select-options="
                  Array.from(waterMarkPositionMap.entries()).map(([key, label]) => ({
                    value: key,
                    label,
                  }))
                "
                @map-change="
                  (picbedType, value) =>
                    safeSetMapValue(waterMarkForm, 'watermarkPosition', picbedType, value, 'southeast')
                "
              />
            </div>
          </div>
        </div>
      </div>

      <!-- Transform Tab -->
      <div v-if="activeTab === 'transform'" class="tab-content">
        <div class="settings-section">
          <h2>{{ $t('pages.imageProcess.transform.title') }}</h2>
          <p>{{ $t('pages.imageProcess.transform.description') }}</p>

          <div class="form-grid">
            <div class="form-group">
              <label class="switch-label">
                <input v-model="compressForm.isFlip" type="checkbox" class="switch-input" />
                <span class="switch-slider" />
                <div class="switch-content">
                  <span class="switch-title">{{ $t('pages.imageProcess.transform.isFlip') }}</span>
                </div>
              </label>

              <PerPicbedSetting
                :map-field="compressForm.isFlipMap"
                :default-value="false"
                field-name="isFlip"
                :form-object="compressForm"
                input-type="checkbox"
                @map-change="(picbedType, value) => safeSetMapValue(compressForm, 'isFlip', picbedType, value, false)"
              />
            </div>

            <div class="form-group">
              <label class="switch-label">
                <input v-model="compressForm.isFlop" type="checkbox" class="switch-input" />
                <span class="switch-slider" />
                <div class="switch-content">
                  <span class="switch-title">{{ $t('pages.imageProcess.transform.isFlop') }}</span>
                </div>
              </label>

              <PerPicbedSetting
                :map-field="compressForm.isFlopMap"
                :default-value="false"
                field-name="isFlop"
                :form-object="compressForm"
                input-type="checkbox"
                @map-change="(picbedType, value) => safeSetMapValue(compressForm, 'isFlop', picbedType, value, false)"
              />
            </div>
          </div>
        </div>

        <div class="settings-section">
          <h2>{{ $t('pages.imageProcess.transform.rotationTitle') }}</h2>
          <p>{{ $t('pages.imageProcess.transform.rotationDescription') }}</p>

          <div class="form-group">
            <label class="switch-label">
              <input v-model="compressForm.isRotate" type="checkbox" class="switch-input" />
              <span class="switch-slider" />
              <div class="switch-content">
                <span class="switch-title">{{ $t('pages.imageProcess.transform.isRotate') }}</span>
              </div>
            </label>

            <PerPicbedSetting
              :map-field="compressForm.isRotateMap"
              :default-value="false"
              field-name="isRotate"
              :form-object="compressForm"
              input-type="checkbox"
              @map-change="(picbedType, value) => safeSetMapValue(compressForm, 'isRotate', picbedType, value, false)"
            />
          </div>

          <div v-if="compressForm.isRotate" class="form-group">
            <label>{{ $t('pages.imageProcess.transform.rotationDegree') }}</label>
            <input v-model.number="compressForm.rotateDegree" type="range" min="-360" max="360" class="form-range" />
            <div class="range-value">{{ compressForm.rotateDegree }}°</div>

            <PerPicbedSetting
              :map-field="compressForm.rotateDegreeMap"
              :default-value="0"
              field-name="rotateDegree"
              :form-object="compressForm"
              input-type="range"
              :range-min="-360"
              :range-max="360"
              :range-step="1"
              range-suffix="°"
              @map-change="(picbedType, value) => safeSetMapValue(compressForm, 'rotateDegree', picbedType, value, 0)"
            />
          </div>
        </div>

        <div class="settings-section">
          <h2>{{ $t('pages.imageProcess.transform.resizeTitle') }}</h2>
          <p>{{ $t('pages.imageProcess.transform.resizeDescription') }}</p>

          <div class="form-group">
            <label class="switch-label">
              <input v-model="compressForm.isReSize" type="checkbox" class="switch-input" />
              <span class="switch-slider" />
              <div class="switch-content">
                <span class="switch-title">{{ $t('pages.imageProcess.transform.isResize') }}</span>
              </div>
            </label>

            <PerPicbedSetting
              :map-field="compressForm.isReSizeMap"
              :default-value="false"
              field-name="isReSize"
              :form-object="compressForm"
              input-type="checkbox"
              @map-change="(picbedType, value) => safeSetMapValue(compressForm, 'isReSize', picbedType, value, false)"
            />
          </div>

          <div v-if="compressForm.isReSize" class="resize-settings">
            <div class="form-grid">
              <div class="form-group">
                <label>{{ $t('pages.imageProcess.transform.resizeWidth') }}</label>
                <input v-model.number="compressForm.reSizeWidth" type="number" min="0" class="form-input" />

                <PerPicbedSetting
                  :map-field="compressForm.reSizeWidthMap"
                  :default-value="500"
                  field-name="reSizeWidth"
                  :form-object="compressForm"
                  input-type="number"
                  :number-min="0"
                  :number-max="10000"
                  @map-change="
                    (picbedType, value) => safeSetMapValue(compressForm, 'reSizeWidth', picbedType, value, 500)
                  "
                />
              </div>

              <div class="form-group">
                <label>{{ $t('pages.imageProcess.transform.resizeHeight') }}</label>
                <input v-model.number="compressForm.reSizeHeight" type="number" min="0" class="form-input" />

                <PerPicbedSetting
                  :map-field="compressForm.reSizeHeightMap"
                  :default-value="500"
                  field-name="reSizeHeight"
                  :form-object="compressForm"
                  input-type="number"
                  :number-min="0"
                  :number-max="10000"
                  @map-change="
                    (picbedType, value) => safeSetMapValue(compressForm, 'reSizeHeight', picbedType, value, 500)
                  "
                />
              </div>
            </div>

            <div
              v-if="
                ((compressForm.reSizeHeight || 0) > 0 && (compressForm.reSizeWidth || 0) === 0) ||
                ((compressForm.reSizeWidth || 0) > 0 && (compressForm.reSizeHeight || 0) === 0)
              "
              class="form-group"
            >
              <label class="switch-label">
                <input v-model="compressForm.skipReSizeOfSmallImg" type="checkbox" class="switch-input" />
                <span class="switch-slider" />
                <div class="switch-content">
                  <span class="switch-title">{{ $t('pages.imageProcess.transform.skipResizeOfSmallImgHeight') }}</span>
                </div>
              </label>

              <PerPicbedSetting
                :map-field="compressForm.skipReSizeOfSmallImgMap"
                :default-value="false"
                field-name="skipReSizeOfSmallImg"
                :form-object="compressForm"
                input-type="checkbox"
                @map-change="
                  (picbedType, value) => safeSetMapValue(compressForm, 'skipReSizeOfSmallImg', picbedType, value, false)
                "
              />
            </div>
          </div>
        </div>

        <div class="settings-section">
          <h2>{{ $t('pages.imageProcess.transform.percentageResize') }}</h2>

          <div class="form-group">
            <label class="switch-label">
              <input v-model="compressForm.isReSizeByPercent" type="checkbox" class="switch-input" />
              <span class="switch-slider" />
              <div class="switch-content">
                <span class="switch-title">{{ $t('pages.imageProcess.transform.isResizeByPercent') }}</span>
                <span class="switch-description">{{ $t('pages.imageProcess.transform.isResizeByPercentHint') }}</span>
              </div>
            </label>

            <PerPicbedSetting
              :map-field="compressForm.isReSizeByPercentMap"
              :default-value="false"
              field-name="isReSizeByPercent"
              :form-object="compressForm"
              input-type="checkbox"
              @map-change="
                (picbedType, value) => safeSetMapValue(compressForm, 'isReSizeByPercent', picbedType, value, false)
              "
            />
          </div>

          <div v-if="compressForm.isReSizeByPercent" class="form-group">
            <label>{{ $t('pages.imageProcess.transform.resizePercent') }}</label>
            <input v-model.number="compressForm.reSizePercent" type="range" min="1" max="500" class="form-range" />
            <div class="range-value">{{ compressForm.reSizePercent }}%</div>

            <PerPicbedSetting
              :map-field="compressForm.reSizePercentMap"
              :default-value="50"
              field-name="reSizePercent"
              :form-object="compressForm"
              input-type="range"
              :range-min="1"
              :range-max="500"
              :range-step="1"
              range-suffix="%"
              @map-change="(picbedType, value) => safeSetMapValue(compressForm, 'reSizePercent', picbedType, value, 50)"
            />
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
import { updatePicBedGlobal } from '@/utils/global'

import PerPicbedSetting from './PerPicbedSetting.vue'

const { t } = useI18n()
const imageProcessDialogVisible = defineModel<boolean>()
const activeTab = ref('general')

const tabs = computed(() => [
  {
    id: 'general',
    label: t('pages.imageProcess.generalSettings'),
    icon: Settings,
  },
  {
    id: 'watermark',
    label: t('pages.imageProcess.watermarkSettings'),
    icon: Image,
  },
  {
    id: 'transform',
    label: t('pages.imageProcess.transformSettings'),
    icon: RotateCw,
  },
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
  ['centre', t('pages.imageProcess.watermark.positionOptions.center')],
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
  'webp',
]

const waterMarkForm = reactive<IBuildInWaterMarkOptions>({
  isAddWatermark: false,
  isAddWatermarkMap: {},
  watermarkType: 'text',
  watermarkTypeMap: {},
  isFullScreenWatermark: false,
  isFullScreenWatermarkMap: {},
  watermarkDegree: 0,
  watermarkDegreeMap: {},
  watermarkText: '',
  watermarkTextMap: {},
  watermarkFontPath: '',
  watermarkFontPathMap: {},
  watermarkScaleRatio: 0.15,
  watermarkScaleRatioMap: {},
  watermarkColor: '#CCCCCC73',
  watermarkColorMap: {},
  watermarkImagePath: '',
  watermarkImagePathMap: {},
  watermarkPosition: 'southeast',
  watermarkPositionMap: {},
  watermarkImageOpacity: 255,
  watermarkImageOpacityMap: {},
})

const compressForm = reactive<IBuildInCompressOptions>({
  quality: 100,
  qualityMap: {},
  isConvert: false,
  isConvertMap: {},
  convertFormat: 'jpg',
  convertFormatMap: {},
  isReSize: false,
  isReSizeMap: {},
  reSizeWidth: 500,
  reSizeWidthMap: {},
  reSizeHeight: 500,
  reSizeHeightMap: {},
  skipReSizeOfSmallImg: false,
  skipReSizeOfSmallImgMap: {},
  isReSizeByPercent: false,
  isReSizeByPercentMap: {},
  reSizePercent: 50,
  reSizePercentMap: {},
  isRotate: false,
  isRotateMap: {},
  rotateDegree: 0,
  rotateDegreeMap: {},
  isRemoveExif: false,
  isRemoveExifMap: {},
  isFlip: false,
  isFlipMap: {},
  isFlop: false,
  isFlopMap: {},
  formatConvertObj: {},
  formatConvertObjMap: {},
})
const formatConvertObj = ref('{}')

const skipProcessForm = reactive({
  skipProcessExtList: 'zip,rar,7z,tar,gz,tar.gz,tar.bz2,tar.xz',
})

// State for showing map settings for each field (now unused - kept for future reference)
// const showMapSettings = reactive<Record<string, boolean>>({})

// Available picbeds for map configuration (now unused - moved to component)
// const availablePicbeds = computed(() => {
//   return picBedGlobal.value.map(picbed => ({
//     type: picbed.type,
//     name: picbed.name
//   }))
// })

const waterMarkFormKeys = Object.keys(waterMarkForm) as (keyof typeof waterMarkForm)[]
const compressFormKeys = Object.keys(compressForm) as (keyof typeof compressForm)[]
const skipProcessFormKeys = Object.keys(skipProcessForm) as (keyof typeof skipProcessForm)[]

function handleSaveConfig() {
  let iformatConvertObj = {}
  try {
    iformatConvertObj = JSON.parse(formatConvertObj.value)
  } catch (_error) {}
  const formatConvertObjEntries = Object.entries(iformatConvertObj)
  const formatConvertObjEntriesFilter = formatConvertObjEntries.filter((item: any) => {
    return imageExtList.includes(item[0]) && availableFormat.includes(item[1])
  })
  const formatConvertObjFilter = Object.fromEntries(formatConvertObjEntriesFilter)
  formatConvertObj.value = JSON.stringify(formatConvertObjFilter)
  compressForm.formatConvertObj = formatConvertObjFilter

  const processedFormatConvertObjMap: Record<string, any> = {}
  Object.entries(compressForm.formatConvertObjMap || {}).forEach(([picbedType, jsonString]) => {
    try {
      const parsedObj = JSON.parse(jsonString as string)
      const objEntries = Object.entries(parsedObj)
      const filteredEntries = objEntries.filter((item: any) => {
        return imageExtList.includes(item[0]) && availableFormat.includes(item[1])
      })
      const filteredObj = Object.fromEntries(filteredEntries)
      if (Object.keys(filteredObj).length > 0) {
        processedFormatConvertObjMap[picbedType] = filteredObj
      }
    } catch (_error) {
      // Skip invalid JSON strings
    }
  })
  compressForm.formatConvertObjMap = processedFormatConvertObjMap

  saveConfig(configPaths.buildIn.compress, toRaw(compressForm))
  saveConfig(configPaths.buildIn.watermark, toRaw(waterMarkForm))
  saveConfig(configPaths.buildIn.skipProcess, toRaw(skipProcessForm))
  closeDialog()
}

async function initData() {
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
    } catch (_error) {
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

function closeDialog() {
  imageProcessDialogVisible.value = false
}

// Helper function for getting map values (now unused - moved to component)
// function getMapValue(mapObj: Record<string, any> | undefined, picbedType: string, defaultValue: any) {
//   if (!mapObj) return defaultValue
//   return mapObj[picbedType] !== undefined ? mapObj[picbedType] : defaultValue
// }

// Safe wrapper for setMapValue that ensures map objects exist
function safeSetMapValue(form: any, fieldName: string, picbedType: string, value: any, defaultValue: any) {
  const mapFieldName = `${fieldName}Map`
  if (!form[mapFieldName]) {
    form[mapFieldName] = {}
  }
  if (value === defaultValue) {
    delete form[mapFieldName][picbedType]
  } else {
    form[mapFieldName][picbedType] = value
  }
}

onBeforeMount(async () => {
  await updatePicBedGlobal()
  await initData()
})
</script>

<style scoped>
.image-process-settings {
  overflow-y: auto;
  padding: 1.5rem;
  min-height: 100vh;
  color: var(--color-text-primary);
  background: var(--color-surface);
}

/* Header */
.settings-header {
  display: flex;
  justify-content: space-between;
  align-items: center;
  margin-bottom: 1.5rem;
  border: 1px solid var(--color-border);
  border-radius: 12px;
  padding: 1.5rem;
  background: var(--color-surface);
  box-shadow: 0 2px 8px rgb(0 0 0 / 10%);
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
  font-size: 0.875rem;
  color: var(--color-text-secondary);
}

.header-actions {
  display: flex;
  gap: 0.75rem;
}

/* Tab Navigation */
.tab-navigation {
  display: flex;
  margin-bottom: 1.5rem;
  border: 1px solid var(--color-border);
  border-radius: 12px;
  padding: 0.25rem;
  background: var(--color-background-primary);
  box-shadow: 0 2px 8px rgb(0 0 0 / 10%);
}

.tab-button {
  display: flex;
  justify-content: center;
  align-items: center;
  border: none;
  border-radius: 8px;
  padding: 0.75rem 1rem;
  font-size: 0.875rem;
  font-weight: 500;
  color: var(--color-text-secondary);
  background: transparent;
  transition: all 0.2s ease;
  gap: 0.5rem;
  cursor: pointer;
  flex: 1;
}

.tab-button:hover {
  color: var(--color-text-primary);
  background: var(--color-background-primary);
}

.tab-button.active {
  color: white;
  background: #409eff;
  box-shadow: 0 2px 4px rgb(64 158 255 / 30%);
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
  border: 1px solid var(--color-border);
  border-radius: 12px;
  padding: 1.5rem;
  background: var(--color-background-primary);
  box-shadow: 0 2px 8px var(--color-border);
}

.settings-section h2 {
  margin: 0 0 0.5rem;
  font-size: 1.125rem;
  font-weight: 600;
  color: var(--color-text-primary);
}

.settings-section p {
  margin: 0 0 1.5rem;
  font-size: 0.875rem;
  color: var(--color-text-secondary);
}

/* Form Elements */
.form-group {
  margin-bottom: 1.5rem;
}

.form-group:last-child {
  margin-bottom: 0;
}

.form-group > label:not(.switch-label, .radio-option) {
  display: block;
  margin-bottom: 0.5rem;
  font-size: 0.875rem;
  font-weight: 500;
  color: var(--color-text-primary);
}

.form-input,
.form-textarea {
  border: 1px solid var(--color-border);
  border-radius: 8px;
  padding: 0.75rem;
  width: 100%;
  font-size: 0.875rem;
  color: var(--color-text-primary);
  background: var(--color-background-primary);
  transition: all 0.2s ease;
  box-sizing: border-box;
}

.form-input:focus,
.form-textarea:focus {
  border-color: var(--color-blue-common);
  outline: none;
  box-shadow: 0 0 0 2px var(--el-color-primary-light-9, rgb(64 158 255 / 20%));
}

.form-textarea {
  min-height: 80px;
  resize: vertical;
}

.form-range {
  margin-bottom: 0.5rem;
  border-radius: 3px;
  width: 100%;
  height: 6px;
  background: #e4e7ed;
  outline: none;
  appearance: none;
}

.form-range::-webkit-slider-thumb {
  border: 2px solid #ffffff;
  border-radius: 50%;
  width: 20px;
  height: 20px;
  background: var(--color-blue-common);
  box-shadow: 0 2px 4px rgb(0 0 0 / 20%);
  appearance: none;
  cursor: pointer;
}

.form-range::-moz-range-thumb {
  border: 2px solid #ffffff;
  border-radius: 50%;
  width: 20px;
  height: 20px;
  background: var(--color-blue-common);
  box-shadow: 0 2px 4px rgb(0 0 0 / 20%);
  cursor: pointer;
}

.range-value {
  display: inline-block;
  margin-bottom: 0.5rem;
  border-radius: 4px;
  padding: 0.25rem 0.5rem;
  min-width: 3rem;
  font-size: 0.75rem;
  font-weight: 500;
  text-align: center;
  color: white;
  background: var(--color-blue-common);
}

.form-color {
  border: 1px solid var(--color-border);
  border-radius: 6px;
  padding: 0;
  width: 60px;
  height: 40px;
  background: transparent;
  cursor: pointer;
}

.form-color:focus {
  border-color: var(--color-blue-common);
  outline: none;
  box-shadow: 0 0 0 2px rgb(64 158 255 / 20%);
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
  border: 1px solid var(--color-border);
  border-radius: 8px;
  padding: 1rem;
  background: var(--color-background-primary);
  transition: all 0.2s ease;
  gap: 1rem;
  cursor: pointer;
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
  border-radius: 12px;
  width: 44px;
  height: 24px;
  background: var(--color-border-darker);
  transition: all 0.3s ease;
  flex-shrink: 0;
}

.switch-slider::before {
  position: absolute;
  top: 2px;
  left: 2px;
  border-radius: 50%;
  width: 20px;
  height: 20px;
  background: #ffffff;
  box-shadow: 0 2px 4px rgb(0 0 0 / 20%);
  transition: all 0.3s ease;
  content: '';
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
  border: 1px solid var(--color-border);
  border-radius: 6px;
  padding: 0.5rem 0.75rem;
  background: var(--color-background-primary);
  transition: all 0.2s ease;
  gap: 0.5rem;
  cursor: pointer;
}

.radio-option:hover {
  border-color: var(--color-blue-common);
  background: rgb(64 158 255 / 10%);
}

.radio-input {
  display: none;
}

.radio-indicator {
  position: relative;
  border: 2px solid var(--color-border);
  border-radius: 50%;
  width: 16px;
  height: 16px;
  background: var(--color-background-primary);
  transition: all 0.2s ease;
}

.radio-input:checked + .radio-indicator {
  border-color: var(--color-blue-common);
  background: var(--color-background-primary);
}

.radio-input:checked + .radio-indicator::after {
  position: absolute;
  top: 50%;
  left: 50%;
  border-radius: 50%;
  width: 8px;
  height: 8px;
  background: var(--color-blue-common);
  content: '';
  transform: translate(-50%, -50%);
}

.radio-label {
  font-size: 0.875rem;
  font-weight: 500;
  color: var(--color-text-primary);
}

/* Position Grid */
.position-grid {
  display: grid;
  grid-template-columns: repeat(3, 1fr);
  gap: 0.5rem;
  max-width: 300px;
}

.position-button {
  border: 1px solid var(--color-border);
  border-radius: 6px;
  padding: 0.75rem;
  font-size: 0.75rem;
  font-weight: 500;
  text-align: center;
  color: var(--color-text-secondary);
  background: var(--color-background-primary);
  transition: all 0.2s ease;
  cursor: pointer;
}

.position-button:hover {
  border-color: var(--color-blue-common);
  color: var(--color-text-primary);
  background: rgb(64 158 255 / 10%);
}

.position-button.active {
  border-color: var(--color-blue-common);
  color: white;
  background: var(--color-blue-common);
  box-shadow: 0 2px 4px rgb(64 158 255 / 30%);
}

/* Buttons */
.btn {
  display: inline-flex;
  align-items: center;
  border: 1px solid var(--color-border);
  border-radius: 6px;
  padding: 0.75rem 1rem;
  font-size: 0.875rem;
  font-weight: 500;
  text-decoration: none;
  color: var(--color-text-primary);
  background: var(--color-background-primary);
  transition: all 0.2s ease;
  gap: 0.5rem;
  cursor: pointer;
}

.btn:hover {
  border-color: var(--color-blue-common);
  background: var(--color-background-secondary);
}

.btn-primary {
  border-color: var(--color-blue-common);
  color: white;
  background: var(--color-blue-common);
}

.btn-primary:hover {
  border-color: var(--color-primary);
  background: var(--color-primary);
}

.btn-secondary {
  border-color: var(--color-border);
  color: var(--color-text-secondary);
  background: var(--color-background-primary);
}

.btn-secondary:hover {
  border-color: var(--color-border-secondary);
  color: var(--color-text-primary);
  background: var(--color-background-secondary);
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
  border-top: 1px solid var(--color-border-secondary);
  padding-top: 1rem;
}

/* Responsive Design */
@media (width <= 768px) {
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
  border-color: var(--color-border);
  background: var(--color-background-tertiary);
}

:root.dark .form-input,
:root.dark .form-textarea,
:root.auto.dark .form-input,
:root.auto.dark .form-textarea {
  border-color: var(--color-border);
  color: var(--color-text-primary);
  background: var(--color-surface);
}

:root.dark .switch-slider::before,
:root.auto.dark .switch-slider::before {
  background: var(--color-surface);
}

:root.dark .btn-secondary,
:root.auto.dark .btn-secondary {
  border-color: var(--color-border);
  color: var(--color-text-secondary);
  background: var(--color-surface);
}

:root.dark .btn-secondary:hover,
:root.auto.dark .btn-secondary:hover {
  border-color: var(--color-border-hover);
  color: var(--color-text-primary);
  background: var(--color-background-tertiary);
}

:root.dark .switch-label,
:root.auto.dark .switch-label {
  border-color: var(--color-border);
  color: var(--color-text-secondary);
  background: var(--color-surface);
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
  border-color: var(--color-border);
  color: var(--color-text-secondary);
  background: var(--color-surface);
}

:root.dark .position-button:hover,
:root.auto.dark .position-button:hover {
  border-color: var(--color-primary);
  color: var(--color-text-primary);
  background: var(--color-background-tertiary);
}

:root.dark .position-button.active,
:root.auto.dark .position-button.active {
  border-color: var(--color-primary);
  color: var(--color-text-inverse);
  background: var(--color-primary);
}

:root.dark .radio-group,
:root.auto.dark .radio-group {
  border-color: var(--color-border);
  color: var(--color-text-secondary);
  background: var(--color-background-tertiary);
}
</style>
