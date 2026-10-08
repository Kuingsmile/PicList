<template>
  <CustomInput v-model="model" :title :placeholder :tips class="pr-26">
    <template #input-extra>
      <button
        type="button"
        class="absolute top-1/2 right-1.5 flex -translate-y-1/2 cursor-pointer items-center gap-1 rounded-md border border-border bg-bg-secondary px-2 py-1.5 text-xs font-semibold text-main transition-colors duration-fast hover:border-accent hover:text-accent focus-visible:focus-ring disabled:cursor-not-allowed disabled:opacity-50"
        :aria-label="t('pages.imageProcess.studio.browseFor', { field: title })"
        @click="picker?.click()"
      >
        <FolderOpen :size="13" aria-hidden="true" />{{ t('pages.imageProcess.studio.browse') }}
      </button>
      <input ref="picker" type="file" class="hidden" tabindex="-1" aria-hidden="true" :accept @change="pick" />
    </template>
  </CustomInput>
</template>

<script setup lang="ts">
import { FolderOpen } from '@lucide/vue'
import { useTemplateRef } from 'vue'
import { useI18n } from 'vue-i18n'

import CustomInput from '@/components/common/CustomInput.vue'

const model = defineModel<string>({ default: '' })
const {
  title,
  placeholder,
  accept,
  tips = '',
} = defineProps<{ title: string; placeholder: string; accept: string; tips?: string }>()
const { t } = useI18n()
const picker = useTemplateRef('picker')

function pick() {
  const file = picker.value?.files?.[0]
  if (file) model.value = window.electron.showFilePath(file)
  if (picker.value) picker.value.value = ''
}
</script>
