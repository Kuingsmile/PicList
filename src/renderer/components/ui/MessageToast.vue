<template>
  <Teleport to="body">
    <div class="message-container">
      <TransitionGroup name="message" tag="div">
        <div v-for="message in messages" :key="message.id" class="message-toast" :class="getMessageClass(message.type)">
          <div class="message-icon">
            <component :is="getIconComponent(message.type)" :size="20" />
          </div>
          <div class="message-content">
            {{ message.message }}
          </div>
          <button v-if="message.showClose" class="message-close" @click="removeMessage(message.id)">
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

<style scoped>
.message-container {
  position: fixed;
  top: 34px;
  right: 20px;
  z-index: 3000;
  pointer-events: none;
}

.message-toast {
  display: flex;
  align-items: flex-start;
  margin-bottom: 0.5rem;
  border: 1px solid rgb(229 231 235);
  border-radius: 0.5rem;
  padding: 0.75rem 1rem;
  min-width: 20rem;
  max-width: 24rem;
  background: white;
  box-shadow:
    0 4px 6px -1px rgb(0 0 0 / 10%),
    0 2px 4px -1px rgb(0 0 0 / 6%);
  gap: 0.75rem;
  pointer-events: all;
  overflow-wrap: break-word;
}

:root.dark .message-toast,
:root.auto.dark .message-toast {
  border-color: rgb(55 65 81);
  background: rgb(31 41 55);
}

.message-info {
  border-left: 4px solid rgb(59 130 246);
}

.message-info .message-icon {
  color: rgb(59 130 246);
}

.message-success {
  border-left: 4px solid rgb(34 197 94);
}

.message-success .message-icon {
  color: rgb(34 197 94);
}

.message-warning {
  border-left: 4px solid rgb(245 158 11);
}

.message-warning .message-icon {
  color: rgb(245 158 11);
}

.message-error {
  border-left: 4px solid rgb(239 68 68);
}

.message-error .message-icon {
  color: rgb(239 68 68);
}

.message-icon {
  flex-shrink: 0;
  margin-top: 0.125rem;
}

.message-content {
  min-width: 0;
  font-size: 0.875rem;
  color: rgb(75 85 99);
  flex: 1;
  line-height: 1.25rem;
  word-break: break-word;
  overflow-wrap: break-word;
  hyphens: auto;
}

:root.dark .message-content,
:root.auto.dark .message-content {
  color: rgb(209 213 219);
}

.message-close {
  display: flex;
  justify-content: center;
  align-items: center;
  margin-top: 0.125rem;
  border: none;
  border-radius: 0.25rem;
  padding: 0.25rem;
  color: rgb(107 114 128);
  background: none;
  cursor: pointer;
  flex-shrink: 0;
}

.message-close:hover {
  color: rgb(75 85 99);
  background: rgb(243 244 246);
}

:root.dark .message-close,
:root.auto.dark .message-close {
  color: rgb(156 163 175);
}

:root.dark .message-close:hover,
:root.auto.dark .message-close:hover {
  color: rgb(209 213 219);
  background: rgb(55 65 81);
}

/* Transition animations */
.message-enter-active,
.message-leave-active {
  transition: all 0.3s ease;
}

.message-enter-from {
  opacity: 0;
  transform: translateX(100%);
}

.message-leave-to {
  opacity: 0;
  transform: translateX(100%);
}

.message-move {
  transition: transform 0.3s ease;
}
</style>
