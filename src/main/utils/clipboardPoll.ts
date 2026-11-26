import { webcrypto } from 'node:crypto'
import { EventEmitter } from 'node:events'

import logger from '@core/picgo/logger'

import { readEncodedClipboard } from '~/utils/clipboard'

type ClipboardState = { kind: 'empty'; value: null } | { kind: 'image' | 'path'; value: string }

class ClipboardWatcher extends EventEmitter {
  private timer: NodeJS.Timeout | null = null

  startListening(watchDelay = 1000) {
    this.stopListening(false)
    let previous: ClipboardState | undefined
    let reading = false
    const poll = async () => {
      if (reading) return
      reading = true
      try {
        const current = await this.getClipboardState()
        if (this.timer !== timer) return
        if (
          previous &&
          current.kind !== 'empty' &&
          (current.kind !== previous.kind || current.value !== previous.value)
        ) {
          this.emit('change')
        }
        previous = current
      } catch (error) {
        logger.warn(`Failed to read clipboard: ${error}`)
      } finally {
        reading = false
      }
    }
    const timer = setInterval(poll, watchDelay)
    this.timer = timer
    void poll()
    logger.info('Start to watch clipboard')
  }

  stopListening(isLog = true) {
    if (this.timer) {
      clearInterval(this.timer)
      this.timer = null
    }
    isLog && logger.info('Stop to watch clipboard')
  }

  private async getClipboardState(): Promise<ClipboardState> {
    const { filePath, image } = await readEncodedClipboard()
    if (filePath) return { kind: 'path', value: filePath }
    if (!image) return { kind: 'empty', value: null }
    const digest = await webcrypto.subtle.digest('SHA-256', await image.arrayBuffer())
    return { kind: 'image', value: Buffer.from(digest).toString('hex') }
  }
}

export default new ClipboardWatcher()
