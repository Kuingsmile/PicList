<template>
  <div class="relative flex h-full w-full items-center justify-center">
    <div
      class="relative z-1 flex h-full w-full min-w-0 flex-col items-center justify-start rounded-xl border-none"
      :class="isFocusMode ? 'p-2' : 'gap-4 p-4'"
    >
      <!-- Header -->
      <header
        v-if="!isFocusMode"
        class="flex w-full flex-wrap items-center justify-between gap-4 rounded-2xl border border-border-secondary px-6 py-2 shadow-md max-md:p-5"
      >
        <div class="flex min-w-0 flex-1 items-center gap-4 p-1">
          <span
            class="flex h-[40px] w-[40px] shrink-0 items-center justify-center rounded-lg border border-border-secondary bg-bg-tertiary"
          >
            <img :src="`./assets/${currentPicBedName}.webp`" class="h-[24px] w-[24px] object-contain" alt="" />
          </span>
          <div class="min-w-0">
            <h1 class="m-0 truncate text-2xl font-semibold tracking-tight text-main" :title="currentAlias">
              {{ currentAlias }}
            </h1>
            <p class="m-0 flex min-w-0 items-center gap-1.5 text-sm text-secondary">
              <span class="shrink-0">{{ providerName }}</span>
              <template v-if="currentPageInMain === 'bucket' && currentSelectedBucket">
                <span class="text-tertiary" aria-hidden="true">·</span>
                <span class="truncate" :title="currentSelectedBucket">{{ currentSelectedBucket }}</span>
              </template>
            </p>
          </div>
        </div>
        <!-- Narrow windows drop the labels so the account name keeps its room. -->
        <div class="flex flex-wrap gap-3 max-lg:gap-2">
          <CustomButton
            v-for="action in headerActions"
            :key="action.key"
            v-tooltip="compactHeader ? action.label : ''"
            type="secondary"
            :icon="action.icon"
            :text="action.label"
            text-class="max-lg:sr-only"
            class="max-lg:px-2.5"
            @click="action.run"
          />
        </div>
      </header>

      <div class="flex min-h-0 w-full flex-1">
        <!-- Bucket rail -->
        <nav
          v-if="!isFocusMode"
          class="flex min-h-0 shrink-0 flex-col overflow-hidden rounded-2xl border border-border-secondary shadow-md"
          :style="{ width: `${railCollapsed ? RAIL_COLLAPSED_WIDTH : sidebarWidth}px` }"
          :aria-label="listTitle"
        >
          <div class="flex items-center gap-1 pt-3 pb-2" :class="railCollapsed ? 'justify-center px-2' : 'px-3'">
            <template v-if="!railCollapsed">
              <p class="m-0 min-w-0 flex-1 truncate text-[11px] font-semibold tracking-wider text-tertiary uppercase">
                {{ listTitle }}
                <span v-if="bucketNameList.length" class="ml-1 tabular-nums">{{ bucketNameList.length }}</span>
              </p>
              <button
                v-tooltip="t('pages.manage.main.refreshList')"
                type="button"
                :class="railIconButtonClass"
                :disabled="isLoadingBucketList"
                :aria-label="t('pages.manage.main.refreshList')"
                @click="getBucketList()"
              >
                <RefreshCwIcon
                  :size="14"
                  :class="{ 'animate-spin motion-reduce:animate-none': isLoadingBucketList }"
                  aria-hidden="true"
                />
              </button>
              <button
                v-if="canCreateBucket"
                v-tooltip="t('pages.manage.main.newBucket')"
                type="button"
                :class="railIconButtonClass"
                :aria-label="t('pages.manage.main.newBucket')"
                @click="openNewBucketDrawer"
              >
                <PlusIcon :size="15" aria-hidden="true" />
              </button>
            </template>
            <button
              v-tooltip="{ content: railToggleLabel, placement: railCollapsed ? 'right' : 'bottom' }"
              type="button"
              :class="railIconButtonClass"
              :aria-label="railToggleLabel"
              :aria-expanded="!railCollapsed"
              @click="railCollapsed = !railCollapsed"
            >
              <component :is="railCollapsed ? PanelLeftOpenIcon : PanelLeftCloseIcon" :size="15" aria-hidden="true" />
            </button>
          </div>

          <div v-if="!railCollapsed && bucketNameList.length > 5" class="relative mx-2 mb-2 flex items-center">
            <SearchIcon :size="14" class="pointer-events-none absolute left-2.5 text-secondary" aria-hidden="true" />
            <input
              v-model="bucketSearchText"
              type="search"
              class="h-[32px] w-full rounded-lg border border-border bg-bg-secondary pr-7 pl-8 text-sm text-main transition-all duration-fast ease-apple placeholder:text-secondary focus:border-accent focus:outline-none focus-visible:focus-ring [&::-webkit-search-cancel-button]:hidden"
              :placeholder="t('pages.manage.main.filterPlaceholder')"
              :aria-label="t('pages.manage.main.filterPlaceholder')"
            />
            <button
              v-if="bucketSearchText"
              type="button"
              class="absolute right-1.5 flex h-[20px] w-[20px] cursor-pointer items-center justify-center rounded-full text-secondary hover:bg-accent/10 hover:text-main focus-visible:focus-ring"
              :aria-label="t('common.clear')"
              @click="bucketSearchText = ''"
            >
              <XIcon :size="12" aria-hidden="true" />
            </button>
          </div>

          <div class="no-scrollbar min-h-0 flex-1 overflow-y-auto px-2 pb-2">
            <div
              v-if="isLoadingBucketList"
              class="flex flex-col gap-1"
              role="status"
              :aria-label="t('pages.manage.main.loading')"
            >
              <div
                v-for="n in 5"
                :key="n"
                class="flex h-[36px] items-center gap-2.5 rounded-lg motion-safe:animate-pulse"
                :class="railCollapsed ? 'justify-center' : 'px-2.5'"
                aria-hidden="true"
              >
                <div class="h-[16px] w-[16px] rounded-sm bg-bg-tertiary" />
                <div
                  v-if="!railCollapsed"
                  class="h-3 flex-1 rounded-sm bg-bg-tertiary"
                  :style="{ maxWidth: `${90 - n * 9}%` }"
                />
              </div>
            </div>
            <p v-else-if="!railCollapsed && bucketNameList.length === 0" class="m-0 px-2.5 py-3 text-xs text-tertiary">
              {{ t('pages.manage.main.noBuckets') }}
            </p>
            <p v-else-if="!railCollapsed && railBuckets.length === 0" class="m-0 px-2.5 py-3 text-xs text-tertiary">
              {{ t('pages.manage.main.noMatch') }}
            </p>
            <ul v-else-if="railBuckets.length" class="m-0 flex list-none flex-col gap-0.5 p-0">
              <li v-for="item in railBuckets" :key="item">
                <!-- Collapsed, every bucket shares one icon, so its initial tells them apart. -->
                <button
                  v-tooltip="{ content: railCollapsed ? item : '', placement: 'right' }"
                  type="button"
                  :class="[railItemClass(isBucketActive(item)), { 'justify-center px-0!': railCollapsed }]"
                  :title="railCollapsed ? undefined : item"
                  :aria-label="railCollapsed ? item : undefined"
                  :aria-current="isBucketActive(item) ? 'page' : undefined"
                  @click="handleSelectMenu(item)"
                >
                  <span
                    v-if="railCollapsed"
                    class="flex h-[20px] w-[20px] items-center justify-center text-sm leading-none font-semibold"
                    aria-hidden="true"
                  >
                    {{ bucketInitial(item) }}
                  </span>
                  <template v-else>
                    <component :is="bucketIcon" :size="16" class="shrink-0" aria-hidden="true" />
                    <span class="min-w-0 flex-1 truncate">{{ item }}</span>
                  </template>
                </button>
              </li>
            </ul>
          </div>

          <div class="border-t border-border-secondary p-2">
            <button
              v-tooltip="{ content: railCollapsed ? t('pages.manage.main.settings') : '', placement: 'right' }"
              type="button"
              :class="[railItemClass(currentPageInMain === 'setting'), { 'justify-center px-0!': railCollapsed }]"
              :aria-label="railCollapsed ? t('pages.manage.main.settings') : undefined"
              :aria-current="currentPageInMain === 'setting' ? 'page' : undefined"
              @click="openSettingPage"
            >
              <SettingsIcon :size="16" class="shrink-0" aria-hidden="true" />
              <span v-if="!railCollapsed" class="min-w-0 flex-1 truncate">{{ t('pages.manage.main.settings') }}</span>
            </button>
          </div>
        </nav>

        <!-- A collapsed rail has nothing to resize; keep the gutter. -->
        <div v-if="!isFocusMode && railCollapsed" class="w-4 shrink-0" aria-hidden="true" />
        <!-- Resize handle, sits in the gutter between the rail and the content -->
        <div
          v-else-if="!isFocusMode"
          class="group/resize flex w-4 shrink-0 cursor-col-resize justify-center py-4 focus-visible:outline-none"
          role="separator"
          aria-orientation="vertical"
          :aria-valuenow="sidebarWidth"
          :aria-valuemin="SIDEBAR_MIN"
          :aria-valuemax="SIDEBAR_MAX"
          tabindex="0"
          @mousedown="startResize"
          @keydown="handleResizeKeydown"
        >
          <span
            class="h-full w-[2px] rounded-full transition-colors duration-fast group-hover/resize:bg-accent/60 group-focus-visible/resize:bg-accent"
            :class="isResizing ? 'bg-accent' : 'bg-transparent'"
          />
        </div>

        <!-- Content -->
        <section
          class="flex min-h-0 min-w-0 flex-1 flex-col overflow-hidden rounded-2xl border border-border-secondary shadow-md"
        >
          <BucketPage v-if="currentPageInMain === 'bucket'" v-model:fullscreen="isFocusMode" :config-map="configMap" />
          <ManageSetting v-else-if="currentPageInMain === 'setting'" embedded />

          <div
            v-else-if="isLoadingBucketList"
            class="flex h-full flex-col items-center justify-center gap-3"
            role="status"
          >
            <LoaderCircleIcon
              :size="28"
              class="animate-spin text-accent motion-reduce:animate-none"
              aria-hidden="true"
            />
            <span class="text-sm text-secondary">{{ t('pages.manage.main.loading') }}</span>
          </div>

          <div
            v-else-if="bucketNameList.length === 0"
            class="flex h-full flex-col items-center justify-center gap-4 px-6 py-12 text-center"
          >
            <div
              class="inline-flex h-[72px] w-[72px] items-center justify-center rounded-2xl border-2 border-dashed border-border bg-surface-elevated text-tertiary"
            >
              <component :is="bucketIcon" :size="32" aria-hidden="true" />
            </div>
            <div>
              <h2 class="mb-2 text-lg font-semibold text-main">{{ t('pages.manage.main.noBuckets') }}</h2>
              <p class="m-0 max-w-[420px] text-sm text-secondary">
                {{ t('pages.manage.main.noBucketsDesc', { name: listTitle }) }}
              </p>
            </div>
            <div class="flex flex-wrap justify-center gap-3">
              <CustomButton
                type="secondary"
                :icon="RefreshCwIcon"
                :text="t('pages.manage.main.refreshList')"
                @click="getBucketList()"
              />
              <CustomButton
                v-if="canCreateBucket"
                :icon="PlusIcon"
                :text="t('pages.manage.main.newBucket')"
                @click="openNewBucketDrawer"
              />
            </div>
          </div>

          <div v-else class="flex h-full flex-col items-center justify-center gap-4 px-6 py-12 text-center">
            <div
              class="inline-flex h-[72px] w-[72px] items-center justify-center rounded-2xl border-2 border-border bg-surface-elevated text-accent"
            >
              <MousePointerClickIcon :size="32" aria-hidden="true" />
            </div>
            <div>
              <h2 class="mb-2 text-lg font-semibold text-main">
                {{ t('pages.manage.main.selectPrompt', { name: listTitle }) }}
              </h2>
              <p class="m-0 max-w-[420px] text-sm text-secondary">
                {{ t('pages.manage.main.selectPromptDesc', { count: bucketNameList.length }) }}
              </p>
            </div>
          </div>
        </section>
      </div>
    </div>

    <!-- Switch account -->
    <CustomModal
      v-model:visible="picBedSwitchDialogVisible"
      :title="t('pages.manage.main.switchAccount')"
      :description="t('pages.manage.main.switchAccountDesc')"
      width="680px"
      height="auto"
      max-height="80vh"
    >
      <div class="flex flex-col gap-3 p-5">
        <div v-if="accountList.length > 8" class="relative flex items-center">
          <SearchIcon :size="16" class="pointer-events-none absolute left-3 text-secondary" aria-hidden="true" />
          <input
            v-model="accountSearchText"
            type="search"
            class="h-[36px] w-full rounded-lg border border-border bg-bg-secondary pr-3 pl-9 text-sm text-main transition-all duration-fast ease-apple placeholder:text-secondary focus:border-accent focus:outline-none focus-visible:focus-ring"
            :placeholder="t('pages.manage.main.filterPlaceholder')"
            :aria-label="t('pages.manage.main.filterPlaceholder')"
          />
        </div>
        <ul class="m-0 grid list-none grid-cols-[repeat(auto-fill,minmax(200px,1fr))] gap-3 p-0">
          <li v-for="account in filteredAccountList" :key="account.alias">
            <button
              type="button"
              class="flex w-full cursor-pointer items-center gap-3 rounded-xl border bg-bg-secondary p-3 text-left shadow-sm transition-all duration-fast ease-apple hover:-translate-y-px hover:border-accent hover:shadow-md focus-visible:focus-ring"
              :class="
                account.alias === currentAlias ? 'border-accent ring-2 ring-accent/25' : 'border-border-secondary'
              "
              :aria-current="account.alias === currentAlias ? 'true' : undefined"
              @click="switchPicBed(account.alias)"
            >
              <span
                class="flex h-[40px] w-[40px] shrink-0 items-center justify-center rounded-lg border border-border-secondary bg-bg-tertiary"
              >
                <img :src="`./assets/${account.picBedName}.webp`" class="h-[24px] w-[24px] object-contain" alt="" />
              </span>
              <span class="flex min-w-0 flex-1 flex-col">
                <span class="truncate text-sm font-semibold text-main" :title="account.alias">{{ account.alias }}</span>
                <span class="truncate text-xs text-secondary">
                  {{ supportedPicBedList[account.picBedName]?.name ?? account.picBedName }}
                </span>
              </span>
              <CheckIcon v-if="account.alias === currentAlias" :size="18" class="shrink-0 text-accent" />
            </button>
          </li>
        </ul>
      </div>
      <template #footer>
        <CustomButton
          type="secondary"
          :icon="ArrowLeftIcon"
          :text="t('pages.manage.main.allAccounts')"
          @click="backToAccounts"
        />
      </template>
    </CustomModal>

    <!-- New bucket -->
    <CustomModal
      v-model:visible="bucketDrawerVisible"
      :title="t('pages.manage.main.newBucket')"
      :description="`${providerName} · ${currentAlias}`"
      width="600px"
      height="auto"
    >
      <div v-if="canCreateBucket" class="flex flex-col gap-4 p-5">
        <template v-for="option in newBucketConfig[currentPicBedName].options" :key="option">
          <SettingCard :p1="newBucketConfig[currentPicBedName].configOptions[option].component === 'switch'">
            <CustomInput
              v-if="newBucketConfig[currentPicBedName].configOptions[option].component === 'input'"
              v-model.trim="newBucketConfigResult[currentPicBedName + '.' + option]"
              type="text"
              :title="newBucketConfig[currentPicBedName].configOptions[option].description"
              :placeholder="newBucketConfig[currentPicBedName].configOptions[option].placeholder"
            >
              <template v-if="currentPicBedName === 'tcyun'" #input-extra>
                <span
                  class="absolute top-0.5 right-0.5 bottom-0.5 flex cursor-not-allowed items-center rounded-r-md border-l border-border bg-bg-tertiary px-3 font-mono text-sm text-secondary"
                  >{{ '-' + currentPagePicBedConfig.appId }}</span
                >
              </template>
            </CustomInput>
            <CustomSwitch
              v-if="newBucketConfig[currentPicBedName].configOptions[option].component === 'switch'"
              v-model="newBucketConfigResult[currentPicBedName + '.' + option]"
              :title="newBucketConfig[currentPicBedName].configOptions[option].description"
              small
              no-border
            />
            <SingleSelect
              v-if="newBucketConfig[currentPicBedName].configOptions[option].component === 'select'"
              v-model="newBucketConfigResult[currentPicBedName + '.' + option]"
              :title="newBucketConfig[currentPicBedName].configOptions[option].description"
              :key-list="Object.keys(newBucketConfig[currentPicBedName].configOptions[option].options)"
              :fronticon="false"
            >
              <template #item="{ item }">
                {{ newBucketConfig[currentPicBedName].configOptions[option].options[item] }}
              </template>
            </SingleSelect>
          </SettingCard>
        </template>
      </div>
      <template #footer>
        <CustomButton type="secondary" :text="t('common.cancel')" @click="bucketDrawerVisible = false" />
        <CustomButton
          :icon="PlusIcon"
          :text="t('common.submit')"
          :loading="isCreatingBucket"
          @click="createNewBucket(currentPicBedName)"
        />
      </template>
    </CustomModal>
  </div>
</template>

<script lang="ts" setup>
import {
  ArrowLeftIcon,
  ArrowLeftRightIcon,
  CheckIcon,
  DatabaseIcon,
  ExternalLinkIcon,
  FolderGit2Icon,
  HardDriveIcon,
  ImagesIcon,
  LoaderCircleIcon,
  MousePointerClickIcon,
  PanelLeftCloseIcon,
  PanelLeftOpenIcon,
  PlusIcon,
  RefreshCwIcon,
  SearchIcon,
  SettingsIcon,
  XIcon,
} from '@lucide/vue'
import { useLocalStorage, useMediaQuery } from '@vueuse/core'
import { computed, onBeforeMount, onBeforeUnmount, reactive, ref, shallowRef, watch } from 'vue'
import { useI18n } from 'vue-i18n'
import { useRoute, useRouter } from 'vue-router'

import CustomButton from '@/components/common/CustomButton.vue'
import CustomInput from '@/components/common/CustomInput.vue'
import CustomModal from '@/components/common/CustomModal.vue'
import CustomSwitch from '@/components/common/CustomSwitch.vue'
import SettingCard from '@/components/common/SettingCard.vue'
import SingleSelect from '@/components/common/SingleSelect.vue'
import useMessage from '@/composables/useMessage'
import BucketPage from '@/manage/pages/BucketPage.vue'
import ManageSetting from '@/manage/pages/ManageSetting.vue'
import { useManageStore } from '@/manage/stores/manageStore'
import { getSupportedPicBedList } from '@/manage/utils/constants'
import { ListingSession } from '@/manage/utils/listingSession'
import { getNewBucketConfig } from '@/manage/utils/newBucketConfig'
import { IRPCActionType } from '#/constants/rpcActions'
import type { ListingResult } from '#/listing'

const SIDEBAR_MIN = 180
const SIDEBAR_MAX = 400
const RAIL_COLLAPSED_WIDTH = 56

const { t } = useI18n()
const supportedPicBedList = computed(() => getSupportedPicBedList(t))
const newBucketConfig = computed(() => getNewBucketConfig(t))
const manageStore = useManageStore() as any
const route = useRoute()
const router = useRouter()
const message = useMessage()
const currentPageInMain = ref<'bucket' | 'setting' | 'empty'>('empty')
const configMap = ref<any>(null)
const bucketListings = new ListingSession(window.electron)
let unmounted = false
let refreshTimer: ReturnType<typeof setTimeout> | undefined
let stopResizing: (() => void) | undefined

const currentAlias = ref(route.query.alias as string)
const currentPicBedName = ref(route.query.picBedName as string)

const storedSidebarWidth = useLocalStorage('manage-main-sidebar-width', 220)
const sidebarWidth = computed({
  get: () => Math.max(SIDEBAR_MIN, Math.min(SIDEBAR_MAX, Number(storedSidebarWidth.value) || 220)),
  set: value => {
    storedSidebarWidth.value = Math.max(SIDEBAR_MIN, Math.min(SIDEBAR_MAX, Math.round(value)))
  },
})
const isResizing = ref(false)
const isFocusMode = ref(false)
const railCollapsed = useLocalStorage('manage-main-rail-collapsed', false)
// Matches Tailwind's `lg` breakpoint, below which the header buttons show icons only.
const compactHeader = useMediaQuery('(max-width: 1023.98px)')
// The last opened bucket per account, so returning to an account reopens it.
const lastBuckets = useLocalStorage<Record<string, string>>('manage-main-last-bucket', {})

const allPicBedConfigure = shallowRef<IStringKeyMap>(JSON.parse(route.query.allPicBedConfigure as string))
const currentPagePicBedConfig = shallowRef<IStringKeyMap>(JSON.parse(route.query.config as string))

const newBucketConfigResult: IStringKeyMap = reactive({})
const bucketList = ref({} as IStringKeyMap)
const currentSelectedBucket = ref('')
const bucketNameList = ref([] as string[])
const bucketSearchText = ref('')
const accountSearchText = ref('')

const isLoadingBucketList = ref(false)
const isCreatingBucket = ref(false)
const bucketDrawerVisible = ref(false)
const picBedSwitchDialogVisible = ref(false)

const filteredBucketNameList = computed(() => {
  const query = bucketSearchText.value.trim().toLowerCase()
  if (!query) return bucketNameList.value
  return bucketNameList.value.filter(name => name.toLowerCase().includes(query))
})

// The filter box is hidden while the rail is collapsed, so it must not hide buckets there.
const railBuckets = computed(() => (railCollapsed.value ? bucketNameList.value : filteredBucketNameList.value))

const railToggleLabel = computed(() =>
  railCollapsed.value ? t('pages.manage.main.expandRail') : t('pages.manage.main.collapseRail'),
)

const headerActions = computed(() => [
  { key: 'accounts', icon: ArrowLeftIcon, label: t('pages.manage.main.allAccounts'), run: backToAccounts },
  {
    key: 'switch',
    icon: ArrowLeftRightIcon,
    label: t('pages.manage.main.switchAccount'),
    run: () => (picBedSwitchDialogVisible.value = true),
  },
  { key: 'site', icon: ExternalLinkIcon, label: t('pages.manage.main.openPicBedUrl'), run: openPicBedUrl },
])

const accountList = computed(() =>
  Object.entries(allPicBedConfigure.value).map(([alias, config]) => ({
    alias,
    picBedName: (config as IStringKeyMap).picBedName as string,
  })),
)

const filteredAccountList = computed(() => {
  const query = accountSearchText.value.trim().toLowerCase()
  if (!query) return accountList.value
  return accountList.value.filter(
    account => account.alias.toLowerCase().includes(query) || account.picBedName.toLowerCase().includes(query),
  )
})

const providerName = computed(() => supportedPicBedList.value[currentPicBedName.value]?.name ?? currentPicBedName.value)

watch(
  () => route.fullPath,
  async () => {
    if (route.path !== '/main-page/manage-main-page') return
    currentAlias.value = route.query.alias as string
    currentPicBedName.value = route.query.picBedName as string
    allPicBedConfigure.value = JSON.parse(route.query.allPicBedConfigure as string)
    currentPagePicBedConfig.value = JSON.parse(route.query.config as string)
    await getBucketList()
  },
  { flush: 'sync' },
)

watch(currentPageInMain, page => {
  if (page !== 'bucket') isFocusMode.value = false
})

const urlMap = computed<IStringKeyMap>(() => ({
  aliyun: 'https://oss.console.aliyun.com',
  github: 'https://github.com',
  imgur: 'https://imgur.com',
  local: 'https://piclist.cn',
  qiniu: 'https://portal.qiniu.com',
  s3plist: 'https://aws.amazon.com/cn/s3/',
  sftp: 'https://github.com/imba97/picgo-plugin-sftp-uploader',
  smms: 'https://s.ee',
  tcyun: 'https://console.cloud.tencent.com/cos',
  upyun: 'https://console.upyun.com',
  webdavplist:
    getDomainFromEndpoint(currentPagePicBedConfig.value.endpoint || '') ||
    'https://baike.baidu.com/item/WebDAV/4610909',
}))

const showNewIconList = ['aliyun', 'qiniu', 'tcyun', 's3plist']
const canCreateBucket = computed(
  () => showNewIconList.includes(currentPicBedName.value) && !!newBucketConfig.value[currentPicBedName.value],
)

const listTitle = computed(() => {
  switch (currentPicBedName.value) {
    case 'aliyun':
    case 'qiniu':
    case 'tcyun':
    case 'upyun':
    case 's3plist':
      return t('pages.manage.main.bucket')
    case 'smms':
    case 'imgur':
      return t('pages.manage.main.gallery')
    case 'github':
      return t('pages.manage.main.repo')
    default:
      return t('pages.manage.main.storage')
  }
})

const bucketIcon = computed(() => {
  switch (currentPicBedName.value) {
    case 'github':
      return FolderGit2Icon
    case 'smms':
    case 'imgur':
      return ImagesIcon
    case 'local':
    case 'sftp':
    case 'webdavplist':
      return HardDriveIcon
    default:
      return DatabaseIcon
  }
})

const railIconButtonClass =
  'flex h-[26px] w-[26px] shrink-0 cursor-pointer items-center justify-center rounded-md text-secondary transition-all duration-fast ease-apple hover:bg-accent/10 hover:text-accent focus-visible:focus-ring disabled:cursor-not-allowed disabled:opacity-50'

function railItemClass(active: boolean) {
  return [
    'flex w-full cursor-pointer items-center gap-2.5 rounded-lg px-2.5 py-2 text-left text-sm font-medium transition-all duration-fast ease-apple focus-visible:focus-ring',
    active ? 'bg-accent text-white shadow-sm' : 'text-secondary hover:bg-accent/10 hover:text-main',
  ]
}

function bucketInitial(bucketName: string) {
  return (bucketName.match(/[\p{L}\p{N}]/u)?.[0] ?? bucketName.charAt(0)).toLocaleUpperCase()
}

function isBucketActive(bucketName: string) {
  return currentPageInMain.value === 'bucket' && bucketName === currentSelectedBucket.value
}

const openPicBedUrl = () =>
  window.electron.sendRPC(IRPCActionType.OPEN_URL, urlMap.value[currentPagePicBedConfig.value.picBedName])

function openNewBucketDrawer() {
  if (!canCreateBucket.value) return
  const picBedName = currentPicBedName.value
  const resultMap = getNewBucketConfigResult(picBedName)
  for (const key of Object.keys(resultMap)) {
    newBucketConfigResult[`${picBedName}.${key}`] = resultMap[key]
  }
  bucketDrawerVisible.value = true
}

function getDomainFromEndpoint(endpoint: string): string {
  try {
    const url = new URL(endpoint)
    return url.origin
  } catch (_e) {
    console.error('Invalid endpoint URL:', endpoint)
    return endpoint
  }
}

function getNewBucketConfigResult(picBedName: string): IStringKeyMap {
  const configOptions = newBucketConfig.value[picBedName].configOptions
  return Object.keys(configOptions).reduce((result, key) => {
    const resultKey = `${picBedName}.${key}`
    const defaultValue = configOptions[key].default
    const resultValue = newBucketConfigResult[resultKey]
    const value = typeof resultValue === 'string' ? resultValue.trim() : resultValue

    result[key] = value === '' || value === undefined || value === null ? (defaultValue ?? '') : value

    return result
  }, {} as IStringKeyMap)
}

async function createNewBucket(picBedName: string) {
  const alias = currentAlias.value
  const configOptions = newBucketConfig.value[picBedName].configOptions
  const resultMap = getNewBucketConfigResult(picBedName)

  try {
    for (const key of Object.keys(configOptions)) {
      const option = configOptions[key]
      const value = resultMap[key]
      const rules = option.rule || []
      const requiredRule = rules.find((rule: { required?: boolean }) => rule.required)
      if ((option.required || requiredRule) && value === '') {
        throw new Error(requiredRule?.message || t('pages.configForm.fieldRequired', { name: option.description }))
      }
      for (const rule of rules) {
        if (rule.validator) {
          await new Promise<void>((resolve, reject) => {
            rule.validator(rule, value, (error?: Error) => (error ? reject(error) : resolve()))
          })
        }
      }
    }
  } catch (error) {
    message.error(error instanceof Error ? error.message : t('pages.manage.main.createFailed'))
    return
  }

  if (unmounted || alias !== currentAlias.value || picBedName !== currentPicBedName.value) return
  if (picBedName === 'tcyun') {
    resultMap.BucketName = `${resultMap.BucketName}-${currentPagePicBedConfig.value.appId}`
  }
  isCreatingBucket.value = true
  return window.electron
    .triggerRPC<ICreateBucketResult>(IRPCActionType.MANAGE_CREATE_BUCKET, alias, resultMap)
    .then(result => {
      if (unmounted || alias !== currentAlias.value) return
      if (result === true) {
        message.success(t('pages.manage.main.createSuccess'))
        bucketDrawerVisible.value = false
        if (refreshTimer) clearTimeout(refreshTimer)
        refreshTimer = setTimeout(() => {
          if (!unmounted && alias === currentAlias.value) void getBucketList()
        }, 2000)
      } else {
        const errorKeys = {
          create: 'pages.manage.main.createFailedDetail',
          'public-access': 'pages.manage.main.createPublicAccessFailed',
          acl: 'pages.manage.main.createAclFailed',
        }
        message.error(
          result && typeof result === 'object'
            ? t(errorKeys[result.stage], { error: result.error })
            : t('pages.manage.main.createFailed'),
        )
      }
    })
    .finally(() => {
      isCreatingBucket.value = false
    })
}

async function getBucketList() {
  if (unmounted) return
  const request = bucketListings.begin({
    accountId: currentAlias.value,
    provider: currentPicBedName.value,
    bucketName: '',
    prefix: '',
    kind: 'buckets',
  })
  // Unmount the previous account's file consumer as soon as the account changes.
  if (configMap.value?.alias !== request.accountId) {
    currentPageInMain.value = 'empty'
    configMap.value = null
    currentSelectedBucket.value = ''
    bucketSearchText.value = ''
  }
  bucketList.value = {}
  bucketNameList.value = []
  isLoadingBucketList.value = true

  try {
    const result = await window.electron.triggerRPC<ListingResult>(
      IRPCActionType.MANAGE_GET_BUCKET_LIST,
      request.accountId,
      request,
    )
    if (!result) throw new Error('Missing listing response')
    if (!bucketListings.accept(request, result)) return
    result.fullList.forEach((item: any) => {
      bucketList.value[item.Name] = item
      bucketNameList.value.push(item.Name)
    })
    restoreSelection()
  } catch {
    if (bucketListings.isCurrent(request)) bucketListings.complete(request)
  } finally {
    if (bucketListings.isCurrent(request)) isLoadingBucketList.value = false
  }
}

function restoreSelection() {
  if (currentPageInMain.value !== 'empty' || currentSelectedBucket.value) return
  const remembered = lastBuckets.value[currentAlias.value]
  const names = bucketNameList.value
  const target = remembered && names.includes(remembered) ? remembered : names.length === 1 ? names[0] : ''
  if (target) handleSelectMenu(target)
}

function transPathToUnix(filePath: string | undefined) {
  if (!filePath) return ''
  return window.electron.platform === 'win32'
    ? filePath
        .split(window.node.path.sep)
        .join(window.node.path.posix.sep)
        .replace(/^\/+|\/+$/g, '')
    : filePath.replace(/^\/+|\/+$/g, '')
}

function handleSelectMenu(bucketName: string) {
  const currentPicBedConfig = manageStore.config.picBed[currentAlias.value]
  const transformedConfig = JSON.parse(currentPicBedConfig.transformedConfig ?? '{}')

  let prefix = transformedConfig[bucketName]?.baseDir || '/'
  const cpicBedName = currentPicBedConfig.picBedName ?? currentPicBedName.value
  if (cpicBedName === 'local') {
    prefix = `/${transPathToUnix(prefix)}/`
  } else {
    prefix = prefix.startsWith('/') ? prefix : `/${prefix}`
    prefix = prefix.endsWith('/') ? prefix : `${prefix}/`
  }

  const configMapT = {
    prefix,
    bucketName,
    customUrl:
      transformedConfig[bucketName]?.customUrl ||
      (cpicBedName === 's3plist' ? currentPicBedConfig.customUrl : '') ||
      '',
    picBedName: cpicBedName,
    alias: currentAlias.value,
    bucketConfig: bucketList.value[bucketName],
    cdnUrl: currentPicBedConfig.customUrl,
    baseDir: prefix,
    webPath: currentPicBedConfig.webPath || '',
  }
  currentSelectedBucket.value = bucketName
  lastBuckets.value = { ...lastBuckets.value, [currentAlias.value]: bucketName }
  configMap.value = configMapT
  currentPageInMain.value = 'bucket'
}

function backToAccounts() {
  picBedSwitchDialogVisible.value = false
  router.push({ path: '/main-page/manage-login-page' })
}

function switchPicBed(picBedAlias: string) {
  picBedSwitchDialogVisible.value = false
  accountSearchText.value = ''
  if (picBedAlias === currentAlias.value) return
  const config = allPicBedConfigure.value[picBedAlias]
  // The route watcher picks up the new account and reloads its list.
  router.replace({
    path: '/main-page/manage-main-page',
    query: {
      alias: picBedAlias,
      picBedName: config.picBedName,
      config: JSON.stringify(config),
      allPicBedConfigure: JSON.stringify(allPicBedConfigure.value),
    },
  })
}

function openSettingPage() {
  currentPageInMain.value = 'setting'
}

function startResize(event: MouseEvent) {
  if (event.button !== 0) return
  event.preventDefault()
  stopResizing?.()
  isResizing.value = true
  const startX = event.clientX
  const startWidth = sidebarWidth.value

  const handleMouseMove = (e: MouseEvent) => {
    if (!isResizing.value) return
    sidebarWidth.value = startWidth + e.clientX - startX
  }

  const handleMouseUp = () => {
    isResizing.value = false
    document.removeEventListener('mousemove', handleMouseMove)
    document.removeEventListener('mouseup', handleMouseUp)
    document.body.style.cursor = ''
    document.body.style.userSelect = ''
    stopResizing = undefined
  }

  document.addEventListener('mousemove', handleMouseMove)
  document.addEventListener('mouseup', handleMouseUp)
  stopResizing = handleMouseUp
  document.body.style.cursor = 'col-resize'
  document.body.style.userSelect = 'none'
}

function handleResizeKeydown(event: KeyboardEvent) {
  const step = event.shiftKey ? 40 : 10
  if (event.key === 'ArrowLeft') sidebarWidth.value -= step
  else if (event.key === 'ArrowRight') sidebarWidth.value += step
  else if (event.key === 'Home') sidebarWidth.value = SIDEBAR_MIN
  else if (event.key === 'End') sidebarWidth.value = SIDEBAR_MAX
  else return
  event.preventDefault()
}

onBeforeMount(() => {
  getBucketList()
})

onBeforeUnmount(() => {
  unmounted = true
  bucketListings.dispose()
  if (refreshTimer) clearTimeout(refreshTimer)
  stopResizing?.()
})
</script>
