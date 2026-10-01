<template>
  <Teleport to="body">
    <Transition
      appear
      enter-active-class="transition-opacity duration-200 ease-apple motion-reduce:transition-none"
      leave-active-class="transition-opacity duration-200 ease-apple motion-reduce:transition-none"
      enter-from-class="opacity-0"
      leave-to-class="opacity-0"
    >
      <div
        v-if="visible"
        v-bind="$attrs"
        class="fixed inset-0 z-1000 flex items-center justify-center overflow-hidden overscroll-none bg-black/30"
        :class="{ 'advanced-animation': enableAdvancedAnimation }"
        @click.stop
      >
        <div
          class="m-auto flex min-h-0 min-w-0 flex-col overflow-hidden rounded-lg border border-border-secondary bg-bg-tertiary shadow-xl"
          role="dialog"
          aria-modal="true"
          :aria-label="title || description || undefined"
          :aria-describedby="description && !$slots.header ? descriptionId : undefined"
          :style="dialogStyle"
        >
          <div
            class="flex shrink-0 items-center justify-between gap-3 border-b border-border-secondary bg-bg-tertiary px-5 py-4 max-md:p-2"
          >
            <div class="min-w-0 flex-1">
              <slot name="header">
                <h3 v-if="title" class="m-0 text-xl font-semibold text-main">
                  {{ title }}
                </h3>
                <p v-if="description" :id="descriptionId" class="mt-1 text-sm text-secondary">
                  {{ description }}
                </p>
              </slot>
            </div>
            <button
              type="button"
              :disabled="closeDisabled"
              :aria-label="t('common.close')"
              class="flex h-8 w-8 shrink-0 cursor-pointer items-center justify-center rounded-full border border-border bg-surface-elevated text-secondary transition-all duration-fast ease-apple not-disabled:hover:scale-105 not-disabled:hover:border-danger not-disabled:hover:bg-danger not-disabled:hover:text-white focus-visible:focus-ring disabled:cursor-not-allowed disabled:opacity-50"
              @click="handleClose"
            >
              <XIcon :size="20" aria-hidden="true" />
            </button>
          </div>
          <div
            class="min-h-0 flex-1 overscroll-contain"
            :class="scrollable ? 'no-scrollbar overflow-y-auto max-md:p-4' : 'overflow-hidden'"
          >
            <slot />
          </div>
          <div v-if="$slots.footer" class="flex shrink-0 justify-end gap-3 border-t border-border-secondary p-3">
            <slot name="footer" />
          </div>
        </div>
      </div>
    </Transition>
  </Teleport>
</template>

<script setup lang="ts">
import { XIcon } from '@lucide/vue'
import { computed, ref, useId, watch } from 'vue'
import { useI18n } from 'vue-i18n'

import { configPaths } from '@/utils/configPaths'
import { getConfig } from '@/utils/dataSender'

defineOptions({ inheritAttrs: false })

const visible = defineModel<boolean>('visible', { required: true })
const {
  title = '',
  description = '',
  height = '85vh',
  maxHeight = '95vh',
  width = '90vw',
  maxWidth = '90vw',
  scrollable = true,
  closeDisabled = false,
} = defineProps<{
  title?: string
  description?: string
  height?: string
  width?: string
  maxHeight?: string
  maxWidth?: string
  scrollable?: boolean
  closeDisabled?: boolean
}>()

const { t } = useI18n()
const descriptionId = `modal-description-${useId()}`
const enableAdvancedAnimation = ref(false)
const dialogStyle = computed(() => ({
  height,
  width,
  maxHeight: `min(${maxHeight}, calc(100dvh - 2rem))`,
  maxWidth: `min(${maxWidth}, calc(100vw - 2rem))`,
}))

function handleClose() {
  if (!closeDisabled) visible.value = false
}

watch(
  visible,
  async (isVisible, _previous, onCleanup) => {
    if (!isVisible) return

    let cancelled = false
    onCleanup(() => {
      cancelled = true
    })
    try {
      const enabled = await getConfig<boolean>(configPaths.settings.enableAdvancedAnimation)
      if (!cancelled) enableAdvancedAnimation.value = enabled ?? false
    } catch {
      if (!cancelled) enableAdvancedAnimation.value = false
    }
  },
  { immediate: true },
)
</script>
