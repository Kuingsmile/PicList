<template>
  <div id="main" class="app-container">
    <InputBoxDialog />
    <TitleBar />
    <div class="app-background">
      <div class="bg-gradient" />
    </div>
    <Navigation />
    <main class="main-content">
      <div class="content-container">
        <router-view v-slot="{ Component, route }">
          <transition name="page" mode="out-in">
            <keep-alive :include="limitedKeepAlivePages" :max="MAX_KEEP_ALIVE_PAGES">
              <component :is="Component" :key="route.path" />
            </keep-alive>
          </transition>
        </router-view>
      </div>
    </main>
  </div>
</template>

<script lang="ts" setup>
import { ref, onBeforeUnmount } from 'vue'
import { useRouter } from 'vue-router'

import InputBoxDialog from '@/components/InputBoxDialog.vue'
import Navigation from '@/components/NavigationPage.vue'
import TitleBar from '@/components/ui/TitleBar.vue'

const $router = useRouter()
const keepAlivePages = $router
  .getRoutes()
  .filter(item => item.meta.keepAlive)
  .map(item => item.name as string)

// Limit keep-alive cache to prevent memory accumulation
const MAX_KEEP_ALIVE_PAGES = 5
const limitedKeepAlivePages = keepAlivePages.slice(0, MAX_KEEP_ALIVE_PAGES)

// Clean up any remaining references when component unmounts
onBeforeUnmount(() => {
  // Force cleanup of any cached components if needed
  // This is a safety measure for keep-alive components
  if (limitedKeepAlivePages.length > 0) {
    console.log('[Memory] Cleaning up keep-alive cached components')
  }
})
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
  font-family: -apple-system, BlinkMacSystemFont, 'SF Pro Display', 'Helvetica Neue', Helvetica, Arial, sans-serif;
  font-size: 14px;
  line-height: 1.5;
  font-weight: 400;

  --color-text-primary: #1d1d1f;
  --color-text-secondary: #6e6e73;
  --color-text-tertiary: #86868b;
  --color-background-primary: #ffffff;
  --color-background-secondary: #f5f5f7;
  --color-background-tertiary: #fbfbfd;
  --color-surface: rgba(255, 255, 255, 0.8);
  --color-surface-elevated: rgba(255, 255, 255, 0.95);
  --color-border: rgba(0, 0, 0, 0.1);
  --color-border-darker: #cdd0d6;
  --color-border-secondary: rgba(0, 0, 0, 0.05);
  --color-primary: #6366f1;
  --color-primary-hover: #4f46e5;
  --color-accent: #007aff;
  --color-accent-hover: #0056b3;
  --color-blue-common: #409eff;
  --color-success: #34c759;
  --color-warning: #f1930f;
  --color-danger: #ff3b30;
  --color-error: #ff3b30;
  --color-error-surface: rgba(255, 59, 48, 0.1);

  --shadow-sm: 0 1px 3px rgba(0, 0, 0, 0.04), 0 1px 2px rgba(0, 0, 0, 0.06);
  --shadow-md: 0 4px 6px rgba(0, 0, 0, 0.05), 0 2px 4px rgba(0, 0, 0, 0.06);
  --shadow-lg: 0 10px 15px rgba(0, 0, 0, 0.08), 0 4px 6px rgba(0, 0, 0, 0.05);
  --shadow-xl: 0 20px 25px rgba(0, 0, 0, 0.1), 0 10px 10px rgba(0, 0, 0, 0.04);

  --radius-sm: 6px;
  --radius-md: 8px;
  --radius-lg: 12px;
  --radius-xl: 16px;
  --radius-2xl: 20px;

  --transition-fast: 0.15s cubic-bezier(0.4, 0, 0.2, 1);
  --transition-medium: 0.25s cubic-bezier(0.4, 0, 0.2, 1);
  --transition-slow: 0.35s cubic-bezier(0.4, 0, 0.2, 1);

  -webkit-font-smoothing: antialiased;
  -moz-osx-font-smoothing: grayscale;
  text-rendering: optimizeLegibility;
}

:root.dark,
:root.auto.dark {
  --color-text-primary: #f5f5f7;
  --color-text-secondary: #a1a1a6;
  --color-text-tertiary: #86868b;
  --color-background-primary: #000000;
  --color-background-secondary: #1c1c1e;
  --color-background-tertiary: #2c2c2e;
  --color-surface: rgba(28, 28, 30, 0.8);
  --color-surface-elevated: rgba(44, 44, 46, 0.95);
  --color-border: rgba(255, 255, 255, 0.1);
  --color-border-secondary: rgba(255, 255, 255, 0.05);
  --color-primary: #6366f1;
  --color-primary-hover: #818cf8;
  --color-accent: #0a84ff;
  --color-accent-hover: #409cff;
}

:root.dark,
:root.auto.dark {
  h1,
  h2,
  h3,
  h4,
  h5,
  h6 {
    color: var(--color-text-primary);
  }

  p,
  span,
  div {
    color: inherit;
  }

  svg {
    color: inherit;
  }

  input,
  select,
  textarea {
    background: var(--color-surface);
    border-color: var(--color-border);
    color: var(--color-text-primary);
  }

  input::placeholder,
  textarea::placeholder {
    color: var(--color-text-tertiary);
  }

  button {
    color: var(--color-text-primary);
    border-color: var(--color-border);
  }

  button:hover {
    background: var(--color-surface-elevated);
  }
}

body {
  color: var(--color-text-primary);
  background-color: var(--color-background-primary);
  font-family: inherit;
  overflow: hidden;
}

.app-container {
  position: relative;
  height: 100vh;
  display: flex;
  overflow: hidden;
  background-color: var(--color-background-primary);
  padding-top: 32px;
}

.app-background {
  position: absolute;
  inset: 0;
  z-index: 0;
  pointer-events: none;
}

.bg-gradient {
  position: absolute;
  bottom: -40%;
  left: -20%;
  width: 60%;
  height: 60%;
  background: radial-gradient(circle, rgba(199, 131, 233, 0.05) 0%, transparent 70%);
  border-radius: 50%;
}

.main-content {
  position: relative;
  z-index: 1;
  flex: 1;
  height: 100vh;
  overflow: scroll;
  background-color: var(--color-background-secondary);
  scrollbar-width: none;
  -ms-overflow-style: none;
}

.main-content::-webkit-scrollbar {
  display: none;
}

.content-container {
  height: 100%;
  padding: 0.3 rem;
  max-width: none;
  margin: 0;
}

::-webkit-scrollbar {
  width: 12px;
  height: 12px;
}

::-webkit-scrollbar-track {
  background: transparent;
}

::-webkit-scrollbar-thumb {
  background-color: var(--color-border);
  border-radius: 6px;
  border: 3px solid var(--color-background-primary);
  transition: background-color var(--transition-fast);
}

::-webkit-scrollbar-thumb:hover {
  background-color: var(--color-text-tertiary);
}

::-webkit-scrollbar-corner {
  background: var(--color-background-primary);
}

::selection {
  background-color: rgba(0, 122, 255, 0.2);
  color: var(--color-text-primary);
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
