import { ipcMain } from 'electron'

import {
  listingChannels,
  type ListingData,
  type ListingRequest,
  type ListingResult,
  sameListingRequest,
} from '../../universal/listing'

export interface ListingContext {
  signal: AbortSignal
  publish: (data: ListingData) => void
  /** Stop waiting even when a provider SDK cannot abort its underlying request. */
  wait: <T>(operation: () => PromiseLike<T>) => Promise<T>
}

/** Owns exactly one cancellation subscription, including failures during client construction. */
export async function runListingRequest(
  request: ListingRequest,
  operation: (context: ListingContext) => Promise<ListingData | void>,
  send?: (result: ListingResult) => void,
  onError?: (error: unknown) => void,
): Promise<ListingResult> {
  const controller = new AbortController()
  const { signal } = controller
  const channel = listingChannels(request.kind).cancel
  let latest: ListingResult = { ...request, fullList: [], success: false, finished: false, phase: 'page' }
  const publish = (data: ListingData, phase?: ListingResult['phase']) => {
    if (latest.finished) return
    phase ??= signal.aborted ? 'cancelled' : data.finished ? (data.success ? 'complete' : 'error') : 'page'
    latest = {
      ...data,
      ...request,
      fullList: [...data.fullList],
      phase,
      finished: phase !== 'page',
      success: phase === 'complete',
      ...(phase === 'error' ? { error: 'LISTING_FAILED' as const } : {}),
    }
    send?.(latest)
  }
  const cancel = (_event: unknown, value: unknown) => {
    if (sameListingRequest(request, value)) controller.abort()
  }
  const context: ListingContext = {
    signal,
    publish: data => {
      if (!signal.aborted) publish(data)
    },
    async wait(operation) {
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
    },
  }
  ipcMain.on(channel, cancel)
  try {
    const result = await context.wait(() => operation(context))
    if (!latest.finished) publish({ ...(result ?? latest), finished: true })
  } catch (error) {
    if (!signal.aborted) onError?.(error)
    publish({ ...latest, success: false, finished: true }, signal.aborted ? 'cancelled' : 'error')
  } finally {
    ipcMain.removeListener(channel, cancel)
  }
  return latest
}
