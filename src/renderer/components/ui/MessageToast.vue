<template>
  <Teleport to="body">
    <div
      class="pointer-events-none fixed top-[34px] right-4 z-10000 max-h-[calc(100dvh-3rem)] max-w-[calc(100vw-2rem)] overflow-y-auto overscroll-contain"
    >
      <TransitionGroup
        name="message"
        tag="div"
        enter-active-class="transition-all duration-300 ease-in-out"
        leave-active-class="transition-all duration-300 ease-in-out"
        enter-from-class="opacity-0 translate-x-[100%]"
        leave-to-class="opacity-0 translate-x-[100%]"
      >
        <div
          v-for="message in messages"
          :key="message.id"
          class="group pointer-events-auto mb-2 flex w-96 max-w-full items-start gap-3 rounded-md border border-border bg-bg-tertiary px-4 py-3 wrap-break-word shadow-md [.message-error]:border-l-4 [.message-error]:border-l-danger [.message-info]:border-l-4 [.message-info]:border-l-accent [.message-success]:border-l-4 [.message-success]:border-l-success [.message-warning]:border-l-4 [.message-warning]:border-l-warning"
          :class="getMessageClass(message.type)"
          :role="message.type === 'error' ? 'alert' : 'status'"
          aria-atomic="true"
          @mouseenter="pauseMessage(message.id, 'pointer')"
          @mouseleave="resumeMessage(message.id, 'pointer')"
          @focusin="pauseMessage(message.id, 'focus')"
          @focusout="resumeMessage(message.id, 'focus')"
        >
          <div
            class="shrink-0 group-[.message-error]:text-danger group-[.message-info]:text-accent group-[.message-success]:text-success group-[.message-warning]:text-warning"
          >
            <component :is="getIconComponent(message.type)" :size="16" aria-hidden="true" />
          </div>
          <div class="min-w-0 flex-1 text-sm leading-normal font-medium wrap-anywhere whitespace-pre-wrap text-main">
            {{ message.message }}
          </div>
          <button
            v-if="message.showClose"
            type="button"
            :aria-label="t('common.close')"
            class="flex shrink-0 cursor-pointer items-center justify-center rounded-full border-none bg-none p-1 text-secondary hover:bg-danger/10"
            @click="removeMessage(message.id)"
          >
            <X :size="16" aria-hidden="true" />
          </button>
        </div>
      </TransitionGroup>
    </div>
  </Teleport>
</template>

<script setup lang="ts">
import { AlertTriangle, CheckCircle, Info, X, XCircle } from '@lucide/vue'
import { useEventListener } from '@vueuse/core'
import { onBeforeUnmount, reactive } from 'vue'
import { useI18n } from 'vue-i18n'

defineOptions({ name: 'MessageToast' })

export interface MessageOptions {
  message: string
  type?: 'success' | 'warning' | 'info' | 'error'
  duration?: number
  showClose?: boolean
}

interface MessageItem extends MessageOptions {
  id: string
  timer?: ReturnType<typeof setTimeout>
  remaining: number
  startedAt: number
  pausedBy: Set<'pointer' | 'focus' | 'visibility'>
}

const messages = reactive<MessageItem[]>([])
const { t } = useI18n()
let isUnmounted = false

const getIconComponent = (type: MessageOptions['type']) => {
  switch (type) {
    case 'success':
      return CheckCircle
    case 'warning':
      return AlertTriangle
    case 'error':
      return XCircle
    default:
      return Info
  }
}

const getMessageClass = (type: MessageOptions['type']) => {
  return `message-${type || 'info'}`
}

const removeMessage = (id: string) => {
  const index = messages.findIndex(msg => msg.id === id)
  if (index > -1) {
    const message = messages[index]
    if (message.timer) {
      clearTimeout(message.timer)
    }
    messages.splice(index, 1)
  }
}

const startTimer = (message: MessageItem) => {
  if (message.remaining <= 0 || message.pausedBy.size > 0) return
  message.startedAt = Date.now()
  message.timer = setTimeout(() => removeMessage(message.id), message.remaining)
}

const pauseMessage = (id: string, reason: 'pointer' | 'focus' | 'visibility') => {
  const message = messages.find(item => item.id === id)
  if (!message) return
  message.pausedBy.add(reason)
  if (message.timer !== undefined) {
    clearTimeout(message.timer)
    message.timer = undefined
    message.remaining = Math.max(1, message.remaining - (Date.now() - message.startedAt))
  }
}

const resumeMessage = (id: string, reason: 'pointer' | 'focus' | 'visibility') => {
  const message = messages.find(item => item.id === id)
  if (!message || !message.pausedBy.delete(reason)) return
  startTimer(message)
}

const addMessage = (options: MessageOptions) => {
  if (isUnmounted) return ''
  const id = `message-${Date.now()}-${Math.random()}`
  const duration = Number.isFinite(options.duration) ? Math.max(0, Math.min(options.duration!, 2147483647)) : 3000
  const showClose = options.showClose ?? true

  const message: MessageItem = {
    ...options,
    id,
    showClose,
    remaining: duration,
    startedAt: 0,
    pausedBy: new Set(document.hidden ? ['visibility'] : []),
  }

  startTimer(message)

  messages.push(message)
  return id
}

useEventListener(document, 'visibilitychange', () => {
  for (const message of messages) {
    if (document.hidden) pauseMessage(message.id, 'visibility')
    else resumeMessage(message.id, 'visibility')
  }
})

onBeforeUnmount(() => {
  isUnmounted = true
  for (const message of messages) {
    if (message.timer !== undefined) clearTimeout(message.timer)
  }
  messages.splice(0)
})

// Expose methods for external use
const success = (message: string, options?: Partial<MessageOptions>) => {
  return addMessage({ message, type: 'success', ...options })
}

const error = (message: string, options?: Partial<MessageOptions>) => {
  return addMessage({ message, type: 'error', ...options })
}

const warning = (message: string, options?: Partial<MessageOptions>) => {
  return addMessage({ message, type: 'warning', ...options })
}

const info = (message: string, options?: Partial<MessageOptions>) => {
  return addMessage({ message, type: 'info', ...options })
}

defineExpose({
  success,
  error,
  warning,
  info,
  addMessage,
  removeMessage,
})
</script>
