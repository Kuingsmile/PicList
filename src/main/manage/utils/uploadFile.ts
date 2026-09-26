import { createHash, randomUUID } from 'node:crypto'
import { createReadStream, type ReadStream, statSync } from 'node:fs'
import http from 'node:http'
import https from 'node:https'
import path from 'node:path'
import type { Duplex } from 'node:stream'
import { finished } from 'node:stream/promises'

import UpDownTaskQueue from '../datastore/upDownTaskQueue'
import {
  type TransferContext,
  TransferError,
  type TransferLimits,
  type TransferOutcome,
  type TransferResources,
  transferScheduler,
} from '../transferScheduler'

export const MIB = 1024 * 1024
const hash = (values: unknown[]) => createHash('sha256').update(JSON.stringify(values)).digest('hex')
const activeUploads = new Map<string, Promise<TransferOutcome>>()

interface UploadFile extends IStringKeyMap {
  filePath: string
  fileName: string
  fileSize: number
  key: string
}

interface UploadBatchOptions {
  provider: string
  // Fallback identity for direct adapter calls. Hashed before use, never logged.
  account: unknown[]
  normalizeKey?: boolean
  maxFileSize?: number
  accountConcurrency?: number
  memory?: (file: UploadFile) => number
  multipart?: { minPartSize: number; maxParts: number; maxConcurrency?: number }
}

interface UploadContext extends TransferContext {
  id: string
  progress: (percent: number) => void
}

export function uploadResources(
  file: UploadFile,
  options: UploadBatchOptions,
  limits: TransferLimits,
): TransferResources {
  if (options.maxFileSize !== undefined && file.fileSize > options.maxFileSize) throw new TransferError('size')
  if (options.multipart) {
    const partSize = Math.max(options.multipart.minPartSize, Math.ceil(file.fileSize / options.multipart.maxParts))
    // Include one look-ahead part plus stream/chunk copying overhead.
    const slots = Math.min(
      limits.multipartConcurrency,
      options.multipart.maxConcurrency ?? Infinity,
      limits.globalConcurrency,
      limits.accountConcurrency,
      Math.max(1, Math.floor(limits.memoryBytes / partSize) - 2),
      Math.max(1, Math.ceil(file.fileSize / partSize)),
    )
    return { slots, partSize, memoryBytes: Math.max(MIB, (slots + 2) * Math.min(file.fileSize, partSize)) }
  }
  return { slots: 1, memoryBytes: Math.ceil(options.memory?.(file) ?? MIB) }
}

export async function scheduleUploadBatch(
  config: IStringKeyMap,
  options: UploadBatchOptions,
  upload: (file: UploadFile, context: UploadContext) => Promise<void>,
): Promise<boolean> {
  const store = UpDownTaskQueue.getInstance()
  const accountId = `${options.provider}:${hash([config.accountId ?? options.account])}`
  const promises = (config.fileArray as UploadFile[]).map(input => {
    const file: UploadFile = { ...input, key: options.normalizeKey ? input.key.replace(/^\/+/, '') : input.key }
    const identity = `${accountId}:${hash([options.account, file.bucketName, file.region, file.githubBranch, file.key, path.resolve(file.filePath)])}`
    const existing = activeUploads.get(identity)
    if (existing) return existing
    const id = `${identity}:${randomUUID()}`
    store.addUploadTask({
      id,
      accountId: config.accountId ?? accountId,
      provider: options.provider,
      progress: 0,
      status: 'queuing',
      sourceFileName: file.fileName,
      sourceFilePath: file.filePath,
      targetFilePath: file.key,
      targetFileBucket: file.bucketName,
      targetFileRegion: file.region,
    })
    // Register the attempt before scheduling: even synchronous admission failures may settle immediately.
    let resolve!: (outcome: TransferOutcome) => void
    const promise = new Promise<TransferOutcome>(done => {
      resolve = done
    })
    activeUploads.set(identity, promise)
    let admittedSize: number | undefined
    queueMicrotask(() => {
      void transferScheduler
        .schedule({
          id,
          accountId,
          accountConcurrency: options.accountConcurrency,
          signal: config.signal,
          resources: limits => {
            if (admittedSize === undefined) {
              const stat = statSync(file.filePath)
              if (!stat.isFile()) throw new TransferError('unsupported')
              file.fileSize = stat.size
              admittedSize = stat.size
            }
            return uploadResources(file, options, limits)
          },
          onStart: () => store.updateUploadTask({ id, status: 'uploading' }),
          onCancel: () => store.updateUploadTask({ id, cancelRequested: true }),
          run: async context => {
            // The file may have changed while queued. Recheck before creating a stream or buffer.
            const stat = statSync(file.filePath)
            if (!stat.isFile() || stat.size !== admittedSize) throw new TransferError('file')
            await upload(file, {
              ...context,
              id,
              progress: percent => {
                if (!context.signal.aborted && Number.isFinite(percent)) {
                  store.updateUploadTask({ id, progress: Math.max(0, Math.min(99, Math.floor(percent))) })
                }
              },
            })
          },
          onFinish: outcome => {
            activeUploads.delete(identity)
            store.updateUploadTask({
              id,
              status: outcome.status,
              progress: outcome.success ? 100 : 0,
              response: outcome,
              finishTime: new Date().toLocaleString(),
            })
          },
        })
        .then(resolve)
    })
    return promise
  })
  return (await Promise.all(promises)).every(result => result.success)
}

// COS has no AbortSignal option and cancelTask suppresses its completion callback.
// Isolate its transport per job instead, so aborted requests still settle the SDK promise.
export function createUploadAgents(signal: AbortSignal) {
  const agents = { http: new http.Agent(), https: new https.Agent() }
  const sockets = new Set<Duplex>()
  const closing: Promise<void>[] = []
  let closed = false
  for (const agent of Object.values(agents)) {
    const connect = agent.createConnection.bind(agent)
    agent.createConnection = (...[options, callback]: Parameters<http.Agent['createConnection']>) => {
      if (closed || signal.aborted) {
        // Report through Agent's callback; destroying a socket before Node attaches
        // request listeners can emit an unhandled error during SDK retries.
        queueMicrotask(() => callback?.(new TransferError('aborted'), undefined!))
        return undefined
      }
      const socket = connect(options, callback)
      if (socket) {
        sockets.add(socket)
        closing.push(
          new Promise<void>(resolve =>
            socket.once('close', () => {
              sockets.delete(socket)
              resolve()
            }),
          ),
        )
      }
      return socket
    }
  }
  const abort = () => {
    for (const socket of sockets) socket.destroy(new TransferError('aborted'))
  }
  const detach = onUploadAbort(signal, abort)
  return {
    ...agents,
    async close() {
      closed = true
      detach()
      agents.http.destroy()
      agents.https.destroy()
      await Promise.all(closing)
    },
  }
}

export function onUploadAbort(signal: AbortSignal, abort: () => void): () => void {
  signal.throwIfAborted()
  signal.addEventListener('abort', abort, { once: true })
  return () => signal.removeEventListener('abort', abort)
}

export async function withUploadStream<T>(
  filePath: string,
  signal: AbortSignal,
  run: (stream: ReadStream) => Promise<T>,
): Promise<T> {
  signal.throwIfAborted()
  const source = createReadStream(filePath)
  // Attach immediately: providers may authenticate asynchronously before consuming the stream.
  const closed = finished(source, { cleanup: true }).catch(() => {})
  const detach = onUploadAbort(signal, () => source.destroy(new TransferError('aborted')))
  try {
    return await run(source)
  } finally {
    detach()
    source.destroy()
    await closed
  }
}
