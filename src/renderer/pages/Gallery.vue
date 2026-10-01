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
              type="range"
              min="1"
              max="15"
              step="1"
              class="grid-slider h-[4px] w-[70px] cursor-pointer appearance-none rounded-[2px] bg-(--color-background-tertiary) outline-none [&::-moz-range-thumb]:h-[14px] [&::-moz-range-thumb]:w-[14px] [&::-moz-range-thumb]:rounded-full [&::-moz-range-thumb]:border-none [&::-moz-range-thumb]:bg-accent [&::-moz-range-thumb]:transition-all [&::-moz-range-thumb]:duration-200 [&::-webkit-slider-thumb]:h-[15px] [&::-webkit-slider-thumb]:w-[15px] [&::-webkit-slider-thumb]:appearance-none [&::-webkit-slider-thumb]:rounded-full [&::-webkit-slider-thumb]:bg-accent [&::-webkit-slider-thumb]:transition-all [&::-webkit-slider-thumb]:duration-200 hover:[&::-webkit-slider-thumb]:scale-110 hover:[&::-webkit-slider-thumb]:shadow-[0_0_0_2px_rgba(var(--color-accent-rgb),0.4)]"
              :title="t('pages.gallery.gridSize')"
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
              @change="handleIsAlwaysForceReload"
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
              @change="handleDeleteCloudFile"
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
          <div class="filter-group">
            <MultiSelect
              v-model:choosed="choosedPicBed"
              :title="t('pages.gallery.picBedType')"
              :zero-placeholder="t('pages.gallery.chooseShowedPicBed')"
              :all-list="filteredPicBedG"
            />
          </div>

          <div class="filter-group">
            <label class="mb-0 text-sm leading-[1.4] font-semibold text-secondary">{{
              t('pages.gallery.dateRange')
            }}</label>
            <div class="flex w-full flex-wrap items-center gap-2 max-md:items-start">
              <input
                v-model="dateRangeStart"
                type="date"
                class="date-input"
                :aria-label="t('pages.gallery.dateRangeStart')"
              />
              <span class="shrink-0 font-medium text-secondary">-</span>
              <input
                v-model="dateRangeEnd"
                type="date"
                class="date-input"
                :aria-label="t('pages.gallery.dateRangeEnd')"
              />
            </div>
          </div>

          <div class="filter-group">
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

          <div class="filter-group">
            <SingleSelect
              v-model="useShortUrl"
              :title="t('pages.gallery.urlType')"
              :placeholder="t(`pages.gallery.${useShortUrl}`)"
              :fronticon="false"
              :key-list="shortURLList"
            >
              <template #item="{ item }">
                {{ t(`pages.gallery.${item}`) }}
              </template>
            </SingleSelect>
          </div>

          <div class="filter-group">
            <SingleSelect
              :model-value="currentSortField"
              :placeholder="t(`pages.gallery.sortBy.${currentSortField}`)"
              :title="t('pages.gallery.sort')"
              :key-list="['name', 'ext', 'time', 'provider', 'check']"
              @change="field => sortFile(field as GallerySortField)"
            >
              <template #item="{ item }">
                {{ t(`pages.gallery.sortBy.${item}`) }}
              </template>
            </SingleSelect>
          </div>
        </div>

        <!-- Second Row - Search and Actions -->
        <div class="mb-1 flex w-full flex-wrap items-start gap-3">
          <div class="relative flex min-w-[100px] flex-row items-center gap-2">
            <SearchIcon :size="16" class="absolute left-3 z-1 text-secondary" />
            <input
              v-model="searchText"
              type="text"
              class="search-input"
              :placeholder="$t('pages.gallery.searchFilename')"
              :aria-label="t('pages.gallery.searchFilename')"
            />
            <button v-if="searchText" class="clear-button" :aria-label="t('common.clear')" @click="cleanSearch">
              <XIcon :size="15" />
            </button>
          </div>

          <div class="relative flex min-w-[100px] flex-row items-center gap-2">
            <LinkIcon :size="16" class="absolute left-3 z-1 text-secondary" />
            <input
              v-model="searchTextURL"
              type="text"
              class="search-input"
              :placeholder="t('pages.gallery.searchUrl')"
              :aria-label="t('pages.gallery.searchUrl')"
            />
            <button v-if="searchTextURL" class="clear-button" :aria-label="t('common.clear')" @click="cleanSearchUrl">
              <XIcon :size="14" />
            </button>
          </div>

          <div class="flex flex-1 flex-wrap gap-3">
            <button
              class="action-btn copy-btn"
              :disabled="!selectedCount"
              :class="{ active: isMultiple(choosedList) }"
              @click="multiCopy"
            >
              <ClipboardIcon :size="16" />
              <span> {{ t('pages.gallery.copy') }}</span>
            </button>
            <button
              class="action-btn edit-btn"
              :disabled="!filterList.length"
              :class="{ active: filterList.length > 0 }"
              @click="openBatchRename"
            >
              <EditIcon :size="16" />
              <span> {{ t('pages.gallery.edit') }}</span>
            </button>
            <button
              class="action-btn delete-btn"
              :disabled="!selectedCount"
              :class="{ active: isMultiple(choosedList) }"
              @click="multiRemove"
            >
              <TrashIcon :size="16" />
              <span> {{ `${t('pages.gallery.delete')}${selectedCount > 0 ? ` (${selectedCount})` : ''}` }}</span>
            </button>
            <button
              class="action-btn select-btn"
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
          :is-selected="item => !!choosedList[item.id]"
          :sort-field="currentSortField"
          :sort-ascending="sortAscending"
          @select="(item, selected) => (choosedList[item.id] = selected)"
          @select-all="setAllSelected"
          @sort="field => sortFile(field as GallerySortField)"
          @open="(_, index) => zoomImage(index)"
          @preview="showHoverPreview"
          @preview-end="hoverPreviewRef?.scheduleHide()"
          @visible-indexes-change="handleVisibleIndexesChange"
        >
          <template #actions="{ item, index, tabindex }">
            <button
              type="button"
              :tabindex="tabindex"
              :title="t('common.fileTable.open')"
              :aria-label="t('common.fileTable.open')"
              @click="zoomImage(index)"
            >
              <ImageIcon :size="16" />
            </button>
            <button
              type="button"
              :tabindex="tabindex"
              :title="t('pages.gallery.copy')"
              :aria-label="t('pages.gallery.copy')"
              @click="copy(item)"
            >
              <ClipboardIcon :size="16" />
            </button>
            <button
              type="button"
              :tabindex="tabindex"
              :title="t('pages.gallery.edit')"
              :aria-label="t('pages.gallery.edit')"
              @click="openDialog(item)"
            >
              <EditIcon :size="16" />
            </button>
            <button
              type="button"
              :tabindex="tabindex"
              :title="t('pages.gallery.delete')"
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
                  class="mb-1.5 w-full truncate text-center text-sm font-medium text-main"
                  :title="(item.fileName || '').toString().length > 30 ? item.fileName || '' : ''"
                >
                  {{ formatFileName(item.fileName || '') }}
                </div>

                <div class="mr-2 flex items-center justify-between">
                  <div class="flex flex-1 justify-center gap-2">
                    <button :title="t('pages.gallery.copy')" class="icon-button copy-icon" @click.stop="copy(item)">
                      <ClipboardIcon :size="16" />
                    </button>
                    <button
                      :title="t('pages.gallery.edit')"
                      class="icon-button edit-icon"
                      @click.stop="openDialog(item)"
                    >
                      <EditIcon :size="16" />
                    </button>
                    <button
                      :title="t('pages.gallery.delete')"
                      class="icon-button delete-icon"
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
    <CustomModal v-model:visible="dialogVisible" height="auto" width="40%" :title="t('pages.gallery.changeImageUrl')">
      <div class="p-2">
        <input
          v-model="imgInfo.imgUrl"
          type="text"
          class="form-input"
          :aria-label="t('pages.gallery.changeImageUrl')"
        />
      </div>
      <template #footer>
        <CustomButton type="secondary" :text="t('common.cancel')" @click="dialogVisible = false" />
        <CustomButton :text="t('common.confirm')" @click="confirmModify" />
      </template>
    </CustomModal>

    <!-- Batch Rename Modal -->
    <CustomModal
      v-model:visible="isShowBatchRenameDialog"
      height="auto"
      width="700px"
      :title="t('pages.gallery.batchEditUrl')"
    >
      <div class="p-6">
        <p class="mb-4 text-sm text-secondary">{{ t('common.bulk.selectionHint') }}</p>
        <div class="mb-6 last:mb-0">
          <label class="mb-2 flex items-center gap-2 text-sm font-medium text-main">
            {{ t('pages.gallery.regexPattern', { matched: matchedCount || 0 }) }}
          </label>
          <input
            v-model="batchRenameMatch"
            type="text"
            class="form-input"
            :placeholder="t('pages.gallery.regexPatternPlaceholder')"
            @focus="showMatchedUrls = true"
            @blur="showMatchedUrls = false"
          />
          <div
            v-if="showMatchedUrls && matchedUrls.length > 0"
            class="absolute z-1000 mt-2 max-h-[300px] max-w-[650px] overflow-hidden rounded-md border border-border-secondary bg-bg-tertiary p-0 shadow-md"
          >
            <div class="border-b border-b-border-secondary bg-bg-secondary px-4 py-3 text-sm font-semibold text-main">
              Matched URLs ({{ matchedUrls.length }}):
            </div>
            <div class="max-h-[240px] overflow-auto p-2">
              <div
                v-for="(url, index) in matchedUrls"
                :key="index"
                class="rounded-sm px-3 py-2 font-['SF_Mono',Monaco,'Cascadia_Code','Roboto_Mono',Consolas,'Courier_New',monospace] text-sm break-all text-secondary transition-all duration-fast ease-apple hover:bg-surface-elevated"
              >
                {{ url }}
              </div>
            </div>
          </div>
        </div>

        <div class="mb-6 last:mb-0">
          <label class="mb-2 flex items-center gap-2 text-sm font-medium text-main">
            {{ t('pages.gallery.replacedWith') }}
            <button
              class="flex h-[20px] w-[20px] cursor-pointer items-center justify-around rounded-full border-none bg-accent text-white transition-all duration-fast ease-apple hover:bg-accent-hover"
              @click="showFormatInfo = !showFormatInfo"
            >
              <InfoIcon :size="16" />
            </button>
          </label>
          <input v-model="batchRenameReplace" type="text" class="form-input" placeholder="Ex. {Y}-{m}-{uuid}" />
        </div>

        <!-- Format Info Panel -->
        <div v-if="showFormatInfo" class="mb-6 last:mb-0">
          <label>{{ t('pages.settings.upload.availablePlaceholders') }}</label>
          <PlaceholderTable :list="advancedRenameList" :title-list="advancedRenameTitleList" />
        </div>
      </div>
      <template #footer>
        <CustomButton type="secondary" :text="t('common.cancel')" @click="isShowBatchRenameDialog = false" />
        <CustomButton
          :text="t('common.bulk.preview')"
          :disabled="bulkChanges.building.value"
          @click="handleBatchRename"
        />
      </template>
    </CustomModal>

    <BulkChangePreview :workflow="bulkChanges" />
  </div>
</template>

<script lang="ts" setup>
import {
  CheckSquareIcon,
  ChevronDownIcon,
  ChevronUpIcon,
  ClipboardIcon,
  EditIcon,
  GridIcon,
  ImageIcon,
  ImagesIcon,
  InfoIcon,
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
  reactive,
  ref,
  shallowRef,
  useId,
  useTemplateRef,
  watch,
} from 'vue'
import { useI18n } from 'vue-i18n'
import { onBeforeRouteUpdate } from 'vue-router'

import BulkChangePreview from '@/components/BulkChangePreview.vue'
import CustomButton from '@/components/common/CustomButton.vue'
import CustomModal from '@/components/common/CustomModal.vue'
import CustomSwitch from '@/components/common/CustomSwitch.vue'
import MultiSelect from '@/components/common/MultiSelect.vue'
import PlaceholderTable from '@/components/common/PlaceholderTable.vue'
import SingleSelect from '@/components/common/SingleSelect.vue'
import FileCollection from '@/components/FileCollection.vue'
import FileViewControls from '@/components/FileViewControls.vue'
import GalleryHoverPreview from '@/components/GalleryHoverPreview.vue'
import ImagePreview from '@/components/ImagePreview.vue'
import { useBulkChanges } from '@/composables/useBulkChanges'
import useConfirm from '@/composables/useConfirm'
import { usePicBed } from '@/composables/useGlobal'
import useMessage from '@/composables/useMessage'
import { customStrReplace } from '@/manage/utils/fileName'
import { getConfig, saveConfig } from '@/services/configService'
import $$db from '@/services/galleryDatabase'
import ALLApi from '@/services/galleryDeletionService'
import { configPaths } from '@/utils/configPaths'
import { compareFileValues, type FileColumn, fileDate, fileType, formatCollectionDate } from '@/utils/fileCollection'
import { prepareGalleryItems } from '@/utils/galleryItems'
import { getGalleryPreviewSource, getJxlPreviewSource } from '@/utils/galleryPreview'
import { PreviewCache } from '@/utils/previewCache'
import { picBedsCanbeDeleted } from '@/utils/static'
import { IPasteStyle } from '#/constants/app'
import { IRPCActionType } from '#/constants/rpcActions'
import { getRawData } from '#/utils/rawData'
import { customStrMatch } from '#/utils/strings'
import { addCacheBustParam as withCacheBustParam } from '#/utils/url'

type IResult<T> = T & {
  id: string
  createdAt: number
  updatedAt: number
}

const { t } = useI18n()
const message = useMessage()
const { confirm } = useConfirm()
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
const dialogVisible = ref(false)
const imgInfo = reactive({
  id: '',
  imgUrl: '',
})
const choosedList: IObjT<boolean> = reactive({})
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
const isShowBatchRenameDialog = ref(false)
const bulkChanges = useBulkChanges(async () => {
  if (!(await updateGallery())) throw new Error('Gallery refresh failed')
})
const batchRenameMatch = ref('')
const batchRenameReplace = ref('')
const dateRangeStart = ref('')
const dateRangeEnd = ref('')
const picBedDropdownOpen = ref(false)
const sortDropdownOpen = ref(false)
const showFormatInfo = ref(false)
const showMatchedUrls = ref(false)
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

const advancedRenameTitleList = computed(() => ({
  categoryTime: t('pages.settings.upload.placeholder.categoryTime'),
  categoryHash: t('pages.settings.upload.placeholder.categoryHash'),
  categoryFile: t('pages.settings.upload.placeholder.categoryFile'),
}))

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
    { label: t('pages.settings.upload.placeholder.randomString'), value: '{str-n}' },
  ],
}))
let searchDebounceTimer: ReturnType<typeof setTimeout> | null = null
let searchURLDebounceTimer: ReturnType<typeof setTimeout> | null = null

const effectiveGridBreakpoints = computed(() => {
  return Array.from({ length: userGridColumns.value }, (_, index) => ({ min: index * 180, cols: index + 1 }))
})

const tableColumns = computed<FileColumn[]>(() => [
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

const bulkGalleryCandidates = computed(() => {
  const selected = filterList.value.filter(item => choosedList[item.id!])
  return selected.length ? selected : filterList.value
})

const matchedCount = computed(() => {
  const matches = bulkGalleryCandidates.value.filter((item: any) => {
    return customStrMatch(item.imgUrl, batchRenameMatch.value)
  })
  return matches.length
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

const matchedUrls = computed(() => {
  const matches = bulkGalleryCandidates.value.filter((item: any) => {
    return customStrMatch(item.imgUrl, batchRenameMatch.value)
  })
  return matches.map((item: any) => item.imgUrl || '').filter(Boolean)
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
  if (searchDebounceTimer) clearTimeout(searchDebounceTimer)
  searchDebounceTimer = setTimeout(() => {
    debouncedSearchText.value = newVal
    nextTick(() => {
      virtualScrollerRef.value?.scrollToTop()
    })
  }, 300)
})

watch(searchTextURL, newVal => {
  if (searchURLDebounceTimer) clearTimeout(searchURLDebounceTimer)
  searchURLDebounceTimer = setTimeout(() => {
    debouncedSearchTextURL.value = newVal
    nextTick(() => {
      virtualScrollerRef.value?.scrollToTop()
    })
  }, 300)
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
    isAlwaysForceReload.value = settingConfig.isAlwaysForceReload || false
    deleteCloud.value = settingConfig.deleteCloudFile || false
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

async function copy(item: ImgInfo) {
  let result: [string, string] | undefined
  try {
    result = await window.electron.triggerRPC<[string, string]>(IRPCActionType.GALLERY_PASTE_TEXT, getRawData(item))
    if (!result?.[0]?.trim()) throw new Error('Missing gallery link')
  } catch {
    message.error(t('pages.gallery.copyLinkFailed'))
    return
  }
  message.success(t('pages.gallery.copyLinkSucceed'))
  if (result[1] && item.id) {
    try {
      if (await $$db.updateById(item.id, { shortUrl: result[1] })) await updateGallery()
    } catch {
      // Copy has already succeeded; retaining a short URL is optional caching.
    }
  }
}

async function remove(item: ImgInfo, _: number) {
  if (!item.id) return

  try {
    const confirmed = await confirm({
      title: t('pages.gallery.notice'),
      message: t('pages.gallery.confirmRemove'),
      type: 'warning',
      confirmButtonText: t('common.confirm'),
      cancelButtonText: t('common.cancel'),
      center: true,
    })
    if (!confirmed) return
    const file = await $$db.getById<ImgInfo>(item.id!)
    if (!file) {
      delete choosedList[item.id]
      await updateGallery()
      return
    }
    const isNeedDeleteCloudFile =
      (await getConfig(configPaths.settings.deleteCloudFile)) &&
      picBedsCanbeDeleted.includes(file.type || 'placeholder')
    if (isNeedDeleteCloudFile) {
      let deleted = false
      try {
        deleted = await ALLApi.delete(getRawData(file))
      } catch {
        // A failed cloud request must leave the local record available for retry.
      }
      if (!deleted) {
        message.error(`${item.fileName} ${t('pages.gallery.cloudDeleteFailed')}`)
        return
      }
    }
    await $$db.removeById(item.id!)
    delete choosedList[item.id]
    window.electron.sendRPC(IRPCActionType.GALLERY_REMOVE_RUN_SCRIPTS, getRawData(item))
    const args = getRawData(file)
    window.electron.sendRPC(IRPCActionType.GALLERY_REMOVE_FILES, [args])
    await updateGallery()
    nextTick(() => {
      virtualScrollerRef.value?.refresh()
    })
    message.success(
      isNeedDeleteCloudFile
        ? `${item.fileName} ${t('pages.gallery.cloudDeleteSucceed')}`
        : t('pages.gallery.operationSucceed'),
    )
  } catch {
    message.error(t('pages.gallery.operationFailed'))
  }
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

function openDialog(item: ImgInfo) {
  imgInfo.id = item.id!
  imgInfo.imgUrl = item.imgUrl as string
  dialogVisible.value = true
}

async function confirmModify() {
  try {
    if (!(await $$db.updateById(imgInfo.id, { imgUrl: imgInfo.imgUrl }))) {
      message.error(t('pages.gallery.operationFailed'))
      return
    }
  } catch {
    message.error(t('pages.gallery.operationFailed'))
    return
  }
  message.success(t('pages.gallery.operationSucceed'))
  dialogVisible.value = false
  await updateGallery()
  nextTick(() => {
    virtualScrollerRef.value?.refresh()
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

async function multiRemove() {
  const imageIDList = Object.keys(choosedList).filter(id => choosedList[id])
  if (!imageIDList.length) return

  try {
    const confirmed = await confirm({
      title: t('pages.gallery.notice'),
      message: t('pages.gallery.confirmRemove'),
      type: 'warning',
      confirmButtonText: t('common.confirm'),
      cancelButtonText: t('common.cancel'),
      center: true,
    })
    if (!confirmed) return
    const files: IResult<ImgInfo>[] = []
    let failedCount = 0
    const isDeleteCloudFile = await getConfig(configPaths.settings.deleteCloudFile)
    for (const key of imageIDList) {
      let file: IResult<ImgInfo> | undefined
      try {
        file = await $$db.getById<ImgInfo>(key)
        if (!file) {
          delete choosedList[key]
          continue
        }
        const isNeedDeleteCloudFile = isDeleteCloudFile && picBedsCanbeDeleted.includes(file.type || 'placeholder')
        if (isNeedDeleteCloudFile && !(await ALLApi.delete(file))) {
          failedCount++
          continue
        }
        await $$db.removeById(key)
      } catch {
        failedCount++
        continue
      }
      files.push(file)
      delete choosedList[key]
      window.electron.sendRPC(IRPCActionType.GALLERY_REMOVE_RUN_SCRIPTS, getRawData(file))
    }

    if (files.length) {
      window.electron.sendRPC(IRPCActionType.GALLERY_REMOVE_FILES, getRawData(files))
    }
    await updateGallery()
    nextTick(() => {
      virtualScrollerRef.value?.refresh()
    })
    const summary = t('pages.gallery.removeSummary', { removed: files.length, failed: failedCount })
    if (failedCount && files.length) {
      message.warning(summary)
    } else if (failedCount) {
      message.error(summary)
    } else if (files.length) {
      message.success(summary)
    } else {
      message.info(summary)
    }
  } catch {
    message.error(t('pages.gallery.operationFailed'))
  }
}

async function multiCopy() {
  if (Object.values(choosedList).some(item => item)) {
    const copyString: string[] = []
    const shortUrls: { id: string; shortUrl: string }[] = []
    const imageIDList = Object.keys(choosedList).filter(id => choosedList[id])
    try {
      for (const imageIDListItem of imageIDList) {
        const item = await $$db.getById<ImgInfo>(imageIDListItem)
        if (item) {
          const result = await window.electron.triggerRPC<[string, string]>(
            IRPCActionType.GALLERY_PASTE_TEXT,
            getRawData(item),
            false,
          )
          if (!result?.[0]?.trim()) {
            message.error(t('pages.gallery.copyLinkFailed'))
            return
          }
          copyString.push(result[0])
          if (result[1] && item.id) shortUrls.push({ id: item.id, shortUrl: result[1] })
        }
      }
      if (!copyString.length) {
        message.error(t('pages.gallery.copyLinkFailed'))
        return
      }
      window.electron.clipboard.writeText(copyString.join('\n'))
    } catch {
      message.error(t('pages.gallery.copyLinkFailed'))
      return
    }
    for (const id of imageIDList) delete choosedList[id]
    message.success(t('pages.gallery.copyLinkSucceed'))
    let galleryChanged = false
    for (const { id, shortUrl } of shortUrls) {
      try {
        if (await $$db.updateById(id, { shortUrl })) galleryChanged = true
      } catch {
        // Cache failures do not invalidate the clipboard contents.
      }
    }
    if (galleryChanged) await updateGallery()
  }
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

function openBatchRename() {
  if (!bulkChanges.reopen() && !bulkChanges.building.value) isShowBatchRenameDialog.value = true
}

async function handleBatchRename() {
  if (bulkChanges.building.value) return
  if (!batchRenameMatch.value) {
    message.warning(t('pages.gallery.inputRegexTip'))
    return
  }
  try {
    new RegExp(batchRenameMatch.value, 'ug')
  } catch {
    message.error(t('common.bulk.invalidPattern'))
    return
  }
  const items = bulkGalleryCandidates.value
    .filter(item => customStrMatch(item.imgUrl || '', batchRenameMatch.value))
    .map((item, index) => ({
      id: item.id!,
      source: item.imgUrl!,
      target: customStrReplace(item.imgUrl!, batchRenameMatch.value, batchRenameReplace.value).replaceAll(
        '{auto}',
        String(index + 1),
      ),
    }))
  if (!items.length) {
    message.warning(t('pages.gallery.noMatch'))
    return
  }
  if (await bulkChanges.preview(IRPCActionType.BULK_PREVIEW_GALLERY_URL, items)) {
    isShowBatchRenameDialog.value = false
  } else {
    message.error(bulkChanges.error.value)
  }
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
  window.electron.ipcRendererOn('updateGallery', updateGalleryHandler)
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
  window.electron.ipcRendererRemoveAllListeners('updateGallery')
  document.removeEventListener('click', handleOutsideClick)
  document.removeEventListener('keydown', handleDetectShiftKey)
  document.removeEventListener('keyup', handleDetectShiftKey)

  // Clear timers
  if (searchDebounceTimer) clearTimeout(searchDebounceTimer)
  if (searchURLDebounceTimer) clearTimeout(searchURLDebounceTimer)
})
</script>

<script lang="ts">
export default {
  name: 'GalleryPage',
}
</script>

<style scoped src="./Gallery.css"></style>
