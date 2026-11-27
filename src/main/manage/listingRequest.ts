import { setImmediate as yieldToEventLoop } from 'node:timers/promises'

import { ipcMain, type WebContents } from 'electron'

import {
  LISTING_ACK_TIMEOUT_MS,
  LISTING_PAGE_BYTES,
  LISTING_PAGE_ITEMS,
  LISTING_PROGRESS_INTERVAL_MS,
  listingChannels,
  type ListingData,
  listingItemKey,
  type ListingRequest,
  type ListingResult,
  type ListingUpdate,
  sameListingRequest,
} from '../../shared/listing'

export interface ListingContext {
  signal: AbortSignal
  /** Publish only new objects and await backpressure before fetching another provider page. */
  publish: (data: ListingData) => Promise<void>
  /** Stop waiting even when a provider SDK cannot abort its underlying request. */
  wait: <T>(operation: () => PromiseLike<T>) => Promise<T>
}

/** One acknowledged page in flight. Retains keys and a bounded buffer, never earlier objects. */
export async function runListingRequest(
  request: ListingRequest,
  operation: (context: ListingContext) => Promise<ListingData | void>,
  send?: (result: ListingUpdate) => void,
  onError?: (error: unknown) => void,
  options: { sender?: WebContents; ackTimeoutMs?: number; signal?: AbortSignal } = {},
): Promise<ListingResult> {
  const controller = new AbortController()
  const { signal } = controller
  const channels = listingChannels(request.kind)
  const seen = new Set<string>()
  let pending: any[] = []
  let pendingBytes = 2
  let inFlight: Promise<void> | undefined
  let sequence = 0
  let total = 0
  let lastProgress = 0
  let cancelled = false
  let acknowledgement: { sequence: number; resolve: () => void } | undefined
  let latest: ListingResult = { ...request, fullList: [], success: false, finished: false, phase: 'page' }

  const matchesSender = (event: { sender?: WebContents }) => !options.sender || event.sender === options.sender
  const cancel = (event: { sender?: WebContents }, value: unknown) => {
    if (matchesSender(event) && sameListingRequest(request, value)) stop()
  }
  const stop = () => {
    cancelled = true
    controller.abort()
  }
  const acknowledge = (event: { sender?: WebContents }, value: any) => {
    const ackSequence = value?.sequence
    if (matchesSender(event) && sameListingRequest(request, value) && ackSequence === acknowledgement?.sequence) {
      acknowledgement?.resolve()
    }
  }
  const wait: ListingContext['wait'] = async operation => {
    signal.throwIfAborted()
    let rejectAbort!: (error: unknown) => void
    const aborted = new Promise<never>((_resolve, reject) => {
      rejectAbort = reject
    })
    const onAbort = () => rejectAbort(signal.reason)
    signal.addEventListener('abort', onAbort, { once: true })
    try {
      const result = await Promise.race([
        aborted,
        Promise.resolve().then(() => {
          signal.throwIfAborted()
          return operation()
        }),
      ])
      signal.throwIfAborted()
      return result
    } finally {
      signal.removeEventListener('abort', onAbort)
    }
  }
  const finish = (phase: ListingResult['phase'], data?: ListingData) => {
    if (latest.finished) return
    latest = {
      ...data,
      ...request,
      fullList: send ? [] : (data?.fullList ?? []),
      phase,
      finished: true,
      success: phase === 'complete',
      ...(phase === 'error' ? { error: 'LISTING_FAILED' as const } : {}),
    }
    // Terminal markers never re-send objects, and do not require an acknowledgement.
    send?.({
      ...request,
      items: [],
      sequence: ++sequence,
      total,
      phase,
      finished: true,
      success: latest.success,
      ...(latest.error ? { error: latest.error } : {}),
    })
  }
  const flush = async () => {
    if (!pending.length) return
    await inFlight
    signal.throwIfAborted()
    const items = pending
    pending = []
    pendingBytes = 2
    total += items.length
    const page: ListingUpdate = {
      ...request,
      items,
      sequence: ++sequence,
      total,
      phase: 'page',
      finished: false,
      success: false,
    }
    let timeout: ReturnType<typeof setTimeout> | undefined
    inFlight = wait(
      () =>
        new Promise<void>((resolve, reject) => {
          acknowledgement = { sequence: page.sequence, resolve }
          timeout = setTimeout(
            () => reject(new Error('Listing acknowledgement timed out')),
            options.ackTimeoutMs ?? LISTING_ACK_TIMEOUT_MS,
          )
          send!(page)
        }),
    ).finally(() => {
      clearTimeout(timeout)
      acknowledgement = undefined
    })
    // Surface timeout/send failures even while the next provider request is pending.
    void inFlight.catch(error => controller.abort(error))
    lastProgress = performance.now()
  }

  // Size a group once on the normal path. Split only when the exact UTF-8 JSON budget requires it.
  const append = async (items: any[]): Promise<void> => {
    if (!items.length) return
    const bytes = Buffer.byteLength(JSON.stringify(items))
    if (bytes > LISTING_PAGE_BYTES) {
      if (items.length === 1) throw new Error('Listing item exceeds page budget')
      const middle = Math.ceil(items.length / 2)
      await append(items.slice(0, middle))
      await append(items.slice(middle))
      return
    }
    const combined = pendingBytes + bytes - 1
    if (pending.length && (combined > LISTING_PAGE_BYTES || pending.length + items.length > LISTING_PAGE_ITEMS))
      await flush()
    pendingBytes = pending.length ? pendingBytes + bytes - 1 : bytes
    pending.push(...items)
    if (pending.length === LISTING_PAGE_ITEMS) await flush()
  }

  const context: ListingContext = {
    signal,
    wait,
    async publish(data) {
      if (signal.aborted || latest.finished) return
      if (!send) {
        latest = { ...latest, ...data, fullList: [...data.fullList], finished: false }
        if (data.finished) finish(data.success ? 'complete' : 'error', latest)
        return
      }
      // The provider may fetch its next page while the renderer processes the previous one.
      await inFlight
      for (let start = 0; start < data.fullList.length; start += LISTING_PAGE_ITEMS) {
        signal.throwIfAborted()
        const items = data.fullList.slice(start, start + LISTING_PAGE_ITEMS).filter(item => {
          const key = listingItemKey(item)
          if (seen.has(key)) return false
          seen.add(key)
          return true
        })
        await append(items)
        if (start + LISTING_PAGE_ITEMS <= data.fullList.length) await wait(() => yieldToEventLoop())
      }
      // Coalesce small, fast provider pages. Counts travel with data, not separate notifications.
      if (!sequence || performance.now() - lastProgress >= LISTING_PROGRESS_INTERVAL_MS || data.finished) await flush()
      if (data.finished) {
        await inFlight
        signal.throwIfAborted()
        finish(data.success ? 'complete' : 'error')
      }
    },
  }
  if (options.signal?.aborted) stop()
  else options.signal?.addEventListener('abort', stop, { once: true })
  ipcMain.on(channels.cancel, cancel)
  if (send) ipcMain.on(channels.ack, acknowledge)
  options.sender?.once('destroyed', stop)
  options.sender?.once('render-process-gone', stop)
  options.sender?.once('did-start-navigation', stop)
  try {
    const result = await wait(() => operation(context))
    if (!latest.finished) await context.publish({ ...(result ?? latest), finished: true })
  } catch (error) {
    if (!cancelled) onError?.(error)
    // Preserve buffered partial results on provider failure. A dead/slow consumer or cancellation
    // must never wait for another acknowledgement merely to terminate.
    try {
      if (!signal.aborted) {
        await flush()
        await inFlight
      }
    } catch {}
    try {
      finish(cancelled ? 'cancelled' : 'error')
    } catch {} // A destroyed renderer cannot receive its terminal marker.
  } finally {
    pending = []
    seen.clear()
    options.signal?.removeEventListener('abort', stop)
    ipcMain.removeListener(channels.cancel, cancel)
    ipcMain.removeListener(channels.ack, acknowledge)
    options.sender?.removeListener('destroyed', stop)
    options.sender?.removeListener('render-process-gone', stop)
    options.sender?.removeListener('did-start-navigation', stop)
  }
  return latest
}
