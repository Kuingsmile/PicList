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
          class="flex min-h-0 w-[40px] max-w-[400px] min-w-[40px] flex-col border-r-2 border-r-border transition-all duration-100 ease-out"
          :style="{ width: sidebarWidth + 'px' }"
        >
          <div v-if="menuTitleMap[currentPicBedName]" class="shrink-0 border-b-2 border-b-border-secondary p-2">
            <h3 class="m-0 text-center text-sm font-semibold text-secondary">
              {{ menuTitleMap[currentPicBedName] }}
            </h3>
          </div>
          <div
            class="mb-2 rounded-md border border-t-0 border-border"
            :class="{
              'border-t-0': menuTitleMap[currentPicBedName],
            }"
          >
            <input
              v-if="bucketNameList.length > 5"
              v-model="bucketSearchText"
              class="w-full rounded-md border-none bg-bg-secondary p-1 text-sm text-main placeholder:text-secondary focus:border-accent focus:outline-none"
              type="text"
              placeholder="search..."
            />
          </div>

          <div class="min-h-0 flex-1 overflow-y-auto">
            <div v-if="isLoadingBucketList" class="flex flex-col items-center justify-center gap-2 p-8">
              <div
                class="h-[25px] w-[25px] animate-spin rounded-full border-3 border-t-2 border-border border-t-accent"
              />
              <span class="text-sm font-semibold text-secondary">{{ t('pages.manage.main.loading') }}</span>
            </div>
            <div v-else class="flex flex-col gap-1">
              <template v-for="item in filteredBucketNameList" :key="item">
                <div
                  class="flex cursor-pointer items-center gap-3 rounded-sm p-3 text-sm shadow-xs hover:bg-surface [.active]:bg-accent/20"
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
                </div></template
              >
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
                @click="openSettingPage"
              />
            </div>
          </div>
        </div>

        <!-- Resize Handle -->
        <div
          class="group/resize relative flex w-[4px] shrink-0 cursor-col-resize items-center justify-center bg-transparent hover:bg-accent/70"
          @mousedown="startResize"
        ></div>

        <div class="m-0 box-border flex h-full w-full flex-1 flex-col overflow-hidden border-none">
          <template v-if="currentPageInMain === 'bucket'">
            <BucketPage :config-map="configMap" />
          </template>
          <template v-else-if="currentPageInMain === 'setting'">
            <ManageSetting />
          </template>
          <template v-else>
            <EmptyPage no-desc />
          </template>
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
        height="auto"
      >
        <div class="no-scrollbar h-full w-full overflow-auto p-8">
          <div class="grid grid-cols-[repeat(auto-fill,minmax(200px,1fr))] gap-4">
            <!-- Back to main card -->
            <div
              class="relative flex cursor-pointer flex-col items-center rounded-lg border-2 border-success/80 bg-bg-secondary p-6 transition-all duration-fast ease-apple hover:border-accent"
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
              class="relative flex cursor-pointer flex-col items-center rounded-lg border-2 border-border/80 bg-bg-secondary p-6 transition-all duration-fast ease-apple hover:border-accent [.active]:border-accent"
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
    <transition
      name="modal-bucket"
      enter-active-class="transition-all duration-200 ease-apple"
      leave-active-class="transition-all duration-200 ease-apple"
      enter-from-class="opacity-0"
      leave-to-class="opacity-0"
    >
      <!-- New Bucket Drawer -->
      <CustomModal
        v-if="bucketDrawerVisible"
        v-model:visible="bucketDrawerVisible"
        :title="t('pages.manage.main.newBucket')"
        width="600px"
        height="auto"
      >
        <div class="drawer-content">
          <SettingSection :title="supportedPicBedList[currentPicBedName].name" :icon="Database" only-one-row>
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
                      class="absolute top-0.5 right-0 flex cursor-not-allowed items-center justify-center rounded-xl border border-border bg-gray-300 p-2.5 text-sm font-semibold text-secondary"
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
          </SettingSection>
          <div></div>
        </div>
        <template #footer>
          <CustomButton type="secondary" :text="$t('common.cancel')" @click="bucketDrawerVisible = false" />
          <CustomButton type="primary" :text="$t('common.submit')" @click="createNewBucket(currentPicBedName)" />
        </template>
      </CustomModal>
    </transition>
  </div>
</template>

<script lang="ts" setup>
import {
  ArrowLeftRightIcon,
  CheckIcon,
  Database,
  ExternalLinkIcon,
  HomeIcon,
  PlusIcon,
  SettingsIcon,
} from 'lucide-vue-next'
import { computed, onBeforeMount, reactive, ref, watch } from 'vue'
import { useI18n } from 'vue-i18n'
import { useRoute, useRouter } from 'vue-router'

import CustomButton from '@/components/common/CustomButton.vue'
import CustomInput from '@/components/common/CustomInput.vue'
import CustomModal from '@/components/common/CustomModal.vue'
import CustomSwitch from '@/components/common/CustomSwitch.vue'
import SettingCard from '@/components/common/SettingCard.vue'
import SettingSection from '@/components/common/SettingSection.vue'
import SingleSelect from '@/components/common/SingleSelect.vue'
import useMessage from '@/hooks/useMessage'
import BucketPage from '@/manage/pages/BucketPage.vue'
import EmptyPage from '@/manage/pages/EmptyPage.vue'
import ManageSetting from '@/manage/pages/ManageSetting.vue'
import { useManageStore } from '@/manage/store/manageStore'
import { supportedPicBedList } from '@/manage/utils/constants'
import { newBucketConfig } from '@/manage/utils/newBucketConfig'
import { IRPCActionType } from '@/utils/enum'

const { t } = useI18n()
const manageStore = useManageStore() as any
const route = useRoute()
const router = useRouter()
const message = useMessage()
const currentPageInMain = ref<'bucket' | 'setting' | 'empty'>('empty')
const configMap = ref<any>(null)

const currentAlias = ref(route.query.alias as string)
const currentPicBedName = ref(route.query.picBedName as string)

const sidebarWidth = ref(120)
const isResizing = ref(false)

let allPicBedConfigure = JSON.parse(route.query.allPicBedConfigure as string)
let currentPagePicBedConfig = reactive(JSON.parse(route.query.config as string))

const newBucketConfigResult: IStringKeyMap = reactive({})
const bucketList = ref({} as IStringKeyMap)
const currentSelectedBucket = ref('')
const bucketNameList = ref([] as string[])
const bucketSearchText = ref('')

const isLoadingBucketList = ref(false)
const bucketDrawerVisible = ref(false)
const picBedSwitchDialogVisible = ref(false)

const filteredBucketNameList = computed(() => {
  if (!bucketSearchText.value) {
    return bucketNameList.value
  }
  return bucketNameList.value.filter(name => name.toLowerCase().includes(bucketSearchText.value.toLowerCase()))
})

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
  smms: 'https://s.ee',
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
  bucketDrawerVisible.value = true
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
      bucketDrawerVisible.value = false
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

  const configMapT = {
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
  configMap.value = configMapT
  currentPageInMain.value = 'bucket'
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

function openSettingPage() {
  currentPageInMain.value = 'setting'
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
