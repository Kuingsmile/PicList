<template>
  <main class="flex h-screen w-full flex-col bg-bg-tertiary p-5 text-main" aria-labelledby="rename-title">
    <form class="flex h-full flex-col" novalidate @submit.prevent="confirmName" @keydown.esc.prevent="keepOriginal">
      <!-- Header -->
      <header class="flex items-center gap-3">
        <div class="flex h-9 w-9 shrink-0 items-center justify-center rounded-lg bg-accent/10 text-accent">
          <FilePenLineIcon :size="18" aria-hidden="true" />
        </div>
        <div class="min-w-0 flex-1">
          <h1 id="rename-title" class="text-base leading-tight font-semibold">{{ t('pages.rename.title') }}</h1>
          <p class="mt-0.5 min-h-4 truncate text-xs text-tertiary" :title="request?.originalName">
            {{ request?.originalName }}
          </p>
        </div>
        <span
          v-if="request && request.total > 1"
          class="shrink-0 rounded-full bg-accent/10 px-2 py-0.5 text-xs font-semibold text-accent tabular-nums"
        >
          {{ t('pages.rename.progress', { current: request.index + 1, total: request.total }) }}
        </span>
      </header>

      <!-- Name input -->
      <div class="relative mt-4">
        <input
          ref="fileNameInput"
          v-model="fileName"
          type="text"
          spellcheck="false"
          autocomplete="off"
          :aria-label="t('pages.rename.inputLabel')"
          :aria-invalid="!!validationError || undefined"
          aria-describedby="rename-message"
          :disabled="!request"
          class="box-border w-full rounded-md border border-border bg-bg-secondary py-3 pl-3 text-sm text-main transition-all duration-200 ease-apple focus:border-accent focus-visible:focus-ring disabled:opacity-50"
          :class="[isModified ? 'pr-10' : 'pr-3', { 'border-danger! focus-visible:outline-danger!': validationError }]"
          :placeholder="t('pages.rename.placeholder')"
          @input="validationError = ''"
        />
        <button
          v-if="isModified"
          type="button"
          :title="t('pages.rename.reset')"
          :aria-label="t('pages.rename.reset')"
          class="absolute top-1/2 right-2 flex h-7 w-7 -translate-y-1/2 cursor-pointer items-center justify-center rounded-sm text-secondary transition-colors duration-fast hover:bg-accent/10 hover:text-accent focus-visible:focus-ring"
          @click="resetName"
        >
          <RotateCcwIcon :size="15" aria-hidden="true" />
        </button>
      </div>

      <!-- Error, warning or keyboard hint -->
      <p id="rename-message" class="mt-2 flex min-h-5 items-center gap-1.5 text-xs" aria-live="polite">
        <template v-if="validationError">
          <CircleAlertIcon :size="14" class="shrink-0 text-danger" aria-hidden="true" />
          <span class="truncate font-medium text-danger">{{ validationError }}</span>
        </template>
        <template v-else-if="warning">
          <TriangleAlertIcon :size="14" class="shrink-0 text-warning" aria-hidden="true" />
          <span class="truncate text-warning" :title="warning">{{ warning }}</span>
        </template>
        <span v-else class="flex items-center gap-3 text-tertiary" aria-hidden="true">
          <span class="flex items-center gap-1">
            <kbd :class="kbdClass">↵</kbd>
            {{ t('pages.rename.hintConfirm') }}
          </span>
          <span class="flex items-center gap-1">
            <kbd :class="kbdClass">Esc</kbd>
            {{ t('pages.rename.hintKeep') }}
          </span>
        </span>
      </p>

      <!-- Actions -->
      <div class="mt-auto flex justify-end gap-2 pt-4">
        <CustomButton
          type="secondary"
          :text="t('pages.rename.keepOriginal')"
          :disabled="!request || submitted"
          @click="keepOriginal"
        />
        <CustomButton
          native-type="submit"
          :icon="CheckIcon"
          :text="t('pages.rename.confirm')"
          :disabled="!request || submitted || !fileName.trim()"
        />
      </div>
    </form>
  </main>
</template>

<script lang="ts" setup>
import { CheckIcon, CircleAlertIcon, FilePenLineIcon, RotateCcwIcon, TriangleAlertIcon } from '@lucide/vue'
import { computed, nextTick, onBeforeMount, onBeforeUnmount, onMounted, ref, useTemplateRef } from 'vue'
import { useI18n } from 'vue-i18n'

import CustomButton from '@/components/common/CustomButton.vue'
import { GET_RENAME_FILE_NAME, RENAME_FILE_NAME } from '#/constants/ipcChannels'

defineOptions({ name: 'RenamePage' })

// Characters that commonly break object keys or the generated URL.
const UNSAFE_CHARS = /[\\:*?"<>|#]/g

const kbdClass =
  'inline-flex min-w-4 items-center justify-center rounded border border-border-secondary bg-bg-secondary px-1 font-sans text-[10px] leading-4 text-secondary'

const { t } = useI18n()
const request = ref<IRenameRequest | null>(null)
const fileNameInput = useTemplateRef('fileNameInput')
const fileName = ref('')
const validationError = ref('')
const submitted = ref(false)

const isModified = computed(() => !!request.value && fileName.value !== request.value.fileName)

function getExtension(name: string) {
  const dot = name.lastIndexOf('.')
  return dot > 0 ? name.slice(dot).toLowerCase() : ''
}

const warning = computed(() => {
  const name = fileName.value.trim()
  if (!request.value || !name) return ''
  const unsafe = [...new Set(name.match(UNSAFE_CHARS))]
  if (unsafe.length) return t('pages.rename.unsafeChars', { chars: unsafe.join(' ') })
  const from = getExtension(request.value.fileName)
  const to = getExtension(name)
  if (from && !to) return t('pages.rename.extensionRemoved')
  if (from && to && from !== to) return t('pages.rename.extensionChanged', { from, to })
  return ''
})

// Select only the base name, like the system file manager does, so typing keeps the extension.
function selectBaseName() {
  const input = fileNameInput.value
  if (!input) return
  const dot = input.value.lastIndexOf('.')
  input.setSelectionRange(0, dot > 0 ? dot : input.value.length)
}

function focusInput() {
  nextTick(() => {
    fileNameInput.value?.focus()
    selectBaseName()
  })
}

function handleFileName(value: IRenameRequest) {
  request.value = value
  fileName.value = value.fileName
  validationError.value = ''
  focusInput()
}

const removeRenameListener = window.electron.ipcRendererOn(RENAME_FILE_NAME, handleFileName)

function reply(name: string) {
  if (!request.value || submitted.value) return
  submitted.value = true
  const { jobId, dialogId } = request.value
  window.electron.sendToMain(`${RENAME_FILE_NAME}:${jobId}:${dialogId}`, {
    jobId,
    dialogId,
    name,
  } satisfies IRenameResponse)
}

function confirmName() {
  const name = fileName.value.trim()
  if (!name) {
    validationError.value = t('pages.rename.required')
    fileNameInput.value?.focus()
    return
  }
  reply(name)
}

function keepOriginal() {
  if (request.value) reply(request.value.originalName)
}

function resetName() {
  if (!request.value) return
  fileName.value = request.value.fileName
  validationError.value = ''
  focusInput()
}

onBeforeMount(() => {
  window.electron.sendToMain(GET_RENAME_FILE_NAME, '')
})

onMounted(() => {
  document.title = t('pages.rename.title')
})

onBeforeUnmount(() => {
  removeRenameListener()
})
</script>
