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
    <span>{{ t('pages.upload.changePicBed') }}</span>
    <ChevronDownIcon
      :size="14"
      class="transition-transform duration-fast"
      :class="{ 'rotate-180': open }"
      aria-hidden="true"
    />
  </button>

  <Teleport to="body">
    <Transition
      enter-active-class="transition-[opacity,transform] duration-fast ease-standard"
      enter-from-class="scale-[0.98] opacity-0"
    >
      <div
        v-if="open"
        :id="panelId"
        ref="panel"
        role="dialog"
        :aria-label="t('pages.upload.changePicBed')"
        class="fixed z-100 flex min-h-0 flex-col overflow-hidden rounded-xl border border-border bg-bg-tertiary text-main shadow-xl"
        :style="panelStyle"
        @keydown.esc="handleEscape"
        @keydown.tab="handleTab"
      >
        <div class="flex shrink-0 items-center gap-2 border-b border-border-secondary p-3">
          <div class="relative min-w-0 flex-1">
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
              class="w-full rounded-lg border border-border bg-bg-secondary py-2 pr-9 pl-9 text-sm text-main placeholder:text-tertiary focus:border-accent focus:outline-none"
              @keydown.down="move(1, $event)"
              @keydown.up="move(-1, $event)"
              @keydown.right="expandActive($event)"
              @keydown.left="collapseActive($event)"
              @keydown.enter="selectActive($event)"
            />
            <button
              v-if="query"
              type="button"
              :aria-label="t('pages.upload.picbedPicker.clearSearch')"
              :disabled="switching"
              class="absolute top-1/2 right-2 flex size-6 -translate-y-1/2 cursor-pointer items-center justify-center rounded text-secondary hover:bg-bg-tertiary hover:text-main focus-visible:focus-ring disabled:cursor-wait"
              @click="clearSearch"
            >
              <XIcon :size="14" aria-hidden="true" />
            </button>
          </div>
          <button
            v-if="expandableGroups.length"
            v-tooltip="toggleAllLabel"
            type="button"
            :aria-label="toggleAllLabel"
            :disabled="switching"
            class="flex size-9 shrink-0 cursor-pointer items-center justify-center rounded-lg border border-border bg-bg-secondary text-secondary hover:border-accent hover:text-accent focus-visible:focus-ring disabled:cursor-wait disabled:opacity-50"
            @click="toggleAllGroups"
          >
            <component
              :is="allGroupsExpanded ? ChevronsDownUpIcon : ChevronsUpDownIcon"
              :size="16"
              aria-hidden="true"
            />
          </button>
        </div>

        <div
          v-if="showLoading"
          role="status"
          class="flex items-center justify-center gap-2 px-4 py-10 text-sm text-secondary"
        >
          <LoaderCircleIcon :size="16" class="animate-spin" aria-hidden="true" />
          {{ t('pages.upload.picbedPicker.loading') }}
        </div>
        <div v-else-if="showError" role="alert" class="px-4 py-8 text-center text-sm text-secondary">
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
          class="min-h-0 flex-1 overflow-y-auto overscroll-contain p-2"
          :class="{ hidden: !groups.length }"
        >
          <template v-for="group in groups" :key="group.type">
            <!-- A provider with one configuration is selectable directly instead of needing an expand step. -->
            <div
              v-if="group.targets.length === 1"
              :id="rowId({ kind: 'config', target: group.targets[0] })"
              role="treeitem"
              :aria-label="`${group.name} — ${group.targets[0].configName}`"
              :aria-selected="isSelected(group.targets[0])"
              :aria-disabled="switching"
              class="mb-0.5 flex cursor-pointer items-center gap-2 rounded-lg px-2.5 py-2 text-sm transition-colors duration-fast last:mb-0"
              :class="configRowClass(group.targets[0], 'text-main hover:bg-bg-secondary')"
              @pointermove="setActiveConfig(group.targets[0])"
              @mousedown.prevent
              @click="select(group.targets[0])"
            >
              <span class="w-3.5 shrink-0" aria-hidden="true" />
              <span :class="monogramClass(group.type)" aria-hidden="true">{{ initial(group.name) }}</span>
              <span v-tooltip.overflow="group.name" class="min-w-0 flex-1 truncate font-medium">
                <HighlightText :text="group.name" />
              </span>
              <span
                v-tooltip.overflow="group.targets[0].configName"
                class="max-w-[40%] shrink-0 truncate text-xs text-tertiary"
              >
                <HighlightText :text="group.targets[0].configName" />
              </span>
              <span class="flex w-4 shrink-0 justify-center" aria-hidden="true">
                <LoaderCircleIcon v-if="isPending(group.targets[0])" :size="16" class="animate-spin text-accent" />
                <CheckIcon v-else-if="isSelected(group.targets[0])" :size="16" class="text-accent" />
              </span>
            </div>

            <div
              v-else
              :id="rowId({ kind: 'provider', type: group.type })"
              role="treeitem"
              :aria-label="group.name"
              :aria-expanded="isGroupExpanded(group.type)"
              :aria-disabled="switching"
              class="mb-0.5 last:mb-0"
            >
              <div
                class="flex cursor-pointer items-center gap-2 rounded-lg px-2.5 py-2 text-sm transition-colors duration-fast"
                :class="[
                  isActive({ kind: 'provider', type: group.type })
                    ? 'bg-accent/10 text-accent'
                    : 'text-main hover:bg-bg-secondary',
                  { 'pointer-events-none': switching, 'opacity-50': switching && !hasPendingTarget(group.type) },
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
                <span :class="monogramClass(group.type)" aria-hidden="true">{{ initial(group.name) }}</span>
                <span v-tooltip.overflow="group.name" class="min-w-0 flex-1 truncate font-medium">
                  <HighlightText :text="group.name" />
                </span>
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
                class="my-0.5 ml-[2.75rem] border-l border-border-secondary pl-2"
              >
                <div
                  v-for="target in group.targets"
                  :id="rowId({ kind: 'config', target })"
                  :key="target.configId"
                  v-tooltip.overflow="target.configName"
                  role="treeitem"
                  :aria-label="target.configName"
                  :aria-selected="isSelected(target)"
                  :aria-disabled="switching"
                  class="mb-0.5 flex cursor-pointer items-center gap-2 rounded-md px-2.5 py-1.5 text-[13px] transition-colors duration-fast last:mb-0"
                  :class="configRowClass(target, 'text-secondary hover:bg-bg-secondary hover:text-main')"
                  @pointermove="setActiveConfig(target)"
                  @mousedown.prevent
                  @click="select(target)"
                >
                  <span class="min-w-0 flex-1 truncate" data-tooltip-overflow>
                    <HighlightText :text="target.configName" />
                  </span>
                  <span class="flex w-4 shrink-0 justify-center" aria-hidden="true">
                    <LoaderCircleIcon v-if="isPending(target)" :size="16" class="animate-spin text-accent" />
                    <CheckIcon v-else-if="isSelected(target)" :size="16" class="text-accent" />
                  </span>
                </div>
              </div>
            </div>
          </template>
        </div>

        <div
          v-if="!showLoading && !showError && !filteredTargets.length"
          role="status"
          class="flex flex-col items-center gap-3 px-6 py-10 text-center text-sm text-secondary"
        >
          <SearchIcon v-if="isSearching" :size="24" class="text-tertiary" aria-hidden="true" />
          <CloudIcon v-else :size="24" class="text-tertiary" aria-hidden="true" />
          {{ t(isSearching ? 'pages.upload.picbedPicker.noMatches' : 'pages.upload.picbedPicker.empty') }}
          <button
            v-if="isSearching"
            type="button"
            class="cursor-pointer rounded-md px-3 py-1.5 text-accent hover:bg-accent/10 focus-visible:focus-ring"
            @click="clearSearch"
          >
            {{ t('pages.upload.picbedPicker.clearSearch') }}
          </button>
        </div>

        <div
          v-if="!showLoading && !showError && groups.length"
          class="flex shrink-0 items-center gap-3 border-t border-border-secondary px-4 py-2 text-[11px] text-tertiary"
        >
          <span class="flex items-center gap-1 max-xs:hidden" aria-hidden="true">
            <kbd :class="kbdClass">↑</kbd><kbd :class="kbdClass">↓</kbd>
            {{ t('pages.upload.picbedPicker.hintNavigate') }}
          </span>
          <span class="flex items-center gap-1 max-xs:hidden" aria-hidden="true">
            <kbd :class="kbdClass">↵</kbd>
            {{ t('pages.upload.picbedPicker.hintSelect') }}
          </span>
          <span class="flex items-center gap-1 max-xs:hidden" aria-hidden="true">
            <kbd :class="kbdClass">Esc</kbd>
            {{ t('pages.upload.picbedPicker.hintClose') }}
          </span>
          <span class="ml-auto truncate tabular-nums" role="status">{{
            switching
              ? t('pages.upload.picbedPicker.switching')
              : t('pages.upload.picbedPicker.summary', {
                  providers: groups.length,
                  configurations: filteredTargets.length,
                })
          }}</span>
        </div>
      </div>
    </Transition>
  </Teleport>
</template>

<script setup lang="ts">
import {
  CheckIcon,
  ChevronDownIcon,
  ChevronRightIcon,
  ChevronsDownUpIcon,
  ChevronsUpDownIcon,
  CloudIcon,
  LoaderCircleIcon,
  SearchIcon,
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

import { usePicBed } from '@/composables/useGlobal'
import useMessage from '@/composables/useMessage'
import { invokeRPC, showRpcError } from '@/services/rpcService'
import { IRPCActionType } from '#/constants/rpcActions'

const { t } = useI18n()
const message = useMessage()
const { defaultPicBedG, defaultIdG, updatePicBeds } = usePicBed()
const panelId = `picbed-picker-${useId()}`
const listId = `${panelId}-options`
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
const collapseByDefault = useStorage('upload-picbed-picker-collapse-by-default', true)
const groupExpansion = useStorage<Record<string, boolean>>('upload-picbed-picker-group-expansion', {})
const searchExpansion = ref<Record<string, boolean>>({})
const activeKey = ref('')
const panelStyle = ref<CSSProperties>({})
const kbdClass =
  'inline-flex min-w-4 items-center justify-center rounded border border-border-secondary bg-bg-secondary px-1 font-sans text-[10px] leading-4 text-secondary'
let loadVersion = 0

type PickerRow = { kind: 'provider'; type: string } | { kind: 'config'; target: IUploadTarget }

const searchTerms = computed(() => query.value.trim().toLocaleLowerCase().split(/\s+/).filter(Boolean))
const isSearching = computed(() => searchTerms.value.length > 0)
const filteredTargets = computed(() =>
  targets.value.filter(target => {
    const label = `${target.name} ${target.type} ${target.configName}`.toLocaleLowerCase()
    return searchTerms.value.every(term => label.includes(term))
  }),
)
const groups = computed(() => {
  const grouped = new Map<string, { type: string; name: string; targets: IUploadTarget[] }>()
  filteredTargets.value.forEach(target => {
    if (!grouped.has(target.type)) grouped.set(target.type, { type: target.type, name: target.name, targets: [] })
    grouped.get(target.type)!.targets.push(target)
  })
  return [...grouped.values()]
})
const expandableGroups = computed(() => groups.value.filter(group => group.targets.length > 1))
const navigationRows = computed<PickerRow[]>(() =>
  groups.value.flatMap(group =>
    group.targets.length === 1
      ? [{ kind: 'config' as const, target: group.targets[0] }]
      : [
          { kind: 'provider' as const, type: group.type },
          ...(isGroupExpanded(group.type) ? group.targets.map(target => ({ kind: 'config' as const, target })) : []),
        ],
  ),
)
const activeRow = computed(() => navigationRows.value.find(row => rowId(row) === activeKey.value))
const allGroupsExpanded = computed(
  () => expandableGroups.value.length > 0 && expandableGroups.value.every(group => isGroupExpanded(group.type)),
)
const toggleAllLabel = computed(() =>
  t(allGroupsExpanded.value ? 'pages.upload.picbedPicker.collapseAll' : 'pages.upload.picbedPicker.expandAll'),
)
// Cached targets stay visible while a refresh runs, so the spinner only appears on the first load.
const showLoading = computed(() => loading.value && !targets.value.length)
const showError = computed(() => loadFailed.value && !targets.value.length)

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

function rowId(row: PickerRow) {
  return row.kind === 'provider'
    ? `${listId}-provider-${row.type}`
    : `${listId}-config-${row.target.type}-${row.target.configId}`
}

function isActive(row: PickerRow) {
  return rowId(row) === activeKey.value
}

function isPending(target: IUploadTarget) {
  return pendingKey.value === rowId({ kind: 'config', target })
}

function hasPendingTarget(type: string) {
  return pendingKey.value.startsWith(`${listId}-config-${type}-`)
}

function initial(name: string) {
  return [...name.trim()][0]?.toLocaleUpperCase() ?? '?'
}

function monogramClass(type: string) {
  return [
    'flex size-6 shrink-0 items-center justify-center rounded-md text-xs font-semibold',
    type === defaultPicBedG.value
      ? 'bg-accent text-white'
      : 'border border-border-secondary bg-bg-secondary text-secondary',
  ]
}

function configRowClass(target: IUploadTarget, idleClass: string) {
  return [
    isActive({ kind: 'config', target })
      ? 'bg-accent/10 text-accent'
      : isSelected(target)
        ? 'bg-accent/5 text-accent hover:bg-accent/10'
        : idleClass,
    isSelected(target) ? 'font-medium' : 'font-normal',
    { 'pointer-events-none': switching.value, 'opacity-50': switching.value && !isPending(target) },
  ]
}

function isGroupExpanded(type: string) {
  // Search reveals matches without overwriting the layout saved for normal browsing.
  if (isSearching.value) return searchExpansion.value[type] ?? true
  // The current provider opens by default so its selected configuration is visible.
  return groupExpansion.value[type] ?? (type === defaultPicBedG.value || !collapseByDefault.value)
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
  expansion.value = {
    ...expansion.value,
    ...Object.fromEntries(expandableGroups.value.map(group => [group.type, expanded])),
  }
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
  searchExpansion.value = {}
  activeKey.value = ''
  open.value = true
  updatePosition()
  syncActiveRow()
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
  // The first Escape clears an active search, the next one closes the picker.
  if (query.value && !switching.value) clearSearch()
  else close()
}

async function scrollActiveIntoView(block: ScrollLogicalPosition = 'nearest') {
  await nextTick()
  const row = activeRow.value
  if (!row) return
  const element = document.getElementById(rowId(row))
  const scrollTarget = row.kind === 'provider' ? element?.firstElementChild : element
  scrollTarget?.scrollIntoView({ block })
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
  const providerKey = row.kind === 'config' ? rowId({ kind: 'provider', type: row.target.type }) : ''
  // Directly selectable providers have no parent row to move back to.
  if (providerKey && !navigationRows.value.some(item => rowId(item) === providerKey)) return
  event.preventDefault()
  if (providerKey) activeKey.value = providerKey
  else if (row.kind === 'provider') setGroupExpanded(row.type, false)
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
  pendingKey.value = rowId({ kind: 'config', target })
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

function syncActiveRow(previousRows: PickerRow[] = []) {
  const rows = navigationRows.value
  if (rows.some(row => rowId(row) === activeKey.value)) return
  const previous = previousRows.find(row => rowId(row) === activeKey.value)
  const next =
    (previous?.kind === 'config'
      ? rows.find(row => row.kind === 'provider' && row.type === previous.target.type)
      : undefined) ||
    rows.find(row => row.kind === 'config' && isSelected(row.target)) ||
    (isSearching.value
      ? rows.find(row => row.kind === 'config')
      : rows.find(row => row.kind === 'provider' && row.type === defaultPicBedG.value)) ||
    rows[0]
  activeKey.value = next ? rowId(next) : ''
}

watch(query, () => {
  searchExpansion.value = {}
  activeKey.value = ''
})

watch(navigationRows, (_, previousRows) => {
  const hadRows = previousRows.length > 0
  syncActiveRow(previousRows)
  void scrollActiveIntoView(hadRows ? 'nearest' : 'center')
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
