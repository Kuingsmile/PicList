<template>
  <div
    class="relative flex h-full min-h-0 w-full min-w-0 flex-col"
    :class="embedded ? '' : 'z-1 items-center justify-start gap-4 rounded-xl border-none p-4'"
  >
    <!-- Header -->
    <header
      class="flex w-full shrink-0 flex-wrap items-center justify-between gap-4"
      :class="
        embedded
          ? 'border-b border-border-secondary px-4 py-3'
          : 'rounded-2xl border border-border-secondary px-6 py-2 shadow-md max-md:p-5'
      "
    >
      <div class="flex min-w-0 flex-1 items-center gap-4" :class="{ 'p-1': !embedded }">
        <span
          v-if="embedded"
          class="flex h-[36px] w-[36px] shrink-0 items-center justify-center rounded-lg border border-border-secondary bg-bg-tertiary text-accent"
        >
          <Settings :size="18" aria-hidden="true" />
        </span>
        <Settings v-else :size="24" class="shrink-0 text-accent" aria-hidden="true" />
        <div class="min-w-0">
          <component
            :is="embedded ? 'h2' : 'h1'"
            class="m-0 truncate font-semibold tracking-tight text-main"
            :class="embedded ? 'text-lg' : 'text-2xl'"
          >
            {{ t('pages.manage.setting.title') }}
          </component>
          <p class="m-0 truncate text-sm text-secondary">{{ t('pages.manage.setting.subtitle') }}</p>
        </div>
      </div>
      <div class="flex flex-wrap gap-3">
        <CustomButton
          v-if="!embedded"
          type="secondary"
          :icon="ArrowLeftIcon"
          :text="t('pages.manage.main.allAccounts')"
          @click="router.push({ path: '/main-page/manage-login-page' })"
        />
        <CustomButton
          type="secondary"
          :icon="FileText"
          :text="t('pages.settings.sync.editCloudConfigFile')"
          :class="{ 'h-[36px] py-0!': embedded }"
          @click="openFile('manage.json')"
        />
      </div>
    </header>

    <!-- Tabs -->
    <div
      class="flex w-full shrink-0 items-center gap-1 overflow-x-auto"
      :class="
        embedded
          ? 'no-scrollbar border-b border-border-secondary px-4 py-2'
          : 'rounded-2xl border border-border-secondary px-6 py-2 shadow-md max-md:px-3'
      "
    >
      <CustomButton
        v-for="tab in tabs"
        :key="tab.id"
        :text="tab.label"
        :icon="tab.icon"
        :active="currentTab === tab.id"
        :icon-size="embedded ? 16 : 18"
        type="tab"
        :class="{ 'py-1.5!': embedded }"
        @click="currentTab = tab.id"
      />
    </div>

    <!-- Content -->
    <div
      class="relative flex min-h-0 w-full flex-1 flex-col overflow-hidden"
      :class="{ 'rounded-2xl border border-border-secondary p-1 shadow-md': !embedded }"
    >
      <div class="no-scrollbar flex min-h-0 w-full flex-1 flex-col gap-6 overflow-auto p-4">
        <!-- Links -->
        <template v-if="currentTab === 'links'">
          <SettingSection
            :title="t('pages.manage.setting.section.copy')"
            :description="t('pages.manage.setting.section.copyDesc')"
            :icon="ClipboardIcon"
          >
            <SettingCard>
              <SingleSelect
                v-model="form.pasteFormat"
                :fronticon="false"
                :tight="false"
                :select-list="pasteFormatList"
                :title="t('pages.manage.setting.copyFormat.title')"
              />
            </SettingCard>
            <SettingCard>
              <CustomInput
                v-model="form.customPasteFormat"
                :title="t('pages.manage.setting.copyFormat.custom')"
                :tips="t('pages.manage.setting.copyFormat.customTitle')"
                :placeholder="t('pages.manage.setting.copyFormat.customTips')"
              />
            </SettingCard>
            <SettingCard
              v-for="key in ['isEncodeUrl', 'isForceCustomUrlHttps']"
              :key
              p1
              class="flex flex-col justify-center"
            >
              <CustomSwitch v-model="form[key]" small no-border :title="switchTitle(key)" :tips="switchTips(key)" />
            </SettingCard>
          </SettingSection>

          <SettingSection
            :title="t('pages.manage.setting.section.preSigned')"
            :description="t('pages.manage.setting.section.preSignedDesc')"
            :icon="KeyRoundIcon"
          >
            <SettingCard p1 class="flex flex-col justify-center">
              <CustomSwitch
                v-model="form.isUsePreSignedUrl"
                small
                no-border
                :title="switchTitle('isUsePreSignedUrl')"
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
          </SettingSection>
        </template>

        <!-- Browsing -->
        <template v-else-if="currentTab === 'browse'">
          <SettingSection
            :title="t('pages.manage.setting.section.fileList')"
            :description="t('pages.manage.setting.section.fileListDesc')"
            :icon="FolderOpenIcon"
          >
            <SettingCard v-for="key in ['isAutoRefresh', 'isIgnoreCase']" :key p1 class="flex flex-col justify-center">
              <CustomSwitch v-model="form[key]" small no-border :title="switchTitle(key)" :tips="switchTips(key)" />
            </SettingCard>
          </SettingSection>

          <SettingSection
            :title="t('pages.manage.setting.section.thumbnail')"
            :description="t('pages.manage.setting.section.thumbnailDesc')"
            :icon="ImageIcon"
            only-one-row
          >
            <SettingCard p1 class="flex flex-col justify-center">
              <CustomSwitch v-model="form.isShowThumbnail" small no-border :title="switchTitle('isShowThumbnail')" />
            </SettingCard>
            <SettingCard v-if="form.isShowThumbnail">
              <CustomInput
                v-model.trim="form.thumbnailSuffix"
                :title="t('pages.manage.setting.thumbnailSuffixTitle')"
                :placeholder="t('pages.manage.setting.thumbnailSuffixPlaceholder')"
                :tips="t('pages.manage.setting.thumbnailSuffixTips')"
              />
            </SettingCard>
          </SettingSection>
        </template>

        <!-- Upload -->
        <template v-else-if="currentTab === 'upload'">
          <SettingSection
            :title="t('pages.manage.setting.section.naming')"
            :description="t('pages.manage.setting.section.namingDesc')"
            :icon="Edit2Icon"
          >
            <SettingCard p1 class="flex flex-col justify-center">
              <CustomSwitch
                v-model="form.isUploadKeepDirStructure"
                small
                no-border
                :title="switchTitle('isUploadKeepDirStructure')"
                :tips="switchTips('isUploadKeepDirStructure')"
              />
            </SettingCard>
            <SettingCard
              v-for="key in ['timestampRename', 'randomStringRename', 'customRename']"
              :key
              p1
              class="flex flex-col justify-center"
            >
              <CustomSwitch v-model="form[key]" small no-border :title="switchTitle(key)" :tips="switchTips(key)" />
            </SettingCard>
            <template v-if="form.customRename" #extra>
              <div class="mt-4">
                <CustomInput
                  v-model="form.customRenameFormat"
                  :title="t('pages.manage.setting.customRenameFormat')"
                  :placeholder="t('pages.manage.setting.customRenameTablePlaceholder')"
                />
                <PlaceholderTable :list="advancedRenameList" :title-list="advancedRenameTitleList" />
              </div>
            </template>
          </SettingSection>

          <SettingSection
            :title="t('pages.manage.setting.section.performance')"
            :description="t('pages.manage.setting.section.performanceDesc')"
            :icon="GaugeIcon"
          >
            <SettingCard v-for="key in uploadLimitKeys" :key>
              <CustomInput
                v-model.number="form[key]"
                :title="t(`pages.manage.setting.${key}`)"
                :placeholder="t(`pages.manage.setting.${key}`)"
                type="number"
                min="1"
                :max="key === 'uploadMemoryMB' ? undefined : '64'"
                step="1"
              />
            </SettingCard>
          </SettingSection>
        </template>

        <!-- Download -->
        <template v-else-if="currentTab === 'download'">
          <SettingSection
            :title="t('pages.manage.setting.section.download')"
            :description="t('pages.manage.setting.section.downloadDesc')"
            :icon="Download"
          >
            <SettingCard class="col-span-2 max-md:col-span-1">
              <span class="mb-1 block text-sm font-semibold text-secondary">
                {{ t('pages.manage.setting.selectDownloadFolderTitle') }}
              </span>
              <div class="flex items-center gap-2">
                <div
                  class="flex h-[44px] min-w-0 flex-1 items-center gap-2 rounded-md border border-border bg-bg-tertiary px-3"
                  :title="form.downloadDir || undefined"
                >
                  <FolderIcon :size="16" class="shrink-0 text-secondary" aria-hidden="true" />
                  <span
                    class="truncate"
                    :class="form.downloadDir ? 'font-mono text-xs text-main' : 'text-sm text-secondary'"
                  >
                    {{ form.downloadDir || t('pages.manage.setting.defaultDownloadFolder') }}
                  </span>
                </div>
                <CustomButton
                  type="secondary"
                  :icon="FolderOpenIcon"
                  :text="t('pages.manage.setting.browse')"
                  class="h-[44px] py-0!"
                  @click="handleDownloadDirClick"
                />
                <button
                  v-if="form.downloadDir"
                  v-tooltip="t('pages.manage.setting.useDefaultFolder')"
                  type="button"
                  class="flex h-[44px] w-[44px] shrink-0 cursor-pointer items-center justify-center rounded-md border border-border text-secondary transition-colors duration-fast hover:border-accent hover:bg-accent/10 hover:text-accent focus-visible:focus-ring"
                  :aria-label="t('pages.manage.setting.useDefaultFolder')"
                  @click="form.downloadDir = ''"
                >
                  <RotateCcwIcon :size="16" aria-hidden="true" />
                </button>
              </div>
            </SettingCard>
            <SettingCard>
              <SingleSelect
                v-model="form.downloadConflictPolicy"
                :fronticon="false"
                :tight="false"
                :select-list="downloadConflictPolicies"
                :title="t('pages.manage.setting.downloadConflictPolicy.title')"
              />
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
            <SettingCard
              v-for="key in ['isDownloadFileKeepDirStructure', 'isDownloadFolderKeepDirStructure']"
              :key
              p1
              class="flex flex-col justify-center"
            >
              <CustomSwitch
                v-model="form[key]"
                small
                no-border
                :title="switchTitle(key)"
                :tips="t('pages.manage.setting.keepDirStructureDesc')"
              />
            </SettingCard>
          </SettingSection>
        </template>

        <!-- Cache -->
        <template v-else-if="currentTab === 'cache'">
          <SettingSection
            :title="t('pages.manage.setting.section.cache')"
            :description="t('pages.manage.setting.cacheDesc')"
            :icon="DatabaseIcon"
            only-one-row
          >
            <SettingCard>
              <div class="flex flex-wrap items-center gap-6">
                <div class="min-w-[220px] flex-1">
                  <p class="m-0 text-sm font-semibold text-secondary">{{ t('pages.manage.setting.cacheUsed') }}</p>
                  <p class="m-0 mt-1 text-2xl font-semibold text-main tabular-nums">
                    {{ formatFileSize(dbSize) || '0 B' }}
                  </p>
                  <div
                    class="mt-3 h-2 w-full overflow-hidden rounded-full bg-bg-tertiary"
                    role="meter"
                    :aria-label="t('pages.manage.setting.cacheUsed')"
                    aria-valuemin="0"
                    aria-valuemax="100"
                    :aria-valuenow="usedPercent"
                  >
                    <div
                      class="h-full min-w-[4px] rounded-full bg-accent transition-[width] duration-300 ease-apple"
                      :style="{ width: `${usedPercent}%` }"
                    />
                  </div>
                  <p class="m-0 mt-2 text-xs text-secondary tabular-nums">
                    {{ t('pages.manage.setting.cacheAvailable', { percent: dbSizeAvailableRate }) }}
                  </p>
                </div>
                <CustomButton
                  type="danger"
                  :icon="Trash2Icon"
                  :text="t('pages.manage.setting.clearCacheBtn')"
                  :loading="isClearing"
                  @click="handleConfirmClearDb"
                />
              </div>
            </SettingCard>
          </SettingSection>
        </template>
      </div>
    </div>
  </div>
</template>

<script lang="ts" setup>
import {
  ArrowLeftIcon,
  ClipboardIcon,
  DatabaseIcon,
  Download,
  Edit2Icon,
  FileText,
  FolderIcon,
  FolderOpenIcon,
  GaugeIcon,
  ImageIcon,
  KeyRoundIcon,
  Link2Icon,
  RotateCcwIcon,
  Settings,
  Trash2Icon,
  UploadIcon,
} from '@lucide/vue'
import { useStorage } from '@vueuse/core'
import { computed, onBeforeMount, ref, watch } from 'vue'
import { useI18n } from 'vue-i18n'
import { useRouter } from 'vue-router'

import CustomButton from '@/components/common/CustomButton.vue'
import CustomInput from '@/components/common/CustomInput.vue'
import CustomSwitch from '@/components/common/CustomSwitch.vue'
import PlaceholderTable from '@/components/common/PlaceholderTable.vue'
import SettingCard from '@/components/common/SettingCard.vue'
import SettingSection from '@/components/common/SettingSection.vue'
import SingleSelect from '@/components/common/SingleSelect.vue'
import useConfirm from '@/composables/useConfirm'
import useMessage from '@/composables/useMessage'
import { fileCacheDbInstance } from '@/manage/services/bucketDatabase'
import { getConfig, saveConfig } from '@/manage/services/configService'
import { formatFileSize } from '@/manage/utils/filePresentation'
import { IRPCActionType } from '#/constants/rpcActions'
import { enforceBoolean } from '#/utils/values'

const { embedded = false } = defineProps<{
  /** Rendered inside the manage main page's content card instead of as a full page. */
  embedded?: boolean
}>()

const { t } = useI18n()
const router = useRouter()
const message = useMessage()
const { confirm } = useConfirm()
const form = ref<IStringKeyMap>({
  timestampRename: false,
  randomStringRename: false,
  customRename: false,
  isAutoRefresh: false,
  isShowThumbnail: false,
  thumbnailSuffix: '',
  isUsePreSignedUrl: false,
  isIgnoreCase: false,
  isForceCustomUrlHttps: false,
  isEncodeUrl: false,
  isUploadKeepDirStructure: true,
  isDownloadFileKeepDirStructure: false,
  isDownloadFolderKeepDirStructure: true,
  downloadDir: '',
  downloadConflictPolicy: 'rename',
  pasteFormat: 'markdown',
  customPasteFormat: '$url',
  PreSignedExpire: 14400, // seconds
  maxDownloadFileCount: 5,
  uploadConcurrency: 4,
  uploadAccountConcurrency: 2,
  uploadMemoryMB: 256,
  uploadMultipartConcurrency: 2,
  customRenameFormat: '{filename}',
})
const dbSize = ref(0)
const dbQuota = ref(0)
const dbSizeAvailableRate = ref('0')
const isClearing = ref(false)

const usedPercent = computed(() => (dbQuota.value > 0 ? Math.min(100, (dbSize.value / dbQuota.value) * 100) : 0))

type TabId = 'links' | 'browse' | 'upload' | 'download' | 'cache'
const tabs = computed<{ id: TabId; label: string; icon: any }[]>(() => [
  { id: 'links', label: t('pages.manage.setting.tabs.links'), icon: Link2Icon },
  { id: 'browse', label: t('pages.manage.setting.tabs.browse'), icon: FolderOpenIcon },
  { id: 'upload', label: t('pages.manage.setting.tabs.upload'), icon: UploadIcon },
  { id: 'download', label: t('pages.manage.setting.tabs.download'), icon: Download },
  { id: 'cache', label: t('pages.manage.setting.tabs.cache'), icon: DatabaseIcon },
])
const storedTab = useStorage<TabId>('manage-setting-tab', 'links')
const currentTab = computed({
  get: () => (tabs.value.some(tab => tab.id === storedTab.value) ? storedTab.value : 'links'),
  set: value => {
    storedTab.value = value
  },
})

const settingsKeys = Object.keys(form.value)
const uploadLimitKeys = [
  'uploadConcurrency',
  'uploadAccountConcurrency',
  'uploadMemoryMB',
  'uploadMultipartConcurrency',
]
const downloadConflictPolicies = computed(() =>
  ['rename', 'overwrite', 'skip'].map(value => ({
    label: t(`pages.manage.setting.downloadConflictPolicy.${value}`),
    value,
  })),
)
const pasteFormatList = computed(() =>
  ['markdown', 'markdown-with-link', 'rawurl', 'html', 'bbcode', 'custom'].map(value => ({
    label: t(`pages.manage.setting.copyFormat.${value}`),
    value,
  })),
)

// Switches without a help tooltip in the locale files.
const switchesWithoutTips = new Set(['isShowThumbnail', 'isUsePreSignedUrl'])

function switchTitle(key: string) {
  if (key === 'isDownloadFileKeepDirStructure') return t('pages.manage.setting.downloadFileKeepDirTitle')
  if (key === 'isDownloadFolderKeepDirStructure') return t('pages.manage.setting.downloadFolderKeepDirTitle')
  return t(`pages.manage.setting.${key}Title` as any)
}

function switchTips(key: string) {
  return switchesWithoutTips.has(key) ? undefined : t(`pages.manage.setting.${key}Tips` as any)
}

settingsKeys.forEach(key => {
  watch(
    () => form.value[key],
    async newValue => {
      await saveConfig({ [`settings.${key}`]: newValue })
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
    { label: t('pages.settings.upload.placeholder.timestampS'), value: '{timestampS}' },
  ],
  categoryHash: [
    { label: t('pages.settings.upload.placeholder.md5'), value: '{md5}' },
    { label: t('pages.settings.upload.placeholder.md5-16'), value: '{md5-16}' },
    { label: t('pages.settings.upload.placeholder.uuid'), value: '{uuid}' },
    { label: t('pages.settings.upload.placeholder.ulid'), value: '{ulid}' },
    { label: t('pages.settings.upload.placeholder.sha1'), value: '{sha1}' },
    { label: t('pages.settings.upload.placeholder.sha1-n'), value: '{sha1-n}' },
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
    const value = config.settings[key] ?? form.value[key]
    form.value[key] = typeof form.value[key] === 'boolean' ? enforceBoolean(value) : value
  })
}

function openFile(file: string) {
  window.electron.sendRPC(IRPCActionType.PICLIST_OPEN_FILE, file)
}

async function handleDownloadDirClick() {
  const result = await window.electron.triggerRPC<any>(IRPCActionType.MANAGE_SELECT_DOWNLOAD_FOLDER)
  if (result) {
    form.value.downloadDir = result
  }
}

async function handleConfirmClearDb() {
  const result = await confirm({
    title: t('pages.manage.setting.notice'),
    message: t('pages.manage.setting.clearCacheMsg'),
    type: 'warning',
    confirmButtonText: t('common.confirm'),
    cancelButtonText: t('common.cancel'),
    center: true,
  })
  if (!result) return
  isClearing.value = true
  try {
    await fileCacheDbInstance.clearCache()
    await getIndexDbSize()
    message.success(t('pages.manage.setting.clearSuccess'))
  } catch {
    message.error(t('pages.manage.setting.clearFailed'))
  } finally {
    isClearing.value = false
  }
}

async function getIndexDbSize() {
  const { usage = 0, quota = 0 } = await navigator.storage.estimate()
  dbSize.value = usage
  dbQuota.value = quota
  dbSizeAvailableRate.value = quota > 0 ? (100 - (usage / quota) * 100).toFixed(2) : '100'
}

onBeforeMount(() => {
  initData()
  getIndexDbSize()
})
</script>
