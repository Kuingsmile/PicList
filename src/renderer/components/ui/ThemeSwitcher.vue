<script setup lang="ts">
import { Monitor, Moon, Sun } from 'lucide-vue-next'
import { computed, onBeforeMount, ref } from 'vue'
import { useI18n } from 'vue-i18n'

import { configPaths } from '@/utils/configPaths'
import { getConfig, saveConfig } from '@/utils/dataSender'

interface Props {
  collapsed?: boolean
}

defineProps<Props>()

const { t } = useI18n()
const currentTheme = ref<'light' | 'dark' | 'system'>('light')

async function initializeTheme() {
  const savedTheme = (await getConfig<'light' | 'dark' | 'system'>(configPaths.settings.systemTheme)) || 'system'
  currentTheme.value = savedTheme
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
  const themes = ['light', 'dark', 'system'] as const
  const currentIndex = themes.indexOf(currentTheme.value)
  const nextTheme = themes[(currentIndex + 1) % themes.length]
  currentTheme.value = nextTheme
  document.documentElement.classList.remove('light', 'dark', 'system')
  if (nextTheme === 'system') {
    const systemTheme = (await window.electron.triggerRPC<'light' | 'dark'>('GET_SYSTEM_THEME')) || 'light'
    document.documentElement.classList.add(systemTheme)
    document.documentElement.setAttribute('data-theme', systemTheme)
  } else {
    document.documentElement.classList.add(nextTheme)
    document.documentElement.setAttribute('data-theme', nextTheme)
  }
  saveConfig({ [configPaths.settings.systemTheme]: nextTheme })
}

onBeforeMount(() => {
  initializeTheme()
})
</script>

<template>
  <div class="relative flex items-center">
    <button
      class="flex cursor-pointer items-center gap-2 rounded-md border border-border-secondary bg-bg-secondary px-3 py-2 text-sm text-secondary transition-all duration-fast ease-standard hover:text-main max-md:justify-center max-md:gap-0 max-md:p-2 [.collapsed]:justify-center [.collapsed]:gap-0 [.collapsed]:p-2"
      :class="{ collapsed }"
      :title="t('settings.theme.toggle')"
      @click="toggleTheme"
    >
      <component :is="currentThemeOption.icon" :size="18" />
      <span v-if="!collapsed" class="font-medium max-md:hidden">{{ currentThemeOption.label }}</span>
    </button>
  </div>
</template>
