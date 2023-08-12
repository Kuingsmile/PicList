<template>
  <div class="layout">
    <div class="layout__menu">
      <div class="layout__menu__button">
        <span
          class="layout__menu__button__item"
          @click="openPicBedUrl"
        >
          <img
            :src="require(`./assets/${currentPagePicBedConfig.picBedName}.webp`)"
            class="layout__menu__button__item__icon"
          >
          {{ '-' + supportedPicBedList[currentPagePicBedConfig.picBedName].name + '-' }}
        </span>
      </div>
      <el-divider
        content-position="left"
        class="layout__menu__button__divider"
        border-style="none"
      >
        <span
          style="font-size: 14px;color: #909399;"
        >
          {{ menuTitleMap[currentPicBedName] }}
          <el-tooltip
            v-if="showNewIconList.includes(currentPicBedName)"
            effect="dark"
            :content="$T('MANAGE_MAIN_PAGE_NEW_BUCKET')"
            placement="right"
            popper-class="layout__menu__button__divider__tooltip"
          >
            <el-icon
              class="layout__menu__button__divider__icon"
              color="red"
              style="top: 2px;"
              @click="openNewBucketDrawer()"
            >
              <CirclePlus />
            </el-icon>
          </el-tooltip>
        </span>
      </el-divider>
      <div />
      <el-menu
        v-loading="isLoadingBucketList"
        class="layout__menu__list"
        :default-active="getCurrentActiveBucket"
        style="width: 120px;"
        active-text-color="#409EFF"
        @select="handleSelectMenu"
      >
        <el-menu-item
          v-for="item of bucketNameList"
          :key="item"
          :index="item"
        >
          <span
            class="layout__menu__list__item"
            :style="{ color: item === currentSelectedBucket ? '#409EFF' : '#606266'}"
          >
            <el-icon
              v-if="currentSelectedBucket === item && currentPicBedName !== 'github'"
              class="layout__menu__list__item__icon"
              color="#409EFF"
              style="top: 2px;"
            >
              <FolderOpened />
            </el-icon>
            <el-icon
              v-else-if="currentPicBedName !== 'github'"
              class="layout__menu__list__item__icon"
              color="#606266"
              style="top: 2px;"
            >
              <Folder />
            </el-icon>
            {{ currentPicBedName === 'tcyun' ? item.slice(0, item.length - 11)
              : currentPicBedName === 'github'? item.length > 10 ? `${item.slice(0, 5)}..${item.slice(-5)}` : item
                : item }}
          </span>
        </el-menu-item>
      </el-menu>
      <el-menu
        class="layout__menu__setting"
        style="width: 120px;"
      >
        <el-menu-item
          index="changePicBed"
          style="height: 40px;"
          @click="switchPicBed('main')"
        >
          <span
            class="layout__menu__setting__item"
          >
            <el-icon
              class="layout__menu__setting__item__icon"
            >
              <HomeFilled />
            </el-icon>
            {{ $T('MANAGE_MAIN_PAGE_BACK_TO_HOME') }}
          </span>
        </el-menu-item>
        <el-menu-item
          index="changePicBed"
          style="height: 40px;"
          @click="changePicBed"
        >
          <span
            class="layout__menu__setting__item"
          >
            <el-icon
              class="layout__menu__setting__item__icon"
            >
              <Switch />
            </el-icon>
            {{ $T('MANAGE_MAIN_PAGE_SWITCH_PICBED') }}
          </span>
        </el-menu-item>
        <el-menu-item
          index="bucketPageSetting"
          style="height: 40px;"
          @click="openBucketPageSetting"
        >
          <span
            class="layout__menu__setting__item"
          >
            <el-icon
              class="layout__menu__setting__item__icon"
            >
              <Tools />
            </el-icon>
            {{ $T('MANAGE_MAIN_PAGE_SETTING') }}
          </span>
        </el-menu-item>
      </el-menu>
    </div>
    <div
      class="layout__content"
      style="height: 100%;background-color: transparent;flex: 1;width: 0;"
    >
      <router-view />
    </div>
    <el-dialog
      v-model="picBedSwitchDialogVisible"
      top="30vh"
    >
      <div
        class="choice-cos"
        style="display: flex;flex-direction: row;flex-wrap: wrap;justify-content: space-around;"
      >
        <el-card
          shadow="hover"
        >
          <div
            style="text-align: center;display: flex;flex-direction: column;"
            @click="switchPicBed('main')"
          >
            <el-icon
              color="red"
              size="25px"
              style="margin: 0 auto;"
            >
              <ChromeFilled />
            </el-icon>
            <span
              style="font-size: 13px;margin-top: 5px;color: red;"
            >
              {{ $T('MANAGE_MAIN_PAGE_BACK_TO_HOME') }}
            </span>
          </div>
        </el-card>
        <el-card
          v-for="item in allPicBedConfigure"
          :key="item"
          shadow="hover"
        >
          <div
            style="text-align: center;display: flex;flex-direction: column;"
            @click="switchPicBed(item.alias)"
          >
            <el-image
              :src="require(`./assets/${item.picBedName}.webp`)"
              class="layout__addNewBucket__icon"
              style="width: 25px;height: 25px;margin: 0 auto;"
            />
            <span
              style="font-size: 13px;margin-top: 5px;color: cornflowerblue;"
            >
              {{ item.alias }}
            </span>
          </div>
        </el-card>
      </div>
    </el-dialog>
    <el-drawer
      v-model="nweBucketDrawerVisible"
      class="layout__addNewBucket"
    >
      <el-form
        label-position="top"
        require-asterisk-position="right"
        label-width="10vw"
        size="default"
        :model="newBucketConfigResult"
        :rules="rules"
      >
        <div
          style="position: relative;height: 10vh;width: 100%;"
        >
          <el-image
            :src="require(`./assets/${currentPicBedName}.webp`)"
            class="layout__addNewBucket__icon"
            style="position: absolute;top: 50%;left: 50%;transform: translate(-50%, -50%);"
          />
        </div>
        <el-divider
          border-style="none"
        />
        <el-form-item
          v-for="option in newBucketConfig[currentPicBedName].options"
          :key="option"
          :prop="currentPicBedName + '.' + option"
          :label="newBucketConfig[currentPicBedName].configOptions[option].description"
        >
          <el-input
            v-if="newBucketConfig[currentPicBedName].configOptions[option].component === 'input' && currentPicBedName !== 'tcyun'"
            v-model.trim="newBucketConfigResult[currentPicBedName+'.'+option]"
            :placeholder="newBucketConfig[currentPicBedName].configOptions[option].placeholder"
          />
          <el-input
            v-if="currentPicBedName === 'tcyun' && newBucketConfig[currentPicBedName].configOptions[option].component === 'input'"
            v-model.trim="newBucketConfigResult[currentPicBedName+'.'+option]"
            :placeholder="newBucketConfig[currentPicBedName].configOptions[option].placeholder"
          >
            <template #append>
              {{ '-' + currentPagePicBedConfig.appId }}
            </template>
          </el-input>
          <el-select
            v-if="newBucketConfig[currentPicBedName].configOptions[option].component === 'select'"
            v-model="newBucketConfigResult[currentPicBedName+'.'+option]"
            size="large"
          >
            <el-option
              v-for="item in Object.keys(newBucketConfig[currentPicBedName].configOptions[option].options)"
              :key="item"
              :label="newBucketConfig[currentPicBedName].configOptions[option].options[item]"
              :value="item"
            />
          </el-select>
          <el-switch
            v-if="newBucketConfig[currentPicBedName].configOptions[option].component === 'switch'"
            v-model="newBucketConfigResult[currentPicBedName+'.'+option]"
            :active-value="true"
            :inactive-value="false"
          />
        </el-form-item>
        <div
          style="position: relative;height: 10vh;width: 100%;z-index: 1;"
        >
          <el-button
            :icon="SuccessFilled"
            type="primary"
            style="position: absolute;top: 50%;left: 50%;transform: translate(-50%, -50%);"
            @click="createNewBucket(currentPicBedName)"
          >
            {{ $T('MANAGE_MAIN_PAGE_SUBMIT') }}
          </el-button>
        </div>
      </el-form>
    </el-drawer>
  </div>
</template>

<script lang="ts" setup>
// Vue 相关
import { ref, reactive, computed, onBeforeMount, watch } from 'vue'

// Electron 相关
import { shell } from 'electron'

// 支持的图床列表
import { supportedPicBedList } from '../utils/constants'

// Element Plus 图标
import { CirclePlus, SuccessFilled, Folder, Switch, Tools, ChromeFilled, HomeFilled, FolderOpened } from '@element-plus/icons-vue'

// Vue Router 相关
import { useRouter, useRoute } from 'vue-router'

// Element Plus 通知组件
import { ElNotification } from 'element-plus'

// 数据发送工具函数
import { invokeToMain } from '../utils/dataSender'

// 新建图床配置
import { newBucketConfig } from '../utils/newBucketConfig'

// 状态管理相关
import { useManageStore } from '../store/manageStore'

// 国际化函数
import { T as $T } from '@/i18n'
import path from 'path'

const manageStore = useManageStore() as any
const route = useRoute()
const router = useRouter()

const currentAlias = ref(route.query.alias as string)
const currentPicBedName = ref(route.query.picBedName as string)

let allPicBedConfigure = JSON.parse(route.query.allPicBedConfigure as string)
let currentPagePicBedConfig = reactive(JSON.parse(route.query.config as string))

const newBucketConfigResult: IStringKeyMap = reactive({})
const bucketList = ref({} as IStringKeyMap)
const currentSelectedBucket = ref('')
const bucketNameList = ref([] as string[])

const isLoadingBucketList = ref(false)
const nweBucketDrawerVisible = ref(false)
const picBedSwitchDialogVisible = ref(false)

watch(route, async (newRoute) => {
  if (newRoute.fullPath.split('?')[0] === '/main-page/manage-main-page') {
    currentAlias.value = newRoute.query.alias as string
    currentPicBedName.value = newRoute.query.picBedName as string
    allPicBedConfigure = JSON.parse(newRoute.query.allPicBedConfigure as string)
    currentPagePicBedConfig = reactive(JSON.parse(newRoute.query.config as string))
    await getBucketList()
  }
})

const getCurrentActiveBucket = computed(() => bucketNameList.value.length === 0 ? '' : bucketNameList.value[0])

const urlMap : IStringKeyMap = {
  smms: 'https://smms.app',
  github: 'https://github.com',
  imgur: 'https://imgur.com',
  aliyun: 'https://oss.console.aliyun.com',
  qiniu: 'https://portal.qiniu.com',
  tcyun: 'https://console.cloud.tencent.com/cos',
  upyun: 'https://console.upyun.com',
  s3plist: 'https://aws.amazon.com/cn/s3/',
  webdavplist: 'https://baike.baidu.com/item/WebDAV/4610909',
  local: 'https://piclist.cn'
}

const showNewIconList = ['aliyun', 'qiniu', 'tcyun']

const bucketT = $T('MANAGE_MAIN_PAGE_BUCKET')
const galleryT = $T('MANAGE_MAIN_PAGE_GALLERY')
const repositoryT = $T('MANAGE_MAIN_PAGE_REPOSITORY')

const menuTitleMap:IStringKeyMap = {
  aliyun: bucketT,
  qiniu: bucketT,
  tcyun: bucketT,
  upyun: bucketT,
  s3plist: bucketT,
  smms: galleryT,
  imgur: galleryT,
  github: repositoryT,
  webdavplist: '',
  local: ''
}

const rules = ruleMap(newBucketConfig)

const openPicBedUrl = () => shell.openExternal(urlMap[currentPagePicBedConfig.picBedName])

function ruleMap (options: IStringKeyMap) {
  return Object.keys(options).reduce((result, key) => {
    options[key].options.forEach((option: string) => {
      const keyName = `${key}.${option}`
      const configOption = options[key].configOptions[option]
      if (configOption.rule) {
        result[keyName] = configOption.rule
      }
      if (configOption.default) {
        newBucketConfigResult[keyName] = configOption.default
      }
    })
    return result
  }, {} as IStringKeyMap)
}

function openNewBucketDrawer () {
  nweBucketDrawerVisible.value = true
}

function createNewBucket (picBedName: string) {
  const configOptions = newBucketConfig[picBedName].configOptions
  const resultMap: IStringKeyMap = Object.keys(configOptions).reduce((result, key) => {
    const resultKey = `${picBedName}.${key}`
    const defaultValue = configOptions[key].default
    const resultValue = newBucketConfigResult[resultKey]

    result[key] = resultValue === '' && defaultValue !== undefined
      ? defaultValue
      : resultValue === undefined ? defaultValue ?? '' : resultValue

    return result
  }, {} as IStringKeyMap)
  if (currentPicBedName.value === 'tcyun') {
    resultMap.BucketName = `${resultMap.BucketName}-${currentPagePicBedConfig.appId}`
  }
  invokeToMain('createBucket', currentAlias, resultMap).then((result: any) => {
    if (result) {
      ElNotification({
        title: $T('MANAGE_MAIN_PAGE_TIPS'),
        message: $T('MANAGE_MAIN_PAGE_TIPS_SUCCESS'),
        type: 'success'
      })
      nweBucketDrawerVisible.value = false
      setTimeout(() => {
        getBucketList()
      }, 2000)
    } else {
      ElNotification({
        title: $T('MANAGE_MAIN_PAGE_TIPS'),
        message: $T('MANAGE_MAIN_PAGE_TIPS_FAILED'),
        type: 'error'
      })
    }
  })
}

async function getBucketList () {
  bucketList.value = {}
  bucketNameList.value = []
  isLoadingBucketList.value = true

  const result = await invokeToMain('getBucketList', currentAlias.value)
  isLoadingBucketList.value = false

  if (result.length > 0) {
    result.forEach((item: any) => {
      bucketList.value[item.Name] = item
      bucketNameList.value.push(item.Name)
    })
  }
}

function transPathToUnix (filePath: string | undefined) {
  if (!filePath) return ''
  return process.platform === 'win32' ? filePath.split(path.sep).join(path.posix.sep).replace(/^\/+|\/+$/g, '') : filePath.replace(/^\/+|\/+$/g, '')
}

function handleSelectMenu (bucketName: string) {
  const currentPicBedConfig = manageStore.config.picBed[currentAlias.value]
  const transformedConfig = JSON.parse(currentPicBedConfig.transformedConfig ?? '{}')

  let prefix = transformedConfig[bucketName]?.baseDir || '/'
  if (currentPicBedConfig.picBedName ?? currentPicBedName.value === 'local') {
    prefix = `/${transPathToUnix(prefix)}/`
  } else {
    prefix = prefix.startsWith('/') ? prefix : `/${prefix}`
    prefix = prefix.endsWith('/') ? prefix : `${prefix}/`
  }

  const configMap = {
    prefix,
    bucketName,
    customUrl: transformedConfig[bucketName]?.customUrl ?? '',
    picBedName: currentPicBedConfig.picBedName ?? currentPicBedName.value,
    alias: currentAlias.value,
    bucketConfig: bucketList.value[bucketName],
    cdnUrl: currentPicBedConfig.customUrl,
    baseDir: prefix,
    webPath: currentPicBedConfig.webPath || ''
  }
  currentSelectedBucket.value = bucketName
  console.log(configMap)
  router.push({
    path: '/main-page/manage-main-page/manage-bucket-page',
    query: {
      configMap: JSON.stringify(configMap)
    }
  })
}

function switchPicBed (picBedAlias:string) {
  if (picBedAlias === 'main') {
    router.push({
      path: '/main-page/manage-login-page'
    })
    return
  }
  if (route.fullPath.startsWith('/main-page/manage-main-page/manage-bucket-page') || route.fullPath.startsWith('/main-page/manage-main-page/manage-setting-page')
  ) {
    picBedSwitchDialogVisible.value = false
    router.push({
      path: '/main-page/manage-main-page',
      query: {
        alias: picBedAlias,
        picBedName: allPicBedConfigure[picBedAlias].picBedName,
        config: JSON.stringify(allPicBedConfigure[picBedAlias]),
        allPicBedConfigure: JSON.stringify(allPicBedConfigure)
      }
    })
  }
  currentAlias.value = picBedAlias
  currentPicBedName.value = allPicBedConfigure[picBedAlias].picBedName
  currentPagePicBedConfig = allPicBedConfigure[picBedAlias]
  picBedSwitchDialogVisible.value = false
  currentSelectedBucket.value = ''
  getBucketList()
}

function changePicBed () {
  picBedSwitchDialogVisible.value = true
}

function openBucketPageSetting () {
  router.push({
    path: '/main-page/manage-main-page/manage-setting-page'
  })
}

onBeforeMount(() => {
  getBucketList()
})
</script>

<style lang="stylus">
.layout
  height 100%
  display flex
  flex-direction row
  &__menu
    background: #fff
    color: #fff
    display: flex
    flex-direction: column
    border-bottom-right-radius: 4px
    z-index 1
    width: 130px
    position: relative
    &__button
      font-weight: bold;
      text-align: left;
      padding-left: 0px;
      padding-top: 10px;
      &__item
        color:#2d8cf0
        width: 100%
        height: 100%
        display: flex
        align-items: center
        justify-content: center
        &:hover
          cursor: pointer
          color: orange
        &__icon
          width: 25px
          height: 25px
       &__divider
        &__icon
          &:hover
            cursor: pointer
            color: orange
    &__list
      flex: 1
      overflow-y: auto
      &__item
        width: 100%
        height: 100%
        display: flex
        color: #2d8cf0
        align-items: center
        justify-content: center
        &:hover
          cursor: pointer
          color: orange
        &__icon
          width: 25px
          height: 25px
    &__setting
      position relative
      overflow hidden
      &__item
        width: 100%
        display: flex
        align-items: center
        color: #000
        justify-content: center
        font-size: 12px
        font-family: Arial, Helvetica, sans-serif
        &:hover
          cursor: pointer
          color: orange
        &__icon
          width: 25px
          height: 25px
</style>
