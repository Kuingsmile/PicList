<template>
  <Teleport to="body">
    <Transition name="inputbox-fade">
      <div v-if="showInputBoxVisible" class="inputbox-overlay" @click="handleInputBoxCancel">
        <Transition name="inputbox-scale">
          <div v-if="showInputBoxVisible" class="inputbox-container" @click.stop>
            <button class="inputbox-close" @click="handleInputBoxCancel">
              <X :size="20" />
            </button>

            <div class="inputbox-body">
              <h3 class="inputbox-title">
                {{ inputBoxOptions.title || t('pages.inputBox.title') }}
              </h3>

              <div class="inputbox-content">
                <textarea
                  v-if="inputBoxOptions.multiLine"
                  ref="textareaRef"
                  v-model="inputBoxValue"
                  :placeholder="inputBoxOptions.placeholder"
                  class="inputbox-textarea"
                  rows="4"
                  @keyup.ctrl.enter="handleInputBoxConfirm"
                  @keyup.meta.enter="handleInputBoxConfirm"
                  @keyup.escape="handleInputBoxCancel"
                />
                <input
                  v-else
                  ref="inputRef"
                  v-model="inputBoxValue"
                  :placeholder="inputBoxOptions.placeholder"
                  class="inputbox-input"
                  type="text"
                  @keyup.enter="handleInputBoxConfirm"
                  @keyup.escape="handleInputBoxCancel"
                />
              </div>
            </div>

            <div class="inputbox-actions">
              <button class="inputbox-btn cancel-btn" @click="handleInputBoxCancel">
                {{ t('common.cancel') }}
              </button>
              <button class="inputbox-btn confirm-btn" :disabled="!inputBoxValue.trim()" @click="handleInputBoxConfirm">
                {{ t('common.confirm') }}
              </button>
            </div>
          </div>
        </Transition>
      </div>
    </Transition>
  </Teleport>
</template>

<script lang="ts" setup>
import { X } from 'lucide-vue-next'
import { nextTick, onBeforeMount, onBeforeUnmount, reactive, ref } from 'vue'
import { useI18n } from 'vue-i18n'

import $bus from '@/utils/bus'
import { SHOW_INPUT_BOX, SHOW_INPUT_BOX_RESPONSE } from '@/utils/constant'
import type { IShowInputBoxOption } from '#/types/types'

const { t } = useI18n()
const inputBoxValue = ref('')
const showInputBoxVisible = ref(false)
const inputRef = ref<HTMLInputElement>()
const textareaRef = ref<HTMLTextAreaElement>()
const inputBoxOptions = reactive({
  title: '',
  placeholder: '',
  multiLine: false,
})

let removeInputBoxListenerCallback: () => void = () => {}

function handleIpcInputBoxEvent(options: IShowInputBoxOption) {
  initInputBoxValue(options)
}

async function initInputBoxValue(options: IShowInputBoxOption) {
  inputBoxValue.value = options.value || ''
  inputBoxOptions.title = options.title || ''
  inputBoxOptions.placeholder = options.placeholder || ''
  inputBoxOptions.multiLine = options.multiLine || false
  showInputBoxVisible.value = true

  await nextTick()
  if (inputBoxOptions.multiLine) {
    textareaRef.value?.focus()
    textareaRef.value?.select()
  } else {
    inputRef.value?.focus()
    inputRef.value?.select()
  }
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
/* Transitions */
.inputbox-fade-enter-active,
.inputbox-fade-leave-active {
  transition: opacity 0.2s ease;
}

.inputbox-fade-enter-from,
.inputbox-fade-leave-to {
  opacity: 0;
}

.inputbox-scale-enter-active {
  transition: all 0.25s cubic-bezier(0.34, 1.56, 0.64, 1);
}

.inputbox-scale-leave-active {
  transition: all 0.2s ease;
}

.inputbox-scale-enter-from {
  opacity: 0;
  transform: scale(0.9) translateY(-10px);
}

.inputbox-scale-leave-to {
  opacity: 0;
  transform: scale(0.95);
}

/* Overlay */
.inputbox-overlay {
  position: fixed;
  inset: 0;
  z-index: 2000;
  display: flex;
  justify-content: center;
  align-items: center;
  padding: 1rem;
  background: rgb(0 0 0 / 40%);
  backdrop-filter: blur(4px);
}

/* Container */
.inputbox-container {
  position: relative;
  overflow: hidden;
  border: 1px solid rgb(229 231 235);
  border-radius: 1rem;
  width: 100%;
  max-width: 28rem;
  background: white;
  box-shadow:
    0 20px 25px -5px rgb(0 0 0 / 10%),
    0 10px 10px -5px rgb(0 0 0 / 4%);
}

:root.dark .inputbox-container,
:root.auto.dark .inputbox-container {
  border-color: rgb(55 65 81);
  background: rgb(31 41 55);
}

/* Close Button */
.inputbox-close {
  position: absolute;
  top: 1rem;
  right: 1rem;
  z-index: 10;
  display: flex;
  justify-content: center;
  align-items: center;
  border: none;
  border-radius: 0.5rem;
  padding: 0.375rem;
  color: rgb(107 114 128);
  background: transparent;
  transition: all 0.15s ease;
  cursor: pointer;
}

.inputbox-close:hover {
  color: rgb(75 85 99);
  background: rgb(243 244 246);
}

:root.dark .inputbox-close,
:root.auto.dark .inputbox-close {
  color: rgb(156 163 175);
}

:root.dark .inputbox-close:hover,
:root.auto.dark .inputbox-close:hover {
  color: rgb(209 213 219);
  background: rgb(55 65 81);
}

/* Body */
.inputbox-body {
  padding: 2rem 2rem 1.5rem;
}

.inputbox-title {
  margin: 0 0 1.25rem;
  padding-right: 2rem;
  font-size: 1.125rem;
  font-weight: 600;
  line-height: 1.4;
  color: rgb(17 24 39);
}

:root.dark .inputbox-title,
:root.auto.dark .inputbox-title {
  color: rgb(243 244 246);
}

.inputbox-content {
  position: relative;
}

/* Input */
.inputbox-input {
  border: 1.5px solid rgb(229 231 235);
  border-radius: 0.625rem;
  padding: 0.75rem 1rem;
  width: 100%;
  font-size: 0.9375rem;
  font-family: inherit;
  color: rgb(17 24 39);
  background: rgb(249 250 251);
  outline: none;
  transition: all 0.2s ease;
}

.inputbox-input:hover {
  border-color: rgb(209 213 219);
  background: white;
}

.inputbox-input:focus {
  border-color: rgb(59 130 246);
  background: white;
  box-shadow: 0 0 0 3px rgb(59 130 246 / 10%);
}

.inputbox-input::placeholder {
  color: rgb(156 163 175);
}

/* Textarea */
.inputbox-textarea {
  border: 1.5px solid rgb(229 231 235);
  border-radius: 0.625rem;
  padding: 0.75rem 1rem;
  width: 100%;
  min-height: 6rem;
  font-size: 0.9375rem;
  font-family: inherit;
  line-height: 1.6;
  color: rgb(17 24 39);
  background: rgb(249 250 251);
  outline: none;
  resize: vertical;
  transition: all 0.2s ease;
}

.inputbox-textarea:hover {
  border-color: rgb(209 213 219);
  background: white;
}

.inputbox-textarea:focus {
  border-color: rgb(59 130 246);
  background: white;
  box-shadow: 0 0 0 3px rgb(59 130 246 / 10%);
}

.inputbox-textarea::placeholder {
  color: rgb(156 163 175);
}

/* Dark Mode - Input */
:root.dark .inputbox-input,
:root.auto.dark .inputbox-input {
  border-color: rgb(55 65 81);
  color: rgb(243 244 246);
  background: rgb(55 65 81);
}

:root.dark .inputbox-input:hover,
:root.auto.dark .inputbox-input:hover {
  border-color: rgb(75 85 99);
  background: rgb(55 65 81);
}

:root.dark .inputbox-input:focus,
:root.auto.dark .inputbox-input:focus {
  border-color: rgb(59 130 246);
  background: rgb(55 65 81);
  box-shadow: 0 0 0 3px rgb(59 130 246 / 10%);
}

:root.dark .inputbox-input::placeholder,
:root.auto.dark .inputbox-input::placeholder {
  color: rgb(107 114 128);
}

/* Dark Mode - Textarea */
:root.dark .inputbox-textarea,
:root.auto.dark .inputbox-textarea {
  border-color: rgb(55 65 81);
  color: rgb(243 244 246);
  background: rgb(55 65 81);
}

:root.dark .inputbox-textarea:hover,
:root.auto.dark .inputbox-textarea:hover {
  border-color: rgb(75 85 99);
  background: rgb(55 65 81);
}

:root.dark .inputbox-textarea:focus,
:root.auto.dark .inputbox-textarea:focus {
  border-color: rgb(59 130 246);
  background: rgb(55 65 81);
  box-shadow: 0 0 0 3px rgb(59 130 246 / 10%);
}

:root.dark .inputbox-textarea::placeholder,
:root.auto.dark .inputbox-textarea::placeholder {
  color: rgb(107 114 128);
}

/* Actions */
.inputbox-actions {
  display: flex;
  border-top: 1px solid rgb(243 244 246);
  padding: 1rem 1.5rem;
  gap: 0.75rem;
}

:root.dark .inputbox-actions,
:root.auto.dark .inputbox-actions {
  border-top-color: rgb(55 65 81);
}

.inputbox-btn {
  flex: 1;
  border: none;
  border-radius: 0.5rem;
  padding: 0.625rem 1.25rem;
  font-size: 0.875rem;
  font-weight: 500;
  transition: all 0.15s ease;
  cursor: pointer;
}

.inputbox-btn:active {
  transform: scale(0.98);
}

.inputbox-btn:disabled {
  opacity: 0.5;
  cursor: not-allowed;
}

.inputbox-btn:disabled:active {
  transform: none;
}

/* Cancel Button */
.cancel-btn {
  border: 1px solid rgb(229 231 235);
  color: rgb(75 85 99);
  background: white;
}

.cancel-btn:hover {
  border-color: rgb(209 213 219);
  background: rgb(249 250 251);
}

:root.dark .cancel-btn,
:root.auto.dark .cancel-btn {
  border-color: rgb(55 65 81);
  color: rgb(209 213 219);
  background: rgb(55 65 81);
}

:root.dark .cancel-btn:hover,
:root.auto.dark .cancel-btn:hover {
  border-color: rgb(75 85 99);
  background: rgb(75 85 99);
}

/* Confirm Button */
.confirm-btn {
  border: none;
  color: white;
  background: linear-gradient(135deg, rgb(59 130 246) 0%, rgb(37 99 235) 100%);
  box-shadow: 0 1px 2px 0 rgb(0 0 0 / 5%);
}

.confirm-btn:hover:not(:disabled) {
  background: linear-gradient(135deg, rgb(37 99 235) 0%, rgb(29 78 216) 100%);
  box-shadow: 0 4px 12px rgb(59 130 246 / 40%);
}

/* Responsive */
@media (width <= 640px) {
  .inputbox-overlay {
    align-items: flex-end;
    padding: 0;
  }

  .inputbox-container {
    border-radius: 1rem 1rem 0 0;
    max-width: 100%;
  }

  .inputbox-body {
    padding: 1.75rem 1.5rem 1.25rem;
  }

  .inputbox-actions {
    flex-direction: column-reverse;
  }

  .inputbox-btn {
    width: 100%;
  }
}
</style>
