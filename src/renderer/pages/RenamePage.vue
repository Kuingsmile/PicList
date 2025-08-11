<template>
  <div class="rename-container">
    <div class="rename-card">
      <form @submit.prevent="confirmName">
        <div class="form-content">
          <div class="form-group">
            <div class="input-wrapper">
              <input
                ref="fileNameInput"
                v-model="form.fileName"
                type="text"
                class="form-input"
                :class="{ 'input-error': validationError }"
                :placeholder="t('pages.rename.placeholder')"
                autofocus
                @keyup.enter="confirmName"
                @input="clearValidationError"
              >
              <button
                v-if="form.fileName"
                type="button"
                class="input-clear"
                @click="clearFileName"
              >
                <XIcon :size="16" />
              </button>
            </div>
            <div
              v-if="validationError"
              class="validation-error"
            >
              {{ validationError }}
            </div>
          </div>
        </div>

        <!-- Actions -->
        <div class="form-actions">
          <button
            type="button"
            class="btn btn-secondary"
            @click="cancel"
          >
            {{ $t('common.cancel') }}
          </button>
          <button
            type="submit"
            class="btn btn-primary"
            :disabled="!form.fileName.trim()"
          >
            {{ $t('common.confirm') }}
          </button>
        </div>
      </form>
    </div>
  </div>
</template>

<script lang="ts" setup>
import { XIcon } from 'lucide-vue-next'
import { nextTick, onBeforeMount, onBeforeUnmount, reactive, ref } from 'vue'
import { useI18n } from 'vue-i18n'

import { GET_RENAME_FILE_NAME, RENAME_FILE_NAME } from '@/utils/constant'

const { t } = useI18n()
const id = ref<string | null>(null)
const fileNameInput = ref<HTMLInputElement>()
const validationError = ref<string>('')

const form = reactive({
  fileName: '',
  originName: ''
})

const handleFileName = (newName: string, _originName: string, _id: string) => {
  form.fileName = newName
  form.originName = _originName
  id.value = _id
  nextTick(() => {
    fileNameInput.value?.focus()
    fileNameInput.value?.select()
  })
}

window.electron.ipcRendererOn(RENAME_FILE_NAME, handleFileName)

function validateFileName (fileName: string): string {
  if (!fileName.trim()) {
    return 'File name is required'
  }
  const invalidChars = /[<>:"/\\|?*]/g
  if (invalidChars.test(fileName)) {
    return 'File name contains invalid characters'
  }
  const reservedNames = /^(CON|PRN|AUX|NUL|COM[1-9]|LPT[1-9])$/i
  if (reservedNames.test(fileName.trim())) {
    return 'This is a reserved file name'
  }
  return ''
}

function confirmName () {
  const error = validateFileName(form.fileName)
  if (error) {
    validationError.value = error
    return
  }

  window.electron.sendToMain(`${RENAME_FILE_NAME}${id.value}`, form.fileName)
}

function cancel () {
  window.electron.sendToMain(`${RENAME_FILE_NAME}${id.value}`, form.originName)
}

function clearFileName () {
  form.fileName = ''
  validationError.value = ''
  nextTick(() => {
    fileNameInput.value?.focus()
  })
}

function clearValidationError () {
  if (validationError.value) {
    validationError.value = ''
  }
}

onBeforeMount(() => {
  window.electron.sendToMain(GET_RENAME_FILE_NAME, '')
})

onBeforeUnmount(() => {
  window.electron.ipcRendererRemoveAllListeners(RENAME_FILE_NAME)
})

</script>
<script lang="ts">
export default {
  name: 'RenamePage'
}
</script>
<style scoped>
.rename-container {
  padding: 2rem;
  min-height: 100vh;
  background: var(--color-background-secondary);
  display: flex;
  align-items: center;
  justify-content: center;
}

.rename-card {
  background: var(--color-background-primary);
  border-radius: 12px;
  box-shadow: 0 20px 25px -5px rgba(0, 0, 0, 0.1), 0 10px 10px -5px rgba(0, 0, 0, 0.04);
  border: 1px solid var(--color-border);
  width: 100%;
  max-width: 500px;
  overflow: hidden;
}

/* Form */
.form-content {
  padding: 2rem;
}

.form-group {
  margin-bottom: 1.5rem;
}

.form-group:last-child {
  margin-bottom: 0;
}

.form-label {
  display: block;
  margin-bottom: 0.75rem;
  font-size: 0.875rem;
  font-weight: 500;
  color: var(--color-text-primary);
}

.input-wrapper {
  position: relative;
  display: flex;
  align-items: center;
}

.form-input {
  width: 100%;
  padding: 0.875rem 1rem;
  padding-right: 2.5rem;
  border: 1px solid var(--color-border);
  border-radius: 8px;
  background: var(--color-background-primary);
  color: var(--color-text-primary);
  font-size: 0.875rem;
  transition: all 0.2s ease;
  box-sizing: border-box;
}

.form-input:focus {
  outline: none;
  border-color: var(--color-blue-common);
  box-shadow: 0 0 0 2px rgba(64, 158, 255, 0.2);
}

.form-input.input-error {
  border-color: #f56c6c;
  box-shadow: 0 0 0 2px rgba(245, 108, 108, 0.2);
}

.input-clear {
  position: absolute;
  right: 0.75rem;
  top: 50%;
  transform: translateY(-50%);
  display: flex;
  align-items: center;
  justify-content: center;
  width: 24px;
  height: 24px;
  border-radius: 4px;
  border: none;
  background: var(--color-background-tertiary);
  color: var(--color-text-secondary);
  cursor: pointer;
  transition: all 0.2s ease;
}

.input-clear:hover {
  background: var(--color-background-secondary);
  color: var(--color-text-primary);
}

.validation-error {
  margin-top: 0.5rem;
  font-size: 0.75rem;
  color: #f56c6c;
  display: flex;
  align-items: center;
  gap: 0.25rem;
}

/* Actions */
.form-actions {
  display: flex;
  justify-content: flex-end;
  gap: 0.75rem;
  padding: 1rem 2rem 2rem;
  background: var(--color-background-tertiary);
}

/* Buttons */
.btn {
  display: inline-flex;
  align-items: center;
  justify-content: center;
  gap: 0.5rem;
  padding: 0.75rem 1.5rem;
  border-radius: 8px;
  border: none;
  font-size: 0.875rem;
  font-weight: 500;
  cursor: pointer;
  transition: all 0.2s ease;
  min-width: fit-content;
}

.btn:disabled {
  opacity: 0.5;
  cursor: not-allowed;
}

.btn:hover:not(:disabled) {
  transform: translateY(-1px);
  box-shadow: 0 4px 8px rgba(0, 0, 0, 0.15);
}

.btn-primary {
  background: #409eff;
  color: white;
}

.btn-primary:hover:not(:disabled) {
  background: #66b1ff;
}

.btn-secondary {
  background: var(--color-background-primary);
  color: var(--color-text-primary);
  border: 1px solid var(--color-border);
}

.btn-secondary:hover:not(:disabled) {
  background: var(--color-background-secondary);
  border-color: var(--color-accent);
}

/* Responsive Design */
@media (max-width: 768px) {
  .rename-container {
    padding: 1rem;
  }

  .rename-card {
    max-width: none;
  }

  .form-actions {
    padding: 1rem 1.5rem 1.5rem;
    flex-direction: column-reverse;
  }

  .btn {
    width: 100%;
    justify-content: center;
  }
}

@media (max-width: 480px) {
  .rename-container {
    padding: 0.75rem;
  }

  .form-actions {
    padding: 1rem;
  }

}

/* Focus styles for accessibility */
.btn:focus-visible,
.input-clear:focus-visible {
  outline: 2px solid var(--color-accent);
  outline-offset: 2px;
}

.form-input:focus-visible {
  outline: 2px solid var(--color-accent);
  outline-offset: 2px;
}

/* Animation for error state */
@keyframes shake {
  0%, 100% {
    transform: translateX(0);
  }
  25% {
    transform: translateX(-4px);
  }
  75% {
    transform: translateX(4px);
  }
}

.input-error {
  animation: shake 0.3s ease-in-out;
}

/* Dark mode adjustments */
:root.dark .rename-card,
:root.auto.dark .rename-card {
  box-shadow: 0 20px 25px -5px rgba(0, 0, 0, 0.3), 0 10px 10px -5px rgba(0, 0, 0, 0.2);
}
</style>
