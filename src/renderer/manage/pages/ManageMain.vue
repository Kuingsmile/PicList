<template>
  <div class="manage-container">
    <!-- Header Card -->
    <div class="manage-card header-card">
      <div class="card-header">
        <div class="header-content">
          <div class="header-icon">
            <img :src="`./assets/${currentPagePicBedConfig.picBedName}.webp`" class="header-icon-img" />
          </div>
          <div class="header-text">
            <h2 class="header-title">
              {{ supportedPicBedList[currentPagePicBedConfig.picBedName].name }}
            </h2>
            <p class="header-subtitle">
              {{ menuTitleMap[currentPicBedName] }}
            </p>
          </div>
        </div>
        <div class="header-actions">
          <button class="action-button secondary" @click="openPicBedUrl">
            <ExternalLinkIcon class="button-icon" />
            {{ t('pages.manage.main.openPicBedUrl') }}
          </button>
          <button
            v-if="showNewIconList.includes(currentPicBedName)"
            class="action-button primary"
            @click="openNewBucketDrawer"
          >
            <PlusIcon class="button-icon" />
            {{ t('pages.manage.main.newBucket') }}
          </button>
        </div>
      </div>
    </div>

    <!-- Main Content Card -->
    <div class="manage-card main-card">
      <div class="main-layout">
        <div class="sidebar" :style="{ width: sidebarWidth + 'px' }">
          <div class="sidebar-header">
            <h3 class="sidebar-title">
              {{ menuTitleMap[currentPicBedName] }}
            </h3>
          </div>

          <div class="sidebar-content">
            <div v-if="isLoadingBucketList" class="loading-container">
              <div class="loading-spinner" />
              <span class="loading-text">{{ t('pages.manage.main.loading') }}</span>
            </div>
            <div v-else class="menu-list">
              <div
                v-for="item in bucketNameList"
                :key="item"
                class="menu-item"
                :class="{ active: item === currentSelectedBucket }"
                @click="handleSelectMenu(item)"
              >
                <FolderIcon
                  v-if="currentSelectedBucket === item && currentPicBedName !== 'github'"
                  class="menu-icon active"
                />
                <FolderIcon v-else-if="currentPicBedName !== 'github'" class="menu-icon" />
                <GitBranchIcon v-else-if="currentPicBedName === 'github'" class="menu-icon" />
                <span class="menu-text" :title="item">
                  {{ truncateText(item, currentPicBedName) }}
                </span>
              </div>
            </div>
          </div>

          <div class="sidebar-footer">
            <div class="footer-actions">
              <button class="footer-action-item" @click="switchPicBed('main')">
                <HomeIcon class="action-icon" />
                <span class="action-text">{{ t('pages.manage.main.backToHome') }}</span>
              </button>
              <button class="footer-action-item" @click="changePicBed">
                <ArrowLeftRightIcon class="action-icon" />
                <span class="action-text">{{ t('pages.manage.main.switchPicBed') }}</span>
              </button>
              <button class="footer-action-item" @click="openBucketPageSetting">
                <SettingsIcon class="action-icon" />
                <span class="action-text">{{ t('pages.manage.main.settings') }}</span>
              </button>
            </div>
          </div>
        </div>

        <!-- Resize Handle -->
        <div class="resize-handle" @mousedown="startResize">
          <div class="resize-line" />
        </div>

        <div class="content-area">
          <router-view />
        </div>
      </div>
    </div>

    <!-- PicBed Switch Dialog -->
    <transition name="modal">
      <div v-if="picBedSwitchDialogVisible" class="dialog-overlay" @click="picBedSwitchDialogVisible = false">
        <div class="dialog-container" @click.stop>
          <div class="dialog-header">
            <h3 class="dialog-title">
              {{ t('pages.manage.main.switchPicBed') }}
            </h3>
            <button class="dialog-close" @click="picBedSwitchDialogVisible = false">
              <XIcon class="close-icon" />
            </button>
          </div>
          <div class="dialog-content">
            <div class="choice-cos">
              <!-- Back to main card -->
              <div class="picbed-card main-card" @click="switchPicBed('main')">
                <div class="card-icon">
                  <HomeIcon class="main-icon" />
                </div>
                <div class="card-content">
                  <div class="card-title main-title">
                    {{ $t('pages.manage.main.backToHome') }}
                  </div>
                </div>
              </div>

              <!-- PicBed cards -->
              <div
                v-for="(config, alias) in allPicBedConfigure"
                :key="String(alias)"
                class="picbed-card"
                :class="{ active: String(alias) === currentAlias }"
                @click="switchPicBed(String(alias))"
              >
                <div class="card-icon">
                  <img :src="`./assets/${config.picBedName}.webp`" class="picbed-icon" />
                </div>
                <div class="card-content">
                  <div class="card-title">
                    {{ config.alias }}
                  </div>
                </div>
                <div v-if="String(alias) === currentAlias" class="check-icon">
                  <CheckIcon />
                </div>
              </div>
            </div>
          </div>
        </div>
      </div>
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
  FolderIcon,
  GitBranchIcon,
  HomeIcon,
  PlusIcon,
  SettingsIcon,
  XIcon,
} from 'lucide-vue-next'
import { computed, onBeforeMount, reactive, ref, watch } from 'vue'
import { useI18n } from 'vue-i18n'
import { useRoute, useRouter } from 'vue-router'

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

const maxTextLength = computed(() => {
  const fixedSpace = 16 + 12 + 24 + 8
  const availableWidth = sidebarWidth.value - fixedSpace
  const estimatedCharWidth = 14 * 0.6
  const maxChars = Math.floor(availableWidth / estimatedCharWidth)
  return Math.max(6, Math.min(maxChars, 60))
})

const truncateText = (text: string, picBedName: string): string => {
  if (!text) return ''

  if (picBedName === 'tcyun') {
    const baseName = text.slice(0, text.length - 11)
    if (baseName.length <= maxTextLength.value) {
      return baseName
    }
    return `${baseName.slice(0, maxTextLength.value - 3)}...`
  } else if (picBedName === 'github') {
    if (text.length <= maxTextLength.value) {
      return text
    }
    const minSideLength = 3
    const totalEllipsis = 2 // '..'
    const availableForContent = maxTextLength.value - totalEllipsis

    if (availableForContent < minSideLength * 2) {
      return `${text.slice(0, maxTextLength.value - 3)}...`
    }

    const prefixLength = Math.ceil(availableForContent / 2)
    const suffixLength = availableForContent - prefixLength
    return `${text.slice(0, prefixLength)}..${text.slice(-suffixLength)}`
  } else {
    if (text.length <= maxTextLength.value) {
      return text
    }
    return `${text.slice(0, maxTextLength.value - 3)}...`
  }
}

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
