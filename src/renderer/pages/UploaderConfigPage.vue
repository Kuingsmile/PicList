<template>
  <div class="config-container">
    <!-- Header Card -->
    <div class="config-card header-card">
      <div class="card-header">
        <h1 class="page-title">
          {{ t('pages.uploaderConfig.title') }}
        </h1>
      </div>
    </div>

    <!-- Config Items Card -->
    <div class="config-card main-card">
      <div class="config-grid">
        <div
          v-for="item in curConfigList"
          :key="item._id"
          :class="`config-item ${defaultConfigId === item._id ? 'selected' : ''}`"
          @click="() => selectItem(item._id)"
        >
          <div class="config-content">
            <div class="config-name">
              {{ item._configName }}
            </div>
            <div class="config-update-time">
              {{ formatTime(item._updatedAt) }}
            </div>
            <div v-if="defaultConfigId === item._id" class="default-badge">
              {{ t('pages.uploaderConfig.selected') }}
            </div>
          </div>
          <div class="config-actions">
            <button
              class="action-btn edit-btn"
              :title="t('pages.uploaderConfig.edit')"
              @click.stop="openEditPage(item._id)"
            >
              <Edit :size="16" />
            </button>
            <button
              class="action-btn duplicate-btn"
              :title="t('pages.uploaderConfig.duplicate')"
              @click.stop="() => duplicateConfig(item._id)"
            >
              <Copy :size="16" />
            </button>
            <button
              class="action-btn delete-btn"
              :class="curConfigList.length <= 1 ? 'disabled' : ''"
              :title="t('pages.uploaderConfig.delete')"
              :disabled="curConfigList.length <= 1"
              @click.stop="() => deleteConfig(item._id)"
            >
              <Trash2 :size="16" />
            </button>
          </div>
        </div>

        <!-- Add New Config Button -->
        <div class="config-item config-item-add" @click="addNewConfig">
          <div class="add-content">
            <Plus :size="32" />
            <span class="add-text">{{ t('pages.uploaderConfig.addNew') }}</span>
          </div>
        </div>
      </div>
    </div>

    <!-- Actions Card -->
    <div class="config-card actions-card">
      <div class="card-actions">
        <button class="primary-button" :disabled="store?.state.defaultPicBed === type" @click="setDefaultPicBed(type)">
          <DatabaseIcon :size="16" />
          <span>{{ t('pages.uploaderConfig.setAsDefault') }}</span>
        </button>
      </div>
    </div>
  </div>
</template>

<script lang="ts" setup>
import dayjs from 'dayjs'
import { Copy, DatabaseIcon, Edit, Plus, Trash2 } from 'lucide-vue-next'
import { onBeforeMount, ref } from 'vue'
import { useI18n } from 'vue-i18n'
import { onBeforeRouteUpdate, useRoute, useRouter } from 'vue-router'

import useConfirm from '@/hooks/useConfirm'
import useMessage from '@/hooks/useMessage'
import { useStore } from '@/hooks/useStore'
import { PICBEDS_PAGE, UPLOADER_CONFIG_PAGE } from '@/router/config'
import $bus from '@/utils/bus'
import { configPaths } from '@/utils/configPaths'
import { SHOW_INPUT_BOX, SHOW_INPUT_BOX_RESPONSE } from '@/utils/constant'
import { saveConfig } from '@/utils/dataSender'
import { IRPCActionType } from '@/utils/enum'
import type { IStringKeyMap, IUploaderConfigItem } from '#/types/types'

const { t } = useI18n()
const message = useMessage()
const { confirm } = useConfirm()
const router = useRouter()
const route = useRoute()

const type = ref('')
const curConfigList = ref<IStringKeyMap[]>([])
const defaultConfigId = ref('')
const store = useStore()

async function selectItem(id: string) {
  await window.electron.triggerRPC<void>(IRPCActionType.UPLOADER_SELECT, type.value, id)
  if (store?.state.defaultPicBed === type.value) {
    window.electron.sendRPC(
      IRPCActionType.TRAY_SET_TOOL_TIP,
      `${type.value} ${curConfigList.value.find(item => item._id === id)?._configName || ''}`,
    )
  }
  defaultConfigId.value = id
}

onBeforeRouteUpdate((to, _, next) => {
  if (to.params.type && to.name === UPLOADER_CONFIG_PAGE) {
    type.value = to.params.type as string
    getCurrentConfigList()
  }
  next()
})

onBeforeMount(() => {
  type.value = route.params.type as string
  getCurrentConfigList()
})

async function getCurrentConfigList() {
  const configList = await window.electron.triggerRPC<IUploaderConfigItem>(
    IRPCActionType.PICBED_GET_CONFIG_LIST,
    type.value,
  )
  curConfigList.value = configList?.configList ?? []
  defaultConfigId.value = configList?.defaultId ?? ''
}

function openEditPage(configId: string) {
  router.push({
    name: PICBEDS_PAGE,
    params: {
      type: type.value,
      configId,
    },
    query: {
      defaultConfigId: defaultConfigId.value,
    },
  })
}

function formatTime(time: number): string {
  return dayjs(time).format('YYYY-MM-DD HH:mm')
}

async function duplicateConfig(id: string) {
  const originalConfig = curConfigList.value.find(item => item._id === id)
  if (!originalConfig) return

  return new Promise<void>(resolve => {
    $bus.emit(SHOW_INPUT_BOX, {
      title: t('pages.uploaderConfig.duplicateTitle'),
      placeholder: t('pages.uploaderConfig.duplicatePlaceholder'),
      value: `${originalConfig._configName} - ${t('pages.uploaderConfig.copy')}`,
    })

    const handleResponse = async (newName: string) => {
      $bus.off(SHOW_INPUT_BOX_RESPONSE, handleResponse)

      if (!newName) {
        resolve()
        return
      }

      try {
        const res = await window.electron.triggerRPC<IUploaderConfigItem>(
          IRPCActionType.PICBED_DUPLICATE_CONFIG,
          type.value,
          id,
          newName,
        )
        if (!res) {
          resolve()
          return
        }
        curConfigList.value = res.configList
        defaultConfigId.value = res.defaultId
        message.success(t('pages.uploaderConfig.duplicateSuccess'))
      } catch (error) {
        message.error(t('pages.uploaderConfig.duplicateError'))
      }
      resolve()
    }

    $bus.on(SHOW_INPUT_BOX_RESPONSE, handleResponse)
  })
}

async function deleteConfig(id: string) {
  const result = await confirm({
    title: t('pages.uploaderConfig.deleteTitle'),
    message: t('pages.uploaderConfig.deleteConfirm'),
    type: 'warning',
    confirmButtonText: t('common.confirm'),
    cancelButtonText: t('common.cancel'),
    center: true,
  })
  if (!result) return
  const res = await window.electron.triggerRPC<IUploaderConfigItem>(IRPCActionType.PICBED_DELETE_CONFIG, type.value, id)
  if (!res) return
  curConfigList.value = res.configList
  defaultConfigId.value = res.defaultId
  message.success(t('pages.uploaderConfig.deleteSuccess'))
}

function addNewConfig() {
  router.push({
    name: PICBEDS_PAGE,
    params: {
      type: type.value,
      configId: '',
    },
  })
}

function setDefaultPicBed(type: string) {
  saveConfig({
    [configPaths.picBed.current]: type,
    [configPaths.picBed.uploader]: type,
  })

  store?.setDefaultPicBed(type)
  const currentConfigName = curConfigList.value.find(item => item._id === defaultConfigId.value)?._configName
  window.electron.sendRPC(IRPCActionType.TRAY_SET_TOOL_TIP, `${type} ${currentConfigName || ''}`)
  message.success(t('pages.uploaderConfig.setSuccess'))
}
</script>
<script lang="ts">
export default {
  name: 'UploaderConfigPage',
}
</script>

<style scoped src="./css/UploaderConfigPage.css"></style>
