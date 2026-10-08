<template>
  <button
    v-if="collapsed"
    v-tooltip="{ content: `${t('settings.theme.toggle')}: ${currentThemeOption.label}`, placement: 'right' }"
    type="button"
    :disabled="busy"
    :aria-busy="busy || undefined"
    :aria-label="`${t('settings.theme.toggle')}: ${currentThemeOption.label}`"
    class="flex size-10 cursor-pointer items-center justify-center rounded-md text-secondary transition-colors duration-fast ease-apple not-disabled:hover:bg-accent/10 not-disabled:hover:text-main focus-visible:focus-ring disabled:cursor-wait disabled:opacity-60"
    @click="toggleTheme"
  >
    <component :is="currentThemeOption.icon" :size="18" class="shrink-0" aria-hidden="true" />
  </button>
  <!-- Expanded: every theme is one click away, and the current one is visible at a glance. -->
  <div
    v-else
    ref="group"
    role="radiogroup"
    :aria-label="t('settings.theme.toggle')"
    :aria-busy="busy || undefined"
    class="flex h-10 w-full items-center gap-0.5 rounded-lg border border-border-secondary p-1"
    @keydown.left.prevent="moveSelection(-1)"
    @keydown.right.prevent="moveSelection(1)"
  >
    <button
      v-for="option in themeOptions"
      :key="option.value"
      v-tooltip="{ content: option.description, placement: 'top' }"
      type="button"
      role="radio"
      :aria-checked="option.value === currentTheme"
      :aria-label="option.label"
      :tabindex="option.value === currentTheme ? 0 : -1"
      class="flex h-full min-w-0 flex-1 cursor-pointer items-center justify-center rounded-md transition-[color,background-color,box-shadow] duration-fast ease-apple focus-visible:focus-ring"
      :class="
        option.value === currentTheme
          ? 'bg-bg-tertiary text-accent shadow-sm'
          : 'text-tertiary hover:bg-bg-tertiary/60 hover:text-main'
      "
      @click="setTheme(option.value)"
    >
      <component :is="option.icon" :size="16" class="shrink-0" aria-hidden="true" />
    </button>
  </div>
</template>

<script setup lang="ts">
import { Monitor, Moon, Sun } from '@lucide/vue'
import { useMediaQuery } from '@vueuse/core'
import { computed, onBeforeMount, onBeforeUnmount, ref, useTemplateRef, watch } from 'vue'
import { useI18n } from 'vue-i18n'

import useMessage from '@/composables/useMessage'
import { getConfig, saveConfig } from '@/services/configService'
import { configPaths } from '@/utils/configPaths'

defineProps<{
  collapsed?: boolean
}>()

const { t } = useI18n()
const message = useMessage()
const currentTheme = ref<'light' | 'dark' | 'system'>('system')
const busy = ref(true)
const group = useTemplateRef<HTMLElement>('group')
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
    value: 'light' as const,
    label: t('settings.theme.light'),
    icon: Sun,
    description: t('settings.theme.lightDesc'),
  },
  {
    value: 'dark' as const,
    label: t('settings.theme.dark'),
    icon: Moon,
    description: t('settings.theme.darkDesc'),
  },
  {
    value: 'system' as const,
    label: t('settings.theme.auto'),
    icon: Monitor,
    description: t('settings.theme.autoDesc'),
  },
])

const currentThemeOption = computed(
  () => themeOptions.value.find(option => option.value === currentTheme.value) || themeOptions.value[0],
)

const themes = ['light', 'dark', 'system'] as const

function toggleTheme() {
  setTheme(themes[(themes.indexOf(currentTheme.value) + 1) % themes.length])
}

async function moveSelection(step: number) {
  const index = (themes.indexOf(currentTheme.value) + step + themes.length) % themes.length
  await setTheme(themes[index])
  // Keep focus on the newly checked radio, as native radio groups do.
  ;(group.value?.children[index] as HTMLElement | undefined)?.focus()
}

async function setTheme(nextTheme: (typeof themes)[number]) {
  if (busy.value || isUnmounted || nextTheme === currentTheme.value) return
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
