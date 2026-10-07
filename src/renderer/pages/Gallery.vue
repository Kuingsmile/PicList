<template>
  <div class="relative no-scrollbar flex h-full w-full items-center justify-center">
    <!-- Header Card -->
    <div
      class="relative z-1 no-scrollbar flex h-full w-full flex-col items-center justify-start gap-4 overflow-auto rounded-xl border-none p-4 shadow-sm"
    >
      <div
        class="flex w-full flex-wrap items-center justify-between gap-4 rounded-2xl border border-border-secondary px-6 py-0 shadow-md max-md:items-stretch max-md:p-5"
      >
        <div class="flex flex-1 items-center gap-4 p-1">
          <ImagesIcon :size="24" class="text-accent" />
          <div>
            <h1 class="m-0 text-2xl font-semibold tracking-tight text-main">{{ t('pages.gallery.title') }}</h1>
            <p v-if="selectedCount > 0" class="m-0 text-sm text-secondary">
              {{ `${selectedCount}/${filterList.length} ${t('pages.gallery.selected')}` }}
            </p>
            <p v-else class="m-0 text-sm text-secondary">{{ `${filterList.length} ${t('pages.gallery.images')}` }}</p>
          </div>
        </div>
        <div class="flex flex-wrap items-center gap-2">
          <div
            v-if="viewMode === 'grid'"
            class="flex items-center gap-1.5 rounded-md border border-border-secondary px-2 py-1.5"
          >
            <GridIcon :size="14" class="text-main" />
            <input
              v-model.number="userGridColumns"
              v-tooltip="t('pages.gallery.gridSize')"
              type="range"
              min="1"
              max="15"
              step="1"
              class="h-[4px] w-[70px] cursor-pointer appearance-none rounded-[2px] bg-(--color-background-tertiary) outline-none [&::-moz-range-thumb]:h-[14px] [&::-moz-range-thumb]:w-[14px] [&::-moz-range-thumb]:rounded-full [&::-moz-range-thumb]:border-none [&::-moz-range-thumb]:bg-accent [&::-moz-range-thumb]:transition-all [&::-moz-range-thumb]:duration-200 [&::-webkit-slider-thumb]:h-[15px] [&::-webkit-slider-thumb]:w-[15px] [&::-webkit-slider-thumb]:appearance-none [&::-webkit-slider-thumb]:rounded-full [&::-webkit-slider-thumb]:bg-accent [&::-webkit-slider-thumb]:transition-all [&::-webkit-slider-thumb]:duration-200 hover:[&::-webkit-slider-thumb]:scale-110 hover:[&::-webkit-slider-thumb]:shadow-[0_0_0_2px_rgba(var(--color-accent-rgb),0.4)]"
              :aria-label="t('pages.gallery.gridSize')"
            />
          </div>
          <div class="flex items-center gap-2">
            <span class="text-sm text-secondary">{{ t('pages.gallery.isAlwaysForceReload') }}</span>
            <CustomSwitch
              v-model="isAlwaysForceReload"
              :aria-label="t('pages.gallery.isAlwaysForceReload')"
              small
              tighter
              no-border
              no-hover
              @update:model-value="handleIsAlwaysForceReload"
            />
          </div>
          <div class="flex items-center gap-2">
            <span class="text-sm text-secondary">{{ t('pages.gallery.syncDelete') }}</span>
            <CustomSwitch
              v-model="deleteCloud"
              :aria-label="t('pages.gallery.syncDelete')"
              small
              tighter
              no-border
              no-hover
              @update:model-value="handleDeleteCloudFile"
            />
          </div>
          <FileViewControls v-model:view-mode="viewMode" v-model:density="tableDensity" />
          <CustomButton
            :text="t('pages.gallery.hideFilters')"
            :icon="handleBarActive ? ChevronUpIcon : ChevronDownIcon"
            class="px-2!"
            @click="toggleHandleBar"
          />
          <CustomButton
            type="secondary"
            :text="t('pages.gallery.refresh')"
            :icon="RefreshCwIcon"
            :loading="galleryLoading"
            class="px-2!"
            @click="updateGallery"
          />
        </div>
      </div>

      <!-- Filter Controls Card -->
      <div
        v-show="handleBarActive"
        class="flex w-full flex-wrap items-center justify-between gap-2 rounded-2xl border border-border-secondary px-6 py-2 shadow-md max-md:items-stretch max-md:p-5"
      >
        <div class="mb-1 flex w-full flex-wrap items-start gap-3">
          <div class="flex min-w-[140px] flex-1 flex-col gap-1">
            <MultiSelect
              v-model:choosed="choosedPicBed"
              :title="t('pages.gallery.picBedType')"
              :zero-placeholder="t('pages.gallery.chooseShowedPicBed')"
              :all-list="filteredPicBedG"
            />
          </div>

          <div class="flex min-w-[140px] flex-1 flex-col gap-1">
            <label class="mb-0 text-sm leading-[1.4] font-semibold text-secondary">{{
              t('pages.gallery.dateRange')
            }}</label>
            <div class="flex w-full flex-wrap items-center gap-2 max-md:items-start">
              <input
                v-model="dateRangeStart"
                type="date"
                class="h-[28px] min-w-[20px] flex-1 rounded-md border border-border-secondary px-2 py-1.5 text-xs leading-[1.2] text-main transition-all duration-fast ease-apple focus:border-accent-hover focus:shadow-md focus:outline-none"
                :aria-label="t('pages.gallery.dateRangeStart')"
              />
              <span class="shrink-0 font-medium text-secondary">-</span>
              <input
                v-model="dateRangeEnd"
                type="date"
                class="h-[28px] min-w-[20px] flex-1 rounded-md border border-border-secondary px-2 py-1.5 text-xs leading-[1.2] text-main transition-all duration-fast ease-apple focus:border-accent-hover focus:shadow-md focus:outline-none"
                :aria-label="t('pages.gallery.dateRangeEnd')"
              />
            </div>
          </div>

          <div class="flex min-w-[140px] flex-1 flex-col gap-1">
            <SingleSelect
              v-model="pasteStyle"
              :title="t('pages.gallery.pasteFormat')"
              :fronticon="false"
              :key-list="pasteStyleList"
            >
              <template #item="{ item }">
                {{ item }}
              </template>
            </SingleSelect>
          </div>

          <div class="flex min-w-[140px] flex-1 flex-col gap-1">
            <SingleSelect
              v-model="useShortUrl"
              :title="t('pages.gallery.urlType')"
              :fronticon="false"
              :select-list="shortURLList.map(value => ({ value, label: t(`pages.gallery.${value}`) }))"
            />
          </div>

          <div class="flex min-w-[140px] flex-1 flex-col gap-1">
            <SingleSelect
              :model-value="currentSortField"
              :title="t('pages.gallery.sort')"
              :select-list="
                ['name', 'ext', 'time', 'provider', 'check'].map(value => ({
                  value,
                  label: t(`pages.gallery.sortBy.${value}`),
                }))
              "
              @change="field => sortFile(field as GallerySortField)"
            />
          </div>
        </div>

        <!-- Second Row - Search and Actions -->
        <div class="mb-1 flex w-full flex-wrap items-start gap-3">
          <div class="relative flex min-w-[100px] flex-row items-center gap-2">
            <SearchIcon :size="16" class="absolute left-3 z-1 text-secondary" />
            <input
              v-model="searchText"
              type="text"
              class="w-full rounded-md border border-border-secondary pt-2 pr-3 pb-2 pl-9 text-sm text-main transition-all duration-fast ease-apple placeholder:text-secondary focus:border-accent-hover focus:shadow-md focus:outline-none"
              :placeholder="t('pages.gallery.searchFilename')"
              :aria-label="t('pages.gallery.searchFilename')"
            />
            <button
              v-if="searchText"
              class="absolute right-3 flex cursor-pointer items-center border-none bg-none p-0 text-secondary transition-all duration-fast ease-apple hover:text-main"
              :aria-label="t('common.clear')"
              @click="cleanSearch"
            >
              <XIcon :size="15" />
            </button>
          </div>

          <div class="relative flex min-w-[100px] flex-row items-center gap-2">
            <LinkIcon :size="16" class="absolute left-3 z-1 text-secondary" />
            <input
              v-model="searchTextURL"
              type="text"
              class="w-full rounded-md border border-border-secondary pt-2 pr-3 pb-2 pl-9 text-sm text-main transition-all duration-fast ease-apple placeholder:text-secondary focus:border-accent-hover focus:shadow-md focus:outline-none"
              :placeholder="t('pages.gallery.searchUrl')"
              :aria-label="t('pages.gallery.searchUrl')"
            />
            <button
              v-if="searchTextURL"
              class="absolute right-3 flex cursor-pointer items-center border-none bg-none p-0 text-secondary transition-all duration-fast ease-apple hover:text-main"
              :aria-label="t('common.clear')"
              @click="cleanSearchUrl"
            >
              <XIcon :size="14" />
            </button>
          </div>

          <div class="flex flex-1 flex-wrap gap-3">
            <button
              class="copy-btn flex flex-1 cursor-not-allowed items-center justify-center gap-2 rounded-md border-none px-4 py-[0.425rem] text-sm font-medium text-white opacity-60 transition-all duration-fast ease-apple [.active]:transform-none [.active]:cursor-pointer [.active]:opacity-100 [.active:hover]:-translate-y-px [.active:hover]:shadow-sm [.copy-btn]:bg-accent [.copy-btn]:text-white [.copy-btn.active:hover]:bg-accent-hover [.delete-btn]:bg-danger [.delete-btn]:text-white [.delete-btn.active:hover]:bg-danger/80 [.edit-btn]:bg-success [.edit-btn]:text-white [.edit-btn.active:hover]:bg-success/80 [.select-btn]:bg-warning [.select-btn]:text-white [.select-btn.active:hover]:bg-warning/80"
              :disabled="!selectedCount"
              :class="{ active: isMultiple(choosedList) }"
              @click="multiCopy"
            >
              <ClipboardIcon :size="16" />
              <span> {{ t('pages.gallery.copy') }}</span>
            </button>
            <button
              class="edit-btn flex flex-1 cursor-not-allowed items-center justify-center gap-2 rounded-md border-none px-4 py-[0.425rem] text-sm font-medium text-white opacity-60 transition-all duration-fast ease-apple [.active]:transform-none [.active]:cursor-pointer [.active]:opacity-100 [.active:hover]:-translate-y-px [.active:hover]:shadow-sm [.copy-btn]:bg-accent [.copy-btn]:text-white [.copy-btn.active:hover]:bg-accent-hover [.delete-btn]:bg-danger [.delete-btn]:text-white [.delete-btn.active:hover]:bg-danger/80 [.edit-btn]:bg-success [.edit-btn]:text-white [.edit-btn.active:hover]:bg-success/80 [.select-btn]:bg-warning [.select-btn]:text-white [.select-btn.active:hover]:bg-warning/80"
              :disabled="!filterList.length"
              :class="{ active: filterList.length > 0 }"
              @click="openBatchRename"
            >
              <EditIcon :size="16" />
              <span> {{ t('pages.gallery.edit') }}</span>
            </button>
            <button
              class="delete-btn flex flex-1 cursor-not-allowed items-center justify-center gap-2 rounded-md border-none px-4 py-[0.425rem] text-sm font-medium text-white opacity-60 transition-all duration-fast ease-apple [.active]:transform-none [.active]:cursor-pointer [.active]:opacity-100 [.active:hover]:-translate-y-px [.active:hover]:shadow-sm [.copy-btn]:bg-accent [.copy-btn]:text-white [.copy-btn.active:hover]:bg-accent-hover [.delete-btn]:bg-danger [.delete-btn]:text-white [.delete-btn.active:hover]:bg-danger/80 [.edit-btn]:bg-success [.edit-btn]:text-white [.edit-btn.active:hover]:bg-success/80 [.select-btn]:bg-warning [.select-btn]:text-white [.select-btn.active:hover]:bg-warning/80"
              :disabled="!selectedCount"
              :class="{ active: isMultiple(choosedList) }"
              @click="multiRemove"
            >
              <TrashIcon :size="16" />
              <span> {{ `${t('pages.gallery.delete')}${selectedCount > 0 ? ` (${selectedCount})` : ''}` }}</span>
            </button>
            <button
              class="select-btn flex flex-1 cursor-not-allowed items-center justify-center gap-2 rounded-md border-none px-4 py-[0.425rem] text-sm font-medium text-white opacity-60 transition-all duration-fast ease-apple [.active]:transform-none [.active]:cursor-pointer [.active]:opacity-100 [.active:hover]:-translate-y-px [.active:hover]:shadow-sm [.copy-btn]:bg-accent [.copy-btn]:text-white [.copy-btn.active:hover]:bg-accent-hover [.delete-btn]:bg-danger [.delete-btn]:text-white [.delete-btn.active:hover]:bg-danger/80 [.edit-btn]:bg-success [.edit-btn]:text-white [.edit-btn.active:hover]:bg-success/80 [.select-btn]:bg-warning [.select-btn]:text-white [.select-btn.active:hover]:bg-warning/80"
              :disabled="!filterList.length"
              :class="{ active: filterList.length > 0 }"
              @click="toggleSelectAll"
            >
              <CheckSquareIcon :size="16" />
              <span>{{ isAllSelected ? t('pages.gallery.cancel') : t('pages.gallery.selectAll') }}</span>
            </button>
          </div>
        </div>
      </div>

      <!-- Gallery Grid -->
      <div
        class="flex min-h-[240px] w-full min-w-0 flex-1 flex-col overflow-hidden rounded-2xl border border-border-secondary p-4 shadow-md"
        :aria-busy="galleryLoading"
      >
        <div
          v-if="galleryLoadFailed"
          role="status"
          class="mb-3 flex items-center justify-between gap-3 rounded-md bg-warning/10 p-3 text-sm text-main"
        >
          <span>{{ t('pages.gallery.loadFailed') }}</span>
          <CustomButton
            type="secondary"
            :text="t('pages.gallery.refresh')"
            :loading="galleryLoading"
            @click="updateGallery"
          />
        </div>
        <div
          v-if="galleryLoading && !images.length"
          role="status"
          class="flex flex-1 items-center justify-center gap-3 p-8 text-secondary"
        >
          <RefreshCwIcon :size="20" class="animate-spin" aria-hidden="true" />
          {{ t('pages.gallery.loading') }}
        </div>
        <div
          v-else-if="filterList.length === 0 && !galleryLoadFailed"
          class="flex flex-col items-center justify-center px-8 py-16 text-center"
        >
          <ImageIcon :size="64" class="mb-4 text-accent" />
          <h3 class="mx-0 mt-0 mb-2 text-xl font-semibold text-main">{{ t('pages.gallery.noImagesFound') }}</h3>
          <p class="m-0 text-secondary">{{ t('pages.gallery.tryAdjustingFilters') }}</p>
        </div>

        <FileCollection
          v-else-if="filterList.length"
          :key="componentKey"
          ref="virtualScrollerRef"
          :items="filterList"
          :view-mode="viewMode"
          :density="tableDensity"
          :columns="tableColumns"
          :grid-item-height="300"
          :grid-breakpoints="effectiveGridBreakpoints"
          key-field="key"
          :label="t('pages.gallery.title')"
          :preview-id="hoverPreviewId"
          :is-selected="item => !!choosedList[item.id || '']"
          :sort-field="currentSortField"
          :sort-ascending="sortAscending"
          @select="(item, selected) => (choosedList[item.id || ''] = selected)"
          @select-all="setAllSelected"
          @sort="field => sortFile(field as GallerySortField)"
          @open="(_, index) => zoomImage(index)"
          @preview="showHoverPreview"
          @preview-end="hoverPreviewRef?.scheduleHide()"
          @visible-indexes-change="handleVisibleIndexesChange"
        >
          <template #actions="{ item, index, tabindex }">
            <button
              v-tooltip="t('common.fileTable.open')"
              type="button"
              :tabindex
              :aria-label="t('common.fileTable.open')"
              @click="zoomImage(index)"
            >
              <ImageIcon :size="16" />
            </button>
            <button
              v-tooltip="t('pages.gallery.copy')"
              type="button"
              :tabindex
              :aria-label="t('pages.gallery.copy')"
              @click="copy(item)"
            >
              <ClipboardIcon :size="16" />
            </button>
            <button
              v-tooltip="t('pages.gallery.edit')"
              type="button"
              :tabindex
              :aria-label="t('pages.gallery.edit')"
              @click="openDialog(item)"
            >
              <EditIcon :size="16" />
            </button>
            <button
              v-tooltip="t('pages.gallery.delete')"
              type="button"
              :tabindex
              :aria-label="t('pages.gallery.delete')"
              @click="remove(item, index)"
            >
              <TrashIcon :size="16" />
            </button>
          </template>
          <template #default="{ item, index }">
            <div
              class="group/image m-0 box-border flex h-[calc(100%-8px)] w-full cursor-pointer flex-col overflow-hidden rounded-lg border-2 border-border shadow-sm transition-all duration-fast ease-apple hover:translate-y-[-2px] hover:border-accent hover:shadow-md [.selected]:border-2 [.selected]:border-accent [.selected]:shadow-md"
              :class="{ selected: choosedList[item.id || ''] }"
              @click="handleChooseImage(!choosedList[item.id || ''], index)"
            >
              <div
                class="relative mb-2 flex aspect-auto min-h-0 flex-1 items-center justify-center overflow-hidden border-b border-dashed border-b-accent/40"
                role="button"
                tabindex="0"
                :aria-label="`${t('common.fileTable.open')}: ${item.fileName || ''}`"
                @keydown.enter.prevent="zoomImage(index)"
                @keydown.space.prevent="zoomImage(index)"
                @click.stop="zoomImage(index)"
              >
                <img
                  v-if="galleryActive"
                  :src="displayImageSources[item.key || ''] || item.src"
                  :alt="item.fileName || ''"
                  class="h-full w-full object-contain transition-all duration-fast ease-apple"
                  :class="{ loading: !imageLoadStates[item.key || ''] }"
                  @load="onImageLoad(item)"
                  @error="onImageError(item)"
                />
                <div
                  v-if="!imageLoadStates[item.key || '']"
                  class="absolute inset-0 flex items-center justify-center bg-surface-elevated"
                >
                  <div
                    class="h-[24px] w-[24px] animate-spin rounded-full border-2 border-t-2 border-border-secondary border-t-accent"
                  />
                </div>
              </div>

              <div class="flex min-w-0 shrink-0 flex-col justify-between">
                <div
                  v-tooltip.overflow="item.fileName || ''"
                  class="mb-1.5 w-full truncate text-center text-sm font-medium text-main"
                >
                  {{ formatFileName(item.fileName || '') }}
                </div>

                <div class="mr-2 flex items-center justify-between">
                  <div class="flex flex-1 justify-center gap-2">
                    <button
                      v-tooltip="t('pages.gallery.copy')"
                      :aria-label="t('pages.gallery.copy')"
                      class="copy-icon flex h-[25px] w-[25px] cursor-pointer items-center justify-center rounded-md border-none text-secondary transition-all duration-fast ease-apple hover:-translate-y-px hover:text-main [.copy-icon]:hover:bg-warning/50 [.copy-icon]:hover:text-white [.delete-icon]:hover:bg-error/50 [.delete-icon]:hover:text-white [.edit-icon]:hover:bg-success/50 [.edit-icon]:hover:text-white"
                      @click.stop="copy(item)"
                    >
                      <ClipboardIcon :size="16" />
                    </button>
                    <button
                      v-tooltip="t('pages.gallery.edit')"
                      :aria-label="t('pages.gallery.edit')"
                      class="edit-icon flex h-[25px] w-[25px] cursor-pointer items-center justify-center rounded-md border-none text-secondary transition-all duration-fast ease-apple hover:-translate-y-px hover:text-main [.copy-icon]:hover:bg-warning/50 [.copy-icon]:hover:text-white [.delete-icon]:hover:bg-error/50 [.delete-icon]:hover:text-white [.edit-icon]:hover:bg-success/50 [.edit-icon]:hover:text-white"
                      @click.stop="openDialog(item)"
                    >
                      <EditIcon :size="16" />
                    </button>
                    <button
                      v-tooltip="t('pages.gallery.delete')"
                      :aria-label="t('pages.gallery.delete')"
                      class="delete-icon flex h-[25px] w-[25px] cursor-pointer items-center justify-center rounded-md border-none text-secondary transition-all duration-fast ease-apple hover:-translate-y-px hover:text-main [.copy-icon]:hover:bg-warning/50 [.copy-icon]:hover:text-white [.delete-icon]:hover:bg-error/50 [.delete-icon]:hover:text-white [.edit-icon]:hover:bg-success/50 [.edit-icon]:hover:text-white"
                      @click.stop="remove(item, index)"
                    >
                      <TrashIcon :size="16" />
                    </button>
                  </div>

                  <label class="relative flex cursor-pointer items-center" @click.stop>
                    <input
                      v-model="choosedList[item.id ? item.id : '']"
                      type="checkbox"
                      class="peer sr-only"
                      :aria-label="t('common.fileTable.selectFile', { name: item.fileName || '' })"
                      @change="e => handleChooseImage((e.target as HTMLInputElement).checked, index)"
                    />
                    <span
                      class="relative inline-block h-[16px] w-[16px] rounded-sm border-2 border-accent/50 transition-all duration-fast ease-apple peer-checked:border-accent-hover peer-checked:bg-accent peer-focus-visible:outline-2 peer-focus-visible:outline-offset-2 peer-focus-visible:outline-accent peer-checked:after:absolute peer-checked:after:top-[-2px] peer-checked:after:left-px peer-checked:after:text-[12px] peer-checked:after:font-bold peer-checked:after:text-white peer-checked:after:content-['✓']"
                    />
                  </label>
                </div>
              </div>
            </div>
          </template>
        </FileCollection>
      </div>
    </div>
    <GalleryHoverPreview
      :id="hoverPreviewId"
      ref="hoverPreviewRef"
      :src="hoverPreviewItem ? buildDisplayImageSrc(hoverPreviewItem) : ''"
      :alt="hoverPreviewItem?.fileName || ''"
      @show="ensureJxlPreview(hoverPreviewItem)"
      @hide="hoverPreviewItem = undefined"
    />
    <!-- Custom Image Preview Modal -->
    <ImagePreview
      v-model:gallery-slider-control="gallerySliderControl"
      :filter-list="previewFilterList"
      :is-always-force-reload="isAlwaysForceReload"
    />

    <!-- Edit URL Modal -->
    <GalleryUrlEditor
      ref="urlEditor"
      :filter-list="filterList"
      :choosed-list="choosedList"
      :update-gallery="updateGallery"
      @changed="virtualScrollerRef?.refresh()"
    />

    <!-- Batch Rename Modal -->
  </div>
</template>

<script setup lang="ts">
import {
  CheckSquareIcon,
  ChevronDownIcon,
  ChevronUpIcon,
  ClipboardIcon,
  EditIcon,
  GridIcon,
  ImageIcon,
  ImagesIcon,
  LinkIcon,
  RefreshCwIcon,
  SearchIcon,
  TrashIcon,
  XIcon,
} from '@lucide/vue'
import { useStorage } from '@vueuse/core'
import {
  computed,
  nextTick,
  onActivated,
  onBeforeMount,
  onBeforeUnmount,
  onDeactivated,
  onWatcherCleanup,
  reactive,
  ref,
  shallowRef,
  useId,
  useTemplateRef,
  watch,
} from 'vue'
import { useI18n } from 'vue-i18n'
import { onBeforeRouteUpdate } from 'vue-router'

import CustomButton from '@/components/common/CustomButton.vue'
import CustomSwitch from '@/components/common/CustomSwitch.vue'
import MultiSelect from '@/components/common/MultiSelect.vue'
import SingleSelect from '@/components/common/SingleSelect.vue'
import FileCollection from '@/components/FileCollection.vue'
import FileViewControls from '@/components/FileViewControls.vue'
import GalleryUrlEditor from '@/components/gallery/GalleryUrlEditor.vue'
import GalleryHoverPreview from '@/components/GalleryHoverPreview.vue'
import ImagePreview from '@/components/ImagePreview.vue'
import { useGalleryActions } from '@/composables/useGalleryActions'
import { usePicBed } from '@/composables/useGlobal'
import useMessage from '@/composables/useMessage'
import { getConfig, saveConfig } from '@/services/configService'
import $$db from '@/services/galleryDatabase'
import { configPaths } from '@/utils/configPaths'
import { compareFileValues, type FileColumn, fileDate, fileType, formatCollectionDate } from '@/utils/fileCollection'
import { prepareGalleryItems } from '@/utils/galleryItems'
import { getGalleryPreviewSource, getJxlPreviewSource } from '@/utils/galleryPreview'
import { PreviewCache } from '@/utils/previewCache'
import { IPasteStyle } from '#/constants/app'
import { UPDATE_GALLERY } from '#/constants/ipcChannels'
import { IRPCActionType } from '#/constants/rpcActions'
import { customStrMatch } from '#/utils/strings'
import { addCacheBustParam as withCacheBustParam } from '#/utils/url'
import { enforceBoolean } from '#/utils/values'

defineOptions({ name: 'GalleryPage' })

const { t } = useI18n()

const message = useMessage()

const { picBedG } = usePicBed()

const images = shallowRef<IGalleryItem[]>([])

const galleryLoading = ref(false)

const galleryLoadFailed = ref(false)

let galleryRefreshVersion = 0

let galleryRefreshPromise: Promise<boolean> | undefined

let galleryRefreshRequested = false

let galleryDisposed = false

let loadingConfig = false

const galleryActive = ref(true)

let galleryDirty = false

const virtualScrollerRef = useTemplateRef('virtualScrollerRef')

const hoverPreviewRef = useTemplateRef('hoverPreviewRef')

const hoverPreviewId = useId()

const hoverPreviewItem = shallowRef<IGalleryItem>()

const choosedList: IObjT<boolean> = reactive({})
const urlEditor = useTemplateRef('urlEditor')
const { copy, remove, multiRemove, multiCopy } = useGalleryActions({
  choosedList,
  updateGallery,
  refresh: () => virtualScrollerRef.value?.refresh(),
})
function openDialog(item: ImgInfo) {
  urlEditor.value?.open(item)
}
function openBatchRename() {
  urlEditor.value?.openBatch()
}

const gallerySliderControl = ref({
  visible: false,
  index: 0,
})

const deleteCloud = ref<boolean>(false)

const isAlwaysForceReload = ref<boolean>(false)

const choosedPicBed = ref<string[]>([])

const galleryPicBedFilterSetting = ref<string[]>([])

const lastChoosed = ref<string>()

const isShiftKeyPress = ref<boolean>(false)

const searchText = ref<string>('')

const searchTextURL = ref<string>('')

const debouncedSearchText = ref<string>('')

const debouncedSearchTextURL = ref<string>('')

const handleBarActive = useStorage<boolean>('galleryHandleBarActive', true)

const pasteStyle = ref<string>('')

const useShortUrl = ref<string>('longUrl')

const dateRangeStart = ref('')

const dateRangeEnd = ref('')

const picBedDropdownOpen = ref(false)

const sortDropdownOpen = ref(false)

const enableAdvancedAnimation = ref(false)

const storedViewMode = useStorage<'list' | 'table' | 'grid'>('galleryViewMode', 'grid')

const viewMode = computed({
  get: () => (storedViewMode.value === 'grid' ? ('grid' as const) : ('table' as const)),
  set: (value: 'grid' | 'table') => {
    storedViewMode.value = value
  },
})

const tableDensity = useStorage<'compact' | 'comfortable'>('galleryTableDensity', 'compact')

const componentKey = ref(0)

type GallerySortField = 'name' | 'time' | 'ext' | 'provider' | 'check'

const currentSortField = ref<GallerySortField>('time')

const sortAscending = ref(false)

const userGridColumns = useStorage<number>('galleryGridColumns', 4)

const imageLoadStates = reactive<Record<string, boolean>>({})

const imageErrorStates = reactive<Record<string, boolean>>({})

const displayImageSources = reactive<Record<string, string>>({})

const jxlPreviewCache = reactive<Record<string, string>>({})

const jxlPreviewLoading = reactive<Record<string, boolean>>({})

const jxlPreviewErrors = reactive<Record<string, boolean>>({})

const previewCache = new PreviewCache(jxlPreviewCache)

const cacheBustToken = ref(Date.now())

const visibleGalleryIndexes = ref<number[]>([])

let jxlPreviewGeneration = 0

const pasteStyleList = ['markdown', 'HTML', 'URL', 'UBB', 'Custom']

const shortURLList = ['shortUrl', 'longUrl']

const effectiveGridBreakpoints = computed(() => {
  return Array.from({ length: userGridColumns.value }, (_, index) => ({ min: index * 180, cols: index + 1 }))
})

const tableColumns = computed<FileColumn<IGalleryItem>[]>(() => [
  { key: 'name', label: t('common.fileTable.name'), width: 260, value: item => item.fileName },
  { key: 'ext', label: t('common.fileTable.type'), width: 90, value: fileType },
  { key: 'time', label: t('common.fileTable.date'), width: 180, value: fileDate, format: formatCollectionDate },
  {
    key: 'provider',
    label: t('common.fileTable.provider'),
    width: 150,
    value: item => picBedG.value.find(provider => provider.type === item.type)?.name || item.type,
  },
])

const filteredPicBedG = computed(() => {
  if (galleryPicBedFilterSetting.value.length === 0) {
    return picBedG.value
  }
  return picBedG.value.filter(item => galleryPicBedFilterSetting.value.includes(item.type))
})

const filterList = computed(() => {
  return getGallery()
})

const galleryItemsByKey = computed(() => new Map(filterList.value.map(item => [item.key, item])))

const activeJxlPreviewSources = computed(() => getActiveJxlPreviewSources())

const previewFilterList = computed(() => {
  if (!gallerySliderControl.value.visible) {
    return filterList.value
  }

  const currentIndex = gallerySliderControl.value.index
  return filterList.value.map((item, index) =>
    index === currentIndex ? { ...item, src: buildDisplayImageSrc(item) } : item,
  )
})

const isAllSelected = computed(() => {
  return Object.values(choosedList).length > 0 && filterList.value.every(item => choosedList[item.id!])
})

const selectedCount = computed(() => {
  return Object.values(choosedList).filter(v => v).length
})

watch(pasteStyle, async newVal => {
  if (loadingConfig) return
  await saveConfig(configPaths.settings.pasteStyle, newVal)
})

watch(useShortUrl, async newVal => {
  if (loadingConfig) return
  await saveConfig(configPaths.settings.useShortUrl, newVal === 'shortUrl')
})

watch(filterList, (items, previous) => {
  hoverPreviewRef.value?.hide()
  if (gallerySliderControl.value.visible) {
    const currentKey = previous?.[gallerySliderControl.value.index]?.key
    const index = items.findIndex(item => item.key === currentKey)
    if (!items.length) gallerySliderControl.value.visible = false
    else
      gallerySliderControl.value.index =
        index >= 0 ? index : Math.min(gallerySliderControl.value.index, items.length - 1)
  }
  const visibleIds = new Set(items.map(item => item.id))
  Object.keys(choosedList).forEach(id => {
    if (!visibleIds.has(id)) {
      delete choosedList[id]
    }
  })
  if (!visibleIds.has(lastChoosed.value)) lastChoosed.value = undefined
  pruneDisplayImageSources(items)
  pruneJxlPreviewState(items)
  nextTick(() => {
    syncVisibleDisplayImageSources()
  })
})

watch([viewMode, tableDensity], () => hoverPreviewRef.value?.hide())

watch(
  () => [gallerySliderControl.value.visible, gallerySliderControl.value.index] as const,
  ([visible, index]) => {
    if (visible) {
      ensureJxlPreview(filterList.value[index])
    }
  },
)

watch(isAlwaysForceReload, () => {
  cacheBustToken.value = Date.now()
  invalidateJxlPreviewCache()
  syncVisibleDisplayImageSources()
})

watch(userGridColumns, _ => {
  nextTick(() => {
    if (virtualScrollerRef.value) {
      virtualScrollerRef.value.refresh()
    }
  })
})

watch(searchText, newVal => {
  const timer = setTimeout(() => {
    debouncedSearchText.value = newVal
    nextTick(() => {
      virtualScrollerRef.value?.scrollToTop()
    })
  }, 300)
  onWatcherCleanup(() => clearTimeout(timer))
})

watch(searchTextURL, newVal => {
  const timer = setTimeout(() => {
    debouncedSearchTextURL.value = newVal
    nextTick(() => {
      virtualScrollerRef.value?.scrollToTop()
    })
  }, 300)
  onWatcherCleanup(() => clearTimeout(timer))
})

function onImageLoad(item: IGalleryItem) {
  const id = item.key || ''
  imageLoadStates[id] = true
  if (getJxlPreviewSource(item)) {
    updateDisplayImageSource(item)
  }
}

function onImageError(item: IGalleryItem) {
  const id = item.key || ''
  imageLoadStates[id] = false
  if (ensureJxlPreview(item)) {
    return
  }

  imageErrorStates[id] = true
  updateDisplayImageSource(item)
}

async function initConf() {
  loadingConfig = true
  try {
    const settingConfig = (await getConfig<any>('settings')) || {}
    pasteStyle.value = settingConfig.pasteStyle || IPasteStyle.MARKDOWN
    useShortUrl.value = settingConfig.useShortUrl ? 'shortUrl' : 'longUrl'
    enableAdvancedAnimation.value = settingConfig.enableAdvancedAnimation || false
    isAlwaysForceReload.value = enforceBoolean(settingConfig.isAlwaysForceReload)
    deleteCloud.value = enforceBoolean(settingConfig.deleteCloudFile)
    galleryPicBedFilterSetting.value = settingConfig.galleryPicBedFilter || []
    await nextTick()
  } catch {
    message.error(t('pages.gallery.operationFailed'))
  } finally {
    loadingConfig = false
  }
}

const updateGalleryHandler = () => {
  if (!galleryActive.value) {
    galleryDirty = true
    return
  }
  void updateGallery()
}

function handleOutsideClick(event: Event) {
  const target = event.target as Element
  if (!target.closest('.custom-multiselect') && !target.closest('.sort-dropdown')) {
    picBedDropdownOpen.value = false
    sortDropdownOpen.value = false
  }
}

function handleDetectShiftKey(event: KeyboardEvent) {
  if (event.key === 'Shift') {
    isShiftKeyPress.value = event.type === 'keydown'
  }
}

const addCacheBustParam = (url: string | undefined) => withCacheBustParam(url, cacheBustToken.value)

function formatFileName(name: string) {
  return window.node.path.basename(name)
}

function getPreviewSource(item: ImgInfo) {
  const itemKey = item.key || ''
  const previewPath = getJxlPreviewSource(item)
  if (previewPath && jxlPreviewCache[previewPath]) {
    touchJxlPreviewCache(previewPath)
  }

  return getGalleryPreviewSource(
    item,
    jxlPreviewCache,
    jxlPreviewLoading,
    jxlPreviewErrors,
    itemKey ? imageLoadStates[itemKey] : false,
  )
}

function buildDisplayImageSrc(item: IGalleryItem) {
  if (imageErrorStates[item.key || '']) return './errorLoading.png'
  const src = getJxlPreviewSource(item) ? getPreviewSource(item) : item.src || item.galleryPath || item.imgUrl || ''
  return isAlwaysForceReload.value ? addCacheBustParam(src) : src
}

function updateDisplayImageSource(item?: IGalleryItem) {
  if (!item?.key) return
  if (!galleryItemsByKey.value.has(item.key)) return
  displayImageSources[item.key] = buildDisplayImageSrc(item)
}

function pruneDisplayImageSources(items: IGalleryItem[] = filterList.value, indexes?: number[]) {
  const keys = new Set<string>()
  const sourceItems = indexes ? indexes.map(index => items[index]).filter(Boolean) : items
  sourceItems.forEach(item => {
    if (!item.key) return
    keys.add(item.key)
  })
  Object.keys(displayImageSources).forEach(key => {
    if (!keys.has(key)) {
      delete displayImageSources[key]
    }
  })
}

function syncVisibleDisplayImageSources(indexes: number[] = visibleGalleryIndexes.value) {
  const visibleItems = filterList.value
  pruneDisplayImageSources(visibleItems, indexes)
  indexes.forEach(index => {
    updateDisplayImageSource(visibleItems[index])
  })
}

function getActiveJxlPreviewSources(items: ImgInfo[] = filterList.value) {
  const sources = new Set<string>()
  items.forEach(item => {
    const previewPath = getJxlPreviewSource(item)
    if (previewPath) {
      sources.add(previewPath)
    }
  })
  return sources
}

function isJxlPreviewSourceActive(previewPath: string) {
  return activeJxlPreviewSources.value.has(previewPath)
}

function touchJxlPreviewCache(previewPath: string) {
  previewCache.touch(previewPath)
}

function deleteJxlPreviewCacheEntry(previewPath: string) {
  previewCache.delete(previewPath)
}

function cacheJxlPreview(previewPath: string, previewSrc: string) {
  previewCache.set(previewPath, previewSrc)
}

function invalidateJxlPreviewCache() {
  jxlPreviewGeneration += 1
  previewCache.clear()
  Object.keys(jxlPreviewLoading).forEach(key => {
    delete jxlPreviewLoading[key]
  })
  Object.keys(jxlPreviewErrors).forEach(key => {
    delete jxlPreviewErrors[key]
  })
}

function pruneJxlPreviewState(items: ImgInfo[] = filterList.value) {
  const activeSources = getActiveJxlPreviewSources(items)
  Object.keys(jxlPreviewCache).forEach(previewPath => {
    if (!activeSources.has(previewPath)) {
      deleteJxlPreviewCacheEntry(previewPath)
    }
  })
  Object.keys(jxlPreviewLoading).forEach(previewPath => {
    if (!activeSources.has(previewPath)) {
      delete jxlPreviewLoading[previewPath]
    }
  })
  Object.keys(jxlPreviewErrors).forEach(previewPath => {
    if (!activeSources.has(previewPath)) {
      delete jxlPreviewErrors[previewPath]
    }
  })
}

function handleVisibleIndexesChange(indexes: number[]) {
  visibleGalleryIndexes.value = viewMode.value === 'grid' ? indexes : []
  syncVisibleDisplayImageSources(visibleGalleryIndexes.value)
}

function ensureJxlPreview(item?: IGalleryItem): boolean {
  if (!galleryActive.value) return false
  const previewPath = getJxlPreviewSource(item)
  if (!previewPath || jxlPreviewErrors[previewPath]) {
    return false
  }

  if (jxlPreviewCache[previewPath]) {
    updateDisplayImageSource(item)
    return true
  }

  if (jxlPreviewLoading[previewPath]) {
    return true
  }

  jxlPreviewLoading[previewPath] = true
  const previewGeneration = jxlPreviewGeneration
  const previewRequestSource = isAlwaysForceReload.value ? addCacheBustParam(previewPath) : previewPath
  updateDisplayImageSource(item)
  window.electron
    .triggerRPC<string | undefined>(IRPCActionType.GALLERY_GET_JXL_PREVIEW, previewRequestSource, true)
    .then(previewSrc => {
      if (previewGeneration !== jxlPreviewGeneration || !isJxlPreviewSourceActive(previewPath)) {
        return
      }
      if (previewSrc) {
        cacheJxlPreview(previewPath, previewSrc)
        delete jxlPreviewErrors[previewPath]
      } else {
        jxlPreviewErrors[previewPath] = true
      }
    })
    .catch(() => {
      if (previewGeneration !== jxlPreviewGeneration || !isJxlPreviewSourceActive(previewPath)) {
        return
      }
      jxlPreviewErrors[previewPath] = true
    })
    .finally(() => {
      if (previewGeneration !== jxlPreviewGeneration) {
        return
      }
      delete jxlPreviewLoading[previewPath]
      updateDisplayImageSource(item)
    })

  return true
}

function getGallery(): IGalleryItem[] {
  const hasDateRange = !!(dateRangeStart.value || dateRangeEnd.value)
  const start = dateRangeStart.value ? new Date(`${dateRangeStart.value}T00:00:00`).getTime() : -Infinity
  // The exclusive end follows the local calendar, including daylight-saving transitions.
  const endDate = dateRangeEnd.value ? new Date(`${dateRangeEnd.value}T00:00:00`) : undefined
  endDate?.setDate(endDate.getDate() + 1)
  const end = endDate?.getTime() ?? Infinity
  if (
    debouncedSearchText.value ||
    choosedPicBed.value.length > 0 ||
    debouncedSearchTextURL.value ||
    hasDateRange ||
    galleryPicBedFilterSetting.value.length > 0
  ) {
    return images.value.filter(item => {
      let isInChoosedPicBed = true
      let isIncludesSearchText = true
      let isIncludesSearchTextURL = true
      let isIncludesDateRange = true
      if (choosedPicBed.value.length > 0) {
        isInChoosedPicBed = choosedPicBed.value.some(type => type === item.type)
      } else if (galleryPicBedFilterSetting.value.length > 0) {
        isInChoosedPicBed = galleryPicBedFilterSetting.value.some(type => type === item.type)
      }
      if (debouncedSearchText.value) {
        isIncludesSearchText = customStrMatch(item.fileName || '', debouncedSearchText.value)
      }
      if (debouncedSearchTextURL.value) {
        isIncludesSearchTextURL = customStrMatch(item.imgUrl || '', debouncedSearchTextURL.value)
      }
      if (hasDateRange) {
        const date = new Date(item.updatedAt).getTime()
        isIncludesDateRange = date >= start && date < end
      }
      return isIncludesSearchText && isInChoosedPicBed && isIncludesSearchTextURL && isIncludesDateRange
    })
  } else {
    return images.value
  }
}

function updateGallery(): Promise<boolean> {
  if (galleryDisposed) return Promise.resolve(false)
  galleryRefreshRequested = true
  if (galleryRefreshPromise) return galleryRefreshPromise
  galleryLoading.value = true
  galleryRefreshPromise = Promise.resolve()
    .then(async () => {
      let succeeded: boolean
      do {
        galleryRefreshRequested = false
        succeeded = await loadGallerySnapshot()
      } while (galleryRefreshRequested && !galleryDisposed)
      return succeeded
    })
    .finally(() => {
      galleryRefreshPromise = undefined
      if (!galleryDisposed) galleryLoading.value = false
    })
  return galleryRefreshPromise
}

async function loadGallerySnapshot() {
  const version = ++galleryRefreshVersion
  try {
    const result = await $$db.get<ImgInfo>({ orderBy: 'desc' })
    if (galleryDisposed || galleryRefreshRequested) return false
    if (!result || !Array.isArray(result.data)) throw new Error('Missing gallery snapshot')
    const newList = result.data
    const prepared = prepareGalleryItems(newList)
    const previousItems = new Map(images.value.map(item => [item.key, item]))
    const stableIds = new Set(
      prepared
        .filter(item => {
          const previous = previousItems.get(item.key)
          return previous?.src === item.src && previous?.imgUrl === item.imgUrl
        })
        .map(item => item.key),
    )
    Object.keys(imageLoadStates).forEach(k => {
      if (!stableIds.has(k)) delete imageLoadStates[k]
    })
    Object.keys(imageErrorStates).forEach(k => {
      if (!stableIds.has(k)) delete imageErrorStates[k]
    })
    Object.keys(displayImageSources).forEach(k => {
      if (!stableIds.has(k)) delete displayImageSources[k]
    })
    if (isAlwaysForceReload.value) {
      cacheBustToken.value = Date.now()
      invalidateJxlPreviewCache()
    }
    images.value = prepared
    sortFile(currentSortField.value, false)
    nextTick(() => {
      if (galleryDisposed || version !== galleryRefreshVersion) return
      pruneJxlPreviewState()
      syncVisibleDisplayImageSources()
      if (virtualScrollerRef.value) {
        virtualScrollerRef.value.refresh()
      }
    })
    galleryLoadFailed.value = false
    return true
  } catch {
    if (!galleryDisposed && !galleryRefreshRequested) galleryLoadFailed.value = true
    return false
  }
}

function handleChooseImage(val: boolean, index: number) {
  const currentItem = filterList.value[index]
  if (currentItem && currentItem.id) {
    choosedList[currentItem.id] = val
  }

  if (val === true) {
    const anchorIndex = filterList.value.findIndex(item => item.id === lastChoosed.value)
    if (anchorIndex >= 0 && isShiftKeyPress.value) {
      const min = Math.min(anchorIndex, index)
      const max = Math.max(anchorIndex, index)
      for (let i = min + 1; i < max; i++) {
        const id = filterList.value[i].id!
        choosedList[id] = true
      }
      try {
        delete choosedList[currentItem.id!]
        choosedList[currentItem.id!] = val
      } catch (e) {
        console.error(e)
      }
    }
    lastChoosed.value = currentItem.id
  }
}

function clearChoosedList() {
  isShiftKeyPress.value = false
  Object.keys(choosedList).forEach(key => {
    delete choosedList[key]
  })
  lastChoosed.value = undefined
}

function zoomImage(index: number) {
  hoverPreviewRef.value?.hide()
  ensureJxlPreview(filterList.value[index])
  gallerySliderControl.value.index = index
  gallerySliderControl.value.visible = true
}

function showHoverPreview(item: IGalleryItem, anchor: Element) {
  hoverPreviewItem.value = item
  hoverPreviewRef.value?.show(anchor)
}

async function handleIsAlwaysForceReload(value: boolean) {
  if (
    !(await saveConfig({
      [configPaths.settings.isAlwaysForceReload]: value,
    }))
  )
    return
  window.electron.sendRPC(IRPCActionType.REFRESH_SETTING_WINDOW)
}

async function handleDeleteCloudFile(value: boolean) {
  await saveConfig({
    [configPaths.settings.deleteCloudFile]: value,
  })
}

function cleanSearch() {
  searchText.value = ''
}

function cleanSearchUrl() {
  searchTextURL.value = ''
}

function isMultiple(obj: IObj) {
  return Object.values(obj).some(item => item)
}

function toggleSelectAll() {
  setAllSelected(!isAllSelected.value)
}

function setAllSelected(selected: boolean) {
  filterList.value.forEach(item => {
    choosedList[item.id!] = selected
  })
}

function toggleHandleBar() {
  handleBarActive.value = !handleBarActive.value
}

function sortFile(type: GallerySortField, toggle = true) {
  if (toggle) sortAscending.value = type === currentSortField.value ? !sortAscending.value : true
  currentSortField.value = type
  const column = tableColumns.value.find(column => column.key === type)
  images.value = [...images.value].sort((a, b) =>
    type === 'check'
      ? Number(!!choosedList[b.id!]) - Number(!!choosedList[a.id!])
      : compareFileValues(column?.value(a), column?.value(b), sortAscending.value),
  )
}

onBeforeRouteUpdate((to, from) => {
  if (from.name === 'gallery') {
    clearChoosedList()
  }
  if (to.name === 'gallery') {
    updateGallery()
  }
})

onActivated(async () => {
  galleryActive.value = true
  await initConf()
  if (galleryDirty) {
    galleryDirty = false
    await updateGallery()
  }
  nextTick(() => {
    if (virtualScrollerRef.value && typeof virtualScrollerRef.value.refresh === 'function') {
      virtualScrollerRef.value.refresh()
    } else {
      componentKey.value++
    }
  })
})

onDeactivated(() => {
  galleryActive.value = false
  gallerySliderControl.value.visible = false
  hoverPreviewRef.value?.hide()
  hoverPreviewItem.value = undefined
  invalidateJxlPreviewCache()
  for (const state of [displayImageSources, imageLoadStates, imageErrorStates]) {
    for (const key of Object.keys(state)) delete state[key]
  }
})

onBeforeMount(async () => {
  window.electron.ipcRendererOn(UPDATE_GALLERY, updateGalleryHandler)
  updateGallery()
  document.addEventListener('keydown', handleDetectShiftKey)
  document.addEventListener('keyup', handleDetectShiftKey)
  document.addEventListener('click', handleOutsideClick)
})

onBeforeUnmount(() => {
  galleryDisposed = true
  galleryRefreshVersion++
  galleryActive.value = false
  invalidateJxlPreviewCache()
  window.electron.ipcRendererRemoveAllListeners(UPDATE_GALLERY)
  document.removeEventListener('click', handleOutsideClick)
  document.removeEventListener('keydown', handleDetectShiftKey)
  document.removeEventListener('keyup', handleDetectShiftKey)
})
</script>
