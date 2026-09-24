/** Shared by listing commands, streamed snapshots, invoke results and cancellation. */
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
  /** A cumulative snapshot for this request, not a delta to append to another job. */
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

export const listingChannels = (kind: ListingRequest['kind']) => ({
  cancel: kind === 'download' ? 'cancelDownloadLoadingFileList' : 'cancelLoadingFileList',
  result: kind === 'download' ? 'refreshDownloadFileTransferList' : 'refreshFileTransferList',
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
