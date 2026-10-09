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
          <Cloud :size="24" class="shrink-0 text-accent" aria-hidden="true" />
          <div class="min-w-0">
            <h1 class="m-0 text-2xl font-semibold tracking-tight text-main">{{ t('pages.manage.login.title') }}</h1>
            <p class="m-0 text-sm text-secondary tabular-nums" aria-live="polite">
              {{ t('pages.manage.login.savedCount', allConfigAliasList.length) }}
            </p>
          </div>
        </div>
        <div class="flex flex-wrap gap-3">
          <CustomButton
            type="secondary"
            :icon="RefreshCwIcon"
            :text="t('pages.manage.login.refresh')"
            :loading="refreshing"
            @click="refreshConfigs"
          />
          <CustomButton type="secondary" :icon="BookOpen" :text="t('pages.settings.docs')" @click="goConfigPage" />
          <CustomButton
            type="secondary"
            :icon="Settings2"
            :text="t('pages.manage.main.settings')"
            @click="openBucketPageSetting"
          />
        </div>
      </header>

      <div class="flex min-h-0 w-full flex-1 gap-4 max-md:flex-col">
        <!-- Provider rail -->
        <nav
          ref="railRef"
          class="no-scrollbar flex w-[210px] shrink-0 flex-col gap-0.5 overflow-auto overscroll-contain rounded-2xl border border-border-secondary scroll-fade-y p-2 shadow-md max-md:w-full max-md:flex-row max-md:scroll-fade-x"
          :aria-label="t('pages.manage.login.providers')"
          @wheel="handleRailWheel"
        >
          <button
            type="button"
            data-rail="all"
            :class="railItemClass('all')"
            :aria-current="activePlatform === 'all' ? 'page' : undefined"
            @click="selectPlatform('all')"
          >
            <span class="flex h-[22px] w-[22px] shrink-0 items-center justify-center">
              <LayoutGridIcon :size="16" aria-hidden="true" />
            </span>
            <span class="min-w-0 flex-1 truncate">{{ t('pages.manage.login.allConfigs') }}</span>
            <span v-if="allConfigAliasList.length" :class="railCountClass('all')">{{ allConfigAliasList.length }}</span>
          </button>
          <p
            class="mx-2 mt-3 mb-1 text-[11px] font-semibold tracking-wider text-tertiary uppercase max-md:hidden"
            aria-hidden="true"
          >
            {{ t('pages.manage.login.providers') }}
          </p>
          <button
            v-for="provider in providers"
            :key="provider.key"
            type="button"
            :data-rail="provider.key"
            :class="railItemClass(provider.key)"
            :aria-current="activePlatform === provider.key ? 'page' : undefined"
            @click="selectPlatform(provider.key)"
          >
            <img :src="`./assets/${provider.icon}.webp`" class="h-[22px] w-[22px] shrink-0 object-contain" alt="" />
            <span class="min-w-0 flex-1 truncate">{{ provider.name }}</span>
            <span v-if="providerCounts[provider.key]" :class="railCountClass(provider.key)">
              {{ providerCounts[provider.key] }}
            </span>
          </button>
        </nav>

        <!-- Content -->
        <section
          class="flex min-h-0 min-w-0 flex-1 flex-col overflow-hidden rounded-2xl border border-border-secondary shadow-md"
        >
          <ManageEditPage
            v-if="editing"
            ref="editorRef"
            :key="`${editing.platform}:${editing.alias}`"
            :platform-name="editing.platform"
            :alias-name="editing.alias"
            @close="editing = null"
            @saved="handleSaved"
          />

          <template v-else>
            <!-- Toolbar -->
            <div class="flex shrink-0 flex-wrap items-center gap-3 border-b border-border-secondary px-4 py-3">
              <div class="flex min-w-0 items-center gap-3">
                <span
                  class="flex h-[36px] w-[36px] shrink-0 items-center justify-center rounded-lg border border-border-secondary bg-bg-tertiary text-accent"
                >
                  <img
                    v-if="activeProvider"
                    :src="`./assets/${activeProvider.icon}.webp`"
                    class="h-[22px] w-[22px] object-contain"
                    alt=""
                  />
                  <LayoutGridIcon v-else :size="18" aria-hidden="true" />
                </span>
                <h2 class="m-0 truncate text-lg font-semibold tracking-tight text-main">
                  {{ activeProvider ? activeProvider.name : t('pages.manage.login.allConfigs') }}
                </h2>
              </div>
              <div class="ml-auto flex min-w-0 flex-1 items-center justify-end gap-2">
                <!-- Nothing to search in an empty cloud -->
                <div
                  v-if="scopeCount > 0"
                  class="group/search relative flex max-w-[280px] min-w-[160px] flex-1 items-center"
                >
                  <SearchIcon
                    :size="16"
                    class="pointer-events-none absolute left-3 text-secondary"
                    aria-hidden="true"
                  />
                  <input
                    ref="searchRef"
                    v-model="searchText"
                    type="search"
                    class="h-[36px] w-full rounded-lg border border-border bg-bg-secondary pr-14 pl-9 text-sm text-main transition-all duration-fast ease-apple placeholder:text-secondary focus:border-accent focus:outline-none focus-visible:focus-ring [&::-webkit-search-cancel-button]:hidden"
                    :placeholder="t('pages.manage.login.searchPlaceholder')"
                    :aria-label="t('pages.manage.login.searchPlaceholder')"
                    :aria-keyshortcuts="isMacOS ? 'Meta+F' : 'Control+F'"
                    @keydown.esc="handleSearchEscape"
                  />
                  <button
                    v-if="searchText"
                    type="button"
                    class="absolute right-2 flex h-[22px] w-[22px] cursor-pointer items-center justify-center rounded-full text-secondary hover:bg-accent/10 hover:text-main focus-visible:focus-ring"
                    :aria-label="t('common.clear')"
                    @click="clearSearch"
                  >
                    <XIcon :size="14" aria-hidden="true" />
                  </button>
                  <kbd
                    v-else
                    class="pointer-events-none absolute right-2.5 inline-flex items-center rounded border border-border-secondary bg-bg-tertiary px-1 font-sans text-[10px] leading-4 text-secondary transition-opacity duration-fast group-focus-within/search:opacity-0"
                    aria-hidden="true"
                  >
                    {{ isMacOS ? '⌘F' : 'Ctrl F' }}
                  </kbd>
                </div>
                <!-- Only offered once there is a custom order to undo -->
                <CustomButton
                  v-if="accountOrder.length && scopeCount > 1"
                  v-tooltip="t('pages.manage.login.resetOrder')"
                  type="secondary"
                  :icon="ListRestartIcon"
                  class="h-[36px] w-[36px] px-0! py-0!"
                  :aria-label="t('pages.manage.login.resetOrder')"
                  @click="resetAccountOrder"
                />
                <CustomButton
                  :icon="Plus"
                  :text="t('pages.manage.login.newConfig')"
                  class="h-[36px] py-0!"
                  @click="startCreate(activeProvider?.key)"
                />
              </div>
            </div>

            <div ref="listRef" class="no-scrollbar min-h-0 flex-1 overflow-auto p-4">
              <!-- Loading -->
              <div
                v-if="loading"
                class="grid grid-cols-[repeat(auto-fill,minmax(300px,1fr))] gap-3"
                role="status"
                :aria-label="t('pages.configForm.loading')"
              >
                <div
                  v-for="n in 6"
                  :key="n"
                  class="flex h-[116px] flex-col rounded-xl border border-border-secondary bg-bg-secondary motion-safe:animate-pulse"
                  aria-hidden="true"
                >
                  <div class="flex flex-1 items-center gap-3.5 px-3.5">
                    <div class="h-[44px] w-[44px] rounded-xl bg-bg-tertiary" />
                    <div class="flex flex-1 flex-col gap-2">
                      <div class="h-3.5 w-1/2 rounded-sm bg-bg-tertiary" />
                      <div class="h-3 w-3/4 rounded-sm bg-bg-tertiary" />
                    </div>
                  </div>
                  <div class="flex h-[41px] items-center gap-2 border-t border-border-secondary px-3.5">
                    <div class="h-3 w-16 rounded-sm bg-bg-tertiary" />
                    <div class="h-3 w-10 rounded-sm bg-bg-tertiary" />
                  </div>
                </div>
              </div>

              <!-- First run: nothing saved yet -->
              <div
                v-else-if="allConfigAliasList.length === 0 && activePlatform === 'all'"
                class="mx-auto flex max-w-[760px] flex-col items-center gap-6 py-6 text-center"
              >
                <div
                  class="inline-flex h-[72px] w-[72px] items-center justify-center rounded-2xl border-2 border-border bg-surface-elevated text-accent"
                >
                  <Cloud :size="36" aria-hidden="true" />
                </div>
                <div>
                  <h3 class="mb-2 text-xl font-semibold text-main">{{ t('pages.manage.login.welcomeTitle') }}</h3>
                  <p class="m-0 text-sm text-secondary">{{ t('pages.manage.login.welcomeDesc') }}</p>
                </div>
                <ProviderPickerGrid
                  class="w-full text-left"
                  :providers
                  :counts="providerCounts"
                  @select="startCreate"
                />
              </div>

              <!-- Provider without configurations -->
              <div
                v-else-if="activeProvider && providerCounts[activeProvider.key] === undefined"
                class="flex h-full flex-col items-center justify-center gap-4 px-6 py-12 text-center"
              >
                <div
                  class="inline-flex h-[72px] w-[72px] items-center justify-center rounded-2xl border-2 border-dashed border-border bg-surface-elevated"
                >
                  <img :src="`./assets/${activeProvider.icon}.webp`" class="h-[40px] w-[40px] object-contain" alt="" />
                </div>
                <div>
                  <h3 class="mb-2 text-lg font-semibold text-main">
                    {{ t('pages.manage.login.noProviderConfigs', { name: activeProvider.name }) }}
                  </h3>
                  <p class="m-0 max-w-[420px] text-sm text-secondary">
                    {{ t('pages.manage.login.noProviderConfigsDesc') }}
                  </p>
                </div>
                <div class="flex flex-wrap justify-center gap-3">
                  <CustomButton
                    type="secondary"
                    :icon="BookOpen"
                    :text="t('pages.manage.login.setupGuide')"
                    @click="openUrl(activeProvider.refLink)"
                  />
                  <CustomButton
                    :icon="Plus"
                    :text="t('pages.manage.login.newConfig')"
                    @click="startCreate(activeProvider.key)"
                  />
                </div>
              </div>

              <!-- Search without results -->
              <div
                v-else-if="visibleConfigs.length === 0"
                class="flex h-full flex-col items-center justify-center gap-3 px-6 py-12 text-center"
                role="status"
              >
                <SearchXIcon :size="40" class="text-tertiary" aria-hidden="true" />
                <p class="m-0 text-sm text-secondary">{{ t('pages.manage.login.noMatch', { query: searchText }) }}</p>
                <CustomButton type="secondary" :text="t('common.clear')" @click="clearSearch" />
              </div>

              <!-- Configuration cards: drag a card, or use the arrow keys on its grip, to change the saved order -->
              <TransitionGroup
                v-else
                tag="ul"
                move-class="config-moving transition-transform duration-200 ease-apple motion-reduce:transition-none"
                class="m-0 grid list-none grid-cols-[repeat(auto-fill,minmax(300px,1fr))] gap-3 p-0"
                @dragenter="handleListDragOver"
                @dragover="handleListDragOver"
                @drop="handleListDrop"
              >
                <!-- Two zones: the top opens the cloud, the footer holds the other actions and never opens it on a near miss -->
                <li
                  v-for="item in visibleConfigs"
                  :key="item.alias"
                  :data-alias="item.alias"
                  :draggable="canReorder"
                  class="flex flex-col overflow-hidden rounded-xl border bg-bg-secondary shadow-sm transition-all duration-fast ease-apple"
                  :class="cardStateClass(item.alias)"
                  @dragstart="handleDragStart($event, item.alias)"
                  @dragover="handleCardDragOver($event, item.alias)"
                  @dragend="handleDragEnd"
                >
                  <button
                    type="button"
                    class="group/open flex w-full min-w-0 cursor-pointer items-center gap-3.5 py-3.5 pr-3 pl-3.5 text-left transition-colors duration-fast ease-apple hover:bg-accent/5 focus-visible:ring-2 focus-visible:ring-accent focus-visible:outline-none focus-visible:ring-inset"
                    :title="item.alias"
                    :aria-label="`${t('pages.manage.login.open')}: ${item.alias}`"
                    @click="handleConfigClick(item)"
                  >
                    <span
                      class="flex h-[44px] w-[44px] shrink-0 items-center justify-center rounded-xl bg-bg-tertiary transition-transform duration-fast ease-apple group-hover/open:scale-105"
                    >
                      <img
                        :src="`./assets/${providerIcon(item.picBedName)}.webp`"
                        class="h-[26px] w-[26px] object-contain"
                        alt=""
                        draggable="false"
                      />
                    </span>
                    <span class="flex min-w-0 flex-1 flex-col gap-0.5">
                      <span class="truncate text-[15px] leading-snug font-semibold text-main">{{ item.alias }}</span>
                      <span class="flex min-w-0 items-center gap-1.5 text-xs text-secondary">
                        <span class="shrink-0">{{ providerName(item.picBedName) }}</span>
                        <template v-if="configSummary(item.config)">
                          <span class="text-tertiary" aria-hidden="true">·</span>
                          <span class="truncate font-mono text-[11px] text-tertiary">
                            {{ configSummary(item.config) }}
                          </span>
                        </template>
                      </span>
                    </span>
                    <ChevronRightIcon
                      :size="18"
                      class="shrink-0 text-tertiary transition-all duration-fast ease-apple group-hover/open:translate-x-0.5 group-hover/open:text-accent"
                      aria-hidden="true"
                    />
                  </button>
                  <div class="flex items-center gap-1 border-t border-border-secondary px-2 py-1.5">
                    <button
                      v-if="canReorder"
                      v-tooltip="t('pages.manage.login.dragToReorder')"
                      type="button"
                      data-grip
                      class="flex h-[28px] w-[20px] shrink-0 cursor-grab items-center justify-center rounded-md text-tertiary transition-colors duration-fast ease-apple hover:bg-accent/10 hover:text-accent focus-visible:focus-ring active:cursor-grabbing"
                      :aria-label="`${t('pages.manage.login.dragToReorder')}: ${item.alias}`"
                      aria-keyshortcuts="ArrowUp ArrowDown ArrowLeft ArrowRight"
                      @keydown="handleGripKeydown($event, item.alias)"
                    >
                      <GripVerticalIcon :size="14" aria-hidden="true" />
                    </button>
                    <button
                      type="button"
                      class="flex h-[28px] cursor-pointer items-center gap-1.5 rounded-md px-2 text-xs font-medium text-secondary transition-colors duration-fast ease-apple hover:bg-accent/10 hover:text-accent focus-visible:focus-ring"
                      @click="openDetails(item)"
                    >
                      <InfoIcon :size="14" aria-hidden="true" />
                      {{ t('pages.manage.login.viewDetails') }}
                    </button>
                    <button
                      v-if="supportedPicBedList[item.picBedName]"
                      type="button"
                      class="flex h-[28px] cursor-pointer items-center gap-1.5 rounded-md px-2 text-xs font-medium text-secondary transition-colors duration-fast ease-apple hover:bg-accent/10 hover:text-accent focus-visible:focus-ring"
                      @click="startEdit(item)"
                    >
                      <Pencil :size="14" aria-hidden="true" />
                      {{ t('pages.uploaderConfig.edit') }}
                    </button>
                    <!-- Kept apart from the everyday actions and icon-only so it is never the easy target -->
                    <button
                      v-tooltip="t('pages.manage.login.delete')"
                      type="button"
                      class="ml-auto flex h-[28px] w-[28px] cursor-pointer items-center justify-center gap-1.5 rounded-md px-0! text-xs font-medium text-secondary transition-colors duration-fast ease-apple hover:bg-danger/10! hover:text-danger! focus-visible:focus-ring"
                      :aria-label="`${t('pages.manage.login.delete')}: ${item.alias}`"
                      @click="handleConfigRemove(item.alias)"
                    >
                      <Trash2 :size="14" aria-hidden="true" />
                    </button>
                  </div>
                </li>

                <li v-if="activeProvider" key="new-config" class="flex">
                  <button
                    type="button"
                    class="flex min-h-[116px] w-full cursor-pointer items-center justify-center gap-2 rounded-xl border border-dashed border-border text-sm font-semibold text-secondary transition-all duration-fast ease-apple hover:border-accent hover:bg-accent/5 hover:text-accent focus-visible:focus-ring"
                    @click="startCreate(activeProvider.key)"
                  >
                    <Plus :size="16" aria-hidden="true" />
                    {{ t('pages.manage.login.newConfig') }}
                  </button>
                </li>
              </TransitionGroup>
              <p class="sr-only" aria-live="polite">{{ reorderAnnouncement }}</p>
            </div>
          </template>
        </section>
      </div>
    </div>

    <!-- Choose a provider for a new configuration -->
    <CustomModal
      v-model:visible="pickerVisible"
      :title="t('pages.manage.login.chooseProvider')"
      :description="t('pages.manage.login.chooseProviderDesc')"
      width="680px"
      height="auto"
    >
      <div class="p-5">
        <ProviderPickerGrid :providers :counts="providerCounts" @select="startCreate" />
      </div>
    </CustomModal>

    <!-- Configuration details -->
    <CustomModal
      v-model:visible="detailsVisible"
      :title="detailsItem?.alias"
      :description="detailsItem ? providerName(detailsItem.picBedName) : ''"
      width="640px"
      height="auto"
      max-height="80vh"
    >
      <div v-if="detailsItem" class="flex flex-col">
        <div v-if="detailRows.some(row => row.secret)" class="flex items-center justify-end px-5 pt-3 pb-1">
          <button
            type="button"
            class="flex shrink-0 cursor-pointer items-center gap-1.5 rounded-md px-2 py-1 text-xs font-semibold text-accent hover:bg-accent/10 focus-visible:focus-ring"
            :aria-pressed="showSecrets"
            @click="showSecrets = !showSecrets"
          >
            <EyeOffIcon v-if="showSecrets" :size="14" aria-hidden="true" />
            <EyeIcon v-else :size="14" aria-hidden="true" />
            {{ showSecrets ? t('pages.manage.login.hideSecrets') : t('pages.manage.login.showSecrets') }}
          </button>
        </div>
        <dl class="m-0 divide-y divide-border-secondary px-2 pb-3">
          <div
            v-for="row in detailRows"
            :key="row.key"
            class="group/row grid grid-cols-[minmax(120px,2fr)_3fr_auto] items-center gap-3 rounded-md px-3 py-2.5 hover:bg-accent/5"
          >
            <dt class="min-w-0">
              <span class="block truncate text-sm font-medium text-main">{{ row.label }}</span>
              <span v-if="row.label !== row.key" class="block truncate font-mono text-[11px] text-tertiary">
                {{ row.key }}
              </span>
            </dt>
            <dd class="m-0 min-w-0 font-mono text-[13px] break-all text-secondary">
              {{ row.secret && !showSecrets ? '••••••••' : row.value }}
            </dd>
            <button
              v-tooltip="t('common.copy')"
              type="button"
              class="flex h-[28px] w-[28px] cursor-pointer items-center justify-center rounded-md text-tertiary opacity-60 transition-all duration-fast ease-apple group-hover/row:opacity-100 hover:bg-accent/15 hover:text-accent focus-visible:opacity-100 focus-visible:focus-ring"
              :aria-label="`${t('common.copy')} ${row.label}`"
              @click="copyToClipboard(row.value)"
            >
              <CopyIcon :size="14" aria-hidden="true" />
            </button>
          </div>
        </dl>
      </div>
      <template #footer>
        <CustomButton
          v-if="detailsItem && supportedPicBedList[detailsItem.picBedName]"
          type="secondary"
          :icon="Pencil"
          :text="t('pages.uploaderConfig.edit')"
          @click="startEdit(detailsItem)"
        />
        <CustomButton
          :icon="FolderOpenIcon"
          :text="t('pages.manage.login.open')"
          @click="handleConfigClick(detailsItem!)"
        />
      </template>
    </CustomModal>
  </div>
</template>

<script lang="ts" setup>
import {
  BookOpen,
  ChevronRightIcon,
  Cloud,
  CopyIcon,
  EyeIcon,
  EyeOffIcon,
  FolderOpenIcon,
  GripVerticalIcon,
  InfoIcon,
  LayoutGridIcon,
  ListRestartIcon,
  Pencil,
  Plus,
  RefreshCwIcon,
  SearchIcon,
  SearchXIcon,
  Settings2,
  Trash2,
  XIcon,
} from '@lucide/vue'
import { useEventListener } from '@vueuse/core'
import { computed, nextTick, onBeforeUnmount, onMounted, ref, useTemplateRef, watch } from 'vue'
import { useI18n } from 'vue-i18n'
import { onBeforeRouteLeave, useRouter } from 'vue-router'

import CustomButton from '@/components/common/CustomButton.vue'
import CustomModal from '@/components/common/CustomModal.vue'
import useConfirm from '@/composables/useConfirm'
import { osGlobal } from '@/composables/useGlobal'
import useMessage from '@/composables/useMessage'
import ProviderPickerGrid from '@/manage/components/ProviderPickerGrid.vue'
import ManageEditPage from '@/manage/pages/ManageEditPage.vue'
import { getConfig, removeConfig, saveConfig } from '@/manage/services/configService'
import { useManageStore } from '@/manage/stores/manageStore'
import { getSupportedPicBedList } from '@/manage/utils/constants'
import { formObjToTableData } from '@/manage/utils/filePresentation'
import { getConfig as getPicListConfig } from '@/services/configService'
import { configPaths } from '@/utils/configPaths'
import { II18nLanguage } from '#/constants/app'
import { IRPCActionType } from '#/constants/rpcActions'
import { formatEndpoint } from '#/utils/url'

interface IConfigEntry {
  alias: string
  picBedName: string
  config: IStringKeyMap
}

const SECRET_FIELDS = new Set([
  'token',
  'secretKey',
  'accessKeySecret',
  'secretAccessKey',
  'password',
  'passphrase',
  'accessToken',
  'antiLeechToken',
])

const { t } = useI18n()
const supportedPicBedList = computed(() => getSupportedPicBedList(t))
const manageStore = useManageStore()
const router = useRouter()
const message = useMessage()
const { confirm } = useConfirm()
const editorRef = useTemplateRef('editorRef')
const railRef = useTemplateRef('railRef')
const searchRef = useTemplateRef('searchRef')
const listRef = useTemplateRef('listRef')
const isMacOS = computed(() => osGlobal.value === 'darwin')

const loading = ref(true)
const refreshing = ref(false)
const activePlatform = ref('all')
const searchText = ref('')
const editing = ref<{ platform: string; alias: string } | null>(null)
const pickerVisible = ref(false)
const detailsVisible = ref(false)
const detailsItem = ref<IConfigEntry | null>(null)
const showSecrets = ref(false)
const recentAlias = ref('')
const allConfigAliasList = ref<IConfigEntry[]>([])
const accountOrder = ref<string[]>([])
// The order shown while a card is being dragged; saved only when it is dropped inside the list.
const draftOrder = ref<string[] | null>(null)
const draggingAlias = ref('')
const reorderAnnouncement = ref('')
const importedNewConfig: IStringKeyMap = {}
let recentTimer: ReturnType<typeof setTimeout> | undefined
let dropped = false

const ACCOUNT_ORDER_KEY = 'settings.accountOrder'

const PB_LIST = [
  'aliyun',
  'aws-s3',
  'aws-s3-plist',
  'github',
  'imgur',
  'local',
  'qiniu',
  'sftpplist',
  'smms',
  'tcyun',
  'upyun',
  'webdavplist',
] as const

const providers = computed(() =>
  Object.entries(supportedPicBedList.value).map(([key, item]: [string, any]) => ({
    key,
    name: item.name as string,
    icon: item.icon as string,
    refLink: item.refLink as string,
  })),
)
const activeProvider = computed(() => providers.value.find(item => item.key === activePlatform.value))

const providerCounts = computed(() => {
  const counts: Record<string, number> = {}
  for (const item of allConfigAliasList.value) counts[item.picBedName] = (counts[item.picBedName] ?? 0) + 1
  return counts
})

// How many configurations the current rail selection holds, before searching.
const scopeCount = computed(() =>
  activeProvider.value ? (providerCounts.value[activeProvider.value.key] ?? 0) : allConfigAliasList.value.length,
)

const providerName = (key: string) => supportedPicBedList.value[key]?.name || key
const providerIcon = (key: string) => supportedPicBedList.value[key]?.icon || key

// A short, non-secret hint so similar configurations can be told apart at a glance.
function configSummary(config: IStringKeyMap): string {
  const fixedBucket = supportedPicBedList.value[config.picBedName]?.configOptions?.bucketName?.disabled
  const candidates = [
    config.endpoint,
    config.host,
    fixedBucket ? '' : config.bucketName,
    config.githubUsername,
    config.imgurUserName,
    config.baseDir && config.baseDir !== '/' ? config.baseDir : '',
  ]
  const summary = candidates.find(value => typeof value === 'string' && value.trim() !== '') ?? ''
  return summary.replace(/^https?:\/\//i, '')
}

// The user's saved order first; anything not placed yet follows, ordered like the cloud rail, then by alias.
const orderedAliases = computed(() => {
  if (draftOrder.value) return draftOrder.value
  const saved = new Map(accountOrder.value.map((alias, index) => [alias, index]))
  const order = providers.value.map(item => item.key)
  const rank = (key: string) => (order.includes(key) ? order.indexOf(key) : order.length)
  return [...allConfigAliasList.value]
    .sort(
      (a, b) =>
        (saved.get(a.alias) ?? Infinity) - (saved.get(b.alias) ?? Infinity) ||
        rank(a.picBedName) - rank(b.picBedName) ||
        a.alias.localeCompare(b.alias),
    )
    .map(item => item.alias)
})

const visibleConfigs = computed(() => {
  const query = searchText.value.trim().toLowerCase()
  const entries = new Map(allConfigAliasList.value.map(item => [item.alias, item]))
  return orderedAliases.value
    .map(alias => entries.get(alias))
    .filter((item): item is IConfigEntry => {
      if (!item) return false
      if (activePlatform.value !== 'all' && item.picBedName !== activePlatform.value) return false
      if (!query) return true
      return [item.alias, providerName(item.picBedName), configSummary(item.config)].some(text =>
        text.toLowerCase().includes(query),
      )
    })
})

const canReorder = computed(() => visibleConfigs.value.length > 1)

function cardStateClass(alias: string) {
  if (draggingAlias.value === alias) return 'border-dashed border-accent opacity-50 shadow-none'
  if (recentAlias.value === alias) return 'border-accent ring-2 ring-accent/25'
  return draggingAlias.value
    ? 'border-border-secondary'
    : 'border-border-secondary has-[>button:hover]:border-accent/60 has-[>button:hover]:shadow-md'
}

// Places `alias` where `target` is; hidden configurations in between keep their relative order.
function moveAlias(order: string[], alias: string, target: string) {
  const from = order.indexOf(alias)
  const to = order.indexOf(target)
  if (from < 0 || to < 0 || from === to) return order
  const next = order.slice()
  next.splice(from, 1)
  next.splice(to, 0, alias)
  return next
}

async function saveAccountOrder(order: string[]) {
  if (order.join('\n') === accountOrder.value.join('\n')) return
  const previous = accountOrder.value
  accountOrder.value = order
  if (!(await saveConfig(ACCOUNT_ORDER_KEY, order))) accountOrder.value = previous
}

function handleDragStart(event: DragEvent, alias: string) {
  if (!canReorder.value || !event.dataTransfer) {
    event.preventDefault()
    return
  }
  event.dataTransfer.effectAllowed = 'move'
  draggingAlias.value = alias
  draftOrder.value = orderedAliases.value.slice()
  dropped = false
}

function handleCardDragOver(event: DragEvent, alias: string) {
  if (!draggingAlias.value || !draftOrder.value) return
  event.preventDefault()
  // A card still sliding out of the way would otherwise be swapped straight back under a resting pointer.
  if ((event.currentTarget as HTMLElement).classList.contains('config-moving')) return
  draftOrder.value = moveAlias(draftOrder.value, draggingAlias.value, alias)
}

// The gaps between cards accept the drop too, so a release just off a card still counts.
// dragenter is accepted as well: a release right after crossing onto a card may come before any dragover.
function handleListDragOver(event: DragEvent) {
  if (!draggingAlias.value) return
  event.preventDefault()
  if (event.dataTransfer) event.dataTransfer.dropEffect = 'move'
}

function handleListDrop(event: DragEvent) {
  if (!draggingAlias.value) return
  event.preventDefault()
  dropped = true
}

// Escape or a release outside the list puts every card back.
function handleDragEnd() {
  const order = dropped ? draftOrder.value : null
  draggingAlias.value = ''
  draftOrder.value = null
  if (order) saveAccountOrder(order)
}

async function handleGripKeydown(event: KeyboardEvent, alias: string) {
  const step = { ArrowUp: -1, ArrowLeft: -1, ArrowDown: 1, ArrowRight: 1 }[event.key]
  if (!step) return
  event.preventDefault()
  const visible = visibleConfigs.value
  const index = visible.findIndex(item => item.alias === alias)
  const target = visible[index + step]
  if (!target) return
  await saveAccountOrder(moveAlias(orderedAliases.value, alias, target.alias))
  reorderAnnouncement.value = t('pages.manage.login.movedTo', {
    alias,
    position: index + step + 1,
    total: visible.length,
  })
  // Moving the card re-inserts its node, which drops focus.
  await nextTick()
  listRef.value?.querySelector<HTMLElement>(`[data-alias="${CSS.escape(alias)}"] [data-grip]`)?.focus()
}

async function resetAccountOrder() {
  await saveAccountOrder([])
  message.success(t('pages.manage.login.orderReset'))
}

const detailRows = computed(() => {
  if (!detailsItem.value) return []
  const provider = supportedPicBedList.value[detailsItem.value.picBedName]
  const options = provider?.configOptions ?? {}
  const order: string[] = provider?.options ?? []
  const rank = (key: string) => (order.includes(key) ? order.indexOf(key) : order.length)
  return formObjToTableData(detailsItem.value.config)
    .filter(row => row.key !== 'picBedName')
    .sort((a, b) => rank(a.key) - rank(b.key))
    .map(row => ({
      key: row.key,
      label: options[row.key]?.description || row.key,
      value: String(row.value),
      secret: SECRET_FIELDS.has(row.key),
    }))
})

// A tint rather than a solid pill: the sidebar already shows one, and brand logos vanish on solid accent.
function railItemClass(key: string) {
  return [
    'flex w-full min-w-fit cursor-pointer items-center gap-2.5 rounded-lg px-2.5 py-2 text-left text-sm transition-colors duration-fast ease-apple focus-visible:focus-ring max-md:w-auto',
    activePlatform.value === key
      ? 'bg-accent/10 font-semibold text-accent'
      : 'font-medium text-secondary hover:bg-accent/10 hover:text-main',
  ]
}

function railCountClass(key: string) {
  return [
    'min-w-[20px] shrink-0 rounded-full px-1.5 text-center text-[11px] leading-[18px] font-semibold tabular-nums',
    activePlatform.value === key ? 'bg-accent/15 text-accent' : 'bg-bg-tertiary/40 text-secondary',
  ]
}

// On narrow windows the rail becomes a horizontal strip; let a plain mouse wheel scroll it.
function handleRailWheel(event: WheelEvent) {
  const rail = railRef.value
  if (!rail || event.deltaX !== 0 || rail.scrollWidth <= rail.clientWidth) return
  event.preventDefault()
  rail.scrollLeft += event.deltaY
}

function clearSearch() {
  searchText.value = ''
  searchRef.value?.focus()
}

function handleSearchEscape(event: KeyboardEvent) {
  if (!searchText.value) {
    searchRef.value?.blur()
    return
  }
  event.stopPropagation()
  searchText.value = ''
}

useEventListener(window, 'keydown', (event: KeyboardEvent) => {
  if (!(isMacOS.value ? event.metaKey : event.ctrlKey) || event.key.toLowerCase() !== 'f') return
  if (!searchRef.value || pickerVisible.value || detailsVisible.value) return
  event.preventDefault()
  searchRef.value.focus()
  searchRef.value.select()
})

// Keep the selected cloud visible when the rail scrolls, as the horizontal strip does on narrow windows.
watch(activePlatform, async key => {
  await nextTick()
  railRef.value
    ?.querySelector(`[data-rail="${CSS.escape(key)}"]`)
    ?.scrollIntoView({ block: 'nearest', inline: 'center', behavior: 'smooth' })
})

const openUrl = (url: string) => window.electron.sendRPC(IRPCActionType.OPEN_URL, url)

function openBucketPageSetting() {
  router.push({
    path: '/main-page/manage-setting-page',
  })
}

async function leaveEditor() {
  if (editing.value && editorRef.value && !(await editorRef.value.confirmDiscard())) return false
  editing.value = null
  return true
}

async function selectPlatform(key: string) {
  if (!(await leaveEditor())) return
  activePlatform.value = key
}

async function startCreate(platform?: string) {
  if (!platform) {
    pickerVisible.value = true
    return
  }
  if (!(await leaveEditor())) return
  pickerVisible.value = false
  activePlatform.value = platform
  editing.value = { platform, alias: '' }
}

async function startEdit(item: IConfigEntry) {
  if (!(await leaveEditor())) return
  detailsVisible.value = false
  editing.value = { platform: item.picBedName, alias: item.alias }
}

async function handleSaved(alias: string) {
  const previousAlias = editing.value?.alias
  editing.value = null
  await getAllConfigAliasArray()
  // A renamed configuration keeps its place in the saved order.
  if (previousAlias && previousAlias !== alias && accountOrder.value.includes(previousAlias)) {
    await saveAccountOrder(accountOrder.value.map(item => (item === previousAlias ? alias : item)))
  }
  // Make sure the saved card is on screen to receive its highlight.
  if (!visibleConfigs.value.some(item => item.alias === alias)) searchText.value = ''
  recentAlias.value = alias
  clearTimeout(recentTimer)
  recentTimer = setTimeout(() => (recentAlias.value = ''), 2400)
  await nextTick()
  listRef.value
    ?.querySelector(`[data-alias="${CSS.escape(alias)}"]`)
    ?.scrollIntoView({ block: 'nearest', behavior: 'smooth' })
}

function openDetails(item: IConfigEntry) {
  detailsItem.value = item
  showSecrets.value = false
  detailsVisible.value = true
}

const handleConfigRemove = async (alias: string) => {
  const result = await confirm({
    title: t('pages.manage.login.tips'),
    message: t('pages.manage.login.confirmDeleteNamed', { alias }),
    type: 'warning',
    confirmButtonText: t('common.confirm'),
    cancelButtonText: t('common.cancel'),
    center: true,
  })
  if (!result) return
  try {
    if (!(await removeConfig('picBed', alias))) return
    message.success(t('pages.manage.login.deleteConfigSuccessMsg'))
    if (detailsItem.value?.alias === alias) detailsVisible.value = false
    await manageStore.refreshConfig()
    await getAllConfigAliasArray()
  } catch {
    message.error(t('pages.manage.login.deleteConfigFailedMsg'))
  }
}

const getAllConfigAliasArray = async () => {
  const [result, order] = await Promise.all([
    getConfig<IStringKeyMap>('picBed'),
    getConfig<string[]>(ACCOUNT_ORDER_KEY),
  ])
  accountOrder.value = Array.isArray(order) ? order.filter(alias => typeof alias === 'string') : []
  allConfigAliasList.value = Object.values(result ?? {})
    .filter((value: any) => value && typeof value === 'object' && value.alias)
    .map((value: any) => ({
      alias: value.alias,
      config: value,
      picBedName: value.picBedName,
    }))
}

const copyToClipboard = (text: string) => {
  navigator.clipboard.writeText(text)
  message.success(t('pages.manage.login.copied'))
}

const handleConfigClick = async (item: IConfigEntry) => {
  const result = await getConfig<any>('picBed')
  router.push({
    path: '/main-page/manage-main-page',
    query: {
      alias: item.alias,
      config: JSON.stringify(item.config),
      picBedName: item.picBedName,
      allPicBedConfigure: JSON.stringify(result),
    },
  })
}

const refreshConfigs = async () => {
  if (refreshing.value) return
  refreshing.value = true
  try {
    await manageStore.refreshConfig()
    await getAllConfigAliasArray()
    message.success(t('pages.manage.login.configurationRefreshMsg'))
  } finally {
    refreshing.value = false
  }
}

async function getCurrentConfigList() {
  await manageStore.refreshConfig()
  const configList = (await getPicListConfig<any>('uploader')) ?? {}

  const filteredConfigList = PB_LIST.flatMap(pb => {
    const config = configList[pb]
    return config?.configList?.length ? config.configList.map((item: any) => ({ ...item, type: pb })) : []
  })

  const autoImport = (await getPicListConfig<boolean>('settings.autoImport')) || false
  if (autoImport) {
    const autoImportPicBed = initArray(
      (await getPicListConfig<string | string[]>('settings.autoImportPicBed')) || '',
      [],
    )
    await Promise.all(filteredConfigList.flatMap(config => transUpToManage(config, config.type, autoImportPicBed)))
    if (Object.keys(importedNewConfig).length > 0) {
      const oldConfig = await getConfig<any>('picBed')
      // Automatic import only fills missing aliases; saved manager records take precedence.
      const newConfig = { ...importedNewConfig, ...oldConfig }
      if (!(await saveConfig('picBed', newConfig))) return
      await manageStore.refreshConfig()
    }
  }

  await getAllConfigAliasArray()
}

async function goConfigPage() {
  const lang = (await getConfig(configPaths.settings.language)) || II18nLanguage.ZH_CN
  const url = `https://piclist.cn/${lang === II18nLanguage.EN ? 'en/' : ''}manage.html`
  window.electron.sendRPC(IRPCActionType.OPEN_URL, url)
}

function isImported(alias: string) {
  return Object.hasOwn(manageStore.config.picBed ?? {}, alias)
}

function initArray(arrayT: string | string[], defaultValue: string[]) {
  if (!Array.isArray(arrayT)) {
    arrayT = arrayT ? [arrayT] : defaultValue
  }
  return arrayT
}

function getPicBedAlias(name: string) {
  const mapping: Record<string, string> = {
    webdavplist: 'webdav',
    sftpplist: 'sftp',
    'aws-s3': 's3plist',
    'aws-s3-plist': 's3plist',
  }
  return mapping[name] || name
}

async function transUpToManage(config: IUploaderConfigListItem, picBedName: string, autoImportPicBed: string[]) {
  const alias = `${getPicBedAlias(picBedName)}-${config._configName ?? 'Default'}-imp`
  if (!autoImportPicBed.includes(picBedName) || isImported(alias)) return
  const commonConfig = {
    alias,
    picBedName,
    paging: true,
  }
  const resultMap: IStringKeyMap = {}
  switch (picBedName) {
    case 'smms':
      if (!config.token) return
      Object.assign(resultMap, {
        ...commonConfig,
        token: config.token,
      })
      break
    case 'aliyun':
      if (!config.accessKeyId || !config.accessKeySecret) return
      Object.assign(resultMap, {
        ...commonConfig,
        accessKeyId: config.accessKeyId,
        accessKeySecret: config.accessKeySecret,
        bucketName: '',
        baseDir: '/',
        itemsPerPage: 50,
        isAutoCustomUrl: !config.customUrl,
        transformedConfig: JSON.stringify(
          config.customUrl
            ? {
                [config.bucket]: {
                  customUrl: config.customUrl,
                },
              }
            : {},
        ),
      })
      break
    case 'qiniu':
      if (!config.accessKey || !config.secretKey) return
      Object.assign(resultMap, {
        ...commonConfig,
        accessKey: config.accessKey,
        secretKey: config.secretKey,
        bucketName: '',
        baseDir: '/',
        isAutoCustomUrl: false,
        transformedConfig: JSON.stringify({ [config.bucket]: { customUrl: config.url } }),
        itemsPerPage: 50,
      })
      break
    case 'tcyun':
      if (!config.secretId || !config.secretKey || config.version === 'v4') return
      Object.assign(resultMap, {
        ...commonConfig,
        secretId: config.secretId,
        secretKey: config.secretKey,
        bucketName: '',
        baseDir: '/',
        appId: config.appId,
        isAutoCustomUrl: !config.customUrl,
        transformedConfig: JSON.stringify(
          config.customUrl
            ? {
                [config.bucket]: {
                  customUrl: config.customUrl,
                },
              }
            : {},
        ),
        itemsPerPage: 50,
      })
      break
    case 'github':
      if (!config.token) return
      Object.assign(resultMap, {
        ...commonConfig,
        token: config.token,
        githubUsername: config.repo.split('/')[0],
        customUrl: '',
        proxy: '',
        itemsPerPage: 50,
      })
      break
    case 'upyun':
      if (!config.operator || !config.password) return
      Object.assign(resultMap, {
        ...commonConfig,
        operator: config.operator,
        password: config.password,
        bucketName: config.bucket,
        antiLeechToken: config.antiLeechToken,
        expireTime: config.expireTime,
        baseDir: '/',
        customUrl: config.url,
        transformedConfig: JSON.stringify({
          [config.bucket]: {
            customUrl: config.url,
            baseDir: '/',
            area: '',
            operator: config.operator,
            password: config.password,
          },
        }),
        itemsPerPage: 50,
      })
      break
    case 'webdavplist':
      if (!config.host) return
      Object.assign(resultMap, {
        ...commonConfig,
        endpoint: formatEndpoint(config.host, config.sslEnabled),
        username: config.username,
        password: config.password,
        bucketName: 'webdav',
        baseDir: config.path || '/',
        webPath: config.webpath || '',
        customUrl: config.customUrl || '',
        sslEnabled: !!config.sslEnabled,
        authType: config.authType || 'basic',
        proxy: '',
        transformedConfig: JSON.stringify({
          webdav: {
            operator: '',
            password: config.password,
            baseDir: config.path || '/',
            customUrl: config.customUrl || '',
            area: '',
          },
        }),
      })
      delete resultMap.paging
      break
    case 'local':
      if (!config.path) return
      Object.assign(resultMap, {
        ...commonConfig,
        baseDir: config.path,
        webPath: config.webpath || '',
        customUrl: config.customUrl || '',
        transformedConfig: JSON.stringify({
          local: {
            customUrl: config.customUrl || '',
            baseDir: config.path,
            webPath: config.webpath || '',
          },
        }),
      })
      delete resultMap.paging
      break
    case 'sftpplist':
      if (!config.host) return
      Object.assign(resultMap, {
        ...commonConfig,
        picBedName: 'sftp',
        host: config.host,
        port: config.port || 22,
        username: config.username,
        password: config.password,
        privateKey: config.privateKey,
        passphrase: config.passphrase,
        baseDir: config.uploadPath || '/',
        webPath: config.webPath || '',
        customUrl: config.customUrl || '',
        fileMode: config.fileMode || '0664',
        dirMode: config.dirMode || '0775',
        transformedConfig: JSON.stringify({
          sftp: {
            host: config.host,
            port: config.port || 22,
            username: config.username,
            password: config.password,
            privateKey: config.privateKey,
            passphrase: config.passphrase,
            baseDir: config.uploadPath || '/',
            webPath: config.webPath || '',
            customUrl: config.customUrl || '',
            fileMode: config.fileMode || '0664',
            dirMode: config.dirMode || '0775',
          },
        }),
      })
      delete resultMap.paging
      break
    case 'aws-s3':
    case 'aws-s3-plist':
      if (!config.accessKeyID || !config.secretAccessKey) return
      Object.assign(resultMap, {
        ...commonConfig,
        picBedName: 's3plist',
        accessKeyId: config.accessKeyID,
        secretAccessKey: config.secretAccessKey,
        endpoint: config.endpoint || '',
        region: config.region || '',
        customUrl: config.urlPrefix || '',
        bucketName: '',
        baseDir: '/',
        itemsPerPage: 50,
        proxy: '',
        sslEnabled: config.endpoint ? config.endpoint.startsWith('https') : false,
        aclForUpload: config.acl || 'auto',
        s3ForcePathStyle: config.pathStyleAccess,
        dogeCloudSupport: false,
        transformedConfig: JSON.stringify(
          config.urlPrefix
            ? {
                [config.bucketName]: {
                  customUrl: config.urlPrefix,
                },
              }
            : {},
        ),
      })
      break
    case 'imgur':
      if (!config.username || !config.accessToken) return
      Object.assign(resultMap, {
        ...commonConfig,
        imgurUserName: config.username,
        accessToken: config.accessToken,
        proxy: '',
      })
      delete resultMap.paging
      break
    default:
      return
  }
  importedNewConfig[alias] = resultMap
}

onMounted(async () => {
  try {
    await getCurrentConfigList()
  } finally {
    loading.value = false
  }
})

onBeforeRouteLeave(async () => {
  if (editing.value && editorRef.value) return editorRef.value.confirmDiscard()
  return true
})

onBeforeUnmount(() => clearTimeout(recentTimer))
</script>
