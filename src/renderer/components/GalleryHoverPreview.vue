<template>
  <Teleport to="body">
    <div
      v-if="visible"
      :id
      class="gallery-hover-preview"
      role="tooltip"
      :style="position"
      @mouseenter="cancelHide"
      @mouseleave="hide"
    >
      <div class="preview-image">
        <img
          v-if="src && !failed"
          :key="src"
          :src
          :alt
          :class="{ 'is-loading': !loaded }"
          @load="loaded = true"
          @error="failed = true"
        />
        <span v-if="failed || !src" class="preview-status">{{ t('pages.gallery.previewUnavailable') }}</span>
        <span v-else-if="!loaded" class="preview-status" role="status">{{ t('pages.gallery.previewLoading') }}</span>
      </div>
      <div class="preview-name" :title="alt">{{ alt }}</div>
    </div>
  </Teleport>
</template>

<script setup lang="ts">
import { useEventListener } from '@vueuse/core'
import { onBeforeUnmount, onDeactivated, ref, watch } from 'vue'
import { useI18n } from 'vue-i18n'

const { id, src, alt } = defineProps<{ id: string; src: string; alt: string }>()
const emit = defineEmits<{ show: []; hide: [] }>()
const { t } = useI18n()
const visible = ref(false)
const loaded = ref(false)
const failed = ref(false)
const position = ref({ left: '0px', top: '0px', width: '280px', height: '224px' })
let showTimer: ReturnType<typeof setTimeout> | undefined
let hideTimer: ReturnType<typeof setTimeout> | undefined

function cancelHide() {
  clearTimeout(hideTimer)
  hideTimer = undefined
}

function hide() {
  clearTimeout(showTimer)
  showTimer = undefined
  cancelHide()
  visible.value = false
  emit('hide')
}

function scheduleHide() {
  clearTimeout(showTimer)
  showTimer = undefined
  cancelHide()
  // Leave time to move from the icon into the preview itself.
  hideTimer = setTimeout(hide, 150)
}

function show(anchor: Element) {
  clearTimeout(showTimer)
  cancelHide()
  visible.value = false
  loaded.value = false
  failed.value = false
  showTimer = setTimeout(() => {
    showTimer = undefined
    if (!anchor.isConnected) return hide()
    const rect = (anchor.querySelector('.file-icon') || anchor).getBoundingClientRect()
    const margin = 8
    const width = Math.min(280, window.innerWidth - margin * 2)
    const height = Math.min(224, window.innerHeight - margin * 2)
    const left = rect.right + width + margin + 12 <= window.innerWidth ? rect.right + 12 : rect.left - width - 12
    position.value = {
      left: `${Math.max(margin, Math.min(left, window.innerWidth - width - margin))}px`,
      top: `${Math.max(margin, Math.min(rect.top, window.innerHeight - height - margin))}px`,
      width: `${width}px`,
      height: `${height}px`,
    }
    emit('show')
    visible.value = true
  }, 180)
}

watch(
  () => src,
  () => {
    loaded.value = false
    failed.value = false
  },
)

useEventListener(window, 'scroll', hide, { capture: true })
useEventListener(window, 'resize', hide)
useEventListener(window, 'blur', hide)
useEventListener(window, 'keydown', event => {
  if (event.key === 'Escape') hide()
})
onDeactivated(hide)
onBeforeUnmount(hide)

defineExpose({ show, hide, scheduleHide })
</script>

<style scoped>
.gallery-hover-preview {
  position: fixed;
  z-index: 1000;
  display: flex;
  flex-direction: column;
  gap: 8px;
  box-sizing: border-box;
  padding: 8px;
  border: 1px solid var(--color-border);
  border-radius: 8px;
  background: var(--color-background-tertiary);
  color: var(--color-text-primary);
  box-shadow: var(--shadow-lg);
}

.preview-image {
  position: relative;
  display: flex;
  flex: 1;
  align-items: center;
  justify-content: center;
  min-height: 0;
  overflow: hidden;
  border-radius: 4px;
}

.preview-image img {
  width: 100%;
  height: 100%;
  object-fit: contain;
}

.preview-image img.is-loading {
  visibility: hidden;
}

.preview-status {
  position: absolute;
  inset: 0;
  display: flex;
  align-items: center;
  justify-content: center;
  font-size: 12px;
  color: var(--color-text-secondary);
}

.preview-name {
  flex: none;
  overflow: hidden;
  font-size: 12px;
  line-height: 18px;
  text-overflow: ellipsis;
  white-space: nowrap;
}
</style>
