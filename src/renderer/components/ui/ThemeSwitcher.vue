<script setup lang="ts">
import { Monitor, Moon, Sun } from 'lucide-vue-next'
import { computed } from 'vue'
import { useI18n } from 'vue-i18n'

import { useAppStore } from '@/hooks/appStore'

const { t } = useI18n()
const appStore = useAppStore()

const currentTheme = computed(() => appStore.settings.app.theme || 'light')

const themeOptions = computed(() => [
  {
    value: 'light',
    label: t('settings.theme.light'),
    icon: Sun,
    description: t('settings.theme.lightDesc')
  },
  {
    value: 'dark',
    label: t('settings.theme.dark'),
    icon: Moon,
    description: t('settings.theme.darkDesc')
  },
  {
    value: 'auto',
    label: t('settings.theme.auto'),
    icon: Monitor,
    description: t('settings.theme.autoDesc')
  }
])

const currentThemeOption = computed(
  () => themeOptions.value.find(option => option.value === currentTheme.value) || themeOptions.value[0]
)

const toggleTheme = () => {
  appStore.toggleTheme()
}
</script>

<template>
  <div class="theme-switcher">
    <button
      class="theme-toggle-btn"
      :title="t('settings.theme.toggle')"
      @click="toggleTheme"
    >
      <component
        :is="currentThemeOption.icon"
        :size="18"
      />
      <span class="theme-label">{{ currentThemeOption.label }}</span>
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
  gap: 0.5rem;
  padding: 0.5rem 0.75rem;
  border: 1px solid var(--color-border);
  background: rgba(255, 255, 255, 0.1);
  color: var(--color-text-secondary);
  border-radius: var(--radius-md);
  cursor: pointer;
  font-size: 0.875rem;
}

.theme-toggle-btn:hover {
  background: var(--color-surface-elevated);
  color: var(--color-text-primary);
}

.theme-label {
  font-weight: 500;
}

/* Mobile responsive */
@media (max-width: 768px) {
  .theme-label {
    display: none;
  }
}
</style>
