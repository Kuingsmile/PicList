import crypto from 'node:crypto'
import { EventEmitter } from 'node:events'

import logger from '@core/picgo/logger'
import { clipboard, type NativeImage } from 'electron'

import { getClipboardFilePath } from '~/utils/clipboard'

type ClipboardState = { kind: 'empty'; value: null } | { kind: 'image' | 'path'; value: string }

class ClipboardWatcher extends EventEmitter {
  timer: NodeJS.Timeout | null
  private lastClipboardState: ClipboardState

  constructor() {
    super()
    this.lastClipboardState = { kind: 'empty', value: null }
    this.timer = null
  }

  startListening(watchDelay = 1000) {
    this.stopListening(false)
    this.lastClipboardState = this.getClipboardState()

    this.timer = setInterval(() => {
      const currentState = this.getClipboardState()
      const previousState = this.lastClipboardState
      this.lastClipboardState = currentState

      if (
        currentState.kind !== 'empty' &&
        (currentState.kind !== previousState.kind || currentState.value !== previousState.value)
      ) {
        this.emit('change')
      }
    }, watchDelay)
    logger.info('Start to watch clipboard')
  }

  stopListening(isLog = true) {
    if (this.timer) {
      clearInterval(this.timer)
      this.timer = null
    }
    this.lastClipboardState = { kind: 'empty', value: null }
    isLog && logger.info('Stop to watch clipboard')
  }

  private getClipboardState(): ClipboardState {
    // Reuse the snapshot: reading an image decodes the clipboard's PNG on every call.
    const image = clipboard.readImage()
    const imgPath = getClipboardFilePath(image)
    if (imgPath) return { kind: 'path', value: imgPath }

    if (image.isEmpty()) return { kind: 'empty', value: null }

    return { kind: 'image', value: this.getImageHash(image) }
  }

  getImageHash(image: NativeImage): string {
    const buffer = image.toBitmap()
    return crypto.createHash('sha256').update(buffer).digest('hex')
  }
}

export default new ClipboardWatcher()
