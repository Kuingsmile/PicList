<template>
  <div id="main" class="relative flex h-screen overflow-hidden bg-bg pt-[32px]">
    <InputBoxDialog />
    <div
      class="pointer-events-none absolute inset-0 -z-1 bg-custom bg-cover bg-fixed bg-center bg-no-repeat opacity-custom blur-custom"
    />
    <TitleBar />
    <Navigation />
    <main class="relative z-1 no-scrollbar h-full flex-1 overflow-scroll bg-bg-secondary">
      <router-view v-slot="{ Component, route }">
        <transition name="page" mode="out-in">
          <keep-alive :include="keepAlivePages">
            <component :is="Component" :key="route.path" />
          </keep-alive>
        </transition>
      </router-view>
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
