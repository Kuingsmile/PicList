<template>
  <div id="config-list-view">
    <div class="view-title">
      {{ $T('SETTINGS') }}
    </div>
    <el-row :gutter="15" justify="space-between" align="middle" type="flex" class="config-list">
      <el-col
        v-for="item in curConfigList"
        :key="item._id"
        class="config-item-col"
        :xs="24"
        :sm="curConfigList.length === 1 ? 24 : 12"
        :md="curConfigList.length === 1 ? 24 : 12"
        :lg="curConfigList.length === 1 ? 12 : 6"
        :xl="curConfigList.length === 1 ? 12 : 3"
      >
        <div
          :class="`config-item ${defaultConfigId === item._id ? 'selected' : ''}`"
          @click="() => selectItem(item._id)"
        >
          <div class="config-name">
            {{ item._configName }}
          </div>
          <div class="config-update-time">
            {{ formatTime(item._updatedAt) }}
          </div>
          <div v-if="defaultConfigId === item._id" class="default-text">
            {{ $T('SELECTED_SETTING_HINT') }}
          </div>
          <div class="operation-container">
            <el-icon class="el-icon-edit" @click="openEditPage(item._id)">
              <Edit />
            </el-icon>
            <el-icon
              class="el-icon-delete"
              :class="curConfigList.length <= 1 ? 'disabled' : ''"
              @click.stop="() => deleteConfig(item._id)"
            >
              <Delete />
            </el-icon>
          </div>
        </div>
      </el-col>
      <el-col
        class="config-item-col"
        :xs="24"
        :sm="curConfigList.length === 1 ? 24 : 12"
        :md="curConfigList.length === 1 ? 24 : 12"
        :lg="curConfigList.length === 1 ? 12 : 6"
        :xl="curConfigList.length === 1 ? 12 : 3"
      >
        <div class="config-item config-item-add" @click="addNewConfig">
          <el-icon class="el-icon-plus">
            <Plus />
          </el-icon>
        </div>
      </el-col>
    </el-row>
    <el-row type="flex" justify="center" :span="24" class="set-default-container">
      <el-button
        class="set-default-btn"
        type="success"
        round
        :disabled="store?.state.defaultPicBed === type"
        @click="setDefaultPicBed(type)"
      >
        {{ $T('SETTINGS_SET_DEFAULT_PICBED') }}
      </el-button>
    </el-row>
  </div>
</template>

<script lang="ts" setup>
import dayjs from 'dayjs'
import { Edit, Delete, Plus } from '@element-plus/icons-vue'
import { onBeforeMount, ref } from 'vue'
import { useRouter, useRoute, onBeforeRouteUpdate } from 'vue-router'
import { saveConfig } from '@/utils/dataSender'

import { T as $T } from '@/i18n/index'
import { useStore } from '@/hooks/useStore'
import { PICBEDS_PAGE, UPLOADER_CONFIG_PAGE } from '@/router/config'
import { sendRPC, triggerRPC } from '@/utils/common'

import { IRPCActionType } from '#/types/enum'
import { configPaths } from '#/utils/configPaths'

const router = useRouter()
const route = useRoute()

const type = ref('')
const curConfigList = ref<IStringKeyMap[]>([])
const defaultConfigId = ref('')
const store = useStore()

async function selectItem(id: string) {
  await triggerRPC<void>(IRPCActionType.UPLOADER_SELECT, type.value, id)
  if (store?.state.defaultPicBed === type.value) {
    sendRPC(
      IRPCActionType.TRAY_SET_TOOL_TIP,
      `${type.value} ${curConfigList.value.find(item => item._id === id)?._configName || ''}`
    )
  }
  defaultConfigId.value = id
}

onBeforeRouteUpdate((to, _, next) => {
  if (to.params.type && to.name === UPLOADER_CONFIG_PAGE) {
    type.value = to.params.type as string
    getCurrentConfigList()
  }
  next()
})

onBeforeMount(() => {
  type.value = route.params.type as string
  getCurrentConfigList()
})

async function getCurrentConfigList() {
  const configList = await triggerRPC<IUploaderConfigItem>(IRPCActionType.PICBED_GET_CONFIG_LIST, type.value)
  curConfigList.value = configList?.configList ?? []
  defaultConfigId.value = configList?.defaultId ?? ''
}

function openEditPage(configId: string) {
  router.push({
    name: PICBEDS_PAGE,
    params: {
      type: type.value,
      configId
    },
    query: {
      defaultConfigId: defaultConfigId.value
    }
  })
}

function formatTime(time: number): string {
  return dayjs(time).format('YY-MM-DD HH:mm')
}

async function deleteConfig(id: string) {
  const res = await triggerRPC<IUploaderConfigItem>(IRPCActionType.PICBED_DELETE_CONFIG, type.value, id)
  if (!res) return
  curConfigList.value = res.configList
  defaultConfigId.value = res.defaultId
}

function addNewConfig() {
  router.push({
    name: PICBEDS_PAGE,
    params: {
      type: type.value,
      configId: ''
    }
  })
}

function setDefaultPicBed(type: string) {
  saveConfig({
    [configPaths.picBed.current]: type,
    [configPaths.picBed.uploader]: type
  })

  store?.setDefaultPicBed(type)
  const currentConfigName = curConfigList.value.find(item => item._id === defaultConfigId.value)?._configName
  sendRPC(IRPCActionType.TRAY_SET_TOOL_TIP, `${type} ${currentConfigName || ''}`)
  const successNotification = new Notification($T('SETTINGS_DEFAULT_PICBED'), {
    body: $T('TIPS_SET_SUCCEED')
  })
  successNotification.onclick = () => {
    return true
  }
}
</script>
<script lang="ts">
export default {
  name: 'UploaderConfigPage'
}
</script>
<style lang="stylus">
#config-list-view
  position absolute
  min-height 100%
  left 162px
  right 0
  overflow-x hidden
  overflow-y auto
  padding-bottom 50px
  box-sizing border-box
  .config-list
    flex-wrap wrap
    width: 98%
    .config-item
      height 85px
      margin-bottom 20px
      border-radius 4px
      cursor pointer
      box-sizing border-box
      padding 8px
      background rgba(130, 130, 130, .2)
      border 1px solid transparent
      box-shadow 0 2px 4px rgba(0, 0, 0, .12), 0 0 6px rgba(0, 0, 0, .04)
      position relative
      .config-name
        color #eee
        font-size 16px
      .config-update-time
        color #aaa
        font-size 14px
        margin-top 10px
      .default-text
        color #67C23A
        font-size 12px
        margin-top 5px
      .operation-container
        position absolute
        right 5px
        top 8px
        left 0
        font-size 18pxc
        word-break break-all
        display flex
        align-items center
        color #eee
        .el-icon-edit
          right 20px
          position absolute
          top 2px
          margin-right 10px
          cursor pointer
        .el-icon-delete
          position absolute
          top 2px
          margin-right 10px
          right 0
          cursor pointer
        .el-icon-edit
          margin-right 10px
        .disabled
          cursor not-allowed
          color #aaa
    .config-item-add
      display: flex
      justify-content: center
      align-items: center
      color: #eee
      font-size: 28px
    .selected
      border 1px solid #409EFF
  .set-default-container
    position absolute
    bottom 10px
    width 100%
    .set-default-btn
      width 250px
</style>
