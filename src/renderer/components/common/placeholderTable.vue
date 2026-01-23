<template>
  <div class="mt-3 max-h-[450px] overflow-y-auto rounded-lg border border-border bg-bg-tertiary p-0 shadow-sm">
    <template v-for="key in Object.keys(list)" :key="key">
      <div class="border-b border-border last:border-0">
        <div
          class="bg-linear-150-r m-0 border-b border-border bg-accent/10 px-4 pt-3.5 pb-2 text-sm font-semibold tracking-wide text-secondary"
        >
          {{ titleList[key] }}
        </div>
        <div class="grid grid-cols-[repeat(auto-fill,minmax(240px,1fr))] gap-0 py-2">
          <div
            v-for="item in list[key]"
            :key="item.value"
            class="m-0 flex cursor-pointer items-center rounded-none px-4 py-2 text-sm leading-[1.4] hover:bg-accent/5"
            @click="copyPlaceholder(item.value)"
          >
            <code
              class="mr-3.5 min-w-[80px] shrink-0 rounded-md border border-white/20 bg-bg-secondary px-2 py-1 text-center font-['SF_Mono',Monaco,Menlo,'Ubuntu_Mono',monospace] text-base font-semibold text-main shadow-sm"
              >{{ item.value }}</code
            >
            <span class="flex-1 font-medium text-main">{{ item.label }}</span>
          </div>
        </div>
      </div>
    </template>
  </div>
</template>
<script lang="ts" setup>
import { useI18n } from 'vue-i18n'

import useMessage from '@/hooks/useMessage'

const { t } = useI18n()
const message = useMessage()
function copyPlaceholder(placeholder: string) {
  window.electron.clipboard.writeText(placeholder)
  message.success(t('pages.settings.upload.copySuccess', { content: placeholder }))
}
const { list, titleList } = defineProps<{
  list: Record<string, { label: string; value: string }[]>
  titleList: Record<string, string>
}>()
</script>
