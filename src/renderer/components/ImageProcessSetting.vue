<template>
  <div class="image-process-settings">
    <!-- Tab Navigation -->
    <div class="tab-navigation">
      <div class="tab-indicator" :style="tabIndicatorStyle" />
      <button
        v-for="(tab, index) in tabs"
        :ref="el => setTabRef(el, index)"
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
      <transition name="fade-slide" mode="out-in">
        <!-- General Settings Tab -->
        <div v-if="activeTab === 'general'" key="general" class="tab-content">
          <div class="settings-section">
            <div class="section-header">
              <div class="section-icon">
                <FileText :size="20" />
              </div>
              <div class="section-title-group">
                <h2>{{ $t('pages.imageProcess.general.skipProcessExtList') }}</h2>
              </div>
            </div>
            <div class="form-group">
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
            <div class="section-header">
              <div class="section-icon">
                <Sliders :size="20" />
              </div>
              <div class="section-title-group">
                <h2>{{ $t('pages.imageProcess.general.basicImageProcessing') }}</h2>
              </div>
            </div>

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
            <div class="section-header">
              <div class="section-icon">
                <RefreshCw :size="20" />
              </div>
              <div class="section-title-group">
                <h2>{{ $t('pages.imageProcess.general.formatConversion') }}</h2>
              </div>
            </div>

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
                @map-change="
                  (picbedType, value) => safeSetMapValue(compressForm, 'isConvert', picbedType, value, false)
                "
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
        <div v-else-if="activeTab === 'watermark'" key="watermark" class="tab-content">
          <div class="settings-section">
            <div class="section-header">
              <div class="section-icon watermark-icon">
                <Droplets :size="20" />
              </div>
              <div class="section-title-group">
                <h2>{{ $t('pages.imageProcess.watermark.title') }}</h2>
                <p>{{ $t('pages.imageProcess.watermark.description') }}</p>
              </div>
            </div>

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
                    (picbedType, value) =>
                      safeSetMapValue(waterMarkForm, 'watermarkImageOpacity', picbedType, value, 255)
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
        <div v-else-if="activeTab === 'transform'" key="transform" class="tab-content">
          <div class="settings-section">
            <div class="section-header">
              <div class="section-icon transform-icon">
                <FlipHorizontal :size="20" />
              </div>
              <div class="section-title-group">
                <h2>{{ $t('pages.imageProcess.transform.title') }}</h2>
                <p>{{ $t('pages.imageProcess.transform.description') }}</p>
              </div>
            </div>

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
            <div class="section-header">
              <div class="section-icon rotate-icon">
                <RotateCw :size="20" />
              </div>
              <div class="section-title-group">
                <h2>{{ $t('pages.imageProcess.transform.rotationTitle') }}</h2>
                <p>{{ $t('pages.imageProcess.transform.rotationDescription') }}</p>
              </div>
            </div>

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
            <div class="section-header">
              <div class="section-icon resize-icon">
                <Maximize2 :size="20" />
              </div>
              <div class="section-title-group">
                <h2>{{ $t('pages.imageProcess.transform.resizeTitle') }}</h2>
                <p>{{ $t('pages.imageProcess.transform.resizeDescription') }}</p>
              </div>
            </div>

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
                    <span class="switch-title">{{
                      $t('pages.imageProcess.transform.skipResizeOfSmallImgHeight')
                    }}</span>
                  </div>
                </label>

                <PerPicbedSetting
                  :map-field="compressForm.skipReSizeOfSmallImgMap"
                  :default-value="false"
                  field-name="skipReSizeOfSmallImg"
                  :form-object="compressForm"
                  input-type="checkbox"
                  @map-change="
                    (picbedType, value) =>
                      safeSetMapValue(compressForm, 'skipReSizeOfSmallImg', picbedType, value, false)
                  "
                />
              </div>
            </div>
          </div>

          <div class="settings-section">
            <div class="section-header">
              <div class="section-icon percent-icon">
                <Percent :size="20" />
              </div>
              <div class="section-title-group">
                <h2>{{ $t('pages.imageProcess.transform.percentageResize') }}</h2>
              </div>
            </div>

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
                @map-change="
                  (picbedType, value) => safeSetMapValue(compressForm, 'reSizePercent', picbedType, value, 50)
                "
              />
            </div>
          </div>
        </div>
      </transition>
    </div>
  </div>
</template>

<script lang="ts" setup>
import {
  Droplets,
  FileText,
  FlipHorizontal,
  Image,
  Maximize2,
  Percent,
  RefreshCw,
  RotateCw,
  Settings,
  Sliders,
} from 'lucide-vue-next'
import type { IBuildInCompressOptions, IBuildInWaterMarkOptions } from 'piclist'
import { computed, nextTick, onBeforeMount, onBeforeUnmount, onMounted, reactive, ref, toRaw, watch } from 'vue'
import { useI18n } from 'vue-i18n'

import { configPaths } from '@/utils/configPaths'
import { getConfig, saveConfig } from '@/utils/dataSender'
import { updatePicBedGlobal } from '@/utils/global'

import PerPicbedSetting from './PerPicbedSetting.vue'

const { t } = useI18n()
const activeTab = ref('general')

// Tab indicator animation
const tabRefs = ref<(HTMLElement | null)[]>([])
const tabIndicatorStyle = ref<Record<string, string>>({})

function setTabRef(el: any, index: number) {
  tabRefs.value[index] = el
}

function updateTabIndicator() {
  const activeIndex = tabs.value.findIndex(tab => tab.id === activeTab.value)
  const activeTabEl = tabRefs.value[activeIndex]
  if (activeTabEl) {
    tabIndicatorStyle.value = {
      width: `${activeTabEl.offsetWidth}px`,
      transform: `translateX(${activeTabEl.offsetLeft}px)`,
    }
  }
}

watch(activeTab, () => {
  nextTick(updateTabIndicator)
})

onMounted(() => {
  nextTick(updateTabIndicator)
  window.addEventListener('resize', updateTabIndicator)
})

onBeforeUnmount(() => {
  window.removeEventListener('resize', updateTabIndicator)
})

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

const isInitialized = ref(false)
let saveTimeout: ReturnType<typeof setTimeout> | null = null

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
}

function debouncedSave() {
  if (!isInitialized.value) return

  if (saveTimeout) {
    clearTimeout(saveTimeout)
  }

  saveTimeout = setTimeout(() => {
    handleSaveConfig()
  }, 200)
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

  setTimeout(() => {
    isInitialized.value = true
  }, 100)
})

watch(
  () => [compressForm, waterMarkForm, skipProcessForm, formatConvertObj.value],
  () => {
    debouncedSave()
  },
  { deep: true },
)
</script>

<style scoped src="./css/ImageProcessSetting.css"></style>
