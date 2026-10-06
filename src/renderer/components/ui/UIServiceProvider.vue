<template>
  <div>
    <!-- MessageToast component -->
    <MessageToast ref="messageRef" />
    <TooltipProvider />

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
import { onBeforeUnmount, onMounted, reactive, ref, useTemplateRef } from 'vue'
import { useI18n } from 'vue-i18n'

import useConfirm, { type ConfirmOptions } from '@/composables/useConfirm'
import useMessage from '@/composables/useMessage'

import ConfirmMessageBox from './ConfirmMessageBox.vue'
import MessageToast from './MessageToast.vue'
import TooltipProvider from './TooltipProvider.vue'

defineOptions({ name: 'UIServiceProvider' })

const messageRef = useTemplateRef('messageRef')
const { t } = useI18n()
const confirmVisible = ref(false)
const confirmOptions = reactive<ConfirmOptions>({
  message: '',
  title: t('common.confirm'),
  type: 'info',
  confirmButtonText: t('common.confirm'),
  cancelButtonText: t('common.cancel'),
  showClose: true,
  center: false,
})

let confirmResolve: ((value: boolean) => void) | null = null
let isUnmounted = false
let unregisterMessageService: (() => void) | undefined
let unregisterConfirmService: (() => void) | undefined

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
  if (isUnmounted) return Promise.resolve(false)

  // Replacing the dialog must also settle the request it was displaying.
  handleCancel()

  return new Promise(resolve => {
    Object.assign(confirmOptions, {
      title: t('common.confirm'),
      type: 'info',
      confirmButtonText: t('common.confirm'),
      cancelButtonText: t('common.cancel'),
      showClose: true,
      center: false,
      ...options,
    })
    confirmResolve = resolve
    confirmVisible.value = true
  })
}

onBeforeUnmount(() => {
  isUnmounted = true
  handleCancel()
  unregisterMessageService?.()
  unregisterConfirmService?.()
})

onMounted(() => {
  const { setMessageService } = useMessage()
  if (messageRef.value) {
    unregisterMessageService = setMessageService({
      success: messageRef.value.success,
      error: messageRef.value.error,
      warning: messageRef.value.warning,
      info: messageRef.value.info,
    })
  }

  // Initialize confirm service
  const { setConfirmService } = useConfirm()
  unregisterConfirmService = setConfirmService({
    confirm: showConfirm,
  })
})
</script>
