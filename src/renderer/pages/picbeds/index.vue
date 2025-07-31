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
        <div class="view-title">
          <span
            class="view-title-text"
            @click="handleNameClick"
          > {{ picBedName }} {{ $T('SETTINGS') }}</span>
          <el-icon>
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
                type="info"
                round
                @click="handleReset"
              >
                {{ $T('RESET_PICBED_CONFIG') }}
              </el-button>
              <el-button
                type="success"
                round
                @click="handleConfirm"
              >
                {{ $T('CONFIRM') }}
              </el-button>
              <el-button
                round
                type="warning"
                @mouseenter="handleMouseEnter"
                @mouseleave="handleMouseLeave"
              >
                <el-dropdown
                  ref="$dropdown"
                  placement="top"
                  style="color: #fff; font-size: 12px; width: 100%"
                  :disabled="picBedConfigList.length === 0"
                  teleported
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
import { Link } from '@element-plus/icons-vue'
import dayjs from 'dayjs'
import { ElDropdown, ElMessage } from 'element-plus'
import { onBeforeMount, ref } from 'vue'
import { useRoute, useRouter } from 'vue-router'

import ConfigForm from '@/components/ConfigForm.vue'
import { T as $T } from '@/i18n/index'
import { getConfig } from '@/utils/dataSender'
import { II18nLanguage, IRPCActionType } from '#/types/enum'
import { IPicGoPluginConfig, IStringKeyMap, IUploaderConfigItem, IUploaderConfigListItem } from '#/types/types'
import { configPaths } from '#/utils/configPaths'
import { picBedManualUrlList } from '#/utils/static'

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
  await getPicBeds()
  await getPicBedConfigList()
})

const handleConfirm = async () => {
  const result = (await $configForm.value?.validate()) || false
  if (result !== false) {
    await window.electron.triggerRPC<void>(IRPCActionType.UPLOADER_UPDATE_CONFIG, type.value, result?._id, result)
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

async function getPicBeds () {
  const result = await window.electron.triggerRPC<any>(IRPCActionType.PICBED_GET_PICBED_CONFIG, $route.params.type)
  config.value = result.config
  picBedName.value = result.name
}

async function getPicBedConfigList () {
  const res = (await window.electron.triggerRPC<IUploaderConfigItem>(IRPCActionType.PICBED_GET_CONFIG_LIST, type.value)) || undefined
  const configList = res?.configList || []
  picBedConfigList.value = configList.filter(item => item._id !== $route.params.configId)
}

async function handleConfigImport (configItem: IUploaderConfigListItem) {
  const { _id, _configName, _updatedAt, _createdAt, ...rest } = configItem
  for (const key in rest) {
    if (Object.prototype.hasOwnProperty.call(rest, key)) {
      const value = rest[key]
      $configForm.value?.updateRuleForm(key, value)
    }
  }
  $configForm.value?.updateRuleForm('_configName', dayjs().format('YYYYMMDDHHmmss'))
}

const handleReset = async () => {
  await window.electron.triggerRPC<void>(IRPCActionType.UPLOADER_RESET_CONFIG, type.value, $route.params.configId)
  const successNotification = new Notification($T('SETTINGS_RESULT'), {
    body: $T('TIPS_RESET_SUCCEED')
  })
  successNotification.onclick = () => {
    return true
  }
  $router.back()
}

async function handleNameClick () {
  const lang = (await getConfig(configPaths.settings.language)) || II18nLanguage.ZH_CN
  const url = picBedManualUrlList[lang === II18nLanguage.EN ? 'en' : 'zh_cn'][$route.params.type as string]
  if (url) {
    window.electron.sendRPC(IRPCActionType.OPEN_URL, url)
  }
}

async function handleCopyApi () {
  try {
    const { port = 36677, host = '127.0.0.1' } = (await getConfig<IStringKeyMap>(configPaths.settings.server)) || {}
    const serverKey = (await getConfig(configPaths.settings.serverKey)) || ''
    const uploader = ((await getConfig(configPaths.uploader)) as IStringKeyMap) || {}
    const picBedConfigList = uploader[$route.params.type as string].configList || []
    const picBedConfig = picBedConfigList.find((item: IUploaderConfigListItem) => item._id === $route.params.configId)
    if (!picBedConfig) {
      ElMessage.error('No config found')
      return
    }
    const apiUrl = `http://${host === '0.0.0.0' ? '127.0.0.1' : host}:${port}/upload?picbed=${$route.params.type}&configName=${picBedConfig._configName}${serverKey ? `&key=${serverKey}` : ''}`
    window.electron.clipboard.writeText(apiUrl)
    ElMessage.success(`${$T('MANAGE_BUCKET_COPY_SUCCESS')} ${apiUrl}`)
  } catch (error) {
    console.log(error)
    ElMessage.error('Copy failed')
  }
}
</script>

<script lang="ts">
export default {
  name: 'PicbedsPage'
}
</script>

<style lang="stylus">
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
        width calc(33.3333% - 10px)
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
