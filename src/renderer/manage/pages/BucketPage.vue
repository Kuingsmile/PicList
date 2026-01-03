<!-- eslint-disable vue/no-v-html -->
<template>
  <div
    ref="bucketContainerRef"
    class="bucket-container"
    :class="{ 'content-fullscreen': isContentFullscreen }"
    @scroll="handleBucketContainerScroll"
  >
    <!-- Header Card -->
    <div v-if="!isContentFullscreen" class="bucket-card header-card">
      <div class="card-header">
        <div class="header-left">
          <!-- Custom Domain Input/Select -->
          <div
            v-if="isShowCustomDomainSelectList && customDomainList.length > 1 && isAutoCustomDomain"
            class="custom-domain-select"
          >
            <select v-model="currentCustomDomain" class="select-input" @change="handleChangeCustomUrlInput">
              <option value="" disabled>
                {{ t('pages.manage.bucket.selectCustomDomain') }}
              </option>
              <option v-for="item in customDomainList" :key="item.value" :value="item.value">
                {{ item.label }}
              </option>
            </select>
            <ChevronDownIcon class="select-arrow" />
          </div>
          <input
            v-else-if="isShowCustomDomainInput"
            v-model="currentCustomDomain"
            type="text"
            class="custom-domain-input"
            :placeholder="t('pages.manage.bucket.inputCustomDomain')"
            @blur="handleChangeCustomUrlInput"
          />
          <a v-else class="custom-domain-link" @click="copyToClipboard(currentCustomDomain)">
            {{ currentCustomDomain }}
          </a>
        </div>

        <div class="header-actions">
          <!-- Upload Files -->
          <div class="tooltip">
            <button class="action-button primary" @click="showUploadDialog">
              <UploadIcon class="action-icon" />
              <span class="tooltip-text">{{ t('pages.manage.bucket.uploadFiles') }}</span>
            </button>
          </div>

          <!-- Upload from URL -->
          <div class="tooltip">
            <button class="action-button primary" @click="showUrlDialog">
              <LinkIcon class="action-icon" />
              <span class="tooltip-text">{{ t('pages.manage.bucket.uploadFromUrl') }}</span>
            </button>
          </div>

          <!-- Create Folder -->
          <div v-if="isShowCreateNewFolder" class="tooltip">
            <button class="action-button primary" @click="handleCreateFolder">
              <FolderPlusIcon class="action-icon" />
              <span class="tooltip-text">{{ t('pages.manage.bucket.createFolder') }}</span>
            </button>
          </div>

          <!-- Download -->
          <div class="tooltip">
            <button class="action-button primary" @click="showDownloadDialog">
              <DownloadIcon class="action-icon" />
              <span class="tooltip-text">{{ t('pages.manage.bucket.downloadPage') }}</span>
            </button>
          </div>

          <!-- Batch Rename -->
          <div v-if="isShowRenameFileIcon" class="tooltip">
            <button class="action-button primary" @click="handleBatchRenameFile">
              <EditIcon class="action-icon" />
              <span class="tooltip-text">{{ t('pages.manage.bucket.batchRename') }}</span>
            </button>
          </div>

          <!-- Copy URL -->
          <div class="dropdown">
            <button
              class="action-button primary"
              :class="{ 'action-button': selectedItems.length === 0 }"
              @click="copyDropdownOpen = !copyDropdownOpen"
            >
              <CopyIcon class="action-icon" />
            </button>
            <div v-if="copyDropdownOpen" class="dropdown-content">
              <div
                v-for="i in linkFormatArray"
                :key="i.key"
                class="dropdown-item"
                @click="handleBatchCopyLink(i.value)"
              >
                {{ i.key }}
              </div>
              <div v-if="isShowPresignedUrl" class="dropdown-item" @click="handleBatchCopyLink('preSignURL')">
                preSignURL
              </div>
            </div>
          </div>

          <!-- Copy File Info -->
          <div class="tooltip">
            <button
              class="action-button primary"
              :class="{ disabled: selectedItems.length === 0 }"
              @click="handleBatchCopyInfo"
            >
              <InfoIcon class="action-icon" />
              <span class="tooltip-text">{{ t('pages.manage.bucket.copyFileIno') }}</span>
            </button>
          </div>

          <!-- Refresh -->
          <div class="tooltip">
            <button class="action-button secondary" @click="forceRefreshFileList">
              <RefreshCwIcon class="action-icon" />
              <span class="tooltip-text">{{ t('pages.manage.bucket.forceRefreshFileList') }}</span>
            </button>
          </div>

          <!-- Search -->
          <input
            v-model="searchText"
            type="text"
            class="search-input"
            :placeholder="t('pages.manage.bucket.searchPlaceholder')"
          />
        </div>
      </div>
    </div>

    <!-- Breadcrumb Card -->
    <div v-if="!isContentFullscreen" class="bucket-card breadcrumb-card">
      <div class="breadcrumb-container">
        <HomeIcon class="action-icon" />
        <template v-if="configMap.prefix !== '/'">
          <template v-for="(item, index) in configMap.prefix.replace(/\/$/g, '').split('/')" :key="index">
            <ChevronRightIcon class="breadcrumb-separator" />
            <button class="breadcrumb-item" @click="handleBreadcrumbClick(Number(index))">
              {{ item === '' ? t('pages.manage.bucket.rootFolder') : item }}
            </button>
          </template>
        </template>
        <template v-else>
          <span class="breadcrumb-item current">
            {{ t('pages.manage.bucket.rootFolder') }}
          </span>
        </template>
      </div>
    </div>

    <!-- Control Panel Card -->
    <div v-if="!isContentFullscreen" class="bucket-card control-panel-card">
      <div class="control-panel">
        <div class="control-left">
          <!-- File Info -->
          <div class="file-info">
            <div class="file-info-item">
              <FileIcon class="action-icon" />
              <span>{{ `${t('pages.manage.bucket.fileNum', { num: currentPageFilesInfo.length })}` }}</span>
            </div>
            <div class="file-info-item">
              <HardDriveIcon class="action-icon" />
              <span>{{ `${t('pages.manage.bucket.pageFileSize', { size: calculateAllFileSize })}` }}</span>
            </div>
          </div>
        </div>

        <div class="control-center">
          <!-- Selection Controls -->
          <div v-if="selectedItems.length === 0">
            <button class="action-button secondary" @click="handleCheckAllChange">
              {{ t('pages.manage.bucket.selectAll') }}
            </button>
          </div>
          <div v-else class="control-center">
            <button class="action-button secondary" @click="handleCancelCheck">
              {{ t('pages.manage.bucket.cancel') }}
            </button>
            <button class="action-button secondary" @click="handleReverseCheck">
              {{ t('pages.manage.bucket.reverseSelect') }}
            </button>
            <button class="action-button secondary" @click="handleCheckAllChange">
              {{ t('pages.manage.bucket.selectAll') }}
            </button>
            <button class="action-button primary" @click="handleBatchDownload">
              <DownloadIcon class="action-icon" />
              {{
                `${t('pages.manage.bucket.downloadBtn', { num: selectedItems.filter(item => item.isDir === false).length })}`
              }}
            </button>
            <button class="action-button danger" @click="handleBatchDeleteInfo">
              <Trash2Icon class="action-icon" />
              {{ `${t('pages.manage.bucket.removeBtn', { num: selectedItems.length })}` }}
            </button>
          </div>

          <!-- Sort Dropdown -->
          <div class="dropdown">
            <button class="dropdown-button" @click="sortDropdownOpen = !sortDropdownOpen">
              <ArrowUpDownIcon class="action-icon" />
              {{ t(`pages.manage.bucket.sort.${currentSortType}`) }}
              <ChevronDownIcon class="action-icon" />
            </button>
            <div v-if="sortDropdownOpen" class="dropdown-content">
              <div v-for="item in sortTypeList" :key="item" class="dropdown-item" @click="sortFile(item as any)">
                {{ t(`pages.manage.bucket.sort.${item}`) }}
              </div>
            </div>
          </div>
        </div>

        <div class="control-right">
          <!-- Fullscreen Toggle -->
          <div class="tooltip">
            <button class="action-button secondary" @click="toggleContentFullscreen">
              <ExpandIcon v-if="!isContentFullscreen" class="action-icon" />
              <ShrinkIcon v-else class="action-icon" />
              <span class="tooltip-text">
                {{
                  isContentFullscreen
                    ? t('pages.manage.bucket.exitFullScreen')
                    : t('pages.manage.bucket.enterFullScreen')
                }}
              </span>
            </button>
          </div>

          <!-- View Toggle -->
          <!--
          <div class="view-toggle">
            <button
              class="view-toggle-button"
              :class="{ active: layoutStyle === 'grid' }"
              @click="handleViewChange('grid')"
            >
              <GridIcon class="action-icon" />
            </button>
            <button
              class="view-toggle-button"
              :class="{ active: layoutStyle === 'list' }"
              @click="handleViewChange('list')"
            >
              <ListIcon class="action-icon" />
            </button>
          </div>
          -->

          <!-- Pagination -->
          <input
            v-if="paging"
            v-model="currentPageNumber"
            type="number"
            min="1"
            class="page-input"
            :disabled="!paging"
            @input="handlePageNumberInput"
          />
        </div>
      </div>
    </div>

    <!-- Content Card -->
    <!-- Fullscreen Header (only visible in fullscreen mode) -->
    <div v-if="isContentFullscreen" class="bucket-card fullscreen-header">
      <div class="fullscreen-header-left">
        <div class="fullscreen-breadcrumb">
          <HomeIcon class="action-icon" />
          <template v-if="configMap.prefix !== '/'">
            <template v-for="(item, index) in configMap.prefix.replace(/\/$/g, '').split('/')" :key="index">
              <ChevronRightIcon class="breadcrumb-separator" />
              <button class="breadcrumb-item" @click="handleBreadcrumbClick(Number(index))">
                {{ item === '' ? t('pages.manage.bucket.rootFolder') : item }}
              </button>
            </template>
          </template>
          <template v-else>
            <span class="breadcrumb-item current">
              {{ t('pages.manage.bucket.rootFolder') }}
            </span>
          </template>
        </div>
      </div>

      <div class="fullscreen-header-center">
        <div class="file-info">
          <div class="file-info-item">
            <FileIcon class="action-icon" />
            <span>{{ `${t('pages.manage.bucket.fileNum', { num: currentPageFilesInfo.length })}` }}</span>
          </div>
          <div class="file-info-item">
            <span>{{ `${t('pages.manage.bucket.pageFileSize', { size: calculateAllFileSize })}` }}</span>
          </div>
        </div>
      </div>

      <div class="fullscreen-header-right">
        <!-- Search -->
        <input
          v-model="searchText"
          type="text"
          class="search-input"
          :placeholder="t('pages.manage.bucket.searchPlaceholder')"
        />

        <!-- Exit Fullscreen -->
        <div class="tooltip">
          <button class="action-button secondary" @click="toggleContentFullscreen">
            <ShrinkIcon class="action-icon" />
            <span class="tooltip-text">{{ t('pages.manage.bucket.exitFullScreen') }}</span>
          </button>
        </div>
      </div>
    </div>

    <div class="bucket-card content-area">
      <!-- Virtual Scroller -->
      <div v-if="filterList.length === 0" class="empty-state">
        <ImageIcon :size="64" class="empty-icon" />
        <h3>{{ t('pages.gallery.noImagesFound') }}</h3>
        <p>{{ t('pages.gallery.tryAdjustingFilters') }}</p>
      </div>
      <VirtualScroller
        v-else
        ref="virtualScrollerRef"
        :items="filterList"
        class="virtual-gallery-scroller"
        :item-height="layoutStyle === 'grid' ? 240 : 70"
        :view-mode="layoutStyle"
        :grid-breakpoints="gridBreakpoints"
        key-field="key"
      >
        <template #default="{ item, index }">
          <!-- Grid View -->
          <div
            v-if="layoutStyle === 'grid'"
            class="file-grid-item"
            :class="{ selected: item.checked }"
            @click="handleClickFile(item)"
          >
            <div class="file-preview">
              <!-- Image Preview -->
              <template v-if="!item.isDir && !['webdavplist', 'sftp', 'local', 's3plist'].includes(currentPicBedName)">
                <img v-if="isShowThumbnail && item.isImage" :src="item.url" class="file-image" @error="() => {}" />
                <img v-else :src="`./assets/icons/${getFileIconPath(item.fileName ?? '')}`" class="file-image" />
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
                <img :src="`./assets/icons/${getFileIconPath(item.fileName ?? '')}`" class="file-image" />
              </template>

              <!-- Folder Icon -->
              <template v-else>
                <FolderIcon class="file-icon" />
              </template>
            </div>

            <div class="file-info-section">
              <div class="file-name" :title="item.fileName" @click.stop="copyToClipboard(item.fileName ?? '')">
                {{ formatFileName(item.fileName ?? '', 25) }}
              </div>
              <div class="file-meta">
                <span>{{ formatFileSize(item.fileSize) }}</span>
                <span>{{ item.formatedTime }}</span>
              </div>
              <div class="file-actions">
                <div class="file-action-group">
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
                  <div class="file-actions-dropdown" :data-dropdown-index="index">
                    <button class="file-action-button" @click.stop="toggleCopyDropdown(index, $event)">
                      <CopyIcon class="action-icon" />
                    </button>
                    <teleport to="body">
                      <div
                        v-if="copyDropdownIndex === index"
                        class="file-actions-dropdown-content floating"
                        :style="getDropdownStyle(index)"
                        data-floating-dropdown
                      >
                        <div
                          v-for="format in linkFormatList"
                          :key="format"
                          class="file-actions-dropdown-item"
                          @click.stop="copyLink(item, format)"
                        >
                          {{ t(`pages.manage.bucket.linkFormat.${format}`) }}
                        </div>
                        <div
                          v-if="isShowPresignedUrl"
                          class="file-actions-dropdown-item"
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
                <input v-model="item.checked" type="checkbox" class="file-checkbox" @click.stop />
              </div>
            </div>
          </div>

          <!-- List View -->
          <div v-else class="file-list-item" :class="{ selected: item.checked }" @click="handleCheckChangeOther(item)">
            <!-- Checkbox -->
            <input v-model="item.checked" type="checkbox" class="file-list-checkbox file-checkbox" @click.stop />

            <!-- Icon -->
            <div class="file-list-icon">
              <template v-if="!item.isDir">
                <img
                  v-if="isShowThumbnail && item.isImage"
                  :src="item.url"
                  class="file-image"
                  style="border-radius: 4px; width: 32px; height: 32px; object-fit: cover"
                  @error="() => {}"
                />
                <img
                  v-else
                  :src="`./assets/icons/${getFileIconPath(item.fileName ?? '')}`"
                  style="width: 32px; height: 32px; object-fit: contain"
                />
              </template>
              <FolderIcon v-else class="file-icon" style="width: 32px; height: 32px" />
            </div>

            <!-- File Info -->
            <div class="file-list-info" @click.stop="handleClickFile(item)">
              <div class="file-list-name">
                {{ formatFileName(item.fileName ?? '', 40) }}
              </div>
              <div class="file-list-meta">
                <span>{{ formatFileSize(item.fileSize) }}</span>
                <span>{{ item.formatedTime }}</span>
              </div>
            </div>

            <!-- Actions -->
            <div class="file-list-actions">
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

              <!-- Copy Link -->
              <button
                class="file-action-button"
                @click.stop="
                  async () =>
                    copyToClipboard(
                      await formatLink(
                        item.url,
                        item.fileName,
                        manageStore.config.settings.pasteFormat ?? '$markdown',
                        manageStore.config.settings.customPasteFormat ?? '$url',
                      ),
                    )
                "
              >
                <CopyIcon class="action-icon" />
              </button>

              <!-- File Info -->
              <button class="file-action-button" @click.stop="handleShowFileInfo(item)">
                <InfoIcon class="action-icon" />
              </button>

              <!-- Delete -->
              <button class="file-action-button danger" @click.stop="handleDeleteFile(item)">
                <Trash2Icon class="action-icon" />
              </button>
            </div>
          </div>
        </template>
      </VirtualScroller>
    </div>

    <!-- URL Upload Dialog -->
    <div v-if="dialogVisible" class="modal-overlay" @click="dialogVisible = false">
      <div class="modal-container" style="width: 500px" @click.stop>
        <div class="modal-header">
          <h3 class="modal-title">
            {{ t('pages.manage.bucket.urlUploadTitle') }}
          </h3>
          <button class="modal-close" @click="dialogVisible = false">
            <XIcon class="action-icon" />
          </button>
        </div>
        <div class="modal-content">
          <div class="form-group">
            <textarea
              v-model="urlToUpload"
              class="form-input form-textarea"
              placeholder="https://www.baidu.com/img/bd_logo1.png&#10;https://www.baidu.com/img/bd_logo1.png"
            />
          </div>
        </div>
        <div class="modal-footer">
          <button class="action-button secondary" @click="dialogVisible = false">
            {{ t('common.cancel') }}
          </button>
          <button class="action-button primary" @click="handleUploadFromUrl">
            {{ t('common.confirm') }}
          </button>
        </div>
      </div>
    </div>

    <!-- Image Preview -->
    <div v-if="isShowImagePreview" class="modal-overlay" @click="isShowImagePreview = false">
      <div class="modal-container" style="max-width: 90vw; max-height: 90vh" @click.stop>
        <div class="modal-header">
          <h3 class="modal-title">Image Preview</h3>
          <button class="modal-close" @click="isShowImagePreview = false">
            <XIcon class="action-icon" />
          </button>
        </div>
        <div class="modal-content">
          <img
            :src="ImagePreviewList[getCurrentPreviewIndex]"
            style="max-width: 100%; max-height: 70vh; object-fit: contain"
          />
        </div>
      </div>
    </div>

    <!-- File Info Dialog -->
    <div v-if="isShowFileInfo" class="modal-overlay" @click="isShowFileInfo = false">
      <div class="modal-container" style="width: 600px" @click.stop>
        <div class="modal-header">
          <h3 class="modal-title">
            {{ t('pages.manage.bucket.fileInfo') }}
          </h3>
          <button
            class="action-button primary"
            @click="copyToClipboard(JSON.stringify(currentShowedFileInfo, null, 2))"
          >
            <CopyIcon class="action-icon" />
            {{ t('pages.manage.bucket.copyFileInfoInJson') }}
          </button>
          <button class="modal-close" @click="isShowFileInfo = false">
            <XIcon class="action-icon" />
          </button>
        </div>
        <div class="modal-content">
          <div
            v-for="(value, key) in currentShowedFileInfo"
            :key="key"
            style="display: flex; margin-bottom: 1rem; gap: 1rem"
          >
            <div
              style="flex: 0 0 30%; font-weight: 500; cursor: pointer"
              @click="copyToClipboard(JSON.stringify({ [key]: value }))"
            >
              {{ key }}:
            </div>
            <div style="flex: 1; word-break: break-all; cursor: pointer" @click="copyToClipboard(value)">
              {{ value }}
            </div>
          </div>
        </div>
      </div>
    </div>

    <!-- Batch Rename Dialog -->
    <div v-if="isShowBatchRenameDialog" class="modal-overlay" @click="isShowBatchRenameDialog = false">
      <div class="modal-container" style="width: 600px" @click.stop>
        <div class="modal-header">
          <h3 class="modal-title">
            {{ t('pages.manage.bucket.renameFile') }}
          </h3>
          <button class="modal-close" @click="isShowBatchRenameDialog = false">
            <XIcon class="action-icon" />
          </button>
        </div>
        <div class="modal-content">
          <div class="form-group">
            <label class="form-label">
              {{ t('pages.manage.bucket.matchedPattern', { num: matchedFilesNumber }) }}
              <div class="tooltip">
                <InfoIcon class="action-icon" />
                <span class="tooltip-text">{{ t('pages.manage.bucket.regexPatternTips') }}</span>
              </div>
            </label>
            <input
              v-model="batchRenameMatch"
              type="text"
              class="form-input"
              :placeholder="t('pages.manage.bucket.regexPlaceholder')"
            />
          </div>

          <div class="form-group">
            <label class="form-label">
              {{ t('pages.manage.bucket.replaceInput') }}
            </label>
            <input v-model="batchRenameReplace" type="text" class="form-input" placeholder="Ex. {Y}-{m}-{uuid}" />
          </div>

          <div class="form-group">
            <div class="switch-container">
              <label class="switch">
                <input v-model="isRenameIncludeExt" type="checkbox" />
                <span class="switch-slider" />
              </label>
              <span class="switch-label">
                {{ isRenameIncludeExt ? t('pages.manage.bucket.includeExt') : t('pages.manage.bucket.excludeExt') }}
              </span>
            </div>
          </div>
        </div>
        <div class="modal-footer">
          <button class="action-button secondary" @click="isShowBatchRenameDialog = false">
            {{ t('common.cancel') }}
          </button>
          <button class="action-button primary" @click="isSingleRename ? singleRename() : BatchRename()">
            {{ t('common.confirm') }}
          </button>
        </div>
      </div>
    </div>

    <!-- Loading Indicators -->
    <div
      v-if="isLoadingData"
      class="modal-overlay"
      style="position: fixed; right: 25px; bottom: 25px; background: none; pointer-events: none"
    >
      <button class="action-button warning" style="pointer-events: auto" @click="cancelLoading">
        <div class="loading-spinner" />
        {{ t('pages.manage.bucket.loading') }}
      </button>
    </div>

    <div
      v-if="isLoadingDownloadData"
      class="modal-overlay"
      style="position: fixed; top: 50px; right: 25px; background: none; pointer-events: none"
    >
      <button class="action-button warning" style="pointer-events: auto" @click="cancelDownloadLoading">
        <div class="loading-spinner" />
        {{ t('pages.manage.bucket.prepareDownload') }}
      </button>
    </div>
    <!-- Upload Drawer -->
    <div
      v-if="isShowUploadPanel"
      class="drawer-overlay"
      :class="{ open: isShowUploadPanel }"
      @click="isShowUploadPanel = false"
    >
      <div class="drawer-container" @click.stop>
        <div class="drawer-header">
          <h3 class="drawer-title">
            {{ t('pages.manage.bucket.uploadFile') }}
          </h3>
          <div class="switch-container">
            <label class="switch">
              <input v-model="isUploadKeepDirStructure" type="checkbox" @change="handleUploadKeepDirChange" />
              <span class="switch-slider" />
            </label>
            <span class="switch-label">
              {{
                isUploadKeepDirStructure
                  ? t('pages.manage.bucket.keepDirStructure')
                  : t('pages.manage.bucket.noKeepDirStructure')
              }}
            </span>
          </div>
          <button class="modal-close" @click="isShowUploadPanel = false">
            <XIcon class="action-icon" />
          </button>
        </div>

        <div class="drawer-content">
          <div
            v-if="!tableData.length"
            class="upload-area"
            :class="{ dragover: isDragover }"
            @drop.prevent="onDrop"
            @dragover.prevent="isDragover = true"
            @dragleave.prevent="isDragover = false"
            @click="openFileSelectDialog"
          >
            <div class="upload-area-text">
              {{ t('pages.manage.bucket.dragUpload') }}
            </div>
            <div class="upload-area-subtext">
              {{ t('pages.manage.bucket.clickUpload') }}
            </div>
          </div>

          <!-- Upload File List -->
          <div v-if="tableData.length">
            <VirtualScroller
              :items="
                tableData.sort((a, b) =>
                  b.isFolder - a.isFolder === 0 ? b.filesList.length - a.filesList.length : b.isFolder - a.isFolder,
                )
              "
              :item-height="60"
              view-mode="list"
            >
              <template #default="{ item }">
                <div class="file-list-item">
                  <div class="file-list-icon">
                    <FolderIcon v-if="item.isFolder" class="file-icon" />
                    <FileIcon v-else class="file-icon" />
                  </div>
                  <div class="file-list-info">
                    <div class="file-list-name">
                      {{ formatFileName(item.name) }}
                    </div>
                    <div v-if="item.fullPath" class="file-list-path">
                      {{ item.fullPath }}
                    </div>
                    <div class="file-list-meta">
                      <span>{{ formatFileSize(item.fileSize) }}</span>
                      <span v-if="item.isFolder"> {{ item.filesList.length }} files </span>
                    </div>
                  </div>
                </div>
              </template>
            </VirtualScroller>
          </div>

          <!-- Upload Actions -->
          <div v-if="tableData.length" style="display: flex; justify-content: center; gap: 1rem; margin-top: 1rem">
            <button class="action-button primary" :disabled="isLoadingUploadPanelFiles" @click="uploadFiles">
              <UploadIcon class="action-icon" />
              {{ isLoadingUploadPanelFiles ? t('pages.manage.bucket.readingDir') : t('pages.manage.bucket.upload') }}
            </button>
            <button class="action-button secondary" :disabled="isLoadingUploadPanelFiles" @click="clearTableData">
              <Trash2Icon class="action-icon" />
              {{ t('pages.manage.bucket.clear') }}
            </button>
          </div>

          <!-- Upload Tasks Tabs -->
          <div class="tabs-container">
            <div class="tabs-header">
              <button
                class="tab-button"
                :class="{ active: activeUpLoadTab === 'uploading' }"
                @click="activeUpLoadTab = 'uploading'"
              >
                {{ t('pages.manage.bucket.uploading') }}
                <span v-if="uploadingTaskList.length" class="tab-badge">
                  {{ uploadingTaskList.length }}
                </span>
              </button>
              <button
                class="tab-button"
                :class="{ active: activeUpLoadTab === 'finished' }"
                @click="activeUpLoadTab = 'finished'"
              >
                {{ t('pages.manage.bucket.success') }}
                <span v-if="uploadedTaskList.filter(item => item.status === 'uploaded').length" class="tab-badge">
                  {{ uploadedTaskList.filter(item => item.status === 'uploaded').length }}
                </span>
              </button>
              <button
                class="tab-button"
                :class="{ active: activeUpLoadTab === 'failed' }"
                @click="activeUpLoadTab = 'failed'"
              >
                {{ t('pages.manage.bucket.failed') }}
                <span v-if="uploadedTaskList.filter(item => item.status !== 'uploaded').length" class="tab-badge">
                  {{ uploadedTaskList.filter(item => item.status !== 'uploaded').length }}
                </span>
              </button>
            </div>

            <div class="tab-content">
              <!-- Uploading Tab -->
              <div v-if="activeUpLoadTab === 'uploading'" class="tab-panel">
                <div style="display: flex; gap: 0.5rem; margin-bottom: 1rem">
                  <button class="action-button secondary" @click="handleCopyUploadingTaskInfo">
                    <CopyIcon class="action-icon" />
                    {{ t('pages.manage.bucket.copyUploadTask') }}
                  </button>
                  <button class="action-button secondary" @click="handleDeleteUploadedTask">
                    <Trash2Icon class="action-icon" />
                    {{ t('pages.manage.bucket.clearFinishedTasks') }}
                  </button>
                  <button class="action-button secondary" @click="handleDeleteAllUploadedTask">
                    <Trash2Icon class="action-icon" />
                    {{ t('pages.manage.bucket.clearAll') }}
                  </button>
                </div>
                <VirtualScroller :items="uploadingTaskList" :item-height="60" view-mode="list">
                  <template #default="{ item }">
                    <div class="file-list-item">
                      <div class="file-list-info">
                        <div class="file-list-name">
                          {{ formatFileName(item.sourceFileName) }}
                        </div>
                        <div class="progress-bar">
                          <div class="progress-fill" :style="{ width: `${item.progress || 50}%` }" />
                        </div>
                      </div>
                    </div>
                  </template>
                </VirtualScroller>
              </div>

              <!-- Finished Tab -->
              <div v-if="activeUpLoadTab === 'finished'" class="tab-panel">
                <div style="display: flex; gap: 0.5rem; margin-bottom: 1rem">
                  <button class="action-button secondary" @click="handleCopyUploadingTaskInfo">
                    <CopyIcon class="action-icon" />
                    {{ t('pages.manage.bucket.copyUploadTask') }}
                  </button>
                  <button class="action-button secondary" @click="handleDeleteUploadedTask">
                    <Trash2Icon class="action-icon" />
                    {{ t('pages.manage.bucket.clearFinishedTasks') }}
                  </button>
                  <button class="action-button secondary" @click="handleDeleteAllUploadedTask">
                    <Trash2Icon class="action-icon" />
                    {{ t('pages.manage.bucket.clearAll') }}
                  </button>
                </div>
                <VirtualScroller
                  :items="uploadedTaskList.filter(item => item.status === 'uploaded')"
                  :item-height="60"
                  view-mode="list"
                >
                  <template #default="{ item }">
                    <div class="file-list-item">
                      <div class="file-list-info">
                        <div class="file-list-name">
                          {{ formatFileName(item.sourceFileName) }}
                        </div>
                        <div class="file-list-meta">
                          <span>{{ item.finishTime }}</span>
                          <span class="badge success">
                            {{ t('pages.manage.bucket.success') }}
                          </span>
                        </div>
                      </div>
                    </div>
                  </template>
                </VirtualScroller>
              </div>

              <!-- Failed Tab -->
              <div v-if="activeUpLoadTab === 'failed'" class="tab-panel">
                <div style="display: flex; gap: 0.5rem; margin-bottom: 1rem">
                  <button class="action-button secondary" @click="handleCopyUploadingTaskInfo">
                    <CopyIcon class="action-icon" />
                    {{ t('pages.manage.bucket.copyUploadTask') }}
                  </button>
                  <button class="action-button secondary" @click="handleDeleteUploadedTask">
                    <Trash2Icon class="action-icon" />
                    {{ t('pages.manage.bucket.clearFinishedTasks') }}
                  </button>
                  <button class="action-button secondary" @click="handleDeleteAllUploadedTask">
                    <Trash2Icon class="action-icon" />
                    {{ t('pages.manage.bucket.clearAll') }}
                  </button>
                </div>
                <VirtualScroller
                  :items="uploadedTaskList.filter(item => item.status !== 'uploaded')"
                  :item-height="60"
                  view-mode="list"
                >
                  <template #default="{ item }">
                    <div class="file-list-item">
                      <div class="file-list-info">
                        <div class="file-list-name">
                          {{ formatFileName(item.sourceFileName) }}
                        </div>
                        <div class="file-list-meta">
                          <span>{{ item.finishTime }}</span>
                          <span class="badge error">
                            {{ t('pages.manage.bucket.failed') }}
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
    </div>

    <!-- Download Drawer -->
    <div
      v-if="isShowDownloadPanel"
      class="drawer-overlay"
      :class="{ open: isShowDownloadPanel }"
      @click="isShowDownloadPanel = false"
    >
      <div class="drawer-container" @click.stop>
        <div class="drawer-header">
          <h3 class="drawer-title">
            {{ t('pages.manage.bucket.downloadPage') }}
          </h3>
          <button class="modal-close" @click="isShowDownloadPanel = false">
            <XIcon class="action-icon" />
          </button>
        </div>

        <div class="drawer-content">
          <!-- Download Tasks Tabs -->
          <div class="tabs-container">
            <div class="tabs-header">
              <button
                class="tab-button"
                :class="{ active: activeDownLoadTab === 'downloading' }"
                @click="activeDownLoadTab = 'downloading'"
              >
                {{ t('pages.manage.bucket.downloading') }}
                <span v-if="downloadingTaskList.length" class="tab-badge">
                  {{ downloadingTaskList.length }}
                </span>
              </button>
              <button
                class="tab-button"
                :class="{ active: activeDownLoadTab === 'finished' }"
                @click="activeDownLoadTab = 'finished'"
              >
                {{ t('pages.manage.bucket.success') }}
                <span v-if="downloadedTaskList.filter(item => item.status === 'downloaded').length" class="tab-badge">
                  {{ downloadedTaskList.filter(item => item.status === 'downloaded').length }}
                </span>
              </button>
              <button
                class="tab-button"
                :class="{ active: activeDownLoadTab === 'failed' }"
                @click="activeDownLoadTab = 'failed'"
              >
                {{ t('pages.manage.bucket.failed') }}
                <span v-if="downloadedTaskList.filter(item => item.status !== 'downloaded').length" class="tab-badge">
                  {{ downloadedTaskList.filter(item => item.status !== 'downloaded').length }}
                </span>
              </button>
            </div>

            <!-- Download Tabs Content -->
            <div class="tab-content">
              <!-- Downloading Tab -->
              <div v-if="activeDownLoadTab === 'downloading'" class="tab-panel">
                <div style="display: flex; gap: 0.5rem; margin-bottom: 1rem">
                  <button class="action-button secondary" @click="handleCopyDownloadingTaskInfo">
                    <CopyIcon class="action-icon" />
                    {{ t('pages.manage.bucket.copyDownloadTask') }}
                  </button>
                  <button class="action-button secondary" @click="handleDeleteDownloadedTask">
                    <Trash2Icon class="action-icon" />
                    {{ t('pages.manage.bucket.clearFinishedTasks') }}
                  </button>
                  <button class="action-button secondary" @click="handleDeleteAllDownloadedTask">
                    <Trash2Icon class="action-icon" />
                    {{ t('pages.manage.bucket.clearAll') }}
                  </button>
                  <button class="action-button secondary" @click="handleOpenDownloadedFolder">
                    <FolderIcon class="action-icon" />
                    {{ t('pages.manage.bucket.openDownloadFolder') }}
                  </button>
                </div>
                <VirtualScroller :items="downloadingTaskList" :item-height="60" view-mode="list">
                  <template #default="{ item }">
                    <div class="file-list-item">
                      <div class="file-list-info">
                        <div class="file-list-name">
                          {{ formatFileName(item.sourceFileName) }}
                        </div>
                        <div class="progress-bar">
                          <div class="progress-fill" :style="{ width: `${item.progress}%` }" />
                        </div>
                      </div>
                    </div>
                  </template>
                </VirtualScroller>
              </div>

              <!-- Finished Tab -->
              <div v-if="activeDownLoadTab === 'finished'" class="tab-panel">
                <div style="display: flex; gap: 0.5rem; margin-bottom: 1rem">
                  <button class="action-button secondary" @click="handleCopyDownloadingTaskInfo">
                    <CopyIcon class="action-icon" />
                    {{ t('pages.manage.bucket.copyDownloadTask') }}
                  </button>
                  <button class="action-button secondary" @click="handleDeleteDownloadedTask">
                    <Trash2Icon class="action-icon" />
                    {{ t('pages.manage.bucket.clearFinishedTasks') }}
                  </button>
                  <button class="action-button secondary" @click="handleDeleteAllDownloadedTask">
                    <Trash2Icon class="action-icon" />
                    {{ t('pages.manage.bucket.clearAll') }}
                  </button>
                  <button class="action-button secondary" @click="handleOpenDownloadedFolder">
                    <FolderIcon class="action-icon" />
                    {{ t('pages.manage.bucket.openDownloadFolder') }}
                  </button>
                </div>
                <VirtualScroller
                  :items="downloadedTaskList.filter(item => item.status === 'downloaded')"
                  :item-height="60"
                  view-mode="list"
                >
                  <template #default="{ item }">
                    <div class="file-list-item">
                      <div class="file-list-info">
                        <div class="file-list-name">
                          {{ formatFileName(item.sourceFileName) }}
                        </div>
                        <div class="file-list-meta">
                          <span>{{ item.finishTime }}</span>
                          <span class="badge success">
                            {{ t('pages.manage.bucket.success') }}
                          </span>
                        </div>
                      </div>
                    </div>
                  </template>
                </VirtualScroller>
              </div>

              <!-- Failed Tab -->
              <div v-if="activeDownLoadTab === 'failed'" class="tab-panel">
                <div style="display: flex; gap: 0.5rem; margin-bottom: 1rem">
                  <button class="action-button secondary" @click="handleCopyDownloadingTaskInfo">
                    <CopyIcon class="action-icon" />
                    {{ t('pages.manage.bucket.copyDownloadTask') }}
                  </button>
                  <button class="action-button secondary" @click="handleDeleteDownloadedTask">
                    <Trash2Icon class="action-icon" />
                    {{ t('pages.manage.bucket.clearFinishedTasks') }}
                  </button>
                  <button class="action-button secondary" @click="handleDeleteAllDownloadedTask">
                    <Trash2Icon class="action-icon" />
                    {{ t('pages.manage.bucket.clearAll') }}
                  </button>
                  <button class="action-button secondary" @click="handleOpenDownloadedFolder">
                    <FolderIcon class="action-icon" />
                    {{ t('pages.manage.bucket.openDownloadFolder') }}
                  </button>
                </div>
                <VirtualScroller
                  :items="downloadedTaskList.filter(item => item.status !== 'downloaded')"
                  :item-height="60"
                  view-mode="list"
                >
                  <template #default="{ item }">
                    <div class="file-list-item">
                      <div class="file-list-info">
                        <div class="file-list-name">
                          {{ formatFileName(item.sourceFileName) }}
                        </div>
                        <div class="file-list-meta">
                          <span>{{ item.finishTime }}</span>
                          <span class="badge error">
                            {{ t('pages.manage.bucket.failed') }}
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
    </div>

    <!-- Markdown Preview Dialog -->
    <div v-if="isShowMarkDownDialog" class="modal-overlay" @click="isShowMarkDownDialog = false">
      <div class="modal-container" style="width: 90vw; height: 90vh" @click.stop>
        <div class="modal-header">
          <h3 class="modal-title">
            {{ t('pages.manage.bucket.preview') }}
          </h3>
          <button class="modal-close" @click="isShowMarkDownDialog = false">
            <XIcon class="action-icon" />
          </button>
        </div>
        <div class="modal-content" style="user-select: text" v-html="markDownContent" />
      </div>
    </div>

    <!-- Text File Preview Dialog -->
    <div v-if="isShowTextFileDialog" class="modal-overlay" @click="isShowTextFileDialog = false">
      <div class="modal-container" style="width: 90vw; height: 90vh" @click.stop>
        <div class="modal-header">
          <h3 class="modal-title">
            {{ t('pages.manage.bucket.preview') }}
          </h3>
          <button class="modal-close" @click="isShowTextFileDialog = false">
            <XIcon class="action-icon" />
          </button>
        </div>
        <div class="modal-content">
          <pre style="font-family: monospace; white-space: pre-wrap; user-select: text">{{ textfileContent }}</pre>
        </div>
      </div>
    </div>

    <!-- Video Player Dialog -->
    <div v-if="isShowVideoFileDialog" class="modal-overlay" @click="isShowVideoFileDialog = false">
      <div class="modal-container" style="width: 90vw; height: 90vh" @click.stop>
        <div class="modal-header">
          <h3 class="modal-title">
            {{ t('pages.manage.bucket.play') }}
          </h3>
          <button class="modal-close" @click="isShowVideoFileDialog = false">
            <XIcon class="action-icon" />
          </button>
        </div>
        <div class="modal-content">
          <video :src="videoFileUrl" controls loop autoplay style="width: 100%; height: auto; max-height: 70vh" />
        </div>
      </div>
    </div>

    <!-- Create Folder Dialog -->
    <div v-if="isShowCreateFolderDialog" class="modal-overlay" @click="isShowCreateFolderDialog = false">
      <div class="modal-container" style="width: 400px" @click.stop>
        <div class="modal-header">
          <h3 class="modal-title">
            {{ t('pages.manage.bucket.createFolder') }}
          </h3>
          <button class="modal-close" @click="isShowCreateFolderDialog = false">
            <XIcon class="action-icon" />
          </button>
        </div>
        <div class="modal-content">
          <div class="form-group">
            <label class="form-label">
              {{ t('pages.manage.bucket.inputFolderTitle') }}
            </label>
            <input
              ref="folderNameInput"
              v-model="newFolderName"
              type="text"
              class="form-input"
              :placeholder="t('pages.manage.bucket.inputFolderTitle')"
              @keyup.enter="confirmCreateFolder"
            />
          </div>
        </div>
        <div class="modal-footer">
          <button class="action-button secondary" @click="isShowCreateFolderDialog = false">
            {{ t('common.cancel') }}
          </button>
          <button class="action-button primary" :disabled="!newFolderName.trim()" @click="confirmCreateFolder">
            {{ t('common.confirm') }}
          </button>
        </div>
      </div>
    </div>
  </div>
</template>

<script lang="ts" setup>
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
  HardDriveIcon,
  HomeIcon,
  InfoIcon,
  LinkIcon,
  RefreshCwIcon,
  ShrinkIcon,
  Trash2Icon,
  UploadIcon,
  XIcon,
} from 'lucide-vue-next'
import { marked } from 'marked'
import { v4 as uuidv4 } from 'uuid'
import { computed, nextTick, onBeforeMount, onBeforeUnmount, reactive, ref, useTemplateRef, watch } from 'vue'
import { useI18n } from 'vue-i18n'
import { useRoute } from 'vue-router'

import ImageLocal from '@/components/ImageLocal.vue'
import ImagePreSign from '@/components/ImagePreSign.vue'
import ImageWebdav from '@/components/ImageWebdav.vue'
import VirtualScroller from '@/components/VirtualScroller.vue'
import useConfirm from '@/hooks/useConfirm'
import useMessage from '@/hooks/useMessage'
import { fileCacheDbInstance } from '@/manage/store/bucketFileDb'
import { useDownloadFileTransferStore, useFileTransferStore, useManageStore } from '@/manage/store/manageStore'
import {
  customStrMatch,
  customStrReplace,
  formatFileName,
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
import { IRPCActionType } from '@/utils/enum'
import { cancelDownloadLoadingFileList, refreshDownloadFileTransferList } from '@/utils/static'

const { t } = useI18n()
const message = useMessage()
const confirm = useConfirm()
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
const getExtension = (fileName: string) => window.node.path.extname(fileName).slice(1)
const linkFormatArray = [
  { key: 'Url', value: 'url' },
  { key: 'Markdown', value: 'markdown' },
  { key: 'Markdown-link', value: 'markdown-with-link' },
  { key: 'Html', value: 'html' },
  { key: 'BBCode', value: 'bbcode' },
  { key: 'Custom', value: 'custom' },
]
const linkFormatList = ['url', 'markdown', 'markdown-with-link', 'html', 'bbcode', 'custom']

type ISortTypeList = 'name' | 'size' | 'time' | 'ext' | 'check' | 'init'
const sortTypeList = ['name', 'size', 'time', 'ext', 'check', 'init']
const currentSortType = ref<ISortTypeList>('name')

// 路由相关
const route = useRoute()
// 页面状态变量相关
const manageStore = useManageStore()
const configMap = reactive(JSON.parse(route.query.configMap as string))
// 页面布局控制
const isLoadingData = ref(false)
const isShowLoadingPage = ref(false)
const isShowImagePreview = ref(false)
const layoutStyle = ref<'list' | 'grid'>('grid')
// Refs for scroll handling
const virtualScrollerRef = useTemplateRef('virtualScrollerRef')
const bucketContainerRef = useTemplateRef('bucketContainerRef')
// 全屏控制变量
const isContentFullscreen = ref(false)
// 新增的UI控制变量
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
const uploadingTaskList = computed(() =>
  uploadTaskList.value.filter(item => ['uploading', 'queuing', 'paused'].includes(item.status)),
)
const uploadedTaskList = computed(() =>
  uploadTaskList.value.filter(item => ['uploaded', 'failed', 'canceled'].includes(item.status)),
)
// 下载页面相关
const isShowDownloadPanel = ref(false)
const isLoadingDownloadData = ref(false)
const activeDownLoadTab = ref('downloading')
const currentDownloadFileList = reactive([] as any[])
const downloadTaskList = ref([] as IDownloadTask[])

const refreshDownloadTaskId = ref<NodeJS.Timeout | undefined>(undefined)
const downloadCancelToken = ref('')
const downloadingTaskList = computed(() =>
  downloadTaskList.value.filter(item => ['downloading', 'queuing', 'paused'].includes(item.status)),
)
const downloadedTaskList = computed(() =>
  downloadTaskList.value.filter(item => ['downloaded', 'failed', 'canceled'].includes(item.status)),
)
// 上传文件相关
const dialogVisible = ref(false)
const urlToUpload = ref('')
// 图片预览相关
const previewedImage = ref('')
const filterList = computed(() => {
  return getList()
})
const selectedItems = computed(() => filterList.value.filter(item => item.checked))

const ImagePreviewList = computed(() => filterList.value.filter(item => item.isImage).map(item => item.url))

const getCurrentPreviewIndex = computed(() => ImagePreviewList.value.indexOf(previewedImage.value))
// 快捷键相关
const isShiftKeyPress = ref<boolean>(false)
const lastChoosed = ref<number>(-1)
// 自定义域名相关
const customDomainList = ref([] as any[])
const currentCustomDomain = ref('')
const isShowCustomDomainSelectList = computed(() =>
  ['tcyun', 'aliyun', 'qiniu', 'github'].includes(currentPicBedName.value),
)
const isShowCustomDomainInput = computed(() =>
  ['aliyun', 'qiniu', 'tcyun', 's3plist', 'webdavplist', 'local', 'sftp'].includes(currentPicBedName.value),
)
const isAutoCustomDomain = computed(() =>
  manageStore.config.picBed[configMap.alias].isAutoCustomUrl === undefined
    ? true
    : manageStore.config.picBed[configMap.alias].isAutoCustomUrl,
)
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
const folderNameInput = useTemplateRef('folderNameInput')
// 重命名相关
const isShowRenameFileIcon = computed(() =>
  ['tcyun', 'aliyun', 'qiniu', 'upyun', 's3plist', 'webdavplist', 'local', 'sftp'].includes(currentPicBedName.value),
)
const isShowBatchRenameDialog = ref(false)
const batchRenameMatch = ref('')
const batchRenameReplace = ref('')
const isRenameIncludeExt = ref(false)
const isSingleRename = ref(false)
const itemToBeRenamed = ref({} as any)

let fileTransferInterval: NodeJS.Timeout | undefined

let downloadInterval: NodeJS.Timeout | undefined

// 当前页面信息相关
const currentPicBedName = computed<string>(() => manageStore.config.picBed[configMap.alias].picBedName)
const paging = computed(() => manageStore.config.picBed[configMap.alias].paging)
const itemsPerPage = computed(() => manageStore.config.picBed[configMap.alias].itemsPerPage)
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

// 上传相关函数

function handleUploadKeepDirChange() {
  saveConfig('settings.isUploadKeepDirStructure', isUploadKeepDirStructure.value)
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
  return manageStore.config.picBed[configMap.alias]
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

/* 暂时禁用
function handleViewChange (val: 'list' | 'grid') {
  saveConfig('settings.isShowList', val === 'list')
  layoutStyle.value = val
}
*/

function toggleContentFullscreen() {
  isContentFullscreen.value = !isContentFullscreen.value
}

let scrollTimeout: ReturnType<typeof setTimeout> | undefined
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
      alias: configMap.alias,
      bucketName: configMap.bucketName,
      region: configMap.bucketConfig.Location,
      key: item.key,
      filePath: item.path,
      fileSize: item.size,
      fileName: item.rawName,
      githubBranch: currentCustomDomain.value,
      aclForUpload: manageStore.config.picBed[configMap.alias].aclForUpload,
    })
  })
  window.electron.sendRPC(IRPCActionType.MANAGE_UPLOAD_BUCKET_FILE, configMap.alias, param)
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
  configMap.prefix = targetPrefix
  isShowLoadingPage.value = true
  resetParam(false)
  isShowLoadingPage.value = false
}

async function handleClickFile(item: any) {
  const options = {} as any
  if (currentPicBedName.value === 'webdavplist') {
    options.headers = {
      Authorization: `Basic ${window.node.buffer.from(`${manageStore.config.picBed[configMap.alias].username}:${manageStore.config.picBed[configMap.alias].password}`).toString('base64')}`,
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
    configMap.prefix = `/${item.key}`
    isShowLoadingPage.value = true
    await resetParam(false)
    isShowLoadingPage.value = false
  } else if (item.fileName.endsWith('.md')) {
    try {
      message.success(t('pages.manage.bucket.startLoadingFile'))
      const fileUrl = item.url
      const res = await fetch(fileUrl, options)
      const content = await res.text()
      markDownContent.value = await marked.parse(content)
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
    const currentConfig = currentConfigs[configMap.alias]
    const currentTransformedConfig = JSON.parse(currentConfig.transformedConfig ?? '{}')
    if (currentTransformedConfig[configMap.bucketName]) {
      currentTransformedConfig[configMap.bucketName].customUrl = currentCustomDomain.value
    } else {
      currentTransformedConfig[configMap.bucketName] = {
        customUrl: currentCustomDomain.value,
      }
    }
    currentConfig.transformedConfig = JSON.stringify(currentTransformedConfig)
    saveConfig(`picBed.${configMap.alias}`, currentConfig)
    await manageStore.refreshConfig()
  }
}

// when the current picBed is github, the customDomainList is used to store the github repo branches
async function initCustomDomainList() {
  if (
    (['aliyun', 'tcyun', 'qiniu'].includes(currentPicBedName.value) &&
      (manageStore.config.picBed[configMap.alias].isAutoCustomUrl === undefined ||
        manageStore.config.picBed[configMap.alias].isAutoCustomUrl === true)) ||
    ['github', 'smms', 'upyun', 'imgur'].includes(currentPicBedName.value)
  ) {
    const param = {
      bucketName: configMap.bucketName,
      region: configMap.bucketConfig.Location,
    }
    let defaultUrl = ''
    if (currentPicBedName.value === 'tcyun') {
      defaultUrl = `https://${configMap.bucketName}.cos.${configMap.bucketConfig.Location}.myqcloud.com`
    } else if (currentPicBedName.value === 'aliyun') {
      defaultUrl = `https://${configMap.bucketName}.${configMap.bucketConfig.Location}.aliyuncs.com`
    } else if (currentPicBedName.value === 'github') {
      defaultUrl = 'main'
    }
    const res = await window.electron.triggerRPC<any>(IRPCActionType.MANAGE_GET_BUCKET_DOMAIN, configMap.alias, param)
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
    const currentConfig = currentConfigs[configMap.alias]
    const currentTransformedConfig = JSON.parse(currentConfig.transformedConfig ?? '{}')
    if (currentTransformedConfig[configMap.bucketName]) {
      currentCustomDomain.value = currentTransformedConfig[configMap.bucketName].customUrl ?? ''
    } else {
      currentCustomDomain.value = ''
    }
  } else if (currentPicBedName.value === 's3plist') {
    const currentConfigs = await getConfig<any>('picBed')
    const currentConfig = currentConfigs[configMap.alias]
    const currentTransformedConfig = JSON.parse(currentConfig.transformedConfig ?? '{}')
    if (currentTransformedConfig[configMap.bucketName]) {
      currentCustomDomain.value = currentTransformedConfig[configMap.bucketName].customUrl ?? ''
    } else {
      if (manageStore.config.picBed[configMap.alias].endpoint) {
        const endpoint = manageStore.config.picBed[configMap.alias].endpoint
        const s3ForcePathStyle = manageStore.config.picBed[configMap.alias].s3ForcePathStyle
        let url
        if (/^https?:\/\//.test(endpoint)) {
          url = new URL(endpoint)
        } else {
          url = new URL(
            manageStore.config.picBed[configMap.alias].sslEnabled ? `https://${endpoint}` : `http://${endpoint}`,
          )
        }
        if (s3ForcePathStyle) {
          currentCustomDomain.value = `${url.protocol}//${url.hostname}${url.port ? ':' + url.port : ''}/${configMap.bucketName}`
        } else {
          currentCustomDomain.value = `${url.protocol}//${configMap.bucketName}.${url.hostname}${url.port ? ':' + url.port : ''}`
        }
      } else {
        currentCustomDomain.value = `https://${configMap.bucketName}.s3.amazonaws.com`
      }
    }
    await handleChangeCustomUrl()
  } else if (currentPicBedName.value === 'webdavplist') {
    const currentConfigs = await getConfig<any>('picBed')
    const currentConfig = currentConfigs[configMap.alias]
    const currentTransformedConfig = JSON.parse(currentConfig.transformedConfig ?? '{}')
    if (currentTransformedConfig[configMap.bucketName] && currentTransformedConfig[configMap.bucketName]?.customUrl) {
      currentCustomDomain.value = currentTransformedConfig[configMap.bucketName].customUrl
    } else {
      let endpoint = manageStore.config.picBed[configMap.alias].endpoint
      if (!/^https?:\/\//.test(endpoint)) {
        endpoint = 'http://' + endpoint
      }
      currentCustomDomain.value = endpoint
    }
    await handleChangeCustomUrl()
  } else if (currentPicBedName.value === 'local' || currentPicBedName.value === 'sftp') {
    const currentConfigs = await getConfig<any>('picBed')
    const currentConfig = currentConfigs[configMap.alias]
    const currentTransformedConfig = JSON.parse(currentConfig.transformedConfig ?? '{}')
    if (currentTransformedConfig[configMap.bucketName] && currentTransformedConfig[configMap.bucketName]?.customUrl) {
      currentCustomDomain.value = currentTransformedConfig[configMap.bucketName].customUrl ?? ''
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
  currentPrefix.value = configMap.prefix
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
  layoutStyle.value = 'grid'
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

watch(route, async newRoute => {
  const queryConfigMap = newRoute.query.configMap as string
  if (queryConfigMap) {
    isShowLoadingPage.value = true
    const parsedConfigMap = JSON.parse(queryConfigMap)
    Object.assign(configMap, parsedConfigMap)
    await initCustomDomainList()
    await resetParam(true)
    isShowLoadingPage.value = false
  }
})

async function forceRefreshFileList() {
  if (isLoadingData.value) {
    message.error(t('pages.manage.bucket.isLoadingMsg'))
    return
  }
  isShowLoadingPage.value = true
  await resetParam(true)
  isShowLoadingPage.value = false
}

watch(currentPageNumber, (newVal, oldVal) => {
  if (typeof newVal !== 'number') {
    currentPageNumber.value = 1
  }
  // Update previousPageNumber when currentPageNumber changes programmatically
  if (oldVal && typeof oldVal === 'number') {
    previousPageNumber.value = oldVal
  }
})

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

const previousPageNumber = ref(1)

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

function handleCheckChangeOther(item: any) {
  item.checked = !item.checked
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
      bucketName: configMap.bucketName,
      bucketConfig: {
        Location: configMap.bucketConfig.Location,
      },
      paging: paging.value,
      prefix: `/${item.key.replace(/^\/+|\/+$/, '')}/`,
      marker: pagingMarker.value,
      itemsPerPage: itemsPerPage.value,
      customUrl: currentCustomDomain.value,
      currentPage: currentPageNumber.value,
      cancelToken: cancelToken.value,
      cdnUrl: configMap.cdnUrl,
    }
    isLoadingDownloadData.value = true
    const downloadFileTransferStore = useDownloadFileTransferStore()
    downloadFileTransferStore.resetDownloadFileTransferList()
    window.electron.sendRPC(IRPCActionType.MANAGE_GET_BUCKET_LIST_RECURSIVELY, configMap.alias, paramGet)
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
                alias: configMap.alias,
                bucketName: configMap.bucketName,
                region: configMap.bucketConfig.Location,
                key: item.key,
                fileName: [undefined, true].includes(manageStore.config.settings.isDownloadFolderKeepDirStructure)
                  ? `/${item.key.replace(/^\/+|\/+$/, '')}`
                  : item.fileName,
                customUrl: currentCustomDomain.value,
                downloadUrl: item.downloadUrl,
                githubUrl: item.url,
                githubPrivate: configMap.bucketConfig.private,
              })
            })
          }
          window.electron.sendRPC(IRPCActionType.MANAGE_DOWNLOAD_BUCKET_FILE, configMap.alias, param)
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
        alias: configMap.alias,
        bucketName: configMap.bucketName,
        region: configMap.bucketConfig.Location,
        key: item.key,
        fileName: manageStore.config.settings.isDownloadFileKeepDirStructure
          ? `/${item.key.replace(/^\/+|\/+$/, '')}`
          : item.fileName,
        customUrl: currentCustomDomain.value,
        downloadUrl: item.downloadUrl,
        githubUrl: item.url,
        githubPrivate: configMap.bucketConfig.private,
      })
    }
  })
  window.electron.sendRPC(IRPCActionType.MANAGE_DOWNLOAD_BUCKET_FILE, configMap.alias, param)
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
  await nextTick()
  if (folderNameInput.value) {
    folderNameInput.value.focus()
  }
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
      bucketName: configMap.bucketName,
      region: configMap.bucketConfig.Location,
      key: currentPrefix.value.slice(1) + formatedPath + '/',
      githubBranch: currentCustomDomain.value,
    }
    const res = await window.electron.triggerRPC<any>(
      IRPCActionType.MANAGE_CREATE_BUCKET_FOLDER,
      configMap.alias,
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
    return 0
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
  return matchedFiles.length
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
        bucketName: configMap.bucketName,
        region: configMap.bucketConfig.Location,
        oldKey: item.key,
        newKey: (item.key.slice(0, item.key.lastIndexOf('/') + 1) + item.newName).replaceAll('//', '/'),
        customUrl: currentCustomDomain.value,
      }
      window.electron
        .triggerRPC<any>(IRPCActionType.MANAGE_RENAME_BUCKET_FILE, configMap.alias, param)
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
    bucketName: configMap.bucketName,
    bucketConfig: {
      Location: configMap.bucketConfig.Location,
    },
    paging: paging.value,
    prefix: currentPrefix.value,
    marker: pagingMarker.value,
    itemsPerPage: itemsPerPage.value,
    customUrl: currentCustomDomain.value,
    currentPage: currentPageNumber.value,
    cancelToken: cancelToken.value,
    cdnUrl: configMap.cdnUrl,
  } as IStringKeyMap
  isLoadingData.value = true
  const fileTransferStore = useFileTransferStore()
  fileTransferStore.resetFileTransferList()
  const picBedNamesArr = ['webdavplist', 'local', 'sftp']
  if (picBedNamesArr.includes(currentPicBedName.value)) {
    param.baseDir = configMap.baseDir
    param.webPath = configMap.webPath
  }
  window.electron.sendRPC(IRPCActionType.MANAGE_GET_BUCKET_LIST_BACKSTAGE, configMap.alias, param)
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
    bucketName: configMap.bucketName,
    bucketConfig: {
      Location: configMap.bucketConfig.Location,
    },
    paging: paging.value,
    prefix: currentPrefix.value,
    marker: pagingMarker.value,
    itemsPerPage: itemsPerPage.value,
    customUrl: currentCustomDomain.value,
    currentPage: currentPageNumber.value,
  }
  return await window.electron.triggerRPC<any>(IRPCActionType.MANAGE_GET_BUCKET_FILE_LIST, configMap.alias, param)
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
        bucketName: configMap.bucketName,
        region: configMap.bucketConfig.Location,
        key: item.key,
        DeleteHash: item.sha,
        githubBranch: currentCustomDomain.value,
      }
      const result = item.isDir
        ? await window.electron.triggerRPC<any>(IRPCActionType.MANAGE_DELETE_BUCKET_FOLDER, configMap.alias, param)
        : await window.electron.triggerRPC<any>(IRPCActionType.MANAGE_DELETE_BUCKET_FILE, configMap.alias, param)
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
      bucketName: configMap.bucketName,
      region: configMap.bucketConfig.Location,
      key: item.key,
      DeleteHash: item.sha,
      githubBranch: currentCustomDomain.value,
    }
    if (item.isDir) {
      message.info(t('pages.manage.bucket.deletingMsg'))
      res = await window.electron.triggerRPC<any>(IRPCActionType.MANAGE_DELETE_BUCKET_FOLDER, configMap.alias, param)
    } else {
      res = await window.electron.triggerRPC<any>(IRPCActionType.MANAGE_DELETE_BUCKET_FILE, configMap.alias, param)
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
    bucketName: configMap.bucketName,
    region: configMap.bucketConfig.Location,
    oldKey: item.key,
    newKey: (item.key.slice(0, item.key.lastIndexOf('/') + 1) + itemToBeRenamed.value.newName).replaceAll('//', '/'),
    customUrl: currentCustomDomain.value,
  }
  window.electron.triggerRPC<any>(IRPCActionType.MANAGE_RENAME_BUCKET_FILE, configMap.alias, param).then((res: any) => {
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
    bucketName: configMap.bucketName,
    region: configMap.bucketConfig.Location,
    key: item.key,
    customUrl: currentCustomDomain.value,
    expires: manageStore.config.settings.PreSignedExpire,
    githubPrivate: configMap.bucketConfig.private,
    rawUrl: item.url,
  }
}

async function getPreSignedUrl(item: any) {
  const param = {
    // tcyun
    bucketName: configMap.bucketName,
    region: configMap.bucketConfig.Location,
    key: item.key,
    customUrl: currentCustomDomain.value,
    expires: manageStore.config.settings.PreSignedExpire,
    githubPrivate: configMap.bucketConfig.private,
    rawUrl: item.url,
  }
  return await window.electron.triggerRPC<any>(IRPCActionType.MANAGE_GET_PRE_SIGNED_URL, configMap.alias, param)
}

function copyToClipboard(text: string) {
  window.electron.clipboard.writeText(text)
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
      console.log('containerRect', containerRect)
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
    zIndex: 4000,
    minWidth: '140px',
    maxWidth: '200px',
  }
}

function handleClickOutside(event: MouseEvent) {
  const target = event.target as HTMLElement
  if (!target.closest('.file-actions-dropdown') && !target.closest('[data-floating-dropdown]')) {
    copyDropdownIndex.value = -1
  }
  if (!target.closest('.dropdown')) {
    copyDropdownOpen.value = false
    sortDropdownOpen.value = false
  }
}

function getTableKeyOfDb() {
  let tableKey
  if (currentPicBedName.value === 'github') {
    // customUrl is branch
    tableKey = `${configMap.alias}@${configMap.bucketConfig.githubUsername}@${configMap.bucketName}@${currentCustomDomain.value}@${currentPrefix.value}`
  } else {
    tableKey = `${configMap.alias}@${configMap.bucketName}@${currentPrefix.value}`
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
  await manageStore.refreshConfig()
  isShowLoadingPage.value = true
  await initCustomDomainList()
  await resetParam(true)
  isShowLoadingPage.value = false
  document.addEventListener('keydown', handleDetectShiftKey)
  document.addEventListener('keyup', handleDetectShiftKey)
  document.addEventListener('click', handleClickOutside)
})

onBeforeUnmount(() => {
  document.removeEventListener('keydown', handleDetectShiftKey)
  document.removeEventListener('keyup', handleDetectShiftKey)
  document.removeEventListener('click', handleClickOutside)
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
