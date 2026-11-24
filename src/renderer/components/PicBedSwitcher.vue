<template>
  <button
    ref="trigger"
    type="button"
    class="flex cursor-pointer items-center gap-2 rounded-lg border-none bg-accent px-4 py-2.5 font-[inherit] text-sm font-medium text-white shadow-sm transition-all duration-fast ease-standard hover:bg-accent-hover hover:shadow-md focus-visible:focus-ring active:scale-[0.98] aria-disabled:cursor-wait max-md:flex-1 max-md:justify-center max-xs:px-3 max-xs:py-2 max-xs:text-[0.8rem]"
    aria-haspopup="dialog"
    :aria-expanded="open"
    :aria-controls="open ? panelId : undefined"
    :aria-busy="switching"
    :aria-disabled="switching && !open"
    @click="toggle"
    @keydown.down.prevent="show"
  >
    <ArrowLeftRightIcon :size="14" class="shrink-0 opacity-90" aria-hidden="true" />
    <span>{{ t('pages.upload.changePicBed') }}</span>
    <ChevronDownIcon
      :size="14"
      class="shrink-0 transition-transform duration-fast ease-apple"
      :class="{ 'rotate-180': open }"
      aria-hidden="true"
    />
  </button>

  <Teleport to="body">
    <Transition
      enter-active-class="transition-[opacity,transform] duration-fast ease-apple motion-reduce:transition-none"
      enter-from-class="scale-[0.97] -translate-y-1 opacity-0"
      leave-active-class="transition-[opacity,transform] duration-100 ease-standard motion-reduce:transition-none"
      leave-to-class="scale-[0.98] opacity-0"
    >
      <div
        v-if="open"
        :id="panelId"
        ref="panel"
        role="dialog"
        :aria-label="t('pages.upload.changePicBed')"
        class="fixed z-100 flex min-h-0 flex-col overflow-hidden rounded-2xl border border-border bg-bg-tertiary text-main shadow-xl"
        :style="panelStyle"
        @keydown.esc="handleEscape"
        @keydown.tab="handleTab"
      >
        <!-- Top Command Search Header -->
        <div class="flex shrink-0 items-center gap-2 border-b border-border-secondary px-3 py-2.5">
          <div class="relative min-w-0 flex-1">
            <SearchIcon
              :size="15"
              class="pointer-events-none absolute top-1/2 left-3 -translate-y-1/2 text-tertiary"
              aria-hidden="true"
            />
            <input
              ref="searchInput"
              v-model="query"
              role="combobox"
              type="text"
              autocomplete="off"
              spellcheck="false"
              aria-autocomplete="list"
              aria-expanded="true"
              :aria-haspopup="activeListId === providerListId ? 'listbox' : 'grid'"
              :aria-controls="activeListId"
              :aria-activedescendant="activeDescendantId"
              :aria-label="t('pages.upload.picbedPicker.search')"
              :placeholder="t('pages.upload.picbedPicker.search')"
              :disabled="switching"
              class="h-9 w-full rounded-xl border border-border bg-bg-secondary/80 pr-8 pl-9 text-sm text-main transition-colors duration-fast placeholder:text-tertiary focus:border-accent focus:bg-bg-tertiary focus:outline-none disabled:opacity-60"
              @keydown.down="move(1, $event)"
              @keydown.up="move(-1, $event)"
              @keydown.right="handleRightKey($event)"
              @keydown.left="handleLeftKey($event)"
              @keydown.enter="selectActive($event)"
            />
            <button
              v-if="query"
              type="button"
              :aria-label="t('pages.upload.picbedPicker.clearSearch')"
              :disabled="switching"
              class="absolute top-1/2 right-2 flex size-6 -translate-y-1/2 cursor-pointer items-center justify-center rounded-md text-secondary transition-colors duration-fast hover:bg-bg-secondary hover:text-main focus-visible:focus-ring disabled:cursor-wait"
              @click="clearSearch"
            >
              <XIcon :size="14" aria-hidden="true" />
            </button>
          </div>
        </div>

        <!-- Loading State -->
        <div
          v-if="showLoading"
          role="status"
          class="flex h-[240px] items-center justify-center gap-2 px-4 text-sm text-secondary"
        >
          <LoaderCircleIcon :size="16" class="animate-spin text-accent" aria-hidden="true" />
          <span>{{ t('pages.upload.picbedPicker.loading') }}</span>
        </div>

        <!-- Error State -->
        <div
          v-else-if="showError"
          role="alert"
          class="flex h-[240px] flex-col items-center justify-center gap-3 px-4 text-center text-sm text-secondary"
        >
          <p class="m-0">{{ t('pages.upload.picbedPicker.loadFailed') }}</p>
          <button
            type="button"
            class="cursor-pointer rounded-lg border border-accent/30 bg-accent/10 px-3.5 py-1.5 text-xs font-medium text-accent transition-colors duration-fast hover:bg-accent/15 focus-visible:focus-ring"
            @click="loadTargets"
          >
            {{ t('pages.upload.picbedPicker.retry') }}
          </button>
        </div>

        <!-- Empty State -->
        <div
          v-else-if="!filteredTargets.length"
          role="status"
          class="flex h-[240px] flex-col items-center justify-center gap-3 px-6 text-center text-sm text-secondary"
        >
          <div class="flex size-11 items-center justify-center rounded-2xl bg-bg-secondary text-tertiary">
            <SearchIcon v-if="isSearching" :size="20" aria-hidden="true" />
            <CloudIcon v-else :size="20" aria-hidden="true" />
          </div>
          <p class="m-0 text-secondary">
            {{ t(isSearching ? 'pages.upload.picbedPicker.noMatches' : 'pages.upload.picbedPicker.empty') }}
          </p>
          <button
            v-if="isSearching"
            type="button"
            class="cursor-pointer rounded-lg border border-accent/30 bg-accent/10 px-3 py-1.5 text-xs font-medium text-accent transition-colors duration-fast hover:bg-accent/15 focus-visible:focus-ring"
            @click="clearSearch"
          >
            {{ t('pages.upload.picbedPicker.clearSearch') }}
          </button>
        </div>

        <!-- Search Mode: Unified Flat Ranked List -->
        <div
          v-else-if="isSearching"
          :id="searchListId"
          role="grid"
          :aria-label="t('pages.upload.changePicBed')"
          :aria-busy="loading || switching"
          class="flex min-h-0 flex-1 flex-col gap-1 overflow-y-auto overscroll-contain scroll-fade-y p-2.5 [&::-webkit-scrollbar]:w-1.5 [&::-webkit-scrollbar-thumb]:rounded-full [&::-webkit-scrollbar-thumb]:bg-transparent hover:[&::-webkit-scrollbar-thumb]:bg-border [&::-webkit-scrollbar-thumb:hover]:bg-tertiary"
          :style="bodyHeightStyle"
        >
          <div
            v-for="(target, index) in rankedSearchResults"
            :id="searchRowId(target)"
            :key="targetKey(target)"
            role="row"
            :aria-label="`${target.name} — ${target.configName}`"
            :aria-selected="isSelected(target)"
            :aria-disabled="switching"
            class="group/row flex cursor-pointer items-center gap-2.5 rounded-xl border px-3 py-2 text-sm transition-all duration-fast"
            :class="searchRowClass(target, index)"
            @pointermove="activeSearchKey = targetKey(target)"
            @mousedown.prevent
            @click="select(target)"
          >
            <span
              class="flex size-5 shrink-0 items-center justify-center rounded-full transition-colors duration-fast"
              :class="
                isPending(target)
                  ? 'bg-accent/10 text-accent'
                  : isSelected(target)
                    ? 'bg-accent text-white'
                    : 'border border-border bg-bg-secondary/70 group-hover/row:border-accent/50'
              "
              aria-hidden="true"
            >
              <LoaderCircleIcon v-if="isPending(target)" :size="13" class="animate-spin" />
              <CheckIcon v-else-if="isSelected(target)" :size="12" :stroke-width="2.75" />
            </span>

            <div role="gridcell" class="flex min-w-0 flex-1 items-center gap-2">
              <span
                v-tooltip.overflow="target.configName"
                class="min-w-0 truncate text-[13px]"
                :class="isSelected(target) ? 'font-semibold text-accent' : 'font-medium text-main'"
              >
                <HighlightText :text="target.configName" />
              </span>
              <span
                v-tooltip.overflow="target.name"
                class="max-w-[42%] shrink-0 truncate rounded-md bg-bg-secondary px-1.5 py-0.5 text-[11px] font-medium text-secondary"
              >
                <HighlightText :text="target.name" />
              </span>
            </div>

            <span
              v-if="isSelected(target)"
              aria-hidden="true"
              class="shrink-0 rounded-full bg-accent/12 px-2 py-0.5 text-[10px] font-semibold text-accent"
            >
              {{ t('pages.upload.picbedPicker.selected') }}
            </span>

            <div role="gridcell" class="flex shrink-0 items-center gap-0.5">
              <button
                v-if="target.configId"
                v-tooltip="favoriteButtonTooltip(target)"
                type="button"
                :aria-label="actionLabel(favoriteButtonTooltip(target), target)"
                :tabindex="index === activeSearchIndex ? 0 : -1"
                :aria-pressed="isFavorite(target)"
                :disabled="switching || (!isFavorite(target) && isFavoritesFull)"
                class="flex size-7 cursor-pointer items-center justify-center rounded-lg transition-all duration-fast focus-visible:focus-ring disabled:cursor-not-allowed disabled:opacity-40"
                :class="
                  isFavorite(target)
                    ? 'text-warning hover:bg-warning/10'
                    : 'text-tertiary opacity-0 group-focus-within/row:opacity-100 group-hover/row:opacity-100 hover:bg-bg-secondary hover:text-warning focus-visible:opacity-100 [@media(hover:none)]:opacity-100'
                "
                @mousedown.prevent
                @click.stop="toggleFavorite(target, $event)"
              >
                <StarIcon :size="14" :class="{ 'fill-current': isFavorite(target) }" aria-hidden="true" />
              </button>
              <button
                v-tooltip="t('pages.upload.picbedPicker.editConfig')"
                type="button"
                :aria-label="actionLabel(t('pages.upload.picbedPicker.editConfig'), target)"
                :tabindex="index === activeSearchIndex ? 0 : -1"
                :disabled="switching"
                class="flex size-7 cursor-pointer items-center justify-center rounded-lg text-tertiary opacity-0 transition-all duration-fast group-focus-within/row:opacity-100 group-hover/row:opacity-100 hover:bg-bg-secondary hover:text-main focus-visible:opacity-100 focus-visible:focus-ring disabled:cursor-not-allowed [@media(hover:none)]:opacity-100"
                @mousedown.prevent
                @click.stop="openEditConfig(target)"
              >
                <PencilIcon :size="13" aria-hidden="true" />
              </button>
            </div>
          </div>
        </div>

        <!-- Browse Mode: Master-Detail Dual-Pane Layout -->
        <div
          v-else
          class="flex min-h-0 flex-1 overflow-hidden"
          :class="isCompactLayout ? 'flex-col' : 'flex-row'"
          :style="bodyHeightStyle"
        >
          <!-- Left / Top Pane: Providers Rail -->
          <div
            :id="providerListId"
            role="listbox"
            :aria-label="t('pages.upload.picbedPicker.providers')"
            :class="
              isCompactLayout
                ? 'no-scrollbar flex shrink-0 items-center gap-1 overflow-x-auto border-b border-border-secondary bg-bg-secondary/40 scroll-fade-x px-2.5 py-2'
                : 'flex w-[196px] shrink-0 flex-col gap-0.5 overflow-y-auto overscroll-contain border-r border-border-secondary bg-bg-secondary/40 scroll-fade-y p-2 [&::-webkit-scrollbar]:w-1 [&::-webkit-scrollbar-thumb]:rounded-full [&::-webkit-scrollbar-thumb]:bg-transparent hover:[&::-webkit-scrollbar-thumb]:bg-border [&::-webkit-scrollbar-thumb:hover]:bg-tertiary'
            "
          >
            <div
              v-for="group in groups"
              :id="providerRowId(group.type)"
              :key="group.type"
              role="option"
              :aria-selected="group.type === focusedProviderType"
              :aria-disabled="switching"
              class="flex cursor-pointer items-center gap-2 rounded-lg text-[13px] transition-all duration-fast select-none"
              :class="[isCompactLayout ? 'shrink-0 px-2.5 py-1.5' : 'px-2.5 py-2', providerRowClass(group.type)]"
              @mousedown.prevent
              @click="inspectProvider(group.type)"
              @dblclick="handleProviderDblClick(group)"
            >
              <span
                class="size-1.5 shrink-0 rounded-full transition-colors duration-fast"
                :class="
                  group.type === defaultPicBedG
                    ? 'bg-accent'
                    : group.type === focusedProviderType
                      ? 'bg-tertiary/60'
                      : 'bg-transparent'
                "
                aria-hidden="true"
              />
              <span v-tooltip.overflow="group.name" class="min-w-0 flex-1 truncate" data-tooltip-overflow>
                {{ group.name }}
              </span>
              <span
                v-if="group.targets.length > 1"
                class="shrink-0 rounded-full px-1.5 py-px text-[10px] font-medium tabular-nums"
                :class="
                  group.type === focusedProviderType && activePane === 'providers'
                    ? 'bg-accent/15 text-accent'
                    : 'bg-bg-secondary text-tertiary'
                "
                aria-hidden="true"
              >
                {{ group.targets.length }}
              </span>
            </div>
          </div>

          <!-- Right / Bottom Pane: Configurations of Focused Provider -->
          <div v-if="focusedGroup" class="flex min-h-0 min-w-0 flex-1 flex-col overflow-hidden bg-bg-tertiary">
            <!-- Provider Sub-Header -->
            <div
              class="flex shrink-0 items-center justify-between gap-2 border-b border-border-secondary px-3.5 py-2.5"
            >
              <div class="flex min-w-0 items-center gap-2.5">
                <div
                  class="flex size-7 shrink-0 items-center justify-center rounded-lg transition-colors duration-fast"
                  :class="
                    focusedGroup.type === defaultPicBedG ? 'bg-accent/12 text-accent' : 'bg-bg-secondary text-secondary'
                  "
                  aria-hidden="true"
                >
                  <CloudIcon :size="15" />
                </div>
                <div class="flex min-w-0 flex-col">
                  <span
                    v-tooltip.overflow="focusedGroup.name"
                    class="truncate text-sm leading-tight font-semibold text-main"
                  >
                    {{ focusedGroup.name }}
                  </span>
                </div>
              </div>
              <button
                v-tooltip="t('pages.upload.picbedPicker.manageConfigs')"
                type="button"
                :aria-label="`${t('pages.upload.picbedPicker.manageConfigs')} ${focusedGroup.name}`"
                :disabled="switching"
                class="inline-flex shrink-0 cursor-pointer items-center gap-1.5 rounded-lg border border-border-secondary bg-bg-secondary/70 px-2.5 py-1.5 text-xs font-medium text-secondary transition-colors duration-fast hover:border-border hover:bg-bg-secondary hover:text-main focus-visible:focus-ring disabled:cursor-not-allowed disabled:opacity-50"
                @mousedown.prevent
                @click="openManageConfigs(focusedGroup.type)"
              >
                <Settings2Icon :size="13" aria-hidden="true" />
                <span>{{ t('pages.upload.picbedPicker.manageConfigs') }}</span>
              </button>
            </div>

            <!-- Configuration Cards -->
            <div
              :id="configListId"
              role="grid"
              :aria-label="`${focusedGroup.name} ${t('pages.upload.picbedPicker.configurations')}`"
              :aria-busy="loading || switching"
              class="flex min-h-0 flex-1 flex-col gap-1.5 overflow-y-auto overscroll-contain scroll-fade-y p-2.5 [&::-webkit-scrollbar]:w-1.5 [&::-webkit-scrollbar-thumb]:rounded-full [&::-webkit-scrollbar-thumb]:bg-transparent hover:[&::-webkit-scrollbar-thumb]:bg-border [&::-webkit-scrollbar-thumb:hover]:bg-tertiary"
            >
              <div
                v-for="target in focusedGroup.targets"
                :id="configRowId(target)"
                :key="targetKey(target)"
                role="row"
                :aria-label="`${focusedGroup.name} — ${target.configName}`"
                :aria-selected="isSelected(target)"
                :aria-disabled="switching"
                class="group/card flex cursor-pointer items-center gap-2.5 rounded-xl border px-3 py-2.5 transition-all duration-fast"
                :class="configCardClass(target)"
                @pointermove="setActiveConfig(target)"
                @mousedown.prevent
                @click="select(target)"
              >
                <span
                  class="flex size-5 shrink-0 items-center justify-center rounded-full transition-colors duration-fast"
                  :class="
                    isPending(target)
                      ? 'bg-accent/10 text-accent'
                      : isSelected(target)
                        ? 'bg-accent text-white'
                        : isConfigKeyboardFocused(target)
                          ? 'border border-accent bg-accent/10'
                          : 'border border-border bg-bg-secondary/60 group-hover/card:border-accent/50'
                  "
                  aria-hidden="true"
                >
                  <LoaderCircleIcon v-if="isPending(target)" :size="13" class="animate-spin" />
                  <CheckIcon v-else-if="isSelected(target)" :size="12" :stroke-width="2.75" />
                  <span v-else-if="isConfigKeyboardFocused(target)" class="size-1.5 rounded-full bg-accent" />
                </span>

                <div role="gridcell" class="flex min-w-0 flex-1 items-center gap-2">
                  <span
                    v-tooltip.overflow="target.configName"
                    class="min-w-0 truncate text-[13px]"
                    :class="isSelected(target) ? 'font-semibold text-accent' : 'font-medium text-main'"
                    data-tooltip-overflow
                  >
                    {{ target.configName }}
                  </span>
                  <span
                    v-if="isSelected(target)"
                    class="shrink-0 rounded-full bg-accent/12 px-2 py-0.5 text-[10px] font-semibold text-accent"
                  >
                    {{ t('pages.upload.picbedPicker.selected') }}
                  </span>
                </div>

                <div role="gridcell" class="flex shrink-0 items-center gap-0.5">
                  <button
                    v-if="target.configId"
                    v-tooltip="favoriteButtonTooltip(target)"
                    type="button"
                    :aria-label="actionLabel(favoriteButtonTooltip(target), target)"
                    :tabindex="isConfigKeyboardFocused(target) ? 0 : -1"
                    :aria-pressed="isFavorite(target)"
                    :disabled="switching || (!isFavorite(target) && isFavoritesFull)"
                    class="flex size-7 cursor-pointer items-center justify-center rounded-lg transition-all duration-fast focus-visible:focus-ring disabled:cursor-not-allowed disabled:opacity-40"
                    :class="
                      isFavorite(target)
                        ? 'text-warning hover:bg-warning/10'
                        : 'text-tertiary opacity-0 group-focus-within/card:opacity-100 group-hover/card:opacity-100 hover:bg-bg-secondary hover:text-warning focus-visible:opacity-100 [@media(hover:none)]:opacity-100'
                    "
                    @mousedown.prevent
                    @click.stop="toggleFavorite(target, $event)"
                  >
                    <StarIcon :size="14" :class="{ 'fill-current': isFavorite(target) }" aria-hidden="true" />
                  </button>
                  <button
                    v-tooltip="t('pages.upload.picbedPicker.editConfig')"
                    type="button"
                    :aria-label="actionLabel(t('pages.upload.picbedPicker.editConfig'), target)"
                    :tabindex="isConfigKeyboardFocused(target) ? 0 : -1"
                    :disabled="switching"
                    class="flex size-7 cursor-pointer items-center justify-center rounded-lg text-tertiary opacity-0 transition-all duration-fast group-focus-within/card:opacity-100 group-hover/card:opacity-100 hover:bg-bg-secondary hover:text-main focus-visible:opacity-100 focus-visible:focus-ring disabled:cursor-not-allowed [@media(hover:none)]:opacity-100"
                    @mousedown.prevent
                    @click.stop="openEditConfig(target)"
                  >
                    <PencilIcon :size="13" aria-hidden="true" />
                  </button>
                </div>
              </div>
            </div>
          </div>
        </div>
      </div>
    </Transition>
  </Teleport>
</template>

<script setup lang="ts">
import {
  ArrowLeftRightIcon,
  CheckIcon,
  ChevronDownIcon,
  CloudIcon,
  LoaderCircleIcon,
  PencilIcon,
  SearchIcon,
  Settings2Icon,
  StarIcon,
  XIcon,
} from '@lucide/vue'
import { onClickOutside, useEventListener, useStorage } from '@vueuse/core'
import {
  computed,
  type CSSProperties,
  type FunctionalComponent,
  h,
  nextTick,
  onBeforeUnmount,
  ref,
  useId,
  useTemplateRef,
  type VNode,
  watch,
} from 'vue'
import { useI18n } from 'vue-i18n'
import { useRouter } from 'vue-router'

import { MAX_FAVORITE_PICBEDS } from '@/composables/useFavoritePicbeds'
import { usePicBed } from '@/composables/useGlobal'
import useMessage from '@/composables/useMessage'
import { PICBEDS_PAGE, UPLOADER_CONFIG_PAGE } from '@/router/config'
import { invokeRPC, showRpcError } from '@/services/rpcService'
import { IRPCActionType } from '#/constants/rpcActions'

interface IPickerGroup {
  type: string
  name: string
  targets: IUploadTarget[]
}

const { t } = useI18n()
const router = useRouter()
const message = useMessage()
const { defaultPicBedG, defaultIdG, updatePicBeds } = usePicBed()

const panelId = `picbed-picker-${useId()}`
const providerListId = `${panelId}-providers`
const configListId = `${panelId}-configs`
const searchListId = `${panelId}-results`

const trigger = useTemplateRef('trigger')
const panel = useTemplateRef('panel')
const searchInput = useTemplateRef('searchInput')

const open = ref(false)
const loading = ref(false)
const loadFailed = ref(false)
const switching = ref(false)
const pendingKey = ref('')
const query = ref('')
const targets = ref<IUploadTarget[]>([])

const favoritePicbeds = useStorage<IFavoritePicbedItem[]>('favorite-picbeds', [])

const activePane = ref<'providers' | 'configs'>('providers')
const focusedProviderType = ref('')
const activeConfigKey = ref('')
const activeSearchKey = ref('')

const panelStyle = ref<CSSProperties>({})
const bodyMaxHeight = ref(340)
const isCompactLayout = ref(false)

let loadVersion = 0

const searchTerms = computed(() => query.value.trim().toLocaleLowerCase().split(/\s+/).filter(Boolean))
const isSearching = computed(() => searchTerms.value.length > 0)

const filteredTargets = computed(() => {
  if (!isSearching.value) return targets.value
  return targets.value.filter(target => {
    const label = `${target.name} ${target.type} ${target.configName}`.toLocaleLowerCase()
    return searchTerms.value.every(term => label.includes(term))
  })
})

const rankedSearchResults = computed(() => {
  if (!isSearching.value) return []
  const fullQuery = query.value.trim().toLocaleLowerCase()
  return filteredTargets.value
    .map((target, index) => {
      const configLower = target.configName.toLocaleLowerCase()
      const nameLower = target.name.toLocaleLowerCase()
      const typeLower = target.type.toLocaleLowerCase()
      let score = 0
      if (configLower === fullQuery || nameLower === fullQuery) score += 10
      else if (configLower.startsWith(fullQuery) || nameLower.startsWith(fullQuery) || typeLower.startsWith(fullQuery))
        score += 5
      else if (configLower.includes(fullQuery) || nameLower.includes(fullQuery)) score += 2
      if (isFavorite(target)) score += 1
      return { target, score, index }
    })
    .sort((a, b) => b.score - a.score || a.index - b.index)
    .map(item => item.target)
})

const activeSearchIndex = computed(() =>
  rankedSearchResults.value.findIndex(target => targetKey(target) === activeSearchKey.value),
)

const groups = computed<IPickerGroup[]>(() => {
  const grouped = new Map<string, IPickerGroup>()
  targets.value.forEach(target => {
    if (!grouped.has(target.type)) grouped.set(target.type, { type: target.type, name: target.name, targets: [] })
    grouped.get(target.type)!.targets.push(target)
  })
  return [...grouped.values()]
})

const focusedGroup = computed(
  () => groups.value.find(group => group.type === focusedProviderType.value) || groups.value[0] || null,
)

const isFavoritesFull = computed(() => favoritePicbeds.value.length >= MAX_FAVORITE_PICBEDS)

const showLoading = computed(() => loading.value && !targets.value.length)
const showError = computed(() => loadFailed.value && !targets.value.length)

const bodyHeightStyle = computed<CSSProperties>(() => ({
  minHeight: `${Math.min(220, bodyMaxHeight.value)}px`,
  maxHeight: `${bodyMaxHeight.value}px`,
}))

const activeListId = computed(() => {
  if (isSearching.value) return searchListId
  return activePane.value === 'configs' ? configListId : providerListId
})

const activeDescendantId = computed(() => {
  if (isSearching.value) {
    const target = rankedSearchResults.value[activeSearchIndex.value]
    return target ? searchRowId(target) : undefined
  }
  if (activePane.value === 'configs') {
    const target = focusedGroup.value?.targets.find(item => targetKey(item) === activeConfigKey.value)
    return target ? configRowId(target) : undefined
  }
  return focusedGroup.value ? providerRowId(focusedGroup.value.type) : undefined
})

const HighlightText: FunctionalComponent<{ text: string }> = ({ text }) => {
  const lower = text.toLocaleLowerCase()
  const marked = new Array<boolean>(text.length).fill(false)
  // Locale lowercasing can change string length; skip highlighting rather than mark the wrong range.
  if (lower.length === text.length) {
    searchTerms.value.forEach(term => {
      for (let index = lower.indexOf(term); index >= 0; index = lower.indexOf(term, index + term.length)) {
        marked.fill(true, index, index + term.length)
      }
    })
  }
  const parts: (string | VNode)[] = []
  let start = 0
  for (let index = 1; index <= text.length; index++) {
    if (index < text.length && marked[index] === marked[start]) continue
    const part = text.slice(start, index)
    parts.push(marked[start] ? h('mark', { class: 'rounded-sm bg-accent/20 text-inherit' }, part) : part)
    start = index
  }
  return parts
}

function targetKey(target: IUploadTarget) {
  return `${target.type}::${target.configId}`
}

function actionLabel(action: string, target: IUploadTarget) {
  return `${action} — ${target.name} — ${target.configName}`
}

function providerRowId(type: string) {
  return `${providerListId}-${type}`
}

function configRowId(target: IUploadTarget) {
  return `${configListId}-${target.type}-${target.configId || 'default'}`
}

function searchRowId(target: IUploadTarget) {
  return `${searchListId}-${target.type}-${target.configId || 'default'}`
}

function isSelected(target: IUploadTarget) {
  return target.type === defaultPicBedG.value && (!target.configId || target.configId === defaultIdG.value)
}

function isPending(target: IUploadTarget) {
  return pendingKey.value === targetKey(target)
}

function isFavorite(target: IUploadTarget) {
  if (!target.configId) return false
  return favoritePicbeds.value.some(item => item.type === target.type && item.id === target.configId)
}

function favoriteButtonTooltip(target: IUploadTarget) {
  if (isFavorite(target)) return t('pages.upload.picbedPicker.removeFavorite')
  if (isFavoritesFull.value) return t('pages.upload.picbedPicker.favoritesLimit', { max: MAX_FAVORITE_PICBEDS })
  return t('pages.upload.picbedPicker.addFavorite')
}

async function toggleFavorite(target: IUploadTarget, event: MouseEvent) {
  if (switching.value || !target.configId) return
  const button = event.currentTarget
  const hadFocus = button instanceof HTMLButtonElement && button === document.activeElement
  const index = favoritePicbeds.value.findIndex(item => item.type === target.type && item.id === target.configId)
  if (index !== -1) {
    favoritePicbeds.value.splice(index, 1)
  } else {
    if (isFavoritesFull.value) return
    favoritePicbeds.value.push({
      id: target.configId,
      type: target.type,
      configName: target.configName,
    })
  }
  // Moving a newly pinned search result in the DOM can release keyboard focus.
  if (hadFocus) {
    await nextTick()
    if (document.activeElement === document.body) {
      button.closest('[role="row"]')?.querySelector<HTMLButtonElement>('button:not(:disabled)')?.focus()
    }
  }
}

function isConfigKeyboardFocused(target: IUploadTarget) {
  return activePane.value === 'configs' && activeConfigKey.value === targetKey(target)
}

function providerRowClass(type: string) {
  const isFocused = type === focusedProviderType.value
  const isCurrent = type === defaultPicBedG.value
  return [
    isFocused
      ? activePane.value === 'providers'
        ? 'bg-accent/12 font-semibold text-accent'
        : 'bg-bg-tertiary font-semibold text-main shadow-2xs ring-1 ring-border-secondary'
      : isCurrent
        ? 'font-medium text-main hover:bg-bg-tertiary/70'
        : 'text-secondary hover:bg-bg-tertiary/70 hover:text-main',
    { 'pointer-events-none opacity-60': switching.value },
  ]
}

function configCardClass(target: IUploadTarget) {
  const selected = isSelected(target)
  const focused = isConfigKeyboardFocused(target)
  return [
    selected
      ? focused
        ? 'border-accent bg-accent/12 shadow-2xs'
        : 'border-accent/40 bg-accent/7 hover:border-accent/60 hover:bg-accent/10'
      : focused
        ? 'border-accent/50 bg-accent/8'
        : 'border-border-secondary bg-bg-secondary/35 hover:border-border hover:bg-bg-secondary/80',
    { 'pointer-events-none': switching.value, 'opacity-50': switching.value && !isPending(target) },
  ]
}

function searchRowClass(target: IUploadTarget, index: number) {
  const selected = isSelected(target)
  const active = index === activeSearchIndex.value
  return [
    selected
      ? active
        ? 'border-accent bg-accent/12'
        : 'border-accent/35 bg-accent/6 hover:bg-accent/10'
      : active
        ? 'border-accent/40 bg-accent/8'
        : 'border-transparent hover:bg-bg-secondary/70',
    { 'pointer-events-none': switching.value, 'opacity-50': switching.value && !isPending(target) },
  ]
}

function syncFocusedProviderAndConfig() {
  if (!groups.value.length) {
    focusedProviderType.value = ''
    activeConfigKey.value = ''
    return
  }
  const hasFocused = groups.value.some(group => group.type === focusedProviderType.value)
  if (!hasFocused) {
    const current = groups.value.find(group => group.type === defaultPicBedG.value)
    focusedProviderType.value = (current || groups.value[0]).type
  }
  syncActiveConfigForFocusedGroup()
}

function syncActiveConfigForFocusedGroup() {
  const group = focusedGroup.value
  if (!group?.targets.length) {
    activeConfigKey.value = ''
    return
  }
  if (group.targets.some(target => targetKey(target) === activeConfigKey.value)) return
  const selected = group.targets.find(isSelected)
  activeConfigKey.value = targetKey(selected || group.targets[0])
}

function inspectProvider(type: string) {
  if (switching.value) return
  focusedProviderType.value = type
  activePane.value = 'providers'
  syncActiveConfigForFocusedGroup()
  searchInput.value?.focus()
}

function handleProviderDblClick(group: IPickerGroup) {
  if (switching.value || group.targets.length !== 1) return
  void select(group.targets[0])
}

function setActiveConfig(target: IUploadTarget) {
  if (switching.value) return
  activePane.value = 'configs'
  activeConfigKey.value = targetKey(target)
}

function clearSearch() {
  query.value = ''
  searchInput.value?.focus()
}

function openManageConfigs(type: string) {
  if (switching.value) return
  close(false)
  void router.push({ name: UPLOADER_CONFIG_PAGE, params: { type } })
}

async function openEditConfig(target: IUploadTarget) {
  if (switching.value) return
  let configId = target.configId
  if (!configId) {
    const version = loadVersion
    switching.value = true
    pendingKey.value = targetKey(target)
    const profiles = await window.electron
      .triggerRPC<IUploaderConfigItem>(IRPCActionType.PICBED_GET_CONFIG_LIST, target.type)
      .catch(() => undefined)
    switching.value = false
    pendingKey.value = ''
    if (version !== loadVersion) return
    if (!profiles?.defaultId) {
      message.error(t('pages.picBedConfigs.loadConfigFailed'))
      await nextTick()
      searchInput.value?.focus()
      return
    }
    configId = profiles.defaultId
  }
  close(false)
  void router.push({ name: PICBEDS_PAGE, params: { type: target.type, configId } })
}

function updatePosition() {
  if (!open.value || !trigger.value) return
  const rect = trigger.value.getBoundingClientRect()
  const margin = 12
  const gap = 8
  const width = Math.min(560, window.innerWidth - margin * 2)
  isCompactLayout.value = width < 480
  const below = window.innerHeight - rect.bottom - gap - margin
  const above = rect.top - gap - margin
  const placeBelow = below >= Math.min(460, above)
  const available = placeBelow ? below : above
  const useViewport = available < 300
  const maxHeight = Math.max(240, Math.min(480, useViewport ? window.innerHeight - margin * 2 : available))
  const chromeHeight = !isSearching.value ? 142 : 98
  bodyMaxHeight.value = Math.max(180, Math.min(340, maxHeight - chromeHeight))

  panelStyle.value = {
    width: `${width}px`,
    left: `${Math.max(margin, Math.min(rect.right - width, window.innerWidth - width - margin))}px`,
    maxHeight: `${maxHeight}px`,
    transformOrigin: useViewport || placeBelow ? 'top right' : 'bottom right',
    ...(useViewport
      ? { top: `${margin}px` }
      : placeBelow
        ? { top: `${rect.bottom + gap}px` }
        : { bottom: `${window.innerHeight - rect.top + gap}px` }),
  }
}

async function loadTargets() {
  const version = ++loadVersion
  loading.value = true
  loadFailed.value = false
  try {
    const result = await window.electron.triggerRPC<IUploadTarget[]>(IRPCActionType.PICBED_GET_UPLOAD_TARGETS)
    if (!Array.isArray(result)) throw new Error('Invalid upload targets')
    if (version === loadVersion) targets.value = result
  } catch {
    if (version === loadVersion) loadFailed.value = true
  } finally {
    if (version === loadVersion) loading.value = false
  }
}

async function show() {
  if (open.value || switching.value) return
  query.value = ''
  activePane.value = 'providers'
  focusedProviderType.value = defaultPicBedG.value
  activeConfigKey.value = ''
  open.value = true
  syncFocusedProviderAndConfig()
  updatePosition()
  void loadTargets()
  await nextTick()
  searchInput.value?.focus()
  void scrollActiveIntoView('center')
}

function close(restoreFocus = true) {
  if (!open.value) return
  open.value = false
  loadVersion++
  if (restoreFocus) trigger.value?.focus()
}

function toggle() {
  if (open.value) close()
  else void show()
}

function handleTab(event: KeyboardEvent) {
  const controls = panel.value?.querySelectorAll<HTMLElement>(
    'input:not(:disabled), button:not(:disabled, [tabindex="-1"])',
  )
  if (!controls?.length) return
  const boundary = event.shiftKey ? controls[0] : controls[controls.length - 1]
  if (event.target === boundary) {
    // Shift+Tab returns to the trigger instead of skipping it after focus restoration.
    if (event.shiftKey) event.preventDefault()
    close()
  }
}

function handleEscape(event: KeyboardEvent) {
  if (event.isComposing) return
  event.preventDefault()
  event.stopPropagation()
  if (query.value && !switching.value) clearSearch()
  else close()
}

async function scrollActiveIntoView(block: ScrollLogicalPosition = 'nearest') {
  await nextTick()
  const id = activeDescendantId.value
  if (!id) return
  document.getElementById(id)?.scrollIntoView({ block })
}

function move(direction: number, event?: KeyboardEvent) {
  if (switching.value || event?.isComposing) return
  if (isSearching.value) {
    const count = rankedSearchResults.value.length
    if (!count) return
    event?.preventDefault()
    const nextIndex = (activeSearchIndex.value + direction + count) % count
    activeSearchKey.value = targetKey(rankedSearchResults.value[nextIndex])
    void scrollActiveIntoView()
    return
  }

  if (activePane.value === 'providers') {
    const count = groups.value.length
    if (!count) return
    event?.preventDefault()
    const current = groups.value.findIndex(group => group.type === focusedProviderType.value)
    const nextIndex = current < 0 ? (direction > 0 ? 0 : count - 1) : (current + direction + count) % count
    focusedProviderType.value = groups.value[nextIndex].type
    syncActiveConfigForFocusedGroup()
    void scrollActiveIntoView()
    return
  }

  const group = focusedGroup.value
  const count = group?.targets.length ?? 0
  if (!group || !count) return
  event?.preventDefault()
  const current = group.targets.findIndex(target => targetKey(target) === activeConfigKey.value)
  const nextIndex = current < 0 ? (direction > 0 ? 0 : count - 1) : (current + direction + count) % count
  activeConfigKey.value = targetKey(group.targets[nextIndex])
  void scrollActiveIntoView()
}

function handleRightKey(event: KeyboardEvent) {
  if (isSearching.value || query.value || event.isComposing || switching.value) return
  if (activePane.value !== 'providers' || !focusedGroup.value?.targets.length) return
  event.preventDefault()
  activePane.value = 'configs'
  syncActiveConfigForFocusedGroup()
  void scrollActiveIntoView()
}

function handleLeftKey(event: KeyboardEvent) {
  if (isSearching.value || query.value || event.isComposing || switching.value) return
  if (activePane.value !== 'configs') return
  event.preventDefault()
  activePane.value = 'providers'
  void scrollActiveIntoView()
}

function selectActive(event: KeyboardEvent) {
  if (event.isComposing || switching.value) return
  if (isSearching.value) {
    const target = rankedSearchResults.value[activeSearchIndex.value]
    if (!target) return
    event.preventDefault()
    void select(target)
    return
  }

  const group = focusedGroup.value
  if (!group?.targets.length) return
  event.preventDefault()

  if (activePane.value === 'providers') {
    if (group.targets.length === 1) {
      void select(group.targets[0])
    } else {
      activePane.value = 'configs'
      syncActiveConfigForFocusedGroup()
      void scrollActiveIntoView()
    }
    return
  }

  const target = group.targets.find(item => targetKey(item) === activeConfigKey.value) || group.targets[0]
  if (target) void select(target)
}

async function select(target: IUploadTarget) {
  if (switching.value) return
  if (isSelected(target)) {
    close()
    return
  }
  switching.value = true
  pendingKey.value = targetKey(target)
  let saved = false
  try {
    await invokeRPC(IRPCActionType.PICBED_SELECT_UPLOAD_TARGET, target.type, target.configId)
    await updatePicBeds()
    saved = true
    message.success(t('pages.upload.picbedSwitched', { name: `${target.name} — ${target.configName}` }))
  } catch (error) {
    showRpcError(error)
  } finally {
    switching.value = false
    pendingKey.value = ''
    await nextTick()
    if (saved) close()
    else searchInput.value?.focus()
  }
}

watch([query, rankedSearchResults], ([currentQuery, results], [previousQuery]) => {
  if (currentQuery !== previousQuery || activeSearchIndex.value < 0) {
    activeSearchKey.value = results.length ? targetKey(results[0]) : ''
  }
  if (open.value) {
    if (currentQuery !== previousQuery) updatePosition()
    void scrollActiveIntoView()
  }
})

watch(groups, () => {
  syncFocusedProviderAndConfig()
  if (open.value) {
    updatePosition()
    void scrollActiveIntoView('center')
  }
})

onClickOutside(panel, () => close(false), { ignore: [trigger] })
onBeforeUnmount(() => loadVersion++)
useEventListener(window, 'resize', updatePosition)
useEventListener(window, 'scroll', updatePosition, true)
useEventListener(window, 'blur', () => close(false))
useEventListener(document, 'focusin', event => {
  if (event.target instanceof Node && !panel.value?.contains(event.target) && !trigger.value?.contains(event.target)) {
    close(false)
  }
})
</script>
