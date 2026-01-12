<template>
  <div class="config-page">
    <div class="config-container">
      <!-- Hero Header Section -->
      <header class="page-header">
        <div class="header-content">
          <div class="header-icon">
            <Settings2 :size="28" :stroke-width="1.5" />
          </div>
          <div class="header-text">
            <h1 class="page-title">
              {{ `${picBedName || type} ${t('pages.uploaderConfig.title')}` }}
            </h1>
            <p class="page-subtitle">
              {{ t('pages.uploaderConfig.subtitle', { count: curConfigList.length }) }}
            </p>
          </div>
        </div>
        <div class="header-actions">
          <button class="btn btn-primary btn-glow" :disabled="defaultPicBedG === type" @click="setDefaultPicBed(type)">
            <Star :size="16" />
            <span>{{ t('pages.uploaderConfig.setAsDefault') }}</span>
          </button>
        </div>
      </header>

      <!-- Main Content Area -->
      <main class="main-content">
        <!-- Config Grid -->
        <TransitionGroup name="config-list" tag="div" class="config-grid">
          <!-- Config Items -->
          <article
            v-for="(item, index) in curConfigList"
            :key="item._id"
            class="config-card"
            :class="{ 'is-active': defaultConfigId === item._id }"
            :style="{ '--delay': `${index * 50}ms` }"
            @click="() => selectItem(item._id)"
          >
            <div v-if="defaultConfigId === item._id" class="active-indicator">
              <div class="indicator-dot" />
            </div>

            <!-- Card Header -->
            <div class="card-header">
              <div class="config-icon">
                <Cloud :size="20" />
              </div>
              <div class="card-actions">
                <button
                  class="action-btn"
                  :title="
                    isConfigFavorited(item._id)
                      ? t('pages.uploaderConfig.removeFromFavorites')
                      : t('pages.uploaderConfig.addToFavorites')
                  "
                  @click.stop="() => toggleConfigFavorite(item._id, item._configName)"
                >
                  <Heart :size="14" :fill="isConfigFavorited(item._id) ? '#f39c12' : 'none'" />
                </button>
                <button class="action-btn" :title="t('pages.uploaderConfig.edit')" @click.stop="openEditPage(item._id)">
                  <Pencil :size="14" />
                </button>
                <button
                  class="action-btn"
                  :title="t('pages.uploaderConfig.duplicate')"
                  @click.stop="() => duplicateConfig(item._id)"
                >
                  <Copy :size="14" />
                </button>
                <button
                  class="action-btn action-btn-danger"
                  :class="{ disabled: curConfigList.length <= 1 }"
                  :title="t('pages.uploaderConfig.delete')"
                  :disabled="curConfigList.length <= 1"
                  @click.stop="() => deleteConfig(item._id)"
                >
                  <Trash2 :size="14" />
                </button>
              </div>
            </div>

            <!-- Card Body -->
            <div class="card-body">
              <h3 class="config-name">{{ item._configName }}</h3>
              <div class="config-meta">
                <div style="display: flex; align-items: center; gap: 4px">
                  <Clock :size="12" />
                  <span>{{ formatTime(item._updatedAt) }}</span>
                </div>
                <div v-if="defaultConfigId === item._id" class="status-badge active">
                  <CheckCircle2 :size="14" />
                  <span>{{ t('pages.uploaderConfig.selected') }}</span>
                </div>
                <div v-else class="status-badge inactive">
                  <Circle :size="14" />
                  <span>{{ t('pages.uploaderConfig.clickToSelect') }}</span>
                </div>
              </div>
            </div>

            <div class="card-glow" />
          </article>

          <article
            key="add-new"
            class="config-card config-card-add"
            :style="{ '--delay': `${curConfigList.length * 50}ms` }"
            @click="addNewConfig"
          >
            <div class="add-content">
              <div class="add-icon">
                <Plus :size="24" />
              </div>
              <div class="add-text">
                <span class="add-title">{{ t('pages.uploaderConfig.addNew') }}</span>
              </div>
            </div>
            <div class="card-glow" />
          </article>
        </TransitionGroup>
      </main>
    </div>
  </div>
</template>

<script lang="ts" setup>
import { useStorage } from '@vueuse/core'
import dayjs from 'dayjs'
import { CheckCircle2, Circle, Clock, Cloud, Copy, Heart, Pencil, Plus, Settings2, Star, Trash2 } from 'lucide-vue-next'
import { computed, onBeforeMount, ref } from 'vue'
import { useI18n } from 'vue-i18n'
import { onBeforeRouteUpdate, useRoute, useRouter } from 'vue-router'

import useConfirm from '@/hooks/useConfirm'
import { usePicBed } from '@/hooks/useGlobal'
import useMessage from '@/hooks/useMessage'
import { PICBEDS_PAGE, UPLOADER_CONFIG_PAGE } from '@/router/config'
import $bus from '@/utils/bus'
import { configPaths } from '@/utils/configPaths'
import { SHOW_INPUT_BOX, SHOW_INPUT_BOX_RESPONSE } from '@/utils/constant'
import { saveConfig } from '@/utils/dataSender'
import { IRPCActionType } from '@/utils/enum'

const { t } = useI18n()
const message = useMessage()
const { confirm } = useConfirm()
const router = useRouter()
const route = useRoute()
const { defaultPicBedG, picBedG } = usePicBed()
const favoritePicbeds = useStorage<IFavoritePicbedItem[]>('favorite-picbeds', [])

const type = ref('')
const curConfigList = ref<IStringKeyMap[]>([])
const defaultConfigId = ref('')

const picBedName = computed(() => {
  if (!picBedG.value || picBedG.value.length === 0) {
    return ''
  }
  const target = picBedG.value.find(item => item.type === type.value)
  return target ? target.name : ''
})

function isConfigFavorited(configId: string): boolean {
  const ids = favoritePicbeds.value.map(item => item.id)
  return ids.includes(configId)
}

function toggleConfigFavorite(configId: string, configName: string) {
  if (isConfigFavorited(configId)) {
    const index = favoritePicbeds.value.findIndex(
      item => item.type === type.value && item.id === configId && item.configName === configName,
    )
    if (index === -1) return
    favoritePicbeds.value.splice(index, 1)
  } else {
    favoritePicbeds.value.push({ id: configId, configName, type: type.value })
  }
}

async function selectItem(id: string) {
  await window.electron.triggerRPC<void>(IRPCActionType.UPLOADER_SELECT, type.value, id)
  if (defaultPicBedG.value === type.value) {
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
  if (isConfigFavorited(id)) {
    const index = favoritePicbeds.value.findIndex(item => item.type === type.value && item.id === id)
    if (index !== -1) {
      favoritePicbeds.value.splice(index, 1)
    }
  }
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
