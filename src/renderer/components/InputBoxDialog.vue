<template>
  <Teleport to="body">
    <Transition
      name="inputbox-fade"
      enter-active-class="transition-all duration-200 ease-apple"
      leave-active-class="transition-all duration-200 ease-apple"
      enter-from-class="opacity-0"
      leave-to-class="opacity-0"
    >
      <div
        v-if="showInputBoxVisible"
        class="fixed inset-0 z-1000 flex items-center justify-center overflow-y-auto bg-black/30"
        :class="{ 'advanced-animation': enableAdvancedAnimation }"
      >
        <Transition name="inputbox-scale">
          <div
            v-if="showInputBoxVisible"
            class="fkex-col relative m-auto flex w-full max-w-[30rem] flex-col overflow-hidden rounded-2xl border border-border-secondary bg-bg-tertiary shadow-xl"
            @click.stop
          >
            <button
              class="absolute top-4 right-4 flex h-8 w-8 cursor-pointer items-center justify-center rounded-full border border-border bg-surface-elevated text-secondary transition-all duration-fast ease-apple hover:scale-105 hover:border-danger hover:bg-danger hover:text-white focus-visible:focus-ring"
              @click="handleInputBoxCancel"
            >
              <XIcon :size="20" />
            </button>

            <div class="p-4">
              <h3 class="mb-4 pr-8 text-lg leading-[1.4] font-semibold text-main">
                {{ inputBoxOptions.title || t('pages.inputBox.title') }}
              </h3>

              <div class="relative">
                <textarea
                  v-if="inputBoxOptions.multiLine"
                  ref="textareaRef"
                  v-model="inputBoxValue"
                  :placeholder="inputBoxOptions.placeholder"
                  class="max-h-[20rem] min-h-[6rem] w-full resize-y rounded-sm border border-border bg-bg-tertiary p-4 font-[inherit] text-[0.9375rem] text-main transition-all duration-fast ease-apple outline-none placeholder:text-secondary hover:border-accent focus:border-accent focus:bg-surface"
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
                  class="w-full rounded-sm border border-border bg-bg-tertiary p-4 font-[inherit] text-[0.9375rem] text-main transition-all duration-fast ease-apple outline-none placeholder:text-secondary hover:border-accent focus:border-accent focus:bg-surface"
                  type="text"
                  @keyup.enter="handleInputBoxConfirm"
                  @keyup.escape="handleInputBoxCancel"
                />
              </div>
            </div>

            <div class="flex flex-wrap justify-center gap-3 p-2">
              <CustomButton type="secondary" :text="t('common.cancel')" @click="handleInputBoxCancel" />
              <CustomButton
                type="primary"
                :disabled="!inputBoxValue.trim()"
                :text="t('common.confirm')"
                @click="handleInputBoxConfirm"
              />
            </div>
          </div>
        </Transition>
      </div>
    </Transition>
  </Teleport>
</template>

<script lang="ts" setup>
import { XIcon } from '@lucide/vue'
import { nextTick, onBeforeMount, onBeforeUnmount, reactive, ref, useTemplateRef } from 'vue'
import { useI18n } from 'vue-i18n'

import CustomButton from '@/components/common/CustomButton.vue'
import $bus from '@/utils/bus'
import { SHOW_INPUT_BOX, SHOW_INPUT_BOX_RESPONSE } from '@/utils/constant'
import { getConfig } from '@/utils/dataSender'

const enableAdvancedAnimation = ref(false)
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

async function initConf() {
  const settingConfig = await getConfig<any>('settings')
  enableAdvancedAnimation.value = settingConfig?.enableAdvancedAnimation || false
}

onBeforeMount(() => {
  initConf()
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
