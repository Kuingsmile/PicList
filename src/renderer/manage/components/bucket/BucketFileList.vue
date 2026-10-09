<template>
  <div ref="bucketContainerRef" class="flex min-h-[240px] w-full min-w-0 flex-1 flex-col overflow-hidden p-2">
    <div
      v-if="filterList.length === 0 && isLoadingData"
      class="flex h-full w-full flex-col items-center justify-center gap-3"
      role="status"
    >
      <LoaderCircleIcon :size="28" class="animate-spin text-accent motion-reduce:animate-none" aria-hidden="true" />
      <span class="text-sm text-secondary">{{ t('pages.manage.main.loading') }}</span>
    </div>
    <EmptyPage
      v-else-if="filterList.length === 0 && searching"
      :icon="SearchXIcon"
      :title="t('pages.manage.bucket.noSearchMatch')"
      :description="t('pages.manage.bucket.noSearchMatchDesc')"
    />
    <EmptyPage
      v-else-if="filterList.length === 0"
      :icon="FolderOpenIcon"
      :title="t('pages.manage.bucket.emptyFolder')"
      :description="t('pages.manage.bucket.emptyFolderDesc')"
    >
      <CustomButton :icon="UploadIcon" :text="t('pages.manage.bucket.upload')" @click="emit('upload')" />
    </EmptyPage>
    <FileCollection
      v-else
      ref="virtualScrollerRef"
      :items="filterList"
      :columns="tableColumns"
      :density="tableDensity"
      :grid-item-height="gridItemHeight"
      :view-mode="layoutStyle"
      :grid-breakpoints="gridBreakpoints"
      key-field="key"
      :label="configMap.bucketName || t('common.fileTable.name')"
      :is-selected="item => !!item.checked"
      :sort-field="isLoadingData ? '' : currentSortType"
      :sort-ascending="sortAscending"
      :actions-width="184"
      @select="(item, selected) => emit('select', item, selected)"
      @select-all="emit('select-all', $event)"
      @sort="field => emit('sort', field as ISortTypeList)"
      @open="emit('open', $event)"
      @visible-indexes-change="
        indexes => {
          if (!indexes.includes(copyDropdownIndex)) copyDropdownIndex = -1
        }
      "
    >
      <template #actions="{ item, index, tabindex }">
        <button
          v-if="!item.isDir && isShowRenameFileIcon"
          v-tooltip="t('pages.manage.bucket.renameFile')"
          type="button"
          :tabindex
          :aria-label="t('pages.manage.bucket.renameFile')"
          @click="emit('rename', item)"
        >
          <EditIcon :size="16" />
        </button>
        <button
          v-tooltip="t('common.fileTable.download')"
          type="button"
          :tabindex
          :aria-label="t('common.fileTable.download')"
          @click="item.isDir ? emit('download-folder', item) : emit('download', [item])"
        >
          <DownloadIcon :size="16" />
        </button>
        <div :data-dropdown-index="index">
          <button
            v-tooltip="t('common.fileTable.copyAs')"
            type="button"
            :tabindex
            :aria-label="t('common.fileTable.copyAs')"
            :aria-expanded="copyDropdownIndex === index"
            @click.stop="toggleCopyDropdown(index, $event)"
          >
            <CopyIcon :size="16" />
          </button>
          <teleport to="body">
            <div
              v-if="copyDropdownIndex === index"
              data-copy-menu
              role="menu"
              :class="copyMenuClass"
              :style="getDropdownStyle(index)"
              @keydown.esc.stop="closeCopyDropdown"
            >
              <button
                v-for="format in linkFormatList"
                :key="format"
                type="button"
                :tabindex
                role="menuitem"
                :class="copyMenuItemClass"
                @click.stop="emit('copy-link', item, format)"
              >
                {{ t(`pages.manage.bucket.linkFormat.${format}`) }}
              </button>
              <button
                v-if="isShowPresignedUrl"
                type="button"
                :tabindex
                role="menuitem"
                :class="copyMenuItemClass"
                @click.stop="async () => emit('copy-text', await getPreSignedUrl(item))"
              >
                {{ t('pages.manage.bucket.linkFormat.presign') }}
              </button>
            </div>
          </teleport>
        </div>
        <button
          v-tooltip="t('pages.manage.bucket.fileInfo')"
          type="button"
          :tabindex
          :aria-label="t('pages.manage.bucket.fileInfo')"
          @click="emit('info', item)"
        >
          <InfoIcon :size="16" />
        </button>
        <button
          v-tooltip="t('common.fileTable.delete')"
          type="button"
          :tabindex
          :aria-label="t('common.fileTable.delete')"
          :disabled="isDeleting || isLoadingData"
          @click="emit('delete', item)"
        >
          <Trash2Icon :size="16" />
        </button>
      </template>
      <template #default="{ item, index }">
        <!-- Grid View -->
        <div
          class="group/card relative flex h-[calc(100%-8px)] w-full flex-col overflow-hidden rounded-lg border bg-bg-secondary shadow-sm transition-all duration-fast ease-apple hover:shadow-md"
          :class="item.checked ? 'border-accent ring-2 ring-accent/40' : 'border-border hover:border-accent/60'"
        >
          <!-- Preview area: checkbox top-left, actions along the bottom so they never overlap -->
          <div class="relative flex min-h-0 flex-1">
            <div
              class="relative flex min-h-0 flex-1 cursor-pointer items-center justify-center overflow-hidden bg-bg-tertiary focus-visible:focus-ring focus-visible:-outline-offset-2"
              role="button"
              tabindex="0"
              :aria-label="`${t('common.fileTable.open')}: ${item.fileName ?? ''}`"
              @click="hasSelection ? emit('select', item, !item.checked) : emit('open', item)"
              @keydown.enter.prevent="emit('open', item)"
              @keydown.space.prevent="emit('select', item, !item.checked)"
            >
              <!-- S3 PreSign Image -->
              <ImagePreSign
                v-if="
                  isShowThumbnail && !item.isDir && item.isImage && currentPicBedName === 's3plist' && isUsePreSignedUrl
                "
                :is-show-thumbnail="isShowThumbnail"
                :item
                :alias="configMap.alias"
                :url="item.url"
                :config="getS3Config(item)"
              />

              <!-- Public Image Preview -->
              <template v-else-if="!item.isDir && !['webdavplist', 'sftp', 'local'].includes(currentPicBedName)">
                <img
                  v-if="isShowThumbnail && item.isImage"
                  :referrerpolicy="getPreviewReferrerPolicy(item.url)"
                  :src="getThumbnailUrl(item.url)"
                  alt=""
                  class="h-full w-full object-contain transition-transform duration-medium ease-apple group-hover/card:scale-[1.03]"
                  draggable="false"
                  @error="() => {}"
                />
                <img
                  v-else
                  :src="`./assets/icons/${getFileIconPath(item.fileName ?? '')}`"
                  alt=""
                  class="h-[56px] w-[56px] object-contain"
                  draggable="false"
                />
              </template>

              <!-- WebDAV Image -->
              <ImageWebdav
                v-else-if="isShowThumbnail && !item.isDir && currentPicBedName === 'webdavplist' && item.isImage"
                :is-show-thumbnail="isShowThumbnail"
                :item
                :config="getWebdavConfig()"
                :url="item.url"
              />

              <!-- Local Image -->
              <ImageLocal
                v-else-if="isShowThumbnail && !item.isDir && currentPicBedName === 'local' && item.isImage"
                :is-show-thumbnail="isShowThumbnail"
                :item
                :local-path="item.key"
              />

              <!-- Default File Icon -->
              <img
                v-else-if="!item.isDir"
                :src="`./assets/icons/${getFileIconPath(item.fileName ?? '')}`"
                alt=""
                class="h-[56px] w-[56px] object-contain"
                draggable="false"
              />

              <!-- Folder Icon -->
              <FolderIcon
                v-else
                :size="56"
                :stroke-width="1.5"
                class="fill-accent/15 text-accent/80 transition-transform duration-fast ease-apple group-hover/card:scale-105"
                aria-hidden="true"
              />

              <div v-if="item.checked" class="pointer-events-none absolute inset-0 bg-accent/10" aria-hidden="true" />
            </div>

            <!-- Selection checkbox -->
            <label
              class="absolute top-2 left-2 z-1 flex cursor-pointer transition-opacity duration-fast ease-apple group-hover/card:opacity-100 focus-within:opacity-100"
              :class="hasSelection ? 'opacity-100' : 'opacity-0'"
              @click.stop
            >
              <input
                :checked="item.checked"
                type="checkbox"
                class="peer sr-only"
                :aria-label="t('common.fileTable.selectFile', { name: item.fileName ?? '' })"
                @change="emit('select', item, ($event.target as HTMLInputElement).checked)"
              />
              <span
                class="group/check flex h-[28px] w-[28px] items-center justify-center rounded-md bg-bg-secondary/90 shadow-sm backdrop-blur-sm transition-all duration-fast ease-apple peer-checked:bg-accent peer-focus-visible:outline-2 peer-focus-visible:outline-offset-2 peer-focus-visible:outline-accent"
                aria-hidden="true"
              >
                <CheckIcon v-if="item.checked" :size="16" :stroke-width="3" class="text-white" />
                <span
                  v-else
                  class="h-[16px] w-[16px] rounded-sm border-2 border-accent/60 transition-colors duration-fast ease-apple group-hover/check:border-accent"
                />
              </span>
            </label>

            <!-- Quick actions -->
            <div
              class="pointer-events-none absolute inset-x-0 bottom-2 z-1 flex justify-center transition-opacity duration-fast ease-apple group-hover/card:pointer-events-auto group-hover/card:opacity-100 focus-within:pointer-events-auto focus-within:opacity-100"
              :class="copyDropdownIndex === index ? 'pointer-events-auto opacity-100' : 'opacity-0'"
            >
              <div class="flex gap-0.5 rounded-lg bg-bg-secondary/90 p-0.5 shadow-sm backdrop-blur-sm">
                <button
                  v-if="!item.isDir && isShowRenameFileIcon"
                  v-tooltip="t('pages.manage.bucket.renameFile')"
                  type="button"
                  :class="cardActionClass"
                  :aria-label="t('pages.manage.bucket.renameFile')"
                  @click.stop="emit('rename', item)"
                >
                  <EditIcon :size="15" aria-hidden="true" />
                </button>
                <button
                  v-tooltip="t('common.fileTable.download')"
                  type="button"
                  :class="cardActionClass"
                  :aria-label="t('common.fileTable.download')"
                  @click.stop="item.isDir ? emit('download-folder', item) : emit('download', [item])"
                >
                  <DownloadIcon :size="15" aria-hidden="true" />
                </button>
                <div :data-dropdown-index="index">
                  <button
                    v-tooltip="t('common.fileTable.copyAs')"
                    type="button"
                    :class="[cardActionClass, { 'bg-accent! text-white!': copyDropdownIndex === index }]"
                    :aria-label="t('common.fileTable.copyAs')"
                    :aria-expanded="copyDropdownIndex === index"
                    @click.stop="toggleCopyDropdown(index, $event)"
                  >
                    <CopyIcon :size="15" aria-hidden="true" />
                  </button>
                  <teleport to="body">
                    <div
                      v-if="copyDropdownIndex === index"
                      data-copy-menu
                      role="menu"
                      :class="copyMenuClass"
                      :style="getDropdownStyle(index)"
                      @keydown.esc.stop="closeCopyDropdown"
                    >
                      <button
                        v-for="format in linkFormatList"
                        :key="format"
                        type="button"
                        role="menuitem"
                        :class="copyMenuItemClass"
                        @click.stop="emit('copy-link', item, format)"
                      >
                        {{ t(`pages.manage.bucket.linkFormat.${format}`) }}
                      </button>
                      <button
                        v-if="isShowPresignedUrl"
                        type="button"
                        role="menuitem"
                        :class="copyMenuItemClass"
                        @click.stop="async () => emit('copy-text', await getPreSignedUrl(item))"
                      >
                        {{ t('pages.manage.bucket.linkFormat.presign') }}
                      </button>
                    </div>
                  </teleport>
                </div>
                <button
                  v-tooltip="t('pages.manage.bucket.fileInfo')"
                  type="button"
                  :class="cardActionClass"
                  :aria-label="t('pages.manage.bucket.fileInfo')"
                  @click.stop="emit('info', item)"
                >
                  <InfoIcon :size="15" aria-hidden="true" />
                </button>
                <button
                  v-tooltip="t('common.fileTable.delete')"
                  type="button"
                  :class="[cardActionClass, 'not-disabled:hover:bg-danger!']"
                  :aria-label="t('common.fileTable.delete')"
                  :disabled="isDeleting || isLoadingData"
                  @click.stop="emit('delete', item)"
                >
                  <Trash2Icon :size="15" aria-hidden="true" />
                </button>
              </div>
            </div>
          </div>

          <div
            class="flex min-w-0 shrink-0 cursor-pointer flex-col gap-0.5 border-t border-border-secondary px-3 py-2"
            @click="emit('select', item, !item.checked)"
          >
            <div class="flex min-w-0 items-center gap-2">
              <span v-tooltip.overflow="item.fileName" class="min-w-0 flex-1 truncate text-sm font-medium text-main">
                {{ item.fileName ?? '' }}
              </span>
              <span
                v-if="!item.isDir && fileExtension(item.fileName)"
                class="shrink-0 rounded bg-accent/10 px-1.5 py-px text-[10px] font-semibold text-accent uppercase"
              >
                {{ fileExtension(item.fileName) }}
              </span>
            </div>
            <div class="flex min-w-0 items-center gap-1 text-xs text-secondary tabular-nums">
              <template v-if="item.isDir">{{ t('common.fileTable.folder') }}</template>
              <template v-else>
                <span class="shrink-0">{{ formatCollectionSize(item) }}</span>
                <template v-if="cardDate(item)">
                  <span aria-hidden="true">·</span>
                  <span v-tooltip="formatCollectionDate(item)" class="truncate">{{ cardDate(item) }}</span>
                </template>
              </template>
            </div>
          </div>
        </div>
      </template>
    </FileCollection>
  </div>
</template>

<script setup lang="ts">
import {
  CheckIcon,
  CopyIcon,
  DownloadIcon,
  EditIcon,
  FolderIcon,
  FolderOpenIcon,
  InfoIcon,
  LoaderCircleIcon,
  SearchXIcon,
  Trash2Icon,
  UploadIcon,
} from '@lucide/vue'
import { useEventListener } from '@vueuse/core'
import { computed, nextTick, ref, useTemplateRef, watch } from 'vue'
import { toRefs } from 'vue'
import { useI18n } from 'vue-i18n'

import CustomButton from '@/components/common/CustomButton.vue'
import FileCollection from '@/components/FileCollection.vue'
import ImageLocal from '@/components/ImageLocal.vue'
import ImagePreSign from '@/components/ImagePreSign.vue'
import ImageWebdav from '@/components/ImageWebdav.vue'
import EmptyPage from '@/manage/pages/EmptyPage.vue'
import { useManageStore } from '@/manage/stores/manageStore'
import type { BucketFile, ISortTypeList } from '@/manage/types/bucket'
import { getFileIconPath } from '@/manage/utils/filePresentation'
import { getPreviewReferrerPolicy } from '@/manage/utils/filePreview'
import { linkFormatList } from '@/manage/utils/linkFormat'
import { appendThumbnailSuffix } from '@/manage/utils/thumbnailUrl'
import { type FileColumn, fileDate, formatCollectionDate, formatCollectionSize } from '@/utils/fileCollection'

const props = defineProps<{
  configMap: Record<string, any>
  filterList: BucketFile[]
  tableColumns: FileColumn<BucketFile>[]
  tableDensity: 'compact' | 'comfortable'
  layoutStyle: 'grid' | 'table'
  isLoadingData: boolean
  isDeleting: boolean
  currentSortType: ISortTypeList
  sortAscending: boolean
  getS3Config: (item: BucketFile) => Record<string, any>
  getWebdavConfig: () => Record<string, any>
  getPreSignedUrl: (item: BucketFile) => Promise<any>
  /** A search filter is active, so an empty list means "no matches" rather than "empty folder". */
  searching?: boolean
  /** Maximum cards per row in grid view; narrow windows show fewer. */
  gridColumns?: number
}>()
const {
  configMap,
  filterList,
  tableColumns,
  tableDensity,
  layoutStyle,
  isLoadingData,
  isDeleting,
  currentSortType,
  sortAscending,
  getS3Config,
  getWebdavConfig,
  getPreSignedUrl,
} = toRefs(props)
const emit = defineEmits<{
  select: [item: BucketFile, selected: boolean]
  'select-all': [selected: boolean]
  sort: [field: ISortTypeList]
  open: [item: BucketFile]
  rename: [item: BucketFile]
  'download-folder': [item: BucketFile]
  download: [items: BucketFile[]]
  info: [item: BucketFile]
  delete: [item: BucketFile]
  'copy-link': [item: BucketFile, format: string]
  'copy-text': [text: string]
  upload: []
}>()
const { t } = useI18n()
const manageStore = useManageStore()
const copyDropdownIndex = ref(-1)

const dropdownPositions = ref(new Map<number, { left: boolean; up: boolean }>())

// Up to the chosen number of columns, dropping one per 180px the list is narrower.
const gridBreakpoints = computed(() =>
  Array.from({ length: Math.max(1, props.gridColumns ?? 5) }, (_, index) => ({ min: index * 180, cols: index + 1 })),
)

const gridItemHeight = computed(() => {
  const columns = props.gridColumns ?? 5
  if (columns <= 2) return 340
  if (columns <= 4) return 270
  if (columns <= 8) return 230
  return 200
})

watch(
  () => props.gridColumns,
  () => nextTick(() => virtualScrollerRef.value?.refresh()),
)

const hasSelection = computed(() => filterList.value.some(item => item.checked))

const cardActionClass =
  'flex h-[26px] w-[26px] cursor-pointer items-center justify-center rounded-md text-main transition-colors duration-fast ease-apple not-disabled:hover:bg-accent not-disabled:hover:text-white focus-visible:focus-ring disabled:cursor-not-allowed disabled:opacity-50'

const copyMenuClass =
  'flex max-h-[260px] min-w-[150px] flex-col overflow-auto rounded-lg border border-border-secondary bg-bg-tertiary p-1 shadow-lg'

const copyMenuItemClass =
  'cursor-pointer rounded-md px-2.5 py-1.5 text-left text-sm whitespace-nowrap text-main transition-colors duration-fast hover:bg-accent/10 focus:bg-accent/10 focus:outline-none'

/** Cards show the day only; the tooltip and the table carry the full timestamp. */
function cardDate(item: BucketFile) {
  const date = fileDate(item)
  return date === undefined ? item.formatedTime || '' : new Date(date).toLocaleDateString()
}

function fileExtension(fileName = '') {
  const index = fileName.lastIndexOf('.')
  return index > 0 ? fileName.slice(index + 1) : ''
}

// Close the copy menu when clicking anywhere outside it or its trigger.
useEventListener(document, 'pointerdown', event => {
  if (copyDropdownIndex.value < 0) return
  const target = event.target as Element | null
  if (target?.closest('[data-copy-menu]') || target?.closest(`[data-dropdown-index="${copyDropdownIndex.value}"]`))
    return
  copyDropdownIndex.value = -1
})

const currentPicBedName = computed<string>(() => manageStore.config.picBed[configMap.value.alias].picBedName)

const virtualScrollerRef = useTemplateRef('virtualScrollerRef')

const bucketContainerRef = useTemplateRef('bucketContainerRef')

const isShowRenameFileIcon = computed(() =>
  ['tcyun', 'aliyun', 'qiniu', 'upyun', 's3plist', 'webdavplist', 'local', 'sftp'].includes(currentPicBedName.value),
)

const isShowThumbnail = computed(() => manageStore.config.settings.isShowThumbnail ?? false)

const thumbnailSuffix = computed(() => manageStore.config.settings.thumbnailSuffix ?? '')

const isUsePreSignedUrl = computed(() => manageStore.config.settings.isUsePreSignedUrl ?? false)

const isShowPresignedUrl = computed(() =>
  ['aliyun', 'github', 'qiniu', 's3plist', 'tcyun', 'webdavplist'].includes(currentPicBedName.value),
)

function getThumbnailUrl(url: string) {
  return appendThumbnailSuffix(url, thumbnailSuffix.value)
}

function toggleCopyDropdown(index: number, event?: MouseEvent) {
  if (copyDropdownIndex.value === index) {
    copyDropdownIndex.value = -1
  } else {
    copyDropdownIndex.value = index

    if (event) {
      const button = event.currentTarget as HTMLElement
      const rect = button.getBoundingClientRect()
      const viewportWidth = window.innerWidth
      const viewportHeight = window.innerHeight

      const container = bucketContainerRef.value
      const containerRect = container?.getBoundingClientRect()
      const dropdownWidth = 160
      const shouldShowLeft =
        rect.right > viewportWidth - dropdownWidth ||
        (containerRect && rect.right > containerRect.right - dropdownWidth)

      const dropdownHeight = 200
      const shouldShowUp =
        rect.bottom > viewportHeight - dropdownHeight ||
        (containerRect && rect.bottom > containerRect.bottom - dropdownHeight)

      dropdownPositions.value.set(index, {
        left: shouldShowLeft,
        up: shouldShowUp,
        x: rect.left,
        y: rect.top,
        width: rect.width,
        height: rect.height,
      } as any)
    }
    nextTick(() => document.querySelector<HTMLElement>('[data-copy-menu] button')?.focus())
  }
}

function closeCopyDropdown() {
  const index = copyDropdownIndex.value
  copyDropdownIndex.value = -1
  nextTick(() =>
    bucketContainerRef.value
      ?.querySelector<HTMLElement>(`[data-dropdown-index="${index}"] button`)
      ?.focus({ preventScroll: true }),
  )
}

function getDropdownStyle(index: number) {
  const pos: any = dropdownPositions.value.get(index)
  if (!pos) return { display: 'none' as const }
  const estWidth = 180
  const estHeight = 240
  let left = pos.left ? pos.x + pos.width - estWidth : pos.x
  let top = pos.up ? pos.y - estHeight : pos.y + pos.height
  const vw = window.innerWidth
  const vh = window.innerHeight
  if (left + estWidth > vw - 4) left = vw - estWidth - 4
  if (left < 4) left = 4
  if (top + estHeight > vh - 4) top = vh - estHeight - 4
  if (top < 4) top = 4
  return {
    position: 'fixed' as const,
    left: left + 'px',
    top: top + 'px',
    maxHeight: '240px',
    zIndex: 9999,
    minWidth: '100px',
    maxWidth: '200px',
  }
}
watch([layoutStyle, filterList, tableDensity], resetCopyDropdown)
function resetCopyDropdown() {
  copyDropdownIndex.value = -1
}
function onCopied() {
  if (copyDropdownIndex.value >= 0) closeCopyDropdown()
}
function refresh() {
  virtualScrollerRef.value?.refresh()
}
defineExpose({ refresh, onCopied, resetCopyDropdown })
</script>
