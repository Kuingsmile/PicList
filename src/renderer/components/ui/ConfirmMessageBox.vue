<template>
  <Transition name="messagebox-fade">
    <div v-if="isOpen" class="messagebox-overlay" @click="onCancel">
      <Transition name="messagebox-scale">
        <div v-if="isOpen" class="messagebox-container" @click.stop>
          <button v-if="showClose" class="messagebox-close" @click="onCancel">
            <XIcon :size="20" />
          </button>

          <div class="messagebox-body">
            <div class="messagebox-main">
              <div v-if="type" class="messagebox-icon-wrapper" :class="`messagebox-icon-${type}`">
                <component :is="iconComponent" :size="24" :stroke-width="2.5" />
              </div>

              <div class="messagebox-content">
                <h3 class="messagebox-title">{{ title }}</h3>
                <p class="messagebox-message">{{ message }}</p>
              </div>
            </div>
          </div>

          <div class="messagebox-actions" :class="{ center }">
            <button class="messagebox-btn cancel-btn" @click="onCancel">
              {{ cancelButtonText }}
            </button>
            <button class="messagebox-btn confirm-btn" :class="confirmButtonClass" @click="onConfirm">
              {{ confirmButtonText }}
            </button>
          </div>
        </div>
      </Transition>
    </div>
  </Transition>
</template>

<script setup lang="ts">
import { AlertTriangle, CheckCircle, Info, X as XIcon, XCircle } from 'lucide-vue-next'
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
/* Transitions */
.messagebox-fade-enter-active,
.messagebox-fade-leave-active {
  transition: opacity 0.2s ease;
}

.messagebox-fade-enter-from,
.messagebox-fade-leave-to {
  opacity: 0;
}

.messagebox-scale-enter-active {
  transition: all var(--transition-bounce-md);
}

.messagebox-scale-leave-active {
  transition: all 0.2s ease;
}

.messagebox-scale-enter-from {
  opacity: 0;
  transform: scale(0.9) translateY(-10px);
}

.messagebox-scale-leave-to {
  opacity: 0;
  transform: scale(0.95);
}

/* Overlay */
.messagebox-overlay {
  position: fixed;
  inset: 0;
  z-index: 2000;
  display: flex;
  justify-content: center;
  align-items: center;
  padding: 1rem;
  background: rgb(0 0 0 / 40%);
}

/* Container */
.messagebox-container {
  position: relative;
  overflow: hidden;
  border: 1px solid rgb(229 231 235);
  border-radius: 1rem;
  width: 100%;
  max-width: 26rem;
  background: white;
  box-shadow:
    0 20px 25px -5px rgb(0 0 0 / 10%),
    0 10px 10px -5px rgb(0 0 0 / 4%);
}

/* Close Button */
.messagebox-close {
  position: absolute;
  top: 1rem;
  right: 1rem;
  z-index: 10;
  display: flex;
  justify-content: center;
  align-items: center;
  border: none;
  border-radius: 0.5rem;
  padding: 0.375rem;
  color: rgb(107 114 128);
  background: transparent;
  transition: all 0.15s ease;
  cursor: pointer;
}

.messagebox-close:hover {
  color: rgb(75 85 99);
  background: rgb(243 244 246);
}

/* Body */
.messagebox-body {
  padding: 1.75rem 2rem 1.5rem;
}

.messagebox-main {
  display: flex;
  align-items: flex-start;
  gap: 1rem;
}

/* Icon Wrapper */
.messagebox-icon-wrapper {
  display: flex;
  flex-shrink: 0;
  justify-content: center;
  align-items: center;
  border-radius: 0.625rem;
  width: 3rem;
  height: 3rem;
  animation: icon-pop var(--transition-bounce-slow);
}

@keyframes icon-pop {
  0% {
    opacity: 0;
    transform: scale(0);
  }

  50% {
    transform: scale(1.1);
  }

  100% {
    opacity: 1;
    transform: scale(1);
  }
}

.messagebox-icon-warning {
  color: rgb(245 158 11);
  background: rgb(254 243 199);
}

.messagebox-icon-info {
  color: rgb(59 130 246);
  background: rgb(219 234 254);
}

.messagebox-icon-success {
  color: rgb(34 197 94);
  background: rgb(220 252 231);
}

.messagebox-icon-error {
  color: rgb(239 68 68);
  background: rgb(254 226 226);
}

/* Content */
.messagebox-content {
  flex: 1;
  min-width: 0;
}

.messagebox-title {
  margin: 0 0 0.375rem;
  font-size: 1.0625rem;
  font-weight: 600;
  line-height: 1.4;
  color: rgb(17 24 39);
}

.messagebox-message {
  margin: 0;
  font-size: 0.9375rem;
  line-height: 1.5;
  color: rgb(107 114 128);
}

/* Actions */
.messagebox-actions {
  display: flex;
  border-top: 1px solid rgb(243 244 246);
  padding: 1rem 1.5rem;
  gap: 0.75rem;
}

.messagebox-actions.center {
  justify-content: center;
}

.messagebox-btn {
  flex: 1;
  border: none;
  border-radius: 0.5rem;
  padding: 0.625rem 1.25rem;
  font-size: 0.875rem;
  font-weight: 500;
  transition: all 0.15s ease;
  cursor: pointer;
}

.messagebox-btn:active {
  transform: scale(0.98);
}

/* Cancel Button */
.cancel-btn {
  border: 1px solid rgb(229 231 235);
  color: rgb(75 85 99);
  background: white;
}

.cancel-btn:hover {
  border-color: rgb(209 213 219);
  background: rgb(249 250 251);
}

/* Confirm Buttons */
.confirm-btn {
  border: none;
  color: white;
  box-shadow: 0 1px 2px 0 rgb(0 0 0 / 5%);
}

.confirm-btn.primary {
  background: linear-gradient(135deg, rgb(59 130 246) 0%, rgb(37 99 235) 100%);
}

.confirm-btn.primary:hover {
  background: linear-gradient(135deg, rgb(37 99 235) 0%, rgb(29 78 216) 100%);
  box-shadow: 0 4px 12px rgb(59 130 246 / 40%);
}

.confirm-btn.danger {
  background: linear-gradient(135deg, rgb(239 68 68) 0%, rgb(220 38 38) 100%);
}

.confirm-btn.danger:hover {
  background: linear-gradient(135deg, rgb(220 38 38) 0%, rgb(185 28 28) 100%);
  box-shadow: 0 4px 12px rgb(239 68 68 / 40%);
}

.confirm-btn.success {
  background: linear-gradient(135deg, rgb(34 197 94) 0%, rgb(22 163 74) 100%);
}

.confirm-btn.success:hover {
  background: linear-gradient(135deg, rgb(22 163 74) 0%, rgb(21 128 61) 100%);
  box-shadow: 0 4px 12px rgb(34 197 94 / 40%);
}

/* Responsive */
@media (width <= 640px) {
  .messagebox-overlay {
    align-items: flex-end;
    padding: 0;
  }

  .messagebox-container {
    border-radius: 1rem 1rem 0 0;
    max-width: 100%;
  }

  .messagebox-body {
    padding: 1.5rem 1.5rem 1.25rem;
  }

  .messagebox-main {
    gap: 0.875rem;
  }

  .messagebox-icon-wrapper {
    width: 2.75rem;
    height: 2.75rem;
  }

  .messagebox-actions {
    flex-direction: column-reverse;
  }

  .messagebox-btn {
    width: 100%;
  }
}
</style>
