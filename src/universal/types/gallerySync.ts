export type GallerySyncResolution = 'keep-local' | 'keep-remote' | 'preserve-both'
export type GallerySyncSource = 'local-primary' | 'local-backup' | 'remote-primary' | 'remote-backup'

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
