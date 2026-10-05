<template>
  <main class="h-screen overflow-auto bg-bg-secondary text-main" aria-labelledby="about-title">
    <div
      class="mx-auto flex min-h-full w-full max-w-[640px] flex-col px-[36px] pt-[32px] pb-[20px] max-[420px]:px-[20px] max-[420px]:pt-[24px]"
    >
      <header class="mb-[28px] flex items-center gap-[22px] max-[420px]:items-start max-[420px]:gap-[16px]">
        <img
          :src="logoUrl"
          alt=""
          width="80"
          height="80"
          class="shrink-0 rounded-full max-[420px]:h-[60px] max-[420px]:w-[60px]"
        />
        <div>
          <h1
            id="about-title"
            class="m-0 mb-[5px] text-[32px] leading-[1.15] font-[650] tracking-[-1px] max-[420px]:text-[28px]"
          >
            PicList
          </h1>
          <p class="m-0 max-w-[36ch] text-[14px] leading-[1.6] text-secondary">{{ t('pages.about.description') }}</p>
        </div>
      </header>

      <section
        class="flex flex-wrap items-center justify-between gap-[14px] rounded-lg border border-border bg-surface-elevated px-[18px] py-[16px]"
        aria-labelledby="version-title"
      >
        <div>
          <h2 id="version-title" class="m-0 mb-[3px] text-[12px] font-normal text-secondary">
            {{ t('pages.about.installedVersion') }}
          </h2>
          <p class="m-0 text-[20px] leading-[1.3] font-semibold wrap-anywhere tabular-nums select-text">
            v{{ pkg.version }}
          </p>
        </div>
        <button
          type="button"
          class="inline-flex min-h-[36px] cursor-pointer items-center justify-center gap-[7px] rounded-sm border border-border bg-surface px-[12px] py-[7px] font-[inherit] text-[12px] font-medium text-main transition-colors duration-fast hover:bg-bg-tertiary"
          @click="copyVersion"
        >
          <component :is="copyState === 'copied' ? Check : Copy" :size="15" class="shrink-0" aria-hidden="true" />
          {{ t(copyState === 'copied' ? 'pages.about.copied' : 'pages.about.copyVersion') }}
        </button>
      </section>
      <p class="mx-0 my-[4px] text-[12px] text-error" role="status" aria-live="polite" aria-atomic="true">
        <span v-if="copyState === 'copied'" class="sr-only">{{ t('pages.about.copied') }}</span>
        {{ copyState === 'error' ? t('pages.about.copyFailed') : '' }}
      </p>

      <nav :aria-label="t('pages.about.resources')" class="mx-[-10px] mt-0 mb-[22px]">
        <a
          v-for="link in links"
          :key="link.id"
          :href="link.href"
          target="_blank"
          rel="noopener noreferrer"
          class="flex min-h-[62px] items-center gap-[14px] rounded-md p-[10px] text-main no-underline transition-colors duration-fast hover:bg-surface-elevated"
        >
          <component :is="link.icon" :size="19" class="shrink-0 text-accent" aria-hidden="true" />
          <span class="flex min-w-0 flex-1 flex-col gap-[2px]">
            <span class="text-[14px] font-[550]">{{ link.title }}</span>
            <span class="text-[12px] leading-[1.5] text-secondary">{{ link.description }}</span>
          </span>
          <ExternalLink :size="14" class="shrink-0 text-secondary" aria-hidden="true" />
        </a>
      </nav>

      <section
        class="mt-auto border-t border-border pt-[18px] text-[12px] leading-[1.7] text-secondary"
        :aria-label="t('pages.about.credits')"
      >
        <p class="m-0 mb-[3px]">
          {{ t('pages.about.createdBy') }}
          <a
            href="https://github.com/Kuingsmile"
            target="_blank"
            rel="noopener noreferrer"
            class="text-main underline decoration-border underline-offset-[3px] hover:text-accent hover:decoration-current"
          >
            {{ pkg.author.name }}
          </a>
        </p>
      </section>

      <footer class="mt-[18px] flex flex-wrap items-center justify-between gap-[12px]">
        <a
          :href="`${GITHUB_URL}/blob/dev/LICENSE`"
          target="_blank"
          rel="noopener noreferrer"
          class="inline-flex items-center gap-[7px] text-[12px] text-main underline decoration-border underline-offset-[3px] hover:text-accent hover:decoration-current"
        >
          <Scale :size="15" aria-hidden="true" />
          {{ t('pages.about.license', { license: pkg.license }) }}
        </a>
        <button
          type="button"
          class="inline-flex min-h-[36px] min-w-[88px] cursor-pointer items-center justify-center gap-[7px] rounded-sm border border-border bg-surface px-[12px] py-[7px] font-[inherit] text-[12px] font-medium text-main transition-colors duration-fast hover:bg-bg-tertiary"
          @click="closeWindow"
        >
          {{ t('common.close') }}
        </button>
      </footer>
    </div>
  </main>
</template>

<script setup lang="ts">
import { BookOpen, Check, CodeXml, Copy, ExternalLink, MessageSquare, PackageOpen, Scale } from '@lucide/vue'
import { useEventListener, useTitle } from '@vueuse/core'
import pkg from 'root/package.json'
import { computed, onBeforeUnmount, ref } from 'vue'
import { useI18n } from 'vue-i18n'

import { GITHUB_URL } from '@/utils/static'
import { IRPCActionType } from '#/constants/rpcActions'

defineOptions({ name: 'AboutPage' })

const { t, locale } = useI18n()
useTitle(computed(() => t('pages.about.title')))
const logoUrl = `${import.meta.env.BASE_URL}roundLogo.png`
const copyState = ref<'idle' | 'copied' | 'error'>('idle')
let copyResetTimer: ReturnType<typeof setTimeout> | undefined

const links = computed(() => [
  {
    id: 'docs',
    title: t('pages.about.documentation'),
    description: t('pages.about.documentationDescription'),
    href: `${pkg.homepage}/${locale.value === 'en' ? 'en/' : ''}`,
    icon: BookOpen,
  },
  {
    id: 'releases',
    title: t('pages.about.releases'),
    description: t('pages.about.releasesDescription'),
    href: `${GITHUB_URL}/releases`,
    icon: PackageOpen,
  },
  {
    id: 'source',
    title: t('pages.about.sourceCode'),
    description: t('pages.about.sourceCodeDescription'),
    href: GITHUB_URL,
    icon: CodeXml,
  },
  {
    id: 'feedback',
    title: t('pages.about.feedback'),
    description: t('pages.about.feedbackDescription'),
    href: pkg.bugs.url,
    icon: MessageSquare,
  },
])

function copyVersion() {
  clearTimeout(copyResetTimer)
  try {
    window.electron.clipboard.writeText(`PicList v${pkg.version}`)
    copyState.value = 'copied'
    copyResetTimer = setTimeout(() => {
      copyState.value = 'idle'
    }, 2500)
  } catch {
    copyState.value = 'error'
  }
}

function closeWindow() {
  window.electron.sendRPC(IRPCActionType.CLOSE_CURRENT_WINDOW)
}

useEventListener('keydown', event => {
  if (event.key === 'Escape') closeWindow()
})

onBeforeUnmount(() => {
  clearTimeout(copyResetTimer)
})
</script>
