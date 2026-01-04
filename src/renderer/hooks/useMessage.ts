import { ref } from 'vue'

import type { MessageOptions } from '@/components/ui/MessageToast.vue'

interface MessageService {
  success: (message: string, options?: Partial<MessageOptions>) => string
  error: (message: string, options?: Partial<MessageOptions>) => string
  warning: (message: string, options?: Partial<MessageOptions>) => string
  info: (message: string, options?: Partial<MessageOptions>) => string
}

const messageServiceRef = ref<MessageService | null>(null)

const msgHelper = (
  message: string,
  type: 'success' | 'error' | 'warning' | 'info',
  options?: Partial<MessageOptions>,
) => {
  if (messageServiceRef.value) {
    return messageServiceRef.value[type](message, options)
  }
  console.warn('Message service not initialized')
  return ''
}

export function useMessage() {
  const setMessageService = (service: MessageService) => {
    messageServiceRef.value = service
  }

  const success = (message: string, options?: Partial<MessageOptions>) => {
    return msgHelper(message, 'success', options)
  }

  const error = (message: string, options?: Partial<MessageOptions>) => {
    return msgHelper(message, 'error', options)
  }

  const warning = (message: string, options?: Partial<MessageOptions>) => {
    return msgHelper(message, 'warning', options)
  }

  const info = (message: string, options?: Partial<MessageOptions>) => {
    return msgHelper(message, 'info', options)
  }

  return {
    setMessageService,
    success,
    error,
    warning,
    info,
  }
}

export default useMessage
