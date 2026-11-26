import type { WebContents } from 'electron'

import type { TransferTaskDiff, TransferTaskSnapshot } from '#/types/transferTasks'
import { sendToWindow } from '~/services/uploads/uploadJob'

import { isManagementMetadataKey, isTerminalManagementTask, retainManagementHistory } from './taskMetadata'

export class TransferTaskList<T extends IUploadTask | IDownloadTask> {
  private tasks = new Map<string, T>()
  private revision = 0
  private changedIds = new Set<string>()
  private timer?: NodeJS.Timeout
  private subscribers = new Map<WebContents, { tokens: Set<string>; close: () => void }>()

  constructor(
    private readonly channel: string,
    private readonly scheduleCheckpoint: () => void,
  ) {}

  all() {
    return [...this.tasks.values()]
  }
  get(id: string) {
    return this.tasks.get(id)
  }

  restore(tasks: T[]) {
    this.tasks = new Map(tasks.map(task => [task.id, task]))
  }

  subscribe(sender: WebContents, token: string): TransferTaskSnapshot<T> {
    let subscriber = this.subscribers.get(sender)
    if (!subscriber) {
      const close = () => {
        this.subscribers.delete(sender)
        sender.off('destroyed', close)
        sender.off('did-navigate', close)
      }
      subscriber = { tokens: new Set(), close }
      this.subscribers.set(sender, subscriber)
      sender.once('destroyed', close)
      sender.once('did-navigate', close)
    }
    subscriber.tokens.add(token)
    return { revision: this.revision, tasks: this.all() }
  }

  unsubscribe(sender: WebContents, token: string) {
    const subscriber = this.subscribers.get(sender)
    if (subscriber?.tokens.delete(token) && !subscriber.tokens.size) subscriber.close()
  }

  private changed(id: string) {
    const fromRevision = this.revision++
    if (!this.subscribers.size) return
    this.changedIds.add(id)
    if (this.timer) return
    this.timer = setTimeout(() => {
      this.timer = undefined
      const diff: TransferTaskDiff<T> = { fromRevision, revision: this.revision, upserted: [], removed: [] }
      for (const id of this.changedIds) {
        const task = this.tasks.get(id)
        if (task) diff.upserted.push(task)
        else diff.removed.push(id)
      }
      this.changedIds.clear()
      for (const sender of this.subscribers.keys()) sendToWindow(sender, this.channel, diff)
    }, 150)
  }

  add(task: T) {
    task.createdAt ??= Date.now()
    this.tasks.set(task.id, task)
    this.changed(task.id)
    this.persist()
  }

  update(patch: Partial<T>) {
    const task = patch.id && this.tasks.get(patch.id)
    if (!task || isTerminalManagementTask(task.status)) return
    const keys = Object.keys(patch).filter(key => key !== 'id' && patch[key] !== task[key])
    if (!keys.length) return
    Object.assign(task, patch)
    if (isTerminalManagementTask(task.status)) task.completedAt = Date.now()
    this.changed(task.id)
    if (keys.some(isManagementMetadataKey)) this.persist()
  }

  removeWhere(remove: (task: T) => boolean) {
    let removed = false
    for (const [id, task] of this.tasks) {
      if (!remove(task)) continue
      this.tasks.delete(id)
      this.changed(id)
      removed = true
    }
    if (removed) this.scheduleCheckpoint()
  }

  pruneHistory(): boolean {
    const retained = retainManagementHistory(this.all())
    if (retained.length === this.tasks.size) return false
    const keep = new Set(retained)
    for (const [id, task] of this.tasks) {
      if (!keep.has(task)) {
        this.tasks.delete(id)
        this.changed(id)
      }
    }
    return true
  }

  private persist() {
    this.pruneHistory()
    this.scheduleCheckpoint()
  }
}
