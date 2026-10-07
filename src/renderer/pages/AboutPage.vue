<template>
  <main class="h-screen overflow-auto bg-bg-tertiary text-main" aria-labelledby="about-title">
    <div class="mx-auto flex min-h-full w-full max-w-[640px] flex-col gap-4 px-6 pt-7 pb-5 max-[420px]:px-4">
      <header class="mb-1 flex items-center gap-5 max-[420px]:gap-4">
        <img
          :src="logoUrl"
          alt=""
          width="72"
          height="72"
          class="shrink-0 rounded-full max-[420px]:h-[56px] max-[420px]:w-[56px]"
        />
        <div class="min-w-0">
          <div class="mb-1 flex flex-wrap items-baseline gap-x-2.5 gap-y-1">
            <h1 id="about-title" class="m-0 text-[28px] leading-tight font-[650] tracking-[-0.5px]">PicList</h1>
            <span
              class="rounded-full bg-accent/10 px-2 py-0.5 text-xs font-semibold text-accent tabular-nums select-text"
            >
              v{{ pkg.version }}
            </span>
          </div>
          <p class="m-0 text-sm leading-relaxed text-secondary">{{ t('pages.about.description') }}</p>
        </div>
      </header>

      <!-- Update status -->
      <section
        class="flex flex-wrap items-center gap-3 rounded-lg border border-border bg-bg-secondary p-4 shadow-sm"
        aria-labelledby="update-title"
        aria-live="polite"
      >
        <div
          class="flex h-[34px] w-[34px] shrink-0 items-center justify-center rounded-lg"
          :class="updateView.iconClass"
          aria-hidden="true"
        >
          <component
            :is="updateView.icon"
            :size="18"
            :class="{ 'animate-spin motion-reduce:animate-none': updateState === 'checking' }"
          />
        </div>
        <div class="min-w-[180px] flex-1">
          <h2 id="update-title" class="m-0 text-sm font-semibold">{{ updateView.title }}</h2>
          <p class="m-0 mt-0.5 text-xs leading-relaxed text-secondary">{{ updateView.detail }}</p>
        </div>
        <CustomButton
          v-if="updateState === 'available'"
          :icon="ArrowUpRight"
          :text="t('pages.about.viewUpdate')"
          @click="showUpdateDetails"
        />
        <CustomButton
          v-else
          type="secondary"
          :icon="RefreshCw"
          :loading="updateState === 'checking'"
          :text="updateState === 'failed' ? t('pages.about.retry') : t('pages.about.checkAgain')"
          @click="checkForUpdates"
        />
      </section>

      <!-- System information -->
      <section class="rounded-lg border border-border bg-bg-secondary p-4 shadow-sm" aria-labelledby="system-title">
        <div class="mb-3 flex items-start justify-between gap-3">
          <div>
            <h2 id="system-title" class="m-0 text-sm font-semibold">{{ t('pages.about.systemInfo') }}</h2>
            <p class="m-0 mt-0.5 text-xs text-secondary">{{ t('pages.about.systemInfoHint') }}</p>
          </div>
          <CustomButton
            type="secondary"
            :icon="copyState === 'copied' ? Check : Copy"
            :text="copyState === 'copied' ? t('pages.about.copied') : t('pages.about.copy')"
            :disabled="!appInfo"
            class="shrink-0 px-3! py-1.5!"
            @click="copyDiagnostics"
          />
        </div>

        <dl
          class="m-0 grid grid-cols-[max-content_minmax(0,1fr)] gap-x-6 gap-y-2 rounded-md bg-bg-tertiary px-3.5 py-3 text-[13px]"
        >
          <template v-for="row in systemRows" :key="row.label">
            <dt class="text-secondary">{{ row.label }}</dt>
            <dd class="m-0 wrap-anywhere tabular-nums select-text">
              <span v-if="appInfo">{{ row.value }}</span>
              <span v-else class="inline-block h-3 w-24 animate-pulse rounded bg-border align-middle" />
            </dd>
          </template>
        </dl>
        <p v-if="copyState === 'error'" class="m-0 mt-2 text-xs text-error" role="status">
          {{ t('pages.about.copyFailed') }}
        </p>

        <div class="mt-3 flex flex-wrap gap-2">
          <a
            v-for="action in issueActions"
            :key="action.id"
            :href="action.href"
            target="_blank"
            rel="noopener noreferrer"
            class="inline-flex items-center gap-1.5 rounded-md border border-border px-3 py-1.5 text-xs font-medium text-main no-underline transition-colors duration-fast hover:border-accent hover:bg-accent/10 focus-visible:focus-ring"
          >
            <component :is="action.icon" :size="14" class="text-accent" aria-hidden="true" />
            {{ action.title }}
          </a>
        </div>
      </section>

      <!-- Resources -->
      <nav :aria-label="t('pages.about.resources')" class="grid grid-cols-2 gap-3 max-[460px]:grid-cols-1">
        <a
          v-for="link in links"
          :key="link.id"
          :href="link.href"
          target="_blank"
          rel="noopener noreferrer"
          class="group flex items-start gap-3 rounded-lg border border-border bg-bg-secondary p-3.5 text-main no-underline shadow-sm transition-all duration-fast ease-apple hover:-translate-y-px hover:border-accent focus-visible:focus-ring"
        >
          <span
            class="flex h-[30px] w-[30px] shrink-0 items-center justify-center rounded-lg bg-accent/10 text-accent"
            aria-hidden="true"
          >
            <component :is="link.icon" :size="16" />
          </span>
          <span class="flex min-w-0 flex-1 flex-col gap-0.5">
            <span class="flex items-center gap-1 text-sm font-semibold">
              {{ link.title }}
              <ArrowUpRight
                :size="13"
                class="text-secondary opacity-0 transition-opacity duration-fast group-hover:opacity-100"
                aria-hidden="true"
              />
            </span>
            <span class="text-xs leading-normal text-secondary">{{ link.description }}</span>
          </span>
        </a>
      </nav>

      <footer
        class="mt-auto flex flex-wrap items-center justify-between gap-3 border-t border-border pt-4 text-xs text-secondary"
      >
        <p class="m-0 flex flex-wrap items-center gap-x-2 gap-y-1">
          <span>
            {{ t('pages.about.createdBy') }}
            <a :href="AUTHOR_URL" target="_blank" rel="noopener noreferrer" :class="footerLinkClass">
              {{ pkg.author.name }}
            </a>
          </span>
          <span aria-hidden="true">·</span>
          <a
            :href="`${GITHUB_URL}/blob/dev/LICENSE`"
            target="_blank"
            rel="noopener noreferrer"
            :class="footerLinkClass"
          >
            {{ t('pages.about.license', { license: pkg.license }) }}
          </a>
          <span aria-hidden="true">·</span>
          <a :href="GITHUB_URL" target="_blank" rel="noopener noreferrer" :class="footerLinkClass">
            <Star :size="12" class="mr-0.5 inline align-[-1px]" aria-hidden="true" />{{ t('pages.about.star') }}
          </a>
        </p>
        <CustomButton type="secondary" :text="t('common.close')" class="px-3! py-1.5!" @click="closeWindow" />
      </footer>
    </div>
  </main>
</template>

<script setup lang="ts">
import {
  ArrowUpRight,
  BookOpen,
  Bug,
  Check,
  CircleAlert,
  CircleCheck,
  CircleHelp,
  CodeXml,
  Copy,
  Lightbulb,
  PackageOpen,
  RefreshCw,
  Sparkles,
  Star,
} from '@lucide/vue'
import { useEventListener, useTitle } from '@vueuse/core'
import pkg from 'root/package.json'
import { computed, onMounted, ref } from 'vue'
import { useI18n } from 'vue-i18n'

import CustomButton from '@/components/common/CustomButton.vue'
import { formatDiagnostics, formatOperatingSystem, issueUrl, useAppInfo, useCopyState } from '@/composables/useAppInfo'
import { GITHUB_URL } from '@/utils/static'
import { IRPCActionType } from '#/constants/rpcActions'

defineOptions({ name: 'AboutPage' })

const AUTHOR_URL = 'https://github.com/Kuingsmile'
const footerLinkClass =
  'text-main underline decoration-border underline-offset-[3px] hover:text-accent hover:decoration-current'

const { t, locale } = useI18n()
useTitle(computed(() => t('pages.about.title')))
const logoUrl = `${import.meta.env.BASE_URL}roundLogo.png`

const { appInfo } = useAppInfo()
const { copyState, copy } = useCopyState()

const systemRows = computed(() => {
  const info = appInfo.value
  return [
    {
      label: 'PicList',
      value: info && `v${info.version} · ${t(info.isPortable ? 'pages.about.portable' : 'pages.about.installer')}`,
    },
    { label: 'Electron', value: info?.electron },
    { label: 'Chromium', value: info?.chrome },
    { label: 'Node.js', value: info?.node },
    { label: t('pages.about.operatingSystem'), value: info && formatOperatingSystem(info) },
  ]
})

function copyDiagnostics() {
  if (appInfo.value) copy(formatDiagnostics(appInfo.value))
}

const issueActions = computed(() => [
  { id: 'bug', title: t('pages.about.reportBug'), href: issueUrl(appInfo.value, 'bug_report.yml'), icon: Bug },
  {
    id: 'feature',
    title: t('pages.about.requestFeature'),
    href: issueUrl(appInfo.value, 'feature_request.yml'),
    icon: Lightbulb,
  },
])

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
    id: 'faq',
    title: t('pages.about.faq'),
    description: t('pages.about.faqDescription'),
    href: `${GITHUB_URL}/blob/dev/FAQ.md`,
    icon: CircleHelp,
  },
  {
    id: 'source',
    title: t('pages.about.sourceCode'),
    description: t('pages.about.sourceCodeDescription'),
    href: GITHUB_URL,
    icon: CodeXml,
  },
])

/* Update check */
const updateState = ref<'checking' | 'latest' | 'available' | 'failed'>('checking')
const latestVersion = ref('')

const updateView = computed(() => {
  switch (updateState.value) {
    case 'latest':
      return {
        icon: CircleCheck,
        iconClass: 'bg-success/15 text-success',
        title: t('pages.about.upToDate'),
        detail: t('pages.about.upToDateDetail', { version: pkg.version }),
      }
    case 'available':
      return {
        icon: Sparkles,
        iconClass: 'bg-accent text-white',
        title: t('pages.about.updateAvailable', { version: latestVersion.value }),
        detail: t('pages.about.updateAvailableDetail', { version: pkg.version }),
      }
    case 'failed':
      return {
        icon: CircleAlert,
        iconClass: 'bg-warning/15 text-warning',
        title: t('pages.about.checkFailed'),
        detail: t('pages.about.checkFailedDetail'),
      }
    default:
      return {
        icon: RefreshCw,
        iconClass: 'bg-accent/10 text-accent',
        title: t('pages.about.checking'),
        detail: t('pages.about.checkingDetail', { version: pkg.version }),
      }
  }
})

async function checkForUpdates() {
  updateState.value = 'checking'
  try {
    const result = await window.electron.triggerRPC<IUpdateCheckResult>(IRPCActionType.CHECK_FOR_UPDATES)
    if (!result) throw new Error('Empty update check result')
    latestVersion.value = result.latestVersion
    updateState.value = result.hasUpdate ? 'available' : 'latest'
  } catch {
    updateState.value = 'failed'
  }
}

function showUpdateDetails() {
  window.electron.sendRPC(IRPCActionType.SHOW_UPDATE_DETAILS)
}

function closeWindow() {
  window.electron.sendRPC(IRPCActionType.CLOSE_CURRENT_WINDOW)
}

useEventListener('keydown', event => {
  if (event.key === 'Escape') closeWindow()
})

onMounted(checkForUpdates)
</script>
