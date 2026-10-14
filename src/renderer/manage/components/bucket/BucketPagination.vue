<template>
  <nav
    class="flex shrink-0 flex-wrap items-center gap-x-4 gap-y-2 border-t border-border-secondary px-4 py-2.5"
    :aria-label="t('pages.manage.bucket.pagination')"
    :aria-busy="loading"
  >
    <div class="flex min-w-0 items-center gap-2 text-xs text-secondary">
      <template v-if="loading">
        <LoaderCircleIcon
          :size="14"
          class="shrink-0 animate-spin text-accent motion-reduce:animate-none"
          aria-hidden="true"
        />
        <span class="truncate tabular-nums">{{ loadingText }}</span>
        <button
          type="button"
          class="flex h-[28px] shrink-0 cursor-pointer items-center gap-1 rounded-md px-2 text-xs font-medium text-secondary transition-colors duration-fast hover:bg-danger/10 hover:text-danger focus-visible:focus-ring"
          @click="emit('cancel')"
        >
          <XIcon :size="14" aria-hidden="true" />
          {{ t('common.cancel') }}
        </button>
      </template>
      <template v-else>
        <button
          v-tooltip="t('pages.manage.bucket.newestFilesTip')"
          type="button"
          class="flex h-[32px] shrink-0 cursor-pointer items-center gap-1.5 rounded-lg border border-border-secondary px-2.5 text-sm text-main transition-colors duration-fast not-disabled:hover:border-accent not-disabled:hover:text-accent focus-visible:focus-ring disabled:cursor-not-allowed disabled:opacity-50"
          :disabled="disabled"
          @click="emit('newest')"
        >
          <ClockArrowDownIcon :size="15" aria-hidden="true" />
          {{ t('pages.manage.bucket.newestFiles') }}
        </button>
        <span
          v-if="allPagesLoaded"
          class="flex shrink-0 items-center gap-1 rounded-md bg-accent/10 px-2 py-1 font-medium text-accent tabular-nums"
        >
          <CheckIcon :size="13" aria-hidden="true" />
          {{ t('pages.manage.bucket.itemCount', { num: totalItemCount.toLocaleString() }) }}
        </span>
        <HelpTooltip :content="scopeHint" />
      </template>
      <span class="sr-only" role="status" aria-live="polite">{{ loading ? loadingText : positionText }}</span>
    </div>

    <div :class="[toolGroupClass, 'ml-auto']">
      <button
        v-tooltip="t('pages.manage.bucket.firstPage')"
        type="button"
        :class="toolButtonClass"
        :disabled="disabled || loading || currentPageNumber <= 1"
        :aria-label="t('pages.manage.bucket.firstPage')"
        @click="emit('change', 1)"
      >
        <ChevronsLeftIcon :size="16" aria-hidden="true" />
      </button>
      <button
        v-tooltip="t('pages.manage.bucket.previousPage')"
        type="button"
        :class="toolButtonClass"
        :disabled="disabled || loading || currentPageNumber <= 1"
        :aria-label="t('pages.manage.bucket.previousPage')"
        @click="emit('change', currentPageNumber - 1)"
      >
        <ChevronLeftIcon :size="16" aria-hidden="true" />
      </button>
      <form
        class="mx-0.5 flex h-full items-center gap-1 border-x border-border-secondary px-1.5 text-sm text-secondary tabular-nums"
        @submit.prevent="submitPage"
      >
        <input
          v-model="draftPage"
          v-tooltip="t('pages.manage.bucket.jumpToPageTip')"
          type="number"
          inputmode="numeric"
          min="1"
          :max="lastPageNumber ?? undefined"
          step="1"
          required
          :disabled="disabled || loading"
          :aria-label="t('pages.manage.bucket.page')"
          class="h-[24px] w-[44px] [appearance:textfield] rounded-md border border-transparent bg-transparent px-1 text-center text-sm text-main transition-colors duration-fast not-disabled:hover:border-border focus:border-accent focus:bg-bg-secondary focus:outline-none focus-visible:focus-ring disabled:cursor-not-allowed disabled:opacity-50 [&::-webkit-inner-spin-button]:appearance-none [&::-webkit-outer-spin-button]:appearance-none"
          @focus="($event.target as HTMLInputElement).select()"
          @blur="resetDraft"
          @keydown.esc="resetDraft"
        />
        <span aria-hidden="true">/</span>
        <span v-if="lastPageNumber !== null" class="text-main">{{ lastPageNumber }}</span>
        <span v-else v-tooltip="t('pages.manage.bucket.findLastPageTip')">{{ availablePageCount }}+</span>
      </form>
      <button
        v-tooltip="t('pages.manage.bucket.nextPage')"
        type="button"
        :class="toolButtonClass"
        :disabled="disabled || loading || currentPageNumber >= availablePageCount"
        :aria-label="t('pages.manage.bucket.nextPage')"
        @click="emit('change', currentPageNumber + 1)"
      >
        <ChevronRightIcon :size="16" aria-hidden="true" />
      </button>
      <button
        v-tooltip="
          lastPageNumber === null ? t('pages.manage.bucket.findLastPageTip') : t('pages.manage.bucket.lastPage')
        "
        type="button"
        :class="toolButtonClass"
        :disabled="disabled || loading || currentPageNumber === lastPageNumber"
        :aria-label="t('pages.manage.bucket.lastPage')"
        @click="emit('last')"
      >
        <ChevronsRightIcon :size="16" aria-hidden="true" />
      </button>
    </div>
  </nav>
</template>

<script setup lang="ts">
import {
  CheckIcon,
  ChevronLeftIcon,
  ChevronRightIcon,
  ChevronsLeftIcon,
  ChevronsRightIcon,
  ClockArrowDownIcon,
  LoaderCircleIcon,
  XIcon,
} from '@lucide/vue'
import { computed, ref, watch } from 'vue'
import { useI18n } from 'vue-i18n'

import HelpTooltip from '@/components/common/HelpTooltip.vue'
import { vTooltip } from '@/directives/tooltip'

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

watch(() => [props.currentPageNumber, props.loading], resetDraft)

// Same segmented-group look as the bucket toolbar.
const toolGroupClass = 'flex h-[32px] items-center gap-0.5 rounded-lg border border-border-secondary p-0.5'

const toolButtonClass =
  'flex h-full min-w-[28px] cursor-pointer items-center justify-center rounded-md px-1.5 text-secondary transition-colors duration-fast not-disabled:hover:bg-accent/10 not-disabled:hover:text-accent focus-visible:focus-ring disabled:cursor-not-allowed disabled:opacity-40'

const loadingText = computed(() => {
  if (props.findingNewest)
    return t('pages.manage.bucket.scanningNewest', { num: props.scannedItemCount.toLocaleString() })
  if (props.loadingPage !== null) return t('pages.manage.bucket.loadingPage', { page: props.loadingPage })
  return t('navigation.loading')
})

const positionText = computed(() =>
  props.lastPageNumber === null
    ? t('pages.manage.bucket.pagePositionUnknown', { current: props.currentPageNumber })
    : t('pages.manage.bucket.pagePosition', { current: props.currentPageNumber, total: props.lastPageNumber }),
)

const scopeHint = computed(() =>
  props.allPagesLoaded
    ? t('pages.manage.bucket.allPagesSort', { num: props.totalItemCount.toLocaleString() })
    : t('pages.manage.bucket.currentPageSort'),
)

function resetDraft() {
  draftPage.value = String(props.currentPageNumber)
}

function submitPage() {
  const page = Number(draftPage.value)
  // Show the loaded page until navigation succeeds, including after a failed request.
  resetDraft()
  if (!Number.isSafeInteger(page) || page < 1 || (props.lastPageNumber !== null && page > props.lastPageNumber)) return
  emit('change', page)
}
</script>
