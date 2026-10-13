<template>
  <nav
    class="flex shrink-0 flex-wrap items-center justify-between gap-x-4 gap-y-2 border-t border-border-secondary px-4 py-2.5"
    :aria-label="t('pages.manage.bucket.pagination')"
    :aria-busy="loading"
  >
    <div class="flex flex-wrap items-center gap-2 text-xs text-secondary" role="status" aria-live="polite">
      <LoaderCircleIcon
        v-if="loading"
        :size="14"
        class="animate-spin text-accent motion-reduce:animate-none"
        aria-hidden="true"
      />
      <span class="tabular-nums">
        {{
          loading
            ? findingNewest
              ? t('pages.manage.bucket.scanningNewest', { num: scannedItemCount })
              : loadingPage !== null
                ? t('pages.manage.bucket.loadingPage', { page: loadingPage })
                : t('navigation.loading')
            : lastPageNumber === null
              ? t('pages.manage.bucket.pagePositionUnknown', { current: currentPageNumber })
              : t('pages.manage.bucket.pagePosition', { current: currentPageNumber, total: lastPageNumber })
        }}
      </span>
      <button v-if="loading" type="button" :class="pageButtonClass" @click="emit('cancel')">
        {{ t('common.cancel') }}
      </button>
      <button
        v-else
        type="button"
        :class="pageButtonClass"
        :disabled="disabled"
        :title="t('pages.manage.bucket.newestFilesTip')"
        @click="emit('newest')"
      >
        <ClockArrowDownIcon :size="16" aria-hidden="true" />
        {{ t('pages.manage.bucket.newestFiles') }}
      </button>
      <span
        v-if="!loading && currentPageNumber === lastPageNumber"
        class="rounded bg-accent/10 px-2 py-0.5 font-medium text-accent"
      >
        {{ t('pages.manage.bucket.lastPage') }}
      </span>
    </div>

    <div class="ml-auto flex flex-wrap items-center gap-2">
      <button
        type="button"
        :class="[pageButtonClass, 'w-[32px] px-0!']"
        :disabled="disabled || loading || currentPageNumber <= 1"
        :aria-label="t('pages.manage.bucket.firstPage')"
        :title="t('pages.manage.bucket.firstPage')"
        @click="emit('change', 1)"
      >
        <ChevronsLeftIcon :size="16" aria-hidden="true" />
      </button>
      <button
        type="button"
        :class="pageButtonClass"
        :disabled="disabled || loading || currentPageNumber <= 1"
        @click="emit('change', currentPageNumber - 1)"
      >
        <ChevronLeftIcon :size="16" aria-hidden="true" />
        {{ t('pages.manage.bucket.previousPage') }}
      </button>
      <form class="flex items-center gap-1.5" @submit.prevent="submitPage">
        <label class="flex items-center gap-1.5 text-sm text-secondary">
          {{ t('pages.manage.bucket.page') }}
          <input
            v-model="draftPage"
            type="number"
            min="1"
            :max="lastPageNumber ?? undefined"
            step="1"
            required
            :disabled="disabled || loading"
            :title="t('pages.manage.bucket.jumpToPageTip')"
            class="h-[32px] w-[72px] rounded-lg border border-border bg-bg-secondary px-2 text-sm text-main tabular-nums focus:border-accent focus:outline-none focus-visible:focus-ring disabled:cursor-not-allowed disabled:opacity-50"
          />
        </label>
        <button type="submit" :class="pageButtonClass" :disabled="disabled || loading">
          {{ t('pages.manage.bucket.goToPage') }}
        </button>
      </form>
      <button
        type="button"
        :class="pageButtonClass"
        :disabled="disabled || loading || currentPageNumber >= availablePageCount"
        @click="emit('change', currentPageNumber + 1)"
      >
        {{ t('pages.manage.bucket.nextPage') }}
        <ChevronRightIcon :size="16" aria-hidden="true" />
      </button>
      <button
        type="button"
        :class="[pageButtonClass, 'w-[32px] px-0!']"
        :disabled="disabled || loading || currentPageNumber === lastPageNumber"
        :aria-label="t('pages.manage.bucket.lastPage')"
        :title="lastPageNumber === null ? t('pages.manage.bucket.findLastPageTip') : t('pages.manage.bucket.lastPage')"
        @click="emit('last')"
      >
        <ChevronsRightIcon :size="16" aria-hidden="true" />
      </button>
    </div>
    <p class="m-0 w-full text-xs text-secondary">
      {{
        allPagesLoaded
          ? t('pages.manage.bucket.allPagesSort', { num: totalItemCount })
          : t('pages.manage.bucket.currentPageSort')
      }}
    </p>
  </nav>
</template>

<script setup lang="ts">
import {
  ChevronLeftIcon,
  ChevronRightIcon,
  ChevronsLeftIcon,
  ChevronsRightIcon,
  ClockArrowDownIcon,
  LoaderCircleIcon,
} from '@lucide/vue'
import { ref, watch } from 'vue'
import { useI18n } from 'vue-i18n'

const props = defineProps<{
  currentPageNumber: number
  availablePageCount: number
  lastPageNumber: number | null
  allPagesLoaded: boolean
  totalItemCount: number
  loadingPage: number | null
  findingNewest: boolean
  scannedItemCount: number
  loading: boolean
  disabled: boolean
}>()

const emit = defineEmits<{
  change: [page: number]
  last: []
  newest: []
  cancel: []
}>()

const { t } = useI18n()
const draftPage = ref(String(props.currentPageNumber))

watch(
  () => [props.currentPageNumber, props.loading],
  () => {
    draftPage.value = String(props.currentPageNumber)
  },
)

const pageButtonClass =
  'flex h-[32px] cursor-pointer items-center justify-center gap-1 rounded-lg border border-border-secondary bg-bg-secondary px-2 text-sm text-main transition-colors duration-fast ease-apple not-disabled:hover:border-accent not-disabled:hover:text-accent focus-visible:focus-ring disabled:cursor-not-allowed disabled:opacity-50'

function submitPage() {
  const page = Number(draftPage.value)
  // Show the loaded page until navigation succeeds, including after a failed request.
  draftPage.value = String(props.currentPageNumber)
  if (!Number.isSafeInteger(page) || page < 1 || (props.lastPageNumber !== null && page > props.lastPageNumber)) return
  emit('change', page)
}
</script>
