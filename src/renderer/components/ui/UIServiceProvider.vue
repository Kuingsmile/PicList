<template>
  <div>
    <!-- MessageToast component -->
    <MessageToast ref="messageRef" />

    <!-- ConfirmMessageBox component -->
    <ConfirmMessageBox
      :is-open="confirmVisible"
      :title="confirmOptions.title"
      :message="confirmOptions.message"
      :type="confirmOptions.type"
      :confirm-button-text="confirmOptions.confirmButtonText"
      :cancel-button-text="confirmOptions.cancelButtonText"
      :show-close="confirmOptions.showClose"
      :center="confirmOptions.center"
      @confirm="handleConfirm"
      @cancel="handleCancel"
    />
  </div>
</template>

<script setup lang="ts">
import { onMounted, reactive, ref, useTemplateRef } from 'vue'

import useConfirm, { type ConfirmOptions } from '@/hooks/useConfirm'
import useMessage from '@/hooks/useMessage'

import ConfirmMessageBox from './ConfirmMessageBox.vue'
import MessageToast from './MessageToast.vue'

const messageRef = useTemplateRef('messageRef')
const confirmVisible = ref(false)
const confirmOptions = reactive<ConfirmOptions>({
  message: '',
  title: 'Confirm',
  type: 'info',
  confirmButtonText: 'Confirm',
  cancelButtonText: 'Cancel',
  showClose: true,
  center: false,
})

let confirmResolve: ((value: boolean) => void) | null = null

const handleConfirm = () => {
  confirmVisible.value = false
  if (confirmResolve) {
    confirmResolve(true)
    confirmResolve = null
  }
}

const handleCancel = () => {
  confirmVisible.value = false
  if (confirmResolve) {
    confirmResolve(false)
    confirmResolve = null
  }
}

const showConfirm = (options: ConfirmOptions): Promise<boolean> => {
  return new Promise(resolve => {
    Object.assign(confirmOptions, {
      title: 'Confirm',
      type: 'info',
      confirmButtonText: 'Confirm',
      cancelButtonText: 'Cancel',
      showClose: true,
      center: false,
      ...options,
    })
    confirmResolve = resolve
    confirmVisible.value = true
  })
}

onMounted(() => {
  const { setMessageService } = useMessage()
  if (messageRef.value) {
    setMessageService({
      success: messageRef.value.success,
      error: messageRef.value.error,
      warning: messageRef.value.warning,
      info: messageRef.value.info,
    })
  }

  // Initialize confirm service
  const { setConfirmService } = useConfirm()
  setConfirmService({
    confirm: showConfirm,
  })
})
</script>

<script lang="ts">
export default {
  name: 'UIServiceProvider',
}
</script>
