<template>
  <Teleport to="body">
    <div v-if="showInputBoxVisible" class="inputbox-overlay">
      <div class="inputbox-container" @click.stop>
        <div class="inputbox-header">
          <h3 class="inputbox-title">
            {{ inputBoxOptions.title || t('pages.inputBox.title') }}
          </h3>
          <button class="inputbox-close" @click="handleInputBoxCancel">
            <X :size="20" />
          </button>
        </div>
        <div class="inputbox-content">
          <textarea
            v-if="inputBoxOptions.multiLine"
            v-model="inputBoxValue"
            :placeholder="inputBoxOptions.placeholder"
            class="inputbox-textarea"
            rows="4"
            @keyup.ctrl.enter="handleInputBoxConfirm"
            @keyup.escape="handleInputBoxCancel"
          />
          <input
            v-else
            v-model="inputBoxValue"
            :placeholder="inputBoxOptions.placeholder"
            class="inputbox-input"
            type="text"
            @keyup.enter="handleInputBoxConfirm"
            @keyup.escape="handleInputBoxCancel"
          />
        </div>
        <div class="inputbox-actions">
          <button class="inputbox-btn cancel-btn" @click="handleInputBoxCancel">
            {{ t('common.cancel') }}
          </button>
          <button class="inputbox-btn confirm-btn primary" @click="handleInputBoxConfirm">
            {{ t('common.confirm') }}
          </button>
        </div>
      </div>
    </div>
  </Teleport>
</template>

<script lang="ts" setup>
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
  placeholder: '',
  multiLine: false,
})

let removeInputBoxListenerCallback: () => void = () => {}

function handleIpcInputBoxEvent(options: IShowInputBoxOption) {
  initInputBoxValue(options)
}

function initInputBoxValue(options: IShowInputBoxOption) {
  inputBoxValue.value = options.value || ''
  inputBoxOptions.title = options.title || ''
  inputBoxOptions.placeholder = options.placeholder || ''
  inputBoxOptions.multiLine = options.multiLine || false
  showInputBoxVisible.value = true
}

function handleInputBoxCancel() {
  // TODO: RPCServer
  showInputBoxVisible.value = false
  window.electron.sendToMain(SHOW_INPUT_BOX, '')
  $bus.emit(SHOW_INPUT_BOX_RESPONSE, '')
}

function handleInputBoxConfirm() {
  showInputBoxVisible.value = false
  window.electron.sendToMain(SHOW_INPUT_BOX, inputBoxValue.value)
  $bus.emit(SHOW_INPUT_BOX_RESPONSE, inputBoxValue.value)
}

onBeforeMount(() => {
  removeInputBoxListenerCallback = window.electron.ipcRendererOn(SHOW_INPUT_BOX, handleIpcInputBoxEvent)
  $bus.on(SHOW_INPUT_BOX, initInputBoxValue)
})

onBeforeUnmount(() => {
  removeInputBoxListenerCallback()
  $bus.off(SHOW_INPUT_BOX)
})
</script>

<script lang="ts">
export default {
  name: 'InputBoxDialog',
}
</script>

<style scoped>
.inputbox-overlay {
  position: fixed;
  inset: 0;
  z-index: 2000;
  display: flex;
  justify-content: center;
  align-items: center;
  background: rgb(0 0 0 / 50%);
}

.inputbox-container {
  overflow: hidden;
  border-radius: 0.75rem;
  width: 90%;
  max-width: 32rem;
  max-height: 80vh;
  background: white;
  box-shadow:
    0 20px 25px -5px rgb(0 0 0 / 10%),
    0 10px 10px -5px rgb(0 0 0 / 4%);
}

:root.dark .inputbox-container,
:root.auto.dark .inputbox-container {
  border: 1px solid rgb(55 65 81);
  background: rgb(31 41 55);
}

.inputbox-header {
  display: flex;
  justify-content: space-between;
  align-items: center;
  padding: 1.5rem 1.5rem 0;
}

.inputbox-title {
  margin: 0;
  font-size: 1.25rem;
  font-weight: 600;
  color: rgb(17 24 39);
}

:root.dark .inputbox-title,
:root.auto.dark .inputbox-title {
  color: rgb(243 244 246);
}

.inputbox-close {
  display: flex;
  justify-content: center;
  align-items: center;
  border: none;
  border-radius: 0.25rem;
  padding: 0.25rem;
  width: 24px;
  height: 24px;
  color: rgb(107 114 128);
  background: none;
  cursor: pointer;
}

.inputbox-close:hover {
  color: rgb(17 24 39);
  background: rgb(243 244 246);
}

:root.dark .inputbox-close,
:root.auto.dark .inputbox-close {
  color: rgb(156 163 175);
}

:root.dark .inputbox-close:hover,
:root.auto.dark .inputbox-close:hover {
  color: rgb(243 244 246);
  background: rgb(55 65 81);
}

.inputbox-content {
  padding: 1rem 1.5rem;
}

.inputbox-input {
  border: 1px solid rgb(209 213 219);
  border-radius: 0.5rem;
  padding: 0.75rem 1rem;
  width: 100%;
  font-size: 0.875rem;
  font-family: inherit;
  color: rgb(17 24 39);
  background: white;
  outline: none;
  transition: all 0.2s ease;
}

.inputbox-input:focus {
  border-color: rgb(59 130 246);
  box-shadow: 0 0 0 3px rgb(59 130 246 / 10%);
}

.inputbox-input::placeholder {
  color: rgb(156 163 175);
}

.inputbox-textarea {
  border: 1px solid rgb(209 213 219);
  border-radius: 0.375rem;
  padding: 0.5rem 0.75rem;
  width: 100%;
  min-height: 4rem;
  font-size: 0.875rem;
  font-family: inherit;
  color: rgb(17 24 39);
  background: white;
  outline: none;
  resize: vertical;
  transition: all 0.2s ease;
}

.inputbox-textarea:focus {
  border-color: rgb(59 130 246);
  box-shadow: 0 0 0 3px rgb(59 130 246 / 10%);
}

.inputbox-textarea::placeholder {
  color: rgb(156 163 175);
}

:root.dark .inputbox-input,
:root.auto.dark .inputbox-input {
  border-color: rgb(75 85 99);
  color: rgb(243 244 246);
  background: rgb(55 65 81);
}

:root.dark .inputbox-input:focus,
:root.auto.dark .inputbox-input:focus {
  border-color: rgb(59 130 246);
  box-shadow: 0 0 0 3px rgb(59 130 246 / 10%);
}

:root.dark .inputbox-input::placeholder,
:root.auto.dark .inputbox-input::placeholder {
  color: rgb(107 114 128);
}

:root.dark .inputbox-textarea,
:root.auto.dark .inputbox-textarea {
  border-color: rgb(75 85 99);
  color: rgb(243 244 246);
  background: rgb(55 65 81);
}

:root.dark .inputbox-textarea:focus,
:root.auto.dark .inputbox-textarea:focus {
  border-color: rgb(59 130 246);
  box-shadow: 0 0 0 3px rgb(59 130 246 / 10%);
}

:root.dark .inputbox-textarea::placeholder,
:root.auto.dark .inputbox-textarea::placeholder {
  color: rgb(107 114 128);
}

.inputbox-actions {
  display: flex;
  justify-content: flex-end;
  padding: 0 1.5rem 1.5rem;
  gap: 0.75rem;
}

.inputbox-btn {
  border: none;
  border-radius: 0.375rem;
  padding: 0.5rem 1rem;
  min-width: 4rem;
  font-size: 0.875rem;
  font-weight: 500;
  cursor: pointer;
}

.cancel-btn {
  border: 1px solid rgb(209 213 219);
  color: rgb(75 85 99);
  background: rgb(243 244 246);
}

.cancel-btn:hover {
  background: rgb(229 231 235);
}

:root.dark .cancel-btn,
:root.auto.dark .cancel-btn {
  border-color: rgb(75 85 99);
  color: rgb(209 213 219);
  background: rgb(55 65 81);
}

:root.dark .cancel-btn:hover,
:root.auto.dark .cancel-btn:hover {
  background: rgb(75 85 99);
}

.confirm-btn.primary {
  color: white;
  background: rgb(59 130 246);
}

.confirm-btn.primary:hover {
  background: rgb(37 99 235);
}
</style>
