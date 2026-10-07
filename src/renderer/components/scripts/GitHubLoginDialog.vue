<template>
  <CustomModal
    v-model:visible="loginDialogVisible"
    :title="t('pages.scripts.marketplace.loginWithGitHub')"
    width="460px"
    height="auto"
    @update:visible="visible => !visible && cancelGitHubLogin()"
  >
    <div class="flex flex-col items-center gap-5 p-6 text-center">
      <div
        class="flex h-[48px] w-[48px] items-center justify-center rounded-xl bg-bg-secondary text-main shadow-sm"
        aria-hidden="true"
      >
        <BaseSvg name="GitHub" :size="26" />
      </div>
      <p class="m-0 max-w-[340px] text-sm text-secondary">
        {{ t('pages.scripts.marketplace.deviceFlowInstructions') }}
      </p>
      <div class="flex flex-col items-center gap-2">
        <span class="text-xs font-medium text-secondary">{{ t('pages.scripts.marketplace.yourCode') }}</span>
        <div class="flex items-center gap-2">
          <code
            class="rounded-lg border border-border bg-bg-secondary px-5 py-2.5 font-mono text-2xl font-bold tracking-[0.2em] text-accent select-all"
          >
            {{ deviceFlow?.userCode }}
          </code>
          <button
            v-tooltip="copied ? t('pages.scripts.marketplace.codeCopied') : t('pages.scripts.marketplace.copyCode')"
            type="button"
            class="flex h-[40px] w-[40px] cursor-pointer items-center justify-center rounded-lg border border-border bg-bg-secondary text-secondary transition-all duration-fast ease-apple hover:border-accent hover:text-accent focus-visible:focus-ring"
            :aria-label="t('pages.scripts.marketplace.copyCode')"
            @click="copyUserCode"
          >
            <CheckIcon v-if="copied" :size="18" class="text-success" aria-hidden="true" />
            <CopyIcon v-else :size="18" aria-hidden="true" />
          </button>
        </div>
      </div>
      <button
        v-if="deviceFlow?.verificationUri"
        type="button"
        class="inline-flex cursor-pointer items-center gap-1.5 rounded-md px-2 py-1 text-sm font-medium text-accent hover:bg-accent/10 focus-visible:focus-ring"
        @click="openVerificationPage"
      >
        <ExternalLinkIcon :size="14" aria-hidden="true" />{{ t('pages.scripts.marketplace.openVerificationPage') }}
      </button>
      <div class="flex items-center gap-2 text-sm text-secondary" role="status">
        <LoaderCircle :size="16" class="animate-spin text-accent motion-reduce:animate-none" aria-hidden="true" />
        {{ t('pages.scripts.marketplace.waitingForAuth') }}
      </div>
    </div>
    <template #footer>
      <CustomButton type="secondary" :text="t('common.cancel')" @click="cancelGitHubLogin" />
    </template>
  </CustomModal>
</template>

<script setup lang="ts">
import { CheckIcon, CopyIcon, ExternalLinkIcon, LoaderCircle } from '@lucide/vue'
import { useTimeoutFn } from '@vueuse/core'
import { ref } from 'vue'
import { useI18n } from 'vue-i18n'

import BaseSvg from '@/assets/svg/BaseSvg.vue'
import CustomButton from '@/components/common/CustomButton.vue'
import CustomModal from '@/components/common/CustomModal.vue'
import { useGitHubAuth } from '@/composables/scripts/useGitHubAuth'
import { IRPCActionType } from '#/constants/rpcActions'

const { t } = useI18n()
const { deviceFlow, loginDialogVisible, cancelGitHubLogin } = useGitHubAuth()

const copied = ref(false)
const { start: resetCopiedLater } = useTimeoutFn(() => (copied.value = false), 2000, { immediate: false })

function copyUserCode() {
  if (!deviceFlow.value) return
  window.electron.clipboard.writeText(deviceFlow.value.userCode)
  copied.value = true
  resetCopiedLater()
}

function openVerificationPage() {
  if (deviceFlow.value) window.electron.sendRPC(IRPCActionType.OPEN_URL, deviceFlow.value.verificationUri)
}
</script>
