import { readFileSync } from 'node:fs'
import { readFile } from 'node:fs/promises'
import { createRequire } from 'node:module'
import path from 'node:path'
import { fileURLToPath } from 'node:url'

import { initSync, JxlImage } from 'jxl-oxide-wasm'

let isJxlDecoderInitialized = false

function isHttpSource(source: string): boolean {
  return /^https?:\/\//i.test(source)
}

function isInlineSource(source: string): boolean {
  return /^(data:|blob:)/i.test(source)
}

function isJxlSource(source: string): boolean {
  const sourcePath = isHttpSource(source) ? new URL(source).pathname : source
  return path.extname(sourcePath.split(/[?#]/, 1)[0]).toLowerCase() === '.jxl'
}

function normalizeLocalFilePath(source: string): string {
  if (source.startsWith('file://')) {
    return fileURLToPath(source)
  }
  return source
}

function initJxlDecoder() {
  if (isJxlDecoderInitialized) return

  const require = createRequire(import.meta.url)
  const packageJsonPath = require.resolve('jxl-oxide-wasm/package.json')
  const wasmPath = path.join(path.dirname(packageJsonPath), 'jxl_oxide_wasm_bg.wasm')
  const wasmBytes = readFileSync(wasmPath)
  initSync({ module: wasmBytes })
  isJxlDecoderInitialized = true
}

async function readJxlSource(source: string): Promise<Buffer> {
  if (isHttpSource(source)) {
    const response = await fetch(source)
    if (!response.ok) {
      throw new Error(`request failed with status ${response.status}`)
    }
    return Buffer.from(await response.arrayBuffer())
  }

  return await readFile(normalizeLocalFilePath(source))
}

export async function convertJxlSourceToPngDataUrl(source: string, isKnownJxl = false): Promise<string | undefined> {
  if (!source || isInlineSource(source) || (!isKnownJxl && !isJxlSource(source))) return undefined

  const fileBytes = await readJxlSource(source)
  initJxlDecoder()

  const image = new JxlImage()
  try {
    image.feedBytes(fileBytes)
    image.forceSrgb = true

    if (!image.tryInit() || !image.loaded) {
      return undefined
    }

    const pngBytes = image.render().encodeToPng()
    return `data:image/png;base64,${Buffer.from(pngBytes).toString('base64')}`
  } finally {
    image.free()
  }
}
