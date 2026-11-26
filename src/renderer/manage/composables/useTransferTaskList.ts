import { type Ref, ref, watch } from 'vue'

import { MANAGE_DOWNLOAD_TASKS_CHANGED, MANAGE_UPLOAD_TASKS_CHANGED } from '#/constants/ipcChannels'
import { IRPCActionType } from '#/constants/rpcActions'
import type { TransferListKind, TransferTaskDiff, TransferTaskSnapshot } from '#/types/transferTasks'

export function useTransferTaskList<T extends IUploadTask | IDownloadTask>(
  kind: TransferListKind,
  list: Ref<T[]>,
  enabled: () => boolean,
) {
  const failed = ref(false)
  let refreshCurrent = async () => {}
  watch(
    enabled,
    (active, _previous, onCleanup) => {
      if (!active) return
      const token = crypto.randomUUID()
      const channel = kind === 'upload' ? MANAGE_UPLOAD_TASKS_CHANGED : MANAGE_DOWNLOAD_TASKS_CHANGED
      let stopped = false
      let revision = -1
      let loading = false
      let retryDelay = 1000
      let retryTimer: ReturnType<typeof setTimeout> | undefined
      let tasks = new Map<string, T>()
      const buffered: TransferTaskDiff<T>[] = []

      const apply = (diff: TransferTaskDiff<T>) => {
        if (diff.revision <= revision) return
        if (loading) {
          buffered.push(diff)
          return
        }
        if (diff.fromRevision > revision) {
          void refresh()
          return
        }
        for (const id of diff.removed) tasks.delete(id)
        for (const task of diff.upserted) tasks.set(task.id, task)
        list.value = [...tasks.values()]
        revision = diff.revision
      }
      const refresh = async () => {
        if (stopped || loading) return
        clearTimeout(retryTimer)
        loading = true
        try {
          const snapshot = await window.electron.triggerRPC<TransferTaskSnapshot<T>>(
            IRPCActionType.MANAGE_WATCH_TRANSFER_TASKS,
            kind,
            token,
          )
          if (stopped) return
          if (!snapshot) throw new Error('Missing transfer snapshot')
          tasks = new Map(snapshot.tasks.map(task => [task.id, task]))
          list.value = snapshot.tasks
          revision = snapshot.revision
          failed.value = false
          retryDelay = 1000
          loading = false
          for (const diff of buffered.splice(0)) apply(diff)
        } catch {
          if (!stopped) {
            failed.value = true
            retryTimer = setTimeout(refresh, retryDelay)
            retryDelay = Math.min(30_000, retryDelay * 2)
          }
          buffered.length = 0
          loading = false
        }
      }
      const unsubscribe = window.electron.ipcRendererOn(channel, apply)
      onCleanup(() => {
        stopped = true
        clearTimeout(retryTimer)
        buffered.length = 0
        unsubscribe()
        window.electron.sendRPC(IRPCActionType.MANAGE_UNWATCH_TRANSFER_TASKS, kind, token)
      })
      refreshCurrent = refresh
      void refresh()
    },
    { immediate: true },
  )
  return { failed, refresh: () => refreshCurrent() }
}
