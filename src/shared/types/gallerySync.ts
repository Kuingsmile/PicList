export type GallerySyncResolution = 'keep-local' | 'keep-remote' | 'preserve-both'
export type GallerySyncSource = 'local-primary' | 'remote-primary'

export const DEFAULT_GALLERY_SNAPSHOT_LIMIT = 10
export const MAX_GALLERY_SNAPSHOT_LIMIT = 100

export interface GallerySyncChange {
  key: string
  kind: 'addition' | 'update' | 'conflict' | 'deletion'
  versions: {
    source: GallerySyncSource
    revision: string
    deleted: boolean
    name: string
    details: Record<string, string>
  }[]
  // Informational only: the old timestamp rule is never applied implicitly.
  legacySuggestion?: 'keep-local' | 'keep-remote'
}

export interface GallerySyncPlan {
  id: string
  startingWatermark: number
  changes: GallerySyncChange[]
  counts: Record<GallerySyncChange['kind'], number>
  migration: boolean
}

export type GallerySyncRequest =
  | { action: 'preview' }
  | { action: 'list-snapshots' }
  | { action: 'snapshot-settings' }
  | { action: 'set-snapshot-retention'; limit: number }
  | { action: 'delete-snapshot'; snapshotId: string }
  | { action: 'apply'; planId: string; resolutions: Record<string, GallerySyncResolution> }
  | { action: 'cancel'; planId: string }
  | { action: 'export-summary'; planId: string }
  | { action: 'export-rollback'; snapshotId: string }

export interface GallerySyncResult {
  snapshotId: string
  watermark: number
}

export interface GallerySyncSnapshot {
  id: string
  status: 'prepared' | 'committing' | 'committed' | 'rolled-back'
  watermark: number
}

export interface GallerySyncSnapshotDetails extends GallerySyncSnapshot {
  sizeBytes: number
  deletable: boolean
}

export interface GallerySyncSnapshotSettings {
  retentionLimit: number
  snapshots: GallerySyncSnapshotDetails[]
}
