<template>
  <Teleport to="body">
    <div class="pointer-events-none fixed top-[34px] right-[20px] z-10000">
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
          class="flex-start group pointer-events-auto mb-2 flex max-w-96 min-w-80 gap-3 rounded-sm border border-gray-300 bg-white px-4 py-3 wrap-break-word shadow-sm [.message-error]:border-l-4 [.message-error]:border-l-danger [.message-info]:border-l-4 [.message-info]:border-l-accent [.message-success]:border-l-4 [.message-success]:border-l-success [.message-warning]:border-l-4 [.message-warning]:border-l-warning"
          :class="getMessageClass(message.type)"
        >
          <div
            class="mt-0.5 shrink-0 group-[.message-error]:text-danger group-[.message-info]:text-accent group-[.message-success]:text-success group-[.message-warning]:text-warning"
          >
            <component :is="getIconComponent(message.type)" :size="16" />
          </div>
          <div class="min-w-0 flex-1 text-sm leading-[1.25] font-medium wrap-break-word hyphens-auto text-secondary">
            {{ message.message }}
          </div>
          <button
            v-if="message.showClose"
            class="mt-0.5 flex shrink-0 cursor-pointer items-center justify-center rounded-sm border-none bg-none p-1 text-secondary hover:bg-danger/10"
            @click="removeMessage(message.id)"
          >
            <X :size="16" />
          </button>
        </div>
      </TransitionGroup>
    </div>
  </Teleport>
</template>

<script setup lang="ts">
import { AlertTriangle, CheckCircle, Info, X, XCircle } from 'lucide-vue-next'
import { reactive } from 'vue'

export interface MessageOptions {
  message: string
  type?: 'success' | 'warning' | 'info' | 'error'
  duration?: number
  showClose?: boolean
}

interface MessageItem extends MessageOptions {
  id: string
  timer?: ReturnType<typeof setTimeout>
}

const messages = reactive<MessageItem[]>([])

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

const addMessage = (options: MessageOptions) => {
  const id = `message-${Date.now()}-${Math.random()}`
  const duration = options.duration ?? 3000
  const showClose = options.showClose ?? true

  const message: MessageItem = {
    id,
    ...options,
    showClose,
  }

  if (duration > 0) {
    message.timer = setTimeout(() => {
      removeMessage(id)
    }, duration)
  }

  messages.push(message)
  return id
}

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

<script lang="ts">
export default {
  name: 'MessageToast',
}
</script>
