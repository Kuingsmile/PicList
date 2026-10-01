import { EventEmitter } from 'node:events'

// Use EventEmitter's own once wrapper so listener identity, removal and `this` binding remain intact.
const bus = new EventEmitter()
bus.setMaxListeners(50)

export default bus
