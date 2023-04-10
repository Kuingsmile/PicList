import { clipboard, nativeImage } from 'electron'
import { EventEmitter } from 'events'

class ClipboardWatcher extends EventEmitter {
  lastImage: Electron.NativeImage | null
  timer: NodeJS.Timeout | null

  constructor () {
    super()
    this.lastImage = null
    this.timer = null
  }

  startListening (watchDelay = 500) {
    this.stopListening()

    const image = clipboard.readImage()
    if (!image.isEmpty()) {
      const dataUrl = image.toDataURL()
      this.lastImage = nativeImage.createFromDataURL(dataUrl)
    }

    this.timer = setInterval(() => {
      const image = clipboard.readImage()
      if (image.isEmpty()) {
        return
      }

      const dataUrl = image.toDataURL()
      const currentImage = nativeImage.createFromDataURL(dataUrl)

      if (this.lastImage) {
        const lastDataUrl = this.lastImage.toDataURL()
        if (lastDataUrl === dataUrl) {
          return
        }
      }

      this.lastImage = currentImage
      this.emit('change', currentImage)
    }, watchDelay)
  }

  stopListening () {
    if (this.timer) {
      clearInterval(this.timer)
      this.timer = null
    }
  }
}

export default new ClipboardWatcher()
