<template>
  <div id="main" class="app-container">
    <InputBoxDialog />
    <TitleBar />
    <Navigation />
    <main class="main-content">
      <div class="content-container">
        <router-view v-slot="{ Component, route }">
          <transition name="page" mode="out-in">
            <keep-alive :include="keepAlivePages">
              <component :is="Component" :key="route.path" />
            </keep-alive>
          </transition>
        </router-view>
      </div>
    </main>
  </div>
</template>

<script lang="ts" setup>
import { useRouter } from 'vue-router'

import InputBoxDialog from '@/components/InputBoxDialog.vue'
import Navigation from '@/components/NavigationPage.vue'
import TitleBar from '@/components/ui/TitleBar.vue'

const $router = useRouter()
const keepAlivePages = $router
  .getRoutes()
  .filter(item => item.meta.keepAlive)
  .map(item => item.name as string)
</script>

<script lang="ts">
export default { name: 'MainPage' }
</script>

<style>
*,
*::before,
*::after {
  margin: 0;
  padding: 0;
  box-sizing: border-box;
}

:root {
  font-size: 14px;
  font-family: -apple-system, BlinkMacSystemFont, 'SF Pro Display', 'Helvetica Neue', Helvetica, Arial, sans-serif;
  font-weight: 400;
  line-height: 1.5;
  -webkit-font-smoothing: antialiased;
  -moz-osx-font-smoothing: grayscale;
  text-rendering: optimizelegibility;

  --background-image: none;
  --background-image-opacity: 1;
  --color-text-primary: #1d1d1f;
  --color-text-secondary: #6e6e73;
  --color-text-tertiary: #86868b;
  --color-background-primary: #ffffff;
  --color-background-secondary: #f5f5f7;
  --color-background-tertiary: #fbfbfd;
  --color-surface: rgb(255 255 255 / 80%);
  --color-surface-elevated: rgb(255 255 255 / 95%);
  --color-border: rgb(0 0 0 / 10%);
  --color-border-secondary: rgb(0 0 0 / 5%);
  --color-primary: #6366f1;
  --color-primary-hover: #4f46e5;
  --color-accent: #007aff;
  --color-accent-hover: #3b82f6;
  --color-success: #34c759;
  --color-warning: #f1930f;
  --color-danger: #ff3b30;
  --color-error: #cb2431;
  --shadow-sm: 0 1px 3px rgb(0 0 0 / 4%), 0 1px 2px rgb(0 0 0 / 6%);
  --shadow-md: 0 4px 6px rgb(0 0 0 / 5%), 0 2px 4px rgb(0 0 0 / 6%);
  --shadow-lg: 0 10px 15px rgb(0 0 0 / 8%), 0 4px 6px rgb(0 0 0 / 5%);
  --shadow-xl: 0 20px 25px rgb(0 0 0 / 10%), 0 10px 10px rgb(0 0 0 / 4%);
  --radius-sm: 6px;
  --radius-md: 8px;
  --radius-lg: 12px;
  --radius-xl: 16px;
  --radius-2xl: 20px;
  --transition-fast: 0.15s cubic-bezier(0.4, 0, 0.2, 1);
  --transition-medium: 0.25s cubic-bezier(0.4, 0, 0.2, 1);
  --transition-slow: 0.35s cubic-bezier(0.4, 0, 0.2, 1);
}

:root.dark {
  --color-text-primary: #f5f5f7;
  --color-text-secondary: #a1a1a6;
  --color-text-tertiary: #86868b;
  --color-background-primary: #000000;
  --color-background-secondary: #1c1c1e;
  --color-background-tertiary: #2c2c2e;
  --color-surface: rgb(28 28 30 / 80%);
  --color-surface-elevated: rgb(44 44 46 / 95%);
  --color-border: rgb(255 255 255 / 10%);
  --color-border-secondary: rgb(255 255 255 / 5%);
  --color-primary: #6366f1;
  --color-primary-hover: #818cf8;
  --color-accent: #0a84ff;
  --color-accent-hover: #409cff;
  --color-success: #34c759;
  --color-warning: #f1930f;
  --color-danger: #ff3b30;
  --color-error: #cb2431;
  --shadow-sm: 0 1px 3px rgb(0 0 0 / 4%), 0 1px 2px rgb(0 0 0 / 6%);
  --shadow-md: 0 4px 6px rgb(0 0 0 / 5%), 0 2px 4px rgb(0 0 0 / 6%);
  --shadow-lg: 0 10px 15px rgb(0 0 0 / 8%), 0 4px 6px rgb(0 0 0 / 5%);
  --shadow-xl: 0 20px 25px rgb(0 0 0 / 10%), 0 10px 10px rgb(0 0 0 / 4%);
  --radius-sm: 6px;
  --radius-md: 8px;
  --radius-lg: 12px;
  --radius-xl: 16px;
  --radius-2xl: 20px;
  --transition-fast: 0.15s cubic-bezier(0.4, 0, 0.2, 1);
  --transition-medium: 0.25s cubic-bezier(0.4, 0, 0.2, 1);
  --transition-slow: 0.35s cubic-bezier(0.4, 0, 0.2, 1);
}

body {
  overflow: hidden;
  font-family: inherit;
  color: var(--color-text-primary);
  background-color: var(--color-background-primary);
}

.app-container {
  position: relative;
  display: flex;
  overflow: hidden;
  padding-top: 32px;
  height: 100vh;
  background-color: var(--color-background-primary);
}

.main-content {
  position: relative;
  z-index: 1;
  overflow: scroll;
  height: 100vh;
  background-color: var(--color-background-secondary);
  flex: 1;
  scrollbar-width: none;
  -ms-overflow-style: none;
}

.main-content::-webkit-scrollbar {
  display: none;
}

.content-container {
  margin: 0;
  max-width: none;
  height: 100%;
}

::-webkit-scrollbar {
  width: 12px;
  height: 12px;
}

::-webkit-scrollbar-track {
  background: transparent;
}

::-webkit-scrollbar-thumb {
  border: 3px solid var(--color-background-primary);
  border-radius: 6px;
  background-color: var(--color-border);
  transition: background-color var(--transition-fast);
}

::-webkit-scrollbar-thumb:hover {
  background-color: var(--color-text-tertiary);
}

::-webkit-scrollbar-corner {
  background: var(--color-background-primary);
}

::selection {
  color: var(--color-text-primary);
  background-color: rgb(0 122 255 / 20%);
}

:focus {
  outline: none;
}

:focus-visible {
  outline: 2px solid var(--color-accent);
  outline-offset: 2px;
}

@media (prefers-reduced-motion: reduce) {
  *,
  *::before,
  *::after {
    animation-duration: 0.01ms !important;
    animation-iteration-count: 1 !important;
    transition-duration: 0.01ms !important;
  }
}
</style>
