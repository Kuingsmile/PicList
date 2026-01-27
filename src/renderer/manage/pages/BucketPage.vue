<!-- eslint-disable vue/no-v-html -->
<template>
  <div
    ref="bucketContainerRef"
    class="relative flex h-full w-full items-center justify-center"
    @scroll="handleBucketContainerScroll"
  >
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
                v-for="i in linkFormatArray"
                :key="i.key"
                class="cursor-pointer bg-bg-tertiary px-3 py-2 text-center text-sm text-main hover:bg-accent/50"
                @click="handleBatchCopyLink(i.value)"
              >
                {{ i.key }}
              </div>
              <div
                v-if="isShowPresignedUrl"
                class="cursor-pointer bg-bg-tertiary px-3 py-2 text-center text-sm text-main hover:bg-accent/50"
                @click="handleBatchCopyLink('preSignURL')"
              >
                preSignURL
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
              @click="handleBatchDeleteInfo"
            />
          </template>

          <!-- Sort Dropdown -->
          <div class="relative">
            <button
              class="flex cursor-pointer items-center gap-2 rounded-md border border-border bg-bg-secondary px-3 py-2 text-sm font-medium text-secondary hover:border-accent hover:bg-accent/10"
              @click="sortDropdownOpen = !sortDropdownOpen"
            >
              <ArrowUpDownIcon class="action-icon" />
              <span class="text-sm font-medium text-secondary">
                {{ t(`pages.manage.bucket.sort.${currentSortType}`) }}</span
              >
              <ChevronDownIcon class="action-icon" />
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

        <div class="flex items-center gap-2">
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
          <IconButton :icon="layoutStyle === 'grid' ? GridIcon : ListIcon" type="primary" @click="handleViewChange" />

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
        <div class="flex min-w-[200px] flex-1 items-center justify-end gap-3">
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
          <IconButton :icon="layoutStyle === 'grid' ? GridIcon : ListIcon" type="primary" @click="handleViewChange" />
        </div>
      </div>

      <div
        class="no-scrollbar flex min-h-[500px] w-full flex-1 flex-col flex-wrap items-center justify-center gap-2 overflow-auto rounded-md border border-border-secondary p-1 shadow-md"
      >
        <div v-if="filterList.length === 0" class="h-full w-full">
          <EmptyPage />
        </div>
        <VirtualScroller
          v-else
          ref="virtualScrollerRef"
          :items="filterList"
          class="virtual-gallery-scroller min-h-0 w-full flex-1 p-3"
          :item-height="260"
          :view-mode="layoutStyle"
          :grid-breakpoints="gridBreakpoints"
          key-field="key"
        >
          <template #default="{ item, index }">
            <!-- Grid View -->
            <div
              class="group/image m-0 box-border flex h-[calc(100%-8px)] w-full cursor-pointer flex-col overflow-hidden rounded-lg border-2 border-border shadow-sm transition-all duration-fast ease-apple hover:-translate-y-[2px] hover:border-accent hover:shadow-md [.selected]:border-2 [.selected]:border-accent [.selected]:shadow-md"
              :class="{ selected: item.checked }"
              @click="item.checked = !item.checked"
            >
              <div
                class="relative mb-2 flex aspect-auto min-h-0 flex-1 items-center justify-center overflow-hidden border-b border-dashed border-b-accent/40"
                @click.stop="handleClickFile(item)"
              >
                <!-- Image Preview -->
                <template
                  v-if="!item.isDir && !['webdavplist', 'sftp', 'local', 's3plist'].includes(currentPicBedName)"
                >
                  <img
                    v-if="isShowThumbnail && item.isImage"
                    :src="item.url"
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
                  v-else-if="!item.isDir && currentPicBedName === 's3plist' && isUsePreSignedUrl"
                  :is-show-thumbnail="isShowThumbnail"
                  :item="item"
                  :alias="configMap.alias"
                  :url="item.url"
                  :config="handleGetS3Config(item)"
                />

                <!-- WebDAV Image -->
                <ImageWebdav
                  v-else-if="!item.isDir && currentPicBedName === 'webdavplist' && item.isImage"
                  :is-show-thumbnail="isShowThumbnail"
                  :item="item"
                  :config="handleGetWebdavConfig()"
                  :url="item.url"
                />

                <!-- Local Image -->
                <ImageLocal
                  v-else-if="!item.isDir && currentPicBedName === 'local' && item.isImage"
                  :is-show-thumbnail="isShowThumbnail"
                  :item="item"
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
                  class="w-full truncate text-center text-sm font-medium text-main"
                  :title="item.fileName"
                  @click.stop="copyToClipboard(item.fileName ?? '')"
                >
                  {{ item.fileName ?? '' }}
                </div>
                <div
                  v-if="!item.isDir"
                  class="flex items-center justify-center gap-2 text-xs font-medium text-secondary"
                >
                  <span class="text-medium text-center text-xs font-medium">{{ formatFileSize(item.fileSize) }}</span>
                  <span class="text-medium text-center text-xs font-medium">{{ item.formatedTime }}</span>
                </div>
                <div class="mr-2 flex items-center justify-between">
                  <div class="flex flex-1 justify-center gap-2">
                    <!-- Rename -->
                    <button
                      v-if="!item.isDir && isShowRenameFileIcon"
                      class="file-action-button"
                      @click.stop="handleRenameFile(item)"
                    >
                      <EditIcon class="action-icon" />
                    </button>

                    <!-- Download Folder -->
                    <button v-if="item.isDir" class="file-action-button" @click.stop="handleFolderBatchDownload(item)">
                      <DownloadIcon class="action-icon" />
                    </button>

                    <!-- Copy Link Dropdown -->
                    <div class="relative z-100" :data-dropdown-index="index">
                      <button class="file-action-button" @click.stop="toggleCopyDropdown(index, $event)">
                        <CopyIcon class="action-icon" />
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
                            class="itmes-center flex cursor-pointer border-b border-b-border-secondary bg-bg-tertiary px-3 py-2 text-center text-sm text-main last:border-b-0 hover:bg-accent/50 hover:text-white"
                            @click.stop="copyLink(item, format)"
                          >
                            {{ t(`pages.manage.bucket.linkFormat.${format}`) }}
                          </div>
                          <div
                            v-if="isShowPresignedUrl"
                            class="itmes-center flex cursor-pointer border-b border-b-border-secondary bg-bg-tertiary px-3 py-2 text-sm text-main last:border-b-0 hover:bg-accent/50 hover:text-white"
                            @click.stop="async () => copyToClipboard(await getPreSignedUrl(item))"
                          >
                            {{ t('pages.manage.bucket.linkFormat.presign') }}
                          </div>
                        </div>
                      </teleport>
                    </div>

                    <!-- File Info -->
                    <button class="file-action-button" @click.stop="handleShowFileInfo(item)">
                      <InfoIcon class="action-icon" />
                    </button>

                    <!-- Delete -->
                    <button class="file-action-button danger" @click.stop="handleDeleteFile(item)">
                      <Trash2Icon class="action-icon" />
                    </button>
                  </div>

                  <!-- Checkbox -->
                  <label class="relative flex cursor-pointer items-center" @click.stop>
                    <input
                      v-model="item.checked"
                      type="checkbox"
                      class="peer absolute h-0 w-0 cursor-pointer opacity-0"
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
        </VirtualScroller>
      </div>
    </div>

    <!-- URL Upload Dialog -->
    <CustomModal
      v-if="dialogVisible"
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
        <CustomButton type="primary" :text="t('common.confirm')" @click="handleUploadFromUrl" />
      </template>
    </CustomModal>

    <!-- Image Preview -->
    <CustomModal
      v-if="isShowImagePreview"
      v-model:visible="isShowImagePreview"
      :title="t('pages.manage.bucket.imagePreview')"
      width="auto"
      height="auto"
      class="image-preview-modal"
    >
      <div class="flex-1 p-4">
        <img
          :src="ImagePreviewList[getCurrentPreviewIndex]"
          style="max-width: 100%; max-height: 70vh; object-fit: contain"
        />
      </div>
    </CustomModal>

    <!-- File Info Dialog -->
    <CustomModal
      v-if="isShowFileInfo"
      v-model:visible="isShowFileInfo"
      width="800px"
      height="auto"
      :title="t('pages.manage.bucket.fileInfo')"
    >
      <div class="flex items-center justify-end p-1">
        <CustomButton
          type="primary"
          :text="t('pages.manage.bucket.copyFileInfoInJson')"
          @click="copyToClipboard(JSON.stringify(currentShowedFileInfo, null, 2))"
        />
      </div>
      <div class="flex-1 overflow-y-auto bg-bg p-6">
        <div
          v-for="(value, key) in currentShowedFileInfo"
          :key="key"
          class="mb-4 flex items-start gap-4 rounded-md border border-border-secondary bg-bg-secondary p-3 hover:border-accent hover:bg-accent/30"
        >
          <div
            class="shrink-0 grow-0 basis-1/4 cursor-pointer overflow-hidden rounded-sm px-2 py-1 text-sm font-semibold text-ellipsis whitespace-nowrap text-main"
            :title="`Click to copy key-value pair: ${key}`"
            @click="copyToClipboard(JSON.stringify({ [key]: value }))"
          >
            {{ key }}
          </div>
          <div
            class="max-h-[120px] flex-1 cursor-pointer overflow-hidden rounded-sm px-2 py-1 font-['SF_Mono',Monaco,Inconsolata,'Roboto_Mono',monospace] text-sm leading-[1.5] text-ellipsis whitespace-nowrap text-secondary"
            :title="`Click to copy: ${value}`"
            @click="copyToClipboard(value)"
          >
            {{ value }}
          </div>
        </div>
      </div>
    </CustomModal>

    <!-- Batch Rename Dialog -->
    <CustomModal
      v-if="isShowBatchRenameDialog"
      v-model:visible="isShowBatchRenameDialog"
      width="700px"
      height="auto"
      :title="t('pages.manage.bucket.renameFile')"
    >
      <div class="p-6">
        <div class="mb-6 last:mb-0">
          <label class="mb-2 flex items-center gap-2 text-sm font-medium text-main">
            {{ t('pages.manage.bucket.matchedPattern', { num: matchedFilesNumber.length }) }}
            <div class="group relative inline-block">
              <InfoIcon class="action-icon" />
              <span
                class="invisible absolute top-[125%] left-1/2 z-1000 w-max max-w-[200px] translate-x-[-50%] rounded-md border border-border bg-bg-tertiary p-2 text-center text-xs text-main opacity-0 shadow-md transition-opacity duration-300 group-hover:visible group-hover:opacity-100"
                >{{ t('pages.manage.bucket.regexPatternTips') }}</span
              >
            </div>
          </label>
          <input
            v-model="batchRenameMatch"
            type="text"
            class="w-full rounded-md border border-border bg-bg-tertiary p-3 text-sm text-main focus:border-accent focus:bg-white focus:outline-none"
            :placeholder="t('pages.manage.bucket.regexPlaceholder')"
            @focus="showMatchedUrls = true"
            @blur="showMatchedUrls = false"
          />
          <div
            v-if="showMatchedUrls && matchedFilesNumber.length > 0"
            class="absolute z-1000 mt-2 max-h-[300px] max-w-[650px] overflow-hidden rounded-md border border-border-secondary bg-bg-tertiary p-0 shadow-md"
          >
            <div class="border-b border-b-border-secondary bg-bg-secondary px-4 py-3 text-sm font-semibold text-main">
              Matched ({{ matchedFilesNumber.length }}):
            </div>
            <div class="max-h-[240px] overflow-auto p-2">
              <div
                v-for="(item, index) in matchedFilesNumber"
                :key="index"
                class="rounded-sm px-3 py-2 font-['SF_Mono',Monaco,'Cascadia_Code','Roboto_Mono',Consolas,'Courier_New',monospace] text-sm break-all text-secondary transition-all duration-fast ease-apple hover:bg-surface-elevated"
              >
                {{ item?.fileName || item?.key || item }}
              </div>
            </div>
          </div>
        </div>

        <div class="mb-6 last:mb-0">
          <label class="mb-2 flex items-center gap-2 text-sm font-medium text-main">
            {{ t('pages.manage.bucket.replaceInput') }}
            <button
              class="flex h-[20px] w-[20px] cursor-pointer items-center justify-around rounded-full border-none bg-accent text-white transition-all duration-fast ease-apple hover:bg-accent-hover"
              @click="showFormatInfo = !showFormatInfo"
            >
              <InfoIcon :size="16" />
            </button>
          </label>
          <input
            v-model="batchRenameReplace"
            type="text"
            class="w-full rounded-md border border-border bg-bg-tertiary p-3 text-sm text-main focus:border-accent focus:bg-white focus:outline-none"
            placeholder="Ex. {Y}-{m}-{uuid}"
          />
        </div>

        <div class="mb-6 last:mb-0">
          <CustomSwitch
            v-model="isRenameIncludeExt"
            small
            no-border
            :title="isRenameIncludeExt ? t('pages.manage.bucket.includeExt') : t('pages.manage.bucket.excludeExt')"
          />
        </div>
        <div v-if="showFormatInfo" class="mb-6 last:mb-0">
          <label>{{ t('pages.settings.upload.availablePlaceholders') }}</label>
          <PlaceholderTable :list="advancedRenameList" :title-list="advancedRenameTitleList" />
        </div>
      </div>
      <template #footer>
        <CustomButton :type="'secondary'" :text="t('common.cancel')" @click="isShowBatchRenameDialog = false" />
        <CustomButton
          :type="'primary'"
          :text="t('common.confirm')"
          @click="isSingleRename ? singleRename() : BatchRename()"
        />
      </template>
    </CustomModal>

    <!-- Loading Indicators -->
    <div v-if="isLoadingData" class="animate-slide-right fixed right-[25px] bottom-[25px] z-9999 duration-300 ease-out">
      <div
        class="flex min-w-[240px] items-center gap-3 rounded-lg bg-accent/85 px-4 py-3.5 shadow-lg transition-all duration-200 ease-apple hover:-translate-y-[2px] hover:bg-accent/95 hover:shadow-xl"
      >
        <div
          class="mr-0 inline-block h-[18px] w-[18px] shrink-0 animate-spin rounded-full border-2 border-t-2 border-black/30 border-t-white"
        />
        <span class="flex-1 text-sm leading-[1.4] font-medium text-white">{{ t('pages.manage.bucket.loading') }}</span>
        <button
          class="flex h-[28px] w-[28px] shrink-0 cursor-pointer items-center justify-center rounded-md border border-border bg-white text-accent transition-all duration-fast ease-apple hover:scale-105 hover:border-danger"
          :title="t('common.cancel')"
          @click="cancelLoading"
        >
          <XIcon class="action-icon" />
        </button>
      </div>
    </div>

    <div
      v-if="isLoadingDownloadData"
      class="animate-slide-right fixed top-[50px] right-[25px] z-9999 duration-300 ease-out"
    >
      <div
        class="flex min-w-[240px] items-center gap-3 rounded-lg bg-accent/85 px-4 py-3.5 shadow-lg transition-all duration-200 ease-apple hover:-translate-y-[2px] hover:bg-accent/95 hover:shadow-xl"
      >
        <div
          class="mr-0 inline-block h-[18px] w-[18px] shrink-0 animate-spin rounded-full border-2 border-t-2 border-black/30 border-t-white"
        />
        <span class="flex-1 text-sm leading-[1.4] font-medium text-white">{{
          t('pages.manage.bucket.prepareDownload')
        }}</span>
        <button
          class="flex h-[28px] w-[28px] shrink-0 cursor-pointer items-center justify-center rounded-md border border-border bg-white text-accent transition-all duration-fast ease-apple hover:scale-105 hover:border-danger"
          :title="t('common.cancel')"
          @click="cancelDownloadLoading"
        >
          <XIcon class="action-icon" />
        </button>
      </div>
    </div>
    <!-- Upload Drawer -->
    <CustomModal
      v-if="isShowUploadPanel"
      v-model:visible="isShowUploadPanel"
      :title="t('pages.manage.bucket.uploadFile')"
      width="900px"
      height="90vh"
    >
      <div class="flex h-full w-full flex-col gap-2">
        <div class="flex justify-end">
          <CustomSwitch
            v-model="isUploadKeepDirStructure"
            :title="
              isUploadKeepDirStructure
                ? t('pages.manage.bucket.keepDirStructure')
                : t('pages.manage.bucket.noKeepDirStructure')
            "
            small
            no-border
            @change="handleUploadKeepDirChange"
          />
        </div>

        <div class="no-scrollbar w-full flex-1 overflow-hidden rounded-md border border-border p-4 shadow-md">
          <div class="flex h-full w-full flex-col">
            <div
              v-if="!tableData.length"
              ref="uploadDialog"
              class="h-[200px] w-full cursor-pointer rounded-lg border-2 border-dashed border-border bg-surface p-4 text-center transition-all duration-fast ease-apple hover:border-accent hover:bg-accent/10 [.dragover]:border-accent [.dragover]:bg-accent/10"
              :class="{ dragover: isDragover }"
              @drop.prevent="onDrop"
              @dragover.prevent="isDragover = true"
              @dragleave.prevent="isDragover = false"
              @click="openFileSelectDialog"
            >
              <div class="flex h-full flex-col items-center justify-center gap-2">
                <div class="mb-2 text-lg font-semibold text-secondary">
                  {{ t('pages.manage.bucket.dragUpload') }}
                </div>
                <div class="text-sm font-medium text-secondary">
                  {{ t('pages.manage.bucket.clickUpload') }}
                </div>
              </div>
            </div>

            <!-- Upload File List -->
            <div
              v-if="tableData.length"
              class="flex h-[200px] w-full cursor-pointer rounded-lg border-2 border-dashed border-border bg-surface p-4 text-center transition-all duration-fast ease-apple"
            >
              <VirtualScroller
                :items="
                  tableData.sort((a, b) =>
                    b.isFolder - a.isFolder === 0 ? b.filesList.length - a.filesList.length : b.isFolder - a.isFolder,
                  )
                "
                :item-height="90"
                class="min-h-0 w-full flex-1 p-3"
                view-mode="list"
              >
                <template #default="{ item }">
                  <div
                    class="m-0 flex w-full cursor-pointer items-center gap-2 rounded-md border border-border-secondary bg-bg-secondary px-4 py-3 hover:bg-accent/10"
                  >
                    <div class="flex h-[25px] w-[25px] shrink-0 items-center justify-center">
                      <FolderIcon v-if="item.isFolder" class="h-[48px] w-[48px] text-tertiary" />
                      <FileIcon v-else class="h-[48px] w-[48px] text-tertiary" />
                    </div>
                    <div class="min-w-0 flex-1 flex-col">
                      <div class="flex flex-row justify-between gap-3">
                        <div
                          class="mb-1 cursor-pointer overflow-hidden text-sm font-semibold text-ellipsis whitespace-nowrap text-secondary"
                        >
                          {{ item.name }}
                        </div>
                        <div
                          v-if="item.fullPath"
                          class="overflow-hidden text-sm font-medium text-ellipsis whitespace-nowrap text-secondary"
                        >
                          {{ item.fullPath }}
                        </div>
                      </div>
                      <div class="flex text-xs text-secondary">
                        <span>{{ formatFileSize(item.fileSize) }}</span>
                        <span v-if="item.isFolder"> {{ item.filesList.length }} files </span>
                      </div>
                    </div>
                  </div>
                </template>
              </VirtualScroller>
            </div>

            <!-- Upload Actions -->
            <div v-if="tableData.length" class="mt-4 flex justify-center gap-4">
              <CustomButton
                type="primary"
                :disabled="isLoadingUploadPanelFiles"
                :text="
                  isLoadingUploadPanelFiles ? t('pages.manage.bucket.readingDir') : t('pages.manage.bucket.upload')
                "
                :icon="UploadIcon"
                @click="uploadFiles"
              />
              <CustomButton
                type="secondary"
                :icon="Trash2Icon"
                :text="t('pages.manage.bucket.clear')"
                :disabled="isLoadingUploadPanelFiles"
                @click="clearTableData"
              />
            </div>

            <!-- Upload Tasks Tabs -->
            <div class="flex flex-1 flex-col gap-2 overflow-hidden border-t border-border-secondary">
              <div class="flex shrink-0 border-b border-b-border">
                <button
                  class="relative flex-1 rounded-md border-b-2 border-b-transparent bg-none px-6 py-3 text-sm font-semibold text-secondary shadow-sm transition-all duration-fast ease-apple hover:border-b-accent hover:text-main [.active]:border-b-accent [.active]:bg-accent [.active]:text-white"
                  :class="{ active: activeUpLoadTab === 'uploading' }"
                  @click="activeUpLoadTab = 'uploading'"
                >
                  {{ t('pages.manage.bucket.uploading') }}
                  <span
                    v-if="uploadingTaskList.length"
                    class="absolute top-1 right-1 min-w-[16px] rounded-full bg-accent px-1.5 py-0.5 text-center text-xs text-white"
                  >
                    {{ uploadingTaskList.length }}
                  </span>
                </button>
                <button
                  class="relative flex-1 rounded-md border-b-2 border-b-transparent bg-none px-6 py-3 text-sm font-semibold text-secondary shadow-sm transition-all duration-fast ease-apple hover:border-b-accent hover:text-main [.active]:border-b-accent [.active]:bg-accent [.active]:text-white"
                  :class="{ active: activeUpLoadTab === 'finished' }"
                  @click="activeUpLoadTab = 'finished'"
                >
                  {{ t('pages.manage.bucket.success') }}
                  <span
                    v-if="uploadedTaskList.filter(item => item.status === 'uploaded').length"
                    class="absolute top-1 right-1 min-w-[16px] rounded-full bg-accent px-1.5 py-0.5 text-center text-xs text-white"
                  >
                    {{ uploadedTaskList.filter(item => item.status === 'uploaded').length }}
                  </span>
                </button>
                <button
                  class="relative flex-1 rounded-md border-b-2 border-b-transparent bg-none px-6 py-3 text-sm font-semibold text-secondary shadow-sm transition-all duration-fast ease-apple hover:border-b-accent hover:text-main [.active]:border-b-accent [.active]:bg-accent [.active]:text-white"
                  :class="{ active: activeUpLoadTab === 'failed' }"
                  @click="activeUpLoadTab = 'failed'"
                >
                  {{ t('pages.manage.bucket.failed') }}
                  <span
                    v-if="uploadedTaskList.filter(item => item.status !== 'uploaded').length"
                    class="absolute top-1 right-1 min-w-[16px] rounded-full bg-accent px-1.5 py-0.5 text-center text-xs text-white"
                  >
                    {{ uploadedTaskList.filter(item => item.status !== 'uploaded').length }}
                  </span>
                </button>
              </div>

              <div class="flex flex-row justify-center gap-3 rounded-md border border-border shadow-sm">
                <CustomButton
                  type="secondary"
                  :text="t('pages.manage.bucket.copyUploadTask')"
                  :icon="CopyIcon"
                  @click="handleCopyUploadingTaskInfo"
                />
                <CustomButton
                  type="secondary"
                  :text="t('pages.manage.bucket.clearFinishedTasks')"
                  :icon="Trash2Icon"
                  @click="handleDeleteUploadedTask"
                />
                <CustomButton
                  type="secondary"
                  :text="t('pages.manage.bucket.clearAll')"
                  :icon="Trash2Icon"
                  @click="handleDeleteAllUploadedTask"
                />
              </div>

              <div class="w-full flex-1 overflow-auto rounded-md border border-border-secondary p-2">
                <!-- Uploading Tab -->
                <VirtualScroller
                  :items="
                    activeUpLoadTab === 'uploading'
                      ? uploadingTaskList
                      : activeUpLoadTab === 'finished'
                        ? uploadedTaskList.filter(item => item.status === 'uploaded')
                        : uploadedTaskList.filter(item => item.status !== 'uploaded')
                  "
                  :item-height="70"
                  class="min-h-0 w-full flex-1 p-3"
                  view-mode="list"
                >
                  <template #default="{ item }">
                    <div
                      class="m-0 flex w-full cursor-pointer items-center gap-3 rounded-md border border-border bg-bg-secondary px-4 py-3 hover:border-accent hover:shadow-md"
                    >
                      <div class="flex flex-1 flex-col gap-1">
                        <div class="overflow-hidden text-sm font-medium text-ellipsis whitespace-nowrap text-secondary">
                          {{ item.sourceFileName }}
                        </div>
                        <div
                          v-if="activeUpLoadTab === 'uploading'"
                          class="h-[8px] w-full overflow-hidden rounded-[4px] bg-surface-elevated"
                        >
                          <div
                            class="h-full rounded-[4px] bg-accent transition-all duration-300 ease-apple"
                            :style="{ width: `${item.progress}%` }"
                          />
                        </div>
                        <div v-else class="flex gap-4 text-xs text-secondary">
                          <span>{{ item.finishTime }}</span>
                          <span class="text-xs font-semibold text-success">
                            {{
                              activeUpLoadTab === 'finished'
                                ? t('pages.manage.bucket.success')
                                : t('pages.manage.bucket.failed')
                            }}
                          </span>
                        </div>
                      </div>
                    </div>
                  </template>
                </VirtualScroller>
              </div>
            </div>
          </div>
        </div>
      </div>
    </CustomModal>

    <!-- Download Drawer -->
    <CustomModal
      v-if="isShowDownloadPanel"
      v-model:visible="isShowDownloadPanel"
      :title="t('pages.manage.bucket.downloadPage')"
      width="900px"
      height="90vh"
    >
      <div class="no-scrollbar h-full w-full flex-1 overflow-hidden rounded-md border border-border p-4 shadow-md">
        <div class="flex h-full w-full flex-col">
          <!-- Download Tasks Tabs -->
          <div class="flex flex-1 flex-col gap-2 overflow-hidden border-t border-border-secondary">
            <div class="flex shrink-0 border-b border-b-border">
              <button
                class="relative flex-1 rounded-md border-b-2 border-b-transparent bg-none px-6 py-3 text-sm font-semibold text-secondary shadow-sm transition-all duration-fast ease-apple hover:border-b-accent hover:text-main [.active]:border-b-accent [.active]:bg-accent [.active]:text-white"
                :class="{ active: activeDownLoadTab === 'downloading' }"
                @click="activeDownLoadTab = 'downloading'"
              >
                {{ t('pages.manage.bucket.downloading') }}
                <span
                  v-if="downloadingTaskList.length"
                  class="absolute top-1 right-1 min-w-[16px] rounded-full bg-accent px-1.5 py-0.5 text-center text-xs text-white"
                >
                  {{ downloadingTaskList.length }}
                </span>
              </button>
              <button
                class="relative flex-1 rounded-md border-b-2 border-b-transparent bg-none px-6 py-3 text-sm font-semibold text-secondary shadow-sm transition-all duration-fast ease-apple hover:border-b-accent hover:text-main [.active]:border-b-accent [.active]:bg-accent [.active]:text-white"
                :class="{ active: activeDownLoadTab === 'finished' }"
                @click="activeDownLoadTab = 'finished'"
              >
                {{ t('pages.manage.bucket.success') }}
                <span
                  v-if="downloadedTaskList.filter(item => item.status === 'downloaded').length"
                  class="absolute top-1 right-1 min-w-[16px] rounded-full bg-accent px-1.5 py-0.5 text-center text-xs text-white"
                >
                  {{ downloadedTaskList.filter(item => item.status === 'downloaded').length }}
                </span>
              </button>
              <button
                class="relative flex-1 rounded-md border-b-2 border-b-transparent bg-none px-6 py-3 text-sm font-semibold text-secondary shadow-sm transition-all duration-fast ease-apple hover:border-b-accent hover:text-main [.active]:border-b-accent [.active]:bg-accent [.active]:text-white"
                :class="{ active: activeDownLoadTab === 'failed' }"
                @click="activeDownLoadTab = 'failed'"
              >
                {{ t('pages.manage.bucket.failed') }}
                <span
                  v-if="downloadedTaskList.filter(item => item.status !== 'downloaded').length"
                  class="absolute top-1 right-1 min-w-[16px] rounded-full bg-accent px-1.5 py-0.5 text-center text-xs text-white"
                >
                  {{ downloadedTaskList.filter(item => item.status !== 'downloaded').length }}
                </span>
              </button>
            </div>

            <div class="flex flex-row justify-center gap-3 rounded-md border border-border shadow-sm">
              <CustomButton
                type="secondary"
                :text="t('pages.manage.bucket.copyDownloadTask')"
                :icon="CopyIcon"
                @click="handleCopyDownloadingTaskInfo"
              />
              <CustomButton
                type="secondary"
                :text="t('pages.manage.bucket.clearFinishedTasks')"
                :icon="Trash2Icon"
                @click="handleDeleteDownloadedTask"
              />
              <CustomButton
                type="secondary"
                :text="t('pages.manage.bucket.clearAll')"
                :icon="Trash2Icon"
                @click="handleDeleteAllDownloadedTask"
              />
              <CustomButton
                type="secondary"
                :text="t('pages.manage.bucket.openDownloadFolder')"
                :icon="FolderIcon"
                @click="handleOpenDownloadedFolder"
              />
            </div>

            <div class="w-full flex-1 overflow-auto rounded-md border border-border-secondary p-2">
              <!-- Downloading Tab -->
              <VirtualScroller
                :items="
                  activeDownLoadTab === 'downloading'
                    ? downloadingTaskList
                    : activeDownLoadTab === 'finished'
                      ? downloadedTaskList.filter(item => item.status === 'downloaded')
                      : downloadedTaskList.filter(item => item.status !== 'downloaded')
                "
                :item-height="70"
                class="min-h-0 w-full flex-1 p-3"
                view-mode="list"
              >
                <template #default="{ item }">
                  <div
                    class="m-0 flex w-full cursor-pointer items-center gap-3 rounded-md border border-border bg-bg-secondary px-4 py-3 hover:border-accent hover:shadow-md"
                  >
                    <div class="flex flex-1 flex-col gap-1">
                      <div class="overflow-hidden text-sm font-medium text-ellipsis whitespace-nowrap text-secondary">
                        {{ item.sourceFileName }}
                      </div>
                      <div
                        v-if="activeDownLoadTab === 'downloading'"
                        class="relative h-[8px] w-full overflow-hidden rounded-[4px] bg-surface-elevated"
                      >
                        <div
                          class="h-full rounded-[4px] bg-accent transition-all duration-300 ease-apple"
                          :style="{ width: `${item.progress}%` }"
                        />
                      </div>
                      <div v-else class="flex gap-4 text-xs text-secondary">
                        <span>{{ item.finishTime }}</span>
                        <span class="text-xs font-semibold text-success">
                          {{
                            activeUpLoadTab === 'finished'
                              ? t('pages.manage.bucket.success')
                              : t('pages.manage.bucket.failed')
                          }}
                        </span>
                      </div>
                    </div>
                  </div>
                </template>
              </VirtualScroller>
            </div>
          </div>
        </div>
      </div>
    </CustomModal>

    <!-- Markdown Preview Dialog -->
    <CustomModal
      v-if="isShowMarkDownDialog"
      v-model:visible="isShowMarkDownDialog"
      width="80vw"
      height="80vh"
      :title="t('pages.manage.bucket.preview')"
    >
      <div class="flex h-full w-full">
        <div class="notes-body" style="user-select: text" v-html="markDownContent" />
      </div>
    </CustomModal>

    <!-- Text File Preview Dialog -->
    <CustomModal
      v-if="isShowTextFileDialog"
      v-model:visible="isShowTextFileDialog"
      width="80vw"
      height="80vh"
      :title="t('pages.manage.bucket.preview')"
    >
      <div class="flex h-full w-full">
        <pre class="overflow-auto font-['SF_Mono',Monaco,Menlo,'Ubuntu_Mono',monospace] text-base text-main">{{
          textfileContent
        }}</pre>
      </div>
    </CustomModal>

    <!-- Video Player Dialog -->
    <CustomModal
      v-if="isShowVideoFileDialog"
      v-model:visible="isShowVideoFileDialog"
      width="90vw"
      height="90vh"
      :title="t('pages.manage.bucket.play')"
    >
      <div class="flex h-full w-full items-center justify-center bg-black">
        <video-player
          class="video-player"
          :src="videoFileUrl"
          :volume="0.6"
          :options="{
            autoplay: true,
            muted: false,
            responsive: true,
            fill: true,
            fluid: false,
            controlBar: {
              volumePanel: {
                inline: false,
              },
            },
          }"
          crossorigin="anonymous"
          controls
          playsinline
          loop
        />
      </div>
    </CustomModal>

    <!-- Create Folder Dialog -->
    <CustomModal
      v-if="isShowCreateFolderDialog"
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
        <CustomButton :type="'secondary'" :text="t('common.cancel')" @click="isShowCreateFolderDialog = false" />
        <CustomButton
          :type="'primary'"
          :disabled="!newFolderName.trim()"
          :text="t('common.confirm')"
          @click="confirmCreateFolder"
        />
      </template>
    </CustomModal>
  </div>
</template>

<script lang="ts" setup>
import { useLocalStorage } from '@vueuse/core'
import {
  ArrowUpDownIcon,
  ChevronDownIcon,
  ChevronRightIcon,
  CopyIcon,
  DownloadIcon,
  EditIcon,
  ExpandIcon,
  FileIcon,
  FolderIcon,
  FolderPlusIcon,
  GridIcon,
  HomeIcon,
  InfoIcon,
  LinkIcon,
  ListIcon,
  RefreshCwIcon,
  ShrinkIcon,
  Trash2Icon,
  UploadIcon,
  XIcon,
} from 'lucide-vue-next'
import { marked } from 'marked'
import { v4 as uuidv4 } from 'uuid'
import { computed, onBeforeMount, onBeforeUnmount, reactive, ref, useTemplateRef, watch } from 'vue'
import { useI18n } from 'vue-i18n'

import CustomButton from '@/components/common/CustomButton.vue'
import CustomInput from '@/components/common/CustomInput.vue'
import CustomModal from '@/components/common/CustomModal.vue'
import CustomSwitch from '@/components/common/CustomSwitch.vue'
import PlaceholderTable from '@/components/common/PlaceholderTable.vue'
import SettingCard from '@/components/common/SettingCard.vue'
import SettingSection from '@/components/common/SettingSection.vue'
import SingleSelect from '@/components/common/SingleSelect.vue'
import ImageLocal from '@/components/ImageLocal.vue'
import ImagePreSign from '@/components/ImagePreSign.vue'
import ImageWebdav from '@/components/ImageWebdav.vue'
import VirtualScroller from '@/components/VirtualScroller.vue'
import useConfirm from '@/hooks/useConfirm'
import useMessage from '@/hooks/useMessage'
import FileInfo from '@/manage/pages/components/FileInfo.vue'
import IconButton from '@/manage/pages/components/IconButton.vue'
import EmptyPage from '@/manage/pages/EmptyPage.vue'
import { fileCacheDbInstance } from '@/manage/store/bucketFileDb'
import { useDownloadFileTransferStore, useFileTransferStore, useManageStore } from '@/manage/store/manageStore'
import {
  customStrMatch,
  customStrReplace,
  formatFileSize,
  formatLink,
  getFileIconPath,
  isValidUrl,
  renameFile,
} from '@/manage/utils/common'
import { getConfig, saveConfig } from '@/manage/utils/dataSender'
import { textFileExt } from '@/manage/utils/textfile'
import { videoExt } from '@/manage/utils/videofile'
import { trimPath } from '@/utils/common'
import { useDragEventListeners } from '@/utils/drag'
import { IRPCActionType } from '@/utils/enum'
import { cancelDownloadLoadingFileList, refreshDownloadFileTransferList } from '@/utils/static'
/*
configMap:{
    prefix: string, -> baseDir
    bucketName: string, -> bucketName
    customUrl: string, -> customUrl
    picBedName: string, -> picBedName
    bucketConfig: {region, customUrl},
    alias: string,
    bucketConfig
}
*/

const props = defineProps<{
  configMap: Record<string, any>
}>()

type ISortTypeList = 'name' | 'size' | 'time' | 'ext' | 'check' | 'init'

const uploadDialog = useTemplateRef<HTMLDivElement>('uploadDialog')
useDragEventListeners(uploadDialog)
let fileTransferInterval: NodeJS.Timeout | undefined
let downloadInterval: NodeJS.Timeout | undefined
let scrollTimeout: ReturnType<typeof setTimeout> | undefined
const { t } = useI18n()
const message = useMessage()
const confirm = useConfirm()
// 页面状态变量相关
const manageStore = useManageStore()
const configMap = ref<Record<string, any>>(JSON.parse(JSON.stringify(props.configMap)))
// 页面布局控制
const isLoadingData = ref(false)
const isShowLoadingPage = ref(false)
const isShowImagePreview = ref(false)
const isContentFullscreen = ref(false)
const layoutStyle = useLocalStorage<'list' | 'grid'>('manage-bucket-page-layout-style', 'grid')
const copyDropdownOpen = ref(false)
const sortDropdownOpen = ref(false)
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
// 文件信息相关
const isShowFileInfo = ref(false)
const currentShowedFileInfo = ref({} as any)
// 分页相关
const currentPageNumber = ref(1)
const pagingMarker = ref('')
const pagingMarkerStack = reactive([] as string[])
const currentPageFilesInfo = reactive([] as any[])
// 当前路径前缀
const currentPrefix = ref('/')
// 文件排序控制
const fileSortExtReverse = ref(false)
const fileSortNameReverse = ref(false)
const fileSortSizeReverse = ref(false)
const fileSortTimeReverse = ref(false)
// 页面搜索相关
const searchText = ref('')
// 上传页面相关
const isDragover = ref(false)
const tableData = reactive([] as any[])
const isShowUploadPanel = ref(false)
const activeUpLoadTab = ref('uploading')
const uploadTaskList = ref([] as IUploadTask[])

const refreshUploadTaskId = ref<NodeJS.Timeout | undefined>(undefined)
const uploadPanelFilesList = ref([] as any[])
const cancelToken = ref('')
const isLoadingUploadPanelFiles = ref(false)
const isUploadKeepDirStructure = ref(manageStore.config.settings.isUploadKeepDirStructure ?? true)
const currentSortType = ref<ISortTypeList>('name')
// 下载页面相关
const isShowDownloadPanel = ref(false)
const isLoadingDownloadData = ref(false)
const activeDownLoadTab = ref('downloading')
const currentDownloadFileList = reactive([] as any[])
const downloadTaskList = ref([] as IDownloadTask[])
// 上传文件相关
const dialogVisible = ref(false)
const urlToUpload = ref('')
// 图片预览相关
const previewedImage = ref('')
// 快捷键相关
const isShiftKeyPress = ref<boolean>(false)
const lastChoosed = ref<number>(-1)
// 自定义域名相关
const customDomainList = ref([] as any[])
const currentCustomDomain = ref('')
const refreshDownloadTaskId = ref<NodeJS.Timeout | undefined>(undefined)
const downloadCancelToken = ref('')
// 文件预览相关
const isShowMarkDownDialog = ref(false)
const markDownContent = ref('')
const isShowTextFileDialog = ref(false)
const textfileContent = ref('')
const isShowVideoFileDialog = ref(false)
const videoFileUrl = ref('')
const videoPlayerHeaders = ref({})
// 创建文件夹相关
const isShowCreateFolderDialog = ref(false)
const newFolderName = ref('')
// Refs for scroll handling
const virtualScrollerRef = useTemplateRef('virtualScrollerRef')
const bucketContainerRef = useTemplateRef('bucketContainerRef')
const isShowBatchRenameDialog = ref(false)
const batchRenameMatch = ref('')
const batchRenameReplace = ref('')
const isRenameIncludeExt = ref(false)
const isSingleRename = ref(false)
const itemToBeRenamed = ref({} as any)
const previousPageNumber = ref(1)
const showMatchedUrls = ref(false)
const showFormatInfo = ref(false)

const linkFormatArray = [
  { key: 'Url', value: 'url' },
  { key: 'Markdown', value: 'markdown' },
  { key: 'Markdown-link', value: 'markdown-with-link' },
  { key: 'Html', value: 'html' },
  { key: 'BBCode', value: 'bbcode' },
  { key: 'Custom', value: 'custom' },
]
const linkFormatList = ['url', 'markdown', 'markdown-with-link', 'html', 'bbcode', 'custom']
const sortTypeList = ['name', 'size', 'time', 'ext', 'check', 'init']

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
    { label: t('pages.settings.upload.placeholder.randomString'), value: '{str-number}' },
  ],
}))

const advancedRenameTitleList = computed(() => ({
  categoryTime: t('pages.settings.upload.placeholder.categoryTime'),
  categoryHash: t('pages.settings.upload.placeholder.categoryHash'),
  categoryFile: t('pages.settings.upload.placeholder.categoryFile'),
}))

const uploadingTaskList = computed(() =>
  uploadTaskList.value.filter(item => ['uploading', 'queuing', 'paused'].includes(item.status)),
)
const uploadedTaskList = computed(() =>
  uploadTaskList.value.filter(item => ['uploaded', 'failed', 'canceled'].includes(item.status)),
)

const downloadingTaskList = computed(() =>
  downloadTaskList.value.filter(item => ['downloading', 'queuing', 'paused'].includes(item.status)),
)
const downloadedTaskList = computed(() =>
  downloadTaskList.value.filter(item => ['downloaded', 'failed', 'canceled'].includes(item.status)),
)

const filterList = computed(() => {
  return getList()
})

const selectedItems = computed(() => filterList.value.filter(item => item.checked))

const ImagePreviewList = computed(() => filterList.value.filter(item => item.isImage).map(item => item.url))

const getCurrentPreviewIndex = computed(() => ImagePreviewList.value.indexOf(previewedImage.value))

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

// 重命名相关
const isShowRenameFileIcon = computed(() =>
  ['tcyun', 'aliyun', 'qiniu', 'upyun', 's3plist', 'webdavplist', 'local', 'sftp'].includes(currentPicBedName.value),
)

// 当前页面信息相关
const currentPicBedName = computed<string>(() => manageStore.config.picBed[configMap.value.alias].picBedName)
const paging = computed(() => manageStore.config.picBed[configMap.value.alias].paging)
const itemsPerPage = computed(() => manageStore.config.picBed[configMap.value.alias].itemsPerPage)
const calculateAllFileSize = computed(
  () =>
    formatFileSize(currentPageFilesInfo.reduce((total: any, item: { fileSize: any }) => total + item.fileSize, 0)) ||
    '0',
)
const isShowThumbnail = computed(() => manageStore.config.settings.isShowThumbnail ?? false)
const isUsePreSignedUrl = computed(() => manageStore.config.settings.isUsePreSignedUrl ?? false)
const isAutoRefresh = computed(() => manageStore.config.settings.isAutoRefresh ?? false)
const isIgnoreCase = computed(() => manageStore.config.settings.isIgnoreCase ?? false)

// 新建文件夹相关
const isShowCreateNewFolder = computed(() =>
  ['aliyun', 'github', 'local', 'qiniu', 'tcyun', 's3plist', 'upyun', 'webdavplist', 'sftp'].includes(
    currentPicBedName.value,
  ),
)

const isShowPresignedUrl = computed(() =>
  ['aliyun', 'github', 'qiniu', 's3plist', 'tcyun', 'webdavplist'].includes(currentPicBedName.value),
)

watch(
  () => props.configMap,
  async newValue => {
    isShowLoadingPage.value = true
    configMap.value = JSON.parse(JSON.stringify(newValue))
    await initCustomDomainList()
    await resetParam(true)
    await manageStore.refreshConfig()
    isShowLoadingPage.value = false
  },
  { deep: true, immediate: true },
)

watch(currentPageNumber, (newVal, oldVal) => {
  if (typeof newVal !== 'number') {
    currentPageNumber.value = 1
  }
  // Update previousPageNumber when currentPageNumber changes programmatically
  if (oldVal && typeof oldVal === 'number') {
    previousPageNumber.value = oldVal
  }
})

// Watch upload panel visibility to start/stop refresh task
watch(isShowUploadPanel, newValue => {
  if (newValue) {
    startRefreshUploadTask()
  } else {
    stopRefreshUploadTask()
  }
})

// Watch download panel visibility to start/stop refresh task
watch(isShowDownloadPanel, newValue => {
  if (newValue) {
    startRefreshDownloadTask()
  } else {
    stopRefreshDownloadTask()
  }
})

watch(
  () => manageStore.config.settings.isUploadKeepDirStructure,
  newValue => {
    isUploadKeepDirStructure.value = newValue ?? true
  },
)

const getExtension = (fileName: string) => window.node.path.extname(fileName).slice(1)

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

function handleUploadKeepDirChange(value: boolean) {
  saveConfig('settings.isUploadKeepDirStructure', value)
  manageStore.refreshConfig()
}

function showUploadDialog() {
  isShowUploadPanel.value = true
}

function startRefreshUploadTask() {
  refreshUploadTaskId.value = setInterval(() => {
    window.electron.triggerRPC(IRPCActionType.MANAGE_GET_UPLOAD_TASK_LIST).then((res: any) => {
      uploadTaskList.value = res
    })
  }, 300)
}

function stopRefreshUploadTask() {
  refreshUploadTaskId.value && clearInterval(refreshUploadTaskId.value)
}

function handleGetWebdavConfig() {
  return manageStore.config.picBed[configMap.value.alias]
}

// 下载相关函数

function showDownloadDialog() {
  isShowDownloadPanel.value = true
}

function startRefreshDownloadTask() {
  refreshDownloadTaskId.value = setInterval(() => {
    window.electron.triggerRPC(IRPCActionType.MANAGE_GET_DOWNLOAD_TASK_LIST).then((res: any) => {
      downloadTaskList.value = res
    })
  }, 300)
}

function stopRefreshDownloadTask() {
  refreshDownloadTaskId.value && clearInterval(refreshDownloadTaskId.value)
}

// 界面相关

function handleViewChange() {
  layoutStyle.value = layoutStyle.value === 'grid' ? 'list' : 'grid'
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

// 上传文件选择相关

function openFileSelectDialog() {
  window.electron.triggerRPC(IRPCActionType.MANAGE_OPEN_FILE_SELECT_DIALOG).then((res: any) => {
    if (res) {
      res.forEach((item: any) => {
        tableData.push({
          fileSize: window.node.fs.statSync(item).size,
          isFolder: false,
          name: window.node.path.basename(item),
          filesList: [],
          fullPath: item,
        })
        const index = uploadPanelFilesList.value.findIndex((file: any) => file.path === item)
        if (index === -1) {
          uploadPanelFilesList.value.push({
            name: window.node.path.basename(item),
            path: item,
            size: window.node.fs.statSync(item).size,
          })
        }
      })
    }
  })
}

function onDrop(e: DragEvent) {
  isDragover.value = false
  const items = e.dataTransfer?.items
  if (items) {
    webkitReadDataTransfer(e.dataTransfer as DataTransfer)
  }
}
/* 参考 https://blog.csdn.net/mingwei_zhu/article/details/128541169
 * 作者 前端 - wei
 * 递归读取文件夹
 */
function webkitReadDataTransfer(dataTransfer: DataTransfer) {
  isLoadingUploadPanelFiles.value = true
  let fileNum = dataTransfer.items.length
  const decrement = () => {
    fileNum--
    if (fileNum === 0) {
      files.forEach((item: any) => {
        const index = uploadPanelFilesList.value.findIndex((file: any) => file.path === item.path)
        if (index === -1) {
          uploadPanelFilesList.value.push({
            name: item.name,
            path: window.electron.showFilePath(item),
            size: item.size,
            relativePath: item.relativePath,
          })
        }
      })
      handleUploadFiles(files)
      isLoadingUploadPanelFiles.value = false
    }
  }
  const files = [] as any[]
  const items = dataTransfer.items
  for (const item of items) {
    const entry = item.webkitGetAsEntry() as any
    if (!entry) {
      decrement()
      continue
    }
    if (entry.isFile) {
      readFiles(item.getAsFile(), entry.fullPath)
    } else if (entry.isDirectory) {
      readDirectory(entry.createReader())
    }
  }

  function readDirectory(reader: any) {
    reader.readEntries(
      (entries: any) => {
        if (entries.length) {
          fileNum += entries.length
          entries.forEach((entry: any) => {
            if (entry.isFile) {
              entry.file(
                (file: any) => {
                  readFiles(file, entry.fullPath)
                },
                (err: any) => {
                  console.error(err)
                },
              )
            } else if (entry.isDirectory) {
              readDirectory(entry.createReader())
            }
          })
          readDirectory(reader)
        } else {
          decrement()
        }
      },
      (err: any) => {
        console.error(err)
      },
    )
  }

  function readFiles(file: any, fullPath: string) {
    file.relativePath = fullPath.substring(1)
    files.push(file)
    decrement()
  }
}

function handleUploadFiles(files: any[]) {
  const dirObj = {} as any
  files.forEach(item => {
    if (item.relativePath === item.name) {
      const index = tableData.findIndex((file: any) => file.fullPath === item.path)
      if (index === -1) {
        tableData.push({
          name: item.name,
          filesList: [item.file],
          isFolder: false,
          fileSize: item.size,
          fullPath: window.electron.showFilePath(item),
        })
      }
    } else {
      const folderName = item.relativePath.split('/')[0]
      if (dirObj[folderName]) {
        const dirList = dirObj[folderName].filesList || []
        dirList.push(item)
        dirObj[folderName].filesList = dirList
        const dirSize = dirObj[folderName].fileSize
        dirObj[folderName].fileSize = dirSize ? dirSize + item.size : item.size
      } else {
        dirObj[folderName] = {
          filesList: [item],
          fileSize: item.size,
          path: window.electron.showFilePath(item),
        }
      }
    }
  })
  Object.keys(dirObj).forEach(key => {
    const index = tableData.findIndex((item: any) => item.fullPath === dirObj[key].path)
    if (index === -1) {
      tableData.push({
        name: key,
        filesList: dirObj[key].filesList,
        isFolder: true,
        fileSize: dirObj[key].fileSize,
        fullPath: dirObj[key].path,
      })
    }
  })
}

function clearTableData() {
  tableData.length = 0
  uploadPanelFilesList.value = []
}

function renameFileBeforeUpload(filePath: string): string {
  const fileName = window.node.path.basename(filePath)
  const typeMap = {
    timestampRename: manageStore.config.settings.timestampRename,
    randomStringRename: manageStore.config.settings.randomStringRename,
    customRenameFormat: manageStore.config.settings.customRenameFormat,
    customRename: manageStore.config.settings.customRename,
  }
  return renameFile(typeMap, fileName)
}

function uploadFiles() {
  const formateduploadPanelFilesList = [] as any[]
  uploadPanelFilesList.value.forEach((item: any) => {
    formateduploadPanelFilesList.push({
      rawName: item.name,
      path: item.path.replace(/\\/g, '/'),
      size: item.size,
      renamedFileName: renameFileBeforeUpload(item.name),
      relativePath: item.relativePath ?? '',
    })
  })
  if (isUploadKeepDirStructure.value) {
    formateduploadPanelFilesList.forEach((item: any) => {
      item.key = `${currentPrefix.value}${item.relativePath.substring(0, item.relativePath.lastIndexOf('/'))}/${item.renamedFileName}`
    })
  } else {
    formateduploadPanelFilesList.forEach((item: any) => {
      item.key = currentPrefix.value + item.renamedFileName
    })
  }
  clearTableData()
  const param = {
    // tcyun
    fileArray: [] as any[],
  }
  formateduploadPanelFilesList.forEach((item: any) => {
    param.fileArray.push({
      alias: configMap.value.alias,
      bucketName: configMap.value.bucketName,
      region: configMap.value.bucketConfig.Location,
      key: item.key,
      filePath: item.path,
      fileSize: item.size,
      fileName: item.rawName,
      githubBranch: currentCustomDomain.value,
      aclForUpload: manageStore.config.picBed[configMap.value.alias].aclForUpload,
    })
  })
  window.electron.sendRPC(IRPCActionType.MANAGE_UPLOAD_BUCKET_FILE, configMap.value.alias, param)
}

function handleCopyUploadingTaskInfo() {
  window.electron.clipboard.writeText(JSON.stringify(uploadTaskList.value, null, 2))
  message.success(t('pages.manage.bucket.copySuccess'))
}

function handleDeleteUploadedTask() {
  window.electron.sendRPC(IRPCActionType.MANAGE_DELETE_UPLOADED_TASK)
  message.success(t('pages.manage.bucket.deleteSuccess'))
}

function handleDeleteAllUploadedTask() {
  window.electron.sendRPC(IRPCActionType.MANAGE_DELETE_ALL_UPLOADED_TASK)
  message.success(t('pages.manage.bucket.deleteSuccess'))
}

// 下载任务相关

function handleCopyDownloadingTaskInfo() {
  window.electron.clipboard.writeText(JSON.stringify(downloadTaskList.value, null, 2))
  message.success(t('pages.manage.bucket.copySuccess'))
}

function handleDeleteDownloadedTask() {
  window.electron.sendRPC(IRPCActionType.MANAGE_DELETE_DOWNLOADED_TASK)
  message.success(t('pages.manage.bucket.deleteSuccess'))
}

function handleDeleteAllDownloadedTask() {
  window.electron.sendRPC(IRPCActionType.MANAGE_DELETE_ALL_DOWNLOADED_TASK)
  message.success(t('pages.manage.bucket.deleteSuccess'))
}

function handleOpenDownloadedFolder() {
  window.electron.sendRPC(IRPCActionType.MANAGE_OPEN_DOWNLOADED_FOLDER, manageStore.config.settings.downloadDir)
}

// 文件列表相关

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
  if (isLoadingData.value) {
    isLoadingData.value = false
    window.electron.sendToMain('cancelLoadingFileList', cancelToken.value)
  }
  configMap.value.prefix = targetPrefix
  isShowLoadingPage.value = true
  resetParam(false)
  isShowLoadingPage.value = false
}

async function handleClickFile(item: any) {
  const options = {} as any
  if (currentPicBedName.value === 'webdavplist') {
    options.headers = {
      Authorization: `Basic ${window.node.buffer.from(`${manageStore.config.picBed[configMap.value.alias].username}:${manageStore.config.picBed[configMap.value.alias].password}`).toString('base64')}`,
    }
  }
  if (item.isImage) {
    previewedImage.value = item.url
    isShowImagePreview.value = true
  } else if (item.isDir) {
    if (isLoadingData.value) {
      isLoadingData.value = false
      window.electron.sendToMain('cancelLoadingFileList', cancelToken.value)
    }
    configMap.value.prefix = `/${item.key}`
    isShowLoadingPage.value = true
    await resetParam(false)
    isShowLoadingPage.value = false
  } else if (item.fileName.endsWith('.md')) {
    try {
      message.success(t('pages.manage.bucket.startLoadingFile'))
      const fileUrl = item.url
      const res = await fetch(fileUrl, options)
      const content = await res.text()
      markDownContent.value = await marked(content, { breaks: true, gfm: true })
      isShowMarkDownDialog.value = true
    } catch (_error) {
      message.error(t('pages.manage.bucket.loadingFailed'))
    }
  } else if (
    textFileExt.includes(window.node.path.extname(item.fileName).toLowerCase()) ||
    textFileExt.includes(item.fileName.toLowerCase())
  ) {
    try {
      message.success(t('pages.manage.bucket.startLoadingFile'))
      const fileUrl = item.url
      const res = await fetch(fileUrl, options)
      textfileContent.value = await res.text()
      isShowTextFileDialog.value = true
    } catch (_error) {
      message.error(t('pages.manage.bucket.loadingFailed'))
    }
  } else if (videoExt.includes(window.node.path.extname(item.fileName).toLowerCase())) {
    videoFileUrl.value = item.url
    isShowVideoFileDialog.value = true
    videoPlayerHeaders.value = options.headers
  }
}

async function handleChangeCustomUrlInput() {
  await handleChangeCustomUrl()
  await forceRefreshFileList()
}
// 自定义域名相关

async function handleChangeCustomUrl() {
  if (['aliyun', 'tcyun', 'qiniu', 's3plist', 'webdavplist', 'local', 'sftp'].includes(currentPicBedName.value)) {
    const currentConfigs = await getConfig<any>('picBed')
    const currentConfig = currentConfigs[configMap.value.alias]
    const currentTransformedConfig = JSON.parse(currentConfig.transformedConfig ?? '{}')
    if (currentTransformedConfig[configMap.value.bucketName]) {
      currentTransformedConfig[configMap.value.bucketName].customUrl = currentCustomDomain.value
    } else {
      currentTransformedConfig[configMap.value.bucketName] = {
        customUrl: currentCustomDomain.value,
      }
    }
    currentConfig.transformedConfig = JSON.stringify(currentTransformedConfig)
    saveConfig(`picBed.${configMap.value.alias}`, currentConfig)
    await manageStore.refreshConfig()
  }
}

// when the current picBed is github, the customDomainList is used to store the github repo branches
async function initCustomDomainList() {
  if (
    (['aliyun', 'tcyun', 'qiniu'].includes(currentPicBedName.value) &&
      (manageStore.config.picBed[configMap.value.alias].isAutoCustomUrl === undefined ||
        manageStore.config.picBed[configMap.value.alias].isAutoCustomUrl === true)) ||
    ['github', 'smms', 'upyun', 'imgur'].includes(currentPicBedName.value)
  ) {
    const param = {
      bucketName: configMap.value.bucketName,
      region: configMap.value.bucketConfig.Location,
    }
    let defaultUrl = ''
    if (currentPicBedName.value === 'tcyun') {
      defaultUrl = `https://${configMap.value.bucketName}.cos.${configMap.value.bucketConfig.Location}.myqcloud.com`
    } else if (currentPicBedName.value === 'aliyun') {
      defaultUrl = `https://${configMap.value.bucketName}.${configMap.value.bucketConfig.Location}.aliyuncs.com`
    } else if (currentPicBedName.value === 'github') {
      defaultUrl = 'main'
    }
    const res = await window.electron.triggerRPC<any>(
      IRPCActionType.MANAGE_GET_BUCKET_DOMAIN,
      configMap.value.alias,
      param,
    )
    if (res.length > 0) {
      customDomainList.value.length = 0
      res.forEach((item: any) => {
        if (!/^https?:\/\//.test(item) && currentPicBedName.value !== 'github') {
          item = manageStore.config.settings.isForceCustomUrlHttps ? `https://${item}` : `http://${item}`
        }
        customDomainList.value.push({
          label: item,
          value: item,
        })
      })
      defaultUrl !== '' &&
        currentPicBedName.value !== 'github' &&
        customDomainList.value.push({
          label: defaultUrl,
          value: defaultUrl,
        })
      currentCustomDomain.value = customDomainList.value[0].value
    } else {
      customDomainList.value.length = 0
      customDomainList.value = [
        {
          label: defaultUrl,
          value: defaultUrl,
        },
      ]
      currentCustomDomain.value = defaultUrl
    }
  } else if (['aliyun', 'tcyun', 'qiniu'].includes(currentPicBedName.value)) {
    const currentConfigs = await getConfig<any>('picBed')
    const currentConfig = currentConfigs[configMap.value.alias]
    const currentTransformedConfig = JSON.parse(currentConfig.transformedConfig ?? '{}')
    if (currentTransformedConfig[configMap.value.bucketName]) {
      currentCustomDomain.value = currentTransformedConfig[configMap.value.bucketName].customUrl ?? ''
    } else {
      currentCustomDomain.value = ''
    }
  } else if (currentPicBedName.value === 's3plist') {
    const currentConfigs = await getConfig<any>('picBed')
    const currentConfig = currentConfigs[configMap.value.alias]
    const currentTransformedConfig = JSON.parse(currentConfig.transformedConfig ?? '{}')
    if (currentTransformedConfig[configMap.value.bucketName]) {
      currentCustomDomain.value = currentTransformedConfig[configMap.value.bucketName].customUrl ?? ''
    } else {
      if (manageStore.config.picBed[configMap.value.alias].endpoint) {
        const endpoint = manageStore.config.picBed[configMap.value.alias].endpoint
        const s3ForcePathStyle = manageStore.config.picBed[configMap.value.alias].s3ForcePathStyle
        let url
        if (/^https?:\/\//.test(endpoint)) {
          url = new URL(endpoint)
        } else {
          url = new URL(
            manageStore.config.picBed[configMap.value.alias].sslEnabled ? `https://${endpoint}` : `http://${endpoint}`,
          )
        }
        if (s3ForcePathStyle) {
          currentCustomDomain.value = `${url.protocol}//${url.hostname}${url.port ? ':' + url.port : ''}/${configMap.value.bucketName}`
        } else {
          currentCustomDomain.value = `${url.protocol}//${configMap.value.bucketName}.${url.hostname}${url.port ? ':' + url.port : ''}`
        }
      } else {
        currentCustomDomain.value = `https://${configMap.value.bucketName}.s3.amazonaws.com`
      }
    }
    await handleChangeCustomUrl()
  } else if (currentPicBedName.value === 'webdavplist') {
    const currentConfigs = await getConfig<any>('picBed')
    const currentConfig = currentConfigs[configMap.value.alias]
    const currentTransformedConfig = JSON.parse(currentConfig.transformedConfig ?? '{}')
    if (
      currentTransformedConfig[configMap.value.bucketName] &&
      currentTransformedConfig[configMap.value.bucketName]?.customUrl
    ) {
      currentCustomDomain.value = currentTransformedConfig[configMap.value.bucketName].customUrl
    } else {
      let endpoint = manageStore.config.picBed[configMap.value.alias].endpoint
      if (!/^https?:\/\//.test(endpoint)) {
        endpoint = 'http://' + endpoint
      }
      currentCustomDomain.value = endpoint
    }
    await handleChangeCustomUrl()
  } else if (currentPicBedName.value === 'local' || currentPicBedName.value === 'sftp') {
    const currentConfigs = await getConfig<any>('picBed')
    const currentConfig = currentConfigs[configMap.value.alias]
    const currentTransformedConfig = JSON.parse(currentConfig.transformedConfig ?? '{}')
    if (
      currentTransformedConfig[configMap.value.bucketName] &&
      currentTransformedConfig[configMap.value.bucketName]?.customUrl
    ) {
      currentCustomDomain.value = currentTransformedConfig[configMap.value.bucketName].customUrl ?? ''
      if (manageStore.config.settings.isForceCustomUrlHttps && currentCustomDomain.value.startsWith('http://')) {
        currentCustomDomain.value = currentCustomDomain.value.replace('http://', 'https://')
      }
    } else {
      currentCustomDomain.value = ''
    }
    await handleChangeCustomUrl()
  }
}

// 重置

async function resetParam(force: boolean = false) {
  if (isLoadingData.value) {
    isLoadingData.value = false
    window.electron.sendToMain('cancelLoadingFileList', cancelToken.value)
  }
  if (isLoadingDownloadData.value) {
    isLoadingDownloadData.value = false
    window.electron.sendToMain(cancelDownloadLoadingFileList, downloadCancelToken.value)
  }
  cancelToken.value = ''
  pagingMarker.value = ''
  currentPrefix.value = configMap.value.prefix
  currentPageNumber.value = 1
  currentPageFilesInfo.length = 0
  currentDownloadFileList.length = 0
  searchText.value = ''
  urlToUpload.value = ''
  dialogVisible.value = false
  isShowImagePreview.value = false
  previewedImage.value = ''
  isShowFileInfo.value = false
  isShowCreateFolderDialog.value = false
  newFolderName.value = ''
  lastChoosed.value = -1
  fileSortExtReverse.value = false
  fileSortNameReverse.value = false
  fileSortSizeReverse.value = false
  fileSortTimeReverse.value = false
  if (!isAutoRefresh.value && !force && !paging.value) {
    const cachedData = await searchExistFileList()
    if (cachedData.length > 0) {
      currentPageFilesInfo.push(...cachedData[0].value.fullList)
      const sortType = (localStorage.getItem('sortType') as ISortTypeList) || 'init'
      sortFile(sortType)
      isShowLoadingPage.value = false
      return
    }
  }
  if (paging.value) {
    const res = (await getBucketFileList()) as IStringKeyMap
    if (res.success) {
      currentPageFilesInfo.push(...res.fullList)
      const sortType = (localStorage.getItem('sortType') as ISortTypeList) || 'init'
      sortFile(sortType)
      if (res.isTruncated && paging.value) {
        pagingMarkerStack.push(pagingMarker.value)
        pagingMarker.value = res.nextMarker
      } else if (paging.value && currentPageNumber.value > 1) {
        message.success(t('pages.manage.bucket.lastPageMsg'))
      }
    } else {
      message.error(t('pages.manage.bucket.getFileListFailed'))
    }
  } else {
    getBucketFileListBackStage()
    message.info(t('pages.manage.bucket.getInBackground'))
  }
}

async function forceRefreshFileList() {
  if (isLoadingData.value) {
    message.error(t('pages.manage.bucket.isLoadingMsg'))
    return
  }
  isShowLoadingPage.value = true
  await resetParam(true)
  isShowLoadingPage.value = false
}

const changePage = async (cur: number | undefined, prev: number | undefined) => {
  if (!cur || !prev) {
    currentPageNumber.value = 1
    return
  }
  const isForwardNavigation = cur > prev
  const newPageNumber = isForwardNavigation ? prev + 1 : prev - 1
  const sortType = (localStorage.getItem('sortType') as ISortTypeList) || 'init'

  isShowLoadingPage.value = true
  currentPageNumber.value = newPageNumber
  currentPageFilesInfo.length = 0
  searchText.value = ''
  urlToUpload.value = ''
  dialogVisible.value = false

  if (!isForwardNavigation) {
    pagingMarker.value = pagingMarkerStack[pagingMarkerStack.length - 2]
    pagingMarkerStack.pop()
    pagingMarkerStack.pop()
  }

  const res = (await getBucketFileList()) as IStringKeyMap
  isShowLoadingPage.value = false

  if (!res.success) {
    message.error(t('pages.manage.bucket.getFileListFailed'))
    return
  }

  currentPageFilesInfo.push(...res.fullList)

  sortFile(sortType)

  if (!(cur < prev && !paging.value)) {
    if (res.isTruncated) {
      pagingMarkerStack.push(pagingMarker.value)
      pagingMarker.value = res.nextMarker
    } else {
      message.success(t('pages.manage.bucket.lastPageMsg'))
    }
  }
}

const handlePageNumberInput = async (event: Event) => {
  const target = event.target as HTMLInputElement
  const value = parseInt(target.value, 10)
  if (!isNaN(value) && value > 0) {
    currentPageNumber.value = value
    await changePage(currentPageNumber.value, previousPageNumber.value)
    previousPageNumber.value = currentPageNumber.value
  }
}

function sortFile(type: 'name' | 'size' | 'time' | 'ext' | 'check' | 'init') {
  currentSortType.value = type
  switch (type) {
    case 'name':
      localStorage.setItem('sortType', 'name')
      fileSortNameReverse.value = !fileSortNameReverse.value
      currentPageFilesInfo.sort((a: any, b: any) => {
        if (fileSortNameReverse.value) {
          return a.fileName.localeCompare(b.fileName)
        }
        return b.fileName.localeCompare(a.fileName)
      })
      break
    case 'size':
      localStorage.setItem('sortType', 'size')
      fileSortSizeReverse.value = !fileSortSizeReverse.value
      currentPageFilesInfo.sort((a: any, b: any) => {
        if (fileSortSizeReverse.value) {
          return a.fileSize - b.fileSize
        }
        return b.fileSize - a.fileSize
      })
      break
    case 'time':
      localStorage.setItem('sortType', 'time')
      fileSortTimeReverse.value = !fileSortTimeReverse.value
      currentPageFilesInfo.sort((a: any, b: any) => {
        if (fileSortTimeReverse.value) {
          return new Date(a.formatedTime).getTime() - new Date(b.formatedTime).getTime()
        }
        return new Date(b.formatedTime).getTime() - new Date(a.formatedTime).getTime()
      })
      break
    case 'ext':
      localStorage.setItem('sortType', 'ext')
      fileSortExtReverse.value = !fileSortExtReverse.value
      currentPageFilesInfo.sort((a: any, b: any) => {
        if (fileSortExtReverse.value) {
          return getExtension(a.fileName).localeCompare(getExtension(b.fileName))
        }
        return getExtension(b.fileName).localeCompare(getExtension(a.fileName))
      })
      break
    case 'check':
      localStorage.setItem('sortType', 'check')
      currentPageFilesInfo.sort((a: any, b: any) => {
        return b.checked - a.checked
      })
      break
    case 'init':
      localStorage.setItem('sortType', 'init')
      currentPageFilesInfo.sort((a: any, b: any) => {
        return b.isDir - a.isDir || a.fileName.localeCompare(b.fileName)
      })
  }
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

async function handleFolderBatchDownload(item: any) {
  try {
    const result = await confirm.confirm({
      message: t('pages.manage.bucket.notice'),
      title: t('pages.manage.bucket.downloadFolderNotice'),
      confirmButtonText: t('common.confirm'),
      cancelButtonText: t('common.cancel'),
      type: 'warning',
    })
    if (!result) return
    const defaultDownloadPath = await window.electron.triggerRPC<string>(
      IRPCActionType.MANAGE_GET_DEFAULT_DOWNLOAD_FOLDER,
    )
    const param = {
      downloadPath: manageStore.config.settings.downloadDir ?? defaultDownloadPath,
      maxDownloadFileCount: manageStore.config.settings.maxDownloadFileCount
        ? manageStore.config.settings.maxDownloadFileCount
        : 5,
      fileArray: [] as any[],
    }
    cancelToken.value = uuidv4()
    const paramGet = {
      // tcyun
      bucketName: configMap.value.bucketName,
      bucketConfig: {
        Location: configMap.value.bucketConfig.Location,
      },
      paging: paging.value,
      prefix: `/${item.key.replace(/^\/+|\/+$/, '')}/`,
      marker: pagingMarker.value,
      itemsPerPage: itemsPerPage.value,
      customUrl: currentCustomDomain.value,
      currentPage: currentPageNumber.value,
      cancelToken: cancelToken.value,
      cdnUrl: configMap.value.cdnUrl,
    }
    isLoadingDownloadData.value = true
    const downloadFileTransferStore = useDownloadFileTransferStore()
    downloadFileTransferStore.resetDownloadFileTransferList()
    window.electron.sendRPC(IRPCActionType.MANAGE_GET_BUCKET_LIST_RECURSIVELY, configMap.value.alias, paramGet)
    window.electron.ipcRendererOn(refreshDownloadFileTransferList, data => {
      downloadFileTransferStore.refreshDownloadFileTransferList(data)
    })
    downloadInterval = setInterval(() => {
      const currentFileList = downloadFileTransferStore.getDownloadFileTransferList()
      currentDownloadFileList.length = 0
      currentDownloadFileList.push(...currentFileList)
      if (downloadFileTransferStore.isFinished() && downloadInterval) {
        isLoadingDownloadData.value = false
        clearInterval(downloadInterval)
        if (downloadFileTransferStore.isSuccess()) {
          message.success(t('pages.manage.bucket.getDownloadListSuccess'))
          if (currentDownloadFileList.length) {
            currentDownloadFileList.forEach((item: any) => {
              param.fileArray.push({
                alias: configMap.value.alias,
                bucketName: configMap.value.bucketName,
                region: configMap.value.bucketConfig.Location,
                key: item.key,
                fileName: [undefined, true].includes(manageStore.config.settings.isDownloadFolderKeepDirStructure)
                  ? `/${item.key.replace(/^\/+|\/+$/, '')}`
                  : item.fileName,
                customUrl: currentCustomDomain.value,
                downloadUrl: item.downloadUrl,
                githubUrl: item.url,
                githubPrivate: configMap.value.bucketConfig.private,
              })
            })
          }
          window.electron.sendRPC(IRPCActionType.MANAGE_DOWNLOAD_BUCKET_FILE, configMap.value.alias, param)
          isShowDownloadPanel.value = true
        } else {
          message.error(t('pages.manage.bucket.getDownloadListFailed'))
        }
        downloadFileTransferStore.resetDownloadFileTransferList()
      }
    }, 500)
  } catch {
    message.info(t('pages.manage.bucket.canceled'))
  }
}

async function handleBatchDownload() {
  const defaultDownloadPath = await window.electron.triggerRPC<string>(
    IRPCActionType.MANAGE_GET_DEFAULT_DOWNLOAD_FOLDER,
  )
  const param = {
    downloadPath: manageStore.config.settings.downloadDir ?? defaultDownloadPath,
    maxDownloadFileCount: manageStore.config.settings.maxDownloadFileCount
      ? manageStore.config.settings.maxDownloadFileCount
      : 5,
    fileArray: [] as any[],
  }
  selectedItems.value.forEach((item: any) => {
    if (!item.isDir) {
      param.fileArray.push({
        alias: configMap.value.alias,
        bucketName: configMap.value.bucketName,
        region: configMap.value.bucketConfig.Location,
        key: item.key,
        fileName: manageStore.config.settings.isDownloadFileKeepDirStructure
          ? `/${item.key.replace(/^\/+|\/+$/, '')}`
          : item.fileName,
        customUrl: currentCustomDomain.value,
        downloadUrl: item.downloadUrl,
        githubUrl: item.url,
        githubPrivate: configMap.value.bucketConfig.private,
      })
    }
  })
  window.electron.sendRPC(IRPCActionType.MANAGE_DOWNLOAD_BUCKET_FILE, configMap.value.alias, param)
  handleCancelCheck()
  isShowDownloadPanel.value = true
}

function handleCheckAllChange() {
  const allSelected = selectedItems.value.length === filterList.value.length
  filterList.value.forEach((item: any) => {
    item.checked = !allSelected
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

function showUrlDialog() {
  dialogVisible.value = true
}

async function handleUploadFromUrl() {
  dialogVisible.value = false
  const urlList = [] as string[]
  urlToUpload.value.split('\n').forEach((item: string) => {
    if (item.trim() !== '' && isValidUrl(item.trim())) {
      urlList.push(item.trim())
    }
  })
  if (urlList.length === 0) {
    message.error(t('pages.manage.bucket.inputValidUrlMsg'))
    return
  }
  message.success(t('pages.manage.bucket.startUploadMsg'))
  const res = await window.electron.triggerRPC<any>(IRPCActionType.MANAGE_DOWNLOAD_FILE_FROM_URL, urlList)
  for (const item of res) {
    const fPath = item.replace(/\\/g, '/')
    uploadPanelFilesList.value.push({
      name: window.node.path.basename(fPath),
      path: fPath,
      size: window.node.fs.statSync(fPath).size,
    })
  }
  uploadFiles()
  isShowUploadPanel.value = true
}

function handleBatchRenameFile() {
  batchRenameMatch.value = ''
  isSingleRename.value = false
  isShowBatchRenameDialog.value = true
}

const matchedFilesNumber = computed(() => {
  if (!batchRenameMatch.value) {
    return [] as any[]
  }
  const matchedFiles = [] as any[]
  currentPageFilesInfo.forEach((item: any) => {
    if (isRenameIncludeExt.value) {
      if (customStrMatch(item.fileName, batchRenameMatch.value) && !item.isDir) {
        matchedFiles.push(item)
      }
    } else {
      if (customStrMatch(item.fileName.split('.')[0], batchRenameMatch.value) && !item.isDir) {
        matchedFiles.push(item)
      }
    }
  })
  return matchedFiles
})

async function BatchRename() {
  isShowBatchRenameDialog.value = false
  if (batchRenameMatch.value === '') {
    message.error(t('pages.manage.bucket.inputPatternMsg'))
    return
  }
  let matchedFiles = [] as any[]
  currentPageFilesInfo.forEach((item: any) => {
    if (isRenameIncludeExt.value) {
      if (customStrMatch(item.fileName, batchRenameMatch.value) && !item.isDir) {
        matchedFiles.push(item)
      }
    } else {
      if (customStrMatch(item.fileName.split('.')[0], batchRenameMatch.value) && !item.isDir) {
        matchedFiles.push(item)
      }
    }
  })
  if (matchedFiles.length === 0) {
    message.error(t('pages.manage.bucket.noMatchedFile'))
    return
  }
  for (const item of matchedFiles) {
    if (isRenameIncludeExt.value) {
      item.newName = customStrReplace(item.fileName, batchRenameMatch.value, batchRenameReplace.value)
    } else {
      item.newName =
        customStrReplace(item.fileName.split('.')[0], batchRenameMatch.value, batchRenameReplace.value) +
        '.' +
        item.fileName.split('.')[1]
    }
  }
  matchedFiles = matchedFiles.filter((item: any) => item.fileName !== item.newName)
  if (matchedFiles.length === 0) {
    message.error(t('pages.manage.bucket.noFileNeedRename'))
    return
  }
  for (let i = 0; i < matchedFiles.length; i++) {
    matchedFiles[i].newName = matchedFiles[i].newName.replaceAll('{auto}', (i + 1).toString())
  }
  const duplicateFilesNum = matchedFiles.filter(
    (item: any) => matchedFiles.filter((item2: any) => item2.newName === item.newName).length > 1,
  ).length
  let successCount = 0
  let failCount = 0
  const error = new Error('error')
  const renamefunc = (item: any) => {
    return new Promise((resolve, reject) => {
      const param = {
        // tcyun
        bucketName: configMap.value.bucketName,
        region: configMap.value.bucketConfig.Location,
        oldKey: item.key,
        newKey: (item.key.slice(0, item.key.lastIndexOf('/') + 1) + item.newName).replaceAll('//', '/'),
        customUrl: currentCustomDomain.value,
      }
      window.electron
        .triggerRPC<any>(IRPCActionType.MANAGE_RENAME_BUCKET_FILE, configMap.value.alias, param)
        .then((res: any) => {
          if (res) {
            successCount++
            resolve(true)
            const oldKey = currentPrefix.value + item.fileName
            if (pagingMarker.value === oldKey.slice(1)) {
              pagingMarker.value = currentPrefix.value.slice(1) + item.newName
            }
            const oldName = item.fileName
            if (item.newName.includes('/')) {
              item.fileName = item.newName.slice(0, item.newName.indexOf('/'))
              item.isDir = true
              item.fileSize = 0
              item.formatedTime = ''
            } else {
              item.fileName = item.newName
            }
            item.key = (item.key.slice(0, item.key.lastIndexOf('/') + 1) + item.newName).replaceAll('//', '/')
            item.url = `${currentCustomDomain.value}${currentPrefix.value}${item.newName}`
            item.formatedTime = new Date().toLocaleString()
            if (!paging.value) {
              const table = fileCacheDbInstance.table(currentPicBedName.value)
              table
                .where('key')
                .equals(getTableKeyOfDb())
                .modify((l: any) => {
                  l.value.fullList.forEach((i: any) => {
                    if (i.fileName === oldName) {
                      if (item.newName.includes('/')) {
                        i.fileName = item.newName.slice(0, item.newName.indexOf('/'))
                        i.isDir = true
                        i.fileSize = 0
                        i.formatedTime = ''
                      } else {
                        i.fileName = item.newName
                      }
                      i.key = (i.key.slice(0, i.key.lastIndexOf('/') + 1) + item.newName).replaceAll('//', '/')
                      i.url = `${currentCustomDomain.value}${currentPrefix.value}${item.newName}`
                      i.formatedTime = new Date().toLocaleString()
                    }
                  })
                })
            }
          } else {
            failCount++
            reject(error)
          }
        })
    })
  }
  if (duplicateFilesNum > 0) {
    try {
      const result = await confirm.confirm({
        message: `${t('pages.manage.bucket.fileDupNotice', { number: duplicateFilesNum })}`,
        title: t('pages.manage.bucket.notice'),
        confirmButtonText: t('common.confirm'),
        cancelButtonText: t('common.cancel'),
        type: 'warning',
        center: true,
      })
      if (!result) return
      const promiseList = [] as any[]
      for (const item of matchedFiles) {
        promiseList.push(renamefunc(item))
      }
      Promise.allSettled(promiseList).then(() => {
        message.success(`${t('pages.manage.bucket.renameResultMsg', { success: successCount, failed: failCount })}`)
      })
    } catch {
      message.info(t('pages.manage.bucket.canceled'))
    }
  } else {
    const promiseList = [] as any[]
    for (const item of matchedFiles) {
      promiseList.push(renamefunc(item))
    }
    Promise.allSettled(promiseList).then(() => {
      message.success(`${t('pages.manage.bucket.renameResultMsg', { success: successCount, failed: failCount })}`)
    })
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
  copyToClipboard(await formatLink(item.url, item.fileName, type, manageStore.config.settings.customPasteFormat))
  copyDropdownIndex.value = -1
}

function handlecopyDropdownOpen() {
  copyDropdownOpen.value = !copyDropdownOpen.value
}

async function handleBatchCopyLink(type: string) {
  if (!selectedItems.value.length) {
    message.warning(t('pages.manage.bucket.selectFileMsg'))
    copyDropdownOpen.value = false
    return
  }
  const result = [] as string[]
  for (const item of selectedItems.value) {
    if (!item.isDir) {
      const preSignedUrl = type === 'preSignedUrl' ? await getPreSignedUrl(item) : null
      const url = await formatLink(
        preSignedUrl || item.url,
        item.fileName,
        type,
        manageStore.config.settings.customPasteFormat,
      )
      result.push(url)
    }
  }
  window.electron.clipboard.writeText(result.join('\n'))
  message.success(`${t('pages.manage.bucket.copySuccess')}`)
  copyDropdownOpen.value = false
}

async function cancelLoading() {
  try {
    const result = await confirm.confirm({
      message: t('pages.manage.bucket.notice'),
      title: t('pages.manage.bucket.stopGetFileListMsg'),
      confirmButtonText: t('common.confirm'),
      cancelButtonText: t('common.cancel'),
      type: 'warning',
      center: true,
    })
    if (!result) return
    isLoadingData.value = false
    window.electron.sendToMain('cancelLoadingFileList', cancelToken.value)
    message.success(t('pages.manage.bucket.stopSuccessMsg'))
  } catch (e) {
    console.error(e)
  }
}

async function cancelDownloadLoading() {
  try {
    const result = await confirm.confirm({
      message: t('pages.manage.bucket.notice'),
      title: t('pages.manage.bucket.stopGetDownloadListMsg'),
      confirmButtonText: t('common.confirm'),
      cancelButtonText: t('common.cancel'),
      type: 'warning',
      center: true,
    })
    if (!result) return
    isLoadingData.value = false
    window.electron.sendToMain(cancelDownloadLoadingFileList, downloadCancelToken.value)
    message.success(t('pages.manage.bucket.stopSuccessMsg'))
  } catch (e) {
    console.error(e)
  }
}

async function getBucketFileListBackStage() {
  cancelToken.value = uuidv4()
  const param = {
    // tcyun
    bucketName: configMap.value.bucketName,
    bucketConfig: {
      Location: configMap.value.bucketConfig.Location,
    },
    paging: paging.value,
    prefix: currentPrefix.value,
    marker: pagingMarker.value,
    itemsPerPage: itemsPerPage.value,
    customUrl: currentCustomDomain.value,
    currentPage: currentPageNumber.value,
    cancelToken: cancelToken.value,
    cdnUrl: configMap.value.cdnUrl,
  } as IStringKeyMap
  isLoadingData.value = true
  const fileTransferStore = useFileTransferStore()
  fileTransferStore.resetFileTransferList()
  const picBedNamesArr = ['webdavplist', 'local', 'sftp']
  if (picBedNamesArr.includes(currentPicBedName.value)) {
    param.baseDir = configMap.value.baseDir
    param.webPath = configMap.value.webPath
  }
  window.electron.sendRPC(IRPCActionType.MANAGE_GET_BUCKET_LIST_BACKSTAGE, configMap.value.alias, param)
  window.electron.ipcRendererOn('refreshFileTransferList', data => {
    fileTransferStore.refreshFileTransferList(data)
  })
  fileTransferInterval = setInterval(() => {
    const currentFileList = fileTransferStore.getFileTransferList()
    currentPageFilesInfo.splice(0, currentPageFilesInfo.length, ...currentFileList)
    const sortType = (localStorage.getItem('sortType') as ISortTypeList) || 'init'
    sortFile(sortType)
    const table = fileCacheDbInstance.table(currentPicBedName.value)
    table.put({
      key: getTableKeyOfDb(),
      value: JSON.parse(
        JSON.stringify({
          fullList: currentPageFilesInfo,
        }),
      ),
    })
    if (fileTransferStore.isFinished() && fileTransferInterval) {
      isLoadingData.value = false
      clearInterval(fileTransferInterval)
      if (fileTransferStore.isSuccess()) {
        message.success(t('pages.manage.bucket.getFileListSuccess'))
      } else {
        message.error(t('pages.manage.bucket.partFileListFailed'))
      }
      fileTransferStore.resetFileTransferList()
    }
  }, 1000)
}

async function getBucketFileList() {
  const param = {
    // tcyun
    bucketName: configMap.value.bucketName,
    bucketConfig: {
      Location: configMap.value.bucketConfig.Location,
    },
    paging: paging.value,
    prefix: currentPrefix.value,
    marker: pagingMarker.value,
    itemsPerPage: itemsPerPage.value,
    customUrl: currentCustomDomain.value,
    currentPage: currentPageNumber.value,
  }
  return await window.electron.triggerRPC<any>(IRPCActionType.MANAGE_GET_BUCKET_FILE_LIST, configMap.value.alias, param)
}

async function handleBatchDeleteInfo() {
  try {
    const result = await confirm.confirm({
      message: t('pages.manage.bucket.willDeleteMsg', { num: selectedItems.value.length }),
      title: t('pages.manage.bucket.notice'),
      confirmButtonText: t('common.confirm'),
      cancelButtonText: t('common.cancel'),
      type: 'warning',
      center: true,
    })
    if (!result) return
    const copiedSelectedItems = JSON.parse(JSON.stringify(selectedItems.value))
    let successCount = 0
    let failCount = 0

    for (const item of copiedSelectedItems) {
      const param = {
        bucketName: configMap.value.bucketName,
        region: configMap.value.bucketConfig.Location,
        key: item.key,
        DeleteHash: item.sha,
        githubBranch: currentCustomDomain.value,
      }
      const result = item.isDir
        ? await window.electron.triggerRPC<any>(
            IRPCActionType.MANAGE_DELETE_BUCKET_FOLDER,
            configMap.value.alias,
            param,
          )
        : await window.electron.triggerRPC<any>(IRPCActionType.MANAGE_DELETE_BUCKET_FILE, configMap.value.alias, param)
      if (result) {
        successCount++
        currentPageFilesInfo.splice(
          currentPageFilesInfo.findIndex((j: any) => j.key === item.key),
          1,
        )
        if (!paging.value) {
          const table = fileCacheDbInstance.table(currentPicBedName.value)
          table
            .where('key')
            .equals(getTableKeyOfDb())
            .modify((l: any) => {
              l.value.fullList.splice(
                l.value.fullList.findIndex((j: any) => j.key === item.key),
                1,
              )
            })
        }
      } else {
        failCount++
      }
    }
    if (successCount === 0) {
      message.error(t('pages.manage.bucket.deleteFailed'))
    } else if (failCount === 0) {
      message.success(t('pages.manage.bucket.deleteSuccess'))
    } else {
      message.warning(`${t('pages.manage.bucket.deleteMultiMsg', { success: successCount, failed: failCount })}`)
    }
  } catch {
    message.info(t('pages.manage.bucket.canceled'))
  }
}

async function handleDeleteFile(item: any) {
  try {
    const result = await confirm.confirm({
      message: `${t('pages.manage.bucket.deleteMsg')}`,
      title: t('pages.manage.bucket.notice'),
      confirmButtonText: t('common.confirm'),
      cancelButtonText: t('common.cancel'),
      type: 'warning',
      center: true,
    })
    if (!result) return
    let res = false
    const param = {
      bucketName: configMap.value.bucketName,
      region: configMap.value.bucketConfig.Location,
      key: item.key,
      DeleteHash: item.sha,
      githubBranch: currentCustomDomain.value,
    }
    if (item.isDir) {
      message.info(t('pages.manage.bucket.deletingMsg'))
      res = await window.electron.triggerRPC<any>(
        IRPCActionType.MANAGE_DELETE_BUCKET_FOLDER,
        configMap.value.alias,
        param,
      )
    } else {
      res = await window.electron.triggerRPC<any>(
        IRPCActionType.MANAGE_DELETE_BUCKET_FILE,
        configMap.value.alias,
        param,
      )
    }
    if (res) {
      message.success(t('pages.manage.bucket.deleteSuccess'))
      currentPageFilesInfo.splice(
        currentPageFilesInfo.findIndex((i: any) => i.key === item.key),
        1,
      )
      if (!paging.value) {
        const table = fileCacheDbInstance.table(currentPicBedName.value)
        table
          .where('key')
          .equals(getTableKeyOfDb())
          .modify((l: any) => {
            l.value.fullList.splice(
              l.value.fullList.findIndex((i: any) => i.key === item.key),
              1,
            )
          })
      }
    } else {
      message.error(t('pages.manage.bucket.deleteFailed'))
    }
  } catch {
    message.info(t('pages.manage.bucket.canceled'))
  }
}

function handleRenameFile(item: any) {
  batchRenameMatch.value = window.node.path.basename(item.fileName, window.node.path.extname(item.fileName))
  isSingleRename.value = true
  isShowBatchRenameDialog.value = true
  itemToBeRenamed.value = item
}

function singleRename() {
  const index = filterList.value.findIndex((i: any) => i === itemToBeRenamed.value)
  isShowBatchRenameDialog.value = false
  if (batchRenameMatch.value === '') {
    batchRenameMatch.value = '.+'
  }
  if (isRenameIncludeExt.value) {
    itemToBeRenamed.value.newName = customStrReplace(
      itemToBeRenamed.value.fileName,
      batchRenameMatch.value,
      batchRenameReplace.value,
    )
  } else {
    itemToBeRenamed.value.newName =
      customStrReplace(itemToBeRenamed.value.fileName.split('.')[0], batchRenameMatch.value, batchRenameReplace.value) +
      '.' +
      itemToBeRenamed.value.fileName.split('.')[1]
  }
  if (itemToBeRenamed.value.newName === itemToBeRenamed.value.fileName) {
    message.info(t('pages.manage.bucket.noNeedToRename'))
    return
  }
  itemToBeRenamed.value.newName = itemToBeRenamed.value.newName.replaceAll('{auto}', '1')
  const item = currentPageFilesInfo[index]
  const param = {
    // tcyun
    bucketName: configMap.value.bucketName,
    region: configMap.value.bucketConfig.Location,
    oldKey: item.key,
    newKey: (item.key.slice(0, item.key.lastIndexOf('/') + 1) + itemToBeRenamed.value.newName).replaceAll('//', '/'),
    customUrl: currentCustomDomain.value,
  }
  window.electron
    .triggerRPC<any>(IRPCActionType.MANAGE_RENAME_BUCKET_FILE, configMap.value.alias, param)
    .then((res: any) => {
      if (res) {
        const oldKey = currentPrefix.value + item.fileName
        if (pagingMarker.value === oldKey.slice(1)) {
          pagingMarker.value = currentPrefix.value.slice(1) + itemToBeRenamed.value.newName
        }
        const oldName = item.fileName
        if (itemToBeRenamed.value.newName.includes('/')) {
          item.fileName = itemToBeRenamed.value.newName.slice(0, itemToBeRenamed.value.newName.indexOf('/'))
          item.isDir = true
          item.fileSize = 0
          item.formatedTime = ''
        } else {
          item.fileName = itemToBeRenamed.value.newName
        }
        item.key = (item.key.slice(0, item.key.lastIndexOf('/') + 1) + itemToBeRenamed.value.newName).replaceAll(
          '//',
          '/',
        )
        item.url = `${currentCustomDomain.value}${currentPrefix.value}${itemToBeRenamed.value.newName}`
        item.formatedTime = new Date().toLocaleString()
        if (!paging.value) {
          const table = fileCacheDbInstance.table(currentPicBedName.value)
          table
            .where('key')
            .equals(getTableKeyOfDb())
            .modify((l: any) => {
              l.value.fullList.forEach((i: any) => {
                if (i.fileName === oldName) {
                  if (itemToBeRenamed.value.newName.includes('/')) {
                    i.fileName = itemToBeRenamed.value.newName.slice(0, itemToBeRenamed.value.newName.indexOf('/'))
                    i.isDir = true
                    i.fileSize = 0
                    i.formatedTime = ''
                  } else {
                    i.fileName = itemToBeRenamed.value.newName
                  }
                  i.key = (i.key.slice(0, i.key.lastIndexOf('/') + 1) + itemToBeRenamed.value.newName).replaceAll(
                    '//',
                    '/',
                  )
                  i.url = `${currentCustomDomain.value}${currentPrefix.value}${itemToBeRenamed.value.newName}`
                  i.formatedTime = new Date().toLocaleString()
                }
              })
            })
        }
        message.success(t('pages.manage.bucket.renameSuccess'))
      } else {
        message.error(t('pages.manage.bucket.renameFailed'))
      }
    })
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
  copyDropdownIndex.value = -1
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
  }
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

function getTableKeyOfDb() {
  let tableKey
  if (currentPicBedName.value === 'github') {
    // customUrl is branch
    tableKey = `${configMap.value.alias}@${configMap.value.bucketConfig.githubUsername}@${configMap.value.bucketName}@${currentCustomDomain.value}@${currentPrefix.value}`
  } else {
    tableKey = `${configMap.value.alias}@${configMap.value.bucketName}@${currentPrefix.value}`
  }
  return tableKey
}

async function searchExistFileList() {
  const table = fileCacheDbInstance.table(currentPicBedName.value)
  return await table.where('key').equals(getTableKeyOfDb()).toArray()
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
  document.removeEventListener('keydown', handleDetectShiftKey)
  document.removeEventListener('keyup', handleDetectShiftKey)
  fileTransferInterval && clearInterval(fileTransferInterval)
  downloadInterval && clearInterval(downloadInterval)
  refreshUploadTaskId.value && clearInterval(refreshUploadTaskId.value)
  refreshDownloadTaskId.value && clearInterval(refreshDownloadTaskId.value)
  if (isLoadingData.value) {
    window.electron.sendToMain('cancelLoadingFileList', cancelToken.value)
  }
  if (isLoadingDownloadData.value) {
    window.electron.sendToMain(cancelDownloadLoadingFileList, downloadCancelToken.value)
  }
  window.electron.ipcRendererRemoveAllListeners('refreshFileTransferList')
  window.electron.ipcRendererRemoveAllListeners(refreshDownloadFileTransferList)
})
</script>

<style src="./css/BucketPage.css" scoped></style>
