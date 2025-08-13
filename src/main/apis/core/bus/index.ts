import { EventEmitter } from 'node:events'

class OptimizedBus extends EventEmitter {
  constructor () {
    super()
    this.setMaxListeners(50)
  }

  once (event: string | symbol, listener: (...args: any[]) => void): this {
    const wrappedListener = (...args: any[]) => {
      try {
        listener(...args)
      } finally {
        this.removeListener(event, wrappedListener)
      }
    }
    return super.once(event, wrappedListener)
  }

  cleanupListeners () {
    const events = this.eventNames()
    events.forEach(event => {
      const listenerCount = this.listenerCount(event)
      console.log(` listener count (${listenerCount}) for event: ${String(event)}`)
    })
  }
}

const bus = new OptimizedBus()

export default bus
