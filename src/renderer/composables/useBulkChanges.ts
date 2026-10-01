import { computed, onBeforeUnmount, ref, shallowRef } from 'vue'
import { useI18n } from 'vue-i18n'

import type { BulkPolicy, BulkSnapshot } from '#/bulkChanges'
import { IRPCActionType } from '#/constants/rpcActions'

export function useBulkChanges(afterRun: (snapshot: BulkSnapshot) => Promise<void>) {
  const { t } = useI18n()
  const snapshot = shallowRef<BulkSnapshot>()
  const visible = ref(false)
  const building = ref(false)
  const submitting = ref(false)
  const uncertain = ref(false)
  const error = ref('')
  const policy = ref<BulkPolicy | ''>('')
  const busy = computed(() => submitting.value || uncertain.value || !!snapshot.value?.running)
  let timer: ReturnType<typeof setTimeout> | undefined
  let disposed = false
  let refreshed = ''

  async function release(id: string) {
    try {
      await window.electron.triggerRPC(IRPCActionType.BULK_CHANGES_DISCARD, id, true)
    } catch {
      // The main process also releases this window's sessions when it is destroyed.
    }
  }

  async function accept(result: BulkSnapshot | undefined) {
    if (disposed) return
    if (!result || result.plan.id !== snapshot.value?.plan.id) throw new Error('Missing bulk results')
    snapshot.value = result
    uncertain.value = false
    if (!result.running && result.committed) {
      const revision = JSON.stringify(result.outcomes)
      if (refreshed !== revision) {
        refreshed = revision
        try {
          await afterRun(result)
        } catch {
          error.value = t('common.bulk.refreshFailed')
        }
      }
    }
  }

  async function refresh() {
    if (!snapshot.value || disposed) return
    try {
      const result = await window.electron.triggerRPC<BulkSnapshot>(
        IRPCActionType.BULK_CHANGES_STATUS,
        snapshot.value.plan.id,
      )
      if (result?.committed) error.value = ''
      await accept(result)
    } catch {
      error.value = t('common.bulk.connectionFailed')
    }
  }

  function poll() {
    clearTimeout(timer)
    timer = setTimeout(async () => {
      await refresh()
      if (!disposed && busy.value) poll()
    }, 750)
  }

  async function preview(action: string, ...args: unknown[]) {
    if (busy.value || building.value || snapshot.value) return false
    building.value = true
    error.value = ''
    try {
      const result = await window.electron.triggerRPC<BulkSnapshot>(action, ...args)
      if (!result) throw new Error('Missing bulk preview')
      if (disposed) {
        await release(result.plan.id)
        return false
      }
      snapshot.value = result
      policy.value = ''
      refreshed = ''
      visible.value = true
      return true
    } catch {
      error.value = t('common.bulk.previewFailed')
      return false
    } finally {
      building.value = false
    }
  }

  async function execute(retryFailed = false) {
    if (!snapshot.value || !policy.value || busy.value) return
    submitting.value = true
    uncertain.value = true
    error.value = ''
    poll()
    try {
      await accept(
        await window.electron.triggerRPC<BulkSnapshot>(
          IRPCActionType.BULK_CHANGES_COMMIT,
          snapshot.value.plan.id,
          policy.value,
          retryFailed,
        ),
      )
    } catch {
      error.value = t('common.bulk.connectionFailed')
      await refresh()
    } finally {
      submitting.value = false
      if (!busy.value) clearTimeout(timer)
    }
  }

  async function discard() {
    if (!snapshot.value || busy.value) return
    try {
      if (!(await window.electron.triggerRPC<boolean>(IRPCActionType.BULK_CHANGES_DISCARD, snapshot.value.plan.id)))
        return
      snapshot.value = undefined
      visible.value = false
      error.value = ''
    } catch {
      error.value = t('common.bulk.connectionFailed')
    }
  }

  function reopen() {
    if (!snapshot.value) return false
    visible.value = true
    return true
  }

  onBeforeUnmount(() => {
    disposed = true
    clearTimeout(timer)
    if (snapshot.value) void release(snapshot.value.plan.id)
    snapshot.value = undefined
  })

  return { snapshot, visible, building, busy, error, policy, preview, execute, refresh, discard, reopen }
}
