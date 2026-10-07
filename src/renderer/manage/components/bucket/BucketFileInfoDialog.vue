<template>
  <CustomModal
    v-model:visible="isShowFileInfo"
    :title="currentShowedFileInfo.fileName || currentShowedFileInfo.key || t('pages.manage.bucket.fileInfo')"
    :description="currentShowedFileInfo.key || ''"
    width="680px"
    height="auto"
    max-height="80vh"
  >
    <div class="flex flex-col">
      <!-- Summary -->
      <div class="flex flex-wrap items-center gap-2 px-5 pt-4 pb-2">
        <span
          class="flex h-[28px] items-center gap-1.5 rounded-md px-2 text-xs font-semibold"
          :class="currentShowedFileInfo.isDir ? 'bg-accent/10 text-accent' : 'bg-bg-tertiary text-secondary'"
        >
          <FolderIcon v-if="currentShowedFileInfo.isDir" :size="14" aria-hidden="true" />
          <FileIcon v-else :size="14" aria-hidden="true" />
          {{ currentShowedFileInfo.isDir ? t('common.fileTable.folder') : fileExtension || t('common.fileTable.type') }}
        </span>
        <span
          v-for="fact in facts"
          :key="fact.label"
          class="flex h-[28px] items-center gap-1.5 rounded-md bg-bg-tertiary px-2 text-xs text-secondary tabular-nums"
        >
          <component :is="fact.icon" :size="14" aria-hidden="true" />
          {{ fact.value }}
        </span>
      </div>

      <dl class="m-0 divide-y divide-border-secondary px-2 pb-3">
        <div
          v-for="row in rows"
          :key="row.key"
          class="group/row grid grid-cols-[minmax(110px,1fr)_2fr_auto] items-start gap-3 rounded-md px-3 py-2.5 hover:bg-accent/5"
        >
          <dt class="min-w-0 pt-0.5 font-mono text-xs break-all text-tertiary">{{ row.key }}</dt>
          <dd class="m-0 min-w-0">
            <pre class="m-0 font-mono text-[13px] leading-relaxed wrap-anywhere whitespace-pre-wrap text-main">{{
              row.value
            }}</pre>
          </dd>
          <button
            v-tooltip="t('common.copy')"
            type="button"
            class="flex h-[26px] w-[26px] cursor-pointer items-center justify-center rounded-md text-tertiary opacity-60 transition-all duration-fast ease-apple group-hover/row:opacity-100 hover:bg-accent/15 hover:text-accent focus-visible:opacity-100 focus-visible:focus-ring"
            :aria-label="`${t('common.copy')}: ${row.key}`"
            @click="copyToClipboard(row.value)"
          >
            <CopyIcon :size="14" aria-hidden="true" />
          </button>
        </div>
      </dl>
    </div>
    <template #footer>
      <CustomButton
        type="secondary"
        :icon="BracesIcon"
        :text="t('pages.manage.bucket.copyFileInfoInJson')"
        @click="copyToClipboard(JSON.stringify(currentShowedFileInfo, null, 2))"
      />
    </template>
  </CustomModal>
</template>

<script setup lang="ts">
import { BracesIcon, CalendarIcon, CopyIcon, FileIcon, FolderIcon, HardDriveIcon } from '@lucide/vue'
import { computed } from 'vue'
import { useI18n } from 'vue-i18n'

import CustomButton from '@/components/common/CustomButton.vue'
import CustomModal from '@/components/common/CustomModal.vue'
import { formatFileSize } from '@/manage/utils/filePresentation'

// UI-only state that is not part of the file's metadata.
const HIDDEN_KEYS = new Set(['checked'])

const isShowFileInfo = defineModel<boolean>('visible', { required: true })
const { currentShowedFileInfo } = defineProps<{ currentShowedFileInfo: Record<string, any> }>()
const emit = defineEmits<{ copy: [text: string] }>()
const { t } = useI18n()

const fileExtension = computed(() => {
  const name = String(currentShowedFileInfo.fileName ?? '')
  const index = name.lastIndexOf('.')
  return index > 0 ? name.slice(index + 1).toUpperCase() : ''
})

const facts = computed(() => {
  const list: { label: string; icon: any; value: string }[] = []
  const size = Number(currentShowedFileInfo.fileSize)
  if (!currentShowedFileInfo.isDir && Number.isFinite(size) && size >= 0) {
    list.push({ label: 'size', icon: HardDriveIcon, value: formatFileSize(size) || '0 B' })
  }
  if (currentShowedFileInfo.formatedTime) {
    list.push({ label: 'time', icon: CalendarIcon, value: String(currentShowedFileInfo.formatedTime) })
  }
  return list
})

const rows = computed(() =>
  Object.entries(currentShowedFileInfo)
    .filter(([key]) => !HIDDEN_KEYS.has(key))
    .map(([key, value]) => ({ key, value: formatFileInfoValue(value) })),
)

function copyToClipboard(text: string) {
  emit('copy', text)
}

function formatFileInfoValue(value: unknown): string {
  if (value !== null && typeof value === 'object') return JSON.stringify(value, null, 2)
  return String(value)
}
</script>
