<template>
  <div v-show="active" class="no-scrollbar flex h-full w-full flex-1 flex-col gap-6 overflow-auto p-4">
    <SettingSection :icon="FileText" :title="t('pages.settings.advanced.logging')">
      <CustomNavCard
        v-for="file in logFiles"
        :key="file.name"
        :title="t(file.titleKey)"
        :description="file.name"
        :icon="FileText"
        @click="openFile(file.name)"
      />
      <CustomNavCard
        :title="t('pages.settings.advanced.setLog')"
        :description="t('pages.settings.advanced.setLogDesc')"
        :icon="Settings"
        @click="openLogSetting"
      />
    </SettingSection>

    <SettingSection :icon="Globe" :title="t('pages.settings.advanced.networkAndProxy')">
      <CustomNavCard
        :title="t('pages.settings.advanced.setProxyAndMirror')"
        :description="t('pages.settings.advanced.setProxyAndMirrorDesc')"
        :icon="Globe"
        @click="proxyVisible = true"
      />
    </SettingSection>

    <!-- Server Settings Section -->
    <SettingSection :icon="Server" :title="t('pages.settings.advanced.serverSettings')">
      <CustomNavCard
        :title="t('pages.settings.advanced.uploadServer')"
        :description="t('pages.settings.advanced.uploadServerDesc')"
        :icon="Globe"
        @click="serverVisible = true"
      />
      <SettingCard>
        <CustomInput
          v-model="settings.aesPassword"
          :is-password="true"
          :title="t('pages.settings.advanced.serverEncryptionKey')"
          :placeholder="t('pages.settings.advanced.serverEncryptionKey')"
        />
      </SettingCard>
    </SettingSection>
  </div>

  <CustomModal
    v-model:visible="proxyVisible"
    height="auto"
    width="600px"
    :title="t('pages.settings.advanced.setProxyAndMirror')"
  >
    <SettingSection>
      <SettingCard>
        <CustomInput
          v-model="uploadProxy"
          :title="t('pages.settings.advanced.uploadProxy')"
          placeholder="http://127.0.0.1:1080"
        />
      </SettingCard>
      <SettingCard>
        <CustomInput
          v-model="settings.proxy"
          :title="t('pages.settings.advanced.pluginInstallProxy')"
          placeholder="http://127.0.0.1:1080"
        />
      </SettingCard>
      <SettingCard>
        <CustomInput
          v-model="settings.registry"
          :title="t('pages.settings.advanced.pluginInstallMirror')"
          placeholder="https://registry.npmmirror.com"
        />
      </SettingCard>
    </SettingSection>
  </CustomModal>

  <CustomModal
    v-model:visible="logFileVisible"
    height="auto"
    width="800px"
    :title="t('pages.settings.advanced.setLog')"
  >
    <div class="flex h-full w-full flex-col p-4">
      <SettingSection>
        <CustomInput
          v-model="settings.logFileSizeLimit"
          :title="t('pages.settings.advanced.logFileSize')"
          placeholder="10"
          type="number"
          min="1"
          max="1024"
          step="1"
        />
        <SettingCard>
          <MultiSelect
            v-model:choosed="settings.logLevel"
            :icon="FileText"
            :tight="false"
            :title="t('pages.settings.advanced.logLevel')"
            :zero-placeholder="t('pages.settings.advanced.logLevel')"
            :all-list="logLevel"
        /></SettingCard>
      </SettingSection>
    </div>
  </CustomModal>

  <CustomModal
    v-model:visible="serverVisible"
    height="auto"
    width="600px"
    :title="t('pages.settings.advanced.uploadServer')"
  >
    <div class="flex w-full flex-col gap-4 p-4">
      <div
        class="mb-4 flex items-start gap-3 rounded-lg border border-border bg-success/10 px-4 py-3 text-sm leading-1.5 font-semibold text-secondary"
      >
        <span>{{ t('pages.settings.advanced.serverSettingsNotice') }}</span>
      </div>
      <SettingCard p1>
        <CustomSwitch v-model="serverDraft.enable" :title="t('pages.settings.advanced.enableServer')" no-border small />
      </SettingCard>
      <SettingSection v-if="serverDraft.enable">
        <SettingCard>
          <CustomInput
            v-model="serverDraft.host"
            type="text"
            :title="t('pages.settings.advanced.serverHost')"
            placeholder="127.0.0.1"
          />
        </SettingCard>
        <SettingCard>
          <CustomInput
            v-model="serverDraft.port"
            type="number"
            :min="1"
            :max="65535"
            :step="1"
            :title="t('pages.settings.advanced.serverPort')"
            placeholder="36677"
          />
        </SettingCard>
        <SettingCard>
          <CustomInput
            v-model="settings.serverKey"
            :is-password="true"
            :title="t('pages.settings.advanced.serverKey')"
            :placeholder="t('pages.settings.advanced.serverKeyPlaceholder')"
          />
        </SettingCard>
        <SettingCard>
          <CustomInput
            v-model="settings.serverMaxConcurrency"
            type="number"
            :min="0"
            :step="1"
            :title="t('pages.settings.advanced.serverMaxConcurrency')"
            :placeholder="t('pages.settings.advanced.serverMaxConcurrencyPlaceholder')"
          />
        </SettingCard>
        <SettingCard>
          <CustomInput
            v-model="settings.serverUploadInterval"
            type="number"
            :min="0"
            :step="100"
            :title="t('pages.settings.advanced.serverUploadInterval')"
            :placeholder="t('pages.settings.advanced.serverUploadIntervalPlaceholder')"
          />
        </SettingCard>
      </SettingSection>
    </div>
    <template #footer>
      <CustomButton type="secondary" :text="t('common.cancel')" @click="cancelServerSetting" />
      <CustomButton :text="t('common.confirm')" :loading="savingServer" @click="confirmServerSetting" />
    </template>
  </CustomModal>
</template>

<script setup lang="ts">
import { FileText, Globe, Server, Settings } from '@lucide/vue'
import { computed, ref } from 'vue'
import { useI18n } from 'vue-i18n'

import CustomButton from '@/components/common/CustomButton.vue'
import CustomInput from '@/components/common/CustomInput.vue'
import CustomModal from '@/components/common/CustomModal.vue'
import CustomNavCard from '@/components/common/CustomNavCard.vue'
import CustomSwitch from '@/components/common/CustomSwitch.vue'
import MultiSelect from '@/components/common/MultiSelect.vue'
import SettingCard from '@/components/common/SettingCard.vue'
import SettingSection from '@/components/common/SettingSection.vue'
import { createServerDraft } from '@/composables/settings/settingsState'
import { useSettingsContext } from '@/composables/settings/useSettingsContext'
import { getConfig, saveConfig } from '@/services/configService'
import { configPaths } from '@/utils/configPaths'
import { IRPCActionType } from '#/constants/rpcActions'

defineProps<{ active: boolean }>()
const { t } = useI18n()
const { settings, uploadProxy, serverDraft } = useSettingsContext()

const logFileVisible = ref(false)

const serverVisible = ref(false)

const proxyVisible = ref(false)

const savingServer = ref(false)

const logFiles = [
  { titleKey: 'pages.settings.advanced.logFile', name: 'piclist.log' },
  { titleKey: 'pages.settings.advanced.guiLogFile', name: 'piclist-gui-local.log' },
  { titleKey: 'pages.settings.advanced.manageLogFile', name: 'manage.log' },
]

const logLevel = computed(() => [
  { type: 'all', name: t('pages.settings.advanced.logLevelList.all') },
  { type: 'success', name: t('pages.settings.advanced.logLevelList.success') },
  { type: 'error', name: t('pages.settings.advanced.logLevelList.error') },
  { type: 'info', name: t('pages.settings.advanced.logLevelList.info') },
  { type: 'warn', name: t('pages.settings.advanced.logLevelList.warn') },
  { type: 'none', name: t('pages.settings.advanced.logLevelList.none') },
])

async function openFile(file: string) {
  window.electron.sendRPC(IRPCActionType.PICLIST_OPEN_FILE, file)
}

function openLogSetting() {
  logFileVisible.value = true
}

async function confirmServerSetting() {
  if (savingServer.value) return
  savingServer.value = true
  try {
    serverDraft.value.port = parseInt(String(serverDraft.value.port), 10)
    const draft = JSON.stringify(serverDraft.value)
    if (!(await saveConfig({ [configPaths.settings.server]: serverDraft.value }))) return
    if (JSON.stringify(serverDraft.value) === draft) serverVisible.value = false
    window.electron.sendRPC(IRPCActionType.ADVANCED_UPDATE_SERVER)
  } finally {
    savingServer.value = false
  }
}

async function cancelServerSetting() {
  serverVisible.value = false
  serverDraft.value = createServerDraft(await getConfig<IServerConfig>(configPaths.settings.server))
}
</script>
