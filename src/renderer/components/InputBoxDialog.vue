<template>
  <Teleport to="body">
    <Transition name="inputbox-fade">
      <div v-if="showInputBoxVisible" class="inputbox-overlay" @click="handleInputBoxCancel">
        <Transition name="inputbox-scale">
          <div v-if="showInputBoxVisible" class="inputbox-container" @click.stop>
            <button class="inputbox-close" @click="handleInputBoxCancel">
              <XIcon :size="20" />
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
import { XIcon } from 'lucide-vue-next'
import { nextTick, onBeforeMount, onBeforeUnmount, reactive, ref, useTemplateRef } from 'vue'
import { useI18n } from 'vue-i18n'

import $bus from '@/utils/bus'
import { SHOW_INPUT_BOX, SHOW_INPUT_BOX_RESPONSE } from '@/utils/constant'

const { t } = useI18n()
const inputBoxValue = ref('')
const showInputBoxVisible = ref(false)
const inputRef = useTemplateRef('inputRef')
const textareaRef = useTemplateRef('textareaRef')
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

<style scoped src="./css/InputBox.css"></style>
