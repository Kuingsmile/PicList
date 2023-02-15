<template>
  <div id="manage-setting">
    <el-row
      class="view-title"
      align="middle"
      justify="center"
      style="font-size: 20px;color: black;"
    >
      管理页面设置
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
                >每次进入新目录时，是否自动刷新文件列表
                  <el-tooltip
                    effect="dark"
                    content="仅对不分页模式有效，默认在加载过一次后自动缓存到数据库来加快下次加载速度"
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
                  <span>清空文件列表缓存数据库 已占用: </span>
                  <span
                    style="color: #ff4949;"
                  >{{ formatFileSize(dbSize) === ''? 0 : formatFileSize(dbSize) }}</span>
                  <span> 剩余可用: </span>
                  <span
                    style="color: #ff4949;"
                  >{{ dbSizeAvailableRate }} %</span>
                  <el-tooltip
                    effect="dark"
                    content="清空后下次进入新目录时将会重新加载文件列表"
                    placement="right"
                  >
                    <el-icon>
                      <InfoFilled />
                    </el-icon>
                  </el-tooltip>
                </span>
              </template>
              <el-popconfirm
                title="确定要清空文件列表缓存数据库吗？"
                confirm-button-text="确定"
                cancel-button-text="取消"
                hide-icon
                @confirm="handleClearDb"
              >
                <template #reference>
                  <el-button
                    type="primary"
                    plain
                    style="position:absolute;right: 0;"
                  >
                    清空
                  </el-button>
                </template>
              </el-popconfirm>
            </el-form-item>
            <el-form-item>
              <template #label>
                <span
                  style="position:absolute;left: 0;"
                >图片显示为原图而非默认文件格式图标(需要存储桶可公开访问)
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
                >为自定义域名开启强制HTTPS
                  <el-tooltip
                    effect="dark"
                    content="开启后，复制链接等操作将会自动为自定义域名添加https前缀"
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
                >文件搜索时，是否忽略大小写
                  <el-tooltip
                    effect="dark"
                    content="开启后，文件搜索时，将会忽略大小写"
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
                >上传文件时间戳重命名--(优先级最高)
                  <el-tooltip
                    effect="dark"
                    content="开启后，上传时文件名将会根据当前时间进行重命名"
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
                >上传文件随机字符串重命名--(优先级中)
                  <el-tooltip
                    effect="dark"
                    content="开启后，上传时文件名重命名为20位随机字符串"
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
                >上传文件自定义重命名--(优先级最低)
                  <el-tooltip
                    effect="dark"
                    content="开启后，上传时文件名将会根据自定义格式进行重命名"
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
              自定义重命名格式，占位符请参考下表，可自由组合
            </el-link>
            <el-input
              v-if="form.customRename"
              v-model="customRenameFormat.value"
              placeholder="请输入自定义重命名格式"
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
                label="占位符"
                width="150"
              />
              <el-table-column
                prop="description"
                label="描述"
                width="150"
              />
              <el-table-column
                prop="placeholderB"
                label="占位符"
                width="150"
              />
              <el-table-column
                prop="descriptionB"
                label="描述"
                width="150"
              />
            </el-table>
            <el-link
              style="margin-top: 10px;margin-bottom: 10px;color: #409eff;"
              :underline="false"
            >
              预签名链接过期时间(单位：秒)
            </el-link>
            <el-input
              v-model="PreSignedExpire"
              placeholder="请输入预签名链接过期时间"
              clearable
              @blur="handelPreSignedExpireChange"
            />
            <el-link
              style="margin-top: 10px;margin-bottom: 10px;color: #409eff;"
              :underline="false"
            >
              选择默认复制的链接格式
            </el-link>
            <el-radio-group
              v-model="pasteFormat"
            >
              <el-radio label="markdown">
                Markdown
              </el-radio>
              <el-radio lable="markdown-with-link">
                Markdown(带链接)
              </el-radio>
              <el-radio label="rawurl">
                原始链接
              </el-radio>
              <el-radio label="html">
                HTML格式
              </el-radio>
              <el-radio label="bbcode">
                BBCode格式
              </el-radio>
              <el-radio label="custom">
                自定义格式
              </el-radio>
            </el-radio-group>
            <el-link
              v-if="pasteFormat === 'custom'"
              style="margin-top: 10px;margin-bottom: 10px;color: #409eff;"
              :underline="false"
            >
              自定义链接格式（$url为链接，$fileName为文件名）
            </el-link>
            <el-input
              v-if="pasteFormat === 'custom'"
              v-model="customPasteFormat"
              placeholder="请输入自定义链接格式"
              style="width: 100%;"
            />
            <div>
              <el-link
                style="margin-top: 10px;margin-bottom: 10px;color: #409eff;"
                :underline="false"
              >
                选择下载目录
              </el-link>
            </div>
            <el-input
              v-model="downloadDir"
              disabled
              placeholder="系统默认下载目录"
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
                  选择目录
                </el-button>
              </template>
            </el-input>
          </el-form>
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
import { formatFileSize } from '../utils/common'
const manageStore = useManageStore()

const customRenameFormatTable = [
  {
    placeholder: '{Y}',
    description: '年份，4位数',
    placeholderB: '{y}',
    descriptionB: '年份，2位数'
  },
  {
    placeholder: '{m}',
    description: '月份(01-12)',
    placeholderB: '{d}',
    descriptionB: '日期(01-31)'
  },
  {
    placeholder: '{timestamp}',
    description: '时间戳（秒）',
    placeholderB: '{uuid}',
    descriptionB: 'uuid字符串'
  },
  {
    placeholder: '{md5}',
    description: 'md5',
    placeholderB: '{md5-16}',
    descriptionB: 'md5前16位'
  },
  {
    placeholder: '{str-10}',
    description: '10位随机字符串',
    placeholderB: '{str-20}',
    descriptionB: '20位随机字符串'
  },
  {
    placeholder: '{filename}',
    description: '原文件名'
  }
]

const form = reactive<IStringKeyMap>({
  timestampRename: false,
  randomStringRename: false,
  customRename: false,
  isAutoRefresh: false,
  isIgnoreCase: false,
  isForceCustomUrlHttps: false
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
}

async function handleDownloadDirClick () {
  const result = await invokeToMain('selectDownloadFolder')
  if (result) {
    downloadDir.value = result
  }
}

function handelIsShowThumbnailChange (val:ICheckBoxValueType) {
  saveConfig({
    'settings.isShowThumbnail': val
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
  ElMessage.success(`已复制${row[column.property]}`)
}

function handleClearDb () {
  fileCacheDbInstance.delete().then(() => {
    getIndexDbSize()
    ElMessage.success('清除成功')
  }).catch(() => {
    ElMessage.error('清除失败')
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
