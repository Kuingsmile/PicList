<template>
  <div v-show="active" class="no-scrollbar flex h-full w-full flex-1 flex-col gap-6 overflow-auto p-4">
    <SettingSection :icon="FileText" :title="t('pages.settings.advanced.logging')">
      <SettingCard>
        <MultiSelect
          v-model:choosed="settings.logLevel"
          :icon="ListFilter"
          :tight="false"
          :title="t('pages.settings.advanced.logLevel')"
          :zero-placeholder="t('pages.settings.advanced.chooseLogLevel')"
          :all-list="logLevel"
        />
      </SettingCard>
      <SettingCard>
        <CustomInput
          v-model="settings.logFileSizeLimit"
          :title="`${t('pages.settings.advanced.logFileSize')} (MB)`"
          placeholder="10"
          type="number"
          min="1"
          max="1024"
          step="1"
        />
      </SettingCard>
      <div class="col-span-full grid grid-cols-3 gap-4 max-md:grid-cols-1">
        <CustomNavCard
          v-for="file in logFiles"
          :key="file.name"
          :title="t(file.titleKey)"
          :description="file.name"
          :icon="FileText"
          @click="openFile(file.name)"
        />
      </div>
    </SettingSection>

    <SettingSection :icon="Globe" :title="t('pages.settings.advanced.networkAndProxy')">
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
      <SettingCard class="col-span-full">
        <CustomInput
          v-model="settings.registry"
          :title="t('pages.settings.advanced.pluginInstallMirror')"
          placeholder="https://registry.npmmirror.com"
        />
      </SettingCard>
    </SettingSection>

    <!-- Server Settings Section -->
    <SettingSection :icon="Server" :title="t('pages.settings.advanced.serverSettings')">
      <CustomNavCard :title="t('pages.localFileServer.title')" :icon="Globe" @click="fileServerVisible = true" />
      <CustomNavCard :title="t('pages.settings.advanced.uploadServer')" :icon="Server" @click="openServerSettings">
        <template #description>
          <span class="mt-1 flex min-w-0 items-center gap-1.5 text-xs font-medium text-secondary">
            <span
              class="h-2 w-2 shrink-0 rounded-full"
              :class="server.enable ? 'bg-success' : 'bg-gray-400'"
              aria-hidden="true"
            />
            <span class="truncate">{{
              server.enable
                ? t('pages.settings.advanced.serverListening', { address: `${server.host}:${server.port}` })
                : t('pages.settings.advanced.serverOff')
            }}</span>
          </span>
        </template>
      </CustomNavCard>
      <SettingCard>
        <CustomInput
          v-model="settings.aesPassword"
          :is-password="true"
          :title="t('pages.settings.advanced.serverEncryptionKey')"
          :tips="t('pages.settings.advanced.serverEncryptionKeyDesc')"
          :placeholder="t('pages.settings.advanced.serverEncryptionKey')"
        />
      </SettingCard>
    </SettingSection>
  </div>

  <LocalFileServerDialog v-if="fileServerVisible" v-model:visible="fileServerVisible" />
  <CustomModal
    v-model:visible="serverVisible"
    height="auto"
    width="600px"
    :title="t('pages.settings.advanced.uploadServer')"
    :close-disabled="savingServer"
  >
    <fieldset class="m-0 flex w-full min-w-0 flex-col gap-4 border-0 p-4" :disabled="savingServer">
      <div
        role="note"
        class="flex items-start gap-3 rounded-lg border border-accent/30 bg-accent/10 px-4 py-3 text-sm leading-relaxed text-secondary"
      >
        <Info :size="16" class="mt-0.5 shrink-0 text-accent" aria-hidden="true" />
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
            :aria-invalid="!validPort"
            :aria-describedby="validPort ? undefined : portErrorId"
            placeholder="36677"
          />
          <p v-if="!validPort" :id="portErrorId" class="mt-1 text-xs text-error">
            {{ t('pages.settings.advanced.invalidServerPort') }}
          </p>
        </SettingCard>
        <SettingCard class="col-span-full">
          <CustomInput
            v-model="serverDraft.serverKey"
            :is-password="true"
            :title="t('pages.settings.advanced.serverKey')"
            :placeholder="t('pages.settings.advanced.serverKeyPlaceholder')"
          />
        </SettingCard>
        <SettingCard>
          <CustomInput
            v-model.number="serverDraft.serverMaxConcurrency"
            type="number"
            :min="0"
            :step="1"
            :title="t('pages.settings.advanced.serverMaxConcurrency')"
            :placeholder="t('pages.settings.advanced.serverMaxConcurrencyPlaceholder')"
          />
        </SettingCard>
        <SettingCard>
          <CustomInput
            v-model.number="serverDraft.serverUploadInterval"
            type="number"
            :min="0"
            :step="100"
            :title="t('pages.settings.advanced.serverUploadInterval')"
            :placeholder="t('pages.settings.advanced.serverUploadIntervalPlaceholder')"
          />
        </SettingCard>
      </SettingSection>
    </fieldset>
    <template #footer>
      <CustomButton
        type="secondary"
        :text="t('common.cancel')"
        :disabled="savingServer"
        @click="serverVisible = false"
      />
      <CustomButton
        :text="t('common.confirm')"
        :loading="savingServer"
        :disabled="serverDraft.enable && !validPort"
        @click="confirmServerSetting"
      />
    </template>
  </CustomModal>
</template>

<script setup lang="ts">
import { FileText, Globe, Info, ListFilter, Server } from '@lucide/vue'
import { computed, ref, useId } from 'vue'
import { useI18n } from 'vue-i18n'

import CustomButton from '@/components/common/CustomButton.vue'
import CustomInput from '@/components/common/CustomInput.vue'
import CustomModal from '@/components/common/CustomModal.vue'
import CustomNavCard from '@/components/common/CustomNavCard.vue'
import CustomSwitch from '@/components/common/CustomSwitch.vue'
import MultiSelect from '@/components/common/MultiSelect.vue'
import SettingCard from '@/components/common/SettingCard.vue'
import SettingSection from '@/components/common/SettingSection.vue'
import LocalFileServerDialog from '@/components/settings/LocalFileServerDialog.vue'
import { useSettingsContext } from '@/composables/settings/useSettingsContext'
import { saveConfig } from '@/services/configService'
import { configPaths } from '@/utils/configPaths'
import { IRPCActionType } from '#/constants/rpcActions'

defineProps<{ active: boolean }>()
const { t } = useI18n()
const { settings, uploadProxy, server } = useSettingsContext()

const serverVisible = ref(false)
const fileServerVisible = ref(false)

function currentServerSettings() {
  return {
    ...server.value,
    serverKey: settings.value.serverKey,
    serverMaxConcurrency: settings.value.serverMaxConcurrency,
    serverUploadInterval: settings.value.serverUploadInterval,
  }
}
const serverDraft = ref(currentServerSettings())
const portErrorId = useId()
const validPort = computed(() => {
  const port = Number(serverDraft.value.port)
  return Number.isInteger(port) && port >= 1 && port <= 65535
})

function openServerSettings() {
  serverDraft.value = currentServerSettings()
  serverVisible.value = true
}

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

async function confirmServerSetting() {
  if (savingServer.value || (serverDraft.value.enable && !validPort.value)) return
  savingServer.value = true
  try {
    const { serverKey, serverMaxConcurrency, serverUploadInterval, ...connection } = serverDraft.value
    connection.port = validPort.value ? Number(connection.port) : server.value.port
    if (
      !(await saveConfig({
        [configPaths.settings.server]: connection,
        [configPaths.settings.serverKey]: serverKey,
        [configPaths.settings.serverMaxConcurrency]: Number(serverMaxConcurrency),
        [configPaths.settings.serverUploadInterval]: Number(serverUploadInterval),
      }))
    )
      return
    server.value = connection
    Object.assign(settings.value, {
      serverKey,
      serverMaxConcurrency: Number(serverMaxConcurrency),
      serverUploadInterval: Number(serverUploadInterval),
    })
    serverVisible.value = false
    window.electron.sendRPC(IRPCActionType.ADVANCED_UPDATE_SERVER)
  } finally {
    savingServer.value = false
  }
}
</script>
