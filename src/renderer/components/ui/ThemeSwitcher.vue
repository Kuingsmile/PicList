<script setup lang="ts">
import { Monitor, Moon, Sun } from '@lucide/vue'
import { useMediaQuery } from '@vueuse/core'
import { computed, onBeforeMount, onBeforeUnmount, ref, watch } from 'vue'
import { useI18n } from 'vue-i18n'

import useMessage from '@/composables/useMessage'
import { getConfig, saveConfig } from '@/services/configService'
import { configPaths } from '@/utils/configPaths'

interface Props {
  collapsed?: boolean
}

defineProps<Props>()

const { t } = useI18n()
const message = useMessage()
const currentTheme = ref<'light' | 'dark' | 'system'>('system')
const busy = ref(true)
const prefersDark = useMediaQuery('(prefers-color-scheme: dark)')
let isUnmounted = false

function applyTheme(theme: 'light' | 'dark' | 'system') {
  const resolvedTheme = theme === 'system' ? (prefersDark.value ? 'dark' : 'light') : theme
  document.documentElement.classList.remove('light', 'dark', 'system')
  document.documentElement.classList.add(resolvedTheme)
  document.documentElement.setAttribute('data-theme', resolvedTheme)
}

async function initializeTheme() {
  try {
    const savedTheme = await getConfig<string>(configPaths.settings.systemTheme)
    if (!isUnmounted) {
      currentTheme.value = savedTheme === 'light' || savedTheme === 'dark' ? savedTheme : 'system'
      applyTheme(currentTheme.value)
    }
  } catch {
    if (!isUnmounted) message.error(t('pages.settings.system.applyThemeFailed'))
  } finally {
    if (!isUnmounted) busy.value = false
  }
}

const themeOptions = computed(() => [
  {
    value: 'light',
    label: t('settings.theme.light'),
    icon: Sun,
    description: t('settings.theme.lightDesc'),
  },
  {
    value: 'dark',
    label: t('settings.theme.dark'),
    icon: Moon,
    description: t('settings.theme.darkDesc'),
  },
  {
    value: 'system',
    label: t('settings.theme.auto'),
    icon: Monitor,
    description: t('settings.theme.autoDesc'),
  },
])

const currentThemeOption = computed(
  () => themeOptions.value.find(option => option.value === currentTheme.value) || themeOptions.value[0],
)

async function toggleTheme() {
  if (busy.value || isUnmounted) return
  const themes = ['light', 'dark', 'system'] as const
  const currentIndex = themes.indexOf(currentTheme.value)
  const nextTheme = themes[(currentIndex + 1) % themes.length]
  busy.value = true
  try {
    if (!(await saveConfig({ [configPaths.settings.systemTheme]: nextTheme })) || isUnmounted) return
    currentTheme.value = nextTheme
    applyTheme(nextTheme)
  } catch {
    if (!isUnmounted) message.error(t('pages.settings.system.applyThemeFailed'))
  } finally {
    if (!isUnmounted) busy.value = false
  }
}

watch(prefersDark, () => {
  if (!isUnmounted && currentTheme.value === 'system') applyTheme('system')
})

onBeforeUnmount(() => {
  isUnmounted = true
})

onBeforeMount(() => {
  initializeTheme()
})
</script>

<template>
  <div class="relative flex items-center">
    <button
      type="button"
      :disabled="busy"
      :aria-busy="busy || undefined"
      :aria-label="`${t('settings.theme.toggle')}: ${currentThemeOption.label}`"
      class="flex cursor-pointer items-center gap-2 rounded-md border border-border-secondary bg-bg-secondary px-3 py-2 text-sm text-secondary transition-all duration-fast ease-standard not-disabled:hover:bg-accent/30 not-disabled:hover:text-main disabled:cursor-wait disabled:opacity-60 max-md:justify-center max-md:gap-0 max-md:p-2 [.collapsed]:justify-center [.collapsed]:gap-0 [.collapsed]:p-2"
      :class="{ collapsed }"
      :title="t('settings.theme.toggle')"
      @click="toggleTheme"
    >
      <component :is="currentThemeOption.icon" :size="18" aria-hidden="true" />
      <span v-if="!collapsed" class="font-medium max-md:hidden">{{ currentThemeOption.label }}</span>
    </button>
  </div>
</template>
