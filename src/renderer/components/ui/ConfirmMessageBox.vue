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
import { AlertTriangle, CheckCircle, Info, X as XIcon, XCircle } from '@lucide/vue'
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
  background: color-mix(in srgb, var(--color-black) 40%, transparent);
}

/* Container */
.messagebox-container {
  position: relative;
  overflow: hidden;
  border: 1px solid var(--color-border);
  border-radius: 1rem;
  width: 100%;
  max-width: 26rem;
  background: var(--color-surface-elevated);
  box-shadow: var(--shadow-xl);
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
  color: var(--color-text-secondary);
  background: transparent;
  transition: all 0.15s ease;
  cursor: pointer;
}

.messagebox-close:hover {
  color: var(--color-text-primary);
  background: var(--color-background-secondary);
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
  color: var(--color-warning);
  background: color-mix(in srgb, var(--color-warning) 15%, transparent);
}

.messagebox-icon-info {
  color: var(--color-accent);
  background: color-mix(in srgb, var(--color-accent) 15%, transparent);
}

.messagebox-icon-success {
  color: var(--color-success);
  background: color-mix(in srgb, var(--color-success) 15%, transparent);
}

.messagebox-icon-error {
  color: var(--color-danger);
  background: color-mix(in srgb, var(--color-danger) 15%, transparent);
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
  color: var(--color-text-primary);
}

.messagebox-message {
  margin: 0;
  font-size: 0.9375rem;
  line-height: 1.5;
  color: var(--color-text-secondary);
}

/* Actions */
.messagebox-actions {
  display: flex;
  border-top: 1px solid var(--color-border-secondary);
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
  border: 1px solid var(--color-border);
  color: var(--color-text-primary);
  background: var(--color-surface);
}

.cancel-btn:hover {
  border-color: var(--color-accent);
  background: var(--color-background-secondary);
}

/* Confirm Buttons */
.confirm-btn {
  border: none;
  color: var(--color-white);
  box-shadow: var(--shadow-sm);
}

.confirm-btn:hover {
  box-shadow: var(--shadow-md);
}

.confirm-btn.primary {
  background: var(--color-primary);
}

.confirm-btn.primary:hover {
  background: var(--color-primary-hover);
}

.confirm-btn.danger {
  background: var(--color-danger);
}

.confirm-btn.danger:hover {
  background: color-mix(in srgb, var(--color-danger) 85%, var(--color-text-primary));
}

.confirm-btn.success {
  background: var(--color-success);
}

.confirm-btn.success:hover {
  background: color-mix(in srgb, var(--color-success) 85%, var(--color-text-primary));
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
