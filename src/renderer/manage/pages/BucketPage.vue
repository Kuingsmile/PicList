<template>
  <div class="relative flex h-full w-full min-w-0 flex-col" @scroll="handleBucketContainerScroll">
    <!-- Location: breadcrumb + domain / branch -->
    <div class="flex shrink-0 flex-wrap items-center gap-x-4 gap-y-2 border-b border-border-secondary px-4 py-2.5">
      <nav
        ref="breadcrumbNav"
        class="no-scrollbar flex min-w-0 flex-1 items-center gap-0.5 overflow-x-auto"
        :aria-label="t('pages.manage.bucket.location')"
      >
        <template v-for="(segment, index) in breadcrumbs" :key="segment.index">
          <ChevronRightIcon v-if="index !== 0" :size="14" class="shrink-0 text-tertiary" aria-hidden="true" />
          <button
            type="button"
            class="flex shrink-0 cursor-pointer items-center gap-1.5 rounded-md px-2 py-1 text-sm transition-colors duration-fast focus-visible:focus-ring"
            :class="
              index === breadcrumbs.length - 1
                ? 'font-semibold text-main hover:bg-accent/10'
                : 'font-medium text-secondary hover:bg-accent/10 hover:text-main'
            "
            :title="index === 0 ? configMap.bucketName : segment.name"
            :aria-current="index === breadcrumbs.length - 1 ? 'location' : undefined"
            @click="handleBreadcrumbClick(segment.index)"
          >
            <HomeIcon v-if="index === 0" :size="14" class="text-accent" aria-hidden="true" />
            <span class="max-w-[220px] truncate">
              {{ index === 0 ? configMap.bucketName || t('pages.manage.bucket.rootFolder') : segment.name }}
            </span>
          </button>
        </template>
      </nav>

      <div
        v-if="domainControl !== 'none'"
        class="flex max-w-[50%] min-w-0 items-center gap-2 max-md:max-w-full"
        :title="currentPicBedName === 'github' ? undefined : t('pages.manage.bucket.domain')"
      >
        <GitBranchIcon
          v-if="currentPicBedName === 'github'"
          :size="15"
          class="shrink-0 text-tertiary"
          aria-hidden="true"
        />
        <GlobeIcon v-else :size="15" class="shrink-0 text-tertiary" aria-hidden="true" />
        <div v-if="domainControl === 'select'" class="min-w-[160px]">
          <SingleSelect
            v-model="currentCustomDomain"
            title=""
            tight
            :key-list="customDomainList.map(item => item.value)"
            :fronticon="false"
            :aria-label="t('pages.manage.bucket.selectCustomDomain')"
            @change="handleChangeCustomUrlInput"
          />
        </div>
        <input
          v-else-if="domainControl === 'input'"
          v-model="currentCustomDomain"
          type="text"
          class="h-[32px] w-[240px] min-w-0 rounded-lg border border-border bg-bg-secondary px-3 font-mono text-xs text-main transition-all duration-fast ease-apple placeholder:font-sans placeholder:text-secondary focus:border-accent focus:outline-none focus-visible:focus-ring"
          :placeholder="t('pages.manage.bucket.inputCustomDomain')"
          :aria-label="t('pages.manage.bucket.inputCustomDomain')"
          @blur="handleChangeCustomUrlInput"
          @keydown.enter="($event.target as HTMLInputElement).blur()"
        />
        <button
          v-else
          v-tooltip="t('common.copy')"
          type="button"
          class="flex min-w-0 cursor-pointer items-center gap-1.5 rounded-md px-2 py-1 font-mono text-xs text-secondary transition-colors duration-fast hover:bg-accent/10 hover:text-accent focus-visible:focus-ring"
          @click="copyToClipboard(currentCustomDomain)"
        >
          <span class="truncate">{{ currentCustomDomain }}</span>
          <CopyIcon :size="13" class="shrink-0" aria-hidden="true" />
        </button>
      </div>
    </div>

    <!-- Toolbar -->
    <div class="flex shrink-0 flex-wrap items-center gap-2 border-b border-border-secondary px-4 py-2.5">
      <div class="relative flex max-w-[320px] min-w-[160px] flex-1 items-center">
        <SearchIcon :size="16" class="pointer-events-none absolute left-3 text-secondary" aria-hidden="true" />
        <input
          v-model="searchText"
          type="search"
          class="h-[32px] w-full rounded-lg border border-border bg-bg-secondary pr-8 pl-9 text-sm text-main transition-all duration-fast ease-apple placeholder:text-secondary focus:border-accent focus:outline-none focus-visible:focus-ring [&::-webkit-search-cancel-button]:hidden"
          :placeholder="t('pages.manage.bucket.searchPlaceholder')"
          :aria-label="t('pages.manage.bucket.searchPlaceholder')"
        />
        <button
          v-if="searchText"
          type="button"
          class="absolute right-2 flex h-[22px] w-[22px] cursor-pointer items-center justify-center rounded-full text-secondary hover:bg-accent/10 hover:text-main focus-visible:focus-ring"
          :aria-label="t('common.clear')"
          @click="searchText = ''"
        >
          <XIcon :size="14" aria-hidden="true" />
        </button>
      </div>

      <div class="ml-auto flex flex-wrap items-center gap-2">
        <CustomButton
          :icon="UploadIcon"
          :text="t('pages.manage.bucket.upload')"
          class="h-[32px] px-3! py-0!"
          @click="showUploadDialog"
        />
        <div :class="toolGroupClass">
          <button
            v-tooltip="t('pages.manage.bucket.uploadFromUrl')"
            type="button"
            :class="toolButtonClass"
            :aria-label="t('pages.manage.bucket.uploadFromUrl')"
            @click="showUrlDialog"
          >
            <LinkIcon :size="16" aria-hidden="true" />
          </button>
          <button
            v-if="isShowCreateNewFolder"
            v-tooltip="t('pages.manage.bucket.createFolder')"
            type="button"
            :class="toolButtonClass"
            :aria-label="t('pages.manage.bucket.createFolder')"
            @click="handleCreateFolder"
          >
            <FolderPlusIcon :size="16" aria-hidden="true" />
          </button>
          <button
            v-if="isShowRenameFileIcon"
            v-tooltip="t('pages.manage.bucket.batchRename')"
            type="button"
            :class="toolButtonClass"
            :aria-label="t('pages.manage.bucket.batchRename')"
            @click="handleBatchRenameFile"
          >
            <PencilLineIcon :size="16" aria-hidden="true" />
          </button>
        </div>
        <div :class="toolGroupClass">
          <button
            v-tooltip="t('pages.manage.bucket.downloadPage')"
            type="button"
            :class="toolButtonClass"
            :aria-label="t('pages.manage.bucket.downloadPage')"
            @click="showDownloadDialog"
          >
            <ArrowDownToLineIcon :size="16" aria-hidden="true" />
          </button>
          <button
            v-tooltip="t('pages.manage.bucket.forceRefreshFileList')"
            type="button"
            :class="toolButtonClass"
            :disabled="isLoadingData"
            :aria-label="t('pages.manage.bucket.forceRefreshFileList')"
            @click="forceRefreshFileList"
          >
            <RefreshCwIcon
              :size="16"
              :class="{ 'animate-spin motion-reduce:animate-none': isLoadingData }"
              aria-hidden="true"
            />
          </button>
        </div>
        <label
          v-if="layoutStyle === 'grid'"
          v-tooltip="t('pages.manage.bucket.gridColumns')"
          class="flex h-[32px] items-center gap-2 rounded-lg border border-border-secondary px-2.5"
        >
          <LayoutGridIcon :size="14" class="text-secondary" aria-hidden="true" />
          <input
            v-model.number="gridColumns"
            type="range"
            :min="GRID_COLUMNS_MIN"
            :max="GRID_COLUMNS_MAX"
            step="1"
            class="h-[4px] w-[72px] cursor-pointer appearance-none rounded-[2px] bg-(--color-background-tertiary) outline-none focus-visible:focus-ring [&::-webkit-slider-thumb]:h-[14px] [&::-webkit-slider-thumb]:w-[14px] [&::-webkit-slider-thumb]:appearance-none [&::-webkit-slider-thumb]:rounded-full [&::-webkit-slider-thumb]:bg-accent [&::-webkit-slider-thumb]:transition-all [&::-webkit-slider-thumb]:duration-200 hover:[&::-webkit-slider-thumb]:scale-110"
            :aria-label="t('pages.manage.bucket.gridColumns')"
          />
          <span class="w-[1.25rem] text-center text-xs font-semibold text-secondary tabular-nums">
            {{ gridColumns }}
          </span>
        </label>
        <div :class="toolGroupClass" role="group" :aria-label="t('common.fileTable.view')">
          <button
            v-tooltip="t('common.fileTable.grid')"
            type="button"
            :class="toolButtonClass"
            :aria-pressed="layoutStyle === 'grid'"
            :aria-label="t('common.fileTable.grid')"
            @click="layoutStyle = 'grid'"
          >
            <GridIcon :size="16" aria-hidden="true" />
          </button>
          <button
            v-tooltip="t('common.fileTable.table')"
            type="button"
            :class="toolButtonClass"
            :aria-pressed="layoutStyle === 'table'"
            :aria-label="t('common.fileTable.table')"
            @click="layoutStyle = 'table'"
          >
            <ListIcon :size="16" aria-hidden="true" />
          </button>
          <template v-if="layoutStyle === 'table'">
            <span class="mx-0.5 h-[16px] w-px bg-border-secondary" aria-hidden="true" />
            <button
              v-for="density in ['compact', 'comfortable'] as const"
              :key="density"
              v-tooltip="`${t('common.fileTable.density')}: ${t(`common.fileTable.${density}`)}`"
              type="button"
              :class="toolButtonClass"
              :aria-pressed="tableDensity === density"
              :aria-label="`${t('common.fileTable.density')}: ${t(`common.fileTable.${density}`)}`"
              @click="tableDensity = density"
            >
              <Rows4Icon v-if="density === 'compact'" :size="16" aria-hidden="true" />
              <Rows3Icon v-else :size="16" aria-hidden="true" />
            </button>
          </template>
        </div>
        <div :class="toolGroupClass">
          <button
            v-tooltip="
              isContentFullscreen ? t('pages.manage.bucket.exitFullScreen') : t('pages.manage.bucket.enterFullScreen')
            "
            type="button"
            :class="toolButtonClass"
            :aria-pressed="isContentFullscreen"
            :aria-label="
              isContentFullscreen ? t('pages.manage.bucket.exitFullScreen') : t('pages.manage.bucket.enterFullScreen')
            "
            @click="toggleContentFullscreen"
          >
            <ShrinkIcon v-if="isContentFullscreen" :size="16" aria-hidden="true" />
            <ExpandIcon v-else :size="16" aria-hidden="true" />
          </button>
        </div>
      </div>
    </div>

    <!-- Selection bar -->
    <div
      class="flex min-h-[48px] shrink-0 flex-wrap items-center gap-x-3 gap-y-2 border-b border-border-secondary px-4 py-2 transition-colors duration-fast ease-apple"
      :class="selectedItems.length ? 'bg-accent/10' : ''"
    >
      <label class="flex cursor-pointer items-center gap-2.5 text-sm select-none">
        <input
          type="checkbox"
          class="h-[16px] w-[16px] cursor-pointer accent-accent focus-visible:focus-ring disabled:cursor-not-allowed"
          :checked="isAllSelected"
          :indeterminate="selectedItems.length > 0 && !isAllSelected"
          :disabled="!filterList.length"
          :aria-label="t('pages.manage.bucket.selectAll')"
          @change="handleCheckAllChange"
        />
        <span v-if="selectedItems.length" class="font-semibold text-main tabular-nums" aria-live="polite">
          {{ t('pages.manage.bucket.selectedCount', { num: selectedItems.length }) }}
        </span>
        <span v-else class="text-secondary">{{ t('pages.manage.bucket.selectAll') }}</span>
      </label>
      <template v-if="selectedItems.length">
        <button type="button" :class="linkButtonClass" @click="handleReverseCheck">
          {{ t('pages.manage.bucket.reverseSelect') }}
        </button>
        <button type="button" :class="linkButtonClass" @click="handleCancelCheck">
          {{ t('pages.manage.bucket.clearSelection') }}
        </button>
      </template>
      <span v-else class="text-xs text-secondary tabular-nums">
        {{
          calculateAllFileSize === '0'
            ? t('pages.manage.bucket.itemCount', { num: currentPageFilesInfo.length })
            : t('pages.manage.bucket.summary', { num: currentPageFilesInfo.length, size: calculateAllFileSize })
        }}
        <template v-if="searchText"> · {{ t('pages.manage.bucket.matched', { num: filterList.length }) }}</template>
      </span>

      <div class="ml-auto flex flex-wrap items-center gap-2">
        <template v-if="selectedItems.length">
          <ToolbarMenu
            :options="copyMenuOptions"
            :label="t('pages.manage.bucket.copyLinks')"
            @select="handleBatchCopyLink($event as CopyFormat)"
          >
            <ClipboardIcon :size="15" aria-hidden="true" />
            {{ t('pages.manage.bucket.copyLinks') }}
          </ToolbarMenu>
          <button
            v-tooltip="t('pages.manage.bucket.copyFileInfoInJson')"
            type="button"
            :class="[toolGroupClass, toolButtonClass, 'w-[32px]']"
            :aria-label="t('pages.manage.bucket.copyFileIno')"
            @click="handleBatchCopyInfo"
          >
            <InfoIcon :size="16" aria-hidden="true" />
          </button>
          <CustomButton
            type="secondary"
            :icon="DownloadIcon"
            :text="t('pages.manage.bucket.downloadBtn', { num: selectedFileCount })"
            :disabled="selectedFileCount === 0"
            class="h-[32px] px-3! py-0!"
            @click="handleBatchDownload"
          />
          <CustomButton
            type="danger"
            :icon="Trash2Icon"
            :text="t('pages.manage.bucket.removeBtn', { num: selectedItems.length })"
            :disabled="isDeleting || isLoadingData"
            class="h-[32px] px-3! py-0!"
            @click="handleBatchDeleteInfo"
          />
          <span class="mx-0.5 h-[20px] w-px bg-border-secondary max-sm:hidden" aria-hidden="true" />
        </template>
        <ToolbarMenu
          :options="sortMenuOptions"
          :label="t('pages.manage.bucket.sort.title')"
          :tips="t('pages.manage.bucket.sort.title')"
          @select="sortFile($event as any)"
        >
          <ArrowUpDownIcon :size="15" class="text-secondary" aria-hidden="true" />
          {{ t(`pages.manage.bucket.sort.${currentSortType}`) }}
          <template v-if="!['check', 'init'].includes(currentSortType)">
            <ArrowUpIcon v-if="sortAscending" :size="14" class="text-accent" aria-hidden="true" />
            <ArrowDownIcon v-else :size="14" class="text-accent" aria-hidden="true" />
          </template>
        </ToolbarMenu>
        <label v-if="paging" class="flex items-center gap-1.5 text-sm text-secondary">
          {{ t('pages.manage.bucket.page') }}
          <input
            v-model="currentPageNumber"
            type="number"
            min="1"
            class="h-[32px] w-[64px] rounded-lg border border-border bg-bg-secondary px-2 text-center text-sm text-main tabular-nums focus:border-accent focus:outline-none focus-visible:focus-ring"
            @input="handlePageNumberInput"
          />
        </label>
      </div>
    </div>

    <!-- Deletion failures -->
    <div
      v-if="activeDeletionState.failed.length"
      class="mx-4 mt-3 shrink-0 rounded-lg border border-warning/30 bg-warning/10 p-3 text-sm text-main"
      role="status"
    >
      <div class="flex items-center justify-between gap-3">
        <span class="flex items-center gap-2 font-semibold">
          <TriangleAlertIcon :size="16" class="shrink-0 text-warning" aria-hidden="true" />
          {{ t('pages.manage.bucket.deleteFailedDetails', { num: activeDeletionState.failed.length }) }}
        </span>
        <CustomButton
          type="secondary"
          :icon="RotateCcwIcon"
          :disabled="isDeleting || isLoadingData"
          :text="t('pages.manage.bucket.retryFailedOnly')"
          class="h-[30px] px-3! py-0!"
          @click="retryFailedDeletions"
        />
      </div>
      <ul class="m-0 mt-2 max-h-36 list-none overflow-auto p-0 font-mono text-xs text-secondary">
        <li v-for="failure in activeDeletionState.failed" :key="`${failure.isDir}:${failure.key}`" class="break-all">
          {{ failure.key }}: {{ failure.error }}
        </li>
      </ul>
    </div>

    <BucketFileList
      ref="virtualScrollerRef"
      :config-map="configMap"
      :filter-list="filterList"
      :table-columns="tableColumns"
      :table-density="tableDensity"
      :layout-style="layoutStyle"
      :grid-columns="gridColumns"
      :is-loading-data="isLoadingData"
      :is-deleting="isDeleting"
      :current-sort-type="currentSortType"
      :sort-ascending="sortAscending"
      :searching="!!searchText"
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
      @upload="showUploadDialog"
    />

    <!-- URL Upload Dialog -->
    <CustomModal
      v-model:visible="dialogVisible"
      :title="t('pages.manage.bucket.urlUploadTitle')"
      :description="currentLocationLabel"
      width="560px"
      height="auto"
    >
      <div class="p-5">
        <textarea
          v-model="urlToUpload"
          rows="6"
          class="w-full resize-y rounded-lg border border-border bg-bg-secondary p-3 font-mono text-xs leading-relaxed text-main transition-all duration-fast ease-apple placeholder:text-secondary focus:border-accent focus:outline-none focus-visible:focus-ring"
          :aria-label="t('pages.manage.bucket.urlUploadTitle')"
          placeholder="https://example.com/image-1.png&#10;https://example.com/image-2.png"
        />
      </div>

      <template #footer>
        <CustomButton type="secondary" :text="t('common.cancel')" @click="dialogVisible = false" />
        <CustomButton
          :icon="UploadIcon"
          :disabled="!urlToUpload.trim()"
          :text="t('pages.manage.bucket.upload')"
          @click="handleUploadFromUrl"
        />
      </template>
    </CustomModal>

    <!-- Image Preview -->
    <BucketPreviewDialogs
      :file-preview="filePreview"
      :file-name="previewFileName"
      @error="handlePreviewError"
      @copy="copyToClipboard"
    />

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

    <!-- Background work -->
    <div class="pointer-events-none fixed right-6 bottom-6 z-9999 flex flex-col items-end gap-2">
      <TransitionGroup
        enter-active-class="transition-all duration-200 ease-apple"
        enter-from-class="translate-y-2 opacity-0"
        leave-active-class="transition-all duration-150 ease-apple"
        leave-to-class="translate-y-2 opacity-0"
      >
        <div
          v-for="toast in loadingToasts"
          :key="toast.key"
          class="pointer-events-auto flex min-w-[260px] items-center gap-3 rounded-xl border border-border-secondary bg-bg-secondary py-2 pr-2 pl-4 shadow-lg"
          role="status"
        >
          <LoaderCircleIcon :size="18" class="shrink-0 animate-spin text-accent motion-reduce:animate-none" />
          <span class="flex-1 text-sm font-medium text-main">{{ toast.text }}</span>
          <button
            v-tooltip="t('common.cancel')"
            type="button"
            class="flex h-[28px] w-[28px] shrink-0 cursor-pointer items-center justify-center rounded-md text-secondary transition-colors duration-fast hover:bg-danger/10 hover:text-danger focus-visible:focus-ring"
            :aria-label="t('common.cancel')"
            @click="toast.cancel"
          >
            <XIcon :size="16" aria-hidden="true" />
          </button>
        </div>
      </TransitionGroup>
    </div>
    <!-- Upload Drawer -->
    <BucketUploadPanel
      v-model:visible="isShowUploadPanel"
      v-model:keep-directory="isUploadKeepDirStructure"
      :destination="currentLocationLabel"
      :tasks="uploadTaskList"
      :failed="uploadTasks.failed.value"
      @upload="uploadFiles"
      @refresh="uploadTasks.refresh"
      @copy="handleCopyUploadingTaskInfo"
      @clear-finished="handleDeleteUploadedTask"
      @clear-all="handleDeleteAllUploadedTask"
      @cancel-task="cancelUploadTask"
      @update:keep-directory="handleUploadKeepDirChange"
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

    <!-- Create Folder Dialog -->
    <CustomModal
      v-model:visible="isShowCreateFolderDialog"
      width="520px"
      height="auto"
      :title="t('pages.manage.bucket.createFolder')"
      :description="currentLocationLabel"
    >
      <form class="p-5" @submit.prevent="confirmCreateFolder">
        <CustomInput
          v-model="newFolderName"
          :title="t('pages.manage.bucket.inputFolderTitle')"
          :placeholder="t('pages.manage.bucket.inputFolderTitle')"
        />
      </form>
      <template #footer>
        <CustomButton type="secondary" :text="t('common.cancel')" @click="isShowCreateFolderDialog = false" />
        <CustomButton
          :icon="FolderPlusIcon"
          :disabled="!newFolderName.trim()"
          :text="t('common.confirm')"
          @click="confirmCreateFolder"
        />
      </template>
    </CustomModal>
  </div>
</template>

<script setup lang="ts">
import {
  ArrowDownIcon,
  ArrowDownToLineIcon,
  ArrowUpDownIcon,
  ArrowUpIcon,
  ChevronRightIcon,
  ClipboardIcon,
  CopyIcon,
  DownloadIcon,
  ExpandIcon,
  FolderPlusIcon,
  GitBranchIcon,
  GlobeIcon,
  GridIcon,
  HomeIcon,
  InfoIcon,
  LayoutGridIcon,
  LinkIcon,
  ListIcon,
  LoaderCircleIcon,
  PencilLineIcon,
  RefreshCwIcon,
  RotateCcwIcon,
  Rows3Icon,
  Rows4Icon,
  SearchIcon,
  ShrinkIcon,
  Trash2Icon,
  TriangleAlertIcon,
  UploadIcon,
  XIcon,
} from '@lucide/vue'
import { useLocalStorage } from '@vueuse/core'
import { computed, onActivated, onBeforeMount, onBeforeUnmount, onDeactivated, ref, useTemplateRef, watch } from 'vue'
import { useI18n } from 'vue-i18n'

import CustomButton from '@/components/common/CustomButton.vue'
import CustomInput from '@/components/common/CustomInput.vue'
import CustomModal from '@/components/common/CustomModal.vue'
import SingleSelect from '@/components/common/SingleSelect.vue'
import { useFilePreview } from '@/composables/useFilePreview'
import useMessage from '@/composables/useMessage'
import BucketDownloadPanel from '@/manage/components/bucket/BucketDownloadPanel.vue'
import BucketFileInfoDialog from '@/manage/components/bucket/BucketFileInfoDialog.vue'
import BucketFileList from '@/manage/components/bucket/BucketFileList.vue'
import BucketPreviewDialogs from '@/manage/components/bucket/BucketPreviewDialogs.vue'
import BucketRenameDialog from '@/manage/components/bucket/BucketRenameDialog.vue'
import BucketUploadPanel from '@/manage/components/bucket/BucketUploadPanel.vue'
import ToolbarMenu, { type ToolbarMenuOption } from '@/manage/components/ToolbarMenu.vue'
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

const previewFileName = ref('')

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

const isContentFullscreen = defineModel<boolean>('fullscreen', { default: false })

const storedLayoutStyle = useLocalStorage<'list' | 'table' | 'grid'>('manage-bucket-page-layout-style', 'grid')

const layoutStyle = computed({
  get: () => (storedLayoutStyle.value === 'grid' ? ('grid' as const) : ('table' as const)),
  set: (value: 'grid' | 'table') => {
    storedLayoutStyle.value = value
  },
})

const tableDensity = useLocalStorage<'compact' | 'comfortable'>('manage-bucket-table-density', 'compact')

const GRID_COLUMNS_MIN = 1

const GRID_COLUMNS_MAX = 12

const storedGridColumns = useLocalStorage<number>('manage-bucket-grid-columns', 5)

const gridColumns = computed({
  get: () => Math.min(GRID_COLUMNS_MAX, Math.max(GRID_COLUMNS_MIN, Math.round(Number(storedGridColumns.value) || 5))),
  set: value => {
    storedGridColumns.value = value
  },
})

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

const selectedFileCount = computed(() => selectedItems.value.filter(item => !item.isDir).length)

const isAllSelected = computed(
  () => filterList.value.length > 0 && selectedItems.value.length === filterList.value.length,
)

// Keep each segment's position in the prefix: handleBreadcrumbClick slices the prefix by that index.
const breadcrumbs = computed(() =>
  String(configMap.value.prefix ?? '/')
    .replace(/\/$/g, '')
    .split('/')
    .map((name, index) => ({ name, index }))
    .filter(segment => segment.index === 0 || segment.name),
)

const breadcrumbNav = useTemplateRef('breadcrumbNav')

// Deep paths overflow the bar; keep the current folder in view.
watch(
  breadcrumbs,
  () => {
    breadcrumbNav.value?.scrollTo({ left: breadcrumbNav.value.scrollWidth })
  },
  { immediate: true, flush: 'post' },
)

const currentLocationLabel = computed(() =>
  [
    configMap.value.bucketName || t('pages.manage.bucket.rootFolder'),
    ...breadcrumbs.value.slice(1).map(segment => segment.name),
  ].join(' / '),
)

const domainControl = computed<'select' | 'input' | 'text' | 'none'>(() => {
  if (isShowCustomDomainSelectList.value && customDomainList.value.length > 1 && isAutoCustomDomain.value)
    return 'select'
  if (isShowCustomDomainInput.value) return 'input'
  return currentCustomDomain.value ? 'text' : 'none'
})

const copyMenuOptions = computed<ToolbarMenuOption[]>(() => [
  ...linkFormatList.map(value => ({ value, label: t(`pages.manage.bucket.linkFormat.${value}`) })),
  ...(isShowPresignedUrl.value
    ? [{ value: preSignedUrlFormat, label: t('pages.manage.bucket.linkFormat.presign') }]
    : []),
])

const sortMenuOptions = computed<ToolbarMenuOption[]>(() =>
  sortTypeList.map(value => ({
    value,
    label: t(`pages.manage.bucket.sort.${value}`),
    checked: currentSortType.value === value,
  })),
)

const loadingToasts = computed(() => [
  ...(isLoadingData.value ? [{ key: 'list', text: t('pages.manage.bucket.loading'), cancel: cancelLoading }] : []),
  ...(isLoadingDownloadData.value
    ? [{ key: 'download', text: t('pages.manage.bucket.prepareDownload'), cancel: cancelDownloadLoading }]
    : []),
])

const toolGroupClass = 'flex h-[32px] items-center gap-0.5 rounded-lg border border-border-secondary p-0.5'

const toolButtonClass =
  'flex h-full min-w-[28px] cursor-pointer items-center justify-center rounded-md px-1.5 text-secondary transition-colors duration-fast not-disabled:hover:bg-accent/10 not-disabled:hover:text-accent focus-visible:focus-ring disabled:cursor-not-allowed disabled:opacity-40 aria-pressed:bg-accent! aria-pressed:text-white!'

const linkButtonClass =
  'cursor-pointer rounded-md px-1.5 py-0.5 text-xs font-medium text-accent hover:bg-accent/10 focus-visible:focus-ring'

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
    previewFileName.value = item.fileName ?? ''
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

async function handleBatchCopyLink(type: CopyFormat) {
  if (!selectedItems.value.length) {
    message.warning(t('pages.manage.bucket.selectFileMsg'))
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
