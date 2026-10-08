<template>
  <nav
    class="flex shrink-0 flex-wrap items-center justify-between gap-x-4 gap-y-2 border-t border-border-secondary px-4 py-2.5"
    :aria-label="t('pages.manage.bucket.pagination')"
    :aria-busy="loading"
  >
    <div class="flex items-center gap-2 text-xs text-secondary" role="status" aria-live="polite">
      <LoaderCircleIcon
        v-if="loading"
        :size="14"
        class="animate-spin text-accent motion-reduce:animate-none"
        aria-hidden="true"
      />
      <span class="tabular-nums">
        {{
          loading
            ? t('navigation.loading')
            : lastPageNumber === null
              ? t('pages.manage.bucket.pagePositionUnknown', { current: currentPageNumber })
              : t('pages.manage.bucket.pagePosition', { current: currentPageNumber, total: lastPageNumber })
        }}
      </span>
      <span
        v-if="!loading && currentPageNumber === lastPageNumber"
        class="rounded bg-accent/10 px-2 py-0.5 font-medium text-accent"
      >
        {{ t('pages.manage.bucket.lastPage') }}
      </span>
    </div>

    <div class="ml-auto flex items-center gap-2">
      <button
        type="button"
        :class="pageButtonClass"
        :disabled="disabled || loading || currentPageNumber <= 1"
        @click="emit('change', currentPageNumber - 1)"
      >
        <ChevronLeftIcon :size="16" aria-hidden="true" />
        {{ t('pages.manage.bucket.previousPage') }}
      </button>
      <label class="flex items-center gap-1.5 text-sm text-secondary">
        {{ t('pages.manage.bucket.page') }}
        <select
          :value="currentPageNumber"
          :disabled="disabled || loading || availablePageCount <= 1"
          class="h-[32px] min-w-[64px] cursor-pointer rounded-lg border border-border bg-bg-secondary px-2 text-sm text-main tabular-nums focus:border-accent focus:outline-none focus-visible:focus-ring disabled:cursor-not-allowed disabled:opacity-50"
          @change="selectPage"
        >
          <option v-for="page in availablePageCount" :key="page" :value="page">{{ page }}</option>
        </select>
      </label>
      <button
        type="button"
        :class="pageButtonClass"
        :disabled="disabled || loading || currentPageNumber >= availablePageCount"
        @click="emit('change', currentPageNumber + 1)"
      >
        {{ t('pages.manage.bucket.nextPage') }}
        <ChevronRightIcon :size="16" aria-hidden="true" />
      </button>
    </div>
  </nav>
</template>

<script setup lang="ts">
import { ChevronLeftIcon, ChevronRightIcon, LoaderCircleIcon } from '@lucide/vue'
import { useI18n } from 'vue-i18n'

const props = defineProps<{
  currentPageNumber: number
  availablePageCount: number
  lastPageNumber: number | null
  loading: boolean
  disabled: boolean
}>()

const emit = defineEmits<{
  change: [page: number]
}>()

const { t } = useI18n()

const pageButtonClass =
  'flex h-[32px] cursor-pointer items-center justify-center gap-1 rounded-lg border border-border-secondary bg-bg-secondary px-2.5 text-sm text-main transition-colors duration-fast ease-apple not-disabled:hover:border-accent not-disabled:hover:text-accent focus-visible:focus-ring disabled:cursor-not-allowed disabled:opacity-50'

function selectPage(event: Event) {
  const select = event.target as HTMLSelectElement
  const page = Number(select.value)
  // Show the loaded page until navigation succeeds, including after a failed request.
  select.value = String(props.currentPageNumber)
  emit('change', page)
}
</script>
