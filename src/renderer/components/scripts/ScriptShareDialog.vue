<template>
  <CustomModal
    v-model:visible="visible"
    :title="t('pages.scripts.marketplace.shareScript')"
    :description="script?.fileName"
    height="auto"
    width="560px"
  >
    <div v-if="!githubAuth.isAuthenticated" class="flex flex-col items-center gap-4 px-6 py-10 text-center">
      <div
        class="flex h-[48px] w-[48px] items-center justify-center rounded-xl bg-bg-secondary text-main shadow-sm"
        aria-hidden="true"
      >
        <BaseSvg name="GitHub" :size="26" />
      </div>
      <p class="m-0 max-w-[360px] text-sm text-secondary">{{ t('pages.scripts.marketplace.loginRequired') }}</p>
      <CustomButton :text="t('pages.scripts.marketplace.loginWithGitHub')" @click="loginWithGitHub">
        <template #icon>
          <BaseSvg name="GitHub" :size="16" />
        </template>
      </CustomButton>
    </div>
    <form v-else class="flex flex-col gap-4 p-6" @submit.prevent="handleShareScript">
      <p class="m-0 flex items-start gap-2 rounded-lg bg-accent/10 px-3 py-2 text-xs leading-relaxed text-secondary">
        <GitPullRequestIcon :size="14" class="mt-px shrink-0 text-accent" aria-hidden="true" />
        {{ t('pages.scripts.marketplace.shareHint', { username: githubAuth.username }) }}
      </p>
      <div class="grid grid-cols-[1fr_140px] gap-4 max-md:grid-cols-1">
        <CustomInput
          v-model="shareMetadata.name"
          required
          :title="t('pages.scripts.marketplace.scriptName')"
          :placeholder="t('pages.scripts.marketplace.scriptName')"
        />
        <CustomInput
          v-model="shareMetadata.version"
          required
          :title="t('pages.scripts.marketplace.version')"
          placeholder="1.0.0"
        />
      </div>
      <CustomInput
        v-model="shareMetadata.author"
        required
        :title="t('pages.scripts.marketplace.scriptAuthor')"
        :placeholder="t('pages.scripts.marketplace.scriptAuthor')"
      />
      <CustomInput
        v-model="shareMetadata.description"
        required
        :title="t('pages.scripts.marketplace.scriptDescription')"
        :placeholder="t('pages.scripts.marketplace.descriptionPlaceholder')"
      />
    </form>
    <template #footer>
      <CustomButton type="secondary" :text="t('common.cancel')" @click="visible = false" />
      <CustomButton
        v-if="githubAuth.isAuthenticated"
        :icon="Share2Icon"
        :loading="sharingScript"
        :disabled="!metadataComplete"
        :text="sharingScript ? t('pages.scripts.marketplace.sharing') : t('pages.scripts.marketplace.share')"
        @click="handleShareScript"
      />
    </template>
  </CustomModal>
</template>

<script setup lang="ts">
import { GitPullRequestIcon, Share2Icon } from '@lucide/vue'
import { computed, ref, watch } from 'vue'
import { useI18n } from 'vue-i18n'

import BaseSvg from '@/assets/svg/BaseSvg.vue'
import CustomButton from '@/components/common/CustomButton.vue'
import CustomInput from '@/components/common/CustomInput.vue'
import CustomModal from '@/components/common/CustomModal.vue'
import { useGitHubAuth } from '@/composables/scripts/useGitHubAuth'
import useMessage from '@/composables/useMessage'
import { IRPCActionType } from '#/constants/rpcActions'
import { getRawData } from '#/utils/rawData'

const visible = defineModel<boolean>('visible', { required: true })
const { script } = defineProps<{ script: IStringKeyMap | null }>()

const { t } = useI18n()
const message = useMessage()
const { githubAuth, loginWithGitHub } = useGitHubAuth()

const sharingScript = ref(false)
const shareMetadata = ref({ name: '', author: '', description: '', version: '1.0.0' })
const metadataComplete = computed(() => Object.values(shareMetadata.value).every(value => value.trim() !== ''))

watch(visible, isVisible => {
  if (!isVisible || !script) return
  shareMetadata.value = {
    name: script.fileName.replace(/\.js$/, ''),
    author: githubAuth.value.username || '',
    description: '',
    version: '1.0.0',
  }
})

// Logging in from this dialog should prefill the author once the account is known.
watch(
  () => githubAuth.value.username,
  username => {
    if (username && !shareMetadata.value.author) shareMetadata.value.author = username
  },
)

async function handleShareScript() {
  if (!script || sharingScript.value) return
  if (!metadataComplete.value) {
    message.error(t('pages.scripts.marketplace.metadataRequired'))
    return
  }

  sharingScript.value = true
  try {
    const result = await window.electron.triggerRPC<{ success: boolean; prUrl?: string; error?: string }>(
      IRPCActionType.SCRIPT_MARKETPLACE_SHARE,
      getRawData(script.filePath),
      Object.fromEntries(Object.entries(shareMetadata.value).map(([key, value]) => [key, value.trim()])),
    )
    if (result?.success) {
      message.success(t('pages.scripts.marketplace.shareSuccess'))
      visible.value = false
      if (result.prUrl) window.electron.sendRPC(IRPCActionType.OPEN_URL, result.prUrl)
    } else {
      message.error(`${t('pages.scripts.marketplace.shareFailed')}: ${result?.error || 'Unknown error'}`)
    }
  } catch (error) {
    console.error('Failed to share script:', error)
    message.error(t('pages.scripts.marketplace.shareFailed'))
  } finally {
    sharingScript.value = false
  }
}
</script>
