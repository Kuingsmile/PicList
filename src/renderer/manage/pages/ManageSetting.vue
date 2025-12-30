<template>
  <div class="manage-setting-container">
    <!-- Cache Info Card -->
    <div class="setting-card content-card">
      <div class="card-content">
        <div class="setting-section">
          <div class="form-group">
            <div class="form-control">
              <button type="button" class="action-button warning" @click="handleConfirmClearDb">
                <Trash2Icon :size="16" />
                {{
                  t('pages.manage.setting.clearCache', {
                    percent: dbSizeAvailableRate,
                    size: formatFileSize(dbSize) || 0,
                  })
                }}
              </button>
            </div>
          </div>
        </div>
      </div>
    </div>

    <!-- General Settings Card -->
    <div class="setting-card content-card">
      <div class="card-content">
        <div class="setting-section">
          <CustomSwitch
            v-for="item in switchFieldsConfigList"
            :key="item.configName"
            v-model="form[item.configName]"
            :segments="item.segments"
            :tooltip="item.tooltip"
            :active-text="item.activeText"
            :inactive-text="item.inactiveText"
          />
        </div>
      </div>
    </div>

    <!-- Custom Rename Pattern Card -->
    <div v-if="form.customRename" class="setting-card content-card">
      <div class="card-content">
        <div class="setting-section">
          <div class="section-header">
            <h4 class="section-title">
              {{ t('pages.manage.setting.customRenameTableTitle') }}
            </h4>
          </div>
          <div class="form-group">
            <input
              v-model="form.customRenameFormat"
              type="text"
              class="form-input"
              :placeholder="t('pages.manage.setting.customRenameTablePlaceholder')"
            />
          </div>

          <!-- Pattern Reference Table -->
          <div class="pattern-table-container">
            <table class="pattern-table">
              <thead>
                <tr>
                  <th>{{ t('pages.manage.setting.placeholder') }}</th>
                  <th>{{ t('pages.manage.setting.description') }}</th>
                  <th>{{ t('pages.manage.setting.placeholder') }}</th>
                  <th>{{ t('pages.manage.setting.description') }}</th>
                </tr>
              </thead>
              <tbody>
                <tr v-for="(row, index) in customRenameFormatTable" :key="index">
                  <td class="clickable" @click="handleCellClick(row, { property: 'placeholder' })">
                    {{ row.placeholder }}
                  </td>
                  <td>{{ row.description }}</td>
                  <td class="clickable" @click="handleCellClick(row, { property: 'placeholderB' })">
                    {{ row.placeholderB }}
                  </td>
                  <td>{{ row.descriptionB }}</td>
                </tr>
              </tbody>
            </table>
          </div>
        </div>
      </div>
    </div>

    <!-- Special Settings Card -->
    <div class="setting-card content-card">
      <div class="card-content">
        <div class="setting-section">
          <!-- Special Switch Fields -->
          <CustomSwitch
            v-for="item in switchFieldsSpecialList"
            :key="item.configName"
            v-model="form[item.configName]"
            :segments="item.segments"
            :tooltip="item.tooltip"
          />
        </div>
      </div>
    </div>

    <!-- Download Settings Card -->
    <div class="setting-card content-card">
      <div class="card-content">
        <div class="setting-section">
          <!-- Max Download File Count -->
          <div class="form-group">
            <div class="form-label-wrapper">
              <span class="form-label">
                {{ t('pages.manage.setting.maxDownLoadFileLimit') }}
              </span>
            </div>
            <div class="form-control">
              <input
                v-model.number="form.maxDownloadFileCount"
                type="number"
                class="form-input number-input"
                :placeholder="t('pages.manage.setting.maxDownLoadFileLimitDesc')"
                min="1"
                max="9999"
                step="1"
              />
            </div>
          </div>

          <!-- PreSigned URL Expire -->
          <div class="form-group">
            <div class="form-label-wrapper">
              <span class="form-label">
                {{ t('pages.manage.setting.preSignedUrlExpire') }}
              </span>
            </div>
            <div class="form-control">
              <input
                v-model.number="form.PreSignedExpire"
                type="number"
                class="form-input number-input"
                :placeholder="t('pages.manage.setting.preSignedUrlExpireDesc')"
                min="1"
                step="1"
              />
            </div>
          </div>
        </div>
      </div>
    </div>

    <!-- Copy Format Card -->
    <div class="setting-card content-card">
      <div class="card-content">
        <div class="setting-section">
          <div class="section-header">
            <h4 class="section-title">
              {{ t('pages.manage.setting.copyFormat.title') }}
            </h4>
          </div>
          <div class="radio-group">
            <label v-for="item in pasteFormatList" :key="item" class="radio-option">
              <input v-model="form.pasteFormat" type="radio" :value="item" class="radio-input" />
              <span class="radio-custom" />
              <span class="radio-text">
                {{ t(`pages.manage.setting.copyFormat.${item}`) }}
              </span>
            </label>
          </div>

          <!-- Custom Copy Format -->
          <div class="form-group">
            <div class="form-label-wrapper">
              <span class="form-label">
                {{ t('pages.manage.setting.copyFormat.customTitle') }}
              </span>
            </div>
            <input
              v-model="form.customPasteFormat"
              type="text"
              class="form-input"
              :placeholder="t('pages.manage.setting.copyFormat.customTips')"
            />
          </div>
        </div>
      </div>
    </div>

    <!-- Download Folder Card -->
    <div class="setting-card content-card">
      <div class="card-content">
        <div class="setting-section">
          <div class="section-header">
            <h4 class="section-title">
              {{ t('pages.manage.setting.selectDownloadFolderTitle') }}
            </h4>
          </div>
          <div class="form-group">
            <div class="input-group">
              <input
                v-model="form.downloadDir"
                type="text"
                class="form-input group-input"
                disabled
                :placeholder="t('pages.manage.setting.defaultDownloadFolder')"
              />
              <button type="button" class="input-append-button" @click="handleDownloadDirClick">
                <FolderIcon :size="16" />
                {{ t('pages.manage.setting.browse') }}
              </button>
            </div>
          </div>
        </div>
      </div>
    </div>
  </div>
</template>

<script lang="ts" setup>
import { FolderIcon, Trash2Icon } from 'lucide-vue-next'
import { onBeforeMount, ref, watch } from 'vue'
import { useI18n } from 'vue-i18n'

import useConfirm from '@/hooks/useConfirm'
import useMessage from '@/hooks/useMessage'
import CustomSwitch from '@/manage/components/CustomSwitch.vue'
import { fileCacheDbInstance } from '@/manage/store/bucketFileDb'
import { customRenameFormatTable, formatFileSize } from '@/manage/utils/common'
import { getConfig, saveConfig } from '@/manage/utils/dataSender'
import { IRPCActionType } from '@/utils/enum'
import type { IStringKeyMap } from '#/types/types'

const { t } = useI18n()
const message = useMessage()
const { confirm } = useConfirm()
const form = ref<IStringKeyMap>({
  timestampRename: false,
  randomStringRename: false,
  customRename: false,
  isAutoRefresh: false,
  isShowThumbnail: false,
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
  customRenameFormat: '{filename}',
})

const settingsKeys = Object.keys(form.value)

const dbSize = ref(0)
const dbSizeAvailableRate = ref('0')

const pasteFormatList = ['markdown', 'markdown-with-link', 'rawurl', 'html', 'bbcode', 'custom']

settingsKeys.forEach(key => {
  watch(
    () => form.value[key],
    newValue => saveConfig({ [`settings.${key}`]: newValue }),
  )
})

const switchFieldsList = [
  'isAutoRefresh',
  'isShowThumbnail',
  'isUsePreSignedUrl',
  'isForceCustomUrlHttps',
  'isEncodeUrl',
  'isUploadKeepDirStructure',
  'isIgnoreCase',
  'timestampRename',
  'randomStringRename',
  'customRename',
]
const switchFieldsNoTipsList = ['isShowThumbnail', 'isUsePreSignedUrl']
const switchFieldsHasActiveTextList = [] as string[]

const switchFieldsConfigList = switchFieldsList.map(item => ({
  configName: item,
  segments: [
    {
      text: t(`pages.manage.setting.${item}Title` as any),
      style: 'color: var(--color-text-primary);',
    },
  ],
  tooltip: switchFieldsNoTipsList.includes(item) ? undefined : t(`pages.manage.setting.${item}Tips` as any),
  activeText: switchFieldsHasActiveTextList.includes(item) ? t(`pages.manage.setting.${item}On` as any) : undefined,
  inactiveText: switchFieldsHasActiveTextList.includes(item) ? t(`pages.manage.setting.${item}Off` as any) : undefined,
}))

const switchFieldsSpecialList = [
  {
    configName: 'isDownloadFileKeepDirStructure',
    segments: [
      {
        text: t('pages.manage.setting.download'),
        style: 'color: var(--color-text-primary);',
      },
      {
        text: t('pages.manage.setting.file'),
        style: 'color: orange;',
      },
      {
        text: t('pages.manage.setting.keepDirStructure'),
        style: 'color: var(--color-text-primary);',
      },
    ],
    tooltip: t('pages.manage.setting.keepDirStructureDesc'),
  },
  {
    configName: 'isDownloadFolderKeepDirStructure',
    segments: [
      {
        text: t('pages.manage.setting.download'),
        style: 'color: var(--color-text-primary);',
      },
      {
        text: t('pages.manage.setting.folder'),
        style: 'color: orange;',
      },
      {
        text: t('pages.manage.setting.keepDirStructure'),
        style: 'color: var(--color-text-primary);',
      },
    ],
    tooltip: t('pages.manage.setting.keepDirStructureDesc'),
  },
]

async function initData() {
  const config = (await getConfig()) as IStringKeyMap
  settingsKeys.forEach(key => {
    form.value[key] = config.settings[key] ?? form.value[key]
  })
}

async function handleDownloadDirClick() {
  const result = await window.electron.triggerRPC<any>(IRPCActionType.MANAGE_SELECT_DOWNLOAD_FOLDER)
  if (result) {
    form.value.downloadDir = result
  }
}

const handleCellClick = (row: any, column: any) => {
  navigator.clipboard.writeText(row[column.property])
  message.success(`${t('pages.manage.setting.copySuccess', { name: row[column.property] })}`)
}

function handleConfirmClearDb() {
  confirm({
    title: t('pages.manage.setting.notice'),
    message: t('pages.manage.setting.clearCacheMsg'),
    type: 'warning',
    confirmButtonText: t('common.confirm'),
    cancelButtonText: t('common.cancel'),
    center: true,
  }).then(result => {
    if (result) {
      confirmClearDb()
    }
  })
}

function confirmClearDb() {
  fileCacheDbInstance
    .delete()
    .then(() => {
      getIndexDbSize()
      message.success(t('pages.manage.setting.clearSuccess'))
    })
    .catch(() => {
      message.error(t('pages.manage.setting.clearFailed'))
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

<style scoped src="./css/ManageSetting.css"></style>
