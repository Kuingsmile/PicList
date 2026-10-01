<template>
  <CustomModal
    :visible="showInputBoxVisible"
    :title="inputBoxOptions.title || t('pages.inputBox.title')"
    height="auto"
    width="calc(100vw - 2rem)"
    max-width="30rem"
    @update:visible="value => !value && handleInputBoxCancel()"
  >
    <div class="p-4">
      <textarea
        v-if="inputBoxOptions.multiLine"
        ref="textareaRef"
        v-model="inputBoxValue"
        :placeholder="inputBoxOptions.placeholder"
        :aria-label="inputBoxOptions.title || t('pages.inputBox.title')"
        class="max-h-[20rem] min-h-[6rem] w-full resize-y rounded-sm border border-border bg-bg-tertiary p-4 font-[inherit] text-[0.9375rem] text-main transition-all duration-fast ease-apple outline-none placeholder:text-secondary hover:border-accent focus:border-accent focus:bg-surface"
        rows="4"
        @keyup.ctrl.enter="handleInputBoxConfirm"
        @keyup.meta.enter="handleInputBoxConfirm"
      />
      <input
        v-else
        ref="inputRef"
        v-model="inputBoxValue"
        :placeholder="inputBoxOptions.placeholder"
        :aria-label="inputBoxOptions.title || t('pages.inputBox.title')"
        class="w-full rounded-sm border border-border bg-bg-tertiary p-4 font-[inherit] text-[0.9375rem] text-main transition-all duration-fast ease-apple outline-none placeholder:text-secondary hover:border-accent focus:border-accent focus:bg-surface"
        type="text"
        @keyup.enter="handleInputBoxConfirm"
      />
    </div>
    <template #footer>
      <CustomButton type="secondary" :text="t('common.cancel')" @click="handleInputBoxCancel" />
      <CustomButton :disabled="!inputBoxValue.trim()" :text="t('common.confirm')" @click="handleInputBoxConfirm" />
    </template>
  </CustomModal>
</template>

<script lang="ts" setup>
import { nextTick, onBeforeMount, onBeforeUnmount, reactive, ref, useTemplateRef } from 'vue'
import { useI18n } from 'vue-i18n'

import CustomButton from '@/components/common/CustomButton.vue'
import CustomModal from '@/components/common/CustomModal.vue'
import $bus from '@/utils/bus'
import { CANCEL_INPUT_BOX, SHOW_INPUT_BOX, SHOW_INPUT_BOX_RESPONSE } from '#/constants/ipcChannels'

defineOptions({ name: 'InputBoxDialog' })

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
let removeInputBoxCancellationCallback: () => void = () => {}
interface InputBoxRequest {
  options: IShowInputBoxOption
  requestId?: string
  fromMain: boolean
}
const pendingRequests: InputBoxRequest[] = []
let currentRequest: InputBoxRequest | undefined
let disposed = false

function handleIpcInputBoxEvent(options: IShowInputBoxOption, requestId?: string) {
  enqueueInputBox({ options, requestId, fromMain: true })
}

function handleLocalInputBoxEvent(options: IShowInputBoxOption) {
  enqueueInputBox({ options, fromMain: false })
}

function handleInputBoxCancellation(requestId: string) {
  for (let index = pendingRequests.length - 1; index >= 0; index--) {
    if (pendingRequests[index].requestId === requestId) pendingRequests.splice(index, 1)
  }
  if (currentRequest?.fromMain && currentRequest.requestId === requestId) {
    currentRequest = undefined
    showInputBoxVisible.value = false
    void nextTick().then(showNextInputBox)
  }
}

function enqueueInputBox(request: InputBoxRequest) {
  if (disposed) return
  pendingRequests.push(request)
  if (!currentRequest) void showNextInputBox()
}

async function showNextInputBox() {
  if (disposed || currentRequest || !pendingRequests.length) return
  currentRequest = pendingRequests.shift()!
  const { options } = currentRequest
  inputBoxValue.value = options.value || ''
  inputBoxOptions.title = options.title || ''
  inputBoxOptions.placeholder = options.placeholder || ''
  inputBoxOptions.multiLine = options.multiLine || false
  showInputBoxVisible.value = true

  await nextTick()
  if (disposed || !showInputBoxVisible.value) return
  if (inputBoxOptions.multiLine) {
    textareaRef.value?.focus()
    textareaRef.value?.select()
  } else {
    inputRef.value?.focus()
    inputRef.value?.select()
  }
}

function handleInputBoxCancel() {
  finishInputBox('')
}

function handleInputBoxConfirm() {
  if (!inputBoxValue.value.trim()) return
  finishInputBox(inputBoxValue.value)
}

function respondToRequest(request: InputBoxRequest, value: string) {
  if (request.fromMain) {
    window.electron.sendToMain(SHOW_INPUT_BOX, value, request.requestId)
  } else {
    // Local URL input belongs to the upload page; plugin replies must never start URL uploads.
    $bus.emit(SHOW_INPUT_BOX_RESPONSE, value)
  }
}

function finishInputBox(value: string) {
  if (!currentRequest) return
  const request = currentRequest
  currentRequest = undefined
  showInputBoxVisible.value = false
  respondToRequest(request, value)
  void nextTick().then(showNextInputBox)
}

onBeforeMount(() => {
  removeInputBoxCancellationCallback = window.electron.ipcRendererOn(CANCEL_INPUT_BOX, handleInputBoxCancellation)
  removeInputBoxListenerCallback = window.electron.ipcRendererOn(SHOW_INPUT_BOX, handleIpcInputBoxEvent)
  $bus.on(SHOW_INPUT_BOX, handleLocalInputBoxEvent)
})

onBeforeUnmount(() => {
  disposed = true
  removeInputBoxListenerCallback()
  removeInputBoxCancellationCallback()
  $bus.off(SHOW_INPUT_BOX, handleLocalInputBoxEvent)
  const requests = currentRequest ? [currentRequest, ...pendingRequests] : [...pendingRequests]
  currentRequest = undefined
  pendingRequests.length = 0
  for (const request of requests) respondToRequest(request, '')
})
</script>
