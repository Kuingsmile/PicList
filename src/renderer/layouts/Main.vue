<template>
  <div id="main-page">
    <div
      class="fake-title-bar"
    >
      <div class="fake-title-bar__title">
        PicList - {{ version }}
      </div>
      <div
        v-if="os !== 'darwin'"
        class="handle-bar"
      >
        <el-icon
          class="minus"
          :color="isAlwaysOnTop ? '#409EFF' : '#fff'"
          size="20"
          style="margin-right: 10px;"
          @click="setAlwaysOnTop"
        >
          <ArrowUpBold />
        </el-icon>
        <el-icon
          class="minus"
          color="#fff"
          size="20"
          style="margin-right: 10px;"
          @click="minimizeWindow"
        >
          <SemiSelect />
        </el-icon>
        <el-icon
          class="plus"
          color="orange"
          size="20"
          style="margin-right: 10px;"
          @click="openMiniWindow"
        >
          <ArrowDownBold />
        </el-icon>
        <el-icon
          class="close"
          color="#fff"
          size="20"
          @click="closeWindow"
        >
          <CloseBold />
        </el-icon>
      </div>
    </div>
    <el-progress
      v-if="progressShow"
      :percentage="progressPercentage"
      :stroke-width="7"
      :text-inside="true"
      :show-text="false"
      status="success"
      class="progress-bar"
    />
    <el-row
      style="padding-top: 22px;"
      class="main-content"
    >
      <el-col
        class="side-bar-menu"
      >
        <el-menu
          class="picgo-sidebar"
          :default-active="defaultActive"
          :unique-opened="true"
          @select="handleSelect"
          @open="handleGetPicPeds"
        >
          <el-menu-item :index="routerConfig.UPLOAD_PAGE">
            <el-icon>
              <UploadFilled />
            </el-icon>
            <span>{{ $T('UPLOAD_AREA') }}</span>
          </el-menu-item>
          <el-menu-item :index="routerConfig.MANAGE_LOGIN_PAGE">
            <el-icon>
              <PieChart />
            </el-icon>
            <span>{{ $T('MANAGE_PAGE') }}</span>
          </el-menu-item>
          <el-menu-item :index="routerConfig.GALLERY_PAGE">
            <el-icon>
              <PictureFilled />
            </el-icon>
            <span>{{ $T('GALLERY') }}</span>
          </el-menu-item>
          <el-sub-menu
            index="sub-menu"
            :show-timeout="0"
            :hide-timeout="0"
            :popper-offset="0"
          >
            <template #title>
              <el-icon>
                <Menu />
              </el-icon>
              <span>{{ $T('PICBEDS_SETTINGS') }}</span>
            </template>
            <template
              v-for="item in picBed"
            >
              <el-menu-item
                v-if="item.visible"
                :key="item.type"
                :index="`${routerConfig.UPLOADER_CONFIG_PAGE}-${item.type}`"
              >
                <span>{{ item.name }}</span>
              </el-menu-item>
            </template>
          </el-sub-menu>
          <el-menu-item :index="routerConfig.SETTING_PAGE">
            <el-icon>
              <Tools />
            </el-icon>
            <span>{{ $T('PICLIST_SETTINGS') }}</span>
          </el-menu-item>
          <el-menu-item :index="routerConfig.PLUGIN_PAGE">
            <el-icon>
              <Share />
            </el-icon>
            <span>{{ $T('PLUGIN_SETTINGS') }}</span>
          </el-menu-item>
          <el-menu-item
            :index="routerConfig.DocumentPage"
          >
            <el-icon>
              <Link />
            </el-icon>
            <span>{{ $T('MANUAL') }}</span>
          </el-menu-item>
        </el-menu>
        <el-icon
          class="info-window"
          @click="openMenu"
        >
          <InfoFilled />
        </el-icon>
      </el-col>
      <el-col
        :span="21"
        :offset="3"
        style="height: 100%"
        class="main-wrapper"
      >
        <router-view
          v-slot="{ Component }"
        >
          <transition
            name="picgo-fade"
            mode="out-in"
          >
            <keep-alive :include="keepAlivePages">
              <component
                :is="Component"
              />
            </keep-alive>
          </transition>
        </router-view>
      </el-col>
    </el-row>
    <el-dialog
      v-model="qrcodeVisible"
      class="qrcode-dialog"
      top="3vh"
      width="60%"
      :title="$T('PICBED_QRCODE')"
      :modal-append-to-body="false"
      lock-scroll
      append-to-body
    >
      <el-form
        label-position="left"
        label-width="70px"
        size="small"
      >
        <el-form-item
          :label="$T('CHOOSE_PICBED')"
        >
          <el-select
            v-model="choosedPicBedForQRCode"
            multiple
            collapse-tags
            :persistent="false"
            teleported
          >
            <el-option
              v-for="item in picBed"
              :key="item.type"
              :label="item.name"
              :value="item.type"
            />
          </el-select>
          <el-button
            v-show="choosedPicBedForQRCode.length > 0"
            type="primary"
            round
            class="copy-picbed-config"
            @click="handleCopyPicBedConfig"
          >
            {{ $T('COPY_PICBED_CONFIG') }}
          </el-button>
        </el-form-item>
      </el-form>
      <div class="qrcode-container">
        <qrcode-vue
          v-show="choosedPicBedForQRCode.length > 0"
          :size="280"
          :value="picBedConfigString"
        />
      </div>
    </el-dialog>
    <input-box-dialog />
  </div>
</template>
<script lang="ts" setup>
// Element Plus 图标
import {
  Tools,
  UploadFilled,
  PictureFilled,
  Menu,
  Share,
  InfoFilled,
  SemiSelect,
  ArrowDownBold,
  CloseBold,
  PieChart,
  Link,
  ArrowUpBold
} from '@element-plus/icons-vue'

// Element Plus 消息框组件
import { ElMessage as $message, ElMessageBox } from 'element-plus'

// 国际化函数
import { T as $T } from '@/i18n/index'

// Vue 相关
import { ref, onBeforeUnmount, Ref, onBeforeMount, watch, nextTick, reactive } from 'vue'

// Vue Router 相关
import { onBeforeRouteUpdate, useRouter } from 'vue-router'

// 二维码组件
import QrcodeVue from 'qrcode.vue'

// Lodash pick 函数
import pick from 'lodash/pick'

// 根目录 package.json
import pkg from 'root/package.json'

// 路由配置常量
import * as config from '@/router/config'

// Electron 相关
import {
  ipcRenderer,
  IpcRendererEvent,
  clipboard
} from 'electron'

// 输入框对话框组件
import InputBoxDialog from '@/components/InputBoxDialog.vue'

// 事件常量
import {
  MINIMIZE_WINDOW,
  CLOSE_WINDOW,
  SHOW_MAIN_PAGE_MENU,
  SHOW_MAIN_PAGE_QRCODE,
  GET_PICBEDS
} from '~/universal/events/constants'

// 数据发送工具函数
import { getConfig, saveConfig, sendToMain } from '@/utils/dataSender'
import { openURL } from '@/utils/common'

const version = ref(process.env.NODE_ENV === 'production' ? pkg.version : 'Dev')
const routerConfig = reactive(config)
const defaultActive = ref(routerConfig.UPLOAD_PAGE)
const os = ref('')
const $router = useRouter()
const picBed: Ref<IPicBedType[]> = ref([])
const qrcodeVisible = ref(false)
const picBedConfigString = ref('')
const choosedPicBedForQRCode: Ref<string[]> = ref([])
const isAlwaysOnTop = ref(false)
const keepAlivePages = $router.getRoutes().filter(item => item.meta.keepAlive).map(item => item.name as string)

const progressShow = ref(false)
const progressPercentage = ref(0)

onBeforeMount(() => {
  os.value = process.platform
  sendToMain(GET_PICBEDS)
  ipcRenderer.on(GET_PICBEDS, getPicBeds)
  handleGetPicPeds()
  ipcRenderer.on(SHOW_MAIN_PAGE_QRCODE, () => {
    qrcodeVisible.value = true
  })
  ipcRenderer.on('updateProgress', (_event: IpcRendererEvent, data: { progress: number}) => {
    progressShow.value = data.progress !== 100 && data.progress !== 0
    progressPercentage.value = data.progress
  })
})

watch(() => choosedPicBedForQRCode, (val) => {
  if (val.value.length > 0) {
    nextTick(async () => {
      const picBedConfig = await getConfig('picBed')
      const config = pick(picBedConfig, ...choosedPicBedForQRCode.value)
      picBedConfigString.value = JSON.stringify(config)
    })
  }
}, { deep: true })

const handleGetPicPeds = () => {
  sendToMain(GET_PICBEDS)
}

const handleSelect = async (index: string) => {
  defaultActive.value = index
  if (index === routerConfig.DocumentPage) {
    const manualPageOpenSetting = await getConfig('settings.manualPageOpen')
    const lang = await getConfig('settings.language') || 'zh-CN'
    const openManual = () => ipcRenderer.send('openManualWindow')
    const openExternal = () => openURL(lang === 'zh-CN' ? 'https://piclist.cn/app.html' : 'https://piclist.cn/en/app.html')

    if (!manualPageOpenSetting) {
      ElMessageBox.confirm($T('MANUAL_PAGE_OPEN_TIP'), $T('MANUAL_PAGE_OPEN_TIP_TITLE'), {
        confirmButtonText: $T('MANUAL_PAGE_OPEN_BY_BROWSER'),
        cancelButtonText: $T('MANUAL_PAGE_OPEN_BY_BUILD_IN'),
        type: 'info',
        center: true
      }).then(() => {
        saveConfig('settings.manualPageOpen', 'browser')
        openExternal()
      }).catch(() => {
        saveConfig('settings.manualPageOpen', 'window')
        openManual()
      })
    } else {
      manualPageOpenSetting === 'window' ? openManual() : openExternal()
    }
    return
  }
  const type = index.match(routerConfig.UPLOADER_CONFIG_PAGE)
  if (type === null) {
    $router.push({
      name: index
    })
  } else {
    const type = index.replace(`${routerConfig.UPLOADER_CONFIG_PAGE}-`, '')
    $router.push({
      name: routerConfig.UPLOADER_CONFIG_PAGE,
      params: {
        type
      }
    })
  }
}

function minimizeWindow () {
  sendToMain(MINIMIZE_WINDOW)
}

function closeWindow () {
  sendToMain(CLOSE_WINDOW)
}

function openMenu () {
  sendToMain(SHOW_MAIN_PAGE_MENU)
}

function openMiniWindow () {
  sendToMain('openMiniWindow')
}

function handleCopyPicBedConfig () {
  clipboard.writeText(picBedConfigString.value)
  $message.success($T('COPY_PICBED_CONFIG_SUCCEED'))
}

function getPicBeds (event: IpcRendererEvent, picBeds: IPicBedType[]) {
  picBed.value = picBeds
}

function setAlwaysOnTop () {
  isAlwaysOnTop.value = !isAlwaysOnTop.value
  sendToMain('toggleMainWindowAlwaysOnTop', isAlwaysOnTop.value)
}

onBeforeRouteUpdate(async (to) => {
  if (to.params.type) {
    defaultActive.value = `${routerConfig.UPLOADER_CONFIG_PAGE}-${to.params.type}`
  } else {
    defaultActive.value = to.name as string
  }
})

onBeforeUnmount(() => {
  ipcRenderer.removeListener(GET_PICBEDS, getPicBeds)
  ipcRenderer.removeAllListeners(SHOW_MAIN_PAGE_QRCODE)
  ipcRenderer.removeAllListeners('updateProgress')
})

</script>
<script lang="ts">
export default {
  name: 'MainPage'
}
</script>
<style lang='stylus'>
$darwinBg = transparentify(#172426, #000, 0.7)
.setting-list-scroll
  height 800px
  overflow-y auto
  overflow-x hidden
  margin-right 0!important
.picgo-fade
  &-enter,
  &-leave,
  &-leave-active
    opacity 0
  &-enter-active,
  &-leave-active
    transition all 150ms linear
.view-title
  color #eee
  font-size 20px
  text-align center
  margin 10px auto
#main-page
  height 100%
  .qrcode-dialog
    .qrcode-container
      display flex
      justify-content center
    .el-dialog__body
      padding-top 10px
    .copy-picbed-config
      margin-left 10px
  .fake-title-bar
    -webkit-app-region drag
    height h = 22px
    width 100%
    text-align center
    color #eee
    font-size 12px
    line-height h
    position fixed
    z-index 100
    &.darwin
      background transparent
      background-image linear-gradient(
        to right,
        transparent 0%,
        transparent 167px,
        $darwinBg 167px,
        $darwinBg 100%
      )
      .fake-title-bar__title
        padding-left 167px
    .handle-bar
      position absolute
      top 2px
      right 4px
      z-index 10000
      -webkit-app-region no-drag
      .el-icon
        cursor pointer
        font-size 16px
        margin-left 5px
      .el-icon.minus
        &:hover
          color #409EFF
      .el-icon.close
        &:hover
          color #F15140
      .el-icon.plus
        &:hover
          color #69C282
  .main-wrapper
    &.darwin
      background $darwinBg
  .side-bar-menu
    position fixed
    height calc(100vh - 22px)
    overflow-x hidden
    overflow-y auto
    width 142px
    .info-window
      cursor pointer
      position fixed
      bottom 4px
      left 4px
      cursor poiter
      color #878d99
      transition .2s all ease-in-out
      &:hover
        color #409EFF
  .el-menu
    border-right none
    background transparent
    width 142px
    &-item
      color #eee
      position relative
      &:focus,
      &:hover
        color #fff
        background transparent
      &.is-active
        color active-color = #409EFF
        &:before
          content ''
          position absolute
          width 1px
          height 20px
          right 0
          top 18px
          background active-color
  .el-sub-menu__title
    color #eee
    &:hover
      background transparent
      span
        color #fff
  .el-sub-menu
    .el-menu-item
      min-width 142px
      &.is-active
        &:before
          top 16px
  .main-content
    padding-top 22px
    position relative
    height calc(100vh - 22px)
    z-index 10
  .el-dialog__body
    padding 20px
  .support
    text-align center
    &-title
      text-align center
      color #878d99
  .align-center
    input
      text-align center
  *::-webkit-scrollbar
    width 2px
    height 8px
  *::-webkit-scrollbar-thumb
    border-radius 4px
    background #6f6f6f
  *::-webkit-scrollbar-track
    background-color transparent
</style>
