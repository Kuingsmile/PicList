import path from 'node:path'
import { gunzipSync, gzipSync } from 'node:zlib'

import fs from 'fs-extra'
import writeFile from 'write-file-atomic'

import { GallerySyncError, validateDocument } from './model'

export const DATABASES = ['piclist.db', 'piclist.bak.db'] as const
export const stateDir = (root: string) => path.join(root, 'gallery-sync')
export const snapshotDir = (root: string, id: string) => {
  if (!/^[a-f0-9-]{36}$/.test(id)) throw new GallerySyncError('Invalid gallery snapshot.')
  return path.join(stateDir(root), 'snapshots', id)
}
export const encode = (data: unknown) => gzipSync(Buffer.from(JSON.stringify(data)))
export function decode(data: Buffer): any {
  try {
    return JSON.parse(gunzipSync(data, { maxOutputLength: 128 * 1024 * 1024 }).toString('utf8'))
  } catch {
    throw new GallerySyncError('Invalid compressed gallery database. No changes were applied.')
  }
}
export function decodeBundle(content: Buffer) {
  const bundle = decode(content)
  if (bundle?.version !== 1) throw new GallerySyncError('Unsupported gallery sync format.')
  return [validateDocument(bundle.primary), validateDocument(bundle.backup)]
}
export async function readOptional(file: string): Promise<Buffer | null> {
  try {
    return await fs.readFile(file)
  } catch (error: any) {
    if (error.code === 'ENOENT') return null
    throw error
  }
}

export interface Journal {
  id: string
  ownerPid: number
  startingWatermark: number
  watermark: number
  existed: boolean[]
  status: 'prepared' | 'committing' | 'committed' | 'rolled-back'
}
export function readJournal(root: string, id: string): Journal {
  const data = fs.readJsonSync(path.join(snapshotDir(root, id), 'journal.json'))
  if (
    data.id !== id ||
    !Number.isSafeInteger(data.ownerPid) ||
    data.ownerPid <= 0 ||
    !Number.isFinite(data.startingWatermark) ||
    !Number.isFinite(data.watermark) ||
    !Array.isArray(data.existed) ||
    data.existed.length !== 2 ||
    data.existed.some((x: unknown) => typeof x !== 'boolean') ||
    !['prepared', 'committing', 'committed', 'rolled-back'].includes(data.status)
  )
    throw new GallerySyncError('Invalid gallery recovery journal.')
  return data
}
export const saveJournal = (root: string, journal: Journal) =>
  writeFile(path.join(snapshotDir(root, journal.id), 'journal.json'), JSON.stringify(journal))

// Synchronous startup recovery must run before dbChecker replaces the startup backup,
// and before any store can read a pair interrupted between its atomic file replacements.
export function recoverGallerySync(root: string, saveWatermark: (value: number) => void): void {
  const pending = path.join(stateDir(root), 'pending.json')
  if (!fs.existsSync(pending)) return
  try {
    const { id } = fs.readJsonSync(pending)
    const journal = readJournal(root, id)
    if (journal.ownerPid !== process.pid) {
      let ownerRunning = true
      try {
        process.kill(journal.ownerPid, 0)
      } catch (error: any) {
        ownerRunning = error.code !== 'ESRCH'
      }
      if (ownerRunning) throw new GallerySyncError('Another process owns this gallery sync.')
    }
    if (journal.status === 'committing') {
      // Read and validate every preimage before restoring either file.
      const originals = DATABASES.map((file, i) =>
        journal.existed[i] ? fs.readFileSync(path.join(snapshotDir(root, id), 'local', file)) : null,
      )
      originals.forEach(buffer => {
        if (buffer) validateDocument(decode(buffer))
      })
      DATABASES.forEach((file, i) => {
        const target = path.join(root, file)
        if (originals[i]) writeFile.sync(target, originals[i]!)
        else if (fs.existsSync(target)) fs.unlinkSync(target)
      })
      saveWatermark(journal.startingWatermark)
    }
    if (journal.status !== 'committed' && journal.status !== 'rolled-back') {
      journal.status = 'rolled-back'
      writeFile.sync(path.join(snapshotDir(root, id), 'journal.json'), JSON.stringify(journal))
    }
    fs.unlinkSync(pending)
  } catch {
    throw new GallerySyncError(
      'Gallery recovery is incomplete. The rollback snapshot has been retained; retry before editing or syncing.',
    )
  }
}
