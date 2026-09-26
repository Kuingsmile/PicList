import path from 'node:path'

import fs from 'fs-extra'
import writeFileAtomic from 'write-file-atomic'

const pendingWrites = new Map<string, Promise<unknown>>()

async function mutateFile<T>(file: string, mutation: (target: string) => Promise<T>): Promise<T> {
  const target = path.resolve(file)
  const key = process.platform === 'win32' ? target.toLowerCase() : target
  // Include directory creation and deletion in the queue, so arrival order is preserved.
  const operation = (pendingWrites.get(key) ?? Promise.resolve()).catch(() => {}).then(() => mutation(target))
  pendingWrites.set(key, operation)
  try {
    return await operation
  } finally {
    if (pendingWrites.get(key) === operation) pendingWrites.delete(key)
  }
}

/** Resolves only after the atomic replacement has completed; failures leave the old file intact. */
export function writeRpcFile(file: string, content: string): Promise<true> {
  return mutateFile<true>(file, async target => {
    await fs.ensureDir(path.dirname(target))
    await writeFileAtomic(target, content, { encoding: 'utf8' })
    return true
  })
}

export function removeRpcFile(file: string): Promise<true> {
  return mutateFile<true>(file, async target => {
    await fs.rm(target, { force: true })
    return true
  })
}
