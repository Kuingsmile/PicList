<template>
  <div
    ref="bucketContainerRef"
    class="flex min-h-[240px] w-full min-w-0 flex-1 flex-col overflow-hidden rounded-md border border-border-secondary p-1 shadow-md"
  >
    <div v-if="filterList.length === 0" class="h-full w-full">
      <EmptyPage />
    </div>
    <FileCollection
      v-else
      ref="virtualScrollerRef"
      :items="filterList"
      :columns="tableColumns"
      :density="tableDensity"
      :grid-item-height="260"
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
              class="absolute z-9999 flex max-h-[260px] min-w-[140px] flex-col overflow-auto rounded-md border border-border bg-bg-tertiary p-1 shadow-md"
              :style="getDropdownStyle(index)"
              @keydown.esc.stop="closeCopyDropdown"
            >
              <button
                v-for="format in linkFormatList"
                :key="format"
                type="button"
                :tabindex
                class="cursor-pointer rounded px-3 py-2 text-left text-sm text-main hover:bg-accent/30 focus-visible:outline-accent"
                @click.stop="emit('copy-link', item, format)"
              >
                {{ t(`pages.manage.bucket.linkFormat.${format}`) }}
              </button>
              <button
                v-if="isShowPresignedUrl"
                type="button"
                :tabindex
                class="cursor-pointer rounded px-3 py-2 text-left text-sm text-main hover:bg-accent/30"
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
          class="group/image m-0 box-border flex h-[calc(100%-8px)] w-full cursor-pointer flex-col overflow-hidden rounded-lg border-2 border-border shadow-sm transition-all duration-fast ease-apple hover:translate-y-[-2px] hover:border-accent hover:shadow-md [.selected]:border-2 [.selected]:border-accent [.selected]:shadow-md"
          :class="{ selected: item.checked }"
          @click="emit('select', item, !item.checked)"
        >
          <div
            class="relative mb-2 flex aspect-auto min-h-0 flex-1 items-center justify-center overflow-hidden border-b border-dashed border-b-accent/40"
            @click.stop="emit('open', item)"
          >
            <!-- Image Preview -->
            <template v-if="!item.isDir && !['webdavplist', 'sftp', 'local', 's3plist'].includes(currentPicBedName)">
              <img
                v-if="isShowThumbnail && item.isImage"
                :src="getThumbnailUrl(item.url)"
                class="h-full w-full object-contain transition-all duration-fast ease-apple"
                @error="() => {}"
              />
              <img
                v-else
                :src="`./assets/icons/${getFileIconPath(item.fileName ?? '')}`"
                class="h-full w-full object-contain transition-all duration-fast ease-apple"
              />
            </template>

            <!-- S3 PreSign Image -->
            <ImagePreSign
              v-else-if="
                isShowThumbnail && !item.isDir && item.isImage && currentPicBedName === 's3plist' && isUsePreSignedUrl
              "
              :is-show-thumbnail="isShowThumbnail"
              :item
              :alias="configMap.alias"
              :url="item.url"
              :config="getS3Config(item)"
            />

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
            <template v-else-if="!item.isDir">
              <img
                :src="`./assets/icons/${getFileIconPath(item.fileName ?? '')}`"
                class="h-full w-full object-contain p-4 transition-all duration-fast ease-apple"
              />
            </template>

            <!-- Folder Icon -->
            <template v-else>
              <FolderIcon class="h-[64px] w-[64px] text-accent/70" />
            </template>
          </div>

          <div class="flex min-w-0 shrink-0 flex-col justify-between gap-0.5">
            <div
              v-tooltip.overflow="item.fileName"
              class="w-full truncate text-center text-sm font-medium text-main"
              @click.stop="emit('copy-text', item.fileName ?? '')"
            >
              {{ item.fileName ?? '' }}
            </div>
            <div v-if="!item.isDir" class="flex items-center justify-center gap-2 text-xs font-medium text-secondary">
              <span class="text-center text-xs font-medium">{{ formatFileSize(item.fileSize) }}</span>
              <span class="text-center text-xs font-medium">{{ item.formatedTime }}</span>
            </div>
            <div class="mr-2 flex items-center justify-between">
              <div class="flex flex-1 justify-center gap-2">
                <!-- Rename -->
                <button
                  v-if="!item.isDir && isShowRenameFileIcon"
                  class="flex h-[26px] w-[26px] cursor-pointer items-center justify-center rounded-sm border-none bg-bg-secondary p-1.5 text-secondary transition-all duration-fast ease-apple hover:-translate-y-px hover:bg-accent/50 hover:text-white [.danger]:hover:bg-error/50 [.danger]:hover:text-white"
                  @click.stop="emit('rename', item)"
                >
                  <EditIcon class="h-[16px] w-[16px]" />
                </button>

                <!-- Download Folder -->
                <button
                  v-if="item.isDir"
                  class="flex h-[26px] w-[26px] cursor-pointer items-center justify-center rounded-sm border-none bg-bg-secondary p-1.5 text-secondary transition-all duration-fast ease-apple hover:-translate-y-px hover:bg-accent/50 hover:text-white [.danger]:hover:bg-error/50 [.danger]:hover:text-white"
                  @click.stop="emit('download-folder', item)"
                >
                  <DownloadIcon class="h-[16px] w-[16px]" />
                </button>

                <!-- Copy Link Dropdown -->
                <div class="relative z-100" :data-dropdown-index="index">
                  <button
                    class="flex h-[26px] w-[26px] cursor-pointer items-center justify-center rounded-sm border-none bg-bg-secondary p-1.5 text-secondary transition-all duration-fast ease-apple hover:-translate-y-px hover:bg-accent/50 hover:text-white [.danger]:hover:bg-error/50 [.danger]:hover:text-white"
                    @click.stop="toggleCopyDropdown(index, $event)"
                  >
                    <CopyIcon class="h-[16px] w-[16px]" />
                  </button>
                  <teleport to="body">
                    <div
                      v-if="copyDropdownIndex === index"
                      class="absolute top-full right-0 z-9999 mt-1 max-h-[240px] max-w-[200px] min-w-[100px] overflow-visible overflow-y-auto border border-border bg-bg-tertiary whitespace-nowrap shadow-md transition-all duration-fast ease-apple"
                      :style="getDropdownStyle(index)"
                    >
                      <div
                        v-for="format in linkFormatList"
                        :key="format"
                        class="flex cursor-pointer border-b border-b-border-secondary bg-bg-tertiary px-3 py-2 text-center text-sm text-main last:border-b-0 hover:bg-accent/50 hover:text-white"
                        @click.stop="emit('copy-link', item, format)"
                      >
                        {{ t(`pages.manage.bucket.linkFormat.${format}`) }}
                      </div>
                      <div
                        v-if="isShowPresignedUrl"
                        class="flex cursor-pointer border-b border-b-border-secondary bg-bg-tertiary px-3 py-2 text-sm text-main last:border-b-0 hover:bg-accent/50 hover:text-white"
                        @click.stop="async () => emit('copy-text', await getPreSignedUrl(item))"
                      >
                        {{ t('pages.manage.bucket.linkFormat.presign') }}
                      </div>
                    </div>
                  </teleport>
                </div>

                <!-- File Info -->
                <button
                  class="flex h-[26px] w-[26px] cursor-pointer items-center justify-center rounded-sm border-none bg-bg-secondary p-1.5 text-secondary transition-all duration-fast ease-apple hover:-translate-y-px hover:bg-accent/50 hover:text-white [.danger]:hover:bg-error/50 [.danger]:hover:text-white"
                  @click.stop="emit('info', item)"
                >
                  <InfoIcon class="h-[16px] w-[16px]" />
                </button>

                <!-- Delete -->
                <button
                  class="danger flex h-[26px] w-[26px] cursor-pointer items-center justify-center rounded-sm border-none bg-bg-secondary p-1.5 text-secondary transition-all duration-fast ease-apple hover:-translate-y-px hover:bg-accent/50 hover:text-white [.danger]:hover:bg-error/50 [.danger]:hover:text-white"
                  :disabled="isDeleting || isLoadingData"
                  @click.stop="emit('delete', item)"
                >
                  <Trash2Icon class="h-[16px] w-[16px]" />
                </button>
              </div>

              <!-- Checkbox -->
              <label class="relative flex cursor-pointer items-center" @click.stop>
                <input
                  :checked="item.checked"
                  type="checkbox"
                  class="peer absolute h-0 w-0 cursor-pointer opacity-0"
                  @change="emit('select', item, ($event.target as HTMLInputElement).checked)"
                  @click.stop
                />
                <span
                  class="relative inline-block h-[16px] w-[16px] rounded-sm border-2 border-accent/50 transition-all duration-fast ease-apple peer-checked:border-accent-hover peer-checked:bg-accent peer-checked:after:absolute peer-checked:after:top-[-2px] peer-checked:after:left-px peer-checked:after:text-[12px] peer-checked:after:font-bold peer-checked:after:text-white peer-checked:after:content-['✓']"
                />
              </label>
            </div>
          </div>
        </div>
      </template>
    </FileCollection>
  </div>
</template>

<script setup lang="ts">
import { CopyIcon, DownloadIcon, EditIcon, FolderIcon, InfoIcon, Trash2Icon } from '@lucide/vue'
import { computed, nextTick, ref, useTemplateRef, watch } from 'vue'
import { toRefs } from 'vue'
import { useI18n } from 'vue-i18n'

import FileCollection from '@/components/FileCollection.vue'
import ImageLocal from '@/components/ImageLocal.vue'
import ImagePreSign from '@/components/ImagePreSign.vue'
import ImageWebdav from '@/components/ImageWebdav.vue'
import EmptyPage from '@/manage/pages/EmptyPage.vue'
import { useManageStore } from '@/manage/stores/manageStore'
import type { BucketFile, ISortTypeList } from '@/manage/types/bucket'
import { formatFileSize, getFileIconPath } from '@/manage/utils/filePresentation'
import { linkFormatList } from '@/manage/utils/linkFormat'
import { appendThumbnailSuffix } from '@/manage/utils/thumbnailUrl'
import type { FileColumn } from '@/utils/fileCollection'

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
}>()
const { t } = useI18n()
const manageStore = useManageStore()
const copyDropdownIndex = ref(-1)

const dropdownPositions = ref(new Map<number, { left: boolean; up: boolean }>())

const gridBreakpoints = ref([
  { min: 0, cols: 1 },
  { min: 380, cols: 2 },
  { min: 768, cols: 3 },
  { min: 1024, cols: 4 },
  { min: 1280, cols: 5 },
  { min: 1536, cols: 6 },
])

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
    if (layoutStyle.value === 'table')
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
  if (layoutStyle.value === 'table' && copyDropdownIndex.value >= 0) closeCopyDropdown()
  else resetCopyDropdown()
}
function refresh() {
  virtualScrollerRef.value?.refresh()
}
defineExpose({ refresh, onCopied, resetCopyDropdown })
</script>
