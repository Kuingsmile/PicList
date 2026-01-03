<template>
  <div class="picbeds-page">
    <!-- Ambient Background -->
    <div class="ambient-bg" />

    <div class="page-container">
      <header class="page-header">
        <div class="header-content">
          <div class="header-icon">
            <Cloud :size="38" :stroke-width="1.5" />
          </div>
          <div class="header-text">
            <div class="title-row">
              <h1 class="page-title">
                {{ picBedName }}
              </h1>
              <button class="doc-link-btn" :title="t('pages.picBedConfigs.viewDoc')" @click="handleNameClick">
                <ExternalLink :size="16" />
                <span>{{ t('pages.picBedConfigs.viewDoc') }}</span>
              </button>
            </div>
          </div>
        </div>
        <div class="header-actions">
          <button class="btn btn-secondary btn-glow" @click="handleCopyApi">
            <Copy :size="16" />
            <span>{{ t('pages.picBedConfigs.copyAPI') }}</span>
          </button>
        </div>
      </header>

      <!-- Main Content Card -->
      <main class="main-content">
        <div v-if="config.length > 0" class="config-card">
          <!-- Card Header -->
          <div class="card-header">
            <div class="card-header-icon">
              <Settings :size="18" />
            </div>
            <h2 class="card-title">{{ t('pages.picBedConfigs.configSettings') }}</h2>
          </div>

          <!-- Config Form -->
          <div class="card-body">
            <config-form :id="type" ref="$configForm" :config="config" type="uploader" color-mode="white">
              <!-- Action Buttons -->
              <div class="action-buttons">
                <button class="btn btn-outline" type="button" @click="handleReset">
                  <RotateCcw :size="16" />
                  <span>{{ t('common.reset') }}</span>
                </button>

                <button class="btn btn-success btn-glow" type="button" @click="handleConfirm">
                  <Check :size="16" />
                  <span>{{ t('common.confirm') }}</span>
                </button>

                <div v-if="picBedConfigList.length > 0" class="dropdown-wrapper">
                  <button
                    class="btn btn-warning btn-glow dropdown-trigger"
                    type="button"
                    @click="toggleDropdown"
                    @blur="handleDropdownBlur"
                  >
                    <Import :size="16" />
                    <span>{{ t('common.import') }}</span>
                    <ChevronDown :size="14" class="dropdown-chevron" :class="{ rotated: dropdownVisible }" />
                  </button>

                  <Transition name="dropdown">
                    <div v-show="dropdownVisible" class="dropdown-menu">
                      <div class="dropdown-header">
                        <span>{{ t('pages.picBedConfigs.selectConfig') }}</span>
                      </div>
                      <div class="dropdown-items">
                        <button
                          v-for="item in picBedConfigList"
                          :key="item._id"
                          class="dropdown-item"
                          @click="handleConfigImport(item)"
                        >
                          <FileJson :size="14" />
                          <span>{{ item._configName }}</span>
                        </button>
                      </div>
                    </div>
                  </Transition>
                </div>
              </div>
            </config-form>
          </div>
        </div>

        <!-- Empty State -->
        <div v-else class="empty-state-card">
          <div class="empty-state">
            <div class="empty-icon-wrapper">
              <FolderOpen :size="48" />
            </div>
            <h3 class="empty-title">{{ t('pages.picBedConfigs.noConfigOptions') }}</h3>
            <p class="empty-description">{{ t('pages.picBedConfigs.noConfigOptionsDesc') }}</p>
          </div>
        </div>
      </main>
    </div>

    <!-- Loading Overlay -->
    <Transition name="fade">
      <div v-if="loading" class="loading-overlay">
        <div class="loading-content">
          <div class="loading-spinner">
            <div class="spinner-ring" />
            <Cloud :size="24" class="spinner-icon" />
          </div>
          <span class="loading-text">{{ 'loading' }}</span>
        </div>
      </div>
    </Transition>
  </div>
</template>

<script lang="ts" setup>
import dayjs from 'dayjs'
import {
  Check,
  ChevronDown,
  Cloud,
  Copy,
  ExternalLink,
  FileJson,
  FolderOpen,
  Import,
  RotateCcw,
  Settings,
} from 'lucide-vue-next'
import { onBeforeMount, ref, useTemplateRef } from 'vue'
import { useI18n } from 'vue-i18n'
import { useRoute, useRouter } from 'vue-router'

import ConfigForm from '@/components/UnifiedConfigForm.vue'
import useMessage from '@/hooks/useMessage'
import { getRawData } from '@/utils/common'
import { configPaths } from '@/utils/configPaths'
import { getConfig } from '@/utils/dataSender'
import { II18nLanguage, IRPCActionType } from '@/utils/enum'
import { picBedManualUrlList } from '@/utils/static'

const { t } = useI18n()
const message = useMessage()

const type = ref('')
const config = ref<IPicGoPluginConfig[]>([])
const picBedConfigList = ref<IUploaderConfigListItem[]>([])
const picBedName = ref('')
const loading = ref(false)
const dropdownVisible = ref(false)
const $route = useRoute()
const $router = useRouter()
const $configForm = useTemplateRef('$configForm')

type.value = $route.params.type as string

onBeforeMount(async () => {
  loading.value = true
  try {
    await getPicBeds()
    await getPicBedConfigList()
  } finally {
    loading.value = false
  }
})

function toggleDropdown(_: Event) {
  dropdownVisible.value = !dropdownVisible.value
}

function handleDropdownBlur() {
  setTimeout(() => {
    dropdownVisible.value = false
  }, 200)
}

const handleConfirm = async () => {
  try {
    const result = (await $configForm.value?.validate()) || false
    if (result !== false) {
      const rawResult = getRawData(result)
      await window.electron.triggerRPC<void>(
        IRPCActionType.UPLOADER_UPDATE_CONFIG,
        type.value,
        rawResult?._id,
        rawResult,
      )
      message.success(t('pages.picBedConfigs.setSuccess'))
      $router.back()
    } else {
      message.error(t('pages.picBedConfigs.setFailedInfo'))
    }
  } catch (error) {
    console.error('Failed to save configuration:', error)
    message.error(t('pages.picBedConfigs.setFailedInfo'))
  }
}

async function getPicBeds() {
  try {
    const result = await window.electron.triggerRPC<any>(IRPCActionType.PICBED_GET_PICBED_CONFIG, $route.params.type)
    config.value = result.config
    picBedName.value = result.name
  } catch (error) {
    console.error('Failed to get picbed config:', error)
    message.error(t('pages.picBedConfigs.loadConfigFailed'))
  }
}

async function getPicBedConfigList() {
  try {
    const res =
      (await window.electron.triggerRPC<IUploaderConfigItem>(IRPCActionType.PICBED_GET_CONFIG_LIST, type.value)) ||
      undefined
    const configList = res?.configList || []
    picBedConfigList.value = configList.filter(item => item._id !== $route.params.configId)
  } catch (error) {
    console.error('Failed to get config list:', error)
    message.error(t('pages.picBedConfigs.loadPicBedListFailed'))
  }
}

async function handleConfigImport(configItem: IUploaderConfigListItem) {
  try {
    const { _id, _configName, _updatedAt, _createdAt, ...rest } = configItem
    for (const key in rest) {
      if (Object.prototype.hasOwnProperty.call(rest, key)) {
        const value = rest[key]
        $configForm.value?.updateRuleForm(key, value)
      }
    }
    $configForm.value?.updateRuleForm('_configName', dayjs().format('YYYYMMDDHHmmss'))
    dropdownVisible.value = false
    message.success(t('pages.picBedConfigs.importConfigSuccess'))
  } catch (error) {
    console.error('Failed to import configuration:', error)
    message.error(t('pages.picBedConfigs.importConfigFailed'))
  }
}

const handleReset = async () => {
  try {
    await window.electron.triggerRPC<void>(IRPCActionType.UPLOADER_RESET_CONFIG, type.value, $route.params.configId)
    message.success(t('pages.picBedConfigs.resetSuccess'))
    $router.back()
  } catch (error) {
    console.error('Failed to reset configuration:', error)
    message.error(t('pages.picBedConfigs.resetFailed'))
  }
}

async function handleNameClick() {
  try {
    const lang = (await getConfig(configPaths.settings.language)) || II18nLanguage.ZH_CN
    const url = picBedManualUrlList[lang === II18nLanguage.EN ? 'en' : 'zh_cn'][$route.params.type as string]
    if (url) {
      window.electron.sendRPC(IRPCActionType.OPEN_URL, url)
    }
  } catch (error) {
    console.error('Failed to open documentation:', error)
    message.error(t('pages.picBedConfigs.viewDocFailed'))
  }
}

async function handleCopyApi() {
  try {
    const { port = 36677, host = '127.0.0.1' } = (await getConfig<IStringKeyMap>(configPaths.settings.server)) || {}
    const serverKey = (await getConfig(configPaths.settings.serverKey)) || ''
    const uploader = ((await getConfig(configPaths.uploader)) as IStringKeyMap) || {}
    const picBedConfigList = uploader[$route.params.type as string].configList || []
    const picBedConfig = picBedConfigList.find((item: IUploaderConfigListItem) => item._id === $route.params.configId)

    if (!picBedConfig) {
      message.error(t('pages.picBedConfigs.noConfigs'))
      return
    }

    const apiUrl = `http://${host === '0.0.0.0' ? '127.0.0.1' : host}:${port}/upload?picbed=${$route.params.type}&configName=${picBedConfig._configName}${serverKey ? `&key=${serverKey}` : ''}`

    try {
      window.electron.clipboard.writeText(apiUrl)
      message.success(`${t('pages.picBedConfigs.copyAPISucceed')} ${apiUrl}`)
    } catch (clipboardError) {
      console.error('Failed to copy to clipboard:', clipboardError)
      message.error(t('pages.picBedConfigs.copyAPIFailed'))
    }
  } catch (error) {
    console.error('Failed to generate API URL:', error)
    message.error(t('pages.picBedConfigs.copyAPIFailed'))
  }
}
</script>

<script lang="ts">
export default {
  name: 'PicbedsPage',
}
</script>

<style scoped src="./Picbeds.css"></style>
