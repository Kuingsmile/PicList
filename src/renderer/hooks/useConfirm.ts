import { ref } from 'vue'

export interface ConfirmOptions {
  title?: string
  message: string
  type?: 'info' | 'success' | 'warning' | 'error'
  confirmButtonText?: string
  cancelButtonText?: string
  showClose?: boolean
  center?: boolean
}

interface ConfirmService {
  confirm: (options: ConfirmOptions) => Promise<boolean>
}

const confirmServiceRef = ref<ConfirmService | null>(null)

export function useConfirm() {
  const setConfirmService = (service: ConfirmService) => {
    confirmServiceRef.value = service
  }

  const confirm = (options: ConfirmOptions): Promise<boolean> => {
    if (confirmServiceRef.value) {
      return confirmServiceRef.value.confirm(options)
    }
    console.warn('Confirm service not initialized')
    return Promise.resolve(false)
  }

  return {
    setConfirmService,
    confirm,
  }
}

export default useConfirm
