<template>
  <div class="@container flex h-full min-h-0 flex-col gap-3 p-4 text-main">
    <template v-if="isInitialized">
      <ScopeBar />
      <div
        class="grid min-h-0 flex-1 grid-cols-[200px_minmax(0,1fr)_272px] gap-3 @max-[960px]:grid-cols-[200px_minmax(0,1fr)] @max-[640px]:grid-cols-1 @max-[640px]:grid-rows-[auto_minmax(0,1fr)]"
      >
        <CategoryNav
          class="self-start @max-[640px]:flex-row @max-[640px]:overflow-x-auto @max-[640px]:overscroll-x-contain"
        />
        <div
          ref="content"
          data-testid="image-process-content"
          class="no-scrollbar flex min-h-0 min-w-0 flex-col gap-4 overflow-x-hidden overflow-y-auto overscroll-contain rounded-2xl"
          :class="{ 'col-span-2 @max-[960px]:col-span-1': view === 'review' }"
        >
          <template v-if="view === 'review'">
            <SettingSection only-one-row>
              <ImageProcessPreview
                :settings="effectiveSettings"
                :layers="settingsByScope"
                :uploader="previewUploader"
                @edit="editFromPreview"
              />
            </SettingSection>
          </template>
          <SettingSection
            v-else-if="!canEdit"
            :icon="CircleAlert"
            :title="t('pages.imageProcess.editor.noSavedConfig')"
            :description="t('pages.imageProcess.editor.noConfig')"
            only-one-row
          >
            <CustomButton
              type="secondary"
              :icon="Globe"
              class="justify-self-start"
              :text="t('pages.imageProcess.editor.editGlobal')"
              @click="scope = 'global'"
            />
          </SettingSection>
          <SettingSection
            v-else-if="unsupportedCategory"
            :icon="CircleAlert"
            :title="currentCategoryLabel"
            :description="t('pages.imageProcess.editor.globalOrConfigOnly')"
            only-one-row
          >
            <div class="flex flex-wrap gap-2">
              <CustomButton
                type="secondary"
                :icon="Globe"
                :text="t('pages.imageProcess.guide.scopeLabels.global')"
                @click="scope = 'global'"
              />
              <CustomButton
                type="secondary"
                :icon="UserRound"
                :text="t('pages.imageProcess.guide.scopeLabels.config')"
                :disabled="!configurationOptions.length"
                @click="scope = 'config'"
              />
            </div>
          </SettingSection>
          <template v-else>
            <div class="flex flex-wrap items-center justify-between gap-x-4 gap-y-1 px-2 pt-1">
              <p class="text-xs text-secondary">
                {{
                  scope === 'global'
                    ? t('pages.imageProcess.guide.scopeNotes.global')
                    : t('pages.imageProcess.guide.customizeHint')
                }}
              </p>
              <CustomSwitch
                v-model="showSources"
                class="ml-auto"
                :title="t('pages.imageProcess.guide.showSources')"
                small
                no-border
                no-hover
                tighter
              />
            </div>
            <component :is="panels[activeCategory]" :key="activeCategory" />
          </template>
        </div>
        <aside
          v-if="view === 'edit'"
          class="no-scrollbar min-h-0 overflow-y-auto overscroll-contain @max-[960px]:hidden"
          :aria-label="t('pages.imageProcess.design.livePreview')"
        >
          <ImageProcessPreview
            compact
            :settings="effectiveSettings"
            :layers="settingsByScope"
            :uploader="previewUploader"
            @review="view = 'review'"
          />
        </aside>
      </div>
      <footer class="-mx-4 -mb-1 flex flex-wrap items-center gap-3 border-t border-border-secondary px-5 pt-3">
        <span
          role="status"
          class="flex min-w-0 flex-wrap items-center gap-1.5 text-xs"
          :class="saveState === 'error' ? 'text-danger' : 'text-secondary'"
        >
          <Check v-if="saveState === 'saved'" :size="15" class="text-accent" aria-hidden="true" />
          <LoaderCircle
            v-else-if="saveState === 'saving'"
            :size="15"
            class="animate-spin motion-reduce:animate-none"
            aria-hidden="true"
          />
          <CircleAlert v-else :size="15" aria-hidden="true" />
          {{ t('pages.imageProcess.editor.save.' + saveState) }}
          <button
            v-if="saveState === 'error'"
            type="button"
            class="cursor-pointer rounded-sm font-medium text-accent underline focus-visible:focus-ring"
            @click="retrySave"
          >
            {{ t('pages.imageProcess.preview.retry') }}
          </button>
        </span>
        <div class="ml-auto flex shrink-0 items-center gap-2">
          <CustomButton
            type="secondary"
            data-testid="processing-review"
            :icon="view === 'review' ? ArrowLeft : Eye"
            :text="
              t(view === 'review' ? 'pages.imageProcess.studio.backToEdit' : 'pages.imageProcess.design.reviewAll')
            "
            @click="view = view === 'review' ? 'edit' : 'review'"
          />
          <CustomButton
            data-testid="processing-done"
            :icon="Check"
            :text="t('pages.imageProcess.guide.done')"
            :disabled="saveState !== 'saved'"
            @click="$emit('done')"
          />
        </div>
      </footer>
    </template>
    <div v-else class="flex flex-1 flex-col items-center justify-center gap-3 p-6 text-sm text-secondary" role="status">
      <CircleAlert v-if="loadFailed" :size="28" class="text-danger" aria-hidden="true" />
      <LoaderCircle v-else :size="28" class="animate-spin text-accent motion-reduce:animate-none" aria-hidden="true" />
      {{ t(`pages.imageProcess.preview.${loadFailed ? 'loadFailed' : 'loading'}`) }}
      <CustomButton
        v-if="loadFailed"
        type="secondary"
        :icon="RotateCw"
        :text="t('pages.imageProcess.preview.retry')"
        @click="initData"
      />
    </div>
  </div>
</template>

<script lang="ts" setup>
import { ArrowLeft, Check, CircleAlert, Eye, Globe, LoaderCircle, RotateCw, UserRound } from '@lucide/vue'
import { computed, nextTick, onBeforeMount, useTemplateRef, watch } from 'vue'
import { useI18n } from 'vue-i18n'

import CustomButton from '@/components/common/CustomButton.vue'
import CustomSwitch from '@/components/common/CustomSwitch.vue'
import SettingSection from '@/components/common/SettingSection.vue'
import CategoryNav from '@/components/imageProcess/CategoryNav.vue'
import {
  globalOrConfigCategories,
  type ProcessingCategory,
  provideImageProcess,
  useImageProcessStudio,
} from '@/components/imageProcess/context'
import GeneralPanel from '@/components/imageProcess/GeneralPanel.vue'
import RenamePanel from '@/components/imageProcess/RenamePanel.vue'
import ScopeBar from '@/components/imageProcess/ScopeBar.vue'
import SkipProcessPanel from '@/components/imageProcess/SkipProcessPanel.vue'
import TransformPanel from '@/components/imageProcess/TransformPanel.vue'
import WatermarkPanel from '@/components/imageProcess/WatermarkPanel.vue'
import ImageProcessPreview from '@/components/ImageProcessPreview.vue'
import type { ProcessingScope } from '@/utils/imageProcessingConfig'

const { configId = '', currentPicbedName = '' } = defineProps<{ configId?: string; currentPicbedName?: string }>()
defineEmits<{ done: [] }>()
const { t } = useI18n()
const studio = useImageProcessStudio(
  () => configId,
  () => currentPicbedName,
)
provideImageProcess(studio)
const {
  scope,
  configurationOptions,
  targetProvider,
  selectedConfigId,
  previewUploader,
  effectiveSettings,
  settingsByScope,
  canEdit,
  isInitialized,
  loadFailed,
  saveState,
  initData,
  retrySave,
  activeCategory,
  view,
  showSources,
} = studio

const panels = {
  general: GeneralPanel,
  watermark: WatermarkPanel,
  transform: TransformPanel,
  skipProcess: SkipProcessPanel,
  rename: RenamePanel,
}
const content = useTemplateRef('content')
const unsupportedCategory = computed(
  () => scope.value === 'provider' && globalOrConfigCategories.includes(activeCategory.value),
)
const currentCategoryLabel = computed(() =>
  t(
    activeCategory.value === 'rename'
      ? 'pages.imageProcess.renameSettings'
      : 'pages.imageProcess.design.categoryLabels.' + activeCategory.value,
  ),
)

async function editFromPreview(level: ProcessingScope, category: string, field?: string) {
  scope.value = level
  activeCategory.value = category as ProcessingCategory
  view.value = 'edit'
  await nextTick()
  if (!field) return
  const element = content.value?.querySelector<HTMLElement>(`[data-processing-field="${field}"]`)
  element?.scrollIntoView({ block: 'center' })
  element?.querySelector<HTMLElement>('input, button[aria-haspopup], textarea')?.focus({ preventScroll: true })
}

watch(
  [activeCategory, view, scope, targetProvider, selectedConfigId],
  () => {
    if (content.value) content.value.scrollTop = 0
  },
  { flush: 'post' },
)
watch(() => [configId, currentPicbedName], initData)
onBeforeMount(initData)
</script>
