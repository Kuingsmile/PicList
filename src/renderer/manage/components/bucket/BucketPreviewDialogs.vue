<template>
  <CustomModal
    v-model:visible="isShowImagePreview"
    :title="t('pages.manage.bucket.imagePreview')"
    width="auto"
    height="auto"
  >
    <div class="flex-1 p-4">
      <img :src="previewContent" class="max-h-[70vh] max-w-full object-contain" @error="handlePreviewError" />
    </div>
  </CustomModal>

  <CustomModal
    v-model:visible="isShowMarkDownDialog"
    width="80vw"
    height="80vh"
    :title="t('pages.manage.bucket.preview')"
  >
    <div class="flex h-full w-full">
      <MarkdownContent :html="markDownContent" class="w-full rounded-md border border-border select-text" />
    </div>
  </CustomModal>

  <CustomModal
    v-model:visible="isShowTextFileDialog"
    width="80vw"
    height="80vh"
    :title="t('pages.manage.bucket.preview')"
  >
    <div class="flex h-full w-full">
      <pre class="overflow-auto font-['SF_Mono',Monaco,Menlo,'Ubuntu_Mono',monospace] text-base text-main">{{
        previewContent
      }}</pre>
    </div>
  </CustomModal>

  <CustomModal
    v-model:visible="isShowVideoFileDialog"
    width="90vw"
    height="90vh"
    :title="t('pages.manage.bucket.play')"
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
import { computed, defineAsyncComponent } from 'vue'
import { useI18n } from 'vue-i18n'

import CustomModal from '@/components/common/CustomModal.vue'
import MarkdownContent from '@/components/common/MarkdownContent.vue'
import { useFilePreview } from '@/composables/useFilePreview'
import { renderMarkdown } from '@/utils/markdown'

const { filePreview } = defineProps<{ filePreview: ReturnType<typeof useFilePreview> }>()
const emit = defineEmits<{ error: [] }>()
const { t } = useI18n()
const VideoPlayer = defineAsyncComponent(() => import('@/components/VideoPlayer.vue'))

const isShowImagePreview = filePreview.visible('image')

const isShowMarkDownDialog = filePreview.visible('markdown')

const isShowTextFileDialog = filePreview.visible('text')

const isShowVideoFileDialog = filePreview.visible('video')

const videoSources = filePreview.videoSources

const previewContent = computed(() => filePreview.preview.value?.content ?? '')

const markDownContent = computed(() => (isShowMarkDownDialog.value ? renderMarkdown(previewContent.value) : ''))
function handlePreviewError() {
  emit('error')
}
</script>
