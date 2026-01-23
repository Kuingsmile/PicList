<template>
  <div class="flex h-full items-center justify-center p-8">
    <div class="flex max-w-[400px] flex-col items-center text-center">
      <div class="mb-6">
        <FolderOpenIcon class="h-[64px] w-[64px] text-secondary" />
      </div>
      <div class="flex flex-col gap-2">
        <h3 class="mb-2 text-xl font-semibold text-main">
          {{ t('pages.manage.empty.noData') }}
        </h3>
        <p class="text-sm leading-[1.5] text-secondary">
          {{ t('pages.manage.empty.noDataDesc') }}
        </p>
      </div>
    </div>
  </div>
</template>

<script lang="ts" setup>
import { FolderOpenIcon } from 'lucide-vue-next'
import { useI18n } from 'vue-i18n'

const { t } = useI18n()
</script>
