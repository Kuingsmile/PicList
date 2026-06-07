<template>
  <div class="flex flex-1 flex-row flex-wrap items-center gap-2 p-0">
    <div class="ml-2 flex items-center gap-2 p-1">
      <FileIcon class="h-[13px] w-[13px] text-accent" />
      <span class="text-xs font-semibold text-secondary">{{
        `${t('pages.manage.bucket.fileNum', { num: currentPageFilesInfo.length })}`
      }}</span>
      <HardDriveIcon class="h-[13px] w-[13px] text-accent" />
      <span class="text-xs font-semibold text-secondary">{{
        `${t('pages.manage.bucket.pageFileSize', { size: calculateAllFileSize })}`
      }}</span>
    </div>
  </div>
</template>

<script setup lang="ts">
import { FileIcon, HardDriveIcon } from '@lucide/vue'
import { useI18n } from 'vue-i18n'
const { t } = useI18n()
const { currentPageFilesInfo, calculateAllFileSize } = defineProps<{
  currentPageFilesInfo: any[]
  calculateAllFileSize: string
}>()
</script>
