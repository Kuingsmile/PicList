import { randomUUID } from 'node:crypto'

import { GalleryDB } from '@core/datastore'

import { ManageApi } from '~/manage/manageApi'

import { type BulkContext, type BulkInput, type BulkPolicy, isBulkPolicy } from '../../shared/bulkChanges'
import { createGalleryAdapter } from './gallery'
import { createRemoteAdapter } from './remote'
import { BulkChangeSession } from './session'

const sessions = new Map<
  string,
  { owner: number; scope: string; session: BulkChangeSession; releaseAfterRun?: boolean }
>()
const owners = new Set<number>()
const busyScopes = new Set<string>()

function inputs(value: unknown): asserts value is BulkInput[] {
  if (
    !Array.isArray(value) ||
    !value.length ||
    value.length > 10000 ||
    value.some(item => !item || !['id', 'source', 'target'].every(key => typeof item[key] === 'string')) ||
    value.some(item => !item.id || !item.source) ||
    new Set(value.map(item => item.id)).size !== value.length
  )
    throw new Error('Invalid bulk selection')
}

function remember(event: IIPCEvent, scope: string, session: BulkChangeSession) {
  const owner = event.sender.id
  if (event.sender.isDestroyed()) throw new Error('Preview window was closed')
  sessions.set(session.plan.id, { owner, scope, session })
  if (!owners.has(owner)) {
    owners.add(owner)
    event.sender.once('destroyed', () => {
      for (const [id, entry] of sessions) if (entry.owner === owner) sessions.delete(id)
      owners.delete(owner)
    })
  }
  return session.snapshot()
}

function owned(event: IIPCEvent, id: string) {
  const entry = sessions.get(id)
  if (!entry || entry.owner !== event.sender.id) throw new Error('Bulk preview is no longer available')
  return entry
}

export async function previewRemoteChanges(event: IIPCEvent, context: BulkContext, selection: BulkInput[]) {
  inputs(selection)
  if (
    !context ||
    !['provider', 'accountId', 'bucketName', 'region'].every(
      key => typeof context[key as keyof BulkContext] === 'string',
    )
  ) {
    throw new Error('Invalid provider context')
  }
  const api = new ManageApi(context.accountId)
  if (api.currentPicBedConfig.picBedName !== context.provider) throw new Error('Provider context changed')
  const frozenContext = Object.freeze({
    provider: context.provider,
    accountId: context.accountId,
    bucketName: context.bucketName,
    region: context.region,
  })
  const adapter = await createRemoteAdapter(frozenContext, await api.createClient())
  const session = await BulkChangeSession.preview(
    randomUUID(),
    selection.map(item => ({
      id: JSON.stringify([frozenContext, item.source]),
      source: item.source,
      target: item.target,
      context: frozenContext,
    })),
    adapter,
  )
  return remember(event, JSON.stringify(frozenContext), session)
}

export async function previewGalleryChanges(event: IIPCEvent, selection: BulkInput[]) {
  inputs(selection)
  const { candidates, adapter } = await createGalleryAdapter(selection, GalleryDB.getInstance())
  return remember(event, 'gallery', await BulkChangeSession.preview(randomUUID(), candidates, adapter))
}

export function bulkChangeStatus(event: IIPCEvent, id: string) {
  return owned(event, id).session.snapshot()
}

export async function commitBulkChanges(event: IIPCEvent, id: string, policy: BulkPolicy, retryFailed: boolean) {
  if (!isBulkPolicy(policy) || typeof retryFailed !== 'boolean') throw new Error('Invalid commit policy')
  const entry = owned(event, id)
  const { session, scope } = entry
  if (session.snapshot().running) return session.run(policy, retryFailed)
  if (busyScopes.has(scope)) throw new Error('Another bulk change is running in this destination')
  busyScopes.add(scope)
  try {
    return await session.run(policy, retryFailed)
  } finally {
    busyScopes.delete(scope)
    if (entry.releaseAfterRun) sessions.delete(id)
  }
}

export function discardBulkChanges(event: IIPCEvent, id: string, releaseAfterRun = false) {
  const entry = owned(event, id)
  if (entry.session.snapshot().running) {
    // An unmounted page can relinquish its results without interrupting remote writes.
    if (releaseAfterRun === true) entry.releaseAfterRun = true
    return releaseAfterRun === true
  }
  return sessions.delete(id)
}
