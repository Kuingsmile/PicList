import { v4 as uuidv4 } from 'uuid'

import {
  listingChannels,
  type ListingRequest,
  type ListingResult,
  sameListingRequest,
} from '../../../universal/listing'

type Bridge = Pick<Window['electron'], 'sendToMain' | 'ipcRendererOn'>

/** One consumer's current generation. No shared store or channel-wide cleanup. */
export class ListingSession {
  private active?: { request: ListingRequest; finished: boolean; unsubscribe?: () => void }
  private disposed = false

  constructor(private readonly bridge: Bridge) {}

  get request() {
    return this.active?.request
  }

  begin(identity: Omit<ListingRequest, 'requestId'>): ListingRequest {
    this.cancel()
    const request = { ...identity, requestId: uuidv4() }
    if (!this.disposed) this.active = { request, finished: false }
    return request
  }

  isCurrent(request: ListingRequest) {
    return !this.disposed && !!this.active && sameListingRequest(this.active.request, request)
  }

  accept(request: ListingRequest, result: ListingResult): boolean {
    if (!this.isCurrent(request) || this.active!.finished || !sameListingRequest(request, result)) return false
    if (result.finished) this.complete(request)
    return true
  }

  complete(request: ListingRequest) {
    if (!this.isCurrent(request)) return
    this.active!.finished = true
    this.active!.unsubscribe?.()
    this.active!.unsubscribe = undefined
  }

  subscribe(request: ListingRequest, consume: (result: ListingResult) => void) {
    if (!this.isCurrent(request)) return
    this.active!.unsubscribe?.()
    this.active!.unsubscribe = this.bridge.ipcRendererOn(listingChannels(request.kind).result, result => {
      if (this.accept(request, result)) consume(result)
    })
  }

  cancel() {
    const active = this.active
    this.active = undefined
    active?.unsubscribe?.()
    if (active && !active.finished) this.bridge.sendToMain(listingChannels(active.request.kind).cancel, active.request)
  }

  dispose() {
    this.disposed = true
    this.cancel()
  }
}
