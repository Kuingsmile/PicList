<template>
  <div
    class="relative z-1 flex h-full w-full flex-col items-center justify-start gap-4 rounded-xl border-none px-4 py-6 shadow-sm"
  >
    <div
      class="flex w-full items-center justify-between gap-4 rounded-2xl border border-border-secondary px-6 py-2 shadow-md"
    >
      <div class="flex flex-wrap items-center gap-4 p-2 max-md:justify-center max-md:text-center">
        <Settings2 :size="24" class="text-accent" />
        <div class="flex flex-col gap-1 max-md:text-center">
          <h1 class="m-0 text-xl font-bold tracking-tight text-main">
            {{ `${picBedName || type} ${t('pages.uploaderConfig.title')}` }}
          </h1>
          <p class="m-0 text-sm text-secondary">
            {{ t('pages.uploaderConfig.subtitle', { count: curConfigList.length }) }}
          </p>
        </div>
      </div>
      <div class="flex items-center justify-center gap-3">
        <div class="relative">
          <CustomButton
            v-if="type === 'advancedplist'"
            type="secondary"
            :text="t('pages.scripts.editScript')"
            @click="openScriptsList"
          />
          <div
            v-if="scriptsListVisible"
            class="absolute top-full left-1/2 z-10 mt-2 w-max -translate-x-1/2 gap-2 rounded-md border-2 border-border bg-bg-tertiary px-3 py-1.5 text-sm font-medium text-main shadow-md transition-all duration-fast ease-apple"
          >
            <div class="no-scrollbar flex max-h-[200px] min-w-[150px] flex-col overflow-auto">
              <div
                v-for="script in scriptsList"
                :key="script"
                class="cursor-pointer rounded-md border-b border-border px-2 py-1 text-center whitespace-nowrap last:border-b-0 hover:bg-accent/20"
                @click="handleScriptClick(script)"
              >
                {{ script }}
              </div>
            </div>
          </div>
        </div>
        <CustomButton
          v-if="type === 'advancedplist'"
          type="primary"
          :text="t('pages.scripts.createScript')"
          @click="openNewScriptsNameDialog"
        />
        <div class="relative">
          <CustomButton
            v-if="type === 'advancedplist'"
            type="secondary"
            :text="t('pages.scripts.deleteScript')"
            @click="openDeleteScriptsList"
          />
          <div
            v-if="deleteScriptListVisible"
            class="absolute top-full left-1/2 z-10 mt-2 w-max -translate-x-1/2 gap-2 rounded-md border-2 border-border bg-bg-tertiary px-3 py-1.5 text-sm font-medium text-main shadow-md transition-all duration-fast ease-apple"
          >
            <div class="no-scrollbar flex max-h-[200px] min-w-[150px] flex-col overflow-auto">
              <div
                v-for="script in scriptsList"
                :key="script"
                class="cursor-pointer rounded-md border-b border-border px-2 py-1 text-center whitespace-nowrap last:border-b-0 hover:bg-accent/20"
                @click="deleteScript(script)"
              >
                {{ script }}
              </div>
            </div>
          </div>
        </div>
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
      class="flex w-full flex-1 items-center gap-4 overflow-hidden rounded-2xl border border-border-secondary px-4 py-6 shadow-md"
    >
      <div class="no-scrollbar h-full w-full overflow-auto rounded-sm">
        <div class="grid w-full grid-cols-[repeat(auto-fill,minmax(300px,1fr))] gap-5 border-none p-1 max-md:gap-4">
          <!-- Config Items -->

          <div
            v-for="(item, index) in curConfigList"
            :key="item._id"
            class="group/config-card relative flex min-h-[180px] cursor-pointer flex-col gap-6 overflow-hidden rounded-xl border border-border-secondary p-5 shadow-sm transition-all duration-fast ease-apple hover:border-2 hover:border-accent hover:shadow-md [.is-active]:border-2 [.is-active]:border-accent [.is-active]:shadow-md"
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

    <CustomModal v-if="editorVisible" v-model:visible="editorVisible" :title="t('common.edit')">
      <Editor v-model="editorContent" language="javascript" />
      <template #footer>
        <CustomButton type="secondary" :text="t('common.cancel')" @click="editorVisible = false" />
        <CustomButton type="primary" :text="t('common.save')" @click="saveEditorContent" />
      </template>
    </CustomModal>

    <CustomModal
      v-if="newScriptNameVisible"
      v-model:visible="newScriptNameVisible"
      :title="t('pages.scripts.addNew')"
      height="auto"
      width="400px"
    >
      <div class="flex items-center justify-center bg-bg-secondary p-6">
        <SettingCard class="w-full">
          <CustomInput
            v-model="newScriptName"
            :title="t('pages.scripts.pleaseEnterScriptName')"
            placeholder="test.js"
          />
        </SettingCard>
      </div>
      <template #footer>
        <CustomButton type="secondary" :text="t('common.cancel')" @click="newScriptNameVisible = false" />
        <CustomButton type="primary" :text="t('common.confirm')" @click="handleNewScriptNameConfirm" />
      </template>
    </CustomModal>
  </div>
</template>

<script lang="ts" setup>
import { CheckCircle2, Circle, Clock, Cloud, Copy, Heart, Pencil, Plus, Settings2, Star, Trash2 } from '@lucide/vue'
import { useStorage } from '@vueuse/core'
import dayjs from 'dayjs'
import { computed, onBeforeMount, ref } from 'vue'
import { useI18n } from 'vue-i18n'
import { onBeforeRouteUpdate, useRoute, useRouter } from 'vue-router'

import CustomButton from '@/components/common/CustomButton.vue'
import CustomInput from '@/components/common/CustomInput.vue'
import CustomModal from '@/components/common/CustomModal.vue'
import SettingCard from '@/components/common/SettingCard.vue'
import Editor from '@/components/Editor.vue'
import useConfirm from '@/hooks/useConfirm'
import { usePicBed } from '@/hooks/useGlobal'
import useMessage from '@/hooks/useMessage'
import { PICBEDS_PAGE, UPLOADER_CONFIG_PAGE } from '@/router/config'
import $bus from '@/utils/bus'
import { configPaths } from '@/utils/configPaths'
import { SHOW_INPUT_BOX, SHOW_INPUT_BOX_RESPONSE } from '@/utils/constant'
import { getConfig, saveConfig } from '@/utils/dataSender'
import { II18nLanguage, IRPCActionType } from '@/utils/enum'
import { defaultScriptTemplate, defaultScriptTemplateEn } from '@/utils/static'

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
const scriptsListVisible = ref(false)
const scriptsList = ref<string[]>([])
const editorVisible = ref(false)
const editorContent = ref('')
const editingScriptName = ref('')
const newScriptNameVisible = ref(false)
const newScriptName = ref('')
const deleteScriptListVisible = ref(false)

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

async function getScriptsList() {
  const scriptsFiles = await window.electron.triggerRPC<Record<string, any>>(IRPCActionType.LIST_SCRIPTS_FILES, [
    'uploader',
    'advancedplist',
  ])
  scriptsList.value = Object.keys(scriptsFiles || {}).filter(fileName => fileName.endsWith('.js'))
}

async function openScriptsList() {
  if (scriptsListVisible.value) {
    scriptsListVisible.value = false
    return
  }
  await getScriptsList()
  if (scriptsList.value.length === 0) {
    message.info(t('pages.scripts.noScriptsFound'))
    return
  }
  scriptsListVisible.value = true
}

function openNewScriptsNameDialog() {
  newScriptName.value = ''
  newScriptNameVisible.value = true
}

async function getTemplate() {
  const lang = (await getConfig(configPaths.settings.language)) || II18nLanguage.ZH_CN
  if (lang === II18nLanguage.ZH_CN || lang === II18nLanguage.ZH_TW) {
    return defaultScriptTemplate
  } else {
    return defaultScriptTemplateEn
  }
}

async function openEditScripts(scriptName: string, mode: 'edit' | 'new' = 'edit') {
  editingScriptName.value = scriptName
  if (mode === 'edit') {
    const filePath = ['uploader', 'advancedplist', editingScriptName.value]
    const content = (await window.electron.triggerRPC<string>(IRPCActionType.READ_SCRIPTS_FILE, filePath)) || ''
    editorContent.value = content
  } else {
    editorContent.value = await getTemplate()
  }
  editorVisible.value = true
}

async function saveEditorContent() {
  const file = ['uploader', 'advancedplist', editingScriptName.value]
  const content = editorContent.value.trim()
  try {
    window.electron.sendRPC(IRPCActionType.WRITE_SCRIPT_FILE, file, content)
    message.success(t('pages.settings.advanced.saveFileSuccess'))
    await getScriptsList()
  } catch (error) {
    console.error('Failed to save file:', error)
    message.error(t('pages.settings.advanced.saveFileFailed'))
  }
  editorVisible.value = false
}

function handleNewScriptNameConfirm() {
  let trimmedName = newScriptName.value.trim()
  trimmedName = trimmedName.endsWith('.js') ? trimmedName : `${trimmedName}.js`
  if (!trimmedName) {
    message.error(t('pages.scripts.pleaseEnterScriptName'))
    return
  }
  if (scriptsList.value.includes(trimmedName)) {
    message.error(t('pages.scripts.duplicateScriptNameError'))
    return
  }
  newScriptNameVisible.value = false
  openEditScripts(trimmedName, 'new')
}

function handleScriptClick(scriptName: string) {
  scriptsListVisible.value = false
  openEditScripts(scriptName)
}

function openDeleteScriptsList() {
  if (deleteScriptListVisible.value) {
    deleteScriptListVisible.value = false
    return
  }
  getScriptsList().then(() => {
    if (scriptsList.value.length === 0) {
      message.info(t('pages.scripts.noScriptsFound'))
      return
    }
    deleteScriptListVisible.value = true
  })
}

async function deleteScript(scriptName: string) {
  const result = await confirm({
    title: t('pages.scripts.deleteScriptTitle'),
    message: t('pages.scripts.deleteScriptConfirm', { name: scriptName }),
    type: 'warning',
    confirmButtonText: t('common.confirm'),
    cancelButtonText: t('common.cancel'),
    center: true,
  })
  if (!result) return
  try {
    const filePath = ['uploader', 'advancedplist', scriptName]
    window.electron.sendRPC(IRPCActionType.DELETE_SCRIPTS_FILE, filePath)
    message.success(t('pages.scripts.deleteSuccess'))
    await getScriptsList()
  } catch (error) {
    console.error('Failed to delete script file:', error)
    message.error(t('pages.scripts.deleteFailed'))
  }
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
  getScriptsList()
})
</script>

<script lang="ts">
export default {
  name: 'UploaderConfigPage',
}
</script>

<style scoped src="./css/UploaderConfigPage.css"></style>
