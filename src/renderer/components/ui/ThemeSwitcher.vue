<script setup lang="ts">
import { useStorage } from '@vueuse/core'
import { Monitor, Moon, Sun } from 'lucide-vue-next'
import { computed, onBeforeMount, onBeforeUnmount, watch } from 'vue'
import { useI18n } from 'vue-i18n'

interface Props {
  collapsed?: boolean
}

defineProps<Props>()

const { t } = useI18n()
const currentTheme = useStorage<'light' | 'dark' | 'system'>('systemTheme', 'system')

watch(
  currentTheme,
  async newTheme => {
    document.documentElement.setAttribute('data-theme', newTheme)
    document.documentElement.classList.remove('light', 'dark', 'system')
    if (newTheme === 'system') {
      const systemTheme = (await window.electron.triggerRPC<'light' | 'dark'>('GET_SYSTEM_THEME')) || 'light'
      document.documentElement.classList.add(systemTheme)
    } else {
      document.documentElement.classList.add(newTheme)
    }
  },
  { immediate: true },
)

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

function toggleTheme() {
  const themes = ['light', 'dark', 'system'] as const
  const currentIndex = themes.indexOf(currentTheme.value)
  const nextTheme = themes[(currentIndex + 1) % themes.length]
  currentTheme.value = nextTheme
}

let listenThemeChange: () => void = () => {}
const themUpdateHandler = (value: 'light' | 'dark') => {
  const savedTheme = localStorage.getItem('systemTheme') || 'system'
  if (savedTheme === 'system') {
    currentTheme.value = value
  }
}
onBeforeMount(() => {
  listenThemeChange = window.electron.ipcRendererOn('theme-update', themUpdateHandler)
})

onBeforeUnmount(() => {
  listenThemeChange()
})
</script>

<template>
  <div class="theme-switcher">
    <button class="theme-toggle-btn" :class="{ collapsed }" :title="t('settings.theme.toggle')" @click="toggleTheme">
      <component :is="currentThemeOption.icon" :size="18" />
      <span v-if="!collapsed" class="theme-label">{{ currentThemeOption.label }}</span>
    </button>
  </div>
</template>

<style scoped>
.theme-switcher {
  position: relative;
  display: flex;
  align-items: center;
}

.theme-toggle-btn {
  display: flex;
  align-items: center;
  border: 1px solid var(--color-border);
  border-radius: var(--radius-md);
  padding: 0.5rem 0.75rem;
  font-size: 0.875rem;
  color: var(--color-text-secondary);
  background: var(--color-background-secondary);
  transition: all 0.2s ease;
  gap: 0.5rem;
  cursor: pointer;
}

.theme-toggle-btn.collapsed {
  justify-content: center;
  padding: 0.5rem;
  gap: 0;
}

.theme-toggle-btn:hover {
  color: var(--color-text-primary);
}

.theme-label {
  font-weight: 500;
}

/* Mobile responsive */
@media (width <= 768px) {
  .theme-label {
    display: none;
  }

  .theme-toggle-btn {
    justify-content: center;
    padding: 0.5rem;
    gap: 0;
  }
}
</style>
