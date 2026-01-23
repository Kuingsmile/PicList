<template>
  <div
    class="relative z-1 flex h-full w-full flex-col items-center justify-start gap-2 rounded-xl border-none p-2 shadow-sm"
  >
    <!-- Header Card -->
    <div class="flex w-full items-center justify-between gap-4 rounded-xl border border-border-secondary p-0 shadow-sm">
      <div class="flex flex-wrap items-center gap-1 p-1 max-md:justify-center max-md:text-center">
        <div class="flex h-[34px] w-[34px] shrink-0 items-center justify-center rounded-md bg-bg-secondary">
          <img :src="`./assets/${currentPagePicBedConfig.picBedName}.webp`" class="h-[24px] w-[24px] object-contain" />
        </div>
        <div class="flex flex-row items-center justify-center gap-2 max-md:text-center">
          <h2 class="m-0 text-xl font-bold tracking-tight text-main">
            {{ supportedPicBedList[currentPagePicBedConfig.picBedName].name }}
          </h2>
          <p class="m-0 text-sm font-semibold text-secondary">
            {{ menuTitleMap[currentPicBedName] }}
          </p>
        </div>
      </div>
      <div class="mr-2 flex items-center justify-center gap-3">
        <CustomButton
          type="secondary"
          :text="t('pages.manage.main.openPicBedUrl')"
          :icon="ExternalLinkIcon"
          @click="openPicBedUrl"
        />
        <CustomButton
          v-if="showNewIconList.includes(currentPicBedName)"
          type="secondary"
          :text="t('pages.manage.main.newBucket')"
          :icon="PlusIcon"
          @click="openNewBucketDrawer"
        />
      </div>
    </div>

    <!-- Main Content Card -->
    <div
      class="flex w-full flex-1 items-center gap-4 overflow-hidden rounded-xl border border-border-secondary p-2 shadow-md"
    >
      <div class="flex h-full w-full">
        <div
          class="flex min-h-0 max-w-[400px] min-w-[120px] flex-col border-r-2 border-r-border transition-all duration-100 ease-out"
          :style="{ width: sidebarWidth + 'px' }"
        >
          <div class="shrink-0 border-b-2 border-b-border-secondary p-2">
            <h3 class="m-0 text-center text-sm font-semibold text-secondary">
              {{ menuTitleMap[currentPicBedName] }}
            </h3>
          </div>

          <div class="min-h-0 flex-1 overflow-y-auto p-2">
            <div v-if="isLoadingBucketList" class="flex flex-col items-center justify-center gap-2 p-8">
              <div
                class="h-[25px] w-[25px] animate-spin rounded-full border-3 border-t-2 border-border border-t-accent"
              />
              <span class="text-sm font-semibold text-secondary">{{ t('pages.manage.main.loading') }}</span>
            </div>
            <div v-else class="menu-list">
              <div
                v-for="item in bucketNameList"
                :key="item"
                class="menu-item"
                :class="{ active: item === currentSelectedBucket }"
                @click="handleSelectMenu(item)"
              >
                <span
                  class="group/badge overflow-hidden text-sm font-medium text-ellipsis whitespace-nowrap text-secondary"
                >
                  <div class="min-w-0 flex-1 overflow-hidden">
                    <div
                      class="flex overflow-hidden text-ellipsis whitespace-nowrap group-hover/badge:w-fit group-hover/badge:animate-[badge-scroll_5s_linear_infinite] group-hover/badge:text-clip"
                    >
                      <span class="leading-none whitespace-nowrap group-hover/badge:pr-[20px]">{{ item }}</span>
                      <span class="hidden leading-none whitespace-nowrap group-hover/badge:block">{{ item }}</span>
                    </div>
                  </div>
                </span>
              </div>
            </div>
          </div>

          <div class="border-t border-t-border-secondary p-2">
            <div class="flex flex-col gap-1">
              <CustomButton
                type="secondary"
                :text="t('pages.manage.main.backToHome')"
                :icon="HomeIcon"
                class="border-none"
                @click="switchPicBed('main')"
              />
              <CustomButton
                type="secondary"
                :text="t('pages.manage.main.switchPicBed')"
                :icon="ArrowLeftRightIcon"
                class="border-none"
                @click="changePicBed"
              />
              <CustomButton
                type="secondary"
                :text="t('pages.manage.main.settings')"
                :icon="SettingsIcon"
                class="border-none"
                @click="openBucketPageSetting"
              />
            </div>
          </div>
        </div>

        <!-- Resize Handle -->
        <div
          class="group/resize relative flex w-[4px] shrink-0 cursor-col-resize items-center justify-center bg-transparent hover:bg-accent/70"
          @mousedown="startResize"
        ></div>

        <div class="content-area">
          <router-view />
        </div>
      </div>
    </div>

    <!-- PicBed Switch Dialog -->
    <transition
      name="modal"
      enter-active-class="transition-all duration-200 ease-apple"
      leave-active-class="transition-all duration-200 ease-apple"
      enter-from-class="opacity-0"
      leave-to-class="opacity-0"
    >
      <CustomModal
        v-if="picBedSwitchDialogVisible"
        v-model:visible="picBedSwitchDialogVisible"
        :title="t('pages.manage.main.switchPicBed')"
      >
        <div class="no-scrollbar h-full w-full overflow-auto p-8">
          <div class="grid grid-cols-[repeat(auto-fill,minmax(200px,1fr))] gap-4">
            <!-- Back to main card -->
            <div
              class="relative flex cursor-pointer flex-col items-center rounded-lg border-2 border-success/80 bg-bg-secondary p-6 transition-all duration-fast ease-apple"
              @click="switchPicBed('main')"
            >
              <div class="mb-3 flex h-[40px] w-[40px] items-center justify-center">
                <HomeIcon class="h-[24px] w-[24px] text-main" />
              </div>
              <div class="text-center">
                <div class="text-sm font-semibold text-main">
                  {{ $t('pages.manage.main.backToHome') }}
                </div>
              </div>
            </div>

            <!-- PicBed cards -->
            <div
              v-for="(config, alias) in allPicBedConfigure"
              :key="String(alias)"
              class="relative flex cursor-pointer flex-col items-center rounded-lg border-2 border-border/80 bg-bg-secondary p-6 transition-all duration-fast ease-apple [.active]:border-accent"
              :class="{ active: String(alias) === currentAlias }"
              @click="switchPicBed(String(alias))"
            >
              <div class="mb-3 flex h-[40px] w-[40px] items-center justify-center">
                <img :src="`./assets/${config.picBedName}.webp`" class="h-[32px] w-[32px] object-contain" />
              </div>
              <div class="text-center">
                <div class="text-sm font-semibold text-main">
                  {{ config.alias }}
                </div>
              </div>
              <div v-if="String(alias) === currentAlias" class="absolute top-2 right-2 h-[20px] w-[20px] text-accent">
                <CheckIcon />
              </div>
            </div>
          </div>
        </div>
      </CustomModal>
    </transition>

    <!-- New Bucket Drawer -->
    <div v-if="nweBucketDrawerVisible" class="drawer-overlay" @click="nweBucketDrawerVisible = false">
      <div class="drawer-container" @click.stop>
        <div class="drawer-header">
          <h3 class="drawer-title">
            {{ t('pages.manage.main.newBucket') }}
          </h3>
          <button class="drawer-close" @click="nweBucketDrawerVisible = false">
            <XIcon class="close-icon" />
          </button>
        </div>
        <div class="drawer-content">
          <form @submit.prevent="createNewBucket(currentPicBedName)">
            <div class="form-header">
              <div class="form-icon">
                <img :src="`./assets/${currentPicBedName}.webp`" class="picbed-form-icon" />
              </div>
            </div>

            <div class="form-divider" />

            <div v-for="option in newBucketConfig[currentPicBedName].options" :key="option" class="form-group">
              <label class="form-label">
                {{ newBucketConfig[currentPicBedName].configOptions[option].description }}
              </label>

              <!-- Input field -->
              <input
                v-if="
                  newBucketConfig[currentPicBedName].configOptions[option].component === 'input' &&
                  currentPicBedName !== 'tcyun'
                "
                v-model.trim="newBucketConfigResult[currentPicBedName + '.' + option]"
                type="text"
                class="form-input"
                :placeholder="newBucketConfig[currentPicBedName].configOptions[option].placeholder"
              />

              <!-- TCyun special input with append -->
              <div
                v-if="
                  currentPicBedName === 'tcyun' &&
                  newBucketConfig[currentPicBedName].configOptions[option].component === 'input'
                "
                class="input-group"
              >
                <input
                  v-model.trim="newBucketConfigResult[currentPicBedName + '.' + option]"
                  type="text"
                  class="form-input group-input"
                  :placeholder="newBucketConfig[currentPicBedName].configOptions[option].placeholder"
                />
                <span class="input-append">{{ '-' + currentPagePicBedConfig.appId }}</span>
              </div>

              <!-- Select field -->
              <div
                v-if="newBucketConfig[currentPicBedName].configOptions[option].component === 'select'"
                class="select-wrapper"
              >
                <select v-model="newBucketConfigResult[currentPicBedName + '.' + option]" class="form-select">
                  <option
                    v-for="(label, value) in newBucketConfig[currentPicBedName].configOptions[option].options"
                    :key="value"
                    :value="value"
                  >
                    {{ label }}
                  </option>
                </select>
                <ChevronDownIcon class="select-arrow" />
              </div>

              <!-- Switch field -->
              <label
                v-if="newBucketConfig[currentPicBedName].configOptions[option].component === 'switch'"
                class="switch-label"
              >
                <input
                  v-model="newBucketConfigResult[currentPicBedName + '.' + option]"
                  type="checkbox"
                  class="switch-input"
                  :true-value="true"
                  :false-value="false"
                />
                <span class="switch-slider">
                  <span class="switch-button" />
                </span>
              </label>
            </div>

            <div class="form-actions">
              <button type="button" class="action-button secondary" @click="nweBucketDrawerVisible = false">
                {{ $t('common.cancel') }}
              </button>
              <button type="submit" class="action-button primary">
                <CheckIcon class="button-icon" />
                {{ t('common.submit') }}
              </button>
            </div>
          </form>
        </div>
      </div>
    </div>
  </div>
</template>

<script lang="ts" setup>
import {
  ArrowLeftRightIcon,
  CheckIcon,
  ChevronDownIcon,
  ExternalLinkIcon,
  HomeIcon,
  PlusIcon,
  SettingsIcon,
  XIcon,
} from 'lucide-vue-next'
import { onBeforeMount, reactive, ref, watch } from 'vue'
import { useI18n } from 'vue-i18n'
import { useRoute, useRouter } from 'vue-router'

import CustomButton from '@/components/common/CustomButton.vue'
import CustomModal from '@/components/common/CustomModal.vue'
import useMessage from '@/hooks/useMessage'
import { useManageStore } from '@/manage/store/manageStore'
import { supportedPicBedList } from '@/manage/utils/constants'
import { newBucketConfig } from '@/manage/utils/newBucketConfig'
import { IRPCActionType } from '@/utils/enum'

const { t } = useI18n()
const manageStore = useManageStore() as any
const route = useRoute()
const router = useRouter()
const message = useMessage()

const currentAlias = ref(route.query.alias as string)
const currentPicBedName = ref(route.query.picBedName as string)

const sidebarWidth = ref(160)
const isResizing = ref(false)

let allPicBedConfigure = JSON.parse(route.query.allPicBedConfigure as string)
let currentPagePicBedConfig = reactive(JSON.parse(route.query.config as string))

const newBucketConfigResult: IStringKeyMap = reactive({})
const bucketList = ref({} as IStringKeyMap)
const currentSelectedBucket = ref('')
const bucketNameList = ref([] as string[])

const isLoadingBucketList = ref(false)
const nweBucketDrawerVisible = ref(false)
const picBedSwitchDialogVisible = ref(false)

watch(
  route,
  async newRoute => {
    if (newRoute.fullPath.split('?')[0] === '/main-page/manage-main-page') {
      currentAlias.value = newRoute.query.alias as string
      currentPicBedName.value = newRoute.query.picBedName as string
      allPicBedConfigure = JSON.parse(newRoute.query.allPicBedConfigure as string)
      currentPagePicBedConfig = reactive(JSON.parse(newRoute.query.config as string))
      await getBucketList()
    }
  },
  { deep: true },
)

watch(sidebarWidth, () => {}, { immediate: false })

const urlMap: IStringKeyMap = {
  aliyun: 'https://oss.console.aliyun.com',
  github: 'https://github.com',
  imgur: 'https://imgur.com',
  local: 'https://piclist.cn',
  qiniu: 'https://portal.qiniu.com',
  s3plist: 'https://aws.amazon.com/cn/s3/',
  sftp: 'https://github.com/imba97/picgo-plugin-sftp-uploader',
  smms: 'https://smms.app',
  tcyun: 'https://console.cloud.tencent.com/cos',
  upyun: 'https://console.upyun.com',
  webdavplist: 'https://baike.baidu.com/item/WebDAV/4610909',
}

const showNewIconList = ['aliyun', 'qiniu', 'tcyun', 's3plist']

const bucketT = t('pages.manage.main.bucket')
const galleryT = t('pages.manage.main.gallery')
const repositoryT = t('pages.manage.main.repo')

const menuTitleMap: IStringKeyMap = {
  aliyun: bucketT,
  qiniu: bucketT,
  tcyun: bucketT,
  upyun: bucketT,
  s3plist: bucketT,
  sftp: '',
  smms: galleryT,
  imgur: galleryT,
  github: repositoryT,
  webdavplist: '',
  local: '',
}

const openPicBedUrl = () => window.electron.sendRPC(IRPCActionType.OPEN_URL, urlMap[currentPagePicBedConfig.picBedName])

function openNewBucketDrawer() {
  nweBucketDrawerVisible.value = true
}

function createNewBucket(picBedName: string) {
  const configOptions = newBucketConfig[picBedName].configOptions
  const resultMap: IStringKeyMap = Object.keys(configOptions).reduce((result, key) => {
    const resultKey = `${picBedName}.${key}`
    const defaultValue = configOptions[key].default
    const resultValue = newBucketConfigResult[resultKey]

    result[key] =
      resultValue === '' && defaultValue !== undefined ? defaultValue : resultValue === undefined ? '' : resultValue

    return result
  }, {} as IStringKeyMap)
  if (currentPicBedName.value === 'tcyun') {
    resultMap.BucketName = `${resultMap.BucketName}-${currentPagePicBedConfig.appId}`
  }
  resultMap.endpoint = currentPagePicBedConfig.endpoint
  window.electron.triggerRPC(IRPCActionType.MANAGE_CREATE_BUCKET, currentAlias.value, resultMap).then((result: any) => {
    if (result) {
      // Show success notification
      message.success(t('pages.manage.main.createSuccess'))
      nweBucketDrawerVisible.value = false
      setTimeout(() => {
        getBucketList()
      }, 2000)
    } else {
      // Show error notification
      message.error(t('pages.manage.main.createFailed'))
    }
  })
}

async function getBucketList() {
  bucketList.value = {}
  bucketNameList.value = []
  isLoadingBucketList.value = true

  const result = await window.electron.triggerRPC<any>(IRPCActionType.MANAGE_GET_BUCKET_LIST, currentAlias.value)
  isLoadingBucketList.value = false
  if (result.length > 0) {
    result.forEach((item: any) => {
      bucketList.value[item.Name] = item
      bucketNameList.value.push(item.Name)
    })
  }
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

  const configMap = {
    prefix,
    bucketName,
    customUrl: transformedConfig[bucketName]?.customUrl ?? '',
    picBedName: cpicBedName,
    alias: currentAlias.value,
    bucketConfig: bucketList.value[bucketName],
    cdnUrl: currentPicBedConfig.customUrl,
    baseDir: prefix,
    webPath: currentPicBedConfig.webPath || '',
  }
  currentSelectedBucket.value = bucketName
  router.push({
    path: '/main-page/manage-main-page/manage-bucket-page',
    query: {
      configMap: JSON.stringify(configMap),
      alias: currentAlias.value,
      picBedName: currentPicBedName.value,
      config: JSON.stringify(currentPagePicBedConfig),
      allPicBedConfigure: JSON.stringify(allPicBedConfigure),
    },
  })
}

function switchPicBed(picBedAlias: string) {
  if (picBedAlias === 'main') {
    router.push({
      path: '/main-page/manage-login-page',
    })
    return
  }
  if (
    route.fullPath.startsWith('/main-page/manage-main-page/manage-bucket-page') ||
    route.fullPath.startsWith('/main-page/manage-main-page/manage-setting-page')
  ) {
    picBedSwitchDialogVisible.value = false
    router.push({
      path: '/main-page/manage-main-page',
      query: {
        alias: picBedAlias,
        picBedName: allPicBedConfigure[picBedAlias].picBedName,
        config: JSON.stringify(allPicBedConfigure[picBedAlias]),
        allPicBedConfigure: JSON.stringify(allPicBedConfigure),
      },
    })
  } else {
    currentAlias.value = picBedAlias
    currentPicBedName.value = allPicBedConfigure[picBedAlias].picBedName
    currentPagePicBedConfig = allPicBedConfigure[picBedAlias]
    picBedSwitchDialogVisible.value = false
    currentSelectedBucket.value = ''
    getBucketList()
  }
}

function changePicBed() {
  picBedSwitchDialogVisible.value = true
}

function openBucketPageSetting() {
  router.push({
    path: '/main-page/manage-main-page/manage-setting-page',
    query: {
      alias: currentAlias.value,
      picBedName: currentPicBedName.value,
      config: JSON.stringify(currentPagePicBedConfig),
      allPicBedConfigure: JSON.stringify(allPicBedConfigure),
    },
  })
}

function startResize(event: MouseEvent) {
  isResizing.value = true
  const startX = event.clientX
  const startWidth = sidebarWidth.value

  const handleMouseMove = (e: MouseEvent) => {
    if (!isResizing.value) return

    const deltaX = e.clientX - startX
    const newWidth = Math.max(120, Math.min(400, startWidth + deltaX))
    sidebarWidth.value = newWidth
  }

  const handleMouseUp = () => {
    isResizing.value = false
    document.removeEventListener('mousemove', handleMouseMove)
    document.removeEventListener('mouseup', handleMouseUp)
    document.body.style.cursor = ''
    document.body.style.userSelect = ''
  }

  document.addEventListener('mousemove', handleMouseMove)
  document.addEventListener('mouseup', handleMouseUp)
  document.body.style.cursor = 'col-resize'
  document.body.style.userSelect = 'none'
}

onBeforeMount(() => {
  getBucketList()
})
</script>

<style src="./css/ManageMain.css" scoped></style>
