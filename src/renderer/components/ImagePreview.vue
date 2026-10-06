<template>
  <transition name="modal">
    <Dialog
      :open="gallerySliderControl.visible"
      class="fixed inset-0 z-1000 flex items-center justify-center outline-none"
      @click.stop
      @wheel="handleImageWheel"
      @keydown="handleKeydown"
      @close="handleClose"
    >
      <div class="absolute inset-0 bg-black/50" :class="{ 'advanced-animation': enableAdvancedAnimation }" />
      <DialogPanel
        class="relative flex max-h-[90vh] max-w-[90vw] flex-col overflow-hidden rounded-xl bg-surface shadow-lg"
      >
        <button
          class="absolute top-4 right-4 z-10 flex h-6 w-6 cursor-pointer items-center justify-center rounded-full border border-danger bg-danger/70 text-white hover:bg-danger hover:text-white focus-visible:outline-2 focus-visible:outline-offset-2 focus-visible:outline-white focus-visible:outline-solid disabled:cursor-not-allowed disabled:opacity-40"
          :aria-label="t('common.close')"
          @click="handleClose"
        >
          <XIcon :size="24" />
        </button>

        <!-- Zoom controls -->
        <div class="absolute top-4 left-4 z-10 flex items-center gap-2 rounded-lg bg-black/70 p-2">
          <button
            class="inline-flex h-[32px] min-w-[32px] cursor-pointer items-center justify-center rounded-sm border-0 bg-black/65 text-white not-disabled:hover:bg-accent focus-visible:outline-2 focus-visible:outline-offset-2 focus-visible:outline-white focus-visible:outline-solid disabled:cursor-not-allowed disabled:opacity-40"
            :aria-label="t('pages.gallery.zoomOut')"
            :disabled="imagePreviewState.scale <= minimumScale || previewFailed || previewLoading"
            @click="zoomOut"
          >
            <span>-</span>
          </button>
          <span class="min-w-[50px] text-center text-sm font-medium text-white"
            >{{ Math.round(imagePreviewState.scale * 100) }}%</span
          >
          <button
            class="inline-flex h-[32px] min-w-[32px] cursor-pointer items-center justify-center rounded-sm border-0 bg-black/65 text-white not-disabled:hover:bg-accent focus-visible:outline-2 focus-visible:outline-offset-2 focus-visible:outline-white focus-visible:outline-solid disabled:cursor-not-allowed disabled:opacity-40"
            :aria-label="t('pages.gallery.zoomIn')"
            :disabled="imagePreviewState.scale >= 5 || previewFailed || previewLoading"
            @click="zoomIn"
          >
            <span>+</span>
          </button>
          <button
            class="inline-flex h-[32px] min-w-[32px] cursor-pointer items-center justify-center rounded-sm border-0 bg-black/65 px-[8px] py-0 text-white not-disabled:hover:bg-accent focus-visible:outline-2 focus-visible:outline-offset-2 focus-visible:outline-white focus-visible:outline-solid disabled:cursor-not-allowed disabled:opacity-40"
            :disabled="previewFailed || previewLoading"
            @click="resetImageTransform"
          >
            {{ t('common.reset') }}
          </button>
        </div>

        <div class="relative flex min-h-0 items-center">
          <button
            class="prev absolute top-1/2 left-[12px] z-10 inline-flex h-[40px] w-[40px] min-w-[32px] -translate-y-1/2 cursor-pointer items-center justify-center rounded-sm border-0 bg-black/65 text-white not-disabled:hover:bg-accent focus-visible:outline-2 focus-visible:outline-offset-2 focus-visible:outline-white focus-visible:outline-solid disabled:cursor-not-allowed disabled:opacity-40"
            :aria-label="t('pages.gallery.previousImage')"
            :disabled="gallerySliderControl.index === 0"
            @click.stop="navigateImage(-1)"
          >
            <ChevronLeftIcon :size="24" />
          </button>

          <div
            ref="viewerRef"
            class="relative flex h-[80vh] w-[90vw] items-center justify-center overflow-hidden bg-black select-none active:cursor-grab!"
            @mousedown="handleImageMouseDown"
            @mousemove="handleImageMouseMove"
            @mouseup="handleImageMouseUp"
            @mouseleave="handleImageMouseUp"
            @touchstart="handleImageTouchStart"
            @touchmove="handleImageTouchMove"
            @touchend="handleImageTouchEnd"
          >
            <img
              :key="previewAttempt"
              ref="previewImageRef"
              :src="currentPreviewImage?.src"
              :alt="currentPreviewImage?.intro"
              class="block h-auto max-h-none w-auto max-w-none origin-center object-contain"
              :style="imageTransformStyle"
              @load="onPreviewImageLoad"
              @error="onPreviewImageError"
              @dragstart.prevent
              @contextmenu.prevent
            />
            <div
              v-if="previewLoading || previewFailed"
              role="status"
              class="absolute inset-0 flex flex-col items-center justify-center gap-3 bg-black text-sm text-white"
            >
              {{ t(previewFailed ? 'pages.gallery.previewUnavailable' : 'pages.gallery.previewLoading') }}
              <button
                v-if="previewFailed"
                class="inline-flex h-[32px] min-w-[32px] cursor-pointer items-center justify-center rounded-sm border-0 bg-black/65 px-[8px] py-0 text-white not-disabled:hover:bg-accent focus-visible:outline-2 focus-visible:outline-offset-2 focus-visible:outline-white focus-visible:outline-solid disabled:cursor-not-allowed disabled:opacity-40"
                @click="retryPreview"
              >
                {{ t('pages.gallery.refresh') }}
              </button>
            </div>
          </div>

          <button
            class="next absolute top-1/2 right-[12px] z-10 inline-flex h-[40px] w-[40px] min-w-[32px] -translate-y-1/2 cursor-pointer items-center justify-center rounded-sm border-0 bg-black/65 text-white not-disabled:hover:bg-accent focus-visible:outline-2 focus-visible:outline-offset-2 focus-visible:outline-white focus-visible:outline-solid disabled:cursor-not-allowed disabled:opacity-40"
            :aria-label="t('pages.gallery.nextImage')"
            :disabled="gallerySliderControl.index === filterList.length - 1"
            @click.stop="navigateImage(1)"
          >
            <ChevronRightIcon :size="24" />
          </button>
        </div>

        <div
          class="flex shrink-0 flex-wrap items-center justify-between gap-2 border border-border-secondary px-6 py-4 max-sm:px-3 max-sm:py-2"
        >
          <DialogTitle as="h3" class="m-0 mr-4 flex-1 overflow-hidden text-base font-semibold text-ellipsis text-main">
            {{ currentPreviewImage?.intro }}
          </DialogTitle>
          <div class="mr-4 text-sm font-semibold whitespace-nowrap text-main">
            {{ gallerySliderControl.index + 1 }} / {{ filterList.length }}
          </div>
          <div class="text-center text-xs font-medium text-main">
            {{ t('pages.gallery.previewHelp') }}
          </div>
        </div>
      </DialogPanel>
    </Dialog>
  </transition>
</template>

<script setup lang="ts">
import { Dialog, DialogPanel, DialogTitle } from '@headlessui/vue'
import { ChevronLeftIcon, ChevronRightIcon, XIcon } from '@lucide/vue'
import { useResizeObserver } from '@vueuse/core'
import { computed, nextTick, onMounted, reactive, ref, useTemplateRef, watch } from 'vue'
import { useI18n } from 'vue-i18n'

import { getConfig } from '@/services/configService'
import { addCacheBustParam as withCacheBustParam } from '#/utils/url'

const gallerySliderControl = defineModel<{
  visible: boolean
  index: number
}>('gallerySliderControl', { required: true })

const { filterList, isAlwaysForceReload } = defineProps<{
  filterList: {
    src: string
    imgUrl?: string
    galleryPath?: string
    intro?: string
  }[]
  isAlwaysForceReload: boolean
}>()

const { t } = useI18n()
const previewImageRef = useTemplateRef('previewImageRef')
const viewerRef = useTemplateRef('viewerRef')
const enableAdvancedAnimation = ref(false)
const previewLoading = ref(true)
const previewFailed = ref(false)
const previewAttempt = ref(0)
const minimumScale = ref(0.1)
let manuallyZoomed = false
const imagePreviewState = reactive({
  scale: 1,
  translateX: 0,
  translateY: 0,
  isDragging: false,
  startX: 0,
  startY: 0,
  startTranslateX: 0,
  startTranslateY: 0,
  isSwipeMode: false,
  swipeStartX: 0,
  swipeThreshold: 100,
})

const imageTransformStyle = computed(() => {
  // Check if image overflows the viewport
  const imageElement = previewImageRef.value
  let isDraggable = false

  if (imageElement && imageElement.naturalWidth && imageElement.naturalHeight) {
    const viewerElement = imageElement.parentElement
    if (viewerElement) {
      const viewerRect = viewerElement.getBoundingClientRect()
      const currentImageWidth = imageElement.naturalWidth * imagePreviewState.scale
      const currentImageHeight = imageElement.naturalHeight * imagePreviewState.scale
      isDraggable = currentImageWidth > viewerRect.width + 1 || currentImageHeight > viewerRect.height + 1
    }
  }

  return {
    transform: `translate(${imagePreviewState.translateX}px, ${imagePreviewState.translateY}px) scale(${imagePreviewState.scale})`,
    cursor: imagePreviewState.isDragging ? 'grabbing' : isDraggable ? 'grab' : 'default',
    transition: 'none',
  }
})

const currentPreviewImage = computed(() => {
  const item = filterList[gallerySliderControl.value.index]
  if (!item) return null
  const cacheBustedItem = { ...item }
  if (isAlwaysForceReload) {
    if (cacheBustedItem.imgUrl) {
      cacheBustedItem.imgUrl = addCacheBustParam(cacheBustedItem.imgUrl)
    }
    if (cacheBustedItem.galleryPath) {
      cacheBustedItem.galleryPath = addCacheBustParam(cacheBustedItem.galleryPath)
    }
  }
  const src = cacheBustedItem.src || cacheBustedItem.galleryPath || cacheBustedItem.imgUrl || ''
  cacheBustedItem.src = isAlwaysForceReload ? addCacheBustParam(src) : src
  return cacheBustedItem
})

watch(
  () => [gallerySliderControl.value.visible, currentPreviewImage.value?.src] as const,
  ([visible, src]) => {
    previewLoading.value = !!src
    previewFailed.value = !src
    resetImageTransform()
    if (visible && !filterList.length) handleClose()
  },
  { flush: 'post' },
)
useResizeObserver(viewerRef, () => {
  if (!gallerySliderControl.value.visible) return
  minimumScale.value = Math.min(0.1, calculateOptimalScale())
  if (!manuallyZoomed) resetImageTransform()
})
watch(
  () => filterList.length,
  length => {
    if (gallerySliderControl.value.index >= length) gallerySliderControl.value.index = Math.max(0, length - 1)
  },
)

function handleImageWheel(event: WheelEvent) {
  event.preventDefault()
  const delta = event.deltaY > 0 ? -1 : 1
  const zoomFactor = 1.1
  const newScale =
    delta > 0
      ? Math.min(imagePreviewState.scale * zoomFactor, 5)
      : Math.min(imagePreviewState.scale, Math.max(imagePreviewState.scale / zoomFactor, minimumScale.value))

  zoomToScale(newScale)
}

function zoomToScale(newScale: number) {
  if (previewFailed.value || previewLoading.value) return
  manuallyZoomed = true
  const oldScale = imagePreviewState.scale
  imagePreviewState.scale = newScale

  const optimalScale = calculateOptimalScale()
  if (newScale <= optimalScale) {
    imagePreviewState.translateX = 0
    imagePreviewState.translateY = 0
  } else {
    const scaleDiff = newScale / oldScale
    imagePreviewState.translateX *= scaleDiff
    imagePreviewState.translateY *= scaleDiff
  }
}

function calculateOptimalScale(): number {
  const imageElement = previewImageRef.value
  if (!imageElement) {
    return 1
  }
  if (!imageElement.naturalWidth || !imageElement.naturalHeight) {
    return 1
  }
  const viewerElement = imageElement.parentElement
  if (!viewerElement) {
    return 1
  }

  const viewerRect = viewerElement.getBoundingClientRect()
  const viewerWidth = viewerRect.width
  const viewerHeight = viewerRect.height

  const imageWidth = imageElement.naturalWidth
  const imageHeight = imageElement.naturalHeight
  const scaleX = viewerWidth / imageWidth
  const scaleY = viewerHeight / imageHeight
  const optimalScale = Math.min(scaleX, scaleY, 1)

  return optimalScale
}

function navigateImage(direction: number) {
  const newIndex = gallerySliderControl.value.index + direction
  if (newIndex >= 0 && newIndex < filterList.length) {
    gallerySliderControl.value.index = newIndex
    resetImageTransform()
  }
}

function resetImageTransform() {
  manuallyZoomed = false
  const optimalScale = calculateOptimalScale()
  imagePreviewState.scale = optimalScale
  minimumScale.value = Math.min(0.1, optimalScale)
  imagePreviewState.translateX = 0
  imagePreviewState.translateY = 0
  imagePreviewState.isDragging = false
}

function handleKeydown(event: KeyboardEvent) {
  switch (event.key) {
    case 'ArrowLeft':
      event.preventDefault()
      navigateImage(-1)
      break
    case 'ArrowRight':
      event.preventDefault()
      navigateImage(1)
      break
    case 'Escape':
      event.preventDefault()
      handleClose()
      break
    case '=':
    case '+':
      event.preventDefault()
      zoomIn()
      break
    case '-':
      event.preventDefault()
      zoomOut()
      break
    case '0':
      event.preventDefault()
      resetImageTransform()
      break
  }
}

function zoomOut() {
  const newScale = Math.min(imagePreviewState.scale, Math.max(imagePreviewState.scale / 1.2, minimumScale.value))
  zoomToScale(newScale)
}

function zoomIn() {
  zoomToScale(Math.min(imagePreviewState.scale * 1.2, 5))
}

function handleClose() {
  gallerySliderControl.value.index = 0
  gallerySliderControl.value.visible = false
  resetImageTransform()
}

function handleImageMouseDown(event: MouseEvent) {
  const imageElement = previewImageRef.value
  let isImageLargerThanViewer = false

  if (imageElement && imageElement.naturalWidth && imageElement.naturalHeight) {
    const viewerElement = imageElement.parentElement
    if (viewerElement) {
      const viewerRect = viewerElement.getBoundingClientRect()
      const currentImageWidth = imageElement.naturalWidth * imagePreviewState.scale
      const currentImageHeight = imageElement.naturalHeight * imagePreviewState.scale
      isImageLargerThanViewer = currentImageWidth > viewerRect.width + 1 || currentImageHeight > viewerRect.height + 1
    }
  }

  if (!isImageLargerThanViewer) {
    imagePreviewState.isSwipeMode = true
    imagePreviewState.swipeStartX = event.clientX
  } else {
    imagePreviewState.isDragging = true
    imagePreviewState.startX = event.clientX
    imagePreviewState.startY = event.clientY
    imagePreviewState.startTranslateX = imagePreviewState.translateX
    imagePreviewState.startTranslateY = imagePreviewState.translateY
  }
  event.preventDefault()
}

function handleImageMouseMove(event: MouseEvent) {
  if (imagePreviewState.isDragging) {
    const deltaX = event.clientX - imagePreviewState.startX
    const deltaY = event.clientY - imagePreviewState.startY
    imagePreviewState.translateX = imagePreviewState.startTranslateX + deltaX
    imagePreviewState.translateY = imagePreviewState.startTranslateY + deltaY
  }
}

function handleImageMouseUp(event: MouseEvent) {
  if (imagePreviewState.isSwipeMode) {
    const deltaX = event.clientX - imagePreviewState.swipeStartX
    if (Math.abs(deltaX) > imagePreviewState.swipeThreshold) {
      if (deltaX > 0) {
        navigateImage(-1)
      } else {
        navigateImage(1)
      }
    }
    imagePreviewState.isSwipeMode = false
  }
  imagePreviewState.isDragging = false
}

function handleImageTouchStart(event: TouchEvent) {
  const touch = event.touches[0]
  const imageElement = previewImageRef.value
  let isImageLargerThanViewer = false

  if (imageElement && imageElement.naturalWidth && imageElement.naturalHeight) {
    const viewerElement = imageElement.parentElement
    if (viewerElement) {
      const viewerRect = viewerElement.getBoundingClientRect()
      const currentImageWidth = imageElement.naturalWidth * imagePreviewState.scale
      const currentImageHeight = imageElement.naturalHeight * imagePreviewState.scale
      isImageLargerThanViewer = currentImageWidth > viewerRect.width + 1 || currentImageHeight > viewerRect.height + 1
    }
  }

  if (!isImageLargerThanViewer) {
    imagePreviewState.isSwipeMode = true
    imagePreviewState.swipeStartX = touch.clientX
  } else {
    imagePreviewState.isDragging = true
    imagePreviewState.startX = touch.clientX
    imagePreviewState.startY = touch.clientY
    imagePreviewState.startTranslateX = imagePreviewState.translateX
    imagePreviewState.startTranslateY = imagePreviewState.translateY
  }
  event.preventDefault()
}

function handleImageTouchMove(event: TouchEvent) {
  if (imagePreviewState.isDragging) {
    const touch = event.touches[0]
    const deltaX = touch.clientX - imagePreviewState.startX
    const deltaY = touch.clientY - imagePreviewState.startY
    imagePreviewState.translateX = imagePreviewState.startTranslateX + deltaX
    imagePreviewState.translateY = imagePreviewState.startTranslateY + deltaY
  }
  event.preventDefault()
}

function handleImageTouchEnd(event: TouchEvent) {
  if (imagePreviewState.isSwipeMode && event.changedTouches.length > 0) {
    const touch = event.changedTouches[0]
    const deltaX = touch.clientX - imagePreviewState.swipeStartX
    if (Math.abs(deltaX) > imagePreviewState.swipeThreshold) {
      if (deltaX > 0) {
        navigateImage(-1)
      } else {
        navigateImage(1)
      }
    }
    imagePreviewState.isSwipeMode = false
  }
  imagePreviewState.isDragging = false
}

function onPreviewImageLoad() {
  previewLoading.value = false
  previewFailed.value = false
  nextTick(() => {
    resetImageTransform()
  })
}

function onPreviewImageError() {
  previewFailed.value = true
  previewLoading.value = false
}

function retryPreview() {
  previewFailed.value = false
  previewLoading.value = true
  previewAttempt.value++
}

const addCacheBustParam = (url: string | undefined) => withCacheBustParam(url, Date.now())

async function initConf() {
  try {
    const settingConfig = await getConfig<any>('settings')
    enableAdvancedAnimation.value = settingConfig?.enableAdvancedAnimation || false
  } catch {
    // Previewing remains usable if preferences are temporarily unavailable.
  }
}

onMounted(() => {
  initConf()
  resetImageTransform()
})
</script>
