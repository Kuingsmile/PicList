<template>
  <div id="picbeds-page">
    <div class="page-container">
      <div class="page-content">
        <!-- Header Section -->
        <div class="page-header">
          <div class="header-title-section">
            <h1 class="page-title" @click="handleNameClick">{{ picBedName }} {{ t('pages.picBedConfigs.title') }}</h1>
            <button class="link-button" :title="t('pages.picBedConfigs.viewDoc')" @click="handleNameClick">
              <ExternalLink :size="20" />
            </button>
          </div>
          <button class="action-button primary" @click="handleCopyApi">
            <Copy :size="20" />
            {{ t('pages.picBedConfigs.copyAPI') }}
          </button>
        </div>

        <!-- Config Form Section -->
        <div v-if="config.length > 0" class="form-section">
          <config-form :id="type" ref="$configForm" :config="config" type="uploader" color-mode="white">
            <!-- Action Buttons -->
            <div class="action-buttons">
              <button class="action-button secondary" type="button" @click="handleReset">
                <RotateCcw :size="18" />
                {{ t('common.reset') }}
              </button>

              <button class="action-button success" type="button" @click="handleConfirm">
                <Check :size="18" />
                {{ t('common.confirm') }}
              </button>

              <div v-if="picBedConfigList.length > 0" class="dropdown-wrapper">
                <button
                  class="action-button warning dropdown-trigger"
                  type="button"
                  @click="toggleDropdown"
                  @blur="handleDropdownBlur"
                >
                  <Import :size="18" />
                  {{ t('common.import') }}
                  <svg
                    class="dropdown-arrow"
                    :class="{ 'dropdown-arrow-up': true }"
                    width="12"
                    height="8"
                    viewBox="0 0 12 8"
                    fill="none"
                  >
                    <path
                      d="M1 1.5L6 6.5L11 1.5"
                      stroke="currentColor"
                      stroke-width="1.5"
                      stroke-linecap="round"
                      stroke-linejoin="round"
                    />
                  </svg>
                </button>

                <transition name="dropdown">
                  <div v-show="dropdownVisible" class="dropdown-menu" :class="{ 'dropdown-up': true }">
                    <button
                      v-for="item in picBedConfigList"
                      :key="item._id"
                      class="dropdown-item"
                      @click="handleConfigImport(item)"
                    >
                      {{ item._configName }}
                    </button>
                  </div>
                </transition>
              </div>
            </div>
          </config-form>
        </div>

        <!-- Empty State -->
        <div v-else class="empty-state">
          <div class="empty-content">
            <FolderOpen class="empty-icon" :size="48" />
            <h3>{{ t('pages.picBedConfigs.noConfigOptions') }}</h3>
          </div>
        </div>
      </div>
    </div>

    <!-- Loading Overlay -->
    <div v-if="loading" class="loading-overlay">
      <div class="loading-spinner" />
      <span class="loading-text">Loading...</span>
    </div>
  </div>
</template>

<script lang="ts" setup>
import dayjs from 'dayjs'
import { Check, Copy, ExternalLink, FolderOpen, Import, RotateCcw } from 'lucide-vue-next'
import { onBeforeMount, ref } from 'vue'
import { useI18n } from 'vue-i18n'
import { useRoute, useRouter } from 'vue-router'

import ConfigForm from '@/components/UnifiedConfigForm.vue'
import useMessage from '@/hooks/useMessage'
import { getRawData } from '@/utils/common'
import { configPaths } from '@/utils/configPaths'
import { getConfig } from '@/utils/dataSender'
import { II18nLanguage, IRPCActionType } from '@/utils/enum'
import { picBedManualUrlList } from '@/utils/static'
import type { IPicGoPluginConfig, IStringKeyMap, IUploaderConfigItem, IUploaderConfigListItem } from '#/types/types'

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
const $configForm = ref<InstanceType<typeof ConfigForm> | null>(null)

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

<style scoped>
#picbeds-page {
  position: relative;
  min-height: 100vh;
  font-family: -apple-system, BlinkMacSystemFont, 'Segoe UI', Roboto, sans-serif;
  background: var(--color-background-tertiar);
}

.page-container {
  margin: 0 auto;
  padding: 2rem;
  max-width: 1000px;
}

.page-content {
  overflow: auto;
  border: 1px solid rgb(255 255 255 / 20%);
  border-radius: 16px;
  background: var(--color-background-secondary);
  box-shadow:
    0 8px 8px rgb(0 0 0 / 12%),
    0 4px 8px rgb(0 0 0 / 8%);
}

/* Header Section */
.page-header {
  display: flex;
  justify-content: space-between;
  align-items: center;
  border-bottom: 1px solid rgb(229 231 235 / 80%);
  padding: 2rem 2rem 1.5rem;
  background: var(--color-background-secondary);
}

.header-title-section {
  display: flex;
  align-items: center;
  gap: 1rem;
}

.page-title {
  margin: 0;
  font-size: 1.5rem;
  font-weight: 600;
  color: #1f2937;
  background: linear-gradient(135deg, #1f2937 0%, #4b5563 100%);
  background-clip: text;
  transition: all 0.2s cubic-bezier(0.4, 0, 0.2, 1);
  cursor: pointer;
  -webkit-text-fill-color: transparent;
}

.page-title:hover {
  transform: translateY(-1px);
  filter: brightness(1.1);
}

.link-button {
  display: flex;
  justify-content: center;
  align-items: center;
  border: none;
  border-radius: 8px;
  width: 2rem;
  height: 2rem;
  color: #3b82f6;
  background: rgb(59 130 246 / 10%);
  transition: all 0.2s cubic-bezier(0.4, 0, 0.2, 1);
  cursor: pointer;
}

.link-button:hover {
  background: rgb(59 130 246 / 20%);
  transform: translateY(-1px);
}

/* Action Buttons */
.action-button {
  position: relative;
  display: flex;
  align-items: center;
  overflow: hidden;
  border: none;
  border-radius: 12px;
  padding: 0.75rem 1.5rem;
  font-size: 0.875rem;
  font-family: inherit;
  font-weight: 500;
  transition: all 0.2s cubic-bezier(0.4, 0, 0.2, 1);
  gap: 0.5rem;
  cursor: pointer;
}

.action-button::before {
  content: '';
  position: absolute;
  top: 0;
  left: -100%;
  width: 100%;
  height: 100%;
  background: linear-gradient(90deg, transparent, rgb(255 255 255 / 20%), transparent);
  transition: left 0.6s;
}

.action-button:hover::before {
  left: 100%;
}

.action-button.primary {
  color: white;
  background: var(--color-blue-common);
  box-shadow: 0 2px 2px rgb(0 122 255 / 30%);
}

.action-button.primary:hover {
  transform: translateY(-2px);
  box-shadow: 0 2px 4px rgb(0 122 255 / 40%);
}

.action-button.secondary {
  border: 1px solid #e2e8f0;
  color: #475569;
  background: var(--color-surface-elevated);
}

.action-button.secondary:hover {
  background: linear-gradient(135deg, #f1f5f9 0%, #e2e8f0 100%);
  transform: translateY(-1px);
  box-shadow: 0 4px 6px rgb(0 0 0 / 10%);
}

.action-button.success {
  color: white;
  background: var(--color-success);
  box-shadow: 0 4px 4px rgb(16 185 129 / 30%);
}

.action-button.success:hover {
  transform: translateY(-2px);
  box-shadow: 0 8px 6px rgb(16 185 129 / 40%);
}

.action-button.warning {
  position: relative;
  color: white;
  background: var(--color-warning);
}

.action-button.warning:hover {
  transform: translateY(-1px);
  box-shadow: 0 4px 6px rgb(245 158 11 / 30%);
}

.dropdown-arrow {
  margin-left: 0.5rem;
  transition: transform 0.2s ease;
}

.dropdown-arrow-up {
  transform: rotate(180deg);
}

.dropdown-trigger:hover .dropdown-arrow:not(.dropdown-arrow-up) {
  transform: rotate(180deg);
}

.dropdown-trigger:hover .dropdown-arrow.dropdown-arrow-up {
  transform: rotate(0deg);
}

/* Form Section */
.form-section {
  padding: 2rem;
}

.action-buttons {
  display: flex;
  gap: 1rem;
  margin-top: 2rem;
  flex-wrap: wrap;
}

/* Dropdown */
.dropdown-wrapper {
  position: relative;
}

.dropdown-menu {
  position: absolute;
  top: 100%;
  right: 0;
  left: 0;
  z-index: 1000;
  overflow: hidden;
  overflow-y: auto;
  margin-top: 0.5rem;
  border: 1px solid #e5e7eb;
  border-radius: 12px;
  max-height: 300px;
  background: white;
  box-shadow: 0 8px 32px rgb(0 0 0 / 12%);
}

.dropdown-menu.dropdown-up {
  top: auto;
  bottom: 100%;
  margin-top: 0;
  margin-bottom: 0.5rem;
}

.dropdown-item {
  display: block;
  border: none;
  padding: 0.75rem 1rem;
  width: 100%;
  font-size: 0.875rem;
  text-align: left;
  color: #374151;
  background: transparent;
  transition: all 0.2s ease;
  cursor: pointer;
}

.dropdown-item:hover {
  color: #007aff;
  background: #f3f4f6;
}

.dropdown-item:last-child {
  border-bottom: none;
}

/* Empty State */
.empty-state {
  padding: 4rem 2rem;
  text-align: center;
}

.empty-content {
  margin: 0 auto;
  max-width: 400px;
}

.empty-icon {
  margin-bottom: 1.5rem;
  color: #9ca3af;
}

.empty-content h3 {
  margin: 0 0 0.5rem;
  font-size: 1.25rem;
  font-weight: 600;
  color: #374151;
}

.empty-content p {
  margin: 0;
  color: #6b7280;
  line-height: 1.6;
}

/* Loading Overlay */
.loading-overlay {
  position: fixed;
  inset: 0;
  z-index: 2000;
  display: flex;
  justify-content: center;
  align-items: center;
  background: rgb(0 0 0 / 50%);
  flex-direction: column;
  gap: 1rem;
}

.loading-spinner {
  border: 3px solid rgb(255 255 255 / 30%);
  border-top: 3px solid white;
  border-radius: 50%;
  width: 2.5rem;
  height: 2.5rem;
  animation: spin 1s linear infinite;
}

.loading-text {
  font-size: 0.875rem;
  font-weight: 500;
  color: white;
}

/* Transitions */
.dropdown-enter-active,
.dropdown-leave-active {
  transition: all 0.2s cubic-bezier(0.4, 0, 0.2, 1);
}

.dropdown-enter-from,
.dropdown-leave-to {
  opacity: 0;
  transform: translateY(-0.5rem);
}

.dropdown-up.dropdown-enter-from,
.dropdown-up.dropdown-leave-to {
  opacity: 0;
  transform: translateY(0.5rem);
}

/* Animations */
@keyframes spin {
  0% {
    transform: rotate(0deg);
  }

  100% {
    transform: rotate(360deg);
  }
}

/* Dark mode adjustments */
:root.dark #picbeds-page,
:root.auto.dark #picbeds-page {
  background: var(--color-background-tertiar);
}

:root.dark .page-content,
:root.auto.dark .page-content {
  border-color: rgb(75 85 99 / 30%);
  background: var(--color-background-secondary);
}

:root.dark .page-header,
:root.auto.dark .page-header {
  border-color: rgb(75 85 99 / 30%);
  background: var(--color-background-secondary);
}

:root.dark .page-title,
:root.auto.dark .page-title {
  background: linear-gradient(135deg, #f9fafb 0%, #d1d5db 100%);
  -webkit-text-fill-color: transparent;
  background-clip: text;
}

:root.dark .dropdown-menu,
:root.auto.dark .dropdown-menu {
  border-color: #4b5563;
  background: #374151;
}

:root.dark .dropdown-menu.dropdown-up,
:root.auto.dark .dropdown-menu.dropdown-up {
  border-color: #4b5563;
  background: #374151;
}

:root.dark .dropdown-item,
:root.auto.dark .dropdown-item {
  color: #f9fafb;
}

:root.dark .dropdown-item:hover,
:root.auto.dark .dropdown-item:hover {
  color: #60a5fa;
  background: #4b5563;
}

/* Responsive Design */
@media (width <= 768px) {
  .page-container {
    padding: 1rem;
  }

  .page-header {
    flex-direction: column;
    align-items: flex-start;
    gap: 1rem;
    padding: 1.5rem;
  }

  .header-title-section {
    width: 100%;
  }

  .action-buttons {
    flex-direction: column;
    gap: 0.75rem;
  }

  .action-button {
    justify-content: center;
    width: 100%;
  }

  .toast {
    top: 1rem;
    right: 1rem;
    left: 1rem;
    min-width: auto;
  }
}

@media (width <= 480px) {
  .page-container {
    padding: 0.5rem;
  }

  .form-section {
    padding: 1.5rem;
  }

  .page-header {
    padding: 1rem;
  }
}

/* Focus styles for accessibility */
.action-button:focus-visible,
.link-button:focus-visible,
.dropdown-item:focus-visible {
  outline: 2px solid #007aff;
  outline-offset: 2px;
}
</style>
