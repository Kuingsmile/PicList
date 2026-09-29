<template>
  <button
    ref="trigger"
    type="button"
    class="flex cursor-pointer items-center gap-2 rounded-md border-none bg-accent px-4 py-2.5 font-[inherit] text-sm font-medium text-white duration-fast ease-standard hover:bg-accent-hover hover:shadow-md focus-visible:focus-ring aria-disabled:cursor-wait max-md:flex-1 max-md:justify-center max-xs:px-3 max-xs:py-2 max-xs:text-[0.8rem]"
    aria-haspopup="dialog"
    :aria-expanded="open"
    :aria-controls="open ? panelId : undefined"
    :aria-busy="switching"
    :aria-disabled="switching && !open"
    @click="toggle"
    @keydown.down.prevent="show"
  >
    <LoaderCircleIcon v-if="switching" :size="16" class="animate-spin" aria-hidden="true" />
    <ArrowLeftRightIcon v-else :size="16" aria-hidden="true" />
    <span>{{ t('pages.upload.changePicBed') }}</span>
    <ChevronDownIcon
      :size="14"
      class="transition-transform duration-fast"
      :class="{ 'rotate-180': open }"
      aria-hidden="true"
    />
  </button>

  <Teleport to="body">
    <div
      v-if="open"
      :id="panelId"
      ref="panel"
      role="dialog"
      :aria-labelledby="`${panelId}-title`"
      class="fixed z-100 flex min-h-0 flex-col overflow-hidden rounded-xl border border-border bg-bg-tertiary text-main shadow-xl"
      :style="panelStyle"
      @keydown.esc="handleEscape"
      @keydown.tab="handleTab"
    >
      <div class="shrink-0 px-4 pt-3 pb-2">
        <div class="mb-3 flex items-center justify-between gap-3">
          <h2 :id="`${panelId}-title`" class="text-sm font-semibold">{{ t('pages.upload.changePicBed') }}</h2>
          <button
            type="button"
            class="flex size-7 shrink-0 cursor-pointer items-center justify-center rounded-md text-secondary hover:bg-bg-secondary hover:text-main focus-visible:focus-ring"
            :aria-label="t('common.close')"
            @click="close()"
          >
            <XIcon :size="16" aria-hidden="true" />
          </button>
        </div>
        <div class="flex items-center gap-3 rounded-lg border border-accent/15 bg-accent/5 px-3 py-2.5">
          <div class="flex size-9 shrink-0 items-center justify-center rounded-lg bg-accent/10 text-accent">
            <CloudIcon :size="18" aria-hidden="true" />
          </div>
          <div class="min-w-0 flex-1">
            <div class="mb-0.5 text-[11px] text-secondary">{{ t('pages.upload.picbedPicker.current') }}</div>
            <div class="flex min-w-0 items-center gap-1.5 text-sm">
              <span class="truncate font-semibold" :title="currentProviderName">{{ currentProviderName }}</span>
              <span class="shrink-0 text-tertiary" aria-hidden="true">/</span>
              <span class="truncate text-secondary" :title="defaultConfigNameG || 'Default'">{{
                defaultConfigNameG || 'Default'
              }}</span>
            </div>
          </div>
          <CheckIcon :size="16" class="shrink-0 text-accent" aria-hidden="true" />
        </div>
      </div>
      <div class="relative mx-4 mt-1 mb-3 shrink-0">
        <SearchIcon
          :size="16"
          class="pointer-events-none absolute top-1/2 left-3 -translate-y-1/2 text-secondary"
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
          aria-haspopup="tree"
          :aria-controls="listId"
          :aria-activedescendant="activeRow ? rowId(activeRow) : undefined"
          :aria-label="t('pages.upload.picbedPicker.search')"
          :placeholder="t('pages.upload.picbedPicker.search')"
          :disabled="switching"
          class="w-full rounded-lg border border-border bg-bg-secondary py-2.5 pr-9 pl-9 text-sm text-main placeholder:text-tertiary focus:border-accent focus:outline-none"
          @keydown.down="move(1, $event)"
          @keydown.up="move(-1, $event)"
          @keydown.right="expandActive($event)"
          @keydown.left="collapseActive($event)"
          @keydown.enter="selectActive($event)"
        />
        <button
          v-if="query"
          type="button"
          :aria-label="t('common.clear')"
          :disabled="switching"
          class="absolute top-1/2 right-2 flex size-6 -translate-y-1/2 cursor-pointer items-center justify-center rounded text-secondary hover:bg-bg-tertiary hover:text-main focus-visible:focus-ring disabled:cursor-wait"
          @click="clearSearch"
        >
          <XIcon :size="14" aria-hidden="true" />
        </button>
      </div>
      <div
        v-if="!loading && !loadFailed && groups.length"
        class="flex shrink-0 items-center justify-between gap-3 border-t border-border-secondary px-4 py-2"
      >
        <span class="text-xs text-secondary">{{
          t('pages.upload.picbedPicker.summary', { providers: groups.length, configurations: filteredTargets.length })
        }}</span>
        <button
          type="button"
          :disabled="switching"
          class="shrink-0 cursor-pointer rounded px-1 py-0.5 text-xs font-medium text-accent hover:bg-accent/10 focus-visible:focus-ring disabled:cursor-wait disabled:opacity-50"
          @click="toggleAllGroups"
        >
          {{ t(allGroupsExpanded ? 'pages.upload.picbedPicker.collapseAll' : 'pages.upload.picbedPicker.expandAll') }}
        </button>
      </div>
      <div v-if="loading" role="status" class="flex items-center justify-center gap-2 px-4 py-8 text-sm text-secondary">
        <LoaderCircleIcon :size="16" class="animate-spin" aria-hidden="true" />
        {{ t('pages.upload.picbedPicker.loading') }}
      </div>
      <div v-else-if="loadFailed" role="alert" class="px-4 py-6 text-center text-sm text-secondary">
        <p class="mb-3">{{ t('pages.upload.picbedPicker.loadFailed') }}</p>
        <button
          type="button"
          class="cursor-pointer rounded-md px-3 py-1.5 text-accent hover:bg-accent/10 focus-visible:focus-ring"
          @click="loadTargets"
        >
          {{ t('pages.upload.picbedPicker.retry') }}
        </button>
      </div>
      <div
        :id="listId"
        role="tree"
        :aria-label="t('pages.upload.changePicBed')"
        :aria-busy="loading || switching"
        class="min-h-0 overflow-y-auto overscroll-contain px-2 pb-2"
      >
        <div
          v-for="group in groups"
          :id="`${listId}-provider-${group.type}`"
          :key="group.type"
          role="treeitem"
          :aria-label="group.name"
          :aria-expanded="isGroupExpanded(group.type)"
          :aria-disabled="switching"
          class="mb-1 last:mb-0"
        >
          <div
            class="flex cursor-pointer items-center gap-2 rounded-lg px-2.5 py-2.5 text-sm transition-colors duration-fast"
            :class="[
              activeRow?.kind === 'provider' && activeRow.type === group.type
                ? 'bg-accent/10 text-accent'
                : 'text-main hover:bg-bg-secondary',
              { 'pointer-events-none opacity-60': switching },
            ]"
            @pointermove="setActiveProvider(group.type)"
            @mousedown.prevent
            @click="toggleGroup(group.type)"
          >
            <ChevronRightIcon
              :size="14"
              class="shrink-0 text-secondary transition-transform duration-fast"
              :class="{ 'rotate-90': isGroupExpanded(group.type) }"
              aria-hidden="true"
            />
            <CloudIcon :size="16" class="shrink-0 text-secondary" aria-hidden="true" />
            <span class="min-w-0 flex-1 truncate font-medium" :title="group.name">{{ group.name }}</span>
            <span
              v-if="group.type === defaultPicBedG"
              class="shrink-0 rounded bg-accent/10 px-1.5 py-0.5 text-[10px] font-medium text-accent"
              >{{ t('pages.upload.picbedPicker.selected') }}</span
            >
            <span
              class="min-w-5 shrink-0 rounded bg-bg-secondary px-1.5 py-0.5 text-center text-[11px] text-secondary tabular-nums"
              aria-hidden="true"
              >{{ group.targets.length }}</span
            >
          </div>
          <div
            v-if="isGroupExpanded(group.type)"
            role="group"
            :aria-label="t('pages.upload.picbedPicker.configurations')"
            class="mr-1 mb-2 ml-4 border-l border-border pl-3"
          >
            <div
              v-for="target in group.targets"
              :id="`${listId}-config-${target.type}-${target.configId}`"
              :key="target.configId"
              role="treeitem"
              :aria-label="target.configName"
              :aria-selected="isSelected(target)"
              :aria-disabled="switching"
              :title="target.configName"
              class="mt-0.5 flex cursor-pointer items-center gap-2 rounded-md px-3 py-2 text-[13px] transition-colors duration-fast"
              :class="[
                activeRow?.kind === 'config' && activeRow.target === target
                  ? 'bg-accent/10 text-accent'
                  : isSelected(target)
                    ? 'bg-accent/5 text-accent hover:bg-accent/10'
                    : 'text-secondary hover:bg-bg-secondary hover:text-main',
                isSelected(target) ? 'font-medium' : 'font-normal',
                { 'pointer-events-none opacity-60': switching },
              ]"
              @pointermove="setActiveConfig(target)"
              @mousedown.prevent
              @click="select(target)"
            >
              <FileTextIcon :size="14" class="shrink-0 opacity-60" aria-hidden="true" />
              <span class="min-w-0 flex-1 truncate">{{ target.configName }}</span>
              <CheckIcon v-if="isSelected(target)" :size="16" class="shrink-0 text-accent" aria-hidden="true" />
            </div>
          </div>
        </div>
      </div>
      <div
        v-if="!loading && !loadFailed && !filteredTargets.length"
        role="status"
        class="flex flex-col items-center gap-3 px-6 py-8 text-center text-sm text-secondary"
      >
        <SearchIcon v-if="isSearching" :size="24" class="text-tertiary" aria-hidden="true" />
        <CloudIcon v-else :size="24" class="text-tertiary" aria-hidden="true" />
        {{ t(query.trim() ? 'pages.upload.picbedPicker.noMatches' : 'pages.upload.picbedPicker.empty') }}
      </div>
    </div>
  </Teleport>
</template>

<script setup lang="ts">
import {
  ArrowLeftRightIcon,
  CheckIcon,
  ChevronDownIcon,
  ChevronRightIcon,
  CloudIcon,
  FileTextIcon,
  LoaderCircleIcon,
  SearchIcon,
  XIcon,
} from '@lucide/vue'
import { onClickOutside, useEventListener, useStorage } from '@vueuse/core'
import { computed, type CSSProperties, nextTick, onBeforeUnmount, ref, useId, useTemplateRef, watch } from 'vue'
import { useI18n } from 'vue-i18n'

import { usePicBed } from '@/hooks/useGlobal'
import useMessage from '@/hooks/useMessage'
import { IRPCActionType } from '@/utils/enum'
import { invokeRPC, showRpcError } from '@/utils/rpc'

const { t } = useI18n()
const message = useMessage()
const { picBedG, defaultPicBedG, defaultConfigNameG, defaultIdG, updatePicBeds } = usePicBed()
const panelId = `picbed-picker-${useId()}`
const listId = `${panelId}-options`
const trigger = useTemplateRef('trigger')
const panel = useTemplateRef('panel')
const searchInput = useTemplateRef('searchInput')
const open = ref(false)
const loading = ref(false)
const loadFailed = ref(false)
const switching = ref(false)
const query = ref('')
const targets = ref<IUploadTarget[]>([])
const collapseByDefault = useStorage('upload-picbed-picker-collapse-by-default', true)
const groupExpansion = useStorage<Record<string, boolean>>('upload-picbed-picker-group-expansion', {})
const searchExpansion = ref<Record<string, boolean>>({})
const activeKey = ref('')
const panelStyle = ref<CSSProperties>({})
let loadVersion = 0

type PickerRow = { kind: 'provider'; type: string } | { kind: 'config'; target: IUploadTarget }

const isSearching = computed(() => !!query.value.trim())
const currentProviderName = computed(() => {
  const provider = picBedG.value.find(item => item.type === defaultPicBedG.value)
  return provider?.name || defaultPicBedG.value
})
const filteredTargets = computed(() => {
  const terms = query.value.trim().toLocaleLowerCase().split(/\s+/)
  return targets.value.filter(target => {
    const label = `${target.name} ${target.type} ${target.configName}`.toLocaleLowerCase()
    return terms.every(term => label.includes(term))
  })
})
const groups = computed(() => {
  const grouped = new Map<string, { type: string; name: string; targets: IUploadTarget[] }>()
  filteredTargets.value.forEach(target => {
    if (!grouped.has(target.type)) grouped.set(target.type, { type: target.type, name: target.name, targets: [] })
    grouped.get(target.type)!.targets.push(target)
  })
  return [...grouped.values()]
})
const navigationRows = computed<PickerRow[]>(() =>
  groups.value.flatMap(group => [
    { kind: 'provider' as const, type: group.type },
    ...(isGroupExpanded(group.type) ? group.targets.map(target => ({ kind: 'config' as const, target })) : []),
  ]),
)
const activeRow = computed(() => navigationRows.value.find(row => rowId(row) === activeKey.value))
const allGroupsExpanded = computed(
  () => groups.value.length > 0 && groups.value.every(group => isGroupExpanded(group.type)),
)

function rowId(row: PickerRow) {
  return row.kind === 'provider'
    ? `${listId}-provider-${row.type}`
    : `${listId}-config-${row.target.type}-${row.target.configId}`
}

function isGroupExpanded(type: string) {
  // Search reveals matches without overwriting the layout saved for normal browsing.
  return isSearching.value
    ? (searchExpansion.value[type] ?? true)
    : (groupExpansion.value[type] ?? !collapseByDefault.value)
}

function setGroupExpanded(type: string, expanded: boolean) {
  const expansion = isSearching.value ? searchExpansion : groupExpansion
  expansion.value = { ...expansion.value, [type]: expanded }
}

function setActiveProvider(type: string) {
  activeKey.value = rowId({ kind: 'provider', type })
}

function setActiveConfig(target: IUploadTarget) {
  activeKey.value = rowId({ kind: 'config', target })
}

function toggleGroup(type: string) {
  if (switching.value) return
  setActiveProvider(type)
  setGroupExpanded(type, !isGroupExpanded(type))
  searchInput.value?.focus()
}

function toggleAllGroups() {
  if (switching.value) return
  const expanded = !allGroupsExpanded.value
  const expansion = isSearching.value ? searchExpansion : groupExpansion
  expansion.value = { ...expansion.value, ...Object.fromEntries(groups.value.map(group => [group.type, expanded])) }
  if (!isSearching.value) collapseByDefault.value = !expanded
  searchInput.value?.focus()
}

function clearSearch() {
  query.value = ''
  searchInput.value?.focus()
}

function isSelected(target: IUploadTarget) {
  return target.type === defaultPicBedG.value && (!target.configId || target.configId === defaultIdG.value)
}

function updatePosition() {
  if (!open.value || !trigger.value) return
  const rect = trigger.value.getBoundingClientRect()
  const margin = 12
  const gap = 8
  const width = Math.min(400, window.innerWidth - margin * 2)
  const below = window.innerHeight - rect.bottom - gap - margin
  const above = rect.top - gap - margin
  const placeBelow = below >= Math.min(480, above)
  const available = placeBelow ? below : above
  const useViewport = available < 300
  panelStyle.value = {
    width: `${width}px`,
    left: `${Math.max(margin, Math.min(rect.right - width, window.innerWidth - width - margin))}px`,
    maxHeight: `${Math.max(0, Math.min(560, useViewport ? window.innerHeight - margin * 2 : available))}px`,
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
  targets.value = []
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
  searchExpansion.value = {}
  activeKey.value = ''
  open.value = true
  updatePosition()
  void loadTargets()
  await nextTick()
  searchInput.value?.focus()
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
  const controls = panel.value?.querySelectorAll<HTMLElement>('input:not(:disabled), button:not(:disabled)')
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
  close()
}

async function scrollActiveIntoView() {
  await nextTick()
  const row = activeRow.value
  if (!row) return
  const element = document.getElementById(rowId(row))
  const scrollTarget = row.kind === 'provider' ? element?.firstElementChild : element
  scrollTarget?.scrollIntoView({ block: 'nearest' })
}

function move(direction: number, event?: KeyboardEvent) {
  const count = navigationRows.value.length
  if (!count || switching.value || event?.isComposing) return
  event?.preventDefault()
  const current = navigationRows.value.findIndex(row => rowId(row) === activeKey.value)
  const index = current < 0 ? (direction > 0 ? 0 : count - 1) : (current + direction + count) % count
  activeKey.value = rowId(navigationRows.value[index])
  void scrollActiveIntoView()
}

function expandActive(event: KeyboardEvent) {
  if (query.value || event.isComposing || switching.value) return
  const row = activeRow.value
  if (!row || row.kind !== 'provider') return
  event.preventDefault()
  if (isGroupExpanded(row.type)) move(1)
  else setGroupExpanded(row.type, true)
}

function collapseActive(event: KeyboardEvent) {
  if (query.value || event.isComposing || switching.value) return
  const row = activeRow.value
  if (!row) return
  event.preventDefault()
  if (row.kind === 'config') setActiveProvider(row.target.type)
  else setGroupExpanded(row.type, false)
  void scrollActiveIntoView()
}

function selectActive(event: KeyboardEvent) {
  if (event.isComposing || switching.value) return
  const row = activeRow.value
  if (row) event.preventDefault()
  if (row?.kind === 'provider') toggleGroup(row.type)
  else if (row) void select(row.target)
}

async function select(target: IUploadTarget) {
  if (switching.value) return
  if (isSelected(target)) {
    close()
    return
  }
  switching.value = true
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
    await nextTick()
    if (saved) close()
    else searchInput.value?.focus()
  }
}

watch(query, () => {
  searchExpansion.value = {}
  activeKey.value = ''
})

watch(navigationRows, (rows, previousRows) => {
  if (rows.some(row => rowId(row) === activeKey.value)) return
  const previous = previousRows.find(row => rowId(row) === activeKey.value)
  const next =
    (previous?.kind === 'config'
      ? rows.find(row => row.kind === 'provider' && row.type === previous.target.type)
      : undefined) ||
    rows.find(row => row.kind === 'config' && isSelected(row.target)) ||
    (query.value.trim()
      ? rows.find(row => row.kind === 'config')
      : rows.find(row => row.kind === 'provider' && row.type === defaultPicBedG.value)) ||
    rows[0]
  activeKey.value = next ? rowId(next) : ''
  void scrollActiveIntoView()
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
