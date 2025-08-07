<template>
  <Teleport to="body">
    <div
      v-if="showInputBoxVisible"
      class="inputbox-overlay"
      @click="handleInputBoxCancel"
    >
      <div
        class="inputbox-container"
        @click.stop
      >
        <div class="inputbox-header">
          <h3 class="inputbox-title">
            {{ inputBoxOptions.title || t('pages.inputBox.title') }}
          </h3>
          <button
            class="inputbox-close"
            @click="handleInputBoxCancel"
          >
            <X :size="20" />
          </button>
        </div>
        <div class="inputbox-content">
          <input
            v-model="inputBoxValue"
            :placeholder="inputBoxOptions.placeholder"
            class="inputbox-input"
            type="text"
            @keyup.enter="handleInputBoxConfirm"
            @keyup.escape="handleInputBoxCancel"
          >
        </div>
        <div class="inputbox-actions">
          <button
            class="inputbox-btn cancel-btn"
            @click="handleInputBoxCancel"
          >
            {{ t('common.cancel') }}
          </button>
          <button
            class="inputbox-btn confirm-btn primary"
            @click="handleInputBoxConfirm"
          >
            {{ t('common.confirm') }}
          </button>
        </div>
      </div>
    </div>
  </Teleport>
</template>

<script lang="ts" setup>
import type { IpcRendererEvent } from 'electron'
import { X } from 'lucide-vue-next'
import { onBeforeMount, onBeforeUnmount, reactive, ref } from 'vue'
import { useI18n } from 'vue-i18n'

import $bus from '@/utils/bus'
import { SHOW_INPUT_BOX, SHOW_INPUT_BOX_RESPONSE } from '@/utils/constant'
import type { IShowInputBoxOption } from '#/types/types'

const { t } = useI18n()
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
<style scoped>
.inputbox-overlay {
  position: fixed;
  top: 0;
  left: 0;
  right: 0;
  bottom: 0;
  background: rgba(0, 0, 0, 0.5);
  display: flex;
  align-items: center;
  justify-content: center;
  z-index: 2000;
}

.inputbox-container {
  background: white;
  border-radius: 0.75rem;
  box-shadow: 0 20px 25px -5px rgba(0, 0, 0, 0.1), 0 10px 10px -5px rgba(0, 0, 0, 0.04);
  max-width: 32rem;
  width: 90%;
  max-height: 80vh;
  overflow: hidden;
}

:root.dark .inputbox-container,
:root.auto.dark .inputbox-container {
  background: rgb(31 41 55);
  border: 1px solid rgb(55 65 81);
}

.inputbox-header {
  padding: 1.5rem 1.5rem 0 1.5rem;
  display: flex;
  justify-content: space-between;
  align-items: center;
}

.inputbox-title {
  font-size: 1.25rem;
  font-weight: 600;
  color: rgb(17 24 39);
  margin: 0;
}

:root.dark .inputbox-title,
:root.auto.dark .inputbox-title {
  color: rgb(243 244 246);
}

.inputbox-close {
  background: none;
  border: none;
  color: rgb(107 114 128);
  cursor: pointer;
  padding: 0.25rem;
  width: 24px;
  height: 24px;
  display: flex;
  align-items: center;
  justify-content: center;
  border-radius: 0.25rem;
}

.inputbox-close:hover {
  background: rgb(243 244 246);
  color: rgb(17 24 39);
}

:root.dark .inputbox-close,
:root.auto.dark .inputbox-close {
  color: rgb(156 163 175);
}

:root.dark .inputbox-close:hover,
:root.auto.dark .inputbox-close:hover {
  background: rgb(55 65 81);
  color: rgb(243 244 246);
}

.inputbox-content {
  padding: 1rem 1.5rem;
}

.inputbox-input {
  width: 100%;
  padding: 0.75rem 1rem;
  border: 1px solid rgb(209 213 219);
  border-radius: 0.5rem;
  background: white;
  color: rgb(17 24 39);
  font-size: 0.875rem;
  font-family: inherit;
  transition: all 0.2s ease;
  outline: none;
}

.inputbox-input:focus {
  border-color: rgb(59 130 246);
  box-shadow: 0 0 0 3px rgba(59, 130, 246, 0.1);
}

.inputbox-input::placeholder {
  color: rgb(156 163 175);
}

:root.dark .inputbox-input,
:root.auto.dark .inputbox-input {
  background: rgb(55 65 81);
  border-color: rgb(75 85 99);
  color: rgb(243 244 246);
}

:root.dark .inputbox-input:focus,
:root.auto.dark .inputbox-input:focus {
  border-color: rgb(59 130 246);
  box-shadow: 0 0 0 3px rgba(59, 130, 246, 0.1);
}

:root.dark .inputbox-input::placeholder,
:root.auto.dark .inputbox-input::placeholder {
  color: rgb(107 114 128);
}

.inputbox-actions {
  display: flex;
  gap: 0.75rem;
  padding: 0 1.5rem 1.5rem 1.5rem;
  justify-content: flex-end;
}

.inputbox-btn {
  padding: 0.5rem 1rem;
  border-radius: 0.375rem;
  font-size: 0.875rem;
  font-weight: 500;
  border: none;
  cursor: pointer;
  min-width: 4rem;
}

.cancel-btn {
  background: rgb(243 244 246);
  color: rgb(75 85 99);
  border: 1px solid rgb(209 213 219);
}

.cancel-btn:hover {
  background: rgb(229 231 235);
}

:root.dark .cancel-btn,
:root.auto.dark .cancel-btn {
  background: rgb(55 65 81);
  color: rgb(209 213 219);
  border-color: rgb(75 85 99);
}

:root.dark .cancel-btn:hover,
:root.auto.dark .cancel-btn:hover {
  background: rgb(75 85 99);
}

.confirm-btn.primary {
  background: rgb(59 130 246);
  color: white;
}

.confirm-btn.primary:hover {
  background: rgb(37 99 235);
}
</style>
