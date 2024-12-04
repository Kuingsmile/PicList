<template>
  <div id="plugin-view">
    <div class="view-title">
      {{ $T('PLUGIN_SETTINGS') }} -
      <el-tooltip :content="pluginListToolTip" placement="right" :persistent="false" teleported>
        <el-icon class="el-icon-goods" @click="goAwesomeList">
          <Goods />
        </el-icon>
      </el-tooltip>
      <el-tooltip :content="updateAllToolTip" placement="left" :persistent="false" teleported>
        <el-icon class="el-icon-update" @click="handleUpdateAllPlugin">
          <Refresh />
        </el-icon>
      </el-tooltip>
      <el-tooltip :content="importLocalPluginToolTip" placement="left">
        <el-icon class="el-icon-download" :persistent="false" teleported @click="handleImportLocalPlugin">
          <Download />
        </el-icon>
      </el-tooltip>
    </div>
    <el-row class="handle-bar" :class="{ 'cut-width': pluginList.length > 6 }">
      <el-input v-model="searchText" :placeholder="$T('PLUGIN_SEARCH_PLACEHOLDER')" size="small">
        <template #suffix>
          <el-icon class="el-input__icon" style="cursor: pointer" @click="cleanSearch">
            <close />
          </el-icon>
        </template>
      </el-input>
    </el-row>
    <el-row id="pluginList" v-loading="loading" :gutter="10" class="plugin-list">
      <el-col
        v-for="item in pluginList"
        :key="item.fullName"
        class="plugin-item__container"
        :xs="24"
        :sm="pluginList.length === 1 ? 24 : 12"
        :md="pluginList.length === 1 ? 24 : 12"
        :lg="pluginList.length === 1 ? 24 : 12"
        :xl="pluginList.length === 1 ? 24 : 12"
      >
        <div class="plugin-item" :class="{ darwin: osGlobal === 'darwin' }">
          <div v-if="!item.gui" class="cli-only-badge" title="CLI only">CLI</div>
          <img class="plugin-item__logo" :src="item.logo" :onerror="defaultLogo" />
          <div class="plugin-item__content" :class="{ disabled: !item.enabled }">
            <div class="plugin-item__name" @click="openHomepage(item.homepage)">
              {{ item.name }} <small>{{ ' ' + item.version }}</small> &nbsp;
              <!-- 升级提示 -->
              <el-tag
                v-if="latestVersionMap[item.fullName] && latestVersionMap[item.fullName] !== item.version"
                type="success"
                size="small"
                round
                effect="plain"
              >
                new
              </el-tag>
            </div>
            <div class="plugin-item__desc" :title="item.description">
              {{ item.description }}
            </div>
            <div class="plugin-item__info-bar">
              <span class="plugin-item__author">
                {{ item.author.replace(/<.*>/, '') }}
              </span>
              <span class="plugin-item__config">
                <template v-if="searchText">
                  <template v-if="!item.hasInstall">
                    <span v-if="!item.ing" class="config-button install" @click="installPlugin(item)">
                      {{ $T('PLUGIN_INSTALL') }}
                    </span>
                    <span v-else-if="item.ing" class="config-button ing">
                      {{ $T('PLUGIN_INSTALLING') }}
                    </span>
                  </template>
                  <span v-else class="config-button ing">
                    {{ $T('PLUGIN_INSTALLED') }}
                  </span>
                </template>
                <template v-else>
                  <span v-if="item.ing" class="config-button ing">
                    {{ $T('PLUGIN_DOING_SOMETHING') }}
                  </span>
                  <template v-else>
                    <el-icon v-if="item.enabled" class="el-icon-setting" @click="buildContextMenu(item)">
                      <Tools />
                    </el-icon>
                    <el-icon v-else class="el-icon-remove-outline" @click="buildContextMenu(item)">
                      <Remove />
                    </el-icon>
                  </template>
                </template>
              </span>
            </div>
          </div>
        </div>
      </el-col>
    </el-row>
    <el-row v-show="needReload" class="reload-mask" :class="{ 'cut-width': pluginList.length > 6 }" justify="center">
      <el-button type="primary" size="small" round @click="reloadApp">
        {{ $T('TIPS_NEED_RELOAD') }}
      </el-button>
    </el-row>
    <el-dialog
      v-model="dialogVisible"
      :modal-append-to-body="false"
      :title="
        $T('CONFIG_THING', {
          c: configName
        })
      "
      width="70%"
      append-to-body
    >
      <config-form :id="configName" ref="$configForm" :config="config" :type="currentType" color-mode="white" />
      <template #footer>
        <el-button round @click="dialogVisible = false">
          {{ $T('CANCEL') }}
        </el-button>
        <el-button type="primary" round @click="handleConfirmConfig">
          {{ $T('CONFIRM') }}
        </el-button>
      </template>
    </el-dialog>
  </div>
</template>

<script lang="ts" setup>
import axios from 'axios'
import { ipcRenderer, IpcRendererEvent } from 'electron'
import { ElMessageBox } from 'element-plus'
import { debounce, DebouncedFunc } from 'lodash'
import { Close, Download, Refresh, Goods, Remove, Tools } from '@element-plus/icons-vue'
import { computed, ref, onBeforeMount, onBeforeUnmount, watch, onMounted, reactive, toRaw } from 'vue'

import ConfigForm from '@/components/ConfigFormForPlugin.vue'
import { T as $T } from '@/i18n/index'
import { sendRPC } from '@/utils/common'
import { getConfig, saveConfig } from '@/utils/dataSender'
import { osGlobal, updatePicBedGlobal } from '@/utils/global'

import {
  PICGO_CONFIG_PLUGIN,
  PICGO_HANDLE_PLUGIN_ING,
  PICGO_TOGGLE_PLUGIN,
  PICGO_HANDLE_PLUGIN_DONE
} from '#/events/constants'
import { IRPCActionType } from '#/types/enum'
import { handleStreamlinePluginName } from '#/utils/common'
import { configPaths } from '#/utils/configPaths'

const $confirm = ElMessageBox.confirm
const searchText = ref('')
const pluginList = ref<IPicGoPlugin[]>([])
const config = ref<any[]>([])
const currentType = ref<'plugin' | 'uploader' | 'transformer'>('plugin')
const configName = ref('')
const dialogVisible = ref(false)
const pluginNameList = ref<string[]>([])
const loading = ref(true)
const needReload = ref(false)
const latestVersionMap = reactive<{ [key: string]: string }>({})
const pluginListToolTip = $T('PLUGIN_LIST')
const importLocalPluginToolTip = $T('PLUGIN_IMPORT_LOCAL')
const updateAllToolTip = $T('PLUGIN_UPDATE_ALL')
const defaultLogo = ref(`this.src="file://${__static.replace(/\\/g, '/')}/roundLogo.png"`)
const $configForm = ref<InstanceType<typeof ConfigForm> | null>(null)
const npmSearchText = computed(() => {
  return searchText.value.match('picgo-plugin-')
    ? searchText.value
    : searchText.value !== ''
      ? `picgo-plugin-${searchText.value}`
      : searchText.value
})
let getSearchResult: DebouncedFunc<(val: string) => void>

watch(npmSearchText, (val: string) => {
  if (val) {
    loading.value = true
    pluginList.value = []
    getSearchResult(val)
  } else {
    getPluginList()
  }
})

watch(dialogVisible, (val: boolean) => {
  if (val) {
    // @ts-expect-error ts-migrate(2531) FIXME: Object is possibly 'null'.
    document.querySelector('.main-content.el-row').style.zIndex = 101
  } else {
    // @ts-expect-error ts-migrate(2531) FIXME: Object is possibly 'null'.
    document.querySelector('.main-content.el-row').style.zIndex = 10
  }
})

async function getLatestVersionOfPlugIn(pluginName: string) {
  try {
    const res = await axios.get(`https://registry.npmjs.com/${pluginName}`)
    latestVersionMap[pluginName] = res.data['dist-tags'].latest
  } catch (err) {
    console.error(err)
  }
}

onBeforeMount(async () => {
  ipcRenderer.on('hideLoading', () => {
    loading.value = false
  })
  ipcRenderer.on(PICGO_HANDLE_PLUGIN_DONE, (_: IpcRendererEvent, fullName: string) => {
    pluginList.value.forEach(item => {
      if (item.fullName === fullName || item.name === fullName) {
        item.ing = false
      }
    })
    loading.value = false
  })
  ipcRenderer.on('pluginList', (_: IpcRendererEvent, list: IPicGoPlugin[]) => {
    pluginList.value = list
    pluginNameList.value = list.map(item => item.fullName)
    for (const item of pluginList.value) {
      getLatestVersionOfPlugIn(item.fullName)
    }
    loading.value = false
  })
  ipcRenderer.on(
    'installPlugin',
    (
      _: IpcRendererEvent,
      {
        success,
        body
      }: {
        success: boolean
        body: string
      }
    ) => {
      loading.value = false
      pluginList.value.forEach(item => {
        if (item.fullName === body) {
          item.ing = false
          item.hasInstall = success
        }
      })
    }
  )
  ipcRenderer.on('updateSuccess', (_: IpcRendererEvent, plugin: string) => {
    loading.value = false
    pluginList.value.forEach(item => {
      if (item.fullName === plugin) {
        item.ing = false
        item.hasInstall = true
      }
      updatePicBedGlobal()
    })
    handleReload()
    getPluginList()
  })
  ipcRenderer.on('uninstallSuccess', (_: IpcRendererEvent, plugin: string) => {
    loading.value = false
    pluginList.value = pluginList.value.filter(item => {
      if (item.fullName === plugin) {
        // restore Uploader & Transformer after uninstalling
        if (item.config.transformer.name) {
          handleRestoreState('transformer', item.config.transformer.name)
        }
        if (item.config.uploader.name) {
          handleRestoreState('uploader', item.config.uploader.name)
        }
        updatePicBedGlobal()
      }
      return item.fullName !== plugin
    })
    pluginNameList.value = pluginNameList.value.filter(item => item !== plugin)
  })
  ipcRenderer.on(
    PICGO_CONFIG_PLUGIN,
    (_: IpcRendererEvent, _currentType: 'plugin' | 'transformer' | 'uploader', _configName: string, _config: any) => {
      currentType.value = _currentType
      configName.value = _configName
      config.value = _config
      dialogVisible.value = true
    }
  )
  ipcRenderer.on(PICGO_HANDLE_PLUGIN_ING, (_: IpcRendererEvent, fullName: string) => {
    pluginList.value.forEach(item => {
      if (item.fullName === fullName || item.name === fullName) {
        item.ing = true
      }
    })
    loading.value = true
  })
  ipcRenderer.on(PICGO_TOGGLE_PLUGIN, (_: IpcRendererEvent, fullName: string, enabled: boolean) => {
    const plugin = pluginList.value.find(item => item.fullName === fullName)
    if (plugin) {
      plugin.enabled = enabled
      updatePicBedGlobal()
      needReload.value = true
    }
  })
  getPluginList()
  getSearchResult = debounce(_getSearchResult, 50)
  needReload.value = (await getConfig<boolean>(configPaths.needReload)) || false
})

async function buildContextMenu(plugin: IPicGoPlugin) {
  sendRPC(IRPCActionType.SHOW_PLUGIN_PAGE_MENU, plugin)
}

function handleResize() {
  const myDiv = document.getElementById('pluginList') as HTMLElement
  const windowHeight = window.innerHeight
  const newHeight = windowHeight * 0.75
  myDiv.style.height = newHeight + 'px'
}

onMounted(() => {
  window.addEventListener('resize', handleResize)
})

function getPluginList() {
  sendRPC(IRPCActionType.PLUGIN_GET_LIST)
}

function installPlugin(item: IPicGoPlugin) {
  if (!item.gui) {
    $confirm($T('TIPS_PLUGIN_NOT_GUI_IMPLEMENT'), $T('TIPS_NOTICE'), {
      confirmButtonText: $T('CONFIRM'),
      cancelButtonText: $T('CANCEL'),
      type: 'warning'
    })
      .then(() => {
        item.ing = true
        sendRPC(IRPCActionType.PLUGIN_INSTALL, item.fullName)
      })
      .catch(() => {
        console.log('Install canceled')
      })
  } else {
    item.ing = true
    sendRPC(IRPCActionType.PLUGIN_INSTALL, item.fullName)
  }
}

function reloadApp() {
  sendRPC(IRPCActionType.RELOAD_APP)
}

async function handleReload() {
  saveConfig({
    needReload: true
  })
  needReload.value = true
  const successNotification = new Notification($T('PLUGIN_UPDATE_SUCCEED'), {
    body: $T('TIPS_NEED_RELOAD')
  })
  successNotification.onclick = () => {
    reloadApp()
  }
}

function cleanSearch() {
  searchText.value = ''
}

async function handleConfirmConfig() {
  const result = (await $configForm.value?.validate()) || false
  if (result !== false) {
    switch (currentType.value) {
      case 'plugin':
        saveConfig({
          [`${configName.value}`]: result
        })
        break
      case 'uploader':
        saveConfig({
          [`picBed.${configName.value}`]: result
        })
        break
      case 'transformer':
        saveConfig({
          [`transformer.${configName.value}`]: result
        })
        break
    }
    const successNotification = new Notification($T('SETTINGS_RESULT'), {
      body: $T('TIPS_SET_SUCCEED')
    })
    successNotification.onclick = () => {
      return true
    }
    dialogVisible.value = false
    getPluginList()
  }
}

function _getSearchResult(val: string) {
  axios
    .get(`https://registry.npmjs.com/-/v1/search?text=${val}`)
    .then((res: INPMSearchResult) => {
      pluginList.value = res.data.objects
        .filter((item: INPMSearchResultObject) => {
          return item.package.name.includes('picgo-plugin-')
        })
        .map((item: INPMSearchResultObject) => {
          return handleSearchResult(item)
        })
      loading.value = false
    })
    .catch(err => {
      console.log(err)
      loading.value = false
    })
}

function handleSearchResult(item: INPMSearchResultObject) {
  const pkg = item.package
  const name = handleStreamlinePluginName(pkg.name)
  let gui = false
  if (pkg.keywords && pkg.keywords.length > 0) {
    if (pkg.keywords.includes('picgo-gui-plugin')) {
      gui = true
    }
  }
  return {
    name,
    fullName: pkg.name,
    author: pkg.author?.name || pkg.publisher?.username || 'unknown',
    description: pkg.description,
    logo: `https://cdn.jsdelivr.net/npm/${pkg.name}/logo.png`,
    config: {},
    homepage: pkg.links ? pkg.links.homepage : '',
    hasInstall: pluginNameList.value.some(plugin => plugin === pkg.name),
    version: pkg.version,
    gui,
    ing: false // installing or uninstalling
  }
}

// restore Uploader & Transformer
async function handleRestoreState(item: string, name: string) {
  if (item === 'uploader') {
    const current = await getConfig(configPaths.picBed.current)
    if (current === name) {
      saveConfig({
        [configPaths.picBed.current]: 'smms',
        [configPaths.picBed.uploader]: 'smms'
      })
    }
  }
  if (item === 'transformer') {
    const current = await getConfig(configPaths.picBed.transformer)
    if (current === name) {
      saveConfig({
        [configPaths.picBed.transformer]: 'path'
      })
    }
  }
}

function openHomepage(url: string) {
  if (url) {
    sendRPC(IRPCActionType.OPEN_URL, url)
  }
}

function goAwesomeList() {
  sendRPC(IRPCActionType.OPEN_URL, 'https://github.com/PicGo/Awesome-PicGo')
}

function handleImportLocalPlugin() {
  sendRPC(IRPCActionType.PLUGIN_IMPORT_LOCAL)
  loading.value = true
}

function handleUpdateAllPlugin() {
  sendRPC(IRPCActionType.PLUGIN_UPDATE_ALL, toRaw(pluginNameList.value))
}

onBeforeUnmount(() => {
  window.removeEventListener('resize', handleResize)
  ipcRenderer.removeAllListeners('pluginList')
  ipcRenderer.removeAllListeners('installPlugin')
  ipcRenderer.removeAllListeners('uninstallSuccess')
  ipcRenderer.removeAllListeners('updateSuccess')
  ipcRenderer.removeAllListeners('hideLoading')
  ipcRenderer.removeAllListeners(PICGO_HANDLE_PLUGIN_DONE)
})
</script>
<script lang="ts">
export default {
  name: 'PluginPage'
}
</script>
<style lang="stylus">
$darwinBg = #172426
#plugin-view
  position absolute
  left 142px
  right 0
  .el-loading-mask
    background-color rgba(0, 0, 0, 0.8)
  .plugin-list
    align-content flex-start
    height: 600px;
    box-sizing: border-box;
    padding: 8px 15px;
    overflow-y: auto;
    overflow-x: hidden;
    position: absolute;
    top: 70px;
    left: 5px;
    transition: all 0.2s ease-in-out 0.1s;
    width: 100%
    .el-loading-mask
      left: 20px
      width: calc(100% - 40px)
  .view-title
    color #eee
    font-size 20px
    text-align center
    margin 10px auto
    position relative
    i.el-icon-goods
      margin-left 4px
      font-size 20px
      vertical-align middle
      cursor pointer
      transition color .2s ease-in-out
      &:hover
        color #49B1F5
    i.el-icon-update
      position absolute
      right 35px
      top 8px
      font-size 20px
      vertical-align middle
      cursor pointer
      transition color .2s ease-in-out
      &:hover
        color #49B1F5
    i.el-icon-download
      position absolute
      right 5px
      top 8px
      font-size 20px
      vertical-align middle
      cursor pointer
      transition color .2s ease-in-out
      &:hover
        color #49B1F5
  .handle-bar
    margin-bottom 20px
    &.cut-width
      padding-right: 8px
  .el-input__inner
    border-radius 0
  .plugin-item
    box-sizing border-box
    height 80px
    background #444
    padding 8px
    user-select text
    transition all .2s ease-in-out
    position relative
    &__container
      height 80px
      margin-bottom 10px
    .cli-only-badge
      position absolute
      right 0px
      top 0
      font-size 12px
      padding 3px 8px
      background #49B1F5
      color #eee
    &.darwin
      background transparentify($darwinBg, #000, 0.75)
      &:hover
        background transparentify($darwinBg, #000, 0.85)
    &:hover
      background #333
    &__logo
      width 64px
      height 64px
      float left
    &__content
      float left
      width calc(100% - 72px)
      height 64px
      color #ddd
      margin-left 8px
      display flex
      flex-direction column
      justify-content space-between
      &.disabled
        color #aaa
    &__name
      font-size 16px
      height 22px
      line-height 22px
      font-weight 600
      cursor pointer
      text-overflow ellipsis
      white-space nowrap
      overflow hidden
      transition all .2s ease-in-out
      &:hover
        color: #1B9EF3
    &__desc
      font-size 14px
      height 21px
      line-height 21px
      overflow hidden
      text-overflow ellipsis
      white-space nowrap
    &__info-bar
      font-size 14px
      height 21px
      line-height 28px
      position relative
    &__author
      overflow hidden
      text-overflow ellipsis
      white-space nowrap
    &__config
      float right
      font-size 16px
      cursor pointer
      transition all .2s ease-in-out
      &:hover
        color: #1B9EF3
    .config-button
      font-size 12px
      color #ddd
      background #222
      padding 1px 8px
      height 18px
      line-height 18px
      text-align center
      position absolute
      top 4px
      right 20px
      transition all .2s ease-in-out
      &.reload
        right 0px
      &.ing
        right 0px
      &.install
        right 0px
        &:hover
          background: #1B9EF3
          color #fff
  .reload-mask
    position absolute
    width calc(100% - 40px)
    bottom -320px
    text-align center
    background rgba(0,0,0,0.4)
    padding 10px 0
    &.cut-width
      width calc(100% - 48px)
</style>
