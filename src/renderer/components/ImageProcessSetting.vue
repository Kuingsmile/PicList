<template>
  <div class="processing-studio flex h-full min-h-0 flex-col overflow-hidden text-main">
    <nav v-if="isInitialized" class="processing-steps" :aria-label="t('pages.imageProcess.guide.stepsLabel')">
      <button
        v-for="step in steps"
        :key="step.id"
        type="button"
        :data-testid="'processing-step-' + step.id"
        :aria-current="currentStep === step.id ? 'step' : undefined"
        :disabled="step.id > 1 && !canEdit"
        :class="{ completed: currentStep > step.id }"
        @click="currentStep = step.id"
      >
        <span class="processing-step-number"
          ><Check v-if="currentStep > step.id" :size="15" /><template v-else>{{ step.id }}</template></span
        >
        <span>{{ step.label }}</span>
      </button>
    </nav>

    <div
      ref="settingsContent"
      data-testid="image-process-content"
      class="processing-workspace min-h-0 flex-1 overflow-x-hidden overflow-y-auto overscroll-contain"
    >
      <template v-if="isInitialized">
        <section v-if="currentStep === 1" class="processing-setup">
          <header class="processing-page-heading">
            <span class="processing-eyebrow">{{ t('pages.imageProcess.guide.stepOf', { step: 1 }) }}</span>
            <h2 tabindex="-1" data-step-heading>{{ t('pages.imageProcess.design.applyTo') }}</h2>
            <p>{{ t('pages.imageProcess.guide.scopeIntro') }}</p>
          </header>
          <div class="processing-scope-choices" role="group" :aria-label="t('pages.imageProcess.design.applyTo')">
            <button
              v-for="level in scopes"
              :key="level"
              type="button"
              :data-testid="'processing-scope-' + level"
              :aria-pressed="scope === level"
              class="processing-scope-choice"
              @click="scope = level"
            >
              <span class="scope-choice-icon"><component :is="scopeIcons[level]" :size="22" /></span>
              <span class="scope-choice-check"><Check v-if="scope === level" :size="12" /></span>
              <strong>{{ t('pages.imageProcess.guide.scopeLabels.' + level) }}</strong>
              <span class="scope-description">{{ t('pages.imageProcess.guide.scopeDescriptions.' + level) }}</span>
            </button>
          </div>
          <div v-if="scope !== 'global'" class="processing-target-card">
            <div class="processing-destination">
              <label class="processing-provider-label">
                <span>{{ t('pages.imageProcess.design.service') }}</span>
                <select v-model="targetProvider" data-testid="processing-provider" class="scope-select">
                  <option v-for="provider in providers" :key="provider.type" :value="provider.type">
                    {{ provider.name }}
                  </option>
                </select>
              </label>
              <ChevronRight
                v-if="scope === 'config'"
                :size="16"
                class="destination-arrow text-secondary"
                aria-hidden="true"
              />
              <label v-if="scope === 'config'" class="processing-config-label">
                <span>{{ t('pages.imageProcess.design.uploader') }}</span>
                <select
                  v-model="selectedConfigId"
                  data-testid="processing-configuration"
                  class="scope-select"
                  :disabled="!configurationOptions.length"
                >
                  <option v-if="!configurationOptions.length" value="">
                    {{ t('pages.imageProcess.editor.noSavedConfig') }}
                  </option>
                  <option v-for="config in configurationOptions" :key="config.id" :value="config.id">
                    {{ config.name || t('pages.imageProcess.preview.unnamedConfig') }}
                  </option>
                </select>
              </label>
            </div>
            <p v-if="!canEdit" class="processing-empty" role="status">
              {{ t('pages.imageProcess.editor.noSavedConfig') }}
            </p>
          </div>
          <p class="processing-scope-note">
            <Info :size="15" />{{ t('pages.imageProcess.guide.scopeNotes.' + scope) }}
          </p>
          <div class="processing-help">
            <p>{{ t('pages.imageProcess.design.howItWorks') }}</p>
            <p>{{ t('pages.imageProcess.design.inheritanceHelp') }}</p>
          </div>
        </section>

        <section v-else-if="currentStep === 3" class="processing-review">
          <header class="processing-page-heading">
            <span class="processing-eyebrow">{{ t('pages.imageProcess.guide.stepOf', { step: 3 }) }}</span>
            <h2 tabindex="-1" data-step-heading>{{ t('pages.imageProcess.guide.reviewTitle') }}</h2>
            <p>{{ t('pages.imageProcess.guide.reviewIntro') }}</p>
          </header>
          <div class="processing-review-target">
            <label>
              <span>{{ t('pages.imageProcess.design.service') }}</span>
              <select v-model="targetProvider" class="scope-select" data-testid="processing-review-provider">
                <option v-for="provider in providers" :key="provider.type" :value="provider.type">
                  {{ provider.name }}
                </option>
              </select>
            </label>
            <label>
              <span>{{ t('pages.imageProcess.design.uploader') }}</span>
              <select
                v-model="selectedConfigId"
                class="scope-select"
                data-testid="processing-review-configuration"
                :disabled="!configurationOptions.length"
              >
                <option v-if="!configurationOptions.length" value="">
                  {{ t('pages.imageProcess.editor.noSavedConfig') }}
                </option>
                <option v-for="config in configurationOptions" :key="config.id" :value="config.id">
                  {{ config.name || t('pages.imageProcess.preview.unnamedConfig') }}
                </option>
              </select>
            </label>
          </div>
          <ImageProcessPreview
            :settings="effectiveSettings"
            :layers="settingsByScope"
            :uploader="previewUploader"
            @edit="editFromPreview"
          />
        </section>

        <section v-else class="processing-editor">
          <aside class="processing-sidebar">
            <span class="processing-eyebrow">{{ t('pages.imageProcess.guide.stepOf', { step: 2 }) }}</span>
            <h2>{{ t('pages.imageProcess.guide.adjustTitle') }}</h2>
            <nav class="processing-categories" :aria-label="t('pages.imageProcess.design.categories')">
              <button
                v-for="tab in visibleTabs"
                :key="tab.id"
                type="button"
                :aria-pressed="activeTab === tab.id"
                :data-testid="'processing-category-' + tab.id"
                @click="activeTab = tab.id"
              >
                <component :is="tab.icon" :size="17" /><span>{{ tab.label }}</span
                ><ChevronRight :size="14" class="category-arrow" />
              </button>
            </nav>
            <div class="processing-scope-summary">
              <span>{{ t('pages.imageProcess.guide.appliesTo') }}</span>
              <strong>{{ editingTarget }}</strong>
              <button type="button" @click="currentStep = 1">
                {{ t('pages.imageProcess.guide.changeScope') }}<ChevronRight :size="13" />
              </button>
            </div>
          </aside>
          <div class="processing-fields">
            <header class="processing-page-heading">
              <h2 tabindex="-1" data-step-heading>{{ currentCategory?.label }}</h2>
              <p>{{ t('pages.imageProcess.guide.categoryHints.' + activeTab) }}</p>
            </header>
            <div class="processing-field-options">
              <span v-if="scope !== 'global'">{{ t('pages.imageProcess.guide.customizeHint') }}</span>
              <label
                ><input v-model="showSources" type="checkbox" />{{ t('pages.imageProcess.guide.showSources') }}</label
              >
            </div>
            <div v-if="!canEdit" key="no-config" class="p-4 text-sm text-secondary">
              {{ t('pages.imageProcess.editor.noConfig') }}
            </div>
            <div
              v-else-if="scope === 'provider' && ['skipProcess', 'rename'].includes(activeTab)"
              key="unsupported"
              class="flex flex-col items-start gap-3 p-4 text-sm text-secondary"
            >
              <p>{{ t('pages.imageProcess.editor.globalOrConfigOnly') }}</p>
              <button
                type="button"
                class="rounded-md border border-border px-3 py-2 text-accent"
                @click="scope = 'global'"
              >
                {{ t('pages.imageProcess.editor.editGlobal') }}
              </button>
            </div>
            <div v-else-if="activeTab === 'general'" key="general" class="flex flex-col gap-4">
              <SettingSection only-one-row>
                <ImageProcessSettingField
                  :option="editingSettings.compress.quality"
                  v-bind="fieldContext"
                  field="compress.quality"
                  class="flex flex-col justify-center"
                  @edit-source="editScope"
                  @inherit="inheritSetting('compress', 'quality')"
                >
                  <div class="processing-quality-heading">
                    <label :for="controlId('processing-quality')">{{ t('pages.imageProcess.guide.quality') }}</label>
                    <output :for="controlId('processing-quality')">{{ form.compress.quality }}<span>%</span></output>
                  </div>
                  <div
                    class="processing-quality-presets"
                    role="group"
                    :aria-label="t('pages.imageProcess.guide.qualityPresets')"
                  >
                    <button
                      v-for="quality in qualityPresets"
                      :key="quality"
                      type="button"
                      :aria-pressed="form.compress.quality === quality"
                      @click="form.compress.quality = quality"
                    >
                      <strong>{{ quality }}%</strong><span>{{ t('pages.imageProcess.guide.presets.' + quality) }}</span>
                    </button>
                  </div>
                  <input
                    :id="controlId('processing-quality')"
                    v-model.number="form.compress.quality"
                    class="processing-quality-slider"
                    type="range"
                    min="1"
                    max="100"
                    step="1"
                  />
                  <div class="processing-range-labels">
                    <span>{{ t('pages.imageProcess.guide.smallerFile') }}</span
                    ><span>{{ t('pages.imageProcess.guide.higherQuality') }}</span>
                  </div>
                </ImageProcessSettingField>
              </SettingSection>
              <SettingSection :only-one-row="!form.compress.isConvert">
                <ImageProcessSettingField
                  :option="editingSettings.compress.isConvert"
                  v-bind="fieldContext"
                  field="compress.isConvert"
                  class="flex flex-col justify-center"
                  @edit-source="editScope"
                  @inherit="inheritSetting('compress', 'isConvert')"
                >
                  <CustomSwitch
                    v-model="form.compress.isConvert"
                    :title="t('pages.imageProcess.guide.convert')"
                    no-border
                    small
                    :description="t('pages.imageProcess.guide.convertHint')"
                  /> </ImageProcessSettingField
                ><ImageProcessSettingField
                  v-if="form.compress.isConvert"
                  :option="editingSettings.compress.convertFormat"
                  v-bind="fieldContext"
                  field="compress.convertFormat"
                  @edit-source="editScope"
                  @inherit="inheritSetting('compress', 'convertFormat')"
                >
                  <label :for="controlId('processing-compress-isConvert')" class="text-sm font-semibold text-main">{{
                    t('pages.imageProcess.general.destinationFormat')
                  }}</label>
                  <select
                    :id="controlId('processing-compress-isConvert')"
                    v-model="form.compress.convertFormat"
                    class="form-input"
                  >
                    <option v-for="format in availableFormat" :key="format" :value="format">
                      {{ format.toUpperCase() }}
                    </option>
                  </select>
                </ImageProcessSettingField>
              </SettingSection>
              <details class="processing-advanced" data-testid="advanced-format-rules">
                <summary>
                  <span
                    >{{ t('pages.imageProcess.guide.moreOptions')
                    }}<small>{{ t('pages.imageProcess.guide.formatAdvanced') }}</small></span
                  ><ChevronRight :size="16" />
                </summary>
                <div class="processing-advanced-content">
                  <ImageProcessSettingField
                    :option="editingSettings.compress.isRemoveExif"
                    v-bind="fieldContext"
                    field="compress.isRemoveExif"
                    p1
                    class="flex flex-col justify-center"
                    @edit-source="editScope"
                    @inherit="inheritSetting('compress', 'isRemoveExif')"
                  >
                    <CustomSwitch
                      v-model="form.compress.isRemoveExif"
                      :title="t('pages.imageProcess.general.isRemoveExif')"
                      small
                      no-border
                    /> </ImageProcessSettingField
                  ><ImageProcessSettingField
                    v-if="form.compress.isConvert"
                    :option="editingSettings.compress.formatConvertObj"
                    v-bind="fieldContext"
                    field="compress.formatConvertObj"
                    @edit-source="editScope"
                    @inherit="inheritSetting('compress', 'formatConvertObj')"
                  >
                    <label
                      :for="controlId('processing-compress-isRemoveExif')"
                      class="text-sm font-semibold text-main"
                      >{{ t('pages.imageProcess.guide.formatRules') }}</label
                    >
                    <textarea
                      :id="controlId('processing-compress-isRemoveExif')"
                      v-model="convertStr"
                      :aria-label="t('pages.imageProcess.guide.formatRules')"
                      :aria-invalid="conversionError"
                      class="form-textarea"
                      rows="3"
                      placeholder='{"jpg": "png", "png": "jpg"}'
                    />
                    <p v-if="conversionError" role="alert" class="mt-2 text-xs text-danger">
                      {{ t('pages.imageProcess.editor.invalidFormatRules') }}
                    </p>
                  </ImageProcessSettingField>
                </div>
              </details>
            </div>

            <!-- Watermark Tab -->
            <div v-else-if="activeTab === 'watermark'" key="watermark" class="flex flex-col gap-4">
              <SettingSection only-one-row>
                <ImageProcessSettingField
                  :option="editingSettings.watermark.isAddWatermark"
                  v-bind="fieldContext"
                  field="watermark.isAddWatermark"
                  class="flex flex-col justify-center"
                  @edit-source="editScope"
                  @inherit="inheritSetting('watermark', 'isAddWatermark')"
                >
                  <CustomSwitch
                    v-model="form.watermark.isAddWatermark"
                    :title="t('pages.imageProcess.guide.watermarkToggle')"
                    small
                    no-border
                  />
                </ImageProcessSettingField>
                <ImageProcessSettingField
                  v-if="form.watermark.isAddWatermark"
                  :option="editingSettings.watermark.watermarkType"
                  v-bind="fieldContext"
                  field="watermark.watermarkType"
                  @edit-source="editScope"
                  @inherit="inheritSetting('watermark', 'watermarkType')"
                >
                  <label class="text-sm font-semibold text-main">{{ t('pages.imageProcess.watermark.type') }}</label>
                  <div class="flex flex-wrap gap-4">
                    <CustomRadioOption
                      v-model="form.watermark.watermarkType"
                      name="watermark-type"
                      value="text"
                      :title="t('pages.imageProcess.watermark.text')"
                    />
                    <CustomRadioOption
                      v-model="form.watermark.watermarkType"
                      name="watermark-type"
                      value="image"
                      :title="t('pages.imageProcess.watermark.image')"
                    />
                  </div>
                </ImageProcessSettingField>
                <ImageProcessSettingField
                  v-if="form.watermark.watermarkType === 'text' && form.watermark.isAddWatermark"
                  :option="editingSettings.watermark.watermarkText"
                  v-bind="fieldContext"
                  field="watermark.watermarkText"
                  class="flex flex-col justify-center"
                  @edit-source="editScope"
                  @inherit="inheritSetting('watermark', 'watermarkText')"
                >
                  <label
                    :for="controlId('processing-watermark-watermarkText')"
                    class="text-sm font-semibold text-main"
                    >{{ t('pages.imageProcess.watermark.inputText') }}</label
                  >
                  <input
                    :id="controlId('processing-watermark-watermarkText')"
                    v-model="form.watermark.watermarkText"
                    type="text"
                    class="form-input"
                    :placeholder="t('pages.imageProcess.watermark.inputTextPlaceholder')"
                  />
                </ImageProcessSettingField>
                <ImageProcessSettingField
                  v-if="form.watermark.watermarkType === 'image' && form.watermark.isAddWatermark"
                  :option="editingSettings.watermark.watermarkImagePath"
                  v-bind="fieldContext"
                  field="watermark.watermarkImagePath"
                  class="flex flex-col justify-center"
                  @edit-source="editScope"
                  @inherit="inheritSetting('watermark', 'watermarkImagePath')"
                >
                  <label
                    :for="controlId('processing-watermark-watermarkImagePath')"
                    class="text-sm font-semibold text-main"
                    >{{ t('pages.imageProcess.watermark.imagePath') }}</label
                  >
                  <input
                    :id="controlId('processing-watermark-watermarkImagePath')"
                    v-model="form.watermark.watermarkImagePath"
                    type="text"
                    class="form-input"
                    :placeholder="t('pages.imageProcess.watermark.imagePathPlaceholder')"
                  />
                </ImageProcessSettingField>
                <ImageProcessSettingField
                  v-if="form.watermark.isAddWatermark"
                  :option="editingSettings.watermark.watermarkPosition"
                  v-bind="fieldContext"
                  field="watermark.watermarkPosition"
                  @edit-source="editScope"
                  @inherit="inheritSetting('watermark', 'watermarkPosition')"
                >
                  <label class="text-sm font-semibold text-main">{{
                    t('pages.imageProcess.watermark.position')
                  }}</label>
                  <div class="grid max-w-[320px] grid-cols-3 gap-2.5">
                    <button
                      v-for="[key, label] in waterMarkPositionMap"
                      :key
                      type="button"
                      class="rounded-lg border border-border-secondary bg-bg p-3 text-center text-sm font-semibold text-secondary transition-all duration-200 ease-apple hover:border-accent hover:bg-accent/8 hover:text-main [.active]:border-accent/10 [.active]:bg-accent/20 [.active]:text-main"
                      :class="{ active: form.watermark.watermarkPosition === key }"
                      :aria-pressed="form.watermark.watermarkPosition === key"
                      @click="form.watermark.watermarkPosition = key"
                    >
                      {{ label }}
                    </button>
                  </div>
                </ImageProcessSettingField>
              </SettingSection>
              <details v-if="form.watermark.isAddWatermark" class="processing-advanced">
                <summary>
                  <span>{{ t('pages.imageProcess.guide.watermarkAdvanced') }}</span
                  ><ChevronRight :size="16" />
                </summary>
                <div class="processing-advanced-content">
                  <ImageProcessSettingField
                    v-if="form.watermark.isAddWatermark"
                    :option="editingSettings.watermark.watermarkScaleRatio"
                    v-bind="fieldContext"
                    field="watermark.watermarkScaleRatio"
                    @edit-source="editScope"
                    @inherit="inheritSetting('watermark', 'watermarkScaleRatio')"
                  >
                    <CustomRange
                      v-model.number="form.watermark.watermarkScaleRatio"
                      :title="t('pages.imageProcess.watermark.scaleRatio')"
                      :min="0"
                      :max="1"
                      :step="0.01"
                      :show-value="`${Math.round((form.watermark.watermarkScaleRatio || 0) * 100)}%`"
                    />
                  </ImageProcessSettingField>
                  <ImageProcessSettingField
                    v-if="form.watermark.watermarkType === 'text' && form.watermark.isAddWatermark"
                    :option="editingSettings.watermark.watermarkColor"
                    v-bind="fieldContext"
                    field="watermark.watermarkColor"
                    class="flex flex-col justify-center"
                    @edit-source="editScope"
                    @inherit="inheritSetting('watermark', 'watermarkColor')"
                  >
                    <label
                      :for="controlId('processing-watermark-watermarkColor')"
                      class="text-sm font-semibold text-main"
                      >{{ t('pages.imageProcess.watermark.color') }}</label
                    >
                    <div class="flex flex-wrap items-center gap-2">
                      <input
                        :id="controlId('processing-watermark-watermarkColor')"
                        v-model="form.watermark.watermarkColor"
                        type="color"
                        class="h-[48px] w-[48px] cursor-pointer overflow-hidden rounded-lg border border-border bg-bg p-0.5 transition-all duration-200 ease-apple hover:border-accent hover:shadow-sm focus:border-accent focus:shadow-sm focus:outline-none"
                      />
                      <input
                        v-model="form.watermark.watermarkColor"
                        :aria-label="t('pages.imageProcess.watermark.color')"
                        type="text"
                        class="form-input flex-1"
                        placeholder="#CCCCCC73"
                      />
                    </div>
                  </ImageProcessSettingField>
                  <ImageProcessSettingField
                    v-if="form.watermark.isAddWatermark"
                    :option="editingSettings.watermark.isFullScreenWatermark"
                    v-bind="fieldContext"
                    field="watermark.isFullScreenWatermark"
                    p1
                    class="flex flex-col justify-center"
                    @edit-source="editScope"
                    @inherit="inheritSetting('watermark', 'isFullScreenWatermark')"
                  >
                    <CustomSwitch
                      v-model="form.watermark.isFullScreenWatermark"
                      :title="t('pages.imageProcess.watermark.isFullScreen')"
                      small
                      no-border
                    />
                  </ImageProcessSettingField>
                  <ImageProcessSettingField
                    v-if="form.watermark.isAddWatermark"
                    :option="editingSettings.watermark.watermarkDegree"
                    v-bind="fieldContext"
                    field="watermark.watermarkDegree"
                    @edit-source="editScope"
                    @inherit="inheritSetting('watermark', 'watermarkDegree')"
                  >
                    <CustomRange
                      v-model.number="form.watermark.watermarkDegree"
                      :title="t('pages.imageProcess.watermark.degree')"
                      :min="-360"
                      :max="360"
                      :step="1"
                      :show-value="`${form.watermark.watermarkDegree}°`"
                    />
                  </ImageProcessSettingField>
                  <ImageProcessSettingField
                    v-if="form.watermark.watermarkType === 'image' && form.watermark.isAddWatermark"
                    :option="editingSettings.watermark.watermarkImageOpacity"
                    v-bind="fieldContext"
                    field="watermark.watermarkImageOpacity"
                    class="flex flex-col justify-center"
                    @edit-source="editScope"
                    @inherit="inheritSetting('watermark', 'watermarkImageOpacity')"
                  >
                    <CustomRange
                      v-model.number="form.watermark.watermarkImageOpacity"
                      :title="t('pages.imageProcess.watermark.imageOpacity')"
                      :min="0"
                      :max="255"
                      :step="1"
                      :show-value="`${form.watermark.watermarkImageOpacity || 0}`"
                    />
                  </ImageProcessSettingField>
                  <ImageProcessSettingField
                    v-if="form.watermark.watermarkType === 'text' && form.watermark.isAddWatermark"
                    :option="editingSettings.watermark.watermarkFontPath"
                    v-bind="fieldContext"
                    field="watermark.watermarkFontPath"
                    :unsupported="scope === 'provider'"
                    class="flex flex-col justify-center"
                    @edit-source="editScope"
                    @inherit="inheritSetting('watermark', 'watermarkFontPath')"
                  >
                    <label
                      :for="controlId('processing-watermark-watermarkFontPath')"
                      class="text-sm font-semibold text-main"
                      >{{ t('pages.imageProcess.watermark.textFontPath') }}</label
                    >
                    <input
                      :id="controlId('processing-watermark-watermarkFontPath')"
                      v-model="form.watermark.watermarkFontPath"
                      type="text"
                      class="form-input"
                      :placeholder="t('pages.imageProcess.watermark.textFontPathPlaceholder')"
                    />
                  </ImageProcessSettingField>
                </div>
              </details>
            </div>

            <!-- Transform Tab -->
            <div v-else-if="activeTab === 'transform'" key="transform" class="flex flex-col gap-4">
              <SettingSection>
                <ImageProcessSettingField
                  :option="editingSettings.compress.isReSize"
                  v-bind="fieldContext"
                  field="compress.isReSize"
                  class="flex flex-col justify-center"
                  @edit-source="editScope"
                  @inherit="inheritSetting('compress', 'isReSize')"
                >
                  <CustomSwitch
                    v-model="form.compress.isReSize"
                    :title="t('pages.imageProcess.guide.resizeDimensions')"
                    class="custom-switch"
                    no-border
                    small
                  />
                </ImageProcessSettingField>

                <ImageProcessSettingField
                  v-if="form.compress.isReSize"
                  :option="editingSettings.compress.reSizeWidth"
                  v-bind="fieldContext"
                  field="compress.reSizeWidth"
                  @edit-source="editScope"
                  @inherit="inheritSetting('compress', 'reSizeWidth')"
                >
                  <label :for="controlId('processing-compress-reSizeWidth')" class="text-sm font-semibold text-main">{{
                    t('pages.imageProcess.transform.resizeWidth')
                  }}</label>
                  <input
                    :id="controlId('processing-compress-reSizeWidth')"
                    v-model.number="form.compress.reSizeWidth"
                    type="number"
                    min="0"
                    class="form-input"
                  />
                </ImageProcessSettingField>

                <ImageProcessSettingField
                  v-if="form.compress.isReSize"
                  :option="editingSettings.compress.reSizeHeight"
                  v-bind="fieldContext"
                  field="compress.reSizeHeight"
                  class="flex flex-col justify-center"
                  @edit-source="editScope"
                  @inherit="inheritSetting('compress', 'reSizeHeight')"
                >
                  <label :for="controlId('processing-compress-reSizeHeight')" class="text-sm font-semibold text-main">{{
                    t('pages.imageProcess.transform.resizeHeight')
                  }}</label>
                  <input
                    :id="controlId('processing-compress-reSizeHeight')"
                    v-model.number="form.compress.reSizeHeight"
                    type="number"
                    min="0"
                    class="form-input"
                  />
                </ImageProcessSettingField>

                <ImageProcessSettingField
                  v-if="
                    form.compress.isReSize &&
                    (form.compress.reSizeHeight || 0) > 0 &&
                    (form.compress.reSizeWidth || 0) === 0
                  "
                  :option="editingSettings.compress.longEdgeAsHeight"
                  v-bind="fieldContext"
                  field="compress.longEdgeAsHeight"
                  class="flex flex-col justify-center"
                  @edit-source="editScope"
                  @inherit="inheritSetting('compress', 'longEdgeAsHeight')"
                >
                  <CustomSwitch
                    v-model="form.compress.longEdgeAsHeight"
                    :title="t('pages.imageProcess.transform.longEdgeAsHeight')"
                    class="custom-switch"
                    no-border
                    small
                  />
                </ImageProcessSettingField>

                <ImageProcessSettingField
                  v-if="
                    form.compress.isReSize &&
                    (((form.compress.reSizeHeight || 0) > 0 && (form.compress.reSizeWidth || 0) === 0) ||
                      ((form.compress.reSizeWidth || 0) > 0 && (form.compress.reSizeHeight || 0) === 0))
                  "
                  :option="editingSettings.compress.skipReSizeOfSmallImg"
                  v-bind="fieldContext"
                  field="compress.skipReSizeOfSmallImg"
                  class="flex flex-col justify-center"
                  @edit-source="editScope"
                  @inherit="inheritSetting('compress', 'skipReSizeOfSmallImg')"
                >
                  <CustomSwitch
                    v-model="form.compress.skipReSizeOfSmallImg"
                    :title="t('pages.imageProcess.transform.skipResizeOfSmallImgHeight')"
                    class="custom-switch"
                    no-border
                    small
                  />
                </ImageProcessSettingField>
              </SettingSection>
              <SettingSection>
                <ImageProcessSettingField
                  :option="editingSettings.compress.isReSizeByPercent"
                  v-bind="fieldContext"
                  field="compress.isReSizeByPercent"
                  class="flex flex-col justify-center"
                  @edit-source="editScope"
                  @inherit="inheritSetting('compress', 'isReSizeByPercent')"
                >
                  <CustomSwitch
                    v-model="form.compress.isReSizeByPercent"
                    :title="t('pages.imageProcess.guide.resizePercent')"
                    :description="t('pages.imageProcess.guide.percentHint')"
                    no-border
                    small
                  />
                </ImageProcessSettingField>

                <ImageProcessSettingField
                  v-if="form.compress.isReSizeByPercent"
                  :option="editingSettings.compress.reSizePercent"
                  v-bind="fieldContext"
                  field="compress.reSizePercent"
                  class="flex flex-col justify-center"
                  @edit-source="editScope"
                  @inherit="inheritSetting('compress', 'reSizePercent')"
                >
                  <CustomRange
                    v-model.number="form.compress.reSizePercent"
                    :title="t('pages.imageProcess.transform.resizePercent')"
                    :min="1"
                    :max="500"
                    :step="1"
                    :show-value="`${form.compress.reSizePercent}%`"
                  />
                </ImageProcessSettingField>
              </SettingSection>
              <details class="processing-advanced">
                <summary>
                  <span>{{ t('pages.imageProcess.guide.orientation') }}</span
                  ><ChevronRight :size="16" />
                </summary>
                <div class="processing-advanced-content">
                  <SettingSection
                    :icon="FlipHorizontal"
                    :title="t('pages.imageProcess.transform.title')"
                    :description="t('pages.imageProcess.transform.description')"
                  >
                    <ImageProcessSettingField
                      :option="editingSettings.compress.isFlip"
                      v-bind="fieldContext"
                      field="compress.isFlip"
                      @edit-source="editScope"
                      @inherit="inheritSetting('compress', 'isFlip')"
                    >
                      <CustomSwitch
                        v-model="form.compress.isFlip"
                        :title="t('pages.imageProcess.transform.isFlip')"
                        class="custom-switch"
                        no-border
                        small
                      />
                    </ImageProcessSettingField>

                    <ImageProcessSettingField
                      :option="editingSettings.compress.isFlop"
                      v-bind="fieldContext"
                      field="compress.isFlop"
                      @edit-source="editScope"
                      @inherit="inheritSetting('compress', 'isFlop')"
                    >
                      <CustomSwitch
                        v-model="form.compress.isFlop"
                        :title="t('pages.imageProcess.transform.isFlop')"
                        class="custom-switch"
                        small
                        no-border
                      />
                    </ImageProcessSettingField>
                  </SettingSection>
                  <SettingSection
                    :icon="RotateCw"
                    :title="t('pages.imageProcess.transform.rotationTitle')"
                    :description="t('pages.imageProcess.transform.rotationDescription')"
                  >
                    <ImageProcessSettingField
                      :option="editingSettings.compress.isRotate"
                      v-bind="fieldContext"
                      field="compress.isRotate"
                      class="flex flex-col justify-center"
                      @edit-source="editScope"
                      @inherit="inheritSetting('compress', 'isRotate')"
                    >
                      <CustomSwitch
                        v-model="form.compress.isRotate"
                        :title="t('pages.imageProcess.transform.isRotate')"
                        class="custom-switch"
                        no-border
                        small
                      />
                    </ImageProcessSettingField>

                    <ImageProcessSettingField
                      v-if="form.compress.isRotate"
                      :option="editingSettings.compress.rotateDegree"
                      v-bind="fieldContext"
                      field="compress.rotateDegree"
                      class="flex flex-col justify-center"
                      @edit-source="editScope"
                      @inherit="inheritSetting('compress', 'rotateDegree')"
                    >
                      <CustomRange
                        v-model.number="form.compress.rotateDegree"
                        :title="t('pages.imageProcess.transform.rotationDegree')"
                        :min="-360"
                        :max="360"
                        :step="1"
                        :show-value="`${form.compress.rotateDegree}°`"
                      />
                    </ImageProcessSettingField>
                  </SettingSection>
                </div>
              </details>
            </div>
            <!-- Skip Process Tab -->
            <div v-else-if="activeTab === 'skipProcess'" key="skipProcess" class="flex flex-col gap-4">
              <SettingSection only-one-row :icon="FileText" :title="t('pages.imageProcess.general.skipProcessExtList')">
                <ImageProcessSettingField
                  :option="editingSettings.skipProcess.skipProcessExtList"
                  v-bind="fieldContext"
                  field="skipProcess.skipProcessExtList"
                  class="flex flex-col justify-center"
                  @edit-source="editScope"
                  @inherit="inheritSetting('skipProcess', 'skipProcessExtList')"
                >
                  <textarea
                    v-model="form.skipProcess.skipProcessExtList"
                    :aria-label="t('pages.imageProcess.general.skipProcessExtList')"
                    class="form-textarea"
                    rows="3"
                    :placeholder="'zip,rar,7z,tar,gz'"
                  />
                  <small class="mt-2 block rounded-sm bg-bg-secondary px-3 py-2 text-xs leading-[1.5] text-tertiary">{{
                    t('pages.imageProcess.general.skipProcessExtListPlaceholder')
                  }}</small>
                </ImageProcessSettingField>
              </SettingSection>
            </div>

            <!-- Rename Tab -->
            <div v-else-if="activeTab === 'rename'" key="rename" class="flex flex-col gap-4">
              <SettingSection only-one-row>
                <SettingSection>
                  <ImageProcessSettingField
                    :option="editingSettings.naming.autoRename"
                    v-bind="fieldContext"
                    field="naming.autoRename"
                    p1
                    @edit-source="editScope"
                    @inherit="inheritSetting('naming', 'autoRename')"
                  >
                    <CustomSwitch
                      v-model="form.naming.autoRename"
                      :title="t('pages.imageProcess.guide.timestampName')"
                      no-border
                      small
                    />
                  </ImageProcessSettingField>

                  <ImageProcessSettingField
                    :option="editingSettings.naming.manualRename"
                    v-bind="fieldContext"
                    field="naming.manualRename"
                    p1
                    class="flex flex-col justify-center"
                    @edit-source="editScope"
                    @inherit="inheritSetting('naming', 'manualRename')"
                  >
                    <CustomSwitch
                      v-model="form.naming.manualRename"
                      :title="t('pages.imageProcess.guide.askName')"
                      no-border
                      small
                    />
                  </ImageProcessSettingField>

                  <ImageProcessSettingField
                    :option="editingSettings.rename.enable"
                    v-bind="fieldContext"
                    field="rename.enable"
                    p1
                    class="flex flex-col justify-center"
                    @edit-source="editScope"
                    @inherit="inheritSetting('rename', 'enable')"
                  >
                    <CustomSwitch
                      v-model="form.rename.enable"
                      :title="t('pages.imageProcess.guide.customName')"
                      no-border
                      small
                    />
                  </ImageProcessSettingField>

                  <ImageProcessSettingField
                    v-if="form.rename.enable"
                    :option="editingSettings.rename.format"
                    v-bind="fieldContext"
                    field="rename.format"
                    @edit-source="editScope"
                    @inherit="inheritSetting('rename', 'format')"
                  >
                    <label
                      :for="controlId('processing-rename-format')"
                      class="mb-4 flex items-center gap-2 text-sm font-semibold text-main"
                    >
                      <Edit :size="14" class="text-accent" />
                      {{ t('pages.settings.upload.advancedRnameFormat') }}
                    </label>
                    <input
                      :id="controlId('processing-rename-format')"
                      v-model="form.rename.format"
                      type="text"
                      class="form-input"
                      placeholder="Ex. {Y}-{m}-{uuid}"
                    />
                  </ImageProcessSettingField>
                </SettingSection>
                <details v-if="form.rename.enable" class="processing-advanced">
                  <summary>{{ t('pages.settings.upload.availablePlaceholders') }}<ChevronRight :size="16" /></summary>
                  <div class="processing-advanced-content">
                    <PlaceholderTable :list="advancedRenameList" :title-list="advancedRenameTitleList" />
                  </div>
                </details>
              </SettingSection>
            </div>
          </div>
        </section>
      </template>
      <div v-else class="flex flex-col items-center gap-3 p-6 text-sm text-secondary" role="status">
        {{ t(`pages.imageProcess.preview.${loadFailed ? 'loadFailed' : 'loading'}`) }}
        <button v-if="loadFailed" type="button" class="form-input w-auto!" @click="initData">
          {{ t('pages.imageProcess.preview.retry') }}
        </button>
      </div>
    </div>
    <footer v-if="isInitialized" class="processing-footer">
      <span role="status" class="processing-save-status" :class="{ 'text-danger': saveState === 'error' }">
        <Check v-if="saveState === 'saved'" :size="15" class="text-accent" />
        {{ t('pages.imageProcess.editor.save.' + saveState) }}
        <button v-if="saveState === 'error'" type="button" class="text-accent underline" @click="retrySave">
          {{ t('pages.imageProcess.preview.retry') }}
        </button>
      </span>
      <div class="processing-footer-actions">
        <button
          v-if="currentStep > 1"
          type="button"
          class="processing-button secondary"
          @click="currentStep = currentStep === 3 ? 2 : 1"
        >
          <ArrowLeft :size="15" />{{ t('pages.imageProcess.guide.back') }}
        </button>
        <button
          v-if="currentStep < 3"
          type="button"
          class="processing-button primary"
          data-testid="processing-next"
          :disabled="!canEdit"
          @click="currentStep = currentStep === 1 ? 2 : 3"
        >
          {{ t('pages.imageProcess.guide.' + (currentStep === 1 ? 'continue' : 'review')) }}<ArrowRight :size="15" />
        </button>
        <button
          v-else
          type="button"
          class="processing-button primary"
          data-testid="processing-done"
          :disabled="saveState !== 'saved'"
          @click="$emit('done')"
        >
          <Check :size="15" />{{ t('pages.imageProcess.guide.done') }}
        </button>
      </div>
    </footer>
  </div>
</template>

<script lang="ts" setup>
import {
  ArrowLeft,
  ArrowRight,
  Check,
  ChevronRight,
  Edit,
  FileText,
  FlipHorizontal,
  Globe,
  Image,
  Info,
  Layers,
  RotateCw,
  Settings,
  Sliders,
  UserRound,
} from '@lucide/vue'
import { useStorage } from '@vueuse/core'
import { computed, nextTick, onBeforeMount, ref, useId, useTemplateRef, watch } from 'vue'
import { useI18n } from 'vue-i18n'

import CustomRadioOption from '@/components/common/CustomRadioOption.vue'
import CustomRange from '@/components/common/CustomRange.vue'
import CustomSwitch from '@/components/common/CustomSwitch.vue'
import PlaceholderTable from '@/components/common/PlaceholderTable.vue'
import ImageProcessPreview from '@/components/ImageProcessPreview.vue'
import SettingSection from '@/components/ImageProcessSection.vue'
import ImageProcessSettingField from '@/components/ImageProcessSettingField.vue'
import { useImageProcessingSettings } from '@/composables/useImageProcessingSettings'
import type { ProcessingGroup, ProcessingScope } from '@/utils/imageProcessingConfig'

const processingId = useId()
const controlId = (field: string) => `${processingId}-${field}`

const { configId = '', currentPicbedName = '' } = defineProps<{ configId?: string; currentPicbedName?: string }>()
defineEmits<{ done: [] }>()
const { t } = useI18n()
const {
  scope,
  providers,
  configurationOptions,
  targetProvider,
  selectedConfigId,
  previewUploader,
  editingSettings,
  effectiveSettings,
  settingsByScope,
  form,
  canEdit,
  isInitialized,
  loadFailed,
  saveState,
  initData,
  updateSetting,
  retrySave,
} = useImageProcessingSettings(
  () => configId,
  () => currentPicbedName,
)
const scopes: ProcessingScope[] = ['global', 'provider', 'config']
const scopeIcons = { config: UserRound, provider: Layers, global: Globe }
const activeTab = useStorage<string>('image-process-setting-active-tab', 'general')
if (!['general', 'watermark', 'transform', 'skipProcess', 'rename'].includes(activeTab.value))
  activeTab.value = 'general'
const currentStep = ref<1 | 2 | 3>(1)
const showSources = ref(false)
const steps = computed(() => ([1, 2, 3] as const).map(id => ({ id, label: t('pages.imageProcess.guide.steps.' + id) })))
const settingsContent = useTemplateRef('settingsContent')
const targetName = computed(() => previewUploader.value.configName || t('pages.imageProcess.preview.unnamedConfig'))
const fieldContext = computed(() => ({
  scope: scope.value,
  uploader: previewUploader.value,
  effectiveSettings: effectiveSettings.value,
  showSource: showSources.value,
}))
function scopeLabel(level: ProcessingScope) {
  return t('pages.imageProcess.design.scopes.' + level, {
    provider: previewUploader.value.providerName,
    config: targetName.value,
  })
}
async function editFromPreview(level: ProcessingScope, category: string, field?: string) {
  scope.value = level
  activeTab.value = category
  currentStep.value = 2
  await nextTick()
  if (field) {
    const element = settingsContent.value?.querySelector<HTMLElement>(`[data-processing-field="${field}"]`)
    let parent = element?.parentElement
    while (parent && parent !== settingsContent.value) {
      if (parent.tagName === 'DETAILS') (parent as HTMLDetailsElement).open = true
      parent = parent.parentElement
    }
    element?.scrollIntoView({ block: 'nearest' })
    element?.querySelector<HTMLElement>('input, select, textarea')?.focus({ preventScroll: true })
  }
}
const tabs = computed(() => [
  {
    id: 'general',
    label: t('pages.imageProcess.design.categoryLabels.general'),
    icon: Settings,
  },
  {
    id: 'watermark',
    label: t('pages.imageProcess.watermarkSettings'),
    icon: Image,
  },
  {
    id: 'transform',
    label: t('pages.imageProcess.design.categoryLabels.transform'),
    icon: RotateCw,
  },
  {
    id: 'skipProcess',
    label: t('pages.imageProcess.design.categoryLabels.skipProcess'),
    icon: FileText,
  },
  {
    id: 'rename',
    label: t('pages.imageProcess.renameSettings'),
    icon: Sliders,
  },
])
const visibleTabs = computed(() =>
  tabs.value.filter(tab => scope.value !== 'provider' || !['skipProcess', 'rename'].includes(tab.id)),
)
const currentCategory = computed(() => tabs.value.find(tab => tab.id === activeTab.value))
const editingTarget = computed(() => (scope.value === 'config' ? targetName.value : scopeLabel(scope.value)))
const qualityPresets = [70, 85, 100]

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
    { label: t('pages.settings.upload.placeholder.timestampS'), value: '{timestampS}' },
  ],
  categoryHash: [
    { label: t('pages.settings.upload.placeholder.md5'), value: '{md5}' },
    { label: t('pages.settings.upload.placeholder.md5-16'), value: '{md5-16}' },
    { label: t('pages.settings.upload.placeholder.uuid'), value: '{uuid}' },
    { label: t('pages.settings.upload.placeholder.ulid'), value: '{ulid}' },
    { label: t('pages.settings.upload.placeholder.sha1'), value: '{sha1}' },
    { label: t('pages.settings.upload.placeholder.sha1-n'), value: '{sha1-n}' },
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

const waterMarkPositionMap = computed(
  () =>
    new Map([
      ['northwest', t('pages.imageProcess.watermark.positionOptions.topLeft')],
      ['north', t('pages.imageProcess.watermark.positionOptions.top')],
      ['northeast', t('pages.imageProcess.watermark.positionOptions.topRight')],
      ['west', t('pages.imageProcess.watermark.positionOptions.left')],
      ['centre', t('pages.imageProcess.watermark.positionOptions.center')],
      ['east', t('pages.imageProcess.watermark.positionOptions.right')],
      ['southwest', t('pages.imageProcess.watermark.positionOptions.bottomLeft')],
      ['south', t('pages.imageProcess.watermark.positionOptions.bottom')],
      ['southeast', t('pages.imageProcess.watermark.positionOptions.bottomRight')],
    ]),
)

const imageExtList = ['jpg', 'jpeg', 'png', 'webp', 'bmp', 'tiff', 'tif', 'svg', 'ico', 'avif', 'heif', 'heic']
const availableFormat = [
  'webp',
  'jpg',
  'png',
  'avif',
  'gif',
  'jpeg',
  'tiff',
  'tif',
  'heif',
  'svg',
  'input',
  'dz',
  'fits',
  'jp2',
  'jxl',
  'magick',
  'openslide',
  'pdf',
  'ppm',
  'raw',
  'v',
]

const formatRulesDraft = ref('{}')
const conversionError = ref(false)
const convertStr = computed({
  get: () => formatRulesDraft.value,
  set(value: string) {
    formatRulesDraft.value = value
    try {
      const parsed = JSON.parse(value)
      if (
        !parsed ||
        typeof parsed !== 'object' ||
        Array.isArray(parsed) ||
        Object.entries(parsed).some(
          ([extension, format]) =>
            !imageExtList.includes(extension) || typeof format !== 'string' || !availableFormat.includes(format),
        )
      )
        throw new Error('Invalid format rules')
      conversionError.value = false
      updateSetting('compress', 'formatConvertObj', parsed)
    } catch {
      conversionError.value = true
    }
  },
})
function syncFormatRules() {
  formatRulesDraft.value = JSON.stringify(form.compress.formatConvertObj)
  conversionError.value = false
}
function inheritSetting(group: ProcessingGroup, key: string) {
  updateSetting(group, key)
  if (key === 'formatConvertObj') syncFormatRules()
}
function editScope(level: ProcessingScope) {
  scope.value = level
  currentStep.value = 2
}
watch([scope, targetProvider, selectedConfigId, isInitialized], () => {
  syncFormatRules()
  if (settingsContent.value) settingsContent.value.scrollTop = 0
})
watch(
  scope,
  () => {
    if (!visibleTabs.value.some(tab => tab.id === activeTab.value)) activeTab.value = 'general'
  },
  { flush: 'sync' },
)
watch(
  [activeTab, currentStep],
  () => {
    if (settingsContent.value) settingsContent.value.scrollTop = 0
    settingsContent.value?.querySelector<HTMLElement>('[data-step-heading]')?.focus({ preventScroll: true })
  },
  { flush: 'post' },
)
watch(() => [configId, currentPicbedName], initData)
onBeforeMount(initData)
</script>

<style scoped src="./ImageProcessSetting.css"></style>
