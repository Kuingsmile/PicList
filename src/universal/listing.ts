/** Shared by listing commands, incremental pages, invoke results and cancellation. */
export interface ListingRequest {
  /** New for each consumer generation, including navigation back to the same prefix. */
  requestId: string
  /** The manager's account alias; never credentials. */
  accountId: string
  provider: string
  bucketName: string
  prefix: string
  kind: 'files' | 'download' | 'buckets'
}

export interface ListingData {
  /** One provider page (or one paginated invoke response), never an accumulated stream. */
  fullList: any[]
  success: boolean
  finished?: boolean
  isTruncated?: boolean
  nextMarker?: string | number
}

export interface ListingResult extends ListingRequest, ListingData {
  phase: 'page' | 'complete' | 'error' | 'cancelled'
  finished: boolean
  error?: 'LISTING_FAILED'
}

/** Stream completion/error/cancellation carries no items; only pages carry new objects. */
export interface ListingUpdate extends ListingRequest {
  items: any[]
  sequence: number
  /** Number of unique objects sent so far, including this page. */
  total: number
  phase: ListingResult['phase']
  finished: boolean
  success: boolean
  error?: 'LISTING_FAILED'
}

export const LISTING_PAGE_ITEMS = 500
/** UTF-8 JSON item payload budget; request metadata and IPC framing are additional. */
export const LISTING_PAGE_BYTES = 256 * 1024
export const LISTING_PROGRESS_INTERVAL_MS = 50
export const LISTING_ACK_TIMEOUT_MS = 30_000

/** Keys are opaque, case-sensitive provider paths, scoped by the request identity. First occurrence wins. */
export function listingItemKey(item: any): string {
  if (typeof item?.key !== 'string') throw new Error('Missing provider listing key')
  return item.key
}

export const listingChannels = (kind: ListingRequest['kind']) => ({
  cancel: kind === 'download' ? 'cancelDownloadLoadingFileList' : 'cancelLoadingFileList',
  result: kind === 'download' ? 'refreshDownloadFileTransferList' : 'refreshFileTransferList',
  ack: kind === 'download' ? 'ackDownloadFileListPage' : 'ackFileListPage',
})

export function isListingRequest(value: unknown): value is ListingRequest {
  if (!value || typeof value !== 'object') return false
  const request = value as ListingRequest
  return (
    ['requestId', 'accountId', 'provider', 'bucketName', 'prefix'].every(
      key => typeof request[key as keyof ListingRequest] === 'string',
    ) &&
    !!request.requestId &&
    !!request.accountId &&
    !!request.provider &&
    ['files', 'download', 'buckets'].includes(request.kind)
  )
}

export function sameListingRequest(expected: ListingRequest, value: unknown): value is ListingRequest {
  return (
    isListingRequest(value) &&
    (['requestId', 'accountId', 'provider', 'bucketName', 'prefix', 'kind'] as const).every(
      key => expected[key] === value[key],
    )
  )
}
