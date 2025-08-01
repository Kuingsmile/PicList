<template>
  <el-dialog
    v-model="showInputBoxVisible"
    :title="inputBoxOptions.title || $t('INPUT')"
    :modal-append-to-body="false"
    append-to-body
  >
    <el-input
      v-model="inputBoxValue"
      :placeholder="inputBoxOptions.placeholder"
    />
    <template #footer>
      <el-button
        round
        @click="handleInputBoxCancel"
      >
        {{ $t('CANCEL') }}
      </el-button>
      <el-button
        type="primary"
        round
        @click="handleInputBoxConfirm"
      >
        {{ $t('CONFIRM') }}
      </el-button>
    </template>
  </el-dialog>
</template>

<script lang="ts" setup>
import type { IpcRendererEvent } from 'electron'
import { onBeforeMount, onBeforeUnmount, reactive, ref } from 'vue'

import $bus from '@/utils/bus'
import { SHOW_INPUT_BOX, SHOW_INPUT_BOX_RESPONSE } from '#/events/constants'
import { IShowInputBoxOption } from '#/types/types'

const inputBoxValue = ref('')
const showInputBoxVisible = ref(false)
const inputBoxOptions = reactive({
  title: '',
  placeholder: ''
})

onBeforeMount(() => {
  window.electron.ipcRendererOn(SHOW_INPUT_BOX, ipcEventHandler)
  $bus.on(SHOW_INPUT_BOX, initInputBoxValue)
})

function ipcEventHandler (_: IpcRendererEvent, options: IShowInputBoxOption) {
  initInputBoxValue(options)
}

function initInputBoxValue (options: IShowInputBoxOption) {
  inputBoxValue.value = options.value || ''
  inputBoxOptions.title = options.title || ''
  inputBoxOptions.placeholder = options.placeholder || ''
  showInputBoxVisible.value = true
}

function handleInputBoxCancel () {
  // TODO: RPCServer
  showInputBoxVisible.value = false
  window.electron.sendToMain(SHOW_INPUT_BOX, '')
  $bus.emit(SHOW_INPUT_BOX_RESPONSE, '')
}

function handleInputBoxConfirm () {
  showInputBoxVisible.value = false
  window.electron.sendToMain(SHOW_INPUT_BOX, inputBoxValue.value)
  $bus.emit(SHOW_INPUT_BOX_RESPONSE, inputBoxValue.value)
}

onBeforeUnmount(() => {
  window.electron.ipcRendererRemoveListener(SHOW_INPUT_BOX, ipcEventHandler)
  $bus.off(SHOW_INPUT_BOX)
})
</script>
<script lang="ts">
export default {
  name: 'InputBoxDialog'
}
</script>
<style lang="stylus"></style>
