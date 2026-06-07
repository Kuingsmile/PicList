<template>
  <div class="relative flex h-full w-full items-center justify-center">
    <div class="relative z-1 flex h-full w-full flex-col items-center justify-start gap-4 rounded-xl border-none p-4">
      <div
        class="flex w-full items-center justify-between gap-4 overflow-visible rounded-2xl border border-border-secondary px-6 py-2 shadow-md max-md:items-stretch max-md:p-5"
      >
        <div class="flex flex-1 flex-wrap items-center gap-4 p-1">
          <Cloud :size="24" class="text-accent" />
          <div>
            <h1 class="m-0 text-2xl font-semibold tracking-tight text-main">{{ t('pages.manage.login.title') }}</h1>
            <p class="m-0 text-sm text-secondary">
              {{ sortedAllConfigAliasList.length }} {{ t('pages.manage.login.savedConfigs') }}
            </p>
          </div>
        </div>
        <div class="flex flex-wrap gap-3 overflow-visible">
          <CustomButton
            type="secondary"
            :icon="RefreshCwIcon"
            :text="t('pages.manage.login.refresh')"
            @click="refreshConfigs"
          />
          <CustomButton type="secondary" :icon="BookOpen" :text="t('pages.settings.docs')" @click="goConfigPage" />
          <CustomButton
            type="primary"
            :icon="Settings2"
            :text="t('pages.manage.main.settings')"
            @click="openBucketPageSetting"
          />
        </div>
      </div>

      <!-- Navigation Tabs -->
      <div
        class="flex w-full items-center justify-between gap-2 rounded-2xl border border-border-secondary p-2 shadow-md max-md:items-stretch"
      >
        <div class="flex-1 overflow-hidden p-2">
          <div class="flex w-full flex-wrap items-center gap-2">
            <button
              v-for="item in tabItems"
              :key="item.key"
              class="transition-al flex min-w-fit flex-none cursor-pointer items-center gap-2 rounded-md border border-border-secondary bg-bg-secondary px-4 py-2 text-sm font-semibold whitespace-nowrap text-secondary no-underline duration-200 ease-apple hover:border-border hover:bg-accent/30 hover:text-white [.active]:border-accent [.active]:bg-accent [.active]:text-white"
              :class="{ active: activePlatform === item.key }"
              @click="handleTabChange(item.key)"
            >
              <FolderIcon v-if="item.key === 'login'" :size="16" />
              <img
                v-else
                :src="`./assets/${item.key}.webp`"
                class="h-[16px] w-[16px] object-contain"
                :alt="item.name"
              />
              <span>{{ item.name }}</span>
            </button>
          </div>
        </div>
      </div>

      <!-- Content Area -->
      <div
        class="no-scrollbar flex min-h-[500px] w-full flex-1 flex-col flex-wrap items-center justify-center gap-2 overflow-auto rounded-2xl border border-border-secondary shadow-md"
      >
        <div class="no-scrollbar h-full w-full flex-1 overflow-auto rounded-2xl border-none">
          <!-- Main Config List Tab -->
          <div v-if="activePlatform === 'login'" class="h-full w-full p-4">
            <div
              v-if="sortedAllConfigAliasList.length === 0"
              class="flex h-full w-full flex-col items-center justify-center p-4"
            >
              <div class="mb-2 text-accent/50">
                <DatabaseIcon :size="48" />
              </div>
              <h3 class="mb-2 text-lg font-semibold text-secondary">{{ t('pages.manage.login.noConfigs') }}</h3>
              <p class="text-sm font-semibold text-secondary">{{ t('pages.manage.login.noConfigsDesc') }}</p>
            </div>
            <div
              v-else
              class="grid w-full grid-cols-[repeat(auto-fill,minmax(300px,1fr))] gap-5 border-none p-1 max-md:gap-4"
            >
              <div
                v-for="item in sortedAllConfigAliasList"
                :key="item.alias"
                class="group relative flex cursor-pointer flex-row gap-6 overflow-visible rounded-xl border border-border-secondary p-4 shadow-md transition-all duration-fast ease-apple hover:border-2 hover:border-accent"
              >
                <div class="flex-1">
                  <div class="mb-4 flex items-center gap-4">
                    <img
                      :src="`./assets/${item.picBedName}.webp`"
                      class="h-[40px] w-[40px] object-contain"
                      :alt="item.picBedName"
                    />
                    <div>
                      <h4 class="mb-1 text-base font-semibold text-main">
                        {{ item.alias }}
                      </h4>
                      <p class="m-0 text-sm text-secondary">
                        {{ supportedPicBedList[item.picBedName]?.name || item.picBedName }}
                      </p>
                    </div>
                  </div>

                  <div class="relative">
                    <button
                      class="flex cursor-pointer items-center gap-2 rounded-xl border-none bg-accent/5 p-2 text-xs font-semibold text-secondary hover:bg-accent/30 hover:text-white"
                      @click="toggleConfigDetails(item.alias)"
                    >
                      <InfoIcon :size="14" />
                      {{ t('pages.manage.login.viewDetails') }}
                      <ChevronDownIcon :size="14" :class="{ 'rotate-180': visibleConfigItems.includes(item.alias) }" />
                    </button>
                    <Teleport v-if="visibleConfigItems.includes(item.alias)" to="body">
                      <div
                        class="fixed top-1/3 left-1/2 z-1000 h-auto max-h-[400px] w-auto max-w-[900px] min-w-[200px] -translate-x-1/2 overflow-auto rounded-xl border border-slate-200 bg-white shadow-xl ring-1 ring-black/5"
                      >
                        <div class="relative">
                          <button
                            class="absolute top-2 right-2 z-10000 flex h-8 w-8 cursor-pointer items-center justify-center rounded-full border border-border bg-surface-elevated text-secondary transition-all duration-fast ease-apple hover:scale-105 hover:border-danger hover:bg-danger hover:text-white focus-visible:focus-ring"
                            @click="toggleConfigDetails(item.alias)"
                          >
                            <XIcon :size="20" />
                          </button>
                          <table class="relative w-full table-fixed border-collapse text-left text-[13px]">
                            <thead class="sticky top-0 z-10 bg-slate-50 shadow-[0_1px_0_0_rgba(0,0,0,0.05)]">
                              <tr>
                                <th class="w-1/3 px-4 py-2.5 font-semibold text-slate-500">Name</th>
                                <th class="w-2/3 px-4 py-2.5 font-semibold text-slate-500">Value</th>
                              </tr>
                            </thead>
                            <tbody class="divide-y divide-slate-100">
                              <tr
                                v-for="tableItem in formObjToTableData(item.config)"
                                :key="tableItem.key"
                                class="group cursor-pointer hover:bg-indigo-50/50"
                                @click="copyToClipboard(tableItem.value)"
                              >
                                <td class="px-4 py-2.5 font-medium text-slate-700">
                                  {{ tableItem.key }}
                                </td>
                                <td class="relative px-4 py-2.5 font-mono text-slate-500">
                                  <div class="wrap-break-word group-hover:pr-10" :title="tableItem.value">
                                    {{ tableItem.value }}
                                  </div>
                                  <div
                                    class="absolute top-1/2 right-2 -translate-y-1/2 opacity-0 transition-opacity group-hover:opacity-100"
                                  >
                                    <span class="rounded bg-indigo-100 px-1.5 py-0.5 text-[10px] text-accent">
                                      {{ t('pages.gallery.copy') }}
                                    </span>
                                  </div>
                                </td>
                              </tr>
                            </tbody>
                          </table>
                        </div>
                      </div>
                    </Teleport>
                  </div>
                </div>
                <div class="flex flex-col items-center justify-end gap-4">
                  <CustomButton
                    type="primary"
                    :icon="PointerIcon"
                    :text="t('pages.manage.login.enter')"
                    @click="handleConfigClick(item)"
                  />
                  <CustomButton
                    type="danger"
                    class="border border-border bg-danger/70 opacity-0 transition-all duration-fast ease-apple group-hover:opacity-100 hover:bg-danger"
                    icon-class="text-white "
                    text-class="text-white font-semibold text-sm "
                    :icon="TrashIcon"
                    :text="t('pages.manage.login.delete')"
                    @click="handleConfigRemove(item.alias)"
                  />
                </div>
              </div>
            </div>
          </div>
          <div
            v-else-if="editMode === false"
            class="flex h-full w-full flex-1 items-center gap-4 overflow-hidden rounded-2xl border border-border-secondary px-4 py-6 shadow-md"
          >
            <div class="no-scrollbar h-full w-full overflow-auto rounded-sm">
              <div
                class="grid w-full grid-cols-[repeat(auto-fill,minmax(300px,1fr))] gap-5 border-none p-1 max-md:gap-4"
              >
                <div
                  v-for="(item, index) in platformConfigList"
                  :key="item.alias + index"
                  class="relative flex min-h-[180px] cursor-pointer flex-col gap-6 overflow-hidden rounded-xl border border-border p-5 shadow-md transition-all duration-fast ease-apple hover:border-2 hover:border-accent hover:shadow-md"
                >
                  <!-- Card Header -->
                  <div class="relative z-1 flex flex-1 items-start justify-between">
                    <div
                      class="peer flex h-[40px] w-[40px] items-center justify-center rounded-lg border border-border-secondary text-accent transition-all duration-fast ease-apple"
                    >
                      <Cloud :size="20" />
                    </div>
                    <div class="grid grid-cols-2 gap-1.5 transition-all duration-fast ease-apple">
                      <button
                        class="flex h-[30px] w-[30px] cursor-pointer items-center justify-center rounded-md border border-accent/30 text-accent transition-all duration-fast ease-standard hover:scale-105 hover:bg-accent/30 hover:text-white"
                        :title="t('pages.uploaderConfig.edit')"
                        @click.stop="openEditPage(item.alias)"
                      >
                        <Pencil :size="14" />
                      </button>
                      <button
                        class="flex h-[30px] w-[30px] cursor-pointer items-center justify-center rounded-md border border-border bg-danger/10 text-danger transition-all duration-fast ease-standard hover:scale-105 hover:bg-danger hover:text-white"
                        :title="t('pages.uploaderConfig.delete')"
                        @click.stop="() => handleConfigRemove(item.alias)"
                      >
                        <Trash2 :size="14" />
                      </button>
                    </div>
                  </div>

                  <!-- Card Body -->
                  <div class="relative z-1 flex-1">
                    <h3 class="mx-0 mt-0 mb-2 text-base leading-[1.4] font-semibold tracking-tight text-main">
                      {{ item.alias }}
                    </h3>
                  </div>
                </div>
                <div
                  key="add-new"
                  class="group/new relative flex min-h-[180px] cursor-pointer flex-col items-center justify-center gap-6 overflow-hidden rounded-xl border-2 border-dashed border-border p-5 shadow-sm transition-all duration-fast ease-apple hover:border-solid hover:border-accent hover:bg-surface hover:shadow-md"
                  @click="openEditPage('')"
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
          <template v-else-if="editMode">
            <ManageEditPage
              v-model:edit-mode="editMode"
              :alias-name="editingAlias"
              :platform-name="activePlatform"
              @update:edit-mode="loadExistingSettings(activePlatform)"
            />
          </template>
        </div>
      </div>
    </div>
  </div>
</template>

<script lang="ts" setup>
import {
  BookOpen,
  ChevronDownIcon,
  Cloud,
  DatabaseIcon,
  FolderIcon,
  InfoIcon,
  Pencil,
  Plus,
  PointerIcon,
  RefreshCwIcon,
  Settings2,
  Trash2,
  TrashIcon,
  XIcon,
} from '@lucide/vue'
import { computed, onMounted, ref } from 'vue'
import { useI18n } from 'vue-i18n'
import { useRouter } from 'vue-router'

import CustomButton from '@/components/common/CustomButton.vue'
import useConfirm from '@/hooks/useConfirm'
import useMessage from '@/hooks/useMessage'
import ManageEditPage from '@/manage/pages/ManageEditPage.vue'
import { useManageStore } from '@/manage/store/manageStore'
import { formObjToTableData } from '@/manage/utils/common'
import { getSupportedPicBedList } from '@/manage/utils/constants'
import { getConfig, removeConfig, saveConfig } from '@/manage/utils/dataSender'
import { formatEndpoint } from '@/utils/common'
import { configPaths } from '@/utils/configPaths'
import { getConfig as getPicListConfig } from '@/utils/dataSender'
import { II18nLanguage, IRPCActionType } from '@/utils/enum'

const { t } = useI18n()
const supportedPicBedList = computed(() => getSupportedPicBedList(t))
const manageStore = useManageStore()
const router = useRouter()
const message = useMessage()
const { confirm } = useConfirm()

const editMode = ref(false)
const editingAlias = ref('')
const activePlatform = ref('login')
const visibleConfigItems = ref<string[]>([])
const platformConfigList = ref<IStringKeyMap[]>([])
const allConfigAliasList = ref<IStringKeyMap[]>([])
const importedNewConfig: IStringKeyMap = {}

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

const sortedAllConfigAliasList = computed(() => {
  return allConfigAliasList.value.slice().sort((a, b) => {
    return a.picBedName.localeCompare(b.picBedName)
  })
})

const tabItems = computed(() => {
  const staticItem = {
    key: 'login',
    name: t('pages.manage.login.savedConfigs'),
    icon: null,
    iconComponent: FolderIcon,
  }

  const dynamicItems = Object.values(supportedPicBedList.value).map((item: any) => ({
    key: item.icon,
    name: item.name,
    icon: item.icon,
    iconComponent: null,
  }))

  return [staticItem, ...dynamicItems]
})

const notifyUser = (msg: string, type: 'success' | 'error' | 'warning' = 'success') => {
  message[type](`${msg}`)
}

async function loadExistingSettings(name: string) {
  if (name === 'login') {
    getAllConfigAliasArray()
    return
  }

  const result = await getConfig<any>('picBed')
  const newConfig: IStringKeyMap[] = []
  if (result && typeof result === 'object' && Object.keys(result).length > 0) {
    Object.values(result).forEach((value: any) => {
      if (value.picBedName === name) {
        newConfig.push(value)
      }
    })
  }
  platformConfigList.value = newConfig
}

function openBucketPageSetting() {
  router.push({
    path: '/main-page/manage-setting-page',
  })
}

const handleConfigRemove = async (name: string) => {
  confirm({
    title: t('pages.manage.login.tips'),
    message: t('pages.manage.login.confirmDeleteConfig'),
    type: 'warning',
    confirmButtonText: t('common.confirm'),
    cancelButtonText: t('common.cancel'),
    center: true,
  }).then(result => {
    if (!result) return
    try {
      removeConfig('picBed', name)
      notifyUser(t('pages.manage.login.deleteConfigSuccessMsg'), 'success')
      manageStore.refreshConfig()
      loadExistingSettings(activePlatform.value)
    } catch (_error) {
      notifyUser(t('pages.manage.login.deleteConfigFailedMsg'), 'error')
    }
  })
}

const getAllConfigAliasArray = async () => {
  const result = await getConfig<any>('picBed')
  const newConfig: IStringKeyMap[] = []
  if (!result) return
  Object.values(result).forEach((value: any) => {
    newConfig.push({
      alias: value.alias,
      config: value,
      picBedName: value.picBedName,
    })
  })
  allConfigAliasList.value = newConfig
}

const copyToClipboard = (text: string) => {
  navigator.clipboard.writeText(text)
  notifyUser(`${t('pages.manage.login.copySuccess', { text })}`, 'success')
}

const handleConfigClick = async (item: any) => {
  const alias = item.alias
  const config = JSON.stringify(item.config)
  const picBedName = item.picBedName
  const result = await getConfig<any>('picBed')
  router.push({
    path: '/main-page/manage-main-page',
    query: {
      alias,
      config,
      picBedName,
      allPicBedConfigure: JSON.stringify(result),
    },
  })
}

function openEditPage(alias: string) {
  editingAlias.value = alias
  editMode.value = true
}

const handleTabChange = (tabName: string) => {
  editMode.value = false
  activePlatform.value = tabName
  loadExistingSettings(tabName)
}

const toggleConfigDetails = async (alias: string) => {
  const index = visibleConfigItems.value.indexOf(alias)
  if (index > -1) {
    visibleConfigItems.value.splice(index, 1)
  } else {
    visibleConfigItems.value.push(alias)
  }
}

const refreshConfigs = () => {
  getAllConfigAliasArray()
  notifyUser(t('pages.manage.login.configurationRefreshMsg'), 'success')
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
      const newConfig = { ...oldConfig, ...importedNewConfig }
      saveConfig('picBed', newConfig)
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
  return Object.values(allConfigAliasList.value).some(item => item.alias === alias)
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
        transformedConfig: JSON.stringify({ [config.bucket]: config.url }),
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
        bucketName: '',
        baseDir: '/',
        itemsPerPage: 50,
        proxy: '',
        sslEnabled: config.endpoint ? config.endpoint.startsWith('https') : false,
        aclForUpload: 'public-read',
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
        username: config.username,
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

onMounted(() => {
  getCurrentConfigList()
})
</script>
