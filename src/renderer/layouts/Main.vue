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
          <el-menu-item index="MANUAL">
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
      v-model="visible"
      :title="$T('SPONSOR_PICLIST')"
      width="70%"
      top="10vh"
    >
      {{ $T('PICLIST_SPONSOR_TEXT') }}
      <el-row class="support">
        <el-col :span="12">
          <img
            width="200"
            src="https://pichoro.msq.pub/images/zhifubao_money.jpg"
            :alt="$T('ALIPAY')"
          >
          <div class="support-title">
            {{ $T('ALIPAY') }}
          </div>
        </el-col>
        <el-col :span="12">
          <img
            width="200"
            src="https://pichoro.msq.pub/images/wechat_money.jpg"
            :alt="$T('WECHATPAY')"
          >
          <div class="support-title">
            {{ $T('WECHATPAY') }}
          </div>
        </el-col>
      </el-row>
    </el-dialog>
    <el-dialog
      v-model="qrcodeVisible"
      class="qrcode-dialog"
      top="3vh"
      width="60%"
      :title="$T('PICBED_QRCODE')"
      :modal-append-to-body="false"
      lock-scroll
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
  SHOW_MAIN_PAGE_DONATION,
  GET_PICBEDS,
  OPEN_URL
} from '~/universal/events/constants'

// 数据发送工具函数
import { getConfig, sendToMain } from '@/utils/dataSender'

// Piclist 配置类型声明
import { IConfig } from 'piclist'

const version = ref(process.env.NODE_ENV === 'production' ? pkg.version : 'Dev')
const routerConfig = reactive(config)
const defaultActive = ref(routerConfig.UPLOAD_PAGE)
const visible = ref(false)
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
  ipcRenderer.on(SHOW_MAIN_PAGE_DONATION, () => {
    visible.value = true
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

const handleSelect = (index: string) => {
  if (index === 'MANUAL') {
    ElMessageBox.confirm($T('OPEN_MANUAL_LINK_HINT'), $T('OPEN_MANUAL_LINK'), {
      confirmButtonText: $T('CONFIRM'),
      cancelButtonText: $T('CANCEL'),
      type: 'warning',
      center: true
    }).then(async () => {
      let language = 'zh-CN'
      const config = (await getConfig<IConfig>())!
      if (config !== undefined) {
        const settings = config.settings || {}
        language = settings.language ?? 'zh-CN'
      }
      if (language === 'zh-CN' || language === 'zh-TW') {
        sendToMain(OPEN_URL, 'https://piclist.cn/configure.html')
      } else {
        sendToMain(OPEN_URL, 'https://piclist.cn/en/configure.html')
      }
    }).catch(() => {})
    return
  }
  defaultActive.value = index
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
  ipcRenderer.removeAllListeners(SHOW_MAIN_PAGE_DONATION)
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
