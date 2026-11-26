export type TransferListKind = 'upload' | 'download'

export interface TransferTaskSnapshot<T> {
  revision: number
  tasks: T[]
}

export interface TransferTaskDiff<T> {
  fromRevision: number
  revision: number
  upserted: T[]
  removed: string[]
}
