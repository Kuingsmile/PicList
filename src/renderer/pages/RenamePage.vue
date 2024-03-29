<template>
  <div id="rename-page">
    <el-form
      ref="formRef"
      :model="form"
      @submit.prevent
    >
      <el-form-item
        :label="$T('FILE_RENAME')"
        prop="fileName"
        :rules="[
          { required: true, message: 'file name is required', trigger: 'blur' }
        ]"
      >
        <el-input
          v-model="form.fileName"
          size="small"
          autofocus
          @keyup.enter="confirmName"
        >
          <template #suffix>
            <el-icon
              class="el-input__icon"
              style="cursor: pointer;"
              @click="form.fileName = ''"
            >
              <close />
            </el-icon>
          </template>
        </el-input>
      </el-form-item>
    </el-form>
    <el-row>
      <div class="pull-right">
        <el-button
          round
          size="small"
          @click="cancel"
        >
          {{ $T('CANCEL') }}
        </el-button>
        <el-button
          type="primary"
          round
          size="small"
          @click="confirmName"
        >
          {{ $T('CONFIRM') }}
        </el-button>
      </div>
    </el-row>
  </div>
</template>
<script lang="ts" setup>
// Element Plus 图标
import { Close } from '@element-plus/icons-vue'

// 事件常量
import { GET_RENAME_FILE_NAME, RENAME_FILE_NAME } from '#/events/constants'

// 数据发送工具函数
import { sendToMain } from '@/utils/dataSender'

// 国际化函数
import { T as $T } from '@/i18n/index'

// Electron 相关
import { ipcRenderer, IpcRendererEvent } from 'electron'

// Vue 生命周期钩子
import { onBeforeUnmount, onBeforeMount, ref, reactive } from 'vue'

// 自定义钩子
import { useIPCOn } from '@/hooks/useIPC'

// Element Plus 表单实例类型
import { FormInstance } from 'element-plus'

const id = ref<string | null>(null)
const formRef = ref<FormInstance>()

const form = reactive({
  fileName: '',
  originName: ''
})

const handleFileName = (event: IpcRendererEvent, newName: string, _originName: string, _id: string) => {
  form.fileName = newName
  form.originName = _originName
  id.value = _id
}

useIPCOn(RENAME_FILE_NAME, handleFileName)

onBeforeMount(() => {
  ipcRenderer.send(GET_RENAME_FILE_NAME)
})

function confirmName () {
  formRef.value?.validate((valid) => {
    if (valid) {
      sendToMain(`${RENAME_FILE_NAME}${id.value}`, form.fileName)
    }
  })
}

function cancel () {
  // if cancel, use origin file name
  sendToMain(`${RENAME_FILE_NAME}${id.value}`, form.originName)
}

onBeforeUnmount(() => {
  ipcRenderer.removeAllListeners(RENAME_FILE_NAME)
})

</script>
<script lang="ts">
export default {
  name: 'RenamePage'
}
</script>
<style lang='stylus'>
  #rename-page
    padding 0 20px
    .pull-right
      float right
    .el-form-item__label
      color #ddd
</style>
