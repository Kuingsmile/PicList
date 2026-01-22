<template>
  <div
    class="fixed inset-0 z-1000 flex items-center justify-center overflow-y-auto bg-black/30"
    :class="{ 'advanced-animation': enableAdvancedAnimation }"
    @click.stop
  >
    <div
      class="m-auto flex flex-col overflow-hidden rounded-lg border border-border-secondary bg-bg-tertiary shadow-xl"
      :style="{
        height: height || '85vh',
        maxHeight: maxHeight || '85vh',
        width: width || '90vw',
        maxWidth: maxWidth || '90vw',
      }"
      @click.stop
    >
      <div class="flex items-center justify-between border border-border-secondary bg-bg-tertiary px-5 py-4 max-md:p-2">
        <slot name="titleBar"></slot>
        <h3 v-if="title !== ''" class="m-0 text-xl font-semibold text-main">
          {{ title }}
        </h3>
        <span v-if="description !== ''" class="mt-1 text-xl font-semibold text-secondary">
          {{ description }}
        </span>
        <button
          class="flex h-8 w-8 cursor-pointer items-center justify-center rounded-full border border-border bg-surface-elevated text-secondary transition-all duration-fast ease-apple hover:scale-105 hover:border-danger hover:bg-danger hover:text-white focus-visible:focus-ring"
          @click="handleClose"
        >
          <XIcon :size="20" />
        </button>
      </div>
      <div
        class="no-scrollbar h-[calc(90vh-90px)] flex-1 overflow-y-auto max-md:p-4"
        :style="{ height: height ? 'calc(' + height + ' - 90px)' : 'calc(85vh - 90px)' }"
      >
        <slot></slot>
      </div>
      <div v-if="$slots.footer" class="flex justify-end gap-3 border-t border-border-secondary p-3">
        <slot name="footer"></slot>
      </div>
    </div>
  </div>
</template>

<script setup lang="ts">
import { XIcon } from 'lucide-vue-next'
import { onBeforeMount, ref } from 'vue'

import { getConfig } from '@/utils/dataSender'

const visible = defineModel<boolean>('visible')

function handleClose() {
  visible.value = false
}

const enableAdvancedAnimation = ref(false)

const {
  title = '',
  description = '',
  height = '',
  maxHeight = '',
  width = '',
  maxWidth = '',
} = defineProps<{
  title?: string
  description?: string
  height?: string
  width?: string
  maxHeight?: string
  maxWidth?: string
}>()

async function initConf() {
  enableAdvancedAnimation.value = (await getConfig('settings.enableAdvancedAnimation')) || false
}

onBeforeMount(() => {
  initConf()
})
</script>
