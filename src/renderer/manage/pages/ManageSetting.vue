<template>
  <div class="relative flex h-full w-full items-center justify-center">
    <div class="relative z-1 flex h-full w-full flex-col items-center justify-start gap-4 rounded-xl border-none p-4">
      <div
        class="flex w-full items-center justify-between gap-4 rounded-2xl border border-border-secondary px-6 py-2 shadow-md max-md:items-stretch max-md:p-5"
      >
        <div class="flex flex-1 flex-wrap items-center gap-4 p-2">
          <Settings :size="24" class="text-accent" />
          <div>
            <h1 class="m-0 text-2xl font-semibold tracking-tight text-main">{{ t('pages.manage.setting.title') }}</h1>
          </div>
        </div>
        <div class="flex flex-wrap gap-3 overflow-visible">
          <CustomButton
            type="primary"
            :icon="FileText"
            :text="t('pages.settings.sync.editCloudConfigFile')"
            @click="openFile('manage.json')"
          />
        </div>
      </div>
      <div
        class="relative flex h-full w-full flex-1 items-center justify-center overflow-hidden rounded-2xl border border-border-secondary p-1 shadow-md"
      >
        <div class="border4 no-scrollbar flex h-full w-full flex-1 flex-col gap-6 overflow-auto p-4">
          <!-- Cache Info Card -->
          <SettingSection :title="t('pages.manage.setting.section.cache')" :icon="Trash2Icon" only-one-row>
            <CustomButton
              type="custom"
              :icon="Trash2Icon"
              class="bg-warning/50 p-4! text-secondary hover:bg-warning/80 hover:text-white"
              :text-class="'group-hover:text-white'"
              :text="
                t('pages.manage.setting.clearCache', {
                  percent: dbSizeAvailableRate,
                  size: formatFileSize(dbSize) || 0,
                })
              "
              @click="handleConfirmClearDb"
            />
          </SettingSection>

          <SettingSection :title="t('pages.manage.setting.section.general')" :icon="Settings">
            <SettingCard>
              <CustomSelect
                v-model="form.pasteFormat"
                :select-list="pasteFormatList"
                :title="t('pages.manage.setting.copyFormat.title')"
                :icon="Edit2Icon"
              />
            </SettingCard>
            <SettingCard>
              <CustomInput
                v-model="form.customPasteFormat"
                :title="t('pages.manage.setting.copyFormat.customTitle')"
                :placeholder="t('pages.manage.setting.copyFormat.customTips')"
              />
            </SettingCard>
            <SettingCard v-for="item in switchFieldsConfigList" :key="item.configName" class="mb-4" p1>
              <CustomSwitch v-model="form[item.configName]" small no-border :tips="item.tooltip">
                <template #custom-title>
                  <span v-for="(segment, index) in item.segments" :key="index" :class="segment.class">
                    {{ segment.text }}
                  </span>
                </template>
                <template #switch-text>
                  <span class="text-sm text-secondary">{{
                    form[item.configName] ? item.activeText : item.inactiveText
                  }}</span>
                </template>
              </CustomSwitch>
            </SettingCard>
          </SettingSection>

          <SettingSection
            v-if="form.customRename"
            :title="t('pages.manage.setting.section.naming')"
            :icon="Edit2Icon"
            only-one-row
          >
            <CustomInput
              v-model="form.customRenameFormat"
              :title="t('pages.manage.setting.customRenameTablePlaceholder')"
              :placeholder="t('pages.manage.setting.customRenameTablePlaceholder')"
            />
            <placeholderTable :list="advancedRenameList" :title-list="advancedRenameTitleList" />
          </SettingSection>

          <SettingSection :icon="Download" :title="t('pages.manage.setting.section.up-down')">
            <SettingCard v-for="item in switchFieldsSpecialList" :key="item.configName" class="mb-4" p1>
              <CustomSwitch v-model="form[item.configName]" small no-border :tips="item.tooltip">
                <template #custom-title>
                  <span v-for="(segment, index) in item.segments" :key="index" :class="segment.class">
                    {{ segment.text }}
                  </span>
                </template>
              </CustomSwitch>
            </SettingCard>
            <SettingCard>
              <CustomInput
                v-model.number="form.maxDownloadFileCount"
                :title="t('pages.manage.setting.maxDownLoadFileLimit')"
                :placeholder="t('pages.manage.setting.maxDownLoadFileLimitDesc')"
                type="number"
                min="1"
                max="9999"
                step="1"
              />
            </SettingCard>
            <SettingCard>
              <CustomInput
                v-model.number="form.PreSignedExpire"
                :title="t('pages.manage.setting.preSignedUrlExpire')"
                :placeholder="t('pages.manage.setting.preSignedUrlExpireDesc')"
                type="number"
                min="1"
                step="1"
              />
            </SettingCard>
            <SettingCard>
              <CustomInput
                v-model="form.downloadDir"
                :title="t('pages.manage.setting.selectDownloadFolderTitle')"
                :placeholder="t('pages.manage.setting.defaultDownloadFolder')"
                disabled
              >
                <template #input-extra>
                  <button
                    type="button"
                    class="absolute top-0 right-0 flex w-[10%] min-w-[80px] cursor-pointer items-center gap-2 rounded-md bg-accent px-4 py-3 text-sm font-medium text-white"
                    @click="handleDownloadDirClick"
                  >
                    <FolderIcon :size="16" />
                    {{ t('pages.manage.setting.browse') }}
                  </button>
                </template>
              </CustomInput>
            </SettingCard>
          </SettingSection>
        </div>
      </div>
    </div>
  </div>
</template>

<script lang="ts" setup>
import { Download, Edit2Icon, FileText, FolderIcon, Settings, Trash2Icon } from 'lucide-vue-next'
import { computed, nextTick, onBeforeMount, ref, watch } from 'vue'
import { useI18n } from 'vue-i18n'

import CustomButton from '@/components/common/CustomButton.vue'
import CustomInput from '@/components/common/CustomInput.vue'
import CustomSelect from '@/components/common/CustomSelect.vue'
import CustomSwitch from '@/components/common/CustomSwitch.vue'
import PlaceholderTable from '@/components/common/PlaceholderTable.vue'
import SettingCard from '@/components/common/SettingCard.vue'
import SettingSection from '@/components/common/SettingSection.vue'
import useConfirm from '@/hooks/useConfirm'
import useMessage from '@/hooks/useMessage'
import { fileCacheDbInstance } from '@/manage/store/bucketFileDb'
import { formatFileSize } from '@/manage/utils/common'
import { getConfig, saveConfig } from '@/manage/utils/dataSender'
import { IRPCActionType } from '@/utils/enum'

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
const dbSize = ref(0)
const dbSizeAvailableRate = ref('0')

const settingsKeys = Object.keys(form.value)
const pasteFormatList = [
  { label: t('pages.manage.setting.copyFormat.markdown'), value: 'markdown' },
  { label: t('pages.manage.setting.copyFormat.markdown-with-link'), value: 'markdown-with-link' },
  { label: t('pages.manage.setting.copyFormat.rawurl'), value: 'rawurl' },
  { label: t('pages.manage.setting.copyFormat.html'), value: 'html' },
  { label: t('pages.manage.setting.copyFormat.bbcode'), value: 'bbcode' },
  { label: t('pages.manage.setting.copyFormat.custom'), value: 'custom' },
]

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
      class: 'text-secondary text-sm font-semibold',
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
        class: 'text-secondary text-sm font-semibold',
      },
      {
        text: t('pages.manage.setting.file'),
        class: 'text-warning text-sm font-semibold',
      },
      {
        text: t('pages.manage.setting.keepDirStructure'),
        class: 'text-secondary text-sm font-semibold',
      },
    ],
    tooltip: t('pages.manage.setting.keepDirStructureDesc'),
  },
  {
    configName: 'isDownloadFolderKeepDirStructure',
    segments: [
      {
        text: t('pages.manage.setting.download'),
        class: 'text-secondary text-sm font-semibold',
      },
      {
        text: t('pages.manage.setting.folder'),
        class: 'text-warning text-sm font-semibold',
      },
      {
        text: t('pages.manage.setting.keepDirStructure'),
        class: 'text-secondary text-sm font-semibold',
      },
    ],
    tooltip: t('pages.manage.setting.keepDirStructureDesc'),
  },
]

settingsKeys.forEach(key => {
  watch(
    () => form.value[key],
    newValue => {
      saveConfig({ [`settings.${key}`]: newValue })
    },
    { flush: 'post' },
  )
})

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

async function initData() {
  const config = (await getConfig()) as IStringKeyMap
  settingsKeys.forEach(key => {
    form.value[key] = config.settings[key] ?? form.value[key]
  })
  await nextTick() // 确保DOM更新完成
}

async function openFile(file: string) {
  window.electron.sendRPC(IRPCActionType.PICLIST_OPEN_FILE, file)
}

async function handleDownloadDirClick() {
  const result = await window.electron.triggerRPC<any>(IRPCActionType.MANAGE_SELECT_DOWNLOAD_FOLDER)
  if (result) {
    form.value.downloadDir = result
  }
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
