<template>
  <main class="h-screen overflow-auto bg-bg-tertiary text-main" aria-labelledby="toolbox-title">
    <div class="mx-auto flex w-full max-w-[920px] flex-col gap-5 p-6 max-md:p-4">
      <!-- Header -->
      <header class="rounded-2xl border border-border-secondary bg-bg-secondary px-5 py-4 shadow-md">
        <div class="flex flex-wrap items-center gap-4">
          <div
            class="flex h-[40px] w-[40px] shrink-0 items-center justify-center rounded-xl bg-accent text-white"
            aria-hidden="true"
          >
            <Stethoscope :size="22" />
          </div>
          <div class="min-w-[200px] flex-1">
            <h1 id="toolbox-title" class="m-0 text-xl font-semibold">{{ t('pages.toolbox.title') }}</h1>
            <p class="m-0 mt-0.5 text-sm text-secondary">{{ t('pages.toolbox.description') }}</p>
          </div>
          <div class="flex flex-wrap items-center gap-2">
            <CustomButton
              v-if="fixableTypes.length > 0 && !isRunning"
              type="secondary"
              :icon="Wrench"
              :loading="isFixingAll"
              :text="t('pages.toolbox.fixAll', fixableTypes.length)"
              @click="fixAll"
            />
            <CustomButton
              :icon="hasRun ? RotateCw : Play"
              :loading="isRunning"
              :text="
                isRunning
                  ? t('pages.toolbox.running')
                  : hasRun
                    ? t('pages.toolbox.runAgain')
                    : t('pages.toolbox.runChecks')
              "
              @click="runChecks()"
            />
          </div>
        </div>

        <!-- Summary -->
        <div class="mt-4 border-t border-border-secondary pt-3" aria-live="polite">
          <div v-if="isRunning" class="flex items-center gap-3">
            <div
              class="relative h-1.5 flex-1 overflow-hidden rounded-full bg-bg-tertiary"
              role="progressbar"
              :aria-valuenow="Math.round(progress)"
              aria-valuemin="0"
              aria-valuemax="100"
            >
              <div
                class="absolute inset-y-0 left-0 rounded-full bg-accent transition-[width] duration-medium ease-apple"
                :style="{ width: `${progress}%` }"
              />
            </div>
            <span class="text-xs text-secondary tabular-nums">{{ doneCount }}/{{ checks.length }}</span>
          </div>
          <p v-else-if="!hasRun" class="m-0 text-xs text-secondary">{{ t('pages.toolbox.summaryIdle') }}</p>
          <div v-else class="flex flex-wrap items-center gap-x-4 gap-y-1 text-xs">
            <span v-if="issueCount === 0" class="inline-flex items-center gap-1.5 font-medium text-success">
              <CircleCheck :size="14" aria-hidden="true" />{{ t('pages.toolbox.allGood') }}
            </span>
            <template v-else>
              <span class="inline-flex items-center gap-1.5 font-medium text-danger">
                <TriangleAlert :size="14" aria-hidden="true" />{{ t('pages.toolbox.summaryIssues', issueCount) }}
              </span>
              <span class="inline-flex items-center gap-1.5 text-secondary">
                <CircleCheck :size="14" class="text-success" aria-hidden="true" />
                {{ t('pages.toolbox.summaryPassed', passedCount) }}
              </span>
            </template>
            <span v-if="lastRunAt" class="ml-auto text-secondary">
              {{ t('pages.toolbox.lastChecked', { time: lastRunAt }) }}
            </span>
          </div>
        </div>
      </header>

      <!-- Health checks -->
      <SettingSection
        :title="t('pages.toolbox.checksTitle')"
        :description="t('pages.toolbox.checksDescription')"
        :icon="ListChecks"
        only-one-row
      >
        <ToolboxCheckItem
          v-for="check in sortedChecks"
          :key="check.type"
          :title="check.title"
          :description="check.description"
          :status="results[check.type].status"
          :msg="results[check.type].msg"
          :value="results[check.type].value"
          :fix-label="check.fixLabel"
          :fixing="fixingTypes.has(check.type)"
          @fix="fixOne(check)"
          @recheck="runChecks(check.type)"
        />
      </SettingSection>

      <!-- Files & logs -->
      <SettingSection
        :title="t('pages.toolbox.filesTitle')"
        :description="t('pages.toolbox.filesDescription')"
        :icon="FolderOpen"
      >
        <button
          v-for="entry in fileEntries"
          :key="entry.id"
          type="button"
          class="flex min-w-0 cursor-pointer items-center gap-3 rounded-lg border border-border bg-bg-secondary p-3 text-left shadow-sm transition-all duration-fast ease-apple hover:-translate-y-px hover:border-accent focus-visible:focus-ring"
          @click="entry.open()"
        >
          <span
            class="flex h-[30px] w-[30px] shrink-0 items-center justify-center rounded-lg bg-accent/10 text-accent"
            aria-hidden="true"
          >
            <component :is="entry.icon" :size="16" />
          </span>
          <span class="flex min-w-0 flex-1 flex-col">
            <span class="text-sm font-semibold text-main">{{ entry.title }}</span>
            <span class="truncate text-xs text-secondary" :title="entry.detail">{{ entry.detail }}</span>
          </span>
          <ArrowUpRight :size="14" class="shrink-0 text-secondary" aria-hidden="true" />
        </button>
      </SettingSection>

      <!-- Support -->
      <SettingSection
        :title="t('pages.toolbox.supportTitle')"
        :description="t('pages.toolbox.supportDescription')"
        :icon="LifeBuoy"
      >
        <SettingCard class="flex flex-col gap-3">
          <div>
            <h3 class="m-0 text-sm font-semibold">{{ t('pages.toolbox.copyReport') }}</h3>
            <p class="m-0 mt-0.5 text-xs leading-relaxed text-secondary">
              {{ t('pages.toolbox.copyReportDescription') }}
            </p>
          </div>
          <div class="mt-auto flex flex-wrap gap-2">
            <CustomButton
              type="secondary"
              :icon="copyState === 'copied' ? Check : ClipboardCopy"
              :text="copyState === 'copied' ? t('pages.toolbox.copied') : t('pages.toolbox.copy')"
              :disabled="!appInfo"
              @click="copyReport"
            />
            <a
              :href="issueUrl(appInfo, 'bug_report.yml')"
              target="_blank"
              rel="noopener noreferrer"
              class="inline-flex items-center gap-1.5 rounded-md px-3 py-2 text-sm font-medium text-accent no-underline hover:bg-accent/10 focus-visible:focus-ring"
            >
              <Bug :size="15" aria-hidden="true" />{{ t('pages.toolbox.reportBug') }}
            </a>
          </div>
          <p v-if="copyState === 'error'" class="m-0 text-xs text-error" role="status">
            {{ t('pages.toolbox.copyFailed') }}
          </p>
        </SettingCard>
        <SettingCard class="flex flex-col gap-3">
          <div>
            <h3 class="m-0 text-sm font-semibold">{{ t('pages.toolbox.restartApp') }}</h3>
            <p class="m-0 mt-0.5 text-xs leading-relaxed text-secondary">
              {{ t('pages.toolbox.restartAppDescription') }}
            </p>
          </div>
          <div class="mt-auto">
            <CustomButton type="secondary" :icon="Power" :text="t('pages.toolbox.restartApp')" @click="restartApp" />
          </div>
        </SettingCard>
      </SettingSection>
    </div>
  </main>
</template>

<script lang="ts" setup>
import {
  ArrowUpRight,
  Bug,
  Check,
  CircleCheck,
  ClipboardCopy,
  FileCog,
  FileText,
  FolderOpen,
  LifeBuoy,
  ListChecks,
  Play,
  Power,
  RotateCw,
  Stethoscope,
  TriangleAlert,
  Wrench,
} from '@lucide/vue'
import { useTitle } from '@vueuse/core'
import { computed, onMounted, onUnmounted, reactive, ref } from 'vue'
import { useI18n } from 'vue-i18n'

import CustomButton from '@/components/common/CustomButton.vue'
import SettingCard from '@/components/common/SettingCard.vue'
import SettingSection from '@/components/common/SettingSection.vue'
import ToolboxCheckItem from '@/components/toolbox/ToolboxCheckItem.vue'
import { formatDiagnostics, issueUrl, useAppInfo, useCopyState } from '@/composables/useAppInfo'
import useConfirm from '@/composables/useConfirm'
import { IToolboxItemCheckStatus, IToolboxItemType } from '#/constants/app'
import { IRPCActionType } from '#/constants/rpcActions'

defineOptions({ name: 'ToolBoxPage' })

interface CheckDefinition {
  type: string
  title: string
  description: string
  fixLabel?: string
  // Asked before a fix that changes user data.
  fixConfirm?: string
  needsRestart?: boolean
}

interface CheckResult {
  status: string
  msg: string
  value: string
}

const { t, locale } = useI18n()
const { confirm } = useConfirm()
const { appInfo } = useAppInfo()
const { copyState, copy } = useCopyState()
useTitle(computed(() => t('pages.toolbox.title')))

const checks = computed<CheckDefinition[]>(() => [
  {
    type: IToolboxItemType.IS_CONFIG_FILE_BROKEN,
    title: t('pages.toolbox.configFile'),
    description: t('pages.toolbox.configFileDescription'),
    fixLabel: t('pages.toolbox.backUpAndReset'),
    fixConfirm: t('pages.toolbox.resetConfigConfirm'),
    needsRestart: true,
  },
  {
    type: IToolboxItemType.IS_GALLERY_FILE_BROKEN,
    title: t('pages.toolbox.galleryFile'),
    description: t('pages.toolbox.galleryFileDescription'),
    fixLabel: t('pages.toolbox.backUpAndReset'),
    fixConfirm: t('pages.toolbox.resetGalleryConfirm'),
    needsRestart: true,
  },
  {
    type: IToolboxItemType.IS_DATA_DIR_NOT_WRITABLE,
    title: t('pages.toolbox.dataDir'),
    description: t('pages.toolbox.dataDirDescription'),
  },
  {
    type: IToolboxItemType.HAS_PROBLEM_WITH_CLIPBOARD_PIC_UPLOAD,
    title: t('pages.toolbox.clipboardFolder'),
    description: t('pages.toolbox.clipboardFolderDescription'),
    fixLabel: t('pages.toolbox.createFolder'),
  },
  {
    type: IToolboxItemType.HAS_PROBLEM_WITH_UPLOAD_SERVER,
    title: t('pages.toolbox.uploadServer'),
    description: t('pages.toolbox.uploadServerDescription'),
    fixLabel: t('pages.toolbox.restartServer'),
  },
  {
    type: IToolboxItemType.HAS_PROBLEM_WITH_PROXY,
    title: t('pages.toolbox.proxy'),
    description: t('pages.toolbox.proxyDescription'),
  },
])

const results = reactive<Record<string, CheckResult>>(
  Object.fromEntries(
    Object.values(IToolboxItemType).map(type => [type, { status: IToolboxItemCheckStatus.INIT, msg: '', value: '' }]),
  ),
)
const fixingTypes = reactive(new Set<string>())
const isFixingAll = ref(false)
const hasRun = ref(false)
const lastRunAt = ref('')

const statusOf = (type: string) => results[type].status
const isFixable = (check: CheckDefinition) => !!check.fixLabel && statusOf(check.type) === IToolboxItemCheckStatus.ERROR

const doneCount = computed(
  () =>
    checks.value.filter(({ type }) =>
      [IToolboxItemCheckStatus.SUCCESS, IToolboxItemCheckStatus.ERROR].includes(statusOf(type)),
    ).length,
)
const progress = computed(() => (doneCount.value / checks.value.length) * 100)
const isRunning = computed(() => checks.value.some(({ type }) => statusOf(type) === IToolboxItemCheckStatus.LOADING))
const issueCount = computed(
  () => checks.value.filter(({ type }) => statusOf(type) === IToolboxItemCheckStatus.ERROR).length,
)
const passedCount = computed(
  () => checks.value.filter(({ type }) => statusOf(type) === IToolboxItemCheckStatus.SUCCESS).length,
)
const fixableTypes = computed(() => checks.value.filter(isFixable).map(({ type }) => type))

// Problems float to the top once a run has finished, so they're seen first.
const sortedChecks = computed(() =>
  isRunning.value
    ? checks.value
    : [...checks.value].sort(
        (a, b) =>
          Number(statusOf(b.type) === IToolboxItemCheckStatus.ERROR) -
          Number(statusOf(a.type) === IToolboxItemCheckStatus.ERROR),
      ),
)

function applyResult({ type, status, msg = '', value = '' }: IToolboxCheckRes) {
  if (!results[type]) return
  results[type] = { status, msg, value: typeof value === 'string' ? value : '' }
  if (hasRun.value && !isRunning.value) {
    lastRunAt.value = new Date().toLocaleTimeString(locale.value, { hour: '2-digit', minute: '2-digit' })
  }
}

function runChecks(type?: string) {
  const targets = type ? [type] : checks.value.map(check => check.type)
  for (const target of targets) {
    results[target] = { status: IToolboxItemCheckStatus.LOADING, msg: '', value: '' }
  }
  hasRun.value = true
  if (type) {
    window.electron.sendRPC(IRPCActionType.TOOLBOX_CHECK, type)
  } else {
    window.electron.sendRPC(IRPCActionType.TOOLBOX_CHECK)
  }
}

async function applyFix(check: CheckDefinition) {
  fixingTypes.add(check.type)
  try {
    const res = await window.electron.triggerRPC<IToolboxCheckRes>(IRPCActionType.TOOLBOX_CHECK_FIX, check.type)
    if (res) applyResult(res)
    const fixed = res?.status === IToolboxItemCheckStatus.SUCCESS
    // Some fixes only report success; check again to show the current details.
    if (fixed && !res.msg) runChecks(check.type)
    return fixed
  } catch {
    return false
  } finally {
    fixingTypes.delete(check.type)
  }
}

async function confirmFix(check: CheckDefinition) {
  if (!check.fixConfirm) return true
  return confirm({
    title: t('pages.toolbox.fixConfirmTitle', { name: check.title }),
    message: check.fixConfirm,
    type: 'warning',
    confirmButtonText: check.fixLabel,
    cancelButtonText: t('common.cancel'),
  })
}

async function promptRestart() {
  const restart = await confirm({
    title: t('pages.toolbox.restartTitle'),
    message: t('pages.toolbox.restartMessage'),
    type: 'info',
    confirmButtonText: t('pages.toolbox.restartNow'),
    cancelButtonText: t('pages.toolbox.later'),
  })
  if (restart) restartApp()
}

async function fixOne(check: CheckDefinition) {
  if (!(await confirmFix(check))) return
  if ((await applyFix(check)) && check.needsRestart) await promptRestart()
}

async function fixAll() {
  const targets = checks.value.filter(isFixable)
  for (const check of targets) {
    if (!(await confirmFix(check))) return
  }
  isFixingAll.value = true
  try {
    const fixed = await Promise.all(targets.map(async check => ((await applyFix(check)) ? check : null)))
    if (fixed.some(check => check?.needsRestart)) await promptRestart()
  } finally {
    isFixingAll.value = false
  }
}

function restartApp() {
  window.electron.sendRPC(IRPCActionType.RELOAD_APP)
}

/* Files & logs */
const fileEntries = computed(() => [
  {
    id: 'data',
    title: t('pages.toolbox.dataFolder'),
    detail: appInfo.value?.dataDir ?? '',
    icon: FolderOpen,
    open: () => window.electron.sendRPC(IRPCActionType.PICLIST_OPEN_DIRECTORY),
  },
  {
    id: 'config',
    title: t('pages.toolbox.configFile'),
    detail: appInfo.value?.configPath ?? 'data.json',
    icon: FileCog,
    open: () => appInfo.value && window.electron.sendRPC(IRPCActionType.OPEN_FILE, appInfo.value.configPath),
  },
  {
    id: 'appLog',
    title: t('pages.toolbox.appLog'),
    detail: 'piclist.log',
    icon: FileText,
    open: () => window.electron.sendRPC(IRPCActionType.PICLIST_OPEN_FILE, 'piclist.log'),
  },
  {
    id: 'guiLog',
    title: t('pages.toolbox.guiLog'),
    detail: 'piclist-gui-local.log',
    icon: FileText,
    open: () => window.electron.sendRPC(IRPCActionType.PICLIST_OPEN_FILE, 'piclist-gui-local.log'),
  },
])

function copyReport() {
  if (!appInfo.value) return
  const lines = [formatDiagnostics(appInfo.value)]
  if (hasRun.value) {
    lines.push(
      '',
      'Toolbox:',
      ...checks.value.map(({ type }) => {
        const { status, msg } = results[type]
        return `- ${type}: ${status}${msg ? ` — ${msg}` : ''}`
      }),
    )
  }
  copy(lines.join('\n'))
}

window.electron.ipcRendererOn(IRPCActionType.TOOLBOX_CHECK_RES, applyResult)

// Every check is read-only, so run them straight away when the window opens.
onMounted(() => runChecks())

onUnmounted(() => {
  window.electron.ipcRendererRemoveAllListeners(IRPCActionType.TOOLBOX_CHECK_RES)
})
</script>
