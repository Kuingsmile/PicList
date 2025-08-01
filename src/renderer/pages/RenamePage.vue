<template>
  <div id="rename-page">
    <el-form
      ref="formRef"
      :model="form"
      @submit.prevent
    >
      <el-form-item
        :label="$t('FILE_RENAME')"
        prop="fileName"
        :rules="[{ required: true, message: 'file name is required', trigger: 'blur' }]"
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
              style="cursor: pointer"
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
          {{ $t('CANCEL') }}
        </el-button>
        <el-button
          type="primary"
          round
          size="small"
          @click="confirmName"
        >
          {{ $t('CONFIRM') }}
        </el-button>
      </div>
    </el-row>
  </div>
</template>

<script lang="ts" setup>
import { Close } from '@element-plus/icons-vue'
import type { IpcRendererEvent } from 'electron'
import type { FormInstance } from 'element-plus'
import { onBeforeMount, onBeforeUnmount, reactive, ref } from 'vue'

import { GET_RENAME_FILE_NAME, RENAME_FILE_NAME } from '#/events/constants'

const id = ref<string | null>(null)
const formRef = ref<FormInstance>()

const form = reactive({
  fileName: '',
  originName: ''
})

const handleFileName = (_: IpcRendererEvent, newName: string, _originName: string, _id: string) => {
  form.fileName = newName
  form.originName = _originName
  id.value = _id
}

window.electron.ipcRendererOn(RENAME_FILE_NAME, handleFileName)

onBeforeMount(() => {
  window.electron.sendToMain(GET_RENAME_FILE_NAME, '')
})

function confirmName () {
  formRef.value?.validate(valid => {
    if (valid) {
      window.electron.sendToMain(`${RENAME_FILE_NAME}${id.value}`, form.fileName)
    }
  })
}

function cancel () {
  // if cancel, use origin file name
  window.electron.sendToMain(`${RENAME_FILE_NAME}${id.value}`, form.originName)
}

onBeforeUnmount(() => {
  window.electron.ipcRendererRemoveListener(RENAME_FILE_NAME, handleFileName)
})
</script>
<script lang="ts">
export default {
  name: 'RenamePage'
}
</script>
<style lang="stylus">
#rename-page
  padding 0 20px
  .pull-right
    float right
  .el-form-item__label
    color #ddd
</style>
