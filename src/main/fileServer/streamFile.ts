import { constants } from 'node:fs'
import { open } from 'node:fs/promises'
import type { ServerResponse } from 'node:http'
import { pipeline } from 'node:stream/promises'

/** The caller validates the canonical path against the preview root before opening it. */
export async function streamPreviewFile(filePath: string, response: ServerResponse, headOnly = false) {
  const file = await open(filePath, constants.O_RDONLY | (constants.O_NOFOLLOW || 0) | (constants.O_NONBLOCK || 0))
  try {
    const stat = await file.stat()
    if (!stat.isFile()) throw new Error('Not a regular preview file')
    if (response.destroyed) return
    response.setHeader('Content-Length', stat.size)
    if (headOnly) {
      response.end()
      return
    }
    // Backpressure bounds the buffer and pipeline destroys the input on disconnect.
    await pipeline(file.createReadStream({ highWaterMark: 64 * 1024 }), response)
  } finally {
    await file.close()
  }
}
