import { readFileSync } from 'node:fs'
import { readFile } from 'node:fs/promises'
import { parentPort } from 'node:worker_threads'

import { initSync, JxlImage } from 'jxl-oxide-wasm'

initSync({ module: readFileSync(new URL(import.meta.resolve('jxl-oxide-wasm/module.wasm'))) })

async function readJxlSource(source: string): Promise<Buffer> {
  if (/^https?:\/\//i.test(source)) {
    const response = await fetch(source, { signal: AbortSignal.timeout(30_000) })
    if (!response.ok) {
      throw new Error(`request failed with status ${response.status}`)
    }
    return Buffer.from(await response.arrayBuffer())
  }

  return await readFile(source)
}

async function decodeJxlSource(source: string): Promise<string | undefined> {
  const fileBytes = await readJxlSource(source)

  const image = new JxlImage()
  try {
    image.feedBytes(fileBytes)
    image.forceSrgb = true

    if (!image.tryInit() || !image.loaded) {
      return undefined
    }

    // encodeToPng takes ownership of the frame and returns an owned Uint8Array.
    const pngBytes = image.render().encodeToPng()
    return `data:image/png;base64,${Buffer.from(pngBytes.buffer, pngBytes.byteOffset, pngBytes.byteLength).toString('base64')}`
  } finally {
    image.free()
  }
}

parentPort!.on('message', async (source: string) => {
  try {
    parentPort!.postMessage(await decodeJxlSource(source))
  } catch {
    parentPort!.postMessage(null)
  }
})
