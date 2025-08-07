<template>
  <div id="picbeds-page">
    <div class="page-container">
      <div class="page-content">
        <!-- Header Section -->
        <div class="page-header">
          <div class="header-title-section">
            <h1
              class="page-title"
              @click="handleNameClick"
            >
              {{ picBedName }} {{ t('pages.picBedConfigs.title') }}
            </h1>
            <button
              class="link-button"
              :title="t('pages.picBedConfigs.viewDoc')"
              @click="handleNameClick"
            >
              <ExternalLink :size="20" />
            </button>
          </div>
          <button
            class="action-button primary"
            @click="handleCopyApi"
          >
            <Copy :size="20" />
            {{ t('pages.picBedConfigs.copyAPI') }}
          </button>
        </div>

        <!-- Config Form Section -->
        <div
          v-if="config.length > 0"
          class="form-section"
        >
          <config-form
            :id="type"
            ref="$configForm"
            :config="config"
            type="uploader"
            color-mode="white"
          >
            <!-- Action Buttons -->
            <div class="action-buttons">
              <button
                class="action-button secondary"
                type="button"
                @click="handleReset"
              >
                <RotateCcw :size="18" />
                {{ t('common.reset') }}
              </button>

              <button
                class="action-button success"
                type="button"
                @click="handleConfirm"
              >
                <Check :size="18" />
                {{ t('common.confirm') }}
              </button>

              <div
                v-if="picBedConfigList.length > 0"
                class="dropdown-wrapper"
              >
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
                  <div
                    v-show="dropdownVisible"
                    class="dropdown-menu"
                    :class="{ 'dropdown-up': true }"
                  >
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
        <div
          v-else
          class="empty-state"
        >
          <div class="empty-content">
            <FolderOpen
              class="empty-icon"
              :size="48"
            />
            <h3>{{ t('pages.picBedConfigs.noConfigOptions') }}</h3>
          </div>
        </div>
      </div>
    </div>

    <!-- Loading Overlay -->
    <div
      v-if="loading"
      class="loading-overlay"
    >
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

function toggleDropdown (_: Event) {
  dropdownVisible.value = !dropdownVisible.value
}

function handleDropdownBlur () {
  setTimeout(() => {
    dropdownVisible.value = false
  }, 200)
}

const handleConfirm = async () => {
  loading.value = true
  try {
    const result = (await $configForm.value?.validate()) || false
    if (result !== false) {
      const rawResult = getRawData(result)
      await window.electron.triggerRPC<void>(IRPCActionType.UPLOADER_UPDATE_CONFIG, type.value, rawResult?._id, rawResult)
      message.success(t('pages.picBedConfigs.setSuccess'))
      $router.back()
    } else {
      message.error(t('pages.picBedConfigs.setFailedInfo'))
    }
  } catch (error) {
    console.error('Failed to save configuration:', error)
    message.error(t('pages.picBedConfigs.setFailedInfo'))
  } finally {
    loading.value = false
  }
}

async function getPicBeds () {
  try {
    const result = await window.electron.triggerRPC<any>(IRPCActionType.PICBED_GET_PICBED_CONFIG, $route.params.type)
    config.value = result.config
    picBedName.value = result.name
  } catch (error) {
    console.error('Failed to get picbed config:', error)
    message.error(t('pages.picBedConfigs.loadConfigFailed'))
  }
}

async function getPicBedConfigList () {
  try {
    const res = (await window.electron.triggerRPC<IUploaderConfigItem>(IRPCActionType.PICBED_GET_CONFIG_LIST, type.value)) || undefined
    const configList = res?.configList || []
    picBedConfigList.value = configList.filter(item => item._id !== $route.params.configId)
  } catch (error) {
    console.error('Failed to get config list:', error)
    message.error(t('pages.picBedConfigs.loadPicBedListFailed'))
  }
}

async function handleConfigImport (configItem: IUploaderConfigListItem) {
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
  loading.value = true
  try {
    await window.electron.triggerRPC<void>(IRPCActionType.UPLOADER_RESET_CONFIG, type.value, $route.params.configId)
    message.success(t('pages.picBedConfigs.resetSuccess'))
    setTimeout(() => {
      $router.back()
    }, 1000)
  } catch (error) {
    console.error('Failed to reset configuration:', error)
    message.error(t('pages.picBedConfigs.resetFailed'))
  } finally {
    loading.value = false
  }
}

async function handleNameClick () {
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

async function handleCopyApi () {
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
  name: 'PicbedsPage'
}
</script>

<style scoped>
#picbeds-page {
  min-height: 100vh;
  background: var(--color-background-tertiar);
  font-family: -apple-system, BlinkMacSystemFont, 'Segoe UI', Roboto, sans-serif;
  position: relative;
}

.page-container {
  max-width: 1000px;
  margin: 0 auto;
  padding: 2rem;
}

.page-content {
  background: rgba(255, 255, 255, 0.95);
  border-radius: 16px;
  backdrop-filter: blur(20px);
  box-shadow:
    0 8px 16px rgba(0, 0, 0, 0.12),
    0 2px 12px rgba(0, 0, 0, 0.08);
  overflow: auto;
  border: 1px solid rgba(255, 255, 255, 0.2);
}

/* Header Section */
.page-header {
  display: flex;
  align-items: center;
  justify-content: space-between;
  padding: 2rem 2rem 1.5rem;
  border-bottom: 1px solid rgba(229, 231, 235, 0.8);
  background: linear-gradient(135deg, rgba(255, 255, 255, 0.8) 0%, rgba(248, 250, 252, 0.8) 100%);
}

.header-title-section {
  display: flex;
  align-items: center;
  gap: 1rem;
}

.page-title {
  font-size: 1.5rem;
  font-weight: 600;
  color: #1f2937;
  margin: 0;
  cursor: pointer;
  transition: all 0.2s cubic-bezier(0.4, 0, 0.2, 1);
  background: linear-gradient(135deg, #1f2937 0%, #4b5563 100%);
  -webkit-background-clip: text;
  -webkit-text-fill-color: transparent;
  background-clip: text;
}

.page-title:hover {
  transform: translateY(-1px);
  filter: brightness(1.1);
}

.link-button {
  display: flex;
  align-items: center;
  justify-content: center;
  width: 2rem;
  height: 2rem;
  border: none;
  border-radius: 8px;
  background: rgba(59, 130, 246, 0.1);
  color: #3b82f6;
  cursor: pointer;
  transition: all 0.2s cubic-bezier(0.4, 0, 0.2, 1);
}

.link-button:hover {
  background: rgba(59, 130, 246, 0.2);
  transform: translateY(-1px);
}

/* Action Buttons */
.action-button {
  display: flex;
  align-items: center;
  gap: 0.5rem;
  padding: 0.75rem 1.5rem;
  border: none;
  border-radius: 12px;
  font-size: 0.875rem;
  font-weight: 500;
  cursor: pointer;
  transition: all 0.2s cubic-bezier(0.4, 0, 0.2, 1);
  font-family: inherit;
  position: relative;
  overflow: hidden;
}

.action-button::before {
  content: '';
  position: absolute;
  top: 0;
  left: -100%;
  width: 100%;
  height: 100%;
  background: linear-gradient(90deg, transparent, rgba(255, 255, 255, 0.2), transparent);
  transition: left 0.6s;
}

.action-button:hover::before {
  left: 100%;
}

.action-button.primary {
  background: var(--color-blue-common);
  color: white;
  box-shadow: 0 2px 2px rgba(0, 122, 255, 0.3);
}

.action-button.primary:hover {
  transform: translateY(-2px);
  box-shadow: 0 2px 4px rgba(0, 122, 255, 0.4);
}

.action-button.secondary {
  background: var(--color-surface-elevated);
  color: #475569;
  border: 1px solid #e2e8f0;
}

.action-button.secondary:hover {
  background: linear-gradient(135deg, #f1f5f9 0%, #e2e8f0 100%);
  transform: translateY(-1px);
  box-shadow: 0 4px 6px rgba(0, 0, 0, 0.1);
}

.action-button.success {
  background: var(--color-success);
  color: white;
  box-shadow: 0 4px 4px rgba(16, 185, 129, 0.3);
}

.action-button.success:hover {
  transform: translateY(-2px);
  box-shadow: 0 8px 6px rgba(16, 185, 129, 0.4);
}

.action-button.warning {
  background: var(--color-warning);
  color: white;
  position: relative;
}

.action-button.warning:hover {
  transform: translateY(-1px);
  box-shadow: 0 4px 6px rgba(245, 158, 11, 0.3);
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
  left: 0;
  right: 0;
  margin-top: 0.5rem;
  background: white;
  border: 1px solid #e5e7eb;
  border-radius: 12px;
  box-shadow: 0 8px 32px rgba(0, 0, 0, 0.12);
  overflow: hidden;
  z-index: 1000;
  max-height: 300px;
  overflow-y: auto;
}

.dropdown-menu.dropdown-up {
  top: auto;
  bottom: 100%;
  margin-top: 0;
  margin-bottom: 0.5rem;
}

.dropdown-item {
  display: block;
  width: 100%;
  padding: 0.75rem 1rem;
  border: none;
  background: transparent;
  color: #374151;
  font-size: 0.875rem;
  cursor: pointer;
  transition: all 0.2s ease;
  text-align: left;
}

.dropdown-item:hover {
  background: #f3f4f6;
  color: #007aff;
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
  max-width: 400px;
  margin: 0 auto;
}

.empty-icon {
  color: #9ca3af;
  margin-bottom: 1.5rem;
}

.empty-content h3 {
  font-size: 1.25rem;
  font-weight: 600;
  color: #374151;
  margin: 0 0 0.5rem;
}

.empty-content p {
  color: #6b7280;
  margin: 0;
  line-height: 1.6;
}

/* Loading Overlay */
.loading-overlay {
  position: fixed;
  top: 0;
  left: 0;
  right: 0;
  bottom: 0;
  background: rgba(0, 0, 0, 0.5);
  backdrop-filter: blur(4px);
  display: flex;
  flex-direction: column;
  align-items: center;
  justify-content: center;
  gap: 1rem;
  z-index: 2000;
}

.loading-spinner {
  width: 2.5rem;
  height: 2.5rem;
  border: 3px solid rgba(255, 255, 255, 0.3);
  border-top: 3px solid white;
  border-radius: 50%;
  animation: spin 1s linear infinite;
}

.loading-text {
  color: white;
  font-size: 0.875rem;
  font-weight: 500;
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
  0% { transform: rotate(0deg); }
  100% { transform: rotate(360deg); }
}

/* Dark mode adjustments */
:root.dark #picbeds-page,
:root.auto.dark #picbeds-page {
  background: var(--color-background-tertiar);
}

:root.dark .page-content,
:root.auto.dark .page-content {
  background: var(--color-surface-elevated);
  border-color: rgba(75, 85, 99, 0.3);
}

:root.dark .page-header,
:root.auto.dark .page-header {
  background: var(--color-surface-elevated);
  border-color: rgba(75, 85, 99, 0.3);
}

:root.dark .page-title,
:root.auto.dark .page-title {
  background: linear-gradient(135deg, #f9fafb 0%, #d1d5db 100%);
  -webkit-background-clip: text;
  -webkit-text-fill-color: transparent;
  background-clip: text;
}

:root.dark .dropdown-menu,
:root.auto.dark .dropdown-menu {
  background: #374151;
  border-color: #4b5563;
}

:root.dark .dropdown-menu.dropdown-up,
:root.auto.dark .dropdown-menu.dropdown-up {
  background: #374151;
  border-color: #4b5563;
}

:root.dark .dropdown-item,
:root.auto.dark .dropdown-item {
  color: #f9fafb;
}

:root.dark .dropdown-item:hover,
:root.auto.dark .dropdown-item:hover {
  background: #4b5563;
  color: #60a5fa;
}

/* Responsive Design */
@media (max-width: 768px) {
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
    width: 100%;
    justify-content: center;
  }

  .toast {
    right: 1rem;
    left: 1rem;
    top: 1rem;
    min-width: auto;
  }
}

@media (max-width: 480px) {
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
