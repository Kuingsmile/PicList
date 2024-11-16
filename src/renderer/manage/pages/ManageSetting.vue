<template>
  <div id="manage-setting">
    <el-row class="view-title" align="middle" justify="center" style="font-size: 20px; color: black">
      {{ $T('MANAGE_SETTING_TITLE') }}
    </el-row>
    <el-row class="setting-list">
      <el-col :span="20" :offset="2">
        <el-row style="width: 100%">
          <el-form label-position="left" label-width="50%" size="default" style="position: relative; width: 100%">
            <el-form-item>
              <template #label>
                <span style="position: absolute; left: 0">
                  <span>{{ $T('MANAGE_SETTING_CLEAR_CACHE_TITLE') }} </span>
                  <span style="color: #ff4949">{{ formatFileSize(dbSize) === '' ? 0 : formatFileSize(dbSize) }} </span>
                  <span> &nbsp;{{ $T('MANAGE_SETTING_CLEAR_CACHE_FREE_TITLE') }} </span>
                  <span style="color: #ff4949">{{ dbSizeAvailableRate }} %</span>
                  <el-tooltip
                    effect="dark"
                    :content="$T('MANAGE_SETTING_CLEAR_CACHE_TIPS')"
                    placement="right"
                    :persistent="false"
                    teleported
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
                :persistent="false"
                teleported
                @confirm="handleClearDb"
              >
                <template #reference>
                  <el-button type="primary" plain style="position: absolute; right: 0">
                    {{ $T('MANAGE_SETTING_CLEAR_CACHE_BUTTON') }}
                  </el-button>
                </template>
              </el-popconfirm>
            </el-form-item>
            <DynamicSwitch
              v-for="item in switchFieldsConfigList"
              :key="item.configName"
              v-model="form[item.configName]"
              :segments="item.segments"
              :tooltip="item.tooltip"
              :config-name="item.configName"
              :active-text="item.activeText"
              :inactive-text="item.inactiveText"
            />
            <el-link
              v-if="form.customRename"
              style="margin-top: 10px; margin-bottom: 10px; color: #409eff"
              :underline="false"
            >
              {{ $T('MANAGE_SETTING_CUSTOM_PATTERN_TITLE') }}
            </el-link>
            <el-input
              v-if="form.customRename"
              v-model="form.customRenameFormat"
              :placeholder="$T('MANAGE_SETTING_CUSTOM_PATTERN_TIPS')"
              style="width: 100%"
            />
            <el-table
              v-if="form.customRename"
              :data="customRenameFormatTable"
              style="width: 100%; margin-top: 10px; margin-left: 10%"
              :header-cell-style="{ 'text-align': 'center' }"
              :cell-style="{ 'text-align': 'center' }"
              @cell-click="handleCellClick"
            >
              <el-table-column
                v-for="prop in ['placeholder', 'description', 'placeholderB', 'descriptionB']"
                :key="prop"
                :prop="prop"
                :label="$T('MANAGE_SETTING_CUSTOM_PATTERN_TABLE_TITLE' as any)"
                width="150"
              />
            </el-table>
            <br v-if="form.customRename" />
            <DynamicSwitch
              v-for="item in switchFieldsSpecialList"
              :key="item.configName"
              v-model="form[item.configName]"
              :segments="item.segments"
              :tooltip="item.tooltip"
              :config-name="item.configName"
            />
            <el-form-item>
              <template #label>
                <span style="position: absolute; left: 0">
                  {{ $T('MANAGE_SETTING_MAX_DOWNLOAD_FILE_SIZE_TITLE') }}
                  <el-tooltip
                    effect="dark"
                    :content="$T('MANAGE_SETTING_MAX_DOWNLOAD_FILE_SIZE_TIPS')"
                    placement="right"
                    :persistent="false"
                    teleported
                  >
                    <el-icon>
                      <InfoFilled />
                    </el-icon>
                  </el-tooltip>
                </span>
              </template>
              <el-input-number
                v-model="form.maxDownloadFileCount"
                style="position: absolute; right: 0"
                :placeholder="$T('MANAGE_SETTING_MAX_DOWNLOAD_FILE_SIZE_INPUT_TIPS')"
                :min="1"
                :max="9999"
                :step="1"
              />
            </el-form-item>
            <el-form-item>
              <template #label>
                <span style="position: absolute; left: 0">
                  {{ $T('MANAGE_SETTING_PRESIGNED_URL_EXPIRE_TITLE') }}
                  <el-tooltip
                    effect="dark"
                    :content="$T('MANAGE_SETTING_PRESIGNED_URL_EXPIRE_TIPS')"
                    placement="right"
                    :persistent="false"
                    teleported
                  >
                    <el-icon>
                      <InfoFilled />
                    </el-icon>
                  </el-tooltip>
                </span>
              </template>
              <el-input-number
                v-model="form.PreSignedExpire"
                style="position: absolute; right: 0"
                :placeholder="$T('MANAGE_SETTING_PRESIGNED_URL_EXPIRE_TIPS')"
                :min="1"
                :step="1"
              />
            </el-form-item>
            <el-link style="margin-top: 10px; margin-bottom: 10px; color: #409eff" :underline="false">
              {{ $T('MANAGE_SETTING_CHOOSE_COPY_FORMAT_TITLE') }}
            </el-link>
            <br />
            <el-radio-group v-model="form.pasteFormat">
              <el-radio v-for="item in pasteFormatList" :key="item" :value="item">
                {{ $T(`MANAGE_SETTING_CHOOSE_COPY_FORMAT_${item.toUpperCase().replace(/-/g, '_')}` as any) }}
              </el-radio>
            </el-radio-group>
            <el-link
              v-if="form.pasteFormat === 'custom'"
              style="margin-top: 10px; margin-bottom: 10px; color: #409eff"
              :underline="false"
            >
              {{ $T('MANAGE_SETTING_CUSTOM_COPY_FORMAT_TITLE') }}
            </el-link>
            <el-input
              v-if="form.pasteFormat === 'custom'"
              v-model="form.customPasteFormat"
              :placeholder="$T('MANAGE_SETTING_CUSTOM_COPY_FORMAT_TIPS')"
              style="width: 100%"
            />
            <div>
              <el-link style="margin-top: 10px; margin-bottom: 10px; color: #409eff" :underline="false">
                {{ $T('MANAGE_SETTING_CHOOSE_DOWNLOAD_FOLDER_TITLE') }}
              </el-link>
            </div>
            <el-input
              v-model="form.downloadDir"
              disabled
              :placeholder="$T('MANAGE_SETTING_CHOOSE_DOWNLOAD_FOLDER_TIPS')"
              style="width: 100%; margin-top: 10px"
            >
              <template #append>
                <el-button type="primary" @click="handleDownloadDirClick">
                  <el-icon>
                    <Folder />
                  </el-icon>
                  {{ $T('MANAGE_SETTING_CHOOSE_DOWNLOAD_FOLDER_BUTTON') }}
                </el-button>
              </template>
            </el-input>
          </el-form>
          <el-divider border-style="none" />
        </el-row>
      </el-col>
    </el-row>
  </div>
</template>

<script lang="ts" setup>
import { ElMessage } from 'element-plus'
import { InfoFilled, Folder } from '@element-plus/icons-vue'
import { ref, onBeforeMount, watch } from 'vue'

import DynamicSwitch from '@/manage/components/DynamicSwitch.vue'
import { fileCacheDbInstance } from '@/manage/store/bucketFileDb'
import { formatFileSize, customRenameFormatTable } from '@/manage/utils/common'
import { getConfig, saveConfig } from '@/manage/utils/dataSender'

import { T as $T } from '@/i18n'

import { triggerRPC } from '@/utils/common'
import { IRPCActionType } from 'root/src/universal/types/enum'

const form = ref<IStringKeyMap>({
  timestampRename: false,
  randomStringRename: false,
  customRename: false,
  isAutoRefresh: false,
  isShowThumbnail: false,
  isShowList: false,
  isUsePreSignedUrl: false,
  isIgnoreCase: false,
  isForceCustomUrlHttps: false,
  isEncodeUrl: false,
  isUploadKeepDirStructure: true,
  isDownloadFileKeepDirStructure: false,
  isDownloadFolderKeepDirStructure: true,
  downloadDir: '',
  pasteFormat: 'markdown',
  customPasteFormat: '$url',
  PreSignedExpire: 14400, // seconds
  maxDownloadFileCount: 5,
  customRenameFormat: '{filename}'
})

const settingsKeys = Object.keys(form.value)

const dbSize = ref(0)
const dbSizeAvailableRate = ref('0')

const pasteFormatList = ['markdown', 'markdown-with-link', 'rawurl', 'html', 'bbcode', 'custom']

settingsKeys.forEach(key => {
  watch(
    () => form.value[key],
    newValue => saveConfig({ [`settings.${key}`]: newValue })
  )
})

const switchFieldsList = [
  'isAutoRefresh',
  'isShowThumbnail',
  'isShowList',
  'isUsePreSignedUrl',
  'isForceCustomUrlHttps',
  'isEncodeUrl',
  'isUploadKeepDirStructure',
  'isIgnoreCase',
  'timestampRename',
  'randomStringRename',
  'customRename'
]
const switchFieldsNoTipsList = ['isShowThumbnail', 'isShowList', 'isUsePreSignedUrl']
const switchFieldsHasActiveTextList = ['isShowList']

const switchFieldsConfigList = switchFieldsList.map(item => ({
  configName: item,
  segments: [
    {
      text: $T(`MANAGE_SETTING_${item.toUpperCase()}_TITLE` as any),
      style: 'color: black;'
    }
  ],
  tooltip: switchFieldsNoTipsList.includes(item) ? undefined : $T(`MANAGE_SETTING_${item.toUpperCase()}_TIPS` as any),
  activeText: switchFieldsHasActiveTextList.includes(item)
    ? $T(`MANAGE_SETTING_${item.toUpperCase()}_ON` as any)
    : undefined,
  inactiveText: switchFieldsHasActiveTextList.includes(item)
    ? $T(`MANAGE_SETTING_${item.toUpperCase()}_OFF` as any)
    : undefined
}))

const switchFieldsSpecialList = [
  {
    configName: 'isDownloadFileKeepDirStructure',
    segments: [
      {
        text: $T('MANAGE_SETTING_ISDOWNLOADFILEKEEPDIRSTRUCTURE_TITLE_A'),
        style: 'color: black;'
      },
      {
        text: $T('MANAGE_SETTING_ISDOWNLOADFILEKEEPDIRSTRUCTURE_TITLE_B'),
        style: 'color: orange;'
      },
      {
        text: $T('MANAGE_SETTING_ISDOWNLOADFILEKEEPDIRSTRUCTURE_TITLE_C'),
        style: 'color: black;'
      }
    ],
    tooltip: $T('MANAGE_SETTING_ISDOWNLOADFILEKEEPDIRSTRUCTURE_TIPS')
  },
  {
    configName: 'isDownloadFolderKeepDirStructure',
    segments: [
      {
        text: $T('MANAGE_SETTING_ISDOWNLOADFILEKEEPDIRSTRUCTURE_TITLE_A'),
        style: 'color: black;'
      },
      {
        text: $T('MANAGE_SETTING_ISDOWNLOADFOLDERKEEPDIRSTRUCTURE_TITLE_D'),
        style: 'color: coral;'
      },
      {
        text: $T('MANAGE_SETTING_ISDOWNLOADFILEKEEPDIRSTRUCTURE_TITLE_C'),
        style: 'color: black;'
      }
    ],
    tooltip: $T('MANAGE_SETTING_ISDOWNLOADFILEKEEPDIRSTRUCTURE_TIPS')
  }
]

async function initData() {
  const config = (await getConfig()) as IStringKeyMap
  settingsKeys.forEach(key => {
    form.value[key] = config.settings[key] ?? form.value[key]
  })
}

async function handleDownloadDirClick() {
  const result = await triggerRPC<any>(IRPCActionType.MANAGE_SELECT_DOWNLOAD_FOLDER)
  if (result) {
    form.value.downloadDir = result
  }
}

const handleCellClick = (row: any, column: any) => {
  navigator.clipboard.writeText(row[column.property])
  ElMessage.success(`${$T('MANAGE_SETTING_COPY_MESSAGE')}${row[column.property]}`)
}

function handleClearDb() {
  fileCacheDbInstance
    .delete()
    .then(() => {
      getIndexDbSize()
      ElMessage.success($T('MANAGE_SETTING_CLEAR_CACHE_SUCCESS'))
    })
    .catch(() => {
      ElMessage.error($T('MANAGE_SETTING_CLEAR_CACHE_FAILED'))
    })
}

async function getIndexDbSize() {
  const size = (await navigator.storage.estimate()).usage ?? 0
  const quota = (await navigator.storage.estimate()).quota ?? 0
  dbSize.value = size
  dbSizeAvailableRate.value = (100 - (size / quota) * 100).toFixed(2)
}

onBeforeMount(() => {
  initData()
  getIndexDbSize()
})
</script>

<style lang="stylus">
#manage-setting
  height 100%
  overflow-y auto
</style>
