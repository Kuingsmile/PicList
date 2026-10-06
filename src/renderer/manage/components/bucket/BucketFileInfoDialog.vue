<template>
  <CustomModal v-model:visible="isShowFileInfo" width="760px" height="auto" :title="t('pages.manage.bucket.fileInfo')">
    <div class="bg-bg p-4 sm:p-6">
      <div class="mb-5 flex flex-wrap items-center justify-between gap-4 border-b border-border-secondary pb-5">
        <div class="flex min-w-0 flex-1 items-center gap-3">
          <div class="flex h-11 w-11 shrink-0 items-center justify-center rounded-lg bg-accent/15 text-accent">
            <FolderIcon v-if="currentShowedFileInfo.isDir" :size="22" />
            <FileIcon v-else :size="22" />
          </div>
          <div class="min-w-0">
            <p class="text-xs font-medium text-secondary">
              {{ t(currentShowedFileInfo.isDir ? 'common.fileTable.folder' : 'pages.manage.bucket.fileInfo') }}
            </p>
            <p class="text-base font-semibold wrap-anywhere text-main">
              {{ currentShowedFileInfo.fileName || currentShowedFileInfo.key || '—' }}
            </p>
          </div>
        </div>
        <CustomButton
          type="secondary"
          :icon="CopyIcon"
          :text="t('pages.manage.bucket.copyFileInfoInJson')"
          @click="copyToClipboard(JSON.stringify(currentShowedFileInfo, null, 2))"
        />
      </div>
      <dl class="overflow-hidden rounded-lg border border-border-secondary bg-bg-secondary">
        <div
          v-for="(value, key) in currentShowedFileInfo"
          :key
          class="grid gap-2 border-b border-border-secondary p-4 last:border-b-0 sm:grid-cols-[minmax(0,11rem)_minmax(0,1fr)] sm:gap-4"
        >
          <dt class="flex min-w-0 items-start justify-between gap-2 text-sm font-medium text-main">
            <span class="pt-1 wrap-anywhere">{{ key }}</span>
            <button
              v-tooltip="`${t('pages.manage.bucket.copyFileInfoInJson')}: ${key}`"
              type="button"
              class="shrink-0 rounded p-1 text-secondary transition-colors hover:bg-accent/15 hover:text-accent focus-visible:focus-ring"
              :aria-label="`${t('pages.manage.bucket.copyFileInfoInJson')}: ${key}`"
              @click="copyToClipboard(JSON.stringify({ [key]: value }))"
            >
              <CopyIcon :size="15" />
            </button>
          </dt>
          <dd class="flex min-w-0 items-start gap-2">
            <pre
              class="min-w-0 flex-1 font-mono text-sm leading-relaxed wrap-anywhere whitespace-pre-wrap text-secondary"
              >{{ formatFileInfoValue(value) }}</pre>
            <button
              v-tooltip="`${t('common.copy')}: ${key}`"
              type="button"
              class="shrink-0 rounded p-1 text-secondary transition-colors hover:bg-accent/15 hover:text-accent focus-visible:focus-ring"
              :aria-label="`${t('common.copy')}: ${key}`"
              @click="copyToClipboard(formatFileInfoValue(value))"
            >
              <CopyIcon :size="15" />
            </button>
          </dd>
        </div>
      </dl>
    </div>
  </CustomModal>
</template>

<script setup lang="ts">
import { CopyIcon, FileIcon, FolderIcon } from '@lucide/vue'
import { useI18n } from 'vue-i18n'

import CustomButton from '@/components/common/CustomButton.vue'
import CustomModal from '@/components/common/CustomModal.vue'

const isShowFileInfo = defineModel<boolean>('visible', { required: true })
defineProps<{ currentShowedFileInfo: Record<string, any> }>()
const emit = defineEmits<{ copy: [text: string] }>()
const { t } = useI18n()
function copyToClipboard(text: string) {
  emit('copy', text)
}
function formatFileInfoValue(value: unknown): string {
  if (value !== null && typeof value === 'object') return JSON.stringify(value, null, 2)
  return String(value)
}
</script>
