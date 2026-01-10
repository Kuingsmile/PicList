<template>
  <div class="image-process-settings">
    <!-- Tab Navigation -->
    <div class="tab-navigation">
      <div class="tab-indicator" :style="tabIndicatorStyle" />
      <button
        v-for="tab in tabs"
        ref="tabRefs"
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
                <Sliders :size="20" />
              </div>
              <div class="section-title-group">
                <h2>{{ $t('pages.imageProcess.general.basicImageProcessing') }}</h2>
              </div>
            </div>

            <div class="form-grid">
              <div class="form-group">
                <label class="switch-label">
                  <input v-model="activeForm.compress.isRemoveExif" type="checkbox" class="switch-input" />
                  <span class="switch-slider" />
                  <div class="switch-content">
                    <span class="switch-title">{{ $t('pages.imageProcess.general.isRemoveExif') }}</span>
                  </div>
                </label>

                <PerPicbedSetting
                  v-if="!configId"
                  :map-field="compressForm.isRemoveExifMap"
                  :default-value="defaultCompressSetting.isRemoveExif"
                  field-name="isRemoveExif"
                  :global-value="compressForm.isRemoveExif"
                  input-type="checkbox"
                  @map-change="
                    (picbedType, value) =>
                      safeSetMapValue(
                        compressForm,
                        'isRemoveExif',
                        picbedType,
                        value,
                        defaultCompressSetting.isRemoveExif,
                      )
                  "
                />
              </div>

              <div class="form-group">
                <label>{{ $t('pages.imageProcess.general.quality') }}</label>
                <input v-model.number="activeForm.compress.quality" type="range" min="1" max="100" class="form-range" />
                <div class="range-value">{{ activeForm.compress.quality }}%</div>

                <PerPicbedSetting
                  v-if="!configId"
                  :map-field="compressForm.qualityMap"
                  :default-value="defaultCompressSetting.quality"
                  field-name="quality"
                  :global-value="compressForm.quality"
                  input-type="range"
                  :range-min="1"
                  :range-max="100"
                  :range-step="1"
                  range-suffix="%"
                  @map-change="
                    (picbedType, value) =>
                      safeSetMapValue(compressForm, 'quality', picbedType, value, defaultCompressSetting.quality)
                  "
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
                <input v-model="activeForm.compress.isConvert" type="checkbox" class="switch-input" />
                <span class="switch-slider" />
                <div class="switch-content">
                  <span class="switch-title">{{ $t('pages.imageProcess.general.isConvert') }}</span>
                </div>
              </label>

              <PerPicbedSetting
                v-if="!configId"
                :map-field="compressForm.isConvertMap"
                :default-value="defaultCompressSetting.isConvert"
                field-name="isConvert"
                :global-value="compressForm.isConvert"
                input-type="checkbox"
                @map-change="
                  (picbedType, value) =>
                    safeSetMapValue(compressForm, 'isConvert', picbedType, value, defaultCompressSetting.isConvert)
                "
              />
            </div>

            <div v-if="activeForm.compress.isConvert" class="form-grid">
              <div class="form-group">
                <label>{{ $t('pages.imageProcess.general.destinationFormat') }}</label>
                <select v-model="activeForm.compress.convertFormat" class="form-input">
                  <option v-for="format in availableFormat" :key="format" :value="format">
                    {{ format.toUpperCase() }}
                  </option>
                </select>

                <PerPicbedSetting
                  v-if="!configId"
                  :map-field="compressForm.convertFormatMap"
                  :default-value="defaultCompressSetting.convertFormat"
                  field-name="convertFormat"
                  :global-value="compressForm.convertFormat"
                  input-type="select"
                  :select-options="availableFormat.map(format => ({ value: format, label: format.toUpperCase() }))"
                  @map-change="
                    (picbedType, value) =>
                      safeSetMapValue(
                        compressForm,
                        'convertFormat',
                        picbedType,
                        value,
                        defaultCompressSetting.convertFormat,
                      )
                  "
                />
              </div>

              <div class="form-group">
                <label>{{ $t('pages.imageProcess.general.specificFormatConversion') }}</label>
                <textarea
                  v-model="convertStr"
                  class="form-textarea"
                  rows="3"
                  placeholder='{"jpg": "png", "png": "jpg"}'
                />

                <PerPicbedSetting
                  v-if="!configId"
                  :map-field="compressForm.formatConvertObjMap"
                  :default-value="'{}'"
                  field-name="formatConvertObj"
                  :global-value="formatConvertObjStr"
                  input-type="text"
                  text-placeholder="{}"
                  @map-change="
                    (picbedType, value) =>
                      safeSetMapValue(
                        compressForm,
                        'formatConvertObj',
                        picbedType,
                        value,
                        defaultCompressSetting.formatConvertObj,
                      )
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
                <input v-model="activeForm.watermark.isAddWatermark" type="checkbox" class="switch-input" />
                <span class="switch-slider" />
                <div class="switch-content">
                  <span class="switch-title">{{ $t('pages.imageProcess.watermark.isAdd') }}</span>
                </div>
              </label>

              <PerPicbedSetting
                v-if="!configId"
                :map-field="waterMarkForm.isAddWatermarkMap"
                :default-value="defaultWaterMarkSetting.isAddWatermark"
                field-name="isAddWatermark"
                :global-value="waterMarkForm.isAddWatermark"
                input-type="checkbox"
                @map-change="
                  (picbedType, value) =>
                    safeSetMapValue(
                      waterMarkForm,
                      'isAddWatermark',
                      picbedType,
                      value,
                      defaultWaterMarkSetting.isAddWatermark,
                    )
                "
              />
            </div>

            <div v-if="activeForm.watermark.isAddWatermark" class="watermark-settings">
              <div class="form-group">
                <label>{{ $t('pages.imageProcess.watermark.type') }}</label>
                <div class="radio-group">
                  <label class="radio-option">
                    <input v-model="activeForm.watermark.watermarkType" type="radio" value="text" class="radio-input" />
                    <span class="radio-indicator" />
                    <span class="radio-label">{{ $t('pages.imageProcess.watermark.text') }}</span>
                  </label>
                  <label class="radio-option">
                    <input
                      v-model="activeForm.watermark.watermarkType"
                      type="radio"
                      value="image"
                      class="radio-input"
                    />
                    <span class="radio-indicator" />
                    <span class="radio-label">{{ $t('pages.imageProcess.watermark.image') }}</span>
                  </label>
                </div>

                <PerPicbedSetting
                  v-if="!configId"
                  :map-field="waterMarkForm.watermarkTypeMap"
                  :default-value="defaultWaterMarkSetting.watermarkType"
                  field-name="watermarkType"
                  :global-value="waterMarkForm.watermarkType"
                  input-type="radio"
                  :radio-options="[
                    { value: 'text', label: $t('pages.imageProcess.watermark.text') },
                    { value: 'image', label: $t('pages.imageProcess.watermark.image') },
                  ]"
                  @map-change="
                    (picbedType, value) =>
                      safeSetMapValue(
                        waterMarkForm,
                        'watermarkType',
                        picbedType,
                        value,
                        defaultWaterMarkSetting.watermarkType,
                      )
                  "
                />
              </div>

              <div class="form-grid">
                <div class="form-group">
                  <label class="switch-label">
                    <input v-model="activeForm.watermark.isFullScreenWatermark" type="checkbox" class="switch-input" />
                    <span class="switch-slider" />
                    <div class="switch-content">
                      <span class="switch-title">{{ $t('pages.imageProcess.watermark.isFullScreen') }}</span>
                    </div>
                  </label>

                  <PerPicbedSetting
                    v-if="!configId"
                    :map-field="waterMarkForm.isFullScreenWatermarkMap"
                    :default-value="defaultWaterMarkSetting.isFullScreenWatermark"
                    field-name="isFullScreenWatermark"
                    :global-value="waterMarkForm.isFullScreenWatermark"
                    input-type="checkbox"
                    @map-change="
                      (picbedType, value) =>
                        safeSetMapValue(
                          waterMarkForm,
                          'isFullScreenWatermark',
                          picbedType,
                          value,
                          defaultWaterMarkSetting.isFullScreenWatermark,
                        )
                    "
                  />
                </div>

                <div class="form-group">
                  <label>{{ $t('pages.imageProcess.watermark.degree') }}</label>
                  <input
                    v-model.number="activeForm.watermark.watermarkDegree"
                    type="range"
                    min="-360"
                    max="360"
                    class="form-range"
                  />
                  <div class="range-value">{{ activeForm.watermark.watermarkDegree }}°</div>

                  <PerPicbedSetting
                    v-if="!configId"
                    :map-field="waterMarkForm.watermarkDegreeMap"
                    :default-value="defaultWaterMarkSetting.watermarkDegree"
                    field-name="watermarkDegree"
                    :global-value="waterMarkForm.watermarkDegree"
                    input-type="range"
                    :range-min="-360"
                    :range-max="360"
                    :range-step="1"
                    range-suffix="°"
                    @map-change="
                      (picbedType, value) =>
                        safeSetMapValue(
                          waterMarkForm,
                          'watermarkDegree',
                          picbedType,
                          value,
                          defaultWaterMarkSetting.watermarkDegree,
                        )
                    "
                  />
                </div>

                <div class="form-group">
                  <label>{{ $t('pages.imageProcess.watermark.scaleRatio') }}</label>
                  <input
                    v-model.number="activeForm.watermark.watermarkScaleRatio"
                    type="range"
                    min="0"
                    max="1"
                    step="0.01"
                    class="form-range"
                  />
                  <div class="range-value">
                    {{ Math.round((activeForm.watermark.watermarkScaleRatio || 0) * 100) }}%
                  </div>

                  <PerPicbedSetting
                    v-if="!configId"
                    :map-field="waterMarkForm.watermarkScaleRatioMap"
                    :default-value="defaultWaterMarkSetting.watermarkScaleRatio"
                    field-name="watermarkScaleRatio"
                    :global-value="waterMarkForm.watermarkScaleRatio"
                    input-type="range"
                    :range-min="0"
                    :range-max="1"
                    :range-step="0.01"
                    range-suffix="%"
                    @map-change="
                      (picbedType, value) =>
                        safeSetMapValue(
                          waterMarkForm,
                          'watermarkScaleRatio',
                          picbedType,
                          value,
                          defaultWaterMarkSetting.watermarkScaleRatio,
                        )
                    "
                  />
                </div>
              </div>

              <div v-if="activeForm.watermark.watermarkType === 'text'" class="form-grid">
                <div class="form-group">
                  <label>{{ $t('pages.imageProcess.watermark.inputText') }}</label>
                  <input
                    v-model="activeForm.watermark.watermarkText"
                    type="text"
                    class="form-input"
                    :placeholder="$t('pages.imageProcess.watermark.inputTextPlaceholder')"
                  />

                  <!-- Per-picbed settings for watermarkText -->
                  <PerPicbedSetting
                    v-if="!configId"
                    :map-field="waterMarkForm.watermarkTextMap"
                    :default-value="defaultWaterMarkSetting.watermarkText"
                    field-name="watermarkText"
                    :global-value="waterMarkForm.watermarkText"
                    input-type="text"
                    :text-placeholder="$t('pages.imageProcess.watermark.inputTextPlaceholder')"
                    @map-change="
                      (picbedType, value) =>
                        safeSetMapValue(
                          waterMarkForm,
                          'watermarkText',
                          picbedType,
                          value,
                          defaultWaterMarkSetting.watermarkText,
                        )
                    "
                  />
                </div>

                <div class="form-group">
                  <label>{{ $t('pages.imageProcess.watermark.textFontPath') }}</label>
                  <input
                    v-model="activeForm.watermark.watermarkFontPath"
                    type="text"
                    class="form-input"
                    :placeholder="$t('pages.imageProcess.watermark.textFontPathPlaceholder')"
                  />

                  <PerPicbedSetting
                    v-if="!configId"
                    :map-field="waterMarkForm.watermarkFontPathMap"
                    :default-value="defaultWaterMarkSetting.watermarkFontPath"
                    field-name="watermarkFontPath"
                    :global-value="waterMarkForm.watermarkFontPath"
                    input-type="text"
                    :text-placeholder="$t('pages.imageProcess.watermark.textFontPathPlaceholder')"
                    @map-change="
                      (picbedType, value) =>
                        safeSetMapValue(
                          waterMarkForm,
                          'watermarkFontPath',
                          picbedType,
                          value,
                          defaultWaterMarkSetting.watermarkFontPath,
                        )
                    "
                  />
                </div>

                <div class="form-group">
                  <label>{{ $t('pages.imageProcess.watermark.color') }}</label>
                  <div class="color-input-group">
                    <input v-model="activeForm.watermark.watermarkColor" type="color" class="form-color" />
                    <input
                      v-model="activeForm.watermark.watermarkColor"
                      type="text"
                      class="form-input"
                      placeholder="#CCCCCC73"
                    />
                  </div>

                  <PerPicbedSetting
                    v-if="!configId"
                    :map-field="waterMarkForm.watermarkColorMap"
                    :default-value="defaultWaterMarkSetting.watermarkColor"
                    field-name="watermarkColor"
                    :global-value="waterMarkForm.watermarkColor"
                    input-type="color"
                    @map-change="
                      (picbedType, value) =>
                        safeSetMapValue(
                          waterMarkForm,
                          'watermarkColor',
                          picbedType,
                          value,
                          defaultWaterMarkSetting.watermarkColor,
                        )
                    "
                  />
                </div>
              </div>

              <!-- Image Watermark Settings -->
              <div v-if="activeForm.watermark.watermarkType === 'image'" class="form-group">
                <label>{{ $t('pages.imageProcess.watermark.imagePath') }}</label>
                <input
                  v-model="activeForm.watermark.watermarkImagePath"
                  type="text"
                  class="form-input"
                  :placeholder="$t('pages.imageProcess.watermark.imagePathPlaceholder')"
                />

                <PerPicbedSetting
                  v-if="!configId"
                  :map-field="waterMarkForm.watermarkImagePathMap"
                  :default-value="defaultWaterMarkSetting.watermarkImagePath"
                  field-name="watermarkImagePath"
                  :global-value="waterMarkForm.watermarkImagePath"
                  input-type="text"
                  :text-placeholder="$t('pages.imageProcess.watermark.imagePathPlaceholder')"
                  @map-change="
                    (picbedType, value) =>
                      safeSetMapValue(
                        waterMarkForm,
                        'watermarkImagePath',
                        picbedType,
                        value,
                        defaultWaterMarkSetting.watermarkImagePath,
                      )
                  "
                />
              </div>

              <div v-if="activeForm.watermark.watermarkType === 'image'" class="form-group">
                <label>{{ $t('pages.imageProcess.watermark.imageOpacity') }}</label>
                <input
                  v-model.number="activeForm.watermark.watermarkImageOpacity"
                  type="range"
                  min="0"
                  max="255"
                  step="1"
                  class="form-range"
                />
                <div class="range-value">
                  {{ activeForm.watermark.watermarkImageOpacity || 0 }}
                </div>

                <PerPicbedSetting
                  v-if="!configId"
                  :map-field="waterMarkForm.watermarkImageOpacityMap"
                  :default-value="defaultWaterMarkSetting.watermarkImageOpacity"
                  field-name="watermarkImageOpacity"
                  :global-value="waterMarkForm.watermarkImageOpacity"
                  input-type="range"
                  :range-min="0"
                  :range-max="255"
                  :range-step="1"
                  @map-change="
                    (picbedType, value) =>
                      safeSetMapValue(
                        waterMarkForm,
                        'watermarkImageOpacity',
                        picbedType,
                        value,
                        defaultWaterMarkSetting.watermarkImageOpacity,
                      )
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
                    :class="{ active: activeForm.watermark.watermarkPosition === key }"
                    @click="activeForm.watermark.watermarkPosition = key as any"
                  >
                    {{ label }}
                  </button>
                </div>

                <PerPicbedSetting
                  v-if="!configId"
                  :map-field="waterMarkForm.watermarkPositionMap"
                  :default-value="defaultWaterMarkSetting.watermarkPosition"
                  field-name="watermarkPosition"
                  :global-value="waterMarkForm.watermarkPosition"
                  input-type="select"
                  :select-options="
                    Array.from(waterMarkPositionMap.entries()).map(([key, label]) => ({
                      value: key,
                      label,
                    }))
                  "
                  @map-change="
                    (picbedType, value) =>
                      safeSetMapValue(
                        waterMarkForm,
                        'watermarkPosition',
                        picbedType,
                        value,
                        defaultWaterMarkSetting.watermarkPosition,
                      )
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
                  <input v-model="activeForm.compress.isFlip" type="checkbox" class="switch-input" />
                  <span class="switch-slider" />
                  <div class="switch-content">
                    <span class="switch-title">{{ $t('pages.imageProcess.transform.isFlip') }}</span>
                  </div>
                </label>

                <PerPicbedSetting
                  v-if="!configId"
                  :map-field="compressForm.isFlipMap"
                  :default-value="defaultCompressSetting.isFlip"
                  field-name="isFlip"
                  :global-value="compressForm.isFlip"
                  input-type="checkbox"
                  @map-change="
                    (picbedType, value) =>
                      safeSetMapValue(compressForm, 'isFlip', picbedType, value, defaultCompressSetting.isFlip)
                  "
                />
              </div>

              <div class="form-group">
                <label class="switch-label">
                  <input v-model="activeForm.compress.isFlop" type="checkbox" class="switch-input" />
                  <span class="switch-slider" />
                  <div class="switch-content">
                    <span class="switch-title">{{ $t('pages.imageProcess.transform.isFlop') }}</span>
                  </div>
                </label>

                <PerPicbedSetting
                  v-if="!configId"
                  :map-field="compressForm.isFlopMap"
                  :default-value="defaultCompressSetting.isFlop"
                  field-name="isFlop"
                  :global-value="compressForm.isFlop"
                  input-type="checkbox"
                  @map-change="
                    (picbedType, value) =>
                      safeSetMapValue(compressForm, 'isFlop', picbedType, value, defaultCompressSetting.isFlop)
                  "
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
                <input v-model="activeForm.compress.isRotate" type="checkbox" class="switch-input" />
                <span class="switch-slider" />
                <div class="switch-content">
                  <span class="switch-title">{{ $t('pages.imageProcess.transform.isRotate') }}</span>
                </div>
              </label>

              <PerPicbedSetting
                v-if="!configId"
                :map-field="compressForm.isRotateMap"
                :default-value="defaultCompressSetting.isRotate"
                field-name="isRotate"
                :global-value="compressForm.isRotate"
                input-type="checkbox"
                @map-change="
                  (picbedType, value) =>
                    safeSetMapValue(compressForm, 'isRotate', picbedType, value, defaultCompressSetting.isRotate)
                "
              />
            </div>

            <div v-if="activeForm.compress.isRotate" class="form-group">
              <label>{{ $t('pages.imageProcess.transform.rotationDegree') }}</label>
              <input
                v-model.number="activeForm.compress.rotateDegree"
                type="range"
                min="-360"
                max="360"
                class="form-range"
              />
              <div class="range-value">{{ activeForm.compress.rotateDegree }}°</div>

              <PerPicbedSetting
                v-if="!configId"
                :map-field="compressForm.rotateDegreeMap"
                :default-value="defaultCompressSetting.rotateDegree"
                field-name="rotateDegree"
                :global-value="compressForm.rotateDegree"
                input-type="range"
                :range-min="-360"
                :range-max="360"
                :range-step="1"
                range-suffix="°"
                @map-change="
                  (picbedType, value) =>
                    safeSetMapValue(
                      compressForm,
                      'rotateDegree',
                      picbedType,
                      value,
                      defaultCompressSetting.rotateDegree,
                    )
                "
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
                <input v-model="activeForm.compress.isReSize" type="checkbox" class="switch-input" />
                <span class="switch-slider" />
                <div class="switch-content">
                  <span class="switch-title">{{ $t('pages.imageProcess.transform.isResize') }}</span>
                </div>
              </label>

              <PerPicbedSetting
                v-if="!configId"
                :map-field="compressForm.isReSizeMap"
                :default-value="defaultCompressSetting.isReSize"
                field-name="isReSize"
                :global-value="compressForm.isReSize"
                input-type="checkbox"
                @map-change="
                  (picbedType, value) =>
                    safeSetMapValue(compressForm, 'isReSize', picbedType, value, defaultCompressSetting.isReSize)
                "
              />
            </div>

            <div v-if="activeForm.compress.isReSize" class="resize-settings">
              <div class="form-grid">
                <div class="form-group">
                  <label>{{ $t('pages.imageProcess.transform.resizeWidth') }}</label>
                  <input v-model.number="activeForm.compress.reSizeWidth" type="number" min="0" class="form-input" />

                  <PerPicbedSetting
                    v-if="!configId"
                    :map-field="compressForm.reSizeWidthMap"
                    :default-value="defaultCompressSetting.reSizeWidth"
                    field-name="reSizeWidth"
                    :global-value="compressForm.reSizeWidth"
                    input-type="number"
                    :number-min="0"
                    :number-max="10000"
                    @map-change="
                      (picbedType, value) =>
                        safeSetMapValue(
                          compressForm,
                          'reSizeWidth',
                          picbedType,
                          value,
                          defaultCompressSetting.reSizeWidth,
                        )
                    "
                  />
                </div>

                <div class="form-group">
                  <label>{{ $t('pages.imageProcess.transform.resizeHeight') }}</label>
                  <input v-model.number="activeForm.compress.reSizeHeight" type="number" min="0" class="form-input" />

                  <PerPicbedSetting
                    v-if="!configId"
                    :map-field="compressForm.reSizeHeightMap"
                    :default-value="defaultCompressSetting.reSizeHeight"
                    field-name="reSizeHeight"
                    :global-value="compressForm.reSizeHeight"
                    input-type="number"
                    :number-min="0"
                    :number-max="10000"
                    @map-change="
                      (picbedType, value) =>
                        safeSetMapValue(
                          compressForm,
                          'reSizeHeight',
                          picbedType,
                          value,
                          defaultCompressSetting.reSizeHeight,
                        )
                    "
                  />
                </div>
              </div>

              <div
                v-if="
                  ((activeForm.compress.reSizeHeight || 0) > 0 && (activeForm.compress.reSizeWidth || 0) === 0) ||
                  ((activeForm.compress.reSizeWidth || 0) > 0 && (activeForm.compress.reSizeHeight || 0) === 0)
                "
                class="form-group"
              >
                <label class="switch-label">
                  <input v-model="activeForm.compress.skipReSizeOfSmallImg" type="checkbox" class="switch-input" />
                  <span class="switch-slider" />
                  <div class="switch-content">
                    <span class="switch-title">{{
                      $t('pages.imageProcess.transform.skipResizeOfSmallImgHeight')
                    }}</span>
                  </div>
                </label>

                <PerPicbedSetting
                  v-if="!configId"
                  :map-field="compressForm.skipReSizeOfSmallImgMap"
                  :default-value="defaultCompressSetting.skipReSizeOfSmallImg"
                  field-name="skipReSizeOfSmallImg"
                  :global-value="compressForm.skipReSizeOfSmallImg"
                  input-type="checkbox"
                  @map-change="
                    (picbedType, value) =>
                      safeSetMapValue(
                        compressForm,
                        'skipReSizeOfSmallImg',
                        picbedType,
                        value,
                        defaultCompressSetting.skipReSizeOfSmallImg,
                      )
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
                <input v-model="activeForm.compress.isReSizeByPercent" type="checkbox" class="switch-input" />
                <span class="switch-slider" />
                <div class="switch-content">
                  <span class="switch-title">{{ $t('pages.imageProcess.transform.isResizeByPercent') }}</span>
                  <span class="switch-description">{{ $t('pages.imageProcess.transform.isResizeByPercentHint') }}</span>
                </div>
              </label>

              <PerPicbedSetting
                v-if="!configId"
                :map-field="compressForm.isReSizeByPercentMap"
                :default-value="defaultCompressSetting.isReSizeByPercent"
                field-name="isReSizeByPercent"
                :global-value="compressForm.isReSizeByPercent"
                input-type="checkbox"
                @map-change="
                  (picbedType, value) =>
                    safeSetMapValue(
                      compressForm,
                      'isReSizeByPercent',
                      picbedType,
                      value,
                      defaultCompressSetting.isReSizeByPercent,
                    )
                "
              />
            </div>

            <div v-if="activeForm.compress.isReSizeByPercent" class="form-group">
              <label>{{ $t('pages.imageProcess.transform.resizePercent') }}</label>
              <input
                v-model.number="activeForm.compress.reSizePercent"
                type="range"
                min="1"
                max="500"
                class="form-range"
              />
              <div class="range-value">{{ activeForm.compress.reSizePercent }}%</div>

              <PerPicbedSetting
                v-if="!configId"
                :map-field="compressForm.reSizePercentMap"
                :default-value="defaultCompressSetting.reSizePercent"
                field-name="reSizePercent"
                :global-value="compressForm.reSizePercent"
                input-type="range"
                :range-min="1"
                :range-max="500"
                :range-step="1"
                range-suffix="%"
                @map-change="
                  (picbedType, value) =>
                    safeSetMapValue(
                      compressForm,
                      'reSizePercent',
                      picbedType,
                      value,
                      defaultCompressSetting.reSizePercent,
                    )
                "
              />
            </div>
          </div>
        </div>

        <!-- Skip Process Tab -->
        <div v-else-if="activeTab === 'skipProcess'" key="skipProcess" class="tab-content">
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
                v-model="activeForm.skipProcess.skipProcessExtList"
                class="form-textarea"
                rows="3"
                :placeholder="'zip,rar,7z,tar,gz'"
              />
              <small>{{ $t('pages.imageProcess.general.skipProcessExtListPlaceholder') }}</small>
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
import type {
  availableConvertFormat,
  availableWatermarkPosition,
  IBuildInCompressOptions,
  IBuildInSkipProcessOptions,
  IBuildInWaterMarkOptions,
} from 'piclist'
import { computed, nextTick, onBeforeMount, onBeforeUnmount, onMounted, ref, toRaw, useTemplateRef, watch } from 'vue'
import { useI18n } from 'vue-i18n'

import PerPicbedSetting from '@/components/PerPicbedSetting.vue'
import { getRawData } from '@/utils/common'
import { configPaths } from '@/utils/configPaths'
import { getConfig, saveConfig } from '@/utils/dataSender'

const { t } = useI18n()
const activeTab = ref('general')

// Tab indicator animation
const tabRefs = useTemplateRef('tabRefs')
const tabIndicatorStyle = ref<Record<string, string>>({})

interface IProps {
  // 传递配置ID以加载特定配置
  configId: string
  //picbedName
  currentPicbedName: string
}

const { configId, currentPicbedName } = defineProps<IProps>()

function updateTabIndicator() {
  if (!tabRefs.value || tabRefs.value.length === 0) return
  const activeIndex = tabs.value.findIndex(tab => tab.id === activeTab.value)
  const activeTabEl = tabRefs.value[activeIndex]
  if (activeTabEl) {
    tabIndicatorStyle.value = {
      width: `${activeTabEl.offsetWidth}px`,
      transform: `translateX(${activeTabEl.offsetLeft}px)`,
    }
  }
}

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
  {
    id: 'skipProcess',
    label: t('pages.imageProcess.skipProcessSettings'),
    icon: FileText,
  },
  {
    id: 'rename',
    label: t('pages.imageProcess.renameSettings'),
    icon: Sliders,
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
  'webp',
  'png',
  'avif',
  'jpg',
  'dz',
  'fits',
  'gif',
  'heif',
  'input',
  'jpeg',
  'jp2',
  'jxl',
  'magick',
  'openslide',
  'pdf',
  'ppm',
  'raw',
  'svg',
  'tiff',
  'tif',
  'v',
]

const defaultWaterMarkSetting = {
  isAddWatermark: false,
  watermarkType: 'text' as 'text' | 'image',
  isFullScreenWatermark: false,
  watermarkDegree: 0,
  watermarkText: '',
  watermarkFontPath: '',
  watermarkScaleRatio: 0.15,
  watermarkColor: '#CCCCCC73',
  watermarkImagePath: '',
  watermarkPosition: 'southeast' as availableWatermarkPosition,
  watermarkImageOpacity: 255,
} as IBuildInWaterMarkOptions

const defaultCompressSetting = {
  quality: 100,
  isConvert: false,
  convertFormat: 'jpg' as availableConvertFormat,
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
  isFlop: false,
  formatConvertObj: {},
} as IBuildInCompressOptions

const waterMarkForm = ref<IBuildInWaterMarkOptions>({
  isAddWatermarkMap: {},
  watermarkTypeMap: {},
  isFullScreenWatermarkMap: {},
  watermarkDegreeMap: {},
  watermarkTextMap: {},
  watermarkFontPathMap: {},
  watermarkScaleRatioMap: {},
  watermarkColorMap: {},
  watermarkImagePathMap: {},
  watermarkPositionMap: {},
  watermarkImageOpacityMap: {},
  ...defaultWaterMarkSetting,
})

/* Only used if configId is not provided */
const compressForm = ref<IBuildInCompressOptions>({
  qualityMap: {},
  isConvertMap: {},
  convertFormatMap: {},
  isReSizeMap: {},
  reSizeWidthMap: {},
  reSizeHeightMap: {},
  skipReSizeOfSmallImgMap: {},
  isReSizeByPercentMap: {},
  reSizePercentMap: {},
  isRotateMap: {},
  rotateDegreeMap: {},
  isRemoveExifMap: {},
  isFlipMap: {},
  isFlopMap: {},
  formatConvertObjMap: {},
  ...defaultCompressSetting,
})
/* Only used if configId is not provided */
const formatConvertObjStr = ref('{}')
const singleFormatConvertObj = ref('{}')

const defaultSkipProcessSetting = {
  skipProcessExtList: 'zip,rar,7z,tar,gz,tar.gz,tar.bz2,tar.xz',
}
/* Only used if configId is not provided */
const skipProcessForm = ref<IBuildInSkipProcessOptions>({
  ...defaultSkipProcessSetting,
})

const isInitialized = ref(false)

function saveWaterMarkConfig() {
  saveConfig(configPaths.buildIn.watermark, toRaw(waterMarkForm.value))
}

const singleConfigSettings = ref<IBuildInListItem>({
  id: configId || '',
  compress: {
    ...defaultCompressSetting,
  },
  watermark: {
    ...defaultWaterMarkSetting,
  },
  skipProcess: {
    ...defaultSkipProcessSetting,
  },
  rename: {
    enable: false,
    format: '{filename}',
  },
  autoRename: false,
  manualRename: false,
} as IBuildInListItem)

function cleanFormatConvertObj(obj: any) {
  const cleanedObj: Record<string, any> = {}
  Object.entries(obj).forEach(([key, value]) => {
    if (imageExtList.includes(key) && typeof value === 'string' && availableFormat.includes(value)) {
      cleanedObj[key] = value
    }
  })
  return cleanedObj
}

let singleConfigInFile = {
  id: configId || '',
} as IBuildInListItem
let compressInFile = {} as IBuildInCompressOptions
async function initData() {
  // global settings
  compressInFile = (await getConfig<IBuildInCompressOptions>(configPaths.buildIn.compress)) || {}
  const watermark = (await getConfig<IBuildInWaterMarkOptions>(configPaths.buildIn.watermark)) || {}
  const skipProcess = (await getConfig<IBuildInSkipProcessOptions>(configPaths.buildIn.skipProcess)) || {}
  if (compressInFile) {
    let cleanedObj = {}
    try {
      if (typeof compressInFile.formatConvertObj === 'object') {
        cleanedObj = cleanFormatConvertObj(compressInFile.formatConvertObj)
      } else if (typeof compressInFile.formatConvertObj === 'string') {
        cleanedObj = cleanFormatConvertObj(JSON.parse(compressInFile.formatConvertObj))
      } else {
        cleanedObj = {}
      }
    } catch (_error) {
      cleanedObj = {}
    }
    compressInFile.formatConvertObj = cleanedObj
    formatConvertObjStr.value = JSON.stringify(cleanedObj)
    const cleanFullMap: Record<string, any> = {}
    if (compressInFile.formatConvertObjMap) {
      Object.entries(compressInFile.formatConvertObjMap).forEach(([picbedType, value]) => {
        try {
          if (typeof value === 'object') {
            const cleanedObj = cleanFormatConvertObj(value)
            if (Object.keys(cleanedObj).length > 0) {
              cleanFullMap[picbedType] = cleanedObj
            }
          } else if (typeof value === 'string') {
            const parsedObj = JSON.parse(value)
            const cleanedObj = cleanFormatConvertObj(parsedObj)
            if (Object.keys(cleanedObj).length > 0) {
              cleanFullMap[picbedType] = cleanedObj
            }
          } else {
            cleanFullMap[picbedType] = {}
          }
        } catch (_error) {}
      })
    }
    compressInFile.formatConvertObjMap = cleanFullMap
    saveConfig(configPaths.buildIn.compress, {
      ...compressInFile,
    })
    compressForm.value = { ...compressForm.value, ...compressInFile }
  }
  if (watermark) {
    if (watermark.watermarkColor === '') {
      watermark.watermarkColor = '#CCCCCC73'
      saveConfig(configPaths.buildIn.watermark, watermark)
    }
    waterMarkForm.value = { ...waterMarkForm.value, ...watermark }
  }
  if (skipProcess) {
    skipProcessForm.value = {
      ...skipProcessForm.value,
      ...skipProcess,
    }
  }
  if (configId) {
    let buildInList = await getConfig<Undefinable<IBuildInListItem[]>>(configPaths.buildIn.list)
    const globalRenameSettings = (await getConfig<{
      enable: boolean
      format: string
    }>(configPaths.buildIn.rename)) || {
      enable: false,
      format: '{filename}',
    }
    const globalAutoRename = (await getConfig<boolean>(configPaths.settings.rename)) || false
    const globalManualRename = (await getConfig<boolean>(configPaths.settings.autoRename)) || false
    if (!buildInList) {
      saveConfig(configPaths.buildIn.list, [])
      buildInList = []
    }
    singleConfigInFile = buildInList?.find(item => item.id === configId) || ({} as IBuildInListItem)
    const mergedCompress = {
      ...compressForm.value,
      ...(singleConfigInFile.compress || {}),
    }
    Object.keys(defaultCompressSetting).forEach(key => {
      if (singleConfigInFile.compress?.[key] !== undefined) {
        return
      }
      const mapFieldName = `${key}Map`
      if (mergedCompress[mapFieldName]?.[currentPicbedName] !== undefined) {
        mergedCompress[key as keyof IBuildInCompressOptions] = mergedCompress[mapFieldName][currentPicbedName]
      }
    })
    const mergedWatermark = {
      ...waterMarkForm.value,
      ...(singleConfigInFile.watermark || {}),
    }
    Object.keys(defaultWaterMarkSetting).forEach(key => {
      if (singleConfigInFile.watermark?.[key] !== undefined) {
        return
      }
      const mapFieldName = `${key}Map`
      if (mergedWatermark[mapFieldName]?.[currentPicbedName] !== undefined) {
        mergedWatermark[key as keyof IBuildInWaterMarkOptions] = mergedWatermark[mapFieldName][currentPicbedName]
      }
    })
    let cleanedFormatConvertObj = {}
    try {
      const parsedObj = JSON.parse(singleConfigInFile.compress?.formatConvertObj as any)
      cleanedFormatConvertObj = cleanFormatConvertObj(parsedObj)
      if (JSON.stringify(cleanedFormatConvertObj) !== JSON.stringify(parsedObj)) {
        singleConfigInFile.compress!.formatConvertObj = JSON.stringify(cleanedFormatConvertObj)
      }
      const updatedConfig = {
        ...singleConfigInFile,
        compress: {
          ...singleConfigInFile.compress,
          formatConvertObj: cleanedFormatConvertObj,
        },
      }
      await UpdateBuildInList(updatedConfig)
    } catch (_error) {
      cleanedFormatConvertObj = {}
    }
    singleFormatConvertObj.value = JSON.stringify(cleanedFormatConvertObj)
    singleConfigSettings.value = {
      id: configId,
      compress: { ...mergedCompress },
      watermark: { ...mergedWatermark },
      skipProcess: {
        ...skipProcessForm.value,
        ...(singleConfigInFile.skipProcess || {}),
      },
      rename: {
        ...{
          enable: false,
          format: '{filename}',
        },
        ...globalRenameSettings,
        ...(singleConfigInFile.rename || {}),
      },
      autoRename: globalAutoRename || singleConfigInFile.autoRename || false,
      manualRename: globalManualRename || singleConfigInFile.manualRename || false,
    }
  }
}

function safeSetMapValue(form: any, fieldName: string, picbedType: string, value: any, defaultValue: any) {
  const mapFieldName = `${fieldName}Map`
  if (fieldName === 'formatConvertObj') {
    value = value || '{}'
    let parsedObj = {}
    try {
      parsedObj = JSON.parse(value)
      const cleanedObj = cleanFormatConvertObj(parsedObj)
      if (JSON.stringify(cleanedObj) !== JSON.stringify(parsedObj)) {
        value = JSON.stringify(cleanedObj)
      }
    } catch (_error) {
      return
    }
  }
  if (!form[mapFieldName]) {
    form[mapFieldName] = {}
  }
  const isValueDefault =
    fieldName === 'formatConvertObj'
      ? JSON.stringify(JSON.parse(value)) === JSON.stringify(defaultValue)
      : value === defaultValue
  const isFormValueDefault =
    fieldName === 'formatConvertObj'
      ? JSON.stringify(form[fieldName]) === JSON.stringify(defaultValue)
      : form[fieldName] === defaultValue
  if (isValueDefault && isFormValueDefault) {
    delete form[mapFieldName][picbedType]
  } else {
    if (fieldName === 'formatConvertObj') {
      form[mapFieldName][picbedType] = JSON.parse(value)
      return
    }
    form[mapFieldName][picbedType] = value
  }
}

function saveSkipProcessConfig() {
  saveConfig(configPaths.buildIn.skipProcess, toRaw(skipProcessForm.value))
}

function saveCompressConfig() {
  const cleanFullMap: Record<string, any> = {}
  Object.entries(compressForm.value.formatConvertObjMap || {}).forEach(([picbedType, value]) => {
    try {
      const cleanedObj = cleanFormatConvertObj(value)
      cleanFullMap[picbedType] = cleanedObj
    } catch (_error) {}
  })
  if (JSON.stringify(cleanFullMap) !== JSON.stringify(compressForm.value.formatConvertObjMap)) {
    compressForm.value.formatConvertObjMap = cleanFullMap
  }

  saveConfig(configPaths.buildIn.compress, toRaw(compressForm.value))
}

const activeForm = computed<any>(() => {
  if (configId) {
    return {
      compress: singleConfigSettings.value.compress,
      watermark: singleConfigSettings.value.watermark,
      skipProcess: singleConfigSettings.value.skipProcess,
    }
  } else {
    return {
      compress: compressForm.value,
      watermark: waterMarkForm.value,
      skipProcess: skipProcessForm.value,
    }
  }
})

const convertStr = computed({
  get() {
    return configId ? singleFormatConvertObj.value : formatConvertObjStr.value
  },
  set(newValue) {
    if (configId) {
      singleFormatConvertObj.value = newValue
    } else {
      formatConvertObjStr.value = newValue
    }
  },
})

const compressWatchKeys = [...(Object.keys(defaultCompressSetting) as (keyof IBuildInCompressOptions)[])]
const waterMarkWatchKeys = Object.keys(defaultWaterMarkSetting) as (keyof IBuildInWaterMarkOptions)[]
const skipProcessWatchKeys = Object.keys(defaultSkipProcessSetting) as (keyof IBuildInSkipProcessOptions)[]

async function UpdateBuildInList(newValue: IBuildInListItem) {
  let buildInList = await getConfig<Undefinable<IBuildInListItem[]>>(configPaths.buildIn.list)
  if (!buildInList) {
    buildInList = []
  }
  const existingIndex = buildInList.findIndex(item => item.id === newValue.id)
  if (existingIndex !== -1) {
    buildInList[existingIndex] = newValue
  } else {
    buildInList.push(newValue)
  }
  saveConfig(configPaths.buildIn.list, getRawData(buildInList))
}

async function checkIfItemOnlyId(newValue: IBuildInListItem) {
  const keys = Object.keys(newValue).filter(key => key !== 'id')
  if (keys.length === 0) return true
  for (const key of keys) {
    const value = (newValue as any)[key]
    if (typeof value === 'object' && value !== null) {
      if (Object.keys(value).length > 0) {
        return false
      }
    } else if (value !== undefined && value !== null) {
      return false
    }
  }
  return true
}

async function removeItemFromBuildInList(id: string) {
  let buildInList = await getConfig<Undefinable<IBuildInListItem[]>>(configPaths.buildIn.list)
  if (!buildInList) {
    buildInList = []
  }
  buildInList = buildInList.filter(item => item.id !== id)
  saveConfig(configPaths.buildIn.list, getRawData(buildInList))
}

compressWatchKeys.forEach(key => {
  console.log('setting up watch for compress key:', key)
  watch(
    () => singleConfigSettings.value.compress![key],
    async newValue => {
      console.log('detected change in compress key:', key, 'new value:', newValue)
      const defaultValue = defaultCompressSetting[key]
      const perPicBedValue = compressForm.value[`${key}Map`]?.[currentPicbedName]
      const inheritedValue = perPicBedValue ?? compressForm.value[key] ?? defaultValue
      singleConfigInFile.id = configId || ''
      const shouldUpdate =
        key === 'formatConvertObj'
          ? JSON.stringify(newValue) !== JSON.stringify(inheritedValue)
          : newValue !== inheritedValue
      if (shouldUpdate) {
        singleConfigInFile.compress = { ...singleConfigInFile.compress, [key]: newValue }
        await UpdateBuildInList(singleConfigInFile)
      } else {
        if (singleConfigInFile.compress) delete singleConfigInFile.compress[key]
        if (await checkIfItemOnlyId(singleConfigInFile)) {
          await removeItemFromBuildInList(singleConfigInFile.id)
        } else {
          await UpdateBuildInList(singleConfigInFile)
        }
      }
    },
  )
})

waterMarkWatchKeys.forEach(key => {
  watch(
    () => singleConfigSettings.value.watermark![key],
    newValue => {
      const defaultValue = defaultWaterMarkSetting[key]
      const perPicBedValue = waterMarkForm.value[`${key}Map`]?.[currentPicbedName]
      const inheritedValue = perPicBedValue ?? waterMarkForm.value[key] ?? defaultValue
      singleConfigInFile.id = configId || ''
      if (newValue !== inheritedValue) {
        singleConfigInFile.watermark = { ...singleConfigInFile.watermark, [key]: newValue }
        UpdateBuildInList(singleConfigInFile)
      } else {
        if (singleConfigInFile.watermark) delete singleConfigInFile.watermark[key]
        checkIfItemOnlyId(singleConfigInFile).then(async isOnlyId => {
          if (isOnlyId) {
            await removeItemFromBuildInList(singleConfigInFile.id)
          } else {
            await UpdateBuildInList(singleConfigInFile)
          }
        })
      }
    },
  )
})

skipProcessWatchKeys.forEach(key => {
  watch(
    () => singleConfigSettings.value.skipProcess![key],
    newValue => {
      const defaultValue = defaultSkipProcessSetting[key]
      const inheritedValue = skipProcessForm.value[key] ?? defaultValue
      singleConfigInFile.id = configId || ''
      if (newValue !== inheritedValue) {
        singleConfigInFile.skipProcess = { ...singleConfigInFile.skipProcess, [key]: newValue }
        UpdateBuildInList(singleConfigInFile)
      } else {
        if (singleConfigInFile.skipProcess) delete singleConfigInFile.skipProcess[key]
        checkIfItemOnlyId(singleConfigInFile).then(async isOnlyId => {
          if (isOnlyId) {
            await removeItemFromBuildInList(singleConfigInFile.id)
          } else {
            await UpdateBuildInList(singleConfigInFile)
          }
        })
      }
    },
  )
})

watch(activeTab, () => {
  nextTick(updateTabIndicator)
})

watch(singleFormatConvertObj, () => {
  let parsedObj = {}
  try {
    parsedObj = JSON.parse(singleFormatConvertObj.value)
    const cleanedObj = cleanFormatConvertObj(parsedObj)
    singleConfigSettings.value.compress!.formatConvertObj = cleanedObj
    if (JSON.stringify(cleanedObj) !== JSON.stringify(parsedObj)) {
      singleFormatConvertObj.value = JSON.stringify(cleanedObj)
    }
  } catch (_error) {
    return
  }
})

watch(formatConvertObjStr, () => {
  let parsedObj = {}
  try {
    parsedObj = JSON.parse(formatConvertObjStr.value)
    const cleanedObj = cleanFormatConvertObj(parsedObj)
    compressForm.value.formatConvertObj = cleanedObj
    if (JSON.stringify(cleanedObj) !== JSON.stringify(parsedObj)) {
      formatConvertObjStr.value = JSON.stringify(cleanedObj)
    }
  } catch (_error) {
    return
  }
})

watch(skipProcessForm, () => saveSkipProcessConfig(), { deep: true })
watch(compressForm, () => saveCompressConfig(), { deep: true })
watch(waterMarkForm, () => saveWaterMarkConfig(), { deep: true })

onBeforeMount(() => {
  initData().then(() => {
    isInitialized.value = true
  })
})

onMounted(() => {
  nextTick(updateTabIndicator)
  window.addEventListener('resize', updateTabIndicator)
})

onBeforeUnmount(() => {
  window.removeEventListener('resize', updateTabIndicator)
})
</script>

<style scoped src="./css/ImageProcessSetting.css"></style>
