<template>
  <div id="manage-setting">
    <el-row
      class="view-title"
      align="middle"
      justify="center"
      style="font-size: 20px;color: black;"
    >
      {{ $T('MANAGE_SETTING_TITLE') }}
    </el-row>
    <el-row
      class="setting-list"
    >
      <el-col
        :span="20"
        :offset="2"
      >
        <el-row
          style="width: 100%;"
        >
          <el-form
            lable-position="left"
            label-width="50%"
            size="default"
            style="position: relative;width: 100%;"
          >
            <el-form-item>
              <template #label>
                <span
                  style="position:absolute;left: 0;"
                >
                  {{ $T('MANAGE_SETTING_AUTO_FRESH_TITLE') }}
                  <el-tooltip
                    effect="dark"
                    :content="$T('MANAGE_SETTING_AUTO_FRESH_TIPS')"
                    placement="right"
                  >
                    <el-icon>
                      <InfoFilled />
                    </el-icon>
                  </el-tooltip>
                </span>
              </template>
              <el-switch
                v-model="form.isAutoRefresh"
                style="position:absolute;right: 0;"
                active-color="#13ce66"
                inactive-color="#ff4949"
                @change="handelIsAutoRefreshChange"
              />
            </el-form-item>
            <el-form-item>
              <template #label>
                <span
                  style="position:absolute;left: 0;"
                >
                  <span>{{ $T('MANAGE_SETTING_CLEAR_CACHE_TITLE') }} </span>
                  <span
                    style="color: #ff4949;"
                  >{{ formatFileSize(dbSize) === ''? 0 : formatFileSize(dbSize) }}</span>
                  <span> {{ $T('MANAGE_SETTING_CLEAR_CACHE_FREE_TITLE') }} </span>
                  <span
                    style="color: #ff4949;"
                  >{{ dbSizeAvailableRate }} %</span>
                  <el-tooltip
                    effect="dark"
                    :content="$T('MANAGE_SETTING_CLEAR_CACHE_TIPS')"
                    placement="right"
                  >
                    <el-icon>
                      <InfoFilled />
                    </el-icon>
                  </el-tooltip>
                </span>
              </template>
              <el-popconfirm
                :title="$T('MANAGE_SETTING_CLEAR_CACHE_PROMPT')"
                :confirm-button-text="$T('CONFIRM')"
                :cancel-button-text="$T('CANCEL')"
                hide-icon
                @confirm="handleClearDb"
              >
                <template #reference>
                  <el-button
                    type="primary"
                    plain
                    style="position:absolute;right: 0;"
                  >
                    {{ $T('MANAGE_SETTING_CLEAR_CACHE_BUTTON') }}
                  </el-button>
                </template>
              </el-popconfirm>
            </el-form-item>
            <el-form-item>
              <template #label>
                <span
                  style="position:absolute;left: 0;"
                >
                  {{ $T('MANAGE_SETTING_SHOW_THUMBNAIL_TITLE') }}
                </span>
              </template>
              <el-switch
                v-model="form.isShowThumbnail"
                style="position:absolute;right: 0;"
                active-color="#13ce66"
                inactive-color="#ff4949"
                @change="handelIsShowThumbnailChange"
              />
            </el-form-item>
            <el-form-item>
              <template #label>
                <span
                  style="position:absolute;left: 0;"
                >
                  {{ $T('MANAGE_SETTING_SHOW_FILE_LIST_TYPE_TITLE') }}
                </span>
              </template>
              <el-switch
                v-model="form.isShowList"
                style="position:absolute;right: 0;"
                :active-text="$T('MANAGE_SETTING_SHOW_FILE_LIST_TYPE_LIST')"
                :inactive-text="$T('MANAGE_SETTING_SHOW_FILE_LIST_TYPE_CARD')"
                active-color="#13ce66"
                inactive-color="orange"
                @change="handelIsShowListChange"
              />
            </el-form-item>
            <el-form-item>
              <template #label>
                <span
                  style="position:absolute;left: 0;"
                >
                  {{ $T('MANAGE_SETTING_FORCE_CUSTOM_URL_HTTPS_TITLE') }}
                  <el-tooltip
                    effect="dark"
                    :content="$T('MANAGE_SETTING_FORCE_CUSTOM_URL_HTTPS_TIPS')"
                    placement="right"
                  >
                    <el-icon>
                      <InfoFilled />
                    </el-icon>
                  </el-tooltip>
                </span>
              </template>
              <el-switch
                v-model="form.isForceCustomUrlHttps"
                style="position:absolute;right: 0;"
                active-color="#13ce66"
                inactive-color="#ff4949"
                @change="handelIsForceCustomUrlHttpsChange"
              />
            </el-form-item>
            <el-form-item>
              <template #label>
                <span
                  style="position:absolute;left: 0;"
                >
                  {{ $T('MANAGE_SETTING_KEEP_FOLDER_STRUCTURE_UPLOAD_TITLE') }}
                  <el-tooltip
                    effect="dark"
                    :content="$T('MANAGE_SETTING_KEEP_FOLDER_STRUCTURE_UPLOAD_TIPS')"
                    placement="right"
                  >
                    <el-icon>
                      <InfoFilled />
                    </el-icon>
                  </el-tooltip>
                </span>
              </template>
              <el-switch
                v-model="form.isUploadKeepDirStructure"
                style="position:absolute;right: 0;"
                active-color="#13ce66"
                inactive-color="#ff4949"
                @change="handelIsUploadKeepDirStructureChange"
              />
            </el-form-item>
            <el-form-item>
              <template #label>
                <span
                  style="position:absolute;left: 0;"
                >
                  <span>{{ $T('MANAGE_SETTING_KEEP_FOLDER_STRUCTURE_DOWNLOAD_TITLE_A') }}</span>
                  <span style="color: orange;">{{ $T('MANAGE_SETTING_KEEP_FOLDER_STRUCTURE_DOWNLOAD_TITLE_B') }}</span>
                  <span>{{ $T('MANAGE_SETTING_KEEP_FOLDER_STRUCTURE_DOWNLOAD_TITLE_C') }}</span>
                  <el-tooltip
                    effect="dark"
                    :content="$T('MANAGE_SETTING_KEEP_FOLDER_STRUCTURE_DOWNLOAD_FILE_TIPS')"
                    placement="right"
                  >
                    <el-icon>
                      <InfoFilled />
                    </el-icon>
                  </el-tooltip>
                </span>
              </template>
              <el-switch
                v-model="form.isDownloadFileKeepDirStructure"
                style="position:absolute;right: 0;"
                active-color="#13ce66"
                inactive-color="#ff4949"
                @change="handelIsDownloadFileKeepDirStructureChange"
              />
            </el-form-item>
            <el-form-item>
              <template #label>
                <span
                  style="position:absolute;left: 0;"
                >
                  <span>{{ $T('MANAGE_SETTING_KEEP_FOLDER_STRUCTURE_DOWNLOAD_TITLE_A') }}</span>
                  <span style="color: coral;">{{ $T('MANAGE_SETTING_KEEP_FOLDER_STRUCTURE_DOWNLOAD_TITLE_D') }}</span>
                  <span>{{ $T('MANAGE_SETTING_KEEP_FOLDER_STRUCTURE_DOWNLOAD_TITLE_C') }}</span>
                  <el-tooltip
                    effect="dark"
                    :content="$T('MANAGE_SETTING_KEEP_FOLDER_STRUCTURE_DOWNLOAD_FILE_TIPS')"
                    placement="right"
                  >
                    <el-icon>
                      <InfoFilled />
                    </el-icon>
                  </el-tooltip>
                </span>
              </template>
              <el-switch
                v-model="form.isDownloadFolderKeepDirStructure"
                style="position:absolute;right: 0;"
                active-color="#13ce66"
                inactive-color="#ff4949"
                @change="handelIsDownloadFolderKeepDirStructureChange"
              />
            </el-form-item>
            <el-form-item>
              <template #label>
                <span
                  style="position:absolute;left: 0;"
                >
                  {{ $T('MANAGE_SETTING_MAX_DOWNLOAD_FILE_SIZE_TITLE') }}
                  <el-tooltip
                    effect="dark"
                    :content="$T('MANAGE_SETTING_MAX_DOWNLOAD_FILE_SIZE_TIPS')"
                    placement="right"
                  >
                    <el-icon>
                      <InfoFilled />
                    </el-icon>
                  </el-tooltip>
                </span>
              </template>
              <el-input-number
                v-model="maxDownloadFileCount"
                style="position:absolute;right: 0;"
                :placeholder="$T('MANAGE_SETTING_MAX_DOWNLOAD_FILE_SIZE_INPUT_TIPS')"
                :min="1"
                :max="9999"
                :step="1"
              />
            </el-form-item>
            <el-form-item>
              <template #label>
                <span
                  style="position:absolute;left: 0;"
                >
                  {{ $T('MANAGE_SETTING_SEARCH_IGNORE_CASE_TITLE') }}
                  <el-tooltip
                    effect="dark"
                    :content="$T('MANAGE_SETTING_SEARCH_IGNORE_CASE_TIPS')"
                    placement="right"
                  >
                    <el-icon>
                      <InfoFilled />
                    </el-icon>
                  </el-tooltip>
                </span>
              </template>
              <el-switch
                v-model="form.isIgnoreCase"
                style="position:absolute;right: 0;"
                active-color="#13ce66"
                inactive-color="#ff4949"
                @change="handelisIgnoreCaseChange"
              />
            </el-form-item>
            <el-form-item>
              <template #label>
                <span
                  style="position:absolute;left: 0;"
                >
                  {{ $T('MANAGE_SETTING_TIMESTAMP_RENAME_TITLE') }}
                  <el-tooltip
                    effect="dark"
                    :content="$T('MANAGE_SETTING_TIMESTAMP_RENAME_TIPS')"
                    placement="right"
                  >
                    <el-icon>
                      <InfoFilled />
                    </el-icon>
                  </el-tooltip>
                </span>
              </template>
              <el-switch
                v-model="form.timestampRename"
                style="position:absolute;right: 0;"
                active-color="#13ce66"
                inactive-color="#ff4949"
                @change="handelTimestampRenameChange"
              />
            </el-form-item>
            <el-form-item>
              <template #label>
                <span
                  style="position:absolute;left: 0;"
                >
                  {{ $T('MANAGE_SETTING_RANDOM_STRING_RENAME_TITLE') }}
                  <el-tooltip
                    effect="dark"
                    :content="$T('MANAGE_SETTING_RANDOM_STRING_RENAME_TIPS')"
                    placement="right"
                  >
                    <el-icon>
                      <InfoFilled />
                    </el-icon>
                  </el-tooltip>
                </span>
              </template>
              <el-switch
                v-model="form.randomStringRename"
                style="position:absolute;right: 0;"
                active-color="#13ce66"
                inactive-color="#ff4949"
                @change="handelRandomStringRenameChange"
              />
            </el-form-item>
            <el-form-item>
              <template #label>
                <span
                  style="position:absolute;left: 0;"
                >
                  {{ $T('MANAGE_SETTING_CUSTOM_RENAME_TITLE') }}
                  <el-tooltip
                    effect="dark"
                    :content="$T('MANAGE_SETTING_CUSTOM_RENAME_TIPS')"
                    placement="right"
                  >
                    <el-icon>
                      <InfoFilled />
                    </el-icon>
                  </el-tooltip>
                </span>
              </template>
              <el-switch
                v-model="form.customRename"
                style="position:absolute;right: 0;"
                active-color="#13ce66"
                inactive-color="#ff4949"
                @change="handelCustomRenameChange"
              />
            </el-form-item>
            <el-link
              v-if="form.customRename"
              style="margin-top: 10px;margin-bottom: 10px;color: #409eff;"
              :underline="false"
            >
              {{ $T('MANAGE_SETTING_CUSTOM_PATTERN_TITLE') }}
            </el-link>
            <el-input
              v-if="form.customRename"
              v-model="customRenameFormat.value"
              :placeholder="$T('MANAGE_SETTING_CUSTOM_PATTERN_TIPS')"
              style="width: 100%;"
            />
            <el-table
              v-if="form.customRename"
              :data="customRenameFormatTable"
              style="width: 100%;margin-top: 10px;margin-left: 10%;"
              :header-cell-style="{'text-align':'center'}"
              :cell-style="{'text-align':'center'}"
              @cell-click="handleCellClick"
            >
              <el-table-column
                prop="placeholder"
                :label="$T('MANAGE_SETTING_CUSTOM_PATTERN_TABLE_TITLE')"
                width="150"
              />
              <el-table-column
                prop="description"
                :label="$T('MANAGE_SETTING_CUSTOM_PATTERN_TABLE_TIPS')"
                width="150"
              />
              <el-table-column
                prop="placeholderB"
                :label="$T('MANAGE_SETTING_CUSTOM_PATTERN_TABLE_TITLE')"
                width="150"
              />
              <el-table-column
                prop="descriptionB"
                :label="$T('MANAGE_SETTING_CUSTOM_PATTERN_TABLE_TIPS')"
                width="150"
              />
            </el-table>
            <el-link
              style="margin-top: 10px;margin-bottom: 10px;color: #409eff;"
              :underline="false"
            >
              {{ $T('MANAGE_SETTING_PRESIGNED_URL_EXPIRE_TITLE') }}
            </el-link>
            <el-input
              v-model="PreSignedExpire"
              :placeholder="$T('MANAGE_SETTING_PRESIGNED_URL_EXPIRE_TIPS')"
              clearable
              @blur="handelPreSignedExpireChange"
            />
            <el-link
              style="margin-top: 10px;margin-bottom: 10px;color: #409eff;"
              :underline="false"
            >
              {{ $T('MANAGE_SETTING_CHOOSE_COPY_FORMAT_TITLE') }}
            </el-link>
            <br />
            <el-radio-group
              v-model="pasteFormat"
            >
              <el-radio label="markdown">
                {{ $T('MANAGE_SETTING_CHOOSE_COPY_FORMAT_MARKDOWN') }}
              </el-radio>
              <el-radio lable="markdown-with-link">
                {{ $T('MANAGE_SETTING_CHOOSE_COPY_FORMAT_MARKDOWN_WITH_LINK') }}
              </el-radio>
              <el-radio label="rawurl">
                {{ $T('MANAGE_SETTING_CHOOSE_COPY_FORMAT_RAWURL') }}
              </el-radio>
              <el-radio label="html">
                {{ $T('MANAGE_SETTING_CHOOSE_COPY_FORMAT_HTML') }}
              </el-radio>
              <el-radio label="bbcode">
                {{ $T('MANAGE_SETTING_CHOOSE_COPY_FORMAT_BBCODE') }}
              </el-radio>
              <el-radio label="custom">
                {{ $T('MANAGE_SETTING_CHOOSE_COPY_FORMAT_CUSTOM') }}
              </el-radio>
            </el-radio-group>
            <el-link
              v-if="pasteFormat === 'custom'"
              style="margin-top: 10px;margin-bottom: 10px;color: #409eff;"
              :underline="false"
            >
              {{ $T('MANAGE_SETTING_CUSTOM_COPY_FORMAT_TITLE') }}
            </el-link>
            <el-input
              v-if="pasteFormat === 'custom'"
              v-model="customPasteFormat"
              :placeholder="$T('MANAGE_SETTING_CUSTOM_COPY_FORMAT_TIPS')"
              style="width: 100%;"
            />
            <div>
              <el-link
                style="margin-top: 10px;margin-bottom: 10px;color: #409eff;"
                :underline="false"
              >
                {{ $T('MANAGE_SETTING_CHOOSE_DOWNLOAD_FOLDER_TITLE') }}
              </el-link>
            </div>
            <el-input
              v-model="downloadDir"
              disabled
              :placeholder="$T('MANAGE_SETTING_CHOOSE_DOWNLOAD_FOLDER_TIPS')"
              style="width: 100%;margin-top: 10px;"
            >
              <template #append>
                <el-button
                  type="primary"
                  @click="handleDownloadDirClick"
                >
                  <el-icon>
                    <Folder />
                  </el-icon>
                  {{ $T('MANAGE_SETTING_CHOOSE_DOWNLOAD_FOLDER_BUTTON') }}
                </el-button>
              </template>
            </el-input>
          </el-form>
          <el-divider
              border-style="none"
            />
        </el-row>
      </el-col>
    </el-row>
  </div>
</template>

<script lang="ts" setup>
import { InfoFilled, Folder } from '@element-plus/icons-vue'
import { ref, reactive, onBeforeMount, watch, onBeforeUnmount } from 'vue'
import { getConfig, saveConfig, invokeToMain } from '../utils/dataSender'
import { ElMessage } from 'element-plus'
import { useManageStore } from '../store/manageStore'
import { fileCacheDbInstance } from '../store/bucketFileDb'
import { formatFileSize, customRenameFormatTable } from '../utils/common'
import { T as $T } from '@/i18n'
import { selectDownloadFolder } from '../utils/static'

const manageStore = useManageStore()

const form = reactive<IStringKeyMap>({
  timestampRename: false,
  randomStringRename: false,
  customRename: false,
  isAutoRefresh: false,
  isIgnoreCase: false,
  isForceCustomUrlHttps: false,
  isShowList: false,
  isUploadKeepDirStructure: true,
  isDownloadFileKeepDirStructure: false,
  isDownloadFolderKeepDirStructure: true
})

const downloadDir = ref('')
const pasteFormat = ref('markdown')
const customPasteFormat = ref('$url')
const dbSize = ref(0)
const dbSizeAvailableRate = ref('0')
// 单位秒
const PreSignedExpire = ref(14400)

const customRenameFormat = reactive({
  value: '{filename}'
})

const maxDownloadFileCount = ref(5)

watch(maxDownloadFileCount, (val) => {
  saveConfig({
    'settings.maxDownloadFileCount': val
  })
})

watch(customRenameFormat, (val) => {
  saveConfig({
    'settings.customRenameFormat': val.value
  })
})

watch(pasteFormat, (val) => {
  saveConfig({
    'settings.pasteFormat': val
  })
})

watch(customPasteFormat, (val) => {
  saveConfig({
    'settings.customPasteFormat': val
  })
})

watch(downloadDir, (val) => {
  saveConfig({
    'settings.downloadDir': val
  })
})

function handelPreSignedExpireChange () {
  if (Number.isNaN(Number(PreSignedExpire.value)) || Number(PreSignedExpire.value) <= 0) {
    PreSignedExpire.value = 14400
  }
  saveConfig({
    'settings.PreSignedExpire': PreSignedExpire.value
  })
}

async function initData () {
  const config = await getConfig() as IStringKeyMap
  form.timestampRename = config.settings.timestampRename ?? false
  form.randomStringRename = config.settings.randomStringRename ?? false
  form.customRename = config.settings.customRename ?? false
  customRenameFormat.value = config.settings.customRenameFormat ?? '{filename}'
  customPasteFormat.value = config.settings.customPasteFormat ?? '$url'
  form.pasteFormat = config.settings.pasteForma ?? 'markdown'
  downloadDir.value = config.settings.downloadDir ?? ''
  form.isAutoRefresh = config.settings.isAutoRefresh ?? false
  form.isShowThumbnail = config.settings.isShowThumbnail ?? false
  form.isIgnoreCase = config.settings.isIgnoreCase ?? false
  form.isForceCustomUrlHttps = config.settings.isForceCustomUrlHttps ?? true
  PreSignedExpire.value = config.settings.PreSignedExpire ?? 14400
  maxDownloadFileCount.value = config.settings.maxDownloadFileCount ?? 5
  form.isUploadKeepDirStructure = config.settings.isUploadKeepDirStructure ?? true
  form.isDownloadFileKeepDirStructure = config.settings.isDownloadKeepDirStructure ?? false
  form.isDownloadFolderKeepDirStructure = config.settings.isDownloadFolderKeepDirStructure ?? true
}

async function handleDownloadDirClick () {
  const result = await invokeToMain(selectDownloadFolder)
  if (result) {
    downloadDir.value = result
  }
}

function handelIsShowThumbnailChange (val:ICheckBoxValueType) {
  saveConfig({
    'settings.isShowThumbnail': val
  })
}

function handelIsShowListChange (val:ICheckBoxValueType) {
  saveConfig({
    'settings.isShowList': val
  })
}

function handelisIgnoreCaseChange (val:ICheckBoxValueType) {
  saveConfig({
    'settings.isIgnoreCase': val
  })
}

function handelIsAutoRefreshChange (val:ICheckBoxValueType) {
  saveConfig({
    'settings.isAutoRefresh': val
  })
}

function handelIsUploadKeepDirStructureChange (val:ICheckBoxValueType) {
  saveConfig({
    'settings.isUploadKeepDirStructure': val
  })
}

function handelIsDownloadFileKeepDirStructureChange (val:ICheckBoxValueType) {
  saveConfig({
    'settings.isDownloadFileKeepDirStructure': val
  })
}

function handelIsDownloadFolderKeepDirStructureChange (val:ICheckBoxValueType) {
  saveConfig({
    'settings.isDownloadFolderKeepDirStructure': val
  })
}

function handelIsForceCustomUrlHttpsChange (val:ICheckBoxValueType) {
  saveConfig({
    'settings.isForceCustomUrlHttps': val
  })
}

function handelTimestampRenameChange (val:ICheckBoxValueType) {
  saveConfig({
    'settings.timestampRename': val
  })
}

function handelRandomStringRenameChange (val:ICheckBoxValueType) {
  saveConfig({
    'settings.randomStringRename': val
  })
}

function handelCustomRenameChange (val:ICheckBoxValueType) {
  saveConfig({
    'settings.customRename': val
  })
}

const handleCellClick = (row:any, column:any) => {
  navigator.clipboard.writeText(row[column.property])
  ElMessage.success(`${$T('MANAGE_SETTING_COPY_MESSAGE')}${row[column.property]}`)
}

function handleClearDb () {
  fileCacheDbInstance.delete().then(() => {
    getIndexDbSize()
    ElMessage.success($T('MANAGE_SETTING_CLEAR_CACHE_SUCCESS'))
  }).catch(() => {
    ElMessage.error($T('MANAGE_SETTING_CLEAR_CACHE_FAILED'))
  })
}

async function getIndexDbSize () {
  const size = (await navigator.storage.estimate()).usage ?? 0
  const quota = (await navigator.storage.estimate()).quota ?? 0
  dbSize.value = size
  dbSizeAvailableRate.value = (100 - size / quota * 100).toFixed(2)
}

onBeforeMount(() => {
  initData()
  manageStore.refreshConfig()
  getIndexDbSize()
})

onBeforeUnmount(async () => {
  await manageStore.refreshConfig()
})

</script>

<style lang='stylus'>
#manage-setting
  height 100%
</style>
