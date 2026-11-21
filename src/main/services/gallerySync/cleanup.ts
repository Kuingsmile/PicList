import path from 'node:path'

import fs from 'fs-extra'
import writeFile from 'write-file-atomic'

import createCleanupWorker from './cleanup.worker?nodeWorker'
import { withGalleryLock } from './lock'
import { digest, GallerySyncError } from './model'
import { DATABASES, readOptional, stateDir } from './storage'

interface CompactedGallery {
  originalHash: string
  replacement: Uint8Array
}

export function cleanupGallery(root: string): Promise<string | undefined> {
  return withGalleryLock(async () => {
    const file = path.join(root, DATABASES[0])
    if (!fs.existsSync(file)) return
    const pending = path.join(stateDir(root), 'pending.json')
    const assertNoPendingSync = () => {
      if (fs.existsSync(pending)) throw new GallerySyncError('Gallery recovery is required before cleanup.')
    }
    assertNoPendingSync()
    const result = await new Promise<CompactedGallery | undefined>((resolve, reject) => {
      const worker = createCleanupWorker({ workerData: file })
      worker.once('message', resolve)
      worker.once('error', reject)
      worker.once('exit', () => reject(new GallerySyncError('Gallery cleanup worker exited before completing.')))
    })
    if (!result) return
    const original = await fs.readFile(file)
    if (digest(original) !== result.originalHash) throw new GallerySyncError('Gallery changed during cleanup. Retry.')
    const backup = `${file}.before-payload-cleanup-${result.originalHash}.bak`
    // Atomic creation leaves a complete backup for retries, even if the process stops before replacing the DB.
    let saved = await readOptional(backup)
    if (!saved) {
      await writeFile(backup, original, { mode: 0o600 })
      saved = await fs.readFile(backup)
    }
    if (!saved.equals(original)) throw new GallerySyncError('Gallery cleanup backup verification failed.')
    if (!(await fs.readFile(file)).equals(original))
      throw new GallerySyncError('Gallery changed during cleanup. Retry.')
    assertNoPendingSync()
    await writeFile(file, Buffer.from(result.replacement))
    return backup
  })
}
