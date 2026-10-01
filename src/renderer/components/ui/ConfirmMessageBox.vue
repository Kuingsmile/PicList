<template>
  <TransitionRoot
    :show="isOpen"
    as="template"
    enter="transition-opacity duration-200 ease-[ease]"
    enter-from="opacity-0"
    leave="transition-opacity duration-200 ease-[ease]"
    leave-to="opacity-0"
    @after-leave="restoreFocus"
  >
    <Dialog
      static
      :open="isOpen && isTopmost"
      :aria-hidden="!isTopmost || undefined"
      :inert="!isTopmost || undefined"
      :data-dialog-id="dialogId"
      class="fixed inset-0 z-2000 flex items-center justify-center bg-black/40 p-4 [@media(width<=640px)]:items-end [@media(width<=640px)]:p-0"
      role="alertdialog"
      :initial-focus="cancelButton"
      @close="onCancel"
    >
      <TransitionChild
        as="template"
        enter="transition-all duration-medium ease-bounce"
        enter-from="opacity-0 [transform:scale(0.9)_translateY(-10px)]"
        leave="transition-all duration-200 ease-[ease]"
        leave-to="opacity-0 [transform:scale(0.95)]"
      >
        <DialogPanel
          class="relative max-h-[calc(100dvh-2rem)] w-full max-w-[26rem] overflow-auto overscroll-contain rounded-[1rem] border border-border bg-surface-elevated shadow-xl [@media(width<=640px)]:max-w-full [@media(width<=640px)]:rounded-b-none"
        >
          <button
            v-if="showClose"
            type="button"
            class="absolute top-4 right-4 z-10 flex cursor-pointer items-center justify-center rounded-[0.5rem] border-none bg-transparent p-1.5 text-secondary transition-all duration-150 ease-[ease] hover:bg-bg-secondary hover:text-main"
            :aria-label="t('common.close')"
            @click="onCancel"
          >
            <XIcon :size="20" aria-hidden="true" />
          </button>

          <div
            class="px-8 pt-7 pb-6 [@media(width<=640px)]:px-6 [@media(width<=640px)]:pt-6 [@media(width<=640px)]:pb-5"
          >
            <div class="flex items-start gap-4 [@media(width<=640px)]:gap-3.5">
              <div
                v-if="type"
                class="flex size-12 shrink-0 animate-icon-pop items-center justify-center rounded-[0.625rem] [@media(width<=640px)]:size-11"
                :class="iconClass"
              >
                <component :is="iconComponent" :size="24" :stroke-width="2.5" aria-hidden="true" />
              </div>

              <div class="min-w-0 flex-1 pr-2">
                <DialogTitle
                  as="h3"
                  class="m-0 mb-1.5 text-[1.0625rem] leading-[1.4] font-semibold wrap-anywhere text-main"
                >
                  {{ title || t('common.confirm') }}
                </DialogTitle>
                <DialogDescription
                  as="p"
                  class="m-0 text-[0.9375rem] leading-normal wrap-anywhere whitespace-pre-wrap text-secondary"
                >
                  {{ message }}
                </DialogDescription>
              </div>
            </div>
          </div>

          <div
            class="flex gap-3 border-t border-border-secondary px-6 py-4 [@media(width<=640px)]:flex-col-reverse"
            :class="{ 'justify-center': center }"
          >
            <button
              ref="cancelButton"
              type="button"
              class="flex-1 cursor-pointer rounded-[0.5rem] border border-border bg-surface px-5 py-2.5 text-sm leading-normal font-medium text-main transition-all duration-150 ease-[ease] hover:border-accent hover:bg-bg-secondary active:scale-98 [@media(width<=640px)]:w-full"
              @click="onCancel"
            >
              {{ cancelButtonText || t('common.cancel') }}
            </button>
            <button
              type="button"
              class="flex-1 cursor-pointer rounded-[0.5rem] border-none px-5 py-2.5 text-sm leading-normal font-medium text-white shadow-sm transition-all duration-150 ease-[ease] hover:shadow-md active:scale-98 [@media(width<=640px)]:w-full"
              :class="confirmButtonClass"
              @click="onConfirm"
            >
              {{ confirmButtonText || t('common.confirm') }}
            </button>
          </div>
        </DialogPanel>
      </TransitionChild>
    </Dialog>
  </TransitionRoot>
</template>

<script setup lang="ts">
import { Dialog, DialogDescription, DialogPanel, DialogTitle, TransitionChild, TransitionRoot } from '@headlessui/vue'
import { AlertTriangle, CheckCircle, Info, X as XIcon, XCircle } from '@lucide/vue'
import { computed, useTemplateRef } from 'vue'
import { useI18n } from 'vue-i18n'

import { useDialogFocus } from '@/composables/useDialogFocus'

defineOptions({ name: 'ConfirmMessageBox' })

interface Props {
  isOpen: boolean
  title?: string
  message: string
  type?: 'info' | 'success' | 'warning' | 'error'
  confirmButtonText?: string
  cancelButtonText?: string
  showClose?: boolean
  center?: boolean
}

const {
  isOpen,
  title = '',
  message,
  type = undefined,
  confirmButtonText = '',
  cancelButtonText = '',
  showClose = true,
  center = false,
} = defineProps<Props>()

const emit = defineEmits<{ confirm: []; cancel: [] }>()
const { t } = useI18n()
const cancelButton = useTemplateRef('cancelButton')
const { dialogId, isTopmost, restoreFocus } = useDialogFocus(() => isOpen)

const iconComponent = computed(() => {
  switch (type) {
    case 'warning':
      return AlertTriangle
    case 'info':
      return Info
    case 'success':
      return CheckCircle
    case 'error':
      return XCircle
    default:
      return Info
  }
})

const iconClass = computed(() => {
  switch (type) {
    case 'warning':
      return 'bg-warning/15 text-warning'
    case 'success':
      return 'bg-success/15 text-success'
    case 'error':
      return 'bg-danger/15 text-danger'
    default:
      return 'bg-accent/15 text-accent'
  }
})

const confirmButtonClass = computed(() => {
  switch (type) {
    case 'warning':
    case 'error':
      return 'bg-danger hover:bg-[color-mix(in_srgb,var(--color-danger)_85%,var(--color-text-primary))]'
    case 'success':
      return 'bg-success hover:bg-[color-mix(in_srgb,var(--color-success)_85%,var(--color-text-primary))]'
    default:
      return 'bg-primary hover:bg-primary-hover'
  }
})

const onConfirm = () => {
  emit('confirm')
}

const onCancel = () => {
  emit('cancel')
}
</script>
