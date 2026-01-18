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
              />
              <button v-if="form.fileName" type="button" class="input-clear" @click="clearFileName">
                <XIcon :size="16" />
              </button>
            </div>
            <div v-if="validationError" class="validation-error">
              {{ validationError }}
            </div>
          </div>
        </div>

        <!-- Actions -->
        <div class="form-actions">
          <button type="button" class="btn btn-secondary" @click="cancel">
            {{ $t('common.cancel') }}
          </button>
          <button type="submit" class="btn btn-primary" :disabled="!form.fileName.trim()">
            {{ $t('common.confirm') }}
          </button>
        </div>
      </form>
    </div>
  </div>
</template>

<script lang="ts" setup>
import { XIcon } from 'lucide-vue-next'
import { nextTick, onBeforeMount, onBeforeUnmount, reactive, ref, useTemplateRef } from 'vue'
import { useI18n } from 'vue-i18n'

import { GET_RENAME_FILE_NAME, RENAME_FILE_NAME } from '@/utils/constant'

const { t } = useI18n()
const id = ref<string | null>(null)
const fileNameInput = useTemplateRef('fileNameInput')
const validationError = ref<string>('')

const form = reactive({
  fileName: '',
  originName: '',
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

function validateFileName(fileName: string): string {
  if (!fileName.trim()) {
    return 'File name is required'
  }
  return ''
}

function confirmName() {
  const error = validateFileName(form.fileName)
  if (error) {
    validationError.value = error
    return
  }

  window.electron.sendToMain(`${RENAME_FILE_NAME}${id.value}`, form.fileName)
}

function cancel() {
  window.electron.sendToMain(`${RENAME_FILE_NAME}${id.value}`, form.originName)
}

function clearFileName() {
  form.fileName = ''
  validationError.value = ''
  nextTick(() => {
    fileNameInput.value?.focus()
  })
}

function clearValidationError() {
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
  name: 'RenamePage',
}
</script>
<style scoped>
.rename-container {
  display: flex;
  justify-content: center;
  align-items: center;
  padding: 2rem;
  min-height: 100vh;
  background: var(--color-background-secondary);
}

.rename-card {
  overflow: hidden;
  border: 1px solid var(--color-border);
  border-radius: var(--radius-lg);
  width: 100%;
  max-width: 500px;
  background: var(--color-background-primary);
  box-shadow:
    0 20px 25px -5px rgb(0 0 0 / 10%),
    0 10px 10px -5px rgb(0 0 0 / 4%);
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
  border: 1px solid var(--color-border);
  border-radius: var(--radius-md);
  padding: 0.875rem 1rem;
  padding-right: 2.5rem;
  width: 100%;
  font-size: 0.875rem;
  color: var(--color-text-primary);
  background: var(--color-background-primary);
  transition: all 0.2s ease;
  box-sizing: border-box;
}

.form-input:focus {
  border-color: var(--color-accent);
  outline: none;
  box-shadow: 0 0 0 2px color-mix(in srgb, var(--color-accent-hover), transparent 60%);
}

.form-input.input-error {
  border-color: #f56c6c;
  box-shadow: 0 0 0 2px rgb(245 108 108 / 20%);
}

.input-clear {
  position: absolute;
  top: 50%;
  right: 0.75rem;
  display: flex;
  justify-content: center;
  align-items: center;
  border: none;
  border-radius: 4px;
  width: 24px;
  height: 24px;
  color: var(--color-text-secondary);
  background: var(--color-background-tertiary);
  transition: all 0.2s ease;
  transform: translateY(-50%);
  cursor: pointer;
}

.input-clear:hover {
  color: var(--color-text-primary);
  background: var(--color-background-secondary);
}

.validation-error {
  display: flex;
  align-items: center;
  margin-top: 0.5rem;
  font-size: 0.75rem;
  color: #f56c6c;
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
  justify-content: center;
  align-items: center;
  border: none;
  border-radius: var(--radius-md);
  padding: 0.75rem 1.5rem;
  min-width: fit-content;
  font-size: 0.875rem;
  font-weight: 500;
  transition: all 0.2s ease;
  gap: 0.5rem;
  cursor: pointer;
}

.btn:disabled {
  opacity: 0.5;
  cursor: not-allowed;
}

.btn:hover:not(:disabled) {
  transform: translateY(-1px);
  box-shadow: 0 4px 8px rgb(0 0 0 / 15%);
}

.btn-primary {
  color: white;
  background: #409eff;
}

.btn-primary:hover:not(:disabled) {
  background: #66b1ff;
}

.btn-secondary {
  border: 1px solid var(--color-border);
  color: var(--color-text-primary);
  background: var(--color-background-primary);
}

.btn-secondary:hover:not(:disabled) {
  border-color: var(--color-accent);
  background: var(--color-background-secondary);
}

/* Responsive Design */
@media (width <= 768px) {
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
    justify-content: center;
    width: 100%;
  }
}

@media (width <= 480px) {
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
  0%,
  100% {
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
</style>
