<template>
  <div id="picbeds-page">
    <el-row
      :gutter="20"
      class="setting-list"
    >
      <el-col
        :span="20"
        :offset="2"
      >
        <div
          class="view-title"
          @click="handelNameClick"
        >
          {{ picBedName }} {{ $T('SETTINGS') }}
          <el-icon
            v-if="linkToLogInList.includes(picBedName)"
          >
            <Link />
          </el-icon>
        </div>
        <config-form
          v-if="config.length > 0"
          :id="type"
          ref="$configForm"
          :config="config"
          type="uploader"
        >
          <el-form-item>
            <el-button
              class="confirm-btn"
              type="primary"
              round
              @click="handleConfirm"
            >
              {{ $T('CONFIRM') }}
            </el-button>
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
import { IRPCActionType } from '~/universal/types/enum'
import { ref, onBeforeUnmount, onBeforeMount } from 'vue'
import { T as $T } from '@/i18n/index'
import { sendToMain, triggerRPC } from '@/utils/dataSender'
import { useRoute, useRouter } from 'vue-router'
import ConfigForm from '@/components/ConfigForm.vue'
// import mixin from '@/utils/ConfirmButtonMixin'
import {
  ipcRenderer,
  IpcRendererEvent
} from 'electron'
import { OPEN_URL } from '~/universal/events/constants'
import { Link } from '@element-plus/icons-vue'
const type = ref('')
const config = ref<IPicGoPluginConfig[]>([])
const picBedName = ref('')
const $route = useRoute()
const $router = useRouter()
const $configForm = ref<InstanceType<typeof ConfigForm> | null>(null)
type.value = $route.params.type as string

onBeforeMount(() => {
  sendToMain('getPicBedConfig', $route.params.type)
  ipcRenderer.on('getPicBedConfig', getPicBeds)
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

const linkToLogInList = ['GitHub', '腾讯云COS', '阿里云OSS', 'SM.MS', '七牛云', 'Imgur', '又拍云', 'githubPlus']

function handelNameClick () {
  switch (picBedName.value) {
    case 'GitHub':
    case 'githubPlus':
      sendToMain(OPEN_URL, 'https://github.com')
      break
    case '腾讯云COS':
      sendToMain(OPEN_URL, 'https://cloud.tencent.com/login')
      break
    case '阿里云OSS':
      sendToMain(OPEN_URL, 'https://account.aliyun.com/login/login.htm')
      break
    case 'SM.MS':
      sendToMain(OPEN_URL, 'https://smms.app')
      break
    case '七牛云':
      sendToMain(OPEN_URL, 'https://portal.qiniu.com')
      break
    case 'Imgur':
      sendToMain(OPEN_URL, 'https://imgur.com')
      break
    case '又拍云':
      sendToMain(OPEN_URL, 'https://console.upyun.com')
      break
    default:
      break
  }
}

function getPicBeds (event: IpcRendererEvent, _config: IPicGoPluginConfig[], name: string) {
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
  .setting-list
    height 100%
    overflow-y auto
    overflow-x hidden
  .view-title
    &:hover
      cursor pointer
      color #409EFF
  .confirm-btn
    width: 250px
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
        width 50%
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
