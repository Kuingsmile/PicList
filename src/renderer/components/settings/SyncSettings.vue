<template>
  <div v-show="active" class="no-scrollbar flex h-full w-full flex-1 flex-col gap-6 overflow-auto p-4">
    <!-- Sync Status Overview -->
    <CustomNavCard :clickable="false" :icon="RotateCcw" :title="t('pages.settings.sync.syncConfiguration')">
      <template #description>
        <p class="flex items-center gap-2 text-sm text-secondary">
          <span
            class="inline-flex items-center rounded-sm bg-bg-tertiary px-2 py-1 text-xs font-semibold tracking-wide text-accent"
            >{{ sync.type?.toUpperCase() || 'N/A' }}</span
          >
          <span v-if="sync.type !== 'webdav' && sync.username" class="m-0 text-sm text-secondary"
            >{{ sync.username }}/{{ sync.repo || '...' }}</span
          >
          <span v-else-if="sync.type === 'webdav' && sync.webdavEndpoint" class="m-0 text-sm text-secondary">{{
            sync.webdavEndpoint
          }}</span>
          <span v-else class="text-sm font-semibold text-danger/70 italic">{{
            t('pages.settings.sync.notConfigured')
          }}</span>
        </p>
      </template>
      <template #extra>
        <CustomButton
          :icon="Settings"
          :text="t('pages.settings.sync.configureSync')"
          type="secondary"
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
  >
    <div class="flex w-full flex-col gap-4 p-4">
      <div class="p-2">
        <div class="grid grid-cols-4 gap-3">
          <button
            v-for="typeitem of syncType"
            :key="typeitem"
            class="flex cursor-pointer flex-col items-center justify-center gap-2 rounded-lg border-2 border-border bg-bg-tertiary px-2 py-4 hover:border-accent/50 hover:bg-accent/10 [.active]:border-accent [.active]:bg-accent/10 [.active]:text-accent [.active]:shadow-md"
            :class="{ active: sync.type === typeitem }"
            @click="sync.type = typeitem"
          >
            <GitBranch v-if="typeitem.includes('git')" class="text-secondary" :size="20" />
            <Store v-else-if="typeitem === 'webdav'" class="text-secondary" :size="20" />
            <span class="text-sm font-semibold text-secondary">{{
              typeitem.slice(0, 1).toUpperCase() + typeitem.slice(1)
            }}</span>
          </button>
        </div>
      </div>

      <!-- Configuration Fields -->
      <div class="flex w-full flex-col gap-4">
        <SettingSection :icon="Settings" :title="sync.type">
          <SettingCard v-if="sync.type === 'gitea'">
            <CustomInput
              v-model.trim="sync.endpoint"
              :title="t('pages.settings.sync.giteaHost')"
              :placeholder="t('pages.settings.sync.giteaHost')"
            />
          </SettingCard>
          <SettingCard v-if="sync.type === 'webdav'">
            <CustomInput
              v-model.trim="sync.webdavEndpoint"
              :title="t('pages.settings.sync.webdavEndpoint')"
              :placeholder="t('pages.settings.sync.webdavEndpoint')"
            />
          </SettingCard>
          <template v-if="sync.type !== 'webdav'">
            <SettingCard v-for="inputItem in ['username', 'repo', 'branch', 'token']" :key="inputItem">
              <CustomInput
                v-model.trim="sync[inputItem as any]"
                :is-password="inputItem === 'token'"
                :title="t(`pages.settings.sync.${sync.type.toLowerCase()}.${inputItem.toLowerCase()}`)"
                :placeholder="t(`pages.settings.sync.${sync.type.toLowerCase()}.${inputItem.toLowerCase()}`)"
              />
            </SettingCard>
          </template>
          <SettingCard v-if="sync.type === 'webdav'">
            <CustomInput
              v-model.trim="sync.webdavUsername"
              :title="t('pages.settings.sync.webdav.username')"
              :placeholder="t('pages.settings.sync.webdav.username')"
            />
          </SettingCard>
          <SettingCard v-if="sync.type === 'webdav'">
            <CustomInput
              v-model.trim="sync.webdavPassword"
              :is-password="true"
              :title="t('pages.settings.sync.webdav.password')"
              :placeholder="t('pages.settings.sync.webdav.password')"
            />
          </SettingCard>
          <SettingCard v-if="sync.type === 'webdav'">
            <CustomInput
              v-model.trim="sync.webdavSavePath"
              :title="t('pages.settings.sync.webdav.savePath')"
              :placeholder="t('pages.settings.sync.webdav.savePath')"
            />
          </SettingCard>
          <SettingCard v-if="sync.type === 'webdav'">
            <SingleSelect
              v-model="sync.webdavAuthType"
              :fronticon="false"
              :tight="false"
              :select-list="[
                { label: 'Basic', value: 'basic' },
                { label: 'Digest', value: 'digest' },
              ]"
              :title="t('pages.settings.sync.webdav.authType')"
              :icon="Settings"
            />
          </SettingCard>
          <SettingCard v-if="sync.type === 'webdav'">
            <CustomSwitch
              v-model="sync.webdavSslEnabled"
              small
              no-border
              :title="t('pages.settings.sync.webdav.enableSSL')"
              :description="t('pages.settings.sync.webdav.enableSSLDesc')"
            />
          </SettingCard>
          <SettingCard v-if="sync.type === 'github'">
            <CustomInput
              v-model.trim="sync.proxy"
              :title="t('pages.settings.sync.syncConfigProxy')"
              :placeholder="t('pages.settings.sync.syncConfigProxy')"
            />
          </SettingCard>
        </SettingSection>
      </div>
    </div>
    <template #footer>
      <CustomButton type="secondary" :text="t('common.cancel')" @click="cancelSyncSetting" />
      <CustomButton :text="t('common.confirm')" :loading="savingSync" @click="confirmSyncSetting" />
    </template>
  </CustomModal>

  <CustomModal
    v-model:visible="upDownConfigVisible"
    height="auto"
    width="700px"
    :title="t('pages.settings.sync.upDownloadSettings')"
  >
    <div class="flex flex-col gap-6 p-4">
      <SettingSection :icon="CloudUpload" :title="t('pages.settings.sync.uploadSettings')">
        <CustomButton
          v-for="item in syncTaskList.slice(0, 3)"
          :key="item.task"
          type="secondary"
          :icon="CloudUpload"
          :text="item.label"
          @click="syncTaskFn(item.task, item.number)"
        />
      </SettingSection>
      <SettingSection :icon="Download" :title="t('pages.settings.sync.downloadSettings')">
        <CustomButton
          v-for="item in syncTaskList.slice(3, 6)"
          :key="item.task"
          type="secondary"
          :icon="Download"
          :text="item.label"
          @click="syncTaskFn(item.task, item.number)"
        />
      </SettingSection>
      <SettingSection
        :icon="ImageIcon"
        :title="t('pages.settings.sync.galleryDB')"
        :description="t('pages.settings.sync.galleryPlan.entryDescription')"
        only-one-row
      >
        <GallerySync />
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
  FileText,
  FolderOpen,
  GitBranch,
  Image as ImageIcon,
  Import,
  RotateCcw,
  Settings,
  Store,
} from '@lucide/vue'
import { computed, ref } from 'vue'
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
import { useSettingsContext } from '@/composables/settings/useSettingsContext'
import useConfirm from '@/composables/useConfirm'
import useMessage from '@/composables/useMessage'
import { getConfig, saveConfig } from '@/services/configService'
import { configPaths } from '@/utils/configPaths'
import { IRPCActionType } from '#/constants/rpcActions'

import SettingsFileEditor from './SettingsFileEditor.vue'

defineProps<{ active: boolean }>()
const { t } = useI18n()
const { sync, isPortable } = useSettingsContext()
const { confirm } = useConfirm()
const message = useMessage()
const editor = useTemplateRef('editor')
function editFile(file: string) {
  void editor.value?.editFile(file)
}
const syncVisible = ref(false)

const upDownConfigVisible = ref(false)

const savingSync = ref(false)

const fileManagementActions = [
  { titleKey: 'pages.settings.sync.openConfigFile', icon: FileText, onClick: () => openFile('data.json') },
  { titleKey: 'pages.settings.sync.editConfigFile', icon: Edit, onClick: () => editFile('data.json') },
  { titleKey: 'pages.settings.sync.editCloudConfigFile', icon: Edit, onClick: () => editFile('manage.json') },
  { titleKey: 'pages.settings.sync.openConfigFileDir', icon: FolderOpen, onClick: () => openDirectory() },
]

const syncTaskList = computed(() => [
  { task: IRPCActionType.CONFIGURE_UPLOAD_COMMON_CONFIG, label: t('pages.settings.sync.commonConfig'), number: 1 },
  { task: IRPCActionType.CONFIGURE_UPLOAD_MANAGE_CONFIG, label: t('pages.settings.sync.manageConfig'), number: 1 },
  { task: IRPCActionType.CONFIGURE_UPLOAD_ALL_CONFIG, label: t('pages.settings.sync.allConfig'), number: 2 },
  { task: IRPCActionType.CONFIGURE_DOWNLOAD_COMMON_CONFIG, label: t('pages.settings.sync.commonConfig'), number: 1 },
  { task: IRPCActionType.CONFIGURE_DOWNLOAD_MANAGE_CONFIG, label: t('pages.settings.sync.manageConfig'), number: 1 },
  { task: IRPCActionType.CONFIGURE_DOWNLOAD_ALL_CONFIG, label: t('pages.settings.sync.allConfig'), number: 2 },
])

const syncType = ['github', 'gitee', 'gitea', 'webdav']

async function cancelSyncSetting() {
  syncVisible.value = false
  sync.value = (await getConfig(configPaths.settings.sync)) || {
    type: 'github',
    username: '',
    repo: '',
    branch: '',
    token: '',
    endpoint: '',
    proxy: '',
    interval: 60,
    // WebDAV-specific fields
    webdavEndpoint: '',
    webdavUsername: '',
    webdavPassword: '',
    webdavAuthType: 'basic',
    webdavSslEnabled: true,
    webdavSavePath: '',
  }
}

async function confirmSyncSetting() {
  if (savingSync.value) return
  savingSync.value = true
  const draft = JSON.stringify(sync.value)
  try {
    if (!(await saveConfig({ [configPaths.settings.sync]: sync.value }))) return
    if (JSON.stringify(sync.value) === draft) syncVisible.value = false
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

function syncMessage(failed: number) {
  if (failed) {
    message.error(t('pages.settings.sync.syncResult.failed'))
  } else {
    message.success(t('pages.settings.sync.syncResult.success'))
  }
}

async function syncTaskFn(task: string, number: number) {
  const failed = number - ((await window.electron.triggerRPC<number>(task)) || 0)
  syncMessage(failed)
}
</script>
