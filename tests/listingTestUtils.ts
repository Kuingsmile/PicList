import type { ListingContext } from '../src/main/manage/listingRequest'
import { runListingRequest } from '../src/main/manage/listingRequest'
import { listingChannels, type ListingRequest } from '../src/universal/listing'

export function listingIdentity(config: IStringKeyMap, kind: ListingRequest['kind'] = 'files'): ListingRequest {
  return {
    requestId: config.requestId ?? 'test-list',
    accountId: config.accountId ?? 'test-account',
    provider: config.provider ?? 'test-provider',
    bucketName: config.bucketName ?? '',
    prefix: config.prefix ?? '',
    kind,
  }
}

export function listFromProvider<T>(
  api: T,
  method: keyof T,
  config: IStringKeyMap,
  send: (channel: string, data: unknown) => void,
) {
  const request = listingIdentity(config, method === 'getBucketListRecursively' ? 'download' : 'files')
  return runListingRequest(
    request,
    listing =>
      (api[method] as (config: IStringKeyMap, listing: ListingContext) => Promise<any>).call(api, config, listing),
    method === 'getBucketFileList' ? undefined : result => send(listingChannels(request.kind).result, result),
  )
}
