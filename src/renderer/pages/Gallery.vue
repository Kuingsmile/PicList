<template>
  <div class="relative no-scrollbar flex h-full w-full items-center justify-center">
    <!-- Header Card -->
    <div
      class="relative z-1 no-scrollbar flex h-full w-full flex-col items-center justify-start gap-4 overflow-auto rounded-xl border-none p-4 shadow-sm"
    >
      <div
        class="flex w-full items-center justify-between gap-4 rounded-2xl border border-border-secondary px-6 py-0 shadow-md max-md:items-stretch max-md:p-5"
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
          <div class="flex items-center gap-1.5 rounded-md border border-border-secondary px-2 py-1.5">
            <GridIcon :size="14" class="text-main" />
            <input
              v-model.number="userGridColumns"
              type="range"
              min="1"
              max="15"
              step="1"
              class="grid-slider h-[4px] w-[70px] cursor-pointer appearance-none rounded-[2px] bg-(--color-background-tertiary) outline-none [&::-moz-range-thumb]:h-[14px] [&::-moz-range-thumb]:w-[14px] [&::-moz-range-thumb]:rounded-full [&::-moz-range-thumb]:border-none [&::-moz-range-thumb]:bg-accent [&::-moz-range-thumb]:transition-all [&::-moz-range-thumb]:duration-200 [&::-webkit-slider-thumb]:h-[15px] [&::-webkit-slider-thumb]:w-[15px] [&::-webkit-slider-thumb]:appearance-none [&::-webkit-slider-thumb]:rounded-full [&::-webkit-slider-thumb]:bg-accent [&::-webkit-slider-thumb]:transition-all [&::-webkit-slider-thumb]:duration-200 hover:[&::-webkit-slider-thumb]:scale-110 hover:[&::-webkit-slider-thumb]:shadow-[0_0_0_2px_rgba(var(--color-accent-rgb),0.4)]"
              :title="t('pages.gallery.gridSize')"
            />
          </div>
          <div class="flex items-center gap-2">
            <span class="text-sm text-secondary">{{ t('pages.gallery.isAlwaysForceReload') }}</span>
            <CustomSwitch
              v-model="isAlwaysForceReload"
              small
              tighter
              no-border
              no-hover
              @change="handleIsAlwaysForceReload"
            />
          </div>
          <div class="flex items-center gap-2">
            <span class="text-sm text-secondary">{{ t('pages.gallery.syncDelete') }}</span>
            <CustomSwitch v-model="deleteCloud" small tighter no-border no-hover @change="handleDeleteCloudFile" />
          </div>
          <CustomButton
            type="primary"
            :text="getViewModeLabel()"
            :icon="getViewModeIcon()"
            class="px-2!"
            @click="toggleViewMode"
          />
          <CustomButton
            type="primary"
            :text="t('pages.gallery.hideFilters')"
            :icon="handleBarActive ? ChevronUpIcon : ChevronDownIcon"
            class="px-2!"
            @click="toggleHandleBar"
          />
          <CustomButton
            type="secondary"
            :text="t('pages.gallery.refresh')"
            :icon="RefreshCwIcon"
            class="px-2!"
            @click="refreshPage"
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
              <input v-model="dateRangeStart" type="date" class="date-input" placeholder="Start date" />
              <span class="shrink-0 font-medium text-secondary">-</span>
              <input v-model="dateRangeEnd" type="date" class="date-input" placeholder="End date" />
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
              :fronticon="false"
              :key-list="shortURLList"
            >
              <template #item="{ item }">
                {{ item }}
              </template>
            </SingleSelect>
          </div>

          <div class="filter-group">
            <SingleSelect
              v-model="currentSortField"
              :placeholder="t(`pages.gallery.sortBy.${currentSortField}`)"
              :title="t('pages.gallery.sort')"
              :key-list="['name', 'ext', 'time', 'check']"
              @change="sortFile(currentSortField)"
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
            />
            <button v-if="searchText" class="clear-button" @click="cleanSearch">
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
            />
            <button v-if="searchTextURL" class="clear-button" @click="cleanSearchUrl">
              <XIcon :size="14" />
            </button>
          </div>

          <div class="flex flex-1 flex-wrap gap-3">
            <button class="action-btn copy-btn" :class="{ active: isMultiple(choosedList) }" @click="multiCopy">
              <ClipboardIcon :size="16" />
              <span> {{ t('pages.gallery.copy') }}</span>
            </button>
            <button
              class="action-btn edit-btn"
              :class="{ active: filterList.length > 0 }"
              @click="() => (isShowBatchRenameDialog = true)"
            >
              <EditIcon :size="16" />
              <span> {{ t('pages.gallery.edit') }}</span>
            </button>
            <button class="action-btn delete-btn" :class="{ active: isMultiple(choosedList) }" @click="multiRemove">
              <TrashIcon :size="16" />
              <span> {{ `${t('pages.gallery.delete')}${selectedCount > 0 ? ` (${selectedCount})` : ''}` }}</span>
            </button>
            <button class="action-btn select-btn" :class="{ active: filterList.length > 0 }" @click="toggleSelectAll">
              <CheckSquareIcon :size="16" />
              <span>{{ isAllSelected ? t('pages.gallery.cancel') : t('pages.gallery.selectAll') }}</span>
            </button>
          </div>
        </div>
      </div>

      <!-- Gallery Grid -->
      <div
        class="no-scrollbar flex min-h-[500px] w-full flex-1 flex-col flex-wrap items-center justify-center gap-2 overflow-auto rounded-2xl border border-border-secondary p-1 shadow-md"
      >
        <div v-if="filterList.length === 0" class="flex flex-col items-center justify-center px-8 py-16 text-center">
          <ImageIcon :size="64" class="mb-4 text-accent" />
          <h3 class="mx-0 mt-0 mb-2 text-xl font-semibold text-main">{{ t('pages.gallery.noImagesFound') }}</h3>
          <p class="m-0 text-secondary">{{ t('pages.gallery.tryAdjustingFilters') }}</p>
        </div>

        <VirtualScroller
          v-else
          :key="componentKey"
          ref="virtualScrollerRef"
          :items="filterList"
          :view-mode="viewMode"
          class="virtual-gallery-scroller min-h-0 w-full flex-1 p-3"
          :item-height="300"
          :grid-breakpoints="effectiveGridBreakpoints"
          key-field="key"
        >
          <template #default="{ item, index }">
            <div
              class="group/image m-0 box-border flex h-[calc(100%-8px)] w-full cursor-pointer flex-col overflow-hidden rounded-lg border-2 border-border shadow-sm transition-all duration-fast ease-apple hover:-translate-y-[2px] hover:border-accent hover:shadow-md [.selected]:border-2 [.selected]:border-accent [.selected]:shadow-md"
              :class="{ selected: choosedList[item.id || ''] }"
              @click="handleChooseImage(!choosedList[item.id || ''], index)"
            >
              <div
                class="relative mb-2 flex aspect-auto min-h-0 flex-1 items-center justify-center overflow-hidden border-b border-dashed border-b-accent/40"
                @click.stop="zoomImage(index)"
              >
                <img
                  :src="
                    imageErrorStates[item.key || '']
                      ? './errorLoading.png'
                      : isAlwaysForceReload
                        ? addCacheBustParam(item.src)
                        : item.src
                  "
                  class="h-full w-full object-contain transition-all duration-fast ease-apple"
                  :class="{ loading: !imageLoadStates[item.key || ''] }"
                  @load="onImageLoad(item.key || '')"
                  @error="onImageError(item.key || '')"
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
                      class="peer absolute h-0 w-0 cursor-pointer opacity-0"
                      @change="e => handleChooseImage((e.target as HTMLInputElement).checked, index)"
                    />
                    <span
                      class="relative inline-block h-[16px] w-[16px] rounded-sm border-2 border-accent/50 transition-all duration-fast ease-apple peer-checked:border-accent-hover peer-checked:bg-accent peer-checked:after:absolute peer-checked:after:top-[-2px] peer-checked:after:left-px peer-checked:after:text-[12px] peer-checked:after:font-bold peer-checked:after:text-white peer-checked:after:content-['✓']"
                    />
                  </label>
                </div>
              </div>
            </div>
          </template>
        </VirtualScroller>
      </div>
    </div>
    <!-- Custom Image Preview Modal -->
    <ImagePreview
      v-model:gallery-slider-control="gallerySliderControl"
      :filter-list="filterList"
      :is-always-force-reload="isAlwaysForceReload"
    />

    <!-- Edit URL Modal -->
    <transition name="modal">
      <CustomModal
        v-if="dialogVisible"
        v-model:visible="dialogVisible"
        :height="'auto'"
        :width="'40%'"
        :title="t('pages.gallery.changeImageUrl')"
      >
        <div class="p-2">
          <input v-model="imgInfo.imgUrl" type="text" class="form-input" placeholder="Enter new URL" />
        </div>
        <template #footer>
          <CustomButton :type="'secondary'" :text="t('common.cancel')" @click="dialogVisible = false" />
          <CustomButton :type="'primary'" :text="t('common.confirm')" @click="confirmModify" />
        </template>
      </CustomModal>
    </transition>

    <!-- Batch Rename Modal -->
    <transition name="modal">
      <CustomModal
        v-if="isShowBatchRenameDialog"
        v-model:visible="isShowBatchRenameDialog"
        :height="'auto'"
        :width="'700px'"
        :title="t('pages.gallery.batchEditUrl')"
      >
        <div class="p-6">
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
          <CustomButton :type="'secondary'" :text="t('common.cancel')" @click="isShowBatchRenameDialog = false" />
          <CustomButton :type="'primary'" :text="t('common.confirm')" @click="handleBatchRename" />
        </template>
      </CustomModal>
    </transition>
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
  ListIcon,
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
  reactive,
  ref,
  useTemplateRef,
  watch,
} from 'vue'
import { useI18n } from 'vue-i18n'
import { onBeforeRouteUpdate } from 'vue-router'

import ALLApi from '@/apis/allApi'
import CustomButton from '@/components/common/CustomButton.vue'
import CustomModal from '@/components/common/CustomModal.vue'
import CustomSwitch from '@/components/common/CustomSwitch.vue'
import MultiSelect from '@/components/common/MultiSelect.vue'
import PlaceholderTable from '@/components/common/PlaceholderTable.vue'
import SingleSelect from '@/components/common/SingleSelect.vue'
import ImagePreview from '@/components/ImagePreview.vue'
import VirtualScroller from '@/components/VirtualScroller.vue'
import useConfirm from '@/hooks/useConfirm'
import { usePicBed } from '@/hooks/useGlobal'
import useMessage from '@/hooks/useMessage'
import { customStrMatch, customStrReplace } from '@/manage/utils/common'
import { getRawData } from '@/utils/common'
import { configPaths } from '@/utils/configPaths'
import { getConfig, saveConfig } from '@/utils/dataSender'
import $$db from '@/utils/db'
import { IPasteStyle, IRPCActionType } from '@/utils/enum'
import { picBedsCanbeDeleted } from '@/utils/static'

type IResult<T> = T & {
  id: string
  createdAt: number
  updatedAt: number
}

const { t } = useI18n()
const message = useMessage()
const { confirm } = useConfirm()
const { picBedG } = usePicBed()

const images = ref<ImgInfo[]>([])
const virtualScrollerRef = useTemplateRef('virtualScrollerRef')
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
const lastChoosed = ref<number>(-1)
const isShiftKeyPress = ref<boolean>(false)
const searchText = ref<string>('')
const searchTextURL = ref<string>('')
const debouncedSearchText = ref<string>('')
const debouncedSearchTextURL = ref<string>('')
const handleBarActive = useStorage<boolean>('galleryHandleBarActive', true)
const pasteStyle = ref<string>('')
const useShortUrl = ref<string>('')
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
const showMatchedUrls = ref(false)
const enableAdvancedAnimation = ref(false)
const viewMode = useStorage<'list' | 'grid'>('galleryViewMode', 'grid')
const componentKey = ref(0)
const currentSortField = ref<'name' | 'time' | 'ext' | 'check'>('name')
const userGridColumns = useStorage<number>('galleryGridColumns', 4)
const imageLoadStates = reactive<Record<string, boolean>>({})
const imageErrorStates = reactive<Record<string, boolean>>({})

const pasteStyleList = ['markdown', 'HTML', 'URL', 'UBB', 'Custom']
const shortURLList = [t('pages.gallery.shortUrl'), t('pages.gallery.longUrl')]

const advancedRenameTitleList = computed(() => ({
  categoryTime: t('pages.settings.upload.placeholder.categoryTime'),
  categoryHash: t('pages.settings.upload.placeholder.categoryHash'),
  categoryFile: t('pages.settings.upload.placeholder.categoryFile'),
}))

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
}
let searchDebounceTimer: ReturnType<typeof setTimeout> | null = null
let searchURLDebounceTimer: ReturnType<typeof setTimeout> | null = null

const effectiveGridBreakpoints = computed(() => {
  return [{ min: 0, cols: userGridColumns.value }]
})

const filteredPicBedG = computed(() => {
  if (galleryPicBedFilterSetting.value.length === 0) {
    return picBedG.value
  }
  return picBedG.value.filter(item => galleryPicBedFilterSetting.value.includes(item.type))
})

const matchedCount = computed(() => {
  const matches = filterList.value.filter((item: any) => {
    return customStrMatch(item.imgUrl, batchRenameMatch.value)
  })
  return matches.length
})

const filterList = computed(() => {
  return getGallery()
})

const matchedUrls = computed(() => {
  const matches = filterList.value.filter((item: any) => {
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

watch(pasteStyle, newVal => {
  saveConfig(configPaths.settings.pasteStyle, newVal)
})

watch(useShortUrl, newVal => {
  saveConfig(configPaths.settings.useShortUrl, newVal === t('pages.gallery.shortUrl'))
})

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

function onImageLoad(id: string) {
  imageLoadStates[id] = true
}

function onImageError(id: string) {
  imageLoadStates[id] = false
  imageErrorStates[id] = true
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

async function initConf() {
  const settingConfig = await getConfig<any>('settings')
  pasteStyle.value = settingConfig.pasteStyle || IPasteStyle.MARKDOWN
  useShortUrl.value = settingConfig.useShortUrl ? t('pages.gallery.shortUrl') : t('pages.gallery.longUrl')
  enableAdvancedAnimation.value = settingConfig.enableAdvancedAnimation || false
  isAlwaysForceReload.value = settingConfig.isAlwaysForceReload || false
  deleteCloud.value = settingConfig.deleteCloudFile || false
  galleryPicBedFilterSetting.value = settingConfig.galleryPicBedFilter || []
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
  gallerySliderControl.value.index = index
  gallerySliderControl.value.visible = true
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
  window.electron.clipboard.writeText(String(result ? result[0] : ''))
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
    window.electron.sendRPC(IRPCActionType.GALLERY_REMOVE_RUN_SCRIPTS, getRawData(item))
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

function handleIsAlwaysForceReload(value: boolean) {
  saveConfig({
    [configPaths.settings.isAlwaysForceReload]: value,
  })
  window.electron.sendRPC(IRPCActionType.REFRESH_SETTING_WINDOW)
}

function handleDeleteCloudFile(value: boolean) {
  saveConfig({
    [configPaths.settings.deleteCloudFile]: value,
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
              window.electron.sendRPC(IRPCActionType.GALLERY_REMOVE_RUN_SCRIPTS, getRawData(file))
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
              window.electron.sendRPC(IRPCActionType.GALLERY_REMOVE_RUN_SCRIPTS, getRawData(file))
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

function sortFile(type: 'name' | 'time' | 'ext' | 'check') {
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

onBeforeRouteUpdate((to, from) => {
  if (from.name === 'gallery') {
    clearChoosedList()
  }
  if (to.name === 'gallery') {
    updateGallery()
  }
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
