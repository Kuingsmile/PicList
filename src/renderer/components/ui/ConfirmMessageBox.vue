<template>
  <div v-if="isOpen" class="messagebox-overlay" @click="onCancel">
    <div class="messagebox-container" @click.stop>
      <div class="messagebox-header">
        <h3 class="messagebox-title">
          {{ title }}
        </h3>
        <button v-if="showClose" class="messagebox-close" @click="onCancel">×</button>
      </div>
      <div class="messagebox-content">
        <div v-if="type" class="messagebox-icon">
          <component :is="iconComponent" :size="48" />
        </div>
        <div class="messagebox-message">
          <p>{{ message }}</p>
        </div>
      </div>
      <div v-if="center" class="messagebox-actions center">
        <button class="messagebox-btn cancel-btn" @click="onCancel">
          {{ cancelButtonText }}
        </button>
        <button class="messagebox-btn confirm-btn" :class="confirmButtonClass" @click="onConfirm">
          {{ confirmButtonText }}
        </button>
      </div>
      <div v-else class="messagebox-actions">
        <button class="messagebox-btn confirm-btn" :class="confirmButtonClass" @click="onConfirm">
          {{ confirmButtonText }}
        </button>
        <button class="messagebox-btn cancel-btn" @click="onCancel">
          {{ cancelButtonText }}
        </button>
      </div>
    </div>
  </div>
</template>

<script setup lang="ts">
import { AlertTriangle, CheckCircle, Info, XCircle } from 'lucide-vue-next'
import { computed } from 'vue'

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

interface Emits {
  (e: 'confirm'): void
  (e: 'cancel'): void
}

const props = withDefaults(defineProps<Props>(), {
  title: 'Confirm',
  confirmButtonText: 'Confirm',
  cancelButtonText: 'Cancel',
  showClose: true,
  center: false,
  type: undefined,
})

const emit = defineEmits<Emits>()

const iconComponent = computed(() => {
  switch (props.type) {
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

const confirmButtonClass = computed(() => {
  switch (props.type) {
    case 'warning':
    case 'error':
      return 'danger'
    case 'success':
      return 'success'
    default:
      return 'primary'
  }
})

const onConfirm = () => {
  emit('confirm')
}

const onCancel = () => {
  emit('cancel')
}
</script>

<script lang="ts">
export default {
  name: 'ConfirmMessageBox',
}
</script>

<style scoped>
.messagebox-overlay {
  position: fixed;
  inset: 0;
  z-index: 2000;
  display: flex;
  justify-content: center;
  align-items: center;
  background: rgb(0 0 0 / 50%);
}

.messagebox-container {
  overflow: hidden;
  border-radius: 0.75rem;
  width: 90%;
  max-width: 32rem;
  max-height: 80vh;
  background: white;
  box-shadow:
    0 20px 25px -5px rgb(0 0 0 / 10%),
    0 10px 10px -5px rgb(0 0 0 / 4%);
}

:root.dark .messagebox-container,
:root.auto.dark .messagebox-container {
  border: 1px solid rgb(55 65 81);
  background: rgb(31 41 55);
}

.messagebox-header {
  display: flex;
  justify-content: space-between;
  align-items: center;
  padding: 1.5rem 1.5rem 0;
}

.messagebox-title {
  margin: 0;
  font-size: 1.25rem;
  font-weight: 600;
  color: rgb(17 24 39);
}

:root.dark .messagebox-title,
:root.auto.dark .messagebox-title {
  color: rgb(243 244 246);
}

.messagebox-close {
  display: flex;
  justify-content: center;
  align-items: center;
  border: none;
  border-radius: 0.25rem;
  padding: 0;
  width: 24px;
  height: 24px;
  font-size: 1.5rem;
  color: rgb(107 114 128);
  background: none;
  cursor: pointer;
}

.messagebox-close:hover {
  color: rgb(17 24 39);
  background: rgb(243 244 246);
}

:root.dark .messagebox-close,
:root.auto.dark .messagebox-close {
  color: rgb(156 163 175);
}

:root.dark .messagebox-close:hover,
:root.auto.dark .messagebox-close:hover {
  color: rgb(243 244 246);
  background: rgb(55 65 81);
}

.messagebox-content {
  display: flex;
  align-items: flex-start;
  padding: 1rem 1.5rem;
  gap: 1rem;
}

.messagebox-icon {
  flex-shrink: 0;
  color: rgb(107 114 128);
}

.messagebox-icon svg[data-lucide='alert-triangle'] {
  color: rgb(245 158 11);
}

.messagebox-icon svg[data-lucide='info'] {
  color: rgb(59 130 246);
}

.messagebox-icon svg[data-lucide='check-circle'] {
  color: rgb(34 197 94);
}

.messagebox-icon svg[data-lucide='x-circle'] {
  color: rgb(239 68 68);
}

.messagebox-message {
  flex: 1;
}

.messagebox-message p {
  margin: 0;
  color: rgb(107 114 128);
  line-height: 1.6;
}

:root.dark .messagebox-message p,
:root.auto.dark .messagebox-message p {
  color: rgb(156 163 175);
}

.messagebox-actions {
  display: flex;
  justify-content: flex-end;
  padding: 0 1.5rem 1.5rem;
  gap: 0.75rem;
}

.messagebox-actions.center {
  justify-content: center;
}

.messagebox-btn {
  border: none;
  border-radius: 0.375rem;
  padding: 0.5rem 1rem;
  min-width: 4rem;
  font-size: 0.875rem;
  font-weight: 500;
  cursor: pointer;
}

.cancel-btn {
  border: 1px solid rgb(209 213 219);
  color: rgb(75 85 99);
  background: rgb(243 244 246);
}

.cancel-btn:hover {
  background: rgb(229 231 235);
}

:root.dark .cancel-btn,
:root.auto.dark .cancel-btn {
  border-color: rgb(75 85 99);
  color: rgb(209 213 219);
  background: rgb(55 65 81);
}

:root.dark .cancel-btn:hover,
:root.auto.dark .cancel-btn:hover {
  background: rgb(75 85 99);
}

.confirm-btn.primary {
  color: white;
  background: rgb(59 130 246);
}

.confirm-btn.primary:hover {
  background: rgb(37 99 235);
}

.confirm-btn.danger {
  color: white;
  background: rgb(239 68 68);
}

.confirm-btn.danger:hover {
  background: rgb(220 38 38);
}

.confirm-btn.success {
  color: white;
  background: rgb(34 197 94);
}

.confirm-btn.success:hover {
  background: rgb(22 163 74);
}
</style>
