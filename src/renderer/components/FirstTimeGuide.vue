<template>
  <TransitionRoot appear :show="isVisible" as="template">
    <div class="guide-overlay">
      <div class="guide-backdrop" @click="handleClose" />

      <div v-if="currentStepConfig.target" class="guide-spotlight" :style="spotlightStyle" />

      <!-- Guide Card -->
      <div class="guide-card" :style="cardStyle">
        <div class="guide-header">
          <div class="guide-header-left">
            <h3 class="guide-title">{{ t('guide.title') }}</h3>
            <span class="guide-step-indicator">
              {{ t('guide.stepIndicator', { current: currentStep + 1, total: steps.length }) }}
            </span>
          </div>
          <button class="guide-close" :title="t('guide.close')" @click="handleClose">
            <XIcon :size="20" />
          </button>
        </div>

        <div class="guide-content">
          <div class="guide-icon">
            <component :is="currentStepConfig.icon" :size="24" />
          </div>
          <div class="guide-text">
            <h4 class="guide-content-title">{{ t(currentStepConfig.title) }}</h4>
            <p class="guide-content-description">{{ t(currentStepConfig.description) }}</p>
          </div>
        </div>

        <div class="guide-footer">
          <div class="guide-progress">
            <div
              v-for="(_, index) in steps"
              :key="index"
              class="progress-dot"
              :class="{ active: index === currentStep, completed: index < currentStep }"
            />
          </div>

          <div class="guide-actions">
            <button v-if="currentStep > 0" class="guide-btn secondary" @click="handlePrevious">
              <ChevronLeftIcon :size="16" />
              {{ t('guide.previous') }}
            </button>
            <button class="guide-btn outline" @click="handleSkip">
              {{ t('guide.skip') }}
            </button>
            <button v-if="currentStep < steps.length - 1" class="guide-btn primary" @click="handleNext">
              {{ t('guide.next') }}
              <ChevronRightIcon :size="16" />
            </button>
            <button v-else class="guide-btn success" @click="handleFinish">
              <CheckCircleIcon :size="16" />
              {{ t('guide.finish') }}
            </button>
          </div>
        </div>
      </div>
    </div>
  </TransitionRoot>
</template>

<script setup lang="ts">
import { TransitionRoot } from '@headlessui/vue'
import { useStorage } from '@vueuse/core'
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
} from 'lucide-vue-next'
import { computed, nextTick, onMounted, ref, watch } from 'vue'
import { useI18n } from 'vue-i18n'
import { useRoute, useRouter } from 'vue-router'

const { t } = useI18n()
const route = useRoute()
const router = useRouter()

const hasSeenGuide = useStorage('has-seen-first-time-guide', false)
const isVisible = ref(false)
const currentStep = ref(0)
const spotlightRect = ref<DOMRect | null>(null)

interface GuideStep {
  id: string
  title: string
  description: string
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
    position: 'center',
    icon: HelpCircleIcon,
  },
  {
    id: 'upload',
    title: 'guide.steps.upload.title',
    description: 'guide.steps.upload.description',
    target: '#upload-area',
    position: 'bottom',
    icon: UploadCloudIcon,
  },
  {
    id: 'picbed',
    title: 'guide.steps.picbed.title',
    description: 'guide.steps.picbed.description',
    target: '.provider-button',
    position: 'bottom',
    icon: ArrowLeftRightIcon,
  },
  {
    id: 'theme',
    title: 'guide.steps.theme.title',
    description: 'guide.steps.theme.description',
    target: '.theme-switcher',
    position: 'right',
    icon: PaletteIcon,
  },
  {
    id: 'themeSelection',
    title: 'guide.steps.themeSelection.title',
    description: 'guide.steps.themeSelection.description',
    target: '.theme-dropdown',
    position: 'bottom',
    icon: PaletteIcon,
  },
  {
    id: 'gallery',
    title: 'guide.steps.gallery.title',
    description: 'guide.steps.gallery.description',
    target: 'nav .nav-item:nth-child(3)',
    position: 'right',
    icon: ImageIcon,
  },
  {
    id: 'finish',
    title: 'guide.steps.finish.title',
    description: 'guide.steps.finish.description',
    position: 'center',
    icon: CheckCircleIcon,
  },
]

const currentStepConfig = computed(() => steps[currentStep.value])

const updateSpotlight = async () => {
  await nextTick()
  const target = currentStepConfig.value.target
  if (!target) {
    spotlightRect.value = null
    return
  }

  const element = document.querySelector(target)
  if (element) {
    spotlightRect.value = element.getBoundingClientRect()
  } else {
    spotlightRect.value = null
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

watch(currentStep, () => {
  updateSpotlight()
})

watch(
  () => route.path,
  () => {
    if (isVisible.value) {
      updateSpotlight()
    }
  },
)

const handleNext = async () => {
  if (currentStep.value < steps.length - 1) {
    currentStep.value++

    if (currentStep.value === 4) {
      await router.push('/main-page/settings')
      await new Promise(resolve => setTimeout(resolve, 400))
      await updateSpotlight()
    }
  }
}

const handlePrevious = () => {
  if (currentStep.value > 0) {
    currentStep.value--
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
  currentStep.value = 0
  isVisible.value = true
}

defineExpose({
  restartGuide,
})

onMounted(async () => {
  if (!hasSeenGuide.value) {
    setTimeout(() => {
      isVisible.value = true
      updateSpotlight()
    }, 500)
  }

  window.addEventListener('resize', updateSpotlight)
})
</script>

<style scoped src="./css/FirstTimeGuide.css"></style>
