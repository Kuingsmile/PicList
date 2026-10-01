import type { BulkContext, BulkInput, BulkPolicy } from '#/bulkChanges'
import {
  bulkChangeStatus,
  commitBulkChanges,
  discardBulkChanges,
  previewGalleryChanges,
  previewRemoteChanges,
} from '~/bulkChanges/registry'
import { IRPCActionType, IRPCType } from '~/constants'

export default [
  {
    action: IRPCActionType.BULK_PREVIEW_REMOTE_RENAME,
    type: IRPCType.INVOKE,
    handler: (event: IIPCEvent, [context, items]: [BulkContext, BulkInput[]]) =>
      previewRemoteChanges(event, context, items),
  },
  {
    action: IRPCActionType.BULK_PREVIEW_GALLERY_URL,
    type: IRPCType.INVOKE,
    handler: (event: IIPCEvent, [items]: [BulkInput[]]) => previewGalleryChanges(event, items),
  },
  {
    action: IRPCActionType.BULK_CHANGES_STATUS,
    type: IRPCType.INVOKE,
    handler: async (event: IIPCEvent, [id]: [string]) => bulkChangeStatus(event, id),
  },
  {
    action: IRPCActionType.BULK_CHANGES_COMMIT,
    type: IRPCType.INVOKE,
    handler: (event: IIPCEvent, [id, policy, retryFailed]: [string, BulkPolicy, boolean]) =>
      commitBulkChanges(event, id, policy, retryFailed),
  },
  {
    action: IRPCActionType.BULK_CHANGES_DISCARD,
    type: IRPCType.INVOKE,
    handler: async (event: IIPCEvent, [id, releaseAfterRun]: [string, boolean?]) =>
      discardBulkChanges(event, id, releaseAfterRun),
  },
]
