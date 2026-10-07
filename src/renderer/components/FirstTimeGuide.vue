<template>
  <TransitionRoot appear :show="isVisible" as="template">
    <div class="pointer-events-auto fixed inset-0 z-9999">
      <div class="absolute inset-0 bg-black/15 transition-all duration-300 ease-apple" @click="handleClose" />

      <div
        v-if="spotlightRect"
        class="pointer-events-none absolute z-10000 rounded-xl border-2 border-dashed border-accent shadow-sm transition-all duration-300 ease-apple"
        :style="spotlightStyle"
      />

      <!-- Guide Card -->
      <div
        class="absolute z-10001 max-h-[80vh] w-[420px] max-w-[90vw] overflow-auto rounded-lg border border-border bg-bg-tertiary shadow-2xl transition-all duration-300 ease-apple max-sm:w-[calc(100vw-32px)]"
        :style="cardStyle"
      >
        <div class="flex items-center justify-between border-b border-b-border px-4 py-3">
          <div class="flex flex-col gap-0.5">
            <h3 class="m-0 text-[16px] font-semibold text-main">{{ t('guide.title') }}</h3>
            <span class="text-sm text-tertiary">
              {{ t('guide.stepIndicator', { current: currentStep + 1, total: steps.length }) }}
            </span>
          </div>
          <button
            v-tooltip="t('guide.close')"
            class="flex cursor-pointer items-center justify-center rounded-sm border-none bg-transparent p-[4px] text-secondary transition-all duration-200 ease-apple hover:bg-accent-hover hover:text-main"
            :aria-label="t('guide.close')"
            @click="handleClose"
          >
            <XIcon :size="20" />
          </button>
        </div>

        <div class="flex items-start gap-4 px-5 py-4">
          <div class="flex h-[40px] w-[40px] shrink-0 items-center justify-center rounded-lg bg-accent text-white">
            <component :is="currentStepConfig.icon" :size="24" />
          </div>
          <div class="min-w-0 flex-1">
            <h4 class="mb-1 text-base font-semibold text-main">{{ t(currentStepConfig.title) }}</h4>
            <p class="m-0 text-sm leading-[1.5] text-secondary">{{ t(currentStepConfig.description) }}</p>
          </div>
        </div>

        <div class="border-t border-t-border p-3">
          <div class="mb-2.5 flex justify-center gap-1.5">
            <div
              v-for="(_, index) in steps"
              :key="index"
              class="h-[6px] w-[6px] rounded-full bg-border transition-all duration-300 ease-apple [.active]:w-5 [.active]:rounded-xs [.active]:bg-accent [.completed]:bg-success"
              :class="{ active: index === currentStep, completed: index < currentStep }"
            />
          </div>

          <div class="flex justify-end gap-1.5">
            <CustomButton
              v-if="currentStep > 0"
              type="secondary"
              :icon="ChevronLeftIcon"
              :text="t('guide.previous')"
              :disabled="isNavigating"
              class="p-2!"
              @click="handlePrevious"
            />
            <CustomButton class="p-2!" type="secondary" :text="t('guide.skip')" @click="handleSkip" />
            <CustomButton
              v-if="currentStep < steps.length - 1"
              class="p-2!"
              :icon="ChevronRightIcon"
              :text="t('guide.next')"
              :disabled="isNavigating"
              @click="handleNext"
            />
            <CustomButton v-else class="p-2!" :icon="CheckCircleIcon" :text="t('guide.finish')" @click="handleFinish" />
          </div>
        </div>
      </div>
    </div>
  </TransitionRoot>
</template>

<script setup lang="ts">
import { TransitionRoot } from '@headlessui/vue'
import {
  ArrowLeftRightIcon,
  CheckCircleIcon,
  ChevronLeftIcon,
  ChevronRightIcon,
  HelpCircleIcon,
  ImageIcon,
  PaletteIcon,
  UploadCloudIcon,
  XIcon,
} from '@lucide/vue'
import { useStorage } from '@vueuse/core'
import { computed, nextTick, onBeforeUnmount, onMounted, ref, watch } from 'vue'
import { useI18n } from 'vue-i18n'
import { isNavigationFailure, NavigationFailureType, useRoute, useRouter } from 'vue-router'

import CustomButton from '@/components/common/CustomButton.vue'

const { t } = useI18n()
const route = useRoute()
const router = useRouter()

const hasSeenGuide = useStorage('has-seen-first-time-guide', false)
const settingsTab = useStorage('settings-current-tab', 'system')
const isVisible = ref(false)
const isNavigating = ref(false)
const currentStep = ref(0)
const spotlightRect = ref<DOMRect | null>(null)
let isUnmounted = false
let navigationId = 0
let showGuideTimer: ReturnType<typeof setTimeout> | undefined
let spotlightObserver: MutationObserver | undefined
let spotlightTarget: Element | null = null

interface GuideStep {
  id: string
  title: string
  description: string
  route: string
  additionalInfo?: string[]
  target?: string
  position?: 'top' | 'bottom' | 'left' | 'right' | 'center'
  icon: any
  action?: () => void
}

const steps: GuideStep[] = [
  {
    id: 'welcome',
    title: 'guide.steps.welcome.title',
    description: 'guide.steps.welcome.description',
    route: '/main-page/upload',
    position: 'center',
    icon: HelpCircleIcon,
  },
  {
    id: 'upload',
    title: 'guide.steps.upload.title',
    description: 'guide.steps.upload.description',
    route: '/main-page/upload',
    target: '#upload-area',
    position: 'bottom',
    icon: UploadCloudIcon,
  },
  {
    id: 'picbed',
    title: 'guide.steps.picbed.title',
    description: 'guide.steps.picbed.description',
    route: '/main-page/upload',
    target: '.provider-button',
    position: 'bottom',
    icon: ArrowLeftRightIcon,
  },
  {
    id: 'theme',
    title: 'guide.steps.theme.title',
    description: 'guide.steps.theme.description',
    route: '/main-page/upload',
    target: '.theme-switcher',
    position: 'right',
    icon: PaletteIcon,
  },
  {
    id: 'themeSelection',
    title: 'guide.steps.themeSelection.title',
    description: 'guide.steps.themeSelection.description',
    route: '/main-page/settings',
    target: '.theme-dropdown',
    position: 'bottom',
    icon: PaletteIcon,
    action: () => {
      settingsTab.value = 'system'
    },
  },
  {
    id: 'gallery',
    title: 'guide.steps.gallery.title',
    description: 'guide.steps.gallery.description',
    route: '/main-page/gallery',
    target: 'nav [data-nav="gallery"]',
    position: 'right',
    icon: ImageIcon,
  },
  {
    id: 'finish',
    title: 'guide.steps.finish.title',
    description: 'guide.steps.finish.description',
    route: '/main-page/gallery',
    position: 'center',
    icon: CheckCircleIcon,
  },
]

const currentStepConfig = computed(() => steps[currentStep.value])

const updateSpotlight = () => {
  if (isUnmounted || !isVisible.value || isNavigating.value) return
  const target = currentStepConfig.value.target
  if (!target || route.path !== currentStepConfig.value.route) {
    spotlightRect.value = null
    spotlightTarget = null
    return
  }

  const element = document.querySelector(target)
  if (element) {
    if (element !== spotlightTarget) {
      spotlightTarget = element
      element.scrollIntoView({ behavior: 'instant', block: 'center', inline: 'nearest' })
    }
    spotlightRect.value = element.getBoundingClientRect()
  } else {
    spotlightRect.value = null
    spotlightTarget = null
  }
}

const spotlightStyle = computed(() => {
  if (!spotlightRect.value) return {}

  const padding = 8
  return {
    top: `${spotlightRect.value.top - padding}px`,
    left: `${spotlightRect.value.left - padding}px`,
    width: `${spotlightRect.value.width + padding * 2}px`,
    height: `${spotlightRect.value.height + padding * 2}px`,
  }
})

const cardStyle = computed(() => {
  if (!spotlightRect.value || currentStepConfig.value.position === 'center') {
    return {
      top: '50%',
      left: '50%',
      transform: 'translate(-50%, -50%)',
    }
  }

  const rect = spotlightRect.value
  const position = currentStepConfig.value.position || 'bottom'
  const offset = 16
  const cardWidth = 420
  const estimatedCardHeight = 260
  const padding = 12

  const style: Record<string, string> = {}

  const centerX = rect.left + rect.width / 2
  const halfCardWidth = cardWidth / 2

  let adjustedCenterX = centerX
  if (centerX - halfCardWidth < padding) {
    adjustedCenterX = halfCardWidth + padding
  } else if (centerX + halfCardWidth > window.innerWidth - padding) {
    adjustedCenterX = window.innerWidth - halfCardWidth - padding
  }

  if (position === 'bottom') {
    const spaceBelow = window.innerHeight - rect.bottom - offset - padding
    const spaceAbove = rect.top - offset - padding

    if (spaceBelow >= estimatedCardHeight || spaceBelow > spaceAbove) {
      style.top = `${rect.bottom + offset}px`
      style.left = `${adjustedCenterX}px`
      style.transform = 'translateX(-50%)'
    } else {
      style.bottom = `${window.innerHeight - rect.top + offset}px`
      style.left = `${adjustedCenterX}px`
      style.transform = 'translateX(-50%)'
    }
  } else if (position === 'top') {
    const spaceAbove = rect.top - offset - padding
    const spaceBelow = window.innerHeight - rect.bottom - offset - padding

    if (spaceAbove >= estimatedCardHeight || spaceAbove > spaceBelow) {
      style.bottom = `${window.innerHeight - rect.top + offset}px`
      style.left = `${adjustedCenterX}px`
      style.transform = 'translateX(-50%)'
    } else {
      style.top = `${rect.bottom + offset}px`
      style.left = `${adjustedCenterX}px`
      style.transform = 'translateX(-50%)'
    }
  } else if (position === 'right') {
    const spaceRight = window.innerWidth - rect.right - offset - padding
    const spaceLeft = rect.left - offset - padding

    const centerY = rect.top + rect.height / 2
    const adjustedCenterY = Math.max(
      estimatedCardHeight / 2 + padding,
      Math.min(centerY, window.innerHeight - estimatedCardHeight / 2 - padding),
    )

    if (spaceRight >= cardWidth || spaceRight > spaceLeft) {
      style.left = `${rect.right + offset}px`
      style.top = `${adjustedCenterY}px`
      style.transform = 'translateY(-50%)'
    } else {
      style.right = `${window.innerWidth - rect.left + offset}px`
      style.top = `${adjustedCenterY}px`
      style.transform = 'translateY(-50%)'
    }
  } else if (position === 'left') {
    const spaceLeft = rect.left - offset - padding
    const spaceRight = window.innerWidth - rect.right - offset - padding

    const centerY = rect.top + rect.height / 2
    const adjustedCenterY = Math.max(
      estimatedCardHeight / 2 + padding,
      Math.min(centerY, window.innerHeight - estimatedCardHeight / 2 - padding),
    )

    if (spaceLeft >= cardWidth || spaceLeft > spaceRight) {
      style.right = `${window.innerWidth - rect.left + offset}px`
      style.top = `${adjustedCenterY}px`
      style.transform = 'translateY(-50%)'
    } else {
      style.left = `${rect.right + offset}px`
      style.top = `${adjustedCenterY}px`
      style.transform = 'translateY(-50%)'
    }
  }

  return style
})

watch(
  isVisible,
  visible => {
    if (visible) {
      // Route transitions can mount the target after router.push() and nextTick().
      spotlightObserver?.observe(document.body, {
        childList: true,
        subtree: true,
        attributes: true,
        attributeFilter: ['class'],
      })
    } else {
      navigationId++
      isNavigating.value = false
      spotlightObserver?.disconnect()
      spotlightRect.value = null
      spotlightTarget = null
    }
  },
  { flush: 'sync' },
)

watch(
  () => route.path,
  () => {
    if (isVisible.value) {
      updateSpotlight()
    }
  },
  { flush: 'post' },
)

const goToStep = async (index: number) => {
  const id = ++navigationId
  const step = steps[index]
  isNavigating.value = true
  spotlightRect.value = null
  spotlightTarget = null

  try {
    step.action?.()
    const failure = await router.push(step.route)
    if (
      isUnmounted ||
      id !== navigationId ||
      (failure && !isNavigationFailure(failure, NavigationFailureType.duplicated))
    ) {
      return
    }

    currentStep.value = index
    await nextTick()
  } finally {
    if (!isUnmounted && id === navigationId) {
      isNavigating.value = false
      updateSpotlight()
    }
  }
}

const handleNext = () => {
  if (!isNavigating.value && currentStep.value < steps.length - 1) {
    return goToStep(currentStep.value + 1)
  }
}

const handlePrevious = () => {
  if (!isNavigating.value && currentStep.value > 0) {
    return goToStep(currentStep.value - 1)
  }
}

const handleSkip = () => {
  isVisible.value = false
  hasSeenGuide.value = true
}

const handleClose = () => {
  isVisible.value = false
  hasSeenGuide.value = true
}

const handleFinish = () => {
  isVisible.value = false
  hasSeenGuide.value = true
}

const restartGuide = () => {
  clearTimeout(showGuideTimer)
  currentStep.value = 0
  isVisible.value = true
  return goToStep(0)
}

defineExpose({
  restartGuide,
})

onMounted(() => {
  spotlightObserver = new MutationObserver(updateSpotlight)
  if (!hasSeenGuide.value) {
    showGuideTimer = setTimeout(() => {
      showGuideTimer = undefined
      restartGuide()
    }, 500)
  }

  window.addEventListener('resize', updateSpotlight)
  window.addEventListener('scroll', updateSpotlight, true)
})

onBeforeUnmount(() => {
  isUnmounted = true
  navigationId++
  window.removeEventListener('resize', updateSpotlight)
  window.removeEventListener('scroll', updateSpotlight, true)
  spotlightObserver?.disconnect()
  clearTimeout(showGuideTimer)
})
</script>
