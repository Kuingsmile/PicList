ea/*
 *UI布局和部分样式代码参考了https://github.com/willnewii/qiniuClient
 *感谢作者@willnewii
 */
<template>
  <div
    v-loading="showLoadingPage"
    :element-loading-text="$T('MANAGE_BUCKET_PAGE_LOADING_TEXT')"
    :element-loading-spinner="svg"
    element-loading-svg-view-box="0, 0, 50, 50"
    element-loading-background="rgba(122, 122, 122, 0.5)"
  >
    <div class="layout-header">
      <div
        style="flex-grow: 1;margin-left: 16px"
      >
        <el-select
          v-if="showCustomUrlSelectList && customUrlList.length > 1 && isAutoCustomUrl"
          v-model="currentCustomUrl"
          :placeholder="$T('MANAGE_BUCKET_PAGE_CUSTOM_URL_SELECT_PLACEHOLDER')"
          style="width: 200px;"
          @change="handleChangeCustomUrl"
        >
          <el-option
            v-for="item in customUrlList"
            :key="item"
            :label="item.label"
            :value="item.value"
          />
        </el-select>
        <el-input
          v-else-if="showCustomUrlInput"
          v-model="currentCustomUrl"
          :placeholder="$T('MANAGE_BUCKET_PAGE_CUSTOM_URL_INPUT_PLACEHOLDER')"
          style="width: 200px;"
          @blur="handleChangeCustomUrl"
        />
        <el-link
          v-else
          :underline="false"
          type="primary"
          @click="copyToClipboard(currentCustomUrl)"
        >
          {{ currentCustomUrl }}
        </el-link>
      </div>
      <div
        style="display: flex;"
        @click="showUploadDialog"
      >
        <el-button type="text">
          <el-tooltip
            class="item"
            effect="dark"
            :content="$T('MANAGE_BUCKET_PAGE_UPLOAD_FILES_TOOLTIP')"
            placement="bottom"
          >
            <el-icon
              class="icon"
              size="25px"
            >
              <DocumentAdd />
            </el-icon>
          </el-tooltip>
        </el-button>
      </div>
      <div>
        <el-button
          type="text"
          @click="showUrlDialog"
        >
          <el-tooltip
            class="item"
            effect="dark"
            :content="$T('MANAGE_BUCKET_PAGE_UPLOAD_FROM_URL_TOOLTIP')"
            placement="bottom"
          >
            <el-icon
              class="icon"
              size="25px"
              style="margin-left: 5px;"
            >
              <Upload />
            </el-icon>
          </el-tooltip>
        </el-button>
      </div>
      <div
        v-if="showCreateNewFolder"
      >
        <el-button
          type="text"
          @click="handleCreateFolder"
        >
          <el-tooltip
            class="item"
            effect="dark"
            :content="$T('MANAGE_BUCKET_PAGE_CREATE_FOLDER_TOOLTIP')"
            placement="bottom"
          >
            <el-icon
              class="icon"
              size="25px"
              style="margin-left: 5px;"
            >
              <FolderAdd />
            </el-icon>
          </el-tooltip>
        </el-button>
      </div>
      <div
        @click="showDownloadDialog"
      >
        <el-button type="text">
          <el-tooltip
            class="item"
            effect="dark"
            :content="$T('MANAGE_BUCKET_PAGE_DOWNLOAD_TOOLTIP')"
            placement="bottom"
          >
            <el-icon
              class="icon"
              size="25px"
              style="margin-left: 5px;"
            >
              <Download />
            </el-icon>
          </el-tooltip>
        </el-button>
      </div>
      <div
        @click="handleBatchRenameFile"
      >
        <el-button type="text">
          <el-tooltip
            class="item"
            effect="dark"
            :content="$T('MANAGE_BUCKET_PAGE_BATCH_RENAME_TOOLTIP')"
            placement="bottom"
          >
            <el-icon
              class="icon"
              size="25px"
              style="margin-left: 5px;"
            >
              <Edit />
            </el-icon>
          </el-tooltip>
        </el-button>
      </div>
      <div>
        <el-button type="text">
          <el-tooltip
            class="item"
            effect="dark"
            :content="$T('MANAGE_BUCKET_PAGE_BATCH_COPY_URL_TOOLTIP')"
            placement="right"
          >
            <el-dropdown>
              <el-icon
                class="icon"
                size="25px"
                :color="selectedItems.length > 0 ? 'red' : 'gray'"
                style="margin-left: 10px;"
                @click="handleBatchCopyLink(manageStore.config.settings.customPasteFormat)"
              >
                <Link />
              </el-icon>
              <template #dropdown>
                <template v-if="showPresignedUrl">
                  <el-dropdown-item
                    v-for="i in [...linkArray, { key: 'preSignURL', value: 'preSignedUrl' }]"
                    :key="i.key"
                    @click="handleBatchCopyLink(i.value)"
                  >
                    {{ i.key }}
                  </el-dropdown-item>
                </template>
                <el-dropdown-item
                  v-for="i in linkArray"
                  v-else
                  :key="i.value+i.key"
                  @click="handleBatchCopyLink(i.value)"
                >
                  {{ i.key }}
                </el-dropdown-item>
              </template>
            </el-dropdown>
          </el-tooltip>
        </el-button>
      </div>
      <div>
        <el-button type="text">
          <el-tooltip
            class="item"
            effect="dark"
            :content="$T('MANAGE_BUCKET_PAGE_COPY_FILE_INFO_TOOLTIP')"
            placement="bottom"
          >
            <el-icon
              class="icon"
              size="25px"
              :color="selectedItems.length > 0 ? 'red' : 'gray'"
              style="margin-left: 10px;"
              @click="handleBatchCopyInfo"
            >
              <Document />
            </el-icon>
          </el-tooltip>
        </el-button>
      </div>
      <div>
        <el-button
          type="text"
          @click="forceRefreshFileList"
        >
          <el-tooltip
            class="item"
            effect="dark"
            :content="$T('MANAGE_BUCKET_PAGE_FORCE_REFRESH_TOOLTIP')"
            placement="bottom"
          >
            <el-icon
              id="refresh"
              class="icon"
              size="25px"
              style="margin-left: 10px;color: red;"
            >
              <Refresh />
            </el-icon>
          </el-tooltip>
        </el-button>
      </div>
      <el-input
        v-model="searchText"
        :placeholder="$T('MANAGE_BUCKET_PAGE_SEARCH_PLACEHOLDER')"
        style="margin-left: 10px;width: 200px;"
        clearable
        size="small"
        @clear="searchText = ''"
      />
    </div>
    <div class="header-dir-view">
      <el-breadcrumb
        :separator-icon="ArrowRight"
        style="margin-top: 2px;"
      >
        <el-breadcrumb-item style="flex-shrink: 0;">
          <el-icon
            :size="16"
            style="margin-right: 5px;"
          >
            <HomeFilled />
          </el-icon>
        </el-breadcrumb-item>
        <template v-if="configMap.prefix !== '/'">
          <el-breadcrumb-item
            v-for="(item, index) in configMap.prefix.replace(/\/$/g, '').split('/')"
            :key="index"
            style="flex-shrink: 0;font-size: 12px;color: #606266;font-family: Arial, Helvetica, sans-serif;cursor: pointer;"
            @click="handleBreadcrumbClick(index)"
          >
            <el-link>
              {{ item === '' ? $T('MANAGE_BUCKET_PAGE_ROOT_FOLDER') : item }}
            </el-link>
          </el-breadcrumb-item>
        </template>
        <el-breadcrumb-item
          v-else
          style="flex-shrink: 0;font-size: 12px;color: #606266;font-family: Arial, Helvetica, sans-serif;cursor: pointer;"
        >
          <el-link>
            {{ $T('MANAGE_BUCKET_PAGE_ROOT_FOLDER') }}
          </el-link>
        </el-breadcrumb-item>
      </el-breadcrumb>
    </div>
    <div class="dir-layout">
      <div style="flex-grow: 1;flex-shrink: 1;overflow-x: auto;margin-right: 10px;">
        <div class="header-info-view">
          <span>
            <el-icon
              :size="14"
              style="margin-right: 5px;"
            >
              <Document />
            </el-icon>
            <span style="margin-right: 5px;padding-left: 5px;">{{ `${$T('MANAGE_BUCKET_PAGE_FILE_NUMBER')}${currentPageFilesInfo.length}` }} </span>
          </span>
          <span>
            <el-icon
              :size="14"
              style="margin-right: 5px;"
            >
              <Coin />
            </el-icon>
            <span style="padding-left: 5px;">{{ `${$T('MANAGE_BUCKET_PAGE_FILE_SIZE')}${calculateAllFileSize}` }}</span>
          </span>
        </div>
      </div>
      <div
        v-show="selectedItems.length === 0"
        class="header-buttom-view"
      >
        <el-button
          class="btn"
          size="small"
          type="primary"
          plain
          style="margin-right: 2px;"
          @click="handleCheckAllChange"
        >
          {{ $T('MANAGE_BUCKET_PAGE_SELECT_ALL') }}
        </el-button>
      </div>
      <div
        v-show="selectedItems.length > 0"
        class="header-buttom-view"
      >
        <el-button
          class="btn"
          size="small"
          type="warning"
          plain
          style="margin-right: 2px;"
          @click="handleCancelCheck"
        >
          {{ $T('MANAGE_BUCKET_PAGE_SELECT_NONE') }}
        </el-button>
        <el-button
          class="btn"
          size="small"
          type="primary"
          plain
          style="margin-right: 2px;"
          @click="handleReverseCheck"
        >
          {{ $T('MANAGE_BUCKET_PAGE_SELECT_INVERT') }}
        </el-button>
        <el-button
          class="btn"
          size="small"
          type="primary"
          plain
          style="margin-right: 2px;"
          @click="handleCheckAllChange"
        >
          {{ $T('MANAGE_BUCKET_PAGE_SELECT_ALL') }}
        </el-button>
        <el-button
          class="btn"
          size="small"
          type="success"
          plain
          :icon="Download"
          style="margin-right: 2px;"
          @click="handleBatchDownload"
        >
          {{ `${$T('MANAGE_BUCKET_DOWNLOAD_BTN')}(${selectedItems.filter(item => item.isDir === false).length})` }}
        </el-button>
        <el-button
          class="btn"
          size="small"
          type="danger"
          :icon="DeleteFilled"
          @click="handleBatchDeleteInfo"
        >
          {{ `${$T('MANAGE_BUCKET_DELETE_BTN')}${selectedItems.length}` }}
        </el-button>
      </div>
      <el-dropdown>
        <el-button
          size="small"
          type="primary"
          plain
          :icon="Sort"
        >
          {{ $T('MANAGE_BUCKET_SORT_TITLE') }}
        </el-button>
        <template #dropdown>
          <el-dropdown-item @click="sortFile('name')">
            {{ $T('MANAGE_BUCKET_SORT_NAME') }}
          </el-dropdown-item>
          <el-dropdown-item @click="sortFile('size')">
            {{ $T('MANAGE_BUCKET_SORT_SIZE') }}
          </el-dropdown-item>
          <el-dropdown-item @click="sortFile('ext')">
            {{ $T('MANAGE_BUCKET_SORT_TYPE') }}
          </el-dropdown-item>
          <el-dropdown-item @click="sortFile('time')">
            {{ $T('MANAGE_BUCKET_SORT_TIME') }}
          </el-dropdown-item>
          <el-dropdown-item @click="sortFile('check')">
            {{ $T('MANAGE_BUCKET_SORT_SELECTED') }}
          </el-dropdown-item>
        </template>
      </el-dropdown>
      <el-button-group
        size="small"
        style="margin-left: 10px;width: 80px;flex-shrink: 0;"
        type="primary"
      >
        <el-button
          :icon="Grid"
          :type="showFileStyle === 'grid' ? 'primary' : 'info'"
          @click="handleViewChange('grid')"
        />
        <el-button
          :icon="Fold"
          :type="showFileStyle === 'list' ? 'primary' : 'info'"
          @click="handleViewChange('list')"
        />
      </el-button-group>
      <el-input-number
        v-if="paging"
        v-model="currentPage"
        :min="1"
        size="small"
        :disabled="!paging"
        style="margin-left: 10px;flex-shrink: 0;"
        @change="changePage"
      />
    </div>
    <el-dialog
      v-model="dialogVisible"
      :title="$T('MANAGE_BUCKET_URL_UPLOAD_DIALOG_TITLE')"
      width="50%"
      draggable
      center
      align-center
    >
      <el-input
        v-model="urlToUpload"
        placeholder="https://www.baidu.com/img/bd_logo1.png
https://www.baidu.com/img/bd_logo1.png"
        style="margin-bottom: 10px;"
        type="textarea"
        :autosize="{ minRows: 3, maxRows: 5 }"
      />
      <template #footer>
        <el-button @click="dialogVisible = false">
          {{ $T('MANAGE_BUCKET_URL_UPLOAD_DIALOG_CANCEL') }}
        </el-button>
        <el-button
          type="primary"
          style="font-size: 12px;font-weight: 500;"
          @click="handleUploadFromUrl"
        >
          {{ $T('MANAGE_BUCKET_URL_UPLOAD_DIALOG_CONFIRM') }}
        </el-button>
      </template>
    </el-dialog>
    <div
      v-show="showFileStyle === 'list'"
      class="layout-table"
      style="margin: 0 15px 15px 15px;overflow-y: auto;overflow-x: hidden;height: 80vh;"
    >
      <el-auto-resizer>
        <template
          #default="{ height, width }"
        >
          <el-table-v2
            ref="elTable"
            :columns="columns "
            :data="currentPageFilesInfo"
            :row-class="rowClass"
            :width="width"
            :height="height"
          />
        </template>
      </el-auto-resizer>
    </div>
    <div
      v-show="showFileStyle === 'grid'"
      class="layout-grid"
      style="margin: 0 15px 15px 15px;overflow-y: auto;overflow-x: hidden;height: 80vh;"
    >
      <el-col
        :span="24"
      >
        <el-row
          :gutter="16"
        >
          <el-col
            v-for="(item,index) in currentPageFilesInfo"
            :key="index"
            :xs="24"
            :sm="12"
            :md="8"
            :lg="3"
            :xl="2"
          >
            <el-card
              v-if="item.match || !searchText"
              :body-style="{ padding: '0px', height: '150px', width: '100%', background: item.checked ? '#f2f2f2' : '#fff' }"
              style="margin-bottom: 10px;"
              shadow="hover"
            >
              <el-image
                v-if="!item.isDir && currentPicBedName !== 'webdavplist'"
                :src="isShowThumbnail && item.isImage ?
                  item.url
                  : require(`./assets/icons/${getFileIconPath(item.fileName ?? '')}`)"
                fit="contain"
                style="height: 100px;width: 100%;margin: 0 auto;"
                @click="handleClickFile(item)"
              >
                <template #placeholder>
                  <el-icon>
                    <Loading />
                  </el-icon>
                </template>
                <template #error>
                  <el-image
                    :src="require(`./assets/icons/${getFileIconPath(item.fileName ?? '')}`)"
                    fit="contain"
                    style="height: 100px;width: 100%;margin: 0 auto;"
                  />
                </template>
              </el-image>
              <ImageWebdav
                v-else-if="!item.isDir && currentPicBedName === 'webdavplist'"
                :is-show-thumbnail="isShowThumbnail"
                :item="item"
                :headers="getBase64ofWebdav()"
                :url="item.url"
                @click="handleClickFile(item)"
              />
              <el-image
                v-else
                :src="require('./assets/icons/folder.webp')"
                fit="contain"
                style="height: 100px;width: 100%;margin: 0 auto;"
                @click="handleClickFile(item)"
              />
              <div
                style="align-items: center;display: flex;justify-content: center;"
                @click="copyToClipboard(item.fileName ?? '')"
              >
                <el-tooltip
                  placement="top"
                  effect="light"
                  :content="item.fileName"
                >
                  <el-link
                    style="font-size: 12px;font-family: Arial, Helvetica, sans-serif;"
                    :underline="false"
                    :type="item.checked ? 'primary' : 'info'"
                  >
                    {{ formatFileName(item.fileName ?? '', 8) }}
                  </el-link>
                </el-tooltip>
              </div>
              <el-row
                style="display: flex;"
                justify="space-between"
                align="middle"
              >
                <el-row>
                  <el-icon
                    v-if="!item.isDir && showRenameFileIcon"
                    size="20"
                    style="cursor: pointer;"
                    color="#409EFF"
                    @click="handleRenameFile(item)"
                  >
                    <Edit />
                  </el-icon>
                  <el-icon
                    v-if="item.isDir"
                    size="20"
                    style="cursor: pointer;"
                    color="crimson"
                    @click="handleFolderBatchDownload(item)"
                  >
                    <Download />
                  </el-icon>
                  <el-dropdown>
                    <template #default>
                      <el-icon
                        size="20"
                        style="cursor: pointer;"
                        color="#409EFF"
                        @click="copyToClipboard(formatLink(item.url, item.fileName, manageStore.config.settings.pasteFormat ?? '$markdown', manageStore.config.settings.customPasteFormat ?? '$url'))"
                      >
                        <CopyDocument />
                      </el-icon>
                    </template>
                    <template #dropdown>
                      <el-dropdown-menu>
                        <el-dropdown-item
                          @click="copyToClipboard(formatLink(item.url, item.fileName, 'url'))"
                        >
                          Url
                        </el-dropdown-item>
                        <el-dropdown-item
                          @click="copyToClipboard(formatLink(item.url, item.fileName, 'markdown'))"
                        >
                          Markdown
                        </el-dropdown-item>
                        <el-dropdown-item
                          @click="copyToClipboard(formatLink(item.url, item.fileName, 'markdown-with-link'))"
                        >
                          Markdown-link
                        </el-dropdown-item>
                        <el-dropdown-item
                          @click="copyToClipboard(formatLink(item.url, item.fileName, 'html'))"
                        >
                          Html
                        </el-dropdown-item>
                        <el-dropdown-item
                          @click="copyToClipboard(formatLink(item.url, item.fileName, 'bbcode'))"
                        >
                          BBCode
                        </el-dropdown-item>
                        <el-dropdown-item
                          @click="copyToClipboard(formatLink(item.url, item.fileName, 'custom', manageStore.config.settings.customPasteFormat))"
                        >
                          {{ $T('MANAGE_BUCKET_URL_FORMAT_CUSTOM') }}
                        </el-dropdown-item>
                        <el-dropdown-item
                          v-if="showPresignedUrl"
                          @click="async () => {
                            copyToClipboard(await getPreSignedUrl(item))
                          }"
                        >
                          {{ $T('MANAGE_BUCKET_URL_FORMAT_PRESIGN') }}
                        </el-dropdown-item>
                      </el-dropdown-menu>
                    </template>
                  </el-dropdown>
                  <el-icon
                    size="20"
                    style="cursor: pointer;"
                    color="#409EFF"
                    @click="handleShowFileInfo(item)"
                  >
                    <Document />
                  </el-icon>
                  <el-icon
                    size="20"
                    style="cursor: pointer;"
                    color="#FFB6C1"
                    @click="handleDeleteFile(item)"
                  >
                    <DeleteFilled />
                  </el-icon>
                </el-row>
                <el-checkbox
                  v-model="item.checked"
                  size="large"
                  @change="handleCheckChange(item)"
                />
              </el-row>
            </el-card>
          </el-col>
        </el-row>
      </el-col>
    </div>
    <el-image-viewer
      v-if="showImagePreview"
      :url-list="ImagePreviewList"
      :initial-index="getCurrentPreviewIndex"
      infinite
      hide-on-click-modal
      @close="showImagePreview = false"
    />
    <el-dialog
      v-model="isShowFileInfo"
      :title="$T('MANAGE_BUCKET_FILE_INFO_TITLE')"
      center
      align-center
      draggable
    >
      <template #header>
        <el-button
          type="primary"
          plain
          @click="copyToClipboard(JSON.stringify(showedFileInfo,null,2))"
        >
          <template #icon>
            <el-icon>
              <Document />
            </el-icon>
          </template>
          {{ $T('MANAGE_BUCKET_FILE_INFO_COPY_TIPS') }}
        </el-button>
      </template>
      <el-row
        v-for="(value, key) in showedFileInfo"
        :key="key"
        :gutter="20"
        :style="{ margin: '10px 0', textAlign: 'center', fontFamily: 'Arial, Helvetica, sans-serif' }"
      >
        <el-col
          :span="6"
          @click="copyToClipboard(JSON.stringify({ [key]: value }))"
        >
          <span style="font-weight: 500;">{{ key }}:</span>
        </el-col>
        <el-col
          :span="18"
          @click="copyToClipboard(value)"
        >
          <span
            style="font-weight: 500;word-break: break-all;"
          >{{ value }}</span>
        </el-col>
      </el-row>
    </el-dialog>
    <el-affix
      v-if="isLoadingData"
      style="position: fixed;bottom: 25px;right: 0;"
      @click="cancelLoading"
    >
      <el-button
        type="warning"
        icon="el-icon-loading"
        style="font-size: 12px;font-weight: 500;"
        :loading="isLoadingData"
      >
        {{ $T('MANAGE_BUCKET_FILE_LIST_LOADING') }}
      </el-button>
    </el-affix>
    <el-affix
      v-if="isLoadingDownloadData"
      style="position: fixed;top: 50px;right: 0px;"
      @click="cancelDownloadLoading"
    >
      <el-button
        type="warning"
        icon="el-icon-loading"
        style="font-size: 12px;font-weight: 500;"
        :loading="isLoadingDownloadData"
      >
        {{ $T('MANAGE_BUCKET_FILE_LIST_DOWNLOAD_PRE') }}
      </el-button>
    </el-affix>
    <el-drawer
      v-model="isShowUploadPanel"
      size="60%"
      @open="startRefreshUploadTask"
      @close="stopRefreshUploadTask"
    >
      <template #header>
        <el-switch
          v-model="isUploadKeepDirStructure"
          :active-text="$T('MANAGE_BUCKET_KEEP_FOLDER_STRUCTURE')"
          :inactive-text="$T('MANAGE_BUCKET_NOT_KEEP_FOLDER_STRUCTURE')"
          @change="handleUploadKeepDirChange"
        />
      </template>
      <div
        id="upload-area"
        :class="{ 'is-dragover': dragover }"
        styel="position: fixed;bottom: 0;right: 0;heigth: 100%;width: 100%;"
        @drop.prevent="onDrop"
        @dragover.prevent="dragover = true"
        @dragleave.prevent="dragover = false"
        @click="openFileSelectDialog"
      >
        <div
          v-show="!tableData.length"
          id="upload-dragger"
          style="position: relative;top: 0;right: 0;heigth: 100%;width: 100%;display: flex;justify-content: center;align-items: center;"
        >
          <div
            class="upload-dragger__text"
            style="color: orange;font-size: 2.5vh;font-family: Arial, Helvetica, sans-serif;align-items: center;display: flex;justify-content: center;flex-direction: column;"
          >
            {{ $T('MANAGE_BUCKET_UPLOAD_AREA_TITLE') }}
            <span
              style="color: #409EFF;font-size: 2.5vh;font-family: Arial, Helvetica, sans-serif;align-items: center;display: flex;justify-content: center;flex-direction: column;"
            >
              {{ $T('MANAGE_BUCKET_UPLOAD_AREA_TEXT') }}
            </span>
          </div>
        </div>
        <el-auto-resizer v-if="tableData.length">
          <template #default="{ height, width }">
            <el-table-v2
              :columns="upLoadTaskColumns"
              :data="tableData.sort((a, b) => b.isFolder - a.isFolder === 0 ? b.filesList.length - a.filesList.length : b.isFolder - a.isFolder)"
              :width="width"
              :height="height"
            />
          </template>
        </el-auto-resizer>
      </div>
      <div style="display: flex;justify-content: center;align-items: center;">
        <el-button-group>
          <el-button
            type="success"
            plain
            :loading="isLoadingUploadPanelFiles"
            :disabled="isLoadingUploadPanelFiles || !tableData.length"
            @click="uploadFiles"
          >
            {{ isLoadingUploadPanelFiles? $T('MANAGE_BUCKET_UPLOAD_AREA_BTN_LOADING'): $T('MANAGE_BUCKET_UPLOAD_AREA_BTN') }}
          </el-button>
          <span>
            <el-button
              type="warning"
              plain
              :disabled="isLoadingUploadPanelFiles"
              @click="clearTableData"
            >
              {{ $T('MANAGE_BUCKET_UPLOAD_AREA_CLEAR') }}
            </el-button>
          </span>
        </el-button-group>
      </div>
      <el-tabs
        v-model="activeUpLoadTab"
        stretch
      >
        <el-tab-pane
          name="uploading"
        >
          <template #label>
            <span>
              {{ $T('MANAGE_BUCKET_UPLOAD_AREA_STATUS_UPLOADING') }}
            </span>
            <el-badge
              v-if="uploadingTaskList.length"
              :value="uploadingTaskList.length"
              :max="9999"
              type="primary"
            />
          </template>
          <el-button-group size="small">
            <el-button
              type="primary"
              plain
              :icon="Document"
              @click="handleCopyUploadingTaskInfo"
            >
              {{ $T('MANAGE_BUCKET_UPLOAD_AREA_COPY_TASK') }}
            </el-button>
            <el-button
              type="primary"
              plain
              :icon="DeleteFilled"
              @click="handleDeleteUploadedTask"
            >
              {{ $T('MANAGE_BUCKET_UPLOAD_AREA_CLEAR_UPLOADED_TASK') }}
            </el-button>
            <el-button
              type="primary"
              plain
              :icon="DeleteFilled"
              @click="handleDeleteAllUploadedTask"
            >
              {{ $T('MANAGE_BUCKET_UPLOAD_AREA_CLEAR_ALL_TASK') }}
            </el-button>
          </el-button-group>
          <div style="height: 500px;">
            <el-auto-resizer>
              <template #default="{ height, width }">
                <el-table-v2
                  :columns="uploadingTaskColumns"
                  :data="uploadingTaskList"
                  :width="width"
                  :height="height"
                />
              </template>
            </el-auto-resizer>
          </div>
        </el-tab-pane>
        <el-tab-pane
          name="finished"
        >
          <template #label>
            <span>
              {{ $T('MANAGE_BUCKET_UPLOAD_AREA_SUCCESS') }}
            </span>
            <el-badge
              v-if="uploadedTaskList.filter(item => item.status === 'uploaded').length"
              :value="uploadedTaskList.filter(item => item.status === 'uploaded').length"
              :max="9999"
              type="success"
            />
          </template>
          <el-button-group size="small">
            <el-button
              type="primary"
              plain
              :icon="Document"
              @click="handleCopyUploadingTaskInfo"
            >
              {{ $T('MANAGE_BUCKET_UPLOAD_AREA_COPY_TASK') }}
            </el-button>
            <el-button
              type="primary"
              plain
              :icon="DeleteFilled"
              @click="handleDeleteUploadedTask"
            >
              {{ $T('MANAGE_BUCKET_UPLOAD_AREA_CLEAR_UPLOADED_TASK') }}
            </el-button>
            <el-button
              type="primary"
              plain
              :icon="DeleteFilled"
              @click="handleDeleteAllUploadedTask"
            >
              {{ $T('MANAGE_BUCKET_UPLOAD_AREA_CLEAR_ALL_TASK') }}
            </el-button>
          </el-button-group>
          <div style="height:500px;">
            <el-auto-resizer>
              <template #default="{ height, width }">
                <el-table-v2
                  :columns="uploadedTaskColumns"
                  :data="uploadedTaskList.filter(item => item.status === 'uploaded')"
                  :width="width"
                  :height="height"
                />
              </template>
            </el-auto-resizer>
          </div>
        </el-tab-pane>
        <el-tab-pane
          name="failed"
        >
          <template #label>
            <span>
              {{ $T('MANAGE_BUCKET_UPLOAD_AREA_FAILED') }}
            </span>
            <el-badge
              v-if="uploadedTaskList.filter(item => item.status !== 'uploaded').length"
              :value="uploadedTaskList.filter(item => item.status !== 'uploaded').length"
              :max="9999"
              type="danger"
            />
          </template>
          <el-button-group size="small">
            <el-button
              type="primary"
              plain
              :icon="Document"
              @click="handleCopyUploadingTaskInfo"
            >
              {{ $T('MANAGE_BUCKET_UPLOAD_AREA_COPY_TASK') }}
            </el-button>
            <el-button
              type="primary"
              plain
              :icon="DeleteFilled"
              @click="handleDeleteUploadedTask"
            >
              {{ $T('MANAGE_BUCKET_UPLOAD_AREA_CLEAR_UPLOADED_TASK') }}
            </el-button>
            <el-button
              type="primary"
              plain
              :icon="DeleteFilled"
              @click="handleDeleteAllUploadedTask"
            >
              {{ $T('MANAGE_BUCKET_UPLOAD_AREA_CLEAR_ALL_TASK') }}
            </el-button>
          </el-button-group>
          <div style="height:500px;">
            <el-auto-resizer>
              <template #default="{ height, width }">
                <el-table-v2
                  :columns="uploadedTaskColumns"
                  :data="uploadedTaskList.filter(item => item.status !== 'uploaded')"
                  :width="width"
                  :height="height"
                />
              </template>
            </el-auto-resizer>
          </div>
        </el-tab-pane>
      </el-tabs>
    </el-drawer>
    <el-drawer
      v-model="isShowDownloadPanel"
      :title="$T('MANAGE_BUCKET_DOWNLOAD_PAGE_TITLE')"
      size="60%"
      @open="startRefreshDownloadTask"
      @close="stopRefreshDownloadTask"
    >
      <el-tabs
        v-model="activeDownLoadTab"
        stretch
      >
        <el-tab-pane
          name="downloading"
        >
          <template #label>
            <span>
              {{ $T('MANAGE_BUCKET_DOWNLOADING') }}
            </span>
            <el-badge
              v-if="downloadingTaskList.length"
              :value="downloadingTaskList.length"
              type="primary"
              :max="9999"
            />
          </template>
          <el-button-group size="small">
            <el-button
              type="primary"
              plain
              :icon="Document"
              @click="handleCopyDownloadingTaskInfo"
            >
              {{ $T('MANAGE_BUCKET_DOWNLOAD_COPY_TASK') }}
            </el-button>
            <el-button
              type="primary"
              plain
              :icon="DeleteFilled"
              @click="handleDeleteDownloadedTask"
            >
              {{ $T('MANAGE_BUCKET_DOWNLOAD_CLEAR_DOWNLOADED_TASK') }}
            </el-button>
            <el-button
              type="primary"
              plain
              :icon="DeleteFilled"
              @click="handleDeleteAllDownloadedTask"
            >
              {{ $T('MANAGE_BUCKET_DOWNLOAD_CLEAR_ALL_TASK') }}
            </el-button>
            <el-button
              type="primary"
              plain
              :icon="Folder"
              @click="handleOpenDownloadedFolder"
            >
              {{ $T('MANAGE_BUCKET_DOWNLOAD_OPEN_FOLDER') }}
            </el-button>
          </el-button-group>
          <div style="height: 600px;">
            <el-auto-resizer>
              <template #default="{ height, width }">
                <el-table-v2
                  :columns="downloadingTaskColumns"
                  :data="downloadingTaskList"
                  :width="width"
                  :height="height"
                />
              </template>
            </el-auto-resizer>
          </div>
        </el-tab-pane>
        <el-tab-pane
          name="finished"
        >
          <template #label>
            <span>
              {{ $T('MANAGE_BUCKET_DOWNLOAD_SUCCESS') }}
            </span>
            <el-badge
              v-if="downloadedTaskList.filter(item => item.status === 'downloaded').length"
              :value="downloadedTaskList.filter(item => item.status === 'downloaded').length"
              :max="9999"
              type="success"
            />
          </template>
          <el-button-group size="small">
            <el-button
              type="primary"
              plain
              :icon="Document"
              @click="handleCopyDownloadingTaskInfo"
            >
              {{ $T('MANAGE_BUCKET_DOWNLOAD_COPY_TASK') }}
            </el-button>
            <el-button
              type="primary"
              plain
              :icon="DeleteFilled"
              @click="handleDeleteDownloadedTask"
            >
              {{ $T('MANAGE_BUCKET_DOWNLOAD_CLEAR_DOWNLOADED_TASK') }}
            </el-button>
            <el-button
              type="primary"
              plain
              :icon="DeleteFilled"
              @click="handleDeleteAllDownloadedTask"
            >
              {{ $T('MANAGE_BUCKET_DOWNLOAD_CLEAR_ALL_TASK') }}
            </el-button>
            <el-button
              type="primary"
              plain
              :icon="Folder"
              @click="handleOpenDownloadedFolder"
            >
              {{ $T('MANAGE_BUCKET_DOWNLOAD_OPEN_FOLDER') }}
            </el-button>
          </el-button-group>
          <div style="height:600px;">
            <el-auto-resizer>
              <template #default="{ height, width }">
                <el-table-v2
                  :columns="downloadedTaskColumns"
                  :data="downloadedTaskList.filter(item => item.status === 'downloaded')"
                  :width="width"
                  :height="height"
                />
              </template>
            </el-auto-resizer>
          </div>
        </el-tab-pane>
        <el-tab-pane
          name="failed"
        >
          <template #label>
            <span>
              {{ $T('MANAGE_BUCKET_DOWNLOAD_FAILED') }}
            </span>
            <el-badge
              v-if="downloadedTaskList.filter(item => item.status !== 'downloaded').length"
              :value="downloadedTaskList.filter(item => item.status !== 'downloaded').length"
              :max="9999"
              type="warning"
            />
          </template>
          <el-button-group size="small">
            <el-button
              type="primary"
              plain
              :icon="Document"
              @click="handleCopyDownloadingTaskInfo"
            >
              {{ $T('MANAGE_BUCKET_DOWNLOAD_COPY_TASK') }}
            </el-button>
            <el-button
              type="primary"
              plain
              :icon="DeleteFilled"
              @click="handleDeleteDownloadedTask"
            >
              {{ $T('MANAGE_BUCKET_DOWNLOAD_CLEAR_DOWNLOADED_TASK') }}
            </el-button>
            <el-button
              type="primary"
              plain
              :icon="DeleteFilled"
              @click="handleDeleteAllDownloadedTask"
            >
              {{ $T('MANAGE_BUCKET_DOWNLOAD_CLEAR_ALL_TASK') }}
            </el-button>
            <el-button
              type="primary"
              plain
              :icon="Folder"
              @click="handleOpenDownloadedFolder"
            >
              {{ $T('MANAGE_BUCKET_DOWNLOAD_OPEN_FOLDER') }}
            </el-button>
          </el-button-group>
          <div style="height:600px;">
            <el-auto-resizer>
              <template #default="{ height, width }">
                <el-table-v2
                  :columns="downloadedTaskColumns"
                  :data="downloadedTaskList.filter(item => item.status !== 'downloaded')"
                  :width="width"
                  :height="height"
                />
              </template>
            </el-auto-resizer>
          </div>
        </el-tab-pane>
      </el-tabs>
    </el-drawer>
    <el-dialog
      v-model="isShowMarkDownDialog"
      :title="$T('MANAGE_BUCKET_MARKDOWN_PREVIEW')"
      center
      align-center
      draggable
      fullscreen
      close-on-press-escape
      show-close
      destroy-on-close
    >
      <div
        style="-webkit-user-select: text"
        v-html="markDownContent"
      />
      <el-button
        type="danger"
        :icon="Close"
        size="large"
        style="position: fixed;bottom: 10px;right: 15px"
        circle
        @click="() => {isShowMarkDownDialog = false}"
      />
    </el-dialog>
    <el-dialog
      v-model="isShowTextFileDialog"
      :title="$T('MANAGE_BUCKET_MARKDOWN_PREVIEW')"
      center
      align-center
      draggable
      fullscreen
      close-on-press-escape
      show-close
      destroy-on-close
    >
      <highlightjs
        style="-webkit-user-select: text;"
        language="js"
        :code="textfileContent"
      />
      <el-button
        type="danger"
        :icon="Close"
        size="large"
        style="position: fixed;bottom: 10px;right: 15px"
        circle
        @click="() => {isShowTextFileDialog = false}"
      />
    </el-dialog>
    <el-dialog
      v-model="isShowVideoFileDialog"
      :title="$T('MANAGE_BUCKET_PLAY')"
      center
      align-center
      draggable
      fullscreen
      close-on-press-escape
      show-close
      destroy-on-close
    >
      <video-player
        :src="videoFileUrl"
        :headers="videoPlayerHeaders"
        controls
        :loop="true"
        :volume="0.6"
        :autoplay="true"
        :width="1100"
        :height="700"
      />
      <el-button
        type="danger"
        :icon="Close"
        size="large"
        style="position: fixed;bottom: 10px;right: 15px"
        circle
        @click="() => {isShowVideoFileDialog = false}"
      />
    </el-dialog>
    <el-dialog
      v-model="isShowBatchRenameDialog"
      :title="$T('MANAGE_BUCKET_RENAME_FILE')"
      center
      align-center
      draggable
      destroy-on-close
      @close="() => {
        isSingleRename = false
        isRenameIncludeExt = false
      }"
    >
      <el-link
        :underline="false"
        style="margin-bottom: 10px;"
      >
        <span>
          {{ $T('MANAGE_BUCKET_RENAME_FILE_INPUT_A') }}
          <el-tooltip
            effect="dark"
            :content="$T('MANAGE_BUCKET_RENAME_FILE_INPUT_A_TIPS')"
            placement="right"
          >
            <el-icon
              color="#409EFF"
            >
              <InfoFilled />
            </el-icon>
          </el-tooltip>
        </span>
      </el-link>
      <el-input
        v-model="batchRenameMatch"
        :placeholder="$T('MANAGE_BUCKET_RENAME_FILE_INPUT_A_PLACEHOLDER')"
        clearable
      />
      <el-link
        :underline="false"
        style="margin-bottom: 10px;margin-top: 10px;"
      >
        <span>
          {{ $T('MANAGE_BUCKET_RENAME_FILE_INPUT_B') }}
          <el-popover
            effect="light"
            placement="right"
            width="280"
          >
            <template #reference>
              <el-icon
                color="#409EFF"
              >
                <InfoFilled />
              </el-icon>
            </template>
            <el-descriptions
              :column="1"
              style="width: 250px;"
              border
            >
              <el-descriptions-item
                v-for="(item, index) in customRenameFormatTable"
                :key="index"
                :label="item.placeholder"
                align="center"
                label-style="width: 100px;"
              >
                {{ item.description }}
              </el-descriptions-item>
              <el-descriptions-item
                v-for="(item, index) in customRenameFormatTable.slice(0, customRenameFormatTable.length-1)"
                :key="index"
                :label="item.placeholderB"
                align="center"
                label-style="width: 100px;"
              >
                {{ item.descriptionB }}
              </el-descriptions-item>
              <el-descriptions-item
                label="{auto}"
                align="center"
                label-style="width: 100px;"
              >
                {{ $T('MANAGE_BUCKET_RENAME_FILE_TABLE_IID') }}
              </el-descriptions-item>
            </el-descriptions>
          </el-popover>
        </span>
      </el-link>
      <el-input
        v-model="batchRenameReplace"
        placeholder="Ex. {Y}-{m}-{uuid}"
        clearable
      />
      <el-link
        :underline="false"
        style="margin-bottom: 10px;margin-top: 10px;"
      >
        <span>
          {{ $T('MANAGE_BUCKET_RENAME_FILE_EXT') }}
          <el-tooltip
            effect="dark"
            :content="$T('MANAGE_BUCKET_RENAME_FILE_EXT_TIPS')"
            placement="right"
          >
            <el-icon
              color="#409EFF"
            >
              <InfoFilled />
            </el-icon>
          </el-tooltip>
        </span>
      </el-link>
      <br>
      <el-switch
        v-model="isRenameIncludeExt"
        :active-text="$T('MANAGE_BUCKET_RENAME_FILE_EXT_YES')"
        :inactive-text="$T('MANAGE_BUCKET_RENAME_FILE_EXT_NO')"
      />
      <div
        style="margin-top: 10px;align-items: center;display: flex;justify-content: flex-end;"
      >
        <el-button
          type="danger"
          style="margin-right: 30px;"
          plain
          :icon="Close"
          @click="() => {isShowBatchRenameDialog = false}"
        >
          {{ $T('MANAGE_BUCKET_RENAME_FILE_CANCEL') }}
        </el-button>
        <el-button
          type="primary"
          plain
          :icon="Edit"
          @click="isSingleRename ? singleRename() : BatchRename()"
        >
          {{ $T('MANAGE_BUCKET_RENAME_FILE_CONFIRM') }}
        </el-button>
      </div>
    </el-dialog>
  </div>
</template>

<script lang="tsx" setup>
import { ref, reactive, watch, onBeforeMount, computed, onBeforeUnmount } from 'vue'
import { useRoute } from 'vue-router'
import { InfoFilled, Grid, Fold, Close, Folder, FolderAdd, Upload, CircleClose, Loading, CopyDocument, Edit, DocumentAdd, Link, Refresh, ArrowRight, HomeFilled, Document, Coin, Download, DeleteFilled, Sort, FolderOpened } from '@element-plus/icons-vue'
import { useManageStore } from '../store/manageStore'
import { customRenameFormatTable, customStrMatch, customStrReplace, renameFile, formatLink, formatFileName, getFileIconPath, formatFileSize, getExtension, isValidUrl, svg } from '../utils/common'
import { cancelDownloadLoadingFileList, refreshDownloadFileTransferList } from '../utils/static'
import { ipcRenderer, clipboard, IpcRendererEvent } from 'electron'
import { fileCacheDbInstance } from '../store/bucketFileDb'
import { trimPath } from '~/main/manage/utils/common'
import axios from 'axios'
import {
  ElMessage, ElMessageBox, ElNotification,
  ElButton,
  ElIcon,
  ElTooltip,
  ElCheckbox,
  ElPopover,
  ElImage,
  ElDropdown,
  ElDropdownItem,
  ElDropdownMenu,
  ElProgress,
  ElLink,
  ElTag,
  ElCard
} from 'element-plus'
import type { Column, RowClassNameGetter } from 'element-plus'
import { useFileTransferStore, useDownloadFileTransferStore } from '@/manage/store/manageStore'
import { v4 as uuidv4 } from 'uuid'
import path from 'path'
import { IUploadTask, IDownloadTask } from '~/main/manage/datastore/upDownTaskQueue'
import fs from 'fs-extra'
import { getConfig, saveConfig } from '../utils/dataSender'
import { marked } from 'marked'
import { textFileExt } from '../utils/textfile'
import { videoExt } from '../utils/videofile'
import ImageWebdav from '@/components/ImageWebdav.vue'
import { T as $T } from '@/i18n'

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

const linkArray = [
  { key: 'Url', value: 'url' },
  { key: 'Markdown', value: 'markdown' },
  { key: 'Markdown-link', value: 'markdown-with-link' },
  { key: 'Html', value: 'html' },
  { key: 'BBCode', value: 'bbcode' },
  { key: 'Custom', value: 'custom' }
]

const manageStore = useManageStore()
const pagingMarker = ref('')
const pagingMarkerStack = reactive([] as string[])
const currentPrefix = ref('/')
const currentPage = ref(1)
const fileSortNameReverse = ref(false)
const fileSortTimeReverse = ref(false)
const fileSortSizeReverse = ref(false)
const fileSortExtReverse = ref(false)
const currentPageFilesInfo = reactive([] as any[])
const currentDownloadFileList = reactive([] as any[])
const route = useRoute()
const configMap = reactive(JSON.parse(route.query.configMap as string))
const selectedItems = reactive([] as any[])
const searchText = ref('')
const urlToUpload = ref('')
const dialogVisible = ref(false)
const showLoadingPage = ref(false)
const showImagePreview = ref(false)
const previewedImage = ref('')
const isShowFileInfo = ref(false)
const showedFileInfo = ref({} as any)
const elTable = ref(null as any)
const isShiftKeyPress = ref<boolean>(false)
const lastChoosed = ref<number>(-1)
const isLoadingData = ref(false)
const isLoadingDownloadData = ref(false)
const cancelToken = ref('')
const downloadCancelToken = ref('')
const isShowUploadPanel = ref(false)
const isShowDownloadPanel = ref(false)
const dragover = ref(false)
const activeUpLoadTab = ref('uploading')
const activeDownLoadTab = ref('downloading')
// 上传任务列表
const uploadTaskList = ref([] as IUploadTask[])
const downloadTaskList = ref([] as IDownloadTask[])
const refreshUploadTaskId = ref<NodeJS.Timer | null>(null)
const refreshDownloadTaskId = ref<NodeJS.Timer | null>(null)
const uploadPanelFilesList = ref([] as any[])
const isLoadingUploadPanelFiles = ref(false)
const tableData = reactive([] as any[])
const customUrlList = ref([] as any[])
const currentCustomUrl = ref('')
const isShowMarkDownDialog = ref(false)
const markDownContent = ref('')
const isShowTextFileDialog = ref(false)
const textfileContent = ref('')
const isShowVideoFileDialog = ref(false)
const videoFileUrl = ref('')
const videoPlayerHeaders = ref({})
const showFileStyle = ref<'list' | 'grid'>('grid')
const isUploadKeepDirStructure = computed(() => manageStore.config.settings.isUploadKeepDirStructure ?? true)
const isShowBatchRenameDialog = ref(false)
const batchRenameMatch = ref('')
const batchRenameReplace = ref('')
const isRenameIncludeExt = ref(false)
const isSingleRename = ref(false)
const itemToBeRenamed = ref({} as any)

const showCustomUrlSelectList = computed(() => ['tcyun', 'aliyun', 'qiniu', 'github'].includes(currentPicBedName.value))

const showCustomUrlInput = computed(() => ['aliyun', 'qiniu', 'tcyun', 's3plist', 'webdavplist'].includes(currentPicBedName.value))

const showCreateNewFolder = computed(() => ['tcyun', 'aliyun', 'qiniu', 'upyun', 'github', 's3plist', 'webdavplist'].includes(currentPicBedName.value))

const showRenameFileIcon = computed(() => ['tcyun', 'aliyun', 'qiniu', 'upyun', 's3plist', 'webdavplist'].includes(currentPicBedName.value))

const showPresignedUrl = computed(() => ['tcyun', 'aliyun', 'qiniu', 'github', 's3plist', 'webdavplist'].includes(currentPicBedName.value))

const uploadingTaskList = computed(() => uploadTaskList.value.filter(item => ['uploading', 'queuing', 'paused'].includes(item.status)))

const uploadedTaskList = computed(() => uploadTaskList.value.filter(item => ['uploaded', 'failed', 'canceled'].includes(item.status)))

const downloadingTaskList = computed(() => downloadTaskList.value.filter(item => ['downloading', 'queuing', 'paused'].includes(item.status)))

const downloadedTaskList = computed(() => downloadTaskList.value.filter(item => ['downloaded', 'failed', 'canceled'].includes(item.status)))

const isAutoCustomUrl = computed(() => manageStore.config.picBed[configMap.alias].isAutoCustomUrl === undefined ? true : manageStore.config.picBed[configMap.alias].isAutoCustomUrl)

function handleUploadKeepDirChange (val: any) {
  saveConfig('settings.isUploadKeepDirStructure', !!val)
  manageStore.refreshConfig()
}

function handleViewChange (val: 'list' | 'grid') {
  showFileStyle.value = val
}

function getBase64ofWebdav () {
  const headers = {
    Authorization: 'Basic ' + Buffer.from(`${manageStore.config.picBed[configMap.alias].username}:${manageStore.config.picBed[configMap.alias].password}`).toString('base64')
  }
  return headers
}

function startRefreshUploadTask () {
  refreshUploadTaskId.value = setInterval(() => {
    ipcRenderer.invoke('getUploadTaskList').then((res: any) => {
      uploadTaskList.value = res
    })
  }, 300)
}

function startRefreshDownloadTask () {
  refreshDownloadTaskId.value = setInterval(() => {
    ipcRenderer.invoke('getDownloadTaskList').then((res: any) => {
      downloadTaskList.value = res
    })
  }, 300)
}

const stopRefreshUploadTask = () => refreshUploadTaskId.value && clearInterval(refreshUploadTaskId.value)

const stopRefreshDownloadTask = () => refreshDownloadTaskId.value && clearInterval(refreshDownloadTaskId.value)

const ImagePreviewList = computed(() => currentPageFilesInfo.filter(item => item.isImage).map(item => item.url))

const getCurrentPreviewIndex = computed(() => ImagePreviewList.value.indexOf(previewedImage.value))

const showUploadDialog = () => {
  isShowUploadPanel.value = true
}
const showDownloadDialog = () => {
  isShowDownloadPanel.value = true
}

function openFileSelectDialog () {
  ipcRenderer.invoke('openFileSelectDialog').then((res: any) => {
    if (res) {
      res.forEach((item: any) => {
        tableData.push({
          fileSize: fs.statSync(item).size,
          isFolder: false,
          name: path.basename(item),
          filesList: []
        })
        const index = uploadPanelFilesList.value.findIndex((file: any) => file.path === item)
        if (index === -1) {
          uploadPanelFilesList.value.push({
            name: path.basename(item),
            path: item,
            size: fs.statSync(item).size
          })
        }
      })
    }
  })
}

function onDrop (e: DragEvent) {
  dragover.value = false
  const items = e.dataTransfer?.items
  if (items) {
    webkitReadDataTransfer(e.dataTransfer as DataTransfer)
  }
}
/* 参考 https://blog.csdn.net/mingwei_zhu/article/details/128541169
 * 作者 前端 - wei
 * 递归读取文件夹
 */
function webkitReadDataTransfer (dataTransfer: DataTransfer) {
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
            path: item.path,
            size: item.size,
            relativePath: item.relativePath
          })
        }
      })
      handleUploadFiles(files)
      isLoadingUploadPanelFiles.value = false
    }
  }
  const files = [] as any[]
  const items = dataTransfer.items
  for (let i = 0; i < items.length; i++) {
    const entry = items[i].webkitGetAsEntry() as any
    if (!entry) {
      decrement()
      continue
    }
    if (entry.isFile) {
      readFiles(items[i].getAsFile(), entry.fullPath)
    } else if (entry.isDirectory) {
      readDirectory(entry.createReader())
    }
  }

  function readDirectory (reader: any) {
    reader.readEntries((entries: any) => {
      if (entries.length) {
        fileNum += entries.length
        entries.forEach((entry: any) => {
          if (entry.isFile) {
            entry.file((file: any) => {
              readFiles(file, entry.fullPath)
            }, (err: any) => {
              console.log(err)
            })
          } else if (entry.isDirectory) {
            readDirectory(entry.createReader())
          }
        })
        readDirectory(reader)
      } else {
        decrement()
      }
    }, (err: any) => {
      console.log(err)
    })
  }

  function readFiles (file: any, fullPath: string) {
    file.relativePath = fullPath.substring(1)
    files.push(file)
    decrement()
  }
}

function handleUploadFiles (files: any[]) {
  const dirObj = {} as any
  files.forEach((item) => {
    if (item.relativePath === item.name) {
      const index = tableData.findIndex((file: any) => file.fullPath === item.path)
      if (index === -1) {
        tableData.push({
          name: item.name,
          filesList: [item.file],
          isFolder: false,
          fileSize: item.size,
          fullPath: item.path
        })
      }
    }
    if (item.relativePath !== item.name) {
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
          path: item.path
        }
      }
    }
  })
  Object.keys(dirObj).forEach((key) => {
    const index = tableData.findIndex((item: any) => item.fullPath === dirObj[key].path)
    if (index === -1) {
      tableData.push({
        name: key,
        filesList: dirObj[key].filesList,
        isFolder: true,
        fileSize: dirObj[key].fileSize,
        fullPath: dirObj[key].path
      })
    }
  })
}

function clearTableData () {
  tableData.length = 0
  uploadPanelFilesList.value = []
}

function renameFileBeforeUpload (filePath: string): string {
  const fileName = path.basename(filePath)
  const typeMap = {
    timestampRename: manageStore.config.settings.timestampRename,
    randomStringRename: manageStore.config.settings.randomStringRename,
    customRenameFormat: manageStore.config.settings.customRenameFormat
  }
  return renameFile(typeMap, fileName)
}

function uploadFiles () {
  const formateduploadPanelFilesList = [] as any[]
  uploadPanelFilesList.value.forEach((item: any) => {
    formateduploadPanelFilesList.push({
      rawName: item.name,
      path: item.path.replace(/\\/g, '/'),
      size: item.size,
      renamedFileName: renameFileBeforeUpload(item.name),
      relativePath: item.relativePath ?? ''
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
    fileArray: [] as any[]
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
      githubBranch: currentCustomUrl.value,
      aclForUpload: manageStore.config.picBed[configMap.alias].aclForUpload
    })
  })
  ipcRenderer.send('uploadBucketFile', configMap.alias, param)
}

function handleCopyUploadingTaskInfo () {
  clipboard.writeText(JSON.stringify(uploadTaskList.value, null, 2))
  ElMessage.success($T('MANAGE_BUCKET_COPY_SUCCESS'))
}

function handleCopyDownloadingTaskInfo () {
  clipboard.writeText(JSON.stringify(downloadTaskList.value, null, 2))
  ElMessage.success($T('MANAGE_BUCKET_COPY_SUCCESS'))
}

function handleDeleteUploadedTask () {
  ipcRenderer.send('deleteUploadedTask')
  ElMessage.success($T('MANAGE_BUCKET_DELETE_SUCCESS'))
}

function handleDeleteAllUploadedTask () {
  ipcRenderer.send('deleteAllUploadedTask')
  ElMessage.success($T('MANAGE_BUCKET_DELETE_SUCCESS'))
}

function handleDeleteDownloadedTask () {
  ipcRenderer.send('deleteDownloadedTask')
  ElMessage.success($T('MANAGE_BUCKET_DELETE_SUCCESS'))
}

function handleDeleteAllDownloadedTask () {
  ipcRenderer.send('deleteAllDownloadedTask')
  ElMessage.success($T('MANAGE_BUCKET_DELETE_SUCCESS'))
}

const handleOpenDownloadedFolder = () => ipcRenderer.send('OpenDownloadedFolder', manageStore.config.settings.downloadDir)

function handleShowFileInfo (item: any) {
  isShowFileInfo.value = true
  showedFileInfo.value = item
}

async function handleBreadcrumbClick (index: number) {
  const targetPrefix = currentPrefix.value.split('/').slice(0, index + 1).join('/') + '/'
  if (isLoadingData.value) {
    isLoadingData.value = false
    ipcRenderer.send('cancelLoadingFileList', cancelToken.value)
  }
  configMap.prefix = targetPrefix
  showLoadingPage.value = true
  resetParam(false)
  showLoadingPage.value = false
}

async function handleClickFile (item: any) {
  const options = {} as any
  if (currentPicBedName.value === 'webdavplist') {
    options.headers = {
      Authorization: `Basic ${Buffer.from(`${manageStore.config.picBed[configMap.alias].username}:${manageStore.config.picBed[configMap.alias].password}`).toString('base64')}`
    }
  }
  if (item.isImage) {
    previewedImage.value = item.url
    showImagePreview.value = true
  } else if (item.isDir) {
    if (isLoadingData.value) {
      isLoadingData.value = false
      ipcRenderer.send('cancelLoadingFileList', cancelToken.value)
    }
    configMap.prefix = `/${item.key}`
    showLoadingPage.value = true
    await resetParam(false)
    showLoadingPage.value = false
  } else if (item.fileName.endsWith('.md')) {
    try {
      ElMessage({
        message: $T('MANAGE_BUCKET_START_LOADING_MESSAGE'),
        duration: 300,
        type: 'success'
      })
      const fileUrl = item.url
      const res = await axios.get(fileUrl, options)
      const content = res.data
      markDownContent.value = marked(content)
      isShowMarkDownDialog.value = true
    } catch (error) {
      ElMessage.error($T('MANAGE_BUCKET_END_LOADING_MESSAGE_FAIL'))
    }
  } else if (textFileExt.includes(path.extname(item.fileName).toLowerCase()) ||
    textFileExt.includes(item.fileName.toLowerCase())
  ) {
    try {
      ElMessage({
        message: $T('MANAGE_BUCKET_START_LOADING_MESSAGE'),
        duration: 300,
        type: 'success'
      })
      const fileUrl = item.url
      const res = await axios.get(fileUrl, options)
      textfileContent.value = res.data
      isShowTextFileDialog.value = true
    } catch (error) {
      ElMessage.error($T('MANAGE_BUCKET_END_LOADING_MESSAGE_FAIL'))
    }
  } else if (videoExt.includes(path.extname(item.fileName).toLowerCase())) {
    videoFileUrl.value = item.url
    isShowVideoFileDialog.value = true
    videoPlayerHeaders.value = options.headers
  }
}

const currentPicBedName = computed<string>(() => manageStore.config.picBed[configMap.alias].picBedName)

const paging = computed(() => manageStore.config.picBed[configMap.alias].paging)

const itemsPerPage = computed(() => manageStore.config.picBed[configMap.alias].itemsPerPage)

const calculateAllFileSize = computed(() => formatFileSize(currentPageFilesInfo.reduce((total: any, item: { fileSize: any }) => total + item.fileSize, 0)) || '0')

const isShowThumbnail = computed(() => manageStore.config.settings.isShowThumbnail ?? false)
const isAutoRefresh = computed(() => manageStore.config.settings.isAutoRefresh ?? false)
const isIgnoreCase = computed(() => manageStore.config.settings.isIgnoreCase ?? false)

async function handleChangeCustomUrl () {
  if (currentPicBedName.value === 'github') {
    showLoadingPage.value = true
    if (isLoadingData.value) {
      ElNotification({
        title: $T('MANAGE_BUCKET_CHANGE_CUSTOM_URL_TITLE'),
        message: $T('MANAGE_BUCKET_CHANGE_CUSTOM_URL_MSG'),
        type: 'error',
        duration: 2000
      })
    }
    showLoadingPage.value = true
    await resetParam(true)
    showLoadingPage.value = false
  } else if (['aliyun', 'tcyun', 'qiniu', 's3plist', 'webdavplist'].includes(currentPicBedName.value)) {
    const currentConfigs = await getConfig<any>('picBed')
    const currentConfig = currentConfigs[configMap.alias]
    const currentTransformedConfig = JSON.parse(currentConfig.transformedConfig ?? '{}')
    if (currentTransformedConfig[configMap.bucketName]) {
      currentTransformedConfig[configMap.bucketName].customUrl = currentCustomUrl.value
    } else {
      currentTransformedConfig[configMap.bucketName] = {
        customUrl: currentCustomUrl.value
      }
    }
    currentConfig.transformedConfig = JSON.stringify(currentTransformedConfig)
    saveConfig(`picBed.${configMap.alias}`, currentConfig)
    await manageStore.refreshConfig()
  }
}

// when the current picBed is github, the customUrlList is used to store the github repo branches
async function initCustomUrlList () {
  if ((['aliyun', 'tcyun', 'qiniu'].includes(currentPicBedName.value) &&
    (manageStore.config.picBed[configMap.alias].isAutoCustomUrl === undefined || manageStore.config.picBed[configMap.alias].isAutoCustomUrl === true)) ||
    ['github', 'smms', 'upyun', 'imgur'].includes(currentPicBedName.value)) {
    const param = {
      bucketName: configMap.bucketName,
      region: configMap.bucketConfig.Location
    }
    let defaultUrl = ''
    if (currentPicBedName.value === 'tcyun') {
      defaultUrl = `https://${configMap.bucketName}.cos.${configMap.bucketConfig.Location}.myqcloud.com`
    } else if (currentPicBedName.value === 'aliyun') {
      defaultUrl = `https://${configMap.bucketName}.${configMap.bucketConfig.Location}.aliyuncs.com`
    } else if (currentPicBedName.value === 'github') {
      defaultUrl = 'main'
    }
    const res = await ipcRenderer.invoke('getBucketDomain', configMap.alias, param)
    if (res.length > 0) {
      customUrlList.value.length = 0
      res.forEach((item: any) => {
        if (!/^https?:\/\//.test(item) && currentPicBedName.value !== 'github') {
          item = manageStore.config.settings.isForceCustomUrlHttps ? `https://${item}` : `http://${item}`
        }
        customUrlList.value.push({
          label: item,
          value: item
        })
      })
      defaultUrl !== '' && currentPicBedName.value !== 'github' && customUrlList.value.push({
        label: defaultUrl,
        value: defaultUrl
      })
      currentCustomUrl.value = customUrlList.value[0].value
    } else {
      customUrlList.value.length = 0
      customUrlList.value = [
        {
          label: defaultUrl,
          value: defaultUrl
        }
      ]
      currentCustomUrl.value = defaultUrl
    }
  } else if (['aliyun', 'tcyun', 'qiniu'].includes(currentPicBedName.value)) {
    const currentConfigs = await getConfig<any>('picBed')
    const currentConfig = currentConfigs[configMap.alias]
    const currentTransformedConfig = JSON.parse(currentConfig.transformedConfig ?? '{}')
    if (currentTransformedConfig[configMap.bucketName]) {
      currentCustomUrl.value = currentTransformedConfig[configMap.bucketName].customUrl ?? ''
    } else {
      currentCustomUrl.value = ''
    }
  } else if (currentPicBedName.value === 's3plist') {
    const currentConfigs = await getConfig<any>('picBed')
    const currentConfig = currentConfigs[configMap.alias]
    const currentTransformedConfig = JSON.parse(currentConfig.transformedConfig ?? '{}')
    if (currentTransformedConfig[configMap.bucketName]) {
      currentCustomUrl.value = currentTransformedConfig[configMap.bucketName].customUrl ?? ''
    } else {
      if (manageStore.config.picBed[configMap.alias].endpoint) {
        const endpoint = manageStore.config.picBed[configMap.alias].endpoint
        let url
        if (/^https?:\/\//.test(endpoint)) {
          url = new URL(endpoint)
        } else {
          url = new URL(manageStore.config.picBed[configMap.alias].sslEnabled ? 'https://' + endpoint : 'http://' + endpoint)
        }
        currentCustomUrl.value = `${url.protocol}//${configMap.bucketName}.${url.hostname}`
      } else {
        currentCustomUrl.value = `https://${configMap.bucketName}.s3.amazonaws.com`
      }
    }
    handleChangeCustomUrl()
  } else if (currentPicBedName.value === 'webdavplist') {
    const currentConfigs = await getConfig<any>('picBed')
    const currentConfig = currentConfigs[configMap.alias]
    const currentTransformedConfig = JSON.parse(currentConfig.transformedConfig ?? '{}')
    if (currentTransformedConfig[configMap.bucketName] && currentTransformedConfig[configMap.bucketName]?.customUrl) {
      currentCustomUrl.value = currentTransformedConfig[configMap.bucketName].customUrl
    } else {
      let endpoint = manageStore.config.picBed[configMap.alias].endpoint
      if (!/^https?:\/\//.test(endpoint)) {
        endpoint = 'http://' + endpoint
      }
      currentCustomUrl.value = endpoint
    }
    handleChangeCustomUrl()
  }
}

async function resetParam (force: boolean = false) {
  if (isLoadingData.value) {
    isLoadingData.value = false
    ipcRenderer.send('cancelLoadingFileList', cancelToken.value)
  }
  if (isLoadingDownloadData.value) {
    isLoadingDownloadData.value = false
    ipcRenderer.send(cancelDownloadLoadingFileList, downloadCancelToken.value)
  }
  cancelToken.value = ''
  pagingMarker.value = ''
  currentPrefix.value = configMap.prefix
  currentPage.value = 1
  currentPageFilesInfo.length = 0
  currentDownloadFileList.length = 0
  selectedItems.length = 0
  searchText.value = ''
  urlToUpload.value = ''
  dialogVisible.value = false
  showImagePreview.value = false
  previewedImage.value = ''
  isShowFileInfo.value = false
  lastChoosed.value = -1
  showFileStyle.value = manageStore.config.picBed[configMap.alias].isShowList ? 'list' : 'grid'
  if (!isAutoRefresh.value && !force && !paging.value) {
    const cachedData = await searchExistFileList()
    if (cachedData.length > 0) {
      currentPageFilesInfo.push(...cachedData[0].value.fullList)
      showLoadingPage.value = false
      return
    }
  }
  if (paging.value) {
    const res = await getBucketFileList() as IStringKeyMap
    if (res.success) {
      res.fullList.sort((a: any, b: any) => {
        if (a.isDir && !b.isDir) {
          return -1
        } else if (!a.isDir && b.isDir) {
          return 1
        } else {
          return a.fileName.localeCompare(b.fileName)
        }
      })
      currentPageFilesInfo.push(...res.fullList)
      if (res.isTruncated && paging.value) {
        pagingMarkerStack.push(pagingMarker.value)
        pagingMarker.value = res.nextMarker
      } else if (paging.value && currentPage.value > 1) {
        ElNotification({
          title: $T('MANAGE_BUCKET_LAST_PAGE_TITLE'),
          message: $T('MANAGE_BUCKET_LAST_PAGE_MSG'),
          type: 'success',
          duration: 500
        })
      }
    } else {
      ElNotification({
        title: $T('MANAGE_BUCKET_GET_LIST_FAIL_TITLE'),
        message: $T('MANAGE_BUCKET_GET_LIST_FAIL_MSG'),
        type: 'error',
        duration: 2000
      })
    }
  } else {
    getBucketFileListBackStage()
    ElNotification.info({
      title: $T('MANAGE_BUCKET_GET_LIST_FAIL_TITLE'),
      message: $T('MANAGE_BUCKET_GET_LIST_FAIL_MSG2'),
      duration: 1000
    })
  }
}

watch(route, async (newRoute) => {
  if (newRoute.query.configMap) {
    showLoadingPage.value = true
    const query = newRoute.query.configMap as string
    for (const key in JSON.parse(query)) {
      configMap[key] = JSON.parse(query)[key]
    }
    await initCustomUrlList()
    await resetParam(false)
    showLoadingPage.value = false
  }
})

async function forceRefreshFileList () {
  if (isLoadingData.value) {
    ElNotification({
      title: $T('MANAGE_BUCKET_GET_LIST_FAIL_TITLE'),
      message: $T('MANAGE_BUCKET_GET_LIST_FAIL_MSG3'),
      type: 'error',
      duration: 1000
    })
    return
  }
  showLoadingPage.value = true
  await resetParam(true)
  showLoadingPage.value = false
}

watch(currentPage, () => {
  if (typeof currentPage.value !== 'number' || currentPage.value === null) {
    currentPage.value = 1
  }
})

const changePage = async (cur: number | undefined, prev: number | undefined) => {
  if (!cur || !prev) {
    currentPage.value = 1
  } else {
    if (cur > prev) {
      showLoadingPage.value = true
      currentPage.value = prev + 1
      currentPageFilesInfo.length = 0
      selectedItems.length = 0
      searchText.value = ''
      urlToUpload.value = ''
      dialogVisible.value = false
      const res = await getBucketFileList() as IStringKeyMap
      showLoadingPage.value = false
      if (res.success) {
        res.fullList.sort((a: any) => {
          return a.isDir ? -1 : 1
        })
        currentPageFilesInfo.push(...res.fullList)
        if (res.isTruncated) {
          pagingMarkerStack.push(pagingMarker.value)
          pagingMarker.value = res.nextMarker
        } else {
          ElNotification({
            title: $T('MANAGE_BUCKET_GET_LIST_FAIL_TITLE'),
            message: $T('MANAGE_BUCKET_LAST_PAGE_MSG'),
            type: 'success',
            duration: 1000
          })
        }
      } else {
        ElNotification({
          title: $T('MANAGE_BUCKET_GET_LIST_FAIL_TITLE'),
          message: $T('MANAGE_BUCKET_GET_LIST_FAIL_MSG'),
          type: 'error',
          duration: 1000
        })
      }
    } else if (cur < prev) {
      showLoadingPage.value = true
      currentPage.value = prev - 1
      currentPageFilesInfo.length = 0
      selectedItems.length = 0
      searchText.value = ''
      urlToUpload.value = ''
      dialogVisible.value = false
      pagingMarker.value = pagingMarkerStack[pagingMarkerStack.length - 2]
      pagingMarkerStack.pop()
      pagingMarkerStack.pop()
      const res = await getBucketFileList() as IStringKeyMap
      showLoadingPage.value = false
      if (res.success) {
        res.fullList.sort((a: any) => {
          return a.isDir ? -1 : 1
        })
        currentPageFilesInfo.push(...res.fullList)
        if (paging.value) {
          if (res.isTruncated) {
            pagingMarkerStack.push(pagingMarker.value)
            pagingMarker.value = res.nextMarker
          } else {
            ElNotification({
              title: $T('MANAGE_BUCKET_GET_LIST_FAIL_TITLE'),
              message: $T('MANAGE_BUCKET_LAST_PAGE_MSG'),
              type: 'success',
              duration: 1000
            })
          }
        }
      } else {
        ElNotification({
          title: $T('MANAGE_BUCKET_GET_LIST_FAIL_TITLE'),
          message: $T('MANAGE_BUCKET_GET_LIST_FAIL_MSG'),
          type: 'error',
          duration: 1000
        })
      }
    }
  }
}

watch(searchText, () => searchAndSort())

function searchAndSort () {
  elTable.value.scrollToRow(0)
  if (searchText.value) {
    if (isIgnoreCase.value) {
      currentPageFilesInfo.forEach((item: any) => {
        if (item.fileName.toLowerCase().includes(searchText.value.toLowerCase())) {
          item.match = true
        } else {
          item.match = false
        }
      })
      currentPageFilesInfo.sort((a: any, b: any) => {
        return b.match - a.match
      })
    } else {
      currentPageFilesInfo.forEach((item: any) => {
        if (item.fileName.includes(searchText.value)) {
          item.match = true
        } else {
          item.match = false
        }
      })
      currentPageFilesInfo.sort((a: any, b: any) => {
        return b.match - a.match
      })
    }
  } else {
    currentPageFilesInfo.forEach((item: any) => {
      item.match = true
    })
    sortFile('init')
  }
}

function sortFile (type: 'name' | 'size' | 'time' | 'ext' | 'check' | 'init') {
  switch (type) {
    case 'name':
      fileSortNameReverse.value = !fileSortNameReverse.value
      currentPageFilesInfo.sort((a: any, b: any) => {
        if (fileSortNameReverse.value) {
          return a.fileName.localeCompare(b.fileName)
        } else {
          return b.fileName.localeCompare(a.fileName)
        }
      })
      break
    case 'size':
      fileSortSizeReverse.value = !fileSortSizeReverse.value
      currentPageFilesInfo.sort((a: any, b: any) => {
        if (fileSortSizeReverse.value) {
          return a.fileSize - b.fileSize
        } else {
          return b.fileSize - a.fileSize
        }
      })
      break
    case 'time':
      fileSortTimeReverse.value = !fileSortTimeReverse.value
      currentPageFilesInfo.sort((a: any, b: any) => {
        if (fileSortTimeReverse.value) {
          return new Date(a.formatedTime).getTime() - new Date(b.formatedTime).getTime()
        } else {
          return new Date(b.formatedTime).getTime() - new Date(a.formatedTime).getTime()
        }
      })
      break
    case 'ext':
      fileSortExtReverse.value = !fileSortExtReverse.value
      currentPageFilesInfo.sort((a: any, b: any) => {
        if (fileSortExtReverse.value) {
          return getExtension(a.fileName).localeCompare(getExtension(b.fileName))
        } else {
          return getExtension(b.fileName).localeCompare(getExtension(a.fileName))
        }
      })
      break
    case 'check':
      currentPageFilesInfo.sort((a: any, b: any) => {
        return b.checked - a.checked
      })
      break
    case 'init':
      currentPageFilesInfo.sort((a: any, b: any) => {
        if (a.isDir && !b.isDir) {
          return -1
        } else if (!a.isDir && b.isDir) {
          return 1
        } else {
          return a.fileName.localeCompare(b.fileName)
        }
      })
  }
}

function handleCancelCheck () {
  currentPageFilesInfo.forEach((item: any) => {
    item.checked = false
  })
  selectedItems.length = 0
}

function handleReverseCheck () {
  currentPageFilesInfo.forEach((item: any) => {
    item.checked = !item.checked
    if (item.checked) {
      selectedItems.push(item)
    } else {
      selectedItems.splice(selectedItems.findIndex((i: any) => i.fileName === item.fileName), 1)
    }
  })
}

function handleCheckChangeOther (item: any) {
  item.checked = !item.checked
  handleCheckChange(item)
}

function handleCheckChange (item: any) {
  if (item.checked) {
    if (lastChoosed.value !== -1 && isShiftKeyPress.value) {
      const index = currentPageFilesInfo.findIndex((i: any) => i.fileName === item.fileName)
      const start = Math.min(lastChoosed.value, index)
      const end = Math.max(lastChoosed.value, index)
      for (let i = start + 1; i <= end; i++) {
        currentPageFilesInfo[i].checked = true
        selectedItems.push(currentPageFilesInfo[i])
      }
      lastChoosed.value = index
    } else {
      lastChoosed.value = currentPageFilesInfo.findIndex((i: any) => i.fileName === item.fileName)
      selectedItems.push(item)
    }
  } else {
    selectedItems.splice(selectedItems.findIndex((i: any) => i.fileName === item.fileName), 1)
  }
}

async function handleFolderBatchDownload (item: any) {
  ElMessageBox.confirm($T('MANAGE_BUCKET_DOWNLOAD_FOLDER_BOX_TITLE'), $T('MANAGE_BUCKET_DOWNLOAD_FOLDER_BOX_TIP'), {
    confirmButtonText: $T('MANAGE_BUCKET_DOWNLOAD_FOLDER_BOX_CONFIRM'),
    cancelButtonText: $T('MANAGE_BUCKET_DOWNLOAD_FOLDER_BOX_CANCEL'),
    type: 'warning'
  }).then(async () => {
    const defaultDownloadPath = await ipcRenderer.invoke('getDefaultDownloadFolder')
    const param = {
      downloadPath: manageStore.config.settings.downloadDir ?? defaultDownloadPath,
      maxDownloadFileCount: manageStore.config.settings.maxDownloadFileCount ? manageStore.config.settings.maxDownloadFileCount : 5,
      fileArray: [] as any[]
    }
    cancelToken.value = uuidv4()
    const paramGet = {
      // tcyun
      bucketName: configMap.bucketName,
      bucketConfig: {
        Location: configMap.bucketConfig.Location
      },
      paging: paging.value,
      prefix: `/${item.key.replace(/\/+$/, '').replace(/^\/+/, '')}/`,
      marker: pagingMarker.value,
      itemsPerPage: itemsPerPage.value,
      customUrl: currentCustomUrl.value,
      currentPage: currentPage.value,
      cancelToken: cancelToken.value,
      cdnUrl: configMap.cdnUrl
    }
    isLoadingDownloadData.value = true
    const downloadFileTransferStore = useDownloadFileTransferStore()
    downloadFileTransferStore.resetDownloadFileTransferList()
    ipcRenderer.send('getBucketListRecursively', configMap.alias, paramGet)
    ipcRenderer.on(refreshDownloadFileTransferList, (evt: IpcRendererEvent, data) => {
      downloadFileTransferStore.refreshDownloadFileTransferList(data)
    })
    const interval = setInterval(() => {
      const currentFileList = downloadFileTransferStore.getDownloadFileTransferList()
      currentDownloadFileList.length = 0
      currentDownloadFileList.push(...currentFileList)
      if (downloadFileTransferStore.isFinished()) {
        clearInterval(interval)
        isLoadingDownloadData.value = false
        if (downloadFileTransferStore.isSuccess()) {
          ElNotification.success({
            title: $T('MANAGE_BUCKET_DOWNLOAD_FOLDER_BOX_TIP'),
            message: $T('MANAGE_BUCKET_DOWNLOAD_FOLDER_SUCCESS'),
            duration: 500
          })
          if (currentDownloadFileList.length) {
            currentDownloadFileList.forEach((item: any) => {
              param.fileArray.push({
                alias: configMap.alias,
                bucketName: configMap.bucketName,
                region: configMap.bucketConfig.Location,
                key: item.key,
                fileName: [undefined, true].includes(manageStore.config.settings.isDownloadFolderKeepDirStructure) ? `/${item.key.replace(/\/+$/, '').replace(/^\/+/, '')}` : item.fileName,
                customUrl: currentCustomUrl.value,
                downloadUrl: item.downloadUrl,
                githubUrl: item.url,
                githubPrivate: configMap.bucketConfig.private
              })
            })
          }
          ipcRenderer.send('downloadBucketFile', configMap.alias, param)
          isShowDownloadPanel.value = true
        } else {
          ElNotification.error({
            title: $T('MANAGE_BUCKET_DOWNLOAD_FOLDER_BOX_TIP'),
            message: $T('MANAGE_BUCKET_DOWNLOAD_FOLDER_FAIL'),
            duration: 500
          })
        }
        downloadFileTransferStore.resetDownloadFileTransferList()
      }
    }, 500)
  }).catch(() => {
    ElNotification.info({
      title: $T('MANAGE_BUCKET_DOWNLOAD_FOLDER_BOX_TIP'),
      message: $T('MANAGE_BUCKET_DOWNLOAD_FOLDER_CANCEL'),
      duration: 500
    })
  })
}

async function handleBatchDownload () {
  const defaultDownloadPath = await ipcRenderer.invoke('getDefaultDownloadFolder')
  const param = {
    downloadPath: manageStore.config.settings.downloadDir ?? defaultDownloadPath,
    maxDownloadFileCount: manageStore.config.settings.maxDownloadFileCount ? manageStore.config.settings.maxDownloadFileCount : 5,
    fileArray: [] as any[]
  }
  selectedItems.forEach((item: any) => {
    if (!item.isDir) {
      param.fileArray.push({
        alias: configMap.alias,
        bucketName: configMap.bucketName,
        region: configMap.bucketConfig.Location,
        key: item.key,
        fileName: manageStore.config.settings.isDownloadFileKeepDirStructure ? `/${item.key.replace(/\/+$/, '').replace(/^\/+/, '')}` : item.fileName,
        customUrl: currentCustomUrl.value,
        downloadUrl: item.downloadUrl,
        githubUrl: item.url,
        githubPrivate: configMap.bucketConfig.private
      })
    }
  })
  ipcRenderer.send('downloadBucketFile', configMap.alias, param)
  handleCancelCheck()
  isShowDownloadPanel.value = true
}

function handleCheckAllChange () {
  if (searchText.value === '') {
    if (selectedItems.length === currentPageFilesInfo.length) {
      selectedItems.length = 0
      currentPageFilesInfo.forEach((item: any) => {
        item.checked = false
      })
    } else {
      selectedItems.length = 0
      selectedItems.push(...currentPageFilesInfo)
      currentPageFilesInfo.forEach((item: any) => {
        item.checked = true
      })
    }
  } else {
    if (selectedItems.length === currentPageFilesInfo.filter((item: any) => item.match).length) {
      selectedItems.length = 0
      currentPageFilesInfo.forEach((item: any) => {
        item.checked = false
      })
    } else {
      selectedItems.length = 0
      currentPageFilesInfo.forEach((item: any) => {
        if (item.match) {
          item.checked = true
          selectedItems.push(item)
        }
      })
    }
  }
}

function handleCreateFolder () {
  ElMessageBox.prompt($T('MANAGE_BUCKET_CREATE_FOLDER_BOX_TITLE'), $T('MANAGE_BUCKET_CREATE_FOLDER_BOX_TIP'), {
    confirmButtonText: $T('MANAGE_BUCKET_CREATE_FOLDER_BOX_CONFIRM'),
    cancelButtonText: $T('MANAGE_BUCKET_CREATE_FOLDER_BOX_CANCEL'),
    inputPattern: /^[\u4e00-\u9fa5_a-zA-Z0-9/]+$/,
    inputErrorMessage: $T('MANAGE_BUCKET_CREATE_FOLDER_ERROR_MSG')
  }).then(async ({ value }) => {
    let formatedPath = value
    formatedPath = trimPath(formatedPath)
    const param = {
      // tcyun
      bucketName: configMap.bucketName,
      region: configMap.bucketConfig.Location,
      key: currentPrefix.value.slice(1) + formatedPath + '/',
      githubBranch: currentCustomUrl.value
    }
    const res = await ipcRenderer.invoke('createBucketFolder', configMap.alias, param)
    if (res) {
      ElMessage.success($T('MANAGE_BUCKET_CREATE_FOLDER_SUCCESS'))
    } else {
      ElMessage.error($T('MANAGE_BUCKET_CREATE_FOLDER_FAIL'))
    }
  }).catch(() => {})
}

const showUrlDialog = () => {
  dialogVisible.value = true
}

async function handleUploadFromUrl () {
  dialogVisible.value = false
  const urlList = [] as string[]
  urlToUpload.value.split('\n').forEach((item: string) => {
    if (item.trim() !== '' && isValidUrl(item.trim())) {
      urlList.push(item.trim())
    }
  })
  if (urlList.length === 0) {
    ElMessage.warning($T('MANAGE_BUCKET_UPLOAD_URL_ERROR_MSQ'))
    return
  }
  ElNotification({
    title: $T('MANAGE_BUCKET_UPLOAD_URL_NOT_TITLE'),
    message: $T('MANAGE_BUCKET_UPLOAD_URL_NOT_MSG'),
    type: 'success',
    duration: 1000
  })
  const res = await ipcRenderer.invoke('downloadFileFromUrl', urlList)
  for (let i = 0; i < res.length; i++) {
    const fPath = res[i].replace(/\\/g, '/')
    uploadPanelFilesList.value.push({
      name: path.basename(fPath),
      path: fPath,
      size: fs.statSync(fPath).size
    })
  }
  uploadFiles()
  isShowUploadPanel.value = true
}

function handleBatchRenameFile () {
  batchRenameMatch.value = ''
  isSingleRename.value = false
  isShowBatchRenameDialog.value = true
}

async function BatchRename () {
  isShowBatchRenameDialog.value = false
  if (batchRenameMatch.value === '') {
    ElMessage.warning($T('MANAGE_BUCKET_BATCH_RENAME_ERROR_MSG'))
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
    ElMessage.warning($T('MANAGE_BUCKET_BATCH_RENAME_ERROR_MSG2'))
    return
  }
  for (let i = 0; i < matchedFiles.length; i++) {
    if (isRenameIncludeExt.value) {
      matchedFiles[i].newName = customStrReplace(matchedFiles[i].fileName, batchRenameMatch.value, batchRenameReplace.value)
    } else {
      matchedFiles[i].newName = customStrReplace(matchedFiles[i].fileName.split('.')[0], batchRenameMatch.value, batchRenameReplace.value) + '.' + matchedFiles[i].fileName.split('.')[1]
    }
  }
  matchedFiles = matchedFiles.filter((item: any) => item.fileName !== item.newName)
  if (matchedFiles.length === 0) {
    ElMessage.warning($T('MANAGE_BUCKET_BATCH_RENAME_ERROR_MSG3'))
    return
  }
  for (let i = 0; i < matchedFiles.length; i++) {
    matchedFiles[i].newName = matchedFiles[i].newName.replaceAll('{auto}', (i + 1).toString())
  }
  const duplicateFilesNum = matchedFiles.filter((item: any) => matchedFiles.filter((item2: any) => item2.newName === item.newName).length > 1).length
  let successCount = 0
  let failCount = 0
  const error = new Error('error')
  const renamefunc = (item:any) => {
    return new Promise((resolve, reject) => {
      const param = {
        // tcyun
        bucketName: configMap.bucketName,
        region: configMap.bucketConfig.Location,
        oldKey: item.key,
        newKey: (item.key.slice(0, item.key.lastIndexOf('/') + 1) + item.newName).replaceAll('//', '/'),
        customUrl: currentCustomUrl.value
      }
      ipcRenderer.invoke('renameBucketFile', configMap.alias, param).then((res: any) => {
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
          item.url = `${currentCustomUrl.value}${currentPrefix.value}${item.newName}`
          item.formatedTime = new Date().toLocaleString()
          if (!paging.value) {
            const table = fileCacheDbInstance.table(currentPicBedName.value)
            table.where('key').equals(getTableKeyOfDb()).modify((l: any) => {
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
                  i.url = `${currentCustomUrl.value}${currentPrefix.value}${item.newName}`
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
    ElMessageBox.confirm(`${$T('MANAGE_BUCKET_BATCH_RENAME_REPEATED_MSG_A')} ${duplicateFilesNum} ${$T('MANAGE_BUCKET_BATCH_RENAME_REPEATED_MSG_B')}`, $T('MANAGE_BUCKET_BATCH_RENAME_REPEATED_MSG_C'), {
      confirmButtonText: $T('MANAGE_BUCKET_BATCH_RENAME_REPEATED_CONFIRM'),
      cancelButtonText: $T('MANAGE_BUCKET_BATCH_RENAME_REPEATED_CANCEL'),
      type: 'warning'
    }).then(() => {
      const promiseList = [] as any[]
      for (let i = 0; i < matchedFiles.length; i++) {
        promiseList.push(renamefunc(matchedFiles[i]))
      }
      Promise.allSettled(promiseList).then(() => {
        ElMessage.success(`${$T('MANAGE_BUCKET_BATCH_RENAME_RESULT_MSG_A')} ${successCount},${$T('MANAGE_BUCKET_BATCH_RENAME_RESULT_MSG_B')} ${failCount}`)
      })
    }).catch(() => {
      ElMessage.info($T('MANAGE_BUCKET_BATCH_RENAME_CANCEL'))
    })
  } else {
    const promiseList = [] as any[]
    for (let i = 0; i < matchedFiles.length; i++) {
      promiseList.push(renamefunc(matchedFiles[i]))
    }
    Promise.allSettled(promiseList).then(() => {
      ElMessage.success(`${$T('MANAGE_BUCKET_BATCH_RENAME_RESULT_MSG_A')} ${successCount},${$T('MANAGE_BUCKET_BATCH_RENAME_RESULT_MSG_B')} ${failCount}`)
    })
  }
}

function handleBatchCopyInfo () {
  if (selectedItems.length === 0) {
    ElMessage.warning($T('MANAGE_BUCKET_BATCH_COPY_INFO_ERROR_MSG'))
    return
  }
  const result = {} as IStringKeyMap
  selectedItems.forEach((item: any) => {
    result[item.fileName] = item
  })
  clipboard.writeText(JSON.stringify(result, null, 2))
  ElMessage.success(`${$T('MANAGE_BUCKET_BATCH_COPY_INFO_MSG_A')} ${selectedItems.length} ${$T('MANAGE_BUCKET_BATCH_COPY_INFO_MSG_B')}`)
}

function handleBatchCopyLink (type: string) {
  if (selectedItems.length === 0) {
    ElMessage.warning($T('MANAGE_BUCKET_BATCH_COPY_URL_ERROR_MSG'))
    return
  }
  const result = [] as string[]
  selectedItems.forEach((item: any) => {
    if (!item.isDir) {
      if (type !== 'preSignedUrl') {
        result.push(formatLink(item.url, item.fileName, type, manageStore.config.settings.customPasteFormat))
      } else {
        getPreSignedUrl(item).then((url: string) => {
          result.push(formatLink(url, item.fileName, type, manageStore.config.settings.customPasteFormat))
        }).then(() => {
          if (result.length === selectedItems.length) {
            clipboard.writeText(result.join('\n'))
            ElMessage.success(`${$T('MANAGE_BUCKET_BATCH_COPY_URL_MSG_A')} ${result.length} ${$T('MANAGE_BUCKET_BATCH_COPY_URL_MSG_B')}`)
          }
        })
      }
    }
  })
  if (type !== 'preSignedUrl') {
    clipboard.writeText(result.join('\n'))
    ElMessage.success(`${$T('MANAGE_BUCKET_BATCH_COPY_URL_MSG_A')} ${result.length} ${$T('MANAGE_BUCKET_BATCH_COPY_URL_MSG_B')}`)
  }
}

function cancelLoading () {
  ElMessageBox.confirm($T('MANAGE_BUCKET_CANCEL_LOADING_TITLE'), $T('MANAGE_BUCKET_CANCEL_LOADING_MSG'), {
    confirmButtonText: $T('MANAGE_BUCKET_CANCEL_LOADING_CONFIRM'),
    cancelButtonText: $T('MANAGE_BUCKET_CANCEL_LOADING_CANCEL'),
    type: 'warning'
  }).then(() => {
    isLoadingData.value = false
    ipcRenderer.send('cancelLoadingFileList', cancelToken.value)
    ElMessage.success($T('MANAGE_BUCKET_CANCEL_LOADING_SUCCESS'))
  }).catch(() => { })
}

function cancelDownloadLoading () {
  ElMessageBox.confirm($T('MANAGE_BUCKET_CANCEL_DOWNLOAD_LOADING_TITLE'), $T('MANAGE_BUCKET_CANCEL_DOWNLOAD_LOADING_MSG'), {
    confirmButtonText: $T('MANAGE_BUCKET_CANCEL_DOWNLOAD_LOADING_CONFIRM'),
    cancelButtonText: $T('MANAGE_BUCKET_CANCEL_DOWNLOAD_LOADING_CANCEL'),
    type: 'warning'
  }).then(() => {
    isLoadingData.value = false
    ipcRenderer.send(cancelDownloadLoadingFileList, downloadCancelToken.value)
    ElMessage.success($T('MANAGE_BUCKET_CANCEL_DOWNLOAD_LOADING_SUCCESS'))
  }).catch(() => { })
}

async function getBucketFileListBackStage () {
  cancelToken.value = uuidv4()
  const param = {
    // tcyun
    bucketName: configMap.bucketName,
    bucketConfig: {
      Location: configMap.bucketConfig.Location
    },
    paging: paging.value,
    prefix: currentPrefix.value,
    marker: pagingMarker.value,
    itemsPerPage: itemsPerPage.value,
    customUrl: currentCustomUrl.value,
    currentPage: currentPage.value,
    cancelToken: cancelToken.value,
    cdnUrl: configMap.cdnUrl
  }
  isLoadingData.value = true
  const fileTransferStore = useFileTransferStore()
  fileTransferStore.resetFileTransferList()
  ipcRenderer.send('getBucketListBackstage', configMap.alias, param)
  ipcRenderer.on('refreshFileTransferList', (evt: IpcRendererEvent, data) => {
    fileTransferStore.refreshFileTransferList(data)
  })
  const interval = setInterval(() => {
    const currentFileList = fileTransferStore.getFileTransferList()
    currentFileList.sort((a: any, b: any) => {
      if (a.isDir && !b.isDir) {
        return -1
      } else if (!a.isDir && b.isDir) {
        return 1
      } else {
        return a.fileName.localeCompare(b.fileName)
      }
    })
    currentPageFilesInfo.length = 0
    currentPageFilesInfo.push(...currentFileList)
    const table = fileCacheDbInstance.table(currentPicBedName.value)
    table.put({
      key: getTableKeyOfDb(),
      value: JSON.parse(JSON.stringify({
        fullList: currentPageFilesInfo
      }))
    })
    if (fileTransferStore.isFinished()) {
      clearInterval(interval)
      isLoadingData.value = false
      if (fileTransferStore.isSuccess()) {
        ElNotification.success({
          title: $T('MANAGE_BUCKET_GET_FILE_BS_NOT_TITLE'),
          message: $T('MANAGE_BUCKET_GET_FILE_BS_NOT_MSG'),
          duration: 500
        })
      } else {
        ElNotification.error({
          title: $T('MANAGE_BUCKET_GET_FILE_BS_NOT_TITLE'),
          message: $T('MANAGE_BUCKET_GET_FILE_BS_NOT_MSG2'),
          duration: 500
        })
      }
      fileTransferStore.resetFileTransferList()
    }
  }, 1000)
}

async function getBucketFileList () {
  const param = {
    // tcyun
    bucketName: configMap.bucketName,
    bucketConfig: {
      Location: configMap.bucketConfig.Location
    },
    paging: paging.value,
    prefix: currentPrefix.value,
    marker: pagingMarker.value,
    itemsPerPage: itemsPerPage.value,
    customUrl: currentCustomUrl.value,
    currentPage: currentPage.value
  }
  const res = await ipcRenderer.invoke('getBucketFileList', configMap.alias, param)
  return res
}

function handleBatchDeleteInfo () {
  ElMessageBox.confirm(`${$T('MANAGE_BUCKET_BATCH_DELETE_CONFIRM_TITLE_A')} ${selectedItems.length} ${$T('MANAGE_BUCKET_BATCH_DELETE_CONFIRM_TITLE_B')}`, $T('MANAGE_BUCKET_BATCH_DELETE_CONFIRM_MSG'), {
    confirmButtonText: $T('MANAGE_BUCKET_BATCH_DELETE_CONFIRM_CONFIRM'),
    cancelButtonText: $T('MANAGE_BUCKET_BATCH_DELETE_CONFIRM_CANCEL'),
    type: 'warning',
    center: true,
    draggable: true
  }).then(async () => {
    const copyedSelectedItems = JSON.parse(JSON.stringify(selectedItems))
    let successCount = 0
    let failCount = 0
    let res = false
    for (let i = 0; i < copyedSelectedItems.length; i++) {
      if (!copyedSelectedItems[i].isDir) {
        const param = {
          // tcyun
          bucketName: configMap.bucketName,
          region: configMap.bucketConfig.Location,
          key: copyedSelectedItems[i].key,
          DeleteHash: copyedSelectedItems[i].sha,
          githubBranch: currentCustomUrl.value
        }
        res = await ipcRenderer.invoke('deleteBucketFile', configMap.alias, param)
      } else {
        const param = {
          // tcyun
          bucketName: configMap.bucketName,
          region: configMap.bucketConfig.Location,
          key: copyedSelectedItems[i].key,
          githubBranch: currentCustomUrl.value,
          DeleteHash: copyedSelectedItems[i].sha
        }
        res = await ipcRenderer.invoke('deleteBucketFolder', configMap.alias, param)
      }
      if (res) {
        successCount++
        currentPageFilesInfo.splice(currentPageFilesInfo.findIndex((j: any) => j.key === copyedSelectedItems[i].key), 1)
        selectedItems.splice(selectedItems.findIndex((j: any) => j.key === copyedSelectedItems[i].key), 1)
        if (!paging.value) {
          const table = fileCacheDbInstance.table(currentPicBedName.value)
          table.where('key').equals(getTableKeyOfDb()).modify((l: any) => {
            l.value.fullList.splice(l.value.fullList.findIndex((j: any) => j.key === copyedSelectedItems[i].key), 1)
          })
        }
      } else {
        failCount++
      }
    }
    if (successCount === 0) {
      ElNotification.error({
        title: $T('MANAGE_BUCKET_BATCH_DELETE_ERROR_MSG_TITLE'),
        message: $T('MANAGE_BUCKET_BATCH_DELETE_ERROR_MSG_MSG'),
        duration: 1000
      })
    } else if (failCount === 0) {
      ElNotification.success({
        title: $T('MANAGE_BUCKET_BATCH_DELETE_ERROR_MSG_TITLE'),
        message: $T('MANAGE_BUCKET_BATCH_DELETE_ERROR_MSG_MSG2'),
        duration: 1000
      })
    } else {
      ElNotification.warning({
        title: $T('MANAGE_BUCKET_BATCH_DELETE_ERROR_MSG_TITLE'),
        message: `${$T('MANAGE_BUCKET_BATCH_DELETE_ERROR_MSG_MSG2')} ${successCount}, ${$T('MANAGE_BUCKET_BATCH_DELETE_ERROR_MSG_MSG3')} ${failCount}`,
        duration: 1000
      })
    }
  }).catch(() => {
    ElMessage.info($T('MANAGE_BUCKET_BATCH_DELETE_CANCEL'))
  })
}

function handleDeleteFile (item: any) {
  ElMessageBox.confirm(`${$T('MANAGE_BUCKET_DELETE_CONFIRM_TITLE')} ${item.isDir ? $T('MANAGE_BUCKET_DELETE_CONFIRM_TITLE_FOLDER') : $T('MANAGE_BUCKET_DELETE_CONFIRM_TITLE_FILE')} ${item.fileName} ${item.isDir ? $T('MANAGE_BUCKET_DELETE_CONFIRM_TITLE_FOLDER_A') : ''}, ${$T('MANAGE_BUCKET_DELETE_CONFIRM_TITLE_C')}`, $T('MANAGE_BUCKET_DELETE_CONFIRM_MSG'), {
    confirmButtonText: $T('MANAGE_BUCKET_DELETE_CONFIRM_CONFIRM'),
    cancelButtonText: $T('MANAGE_BUCKET_DELETE_CONFIRM_CANCEL'),
    type: 'warning',
    center: true,
    draggable: true
  }).then(async () => {
    let res = false
    if (!item.isDir) {
      const param = {
        // tcyun
        bucketName: configMap.bucketName,
        region: configMap.bucketConfig.Location,
        key: item.key,
        DeleteHash: item.sha,
        githubBranch: currentCustomUrl.value
      }
      res = await ipcRenderer.invoke('deleteBucketFile', configMap.alias, param)
    } else {
      const param = {
        // tcyun
        bucketName: configMap.bucketName,
        region: configMap.bucketConfig.Location,
        key: item.key,
        DeleteHash: item.sha,
        githubBranch: currentCustomUrl.value
      }
      ElNotification.info({
        title: $T('MANAGE_BUCKET_DELETE_ERROR_MSG_TITLE'),
        message: $T('MANAGE_BUCKET_DELETE_ERROR_MSG_MSG'),
        duration: 1000
      })
      res = await ipcRenderer.invoke('deleteBucketFolder', configMap.alias, param)
    }
    if (res) {
      ElMessage.success($T('MANAGE_BUCKET_DELETE_SUCCESS'))
      currentPageFilesInfo.splice(currentPageFilesInfo.findIndex((i: any) => i.key === item.key), 1)
      selectedItems.splice(selectedItems.findIndex((i: any) => i.key === item.key), 1)
      if (!paging.value) {
        const table = fileCacheDbInstance.table(currentPicBedName.value)
        table.where('key').equals(getTableKeyOfDb()).modify((l: any) => {
          l.value.fullList.splice(l.value.fullList.findIndex((i: any) => i.key === item.key), 1)
        })
      }
    } else {
      ElMessage.error($T('MANAGE_BUCKET_DELETE_FAIL'))
    }
  }).catch(() => {
    ElMessage.info($T('MANAGE_BUCKET_DELETE_CANCEL'))
  })
}

function handleRenameFile (item: any) {
  batchRenameMatch.value = path.basename(item.fileName, path.extname(item.fileName))
  isSingleRename.value = true
  isShowBatchRenameDialog.value = true
  itemToBeRenamed.value = item
}

function singleRename () {
  const index = currentPageFilesInfo.findIndex((i: any) => i === itemToBeRenamed.value)
  isShowBatchRenameDialog.value = false
  if (batchRenameMatch.value === '') {
    batchRenameMatch.value = '.+'
  }
  if (isRenameIncludeExt.value) {
    itemToBeRenamed.value.newName = customStrReplace(itemToBeRenamed.value.fileName, batchRenameMatch.value, batchRenameReplace.value)
  } else {
    itemToBeRenamed.value.newName = customStrReplace(itemToBeRenamed.value.fileName.split('.')[0], batchRenameMatch.value, batchRenameReplace.value) + '.' + itemToBeRenamed.value.fileName.split('.')[1]
  }
  if (itemToBeRenamed.value.newName === itemToBeRenamed.value.fileName) {
    ElMessage.info($T('MANAGE_BUCKET_RENAME_INFO_MSG'))
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
    customUrl: currentCustomUrl.value
  }
  ipcRenderer.invoke('renameBucketFile', configMap.alias, param).then((res: any) => {
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
      item.key = (item.key.slice(0, item.key.lastIndexOf('/') + 1) + itemToBeRenamed.value.newName).replaceAll('//', '/')
      item.url = `${currentCustomUrl.value}${currentPrefix.value}${itemToBeRenamed.value.newName}`
      item.formatedTime = new Date().toLocaleString()
      if (!paging.value) {
        const table = fileCacheDbInstance.table(currentPicBedName.value)
        table.where('key').equals(getTableKeyOfDb()).modify((l: any) => {
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
              i.key = (i.key.slice(0, i.key.lastIndexOf('/') + 1) + itemToBeRenamed.value.newName).replaceAll('//', '/')
              i.url = `${currentCustomUrl.value}${currentPrefix.value}${itemToBeRenamed.value.newName}`
              i.formatedTime = new Date().toLocaleString()
            }
          })
        })
      }
    } else {
      ElMessage.error($T('MANAGE_BUCKET_RENAME_ERROR_MSG'))
    }
  }
  )
}

async function getPreSignedUrl (item: any) {
  const param = {
    // tcyun
    bucketName: configMap.bucketName,
    region: configMap.bucketConfig.Location,
    key: item.key,
    customUrl: currentCustomUrl.value,
    expires: manageStore.config.settings.PreSignedExpire,
    githubPrivate: configMap.bucketConfig.private,
    rawUrl: item.url
  }
  const res = await ipcRenderer.invoke('getPreSignedUrl', configMap.alias, param)
  return res
}

function copyToClipboard (text: string) {
  clipboard.writeText(text)
  ElMessage.success($T('MANAGE_BUCKET_COPY_SUCCESS'))
}

function getTableKeyOfDb () {
  let tableKey
  if (currentPicBedName.value === 'github') {
    // customUrl is branch
    tableKey = `${configMap.alias}@${configMap.bucketConfig.githubUsername}@${configMap.bucketName}@${currentCustomUrl.value}@${currentPrefix.value}`
  } else {
    tableKey = `${configMap.alias}@${configMap.bucketName}@${currentPrefix.value}`
  }
  return tableKey
}

async function searchExistFileList () {
  const table = fileCacheDbInstance.table(currentPicBedName.value)
  const res = await table.where('key').equals(getTableKeyOfDb()).toArray()
  return res
}

function handleDetectShiftKey (event: KeyboardEvent) {
  if (event.key === 'Shift') {
    if (event.type === 'keydown') {
      isShiftKeyPress.value = true
    } else if (event.type === 'keyup') {
      isShiftKeyPress.value = false
    }
  }
}

const downloadedTaskColumns: Column<any>[] = [
  {
    key: 'name',
    title: $T('MANAGE_BUCKET_DOWNLOAD_COLUMN_FILENAME'),
    dataKey: 'sourceFileName',
    width: 300,
    cellRenderer: ({ rowData: item }) => (
      <div
        onClick={() => {
          ipcRenderer.send('OpenLocalFile', item.targetFilePath)
        }
        }
      >
        <ElTooltip
          effect="dark"
          content={item.sourceFileName}
          placement="top"
        >
          <ElLink
            style="color: black;font-size: 14px;font-family: Arial, Helvetica, sans-serif;"
          >{formatFileName(item.sourceFileName)}
          </ElLink>
        </ElTooltip>
      </div>
    )
  },
  {
    key: 'finishTime',
    title: $T('MANAGE_BUCKET_DOWNLOAD_COLUMN_FINISHTIME'),
    dataKey: 'finishTime',
    width: 200,
    cellRenderer: ({ rowData: item }) => (
      <span
        style="color: black;font-size: 14px;font-family: Arial, Helvetica, sans-serif;"
      >{item.finishTime}
      </span>
    )
  },
  {
    key: 'status',
    title: $T('MANAGE_BUCKET_DOWNLOAD_COLUMN_STATUS'),
    width: 100,
    cellRenderer: ({ rowData: item }) => (
      item.status === 'downloaded'
        ? (
          <ElTag
            type="success"
            style="font-size: 14px;font-family: Arial, Helvetica, sans-serif;"
          >
            {$T('MANAGE_BUCKET_DOWNLOAD_COLUMN_STATUS_SUCCESS')}
          </ElTag>
        )
        : (
          <ElTag
            type="danger"
            style="font-size: 14px;font-family: Arial, Helvetica, sans-serif;"
          >
            {$T('MANAGE_BUCKET_DOWNLOAD_COLUMN_STATUS_FAIL')}
          </ElTag>
        )
    )
  }
]

const uploadedTaskColumns: Column<any>[] = [
  {
    key: 'name',
    title: $T('MANAGE_BUCKET_UPLOAD_COLUMN_FILENAME'),
    dataKey: 'sourceFileName',
    width: 300,
    cellRenderer: ({ rowData: item }) => (
      <ElTooltip
        effect="dark"
        content={item.sourceFileName}
        placement="top"
      >
        <span
          style="color: black;font-size: 14px;font-family: Arial, Helvetica, sans-serif;"
        >{formatFileName(item.sourceFileName)}
        </span>
      </ElTooltip>
    )
  },
  {
    key: 'targetFilePath',
    title: $T('MANAGE_BUCKET_UPLOAD_COLUMN_TARGETFILEPATH'),
    dataKey: 'targetFilePath',
    width: 300,
    cellRenderer: ({ rowData: item }) => (
      <ElTooltip
        effect="dark"
        content={item.targetFilePath}
        placement="top"
      >
        <span
          style="color: black;font-size: 14px;font-family: Arial, Helvetica, sans-serif;"
        >{formatFileName(item.targetFilePath)}
        </span>
      </ElTooltip>
    )
  },
  {
    key: 'finishTime',
    title: $T('MANAGE_BUCKET_UPLOAD_COLUMN_FINISHTIME'),
    dataKey: 'finishTime',
    width: 200,
    cellRenderer: ({ rowData: item }) => (
      <span
        style="color: black;font-size: 14px;font-family: Arial, Helvetica, sans-serif;"
      >{item.finishTime}
      </span>
    )
  },
  {
    key: 'status',
    title: $T('MANAGE_BUCKET_UPLOAD_COLUMN_STATUS'),
    width: 100,
    cellRenderer: ({ rowData: item }) => (
      item.status === 'uploaded'
        ? (
          <ElTag
            type="success"
            style="font-size: 14px;font-family: Arial, Helvetica, sans-serif;"
          >
            {$T('MANAGE_BUCKET_UPLOAD_COLUMN_STATUS_SUCCESS')}
          </ElTag>
        )
        : (
          <ElTag
            type="danger"
            style="font-size: 14px;font-family: Arial, Helvetica, sans-serif;"
          >
            {$T('MANAGE_BUCKET_UPLOAD_COLUMN_STATUS_FAIL')}
          </ElTag>
        )
    )
  }
]

const downloadingTaskColumns: Column<any>[] = [
  {
    key: 'name',
    title: $T('MANAGE_BUCKET_DOWNLOADING_COLUMN_FILENAME'),
    dataKey: 'sourceFileName',
    width: 300,
    cellRenderer: ({ rowData: item }) => (
      <span
        style="color: black;font-size: 14px;font-family: Arial, Helvetica, sans-serif;"
      >{formatFileName(item.sourceFileName)}
      </span>
    )
  },
  {
    key: 'progress',
    title: $T('MANAGE_BUCKET_DOWNLOADING_COLUMN_PROGRESS'),
    dataKey: 'progress',
    width: 300,
    cellRenderer: ({ rowData: item }) => (
      <ElProgress
        percentage={item.progress}
        status="success"
        strokeWidth={20}
        textInside
        style="width: 100%;"
      />
    )
  }
]

const uploadingTaskColumns: Column<any>[] = [
  {
    key: 'name',
    title: $T('MANAGE_BUCKET_UPLOADING_COLUMN_FILENAME'),
    dataKey: 'sourceFileName',
    width: 300,
    cellRenderer: ({ rowData: item }) => (
      <span
        style="color: black;font-size: 14px;font-family: Arial, Helvetica, sans-serif;"
      >{formatFileName(item.sourceFileName)}
      </span>
    )
  },
  {
    key: 'progress',
    title: $T('MANAGE_BUCKET_UPLOADING_COLUMN_PROGRESS'),
    dataKey: 'progress',
    width: 300,
    cellRenderer: ({ rowData: item }) => (
      <ElProgress
        percentage={item.progress ? item.progress : 50}
        status="success"
        strokeWidth={20}
        textInside
        style="width: 100%;"
        indeterminate={!!item.noProgress}
      />
    )
  }
]

const upLoadTaskColumns: Column<any>[] = [
  {
    key: 'name',
    title: $T('MANAGE_BUCKET_UPLOADED_COLUMN_FILENAME'),
    dataKey: 'name',
    width: 300,
    cellRenderer: ({ rowData: item }) => (
      item.isFolder
        ? <span>
          <ElIcon
            color="#409EFF"
            style="position: relative;left: -5px;"
          >
            <FolderOpened />
          </ElIcon>
          <span
            style="font-weight: bold;color: black;font-size: 14px;font-family: Arial, Helvetica, sans-serif;"
          >{formatFileName(item.name)}</span>
        </span>
        : <span>
          <ElIcon
            color="#409EFF"
          >
            <Document />
          </ElIcon>
          <span
            style="color: black;font-size: 14px;font-family: Arial, Helvetica, sans-serif;"
          >{formatFileName(item.name)}</span>
        </span>
    )
  },
  {
    key: 'fileSize',
    title: $T('MANAGE_BUCKET_UPLOADED_COLUMN_FILESIZE'),
    dataKey: 'fileSize',
    width: 100,
    cellRenderer: ({ rowData: item }) => (
      <span
        style="color: black;font-size: 14px;font-family: Arial, Helvetica, sans-serif;"
      >{formatFileSize(item.fileSize)}</span>
    )
  },
  {
    key: 'fileNumber',
    title: $T('MANAGE_BUCKET_UPLOADED_COLUMN_FILENUM'),
    width: 100,
    cellRenderer: ({ rowData: item }) => (
      !item.isFolder
        ? <template></template>
        : <span
          style="color: black;font-size: 14px;font-family: Arial, Helvetica, sans-serif;"
        >{item.filesList.length}</span>
    )
  }
]

const rowClass = ({ rowData }: Parameters<RowClassNameGetter<any>>[0]) => rowData.checked ? 'file-list-row-checked' : ''

const columns: Column<any>[] = [
  {
    key: 'checked',
    title: '',
    dataKey: 'checked',
    width: 30,
    cellRenderer: ({ rowData: item }) => (
      item.match || !searchText.value
        ? <ElCheckbox
          v-model={item.checked}
          onChange={() => handleCheckChange(item)}
        >
        </ElCheckbox>
        : <template></template>
    )
  },
  {
    key: 'icon',
    title: '',
    width: 30,
    cellRenderer: ({ rowData: item }) => (
      item.match || !searchText.value
        ? <ElPopover
          trigger="hover"
          width="200"
          disabled={!item.isImage}
          placement="right"
        >
          {{
            reference: () => (
              !item.isDir
                ? <ElImage
                  src={isShowThumbnail.value ? item.isImage ? item.url : require(`./assets/icons/${getFileIconPath(item.fileName ?? '')}`) : require(`./assets/icons/${getFileIconPath(item.fileName ?? '')}`)}
                  fit="contain"
                  style={{ width: '20px', height: '20px' }}
                >
                  {{
                    placeholder: () => <ElIcon>
                      <Loading />
                    </ElIcon>,
                    error: () =>
                      <ElImage
                        src={require(`./assets/icons/${getFileIconPath(item.fileName ?? '')}`)}
                        fit="contain"
                        style={{ width: '20px', height: '20px' }}
                      />
                  }}
                </ElImage>
                : <ElImage
                  src={require('./assets/icons/folder.webp')}
                  fit="contain"
                  style={{ width: '20px', height: '20px' }}
                />
            ),
            default: () => (
              <ElImage
                src={item.url}
                fit="contain"
              >
                {{
                  placeholder: () => (<ElIcon>
                    <Loading />
                  </ElIcon>
                  ),
                  error: () => (
                    <ElIcon>
                      <CircleClose />
                    </ElIcon>
                  )
                }}
              </ElImage>
            )
          }}
        </ElPopover>
        : <template></template>
    )
  },
  {
    key: 'fileName',
    title: $T('MANAGE_BUCKET_FILE_COLUMN_FILENAME'),
    dataKey: 'fileName',
    width: 300,
    cellRenderer: ({ cellData: fileName, rowData: item }) => (
      item.match || !searchText.value
        ? <div
          onClick={() => handleClickFile(item)}
        >
          <ElTooltip
            placement="top"
            content={fileName}
          >
            <div
              style="font-size: 14px;color: #303133;font-family: Arial, Helvetica, sans-serif;"
            >
              {formatFileName(item.fileName ?? '')}
            </div>
          </ElTooltip>
        </div>
        : <template></template>
    )
  },
  {
    key: 'rename',
    title: '',
    width: 30,
    cellRenderer: ({ rowData: item }) => (
      item.match || !searchText.value
        ? item.isDir || !showRenameFileIcon.value
          ? item.isDir
            ? <ElIcon
              size="20"
              style="cursor: pointer;"
              color="#409EFF"
              onClick={() => handleFolderBatchDownload(item)}
            >
              <Download />
            </ElIcon>
            : <template></template>
          : <ElIcon
            size="20"
            style="cursor: pointer;"
            color="#409EFF"
            onClick={() => handleRenameFile(item)}
          >
            <Edit />
          </ElIcon>
        : <template></template>
    )
  },
  {
    key: 'copy',
    title: '',
    width: 30,
    cellRenderer: ({ rowData: item }) => (
      item.match || !searchText.value
        ? <ElTooltip
          placement="top"
          content={$T('MANAGE_BUCKET_FILE_COLUMN_COPY_URL')}
          effect='light'
          hide-after={150}
        >
          <ElDropdown>
            {{
              default: () => (
                <ElIcon
                  size="20"
                  style="cursor: pointer;"
                  color="#409EFF"
                  onClick={() => copyToClipboard(formatLink(item.url, item.fileName, manageStore.config.settings.pasteFormat ?? '$markdown', manageStore.config.settings.customPasteFormat ?? '$url'))}
                >
                  <CopyDocument />
                </ElIcon>
              ),
              dropdown: () => (
                <ElDropdownMenu>
                  <ElDropdownItem
                    onClick={() => copyToClipboard(formatLink(item.url, item.fileName, 'url'))}
                  >
                    Url
                  </ElDropdownItem>
                  <ElDropdownItem
                    onClick={() => copyToClipboard(formatLink(item.url, item.fileName, 'markdown'))}
                  >
                    Markdown
                  </ElDropdownItem>
                  <ElDropdownItem
                    onClick={() => copyToClipboard(formatLink(item.url, item.fileName, 'markdown-with-link'))}
                  >
                    Markdown-link
                  </ElDropdownItem>
                  <ElDropdownItem
                    onClick={() => copyToClipboard(formatLink(item.url, item.fileName, 'html'))}
                  >
                    Html
                  </ElDropdownItem>
                  <ElDropdownItem
                    onClick={() => copyToClipboard(formatLink(item.url, item.fileName, 'bbcode'))}
                  >
                    BBCode
                  </ElDropdownItem>
                  <ElDropdownItem
                    onClick={() => copyToClipboard(formatLink(item.url, item.fileName, 'custom', manageStore.config.settings.customPasteFormat))}
                  >
                    Custom
                  </ElDropdownItem>
                  { showPresignedUrl.value
                    ? <ElDropdownItem
                      onClick={async () => {
                        const res = await getPreSignedUrl(item)
                        copyToClipboard(res)
                      }}
                    >
                    preSignURL
                    </ElDropdownItem>
                    : <template></template>}
                </ElDropdownMenu>
              )
            }}
          </ElDropdown>
        </ElTooltip>
        : <template></template>
    )
  },
  {
    key: 'info',
    title: '',
    width: 30,
    cellRenderer: ({ rowData: item }) => (
      item.match || !searchText.value
        ? <ElTooltip
          placement="top"
          content={$T('MANAGE_BUCKET_FILE_COLUMN_INFO')}
          effect='light'
          hide-after={150}
        >
          <ElIcon
            size="20"
            style="cursor: pointer;"
            color="#409EFF"
            onClick={() => handleShowFileInfo(item)}
          >
            <Document />
          </ElIcon>
        </ElTooltip>
        : <template></template>
    )
  },
  {
    key: 'placeholder',
    title: '',
    width: 30,
    cellRenderer: ({ rowData: item }) => (
      item.match || !searchText.value
        ? <span></span>
        : <template></template>
    )
  },
  {
    key: 'fileSize',
    title: $T('MANAGE_BUCKET_FILE_COLUMN_FILESIZE'),
    width: 100,
    dataKey: 'fileSize',
    cellRenderer: ({ cellData: fileSize, rowData: item }) => (
      item.match || !searchText.value
        ? <div
          style="font-size: 14px;color: #303133;font-family: Arial, Helvetica, sans-serif;height: 100%;display: flex;align-items: center;"
          onClick={() => handleCheckChangeOther(item)}
        >
          {formatFileSize(fileSize)}
        </div>
        : <template></template>
    )
  },
  {
    key: 'formatedTime',
    title: $T('MANAGE_BUCKET_FILE_COLUMN_TIME'),
    width: 200,
    dataKey: 'formatedTime',
    cellRenderer: ({ cellData: formatedTime, rowData: item }) => (
      item.match || !searchText.value
        ? <div
          style="font-size: 14px;color: #303133;font-family: Arial, Helvetica, sans-serif;height: 100%;display: flex;align-items: center;"
          onClick={() => handleCheckChangeOther(item)}
        >
          {formatedTime}
        </div>
        : <template></template>
    )
  },
  {
    key: 'delete',
    title: '',
    width: 30,
    cellRenderer: ({ rowData: item }) => (
      item.match || !searchText.value
        ? <ElIcon
          style="cursor: pointer;"
          color="red"
          onClick={() => handleDeleteFile(item)}
        >
          <DeleteFilled />
        </ElIcon>
        : <template></template>
    )
  }
]

onBeforeMount(async () => {
  console.log('onBeforeMount')
  await manageStore.refreshConfig()
  showLoadingPage.value = true
  await initCustomUrlList()
  await resetParam(false)
  showLoadingPage.value = false
  document.addEventListener('keydown', handleDetectShiftKey)
  document.addEventListener('keyup', handleDetectShiftKey)
})

onBeforeUnmount(() => {
  document.removeEventListener('keydown', handleDetectShiftKey)
  document.removeEventListener('keyup', handleDetectShiftKey)
  if (isLoadingData.value) {
    ipcRenderer.send('cancelLoadingFileList', cancelToken.value)
  }
  if (isLoadingDownloadData.value) {
    ipcRenderer.send(cancelDownloadLoadingFileList, downloadCancelToken.value)
  }
  ipcRenderer.removeAllListeners('refreshFileTransferList')
  ipcRenderer.removeAllListeners(refreshDownloadFileTransferList)
})

</script>

<style lang="stylus">
.layout-header
  background-color #fff
  box-shadow 2px 2px 1px rgba(0, 0, 0, .1)
  flex-shrink 0
  display flex
  align-items center
  padding right 15px
.dir-layout
  display: flex
  flex-direction: row
  align-items: center
  padding: 5px 10px
  flex-shrink: 0
.header-dir-view
  display: flex
  flex-direction: row
  align-items: center
  padding: 5px 10px
  flex-shrink: 0
  flex-grow: 1
  flex-shrink: 1
  overflow-x: auto
.header-info-view
  display: flex;
  flex-direction: row
  align-items: center
  flex-shrink: 0
  margin-right: 10px
  font-weight: 500
  font-size: 12px
.header-buttom-view
  display: flex
  flex-direction: row
  flex-shrink: 0
.btn
  margin-right: 10px
.file-item
  :hover
    background-color Beige
.file-list-font
  font-size 14px
  color #303133
  font-family Arial, Helvetica, sans-serif
.file-list-row-checked
  background-color Beige
#refresh
  :hover
    animation rotate 1s linear infinite reverse
#upload-area
  height 40%
  border 2px dashed #dddddd
  border-radius 8px
  text-align center
  width 100%
  margin 0 auto
  color #dddddd
  cursor pointer
  transition all .2s ease-in-out
  align-items center
  #upload-dragger
    height 100%
    item-align center
  &.is-dragover,
  &:hover
    border 2px dashed #A4D8FA
    color #A4D8FA
</style>
