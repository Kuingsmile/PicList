<template>
  <div class="relative flex h-full w-full items-center justify-center" @scroll="handleBucketContainerScroll">
    <div class="relative z-1 flex h-full w-full flex-col items-center justify-start gap-1 rounded-xl border-none p-0">
      <!-- Header Card -->
      <div
        v-if="!isContentFullscreen"
        class="flex w-full flex-wrap items-center justify-between gap-4 overflow-visible rounded-xl p-0"
      >
        <div class="flex flex-1 flex-wrap items-center gap-4 p-1">
          <!-- Custom Domain Input/Select -->
          <SingleSelect
            v-if="isShowCustomDomainSelectList && customDomainList.length > 1 && isAutoCustomDomain"
            v-model="currentCustomDomain"
            title=""
            :key-list="customDomainList.map(item => item.value)"
            :fronticon="false"
            @change="handleChangeCustomUrlInput"
          />
          <input
            v-else-if="isShowCustomDomainInput"
            v-model="currentCustomDomain"
            type="text"
            class="w-auto max-w-[200px] min-w-[120px] rounded-md border border-border bg-bg-tertiary px-3 py-2 text-sm text-main placeholder:text-sm placeholder:text-secondary"
            :placeholder="t('pages.manage.bucket.inputCustomDomain')"
            @blur="handleChangeCustomUrlInput"
          />
          <a
            v-else
            class="ml-2 cursor-pointer text-sm font-semibold text-accent no-underline hover:underline"
            @click="copyToClipboard(currentCustomDomain)"
          >
            {{ currentCustomDomain }}
          </a>
        </div>

        <div class="flex flex-wrap gap-1 overflow-visible">
          <!-- Upload Files -->
          <IconButton
            :tips="t('pages.manage.bucket.uploadFiles')"
            type="primary"
            :icon="UploadIcon"
            @click="showUploadDialog"
          />
          <IconButton
            :tips="t('pages.manage.bucket.uploadFromUrl')"
            type="primary"
            :icon="LinkIcon"
            @click="showUrlDialog"
          />
          <IconButton
            v-if="isShowCreateNewFolder"
            :tips="t('pages.manage.bucket.createFolder')"
            type="primary"
            :icon="FolderPlusIcon"
            @click="handleCreateFolder"
          />
          <IconButton
            :tips="t('pages.manage.bucket.downloadPage')"
            type="primary"
            :icon="DownloadIcon"
            @click="showDownloadDialog"
          />
          <IconButton
            v-if="isShowRenameFileIcon"
            :tips="t('pages.manage.bucket.batchRename')"
            type="primary"
            :icon="EditIcon"
            @click="handleBatchRenameFile"
          />

          <!-- Copy URL -->
          <div class="relative">
            <IconButton
              tips=""
              type="primary"
              :icon="CopyIcon"
              :disabled="selectedItems.length === 0"
              @click="handlecopyDropdownOpen"
            />
            <div
              v-if="copyDropdownOpen"
              class="absolute top-full left-0 z-1000 mt-1 min-w-[150px] rounded-md border border-border bg-bg-tertiary shadow-lg"
            >
              <div
                v-for="i in linkFormatList"
                :key="i"
                class="cursor-pointer bg-bg-tertiary px-3 py-2 text-center text-sm text-main hover:bg-accent/50"
                @click="handleBatchCopyLink(i)"
              >
                {{ t(`pages.manage.bucket.linkFormat.${i}`) }}
              </div>
              <div
                v-if="isShowPresignedUrl"
                class="cursor-pointer bg-bg-tertiary px-3 py-2 text-center text-sm text-main hover:bg-accent/50"
                @click="handleBatchCopyLink(preSignedUrlFormat)"
              >
                {{ t('pages.manage.bucket.linkFormat.presign') }}
              </div>
            </div>
          </div>

          <IconButton
            :tips="t('pages.manage.bucket.copyFileIno')"
            type="primary"
            :icon="InfoIcon"
            :disabled="selectedItems.length === 0"
            @click="handleBatchCopyInfo"
          />
          <IconButton
            :tips="t('pages.manage.bucket.forceRefreshFileList')"
            type="secondary"
            :icon="RefreshCwIcon"
            @click="forceRefreshFileList"
          />
          <!-- Search -->
          <input
            v-model="searchText"
            type="text"
            class="w-auto max-w-[200px] min-w-[120px] rounded-md border border-border bg-bg-tertiary px-3 py-2 text-sm text-main placeholder:text-sm placeholder:text-secondary focus:border-accent focus:shadow-sm focus:outline-none"
            :placeholder="t('pages.manage.bucket.searchPlaceholder')"
          />
        </div>
      </div>

      <!-- Deletion failures -->
      <div
        v-if="activeDeletionState.failed.length"
        class="w-full rounded-md border border-border bg-bg-secondary p-3 text-sm text-main"
        role="status"
      >
        <div class="flex items-center justify-between gap-3">
          <span>{{ t('pages.manage.bucket.deleteFailedDetails', { num: activeDeletionState.failed.length }) }}</span>
          <CustomButton
            :disabled="isDeleting || isLoadingData"
            :text="t('pages.manage.bucket.retryFailedOnly')"
            @click="retryFailedDeletions"
          />
        </div>
        <ul class="mt-2 max-h-36 overflow-auto">
          <li v-for="failure in activeDeletionState.failed" :key="`${failure.isDir}:${failure.key}`" class="break-all">
            {{ failure.key }}: {{ failure.error }}
          </li>
        </ul>
      </div>

      <!-- Breadcrumb Card -->
      <div
        v-if="!isContentFullscreen"
        class="flex w-full items-center justify-between gap-4 overflow-hidden rounded-sm border border-border-secondary p-0"
      >
        <div class="flex flex-1 items-center gap-0 overflow-x-auto px-4 py-1">
          <HomeIcon class="h-[16px] w-[16px] shrink-0 text-accent" />
          <template v-if="configMap.prefix !== '/'">
            <template v-for="(item, index) in configMap.prefix.replace(/\/$/g, '').split('/')" :key="index">
              <ChevronRightIcon v-if="index !== 0" class="h-[16px] w-[15px] shrink-0 text-accent" />
              <button
                class="flex shrink-0 cursor-pointer items-center gap-1 rounded-md border-none bg-bg-secondary p-1 text-sm font-semibold text-secondary last:bg-accent/10 hover:bg-accent/10 hover:text-main"
                @click="handleBreadcrumbClick(Number(index))"
              >
                {{ item === '' ? t('pages.manage.bucket.rootFolder') : item }}
              </button>
            </template>
          </template>
          <template v-else>
            <span
              class="flex shrink-0 cursor-pointer items-center gap-1 rounded-md border-none bg-bg-secondary p-1 text-sm font-semibold text-secondary hover:bg-accent/10 hover:text-main"
            >
              {{ t('pages.manage.bucket.rootFolder') }}
            </span>
          </template>
        </div>
      </div>

      <!-- Control Panel Card -->
      <div
        v-if="!isContentFullscreen"
        class="flex w-full flex-wrap items-center justify-between gap-2 overflow-visible rounded-sm border border-border-secondary p-0"
      >
        <FileInfo :current-page-files-info="currentPageFilesInfo" :calculate-all-file-size="calculateAllFileSize" />

        <div class="flex flex-wrap items-center gap-2">
          <!-- Selection Controls -->
          <IconButton
            v-if="selectedItems.length === 0"
            :title="t('pages.manage.bucket.selectAll')"
            type="secondary"
            @click="handleCheckAllChange"
          />
          <template v-else>
            <IconButton :title="t('pages.manage.bucket.cancel')" type="secondary" @click="handleCancelCheck" />
            <IconButton :title="t('pages.manage.bucket.reverseSelect')" type="secondary" @click="handleReverseCheck" />
            <IconButton :title="t('pages.manage.bucket.selectAll')" type="secondary" @click="handleCheckAllChange" />
            <IconButton
              :title="`${t('pages.manage.bucket.downloadBtn', { num: selectedItems.filter(item => item.isDir === false).length })}`"
              type="primary"
              @click="handleBatchDownload"
            />
            <IconButton
              :title="`${t('pages.manage.bucket.removeBtn', { num: selectedItems.length })}`"
              type="danger"
              :disabled="isDeleting || isLoadingData"
              @click="handleBatchDeleteInfo"
            />
          </template>

          <!-- Sort Dropdown -->
          <div class="relative">
            <button
              class="flex cursor-pointer items-center gap-2 rounded-md border border-border bg-bg-secondary px-3 py-2 text-sm font-medium text-secondary hover:border-accent hover:bg-accent/10"
              @click="sortDropdownOpen = !sortDropdownOpen"
            >
              <ArrowUpDownIcon class="h-[16px] w-[16px]" />
              <span class="text-sm font-medium text-secondary">
                {{ t(`pages.manage.bucket.sort.${currentSortType}`) }}</span
              >
              <ChevronDownIcon class="h-[16px] w-[16px]" />
            </button>
            <div
              v-if="sortDropdownOpen"
              class="absolute top-full left-0 z-1000 mt-1 min-w-[150px] rounded-md border border-border bg-bg-tertiary shadow-md"
            >
              <div
                v-for="item in sortTypeList"
                :key="item"
                class="cursor-pointer bg-bg-tertiary px-3 py-2 text-sm text-main transition-all duration-fast ease-apple hover:bg-accent/30 hover:text-white"
                @click="sortFile(item as any)"
              >
                {{ t(`pages.manage.bucket.sort.${item}`) }}
              </div>
            </div>
          </div>
        </div>

        <div class="flex flex-wrap items-center gap-2">
          <!-- Fullscreen Toggle -->
          <IconButton
            :icon="isContentFullscreen ? ShrinkIcon : ExpandIcon"
            :tips="
              isContentFullscreen ? t('pages.manage.bucket.exitFullScreen') : t('pages.manage.bucket.enterFullScreen')
            "
            type="primary"
            class="z-2"
            @click="toggleContentFullscreen"
          />

          <!-- View Toggle -->
          <FileViewControls v-model:view-mode="layoutStyle" v-model:density="tableDensity" />

          <!-- Pagination -->
          <input
            v-if="paging"
            v-model="currentPageNumber"
            type="number"
            min="1"
            class="mr-2 w-[60px] max-w-[60px] min-w-[40px] rounded-md border border-border bg-bg-tertiary px-2 py-1 text-center text-sm text-main focus:border-accent focus:outline-none"
            :disabled="!paging"
            @input="handlePageNumberInput"
          />
        </div>
      </div>

      <!-- Content Card -->
      <div
        v-if="isContentFullscreen"
        class="flex w-full flex-wrap items-center justify-between gap-2 overflow-visible rounded-xl border border-border-secondary p-0 shadow-sm"
      >
        <div class="flex max-w-[400px] min-w-[200px] items-center overflow-x-auto px-4 py-1">
          <div class="flex flex-wrap items-center gap-1 rounded-md shadow-sm">
            <HomeIcon class="h-[16px] w-[16px] shrink-0 text-accent" />
            <template v-if="configMap.prefix !== '/'">
              <template v-for="(item, index) in configMap.prefix.replace(/\/$/g, '').split('/')" :key="index">
                <ChevronRightIcon v-if="index !== 0" class="h-[16px] w-[15px] shrink-0 text-accent" />
                <button
                  class="flex shrink-0 cursor-pointer items-center gap-1 rounded-md border-none bg-bg-secondary p-1 text-sm font-semibold text-secondary last:bg-accent/10 hover:bg-accent/10 hover:text-main"
                  @click="handleBreadcrumbClick(Number(index))"
                >
                  {{ item === '' ? t('pages.manage.bucket.rootFolder') : item }}
                </button>
              </template>
            </template>
            <template v-else>
              <span
                class="flex shrink-0 cursor-pointer items-center gap-1 rounded-md border-none bg-bg-secondary p-1 text-sm font-semibold text-secondary hover:bg-accent/10 hover:text-main"
              >
                {{ t('pages.manage.bucket.rootFolder') }}
              </span>
            </template>
          </div>
        </div>
        <FileInfo :current-page-files-info="currentPageFilesInfo" :calculate-all-file-size="calculateAllFileSize" />
        <div class="flex min-w-[200px] flex-1 flex-wrap items-center justify-end gap-3">
          <!-- Search -->
          <input
            v-model="searchText"
            type="text"
            class="w-auto max-w-[200px] min-w-[120px] rounded-md border border-border bg-bg-tertiary px-3 py-2 text-sm text-main placeholder:text-sm placeholder:text-secondary focus:border-accent focus:shadow-sm focus:outline-none"
            :placeholder="t('pages.manage.bucket.searchPlaceholder')"
          />

          <!-- Exit Fullscreen -->
          <IconButton
            :icon="isContentFullscreen ? ShrinkIcon : ExpandIcon"
            :tips="
              isContentFullscreen ? t('pages.manage.bucket.exitFullScreen') : t('pages.manage.bucket.enterFullScreen')
            "
            type="primary"
            class="z-2"
            @click="toggleContentFullscreen"
          />
          <FileViewControls v-model:view-mode="layoutStyle" v-model:density="tableDensity" />
        </div>
      </div>

      <BucketFileList
        ref="virtualScrollerRef"
        :config-map="configMap"
        :filter-list="filterList"
        :table-columns="tableColumns"
        :table-density="tableDensity"
        :layout-style="layoutStyle"
        :is-loading-data="isLoadingData"
        :is-deleting="isDeleting"
        :current-sort-type="currentSortType"
        :sort-ascending="sortAscending"
        :get-s3-config="handleGetS3Config"
        :get-webdav-config="handleGetWebdavConfig"
        :get-pre-signed-url="getPreSignedUrl"
        @select="(item, selected) => (item.checked = selected)"
        @select-all="setAllSelected"
        @sort="sortFile"
        @open="handleClickFile"
        @rename="handleRenameFile"
        @download-folder="handleFolderBatchDownload"
        @download="downloadFiles"
        @info="handleShowFileInfo"
        @delete="handleDeleteFile"
        @copy-link="copyLink"
        @copy-text="copyToClipboard"
      />
    </div>

    <!-- URL Upload Dialog -->
    <CustomModal
      v-model:visible="dialogVisible"
      :title="t('pages.manage.bucket.urlUploadTitle')"
      width="500px"
      height="auto"
    >
      <div class="flex items-center justify-center p-4">
        <textarea
          v-model="urlToUpload"
          class="h-full min-h-[150px] w-full rounded-xl border-2 border-border p-3 text-sm text-main placeholder:text-sm placeholder:text-secondary focus:border-accent focus:outline-none"
          placeholder="https://www.baidu.com/img/bd_logo1.png&#10;https://www.baidu.com/img/bd_logo1.png"
        />
      </div>

      <template #footer>
        <CustomButton type="secondary" :text="t('common.cancel')" @click="dialogVisible = false" />
        <CustomButton :text="t('common.confirm')" @click="handleUploadFromUrl" />
      </template>
    </CustomModal>

    <!-- Image Preview -->
    <BucketPreviewDialogs :file-preview="filePreview" @error="handlePreviewError" />

    <!-- File Info Dialog -->
    <BucketFileInfoDialog
      v-model:visible="isShowFileInfo"
      :current-showed-file-info="currentShowedFileInfo"
      @copy="copyToClipboard"
    />

    <!-- Batch Rename Dialog -->
    <BucketRenameDialog
      ref="renameDialog"
      :config-map="configMap"
      :provider="currentPicBedName"
      :selected-items="selectedItems"
      :current-page-files-info="currentPageFilesInfo"
      @renamed="resetParam(true)"
    />

    <!-- Loading Indicators -->
    <div v-if="isLoadingData" class="fixed right-[25px] bottom-[25px] z-9999 duration-300 ease-out">
      <div
        class="flex min-w-[240px] items-center gap-3 rounded-lg bg-accent/85 px-4 py-3.5 shadow-lg transition-all duration-200 ease-apple hover:translate-y-[-2px] hover:bg-accent/95 hover:shadow-xl"
      >
        <div
          class="mr-0 inline-block h-[18px] w-[18px] shrink-0 animate-spin rounded-full border-2 border-t-2 border-black/30 border-t-white"
        />
        <span class="flex-1 text-sm leading-[1.4] font-medium text-white">{{ t('pages.manage.bucket.loading') }}</span>
        <button
          v-tooltip="t('common.cancel')"
          class="flex h-[28px] w-[28px] shrink-0 cursor-pointer items-center justify-center rounded-md border border-border bg-white text-accent transition-all duration-fast ease-apple hover:scale-105 hover:border-danger"
          :aria-label="t('common.cancel')"
          @click="cancelLoading"
        >
          <XIcon class="h-[16px] w-[16px]" />
        </button>
      </div>
    </div>

    <div v-if="isLoadingDownloadData" class="fixed top-[50px] right-[25px] z-9999 duration-300 ease-out">
      <div
        class="flex min-w-[240px] items-center gap-3 rounded-lg bg-accent/85 px-4 py-3.5 shadow-lg transition-all duration-200 ease-apple hover:translate-y-[-2px] hover:bg-accent/95 hover:shadow-xl"
      >
        <div
          class="mr-0 inline-block h-[18px] w-[18px] shrink-0 animate-spin rounded-full border-2 border-t-2 border-black/30 border-t-white"
        />
        <span class="flex-1 text-sm leading-[1.4] font-medium text-white">{{
          t('pages.manage.bucket.prepareDownload')
        }}</span>
        <button
          v-tooltip="t('common.cancel')"
          class="flex h-[28px] w-[28px] shrink-0 cursor-pointer items-center justify-center rounded-md border border-border bg-white text-accent transition-all duration-fast ease-apple hover:scale-105 hover:border-danger"
          :aria-label="t('common.cancel')"
          @click="cancelDownloadLoading"
        >
          <XIcon class="h-[16px] w-[16px]" />
        </button>
      </div>
    </div>
    <!-- Upload Drawer -->
    <BucketUploadPanel
      v-model:visible="isShowUploadPanel"
      v-model:keep-directory="isUploadKeepDirStructure"
      :tasks="uploadTaskList"
      :failed="uploadTasks.failed.value"
      @upload="uploadFiles"
      @refresh="uploadTasks.refresh"
      @copy="handleCopyUploadingTaskInfo"
      @clear-finished="handleDeleteUploadedTask"
      @clear-all="handleDeleteAllUploadedTask"
      @cancel-task="cancelUploadTask"
      @keep-directory-change="handleUploadKeepDirChange"
    />

    <!-- Download Drawer -->
    <BucketDownloadPanel
      v-model:visible="isShowDownloadPanel"
      :tasks="downloadTaskList"
      :failed="downloadTasks.failed.value"
      @refresh="downloadTasks.refresh"
      @copy="handleCopyDownloadingTaskInfo"
      @clear-finished="handleDeleteDownloadedTask"
      @clear-all="handleDeleteAllDownloadedTask"
      @open-folder="handleOpenDownloadedFolder"
    />

    <!-- Markdown Preview Dialog -->

    <!-- Text File Preview Dialog -->

    <!-- Video Player Dialog -->

    <!-- Create Folder Dialog -->
    <CustomModal
      v-model:visible="isShowCreateFolderDialog"
      width="600px"
      height="auto"
      :title="t('pages.manage.bucket.createFolder')"
    >
      <SettingSection only-one-row>
        <SettingCard>
          <CustomInput
            v-model="newFolderName"
            :title="t('pages.manage.bucket.inputFolderTitle')"
            :placeholder="t('pages.manage.bucket.inputFolderTitle')"
          />
        </SettingCard>
      </SettingSection>
      <template #footer>
        <CustomButton type="secondary" :text="t('common.cancel')" @click="isShowCreateFolderDialog = false" />
        <CustomButton :disabled="!newFolderName.trim()" :text="t('common.confirm')" @click="confirmCreateFolder" />
      </template>
    </CustomModal>
  </div>
</template>

<script setup lang="ts">
import {
  ArrowUpDownIcon,
  ChevronDownIcon,
  ChevronRightIcon,
  CopyIcon,
  DownloadIcon,
  EditIcon,
  ExpandIcon,
  FolderPlusIcon,
  HomeIcon,
  InfoIcon,
  LinkIcon,
  RefreshCwIcon,
  ShrinkIcon,
  UploadIcon,
  XIcon,
} from '@lucide/vue'
import { useLocalStorage } from '@vueuse/core'
import { computed, onActivated, onBeforeMount, onBeforeUnmount, onDeactivated, ref, useTemplateRef, watch } from 'vue'
import { useI18n } from 'vue-i18n'

import CustomButton from '@/components/common/CustomButton.vue'
import CustomInput from '@/components/common/CustomInput.vue'
import CustomModal from '@/components/common/CustomModal.vue'
import SettingCard from '@/components/common/SettingCard.vue'
import SettingSection from '@/components/common/SettingSection.vue'
import SingleSelect from '@/components/common/SingleSelect.vue'
import FileViewControls from '@/components/FileViewControls.vue'
import { useFilePreview } from '@/composables/useFilePreview'
import useMessage from '@/composables/useMessage'
import BucketDownloadPanel from '@/manage/components/bucket/BucketDownloadPanel.vue'
import BucketFileInfoDialog from '@/manage/components/bucket/BucketFileInfoDialog.vue'
import BucketFileList from '@/manage/components/bucket/BucketFileList.vue'
import BucketPreviewDialogs from '@/manage/components/bucket/BucketPreviewDialogs.vue'
import BucketRenameDialog from '@/manage/components/bucket/BucketRenameDialog.vue'
import BucketUploadPanel from '@/manage/components/bucket/BucketUploadPanel.vue'
import FileInfo from '@/manage/components/FileInfo.vue'
import IconButton from '@/manage/components/IconButton.vue'
import { useBucketDeletion } from '@/manage/composables/useBucketDeletion'
import { useBucketDomains } from '@/manage/composables/useBucketDomains'
import { useBucketDownloads } from '@/manage/composables/useBucketDownloads'
import { useBucketListing } from '@/manage/composables/useBucketListing'
import { useBucketUploads } from '@/manage/composables/useBucketUploads'
import { useTransferTasks } from '@/manage/composables/useTransferTasks'
import { useManageStore } from '@/manage/stores/manageStore'
import type { BucketFile } from '@/manage/types/bucket'
import { formatFileSize } from '@/manage/utils/filePresentation'
import type { PreviewKind, PreviewSource } from '@/manage/utils/filePreview'
import { fileTaskStates } from '@/manage/utils/fileTaskState'
import { textFileExt, videoExt } from '@/manage/utils/fileTypes'
import { formatLink } from '@/manage/utils/linkFormat'
import { type CopyFormat, linkFormatList, preSignedUrlFormat } from '@/manage/utils/linkFormat'
import {
  type FileColumn,
  fileDate,
  fileSize,
  fileType,
  formatCollectionDate,
  formatCollectionSize,
} from '@/utils/fileCollection'
import { IRPCActionType } from '#/constants/rpcActions'
import { trimPath } from '#/utils/url'

const { configMap: configMapProp } = defineProps<{
  configMap: Record<string, any>
}>()

const filePreview = useFilePreview()

let viewGeneration = 0

let unmounted = false

let scrollTimeout: ReturnType<typeof setTimeout> | undefined

const { t } = useI18n()

const message = useMessage()

const manageStore = useManageStore()

const configMap = ref<Record<string, any>>(JSON.parse(JSON.stringify(configMapProp)))

const tableActive = ref(true)

onActivated(() => {
  tableActive.value = true
})

onDeactivated(() => {
  tableActive.value = false
})

const isContentFullscreen = ref(false)

const storedLayoutStyle = useLocalStorage<'list' | 'table' | 'grid'>('manage-bucket-page-layout-style', 'grid')

const layoutStyle = computed({
  get: () => (storedLayoutStyle.value === 'grid' ? ('grid' as const) : ('table' as const)),
  set: (value: 'grid' | 'table') => {
    storedLayoutStyle.value = value
  },
})

const tableDensity = useLocalStorage<'compact' | 'comfortable'>('manage-bucket-table-density', 'compact')

const copyDropdownOpen = ref(false)

const sortDropdownOpen = ref(false)

const isShowFileInfo = ref(false)

const currentShowedFileInfo = ref({} as any)

const currentPrefix = ref('/')

const currentPicBedName = computed<string>(() => manageStore.config.picBed[configMap.value.alias].picBedName)

const { customDomainList, currentCustomDomain, handleChangeCustomUrl, initCustomDomainList } = useBucketDomains({
  configMap,
  currentPicBedName,
  getGeneration: () => viewGeneration,
  isDisposed: () => unmounted,
})

const {
  fileListings,
  isLoadingData,
  isShowLoadingPage,
  currentPageNumber,
  currentPageFilesInfo,
  searchText,
  sortAscending,
  currentSortType,
  paging,
  resetParam,
  forceRefreshFileList,
  handlePageNumberInput,
  sortFile,
  cancelLoading,
  listingParams,
  listingIdentity,
  getTableKeyOfDb,
} = useBucketListing({
  configMap,
  currentPrefix,
  currentPicBedName,
  currentCustomDomain,
  isDisposed: () => unmounted,
  invalidateListings,
  getColumns: () => tableColumns.value,
  closeUrlDialog: () => {
    urlToUpload.value = ''
    dialogVisible.value = false
  },
  onReset: () => {
    currentDownloadFileList.length = 0
    isShowFileInfo.value = false
    isShowCreateFolderDialog.value = false
    newFolderName.value = ''
    lastChoosed.value = -1
  },
  onSorted: () => {
    sortDropdownOpen.value = false
    virtualScrollerRef.value?.resetCopyDropdown()
  },
})

const uploadTaskList = ref([] as IUploadTask[])

const downloadTaskList = ref([] as IDownloadTask[])

const isShiftKeyPress = ref<boolean>(false)

const lastChoosed = ref<number>(-1)

const isShowCreateFolderDialog = ref(false)

const newFolderName = ref('')

const virtualScrollerRef = useTemplateRef('virtualScrollerRef')

const sortTypeList = ['name', 'size', 'time', 'ext', 'provider', 'status', 'check', 'init']

const filterList = computed(() => {
  return getList()
})

const selectedItems = computed(() => filterList.value.filter(item => item.checked))

const isShowCustomDomainSelectList = computed(() =>
  ['tcyun', 'aliyun', 'qiniu', 'github'].includes(currentPicBedName.value),
)

const isShowCustomDomainInput = computed(() =>
  ['aliyun', 'qiniu', 'tcyun', 's3plist', 'webdavplist', 'local', 'sftp'].includes(currentPicBedName.value),
)

const isAutoCustomDomain = computed(() =>
  manageStore.config.picBed[configMap.value.alias].isAutoCustomUrl === undefined
    ? true
    : manageStore.config.picBed[configMap.value.alias].isAutoCustomUrl,
)

const isShowRenameFileIcon = computed(() =>
  ['tcyun', 'aliyun', 'qiniu', 'upyun', 's3plist', 'webdavplist', 'local', 'sftp'].includes(currentPicBedName.value),
)

const calculateAllFileSize = computed(() => {
  const knownSize =
    formatFileSize(currentPageFilesInfo.reduce((total: number, item: any) => total + (fileSize(item) ?? 0), 0)) || '0'
  return currentPageFilesInfo.some(item => !item.isDir && fileSize(item) === undefined) ? `≥ ${knownSize}` : knownSize
})

const isUsePreSignedUrl = computed(() => manageStore.config.settings.isUsePreSignedUrl ?? false)

const isIgnoreCase = computed(() => manageStore.config.settings.isIgnoreCase ?? false)

const isShowCreateNewFolder = computed(() =>
  ['aliyun', 'github', 'local', 'qiniu', 'tcyun', 's3plist', 'upyun', 'webdavplist', 'sftp'].includes(
    currentPicBedName.value,
  ),
)

const isShowPresignedUrl = computed(() =>
  ['aliyun', 'github', 'qiniu', 's3plist', 'tcyun', 'webdavplist'].includes(currentPicBedName.value),
)

const taskStates = computed(() =>
  fileTaskStates(
    uploadTaskList.value,
    configMap.value.alias,
    currentPicBedName.value,
    configMap.value.bucketName || '',
  ),
)

function taskLabel(item: any) {
  if (deletingTargets.value.scope === deletionScope() && deletingTargets.value.keys.has(item.key))
    return t('common.fileTable.deleting')
  if (failedDeletionKeys.value.has(item.key)) return t('common.fileTable.deleteFailed')
  const task = taskStates.value.get(item.key)
  if (!task || !['queuing', 'uploading', 'uploaded', 'failed', 'paused', 'canceled'].includes(task.status))
    return undefined
  const label = t(`common.fileTable.tasks.${task.status}`)
  return task.status === 'uploading' ? `${label} ${Math.round(task.progress || 0)}%` : label
}

const tableColumns = computed<FileColumn<BucketFile>[]>(() => [
  { key: 'name', label: t('common.fileTable.name'), width: 260, value: item => item.fileName },
  {
    key: 'ext',
    label: t('common.fileTable.type'),
    width: 90,
    value: item => (item.isDir ? t('common.fileTable.folder') : fileType(item)),
  },
  { key: 'size', label: t('common.fileTable.size'), width: 100, value: fileSize, format: formatCollectionSize },
  { key: 'time', label: t('common.fileTable.date'), width: 180, value: fileDate, format: formatCollectionDate },
  {
    key: 'provider',
    label: t('common.fileTable.provider'),
    width: 150,
    value: () => `${configMap.value.alias} · ${currentPicBedName.value}`,
  },
  { key: 'status', label: t('common.fileTable.task'), width: 160, value: taskLabel },
])

const {
  isShowUploadPanel,
  isUploadKeepDirStructure,
  dialogVisible,
  urlToUpload,
  handleUploadKeepDirChange,
  showUploadDialog,
  showUrlDialog,
  handleUploadFromUrl,
  uploadFiles,
} = useBucketUploads({
  configMap,
  currentPrefix,
  currentCustomDomain,
  getGeneration: () => viewGeneration,
  isDisposed: () => unmounted,
})

const {
  downloadListings,
  isShowDownloadPanel,
  isLoadingDownloadData,
  currentDownloadFileList,
  showDownloadDialog,
  handleFolderBatchDownload,
  handleBatchDownload,
  downloadFiles,
  cancelDownloadLoading,
} = useBucketDownloads({
  configMap,
  currentPrefix,
  currentPicBedName,
  currentCustomDomain,
  getGeneration: () => viewGeneration,
  isDisposed: () => unmounted,
  listingIdentity,
  listingParams,
  selectedItems,
  handleCancelCheck,
})

const {
  isDeleting,
  deletingTargets,
  activeDeletionState,
  failedDeletionKeys,
  handleBatchDeleteInfo,
  handleDeleteFile,
  deletionScope,
  retryFailedDeletions,
} = useBucketDeletion({
  configMap,
  currentPrefix,
  currentPicBedName,
  currentCustomDomain,
  getGeneration: () => viewGeneration,
  isDisposed: () => unmounted,
  currentPageFilesInfo,
  selectedItems,
  isLoadingData,
  getTableKeyOfDb,
})

const renameDialog = useTemplateRef('renameDialog')

function handleBatchRenameFile() {
  renameDialog.value?.openBatch()
}

function handleRenameFile(item: BucketFile) {
  renameDialog.value?.openFile(item)
}

const {
  uploadTasks,
  downloadTasks,
  cancelUploadTask,
  handleCopyUploadingTaskInfo,
  handleDeleteUploadedTask,
  handleDeleteAllUploadedTask,
  handleCopyDownloadingTaskInfo,
  handleDeleteDownloadedTask,
  handleDeleteAllDownloadedTask,
  handleOpenDownloadedFolder,
} = useTransferTasks({
  tableActive,
  layoutStyle,
  isShowUploadPanel,
  isShowDownloadPanel,
  uploadTaskList,
  downloadTaskList,
  downloadDir: () => manageStore.config.settings.downloadDir,
  onSuccess: action =>
    message.success(t(action === 'copy' ? 'pages.manage.bucket.copySuccess' : 'pages.manage.bucket.deleteSuccess')),
})

watch([layoutStyle, searchText, tableDensity], () => {
  virtualScrollerRef.value?.resetCopyDropdown()
})

watch(
  () => configMapProp,
  async newValue => {
    invalidateListings()
    const generation = viewGeneration
    currentPageFilesInfo.length = 0
    currentDownloadFileList.length = 0
    isShowLoadingPage.value = true
    configMap.value = JSON.parse(JSON.stringify(newValue))
    await initCustomDomainList(generation)
    if (unmounted || generation !== viewGeneration) return
    void resetParam(true)
    void manageStore.refreshConfig()
  },
  { deep: true, immediate: true, flush: 'sync' },
)

function getList() {
  if (!searchText.value) {
    return currentPageFilesInfo
  }
  return currentPageFilesInfo.filter((item: any) => {
    if (isIgnoreCase.value) {
      return item.fileName.toLowerCase().includes(searchText.value.toLowerCase())
    } else {
      return item.fileName.includes(searchText.value)
    }
  })
}

function handleGetWebdavConfig() {
  return manageStore.config.picBed[configMap.value.alias]
}

function toggleContentFullscreen() {
  isContentFullscreen.value = !isContentFullscreen.value
}

function handleBucketContainerScroll() {
  if (scrollTimeout) {
    clearTimeout(scrollTimeout)
  }
  scrollTimeout = setTimeout(() => {
    if (virtualScrollerRef.value) {
      virtualScrollerRef.value.refresh()
    }
  }, 16)
}

function handleShowFileInfo(item: any) {
  isShowFileInfo.value = true
  currentShowedFileInfo.value = item
}

async function handleBreadcrumbClick(index: number) {
  const targetPrefix =
    currentPrefix.value
      .split('/')
      .slice(0, index + 1)
      .join('/') + '/'
  configMap.value.prefix = targetPrefix
  await resetParam(false)
}

async function handleClickFile(item: any) {
  if (item.isDir) {
    configMap.value.prefix = `/${item.key}`
    await resetParam(false)
    return
  }

  const fileName = (item.fileName ?? '').toLowerCase()
  const extension = window.node.path.extname(fileName)
  let kind: PreviewKind
  if (item.isImage) kind = 'image'
  else if (extension === '.md') kind = 'markdown'
  else if (textFileExt.includes(extension) || textFileExt.includes(fileName)) kind = 'text'
  else if (videoExt.includes(extension)) kind = 'video'
  else return

  const provider = currentPicBedName.value
  const source: PreviewSource = {
    url: item.url,
    mimeType: kind === 'video' ? window.node.mime.lookup(fileName) || undefined : undefined,
  }
  if (provider === 'webdavplist') {
    const { authType, username, password } = handleGetWebdavConfig()
    source.webdav = { authType, username, password }
  } else if (
    (isUsePreSignedUrl.value && ['aliyun', 'tcyun', 'qiniu', 's3plist', 'github'].includes(provider)) ||
    (provider === 'github' && configMap.value.bucketConfig.private)
  ) {
    const alias = configMap.value.alias
    const params = handleGetS3Config(item)
    source.sign = () => window.electron.triggerRPC<string>(IRPCActionType.MANAGE_GET_PRE_SIGNED_URL, alias, params)
  }

  try {
    message.success(t('pages.manage.bucket.startLoadingFile'))
    await filePreview.open(kind, source)
  } catch {
    handlePreviewError()
  }
}

function handlePreviewError() {
  filePreview.close()
  message.error(t('pages.manage.bucket.loadingFailed'))
}

async function handleChangeCustomUrlInput() {
  invalidateListings()
  const generation = viewGeneration
  await handleChangeCustomUrl()
  if (unmounted || generation !== viewGeneration) return
  await forceRefreshFileList()
}

function invalidateListings() {
  viewGeneration++
  filePreview.close()
  fileListings.cancel()
  downloadListings.cancel()
  isLoadingData.value = false
  isLoadingDownloadData.value = false
}

function handleCancelCheck() {
  currentPageFilesInfo.forEach((item: any) => {
    item.checked = false
  })
}

function handleReverseCheck() {
  currentPageFilesInfo.forEach((item: any) => {
    item.checked = !item.checked
  })
}

function handleCheckAllChange() {
  const allSelected = selectedItems.value.length === filterList.value.length
  setAllSelected(!allSelected)
}

function setAllSelected(selected: boolean) {
  filterList.value.forEach((item: any) => {
    item.checked = selected
  })
}

async function handleCreateFolder() {
  newFolderName.value = ''
  isShowCreateFolderDialog.value = true
}

async function confirmCreateFolder() {
  const value = newFolderName.value.trim()
  if (!value) {
    return
  }

  isShowCreateFolderDialog.value = false

  try {
    let formatedPath = value
    formatedPath = trimPath(formatedPath)
    const param = {
      // tcyun
      bucketName: configMap.value.bucketName,
      region: configMap.value.bucketConfig.Location,
      key: currentPrefix.value.slice(1) + formatedPath + '/',
      githubBranch: currentCustomDomain.value,
    }
    const res = await window.electron.triggerRPC<any>(
      IRPCActionType.MANAGE_CREATE_BUCKET_FOLDER,
      configMap.value.alias,
      param,
    )
    if (res) {
      message.success(t('pages.manage.bucket.createSuccess'))
    } else {
      message.error(t('pages.manage.bucket.createFailed'))
    }
  } catch (_error) {
    message.error(t('pages.manage.bucket.createFailed'))
  }
}

function handleBatchCopyInfo() {
  if (selectedItems.value.length === 0) {
    message.warning(t('pages.manage.bucket.selectFileMsg'))
    return
  }
  const result = {} as IStringKeyMap
  selectedItems.value.forEach((item: any) => {
    result[item.fileName] = item
  })
  window.electron.clipboard.writeText(JSON.stringify(result, null, 2))
  message.success(`${t('pages.manage.bucket.copySuccess')}`)
}

async function copyLink(item: any, type: string) {
  copyToClipboard(await formatLink(item.url, item.fileName, type, customPasteFormat.value, item.key || item.Key))
  virtualScrollerRef.value?.resetCopyDropdown()
}

const customPasteFormat = computed(
  () =>
    manageStore.config.picBed[configMap.value.alias]?.customPasteFormat ||
    manageStore.config.settings.customPasteFormat,
)

function handlecopyDropdownOpen() {
  copyDropdownOpen.value = !copyDropdownOpen.value
}

async function handleBatchCopyLink(type: CopyFormat) {
  if (!selectedItems.value.length) {
    message.warning(t('pages.manage.bucket.selectFileMsg'))
    copyDropdownOpen.value = false
    return
  }
  try {
    const result: string[] = []
    for (const item of selectedItems.value) {
      if (item.isDir) continue
      if (type === preSignedUrlFormat) {
        const url = await getPreSignedUrl(item)
        if (typeof url !== 'string' || !url.trim() || url === 'error') {
          throw new Error('Failed to generate a pre-signed URL')
        }
        // Signing parameters must be copied exactly as returned by the provider.
        result.push(url)
      } else {
        result.push(await formatLink(item.url, item.fileName, type, customPasteFormat.value, item.key || item.Key))
      }
    }
    window.electron.clipboard.writeText(result.join('\n'))
    message.success(t('pages.manage.bucket.copySuccess'))
  } catch {
    message.error(
      t(type === preSignedUrlFormat ? 'pages.manage.bucket.copyPreSignedUrlFailed' : 'pages.manage.bucket.copyFailed'),
    )
  } finally {
    copyDropdownOpen.value = false
  }
}

function handleGetS3Config(item: any) {
  return {
    bucketName: configMap.value.bucketName,
    region: configMap.value.bucketConfig.Location,
    key: item.key,
    customUrl: currentCustomDomain.value,
    expires: manageStore.config.settings.PreSignedExpire,
    githubPrivate: configMap.value.bucketConfig.private,
    rawUrl: item.url,
  }
}

async function getPreSignedUrl(item: any) {
  const param = {
    // tcyun
    bucketName: configMap.value.bucketName,
    region: configMap.value.bucketConfig.Location,
    key: item.key,
    customUrl: currentCustomDomain.value,
    expires: manageStore.config.settings.PreSignedExpire,
    githubPrivate: configMap.value.bucketConfig.private,
    rawUrl: item.url,
  }
  return await window.electron.triggerRPC<any>(IRPCActionType.MANAGE_GET_PRE_SIGNED_URL, configMap.value.alias, param)
}

function copyToClipboard(text: string) {
  window.electron.clipboard.writeText(String(text))
  message.success(t('pages.manage.bucket.copySuccess'))
  virtualScrollerRef.value?.onCopied()
}

function handleDetectShiftKey(event: KeyboardEvent) {
  if (event.key === 'Shift') {
    if (event.type === 'keydown') {
      isShiftKeyPress.value = true
    } else if (event.type === 'keyup') {
      isShiftKeyPress.value = false
    }
  }

  // F11 键切换全屏模式
  if (event.key === 'F11' && event.type === 'keydown') {
    event.preventDefault() // 阻止浏览器默认的全屏行为
    toggleContentFullscreen()
  }
}

onBeforeMount(async () => {
  document.addEventListener('keydown', handleDetectShiftKey)
  document.addEventListener('keyup', handleDetectShiftKey)
})

onBeforeUnmount(() => {
  unmounted = true
  viewGeneration++
  fileListings.dispose()
  downloadListings.dispose()
  document.removeEventListener('keydown', handleDetectShiftKey)
  document.removeEventListener('keyup', handleDetectShiftKey)
  if (scrollTimeout) clearTimeout(scrollTimeout)
})
</script>
