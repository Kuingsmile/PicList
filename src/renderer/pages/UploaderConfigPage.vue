<template>
  <div
    class="relative z-1 no-scrollbar flex h-full w-full flex-col items-center justify-start gap-4 overflow-auto rounded-xl border-none px-4 py-6 shadow-sm"
  >
    <div
      class="flex w-full items-center justify-between gap-4 rounded-2xl border border-border-secondary px-6 py-2 shadow-md"
    >
      <div class="flex flex-wrap items-center gap-4 max-md:justify-center max-md:text-center">
        <div
          class="border-xl flex h-[56px] w-[56px] items-center justify-center rounded-2xl border-none text-accent shadow-sm max-md:h-[35px] max-md:w-[35px]"
        >
          <Settings2 :size="28" />
        </div>
        <div class="flex flex-col gap-1 max-md:text-center">
          <h1 class="m-0 text-2xl font-bold tracking-tight text-main">
            {{ `${picBedName || type} ${t('pages.uploaderConfig.title')}` }}
          </h1>
          <p class="m-0 text-sm text-secondary">
            {{ t('pages.uploaderConfig.subtitle', { count: curConfigList.length }) }}
          </p>
        </div>
      </div>
      <div class="flex items-center justify-center gap-3">
        <button
          class="relative inline-flex cursor-pointer items-center justify-center gap-2 overflow-hidden rounded-lg border-none bg-accent px-6 py-3 font-[inherit] text-sm font-semibold text-white shadow-sm transition-all duration-fast ease-apple disabled:cursor-not-allowed disabled:bg-surface disabled:text-secondary disabled:opacity-60"
          :disabled="defaultPicBedG === type"
          @click="setDefaultPicBed(type)"
        >
          <Star :size="16" />
          <span>{{ t('pages.uploaderConfig.setAsDefault') }}</span>
        </button>
      </div>
    </div>

    <!-- Config Grid -->
    <div
      class="no-scrollbar flex w-full flex-1 items-center gap-4 overflow-auto rounded-2xl border border-border-secondary px-4 py-6 shadow-md"
    >
      <div
        class="no-scrollbar grid h-full w-full grid-cols-[repeat(auto-fill,minmax(300px,1fr))] gap-5 overflow-auto border-none p-1 max-md:grid-cols-1 max-md:gap-4 xl:grid-cols-[repeat(auto-fill,minmax(325px,1fr))]"
      >
        <!-- Config Items -->
        <div
          v-for="(item, index) in curConfigList"
          :key="item._id"
          class="group/config-card relative flex min-h-[180px] cursor-pointer flex-col gap-6 overflow-hidden rounded-xl border border-border-secondary p-5 shadow-sm transition-all duration-fast ease-apple hover:border-accent hover:shadow-md [.is-active]:border-2 [.is-active]:border-accent [.is-active]:shadow-md"
          :class="{ 'is-active': defaultConfigId === item._id }"
          :style="{ '--delay': `${index * 50}ms` }"
          @click="() => selectItem(item._id)"
        >
          <!-- Card Header -->
          <div class="relative z-1 flex flex-1 items-start justify-between">
            <div
              class="peer flex h-[40px] w-[40px] items-center justify-center rounded-lg border border-border-secondary text-accent transition-all duration-fast ease-apple group-hover/config-card:scale-105 [.is-active]:border-none [.is-active]:bg-accent [.is-active]:text-white"
              :class="{ 'is-active': defaultConfigId === item._id }"
            >
              <Cloud :size="20" />
            </div>
            <div
              class="grid grid-cols-2 gap-1.5 opacity-0 transition-all duration-fast ease-apple group-hover/config-card:opacity-100 peer-[.is-active]:opacity-100"
            >
              <button
                class="action-btn"
                :title="
                  isConfigFavorited(item._id)
                    ? t('pages.uploaderConfig.removeFromFavorites')
                    : t('pages.uploaderConfig.addToFavorites')
                "
                @click.stop="() => toggleConfigFavorite(item._id, item._configName)"
              >
                <Heart :size="14" :fill="isConfigFavorited(item._id) ? 'var(--color-warning)' : 'none'" />
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
                class="action-btn danger"
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
          <div class="relative z-1 flex-1">
            <h3 class="mx-0 mt-0 mb-2 text-base leading-[1.4] font-semibold tracking-tight text-main">
              {{ item._configName }}
            </h3>
            <div class="flex items-center gap-1.5 text-xs text-tertiary">
              <div class="flex items-center gap-1">
                <Clock :size="12" />
                <span>{{ formatTime(item._updatedAt) }}</span>
              </div>
              <div
                v-if="defaultConfigId === item._id"
                class="inline-flex items-center gap-1.5 rounded-2xl bg-accent/40 px-3 py-1.5 text-xs font-medium text-white transition-all duration-fast ease-standard"
              >
                <CheckCircle2 :size="15" />
                <span>{{ t('pages.uploaderConfig.selected') }}</span>
              </div>
              <div
                v-else
                class="inline-flex items-center gap-1.5 rounded-2xl px-3 py-1.5 text-xs font-medium text-tertiary transition-all duration-fast ease-standard group-hover/config-card:bg-accent/10"
              >
                <Circle :size="14" />
                <span>{{ t('pages.uploaderConfig.clickToSelect') }}</span>
              </div>
            </div>
          </div>
        </div>

        <div
          key="add-new"
          class="group/new relative flex min-h-[180px] cursor-pointer flex-col items-center justify-center gap-6 overflow-hidden rounded-xl border-2 border-dashed border-border p-5 shadow-sm transition-all duration-fast ease-apple hover:border-solid hover:border-accent hover:bg-surface hover:shadow-md"
          @click="addNewConfig"
        >
          <div class="flex flex-col items-center gap-3 transition-all duration-fast ease-apple">
            <div
              class="flex h-[56px] w-[56px] items-center justify-center rounded-xl border-2 border-dashed border-border text-tertiary transition-all duration-fast ease-apple group-hover/new:scale-105 group-hover/new:border-solid group-hover/new:border-accent group-hover/new:bg-accent/5 group-hover/new:text-accent"
            >
              <Plus :size="24" />
            </div>
            <div class="flex flex-col items-center gap-1">
              <span class="text-base font-semibold text-secondary">{{ t('pages.uploaderConfig.addNew') }}</span>
            </div>
          </div>
        </div>
      </div>
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
const { defaultPicBedG, picBedG, updatePicBeds } = usePicBed()
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
  updatePicBeds()
  message.success(t('pages.uploaderConfig.setSuccess'))
}
</script>
<script lang="ts">
export default {
  name: 'UploaderConfigPage',
}
</script>

<style scoped src="./css/UploaderConfigPage.css"></style>
