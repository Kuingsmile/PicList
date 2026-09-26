import { v4 as uuidv4 } from 'uuid'

import {
  LISTING_PAGE_ITEMS,
  listingChannels,
  listingItemKey,
  type ListingRequest,
  type ListingResult,
  type ListingUpdate,
  sameListingRequest,
} from '../../../universal/listing'

type Bridge = Pick<Window['electron'], 'sendToMain' | 'ipcRendererOn'>

/** One consumer's current generation. No shared store or channel-wide cleanup. */
export class ListingSession {
  private active?: {
    request: ListingRequest
    finished: boolean
    sequence: number
    seen: Set<string>
    unsubscribe?: () => void
  }
  private disposed = false

  constructor(private readonly bridge: Bridge) {}

  get request() {
    return this.active?.request
  }

  begin(identity: Omit<ListingRequest, 'requestId'>): ListingRequest {
    this.cancel()
    const request = { ...identity, requestId: uuidv4() }
    if (!this.disposed) this.active = { request, finished: false, sequence: 0, seen: new Set() }
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
    this.active!.seen.clear()
    this.active!.unsubscribe?.()
    this.active!.unsubscribe = undefined
  }

  subscribe(request: ListingRequest, consume: (result: ListingUpdate) => void | Promise<void>) {
    if (!this.isCurrent(request)) return
    this.active!.unsubscribe?.()
    this.active!.unsubscribe = this.bridge.ipcRendererOn(
      listingChannels(request.kind).result,
      (result: ListingUpdate) => {
        if (!this.isCurrent(request) || this.active!.finished || !sameListingRequest(request, result)) return
        const active = this.active!
        if (result.sequence !== active.sequence + 1) return
        active.sequence = result.sequence
        const items = result.items.filter(item => {
          const key = listingItemKey(item)
          if (active.seen.has(key)) return false
          active.seen.add(key)
          return true
        })
        if (result.finished) this.complete(request)
        try {
          const consumed = consume({ ...result, items })
          // The consumer can await Vue's render tick before returning its credit.
          void Promise.resolve(consumed)
            .then(() => {
              if (!result.finished && this.isCurrent(request) && !active.finished) {
                this.bridge.sendToMain(listingChannels(request.kind).ack, { ...request, sequence: result.sequence })
              }
            })
            .catch(() => this.isCurrent(request) && this.cancel())
        } catch {
          this.cancel()
        }
      },
    )
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

/** Also safe for large cache hits: never spread an entire bucket into a function call. */
export function appendListingItems(target: any[], items: any[]) {
  for (let offset = 0; offset < items.length; offset += LISTING_PAGE_ITEMS) {
    target.push(...items.slice(offset, offset + LISTING_PAGE_ITEMS))
  }
}
