/*
 *UI布局和部分样式代码参考了https://github.com/willnewii/qiniuClient
 *感谢作者@willnewii
 */
<template>
  <div
    v-loading="showLoadingPage"
    element-loading-text="加载文件中..."
    :element-loading-spinner="svg"
    element-loading-svg-view-box="0, 0, 50, 50"
    element-loading-background="rgba(122, 122, 122, 0.5)"
  >
    <div class="layout-header">
      <div
        style="flex-grow: 1;margin-left: 16px"
      >
        <el-select
          v-if="showCustomUrlSelectList && customUrlList.length > 1"
          v-model="currentCustomUrl"
          placeholder="请选择自定义域名"
          style="width: 200px;"
          @change="handelChangeCustomUrl"
        >
          <el-option
            v-for="item in customUrlList"
            :key="item"
            :label="item.label"
            :value="item.value"
          />
        </el-select>
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
            content="文件上传(支持多选)"
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
            content="从URL上传"
            placement="bottom"
          >
            <el-icon
              class="icon"
              size="25px"
              style="margin-left: 10px;"
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
          @click="handelCreateFolder"
        >
          <el-tooltip
            class="item"
            effect="dark"
            content="新建文件夹"
            placement="bottom"
          >
            <el-icon
              class="icon"
              size="25px"
              style="margin-left: 10px;"
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
            content="下载页面"
            placement="bottom"
          >
            <el-icon
              class="icon"
              size="25px"
              style="margin-left: 10px;"
            >
              <Download />
            </el-icon>
          </el-tooltip>
        </el-button>
      </div>
      <div>
        <el-button type="text">
          <el-tooltip
            class="item"
            effect="dark"
            content="批量复制链接"
            placement="right"
          >
            <el-dropdown>
              <el-icon
                class="icon"
                size="25px"
                :color="selectedItems.length > 0 ? 'red' : 'gray'"
                style="margin-left: 10px;"
                @click="handelBatchCopyLink(manageStore.config.settings.customPasteFormat)"
              >
                <Link />
              </el-icon>
              <template #dropdown>
                <template v-if="['tcyun', 'qiniu', 'aliyun', 'github'].includes(currentPicBedName)">
                  <el-dropdown-item
                    v-for="i in [...linkArray, { key: '预签名链接', value: 'preSignedUrl' }]"
                    :key="i.key"
                    @click="handelBatchCopyLink(i.value)"
                  >
                    {{ i.key }}
                  </el-dropdown-item>
                </template>
                <el-dropdown-item
                  v-for="i in linkArray"
                  v-else
                  :key="i.value+i.key"
                  @click="handelBatchCopyLink(i.value)"
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
            content="复制文件信息"
            placement="bottom"
          >
            <el-icon
              class="icon"
              size="25px"
              :color="selectedItems.length > 0 ? 'red' : 'gray'"
              style="margin-left: 10px;"
              @click="handelBatchCopyInfo"
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
            content="强制刷新文件列表"
            placement="bottom"
          >
            <el-icon
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
        placeholder="搜索文件"
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
            v-for="(item, index) in configMap.prefix.slice(0, configMap.prefix.length - 1).split('/')"
            :key="index"
            style="flex-shrink: 0;font-size: 12px;color: #606266;font-family: Arial, Helvetica, sans-serif;cursor: pointer;"
            @click="handleBreadcrumbClick(index)"
          >
            <el-link>
              {{ item === '' ? '根目录' : item }}
            </el-link>
          </el-breadcrumb-item>
        </template>
        <el-breadcrumb-item
          v-else
          style="flex-shrink: 0;font-size: 12px;color: #606266;font-family: Arial, Helvetica, sans-serif;cursor: pointer;"
        >
          <el-link>
            根目录
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
            <span style="margin-right: 5px;padding-left: 5px;">文件数: {{ currentPageFilesInfo.length }} </span>
          </span>
          <span>
            <el-icon
              :size="14"
              style="margin-right: 5px;"
            >
              <Coin />
            </el-icon>
            <span style="padding-left: 5px;">总大小: {{ calculateAllFileSize }}</span>
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
          @click="handleCheckAllChange"
        >
          全选
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
          @click="handelCancelCheck"
        >
          取消
        </el-button>
        <el-button
          class="btn"
          size="small"
          type="primary"
          plain
          @click="handleReverseCheck"
        >
          反选
        </el-button>
        <el-button
          class="btn"
          size="small"
          type="primary"
          plain
          @click="handleCheckAllChange"
        >
          全选
        </el-button>
        <el-button
          class="btn"
          size="small"
          type="success"
          plain
          :icon="Download"
          @click="handelBatchDownload"
        >
          下载({{ selectedItems.length }})
        </el-button>
        <el-button
          class="btn"
          size="small"
          type="danger"
          :icon="DeleteFilled"
          @click="handelBatchDeleteInfo"
        >
          删除({{ selectedItems.length }})
        </el-button>
      </div>
      <el-dropdown>
        <el-button
          size="small"
          type="primary"
          plain
          :icon="Sort"
        >
          排序
        </el-button>
        <template #dropdown>
          <el-dropdown-item @click="sortFile('name')">
            文件名
          </el-dropdown-item>
          <el-dropdown-item @click="sortFile('size')">
            文件大小
          </el-dropdown-item>
          <el-dropdown-item @click="sortFile('ext')">
            文件类型
          </el-dropdown-item>
          <el-dropdown-item @click="sortFile('time')">
            上传时间
          </el-dropdown-item>
          <el-dropdown-item @click="sortFile('check')">
            选中状态
          </el-dropdown-item>
        </template>
      </el-dropdown>
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
      title="请输入URL，支持多个URL，以换行分隔"
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
          取消
        </el-button>
        <el-button
          type="primary"
          style="font-size: 12px;font-weight: 500;"
          @click="handelUploadFromUrl"
        >
          确定
        </el-button>
      </template>
    </el-dialog>
    <div
      class="layout-table"
      style="margin: 0 15px 15px 15px;overflow-y: auto;overflow-x: hidden;height: 80vh;"
    >
      <el-auto-resizer>
        <template #default="{ height, width }">
          <el-table-v2
            ref="elTable"
            :columns="columns"
            :data="currentPageFilesInfo"
            :row-class="rowClass"
            :width="width"
            :height="height"
          />
        </template>
      </el-auto-resizer>
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
      title="文件信息"
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
          复制JSON格式信息
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
        加载中，点击取消
      </el-button>
    </el-affix>
    <el-drawer
      v-model="isShowUploadPanel"
      title="上传文件"
      size="60%"
      @open="startRefreshUploadTask"
      @close="stopRefreshUploadTask"
    >
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
            拖放上传支持递归上传文件夹
            <span
              style="color: #409EFF;font-size: 2.5vh;font-family: Arial, Helvetica, sans-serif;align-items: center;display: flex;justify-content: center;flex-direction: column;"
            >
              或：点击选择文件(不支持文件夹)
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
            {{ isLoadingUploadPanelFiles? '读取文件中': '上传' }}
          </el-button>
          <span>
            <el-button
              type="warning"
              plain
              :disabled="isLoadingUploadPanelFiles"
              @click="clearTableData"
            >
              清空
            </el-button>
          </span>
        </el-button-group>
      </div>
      <el-tabs
        v-model="activeUpLoadTab"
        stretch
      >
        <el-tab-pane
          :label="`上传中(${uploadingTaskList.length})`"
          name="uploading"
        >
          <el-button-group size="small">
            <el-button
              type="primary"
              plain
              :icon="Document"
              @click="handelCopyUploadingTaskInfo"
            >
              复制上传任务信息
            </el-button>
            <el-button
              type="primary"
              plain
              :icon="DeleteFilled"
              @click="handelDeleteUploadedTask"
            >
              清空已完成任务
            </el-button>
            <el-button
              type="primary"
              plain
              :icon="DeleteFilled"
              @click="handelDeleteAllUploadedTask"
            >
              清空所有任务
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
          :label="`已完成(${uploadedTaskList.length})`"
          name="finished"
        >
          <el-button-group size="small">
            <el-button
              type="primary"
              plain
              :icon="Document"
              @click="handelCopyUploadingTaskInfo"
            >
              复制上传任务信息
            </el-button>
            <el-button
              type="primary"
              plain
              :icon="DeleteFilled"
              @click="handelDeleteUploadedTask"
            >
              清空已完成任务
            </el-button>
            <el-button
              type="primary"
              plain
              :icon="DeleteFilled"
              @click="handelDeleteAllUploadedTask"
            >
              清空所有任务
            </el-button>
          </el-button-group>
          <div style="height:500px;">
            <el-auto-resizer>
              <template #default="{ height, width }">
                <el-table-v2
                  :columns="uploadedTaskColumns"
                  :data="uploadedTaskList"
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
      title="下载页面"
      size="60%"
      @open="startRefreshDownloadTask"
      @close="stopRefreshDownloadTask"
    >
      <el-tabs
        v-model="activeDownLoadTab"
        stretch
      >
        <el-tab-pane
          :label="`下载中(${downloadingTaskList.length})`"
          name="downloading"
        >
          <el-button-group size="small">
            <el-button
              type="primary"
              plain
              :icon="Document"
              @click="handelCopyDownloadingTaskInfo"
            >
              复制下载任务信息
            </el-button>
            <el-button
              type="primary"
              plain
              :icon="DeleteFilled"
              @click="handelDeleteDownloadedTask"
            >
              清空已完成任务
            </el-button>
            <el-button
              type="primary"
              plain
              :icon="DeleteFilled"
              @click="handelDeleteAllDownloadedTask"
            >
              清空所有任务
            </el-button>
            <el-button
              type="primary"
              plain
              :icon="Folder"
              @click="handelOpenDownloadedFolder"
            >
              打开下载目录
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
          :label="`已完成(${downloadedTaskList.length})`"
          name="finished"
        >
          <el-button-group size="small">
            <el-button
              type="primary"
              plain
              :icon="Document"
              @click="handelCopyDownloadingTaskInfo"
            >
              复制下载任务信息
            </el-button>
            <el-button
              type="primary"
              plain
              :icon="DeleteFilled"
              @click="handelDeleteDownloadedTask"
            >
              清空已完成任务
            </el-button>
            <el-button
              type="primary"
              plain
              :icon="DeleteFilled"
              @click="handelDeleteAllDownloadedTask"
            >
              清空所有任务
            </el-button>
            <el-button
              type="primary"
              plain
              :icon="Folder"
              @click="handelOpenDownloadedFolder"
            >
              打开下载目录
            </el-button>
          </el-button-group>
          <div style="height:600px;">
            <el-auto-resizer>
              <template #default="{ height, width }">
                <el-table-v2
                  :columns="downloadedTaskColumns"
                  :data="downloadedTaskList"
                  :width="width"
                  :height="height"
                />
              </template>
            </el-auto-resizer>
          </div>
        </el-tab-pane>
      </el-tabs>
    </el-drawer>
  </div>
</template>

<script lang="tsx" setup>
import { ref, reactive, watch, onBeforeMount, computed, onBeforeUnmount } from 'vue'
import { useRoute } from 'vue-router'
import { Folder, FolderAdd, Upload, CircleClose, Loading, CopyDocument, Edit, DocumentAdd, Link, Refresh, ArrowRight, HomeFilled, Document, Coin, Download, DeleteFilled, Sort, FolderOpened } from '@element-plus/icons-vue'
import { useManageStore } from '../store/manageStore'
import { renameFile, formatLink, formatFileName, getFileIconPath, formatFileSize, getExtension, isValidUrl } from '../utils/common'
import { ipcRenderer, clipboard, IpcRendererEvent } from 'electron'
import { fileCacheDbInstance } from '../store/bucketFileDb'
import { trimPath } from '~/main/manage/utils/common'
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
  ElTag
} from 'element-plus'
import type { Column, RowClassNameGetter } from 'element-plus'
import { useFileTransferStore } from '@/manage/store/manageStore'
import { v4 as uuidv4 } from 'uuid'
import path from 'path'
import { IUploadTask, IDownloadTask } from '~/main/manage/datastore/upDownTaskQueue'
import fs from 'fs-extra'

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
const svg = `
        <path class="path" d="
          M 30 15
          L 28 17
          M 25.61 25.61
          A 15 15, 0, 0, 1, 15 30
          A 15 15, 0, 1, 1, 27.99 7.5
          L 15 15
        " style="stroke-width: 4px; fill: rgba(0, 0, 0, 0)"/>
      `

const linkArray = [
  { key: 'Url', value: 'url' },
  { key: 'Markdown', value: 'markdown' },
  { key: 'Markdown-link', value: 'markdown-with-link' },
  { key: 'Html', value: 'html' },
  { key: 'BBCode', value: 'bbcode' },
  { key: '自定义', value: 'custom' }
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
const cancelToken = ref('')
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

const showCustomUrlSelectList = computed(() => ['tcyun', 'aliyun', 'qiniu', 'github'].includes(currentPicBedName.value))

const showCreateNewFolder = computed(() => ['tcyun', 'aliyun', 'qiniu', 'upyun', 'github'].includes(currentPicBedName.value))

const showRenameFileIcon = computed(() => ['tcyun', 'aliyun', 'qiniu', 'upyun'].includes(currentPicBedName.value))

const uploadingTaskList = computed(() => uploadTaskList.value.filter(item => ['uploading', 'queuing', 'paused'].includes(item.status)))

const uploadedTaskList = computed(() => uploadTaskList.value.filter(item => ['uploaded', 'failed', 'canceled'].includes(item.status)))

const downloadingTaskList = computed(() => downloadTaskList.value.filter(item => ['downloading', 'queuing', 'paused'].includes(item.status)))

const downloadedTaskList = computed(() => downloadTaskList.value.filter(item => ['downloaded', 'failed', 'canceled'].includes(item.status)))

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
            size: item.size
          })
        }
      })
      handelUploadFiles(files)
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

function handelUploadFiles (files: any[]) {
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
      renamedFileName: renameFileBeforeUpload(item.name)
    })
  })
  formateduploadPanelFilesList.forEach((item: any) => {
    item.key = currentPrefix.value + item.renamedFileName
  })
  clearTableData()
  const param = {
    // tcyun
    fileArray: [] as any[]
  }
  formateduploadPanelFilesList.forEach((item: any) => {
    param.fileArray.push({
      bucketName: configMap.bucketName,
      region: configMap.bucketConfig.Location,
      key: item.key,
      filePath: item.path,
      fileSize: item.size,
      fileName: item.rawName,
      githubBranch: currentCustomUrl.value
    })
  })
  ipcRenderer.send('uploadBucketFile', configMap.alias, param)
}

function handelCopyUploadingTaskInfo () {
  clipboard.writeText(JSON.stringify(uploadTaskList.value, null, 2))
  ElMessage.success('复制成功')
}

function handelCopyDownloadingTaskInfo () {
  clipboard.writeText(JSON.stringify(downloadTaskList.value, null, 2))
  ElMessage.success('复制成功')
}

function handelDeleteUploadedTask () {
  ipcRenderer.send('deleteUploadedTask')
  ElMessage.success('删除成功')
}

function handelDeleteAllUploadedTask () {
  ipcRenderer.send('deleteAllUploadedTask')
  ElMessage.success('删除成功')
}

function handelDeleteDownloadedTask () {
  ipcRenderer.send('deleteDownloadedTask')
  ElMessage.success('删除成功')
}

function handelDeleteAllDownloadedTask () {
  ipcRenderer.send('deleteAllDownloadedTask')
  ElMessage.success('删除成功')
}

const handelOpenDownloadedFolder = () => ipcRenderer.send('OpenDownloadedFolder', manageStore.config.settings.downloadDir)

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
  }
}

const currentPicBedName = computed<string>(() => manageStore.config.picBed[configMap.alias].picBedName)

const paging = computed(() => manageStore.config.picBed[configMap.alias].paging)

const itemsPerPage = computed(() => manageStore.config.picBed[configMap.alias].itemsPerPage)

const calculateAllFileSize = computed(() => formatFileSize(currentPageFilesInfo.reduce((total: any, item: { fileSize: any }) => total + item.fileSize, 0)) || '0')

const isShowThumbnail = computed(() => manageStore.config.settings.isShowThumbnail ?? false)
const isAutoRefresh = computed(() => manageStore.config.settings.isAutoRefresh ?? false)
const isIgnoreCase = computed(() => manageStore.config.settings.isIgnoreCase ?? false)

async function handelChangeCustomUrl () {
  if (currentPicBedName.value === 'github') {
    showLoadingPage.value = true
    if (isLoadingData.value) {
      ElNotification({
        title: '提示',
        message: '正在加载文件列表，请稍后再试',
        type: 'error',
        duration: 2000
      })
    }
    showLoadingPage.value = true
    await resetParam(true)
    showLoadingPage.value = false
  }
}

// when the current picBed is github, the customUrlList is used to store the github repo branches
async function initCustomUrlList () {
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
      if (!item.startsWith('http://') && !item.startsWith('https://') && currentPicBedName.value !== 'github') {
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
}

async function resetParam (force: boolean = false) {
  if (isLoadingData.value) {
    isLoadingData.value = false
    ipcRenderer.send('cancelLoadingFileList', cancelToken.value)
  }
  cancelToken.value = ''
  pagingMarker.value = ''
  currentPrefix.value = configMap.prefix
  currentPage.value = 1
  currentPageFilesInfo.length = 0
  selectedItems.length = 0
  searchText.value = ''
  urlToUpload.value = ''
  dialogVisible.value = false
  showImagePreview.value = false
  previewedImage.value = ''
  isShowFileInfo.value = false
  lastChoosed.value = -1
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
          title: '提示',
          message: '已经是最后一页了',
          type: 'success',
          duration: 500
        })
      }
    } else {
      ElNotification({
        title: '提示',
        message: '获取文件列表失败',
        type: 'error',
        duration: 2000
      })
    }
  } else {
    getBucketFileListBackStage()
    ElNotification.info({
      title: '提示',
      message: '正在后台获取文件列表，请不要切换页面',
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
      title: '提示',
      message: '正在加载文件列表，请稍后再试',
      type: 'error',
      duration: 2000
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
            title: '提示',
            message: '已经是最后一页了',
            type: 'success',
            duration: 2000
          })
        }
      } else {
        ElNotification({
          title: '提示',
          message: '获取文件列表失败',
          type: 'error',
          duration: 2000
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
              title: '提示',
              message: '已经是最后一页了',
              type: 'success',
              duration: 2000
            })
          }
        }
      } else {
        ElNotification({
          title: '提示',
          message: '获取文件列表失败',
          type: 'error',
          duration: 2000
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

function handelCancelCheck () {
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

async function handelBatchDownload () {
  const defaultDownloadPath = await ipcRenderer.invoke('getDefaultDownloadFolder')
  const param = {
    downloadPath: manageStore.config.settings.downloadDir ?? defaultDownloadPath,
    fileArray: [] as any[]
  }
  selectedItems.forEach((item: any) => {
    if (!item.isDir) {
      param.fileArray.push({
        bucketName: configMap.bucketName,
        region: configMap.bucketConfig.Location,
        key: item.key,
        fileName: item.fileName,
        customUrl: currentCustomUrl.value,
        downloadUrl: item.downloadUrl,
        githubUrl: item.url,
        githubPrivate: configMap.bucketConfig.private
      })
    }
  })
  ipcRenderer.send('downloadBucketFile', configMap.alias, param)
  handelCancelCheck()
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

function handelCreateFolder () {
  ElMessageBox.prompt('请输入文件夹名称', '新建文件夹', {
    confirmButtonText: '确定',
    cancelButtonText: '取消',
    inputPattern: /^[\u4e00-\u9fa5_a-zA-Z0-9/]+$/,
    inputErrorMessage: '文件夹名称只能包含中文、英文、数字、下划线和斜杠'
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
      ElMessage.success('创建成功, 请刷新')
    } else {
      ElMessage.error('创建失败')
    }
  }).catch(() => {})
}

const showUrlDialog = () => {
  dialogVisible.value = true
}

async function handelUploadFromUrl () {
  dialogVisible.value = false
  const urlList = [] as string[]
  urlToUpload.value.split('\n').forEach((item: string) => {
    if (item.trim() !== '' && isValidUrl(item.trim())) {
      urlList.push(item.trim())
    }
  })
  if (urlList.length === 0) {
    ElMessage.warning('请输入有效的URL')
    return
  }
  ElNotification({
    title: '提示',
    message: '开始后台下载，成功后自动上传',
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

function handelBatchCopyInfo () {
  if (selectedItems.length === 0) {
    ElMessage.warning('请先选择文件')
    return
  }
  const result = {} as IStringKeyMap
  selectedItems.forEach((item: any) => {
    result[item.fileName] = item
  })
  clipboard.writeText(JSON.stringify(result, null, 2))
  ElMessage.success(`已复制${selectedItems.length}个文件信息`)
}

function handelBatchCopyLink (type: string) {
  if (selectedItems.length === 0) {
    ElMessage.warning('请先选择文件')
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
            ElMessage.success(`已复制${result.length}个链接`)
          }
        })
      }
    }
  })
  if (type !== 'preSignedUrl') {
    clipboard.writeText(result.join('\n'))
    ElMessage.success(`已复制${result.length}个链接`)
  }
}

function cancelLoading () {
  ElMessageBox.confirm('是否停止获取文件列表？', '提示', {
    confirmButtonText: '确定',
    cancelButtonText: '取消',
    type: 'warning'
  }).then(() => {
    isLoadingData.value = false
    ipcRenderer.send('cancelLoadingFileList', cancelToken.value)
    ElMessage.success('文件列表获取已停止')
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
          title: '提示',
          message: '获取文件列表成功',
          duration: 1000
        })
      } else {
        ElNotification.error({
          title: '提示',
          message: '部分文件获取失败',
          duration: 1000
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

function handelBatchDeleteInfo () {
  ElMessageBox.confirm(`将永久删除${selectedItems.length}个文件，是否继续？`, '提示', {
    confirmButtonText: '确定',
    cancelButtonText: '取消',
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
        title: '提示',
        message: '删除失败',
        duration: 1000
      })
    } else if (failCount === 0) {
      ElNotification.success({
        title: '提示',
        message: '删除成功',
        duration: 1000
      })
    } else {
      ElNotification.warning({
        title: '提示',
        message: `删除成功${successCount}个，失败${failCount}个`,
        duration: 1000
      })
    }
  }).catch(() => {
    ElMessage.info('已取消删除')
  })
}

function handleDeleteFile (item: any) {
  ElMessageBox.confirm(`将永久删除${item.isDir ? '文件夹' : '文件'} ${item.fileName} ${item.isDir ? '和该目录下的所有文件' : ''}，是否继续？`, '提示', {
    confirmButtonText: '确定',
    cancelButtonText: '取消',
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
        title: '提示',
        message: '删除文件夹可能需要一段时间，请耐心等待',
        duration: 1000
      })
      res = await ipcRenderer.invoke('deleteBucketFolder', configMap.alias, param)
    }
    if (res) {
      ElMessage.success('删除成功')
      currentPageFilesInfo.splice(currentPageFilesInfo.findIndex((i: any) => i.key === item.key), 1)
      selectedItems.splice(selectedItems.findIndex((i: any) => i.key === item.key), 1)
      if (!paging.value) {
        const table = fileCacheDbInstance.table(currentPicBedName.value)
        table.where('key').equals(getTableKeyOfDb()).modify((l: any) => {
          l.value.fullList.splice(l.value.fullList.findIndex((i: any) => i.key === item.key), 1)
        })
      }
    } else {
      ElMessage.error('删除失败')
    }
  }).catch(() => {
    ElMessage.info('已取消删除')
  })
}

function handleRenameFile (item: any) {
  ElMessageBox.prompt('请输入新的文件名', '重命名', {
    confirmButtonText: '确定',
    cancelButtonText: '取消',
    inputPattern: /^[a-zA-Z0-9\u4e00-\u9fa5\-_.][a-zA-Z0-9\u4e00-\u9fa5\-_./]*[a-zA-Z0-9\u4e00-\u9fa5\-_.]?$/,
    inputErrorMessage: '文件名不合法'
  }).then(async ({ value }) => {
    const param = {
      // tcyun
      bucketName: configMap.bucketName,
      region: configMap.bucketConfig.Location,
      oldKey: item.key,
      newKey: (item.key.slice(0, item.key.lastIndexOf('/') + 1) + value).replaceAll('//', '/'),
      customUrl: currentCustomUrl.value
    }
    const res = await ipcRenderer.invoke('renameBucketFile', configMap.alias, param)
    if (res) {
      ElMessage.success('重命名成功')
      const oldKey = currentPrefix.value + item.fileName
      if (pagingMarker.value === oldKey.slice(1)) {
        pagingMarker.value = currentPrefix.value.slice(1) + value
      }
      const oldName = item.fileName
      if (value.includes('/')) {
        item.fileName = value.slice(0, value.indexOf('/'))
        item.isDir = true
        item.fileSize = 0
        item.formatedTime = ''
      } else {
        item.fileName = value
      }
      item.key = (item.key.slice(0, item.key.lastIndexOf('/') + 1) + value).replaceAll('//', '/')
      item.url = `${currentCustomUrl.value}${currentPrefix.value}${value}`
      item.formatedTime = new Date().toLocaleString()
      if (!paging.value) {
        const table = fileCacheDbInstance.table(currentPicBedName.value)
        table.where('key').equals(getTableKeyOfDb()).modify((l: any) => {
          l.value.fullList.forEach((i: any) => {
            if (i.fileName === oldName) {
              if (value.includes('/')) {
                i.fileName = value.slice(0, value.indexOf('/'))
                i.isDir = true
                i.fileSize = 0
                i.formatedTime = ''
              } else {
                i.fileName = value
              }
              i.key = (i.key.slice(0, i.key.lastIndexOf('/') + 1) + value).replaceAll('//', '/')
              i.url = `${currentCustomUrl.value}${currentPrefix.value}${value}`
              i.formatedTime = new Date().toLocaleString()
            }
          })
        })
      }
    } else {
      ElMessage.error('重命名失败')
    }
  }).catch(() => {
    ElMessage.info('已取消')
  })
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
  ElMessage.success('复制成功')
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
    title: '文件名',
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
    title: '完成时间',
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
    title: '状态',
    width: 100,
    cellRenderer: ({ rowData: item }) => (
      item.status === 'downloaded'
        ? (
          <ElTag
            type="success"
            style="font-size: 14px;font-family: Arial, Helvetica, sans-serif;"
          >成功
          </ElTag>
        )
        : (
          <ElTag
            type="danger"
            style="font-size: 14px;font-family: Arial, Helvetica, sans-serif;"
          >失败
          </ElTag>
        )
    )
  }
]

const uploadedTaskColumns: Column<any>[] = [
  {
    key: 'name',
    title: '文件名',
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
    title: '上传路径',
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
    title: '完成时间',
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
    title: '状态',
    width: 100,
    cellRenderer: ({ rowData: item }) => (
      item.status === 'uploaded'
        ? (
          <ElTag
            type="success"
            style="font-size: 14px;font-family: Arial, Helvetica, sans-serif;"
          >成功
          </ElTag>
        )
        : (
          <ElTag
            type="danger"
            style="font-size: 14px;font-family: Arial, Helvetica, sans-serif;"
          >失败
          </ElTag>
        )
    )
  }
]

const downloadingTaskColumns: Column<any>[] = [
  {
    key: 'name',
    title: '文件名',
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
    title: '进度',
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
    title: '文件名',
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
    title: '进度',
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

const upLoadTaskColumns: Column<any>[] = [
  {
    key: 'name',
    title: '文件名',
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
    title: '大小',
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
    title: '文件数',
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
                  src={require('./assets/icons/folder.png')}
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
    title: '文件名',
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
          ? <span></span>
          : <ElTooltip
            placement="top"
            content="重命名"
            effect='light'
            hide-after={150}
          >
            <ElIcon
              size="20"
              style="cursor: pointer;"
              color="#409EFF"
              onClick={() => handleRenameFile(item)}
            >
              <Edit />
            </ElIcon>
          </ElTooltip>
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
          content="复制链接"
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
                  onClick={() => copyToClipboard(formatLink(item.url, item.fileName, manageStore.config.settings.pasteForma ?? '$markdown', manageStore.config.settings.customPasteFormat ?? '$url'))}
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
                    自定义
                  </ElDropdownItem>
                  {['tcyun', 'aliyun', 'qiniu', 'github'].includes(currentPicBedName.value)
                    ? <ElDropdownItem
                      onClick={async () => {
                        const res = await getPreSignedUrl(item)
                        copyToClipboard(res)
                      }}
                    >
                    预签名链接
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
          content="文件信息"
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
    title: '大小',
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
    title: '修改时间',
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
        ? <ElTooltip
          placement="top"
          content="删除"
          effect='light'
          hide-after={150}
        >
          <ElIcon
            style="cursor: pointer;"
            color="red"
            onClick={() => handleDeleteFile(item)}
          >
            <DeleteFilled />
          </ElIcon>
        </ElTooltip>
        : <template></template>
    )
  }
]

onBeforeMount(async () => {
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
  ipcRenderer.removeAllListeners('refreshFileTransferList')
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
