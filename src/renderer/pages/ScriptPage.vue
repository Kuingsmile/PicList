<template>
  <div class="relative flex h-full w-full items-center justify-center">
    <div class="relative z-1 flex h-full w-full flex-col items-center justify-start gap-4 rounded-xl border-none p-4">
      <div
        class="flex w-full items-center justify-between gap-4 overflow-visible rounded-2xl border border-border-secondary px-6 py-2 shadow-md max-md:items-stretch max-md:p-5"
      >
        <div class="flex flex-1 flex-wrap items-center gap-4 p-1">
          <FileCode :size="24" class="text-accent" />
          <div>
            <h1 class="m-0 text-2xl font-semibold tracking-tight text-main">{{ t('pages.scripts.title') }}</h1>
            <p class="m-0 text-sm text-secondary">{{ t('pages.scripts.description') }}</p>
          </div>
        </div>
        <div class="flex flex-wrap gap-3 overflow-visible">
          <CustomButton
            type="secondary"
            :icon="StoreIcon"
            :text="t('pages.scripts.marketplace.browseMarketplace')"
            @click="openMarketplace"
          />
          <CustomButton
            type="primary"
            :icon="FolderOpen"
            :text="t('pages.scripts.openScriptFolder')"
            @click="handleOpenScriptFolder"
          />
        </div>
      </div>
      <div
        class="flex w-full flex-row items-center justify-between gap-4 overflow-visible rounded-2xl border border-border-secondary px-6 py-2 shadow-md max-md:items-stretch max-md:p-5"
      >
        <div class="flex flex-wrap gap-3 overflow-visible">
          <div class="flex max-w-[220px] min-w-[180px] flex-1 flex-col gap-1">
            <MultiSelect
              v-model:choosed="choosedCat"
              :zero-placeholder="t('pages.scripts.chooseScriptType')"
              :all-list="supportedScriptCategories"
            />
          </div>
          <CustomButton
            type="primary"
            :icon="Edit2Icon"
            :text="t('pages.scripts.editENVFile')"
            @click="openEditPage(['.env'])"
          />
        </div>
      </div>

      <!-- Plugin Grid -->
      <div
        class="relative flex h-full w-full flex-1 items-center justify-center overflow-hidden rounded-2xl border border-border-secondary p-4 shadow-md"
      >
        <div class="no-scrollbar h-full w-full overflow-auto rounded-sm">
          <div class="grid w-full grid-cols-[repeat(auto-fill,minmax(300px,1fr))] gap-5 border-none p-1 max-md:gap-4">
            <div
              v-for="(item, index) in scriptsList"
              :key="item.fileName + index"
              class="group/config-card relative flex min-h-[160px] cursor-pointer flex-col gap-6 overflow-hidden rounded-xl border border-border-secondary p-5 shadow-sm transition-all duration-fast ease-apple hover:border-2 hover:border-accent hover:shadow-md [.disabled]:opacity-80"
              :class="{
                disabled:
                  !item.enabled && item.category !== 'manualTrigger' && item.category !== 'uploader.advancedplist',
              }"
            >
              <div
                class="absolute right-1 bottom-0 flex h-[15px] w-auto items-center rounded-md bg-gray-400 px-2 py-1 text-[0.6rem] font-medium text-white"
              >
                {{ supportedScriptCategories.find(cat => cat.type === item.category)?.name || item.category }}
              </div>
              <div class="relative z-1 flex flex-1 items-start justify-between">
                <div
                  class="peer flex h-[40px] w-[40px] items-center justify-center rounded-lg border border-accent/10 text-accent transition-all duration-fast ease-apple group-hover/config-card:scale-105"
                >
                  <FileCode :size="20" />
                </div>
                <div
                  class="grid grid-cols-2 gap-1.5 opacity-0 transition-all duration-fast ease-apple group-hover/config-card:opacity-100"
                >
                  <button
                    class="action-btn"
                    :title="t('pages.scripts.editScript')"
                    @click.stop="openEditPage(item.filePath)"
                  >
                    <Pencil :size="14" />
                  </button>
                  <button
                    class="action-btn danger"
                    :title="t('pages.scripts.deleteScript')"
                    @click.stop="() => deleteConfig(item.filePath)"
                  >
                    <Trash2 :size="14" />
                  </button>
                  <button
                    class="action-btn bg-accent/50 text-white! hover:bg-accent!"
                    :title="t('pages.scripts.marketplace.shareScript')"
                    @click.stop="openShareDialog(item)"
                  >
                    <Share2Icon :size="14" />
                  </button>
                  <button
                    v-if="item.category === 'manualTrigger'"
                    class="action-btn bg-accent/50 text-white! hover:bg-accent!"
                    :title="t('pages.scripts.runScript')"
                    @click.stop="runScript(item.filePath)"
                  >
                    <Play :size="14" />
                  </button>

                  <button
                    v-if="item.category !== 'manualTrigger' && item.category !== 'uploader.advancedplist'"
                    class="action-btn border-none"
                    :class="{
                      'bg-success/50 hover:bg-success!': !item.enabled,
                      'bg-error/50 hover:bg-error!': item.enabled,
                    }"
                    :title="item.enabled ? t('pages.scripts.disableScript') : t('pages.scripts.enableScript')"
                    @click.stop="toggleScript(item.filePath)"
                  >
                    <template v-if="!item.enabled">
                      <CheckCircle2 :size="16" class="text-white" />
                    </template>
                    <template v-else>
                      <XIcon :size="16" class="text-white" />
                    </template>
                  </button>
                </div>
              </div>
              <div class="relative z-1 flex-1">
                <div class="mx-0 mt-0 mb-2 flex items-center text-base font-semibold tracking-tight text-main">
                  {{ item.fileName }}
                </div>

                <div class="mb-3 flex items-center gap-1.5 text-xs text-tertiary">
                  <div class="flex items-center gap-1">
                    <Clock :size="12" />
                    <span>{{ formatDate(item.mtimeMs) }}</span>
                  </div>
                  <div
                    v-if="item.enabled"
                    class="inline-flex items-center gap-1.5 rounded-2xl bg-accent/40 px-2 py-1 text-xs font-medium text-white transition-all duration-fast ease-standard"
                  >
                    <span>{{ t('pages.scripts.enabled') }}</span>
                  </div>
                  <div
                    v-else
                    class="inline-flex items-center gap-1.5 rounded-2xl bg-error/40 px-2 py-1 text-xs font-medium text-white transition-all duration-fast ease-standard"
                  >
                    <span>{{ t('pages.scripts.disabled') }}</span>
                  </div>
                </div>
              </div>
            </div>
            <div
              key="add-new"
              class="group/new relative flex min-h-[180px] cursor-pointer flex-col items-center justify-center gap-6 overflow-hidden rounded-xl border-2 border-dashed border-border p-5 shadow-sm transition-all duration-fast ease-apple hover:border-solid hover:border-accent hover:bg-surface hover:shadow-md"
              @click="openNewScriptsNameDialog"
            >
              <div class="flex flex-col items-center gap-3 transition-all duration-fast ease-apple">
                <div
                  class="flex h-[56px] w-[56px] items-center justify-center rounded-xl border-2 border-dashed border-border text-tertiary transition-all duration-fast ease-apple group-hover/new:scale-105 group-hover/new:border-solid group-hover/new:border-accent group-hover/new:bg-accent/5 group-hover/new:text-accent"
                >
                  <Plus :size="24" />
                </div>
                <div class="flex flex-col items-center gap-1">
                  <span class="text-base font-semibold text-secondary">{{ t('pages.scripts.addNew') }}</span>
                </div>
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
      width="600px"
    >
      <div class="flex flex-col items-center justify-center gap-4 bg-bg-secondary p-6">
        <SettingCard class="w-full">
          <SingleSelect
            v-model="newScriptCategory"
            :title="t('pages.scripts.selectScriptType')"
            :key-list="supportedScriptCategories.map(cat => cat.type)"
            :fronticon="false"
            :placeholder="
              supportedScriptCategories.find(cat => cat.type === newScriptCategory)
                ? supportedScriptCategories.find(cat => cat.type === newScriptCategory)?.name
                : newScriptCategory
            "
          >
            <template #item="{ item }">
              {{
                supportedScriptCategories.find(cat => cat.type === item)
                  ? supportedScriptCategories.find(cat => cat.type === item)?.name
                  : item
              }}
            </template>
          </SingleSelect>
        </SettingCard>
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

    <CustomModal
      v-if="marketplaceVisible"
      v-model:visible="marketplaceVisible"
      :title="t('pages.scripts.marketplace.title')"
    >
      <div class="flex h-full w-full flex-col gap-4 p-4">
        <div class="flex flex-wrap items-center justify-between gap-4">
          <div class="relative flex flex-1 items-center">
            <SearchIcon class="absolute left-3 z-1 text-secondary" :size="18" />
            <input
              v-model="marketplaceSearch"
              type="text"
              class="w-full rounded-lg border border-border bg-bg-secondary px-10 py-2 text-sm text-main placeholder:text-secondary focus:border-accent focus:outline-none"
              :placeholder="t('pages.scripts.marketplace.searchPlaceholder')"
            />
          </div>
          <div class="flex items-center gap-2">
            <template v-if="githubAuth.isAuthenticated">
              <span class="text-sm text-secondary">
                {{ t('pages.scripts.marketplace.loggedInAs', { username: githubAuth.username }) }}
              </span>
              <CustomButton
                type="secondary"
                :icon="LogOutIcon"
                :text="t('pages.scripts.marketplace.logout')"
                @click="handleGitHubLogout"
              />
            </template>
            <template v-else>
              <CustomButton
                type="secondary"
                :icon="null"
                :text="t('pages.scripts.marketplace.loginWithGitHub')"
                @click="handleGitHubLogin"
              >
                <template #icon>
                  <BaseSvg name="GitHub" :size="18" color="black" />
                </template>
              </CustomButton>
            </template>
            <CustomButton
              type="secondary"
              :icon="ExternalLinkIcon"
              :text="t('pages.scripts.marketplace.openMarketplaceRepo')"
              @click="openMarketplaceRepo"
            />
          </div>
        </div>

        <div class="flex items-center gap-2">
          <MultiSelect
            v-model:choosed="marketplaceCategoryFilter"
            :zero-placeholder="t('pages.scripts.marketplace.allCategories')"
            :all-list="supportedScriptCategories"
          />
        </div>

        <div v-if="marketplaceLoading" class="flex flex-1 flex-col items-center justify-center gap-4">
          <div class="h-10 w-10 animate-spin rounded-full border-4 border-border border-t-accent" />
          <span class="text-sm text-secondary">{{ t('pages.scripts.marketplace.loadingScripts') }}</span>
        </div>

        <div v-else-if="marketplaceError" class="flex flex-1 flex-col items-center justify-center gap-4">
          <XCircleIcon :size="48" class="text-danger" />
          <span class="text-sm text-danger">{{ t('pages.scripts.marketplace.loadFailed') }}</span>
          <CustomButton
            type="primary"
            :icon="RefreshCwIcon"
            :text="t('pages.scripts.marketplace.retry')"
            @click="fetchMarketplaceScripts"
          />
        </div>

        <div v-else class="flex-1 overflow-hidden rounded-lg border border-border">
          <div class="no-scrollbar h-full overflow-auto p-4">
            <div
              v-if="filteredMarketplaceScripts.length === 0"
              class="flex h-full flex-col items-center justify-center gap-4"
            >
              <PackageIcon :size="48" class="text-secondary opacity-50" />
              <span class="text-sm text-secondary">{{ t('pages.scripts.marketplace.noScriptsFound') }}</span>
            </div>
            <div
              v-else-if="!scriptContentOfMarketplaceVisible"
              class="grid grid-cols-[repeat(auto-fill,minmax(280px,1fr))] gap-4"
            >
              <div
                v-for="script in filteredMarketplaceScripts"
                :key="script.downloadUrl"
                class="flex flex-col gap-3 rounded-xl border border-border-secondary p-4 transition-all hover:border-accent hover:shadow-md"
              >
                <div class="flex items-start justify-between">
                  <div class="flex items-center gap-2">
                    <FileCode :size="20" class="text-accent" />
                    <span class="font-semibold text-main">{{ script.name }}</span>
                  </div>
                  <span class="rounded bg-bg-tertiary px-2 py-0.5 text-xs text-secondary">v{{ script.version }}</span>
                </div>
                <p class="line-clamp-2 min-h-[40px] text-sm text-secondary">{{ script.description || '-' }}</p>
                <div class="flex items-center gap-2 text-xs text-tertiary">
                  <UserIcon :size="12" />
                  <span>{{ script.author }}</span>
                  <span class="mx-1">•</span>
                  <span class="rounded bg-gray-400 px-1.5 py-0.5 text-white">
                    {{ supportedScriptCategories.find(cat => cat.type === script.category)?.name || script.category }}
                  </span>
                </div>
                <div class="mt-auto flex gap-2 pt-2">
                  <button
                    class="flex w-full items-center justify-center gap-2 rounded-lg border border-border bg-accent/20 px-4 py-2 text-sm font-semibold text-accent"
                    @click="openScriptDetails(script.content || '')"
                  >
                    <Edit2Icon :size="16" />
                    {{ t('pages.scripts.marketplace.showScriptCode') }}
                  </button>
                  <button
                    v-if="!isScriptDownloaded(script)"
                    class="flex w-full items-center justify-center gap-2 rounded-lg bg-success/90 px-4 py-2 text-sm font-semibold text-white transition-all hover:bg-success disabled:opacity-50"
                    :disabled="downloadingScripts.has(script.downloadUrl)"
                    @click="downloadMarketplaceScript(script)"
                  >
                    <template v-if="downloadingScripts.has(script.downloadUrl)">
                      <div class="h-4 w-4 animate-spin rounded-full border-2 border-white border-t-transparent" />
                      {{ t('pages.scripts.marketplace.downloading') }}
                    </template>
                    <template v-else>
                      <DownloadIcon :size="16" />
                      {{ t('pages.scripts.marketplace.download') }}
                    </template>
                  </button>
                  <button
                    v-if="isScriptDownloaded(script)"
                    class="flex w-full items-center justify-center gap-2 rounded-lg border border-success bg-success/20 px-4 py-2 text-sm font-semibold text-success"
                    disabled
                  >
                    <CheckIcon :size="16" />
                    {{ t('pages.scripts.marketplace.downloaded') }}
                  </button>
                </div>
              </div>
            </div>
            <div v-else class="flex h-full flex-col gap-4">
              <Editor v-model="marketplaceScriptContent" language="javascript" :read-only="true" />
              <CustomButton
                class="mt-4"
                type="primary"
                :text="t('common.cancel')"
                @click="
                  () => {
                    scriptContentOfMarketplaceVisible = false
                    marketplaceScriptContent = ''
                  }
                "
              />
            </div>
          </div>
        </div>
      </div>
    </CustomModal>

    <CustomModal
      v-if="shareDialogVisible"
      v-model:visible="shareDialogVisible"
      :title="t('pages.scripts.marketplace.shareScript')"
      height="auto"
      width="500px"
    >
      <div class="flex flex-col gap-4 p-6">
        <div v-if="!githubAuth.isAuthenticated" class="flex flex-col items-center gap-4 py-8">
          <BaseSvg name="GitHub" :size="18" color="black" />
          <p class="text-center text-sm text-secondary">{{ t('pages.scripts.marketplace.loginRequired') }}</p>
          <CustomButton
            type="primary"
            :icon="null"
            :text="t('pages.scripts.marketplace.loginWithGitHub')"
            @click="handleGitHubLogin"
          >
            <template #icon>
              <BaseSvg name="GitHub" :size="18" color="black" />
            </template>
          </CustomButton>
        </div>
        <template v-else>
          <SettingCard class="w-full">
            <CustomInput
              v-model="shareMetadata.name"
              :title="t('pages.scripts.marketplace.scriptName')"
              :placeholder="t('pages.scripts.marketplace.scriptName')"
            />
          </SettingCard>
          <SettingCard class="w-full">
            <CustomInput
              v-model="shareMetadata.author"
              :title="t('pages.scripts.marketplace.scriptAuthor')"
              :placeholder="t('pages.scripts.marketplace.scriptAuthor')"
            />
          </SettingCard>
          <SettingCard class="w-full">
            <CustomInput
              v-model="shareMetadata.description"
              :title="t('pages.scripts.marketplace.scriptDescription')"
              :placeholder="t('pages.scripts.marketplace.scriptDescription')"
            />
          </SettingCard>
          <SettingCard class="w-full">
            <CustomInput
              v-model="shareMetadata.version"
              :title="t('pages.scripts.marketplace.scriptVersion')"
              :placeholder="t('pages.scripts.marketplace.scriptVersion')"
            />
          </SettingCard>
        </template>
      </div>
      <template #footer>
        <CustomButton type="secondary" :text="t('common.cancel')" @click="shareDialogVisible = false" />
        <CustomButton
          v-if="githubAuth.isAuthenticated"
          type="primary"
          :text="sharingScript ? t('pages.scripts.marketplace.sharing') : t('pages.scripts.marketplace.share')"
          :disabled="sharingScript"
          @click="handleShareScript"
        />
      </template>
    </CustomModal>

    <CustomModal
      v-if="deviceFlowDialogVisible"
      v-model:visible="deviceFlowDialogVisible"
      :title="t('pages.scripts.marketplace.loginWithGitHub')"
      width="500px"
      height="auto"
    >
      <div class="flex flex-col items-center gap-6 p-6">
        <BaseSvg name="GitHub" :size="18" color="black" />
        <p class="text-center text-secondary">
          {{ t('pages.scripts.marketplace.deviceFlowInstructions') }}
        </p>
        <div class="flex flex-col items-center gap-2">
          <span class="text-sm text-secondary">{{ t('pages.scripts.marketplace.yourCode') }}</span>
          <div class="flex items-center gap-2">
            <code class="rounded-lg bg-bg-tertiary px-6 py-3 text-2xl font-bold tracking-widest text-accent">
              {{ deviceFlowState.userCode }}
            </code>
            <button
              class="rounded-lg bg-bg-secondary p-2 transition-colors hover:bg-bg-tertiary"
              :title="t('pages.scripts.marketplace.copyCode')"
              @click="copyUserCode"
            >
              <CheckIcon v-if="false" :size="20" class="text-success" />
              <svg
                v-else
                xmlns="http://www.w3.org/2000/svg"
                width="20"
                height="20"
                viewBox="0 0 24 24"
                fill="none"
                stroke="currentColor"
                stroke-width="2"
                stroke-linecap="round"
                stroke-linejoin="round"
                class="text-secondary"
              >
                <rect width="14" height="14" x="8" y="8" rx="2" ry="2" />
                <path d="M4 16c-1.1 0-2-.9-2-2V4c0-1.1.9-2 2-2h10c1.1 0 2 .9 2 2" />
              </svg>
            </button>
          </div>
        </div>
        <div class="flex items-center gap-2">
          <div class="h-5 w-5 animate-spin rounded-full border-2 border-border border-t-accent" />
          <span class="text-sm text-secondary">{{ t('pages.scripts.marketplace.waitingForAuth') }}</span>
        </div>
      </div>
      <template #footer>
        <CustomButton type="secondary" :text="t('common.cancel')" @click="cancelDeviceFlow" />
      </template>
    </CustomModal>
  </div>
</template>

<script lang="ts" setup>
import dayjs from 'dayjs'
import {
  CheckCircle2,
  CheckIcon,
  Clock,
  DownloadIcon,
  Edit2Icon,
  ExternalLinkIcon,
  FileCode,
  FolderOpen,
  LogOutIcon,
  PackageIcon,
  Pencil,
  Play,
  Plus,
  RefreshCwIcon,
  SearchIcon,
  Share2Icon,
  StoreIcon,
  Trash2,
  UserIcon,
  XCircleIcon,
  XIcon,
} from 'lucide-vue-next'
import { computed, onBeforeMount, onBeforeUnmount, ref, watch } from 'vue'
import { useI18n } from 'vue-i18n'

import BaseSvg from '@/assets/svg/BaseSvg.vue'
import CustomButton from '@/components/common/CustomButton.vue'
import CustomInput from '@/components/common/CustomInput.vue'
import CustomModal from '@/components/common/CustomModal.vue'
import MultiSelect from '@/components/common/MultiSelect.vue'
import SettingCard from '@/components/common/SettingCard.vue'
import SingleSelect from '@/components/common/SingleSelect.vue'
import Editor from '@/components/Editor.vue'
import useConfirm from '@/hooks/useConfirm'
import useMessage from '@/hooks/useMessage'
import { getRawData } from '@/utils/common'
import { configPaths } from '@/utils/configPaths'
import { getConfig, saveConfig } from '@/utils/dataSender'
import { II18nLanguage, IRPCActionType } from '@/utils/enum'
import { defaultScriptTemplate, defaultScriptTemplateEn } from '@/utils/static'

const { t } = useI18n()
const message = useMessage()
const { confirm } = useConfirm()
const scriptsMap = ref<Record<string, any>>({})
const choosedCat = ref<string[]>([])
const scriptsList = ref<IStringKeyMap[]>([])
const editorVisible = ref(false)
const editorContent = ref('')
const editingScriptName = ref<string[]>([])
const newScriptNameVisible = ref(false)
const newScriptName = ref('')
const newScriptCategory = ref('manualTrigger')

// Marketplace related state
interface IScriptMeta {
  name: string
  author: string
  description: string
  version: string
  fileName: string
  category: string
  content: string | null
  downloadUrl: string
}

interface IGitHubAuth {
  isAuthenticated: boolean
  username: string | null
}

interface IDeviceFlowState {
  isActive: boolean
  userCode: string | null
  verificationUri: string | null
  expiresAt: number | null
  pollingInterval: NodeJS.Timeout | null
}

const marketplaceVisible = ref(false)
const marketplaceLoading = ref(false)
const marketplaceError = ref(false)
const marketplaceScripts = ref<IScriptMeta[]>([])
const marketplaceSearch = ref('')
const marketplaceScriptContent = ref('')
const marketplaceCategoryFilter = ref<string[]>([])
const downloadingScripts = ref<Set<string>>(new Set())
const githubAuth = ref<IGitHubAuth>({ isAuthenticated: false, username: null })

// Device Flow state
const deviceFlowState = ref<IDeviceFlowState>({
  isActive: false,
  userCode: null,
  verificationUri: null,
  expiresAt: null,
  pollingInterval: null,
})
const deviceFlowDialogVisible = ref(false)
const scriptContentOfMarketplaceVisible = ref(false)
const shareDialogVisible = ref(false)
const sharingScript = ref(false)
const scriptToShare = ref<IStringKeyMap | null>(null)
const shareMetadata = ref({
  name: '',
  author: '',
  description: '',
  version: '1.0.0',
})

const filteredMarketplaceScripts = computed(() => {
  let scripts = marketplaceScripts.value

  if (marketplaceSearch.value) {
    const search = marketplaceSearch.value.toLowerCase()
    scripts = scripts.filter(
      s =>
        s.name.toLowerCase().includes(search) ||
        s.description.toLowerCase().includes(search) ||
        s.author.toLowerCase().includes(search),
    )
  }

  if (marketplaceCategoryFilter.value.length > 0) {
    scripts = scripts.filter(s => marketplaceCategoryFilter.value.includes(s.category))
  }

  return scripts
})

const supportedScriptCategories = [
  { type: 'onSoftwareOpen', name: t('pages.scripts.scriptsTypes.onSoftwareOpen') },
  { type: 'onSoftwareClose', name: t('pages.scripts.scriptsTypes.onSoftwareClose') },
  { type: 'preProcess', name: t('pages.scripts.scriptsTypes.preProcess') },
  { type: 'beforeTransform', name: t('pages.scripts.scriptsTypes.beforeTransform') },
  { type: 'transform', name: t('pages.scripts.scriptsTypes.transform') },
  { type: 'beforeUpload', name: t('pages.scripts.scriptsTypes.beforeUpload') },
  { type: 'upload', name: t('pages.scripts.scriptsTypes.upload') },
  { type: 'afterUpload', name: t('pages.scripts.scriptsTypes.afterUpload') },
  { type: 'onUploadSuccess', name: t('pages.scripts.scriptsTypes.onUploadSuccess') },
  { type: 'onGalleryRemove', name: t('pages.scripts.scriptsTypes.onGalleryRemove') },
  { type: 'manualTrigger', name: t('pages.scripts.scriptsTypes.manualTrigger') },
  { type: 'uploader.advancedplist', name: t('pages.scripts.scriptsTypes.uploader.advancedplist') },
]

const existingPathsSet = computed(() => {
  return new Set(scriptsList.value.map(item => item.filePath.join('/')))
})

watch(scriptsMap, async () => {
  await refreshList()
})

watch(choosedCat, async () => {
  await refreshList()
})

async function refreshList() {
  const result: string[][] = []
  const keysToCheck = choosedCat.value.length > 0 ? choosedCat.value : supportedScriptCategories.map(cat => cat.type)
  for (const key of keysToCheck) {
    if (key.includes('.')) {
      const parts = key.split('.')
      const value = scriptsMap.value[parts[0]] ? scriptsMap.value[parts[0]][parts[1]] : undefined
      if (value) {
        Object.entries(value).forEach(([valueKey, item]: [string, any]) => {
          if (item === null) {
            result.push([parts[0], parts[1], valueKey])
          }
        })
      }
    } else {
      const value = scriptsMap.value[key]
      if (value) {
        Object.entries(value).forEach(([valueKey, item]: [string, any]) => {
          if (item === null) {
            result.push([key, valueKey])
          }
        })
      }
    }
  }
  const fileStats =
    (await window.electron.triggerRPC<IObj[]>(IRPCActionType.GET_FILES_STAT, getRawData(result), 'scripts')) || []
  const disabledList = ((await getConfig(configPaths.scripts.disabledList)) as string[] | undefined) || []
  fileStats.forEach(file => {
    const fullPath = file.filePath.join('/')
    file.enabled = !disabledList.includes(fullPath)
  })
  scriptsList.value = fileStats
}

async function getScriptsMap() {
  scriptsMap.value =
    (await window.electron.triggerRPC<Record<string, any>>(IRPCActionType.LIST_SCRIPTS_FILES, [])) || {}
}

function formatDate(timestamp: number) {
  const date = dayjs(timestamp)
  return date.format('YYYY/MM/DD HH:mm:ss')
}

async function getTemplate() {
  const lang = (await getConfig(configPaths.settings.language)) || II18nLanguage.ZH_CN
  if (lang === II18nLanguage.ZH_CN || lang === II18nLanguage.ZH_TW) {
    return defaultScriptTemplate
  } else {
    return defaultScriptTemplateEn
  }
}

async function openEditPage(filePath: string[], mode: 'edit' | 'new' = 'edit') {
  editingScriptName.value = filePath
  if (mode === 'edit') {
    const content =
      (await window.electron.triggerRPC<string>(IRPCActionType.READ_SCRIPTS_FILE, getRawData(filePath))) || ''
    editorContent.value = content
  } else {
    editorContent.value = await getTemplate()
  }
  editorVisible.value = true
}

async function saveEditorContent() {
  const content = editorContent.value.trim()
  try {
    window.electron.sendRPC(IRPCActionType.WRITE_SCRIPT_FILE, getRawData(editingScriptName.value), content)
    message.success(t('pages.settings.advanced.saveFileSuccess'))
    await getScriptsMap()
  } catch (error) {
    console.error('Failed to save file:', error)
    message.error(t('pages.settings.advanced.saveFileFailed'))
  }
  editorVisible.value = false
}

async function deleteConfig(scriptPath: string[]) {
  const result = await confirm({
    title: t('pages.scripts.deleteScriptTitle'),
    message: t('pages.scripts.deleteScriptConfirm', { name: scriptPath[scriptPath.length - 1] }),
    type: 'warning',
    confirmButtonText: t('common.confirm'),
    cancelButtonText: t('common.cancel'),
    center: true,
  })
  if (!result) return
  try {
    window.electron.sendRPC(IRPCActionType.DELETE_SCRIPTS_FILE, getRawData(scriptPath))
    message.success(t('pages.scripts.deleteSuccess'))
    await getScriptsMap()
  } catch (error) {
    console.error('Failed to delete script file:', error)
    message.error(t('pages.scripts.deleteFailed'))
  }
}

function handleOpenScriptFolder() {
  window.electron.sendRPC(IRPCActionType.PICLIST_OPEN_DIRECTORY, 'scripts', true)
}

function openNewScriptsNameDialog() {
  newScriptName.value = ''
  newScriptNameVisible.value = true
}

async function runScript(scriptPath: string[]) {
  const result = await window.electron.triggerRPC(IRPCActionType.RUN_SCRIPT_FILE, getRawData(scriptPath))
  if (result instanceof Error) {
    const errorMessage = result.message || 'Unknown error'
    message.error(`${t('pages.scripts.runScriptFailed', { errorMessage })}`)
  } else {
    message.success(t('pages.scripts.runScriptSuccess'))
  }
}

function checkDup(fullPath: string[]) {
  return existingPathsSet.value.has(fullPath.join('/'))
}

function handleNewScriptNameConfirm() {
  let trimmedName = newScriptName.value.trim()
  trimmedName = trimmedName.endsWith('.js') ? trimmedName : `${trimmedName}.js`
  if (!trimmedName) {
    message.error(t('pages.scripts.pleaseEnterScriptName'))
    return
  }
  const scriptPath = newScriptCategory.value.includes('.')
    ? [...newScriptCategory.value.split('.'), trimmedName]
    : [newScriptCategory.value, trimmedName]
  if (checkDup(scriptPath)) {
    message.error(t('pages.scripts.duplicateScriptNameError'))
    return
  }
  newScriptNameVisible.value = false
  openEditPage(scriptPath, 'new')
}

async function toggleScript(scriptPath: string[]) {
  const disabledList = ((await getConfig(configPaths.scripts.disabledList)) as string[] | undefined) || []
  const fullPath = scriptPath.join('/')
  if (disabledList.includes(fullPath)) {
    const index = disabledList.indexOf(fullPath)
    if (index > -1) {
      disabledList.splice(index, 1)
    }
  } else {
    disabledList.push(fullPath)
  }
  saveConfig(configPaths.scripts.disabledList, disabledList)
  await getScriptsMap()
}

function openScriptDetails(content: string) {
  marketplaceScriptContent.value = content
  scriptContentOfMarketplaceVisible.value = true
}

async function openMarketplace() {
  marketplaceVisible.value = true
  await checkGitHubAuth()
  await fetchMarketplaceScripts()
}

async function fetchMarketplaceScripts() {
  marketplaceLoading.value = true
  marketplaceError.value = false

  try {
    const scripts = await window.electron.triggerRPC<IScriptMeta[]>(IRPCActionType.SCRIPT_MARKETPLACE_FETCH_LIST)
    marketplaceScripts.value = scripts || []
  } catch (error) {
    console.error('Failed to fetch marketplace scripts:', error)
    marketplaceError.value = true
  } finally {
    marketplaceLoading.value = false
  }
}

function isScriptDownloaded(script: IScriptMeta): boolean {
  const categoryPath = script.category.replace(/\./g, '/')
  const scriptPath = `${categoryPath}/${script.fileName}`
  const isDownloaded = existingPathsSet.value.has(scriptPath)
  return isDownloaded
}

async function downloadMarketplaceScript(script: IScriptMeta) {
  downloadingScripts.value.add(script.downloadUrl)

  try {
    const result = await window.electron.triggerRPC<boolean>(
      IRPCActionType.SCRIPT_MARKETPLACE_DOWNLOAD,
      getRawData(script),
    )
    if (result) {
      message.success(t('pages.scripts.marketplace.downloadSuccess'))
      await getScriptsMap()
    } else {
      message.error(t('pages.scripts.marketplace.downloadFailed'))
    }
  } catch (error) {
    console.error('Failed to download script:', error)
    message.error(t('pages.scripts.marketplace.downloadFailed'))
  } finally {
    downloadingScripts.value.delete(script.downloadUrl)
  }
}

async function checkGitHubAuth() {
  try {
    const auth = await window.electron.triggerRPC<IGitHubAuth>(IRPCActionType.SCRIPT_MARKETPLACE_CHECK_GITHUB_AUTH)
    if (auth) {
      githubAuth.value = auth
    }
  } catch (error) {
    console.error('Failed to check GitHub auth:', error)
  }
}

async function handleGitHubLogin() {
  try {
    const result = await window.electron.triggerRPC<{
      userCode: string
      verificationUri: string
      expiresIn: number
    } | null>(IRPCActionType.SCRIPT_MARKETPLACE_GITHUB_LOGIN)

    if (result) {
      deviceFlowState.value = {
        isActive: true,
        userCode: result.userCode,
        verificationUri: result.verificationUri,
        expiresAt: Date.now() + result.expiresIn * 1000,
        pollingInterval: null,
      }
      deviceFlowDialogVisible.value = true

      startDeviceFlowPolling()
    } else {
      message.error(t('pages.scripts.marketplace.loginFailed'))
    }
  } catch (error) {
    console.error('Failed to initiate GitHub login:', error)
    message.error(t('pages.scripts.marketplace.loginFailed'))
  }
}

function startDeviceFlowPolling() {
  if (deviceFlowState.value.pollingInterval) {
    clearInterval(deviceFlowState.value.pollingInterval)
  }

  const poll = async () => {
    if (deviceFlowState.value.expiresAt && Date.now() > deviceFlowState.value.expiresAt) {
      stopDeviceFlowPolling()
      message.error(t('pages.scripts.marketplace.deviceCodeExpired'))
      deviceFlowDialogVisible.value = false
      return
    }

    try {
      const result = await window.electron.triggerRPC<{
        success: boolean
        username?: string
        error?: string
        nextInterval?: number
      }>(IRPCActionType.SCRIPT_MARKETPLACE_GITHUB_POLL)

      if (result?.success) {
        stopDeviceFlowPolling()
        githubAuth.value = { isAuthenticated: true, username: result.username || null }
        deviceFlowDialogVisible.value = false
        message.success(t('pages.scripts.marketplace.loginSuccess'))
        return
      }

      if (result?.error === 'authorization_pending' || result?.error === 'slow_down') {
        const delay = (result.nextInterval || 5) * 1000
        deviceFlowState.value.pollingInterval = setTimeout(poll, delay)
      } else {
        stopDeviceFlowPolling()
        deviceFlowDialogVisible.value = false
        message.error(`${t('pages.scripts.marketplace.loginFailed')}: ${result?.error}`)
      }
    } catch (error) {
      console.error('Failed to poll device flow:', error)
      deviceFlowState.value.pollingInterval = setTimeout(poll, 5000)
    }
  }

  poll()
}

function stopDeviceFlowPolling() {
  if (deviceFlowState.value.pollingInterval) {
    clearInterval(deviceFlowState.value.pollingInterval)
    deviceFlowState.value.pollingInterval = null
  }
  deviceFlowState.value.isActive = false
}

async function cancelDeviceFlow() {
  stopDeviceFlowPolling()
  await window.electron.triggerRPC(IRPCActionType.SCRIPT_MARKETPLACE_GITHUB_CANCEL)
  deviceFlowDialogVisible.value = false
}

function copyUserCode() {
  if (deviceFlowState.value.userCode) {
    window.electron.clipboard.writeText(deviceFlowState.value.userCode)
    message.success(t('pages.scripts.marketplace.codeCopied'))
  }
}

async function handleGitHubLogout() {
  try {
    await window.electron.triggerRPC(IRPCActionType.SCRIPT_MARKETPLACE_GITHUB_LOGOUT)
    githubAuth.value = { isAuthenticated: false, username: null }
    message.success(t('pages.scripts.marketplace.logoutSuccess'))
  } catch (error) {
    console.error('Failed to logout:', error)
  }
}

function openMarketplaceRepo() {
  window.electron.sendRPC(IRPCActionType.OPEN_URL, 'https://github.com/Kuingsmile/piclist-ScriptsHub')
}

function openShareDialog(script: IStringKeyMap) {
  scriptToShare.value = script
  shareMetadata.value = {
    name: script.fileName.replace('.js', ''),
    author: githubAuth.value.username || '',
    description: '',
    version: '1.0.0',
  }
  shareDialogVisible.value = true
}

async function handleShareScript() {
  if (!scriptToShare.value) return

  if (
    !shareMetadata.value.name ||
    !shareMetadata.value.author ||
    !shareMetadata.value.description ||
    !shareMetadata.value.version
  ) {
    message.error(t('pages.scripts.marketplace.metadataRequired'))
    return
  }

  sharingScript.value = true

  try {
    const result = await window.electron.triggerRPC<{ success: boolean; prUrl?: string; error?: string }>(
      IRPCActionType.SCRIPT_MARKETPLACE_SHARE,
      getRawData(scriptToShare.value.filePath),
      getRawData(shareMetadata.value),
    )

    if (result?.success) {
      message.success(t('pages.scripts.marketplace.shareSuccess'))
      shareDialogVisible.value = false
      if (result.prUrl) {
        window.electron.sendRPC(IRPCActionType.OPEN_URL, result.prUrl)
      }
    } else {
      message.error(`${t('pages.scripts.marketplace.shareFailed')}: ${result?.error || 'Unknown error'}`)
    }
  } catch (error) {
    console.error('Failed to share script:', error)
    message.error(t('pages.scripts.marketplace.shareFailed'))
  } finally {
    sharingScript.value = false
  }
}

onBeforeMount(async () => {
  getScriptsMap()
  await checkGitHubAuth()
})

onBeforeUnmount(() => {
  stopDeviceFlowPolling()
})
</script>

<script lang="ts">
export default {
  name: 'ScriptPage',
}
</script>

<style scoped>
@import 'tailwindcss' reference;
@import '../assets/css/theme.css' reference;
@import '../assets/css/utilities.css' reference;

.action-btn {
  @apply flex h-[30px] w-[30px] cursor-pointer items-center justify-center rounded-md border border-accent/20 text-secondary transition-all duration-fast ease-standard hover:scale-105 hover:bg-accent/30 hover:text-white disabled:cursor-not-allowed disabled:opacity-50 hover:not-disabled:[.danger]:border-danger hover:not-disabled:[.danger]:bg-danger;
}
</style>
