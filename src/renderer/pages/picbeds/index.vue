<template>
  <div id="picbeds-page">
    <el-row
      :gutter="20"
      class="setting-list"
    >
      <el-col
        :span="22"
        :offset="1"
      >
        <div
          class="view-title"
        >
          <span
            class="view-title-text"
            @click="handleNameClick"
          >
            {{ picBedName }} {{ $T('SETTINGS') }}</span>
          <el-icon
            v-if="linkToLogInList.includes(picBedName)"
          >
            <Link />
          </el-icon>
          <el-button
            type="primary"
            round
            size="small"
            style="margin-left: 6px"
            @click="handleCopyApi"
          >
            {{ $T('UPLOAD_PAGE_COPY_UPLOAD_API') }}
          </el-button>
        </div>
        <config-form
          v-if="config.length > 0"
          :id="type"
          ref="$configForm"
          :config="config"
          type="uploader"
        >
          <el-form-item>
            <el-button-group>
              <el-button
                class="confirm-btn"
                type="info"
                round
                @click="handleReset"
              >
                {{ $T('RESET_PICBED_CONFIG') }}
              </el-button>
              <el-button
                class="confirm-btn"
                type="success"
                round
                @click="handleConfirm"
              >
                {{ $T('CONFIRM') }}
              </el-button>
              <el-button
                class="confirm-btn"
                round
                type="warning"
                @mouseenter="handleMouseEnter"
                @mouseleave="handleMouseLeave"
              >
                <el-dropdown
                  ref="$dropdown"
                  placement="top"
                  style="color: #fff; font-size: 12px;width: 100%;"
                  :disabled="picBedConfigList.length === 0"
                >
                  {{ $T('MANAGE_LOGIN_PAGE_PANE_IMPORT') }}
                  <template #dropdown>
                    <el-dropdown-item
                      v-for="i in picBedConfigList"
                      :key="i._id"
                      @click="handleConfigImport(i)"
                    >
                      {{ i._configName }}
                    </el-dropdown-item>
                  </template>
                </el-dropdown>
              </el-button>
            </el-button-group>
          </el-form-item>
        </config-form>
        <div
          v-else
          class="single"
        >
          <div class="notice">
            {{ $T('SETTINGS_NOT_CONFIG_OPTIONS') }}
          </div>
        </div>
      </el-col>
    </el-row>
  </div>
</template>
<script lang="ts" setup>
// 枚举类型声明
import { IRPCActionType } from '~/universal/types/enum'

// Vue 相关
import { ref, onBeforeUnmount, onBeforeMount } from 'vue'

// 国际化函数
import { T as $T } from '@/i18n/index'

// 数据发送工具函数
import { getConfig, sendToMain, triggerRPC } from '@/utils/dataSender'

// Vue Router 相关
import { useRoute, useRouter } from 'vue-router'

// 组件
import ConfigForm from '@/components/ConfigForm.vue'

// Electron 相关
import {
  clipboard,
  ipcRenderer,
  IpcRendererEvent
} from 'electron'

// 事件常量
import { OPEN_URL } from '~/universal/events/constants'

// Element Plus 图标
import { Link } from '@element-plus/icons-vue'

// 时间处理库
import dayjs from 'dayjs'

// Element Plus 下拉菜单组件
import { ElDropdown, ElMessage } from 'element-plus'

const type = ref('')
const config = ref<IPicGoPluginConfig[]>([])
const picBedConfigList = ref<IUploaderConfigListItem[]>([])
const picBedName = ref('')
const $route = useRoute()
const $router = useRouter()
const $configForm = ref<InstanceType<typeof ConfigForm> | null>(null)
const $dropdown = ref<InstanceType<typeof ElDropdown> | null>(null)
type.value = $route.params.type as string

onBeforeMount(async () => {
  sendToMain('getPicBedConfig', $route.params.type)
  ipcRenderer.on('getPicBedConfig', getPicBeds)
  await getPicBedConfigList()
})

const handleConfirm = async () => {
  const result = (await $configForm.value?.validate()) || false
  if (result !== false) {
    await triggerRPC<void>(IRPCActionType.UPDATE_UPLOADER_CONFIG, type.value, result?._id, result)
    const successNotification = new Notification($T('SETTINGS_RESULT'), {
      body: $T('TIPS_SET_SUCCEED')
    })
    successNotification.onclick = () => {
      return true
    }
    $router.back()
  }
}

function handleMouseEnter () {
  $dropdown.value?.handleOpen()
}

function handleMouseLeave () {
  $dropdown.value?.handleClose()
}

async function getPicBedConfigList () {
  const res = await triggerRPC<IUploaderConfigItem>(IRPCActionType.GET_PICBED_CONFIG_LIST, type.value) || undefined
  const configList = res?.configList || []
  picBedConfigList.value = configList.filter((item) => item._id !== $route.params.configId)
}

async function handleConfigImport (configItem: IUploaderConfigListItem) {
  const { _id, _configName, _updatedAt, _createdAt, ...rest } = configItem
  for (const key in rest) {
    if (Object.prototype.hasOwnProperty.call(rest, key)) {
      const value = rest[key]
      $configForm.value?.updateRuleForm(key, value)
    }
  }
  $configForm.value?.updateRuleForm('_configName', dayjs(_updatedAt).format('YYYYMMDDHHmmss'))
}

const handleReset = async () => {
  await triggerRPC<void>(IRPCActionType.RESET_UPLOADER_CONFIG, type.value, $route.params.configId)
  const successNotification = new Notification($T('SETTINGS_RESULT'), {
    body: $T('TIPS_RESET_SUCCEED')
  })
  successNotification.onclick = () => {
    return true
  }
  $router.back()
}

const linkToLogInList = ['GitHub', '腾讯云COS', '阿里云OSS', 'SM.MS', '七牛云', 'Imgur', '又拍云', 'githubPlus']

function handleNameClick () {
  switch ($route.params.type) {
    case 'github':
    case 'githubPlus':
      sendToMain(OPEN_URL, 'https://github.com')
      break
    case 'tcyun':
      sendToMain(OPEN_URL, 'https://cloud.tencent.com/login')
      break
    case 'aliyun':
      sendToMain(OPEN_URL, 'https://account.aliyun.com/login/login.htm')
      break
    case 'smms':
      sendToMain(OPEN_URL, 'https://smms.app')
      break
    case 'qiniu':
      sendToMain(OPEN_URL, 'https://portal.qiniu.com')
      break
    case 'imgur':
      sendToMain(OPEN_URL, 'https://imgur.com')
      break
    case 'upyun':
      sendToMain(OPEN_URL, 'https://console.upyun.com')
      break
    default:
      break
  }
}

async function handleCopyApi () {
  try {
    const serverConfig = await getConfig<IStringKeyMap>('settings.server') || {
      port: 36677,
      host: '127.0.0.1'
    }
    const { port, host } = serverConfig
    const uploader = await getConfig('uploader') as IStringKeyMap || {}
    const picBedConfigList = uploader[$route.params.type as string].configList || []
    const picBedConfig = picBedConfigList.find((item: IUploaderConfigListItem) => item._id === $route.params.configId)
    const apiUrl = `http://${host}:${port}/upload?picbed=${$route.params.type}&configName=${picBedConfig?._configName}`
    clipboard.writeText(apiUrl)
    ElMessage.success($T('MANAGE_BUCKET_COPY_SUCCESS') + ' ' + apiUrl)
  } catch (error) {
    console.log(error)
    ElMessage.error('Copy failed')
  }
}

function getPicBeds (_event: IpcRendererEvent, _config: IPicGoPluginConfig[], name: string) {
  config.value = _config
  picBedName.value = name
}

onBeforeUnmount(() => {
  ipcRenderer.removeListener('getPicBedConfig', getPicBeds)
})

</script>
<script lang="ts">
export default {
  name: 'PicbedsPage'
}
</script>
<style lang='stylus'>
#picbeds-page
  height 100%
  overflow-y auto
  overflow-x hidden
  position absolute
  left 142px
  right 0
  .setting-list
    height 100%
    overflow-y auto
    overflow-x hidden
  .view-title-text
    &:hover
      cursor pointer
      color #409EFF
  .confirm-btn
    width: 110px
  .el-form
    label
      line-height 22px
      padding-bottom 0
      color #eee
    &-item
      margin-bottom 16px
    .el-button-group
      width 100%
      .el-button
        width 33%
    .el-radio-group
      margin-left 25px
    .el-switch__label
      color #eee
      &.is-active
        color #409EFF
  .notice
    color #eee
    text-align center
    margin-bottom 10px
  .single
    text-align center
</style>
