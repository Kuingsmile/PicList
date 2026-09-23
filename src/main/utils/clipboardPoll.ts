import crypto from 'node:crypto'
import { EventEmitter } from 'node:events'

import logger from '@core/picgo/logger'
import { clipboard, NativeImage } from 'electron'

import { getClipboardFilePath } from '~/utils/common'

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
    const imgPath = getClipboardFilePath()
    if (imgPath) return { kind: 'path', value: imgPath }

    const image = clipboard.readImage()
    if (image.isEmpty()) return { kind: 'empty', value: null }

    return { kind: 'image', value: this.getImageHash(image) }
  }

  getImageHash(image: NativeImage): string {
    const buffer = image.toBitmap()
    return crypto.createHash('md5').update(buffer).digest('hex')
  }
}

export default new ClipboardWatcher()
