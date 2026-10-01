<template>
  <div class="flex h-full min-h-0 w-full flex-col gap-4 p-4">
    <div
      class="flex flex-wrap items-center justify-between gap-4 rounded-2xl border border-border-secondary p-5 shadow-md"
    >
      <div class="flex items-center gap-3">
        <KeyboardIcon :size="24" class="text-accent" />
        <div>
          <h1 class="text-2xl font-semibold text-main">{{ t('pages.shortKey.title') }}</h1>
          <p class="mt-1 text-sm text-secondary">{{ t('pages.shortKey.description') }}</p>
        </div>
      </div>
      <div class="flex gap-2">
        <CustomButton
          type="secondary"
          :text="t('pages.shortKey.retry')"
          :disabled="busy || modalVisible"
          @click="retry"
        />
        <CustomButton :text="t('pages.shortKey.addAction')" :disabled="busy" @click="openEditor()" />
      </div>
    </div>

    <p
      v-if="problemCount"
      role="status"
      class="rounded-lg border border-warning/40 bg-warning/10 p-3 text-sm text-main"
    >
      {{ t('pages.shortKey.problems', { count: problemCount }) }}
    </p>
    <input
      v-model="search"
      type="search"
      :aria-label="t('pages.shortKey.search')"
      :placeholder="t('pages.shortKey.search')"
      class="rounded-lg border border-border bg-bg-secondary px-4 py-2 text-sm text-main"
    />

    <div class="min-h-0 flex-1 overflow-auto rounded-2xl border border-border-secondary shadow-md">
      <table class="w-full text-left text-sm text-main">
        <thead class="sticky top-0 bg-bg-secondary text-secondary">
          <tr>
            <th class="px-4 py-3">{{ t('pages.shortKey.name') }}</th>
            <th class="px-4 py-3">{{ t('pages.shortKey.bind') }}</th>
            <th class="px-4 py-3">{{ t('pages.shortKey.status') }}</th>
            <th class="px-4 py-3">{{ t('pages.shortKey.source') }}</th>
            <th class="px-4 py-3">{{ t('pages.shortKey.handle') }}</th>
          </tr>
        </thead>
        <tbody class="divide-y divide-border-secondary">
          <tr v-for="item in filteredList" :key="item.id" class="bg-bg-tertiary hover:bg-accent/5">
            <td class="px-4 py-4">
              <p class="font-semibold">{{ item.label || item.name }}</p>
              <p v-if="item.action" class="mt-1 text-xs text-secondary">{{ actionDescription(item) }}</p>
            </td>
            <td class="px-4 py-4">
              <kbd
                v-if="item.key"
                class="inline-block rounded border border-border bg-bg-secondary px-2 py-1 text-xs"
                >{{ item.key }}</kbd
              >
              <span v-else class="text-secondary">{{ t('pages.shortKey.noBinding') }}</span>
            </td>
            <td class="max-w-xs px-4 py-4">
              <span
                :class="item.status === 'active' ? 'text-success' : item.enable ? 'text-warning' : 'text-secondary'"
              >
                {{ t(`pages.shortKey.states.${item.status}`) }}
              </span>
              <p v-if="item.enable && item.conflicts.length" class="mt-1 text-xs text-warning">
                {{ conflictText(item.conflicts) }}
              </p>
              <p
                v-else-if="['failed', 'unavailable', 'invalid'].includes(item.status)"
                class="mt-1 text-xs text-secondary"
              >
                {{ t(`pages.shortKey.reasons.${item.status}`) }}
              </p>
            </td>
            <td class="px-4 py-4 text-secondary">{{ sourceName(item.from) }}</td>
            <td class="px-4 py-4">
              <div class="flex flex-wrap gap-2">
                <button
                  class="rounded border border-border px-3 py-1.5 text-accent disabled:opacity-40"
                  :disabled="busy || (!item.enable && (!item.key || !item.available))"
                  @click="toggleEnable(item)"
                >
                  {{ t(item.enable ? 'pages.shortKey.disable' : 'pages.shortKey.enable') }}
                </button>
                <button
                  class="rounded border border-border px-3 py-1.5 text-secondary"
                  :disabled="busy"
                  @click="openEditor(item)"
                >
                  {{ t('pages.shortKey.edit') }}
                </button>
                <button
                  v-if="item.from === 'custom'"
                  class="rounded border border-border px-3 py-1.5 text-danger"
                  :disabled="busy"
                  @click="deleteAction(item)"
                >
                  {{ t('pages.shortKey.delete') }}
                </button>
              </div>
            </td>
          </tr>
          <tr v-if="!filteredList.length">
            <td colspan="5" class="p-8 text-center text-secondary">{{ t('pages.shortKey.empty') }}</td>
          </tr>
        </tbody>
      </table>
    </div>

    <CustomModal
      v-model:visible="modalVisible"
      :close-disabled="busy"
      :title="isCustom ? t('pages.shortKey.customAction') : t('pages.shortKey.editBinding')"
      width="600px"
      height="auto"
    >
      <div class="space-y-4 p-5">
        <template v-if="isCustom">
          <label class="block text-sm text-secondary" for="shortcut-name">{{ t('pages.shortKey.actionName') }}</label>
          <input
            id="shortcut-name"
            v-model="draft.label"
            maxlength="120"
            class="w-full rounded border border-border bg-bg-secondary p-3 text-main"
          />
          <label class="block text-sm text-secondary" for="shortcut-action">{{ t('pages.shortKey.actionType') }}</label>
          <select
            id="shortcut-action"
            v-model="actionType"
            class="w-full rounded border border-border bg-bg-secondary p-3 text-main"
          >
            <option value="uploadClipboard">{{ t('pages.shortKey.uploadClipboard') }}</option>
            <option value="uploadFiles">{{ t('pages.shortKey.uploadFiles') }}</option>
          </select>
          <label class="block text-sm text-secondary" for="shortcut-target">{{ t('pages.shortKey.target') }}</label>
          <select
            id="shortcut-target"
            v-model="targetKey"
            class="w-full rounded border border-border bg-bg-secondary p-3 text-main"
          >
            <option value="" disabled>{{ t('pages.shortKey.chooseTarget') }}</option>
            <option v-if="targetKey && !selectedTarget" :value="targetKey" disabled>
              {{ t('pages.shortKey.missingTarget') }}
            </option>
            <option v-for="target in targets" :key="targetId(target)" :value="targetId(target)">
              {{ target.picBedName }} / {{ target.configName }}
            </option>
          </select>
          <p class="text-xs text-secondary">{{ t('pages.shortKey.targetHint') }}</p>
          <label class="flex items-center gap-2 text-sm text-main"
            ><input v-model="draft.enable" type="checkbox" />{{ t('pages.shortKey.enabled') }}</label
          >
        </template>
        <p v-else class="font-semibold text-main">{{ editing?.label || editing?.name }}</p>

        <label for="shortcut-key" class="block text-sm font-semibold text-secondary">{{
          t('pages.shortKey.keyBinding')
        }}</label>
        <input
          id="shortcut-key"
          ref="keyInput"
          :value="draft.key"
          class="w-full rounded-md border border-border bg-bg-secondary p-3 text-center font-mono text-sm text-main focus:border-accent focus:outline-none"
          :placeholder="t('pages.shortKey.pressKeys')"
          readonly
          @keydown="keyDetect"
        />
        <p class="text-xs text-secondary">{{ t('pages.shortKey.pressHint') }}</p>
        <div class="flex gap-2">
          <CustomButton type="secondary" :text="t('pages.shortKey.clear')" :disabled="busy" @click="draft.key = ''" />
          <CustomButton
            v-if="editing?.defaultKey !== undefined"
            type="secondary"
            :text="t('pages.shortKey.restoreDefault')"
            :disabled="busy"
            @click="draft.key = editing.defaultKey || ''"
          />
        </div>
        <p v-if="!draft.key" class="text-xs text-secondary">{{ t('pages.shortKey.clearHint') }}</p>
        <p v-else-if="!draft.enable" class="text-xs text-secondary">{{ t('pages.shortKey.disabledHint') }}</p>
        <p v-if="draftConflicts.length" role="alert" class="rounded bg-warning/10 p-3 text-sm text-warning">
          {{ conflictText(draftConflicts) }}
        </p>
        <p v-if="invalidKey" role="alert" class="text-sm text-danger">{{ t('pages.shortKey.reasons.invalid') }}</p>
        <p v-if="saveError" role="alert" class="text-sm text-danger">{{ saveError }}</p>
      </div>
      <template #footer>
        <CustomButton type="secondary" :text="t('common.cancel')" :disabled="busy" @click="modalVisible = false" />
        <CustomButton :text="t('common.confirm')" :disabled="busy || !canSave" @click="save" />
      </template>
    </CustomModal>
  </div>
</template>

<script lang="ts" setup>
import { KeyboardIcon } from '@lucide/vue'
import { computed, nextTick, onBeforeUnmount, onMounted, ref, watch } from 'vue'
import { useI18n } from 'vue-i18n'

import CustomButton from '@/components/common/CustomButton.vue'
import CustomModal from '@/components/common/CustomModal.vue'
import useConfirm from '@/composables/useConfirm'
import { invokeRPC, saveWithFeedback, showRpcError } from '@/services/rpcService'
import keyBinding from '@/utils/keyBinding'
import { IRPCActionType } from '#/constants/rpcActions'
import { RpcError, rpcErrorMessages } from '#/rpc'
import {
  findShortcutConflicts,
  normalizeShortcut,
  type ShortcutConfig,
  type ShortcutEntry,
  type ShortcutTarget,
  type UploadShortcutAction,
} from '#/shortcuts'

const { t } = useI18n()
const { confirm } = useConfirm()
const list = ref<ShortcutEntry[]>([])
const targets = ref<ShortcutTarget[]>([])
const search = ref('')
const busy = ref(false)
const modalVisible = ref(false)
const editing = ref<ShortcutEntry | null>(null)
const draft = ref<ShortcutConfig>({ name: '', label: '', key: '', enable: true })
const actionType = ref<UploadShortcutAction['type']>('uploadClipboard')
const targetKey = ref('')
const keyInput = ref<HTMLInputElement>()
const saveError = ref('')
let disposed = false
let refreshId = 0
let unsubscribe: (() => void) | undefined

const isCustom = computed(() => !editing.value || editing.value.from === 'custom')
const selectedTarget = computed(() => targets.value.find(target => targetId(target) === targetKey.value))
const invalidKey = computed(() => !!draft.value.key && !normalizeShortcut(draft.value.key, window.electron.platform))
const draftConflicts = computed(() =>
  findShortcutConflicts(
    list.value,
    editing.value?.id || `custom:${draft.value.name}`,
    draft.value.key,
    window.electron.platform,
  ),
)
const canSave = computed(
  () =>
    !invalidKey.value &&
    !(draft.value.enable && draft.value.key && draftConflicts.value.length && !keepsExistingBinding.value) &&
    (!isCustom.value ||
      (!!draft.value.label.trim() && (!!selectedTarget.value || (!draft.value.enable && !!draft.value.action)))),
)
const keepsExistingBinding = computed(
  () =>
    editing.value?.status === 'active' &&
    normalizeShortcut(editing.value.key, window.electron.platform) ===
      normalizeShortcut(draft.value.key, window.electron.platform),
)
const problemCount = computed(
  () => list.value.filter(item => item.enable && !['active', 'paused'].includes(item.status)).length,
)
const filteredList = computed(() => {
  const query = search.value.trim().toLowerCase()
  return list.value.filter(item =>
    [item.label, item.name, item.key, sourceName(item.from), actionDescription(item)]
      .join(' ')
      .toLowerCase()
      .includes(query),
  )
})

function targetId(target: { picBed: string; configId: string }) {
  return JSON.stringify([target.picBed, target.configId])
}
function sourceName(from: string) {
  if (from === 'custom') return t('pages.shortKey.custom')
  if (from === 'picgo') return t('pages.shortKey.builtIn')
  return from.replace('picgo-plugin-', '')
}
function actionDescription(item: ShortcutEntry) {
  if (!item.action) return ''
  const action = item.action
  const target = targets.value.find(target => target.picBed === action.picBed && target.configId === action.configId)
  return `${t(`pages.shortKey.${action.type}`)} · ${target ? `${target.picBedName} / ${target.configName}` : t('pages.shortKey.missingTarget')}`
}
function conflictText(ids: string[]) {
  return t('pages.shortKey.conflictWith', {
    actions: ids
      .map(id => {
        const entry = list.value.find(item => item.id === id)
        return entry ? `${entry.label || entry.name} (${sourceName(entry.from)})` : id
      })
      .join(', '),
  })
}

async function refresh() {
  const requestId = ++refreshId
  try {
    const entries = await window.electron.triggerRPC<ShortcutEntry[]>(IRPCActionType.SHORTKEY_GET_LIST)
    if (!disposed && requestId === refreshId) list.value = entries || []
  } catch (error) {
    if (!disposed) showRpcError(error)
  }
}

async function retry() {
  busy.value = true
  try {
    list.value = (await window.electron.triggerRPC<ShortcutEntry[]>(IRPCActionType.SHORTKEY_RETRY)) || []
    targets.value = (await window.electron.triggerRPC<ShortcutTarget[]>(IRPCActionType.SHORTKEY_GET_TARGETS)) || []
  } catch (error) {
    showRpcError(error)
  } finally {
    busy.value = false
  }
}

async function toggleEnable(item: ShortcutEntry) {
  busy.value = true
  try {
    await saveWithFeedback(() =>
      invokeRPC(IRPCActionType.SHORTKEY_BIND_OR_UNBIND, { ...item, enable: !item.enable }, item.from),
    )
    await refresh()
  } finally {
    busy.value = false
  }
}

async function openEditor(item?: ShortcutEntry) {
  editing.value = item ? { ...item } : null
  draft.value = item ? { ...item } : { name: crypto.randomUUID(), label: '', key: '', enable: true }
  actionType.value = item?.action?.type || 'uploadClipboard'
  targetKey.value = item?.action ? targetId(item.action) : ''
  saveError.value = ''
  modalVisible.value = true
  await nextTick()
  if (!isCustom.value) keyInput.value?.focus()
  else {
    try {
      targets.value = (await window.electron.triggerRPC<ShortcutTarget[]>(IRPCActionType.SHORTKEY_GET_TARGETS)) || []
    } catch (error) {
      showRpcError(error)
    }
  }
}

function keyDetect(event: KeyboardEvent) {
  // Preserve normal keyboard navigation; modified Tab can still be recorded.
  if (event.key === 'Tab' && !event.ctrlKey && !event.altKey && !event.metaKey) return
  event.preventDefault()
  event.stopPropagation()
  const key = keyBinding(event)
  if (key) {
    draft.value.key = key
    saveError.value = ''
  }
}

async function save() {
  if (!canSave.value || busy.value) return
  busy.value = true
  saveError.value = ''
  try {
    if (isCustom.value) {
      const target = selectedTarget.value
      const action = target
        ? { type: actionType.value, picBed: target.picBed, configId: target.configId }
        : draft.value.action
      await invokeRPC(IRPCActionType.SHORTKEY_SAVE_CUSTOM, {
        ...draft.value,
        action,
        enable: draft.value.enable && !!draft.value.key,
      })
    } else if (editing.value) {
      await invokeRPC(IRPCActionType.SHORTKEY_UPDATE, draft.value, editing.value.key, editing.value.from)
    }
    modalVisible.value = false
    await refresh()
  } catch (error) {
    saveError.value = error instanceof RpcError ? error.message : rpcErrorMessages.INTERNAL_ERROR
  } finally {
    busy.value = false
  }
}

async function deleteAction(item: ShortcutEntry) {
  if (
    !(await confirm({
      title: t('pages.shortKey.deleteAction'),
      message: t('pages.shortKey.deleteConfirm', { name: item.label }),
      type: 'warning',
    }))
  )
    return
  busy.value = true
  try {
    await saveWithFeedback(() => invokeRPC(IRPCActionType.SHORTKEY_DELETE_CUSTOM, item.id))
    await refresh()
  } finally {
    busy.value = false
  }
}

function pauseCapture() {
  window.electron.sendRPC(IRPCActionType.SHORTKEY_TOGGLE_SHORTKEY_MODIFIED_MODE, false)
}
function resumeCapture() {
  window.electron.sendRPC(IRPCActionType.SHORTKEY_TOGGLE_SHORTKEY_MODIFIED_MODE, modalVisible.value)
}
watch(modalVisible, () => {
  resumeCapture()
})
onMounted(async () => {
  unsubscribe = window.electron.ipcRendererOn('shortcutsChanged', refresh)
  window.addEventListener('blur', pauseCapture)
  window.addEventListener('focus', resumeCapture)
  await retry()
})
onBeforeUnmount(() => {
  disposed = true
  unsubscribe?.()
  window.removeEventListener('blur', pauseCapture)
  window.removeEventListener('focus', resumeCapture)
  pauseCapture()
})
</script>
