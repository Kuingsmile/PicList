<template>
  <div class="relative flex h-full w-full items-center justify-center">
    <div
      class="relative z-1 flex h-full w-full min-w-0 flex-col items-center justify-start gap-4 rounded-xl border-none p-4"
    >
      <!-- Header -->
      <header
        class="flex w-full flex-wrap items-center justify-between gap-4 rounded-2xl border border-border-secondary px-6 py-2 shadow-md max-md:p-5"
      >
        <div class="flex min-w-0 flex-1 items-center gap-4 p-1">
          <FileCode :size="24" class="shrink-0 text-accent" aria-hidden="true" />
          <div class="min-w-0">
            <h1 class="m-0 text-2xl font-semibold tracking-tight text-main">{{ t('pages.scripts.title') }}</h1>
            <p class="m-0 text-sm text-secondary tabular-nums" aria-live="polite">
              {{ t('pages.scripts.scriptCount', scriptsList.length) }}
              <template v-if="disabledCount">· {{ t('pages.scripts.disabledCount', disabledCount) }}</template>
            </p>
          </div>
        </div>
        <div class="flex flex-wrap items-center gap-2">
          <CustomButton
            type="secondary"
            :icon="StoreIcon"
            :text="t('pages.scripts.marketplace.browseMarketplace')"
            @click="marketplaceVisible = true"
          />
          <CustomButton :icon="Plus" :text="t('pages.scripts.newScript')" @click="openNewScriptDialog()" />
        </div>
      </header>

      <!-- Toolbar -->
      <div
        class="flex w-full flex-wrap items-center gap-2 rounded-2xl border border-border-secondary px-4 py-3 shadow-md"
      >
        <div class="relative flex min-w-[200px] flex-2 items-center">
          <SearchIcon :size="16" class="pointer-events-none absolute left-3 text-secondary" aria-hidden="true" />
          <input
            v-model="searchText"
            type="search"
            class="h-[36px] w-full rounded-lg border border-border bg-bg-secondary pr-8 pl-9 text-sm text-main transition-all duration-fast ease-apple placeholder:text-secondary focus:border-accent focus:outline-none focus-visible:focus-ring [&::-webkit-search-cancel-button]:hidden"
            :placeholder="t('pages.scripts.searchPlaceholder')"
            :aria-label="t('pages.scripts.searchPlaceholder')"
          />
          <button
            v-if="searchText"
            type="button"
            class="absolute right-2 flex h-[22px] w-[22px] cursor-pointer items-center justify-center rounded-full text-secondary hover:bg-accent/10 hover:text-main focus-visible:focus-ring"
            :aria-label="t('common.clear')"
            @click="searchText = ''"
          >
            <XIcon :size="14" aria-hidden="true" />
          </button>
        </div>
        <div class="max-w-[220px] min-w-[170px] flex-1">
          <MultiSelect
            v-model:choosed="choosedCat"
            :zero-placeholder="t('pages.scripts.allStages')"
            :all-list="scriptCategories"
            trigger-class="h-[36px]"
          />
        </div>
        <CustomSwitch
          v-model="showAllStages"
          small
          no-border
          no-hover
          tighter
          class="h-[36px] px-2"
          :title="t('pages.scripts.showEmptyStages')"
        />
        <div class="ml-auto flex items-center gap-1">
          <CustomButton
            type="secondary"
            class="h-[36px] px-3! py-0!"
            :icon="KeyRoundIcon"
            :text="t('pages.scripts.editENVFile')"
            :aria-label="t('pages.scripts.editENVFileHint')"
            @click="openEditor(['.env'])"
          />
          <button
            v-tooltip="t('pages.scripts.openScriptFolder')"
            type="button"
            class="flex h-[36px] w-[36px] cursor-pointer items-center justify-center rounded-lg border border-border bg-bg-secondary text-secondary transition-all duration-fast ease-apple hover:border-accent hover:text-accent focus-visible:focus-ring"
            :aria-label="t('pages.scripts.openScriptFolder')"
            @click="openScriptFolder"
          >
            <FolderOpen :size="16" aria-hidden="true" />
          </button>
        </div>
      </div>

      <!-- Stages -->
      <section
        class="no-scrollbar flex min-h-0 w-full flex-1 flex-col gap-6 overflow-auto rounded-2xl border border-border-secondary p-4 shadow-md"
        :aria-busy="loadingList || undefined"
      >
        <div
          v-if="loadingList && scriptsList.length === 0"
          class="m-auto flex items-center gap-2 text-sm text-secondary"
        >
          <LoaderCircle :size="18" class="animate-spin text-accent motion-reduce:animate-none" aria-hidden="true" />
          {{ t('pages.scripts.loading') }}
        </div>

        <!-- Nothing yet -->
        <div
          v-else-if="scriptsList.length === 0 && !showAllStages"
          class="m-auto flex max-w-[440px] flex-col items-center gap-3 py-10 text-center"
        >
          <FileCode class="text-secondary" :size="40" aria-hidden="true" />
          <h2 class="m-0 text-base font-semibold text-main">{{ t('pages.scripts.NoScripts') }}</h2>
          <p class="m-0 text-sm text-secondary">{{ t('pages.scripts.emptyHint') }}</p>
          <div class="flex flex-wrap justify-center gap-2">
            <CustomButton :icon="Plus" :text="t('pages.scripts.newScript')" @click="openNewScriptDialog()" />
            <CustomButton
              type="secondary"
              :icon="StoreIcon"
              :text="t('pages.scripts.marketplace.browseMarketplace')"
              @click="marketplaceVisible = true"
            />
          </div>
          <button
            type="button"
            class="cursor-pointer text-sm font-medium text-accent hover:underline focus-visible:focus-ring"
            @click="showAllStages = true"
          >
            {{ t('pages.scripts.exploreStages') }}
          </button>
        </div>

        <!-- No match -->
        <div
          v-else-if="visibleGroups.length === 0"
          class="m-auto flex max-w-[420px] flex-col items-center gap-3 py-10 text-center"
        >
          <SearchXIcon class="text-secondary" :size="40" aria-hidden="true" />
          <h2 class="m-0 text-base font-semibold text-main">{{ t('pages.scripts.noScriptsFound') }}</h2>
          <CustomButton type="secondary" :icon="XIcon" :text="t('pages.scripts.clearFilters')" @click="clearFilters" />
        </div>

        <template v-else>
          <section
            v-for="group in visibleGroups"
            :key="group.id"
            class="flex flex-col gap-2"
            :aria-labelledby="`script-group-${group.id}`"
          >
            <h2
              :id="`script-group-${group.id}`"
              class="m-0 flex items-center gap-2 px-1 text-xs font-semibold tracking-wide text-secondary uppercase"
            >
              <component :is="groupIcons[group.id]" :size="14" class="text-accent" aria-hidden="true" />
              {{ t(`pages.scripts.groups.${group.id}`) }}
              <span v-if="group.id === 'upload'" class="font-normal tracking-normal normal-case">
                — {{ t('pages.scripts.groups.uploadOrder') }}
              </span>
            </h2>

            <div
              v-for="stage in group.stages"
              :key="stage.category.type"
              class="overflow-hidden rounded-lg border border-border bg-bg-secondary shadow-sm"
            >
              <div
                class="flex items-center gap-3 px-3 py-2.5"
                :class="{ 'border-b border-border-secondary': stage.scripts.length > 0 }"
              >
                <span
                  v-if="group.id === 'upload'"
                  class="flex h-[22px] w-[22px] shrink-0 items-center justify-center rounded-full bg-accent/15 text-[11px] font-semibold text-accent tabular-nums"
                  aria-hidden="true"
                >
                  {{ stage.step }}
                </span>
                <div class="min-w-0 flex-1">
                  <h3 class="m-0 flex items-center gap-2 text-sm font-semibold text-main">
                    {{ stage.category.name }}
                    <span
                      v-if="stage.scripts.length"
                      class="rounded-full bg-bg-tertiary px-1.5 text-[11px] font-semibold text-secondary tabular-nums"
                    >
                      {{ stage.scripts.length }}
                    </span>
                  </h3>
                  <p class="m-0 text-xs text-secondary">{{ stage.category.hint }}</p>
                </div>
                <button
                  v-tooltip="t('pages.scripts.addToStage', { stage: stage.category.name })"
                  type="button"
                  class="flex h-[28px] w-[28px] shrink-0 cursor-pointer items-center justify-center rounded-md border border-dashed border-border text-secondary transition-all duration-fast ease-apple hover:border-solid hover:border-accent hover:bg-accent/10 hover:text-accent focus-visible:focus-ring"
                  :aria-label="t('pages.scripts.addToStage', { stage: stage.category.name })"
                  @click="openNewScriptDialog(stage.category.type)"
                >
                  <Plus :size="15" aria-hidden="true" />
                </button>
              </div>
              <ul v-if="stage.scripts.length" class="m-0 list-none divide-y divide-border-secondary p-0">
                <ScriptRow
                  v-for="item in stage.scripts"
                  :key="item.filePath.join('/')"
                  :item="item"
                  :running="runningPath === item.filePath.join('/')"
                  @edit="openEditor(item.filePath)"
                  @delete="deleteScript(item.filePath)"
                  @share="openShareDialog"
                  @toggle="toggleScript"
                  @run="runScript(item.filePath)"
                />
              </ul>
            </div>
          </section>
        </template>
      </section>
    </div>

    <!-- Editor -->
    <CustomModal
      v-model:visible="editorVisible"
      :title="editorTitle"
      :description="editorDescription"
      :scrollable="false"
    >
      <div class="h-full p-3">
        <Editor v-model="editorContent" language="javascript" />
      </div>
      <template #footer>
        <CustomButton type="secondary" :text="t('common.cancel')" @click="editorVisible = false" />
        <CustomButton :icon="SaveIcon" :text="t('common.save')" :loading="savingEditor" @click="saveEditorContent" />
      </template>
    </CustomModal>

    <!-- New script -->
    <CustomModal
      v-model:visible="newScriptVisible"
      :title="t('pages.scripts.newScript')"
      :description="t('pages.scripts.newScriptDescription')"
      height="auto"
      width="560px"
    >
      <form class="flex flex-col gap-4 p-6" @submit.prevent="confirmNewScript">
        <div class="flex flex-col gap-1">
          <SingleSelect
            v-model="newScriptCategory"
            :title="t('pages.scripts.selectScriptType')"
            :select-list="scriptCategories.map(cat => ({ value: cat.type, label: cat.name }))"
            :fronticon="false"
          />
          <p class="m-0 flex items-start gap-1.5 text-xs text-secondary">
            <InfoIcon :size="13" class="mt-px shrink-0 text-accent" aria-hidden="true" />{{ newScriptHint }}
          </p>
        </div>
        <CustomInput
          v-model="newScriptName"
          required
          :title="t('pages.scripts.pleaseEnterScriptName')"
          placeholder="my-script.js"
          :tips="t('pages.scripts.scriptNameTips')"
        />
        <button type="submit" class="hidden" tabindex="-1" aria-hidden="true" />
      </form>
      <template #footer>
        <CustomButton type="secondary" :text="t('common.cancel')" @click="newScriptVisible = false" />
        <CustomButton :text="t('pages.scripts.createAndEdit')" @click="confirmNewScript" />
      </template>
    </CustomModal>

    <ScriptMarketplaceDialog
      v-model:visible="marketplaceVisible"
      :existing-paths="existingPathsSet"
      @downloaded="getScriptsMap"
    />
    <ScriptShareDialog v-model:visible="shareDialogVisible" :script="scriptToShare" />
    <GitHubLoginDialog />
  </div>
</template>

<script lang="ts" setup>
import {
  FileCode,
  FolderOpen,
  ImagesIcon,
  InfoIcon,
  KeyRoundIcon,
  LoaderCircle,
  MousePointerClickIcon,
  Plus,
  PowerIcon,
  SaveIcon,
  SearchIcon,
  SearchXIcon,
  StoreIcon,
  UploadCloudIcon,
  WorkflowIcon,
  XIcon,
} from '@lucide/vue'
import { useStorage } from '@vueuse/core'
import { type Component, computed, defineAsyncComponent, onBeforeMount, onBeforeUnmount, ref } from 'vue'
import { useI18n } from 'vue-i18n'

import CustomButton from '@/components/common/CustomButton.vue'
import CustomInput from '@/components/common/CustomInput.vue'
import CustomModal from '@/components/common/CustomModal.vue'
import CustomSwitch from '@/components/common/CustomSwitch.vue'
import MultiSelect from '@/components/common/MultiSelect.vue'
import SingleSelect from '@/components/common/SingleSelect.vue'
import GitHubLoginDialog from '@/components/scripts/GitHubLoginDialog.vue'
import ScriptMarketplaceDialog from '@/components/scripts/ScriptMarketplaceDialog.vue'
import ScriptRow from '@/components/scripts/ScriptRow.vue'
import ScriptShareDialog from '@/components/scripts/ScriptShareDialog.vue'
import { useGitHubAuth } from '@/composables/scripts/useGitHubAuth'
import {
  SCRIPT_GROUPS,
  type ScriptCategory,
  type ScriptGroup,
  useScriptCategories,
} from '@/composables/scripts/useScriptCategories'
import useConfirm from '@/composables/useConfirm'
import useMessage from '@/composables/useMessage'
import { getConfig, saveConfig } from '@/services/configService'
import { invokeRPC, showRpcError } from '@/services/rpcService'
import { configPaths } from '@/utils/configPaths'
import { normalizeScriptFileName } from '@/utils/scriptFileName'
import { defaultScriptTemplate, defaultScriptTemplateEn } from '@/utils/static'
import { II18nLanguage } from '#/constants/app'
import { IRPCActionType } from '#/constants/rpcActions'
import { getRawData } from '#/utils/rawData'

defineOptions({ name: 'ScriptPage' })

const Editor = defineAsyncComponent(() => import('@/components/Editor.vue'))

const { t } = useI18n()
const message = useMessage()
const { confirm } = useConfirm()
const { checkGitHubAuth, cancelGitHubLogin } = useGitHubAuth()
const { scriptCategories, categoryName } = useScriptCategories()

const groupIcons: Record<ScriptGroup, Component> = {
  lifecycle: PowerIcon,
  upload: WorkflowIcon,
  gallery: ImagesIcon,
  manual: MousePointerClickIcon,
  uploader: UploadCloudIcon,
}

const scriptsList = ref<IStringKeyMap[]>([])
const loadingList = ref(true)
const searchText = ref('')
const choosedCat = ref<string[]>([])
const showAllStages = useStorage('script-page-show-all-stages', false)
const runningPath = ref('')

const editorVisible = ref(false)
const savingEditor = ref(false)
const editorContent = ref('')
const editingPath = ref<string[]>([])
const editingIsNew = ref(false)

const newScriptVisible = ref(false)
const newScriptName = ref('')
const newScriptCategory = ref('manualTrigger')

const marketplaceVisible = ref(false)
const shareDialogVisible = ref(false)
const scriptToShare = ref<IStringKeyMap | null>(null)

const existingPathsSet = computed(() => new Set(scriptsList.value.map(item => item.filePath.join('/'))))
const disabledCount = computed(() => scriptsList.value.filter(item => !item.enabled && isToggleable(item)).length)

interface StageView {
  category: ScriptCategory
  step: number
  scripts: IStringKeyMap[]
}

const visibleGroups = computed(() => {
  const query = searchText.value.trim().toLowerCase()
  const groups: { id: ScriptGroup; stages: StageView[] }[] = []

  for (const id of SCRIPT_GROUPS) {
    const stages: StageView[] = []
    scriptCategories.value
      .filter(category => category.group === id)
      .forEach((category, index) => {
        if (choosedCat.value.length > 0 && !choosedCat.value.includes(category.type)) return
        const scripts = scriptsList.value
          .filter(item => item.category === category.type)
          .filter(item => !query || item.fileName.toLowerCase().includes(query))
          .sort((a, b) => a.fileName.localeCompare(b.fileName))
        // Empty stages only help while browsing; hide them once the user is searching.
        if (scripts.length > 0 || (showAllStages.value && !query)) {
          stages.push({ category, step: index + 1, scripts })
        }
      })
    if (stages.length > 0) groups.push({ id, stages })
  }
  return groups
})

const editorTitle = computed(() => {
  const name = editingPath.value[editingPath.value.length - 1] || ''
  return editingIsNew.value ? t('pages.scripts.newThing', { name }) : t('pages.scripts.editThing', { name })
})
const editorDescription = computed(() => {
  if (editingPath.value[0] === '.env') return t('pages.scripts.editENVFileHint')
  return categoryName(editingPath.value.slice(0, -1).join('.'))
})
const newScriptHint = computed(
  () => scriptCategories.value.find(category => category.type === newScriptCategory.value)?.hint || '',
)

function isToggleable(item: IStringKeyMap) {
  return scriptCategories.value.find(category => category.type === item.category)?.toggleable ?? true
}

function clearFilters() {
  searchText.value = ''
  choosedCat.value = []
}

async function getScriptsMap() {
  try {
    const map = (await window.electron.triggerRPC<Record<string, any>>(IRPCActionType.LIST_SCRIPTS_FILES, [])) || {}
    scriptsList.value = await loadScriptStats(map)
  } catch (error) {
    showRpcError(error)
  } finally {
    loadingList.value = false
  }
}

async function loadScriptStats(map: Record<string, any>) {
  const paths: string[][] = []
  for (const { type } of scriptCategories.value) {
    const parts = type.split('.')
    const files = parts.reduce<Record<string, any> | undefined>((node, key) => node?.[key], map)
    if (!files) continue
    for (const [fileName, value] of Object.entries(files)) {
      if (value === null) paths.push([...parts, fileName])
    }
  }
  const fileStats =
    (await window.electron.triggerRPC<IObj[]>(IRPCActionType.GET_FILES_STAT, getRawData(paths), 'scripts')) || []
  const disabledList = ((await getConfig(configPaths.scripts.disabledList)) as string[] | undefined) || []
  fileStats.forEach(file => {
    file.enabled = !disabledList.includes(file.filePath.join('/'))
  })
  return fileStats
}

async function getTemplate() {
  const lang = (await getConfig(configPaths.settings.language)) || II18nLanguage.ZH_CN
  return lang === II18nLanguage.ZH_CN || lang === II18nLanguage.ZH_TW ? defaultScriptTemplate : defaultScriptTemplateEn
}

async function openEditor(filePath: string[], mode: 'edit' | 'new' = 'edit') {
  editingPath.value = filePath
  editingIsNew.value = mode === 'new'
  try {
    editorContent.value =
      mode === 'edit'
        ? (await window.electron.triggerRPC<string>(IRPCActionType.READ_SCRIPTS_FILE, getRawData(filePath))) || ''
        : await getTemplate()
    editorVisible.value = true
  } catch (error) {
    showRpcError(error)
  }
}

async function saveEditorContent() {
  if (savingEditor.value) return
  savingEditor.value = true
  const content = editorContent.value
  try {
    await invokeRPC(IRPCActionType.WRITE_SCRIPT_FILE, getRawData(editingPath.value), content)
    message.success(t('pages.settings.advanced.saveFileSuccess'))
    editingIsNew.value = false
    if (editorContent.value === content) editorVisible.value = false
    await getScriptsMap()
  } catch (error) {
    showRpcError(error)
  } finally {
    savingEditor.value = false
  }
}

async function deleteScript(scriptPath: string[]) {
  const result = await confirm({
    title: t('pages.scripts.deleteScriptTitle'),
    message: t('pages.scripts.deleteScriptConfirm', { name: scriptPath[scriptPath.length - 1] }),
    type: 'warning',
    confirmButtonText: t('pages.scripts.deleteScript'),
    cancelButtonText: t('common.cancel'),
    center: true,
  })
  if (!result) return
  try {
    await invokeRPC(IRPCActionType.DELETE_SCRIPTS_FILE, getRawData(scriptPath))
    message.success(t('pages.scripts.deleteSuccess'))
    await getScriptsMap()
  } catch (error) {
    console.error('Failed to delete script file:', error)
    message.error(t('pages.scripts.deleteFailed'))
  }
}

function openScriptFolder() {
  window.electron.sendRPC(IRPCActionType.PICLIST_OPEN_DIRECTORY, 'scripts', true)
}

function openNewScriptDialog(category?: string) {
  newScriptName.value = ''
  newScriptCategory.value = category || choosedCat.value[0] || 'manualTrigger'
  newScriptVisible.value = true
}

function confirmNewScript() {
  const fileName = normalizeScriptFileName(newScriptName.value)
  if (!fileName) {
    message.error(t('pages.scripts.pleaseEnterScriptName'))
    return
  }
  const scriptPath = [...newScriptCategory.value.split('.'), fileName]
  if (existingPathsSet.value.has(scriptPath.join('/'))) {
    message.error(t('pages.scripts.duplicateScriptNameError'))
    return
  }
  newScriptVisible.value = false
  void openEditor(scriptPath, 'new')
}

async function runScript(scriptPath: string[]) {
  if (runningPath.value) return
  runningPath.value = scriptPath.join('/')
  try {
    await window.electron.triggerRPC(IRPCActionType.RUN_SCRIPT_FILE, getRawData(scriptPath))
    message.success(t('pages.scripts.runScriptSuccess'))
  } catch (error) {
    showRpcError(error)
  } finally {
    runningPath.value = ''
  }
}

async function toggleScript(item: IStringKeyMap) {
  const fullPath = item.filePath.join('/')
  const disabledList = ((await getConfig(configPaths.scripts.disabledList)) as string[] | undefined) || []
  const nextList = disabledList.includes(fullPath)
    ? disabledList.filter(path => path !== fullPath)
    : [...disabledList, fullPath]
  // Flip the switch straight away; roll back if the config write fails.
  item.enabled = !item.enabled
  if (!(await saveConfig(configPaths.scripts.disabledList, nextList))) {
    item.enabled = !item.enabled
  }
}

function openShareDialog(item: IStringKeyMap) {
  scriptToShare.value = item
  shareDialogVisible.value = true
}

onBeforeMount(() => {
  void getScriptsMap()
  void checkGitHubAuth()
})

onBeforeUnmount(() => {
  void cancelGitHubLogin()
})
</script>
