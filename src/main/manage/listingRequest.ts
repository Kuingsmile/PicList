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
} from '../../universal/listing'

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
  options: { sender?: WebContents; ackTimeoutMs?: number } = {},
): Promise<ListingResult> {
  const controller = new AbortController()
  const { signal } = controller
  const channels = listingChannels(request.kind)
  const seen = new Set<string>()
  let pending: any[] = []
  let pendingBytes = 2
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
    try {
      await wait(
        () =>
          new Promise<void>((resolve, reject) => {
            acknowledgement = { sequence: page.sequence, resolve }
            timeout = setTimeout(
              () => reject(new Error('Listing acknowledgement timed out')),
              options.ackTimeoutMs ?? LISTING_ACK_TIMEOUT_MS,
            )
            send!(page)
          }),
      )
      lastProgress = performance.now()
    } catch (error) {
      controller.abort(error)
      throw error
    } finally {
      clearTimeout(timeout)
      acknowledgement = undefined
    }
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
      for (let index = 0; index < data.fullList.length; index++) {
        signal.throwIfAborted()
        const item = data.fullList[index]
        const key = listingItemKey(item)
        if (!seen.has(key)) {
          const bytes = Buffer.byteLength(JSON.stringify(item), 'utf8') + 1
          if (bytes + 2 > LISTING_PAGE_BYTES) throw new Error('Listing item exceeds page budget')
          if (pending.length && pendingBytes + bytes > LISTING_PAGE_BYTES) await flush()
          seen.add(key)
          pending.push(item)
          pendingBytes += bytes
          if (pending.length === LISTING_PAGE_ITEMS) await flush()
        }
        // Even pages containing only duplicates must let cancellation and timers run.
        if ((index + 1) % LISTING_PAGE_ITEMS === 0) await wait(() => yieldToEventLoop())
      }
      // Coalesce small, fast provider pages. Counts travel with data, not separate notifications.
      if (!sequence || performance.now() - lastProgress >= LISTING_PROGRESS_INTERVAL_MS || data.finished) await flush()
      if (data.finished) finish(data.success ? 'complete' : 'error')
    },
  }
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
      if (!signal.aborted) await flush()
    } catch {}
    try {
      finish(cancelled ? 'cancelled' : 'error')
    } catch {} // A destroyed renderer cannot receive its terminal marker.
  } finally {
    pending = []
    seen.clear()
    ipcMain.removeListener(channels.cancel, cancel)
    ipcMain.removeListener(channels.ack, acknowledge)
    options.sender?.removeListener('destroyed', stop)
    options.sender?.removeListener('render-process-gone', stop)
    options.sender?.removeListener('did-start-navigation', stop)
  }
  return latest
}
