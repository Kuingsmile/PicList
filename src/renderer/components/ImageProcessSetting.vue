<template>
  <div class="@container flex h-full min-h-0 flex-col gap-3 p-4 text-main">
    <template v-if="isInitialized">
      <ScopeBar />
      <div
        class="grid min-h-0 flex-1 grid-cols-[208px_minmax(0,1fr)_268px] gap-3 @max-[980px]:grid-cols-[208px_minmax(0,1fr)] @max-[640px]:grid-cols-1 @max-[640px]:grid-rows-[auto_minmax(0,1fr)]"
      >
        <CategoryNav
          class="no-scrollbar self-start @max-[640px]:flex-row @max-[640px]:overflow-x-auto @max-[640px]:overscroll-x-contain"
        />
        <div
          ref="content"
          data-testid="image-process-content"
          class="no-scrollbar flex min-h-0 min-w-0 flex-col gap-4 overflow-x-hidden overflow-y-auto overscroll-contain rounded-lg scroll-fade-y"
          :class="{ 'col-span-2 @max-[980px]:col-span-1': view === 'review' }"
        >
          <ImageProcessPreview
            v-if="view === 'review'"
            :settings="effectiveSettings"
            :layers="settingsByScope"
            :uploader="previewUploader"
            @edit="editFromPreview"
          />
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
            :icon="categoryIcons[activeCategory]"
            :title="t(`pages.imageProcess.design.categoryLabels.${activeCategory}`)"
            :description="
              t('pages.imageProcess.studio.notPerServiceDescription', { provider: previewUploader.providerName })
            "
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
          <component :is="panels[activeCategory]" v-else :key="activeCategory" />
        </div>
        <aside
          v-if="view === 'edit'"
          class="no-scrollbar min-h-0 overflow-y-auto overscroll-contain scroll-fade-y @max-[980px]:hidden"
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
            v-if="view === 'review'"
            type="secondary"
            :icon="ArrowLeft"
            :text="t('pages.imageProcess.studio.backToEdit')"
            @click="view = 'edit'"
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
import { ArrowLeft, Check, CircleAlert, Globe, LoaderCircle, RotateCw, UserRound } from '@lucide/vue'
import { computed, nextTick, onBeforeMount, useTemplateRef, watch } from 'vue'
import { useI18n } from 'vue-i18n'

import CustomButton from '@/components/common/CustomButton.vue'
import SettingSection from '@/components/common/SettingSection.vue'
import CategoryNav from '@/components/imageProcess/CategoryNav.vue'
import {
  categoryIcons,
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
  openCategory,
} = studio

const panels = {
  general: GeneralPanel,
  transform: TransformPanel,
  watermark: WatermarkPanel,
  rename: RenamePanel,
  skipProcess: SkipProcessPanel,
}
const content = useTemplateRef('content')
const unsupportedCategory = computed(
  () => scope.value === 'provider' && globalOrConfigCategories.includes(activeCategory.value),
)

async function editFromPreview(level: ProcessingScope | undefined, category: ProcessingCategory, field?: string) {
  if (level) scope.value = level
  openCategory(category)
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
