/* *UI布局和部分样式代码参考了https://github.com/willnewii/qiniuClient *感谢作者@willnewii */
<template>
  <div
    v-loading="isShowLoadingPage"
    :element-loading-text="$T('MANAGE_BUCKET_PAGE_LOADING_TEXT')"
    :element-loading-spinner="svg"
    element-loading-svg-view-box="0, 0, 50, 50"
    element-loading-background="rgba(122, 122, 122, 0.5)"
  >
    <div class="layout-header">
      <div style="flex-grow: 1; margin-left: 16px">
        <el-select
          v-if="isShowCustomDomainSelectList && customDomainList.length > 1 && isAutoCustomDomain"
          v-model="currentCustomDomain"
          :placeholder="$T('MANAGE_BUCKET_PAGE_CUSTOM_URL_SELECT_PLACEHOLDER')"
          style="width: 200px"
          :persistent="false"
          teleported
          @change="handleChangeCustomUrlInput"
        >
          <el-option v-for="item in customDomainList" :key="item" :label="item.label" :value="item.value" />
        </el-select>
        <el-input
          v-else-if="isShowCustomDomainInput"
          v-model="currentCustomDomain"
          :placeholder="$T('MANAGE_BUCKET_PAGE_CUSTOM_URL_INPUT_PLACEHOLDER')"
          style="width: 200px"
          @blur="handleChangeCustomUrlInput"
        />
        <el-link v-else :underline="false" type="primary" @click="copyToClipboard(currentCustomDomain)">
          {{ currentCustomDomain }}
        </el-link>
      </div>
      <div style="display: flex" @click="showUploadDialog">
        <el-button type="primary" :link="true">
          <el-tooltip
            class="item"
            effect="dark"
            :content="$T('MANAGE_BUCKET_PAGE_UPLOAD_FILES_TOOLTIP')"
            placement="bottom"
            :persistent="false"
            teleported
          >
            <el-icon class="icon" size="25px">
              <Upload />
            </el-icon>
          </el-tooltip>
        </el-button>
      </div>
      <div>
        <el-button type="primary" :link="true" @click="showUrlDialog">
          <el-tooltip
            class="item"
            effect="dark"
            :content="$T('MANAGE_BUCKET_PAGE_UPLOAD_FROM_URL_TOOLTIP')"
            placement="bottom"
            :persistent="false"
            teleported
          >
            <el-icon class="icon" size="25px" style="margin-left: 5px">
              <UploadFilled />
            </el-icon>
          </el-tooltip>
        </el-button>
      </div>
      <div v-if="isShowCreateNewFolder">
        <el-button type="primary" :link="true" @click="handleCreateFolder">
          <el-tooltip
            class="item"
            effect="dark"
            :content="$T('MANAGE_BUCKET_PAGE_CREATE_FOLDER_TOOLTIP')"
            placement="bottom"
            :persistent="false"
            teleported
          >
            <el-icon class="icon" size="25px" style="margin-left: 5px">
              <FolderAdd />
            </el-icon>
          </el-tooltip>
        </el-button>
      </div>
      <div @click="showDownloadDialog">
        <el-button type="primary" :link="true">
          <el-tooltip
            class="item"
            effect="dark"
            :content="$T('MANAGE_BUCKET_PAGE_DOWNLOAD_TOOLTIP')"
            placement="bottom"
            :persistent="false"
            teleported
          >
            <el-icon class="icon" size="25px" style="margin-left: 5px">
              <Download />
            </el-icon>
          </el-tooltip>
        </el-button>
      </div>
      <div v-if="isShowRenameFileIcon" @click="handleBatchRenameFile">
        <el-button type="primary" :link="true">
          <el-tooltip
            class="item"
            effect="dark"
            :content="$T('MANAGE_BUCKET_PAGE_BATCH_RENAME_TOOLTIP')"
            placement="bottom"
            :persistent="false"
            teleported
          >
            <el-icon class="icon" size="25px" style="margin-left: 5px">
              <Edit />
            </el-icon>
          </el-tooltip>
        </el-button>
      </div>
      <div>
        <el-button type="primary" :link="true">
          <el-tooltip
            class="item"
            effect="dark"
            :content="$T('MANAGE_BUCKET_PAGE_BATCH_COPY_URL_TOOLTIP')"
            placement="right"
            :persistent="false"
            teleported
          >
            <el-dropdown teleported>
              <el-icon
                class="icon"
                size="25px"
                :color="selectedItems.length > 0 ? '#409EFF' : 'gray'"
                style="margin-left: 10px"
                @click="handleBatchCopyLink(manageStore.config.settings.pasteFormat)"
              >
                <Link />
              </el-icon>
              <template #dropdown>
                <template v-if="isShowPresignedUrl">
                  <el-dropdown-item
                    v-for="i in [...linkFormatArray, { key: 'preSignURL', value: 'preSignedUrl' }]"
                    :key="i.key"
                    @click="handleBatchCopyLink(i.value)"
                  >
                    {{ i.key }}
                  </el-dropdown-item>
                </template>
                <el-dropdown-item
                  v-for="i in linkFormatArray"
                  v-else
                  :key="i.value + i.key"
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
        <el-button type="primary" :link="true">
          <el-tooltip
            class="item"
            effect="dark"
            :content="$T('MANAGE_BUCKET_PAGE_COPY_FILE_INFO_TOOLTIP')"
            placement="bottom"
            :persistent="false"
            teleported
          >
            <el-icon
              class="icon"
              size="25px"
              :color="selectedItems.length > 0 ? '#409EFF' : 'gray'"
              style="margin-left: 10px"
              @click="handleBatchCopyInfo"
            >
              <Document />
            </el-icon>
          </el-tooltip>
        </el-button>
      </div>
      <div>
        <el-button type="primary" :link="true" @click="forceRefreshFileList">
          <el-tooltip
            class="item"
            effect="dark"
            :content="$T('MANAGE_BUCKET_PAGE_FORCE_REFRESH_TOOLTIP')"
            placement="bottom"
            :persistent="false"
            teleported
          >
            <el-icon id="refresh" class="icon" size="25px" style="margin-left: 10px; color: red">
              <Refresh />
            </el-icon>
          </el-tooltip>
        </el-button>
      </div>
      <el-input
        v-model="searchText"
        :placeholder="$T('MANAGE_BUCKET_PAGE_SEARCH_PLACEHOLDER')"
        style="margin-left: 10px; width: 200px"
        clearable
        size="small"
      />
    </div>
    <div class="header-dir-view">
      <el-breadcrumb :separator-icon="ArrowRight" style="margin-top: 2px">
        <el-breadcrumb-item style="flex-shrink: 0">
          <el-icon :size="16" style="margin-right: 5px">
            <HomeFilled />
          </el-icon>
        </el-breadcrumb-item>
        <template v-if="configMap.prefix !== '/'">
          <el-breadcrumb-item
            v-for="(item, index) in configMap.prefix.replace(/\/$/g, '').split('/')"
            :key="index"
            style="
              flex-shrink: 0;
              font-size: 12px;
              color: #606266;
              font-family: Arial, Helvetica, sans-serif;
              cursor: pointer;
            "
            @click="handleBreadcrumbClick(index)"
          >
            <el-link>
              {{ item === '' ? $T('MANAGE_BUCKET_PAGE_ROOT_FOLDER') : item }}
            </el-link>
          </el-breadcrumb-item>
        </template>
        <el-breadcrumb-item
          v-else
          style="
            flex-shrink: 0;
            font-size: 12px;
            color: #606266;
            font-family: Arial, Helvetica, sans-serif;
            cursor: pointer;
          "
        >
          <el-link>
            {{ $T('MANAGE_BUCKET_PAGE_ROOT_FOLDER') }}
          </el-link>
        </el-breadcrumb-item>
      </el-breadcrumb>
    </div>
    <div class="dir-layout">
      <div style="flex-grow: 1; flex-shrink: 1; overflow-x: auto; margin-right: 10px">
        <div class="header-info-view">
          <span>
            <el-icon :size="14" style="margin-right: 5px">
              <Document />
            </el-icon>
            <span style="margin-right: 5px; padding-left: 5px"
              >{{ `${$T('MANAGE_BUCKET_PAGE_FILE_NUMBER')}${currentPageFilesInfo.length}` }}
            </span>
          </span>
          <span>
            <el-icon :size="14" style="margin-right: 5px">
              <Coin />
            </el-icon>
            <span style="padding-left: 5px">{{ `${$T('MANAGE_BUCKET_PAGE_FILE_SIZE')}${calculateAllFileSize}` }}</span>
          </span>
        </div>
      </div>
      <div v-if="selectedItems.length === 0" class="header-buttom-view">
        <el-button
          class="btn"
          size="small"
          type="primary"
          plain
          style="margin-right: 2px"
          @click="handleCheckAllChange"
        >
          {{ $T('MANAGE_BUCKET_PAGE_SELECT_ALL') }}
        </el-button>
      </div>
      <div v-if="selectedItems.length > 0" class="header-buttom-view">
        <el-button class="btn" size="small" type="warning" plain style="margin-right: 2px" @click="handleCancelCheck">
          {{ $T('MANAGE_BUCKET_PAGE_SELECT_NONE') }}
        </el-button>
        <el-button class="btn" size="small" type="primary" plain style="margin-right: 2px" @click="handleReverseCheck">
          {{ $T('MANAGE_BUCKET_PAGE_SELECT_INVERT') }}
        </el-button>
        <el-button
          class="btn"
          size="small"
          type="primary"
          plain
          style="margin-right: 2px"
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
          style="margin-right: 2px"
          @click="handleBatchDownload"
        >
          {{ `${$T('MANAGE_BUCKET_DOWNLOAD_BTN')}(${selectedItems.filter(item => item.isDir === false).length})` }}
        </el-button>
        <el-button class="btn" size="small" type="danger" :icon="DeleteFilled" @click="handleBatchDeleteInfo">
          {{ `${$T('MANAGE_BUCKET_DELETE_BTN')}${selectedItems.length}` }}
        </el-button>
      </div>
      <el-dropdown teleported>
        <el-button size="small" type="primary" plain :icon="Sort">
          {{ $T('MANAGE_BUCKET_SORT_TITLE') }}
        </el-button>
        <template #dropdown>
          <el-dropdown-item v-for="item in sortTypeList" :key="item" @click="sortFile(item as any)">
            {{ $T(`MANAGE_BUCKET_SORT_${item.toUpperCase()}` as any) }}
          </el-dropdown-item>
        </template>
      </el-dropdown>
      <el-button-group size="small" style="margin-left: 10px; width: 80px; flex-shrink: 0" type="primary">
        <el-button :icon="Grid" :type="layoutStyle === 'grid' ? 'primary' : 'info'" @click="handleViewChange('grid')" />
        <el-button :icon="Fold" :type="layoutStyle === 'list' ? 'primary' : 'info'" @click="handleViewChange('list')" />
      </el-button-group>
      <el-input-number
        v-if="paging"
        v-model="currentPageNumber"
        :min="1"
        size="small"
        :disabled="!paging"
        style="margin-left: 10px; flex-shrink: 0"
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
      append-to-body
    >
      <el-input
        v-model="urlToUpload"
        placeholder="https://www.baidu.com/img/bd_logo1.png
https://www.baidu.com/img/bd_logo1.png"
        style="margin-bottom: 10px"
        type="textarea"
        :autosize="{ minRows: 3, maxRows: 5 }"
      />
      <template #footer>
        <el-button @click="dialogVisible = false">
          {{ $T('MANAGE_BUCKET_URL_UPLOAD_DIALOG_CANCEL') }}
        </el-button>
        <el-button type="primary" style="font-size: 12px; font-weight: 500" @click="handleUploadFromUrl">
          {{ $T('MANAGE_BUCKET_URL_UPLOAD_DIALOG_CONFIRM') }}
        </el-button>
      </template>
    </el-dialog>
    <div
      v-if="layoutStyle === 'list'"
      class="layout-table"
      style="margin: 0 15px 15px 15px; overflow-y: auto; overflow-x: hidden; height: 80vh"
    >
      <el-auto-resizer>
        <template #default="{ height, width }">
          <el-table-v2
            ref="fileTable"
            :columns="columns"
            :data="filterList"
            :row-class="rowClass"
            :width="width"
            :height="height"
          />
        </template>
      </el-auto-resizer>
    </div>
    <div
      v-if="layoutStyle === 'grid'"
      class="layout-grid"
      style="margin: 0 15px 15px 15px; overflow-y: auto; overflow-x: hidden; height: 80vh"
    >
      <el-col :span="24">
        <el-row :gutter="16">
          <el-col v-for="(item, index) in filterList" :key="index" :xs="24" :sm="12" :md="8" :lg="3" :xl="2">
            <el-card
              :body-style="{
                padding: '0px',
                height: '150px',
                width: '100%',
                background: item.checked ? '#f2f2f2' : '#fff'
              }"
              style="margin-bottom: 10px"
              shadow="hover"
            >
              <el-image
                v-if="!item.isDir && !['webdavplist', 'sftp', 'local', 's3plist'].includes(currentPicBedName)"
                :src="
                  isShowThumbnail && item.isImage
                    ? item.url
                    : require(`./assets/icons/${getFileIconPath(item.fileName ?? '')}`)
                "
                fit="contain"
                style="height: 100px; width: 100%; margin: 0 auto"
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
                    style="height: 100px; width: 100%; margin: 0 auto"
                  />
                </template>
              </el-image>
              <el-image
                v-else-if="!item.isDir && currentPicBedName === 's3plist' && !isUsePreSignedUrl"
                :src="
                  isShowThumbnail && item.isImage
                    ? item.url
                    : require(`./assets/icons/${getFileIconPath(item.fileName ?? '')}`)
                "
                fit="contain"
                style="height: 100px; width: 100%; margin: 0 auto"
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
                    style="height: 100px; width: 100%; margin: 0 auto"
                  />
                </template>
              </el-image>
              <ImagePreSign
                v-else-if="!item.isDir && currentPicBedName === 's3plist' && isUsePreSignedUrl"
                :is-show-thumbnail="isShowThumbnail"
                :item="item"
                :alias="configMap.alias"
                :url="item.url"
                :config="handleGetS3Config(item)"
                @click="handleClickFile(item)"
              />
              <ImageWebdav
                v-else-if="!item.isDir && currentPicBedName === 'webdavplist' && item.isImage"
                :is-show-thumbnail="isShowThumbnail"
                :item="item"
                :config="handleGetWebdavConfig()"
                :url="item.url"
                @click="handleClickFile(item)"
              />
              <ImageLocal
                v-else-if="!item.isDir && currentPicBedName === 'local' && item.isImage"
                :is-show-thumbnail="isShowThumbnail"
                :item="item"
                :local-path="item.key"
                @click="handleClickFile(item)"
              />
              <el-image
                v-else-if="!item.isDir"
                :src="require(`./assets/icons/${getFileIconPath(item.fileName ?? '')}`)"
                fit="contain"
                style="height: 100px; width: 100%; margin: 0 auto"
                @click="handleClickFile(item)"
              />
              <el-image
                v-else
                :src="require('./assets/icons/folder.webp')"
                fit="contain"
                style="height: 100px; width: 100%; margin: 0 auto"
                @click="handleClickFile(item)"
              />
              <div
                style="align-items: center; display: flex; justify-content: center"
                @click="copyToClipboard(item.fileName ?? '')"
              >
                <el-tooltip placement="top" effect="light" :content="item.fileName" :persistent="false" teleported>
                  <el-link
                    style="font-size: 12px; font-family: Arial, Helvetica, sans-serif"
                    :underline="false"
                    :type="item.checked ? 'primary' : 'info'"
                  >
                    {{ formatFileName(item.fileName ?? '', 15) }}
                  </el-link>
                </el-tooltip>
              </div>
              <el-row style="display: flex" justify="space-between" align="middle">
                <el-row>
                  <el-icon
                    v-if="!item.isDir && isShowRenameFileIcon"
                    size="15"
                    style="cursor: pointer"
                    color="#409EFF"
                    @click="handleRenameFile(item)"
                  >
                    <Edit />
                  </el-icon>
                  <el-icon
                    v-if="item.isDir"
                    size="15"
                    style="cursor: pointer"
                    color="crimson"
                    @click="handleFolderBatchDownload(item)"
                  >
                    <Download />
                  </el-icon>
                  <el-dropdown teleported>
                    <template #default>
                      <el-icon
                        size="15"
                        style="cursor: pointer"
                        color="#409EFF"
                        @click="
                          async () => {
                            copyToClipboard(
                              await formatLink(
                                item.url,
                                item.fileName,
                                manageStore.config.settings.pasteFormat ?? '$markdown',
                                manageStore.config.settings.customPasteFormat ?? '$url'
                              )
                            )
                          }
                        "
                      >
                        <CopyDocument />
                      </el-icon>
                    </template>
                    <template #dropdown>
                      <el-dropdown-menu>
                        <el-dropdown-item
                          v-for="format in linkFormatList"
                          :key="format"
                          @click="copyLink(item, format)"
                        >
                          {{ $T(`MANAGE_BUCKET_URL_FORMAT_${format.toUpperCase().replace(/-/g, '_')}` as any) }}
                        </el-dropdown-item>
                        <el-dropdown-item
                          v-if="isShowPresignedUrl"
                          @click="
                            async () => {
                              copyToClipboard(await getPreSignedUrl(item))
                            }
                          "
                        >
                          {{ $T('MANAGE_BUCKET_URL_FORMAT_PRESIGN') }}
                        </el-dropdown-item>
                      </el-dropdown-menu>
                    </template>
                  </el-dropdown>
                  <el-icon size="15" style="cursor: pointer" color="#409EFF" @click="handleShowFileInfo(item)">
                    <Document />
                  </el-icon>
                  <el-icon size="15" style="cursor: pointer" color="#FFB6C1" @click="handleDeleteFile(item)">
                    <DeleteFilled />
                  </el-icon>
                </el-row>
                <el-checkbox v-model="item.checked" size="large" />
              </el-row>
            </el-card>
          </el-col>
        </el-row>
      </el-col>
    </div>
    <el-image-viewer
      v-if="isShowImagePreview"
      :url-list="ImagePreviewList"
      :initial-index="getCurrentPreviewIndex"
      infinite
      hide-on-click-modal
      teleported
      @close="isShowImagePreview = false"
    />
    <el-dialog
      v-model="isShowFileInfo"
      :title="$T('MANAGE_BUCKET_FILE_INFO_TITLE')"
      center
      align-center
      draggable
      append-to-body
    >
      <template #header>
        <el-button type="primary" plain @click="copyToClipboard(JSON.stringify(currentShowedFileInfo, null, 2))">
          <template #icon>
            <el-icon>
              <Document />
            </el-icon>
          </template>
          {{ $T('MANAGE_BUCKET_FILE_INFO_COPY_TIPS') }}
        </el-button>
      </template>
      <el-row
        v-for="(value, key) in currentShowedFileInfo"
        :key="key"
        :gutter="20"
        :style="{
          margin: '10px 0',
          textAlign: 'center',
          fontFamily: 'Arial, Helvetica, sans-serif'
        }"
      >
        <el-col :span="6" @click="copyToClipboard(JSON.stringify({ [key]: value }))">
          <span style="font-weight: 500">{{ key }}:</span>
        </el-col>
        <el-col :span="18" @click="copyToClipboard(value)">
          <span style="font-weight: 500; word-break: break-all">{{ value }}</span>
        </el-col>
      </el-row>
    </el-dialog>
    <el-affix v-if="isLoadingData" style="position: fixed; bottom: 25px; right: 0" @click="cancelLoading">
      <el-button
        type="warning"
        icon="el-icon-loading"
        style="font-size: 12px; font-weight: 500"
        :loading="isLoadingData"
      >
        {{ $T('MANAGE_BUCKET_FILE_LIST_LOADING') }}
      </el-button>
    </el-affix>
    <el-affix
      v-if="isLoadingDownloadData"
      style="position: fixed; top: 50px; right: 0px"
      @click="cancelDownloadLoading"
    >
      <el-button
        type="warning"
        icon="el-icon-loading"
        style="font-size: 12px; font-weight: 500"
        :loading="isLoadingDownloadData"
      >
        {{ $T('MANAGE_BUCKET_FILE_LIST_DOWNLOAD_PRE') }}
      </el-button>
    </el-affix>
    <el-drawer
      v-model="isShowUploadPanel"
      size="60%"
      append-to-body
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
        :class="{ 'is-dragover': isDragover }"
        styel="position: fixed;bottom: 0;right: 0;heigth: 100%;width: 100%;"
        @drop.prevent="onDrop"
        @dragover.prevent="isDragover = true"
        @dragleave.prevent="isDragover = false"
        @click="openFileSelectDialog"
      >
        <div
          v-if="!tableData.length"
          id="upload-dragger"
          style="
            position: relative;
            top: 0;
            right: 0;
            height: 100%;
            width: 100%;
            display: flex;
            justify-content: center;
            align-items: center;
          "
        >
          <div
            class="upload-dragger__text"
            style="
              color: orange;
              font-size: 2.5vh;
              font-family: Arial, Helvetica, sans-serif;
              align-items: center;
              display: flex;
              justify-content: center;
              flex-direction: column;
            "
          >
            {{ $T('MANAGE_BUCKET_UPLOAD_AREA_TITLE') }}
            <span
              style="
                color: #409eff;
                font-size: 2.5vh;
                font-family: Arial, Helvetica, sans-serif;
                align-items: center;
                display: flex;
                justify-content: center;
                flex-direction: column;
              "
            >
              {{ $T('MANAGE_BUCKET_UPLOAD_AREA_TEXT') }}
            </span>
          </div>
        </div>
        <el-auto-resizer v-if="tableData.length">
          <template #default="{ height, width }">
            <el-table-v2
              :columns="upLoadTaskColumns"
              :data="
                tableData.sort((a, b) =>
                  b.isFolder - a.isFolder === 0 ? b.filesList.length - a.filesList.length : b.isFolder - a.isFolder
                )
              "
              :width="width"
              :height="height"
            />
          </template>
        </el-auto-resizer>
      </div>
      <div style="display: flex; justify-content: center; align-items: center">
        <el-button-group>
          <el-button
            type="success"
            plain
            :loading="isLoadingUploadPanelFiles"
            :disabled="isLoadingUploadPanelFiles || !tableData.length"
            @click="uploadFiles"
          >
            {{
              isLoadingUploadPanelFiles
                ? $T('MANAGE_BUCKET_UPLOAD_AREA_BTN_LOADING')
                : $T('MANAGE_BUCKET_UPLOAD_AREA_BTN')
            }}
          </el-button>
          <span>
            <el-button type="warning" plain :disabled="isLoadingUploadPanelFiles" @click="clearTableData">
              {{ $T('MANAGE_BUCKET_UPLOAD_AREA_CLEAR') }}
            </el-button>
          </span>
        </el-button-group>
      </div>
      <el-tabs v-model="activeUpLoadTab" stretch lazy>
        <el-tab-pane name="uploading">
          <template #label>
            <span>
              {{ $T('MANAGE_BUCKET_UPLOAD_AREA_STATUS_UPLOADING') }}
            </span>
            <el-badge v-if="uploadingTaskList.length" :value="uploadingTaskList.length" :max="9999" type="primary" />
          </template>
          <el-button-group size="small">
            <el-button type="primary" plain :icon="Document" @click="handleCopyUploadingTaskInfo">
              {{ $T('MANAGE_BUCKET_UPLOAD_AREA_COPY_TASK') }}
            </el-button>
            <el-button type="primary" plain :icon="DeleteFilled" @click="handleDeleteUploadedTask">
              {{ $T('MANAGE_BUCKET_UPLOAD_AREA_CLEAR_UPLOADED_TASK') }}
            </el-button>
            <el-button type="primary" plain :icon="DeleteFilled" @click="handleDeleteAllUploadedTask">
              {{ $T('MANAGE_BUCKET_UPLOAD_AREA_CLEAR_ALL_TASK') }}
            </el-button>
          </el-button-group>
          <div style="height: 500px">
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
        <el-tab-pane name="finished">
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
            <el-button type="primary" plain :icon="Document" @click="handleCopyUploadingTaskInfo">
              {{ $T('MANAGE_BUCKET_UPLOAD_AREA_COPY_TASK') }}
            </el-button>
            <el-button type="primary" plain :icon="DeleteFilled" @click="handleDeleteUploadedTask">
              {{ $T('MANAGE_BUCKET_UPLOAD_AREA_CLEAR_UPLOADED_TASK') }}
            </el-button>
            <el-button type="primary" plain :icon="DeleteFilled" @click="handleDeleteAllUploadedTask">
              {{ $T('MANAGE_BUCKET_UPLOAD_AREA_CLEAR_ALL_TASK') }}
            </el-button>
          </el-button-group>
          <div style="height: 500px">
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
        <el-tab-pane name="failed">
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
            <el-button type="primary" plain :icon="Document" @click="handleCopyUploadingTaskInfo">
              {{ $T('MANAGE_BUCKET_UPLOAD_AREA_COPY_TASK') }}
            </el-button>
            <el-button type="primary" plain :icon="DeleteFilled" @click="handleDeleteUploadedTask">
              {{ $T('MANAGE_BUCKET_UPLOAD_AREA_CLEAR_UPLOADED_TASK') }}
            </el-button>
            <el-button type="primary" plain :icon="DeleteFilled" @click="handleDeleteAllUploadedTask">
              {{ $T('MANAGE_BUCKET_UPLOAD_AREA_CLEAR_ALL_TASK') }}
            </el-button>
          </el-button-group>
          <div style="height: 500px">
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
      append-to-body
      @open="startRefreshDownloadTask"
      @close="stopRefreshDownloadTask"
    >
      <el-tabs v-model="activeDownLoadTab" stretch lazy>
        <el-tab-pane name="downloading">
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
            <el-button type="primary" plain :icon="Document" @click="handleCopyDownloadingTaskInfo">
              {{ $T('MANAGE_BUCKET_DOWNLOAD_COPY_TASK') }}
            </el-button>
            <el-button type="primary" plain :icon="DeleteFilled" @click="handleDeleteDownloadedTask">
              {{ $T('MANAGE_BUCKET_DOWNLOAD_CLEAR_DOWNLOADED_TASK') }}
            </el-button>
            <el-button type="primary" plain :icon="DeleteFilled" @click="handleDeleteAllDownloadedTask">
              {{ $T('MANAGE_BUCKET_DOWNLOAD_CLEAR_ALL_TASK') }}
            </el-button>
            <el-button type="primary" plain :icon="Folder" @click="handleOpenDownloadedFolder">
              {{ $T('MANAGE_BUCKET_DOWNLOAD_OPEN_FOLDER') }}
            </el-button>
          </el-button-group>
          <div style="height: 600px">
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
        <el-tab-pane name="finished">
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
            <el-button type="primary" plain :icon="Document" @click="handleCopyDownloadingTaskInfo">
              {{ $T('MANAGE_BUCKET_DOWNLOAD_COPY_TASK') }}
            </el-button>
            <el-button type="primary" plain :icon="DeleteFilled" @click="handleDeleteDownloadedTask">
              {{ $T('MANAGE_BUCKET_DOWNLOAD_CLEAR_DOWNLOADED_TASK') }}
            </el-button>
            <el-button type="primary" plain :icon="DeleteFilled" @click="handleDeleteAllDownloadedTask">
              {{ $T('MANAGE_BUCKET_DOWNLOAD_CLEAR_ALL_TASK') }}
            </el-button>
            <el-button type="primary" plain :icon="Folder" @click="handleOpenDownloadedFolder">
              {{ $T('MANAGE_BUCKET_DOWNLOAD_OPEN_FOLDER') }}
            </el-button>
          </el-button-group>
          <div style="height: 600px">
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
        <el-tab-pane name="failed">
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
            <el-button type="primary" plain :icon="Document" @click="handleCopyDownloadingTaskInfo">
              {{ $T('MANAGE_BUCKET_DOWNLOAD_COPY_TASK') }}
            </el-button>
            <el-button type="primary" plain :icon="DeleteFilled" @click="handleDeleteDownloadedTask">
              {{ $T('MANAGE_BUCKET_DOWNLOAD_CLEAR_DOWNLOADED_TASK') }}
            </el-button>
            <el-button type="primary" plain :icon="DeleteFilled" @click="handleDeleteAllDownloadedTask">
              {{ $T('MANAGE_BUCKET_DOWNLOAD_CLEAR_ALL_TASK') }}
            </el-button>
            <el-button type="primary" plain :icon="Folder" @click="handleOpenDownloadedFolder">
              {{ $T('MANAGE_BUCKET_DOWNLOAD_OPEN_FOLDER') }}
            </el-button>
          </el-button-group>
          <div style="height: 600px">
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
      append-to-body
    >
      <div style="-webkit-user-select: text; user-select: text" v-html="markDownContent" />
      <el-button
        type="danger"
        :icon="Close"
        size="large"
        style="position: fixed; bottom: 10px; right: 15px"
        circle
        @click="
          () => {
            isShowMarkDownDialog = false
          }
        "
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
      append-to-body
    >
      <highlightjs style="-webkit-user-select: text; user-select: text" language="js" :code="textfileContent" />
      <el-button
        type="danger"
        :icon="Close"
        size="large"
        style="position: fixed; bottom: 10px; right: 15px"
        circle
        @click="
          () => {
            isShowTextFileDialog = false
          }
        "
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
      append-to-body
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
        style="position: fixed; bottom: 10px; right: 15px"
        circle
        @click="
          () => {
            isShowVideoFileDialog = false
          }
        "
      />
    </el-dialog>
    <el-dialog
      v-model="isShowBatchRenameDialog"
      :title="$T('MANAGE_BUCKET_RENAME_FILE')"
      center
      align-center
      draggable
      destroy-on-close
      append-to-body
      @close="
        () => {
          isSingleRename = false
          isRenameIncludeExt = false
        }
      "
    >
      <el-link :underline="false" style="margin-bottom: 10px">
        <span>
          {{ $T('MANAGE_BUCKET_RENAME_FILE_INPUT_A') }} - Matched:
          {{ matchedFilesNumber }}
          <el-tooltip
            effect="dark"
            :content="$T('MANAGE_BUCKET_RENAME_FILE_INPUT_A_TIPS')"
            placement="right"
            :persistent="false"
            teleported
          >
            <el-icon color="#409EFF">
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
      <el-link :underline="false" style="margin-bottom: 10px; margin-top: 10px">
        <span>
          {{ $T('MANAGE_BUCKET_RENAME_FILE_INPUT_B') }}
          <el-popover effect="light" placement="right" width="280" :persistent="false" teleported>
            <template #reference>
              <el-icon color="#409EFF">
                <InfoFilled />
              </el-icon>
            </template>
            <el-descriptions :column="1" style="width: 250px" border>
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
                v-for="(item, index) in customRenameFormatTable.slice(0, customRenameFormatTable.length - 1)"
                :key="index"
                :label="item.placeholderB"
                align="center"
                label-style="width: 100px;"
              >
                {{ item.descriptionB }}
              </el-descriptions-item>
              <el-descriptions-item label="{auto}" align="center" label-style="width: 100px;">
                {{ $T('MANAGE_BUCKET_RENAME_FILE_TABLE_IID') }}
              </el-descriptions-item>
            </el-descriptions>
          </el-popover>
        </span>
      </el-link>
      <el-input v-model="batchRenameReplace" placeholder="Ex. {Y}-{m}-{uuid}" clearable />
      <el-link :underline="false" style="margin-bottom: 10px; margin-top: 10px">
        <span>
          {{ $T('MANAGE_BUCKET_RENAME_FILE_EXT') }}
          <el-tooltip
            effect="dark"
            :content="$T('MANAGE_BUCKET_RENAME_FILE_EXT_TIPS')"
            placement="right"
            :persistent="false"
            teleported
          >
            <el-icon color="#409EFF">
              <InfoFilled />
            </el-icon>
          </el-tooltip>
        </span>
      </el-link>
      <br />
      <el-switch
        v-model="isRenameIncludeExt"
        :active-text="$T('MANAGE_BUCKET_RENAME_FILE_EXT_YES')"
        :inactive-text="$T('MANAGE_BUCKET_RENAME_FILE_EXT_NO')"
      />
      <div style="margin-top: 10px; align-items: center; display: flex; justify-content: flex-end">
        <el-button
          type="danger"
          style="margin-right: 30px"
          plain
          :icon="Close"
          @click="
            () => {
              isShowBatchRenameDialog = false
            }
          "
        >
          {{ $T('MANAGE_BUCKET_RENAME_FILE_CANCEL') }}
        </el-button>
        <el-button type="primary" plain :icon="Edit" @click="isSingleRename ? singleRename() : BatchRename()">
          {{ $T('MANAGE_BUCKET_RENAME_FILE_CONFIRM') }}
        </el-button>
      </div>
    </el-dialog>
  </div>
</template>

<script lang="tsx" setup>
import axios from 'axios'
import { ipcRenderer, clipboard, IpcRendererEvent } from 'electron'
import {
  ElMessage,
  ElMessageBox,
  ElNotification,
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
import {
  InfoFilled,
  Grid,
  Fold,
  Close,
  Folder,
  FolderAdd,
  Upload,
  CircleClose,
  Loading,
  CopyDocument,
  Edit,
  UploadFilled,
  Link,
  Refresh,
  ArrowRight,
  HomeFilled,
  Document,
  Coin,
  Download,
  DeleteFilled,
  Sort,
  FolderOpened
} from '@element-plus/icons-vue'
import fs from 'fs-extra'
import { marked } from 'marked'
import path from 'path'
import { v4 as uuidv4 } from 'uuid'
import { ref, reactive, watch, onBeforeMount, computed, onBeforeUnmount } from 'vue'
import { useRoute } from 'vue-router'

import { fileCacheDbInstance } from '@/manage/store/bucketFileDb'
import { useFileTransferStore, useDownloadFileTransferStore, useManageStore } from '@/manage/store/manageStore'
import {
  customRenameFormatTable,
  customStrMatch,
  customStrReplace,
  renameFile,
  formatLink,
  formatFileName,
  getFileIconPath,
  formatFileSize,
  isValidUrl,
  svg
} from '@/manage/utils/common'
import { getConfig, saveConfig } from '@/manage/utils/dataSender'
import { textFileExt } from '@/manage/utils/textfile'
import { videoExt } from '@/manage/utils/videofile'

import ImageWebdav from '@/components/ImageWebdav.vue'
import ImagePreSign from '@/components/ImagePreSign.vue'
import ImageLocal from '@/components/ImageLocal.vue'
import ImageWebdavTsx from '@/components/ImageWebdavTsx'
import ImagePreSignTsx from '@/components/ImagePreSignTsx'

import { T as $T } from '@/i18n'

import { getExtension, trimPath } from '#/utils/common'
import { cancelDownloadLoadingFileList, refreshDownloadFileTransferList } from '#/utils/static'
import { IUploadTask, IDownloadTask } from '#/types/manage'
import { sendRPC, triggerRPC } from '@/utils/common'
import { IRPCActionType } from '#/types/enum'

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

const linkFormatArray = [
  { key: 'Url', value: 'url' },
  { key: 'Markdown', value: 'markdown' },
  { key: 'Markdown-link', value: 'markdown-with-link' },
  { key: 'Html', value: 'html' },
  { key: 'BBCode', value: 'bbcode' },
  { key: 'Custom', value: 'custom' }
]
const linkFormatList = ['url', 'markdown', 'markdown-with-link', 'html', 'bbcode', 'custom']

type ISortTypeList = 'name' | 'size' | 'time' | 'ext' | 'check' | 'init'
const sortTypeList = ['name', 'size', 'time', 'ext', 'check', 'init']

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
// 文件信息相关
const fileTable = ref(null as any)
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
const isUploadKeepDirStructure = computed(() => manageStore.config.settings.isUploadKeepDirStructure ?? true)
const uploadingTaskList = computed(() =>
  uploadTaskList.value.filter(item => ['uploading', 'queuing', 'paused'].includes(item.status))
)
const uploadedTaskList = computed(() =>
  uploadTaskList.value.filter(item => ['uploaded', 'failed', 'canceled'].includes(item.status))
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
  downloadTaskList.value.filter(item => ['downloading', 'queuing', 'paused'].includes(item.status))
)
const downloadedTaskList = computed(() =>
  downloadTaskList.value.filter(item => ['downloaded', 'failed', 'canceled'].includes(item.status))
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
  ['tcyun', 'aliyun', 'qiniu', 'github'].includes(currentPicBedName.value)
)
const isShowCustomDomainInput = computed(() =>
  ['aliyun', 'qiniu', 'tcyun', 's3plist', 'webdavplist', 'local', 'sftp'].includes(currentPicBedName.value)
)
const isAutoCustomDomain = computed(() =>
  manageStore.config.picBed[configMap.alias].isAutoCustomUrl === undefined
    ? true
    : manageStore.config.picBed[configMap.alias].isAutoCustomUrl
)
// 文件预览相关
const isShowMarkDownDialog = ref(false)
const markDownContent = ref('')
const isShowTextFileDialog = ref(false)
const textfileContent = ref('')
const isShowVideoFileDialog = ref(false)
const videoFileUrl = ref('')
const videoPlayerHeaders = ref({})
// 重命名相关
const isShowRenameFileIcon = computed(() =>
  ['tcyun', 'aliyun', 'qiniu', 'upyun', 's3plist', 'webdavplist', 'local', 'sftp'].includes(currentPicBedName.value)
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
    '0'
)
const isShowThumbnail = computed(() => manageStore.config.settings.isShowThumbnail ?? false)
const isUsePreSignedUrl = computed(() => manageStore.config.settings.isUsePreSignedUrl ?? false)
const isAutoRefresh = computed(() => manageStore.config.settings.isAutoRefresh ?? false)
const isIgnoreCase = computed(() => manageStore.config.settings.isIgnoreCase ?? false)

// 新建文件夹相关
const isShowCreateNewFolder = computed(() =>
  ['aliyun', 'github', 'local', 'qiniu', 'tcyun', 's3plist', 'upyun', 'webdavplist', 'sftp'].includes(
    currentPicBedName.value
  )
)

const isShowPresignedUrl = computed(() =>
  ['aliyun', 'github', 'qiniu', 's3plist', 'tcyun', 'webdavplist'].includes(currentPicBedName.value)
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

function handleUploadKeepDirChange(val: any) {
  saveConfig('settings.isUploadKeepDirStructure', !!val)
  manageStore.refreshConfig()
}

function showUploadDialog() {
  isShowUploadPanel.value = true
}

function startRefreshUploadTask() {
  refreshUploadTaskId.value = setInterval(() => {
    triggerRPC(IRPCActionType.MANAGE_GET_UPLOAD_TASK_LIST).then((res: any) => {
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
    triggerRPC(IRPCActionType.MANAGE_GET_DOWNLOAD_TASK_LIST).then((res: any) => {
      downloadTaskList.value = res
    })
  }, 300)
}

function stopRefreshDownloadTask() {
  refreshDownloadTaskId.value && clearInterval(refreshDownloadTaskId.value)
}

// 界面相关

function handleViewChange(val: 'list' | 'grid') {
  saveConfig('settings.isShowList', val === 'list')
  layoutStyle.value = val
}

// 上传文件选择相关

function openFileSelectDialog() {
  triggerRPC(IRPCActionType.MANAGE_OPEN_FILE_SELECT_DIALOG).then((res: any) => {
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
                }
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
      }
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
  Object.keys(dirObj).forEach(key => {
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

function clearTableData() {
  tableData.length = 0
  uploadPanelFilesList.value = []
}

function renameFileBeforeUpload(filePath: string): string {
  const fileName = path.basename(filePath)
  const typeMap = {
    timestampRename: manageStore.config.settings.timestampRename,
    randomStringRename: manageStore.config.settings.randomStringRename,
    customRenameFormat: manageStore.config.settings.customRenameFormat,
    customRename: manageStore.config.settings.customRename
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
      githubBranch: currentCustomDomain.value,
      aclForUpload: manageStore.config.picBed[configMap.alias].aclForUpload
    })
  })
  sendRPC(IRPCActionType.MANAGE_UPLOAD_BUCKET_FILE, configMap.alias, param)
}

function handleCopyUploadingTaskInfo() {
  clipboard.writeText(JSON.stringify(uploadTaskList.value, null, 2))
  ElMessage.success($T('MANAGE_BUCKET_COPY_SUCCESS'))
}

function handleDeleteUploadedTask() {
  sendRPC(IRPCActionType.MANAGE_DELETE_UPLOADED_TASK)
  ElMessage.success($T('MANAGE_BUCKET_DELETE_SUCCESS'))
}

function handleDeleteAllUploadedTask() {
  sendRPC(IRPCActionType.MANAGE_DELETE_ALL_UPLOADED_TASK)
  ElMessage.success($T('MANAGE_BUCKET_DELETE_SUCCESS'))
}

// 下载任务相关

function handleCopyDownloadingTaskInfo() {
  clipboard.writeText(JSON.stringify(downloadTaskList.value, null, 2))
  ElMessage.success($T('MANAGE_BUCKET_COPY_SUCCESS'))
}

function handleDeleteDownloadedTask() {
  sendRPC(IRPCActionType.MANAGE_DELETE_DOWNLOADED_TASK)
  ElMessage.success($T('MANAGE_BUCKET_DELETE_SUCCESS'))
}

function handleDeleteAllDownloadedTask() {
  sendRPC(IRPCActionType.MANAGE_DELETE_ALL_DOWNLOADED_TASK)
  ElMessage.success($T('MANAGE_BUCKET_DELETE_SUCCESS'))
}

function handleOpenDownloadedFolder() {
  sendRPC(IRPCActionType.MANAGE_OPEN_DOWNLOADED_FOLDER, manageStore.config.settings.downloadDir)
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
    ipcRenderer.send('cancelLoadingFileList', cancelToken.value)
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
      Authorization: `Basic ${Buffer.from(`${manageStore.config.picBed[configMap.alias].username}:${manageStore.config.picBed[configMap.alias].password}`).toString('base64')}`
    }
  }
  if (item.isImage) {
    previewedImage.value = item.url
    isShowImagePreview.value = true
  } else if (item.isDir) {
    if (isLoadingData.value) {
      isLoadingData.value = false
      ipcRenderer.send('cancelLoadingFileList', cancelToken.value)
    }
    configMap.prefix = `/${item.key}`
    isShowLoadingPage.value = true
    await resetParam(false)
    isShowLoadingPage.value = false
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
      markDownContent.value = marked.parse(content)
      isShowMarkDownDialog.value = true
    } catch (error) {
      ElMessage.error($T('MANAGE_BUCKET_END_LOADING_MESSAGE_FAIL'))
    }
  } else if (
    textFileExt.includes(path.extname(item.fileName).toLowerCase()) ||
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
        customUrl: currentCustomDomain.value
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
    const res = await triggerRPC<any>(IRPCActionType.MANAGE_GET_BUCKET_DOMAIN, configMap.alias, param)
    if (res.length > 0) {
      customDomainList.value.length = 0
      res.forEach((item: any) => {
        if (!/^https?:\/\//.test(item) && currentPicBedName.value !== 'github') {
          item = manageStore.config.settings.isForceCustomUrlHttps ? `https://${item}` : `http://${item}`
        }
        customDomainList.value.push({
          label: item,
          value: item
        })
      })
      defaultUrl !== '' &&
        currentPicBedName.value !== 'github' &&
        customDomainList.value.push({
          label: defaultUrl,
          value: defaultUrl
        })
      currentCustomDomain.value = customDomainList.value[0].value
    } else {
      customDomainList.value.length = 0
      customDomainList.value = [
        {
          label: defaultUrl,
          value: defaultUrl
        }
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
            manageStore.config.picBed[configMap.alias].sslEnabled ? `https://${endpoint}` : `http://${endpoint}`
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
    ipcRenderer.send('cancelLoadingFileList', cancelToken.value)
  }
  if (isLoadingDownloadData.value) {
    isLoadingDownloadData.value = false
    ipcRenderer.send(cancelDownloadLoadingFileList, downloadCancelToken.value)
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
  lastChoosed.value = -1
  layoutStyle.value = (await getConfig('settings.isShowList')) ? 'list' : 'grid'
  fileSortExtReverse.value = false
  fileSortNameReverse.value = false
  fileSortSizeReverse.value = false
  fileSortTimeReverse.value = false
  if (!isAutoRefresh.value && !force && !paging.value) {
    console.log('use cache')
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
    ElNotification({
      title: $T('MANAGE_BUCKET_GET_LIST_FAIL_TITLE'),
      message: $T('MANAGE_BUCKET_GET_LIST_FAIL_MSG3'),
      type: 'error',
      duration: 1000
    })
    return
  }
  isShowLoadingPage.value = true
  await resetParam(true)
  isShowLoadingPage.value = false
}

watch(currentPageNumber, () => {
  if (typeof currentPageNumber.value !== 'number') {
    currentPageNumber.value = 1
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
    ElNotification({
      title: $T('MANAGE_BUCKET_GET_LIST_FAIL_TITLE'),
      message: $T('MANAGE_BUCKET_GET_LIST_FAIL_MSG'),
      type: 'error',
      duration: 1000
    })
    return
  }

  currentPageFilesInfo.push(...res.fullList)

  sortFile(sortType)

  if (!(cur < prev && !paging.value)) {
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
}

function sortFile(type: 'name' | 'size' | 'time' | 'ext' | 'check' | 'init') {
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
  ElMessageBox.confirm($T('MANAGE_BUCKET_DOWNLOAD_FOLDER_BOX_TITLE'), $T('MANAGE_BUCKET_DOWNLOAD_FOLDER_BOX_TIP'), {
    confirmButtonText: $T('MANAGE_BUCKET_DOWNLOAD_FOLDER_BOX_CONFIRM'),
    cancelButtonText: $T('MANAGE_BUCKET_DOWNLOAD_FOLDER_BOX_CANCEL'),
    type: 'warning'
  })
    .then(async () => {
      const defaultDownloadPath = await triggerRPC<string>(IRPCActionType.MANAGE_GET_DEFAULT_DOWNLOAD_FOLDER)
      const param = {
        downloadPath: manageStore.config.settings.downloadDir ?? defaultDownloadPath,
        maxDownloadFileCount: manageStore.config.settings.maxDownloadFileCount
          ? manageStore.config.settings.maxDownloadFileCount
          : 5,
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
        prefix: `/${item.key.replace(/^\/+|\/+$/, '')}/`,
        marker: pagingMarker.value,
        itemsPerPage: itemsPerPage.value,
        customUrl: currentCustomDomain.value,
        currentPage: currentPageNumber.value,
        cancelToken: cancelToken.value,
        cdnUrl: configMap.cdnUrl
      }
      isLoadingDownloadData.value = true
      const downloadFileTransferStore = useDownloadFileTransferStore()
      downloadFileTransferStore.resetDownloadFileTransferList()
      sendRPC(IRPCActionType.MANAGE_GET_BUCKET_LIST_RECURSIVELY, configMap.alias, paramGet)
      ipcRenderer.on(refreshDownloadFileTransferList, (_: IpcRendererEvent, data) => {
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
                  fileName: [undefined, true].includes(manageStore.config.settings.isDownloadFolderKeepDirStructure)
                    ? `/${item.key.replace(/^\/+|\/+$/, '')}`
                    : item.fileName,
                  customUrl: currentCustomDomain.value,
                  downloadUrl: item.downloadUrl,
                  githubUrl: item.url,
                  githubPrivate: configMap.bucketConfig.private
                })
              })
            }
            sendRPC(IRPCActionType.MANAGE_DOWNLOAD_BUCKET_FILE, configMap.alias, param)
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
    })
    .catch(() => {
      ElNotification.info({
        title: $T('MANAGE_BUCKET_DOWNLOAD_FOLDER_BOX_TIP'),
        message: $T('MANAGE_BUCKET_DOWNLOAD_FOLDER_CANCEL'),
        duration: 500
      })
    })
}

async function handleBatchDownload() {
  const defaultDownloadPath = await triggerRPC<string>(IRPCActionType.MANAGE_GET_DEFAULT_DOWNLOAD_FOLDER)
  const param = {
    downloadPath: manageStore.config.settings.downloadDir ?? defaultDownloadPath,
    maxDownloadFileCount: manageStore.config.settings.maxDownloadFileCount
      ? manageStore.config.settings.maxDownloadFileCount
      : 5,
    fileArray: [] as any[]
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
        githubPrivate: configMap.bucketConfig.private
      })
    }
  })
  sendRPC(IRPCActionType.MANAGE_DOWNLOAD_BUCKET_FILE, configMap.alias, param)
  handleCancelCheck()
  isShowDownloadPanel.value = true
}

function handleCheckAllChange() {
  const allSelected = selectedItems.value.length === filterList.value.length
  filterList.value.forEach((item: any) => {
    item.checked = !allSelected
  })
}

function handleCreateFolder() {
  ElMessageBox.prompt($T('MANAGE_BUCKET_CREATE_FOLDER_BOX_TITLE'), $T('MANAGE_BUCKET_CREATE_FOLDER_BOX_TIP'), {
    confirmButtonText: $T('MANAGE_BUCKET_CREATE_FOLDER_BOX_CONFIRM'),
    cancelButtonText: $T('MANAGE_BUCKET_CREATE_FOLDER_BOX_CANCEL'),
    inputPattern: /^[\p{Unified_Ideograph}_a-zA-Z0-9-]+$/u,
    inputErrorMessage: $T('MANAGE_BUCKET_CREATE_FOLDER_ERROR_MSG')
  })
    .then(async ({ value }) => {
      let formatedPath = value
      formatedPath = trimPath(formatedPath)
      const param = {
        // tcyun
        bucketName: configMap.bucketName,
        region: configMap.bucketConfig.Location,
        key: currentPrefix.value.slice(1) + formatedPath + '/',
        githubBranch: currentCustomDomain.value
      }
      const res = await triggerRPC<any>(IRPCActionType.MANAGE_CREATE_BUCKET_FOLDER, configMap.alias, param)
      if (res) {
        ElMessage.success($T('MANAGE_BUCKET_CREATE_FOLDER_SUCCESS'))
      } else {
        ElMessage.error($T('MANAGE_BUCKET_CREATE_FOLDER_FAIL'))
      }
    })
    .catch(() => {})
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
    ElMessage.warning($T('MANAGE_BUCKET_UPLOAD_URL_ERROR_MSQ'))
    return
  }
  ElNotification({
    title: $T('MANAGE_BUCKET_UPLOAD_URL_NOT_TITLE'),
    message: $T('MANAGE_BUCKET_UPLOAD_URL_NOT_MSG'),
    type: 'success',
    duration: 1000
  })
  const res = await triggerRPC<any>(IRPCActionType.MANAGE_DOWNLOAD_FILE_FROM_URL, urlList)
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
      matchedFiles[i].newName = customStrReplace(
        matchedFiles[i].fileName,
        batchRenameMatch.value,
        batchRenameReplace.value
      )
    } else {
      matchedFiles[i].newName =
        customStrReplace(matchedFiles[i].fileName.split('.')[0], batchRenameMatch.value, batchRenameReplace.value) +
        '.' +
        matchedFiles[i].fileName.split('.')[1]
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
  const duplicateFilesNum = matchedFiles.filter(
    (item: any) => matchedFiles.filter((item2: any) => item2.newName === item.newName).length > 1
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
        customUrl: currentCustomDomain.value
      }
      triggerRPC<any>(IRPCActionType.MANAGE_RENAME_BUCKET_FILE, configMap.alias, param).then((res: any) => {
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
    ElMessageBox.confirm(
      `${$T('MANAGE_BUCKET_BATCH_RENAME_REPEATED_MSG_A')} ${duplicateFilesNum} ${$T('MANAGE_BUCKET_BATCH_RENAME_REPEATED_MSG_B')}`,
      $T('MANAGE_BUCKET_BATCH_RENAME_REPEATED_MSG_C'),
      {
        confirmButtonText: $T('MANAGE_BUCKET_BATCH_RENAME_REPEATED_CONFIRM'),
        cancelButtonText: $T('MANAGE_BUCKET_BATCH_RENAME_REPEATED_CANCEL'),
        type: 'warning'
      }
    )
      .then(() => {
        const promiseList = [] as any[]
        for (let i = 0; i < matchedFiles.length; i++) {
          promiseList.push(renamefunc(matchedFiles[i]))
        }
        Promise.allSettled(promiseList).then(() => {
          ElMessage.success(
            `${$T('MANAGE_BUCKET_BATCH_RENAME_RESULT_MSG_A')} ${successCount},${$T('MANAGE_BUCKET_BATCH_RENAME_RESULT_MSG_B')} ${failCount}`
          )
        })
      })
      .catch(() => {
        ElMessage.info($T('MANAGE_BUCKET_BATCH_RENAME_CANCEL'))
      })
  } else {
    const promiseList = [] as any[]
    for (let i = 0; i < matchedFiles.length; i++) {
      promiseList.push(renamefunc(matchedFiles[i]))
    }
    Promise.allSettled(promiseList).then(() => {
      ElMessage.success(
        `${$T('MANAGE_BUCKET_BATCH_RENAME_RESULT_MSG_A')} ${successCount},${$T('MANAGE_BUCKET_BATCH_RENAME_RESULT_MSG_B')} ${failCount}`
      )
    })
  }
}

function handleBatchCopyInfo() {
  if (selectedItems.value.length === 0) {
    ElMessage.warning($T('MANAGE_BUCKET_BATCH_COPY_INFO_ERROR_MSG'))
    return
  }
  const result = {} as IStringKeyMap
  selectedItems.value.forEach((item: any) => {
    result[item.fileName] = item
  })
  clipboard.writeText(JSON.stringify(result, null, 2))
  ElMessage.success(
    `${$T('MANAGE_BUCKET_BATCH_COPY_INFO_MSG_A')} ${selectedItems.value.length} ${$T('MANAGE_BUCKET_BATCH_COPY_INFO_MSG_B')}`
  )
}

async function copyLink(item: any, type: string) {
  copyToClipboard(await formatLink(item.url, item.fileName, type, manageStore.config.settings.customPasteFormat))
}

async function handleBatchCopyLink(type: string) {
  if (!selectedItems.value.length) {
    ElMessage.warning($T('MANAGE_BUCKET_BATCH_COPY_URL_ERROR_MSG'))
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
        manageStore.config.settings.customPasteFormat
      )
      result.push(url)
    }
  }
  clipboard.writeText(result.join('\n'))
  ElMessage.success(
    `${$T('MANAGE_BUCKET_BATCH_COPY_URL_MSG_A')} ${result.length} ${$T('MANAGE_BUCKET_BATCH_COPY_URL_MSG_B')}`
  )
}

function cancelLoading() {
  ElMessageBox.confirm($T('MANAGE_BUCKET_CANCEL_LOADING_TITLE'), $T('MANAGE_BUCKET_CANCEL_LOADING_MSG'), {
    confirmButtonText: $T('MANAGE_BUCKET_CANCEL_LOADING_CONFIRM'),
    cancelButtonText: $T('MANAGE_BUCKET_CANCEL_LOADING_CANCEL'),
    type: 'warning'
  })
    .then(() => {
      isLoadingData.value = false
      ipcRenderer.send('cancelLoadingFileList', cancelToken.value)
      ElMessage.success($T('MANAGE_BUCKET_CANCEL_LOADING_SUCCESS'))
    })
    .catch(() => {})
}

function cancelDownloadLoading() {
  ElMessageBox.confirm(
    $T('MANAGE_BUCKET_CANCEL_DOWNLOAD_LOADING_TITLE'),
    $T('MANAGE_BUCKET_CANCEL_DOWNLOAD_LOADING_MSG'),
    {
      confirmButtonText: $T('MANAGE_BUCKET_CANCEL_DOWNLOAD_LOADING_CONFIRM'),
      cancelButtonText: $T('MANAGE_BUCKET_CANCEL_DOWNLOAD_LOADING_CANCEL'),
      type: 'warning'
    }
  )
    .then(() => {
      isLoadingData.value = false
      ipcRenderer.send(cancelDownloadLoadingFileList, downloadCancelToken.value)
      ElMessage.success($T('MANAGE_BUCKET_CANCEL_DOWNLOAD_LOADING_SUCCESS'))
    })
    .catch(() => {})
}

async function getBucketFileListBackStage() {
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
    customUrl: currentCustomDomain.value,
    currentPage: currentPageNumber.value,
    cancelToken: cancelToken.value,
    cdnUrl: configMap.cdnUrl
  } as IStringKeyMap
  isLoadingData.value = true
  const fileTransferStore = useFileTransferStore()
  fileTransferStore.resetFileTransferList()
  const picBedNamesArr = ['webdavplist', 'local', 'sftp']
  if (picBedNamesArr.includes(currentPicBedName.value)) {
    param.baseDir = configMap.baseDir
    param.webPath = configMap.webPath
  }
  sendRPC(IRPCActionType.MANAGE_GET_BUCKET_LIST_BACKSTAGE, configMap.alias, param)
  ipcRenderer.on('refreshFileTransferList', (_: IpcRendererEvent, data) => {
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
          fullList: currentPageFilesInfo
        })
      )
    })
    if (fileTransferStore.isFinished() && fileTransferInterval) {
      isLoadingData.value = false
      clearInterval(fileTransferInterval)
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

async function getBucketFileList() {
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
    customUrl: currentCustomDomain.value,
    currentPage: currentPageNumber.value
  }
  return await triggerRPC<any>(IRPCActionType.MANAGE_GET_BUCKET_FILE_LIST, configMap.alias, param)
}

function handleBatchDeleteInfo() {
  const confirmTitle = `${$T('MANAGE_BUCKET_BATCH_DELETE_CONFIRM_TITLE_A')} ${selectedItems.value.length} ${$T('MANAGE_BUCKET_BATCH_DELETE_CONFIRM_TITLE_B')}`
  ElMessageBox.confirm(confirmTitle, $T('MANAGE_BUCKET_BATCH_DELETE_CONFIRM_MSG'), {
    confirmButtonText: $T('MANAGE_BUCKET_BATCH_DELETE_CONFIRM_CONFIRM'),
    cancelButtonText: $T('MANAGE_BUCKET_BATCH_DELETE_CONFIRM_CANCEL'),
    type: 'warning',
    center: true,
    draggable: true
  })
    .then(async () => {
      const copiedSelectedItems = JSON.parse(JSON.stringify(selectedItems.value))
      let successCount = 0
      let failCount = 0

      for (const item of copiedSelectedItems) {
        const param = {
          bucketName: configMap.bucketName,
          region: configMap.bucketConfig.Location,
          key: item.key,
          DeleteHash: item.sha,
          githubBranch: currentCustomDomain.value
        }
        const result = item.isDir
          ? await triggerRPC<any>(IRPCActionType.MANAGE_DELETE_BUCKET_FOLDER, configMap.alias, param)
          : await triggerRPC<any>(IRPCActionType.MANAGE_DELETE_BUCKET_FILE, configMap.alias, param)
        if (result) {
          successCount++
          currentPageFilesInfo.splice(
            currentPageFilesInfo.findIndex((j: any) => j.key === item.key),
            1
          )
          if (!paging.value) {
            const table = fileCacheDbInstance.table(currentPicBedName.value)
            table
              .where('key')
              .equals(getTableKeyOfDb())
              .modify((l: any) => {
                l.value.fullList.splice(
                  l.value.fullList.findIndex((j: any) => j.key === item.key),
                  1
                )
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
    })
    .catch(() => {
      ElMessage.info($T('MANAGE_BUCKET_BATCH_DELETE_CANCEL'))
    })
}

function handleDeleteFile(item: any) {
  ElMessageBox.confirm(
    `${$T('MANAGE_BUCKET_DELETE_CONFIRM_TITLE')} ${item.isDir ? $T('MANAGE_BUCKET_DELETE_CONFIRM_TITLE_FOLDER') : $T('MANAGE_BUCKET_DELETE_CONFIRM_TITLE_FILE')} ${item.fileName} ${item.isDir ? $T('MANAGE_BUCKET_DELETE_CONFIRM_TITLE_FOLDER_A') : ''}, ${$T('MANAGE_BUCKET_DELETE_CONFIRM_TITLE_C')}`,
    $T('MANAGE_BUCKET_DELETE_CONFIRM_MSG'),
    {
      confirmButtonText: $T('MANAGE_BUCKET_DELETE_CONFIRM_CONFIRM'),
      cancelButtonText: $T('MANAGE_BUCKET_DELETE_CONFIRM_CANCEL'),
      type: 'warning',
      center: true,
      draggable: true
    }
  )
    .then(async () => {
      let res = false
      const param = {
        bucketName: configMap.bucketName,
        region: configMap.bucketConfig.Location,
        key: item.key,
        DeleteHash: item.sha,
        githubBranch: currentCustomDomain.value
      }
      if (item.isDir) {
        ElNotification.info({
          title: $T('MANAGE_BUCKET_DELETE_ERROR_MSG_TITLE'),
          message: $T('MANAGE_BUCKET_DELETE_ERROR_MSG_MSG'),
          duration: 1000
        })
        res = await triggerRPC<any>(IRPCActionType.MANAGE_DELETE_BUCKET_FOLDER, configMap.alias, param)
      } else {
        res = await triggerRPC<any>(IRPCActionType.MANAGE_DELETE_BUCKET_FILE, configMap.alias, param)
      }
      if (res) {
        ElMessage.success($T('MANAGE_BUCKET_DELETE_SUCCESS'))
        currentPageFilesInfo.splice(
          currentPageFilesInfo.findIndex((i: any) => i.key === item.key),
          1
        )
        if (!paging.value) {
          const table = fileCacheDbInstance.table(currentPicBedName.value)
          table
            .where('key')
            .equals(getTableKeyOfDb())
            .modify((l: any) => {
              l.value.fullList.splice(
                l.value.fullList.findIndex((i: any) => i.key === item.key),
                1
              )
            })
        }
      } else {
        ElMessage.error($T('MANAGE_BUCKET_DELETE_FAIL'))
      }
    })
    .catch(() => {
      ElMessage.info($T('MANAGE_BUCKET_DELETE_CANCEL'))
    })
}

function handleRenameFile(item: any) {
  batchRenameMatch.value = path.basename(item.fileName, path.extname(item.fileName))
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
      batchRenameReplace.value
    )
  } else {
    itemToBeRenamed.value.newName =
      customStrReplace(itemToBeRenamed.value.fileName.split('.')[0], batchRenameMatch.value, batchRenameReplace.value) +
      '.' +
      itemToBeRenamed.value.fileName.split('.')[1]
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
    customUrl: currentCustomDomain.value
  }
  triggerRPC<any>(IRPCActionType.MANAGE_RENAME_BUCKET_FILE, configMap.alias, param).then((res: any) => {
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
        '/'
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
                  '/'
                )
                i.url = `${currentCustomDomain.value}${currentPrefix.value}${itemToBeRenamed.value.newName}`
                i.formatedTime = new Date().toLocaleString()
              }
            })
          })
      }
      ElMessage.success($T('MANAGE_BUCKET_RENAME_SUCCESS'))
    } else {
      ElMessage.error($T('MANAGE_BUCKET_RENAME_ERROR_MSG'))
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
    rawUrl: item.url
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
    rawUrl: item.url
  }
  return await triggerRPC<any>(IRPCActionType.MANAGE_GET_PRE_SIGNED_URL, configMap.alias, param)
}

function copyToClipboard(text: string) {
  clipboard.writeText(text)
  ElMessage.success($T('MANAGE_BUCKET_COPY_SUCCESS'))
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
          sendRPC(IRPCActionType.MANAGE_OPEN_LOCAL_FILE, item.targetFilePath)
        }}
      >
        <ElTooltip effect='dark' content={item.sourceFileName} placement='top'>
          <ElLink style='color: black;font-size: 14px;font-family: Arial, Helvetica, sans-serif;'>
            {formatFileName(item.sourceFileName)}
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
      <span style='color: black;font-size: 14px;font-family: Arial, Helvetica, sans-serif;'>{item.finishTime}</span>
    )
  },
  {
    key: 'status',
    title: $T('MANAGE_BUCKET_DOWNLOAD_COLUMN_STATUS'),
    width: 100,
    cellRenderer: ({ rowData: item }) =>
      item.status === 'downloaded' ? (
        <ElTag type='success' style='font-size: 14px;font-family: Arial, Helvetica, sans-serif;'>
          {$T('MANAGE_BUCKET_DOWNLOAD_COLUMN_STATUS_SUCCESS')}
        </ElTag>
      ) : (
        <ElTag type='danger' style='font-size: 14px;font-family: Arial, Helvetica, sans-serif;'>
          {$T('MANAGE_BUCKET_DOWNLOAD_COLUMN_STATUS_FAIL')}
        </ElTag>
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
      <ElTooltip effect='dark' content={item.sourceFileName} placement='top'>
        <span style='color: black;font-size: 14px;font-family: Arial, Helvetica, sans-serif;'>
          {formatFileName(item.sourceFileName)}
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
      <ElTooltip effect='dark' content={item.targetFilePath} placement='top'>
        <span style='color: black;font-size: 14px;font-family: Arial, Helvetica, sans-serif;'>
          {formatFileName(item.targetFilePath)}
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
      <span style='color: black;font-size: 14px;font-family: Arial, Helvetica, sans-serif;'>{item.finishTime}</span>
    )
  },
  {
    key: 'status',
    title: $T('MANAGE_BUCKET_UPLOAD_COLUMN_STATUS'),
    width: 100,
    cellRenderer: ({ rowData: item }) =>
      item.status === 'uploaded' ? (
        <ElTag type='success' style='font-size: 14px;font-family: Arial, Helvetica, sans-serif;'>
          {$T('MANAGE_BUCKET_UPLOAD_COLUMN_STATUS_SUCCESS')}
        </ElTag>
      ) : (
        <ElTag type='danger' style='font-size: 14px;font-family: Arial, Helvetica, sans-serif;'>
          {$T('MANAGE_BUCKET_UPLOAD_COLUMN_STATUS_FAIL')}
        </ElTag>
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
      <span style='color: black;font-size: 14px;font-family: Arial, Helvetica, sans-serif;'>
        {formatFileName(item.sourceFileName)}
      </span>
    )
  },
  {
    key: 'progress',
    title: $T('MANAGE_BUCKET_DOWNLOADING_COLUMN_PROGRESS'),
    dataKey: 'progress',
    width: 300,
    cellRenderer: ({ rowData: item }) => (
      <ElProgress percentage={item.progress} status='success' strokeWidth={20} textInside style='width: 100%;' />
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
      <span style='color: black;font-size: 14px;font-family: Arial, Helvetica, sans-serif;'>
        {formatFileName(item.sourceFileName)}
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
        status='success'
        strokeWidth={20}
        textInside
        style='width: 100%;'
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
    cellRenderer: ({ rowData: item }) =>
      item.isFolder ? (
        <span>
          <ElIcon color='#409EFF' style='position: relative;left: -5px;'>
            <FolderOpened />
          </ElIcon>
          <span style='font-weight: bold;color: black;font-size: 14px;font-family: Arial, Helvetica, sans-serif;'>
            {formatFileName(item.name)}
          </span>
        </span>
      ) : (
        <span>
          <ElIcon color='#409EFF'>
            <Document />
          </ElIcon>
          <span style='color: black;font-size: 14px;font-family: Arial, Helvetica, sans-serif;'>
            {formatFileName(item.name)}
          </span>
        </span>
      )
  },
  {
    key: 'fileSize',
    title: $T('MANAGE_BUCKET_UPLOADED_COLUMN_FILESIZE'),
    dataKey: 'fileSize',
    width: 100,
    cellRenderer: ({ rowData: item }) => (
      <span style='color: black;font-size: 14px;font-family: Arial, Helvetica, sans-serif;'>
        {formatFileSize(item.fileSize)}
      </span>
    )
  },
  {
    key: 'fileNumber',
    title: $T('MANAGE_BUCKET_UPLOADED_COLUMN_FILENUM'),
    width: 100,
    cellRenderer: ({ rowData: item }) =>
      !item.isFolder ? (
        <template></template>
      ) : (
        <span style='color: black;font-size: 14px;font-family: Arial, Helvetica, sans-serif;'>
          {item.filesList.length}
        </span>
      )
  }
]

function rowClass({ rowData }: Parameters<RowClassNameGetter<any>>[0]) {
  return rowData.checked ? 'file-list-row-checked' : ''
}

const columns: Column<any>[] = [
  {
    key: 'checked',
    title: '',
    dataKey: 'checked',
    width: 30,
    cellRenderer: ({ rowData: item }) => <ElCheckbox v-model={item.checked}></ElCheckbox>
  },
  {
    key: 'icon',
    title: '',
    width: 30,
    cellRenderer: ({ rowData: item }) => (
      <ElPopover
        trigger='hover'
        width='200'
        disabled={!item.isImage}
        placement='right'
        persistent={false}
        teleported={true}
      >
        {{
          reference: () =>
            !item.isDir ? (
              currentPicBedName.value !== 'webdavplist' ? (
                currentPicBedName.value === 's3plist' && item.isImage && isUsePreSignedUrl.value ? (
                  <ImagePreSignTsx
                    isShowThumbnail={isShowThumbnail.value}
                    item={item}
                    config={handleGetS3Config(item)}
                    url={item.url}
                    alias={configMap.alias}
                  />
                ) : (
                  <ElImage
                    src={
                      isShowThumbnail.value
                        ? item.isImage
                          ? item.url
                          : require(`./assets/icons/${getFileIconPath(item.fileName ?? '')}`)
                        : require(`./assets/icons/${getFileIconPath(item.fileName ?? '')}`)
                    }
                    fit='contain'
                    style={{ width: '20px', height: '20px' }}
                  >
                    {{
                      placeholder: () => (
                        <ElIcon>
                          <Loading />
                        </ElIcon>
                      ),
                      error: () => (
                        <ElImage
                          src={require(`./assets/icons/${getFileIconPath(item.fileName ?? '')}`)}
                          fit='contain'
                          style={{ width: '20px', height: '20px' }}
                        />
                      )
                    }}
                  </ElImage>
                )
              ) : item.isImage ? (
                <ImageWebdavTsx
                  isShowThumbnail={isShowThumbnail.value}
                  item={item}
                  config={handleGetWebdavConfig()}
                  url={item.url}
                />
              ) : (
                <ElImage
                  src={require(`./assets/icons/${getFileIconPath(item.fileName ?? '')}`)}
                  fit='contain'
                  style={{ width: '20px', height: '20px' }}
                ></ElImage>
              )
            ) : (
              <ElImage
                src={require('./assets/icons/folder.webp')}
                fit='contain'
                style={{ width: '20px', height: '20px' }}
              />
            ),
          default: () =>
            currentPicBedName.value === 'webdavplist' && item.isImage ? (
              <ImageWebdavTsx
                isShowThumbnail={isShowThumbnail.value}
                item={item}
                config={handleGetWebdavConfig()}
                url={item.url}
              />
            ) : currentPicBedName.value === 's3plist' && item.isImage && isUsePreSignedUrl.value ? (
              <ImagePreSignTsx
                isShowThumbnail={isShowThumbnail.value}
                item={item}
                config={handleGetS3Config(item)}
                url={item.url}
                alias={configMap.alias}
              />
            ) : (
              <ElImage
                src={item.isImage ? item.url : require(`./assets/icons/${getFileIconPath(item.fileName ?? '')}`)}
                fit='contain'
              >
                {{
                  placeholder: () => (
                    <ElIcon>
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
    )
  },
  {
    key: 'fileName',
    title: $T('MANAGE_BUCKET_FILE_COLUMN_FILENAME'),
    dataKey: 'fileName',
    width: 300,
    cellRenderer: ({ cellData: fileName, rowData: item }) => (
      <div onClick={() => handleClickFile(item)}>
        <ElTooltip placement='top' content={fileName}>
          <div style='font-size: 14px;color: #303133;font-family: Arial, Helvetica, sans-serif;'>
            {formatFileName(item.fileName ?? '', 40)}
          </div>
        </ElTooltip>
      </div>
    )
  },
  {
    key: 'rename',
    title: '',
    width: 30,
    cellRenderer: ({ rowData: item }) =>
      item.isDir || !isShowRenameFileIcon.value ? (
        item.isDir ? (
          <ElIcon size='15' style='cursor: pointer;' color='#409EFF' onClick={() => handleFolderBatchDownload(item)}>
            <Download />
          </ElIcon>
        ) : (
          <template></template>
        )
      ) : (
        <ElIcon size='15' style='cursor: pointer;' color='#409EFF' onClick={() => handleRenameFile(item)}>
          <Edit />
        </ElIcon>
      )
  },
  {
    key: 'copy',
    title: '',
    width: 30,
    cellRenderer: ({ rowData: item }) => (
      <ElTooltip placement='top' content={$T('MANAGE_BUCKET_FILE_COLUMN_COPY_URL')} effect='light' hide-after={150}>
        <ElDropdown teleported={true}>
          {{
            default: () => (
              <ElIcon
                size='15'
                style='cursor: pointer;'
                color='#409EFF'
                onClick={async () =>
                  copyToClipboard(
                    await formatLink(
                      item.url,
                      item.fileName,
                      manageStore.config.settings.pasteFormat ?? '$markdown',
                      manageStore.config.settings.customPasteFormat ?? '$url'
                    )
                  )
                }
              >
                <CopyDocument />
              </ElIcon>
            ),
            dropdown: () => (
              <ElDropdownMenu>
                <ElDropdownItem onClick={async () => copyToClipboard(await formatLink(item.url, item.fileName, 'url'))}>
                  Url
                </ElDropdownItem>
                <ElDropdownItem
                  onClick={async () => copyToClipboard(await formatLink(item.url, item.fileName, 'markdown'))}
                >
                  Markdown
                </ElDropdownItem>
                <ElDropdownItem
                  onClick={async () => copyToClipboard(await formatLink(item.url, item.fileName, 'markdown-with-link'))}
                >
                  Markdown-link
                </ElDropdownItem>
                <ElDropdownItem
                  onClick={async () => copyToClipboard(await formatLink(item.url, item.fileName, 'html'))}
                >
                  Html
                </ElDropdownItem>
                <ElDropdownItem
                  onClick={async () => copyToClipboard(await formatLink(item.url, item.fileName, 'bbcode'))}
                >
                  BBCode
                </ElDropdownItem>
                <ElDropdownItem
                  onClick={async () =>
                    copyToClipboard(
                      await formatLink(item.url, item.fileName, 'custom', manageStore.config.settings.customPasteFormat)
                    )
                  }
                >
                  Custom
                </ElDropdownItem>
                {isShowPresignedUrl.value ? (
                  <ElDropdownItem
                    onClick={async () => {
                      const res = await getPreSignedUrl(item)
                      copyToClipboard(res)
                    }}
                  >
                    preSignURL
                  </ElDropdownItem>
                ) : (
                  <template></template>
                )}
              </ElDropdownMenu>
            )
          }}
        </ElDropdown>
      </ElTooltip>
    )
  },
  {
    key: 'info',
    title: '',
    width: 30,
    cellRenderer: ({ rowData: item }) => (
      <ElTooltip placement='top' content={$T('MANAGE_BUCKET_FILE_COLUMN_INFO')} effect='light' hide-after={150}>
        <ElIcon size='15' style='cursor: pointer;' color='#409EFF' onClick={() => handleShowFileInfo(item)}>
          <Document />
        </ElIcon>
      </ElTooltip>
    )
  },
  {
    key: 'placeholder',
    title: '',
    width: 30,
    cellRenderer: () => <span></span>
  },
  {
    key: 'fileSize',
    title: $T('MANAGE_BUCKET_FILE_COLUMN_FILESIZE'),
    width: 100,
    dataKey: 'fileSize',
    cellRenderer: ({ cellData: fileSize, rowData: item }) => (
      <div
        style='font-size: 14px;color: #303133;font-family: Arial, Helvetica, sans-serif;height: 100%;display: flex;align-items: center;'
        onClick={() => handleCheckChangeOther(item)}
      >
        {formatFileSize(fileSize)}
      </div>
    )
  },
  {
    key: 'formatedTime',
    title: $T('MANAGE_BUCKET_FILE_COLUMN_TIME'),
    width: 200,
    dataKey: 'formatedTime',
    cellRenderer: ({ cellData: formatedTime, rowData: item }) => (
      <div
        style='font-size: 14px;color: #303133;font-family: Arial, Helvetica, sans-serif;height: 100%;display: flex;align-items: center;'
        onClick={() => handleCheckChangeOther(item)}
      >
        {formatedTime}
      </div>
    )
  },
  {
    key: 'delete',
    title: '',
    width: 30,
    cellRenderer: ({ rowData: item }) => (
      <ElIcon style='cursor: pointer;' color='red' onClick={() => handleDeleteFile(item)}>
        <DeleteFilled />
      </ElIcon>
    )
  }
]

onBeforeMount(async () => {
  await manageStore.refreshConfig()
  isShowLoadingPage.value = true
  await initCustomDomainList()
  await resetParam(true)
  isShowLoadingPage.value = false
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
