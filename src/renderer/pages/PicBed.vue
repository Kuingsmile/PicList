<template>
  <div class="relative flex h-full w-full items-center justify-center">
    <div class="relative z-1 flex h-full w-full flex-col items-center justify-start gap-4 rounded-xl border-none p-4">
      <header
        class="flex w-full items-center justify-between gap-4 overflow-visible rounded-2xl border border-border-secondary px-6 py-2 shadow-md max-md:items-stretch max-md:p-5"
      >
        <div class="flex flex-1 flex-wrap items-center gap-4 p-2">
          <Cloud :size="24" class="text-accent" />
          <h1 class="m-0 text-2xl font-semibold tracking-tight text-main">
            {{ picBedName }}
          </h1>
          <CustomButton
            type="secondary"
            :icon="ExternalLink"
            :text="t('pages.picBedConfigs.viewDoc')"
            @click="handleNameClick"
          />
        </div>
        <div class="flex flex-wrap gap-3 overflow-visible">
          <CustomButton
            type="secondary"
            :icon="Settings"
            :text="t('pages.imageProcess.editor.title')"
            @click="imageProcessDialogVisible = true"
          />
          <CustomButton :icon="Copy" :text="t('pages.picBedConfigs.copyAPI')" @click="handleCopyApi" />
        </div>
      </header>

      <!-- Main Content Card -->
      <div
        class="relative flex h-full w-full flex-1 items-center justify-center overflow-hidden rounded-2xl border border-border-secondary shadow-md"
      >
        <div class="no-scrollbar flex h-full w-full flex-1 overflow-auto rounded-sm">
          <div v-if="pageLoading" role="status" class="flex w-full items-center justify-center p-6 text-secondary">
            {{ t('pages.configForm.loading') }}
          </div>
          <div
            v-else-if="pageLoadFailed"
            role="status"
            class="flex w-full flex-col items-center justify-center gap-3 p-6 text-main"
          >
            <span>{{ t('pages.picBedConfigs.loadConfigFailed') }}</span>
            <CustomButton :text="t('pages.gallery.refresh')" @click="loadPage" />
          </div>
          <div v-else-if="config.length > 0" class="flex h-full w-full">
            <!-- Config Form -->
            <config-form :id="type" ref="$configForm" :config="config" type="uploader">
              <!-- Action Buttons -->
              <div class="mb-4 flex flex-wrap gap-3 rounded-xl border border-border bg-accent/10 p-4">
                <CustomButton
                  type="secondary"
                  :icon="RotateCcw"
                  :text="t('common.clear')"
                  :disabled="!$configForm || $configForm.isLoading || $configForm.loadFailed || saving"
                  @click="handleReset"
                />
                <CustomButton
                  :icon="Check"
                  :text="t('common.confirm')"
                  :loading="saving"
                  :disabled="!$configForm || $configForm.isLoading || $configForm.loadFailed"
                  @click="handleConfirm"
                />

                <div v-if="picBedConfigList.length > 0" class="relative">
                  <CustomButton
                    :icon="Import"
                    :text="t('common.import')"
                    :disabled="!$configForm || $configForm.isLoading || $configForm.loadFailed || saving"
                    class="bg-warning!"
                    @click="toggleDropdown"
                    @blur="handleDropdownBlur"
                  />

                  <Transition name="dropdown">
                    <div
                      v-show="dropdownVisible"
                      class="absolute right-0 bottom-[calc(100%+8px)] z-1000 min-w-[220px] overflow-auto rounded-xl border border-border bg-surface shadow-md"
                    >
                      <div class="bg-bg-tertiary px-4 py-3 text-xs font-semibold tracking-wider text-main uppercase">
                        <span>{{ t('pages.picBedConfigs.selectConfig') }}</span>
                      </div>
                      <div class="max-h-[250px] overflow-y-auto">
                        <button
                          v-for="item in picBedConfigList"
                          :key="item._id"
                          class="flex w-full cursor-pointer items-center gap-2.5 border-none bg-bg-tertiary px-4 py-3 text-center text-sm text-main hover:text-accent"
                          @click="handleConfigImport(item)"
                        >
                          <FileJson :size="14" class="text-accent" />
                          <span>{{ item._configName }}</span>
                        </button>
                      </div>
                    </div>
                  </Transition>
                </div>
              </div>
            </config-form>
          </div>

          <!-- Empty State -->
          <div
            v-else
            class="flex w-full items-center justify-center overflow-hidden rounded-2xl border border-border-secondary bg-surface shadow-md"
          >
            <div class="px-8 py-16 text-center">
              <div
                class="mb-6 inline-flex h-[96px] w-[96px] items-center justify-center rounded-2xl border-2 border-border bg-surface-elevated text-main"
              >
                <FolderOpen :size="48" />
              </div>
              <h3 class="mb-2 text-xl font-semibold text-main">{{ t('pages.picBedConfigs.noConfigOptions') }}</h3>
              <p class="m-0 text-[0.9rem] text-secondary">{{ t('pages.picBedConfigs.noConfigOptionsDesc') }}</p>
            </div>
          </div>
        </div>
      </div>
    </div>

    <ImageProcessDialog
      v-if="imageProcessDialogVisible"
      v-model:visible="imageProcessDialogVisible"
      :config-id="uuidValue"
      :current-picbed-name="currentPicbedType"
    />
  </div>
</template>

<script lang="ts" setup>
import { Check, Cloud, Copy, ExternalLink, FileJson, FolderOpen, Import, RotateCcw, Settings } from '@lucide/vue'
import dayjs from 'dayjs'
import { v4 as uuid } from 'uuid'
import { computed, onBeforeUnmount, ref, useTemplateRef, watch } from 'vue'
import { useI18n } from 'vue-i18n'
import { useRoute, useRouter } from 'vue-router'

import CustomButton from '@/components/common/CustomButton.vue'
import ImageProcessDialog from '@/components/ImageProcessDialog.vue'
import ConfigForm from '@/components/UnifiedConfigForm.vue'
import useMessage from '@/hooks/useMessage'
import { getRawData } from '@/utils/common'
import { configPaths } from '@/utils/configPaths'
import { getConfig } from '@/utils/dataSender'
import { II18nLanguage, IRPCActionType } from '@/utils/enum'
import { invokeRPC, showRpcError } from '@/utils/rpc'
import { picBedManualUrlList } from '@/utils/static'

const { t } = useI18n()
const message = useMessage()

const $route = useRoute()
const $router = useRouter()
const type = computed(() => $route.params.type as string)
const config = ref<IPicGoPluginConfig[]>([])
const picBedConfigList = ref<IUploaderConfigListItem[]>([])
const picBedName = ref('')
const dropdownVisible = ref(false)
const saving = ref(false)
const imageProcessDialogVisible = ref(false)
const $configForm = useTemplateRef('$configForm')
const uuidValue = ref('')
const currentPicbedType = type
const pageLoading = ref(false)
const pageLoadFailed = ref(false)
let pageVersion = 0
let blurTimer: ReturnType<typeof setTimeout> | undefined

function toggleDropdown() {
  dropdownVisible.value = !dropdownVisible.value
}

function handleDropdownBlur() {
  clearTimeout(blurTimer)
  blurTimer = setTimeout(() => {
    dropdownVisible.value = false
  }, 200)
}

const handleConfirm = async () => {
  if (saving.value) return
  const targetType = type.value
  const targetId = uuidValue.value
  const targetVersion = pageVersion
  saving.value = true
  try {
    const result = (await $configForm.value?.validate()) || false
    if (result !== false) {
      const rawResult = getRawData(result)
      if (pageVersion !== targetVersion || type.value !== targetType || uuidValue.value !== targetId) return
      await invokeRPC(IRPCActionType.UPLOADER_UPDATE_CONFIG, targetType, rawResult?._id || targetId, rawResult)
      if (pageVersion !== targetVersion || type.value !== targetType || uuidValue.value !== targetId) return
      message.success(t('pages.picBedConfigs.setSuccess'))
      const currentDraft = getRawData(await $configForm.value?.validate())
      if (pageVersion !== targetVersion || type.value !== targetType || uuidValue.value !== targetId) return
      if (JSON.stringify(currentDraft) === JSON.stringify(rawResult)) $router.back()
    } else {
      message.error(t('pages.picBedConfigs.setFailedInfo'))
    }
  } catch (error) {
    showRpcError(error)
  } finally {
    saving.value = false
  }
}

async function loadPage() {
  const version = ++pageVersion
  const provider = type.value
  const profile = $route.params.configId
  pageLoading.value = true
  pageLoadFailed.value = false
  dropdownVisible.value = false
  try {
    const [result, profiles] = await Promise.all([
      window.electron.triggerRPC<{ config: IPicGoPluginConfig[]; name: string }>(
        IRPCActionType.PICBED_GET_PICBED_CONFIG,
        provider,
      ),
      window.electron.triggerRPC<IUploaderConfigItem>(IRPCActionType.PICBED_GET_CONFIG_LIST, provider),
    ])
    if (version !== pageVersion) return
    if (!result || !Array.isArray(result.config)) throw new Error('Missing provider configuration')
    config.value = result.config
    picBedName.value = result.name
    picBedConfigList.value = (profiles?.configList || []).filter(item => item._id !== profile)
  } catch {
    if (version === pageVersion) pageLoadFailed.value = true
  } finally {
    if (version === pageVersion) pageLoading.value = false
  }
}

async function handleConfigImport(configItem: IUploaderConfigListItem) {
  if (!$configForm.value || $configForm.value.isLoading || $configForm.value.loadFailed || saving.value) return
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
  if (!$configForm.value || $configForm.value.isLoading || $configForm.value.loadFailed || saving.value) return
  try {
    config.value.forEach(item => {
      let defaultValue
      switch (item.type) {
        case 'input':
        case 'password':
          defaultValue = ''
          break
        case 'checkbox':
          defaultValue = []
          break
        case 'list':
          defaultValue = item.choices?.[0]?.value ?? item.choices?.[0] ?? null
          break
        case 'confirm':
          defaultValue = false
          break
        default:
          defaultValue = null
      }
      $configForm.value?.updateRuleForm(item.name, defaultValue)
    })
    message.success(t('pages.picBedConfigs.resetSuccess'))
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
    const urlSearchParams = new URLSearchParams({
      picbed: $route.params.type as string,
      configName: picBedConfig._configName,
    })
    if (serverKey) {
      urlSearchParams.append('key', serverKey as string)
    }
    const apiUrl = `http://${host === '0.0.0.0' ? '127.0.0.1' : host}:${port}/upload?${urlSearchParams.toString()}`

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

watch(
  [type, () => $route.params.configId],
  () => {
    uuidValue.value = ($route.params.configId as string) || uuid()
    imageProcessDialogVisible.value = false
    void loadPage()
  },
  { immediate: true },
)

onBeforeUnmount(() => {
  pageVersion++
  clearTimeout(blurTimer)
})
</script>

<script lang="ts">
export default {
  name: 'PicbedsPage',
}
</script>
