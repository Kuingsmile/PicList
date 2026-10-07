<template>
  <CustomModal v-model:visible="visible" :title="t('pages.scripts.marketplace.title')" :scrollable="false">
    <template #header>
      <div class="flex min-w-0 items-center gap-2">
        <button
          v-if="previewScript"
          v-tooltip="t('pages.scripts.marketplace.backToList')"
          type="button"
          class="flex h-8 w-8 shrink-0 cursor-pointer items-center justify-center rounded-full text-secondary hover:bg-accent/10 hover:text-main focus-visible:focus-ring"
          :aria-label="t('pages.scripts.marketplace.backToList')"
          @click="previewScript = null"
        >
          <ArrowLeftIcon :size="18" aria-hidden="true" />
        </button>
        <div class="min-w-0">
          <h3 class="m-0 truncate text-xl font-semibold text-main">
            {{ previewScript ? previewScript.name : t('pages.scripts.marketplace.title') }}
          </h3>
          <p class="m-0 mt-0.5 truncate text-sm text-secondary">
            {{
              previewScript
                ? `v${previewScript.version} · ${previewScript.author} · ${categoryName(previewScript.category)}`
                : t('pages.scripts.marketplace.description')
            }}
          </p>
        </div>
      </div>
    </template>

    <!-- Code preview -->
    <div v-if="previewScript" class="flex h-full min-h-0 flex-col gap-3 p-4">
      <p v-if="previewScript.description" class="m-0 shrink-0 text-sm text-secondary">
        {{ previewScript.description }}
      </p>
      <div class="min-h-0 flex-1 overflow-hidden rounded-lg border border-border">
        <Editor :model-value="previewScript.content || ''" language="javascript" :read-only="true" />
      </div>
    </div>

    <div v-else class="flex h-full min-h-0 flex-col gap-3 p-4">
      <!-- Toolbar -->
      <div class="flex shrink-0 flex-wrap items-center gap-2">
        <div class="relative flex min-w-[200px] flex-1 items-center">
          <SearchIcon :size="16" class="pointer-events-none absolute left-3 text-secondary" aria-hidden="true" />
          <input
            v-model="search"
            type="search"
            class="h-[36px] w-full rounded-lg border border-border bg-bg-secondary pr-8 pl-9 text-sm text-main transition-all duration-fast ease-apple placeholder:text-secondary focus:border-accent focus:outline-none focus-visible:focus-ring [&::-webkit-search-cancel-button]:hidden"
            :placeholder="t('pages.scripts.marketplace.searchPlaceholder')"
            :aria-label="t('pages.scripts.marketplace.searchPlaceholder')"
          />
          <button
            v-if="search"
            type="button"
            class="absolute right-2 flex h-[22px] w-[22px] cursor-pointer items-center justify-center rounded-full text-secondary hover:bg-accent/10 hover:text-main focus-visible:focus-ring"
            :aria-label="t('common.clear')"
            @click="search = ''"
          >
            <XIcon :size="14" aria-hidden="true" />
          </button>
        </div>
        <div class="w-[200px] max-md:flex-1">
          <MultiSelect
            v-model:choosed="categoryFilter"
            :zero-placeholder="t('pages.scripts.marketplace.allCategories')"
            :all-list="scriptCategories"
            trigger-class="h-[36px]"
          />
        </div>
        <div class="ml-auto flex items-center gap-2">
          <div
            v-if="githubAuth.isAuthenticated"
            class="flex h-[36px] items-center gap-2 rounded-lg border border-border-secondary pr-1 pl-2.5 text-sm text-secondary"
          >
            <BaseSvg name="GitHub" :size="15" aria-hidden="true" />
            <span class="max-w-[140px] truncate font-medium text-main">{{ githubAuth.username }}</span>
            <button
              v-tooltip="t('pages.scripts.marketplace.logout')"
              type="button"
              class="flex h-[28px] w-[28px] cursor-pointer items-center justify-center rounded-md text-secondary hover:bg-danger/10 hover:text-danger focus-visible:focus-ring"
              :aria-label="t('pages.scripts.marketplace.logout')"
              @click="logoutGitHub"
            >
              <LogOutIcon :size="14" aria-hidden="true" />
            </button>
          </div>
          <CustomButton
            v-else
            type="secondary"
            class="h-[36px] py-0!"
            :text="t('pages.scripts.marketplace.loginWithGitHub')"
            @click="loginWithGitHub"
          >
            <template #icon>
              <BaseSvg name="GitHub" :size="16" />
            </template>
          </CustomButton>
          <button
            v-tooltip="t('pages.scripts.marketplace.openMarketplaceRepo')"
            type="button"
            class="flex h-[36px] w-[36px] cursor-pointer items-center justify-center rounded-lg border border-border-secondary text-secondary hover:border-accent hover:text-accent focus-visible:focus-ring"
            :aria-label="t('pages.scripts.marketplace.openMarketplaceRepo')"
            @click="openMarketplaceRepo"
          >
            <ExternalLinkIcon :size="16" aria-hidden="true" />
          </button>
        </div>
      </div>

      <!-- Body -->
      <div class="no-scrollbar min-h-0 flex-1 overflow-auto">
        <div v-if="loading" class="flex h-full flex-col items-center justify-center gap-3 text-sm text-secondary">
          <LoaderCircle :size="28" class="animate-spin text-accent motion-reduce:animate-none" aria-hidden="true" />
          {{ t('pages.scripts.marketplace.loadingScripts') }}
        </div>
        <div v-else-if="loadFailed" class="flex h-full flex-col items-center justify-center gap-3 text-center">
          <CloudOffIcon :size="40" class="text-secondary" aria-hidden="true" />
          <span class="text-sm font-medium text-main">{{ t('pages.scripts.marketplace.loadFailed') }}</span>
          <CustomButton :icon="RotateCwIcon" :text="t('pages.scripts.marketplace.retry')" @click="fetchScripts" />
        </div>
        <div
          v-else-if="filteredScripts.length === 0"
          class="flex h-full flex-col items-center justify-center gap-3 text-center"
        >
          <SearchXIcon :size="40" class="text-secondary" aria-hidden="true" />
          <span class="text-sm text-secondary">{{ t('pages.scripts.marketplace.noScriptsFound') }}</span>
        </div>
        <div v-else class="grid grid-cols-[repeat(auto-fill,minmax(260px,1fr))] gap-4">
          <article
            v-for="script in filteredScripts"
            :key="script.downloadUrl"
            class="flex min-w-0 flex-col gap-3 rounded-lg border border-border bg-bg-secondary p-4 shadow-sm transition-all duration-fast ease-apple hover:border-accent hover:shadow-md"
          >
            <div class="flex min-w-0 items-start gap-3">
              <div
                class="flex h-[34px] w-[34px] shrink-0 items-center justify-center rounded-lg bg-accent/10 text-accent"
                aria-hidden="true"
              >
                <FileCode :size="17" />
              </div>
              <div class="flex min-w-0 flex-1 flex-col gap-0.5">
                <div class="flex min-w-0 items-center gap-1.5">
                  <h4 class="m-0 truncate text-sm font-semibold text-main">{{ script.name }}</h4>
                  <span class="shrink-0 rounded-sm bg-bg-tertiary px-1.5 py-px text-xs text-secondary tabular-nums">
                    v{{ script.version }}
                  </span>
                </div>
                <p class="m-0 truncate text-xs text-secondary">{{ script.author }}</p>
              </div>
            </div>
            <p
              class="m-0 line-clamp-2 min-h-[2.5rem] text-xs leading-[1.25rem] text-secondary"
              :title="script.description"
            >
              {{ script.description || '—' }}
            </p>
            <div class="mt-auto flex items-center gap-2 border-t border-border-secondary pt-3">
              <span class="min-w-0 truncate rounded-sm bg-accent/10 px-1.5 py-0.5 text-[11px] font-medium text-accent">
                {{ categoryName(script.category) }}
              </span>
              <div class="ml-auto flex shrink-0 items-center gap-1.5">
                <button
                  v-tooltip="t('pages.scripts.marketplace.showScriptCode')"
                  type="button"
                  class="flex h-[32px] w-[32px] cursor-pointer items-center justify-center rounded-md border border-border text-secondary hover:border-accent hover:text-accent focus-visible:focus-ring"
                  :aria-label="t('pages.scripts.marketplace.showScriptCode')"
                  @click="previewScript = script"
                >
                  <CodeIcon :size="15" aria-hidden="true" />
                </button>
                <span
                  v-if="isDownloaded(script)"
                  class="inline-flex h-[32px] items-center gap-1.5 px-2 text-xs font-medium text-success"
                >
                  <CircleCheck :size="14" aria-hidden="true" />{{ t('pages.scripts.marketplace.downloaded') }}
                </span>
                <CustomButton
                  v-else
                  class="h-[32px] px-3! py-0!"
                  :icon="DownloadIcon"
                  :loading="downloading.has(script.downloadUrl)"
                  :text="t('pages.scripts.marketplace.download')"
                  @click="downloadScript(script)"
                />
              </div>
            </div>
          </article>
        </div>
      </div>
    </div>

    <template v-if="previewScript" #footer>
      <CustomButton type="secondary" :text="t('pages.scripts.marketplace.backToList')" @click="previewScript = null" />
      <span
        v-if="isDownloaded(previewScript)"
        class="inline-flex items-center gap-1.5 px-2 text-sm font-medium text-success"
      >
        <CircleCheck :size="15" aria-hidden="true" />{{ t('pages.scripts.marketplace.downloaded') }}
      </span>
      <CustomButton
        v-else
        :icon="DownloadIcon"
        :loading="downloading.has(previewScript.downloadUrl)"
        :text="t('pages.scripts.marketplace.download')"
        @click="downloadScript(previewScript)"
      />
    </template>
  </CustomModal>
</template>

<script setup lang="ts">
import {
  ArrowLeftIcon,
  CircleCheck,
  CloudOffIcon,
  CodeIcon,
  DownloadIcon,
  ExternalLinkIcon,
  FileCode,
  LoaderCircle,
  LogOutIcon,
  RotateCwIcon,
  SearchIcon,
  SearchXIcon,
  XIcon,
} from '@lucide/vue'
import { computed, defineAsyncComponent, reactive, ref, watch } from 'vue'
import { useI18n } from 'vue-i18n'

import BaseSvg from '@/assets/svg/BaseSvg.vue'
import CustomButton from '@/components/common/CustomButton.vue'
import CustomModal from '@/components/common/CustomModal.vue'
import MultiSelect from '@/components/common/MultiSelect.vue'
import { useGitHubAuth } from '@/composables/scripts/useGitHubAuth'
import { useScriptCategories } from '@/composables/scripts/useScriptCategories'
import useMessage from '@/composables/useMessage'
import { IRPCActionType } from '#/constants/rpcActions'
import { getRawData } from '#/utils/rawData'

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

const Editor = defineAsyncComponent(() => import('@/components/Editor.vue'))

const visible = defineModel<boolean>('visible', { required: true })
const { existingPaths } = defineProps<{ existingPaths: ReadonlySet<string> }>()
const emit = defineEmits<{ downloaded: [] }>()

const { t } = useI18n()
const message = useMessage()
const { githubAuth, checkGitHubAuth, loginWithGitHub, logoutGitHub } = useGitHubAuth()
const { scriptCategories, categoryName } = useScriptCategories()

const scripts = ref<IScriptMeta[]>([])
const loading = ref(false)
const loadFailed = ref(false)
const search = ref('')
const categoryFilter = ref<string[]>([])
const downloading = reactive(new Set<string>())
const previewScript = ref<IScriptMeta | null>(null)

const filteredScripts = computed(() => {
  const query = search.value.trim().toLowerCase()
  return scripts.value.filter(script => {
    if (categoryFilter.value.length > 0 && !categoryFilter.value.includes(script.category)) return false
    if (!query) return true
    return [script.name, script.description, script.author].some(field => field?.toLowerCase().includes(query))
  })
})

function isDownloaded(script: IScriptMeta) {
  return existingPaths.has(`${script.category.replace(/\./g, '/')}/${script.fileName}`)
}

async function fetchScripts() {
  loading.value = true
  loadFailed.value = false
  try {
    scripts.value =
      (await window.electron.triggerRPC<IScriptMeta[]>(IRPCActionType.SCRIPT_MARKETPLACE_FETCH_LIST)) || []
  } catch (error) {
    console.error('Failed to fetch marketplace scripts:', error)
    loadFailed.value = true
  } finally {
    loading.value = false
  }
}

async function downloadScript(script: IScriptMeta) {
  if (downloading.has(script.downloadUrl)) return
  downloading.add(script.downloadUrl)
  try {
    const result = await window.electron.triggerRPC<boolean>(
      IRPCActionType.SCRIPT_MARKETPLACE_DOWNLOAD,
      getRawData(script),
    )
    if (result) {
      message.success(t('pages.scripts.marketplace.downloadSuccess'))
      emit('downloaded')
    } else {
      message.error(t('pages.scripts.marketplace.downloadFailed'))
    }
  } catch (error) {
    console.error('Failed to download script:', error)
    message.error(t('pages.scripts.marketplace.downloadFailed'))
  } finally {
    downloading.delete(script.downloadUrl)
  }
}

function openMarketplaceRepo() {
  window.electron.sendRPC(IRPCActionType.OPEN_URL, 'https://github.com/Kuingsmile/piclist-ScriptsHub')
}

watch(visible, isVisible => {
  if (!isVisible) return
  previewScript.value = null
  void checkGitHubAuth()
  if (scripts.value.length === 0 || loadFailed.value) void fetchScripts()
})
</script>
