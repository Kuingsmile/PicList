import crypto from 'node:crypto'
import { EventEmitter } from 'node:events'

import logger from '@core/picgo/logger'
import { clipboard, NativeImage } from 'electron'

import { getClipboardFilePath } from '~/utils/common'

class ClipboardWatcher extends EventEmitter {
  timer: NodeJS.Timeout | null
  lastImageHash: string | null
  lastImagePath: string | null

  constructor() {
    super()
    this.lastImageHash = null
    this.lastImagePath = null
    this.timer = null
  }

  startListening(watchDelay = 1000) {
    this.stopListening(false)

    this.timer = setInterval(() => {
      const imgPath = getClipboardFilePath()
      if (imgPath) {
        if (this.lastImagePath === imgPath) return
        this.lastImagePath = imgPath
        this.emit('change')
        return
      }
      const image = clipboard.readImage()
      if (image.isEmpty()) return

      const currentImageHash = this.getImageHash(image)
      if (this.lastImageHash === null || this.lastImageHash === currentImageHash) {
        this.lastImageHash = currentImageHash
        return
      }

      this.lastImageHash = currentImageHash
      this.emit('change')
    }, watchDelay)
    logger.info('Start to watch clipboard')
  }

  stopListening(isLog = true) {
    if (this.timer) {
      clearInterval(this.timer)
      this.timer = null
      this.lastImageHash = null
      this.lastImagePath = null
    }
    isLog && logger.info('Stop to watch clipboard')
  }

  getImageHash(image: NativeImage): string {
    const buffer = image.toBitmap()
    return crypto.createHash('md5').update(buffer).digest('hex')
  }
}

export default new ClipboardWatcher()
