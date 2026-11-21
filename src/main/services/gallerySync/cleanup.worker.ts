import { readFileSync } from 'node:fs'
import { parentPort, workerData } from 'node:worker_threads'
import { gunzipSync, gzipSync } from 'node:zlib'

import { hasBackupPayload } from '~/services/uploads/backupPayload'

import { cleanBackupPayloads, digest, GallerySyncError, recoverLocalDocument, validateDocument } from './model'

function compact(file: string) {
  const original = readFileSync(file)
  // Local galleries can exceed the sync download limit. Keep their JSON and hashing off the main thread.
  const bytes = gunzipSync(original)
  if (!bytes.includes('"bufferCopy"') && !bytes.includes('"base64ImageCopy"') && !bytes.includes('\\u')) return
  const data = JSON.parse(bytes.toString('utf8'))
  if (
    !Array.isArray(data?.gallery) ||
    !data.gallery.some((row: unknown) => row && typeof row === 'object' && hasBackupPayload(row))
  )
    return
  if (data.__sync === undefined && data.__gallery_KEY__ === undefined) {
    data.__gallery_KEY__ = Object.fromEntries(data.gallery.map((row: { id: string }) => [row.id, 1]))
  }
  let validated
  try {
    validated = validateDocument(data)
  } catch (error) {
    if (!(error instanceof GallerySyncError)) throw error
    validated = recoverLocalDocument(data)
  }
  // Keep the original order, other collections and extension metadata. Supply any recovered revisions.
  const records = Object.assign(Object.create(null), validated.__sync.records, data.__sync?.records)
  const clean = cleanBackupPayloads({
    ...data,
    __sync: { ...data.__sync, version: 1, records },
  })
  validateDocument(clean)
  return { originalHash: digest(original), replacement: gzipSync(JSON.stringify(clean)) }
}

const result = compact(workerData)
parentPort!.postMessage(result)
