<template>
  <CustomModal
    v-model:visible="isShowDownloadPanel"
    :title="t('pages.manage.bucket.downloadPage')"
    width="900px"
    height="90vh"
  >
    <div class="no-scrollbar h-full w-full flex-1 overflow-hidden rounded-md border border-border p-4 shadow-md">
      <div class="flex h-full w-full flex-col">
        <div
          v-if="failed"
          role="status"
          class="mb-3 flex items-center justify-between gap-3 rounded-md bg-warning/10 p-3 text-sm text-main"
        >
          <span>{{ t('pages.manage.bucket.loadingFailed') }}</span>
          <CustomButton type="secondary" :text="t('common.bulk.retry')" @click="emit('refresh')" />
        </div>
        <!-- Download Tasks Tabs -->
        <div class="flex flex-1 flex-col gap-2 overflow-hidden border-t border-border-secondary">
          <div class="flex shrink-0 border-b border-b-border">
            <button
              class="relative flex-1 rounded-md border-b-2 border-b-transparent bg-none px-6 py-3 text-sm font-semibold text-secondary shadow-sm transition-all duration-fast ease-apple hover:border-b-accent hover:text-main [.active]:border-b-accent [.active]:bg-accent [.active]:text-white"
              :class="{ active: activeDownLoadTab === 'downloading' }"
              @click="activeDownLoadTab = 'downloading'"
            >
              {{ t('pages.manage.bucket.downloading') }}
              <span
                v-if="downloadingTaskList.length"
                class="absolute top-1 right-1 min-w-[16px] rounded-full bg-accent px-1.5 py-0.5 text-center text-xs text-white"
              >
                {{ downloadingTaskList.length }}
              </span>
            </button>
            <button
              class="relative flex-1 rounded-md border-b-2 border-b-transparent bg-none px-6 py-3 text-sm font-semibold text-secondary shadow-sm transition-all duration-fast ease-apple hover:border-b-accent hover:text-main [.active]:border-b-accent [.active]:bg-accent [.active]:text-white"
              :class="{ active: activeDownLoadTab === 'finished' }"
              @click="activeDownLoadTab = 'finished'"
            >
              {{ t('pages.manage.bucket.success') }}
              <span
                v-if="downloadedTaskList.filter(item => item.status === 'downloaded').length"
                class="absolute top-1 right-1 min-w-[16px] rounded-full bg-accent px-1.5 py-0.5 text-center text-xs text-white"
              >
                {{ downloadedTaskList.filter(item => item.status === 'downloaded').length }}
              </span>
            </button>
            <button
              class="relative flex-1 rounded-md border-b-2 border-b-transparent bg-none px-6 py-3 text-sm font-semibold text-secondary shadow-sm transition-all duration-fast ease-apple hover:border-b-accent hover:text-main [.active]:border-b-accent [.active]:bg-accent [.active]:text-white"
              :class="{ active: activeDownLoadTab === 'failed' }"
              @click="activeDownLoadTab = 'failed'"
            >
              {{ t('pages.manage.bucket.failed') }}
              <span
                v-if="downloadedTaskList.filter(item => item.status !== 'downloaded').length"
                class="absolute top-1 right-1 min-w-[16px] rounded-full bg-accent px-1.5 py-0.5 text-center text-xs text-white"
              >
                {{ downloadedTaskList.filter(item => item.status !== 'downloaded').length }}
              </span>
            </button>
          </div>

          <div class="flex flex-row justify-center gap-3 rounded-md border border-border shadow-sm">
            <CustomButton
              type="secondary"
              :text="t('pages.manage.bucket.copyDownloadTask')"
              :icon="CopyIcon"
              @click="emit('copy')"
            />
            <CustomButton
              type="secondary"
              :text="t('pages.manage.bucket.clearFinishedTasks')"
              :icon="Trash2Icon"
              @click="emit('clear-finished')"
            />
            <CustomButton
              type="secondary"
              :text="t('pages.manage.bucket.clearAll')"
              :icon="Trash2Icon"
              @click="emit('clear-all')"
            />
            <CustomButton
              type="secondary"
              :text="t('pages.manage.bucket.openDownloadFolder')"
              :icon="FolderIcon"
              @click="emit('open-folder')"
            />
          </div>

          <div
            class="flex min-h-0 w-full flex-1 flex-col overflow-hidden rounded-md border border-border-secondary p-2"
          >
            <!-- Downloading Tab -->
            <VirtualScroller
              :items="
                activeDownLoadTab === 'downloading'
                  ? downloadingTaskList
                  : activeDownLoadTab === 'finished'
                    ? downloadedTaskList.filter(item => item.status === 'downloaded')
                    : downloadedTaskList.filter(item => item.status !== 'downloaded')
              "
              :item-height="70"
              class="min-h-0 w-full flex-1 p-3"
              view-mode="list"
            >
              <template #default="{ item }">
                <div
                  class="m-0 flex w-full cursor-pointer items-center gap-3 rounded-md border border-border bg-bg-secondary px-4 py-3 hover:border-accent hover:shadow-md"
                >
                  <div class="flex flex-1 flex-col gap-1">
                    <div class="overflow-hidden text-sm font-medium text-ellipsis whitespace-nowrap text-secondary">
                      {{ item.sourceFileName }}
                    </div>
                    <div
                      v-if="activeDownLoadTab === 'downloading'"
                      class="relative h-[8px] w-full overflow-hidden rounded-[4px] bg-surface-elevated"
                    >
                      <div
                        class="h-full rounded-[4px] bg-accent transition-all duration-300 ease-apple"
                        :style="{ width: `${item.progress}%` }"
                      />
                    </div>
                    <div v-else class="flex gap-4 text-xs text-secondary">
                      <span>{{ item.finishTime }}</span>
                      <span class="text-xs font-semibold text-success">
                        {{
                          activeDownLoadTab === 'finished'
                            ? t('pages.manage.bucket.success')
                            : t('pages.manage.bucket.failed')
                        }}
                      </span>
                      <span v-if="item.response?.reason === 'interrupted'">{{
                        t('pages.manage.bucket.downloadInterrupted')
                      }}</span>
                    </div>
                  </div>
                </div>
              </template>
            </VirtualScroller>
          </div>
        </div>
      </div>
    </div>
  </CustomModal>
</template>

<script setup lang="ts">
import { CopyIcon, FolderIcon, Trash2Icon } from '@lucide/vue'
import { computed, ref } from 'vue'
import { useI18n } from 'vue-i18n'

import CustomButton from '@/components/common/CustomButton.vue'
import CustomModal from '@/components/common/CustomModal.vue'
import VirtualScroller from '@/components/VirtualScroller.vue'

const isShowDownloadPanel = defineModel<boolean>('visible', { required: true })
const { tasks: downloadTaskList } = defineProps<{ tasks: IDownloadTask[]; failed: boolean }>()
const emit = defineEmits<{ refresh: []; copy: []; 'clear-finished': []; 'clear-all': []; 'open-folder': [] }>()
const { t } = useI18n()
const activeDownLoadTab = ref('downloading')

const downloadingTaskList = computed(() =>
  downloadTaskList.filter(item => ['downloading', 'queuing', 'paused'].includes(item.status)),
)

const downloadedTaskList = computed(() =>
  downloadTaskList.filter(item => ['downloaded', 'failed', 'canceled'].includes(item.status)),
)
</script>
