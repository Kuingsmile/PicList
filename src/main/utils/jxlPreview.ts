import { stat } from 'node:fs/promises'
import path from 'node:path'
import { fileURLToPath } from 'node:url'
import { Worker } from 'node:worker_threads'

import { PreviewCache } from '#/utils/previewCache'

import decoderPath from './jxlPreview.worker?modulePath'

const MAX_CACHE_SIZE = 16 * 1024 * 1024
const cache = new PreviewCache(Object.create(null), MAX_CACHE_SIZE)
const pending = new Map<string, Promise<string | undefined>>()

interface DecodeJob {
  source: string
  resolve: (result: string | undefined) => void
  reject: (error: Error) => void
}
interface Decoder {
  worker: Worker
  job?: DecodeJob
  idle?: NodeJS.Timeout
}

const workers = new Set<Decoder>()
const waiting: DecodeJob[] = []

function createDecoder(): Decoder {
  // A Node worker must be able to open its entry point and WASM dependency outside the app archive.
  const worker = new Worker(
    decoderPath.replace(`${path.sep}app.asar${path.sep}`, `${path.sep}app.asar.unpacked${path.sep}`),
  )
  const decoder: Decoder = { worker }
  workers.add(decoder)
  const stopped = () => {
    if (!workers.delete(decoder)) return
    clearTimeout(decoder.idle)
    decoder.job?.reject(new Error('JPEG XL preview worker stopped'))
    dispatch()
  }
  worker.once('error', stopped)
  worker.once('exit', stopped)
  worker.on('message', (value: string | undefined | null) => {
    if (value === null) decoder.job?.reject(new Error('JPEG XL preview failed'))
    else decoder.job?.resolve(value)
    decoder.job = undefined
    worker.unref()
    decoder.idle = setTimeout(() => {
      workers.delete(decoder)
      void worker.terminate()
    }, 30_000).unref()
    dispatch()
  })
  return decoder
}

function dispatch() {
  while (waiting.length) {
    let decoder = [...workers].find(slot => !slot.job)
    if (!decoder && workers.size >= 2) return
    const job = waiting.shift()!
    try {
      decoder ??= createDecoder()
      clearTimeout(decoder.idle)
      decoder.worker.ref()
      decoder.job = job
      decoder.worker.postMessage(job.source)
    } catch (error) {
      if (decoder) {
        workers.delete(decoder)
        void decoder.worker.terminate()
      }
      job.reject(error as Error)
    }
  }
}

export async function convertJxlSourceToPngDataUrl(source: string, isKnownJxl = false): Promise<string | undefined> {
  if (!source || /^(data:|blob:)/i.test(source)) return
  const remote = /^https?:\/\//i.test(source)
  const sourcePath = remote ? new URL(source).pathname : source
  if (!isKnownJxl && path.extname(sourcePath.split(/[?#]/, 1)[0]).toLowerCase() !== '.jxl') return
  const location = source.startsWith('file://') ? fileURLToPath(source) : source
  let key = location
  if (!remote) {
    const info = await stat(location, { bigint: true })
    key = `${info.dev}:${info.ino}:${info.size}:${info.mtimeNs}:${info.ctimeNs}:${location}`
  }
  const cached = cache.get(key)
  if (cached) return cached
  const existing = pending.get(key)
  if (existing) return existing
  const result = new Promise<string | undefined>((resolve, reject) => {
    waiting.push({ source: location, resolve, reject })
    dispatch()
  })
    .then(preview => {
      if (preview && preview.length <= MAX_CACHE_SIZE) cache.set(key, preview, remote ? Date.now() + 60_000 : Infinity)
      return preview
    })
    .finally(() => pending.delete(key))
  pending.set(key, result)
  return result
}
