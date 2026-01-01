<template>
  <div class="gallery-container">
    <!-- Header Card -->
    <div class="gallery-card header-card">
      <div class="card-header">
        <div class="header-content">
          <div class="header-icon">
            <ImagesIcon :size="24" />
          </div>
          <div>
            <h1>{{ t('pages.gallery.title') }}</h1>
            <p>{{ filterList.length }} {{ t('pages.gallery.images') }}</p>
          </div>
        </div>
        <div class="header-actions">
          <div class="grid-size-control">
            <GridIcon :size="14" />
            <input
              v-model.number="userGridColumns"
              type="range"
              min="1"
              max="15"
              step="1"
              class="grid-slider"
              :title="t('pages.gallery.gridSize')"
            />
          </div>
          <div class="sync-delete-toggle">
            <span class="toggle-label">{{ t('pages.gallery.isAlwaysForceReload') }}</span>
            <label class="custom-switch">
              <input v-model="isAlwaysForceReload" type="checkbox" @change="handleIsAlwaysForceReload" />
              <span class="switch-slider" />
            </label>
          </div>
          <div class="sync-delete-toggle">
            <span class="toggle-label">{{ t('pages.gallery.syncDelete') }}</span>
            <label class="custom-switch">
              <input v-model="deleteCloud" type="checkbox" @change="handleDeleteCloudFile" />
              <span class="switch-slider" />
            </label>
          </div>
          <button class="action-button view-mode-toggle" :title="getViewModeLabel()" @click="toggleViewMode">
            <component :is="getViewModeIcon()" :size="16" />
            {{ getViewModeLabel() }}
          </button>
          <button class="action-button" @click="toggleHandleBar">
            <ChevronDownIcon v-if="!handleBarActive" :size="16" />
            <ChevronUpIcon v-else :size="16" />
            {{ handleBarActive ? t('pages.gallery.hideFilters') : t('pages.gallery.showFilters') }}
          </button>
          <button class="action-button" @click="refreshPage">
            <RefreshCwIcon :size="16" />
            {{ t('pages.gallery.refresh') }}
          </button>
        </div>
      </div>
    </div>

    <!-- Filter Controls Card -->
    <transition name="filter-slide">
      <div v-show="handleBarActive" class="gallery-card filter-card">
        <div class="filter-content">
          <div class="filter-row">
            <div class="filter-group">
              <label class="filter-label">{{ t('pages.gallery.picBedType') }}</label>
              <div class="custom-multiselect">
                <button
                  class="multiselect-trigger"
                  :class="{ active: picBedDropdownOpen }"
                  @click="togglePicBedDropdown($event)"
                >
                  <span v-if="choosedPicBed.length === 0">{{ t('pages.gallery.chooseShowedPicBed') }}</span>
                  <span v-else>{{ choosedPicBed.length }} {{ t('pages.gallery.selected') }}</span>
                  <ChevronDownIcon :size="16" />
                </button>
                <div v-show="picBedDropdownOpen" class="multiselect-dropdown">
                  <label v-for="item in picBedGlobal" :key="item.type" class="multiselect-option">
                    <input v-model="choosedPicBed" type="checkbox" :value="item.type" />
                    {{ item.name }}
                  </label>
                </div>
              </div>
            </div>

            <div class="filter-group">
              <label class="filter-label">{{ t('pages.gallery.dateRange') }}</label>
              <div class="date-range-picker">
                <input v-model="dateRangeStart" type="date" class="date-input" placeholder="Start date" />
                <span class="date-separator">-</span>
                <input v-model="dateRangeEnd" type="date" class="date-input" placeholder="End date" />
              </div>
            </div>

            <div class="filter-group">
              <label class="filter-label">{{ t('pages.gallery.pasteFormat') }}</label>
              <select v-model="pasteStyle" class="custom-select" @change="handlePasteStyleChange">
                <option v-for="(value, key) in pasteStyleMap" :key="key" :value="value">
                  {{ key }}
                </option>
              </select>
            </div>

            <div class="filter-group">
              <label class="filter-label">{{ t('pages.gallery.urlType') }}</label>
              <select v-model="useShortUrl" class="custom-select" @change="handleUseShortUrlChange">
                <option v-for="(value, key) in shortURLMap" :key="key" :value="value">
                  {{ key }}
                </option>
              </select>
            </div>

            <div class="filter-group">
              <label class="filter-label">{{ t('pages.gallery.sort') }}</label>
              <div class="sort-dropdown">
                <button class="sort-button" :class="{ active: sortDropdownOpen }" @click="toggleSortDropdown($event)">
                  <SortAscIcon :size="14" />
                  {{ t(`pages.gallery.sortBy.${currentSortField}`) }}
                  <ChevronDownIcon :size="14" />
                </button>
                <div v-show="sortDropdownOpen" class="sort-options">
                  <button
                    v-for="key in ['name', 'ext', 'time', 'check']"
                    :key="key"
                    class="sort-option"
                    @click="sortFile(key as any)"
                  >
                    {{ t(`pages.gallery.sortBy.${key}`) }}
                  </button>
                </div>
              </div>
            </div>
          </div>

          <!-- Second Row - Search and Actions -->
          <div class="filter-row">
            <div class="search-group">
              <div class="search-input-wrapper">
                <SearchIcon :size="16" class="search-icon" />
                <input
                  v-model="searchText"
                  type="text"
                  class="search-input"
                  :placeholder="$t('pages.gallery.searchFilename')"
                />
                <button v-if="searchText" class="clear-button" @click="cleanSearch">
                  <XIcon :size="14" />
                </button>
              </div>
            </div>

            <div class="search-group">
              <div class="search-input-wrapper">
                <LinkIcon :size="16" class="search-icon" />
                <input
                  v-model="searchTextURL"
                  type="text"
                  class="search-input"
                  :placeholder="t('pages.gallery.searchUrl')"
                />
                <button v-if="searchTextURL" class="clear-button" @click="cleanSearchUrl">
                  <XIcon :size="14" />
                </button>
              </div>
            </div>

            <div class="action-buttons">
              <button class="action-btn copy-btn" :class="{ active: isMultiple(choosedList) }" @click="multiCopy">
                <ClipboardIcon :size="16" />
                {{ t('pages.gallery.copy') }}
              </button>
              <button
                class="action-btn edit-btn"
                :class="{ active: filterList.length > 0 }"
                @click="() => (isShowBatchRenameDialog = true)"
              >
                <EditIcon :size="16" />
                {{ t('pages.gallery.edit') }}
              </button>
              <button class="action-btn delete-btn" :class="{ active: isMultiple(choosedList) }" @click="multiRemove">
                <TrashIcon :size="16" />
                {{ t('pages.gallery.delete') }}
              </button>
              <button class="action-btn select-btn" :class="{ active: filterList.length > 0 }" @click="toggleSelectAll">
                <CheckSquareIcon :size="16" />
                {{ isAllSelected ? t('pages.gallery.cancel') : t('pages.gallery.selectAll') }}
              </button>
            </div>
          </div>
        </div>
      </div>
    </transition>

    <!-- Gallery Grid -->
    <div class="gallery-card gallery-content">
      <div v-if="filterList.length === 0" class="empty-state">
        <ImageIcon :size="64" class="empty-icon" />
        <h3>{{ t('pages.gallery.noImagesFound') }}</h3>
        <p>{{ t('pages.gallery.tryAdjustingFilters') }}</p>
      </div>

      <VirtualScroller
        v-else
        :key="componentKey"
        ref="virtualScrollerRef"
        v-model:view-mode="viewMode"
        class="virtual-gallery-scroller"
        :items="filterList"
        :item-height="itemHeight"
        :grid-items="4"
        :grid-breakpoints="effectiveGridBreakpoints"
        key-field="key"
        :page-mode="true"
        :buffer-factor="0.5"
        :item-padding="8"
      >
        <template #default="{ item, index }">
          <div class="gallery-item" :class="{ selected: choosedList[item.id || ''] }">
            <div class="image-container" @click="zoomImage(index)">
              <img
                :src="
                  imageErrorStates[item.key || '']
                    ? './errorLoading.png'
                    : isAlwaysForceReload
                      ? addCacheBustParam(item.src)
                      : item.src
                "
                class="gallery-image"
                :class="{ loading: !imageLoadStates[item.key || ''] }"
                @load="onImageLoad(item.key || '')"
                @error="onImageError(item.key || '')"
              />
              <div v-if="!imageLoadStates[item.key || '']" class="image-loader">
                <div class="loader-spinner" />
              </div>
            </div>

            <div class="image-info">
              <div class="image-name" :title="item.fileName">
                {{ formatFileName(item.fileName || '') }}
              </div>

              <div class="image-actions">
                <div class="action-icons">
                  <button :title="t('pages.gallery.copy')" class="icon-button copy-icon" @click.stop="copy(item)">
                    <ClipboardIcon :size="16" />
                  </button>
                  <button :title="t('pages.gallery.edit')" class="icon-button edit-icon" @click.stop="openDialog(item)">
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

                <label class="custom-checkbox">
                  <input
                    v-model="choosedList[item.id ? item.id : '']"
                    type="checkbox"
                    @change="e => handleChooseImage((e.target as HTMLInputElement).checked, index)"
                  />
                  <span class="checkbox-mark" />
                </label>
              </div>
            </div>
          </div>
        </template>
      </VirtualScroller>
    </div>

    <!-- Custom Image Preview Modal -->
    <transition name="modal">
      <div
        v-if="gallerySliderControl.visible"
        class="image-preview-modal"
        tabindex="0"
        @click.stop
        @wheel="handleImageWheel"
        @keydown="handleKeydown"
      >
        <div class="modal-backdrop" />
        <div class="modal-content">
          <button class="modal-close" @click="handleClose">
            <XIcon :size="24" />
          </button>

          <!-- Zoom controls -->
          <div class="zoom-controls">
            <button class="zoom-btn" :disabled="imagePreviewState.scale <= 0.1" @click="zoomOut">
              <span>-</span>
            </button>
            <span class="zoom-level">{{ Math.round(imagePreviewState.scale * 100) }}%</span>
            <button class="zoom-btn" :disabled="imagePreviewState.scale >= 5" @click="zoomIn">
              <span>+</span>
            </button>
            <button class="zoom-btn reset-btn" @click="resetImageTransform">Reset</button>
          </div>

          <div class="image-navigation">
            <button
              class="nav-button prev"
              :disabled="gallerySliderControl.index === 0"
              @click.stop="navigateImage(-1)"
            >
              <ChevronLeftIcon :size="24" />
            </button>

            <div
              class="image-viewer"
              @mousedown="handleImageMouseDown"
              @mousemove="handleImageMouseMove"
              @mouseup="handleImageMouseUp"
              @mouseleave="handleImageMouseUp"
              @touchstart="handleImageTouchStart"
              @touchmove="handleImageTouchMove"
              @touchend="handleImageTouchEnd"
            >
              <img
                ref="previewImageRef"
                :src="currentPreviewImage?.src"
                :alt="currentPreviewImage?.intro"
                class="preview-image"
                :style="imageTransformStyle"
                @load="onPreviewImageLoad"
                @dragstart.prevent
                @contextmenu.prevent
              />
            </div>

            <button
              class="nav-button next"
              :disabled="gallerySliderControl.index === filterList.length - 1"
              @click.stop="navigateImage(1)"
            >
              <ChevronRightIcon :size="24" />
            </button>
          </div>

          <div class="image-details">
            <h3>{{ currentPreviewImage?.intro }}</h3>
            <div class="image-counter">{{ gallerySliderControl.index + 1 }} / {{ filterList.length }}</div>
            <div class="image-help-text">
              {{ t('pages.gallery.previewHelp') }}
            </div>
          </div>
        </div>
      </div>
    </transition>

    <!-- Edit URL Modal -->
    <transition name="modal">
      <div v-if="dialogVisible" class="modal-overlay" @click="dialogVisible = false">
        <div class="modal-container" @click.stop>
          <div class="modal-header">
            <h3>{{ t('pages.gallery.changeImageUrl') }}</h3>
            <button class="modal-close-btn" @click="dialogVisible = false">
              <XIcon :size="20" />
            </button>
          </div>
          <div class="modal-body">
            <input v-model="imgInfo.imgUrl" type="text" class="form-input" placeholder="Enter new URL" />
          </div>
          <div class="modal-footer">
            <button class="btn-secondary" @click="dialogVisible = false">
              {{ t('common.cancel') }}
            </button>
            <button class="btn-primary" @click="confirmModify">
              {{ t('common.confirm') }}
            </button>
          </div>
        </div>
      </div>
    </transition>

    <!-- Batch Rename Modal -->
    <transition name="modal">
      <div v-if="isShowBatchRenameDialog" class="modal-overlay" @click="isShowBatchRenameDialog = false">
        <div class="modal-container large" @click.stop>
          <div class="modal-header">
            <h3>{{ t('pages.gallery.batchEditUrl') }}</h3>
            <button class="modal-close-btn" @click="isShowBatchRenameDialog = false">
              <XIcon :size="20" />
            </button>
          </div>
          <div class="modal-body">
            <div class="form-group">
              <label class="form-label">
                {{ t('pages.gallery.regexPattern', { matched: matchedCount || 0 }) }}
              </label>
              <input
                v-model="batchRenameMatch"
                type="text"
                class="form-input"
                :placeholder="t('pages.gallery.regexPatternPlaceholder')"
              />
            </div>

            <div class="form-group">
              <label class="form-label">
                {{ t('pages.gallery.replacedWith') }}
                <button class="info-button" @click="showFormatInfo = !showFormatInfo">
                  <InfoIcon :size="16" />
                </button>
              </label>
              <input v-model="batchRenameReplace" type="text" class="form-input" placeholder="Ex. {Y}-{m}-{uuid}" />
            </div>

            <!-- Format Info Panel -->
            <div v-if="showFormatInfo" class="form-group">
              <label>{{ t('pages.settings.upload.availablePlaceholders') }}</label>
              <div class="placeholder-help">
                <div class="placeholder-category">
                  <div class="category-title">
                    {{ t('pages.settings.upload.placeholder.categoryTime') }}
                  </div>
                  <div class="placeholder-grid">
                    <div
                      v-for="item in advancedRenameList.categoryTime"
                      :key="item.value"
                      class="placeholder-item"
                      @click="copyPlaceholder(item.value)"
                    >
                      <code>{{ item.value }}</code>
                      <span>{{ item.label }}</span>
                    </div>
                  </div>
                </div>

                <div class="placeholder-category">
                  <div class="category-title">
                    {{ t('pages.settings.upload.placeholder.categoryHash') }}
                  </div>
                  <div class="placeholder-grid">
                    <div
                      v-for="item in advancedRenameList.categoryHash"
                      :key="item.value"
                      class="placeholder-item"
                      @click="copyPlaceholder(item.value)"
                    >
                      <code>{{ item.value }}</code>
                      <span>{{ item.label }}</span>
                    </div>
                  </div>
                </div>

                <div class="placeholder-category">
                  <div class="category-title">
                    {{ t('pages.settings.upload.placeholder.categoryFile') }}
                  </div>
                  <div class="placeholder-grid">
                    <div
                      v-for="item in advancedRenameList.categoryFile"
                      :key="item.value"
                      class="placeholder-item"
                      @click="copyPlaceholder(item.value)"
                    >
                      <code>{{ item.value }}</code>
                      <span>{{ item.label }}</span>
                    </div>
                  </div>
                </div>
              </div>
            </div>
          </div>
          <div class="modal-footer">
            <button class="btn-secondary" @click="isShowBatchRenameDialog = false">
              {{ t('common.cancel') }}
            </button>
            <button class="btn-primary" @click="handleBatchRename()">
              {{ t('common.confirm') }}
            </button>
          </div>
        </div>
      </div>
    </transition>
  </div>
</template>

<script lang="ts" setup>
import { useStorage } from '@vueuse/core'
import {
  CheckSquareIcon,
  ChevronDownIcon,
  ChevronLeftIcon,
  ChevronRightIcon,
  ChevronUpIcon,
  ClipboardIcon,
  EditIcon,
  GridIcon,
  ImageIcon,
  ImagesIcon,
  InfoIcon,
  LinkIcon,
  ListIcon,
  RefreshCwIcon,
  SearchIcon,
  SortAscIcon,
  TrashIcon,
  XIcon,
} from 'lucide-vue-next'
import { computed, nextTick, onActivated, onBeforeMount, onBeforeUnmount, reactive, ref, watch } from 'vue'
import { useI18n } from 'vue-i18n'
import { onBeforeRouteUpdate } from 'vue-router'

import ALLApi from '@/apis/allApi'
import VirtualScroller from '@/components/VirtualScroller.vue'
import useConfirm from '@/hooks/useConfirm'
import useMessage from '@/hooks/useMessage'
import { customStrMatch, customStrReplace } from '@/manage/utils/common'
import { getRawData } from '@/utils/common'
import { configPaths } from '@/utils/configPaths'
import { getConfig, saveConfig } from '@/utils/dataSender'
import $$db from '@/utils/db'
import { IPasteStyle, IRPCActionType } from '@/utils/enum'
import { picBedGlobal } from '@/utils/global'
import { picBedsCanbeDeleted } from '@/utils/static'

const { t } = useI18n()
const message = useMessage()
const { confirm } = useConfirm()

type IResult<T> = T & {
  id: string
  createdAt: number
  updatedAt: number
}

const images = ref<ImgInfo[]>([])
const virtualScrollerRef = ref<InstanceType<typeof VirtualScroller>>()
const previewImageRef = ref<HTMLImageElement>()
const dialogVisible = ref(false)
const imgInfo = reactive({
  id: '',
  imgUrl: '',
})
const choosedList: IObjT<boolean> = reactive({})
const gallerySliderControl = reactive({
  visible: false,
  index: 0,
})
const deleteCloud = ref<boolean>(false)
const isAlwaysForceReload = ref<boolean>(false)
const choosedPicBed = ref<string[]>([])
const galleryPicBedFilterSetting = ref<string[]>([])
const lastChoosed = ref<number>(-1)
const isShiftKeyPress = ref<boolean>(false)
const searchText = ref<string>('')
const searchTextURL = ref<string>('')
const debouncedSearchText = ref<string>('')
const debouncedSearchTextURL = ref<string>('')
const handleBarActive = ref<boolean>(false)
const pasteStyle = ref<string>('')
const pasteStyleMap = {
  Markdown: 'markdown',
  HTML: 'HTML',
  URL: 'URL',
  UBB: 'UBB',
  Custom: 'Custom',
}
const useShortUrl = ref<string>('')
const shortURLMap = {
  [t('pages.gallery.shortUrl')]: t('pages.gallery.shortUrl'),
  [t('pages.gallery.longUrl')]: t('pages.gallery.longUrl'),
}
const fileSortNameReverse = ref(false)
const fileSortTimeReverse = ref(false)
const fileSortExtReverse = ref(false)
const isShowBatchRenameDialog = ref(false)
const batchRenameMatch = ref('')
const batchRenameReplace = ref('')
const dateRangeStart = ref('')
const dateRangeEnd = ref('')
const picBedDropdownOpen = ref(false)
const sortDropdownOpen = ref(false)
const showFormatInfo = ref(false)
const viewMode = useStorage<'list' | 'grid'>('galleryViewMode', 'grid')
const componentKey = ref(0)
const currentSortField = ref<'name' | 'time' | 'ext' | 'check'>('name')
const userGridColumns = useStorage<number>('galleryGridColumns', 4)
const itemHeight = 300

const effectiveGridBreakpoints = computed(() => {
  return [{ min: 0, cols: userGridColumns.value }]
})

const imageLoadStates = reactive<Record<string, boolean>>({})
const imageErrorStates = reactive<Record<string, boolean>>({})

const imagePreviewState = reactive({
  scale: 1,
  translateX: 0,
  translateY: 0,
  isDragging: false,
  startX: 0,
  startY: 0,
  startTranslateX: 0,
  startTranslateY: 0,
  isSwipeMode: false,
  swipeStartX: 0,
  swipeThreshold: 100,
})

const advancedRenameList = {
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
}

const matchedCount = computed(() => {
  return filterList.value.filter((item: any) => {
    return customStrMatch(item.imgUrl, batchRenameMatch.value)
  }).length
})

const dateRange = computed({
  get: () => {
    if (dateRangeStart.value && dateRangeEnd.value) {
      return [dateRangeStart.value, dateRangeEnd.value]
    }
    return ''
  },
  set: (value: string | string[]) => {
    if (Array.isArray(value)) {
      dateRangeStart.value = value[0] || ''
      dateRangeEnd.value = value[1] || ''
    } else {
      dateRangeStart.value = ''
      dateRangeEnd.value = ''
    }
  },
})

function copyPlaceholder(placeholder: string) {
  window.electron.clipboard.writeText(placeholder)
  message.success(t('pages.settings.upload.copySuccess', { content: placeholder }))
}

const filterList = computed(() => {
  return getGallery()
})

const isAllSelected = computed(() => {
  return Object.values(choosedList).length > 0 && filterList.value.every(item => choosedList[item.id!])
})

const currentPreviewImage = computed(() => {
  const item = filterList.value[gallerySliderControl.index]
  if (!item) return null
  const cacheBustedItem = { ...item }
  if (isAlwaysForceReload.value) {
    if (cacheBustedItem.imgUrl) {
      cacheBustedItem.imgUrl = addCacheBustParam(cacheBustedItem.imgUrl)
    }
    if (cacheBustedItem.galleryPath) {
      cacheBustedItem.galleryPath = addCacheBustParam(cacheBustedItem.galleryPath)
    }
  }
  const src = cacheBustedItem.src || cacheBustedItem.galleryPath || cacheBustedItem.imgUrl || ''
  cacheBustedItem.src = isAlwaysForceReload.value ? addCacheBustParam(src) : src
  return cacheBustedItem
})

const imageTransformStyle = computed(() => {
  // Check if image overflows the viewport
  const imageElement = previewImageRef.value
  let isDraggable = false

  if (imageElement && imageElement.naturalWidth && imageElement.naturalHeight) {
    const viewerElement = imageElement.parentElement
    if (viewerElement) {
      const viewerRect = viewerElement.getBoundingClientRect()
      const currentImageWidth = imageElement.naturalWidth * imagePreviewState.scale
      const currentImageHeight = imageElement.naturalHeight * imagePreviewState.scale
      isDraggable = currentImageWidth > viewerRect.width + 1 || currentImageHeight > viewerRect.height + 1
    }
  }

  return {
    transform: `translate(${imagePreviewState.translateX}px, ${imagePreviewState.translateY}px) scale(${imagePreviewState.scale})`,
    cursor: imagePreviewState.isDragging ? 'grabbing' : isDraggable ? 'grab' : 'default',
    transition: 'none',
  }
})

function onImageLoad(id: string) {
  imageLoadStates[id] = true
}

function onImageError(id: string) {
  imageLoadStates[id] = false
  imageErrorStates[id] = true
}

function onPreviewImageLoad() {
  nextTick(() => {
    resetImageTransform()
  })
}

function togglePicBedDropdown(event?: Event) {
  picBedDropdownOpen.value = !picBedDropdownOpen.value
  if (sortDropdownOpen.value) sortDropdownOpen.value = false

  if (picBedDropdownOpen.value && event) {
    nextTick(() => {
      const trigger = event.target as HTMLElement
      const dropdown = trigger.parentElement?.querySelector('.multiselect-dropdown') as HTMLElement
      if (dropdown && trigger) {
        const rect = trigger.getBoundingClientRect()
        dropdown.style.top = `${rect.bottom + 2}px`
        dropdown.style.left = `${rect.left}px`
        dropdown.style.width = `${Math.max(rect.width, 200)}px`
      }
    })
  }
}

function toggleSortDropdown(event?: Event) {
  sortDropdownOpen.value = !sortDropdownOpen.value
  if (picBedDropdownOpen.value) picBedDropdownOpen.value = false

  if (sortDropdownOpen.value && event) {
    nextTick(() => {
      const trigger = event.target as HTMLElement
      const dropdown = trigger.parentElement?.querySelector('.sort-options') as HTMLElement
      if (dropdown && trigger) {
        const rect = trigger.getBoundingClientRect()
        dropdown.style.top = `${rect.bottom + 2}px`
        dropdown.style.left = `${rect.left}px`
        dropdown.style.width = `${Math.max(rect.width, 160)}px`
      }
    })
  }
}

function navigateImage(direction: number) {
  const newIndex = gallerySliderControl.index + direction
  if (newIndex >= 0 && newIndex < filterList.value.length) {
    gallerySliderControl.index = newIndex
    resetImageTransform()
  }
}

function resetImageTransform() {
  const optimalScale = calculateOptimalScale()
  imagePreviewState.scale = optimalScale
  imagePreviewState.translateX = 0
  imagePreviewState.translateY = 0
  imagePreviewState.isDragging = false
}

function calculateOptimalScale(): number {
  const imageElement = previewImageRef.value
  if (!imageElement) {
    return 1
  }
  if (!imageElement.naturalWidth || !imageElement.naturalHeight) {
    return 1
  }
  const viewerElement = imageElement.parentElement
  if (!viewerElement) {
    return 1
  }

  const viewerRect = viewerElement.getBoundingClientRect()
  const viewerWidth = viewerRect.width
  const viewerHeight = viewerRect.height

  const imageWidth = imageElement.naturalWidth
  const imageHeight = imageElement.naturalHeight
  const scaleX = viewerWidth / imageWidth
  const scaleY = viewerHeight / imageHeight
  const optimalScale = Math.min(scaleX, scaleY, 1)

  return optimalScale
}

function zoomIn() {
  zoomToScale(Math.min(imagePreviewState.scale * 1.2, 5))
}

function zoomOut() {
  const newScale = Math.max(imagePreviewState.scale / 1.2, 0.1)
  zoomToScale(newScale)
}

function zoomToScale(newScale: number) {
  const oldScale = imagePreviewState.scale
  imagePreviewState.scale = newScale

  const optimalScale = calculateOptimalScale()
  if (newScale <= optimalScale) {
    imagePreviewState.translateX = 0
    imagePreviewState.translateY = 0
  } else {
    const scaleDiff = newScale / oldScale
    imagePreviewState.translateX *= scaleDiff
    imagePreviewState.translateY *= scaleDiff
  }
}

function handleImageWheel(event: WheelEvent) {
  event.preventDefault()
  const delta = event.deltaY > 0 ? -1 : 1
  const zoomFactor = 1.1
  const newScale =
    delta > 0 ? Math.min(imagePreviewState.scale * zoomFactor, 5) : Math.max(imagePreviewState.scale / zoomFactor, 0.1)

  zoomToScale(newScale)
}

function handleKeydown(event: KeyboardEvent) {
  switch (event.key) {
    case 'ArrowLeft':
      event.preventDefault()
      navigateImage(-1)
      break
    case 'ArrowRight':
      event.preventDefault()
      navigateImage(1)
      break
    case 'Escape':
      event.preventDefault()
      handleClose()
      break
    case '=':
    case '+':
      event.preventDefault()
      zoomIn()
      break
    case '-':
      event.preventDefault()
      zoomOut()
      break
    case '0':
      event.preventDefault()
      resetImageTransform()
      break
  }
}

function handleImageMouseDown(event: MouseEvent) {
  const imageElement = previewImageRef.value
  let isImageLargerThanViewer = false

  if (imageElement && imageElement.naturalWidth && imageElement.naturalHeight) {
    const viewerElement = imageElement.parentElement
    if (viewerElement) {
      const viewerRect = viewerElement.getBoundingClientRect()
      const currentImageWidth = imageElement.naturalWidth * imagePreviewState.scale
      const currentImageHeight = imageElement.naturalHeight * imagePreviewState.scale
      isImageLargerThanViewer = currentImageWidth > viewerRect.width + 1 || currentImageHeight > viewerRect.height + 1
    }
  }

  if (!isImageLargerThanViewer) {
    imagePreviewState.isSwipeMode = true
    imagePreviewState.swipeStartX = event.clientX
  } else {
    imagePreviewState.isDragging = true
    imagePreviewState.startX = event.clientX
    imagePreviewState.startY = event.clientY
    imagePreviewState.startTranslateX = imagePreviewState.translateX
    imagePreviewState.startTranslateY = imagePreviewState.translateY
  }
  event.preventDefault()
}

function handleImageMouseMove(event: MouseEvent) {
  if (imagePreviewState.isDragging) {
    const deltaX = event.clientX - imagePreviewState.startX
    const deltaY = event.clientY - imagePreviewState.startY
    imagePreviewState.translateX = imagePreviewState.startTranslateX + deltaX
    imagePreviewState.translateY = imagePreviewState.startTranslateY + deltaY
  }
}

function handleImageMouseUp(event: MouseEvent) {
  if (imagePreviewState.isSwipeMode) {
    const deltaX = event.clientX - imagePreviewState.swipeStartX
    if (Math.abs(deltaX) > imagePreviewState.swipeThreshold) {
      if (deltaX > 0) {
        navigateImage(-1)
      } else {
        navigateImage(1)
      }
    }
    imagePreviewState.isSwipeMode = false
  }
  imagePreviewState.isDragging = false
}

function handleImageTouchStart(event: TouchEvent) {
  const touch = event.touches[0]
  const imageElement = previewImageRef.value
  let isImageLargerThanViewer = false

  if (imageElement && imageElement.naturalWidth && imageElement.naturalHeight) {
    const viewerElement = imageElement.parentElement
    if (viewerElement) {
      const viewerRect = viewerElement.getBoundingClientRect()
      const currentImageWidth = imageElement.naturalWidth * imagePreviewState.scale
      const currentImageHeight = imageElement.naturalHeight * imagePreviewState.scale
      isImageLargerThanViewer = currentImageWidth > viewerRect.width + 1 || currentImageHeight > viewerRect.height + 1
    }
  }

  if (!isImageLargerThanViewer) {
    imagePreviewState.isSwipeMode = true
    imagePreviewState.swipeStartX = touch.clientX
  } else {
    imagePreviewState.isDragging = true
    imagePreviewState.startX = touch.clientX
    imagePreviewState.startY = touch.clientY
    imagePreviewState.startTranslateX = imagePreviewState.translateX
    imagePreviewState.startTranslateY = imagePreviewState.translateY
  }
  event.preventDefault()
}

function handleImageTouchMove(event: TouchEvent) {
  if (imagePreviewState.isDragging) {
    const touch = event.touches[0]
    const deltaX = touch.clientX - imagePreviewState.startX
    const deltaY = touch.clientY - imagePreviewState.startY
    imagePreviewState.translateX = imagePreviewState.startTranslateX + deltaX
    imagePreviewState.translateY = imagePreviewState.startTranslateY + deltaY
  }
  event.preventDefault()
}

function handleImageTouchEnd(event: TouchEvent) {
  if (imagePreviewState.isSwipeMode && event.changedTouches.length > 0) {
    const touch = event.changedTouches[0]
    const deltaX = touch.clientX - imagePreviewState.swipeStartX
    if (Math.abs(deltaX) > imagePreviewState.swipeThreshold) {
      if (deltaX > 0) {
        navigateImage(-1)
      } else {
        navigateImage(1)
      }
    }
    imagePreviewState.isSwipeMode = false
  }
  imagePreviewState.isDragging = false
}

function toggleViewMode() {
  viewMode.value = viewMode.value === 'grid' ? 'list' : 'grid'
}

function getViewModeIcon() {
  return viewMode.value === 'list' ? ListIcon : GridIcon
}

function getViewModeLabel() {
  return t(`pages.gallery.${viewMode.value}View`)
}

onBeforeRouteUpdate((to, from) => {
  if (from.name === 'gallery') {
    clearChoosedList()
  }
  if (to.name === 'gallery') {
    updateGallery()
  }
})

async function initConf() {
  pasteStyle.value = (await getConfig(configPaths.settings.pasteStyle)) || IPasteStyle.MARKDOWN
  useShortUrl.value = (await getConfig(configPaths.settings.useShortUrl))
    ? t('pages.gallery.shortUrl')
    : t('pages.gallery.longUrl')
  isAlwaysForceReload.value = (await getConfig<boolean>(configPaths.settings.isAlwaysForceReload)) || false
  deleteCloud.value = (await getConfig<boolean>(configPaths.settings.deleteCloudFile)) || false
  galleryPicBedFilterSetting.value = (await getConfig<string[]>(configPaths.settings.galleryPicBedFilter)) || []
}

const updateGalleryHandler = () => {
  nextTick(async () => {
    updateGallery()
  })
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

const addCacheBustParam = (url: string | undefined) => {
  if (!url) {
    return ''
  }
  if (!(url.startsWith('http://') || url.startsWith('https://'))) {
    return url
  }
  try {
    const separator = url.includes('?') ? '&' : '?'
    return `${url}${separator}cbplist=${new Date().getTime()}`
  } catch (e) {
    return url
  }
}

function formatFileName(name: string) {
  return window.node.path.basename(name)
}

function getGallery(): IGalleryItem[] {
  if (
    debouncedSearchText.value ||
    choosedPicBed.value.length > 0 ||
    debouncedSearchTextURL.value ||
    dateRange.value ||
    galleryPicBedFilterSetting.value.length > 0
  ) {
    return images.value
      .filter(item => {
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
        if (dateRange.value) {
          const [start, end] = dateRange.value as string[]
          const date = new Date(item.updatedAt).getTime()
          isIncludesDateRange = date >= new Date(start).getTime() && date <= new Date(end).getTime() + 86400000
        }
        return isIncludesSearchText && isInChoosedPicBed && isIncludesSearchTextURL && isIncludesDateRange
      })
      .map((item, index) => {
        return {
          ...item,
          src: item.galleryPath || item.imgUrl || '',
          key: item.id || `item-${index}`,
          intro: item.fileName || '',
        }
      })
  } else {
    return images.value.map((item, index) => {
      return {
        ...item,
        src: item.galleryPath || item.imgUrl || '',
        key: item.id || `item-${index}`,
        intro: item.fileName || '',
      }
    })
  }
}

async function updateGallery() {
  const newList = (await $$db.get({ orderBy: 'desc' }))!.data
  const newIds = new Set(newList.map(it => it.id))
  Object.keys(imageLoadStates).forEach(k => {
    if (!newIds.has(k)) delete imageLoadStates[k]
  })
  Object.keys(imageErrorStates).forEach(k => {
    if (!newIds.has(k)) delete imageErrorStates[k]
  })
  images.value = newList
  nextTick(() => {
    if (virtualScrollerRef.value) {
      virtualScrollerRef.value.refresh()
    }
  })
}

watch(filterList, () => {
  clearChoosedList()
})

watch(userGridColumns, _ => {
  nextTick(() => {
    if (virtualScrollerRef.value) {
      virtualScrollerRef.value.refresh()
    }
  })
})

let searchDebounceTimer: ReturnType<typeof setTimeout> | null = null
let searchURLDebounceTimer: ReturnType<typeof setTimeout> | null = null

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

function handleChooseImage(val: boolean, index: number) {
  const currentItem = filterList.value[index]
  if (currentItem && currentItem.id) {
    choosedList[currentItem.id] = val
  }

  if (val === true) {
    if (lastChoosed.value !== -1 && isShiftKeyPress.value) {
      const min = Math.min(lastChoosed.value, index)
      const max = Math.max(lastChoosed.value, index)
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
    lastChoosed.value = index
  }
}

function refreshPage() {
  window.electron.sendRPC(IRPCActionType.REFRESH_SETTING_WINDOW)
}

function clearChoosedList() {
  isShiftKeyPress.value = false
  Object.keys(choosedList).forEach(key => {
    delete choosedList[key]
  })
  lastChoosed.value = -1
}

function zoomImage(index: number) {
  gallerySliderControl.index = index
  gallerySliderControl.visible = true
  resetImageTransform()

  nextTick(() => {
    const modal = document.querySelector('.image-preview-modal') as HTMLElement
    if (modal) {
      modal.focus()
    }
  })
}

function handleClose() {
  gallerySliderControl.index = 0
  gallerySliderControl.visible = false
  resetImageTransform()
}

async function copy(item: ImgInfo) {
  item.config = JSON.parse(JSON.stringify(item.config) || '{}')
  const result = await window.electron.triggerRPC<[string, string]>(IRPCActionType.GALLERY_PASTE_TEXT, getRawData(item))
  if (result && result[1] && item.id) {
    await $$db.updateById(item.id, {
      shortUrl: result[1],
    })
    updateGallery()
  }
  window.electron.clipboard.writeText(result ? result[0] : '')
  message.success(t('pages.gallery.copyLinkSucceed'))
}

function remove(item: ImgInfo, _: number) {
  if (!item.id) return

  confirm({
    title: t('pages.gallery.notice'),
    message: t('pages.gallery.confirmRemove'),
    type: 'warning',
    confirmButtonText: t('common.confirm'),
    cancelButtonText: t('common.cancel'),
    center: true,
  }).then(async result => {
    if (!result) return
    const file = await $$db.getById(item.id!)
    const isNeedDeleteCloudFile =
      (await getConfig(configPaths.settings.deleteCloudFile)) &&
      picBedsCanbeDeleted.includes(item?.type || 'placeholder')
    if (isNeedDeleteCloudFile) {
      const result = await ALLApi.delete(getRawData(item))
      if (result) {
        message.success(`${item.fileName} ${t('pages.gallery.cloudDeleteSucceed')}`)
      } else {
        message.error(`${item.fileName} ${t('pages.gallery.cloudDeleteFailed')}`)
        return true
      }
    }
    await $$db.removeById(item.id!)
    const args = getRawData(file)
    window.electron.sendRPC(IRPCActionType.GALLERY_REMOVE_FILES, [args])
    await updateGallery()
    nextTick(() => {
      virtualScrollerRef.value?.refresh()
    })
    if (!isNeedDeleteCloudFile) {
      message.success(t('pages.gallery.operationSucceed'))
    }
  })
}

function handleIsAlwaysForceReload(event: Event) {
  const ev = (event.target as HTMLInputElement).checked
  isAlwaysForceReload.value = ev
  saveConfig({
    [configPaths.settings.isAlwaysForceReload]: ev,
  })
  window.electron.sendRPC(IRPCActionType.REFRESH_SETTING_WINDOW)
}

function handleDeleteCloudFile(event: Event) {
  saveConfig({
    [configPaths.settings.deleteCloudFile]: (event.target as HTMLInputElement).checked,
  })
}

function openDialog(item: ImgInfo) {
  imgInfo.id = item.id!
  imgInfo.imgUrl = item.imgUrl as string
  dialogVisible.value = true
}

async function confirmModify() {
  await $$db.updateById(imgInfo.id, {
    imgUrl: imgInfo.imgUrl,
  })
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
  const result = !isAllSelected.value
  filterList.value.forEach(item => {
    choosedList[item.id!] = result
  })
}

function multiRemove() {
  const multiRemoveNumber = Object.values(choosedList).filter(item => item).length
  if (multiRemoveNumber) {
    confirm({
      title: t('pages.gallery.notice'),
      message: t('pages.gallery.confirmRemove'),
      type: 'warning',
      confirmButtonText: t('common.confirm'),
      cancelButtonText: t('common.cancel'),
      center: true,
    }).then(async result => {
      if (!result) return
      const files: IResult<ImgInfo>[] = []
      const imageIDList = Object.keys(choosedList)
      const isDeleteCloudFile = await getConfig(configPaths.settings.deleteCloudFile)
      if (isDeleteCloudFile) {
        for (const imageIDListItem of imageIDList) {
          const key = imageIDListItem
          if (choosedList[key]) {
            const file = await $$db.getById<ImgInfo>(key)
            if (file) {
              if (file.type !== undefined && picBedsCanbeDeleted.includes(file.type)) {
                const result = await ALLApi.delete(file)
                if (result) {
                  message.success(`${file.fileName} ${t('pages.gallery.cloudDeleteSucceed')}`, {
                    duration: multiRemoveNumber > 5 ? 1000 : 2000,
                  })
                  files.push(file)
                  await $$db.removeById(key)
                } else {
                  message.error(`${file.fileName} ${t('pages.gallery.cloudDeleteFailed')}`, {
                    duration: multiRemoveNumber > 5 ? 1000 : 2000,
                  })
                }
              } else {
                files.push(file)
                await $$db.removeById(key)
              }
            }
          }
        }
      } else {
        for (const imageIDListItem of imageIDList) {
          const key = imageIDListItem
          if (choosedList[key]) {
            const file = await $$db.getById<ImgInfo>(key)
            if (file) {
              files.push(file)
              await $$db.removeById(key)
            }
          }
        }
      }
      clearChoosedList()

      window.electron.sendRPC(IRPCActionType.GALLERY_REMOVE_FILES, getRawData(files))
      await updateGallery()
      nextTick(() => {
        virtualScrollerRef.value?.refresh()
      })
      message.success(t('pages.gallery.operationSucceed'))
    })
  }
}

async function multiCopy() {
  if (Object.values(choosedList).some(item => item)) {
    const copyString: string[] = []
    const imageIDList = Object.keys(choosedList)
    for (const imageIDListItem of imageIDList) {
      const item = await $$db.getById<ImgInfo>(imageIDListItem)
      if (item) {
        const result = await window.electron.triggerRPC<string>(IRPCActionType.GALLERY_PASTE_TEXT, getRawData(item))
        copyString.push(result ? result[0] : '')
        if (result && result[1] && item.id) {
          await $$db.updateById(item.id, {
            shortUrl: result[1],
          })
          updateGallery()
        }
      }
    }
    window.electron.clipboard.writeText(copyString.join('\n'))
    clearChoosedList()
    message.success(t('pages.gallery.copyLinkSucceed'))
  }
}

function toggleHandleBar() {
  handleBarActive.value = !handleBarActive.value
}

async function handlePasteStyleChange(event: Event) {
  const target = event.target as HTMLSelectElement
  const val = target.value
  saveConfig(configPaths.settings.pasteStyle, val)
  pasteStyle.value = val
}

function handleUseShortUrlChange(event: Event) {
  const target = event.target as HTMLSelectElement
  const value = target.value
  saveConfig(configPaths.settings.useShortUrl, value === t('pages.gallery.shortUrl'))
  useShortUrl.value = value
}

function sortFile(type: 'name' | 'time' | 'ext' | 'check') {
  sortDropdownOpen.value = false
  currentSortField.value = type
  switch (type) {
    case 'name':
      fileSortNameReverse.value = !fileSortNameReverse.value
      images.value.sort((a: any, b: any) => {
        if (fileSortNameReverse.value) {
          return a.fileName.localeCompare(b.fileName)
        } else {
          return b.fileName.localeCompare(a.fileName)
        }
      })
      break
    case 'time':
      fileSortTimeReverse.value = !fileSortTimeReverse.value
      images.value.sort((a: any, b: any) => {
        if (fileSortTimeReverse.value) {
          return a.updatedAt - b.updatedAt
        } else {
          return b.updatedAt - a.updatedAt
        }
      })
      break
    case 'ext':
      fileSortExtReverse.value = !fileSortExtReverse.value
      images.value.sort((a: any, b: any) => {
        if (fileSortExtReverse.value) {
          return a.extname.localeCompare(b.extname)
        } else {
          return b.extname.localeCompare(a.extname)
        }
      })
      break
    case 'check':
      images.value.sort((a: any, b: any) => {
        if (choosedList[a.id] && !choosedList[b.id]) {
          return -1
        } else if (!choosedList[a.id] && choosedList[b.id]) {
          return 1
        } else {
          return 0
        }
      })
      break
  }
}

function handleBatchRename() {
  isShowBatchRenameDialog.value = false
  if (batchRenameMatch.value === '') {
    message.warning(t('pages.gallery.inputRegexTip'))
    return
  }
  let matchedFiles = [] as any[]
  filterList.value.forEach((item: any) => {
    if (customStrMatch(item.imgUrl, batchRenameMatch.value)) {
      matchedFiles.push(item)
    }
  })
  if (matchedFiles.length === 0) {
    message.warning(t('pages.gallery.noMatch'))
    return
  }
  for (const matchedFile of matchedFiles) {
    matchedFile.newUrl = customStrReplace(matchedFile.imgUrl, batchRenameMatch.value, batchRenameReplace.value)
  }
  matchedFiles = matchedFiles.filter((item: any) => item.imgUrl !== item.newUrl)
  if (matchedFiles.length === 0) {
    message.warning(t('pages.gallery.noItemsNeedRename'))
  }
  for (let i = 0; i < matchedFiles.length; i++) {
    matchedFiles[i].newUrl = matchedFiles[i].newUrl.replaceAll('{auto}', (i + 1).toString())
  }
  const duplicateFilesNum = matchedFiles.filter(
    (item: any) => matchedFiles.filter((item2: any) => item2.newUrl === item.newUrl).length > 1,
  ).length
  const renamefunc = async (item: any) => {
    await $$db.updateById(item.id, {
      imgUrl: item.newUrl,
    })
  }
  const rename = () => {
    const promiseList = [] as any[]
    for (const matchedFile of matchedFiles) {
      promiseList.push(renamefunc(matchedFile))
    }
    Promise.all(promiseList)
      .then(() => {
        message.success(t('pages.gallery.operationSucceed'))
        updateGallery()
        nextTick(() => {
          virtualScrollerRef.value?.refresh()
        })
      })
      .catch(() => {
        return true
      })
  }
  if (duplicateFilesNum > 0) {
    confirm({
      title: t('pages.gallery.notice'),
      message: t('pages.gallery.haveDuplicate'),
      type: 'warning',
      confirmButtonText: t('common.confirm'),
      cancelButtonText: t('common.cancel'),
      center: true,
    })
      .then(result => {
        if (!result) return
        rename()
      })
      .catch(() => {
        message.info(t('pages.gallery.canceled'))
      })
  } else {
    rename()
  }
}

onBeforeMount(async () => {
  window.electron.ipcRendererOn('updateGallery', updateGalleryHandler)
  updateGallery()
  document.addEventListener('keydown', handleDetectShiftKey)
  document.addEventListener('keyup', handleDetectShiftKey)
  document.addEventListener('click', handleOutsideClick)
})

onBeforeUnmount(async () => {
  window.electron.ipcRendererRemoveAllListeners('updateGallery')
  document.removeEventListener('click', handleOutsideClick)
  document.removeEventListener('keydown', handleDetectShiftKey)
  document.removeEventListener('keyup', handleDetectShiftKey)

  // Clear timers
  if (searchDebounceTimer) clearTimeout(searchDebounceTimer)
  if (searchURLDebounceTimer) clearTimeout(searchURLDebounceTimer)
  isAlwaysForceReload.value = (await getConfig(configPaths.settings.isAlwaysForceReload)) || false
})

onActivated(async () => {
  await initConf()
  nextTick(() => {
    if (virtualScrollerRef.value && typeof virtualScrollerRef.value.refresh === 'function') {
      virtualScrollerRef.value.refresh()
    } else {
      componentKey.value++
    }
  })
})
</script>

<script lang="ts">
export default {
  name: 'GalleryPage',
  components: {
    VirtualScroller,
  },
}
</script>

<style scoped src="./css/Gallery.css"></style>
