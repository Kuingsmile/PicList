<template>
  <SettingCard class="flex items-start gap-3 transition-colors duration-fast" :class="{ 'border-danger/40!': isError }">
    <div
      class="mt-0.5 flex h-[30px] w-[30px] shrink-0 items-center justify-center rounded-lg"
      :class="statusView.iconClass"
    >
      <component
        :is="statusView.icon"
        :size="16"
        :class="{ 'animate-spin motion-reduce:animate-none': status === IToolboxItemCheckStatus.LOADING }"
        aria-hidden="true"
      />
    </div>

    <div class="min-w-0 flex-1">
      <div class="flex flex-wrap items-center gap-x-2 gap-y-1">
        <h3 class="m-0 text-sm font-semibold text-main">{{ title }}</h3>
        <span class="rounded-full px-2 py-px text-[11px] font-medium" :class="statusView.badgeClass">
          {{ statusView.label }}
        </span>
      </div>
      <p class="m-0 mt-0.5 text-xs leading-relaxed text-secondary">{{ description }}</p>
      <p
        v-if="msg && isError"
        class="m-0 mt-2 rounded-md bg-danger/10 px-2.5 py-1.5 text-xs leading-relaxed wrap-anywhere text-main select-text"
        role="status"
      >
        {{ msg }}
      </p>
      <!-- Passing results are mostly paths: keep them to one line, full text on hover. -->
      <p v-else-if="msg" class="m-0 mt-1 truncate text-xs text-tertiary select-text" :title="msg" role="status">
        {{ msg }}
      </p>
      <p v-if="isError && !fixLabel" class="m-0 mt-1.5 text-xs text-secondary">
        {{ t('pages.toolbox.manualFixHint') }}
      </p>
    </div>

    <div class="flex shrink-0 items-center gap-1.5 self-center">
      <CustomButton
        v-if="isError && fixLabel"
        :text="fixLabel"
        :icon="Wrench"
        :loading="fixing"
        class="px-3! py-1.5!"
        @click="emit('fix')"
      />
      <CustomButton
        v-if="value && !busy"
        v-tooltip="t('pages.toolbox.openLocation')"
        type="secondary"
        :icon="FolderOpen"
        :aria-label="t('pages.toolbox.openLocation')"
        class="px-2! py-1.5!"
        @click="openValue"
      />
      <CustomButton
        v-tooltip="t('pages.toolbox.recheck')"
        type="secondary"
        :icon="RotateCw"
        :disabled="busy"
        :aria-label="t('pages.toolbox.recheck')"
        class="px-2! py-1.5!"
        @click="emit('recheck')"
      />
    </div>
  </SettingCard>
</template>

<script setup lang="ts">
import { CircleCheck, CircleDashed, FolderOpen, LoaderCircle, RotateCw, TriangleAlert, Wrench } from '@lucide/vue'
import { computed } from 'vue'
import { useI18n } from 'vue-i18n'

import CustomButton from '@/components/common/CustomButton.vue'
import SettingCard from '@/components/common/SettingCard.vue'
import { IToolboxItemCheckStatus } from '#/constants/app'
import { IRPCActionType } from '#/constants/rpcActions'

defineOptions({ name: 'ToolboxCheckItem' })

const {
  title,
  description,
  status,
  msg = '',
  value = '',
  fixLabel = '',
  fixing = false,
} = defineProps<{
  title: string
  description: string
  status: string
  msg?: string
  value?: string
  fixLabel?: string
  fixing?: boolean
}>()

const emit = defineEmits<{
  fix: []
  recheck: []
}>()

const { t } = useI18n()

const isError = computed(() => status === IToolboxItemCheckStatus.ERROR)
const busy = computed(() => fixing || status === IToolboxItemCheckStatus.LOADING)

const statusView = computed(() => {
  switch (status) {
    case IToolboxItemCheckStatus.SUCCESS:
      return {
        icon: CircleCheck,
        iconClass: 'bg-success/15 text-success',
        badgeClass: 'bg-success/15 text-success',
        label: t('pages.toolbox.statusOk'),
      }
    case IToolboxItemCheckStatus.ERROR:
      return {
        icon: TriangleAlert,
        iconClass: 'bg-danger/15 text-danger',
        badgeClass: 'bg-danger/15 text-danger',
        label: t('pages.toolbox.statusIssue'),
      }
    case IToolboxItemCheckStatus.LOADING:
      return {
        icon: LoaderCircle,
        iconClass: 'bg-accent/10 text-accent',
        badgeClass: 'bg-accent/10 text-accent',
        label: t('pages.toolbox.statusChecking'),
      }
    default:
      return {
        icon: CircleDashed,
        iconClass: 'bg-bg-tertiary text-secondary',
        badgeClass: 'bg-bg-tertiary text-secondary',
        label: t('pages.toolbox.statusNotChecked'),
      }
  }
})

function openValue() {
  window.electron.sendRPC(IRPCActionType.OPEN_FILE, value)
}
</script>
