<template>
  <div v-show="active" class="no-scrollbar flex h-full w-full flex-1 flex-col gap-6 overflow-auto p-4">
    <!-- Sync Status Overview -->
    <CustomNavCard :clickable="false" :icon="RotateCcw" :title="t('pages.settings.sync.syncConfiguration')">
      <template #description>
        <p class="mt-1 flex min-w-0 items-center gap-2 text-sm text-secondary">
          <span
            class="inline-flex shrink-0 items-center rounded-sm bg-bg-tertiary px-2 py-1 text-xs font-semibold tracking-wide text-accent"
            >{{ syncDraft.type?.toUpperCase() || 'N/A' }}</span
          >
          <span v-if="syncConfigured" class="truncate">{{ syncTarget }}</span>
          <span v-else class="flex items-center gap-1.5 text-warning">
            <TriangleAlert :size="14" class="shrink-0" aria-hidden="true" />
            {{ t('pages.settings.sync.notConfigured') }}
          </span>
        </p>
      </template>
      <template #extra>
        <CustomButton
          :icon="Settings"
          :text="t('pages.settings.sync.configureSync')"
          :type="syncConfigured ? 'secondary' : 'primary'"
          @click="syncVisible = true"
        />
      </template>
    </CustomNavCard>

    <!-- Sync Actions Section -->
    <SettingSection :icon="CloudUpload" :title="t('pages.settings.sync.syncActions')">
      <CustomNavCard
        :title="t('pages.settings.sync.upDownloadSettings')"
        :icon="CloudUpload"
        :description="t('pages.settings.sync.upDownloadDesc')"
        @click="upDownConfigVisible = true"
      />
      <GallerySyncSnapshots />
      <CustomNavCard
        :title="t('pages.settings.sync.migrateFromPicGo')"
        :icon="Import"
        :description="t('pages.settings.sync.migrateDesc')"
        @click="handleMigrateFromPicGo"
      />

      <CustomNavCard
        v-if="isPortable"
        :title="t('pages.settings.sync.migrateFromPicListInstallation')"
        :icon="Import"
        :description="t('pages.settings.sync.migrateDescPicList')"
        @click="handleMigrateFromPicListInstallation"
      />
    </SettingSection>

    <!-- File Management Section -->
    <SettingSection :icon="FolderOpen" :title="t('pages.settings.sync.fileManagement')">
      <CustomNavCard
        v-for="action in fileManagementActions"
        :key="action.titleKey"
        :title="t(action.titleKey)"
        :icon="action.icon"
        @click="action.onClick"
      />
    </SettingSection>
  </div>

  <CustomModal
    v-model:visible="syncVisible"
    height="auto"
    width="700px"
    :title="t('pages.settings.sync.syncEndpointConfig')"
    :close-disabled="savingSync"
  >
    <div class="flex w-full flex-col gap-4 p-4">
      <!-- Platform Picker -->
      <div class="flex w-full items-center gap-2 rounded-2xl border border-border-secondary p-2 shadow-md">
        <CustomButton
          v-for="platform in syncPlatforms"
          :key="platform.value"
          :text="platform.label"
          :icon="platform.icon"
          :active="syncDraft.type === platform.value"
          :icon-size="18"
          type="tab"
          @click="syncDraft.type = platform.value"
        />
      </div>

      <!-- Configuration Fields -->
      <SettingSection>
        <template v-if="syncDraft.type === 'webdav'">
          <SettingCard class="col-span-full">
            <CustomInput
              v-model.trim="syncDraft.webdavEndpoint"
              required
              :title="t('pages.settings.sync.webdavEndpoint')"
              placeholder="https://dav.example.com/dav"
            />
          </SettingCard>
          <SettingCard>
            <CustomInput
              v-model.trim="syncDraft.webdavUsername"
              :title="t('pages.settings.sync.webdav.username')"
              :placeholder="t('pages.settings.sync.webdav.username')"
            />
          </SettingCard>
          <SettingCard>
            <CustomInput
              v-model.trim="syncDraft.webdavPassword"
              is-password
              :title="t('pages.settings.sync.webdav.password')"
              :placeholder="t('pages.settings.sync.webdav.password')"
            />
          </SettingCard>
          <SettingCard>
            <CustomInput
              v-model.trim="syncDraft.webdavSavePath"
              :title="t('pages.settings.sync.webdav.savePath')"
              placeholder="piclist/config"
            />
          </SettingCard>
          <SettingCard>
            <SingleSelect
              v-model="syncDraft.webdavAuthType"
              :fronticon="false"
              :tight="false"
              :select-list="webdavAuthTypes"
              :title="t('pages.settings.sync.webdav.authType')"
              :icon="Settings"
            />
          </SettingCard>
          <SettingCard class="col-span-full" p1>
            <CustomSwitch
              v-model="syncDraft.webdavSslEnabled"
              small
              no-border
              :title="t('pages.settings.sync.webdav.enableSSL')"
              :description="t('pages.settings.sync.webdav.enableSSLDesc')"
            />
          </SettingCard>
        </template>
        <template v-else>
          <SettingCard v-if="syncDraft.type === 'gitea'" class="col-span-full">
            <CustomInput
              v-model.trim="syncDraft.endpoint"
              required
              :title="t('pages.settings.sync.giteaHost')"
              placeholder="https://gitea.example.com"
            />
          </SettingCard>
          <SettingCard v-for="field in gitFields" :key="field.key">
            <CustomInput
              v-model.trim="syncDraft[field.key]"
              :is-password="field.key === 'token'"
              :required="field.required"
              :title="t(`pages.settings.sync.${syncDraft.type}.${field.key}`)"
              :placeholder="field.placeholder || t(`pages.settings.sync.${syncDraft.type}.${field.key}`)"
            />
          </SettingCard>
          <SettingCard v-if="syncDraft.type === 'github'" class="col-span-full">
            <CustomInput
              v-model.trim="syncDraft.proxy"
              :title="t('pages.settings.sync.syncConfigProxy')"
              placeholder="http://127.0.0.1:7890"
            />
          </SettingCard>
        </template>
      </SettingSection>
    </div>
    <template #footer>
      <CustomButton type="secondary" :text="t('common.cancel')" :disabled="savingSync" @click="syncVisible = false" />
      <CustomButton :text="t('common.confirm')" :loading="savingSync" @click="confirmSyncSetting" />
    </template>
  </CustomModal>

  <CustomModal
    v-model:visible="upDownConfigVisible"
    height="auto"
    width="760px"
    :title="t('pages.settings.sync.upDownloadSettings')"
    :close-disabled="!!runningTask"
  >
    <div class="flex flex-col gap-6 p-4">
      <CustomNavCard :clickable="false" :icon="RotateCcw" :title="t('pages.settings.sync.syncConfiguration')">
        <template #description>
          <p class="mt-1 flex min-w-0 items-center gap-2 text-sm text-secondary">
            <span
              class="inline-flex shrink-0 items-center rounded-sm bg-bg-tertiary px-2 py-1 text-xs font-semibold tracking-wide text-accent"
              >{{ syncDraft.type?.toUpperCase() || 'N/A' }}</span
            >
            <span v-if="syncConfigured" class="truncate">{{ syncTarget }}</span>
            <span v-else class="flex items-center gap-1.5 text-warning">
              <TriangleAlert :size="14" class="shrink-0" aria-hidden="true" />
              {{ t('pages.settings.sync.notConfiguredHint') }}
            </span>
          </p>
        </template>
        <template #extra>
          <CustomButton
            :icon="Settings"
            :text="t('pages.settings.sync.configureSync')"
            :type="syncConfigured ? 'secondary' : 'primary'"
            :disabled="!!runningTask"
            @click="syncVisible = true"
          />
        </template>
      </CustomNavCard>

      <SettingSection
        :icon="FileCog"
        :title="t('pages.settings.sync.configFiles')"
        :description="t('pages.settings.sync.configFilesDesc')"
        only-one-row
      >
        <CustomNavCard
          v-for="scope in syncScopes"
          :key="scope.key"
          :clickable="false"
          :icon="scope.icon"
          :title="t(`pages.settings.sync.${scope.key}`)"
          :description="t(`pages.settings.sync.${scope.key}Desc`)"
        >
          <template #extra>
            <div class="flex flex-wrap justify-end gap-2">
              <CustomButton
                v-for="direction in syncDirections"
                :key="direction.key"
                type="secondary"
                :icon="direction.icon"
                :text="t(`pages.settings.sync.${direction.key}`)"
                :loading="runningTask === scope[direction.key]"
                :disabled="!syncConfigured || (!!runningTask && runningTask !== scope[direction.key])"
                @click="runSyncTask(scope, direction.key)"
              />
            </div>
          </template>
        </CustomNavCard>
      </SettingSection>

      <SettingSection
        :icon="ImageIcon"
        :title="t('pages.settings.sync.galleryDB')"
        :description="t('pages.settings.sync.galleryPlan.entryDescription')"
        only-one-row
      >
        <GallerySync :disabled="!syncConfigured || !!runningTask" />
      </SettingSection>
    </div>
  </CustomModal>
  <SettingsFileEditor ref="editor" />
</template>

<script setup lang="ts">
import {
  CloudUpload,
  Download,
  Edit,
  FileCog,
  Files,
  FileText,
  FolderOpen,
  GitBranch,
  Image as ImageIcon,
  Import,
  RotateCcw,
  Server,
  Settings,
  TriangleAlert,
  Wrench,
} from '@lucide/vue'
import { computed, ref, watch } from 'vue'
import { useTemplateRef } from 'vue'
import { useI18n } from 'vue-i18n'

import CustomButton from '@/components/common/CustomButton.vue'
import CustomInput from '@/components/common/CustomInput.vue'
import CustomModal from '@/components/common/CustomModal.vue'
import CustomNavCard from '@/components/common/CustomNavCard.vue'
import CustomSwitch from '@/components/common/CustomSwitch.vue'
import SettingCard from '@/components/common/SettingCard.vue'
import SettingSection from '@/components/common/SettingSection.vue'
import SingleSelect from '@/components/common/SingleSelect.vue'
import GallerySync from '@/components/GallerySync.vue'
import GallerySyncSnapshots from '@/components/GallerySyncSnapshots.vue'
import { createSyncDraft } from '@/composables/settings/settingsState'
import { useSettingsContext } from '@/composables/settings/useSettingsContext'
import useConfirm from '@/composables/useConfirm'
import useMessage from '@/composables/useMessage'
import { getConfig, saveConfig } from '@/services/configService'
import { configPaths } from '@/utils/configPaths'
import { IRPCActionType } from '#/constants/rpcActions'

import SettingsFileEditor from './SettingsFileEditor.vue'

defineProps<{ active: boolean }>()
const { t } = useI18n()
const { syncDraft, isPortable } = useSettingsContext()
const { confirm } = useConfirm()
const message = useMessage()
const editor = useTemplateRef('editor')
function editFile(file: string) {
  void editor.value?.editFile(file)
}
const syncVisible = ref(false)

const upDownConfigVisible = ref(false)

const savingSync = ref(false)
const runningTask = ref<string | null>(null)

const fileManagementActions = [
  { titleKey: 'pages.settings.sync.openConfigFile', icon: FileText, onClick: () => openFile('data.json') },
  { titleKey: 'pages.settings.sync.editConfigFile', icon: Edit, onClick: () => editFile('data.json') },
  { titleKey: 'pages.settings.sync.editCloudConfigFile', icon: Edit, onClick: () => editFile('manage.json') },
  { titleKey: 'pages.settings.sync.openConfigFileDir', icon: FolderOpen, onClick: () => openDirectory() },
]

const syncScopes = [
  {
    key: 'commonConfig',
    icon: Wrench,
    files: 1,
    upload: IRPCActionType.CONFIGURE_UPLOAD_COMMON_CONFIG,
    download: IRPCActionType.CONFIGURE_DOWNLOAD_COMMON_CONFIG,
  },
  {
    key: 'manageConfig',
    icon: FolderOpen,
    files: 1,
    upload: IRPCActionType.CONFIGURE_UPLOAD_MANAGE_CONFIG,
    download: IRPCActionType.CONFIGURE_DOWNLOAD_MANAGE_CONFIG,
  },
  {
    key: 'allConfig',
    icon: Files,
    files: 2,
    upload: IRPCActionType.CONFIGURE_UPLOAD_ALL_CONFIG,
    download: IRPCActionType.CONFIGURE_DOWNLOAD_ALL_CONFIG,
  },
] as const
const syncDirections = [
  { key: 'upload', icon: CloudUpload },
  { key: 'download', icon: Download },
] as const

const syncTarget = computed(() => {
  const { type, username, repo, webdavEndpoint } = syncDraft.value
  if (type === 'webdav') return webdavEndpoint || ''
  return username ? `${username}/${repo || '...'}` : ''
})
// Mirrors the main process validation so sync actions are only offered when they can run.
const syncConfigured = computed(() => {
  const config = syncDraft.value
  if (config.type === 'webdav') return !!(config.webdavEndpoint && config.webdavUsername && config.webdavPassword)
  return !!(
    config.type &&
    config.username &&
    config.repo &&
    config.branch &&
    config.token &&
    (config.type !== 'gitea' || config.endpoint)
  )
})

const syncPlatforms = [
  { value: 'github', label: 'GitHub', icon: GitBranch },
  { value: 'gitee', label: 'Gitee', icon: GitBranch },
  { value: 'gitea', label: 'Gitea', icon: GitBranch },
  { value: 'webdav', label: 'WebDAV', icon: Server },
]

const gitFields: { key: 'username' | 'repo' | 'branch' | 'token'; required: boolean; placeholder?: string }[] = [
  { key: 'username', required: true },
  { key: 'repo', required: true },
  { key: 'branch', required: false, placeholder: 'main' },
  { key: 'token', required: true },
]
const webdavAuthTypes = [
  { label: 'Basic', value: 'basic' },
  { label: 'Digest', value: 'digest' },
]

// Closing the modal any way other than a successful save discards the unsaved draft.
watch(syncVisible, async visible => {
  if (!visible) syncDraft.value = createSyncDraft(await getConfig<ISyncConfig>(configPaths.settings.sync))
})

async function confirmSyncSetting() {
  if (savingSync.value) return
  savingSync.value = true
  const draft = JSON.stringify(syncDraft.value)
  try {
    if (!(await saveConfig({ [configPaths.settings.sync]: syncDraft.value }))) return
    if (JSON.stringify(syncDraft.value) === draft) syncVisible.value = false
  } finally {
    savingSync.value = false
  }
}

async function openFile(file: string) {
  window.electron.sendRPC(IRPCActionType.PICLIST_OPEN_FILE, file)
}

function openDirectory(directory?: string, inStorePath = true) {
  window.electron.sendRPC(IRPCActionType.PICLIST_OPEN_DIRECTORY, directory, inStorePath)
}

function handleMigrateFromPicGo() {
  confirm({
    title: t('pages.settings.sync.mirgrateTitle'),
    message: t('pages.settings.sync.mirgrateContent'),
    type: 'warning',
    confirmButtonText: t('common.confirm'),
    cancelButtonText: t('common.cancel'),
    center: true,
  }).then(result => {
    if (result) {
      window.electron
        .triggerRPC<boolean>(IRPCActionType.CONFIGURE_MIGRATE_FROM_PICGO)
        .then(() => {
          message.success(t('pages.settings.sync.mirgrateSuccess'))
        })
        .catch(() => {
          message.error(t('pages.settings.sync.mirgrateFailed'))
        })
    }
  })
}

function handleMigrateFromPicListInstallation() {
  confirm({
    title: t('pages.settings.sync.mirgrateTitle'),
    message: t('pages.settings.sync.migrateFromPicListInstallationContent'),
    type: 'warning',
    confirmButtonText: t('common.confirm'),
    cancelButtonText: t('common.cancel'),
    center: true,
  }).then(result => {
    if (result) {
      window.electron
        .triggerRPC<boolean>(IRPCActionType.CONFIGURE_MIGRATE_FROM_PICLIST_INSTALLATION)
        .then(() => {
          message.success(t('pages.settings.sync.mirgrateSuccess'))
        })
        .catch(() => {
          message.error(t('pages.settings.sync.mirgrateFailed'))
        })
    }
  })
}

async function runSyncTask(scope: (typeof syncScopes)[number], direction: 'upload' | 'download') {
  if (runningTask.value || !syncConfigured.value) return
  const confirmed = await confirm({
    title: t(`pages.settings.sync.${direction}`),
    message: t(`pages.settings.sync.${direction}Confirm`, { name: t(`pages.settings.sync.${scope.key}`) }),
    type: 'warning',
    confirmButtonText: t(`pages.settings.sync.${direction}`),
    cancelButtonText: t('common.cancel'),
  })
  if (!confirmed) return
  const task = scope[direction]
  runningTask.value = task
  try {
    const succeeded = (await window.electron.triggerRPC<number>(task)) || 0
    if (succeeded < scope.files) message.error(t('pages.settings.sync.syncResult.failed'))
    else message.success(t('pages.settings.sync.syncResult.success'))
  } catch {
    message.error(t('pages.settings.sync.syncResult.failed'))
  } finally {
    runningTask.value = null
  }
}
</script>
