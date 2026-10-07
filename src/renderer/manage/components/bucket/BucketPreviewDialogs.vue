<template>
  <CustomModal
    v-model:visible="isShowImagePreview"
    :title="fileName || t('pages.manage.bucket.imagePreview')"
    :description="fileName ? t('pages.manage.bucket.imagePreview') : ''"
    width="auto"
    height="auto"
    max-width="90vw"
  >
    <div
      class="flex min-h-[200px] min-w-[320px] items-center justify-center p-4"
      :style="{
        backgroundColor: 'var(--color-background-tertiary)',
        backgroundImage:
          'linear-gradient(45deg, var(--color-background-secondary) 25%, transparent 25%), linear-gradient(-45deg, var(--color-background-secondary) 25%, transparent 25%), linear-gradient(45deg, transparent 75%, var(--color-background-secondary) 75%), linear-gradient(-45deg, transparent 75%, var(--color-background-secondary) 75%)',
        backgroundSize: '20px 20px',
        backgroundPosition: '0 0, 0 10px, 10px -10px, -10px 0',
      }"
    >
      <img
        :src="previewContent"
        :alt="fileName"
        class="max-h-[72vh] max-w-full rounded-md object-contain shadow-md"
        @error="handlePreviewError"
      />
    </div>
  </CustomModal>

  <CustomModal
    v-model:visible="isShowMarkDownDialog"
    width="80vw"
    height="80vh"
    :title="fileName || t('pages.manage.bucket.preview')"
    :description="fileName ? t('pages.manage.bucket.preview') : ''"
  >
    <div class="flex h-full min-h-0 w-full p-4">
      <MarkdownContent
        :html="markDownContent"
        class="w-full overflow-auto rounded-lg border border-border-secondary bg-bg-secondary px-6 py-4 select-text"
      />
    </div>
  </CustomModal>

  <CustomModal
    v-model:visible="isShowTextFileDialog"
    width="80vw"
    height="80vh"
    :title="fileName || t('pages.manage.bucket.preview')"
    :description="fileName ? t('pages.manage.bucket.preview') : ''"
  >
    <div class="flex h-full min-h-0 w-full flex-col gap-2 p-4">
      <div class="flex shrink-0 items-center justify-end gap-2">
        <CustomSwitch v-model="wrapText" :title="t('pages.manage.bucket.wrapLines')" small tighter no-border no-hover />
        <CustomButton
          type="secondary"
          :icon="CopyIcon"
          :text="t('common.copy')"
          class="h-[30px] px-3! py-0!"
          @click="copyText"
        />
      </div>
      <pre
        class="m-0 min-h-0 flex-1 overflow-auto rounded-lg border border-border-secondary bg-bg-secondary p-4 font-mono text-[13px] leading-relaxed text-main select-text"
        :class="wrapText ? 'wrap-anywhere whitespace-pre-wrap' : 'whitespace-pre'"
        >{{ previewContent }}</pre>
    </div>
  </CustomModal>

  <CustomModal
    v-model:visible="isShowVideoFileDialog"
    width="90vw"
    height="90vh"
    :title="fileName || t('pages.manage.bucket.play')"
  >
    <div class="flex h-full w-full items-center justify-center bg-black">
      <VideoPlayer
        class="[&_.video-js]:h-full [&_.video-js]:max-h-[90vh] [&_.video-js]:w-full"
        :sources="videoSources"
        :volume="0.6"
        :options="{
          autoplay: true,
          muted: false,
          responsive: true,
          fill: true,
          fluid: false,
          controlBar: {
            volumePanel: {
              inline: false,
            },
          },
        }"
        crossorigin="anonymous"
        controls
        playsinline
        loop
        @error="handlePreviewError"
      />
    </div>
  </CustomModal>
</template>

<script setup lang="ts">
import { CopyIcon } from '@lucide/vue'
import { computed, defineAsyncComponent, ref } from 'vue'
import { useI18n } from 'vue-i18n'

import CustomButton from '@/components/common/CustomButton.vue'
import CustomModal from '@/components/common/CustomModal.vue'
import CustomSwitch from '@/components/common/CustomSwitch.vue'
import MarkdownContent from '@/components/common/MarkdownContent.vue'
import { useFilePreview } from '@/composables/useFilePreview'
import { renderMarkdown } from '@/utils/markdown'

const { filePreview, fileName = '' } = defineProps<{
  filePreview: ReturnType<typeof useFilePreview>
  fileName?: string
}>()
const emit = defineEmits<{ error: []; copy: [text: string] }>()
const { t } = useI18n()
const VideoPlayer = defineAsyncComponent(() => import('@/components/VideoPlayer.vue'))

const isShowImagePreview = filePreview.visible('image')

const isShowMarkDownDialog = filePreview.visible('markdown')

const isShowTextFileDialog = filePreview.visible('text')

const isShowVideoFileDialog = filePreview.visible('video')

const videoSources = filePreview.videoSources

const previewContent = computed(() => filePreview.preview.value?.content ?? '')

const markDownContent = computed(() => (isShowMarkDownDialog.value ? renderMarkdown(previewContent.value) : ''))
const wrapText = ref(true)

function copyText() {
  emit('copy', previewContent.value)
}

function handlePreviewError() {
  emit('error')
}
</script>
