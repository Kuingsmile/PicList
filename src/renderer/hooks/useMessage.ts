import { ref } from 'vue'

import type { MessageOptions } from '@/components/ui/MessageToast.vue'

interface MessageService {
  success: (message: string, options?: Partial<MessageOptions>) => string
  error: (message: string, options?: Partial<MessageOptions>) => string
  warning: (message: string, options?: Partial<MessageOptions>) => string
  info: (message: string, options?: Partial<MessageOptions>) => string
}

const messageServiceRef = ref<MessageService | null>(null)

export function useMessage() {
  const setMessageService = (service: MessageService) => {
    messageServiceRef.value = service
  }

  const success = (message: string, options?: Partial<MessageOptions>) => {
    if (messageServiceRef.value) {
      return messageServiceRef.value.success(message, options)
    }
    console.warn('Message service not initialized')
    return ''
  }

  const error = (message: string, options?: Partial<MessageOptions>) => {
    if (messageServiceRef.value) {
      return messageServiceRef.value.error(message, options)
    }
    console.warn('Message service not initialized')
    return ''
  }

  const warning = (message: string, options?: Partial<MessageOptions>) => {
    if (messageServiceRef.value) {
      return messageServiceRef.value.warning(message, options)
    }
    console.warn('Message service not initialized')
    return ''
  }

  const info = (message: string, options?: Partial<MessageOptions>) => {
    if (messageServiceRef.value) {
      return messageServiceRef.value.info(message, options)
    }
    console.warn('Message service not initialized')
    return ''
  }

  return {
    setMessageService,
    success,
    error,
    warning,
    info
  }
}

export default useMessage
