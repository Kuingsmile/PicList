<template>
  <div class="flex h-full w-full items-center justify-center bg-bg-secondary p-2">
    <div
      class="flex h-full w-full flex-1 items-center overflow-hidden rounded-md border border-border bg-bg-tertiary shadow-md"
    >
      <form class="flex-1 p-4" @submit.prevent="confirmName">
        <div class="p-4">
          <div class="relative flex items-center">
            <input
              ref="fileNameInput"
              v-model="form.fileName"
              type="text"
              class="box-border w-full rounded-md border border-border px-4 py-3 text-sm text-main focus:border-accent focus:outline-none [.input-error]:border-danger"
              :class="{ 'input-error': validationError }"
              :placeholder="t('pages.rename.placeholder')"
              autofocus
              @keyup.enter="confirmName"
              @input="clearValidationError"
            />
            <button
              v-if="form.fileName"
              type="button"
              class="absolute top-1/2 -right-7 flex h-[24px] w-[24px] -translate-y-1/2 cursor-pointer items-center justify-center rounded-full border-none bg-danger/10 text-secondary hover:bg-danger/20 hover:text-white"
              @click="clearFileName"
            >
              <XIcon :size="16" />
            </button>
          </div>
          <div v-if="validationError" class="mt-2 flex justify-end gap-2 text-sm font-medium text-danger">
            {{ validationError }}
          </div>
        </div>

        <!-- Actions -->
        <div class="flex flex-col items-center justify-center gap-3">
          <CustomButton class="w-[80%]" type="secondary" :text="t('common.cancel')" @click="cancel" />
          <CustomButton
            class="w-[80%]"
            type="primary"
            :text="t('common.confirm')"
            :disabled="!form.fileName.trim()"
            @click="confirmName"
          />
        </div>
      </form>
    </div>
  </div>
</template>

<script lang="ts" setup>
import { XIcon } from 'lucide-vue-next'
import { nextTick, onBeforeMount, onBeforeUnmount, reactive, ref, useTemplateRef } from 'vue'
import { useI18n } from 'vue-i18n'

import CustomButton from '@/components/common/CustomButton.vue'
import { GET_RENAME_FILE_NAME, RENAME_FILE_NAME } from '@/utils/constant'

const { t } = useI18n()
const id = ref<string | null>(null)
const fileNameInput = useTemplateRef('fileNameInput')
const validationError = ref<string>('')

const form = reactive({
  fileName: '',
  originName: '',
})

function handleFileName(newName: string, _originName: string, _id: string) {
  form.fileName = newName
  form.originName = _originName
  id.value = _id
  nextTick(() => {
    fileNameInput.value?.focus()
    fileNameInput.value?.select()
  })
}

window.electron.ipcRendererOn(RENAME_FILE_NAME, handleFileName)

function validateFileName(fileName: string): string {
  if (!fileName.trim()) {
    return 'File name is required'
  }
  return ''
}

function confirmName() {
  const error = validateFileName(form.fileName)
  if (error) {
    validationError.value = error
    return
  }

  window.electron.sendToMain(`${RENAME_FILE_NAME}${id.value}`, form.fileName)
}

function cancel() {
  window.electron.sendToMain(`${RENAME_FILE_NAME}${id.value}`, form.originName)
}

function clearFileName() {
  form.fileName = ''
  validationError.value = ''
  nextTick(() => {
    fileNameInput.value?.focus()
  })
}

function clearValidationError() {
  if (validationError.value) {
    validationError.value = ''
  }
}

onBeforeMount(() => {
  window.electron.sendToMain(GET_RENAME_FILE_NAME, '')
})

onBeforeUnmount(() => {
  window.electron.ipcRendererRemoveAllListeners(RENAME_FILE_NAME)
})
</script>

<script lang="ts">
export default {
  name: 'RenamePage',
}
</script>
