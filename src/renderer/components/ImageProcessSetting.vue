<template>
  <div class="no-scrollbar flex h-full flex-col gap-5 overflow-auto border-none p-3 text-main">
    <!-- Tab Navigation -->
    <div class="relative flex flex-wrap rounded-xl border border-border-secondary/50 p-2 shadow-sm">
      <div
        class="absolute z-0 rounded-lg bg-accent shadow-md transition-all duration-medium ease-bounce"
        :style="tabIndicatorStyle"
      />
      <button
        v-for="tab in tabs"
        ref="tabRefs"
        :key="tab.id"
        class="relative z-1 flex flex-1 cursor-pointer items-center justify-center gap-2.5 rounded-lg bg-transparent px-5 py-3.5 text-sm font-semibold text-secondary transition-all duration-medium ease-in-out not-[.active]:hover:bg-accent/50 not-[.active]:hover:text-main [.active]:font-bold [.active]:text-white"
        :class="{ active: activeTab === tab.id }"
        @click="activeTab = tab.id"
      >
        <component :is="tab.icon" :size="18" />
        <span>{{ tab.label }}</span>
      </button>
    </div>

    <!-- Settings Content -->
    <div
      class="no-scrollbar flex flex-1 flex-col overflow-auto rounded-lg border border-border-secondary/50 p-4 shadow-sm"
    >
      <transition
        name="fade-slide"
        enter-active-class="transition-all duration-medium ease-apple"
        leave-active-class="transition-all duration-medium ease-apple"
        enter-from-class="opacity-0 translate-y-[12px]"
        leave-to-class="opacity-0 -translate-y-[12px]"
        mode="out-in"
      >
        <!-- General Settings Tab -->
        <div v-if="activeTab === 'general'" key="general" class="flex flex-col gap-4">
          <SettingSection :icon="Sliders" :title="t('pages.imageProcess.general.basicImageProcessing')">
            <SettingCard p1 class="flex flex-col justify-center">
              <CustomSwitch
                v-model="activeForm.compress.isRemoveExif"
                :title="t('pages.imageProcess.general.isRemoveExif')"
                small
                no-border
              />

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
            </SettingCard>
            <SettingCard class="flex flex-col justify-center">
              <CustomRange
                v-model.number="activeForm.compress.quality"
                :title="t('pages.imageProcess.general.quality')"
                :min="1"
                :max="100"
                :step="1"
                :show-value="`${activeForm.compress.quality}%`"
              />

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
            </SettingCard>
          </SettingSection>

          <SettingSection :icon="RefreshCw" :title="t('pages.imageProcess.general.formatConversion')">
            <SettingCard class="flex flex-col justify-center">
              <CustomSwitch
                v-model="activeForm.compress.isConvert"
                :title="t('pages.imageProcess.general.isConvert')"
                no-border
                small
              />

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
            </SettingCard>

            <SettingCard v-if="activeForm.compress.isConvert">
              <label class="text-base font-semibold text-main">{{
                t('pages.imageProcess.general.destinationFormat')
              }}</label>
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
            </SettingCard>

            <SettingCard v-if="activeForm.compress.isConvert">
              <label class="text-base font-semibold text-main">{{
                t('pages.imageProcess.general.specificFormatConversion')
              }}</label>
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
            </SettingCard>
          </SettingSection>
        </div>

        <!-- Watermark Tab -->
        <div v-else-if="activeTab === 'watermark'" key="watermark" class="flex flex-col gap-4">
          <SettingSection
            :icon="Droplets"
            :title="t('pages.imageProcess.watermark.title')"
            :description="t('pages.imageProcess.watermark.description')"
          >
            <SettingCard class="flex flex-col justify-center">
              <CustomSwitch
                v-model="activeForm.watermark.isAddWatermark"
                :title="t('pages.imageProcess.watermark.isAdd')"
                small
                no-border
              />

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
            </SettingCard>

            <SettingCard v-if="activeForm.watermark.isAddWatermark">
              <label class="text-base font-semibold text-main">{{ t('pages.imageProcess.watermark.type') }}</label>
              <div class="flex flex-wrap gap-4">
                <CustomRadioOption
                  v-model="activeForm.watermark.watermarkType"
                  value="text"
                  :title="t('pages.imageProcess.watermark.text')"
                />
                <CustomRadioOption
                  v-model="activeForm.watermark.watermarkType"
                  value="image"
                  :title="t('pages.imageProcess.watermark.image')"
                />
              </div>

              <PerPicbedSetting
                v-if="!configId"
                :map-field="waterMarkForm.watermarkTypeMap"
                :default-value="defaultWaterMarkSetting.watermarkType"
                field-name="watermarkType"
                :global-value="waterMarkForm.watermarkType"
                input-type="radio"
                :radio-options="[
                  { value: 'text', label: t('pages.imageProcess.watermark.text') },
                  { value: 'image', label: t('pages.imageProcess.watermark.image') },
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
            </SettingCard>

            <SettingCard v-if="activeForm.watermark.isAddWatermark" p1 class="flex flex-col justify-center">
              <CustomSwitch
                v-model="activeForm.watermark.isFullScreenWatermark"
                :title="t('pages.imageProcess.watermark.isFullScreen')"
                small
                no-border
              />

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
            </SettingCard>

            <SettingCard v-if="activeForm.watermark.isAddWatermark">
              <CustomRange
                v-model.number="activeForm.watermark.watermarkDegree"
                :title="t('pages.imageProcess.watermark.degree')"
                :min="-360"
                :max="360"
                :step="1"
                :show-value="`${activeForm.watermark.watermarkDegree}°`"
              />

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
            </SettingCard>

            <SettingCard v-if="activeForm.watermark.isAddWatermark">
              <CustomRange
                v-model.number="activeForm.watermark.watermarkScaleRatio"
                :title="t('pages.imageProcess.watermark.scaleRatio')"
                :min="0"
                :max="1"
                :step="0.01"
                :show-value="`${Math.round((activeForm.watermark.watermarkScaleRatio || 0) * 100)}%`"
              />

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
            </SettingCard>

            <SettingCard
              v-if="activeForm.watermark.watermarkType === 'text' && activeForm.watermark.isAddWatermark"
              class="flex flex-col justify-center"
            >
              <label class="text-base font-semibold text-main">{{ t('pages.imageProcess.watermark.inputText') }}</label>
              <input
                v-model="activeForm.watermark.watermarkText"
                type="text"
                class="form-input"
                :placeholder="t('pages.imageProcess.watermark.inputTextPlaceholder')"
              />

              <!-- Per-picbed settings for watermarkText -->
              <PerPicbedSetting
                v-if="!configId"
                :map-field="waterMarkForm.watermarkTextMap"
                :default-value="defaultWaterMarkSetting.watermarkText"
                field-name="watermarkText"
                :global-value="waterMarkForm.watermarkText"
                input-type="text"
                :text-placeholder="t('pages.imageProcess.watermark.inputTextPlaceholder')"
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
            </SettingCard>

            <SettingCard
              v-if="activeForm.watermark.watermarkType === 'text' && activeForm.watermark.isAddWatermark"
              class="flex flex-col justify-center"
            >
              <label class="text-base font-semibold text-main">{{
                t('pages.imageProcess.watermark.textFontPath')
              }}</label>
              <input
                v-model="activeForm.watermark.watermarkFontPath"
                type="text"
                class="form-input"
                :placeholder="t('pages.imageProcess.watermark.textFontPathPlaceholder')"
              />

              <PerPicbedSetting
                v-if="!configId"
                :map-field="waterMarkForm.watermarkFontPathMap"
                :default-value="defaultWaterMarkSetting.watermarkFontPath"
                field-name="watermarkFontPath"
                :global-value="waterMarkForm.watermarkFontPath"
                input-type="text"
                :text-placeholder="t('pages.imageProcess.watermark.textFontPathPlaceholder')"
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
            </SettingCard>

            <SettingCard
              v-if="activeForm.watermark.watermarkType === 'text' && activeForm.watermark.isAddWatermark"
              class="flex flex-col justify-center"
            >
              <label class="text-base font-semibold text-main">{{ t('pages.imageProcess.watermark.color') }}</label>
              <div class="flex flex-wrap items-center gap-2">
                <input
                  v-model="activeForm.watermark.watermarkColor"
                  type="color"
                  class="h-[48px] w-[48px] cursor-pointer overflow-hidden rounded-lg border border-border bg-bg p-0.5 transition-all duration-200 ease-apple hover:border-accent hover:shadow-sm focus:border-accent focus:shadow-sm focus:outline-none"
                />
                <input
                  v-model="activeForm.watermark.watermarkColor"
                  type="text"
                  class="form-input flex-1"
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
            </SettingCard>

            <!-- Image Watermark Settings -->
            <SettingCard
              v-if="activeForm.watermark.watermarkType === 'image' && activeForm.watermark.isAddWatermark"
              class="flex flex-col justify-center"
            >
              <label class="text-base font-semibold text-main">{{ t('pages.imageProcess.watermark.imagePath') }}</label>
              <input
                v-model="activeForm.watermark.watermarkImagePath"
                type="text"
                class="form-input"
                :placeholder="t('pages.imageProcess.watermark.imagePathPlaceholder')"
              />

              <PerPicbedSetting
                v-if="!configId"
                :map-field="waterMarkForm.watermarkImagePathMap"
                :default-value="defaultWaterMarkSetting.watermarkImagePath"
                field-name="watermarkImagePath"
                :global-value="waterMarkForm.watermarkImagePath"
                input-type="text"
                :text-placeholder="t('pages.imageProcess.watermark.imagePathPlaceholder')"
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
            </SettingCard>

            <SettingCard
              v-if="activeForm.watermark.watermarkType === 'image' && activeForm.watermark.isAddWatermark"
              class="flex flex-col justify-center"
            >
              <CustomRange
                v-model.number="activeForm.watermark.watermarkImageOpacity"
                :title="t('pages.imageProcess.watermark.imageOpacity')"
                :min="0"
                :max="255"
                :step="1"
                :show-value="`${activeForm.watermark.watermarkImageOpacity || 0}`"
              />

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
            </SettingCard>

            <SettingCard v-if="activeForm.watermark.isAddWatermark">
              <label class="text-base font-semibold text-main">{{ t('pages.imageProcess.watermark.position') }}</label>
              <div class="grid max-w-[320px] grid-cols-3 gap-2.5">
                <button
                  v-for="[key, label] in waterMarkPositionMap"
                  :key="key"
                  type="button"
                  class="rounded-lg border border-border-secondary bg-bg p-3 text-center text-sm font-semibold text-secondary transition-all duration-200 ease-apple hover:border-accent hover:bg-accent/8 hover:text-main [.active]:border-accent/10 [.active]:bg-accent/20 [.active]:text-main"
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
            </SettingCard>
          </SettingSection>
        </div>

        <!-- Transform Tab -->
        <div v-else-if="activeTab === 'transform'" key="transform" class="flex flex-col gap-4">
          <SettingSection
            :icon="FlipHorizontal"
            :title="t('pages.imageProcess.transform.title')"
            :description="t('pages.imageProcess.transform.description')"
          >
            <SettingCard>
              <CustomSwitch
                v-model="activeForm.compress.isFlip"
                :title="t('pages.imageProcess.transform.isFlip')"
                class="custom-switch"
                no-border
                small
              />

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
            </SettingCard>

            <SettingCard>
              <CustomSwitch
                v-model="activeForm.compress.isFlop"
                :title="t('pages.imageProcess.transform.isFlop')"
                class="custom-switch"
                small
                no-border
              />

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
            </SettingCard>
          </SettingSection>

          <SettingSection
            :icon="RotateCw"
            :title="t('pages.imageProcess.transform.rotationTitle')"
            :description="t('pages.imageProcess.transform.rotationDescription')"
          >
            <SettingCard class="flex flex-col justify-center">
              <CustomSwitch
                v-model="activeForm.compress.isRotate"
                :title="t('pages.imageProcess.transform.isRotate')"
                class="custom-switch"
                no-border
                small
              />

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
            </SettingCard>

            <SettingCard v-if="activeForm.compress.isRotate" class="flex flex-col justify-center">
              <CustomRange
                v-model.number="activeForm.compress.rotateDegree"
                :title="t('pages.imageProcess.transform.rotationDegree')"
                :min="-360"
                :max="360"
                :step="1"
                :show-value="`${activeForm.compress.rotateDegree}°`"
              />

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
            </SettingCard>
          </SettingSection>

          <SettingSection
            :icon="Maximize2"
            :title="t('pages.imageProcess.transform.resizeTitle')"
            :description="t('pages.imageProcess.transform.resizeDescription')"
          >
            <SettingCard class="flex flex-col justify-center">
              <CustomSwitch
                v-model="activeForm.compress.isReSize"
                :title="t('pages.imageProcess.transform.isResize')"
                class="custom-switch"
                no-border
                small
              />

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
            </SettingCard>

            <SettingCard v-if="activeForm.compress.isReSize">
              <label class="text-base font-semibold text-main">{{
                t('pages.imageProcess.transform.resizeWidth')
              }}</label>
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
                    safeSetMapValue(compressForm, 'reSizeWidth', picbedType, value, defaultCompressSetting.reSizeWidth)
                "
              />
            </SettingCard>

            <SettingCard v-if="activeForm.compress.isReSize" class="flex flex-col justify-center">
              <label class="text-base font-semibold text-main">{{
                t('pages.imageProcess.transform.resizeHeight')
              }}</label>
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
            </SettingCard>

            <SettingCard
              v-if="
                ((activeForm.compress.reSizeHeight || 0) > 0 && (activeForm.compress.reSizeWidth || 0) === 0) ||
                ((activeForm.compress.reSizeWidth || 0) > 0 && (activeForm.compress.reSizeHeight || 0) === 0)
              "
              class="flex flex-col justify-center"
            >
              <CustomSwitch
                v-model="activeForm.compress.skipReSizeOfSmallImg"
                :title="t('pages.imageProcess.transform.skipResizeOfSmallImgHeight')"
                class="custom-switch"
                no-border
                small
              />

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
            </SettingCard>
          </SettingSection>

          <SettingSection :icon="Percent" :title="t('pages.imageProcess.transform.percentageResize')">
            <SettingCard class="flex flex-col justify-center">
              <CustomSwitch
                v-model="activeForm.compress.isReSizeByPercent"
                :title="t('pages.imageProcess.transform.isResizeByPercent')"
                :description="t('pages.imageProcess.transform.isResizeByPercentHint')"
                no-border
                small
              />

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
            </SettingCard>

            <SettingCard v-if="activeForm.compress.isReSizeByPercent" class="flex flex-col justify-center">
              <CustomRange
                v-model.number="activeForm.compress.reSizePercent"
                :title="t('pages.imageProcess.transform.resizePercent')"
                :min="1"
                :max="500"
                :step="1"
                :show-value="`${activeForm.compress.reSizePercent}%`"
              />

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
            </SettingCard>
          </SettingSection>
        </div>

        <!-- Skip Process Tab -->
        <div v-else-if="activeTab === 'skipProcess'" key="skipProcess" class="flex flex-col gap-4">
          <SettingSection only-one-row :icon="FileText" :title="t('pages.imageProcess.general.skipProcessExtList')">
            <SettingCard class="flex flex-col justify-center">
              <textarea
                v-model="activeForm.skipProcess.skipProcessExtList"
                class="form-textarea"
                rows="3"
                :placeholder="'zip,rar,7z,tar,gz'"
              />
              <small class="mt-2 block rounded-sm bg-bg-secondary px-3 py-2 text-xs leading-[1.5] text-tertiary">{{
                t('pages.imageProcess.general.skipProcessExtListPlaceholder')
              }}</small>
            </SettingCard>
          </SettingSection>
        </div>

        <!-- Rename Tab -->
        <div v-else-if="activeTab === 'rename'" key="rename" class="flex flex-col gap-4">
          <SettingSection
            :icon="Edit2Icon"
            :title="t('pages.imageProcess.rename.title')"
            :description="t('pages.imageProcess.rename.description')"
            only-one-row
          >
            <SettingSection>
              <SettingCard p1>
                <CustomSwitch
                  v-model="autoRenameComputed"
                  :title="t('pages.imageProcess.rename.renameTimestamp')"
                  description="YYYYMMDDHHmmssSSS"
                  no-border
                  small
                />
              </SettingCard>

              <SettingCard p1 class="flex flex-col justify-center">
                <CustomSwitch
                  v-model="manualRenameComputed"
                  :title="t('pages.imageProcess.rename.manualRename')"
                  no-border
                  small
                />
              </SettingCard>

              <SettingCard p1 class="flex flex-col justify-center">
                <CustomSwitch
                  v-model="renameSettingsComputed.rename.enable"
                  :title="t('pages.settings.upload.enableAdvancedRname')"
                  :description="t('pages.settings.upload.enableAdvancedRnameDesc')"
                  no-border
                  small
                />
              </SettingCard>

              <SettingCard>
                <label class="mb-4 flex items-center gap-2 text-base font-semibold text-main">
                  <Edit :size="14" class="text-accent" />
                  {{ t('pages.settings.upload.advancedRnameFormat') }}
                </label>
                <input
                  v-model="renameSettingsComputed.rename.format"
                  type="text"
                  class="form-input"
                  placeholder="Ex. {Y}-{m}-{uuid}"
                />
              </SettingCard>
            </SettingSection>
            <SettingCard>
              <label class="text-base font-semibold text-main">{{
                t('pages.settings.upload.availablePlaceholders')
              }}</label>
              <PlaceholderTable :list="advancedRenameList" :title-list="advancedRenameTitleList" />
            </SettingCard>
          </SettingSection>
        </div>
      </transition>
    </div>
  </div>
</template>

<script lang="ts" setup>
import { useStorage } from '@vueuse/core'
import {
  Droplets,
  Edit,
  Edit2Icon,
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

import CustomRadioOption from '@/components/common/CustomRadioOption.vue'
import CustomRange from '@/components/common/CustomRange.vue'
import CustomSwitch from '@/components/common/CustomSwitch.vue'
import PlaceholderTable from '@/components/common/PlaceholderTable.vue'
import PerPicbedSetting from '@/components/PerPicbedSetting.vue'
import { getRawData } from '@/utils/common'
import { configPaths } from '@/utils/configPaths'
import { getConfig, saveConfig } from '@/utils/dataSender'

import SettingCard from './common/SettingCard.vue'
import SettingSection from './common/SettingSection.vue'

const { t } = useI18n()
const activeTab = useStorage<string>('image-process-setting-active-tab', 'general')

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
      top: `${activeTabEl.offsetTop}px`,
      height: `${activeTabEl.offsetHeight}px`,
      width: `${activeTabEl.offsetWidth - 12}px`,
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

const advancedRenameList = computed(() => ({
  categoryTime: [
    { label: t('pages.settings.upload.placeholder.year4'), value: '{Y}' },
    { label: t('pages.settings.upload.placeholder.year2'), value: '{y}' },
    { label: t('pages.settings.upload.placeholder.month'), value: '{m}' },
    { label: t('pages.settings.upload.placeholder.date'), value: '{d}' },
    { label: t('pages.settings.upload.placeholder.hour'), value: '{h}' },
    { label: t('pages.settings.upload.placeholder.minute'), value: '{i}' },
    { label: t('pages.settings.upload.placeholder.second'), value: '{s}' },
    { label: t('pages.settings.upload.placeholder.millisecond'), value: '{ms}' },
    { label: t('pages.settings.upload.placeholder.timestamp'), value: '{timestamp}' },
  ],
  categoryHash: [
    { label: t('pages.settings.upload.placeholder.md5'), value: '{md5}' },
    { label: t('pages.settings.upload.placeholder.md5-16'), value: '{md5-16}' },
    { label: t('pages.settings.upload.placeholder.uuid'), value: '{uuid}' },
    { label: t('pages.settings.upload.placeholder.sha256'), value: '{sha256}' },
    { label: t('pages.settings.upload.placeholder.sha256-n'), value: '{sha256-n}' },
  ],
  categoryFile: [
    { label: t('pages.settings.upload.placeholder.filename'), value: '{filename}' },
    { label: t('pages.settings.upload.placeholder.localFolder'), value: '{localFolder:n}' },
    { label: t('pages.settings.upload.placeholder.randomString'), value: '{str-n}' },
  ],
}))

const advancedRenameTitleList = computed(() => ({
  categoryTime: t('pages.settings.upload.placeholder.categoryTime'),
  categoryHash: t('pages.settings.upload.placeholder.categoryHash'),
  categoryFile: t('pages.settings.upload.placeholder.categoryFile'),
}))

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
  'dz',
  'png',
  'avif',
  'jpg',
  'webp',
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
const globalRenameSettings = ref<{
  enable?: boolean
  format?: string
}>({
  enable: false,
  format: '{filename}',
})
const globalAutoRename = ref<Undefinable<boolean>>(false)
const globalManualRename = ref<Undefinable<boolean>>(false)

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
  const allConfig = await getConfig<any>()
  compressInFile = allConfig.buildIn?.compress || {}
  const watermark = allConfig.buildIn?.watermark || {}
  const skipProcess = allConfig.buildIn?.skipProcess || {}
  globalRenameSettings.value = allConfig.buildIn?.rename || {
    enable: false,
    format: '{filename}',
  }
  globalAutoRename.value = allConfig.settings?.autoRename ?? false
  globalManualRename.value = allConfig.settings?.rename ?? false
  if (compressInFile) {
    let cleanedObj: Record<string, any>
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
    let buildInList = allConfig.buildIn?.list
    const globalRenameSettings = allConfig.buildIn?.rename || {
      enable: false,
      format: '{filename}',
    }
    if (!buildInList) {
      saveConfig(configPaths.buildIn.list, [])
      buildInList = []
    }
    singleConfigInFile = buildInList?.find((item: { id: string }) => item.id === configId) || ({} as IBuildInListItem)
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
    let cleanedFormatConvertObj: Record<string, any>
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
      autoRename: singleConfigInFile.autoRename ?? (globalAutoRename.value || false),
      manualRename: singleConfigInFile.manualRename ?? (globalManualRename.value || false),
    }
  }
}

function safeSetMapValue(form: any, fieldName: string, picbedType: string, value: any, defaultValue: any) {
  const mapFieldName = `${fieldName}Map`
  if (fieldName === 'formatConvertObj') {
    value = value || '{}'
    try {
      const parsedObj = JSON.parse(value)
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
  const globalValue = form[fieldName]
  const isSameValue =
    fieldName === 'formatConvertObj'
      ? JSON.stringify(JSON.parse(value)) === JSON.stringify(globalValue || {})
      : value === globalValue
  const isValueDefault =
    fieldName === 'formatConvertObj'
      ? JSON.stringify(JSON.parse(value)) === JSON.stringify(defaultValue)
      : value === defaultValue
  const isFormValueDefault =
    fieldName === 'formatConvertObj'
      ? JSON.stringify(form[fieldName]) === JSON.stringify(defaultValue)
      : form[fieldName] === defaultValue
  console.log({ isValueDefault, isFormValueDefault, isSameValue })
  if ((isValueDefault && isFormValueDefault) || isSameValue) {
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

const autoRenameComputed = computed({
  get() {
    return configId ? singleConfigSettings.value.autoRename : globalAutoRename.value
  },
  set(newValue) {
    if (configId) {
      singleConfigSettings.value.autoRename = newValue
      const shouldUpdate = newValue !== (globalAutoRename.value ?? false)
      singleConfigInFile.id = configId || ''
      if (shouldUpdate) {
        singleConfigInFile.autoRename = newValue
        UpdateBuildInList(singleConfigInFile)
      } else {
        if (singleConfigInFile.autoRename !== undefined) delete singleConfigInFile.autoRename
        checkIfItemOnlyId(singleConfigInFile).then(async isOnlyId => {
          if (isOnlyId) {
            await removeItemFromBuildInList(singleConfigInFile.id)
          }
        })
      }
    } else {
      globalAutoRename.value = newValue
      saveConfig(configPaths.settings.autoRename, newValue)
    }
  },
})

const manualRenameComputed = computed({
  get() {
    return configId ? singleConfigSettings.value.manualRename : globalManualRename.value
  },
  set(newValue) {
    if (configId) {
      singleConfigSettings.value.manualRename = newValue
      const shouldUpdate = newValue !== (globalManualRename.value ?? false)
      singleConfigInFile.id = configId || ''
      if (shouldUpdate) {
        singleConfigInFile.manualRename = newValue
        UpdateBuildInList(singleConfigInFile)
      } else {
        if (singleConfigInFile.manualRename !== undefined) delete singleConfigInFile.manualRename
        checkIfItemOnlyId(singleConfigInFile).then(async isOnlyId => {
          if (isOnlyId) {
            await removeItemFromBuildInList(singleConfigInFile.id)
          }
        })
      }
    } else {
      globalManualRename.value = newValue
      saveConfig(configPaths.settings.rename, newValue)
    }
  },
})

const renameSettingsComputed = computed<any>(() => {
  if (configId) {
    return {
      rename: singleConfigSettings.value.rename,
    }
  } else {
    return {
      rename: globalRenameSettings.value,
    }
  }
})

watch(
  renameSettingsComputed,
  newValue => {
    if (configId) {
      singleConfigSettings.value.rename = newValue.rename
      const shouldUpdate =
        newValue.rename.enable !== (globalRenameSettings.value.enable ?? false) ||
        newValue.rename.format !== (globalRenameSettings.value.format ?? '{filename}')
      singleConfigInFile.id = configId || ''
      if (shouldUpdate) {
        singleConfigInFile.rename = newValue.rename
        UpdateBuildInList(singleConfigInFile)
      } else {
        if (singleConfigInFile.rename) delete singleConfigInFile.rename
        checkIfItemOnlyId(singleConfigInFile).then(async isOnlyId => {
          if (isOnlyId) {
            await removeItemFromBuildInList(singleConfigInFile.id)
          }
        })
      }
    } else {
      saveConfig(configPaths.buildIn.rename, toRaw(newValue.rename))
    }
  },
  { deep: true },
)

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
  watch(
    () => singleConfigSettings.value.compress![key],
    async newValue => {
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
  try {
    const parsedObj = JSON.parse(singleFormatConvertObj.value)
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
  try {
    const parsedObj = JSON.parse(formatConvertObjStr.value)
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
