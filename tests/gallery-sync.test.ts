import os from 'node:os'
import path from 'node:path'

import { DBStore } from '@piclist/store'
import fs from 'fs-extra'
import { afterEach, beforeEach, describe, expect, it, vi } from 'vitest'
import writeFile from 'write-file-atomic'

import {
  applyMerge,
  canonical,
  documentFrom,
  planMerge,
  recordMutation,
  revision,
  validateDocument,
} from '../src/main/utils/gallerySync/model'
import {
  DATABASES,
  decode,
  decodeBundle,
  encode,
  readJournal,
  recoverGallerySync,
  snapshotDir,
  stateDir,
} from '../src/main/utils/gallerySync/storage'
import { trackGalleryStore } from '../src/main/utils/gallerySync/store'
import { GallerySyncTransaction } from '../src/main/utils/gallerySync/transaction'
import { BUNDLE_NAME, type GalleryTransport, type RemoteFile } from '../src/main/utils/gallerySync/transport'
import type { GallerySyncPlan, GallerySyncResolution } from '../src/universal/types/gallerySync'

const legacy = (...records: { id: string; [key: string]: unknown }[]) => ({
  gallery: records,
  __gallery_KEY__: Object.fromEntries(records.map(item => [item.id, 1])),
})
const base = () =>
  legacy({
    id: 'common',
    fileName: 'original.png',
    imgUrl: 'https://example.invalid/original',
    createdAt: 1,
    updatedAt: 1,
  })
const choose = (plan: GallerySyncPlan, resolution: GallerySyncResolution) =>
  Object.fromEntries(plan.changes.filter(item => item.kind === 'conflict').map(item => [item.key, resolution]))

class FakeRemote implements GalleryTransport {
  files = new Map<string, RemoteFile>()
  generation = 0
  set(name: string, content: Buffer) {
    this.files.set(name, { content, version: String(++this.generation) })
  }
  read = vi.fn(async (name: string): Promise<RemoteFile | null> => {
    const file = this.files.get(name)
    return file ? { content: Buffer.from(file.content), version: file.version } : null
  })
  commit = vi.fn(async (content: Buffer, expected: string | null) => {
    if ((this.files.get(BUNDLE_NAME)?.version ?? null) !== expected) return false
    this.set(BUNDLE_NAME, Buffer.from(content))
    return true
  })
}

let directory: string
let remote: FakeRemote
beforeEach(() => {
  directory = fs.mkdtempSync(path.join(os.tmpdir(), 'piclist-sync-test-'))
  remote = new FakeRemote()
})
afterEach(() => {
  vi.restoreAllMocks()
  fs.removeSync(directory)
})

function device(name = 'device', primary: unknown = base(), backup: unknown = primary) {
  const root = path.join(directory, name)
  fs.ensureDirSync(root)
  for (const [i, file] of DATABASES.entries()) fs.writeFileSync(path.join(root, file), encode(i ? backup : primary))
  const store = trackGalleryStore(new DBStore(path.join(root, DATABASES[0]), 'gallery'), root)
  const state = { watermark: 9000, config: 'config', now: 10000 }
  const deps = {
    root,
    transport: () => remote,
    configurationKey: () => state.config,
    getWatermark: () => state.watermark,
    saveWatermark: vi.fn((value: number) => {
      state.watermark = value
    }),
    recoverWatermark: vi.fn((value: number) => {
      state.watermark = value
    }),
    refresh: vi.fn(() => store.refresh()),
    now: () => state.now,
    replace: vi.fn(async (file: string, content: Buffer) => writeFile(file, content)),
  }
  const engine = new GallerySyncTransaction(deps)
  return {
    root,
    store,
    state,
    deps,
    engine,
    bytes: () => DATABASES.map(file => fs.readFileSync(path.join(root, file))),
    document: () => validateDocument(decode(fs.readFileSync(path.join(root, DATABASES[0])))),
  }
}

async function sync(client: ReturnType<typeof device>, resolution: GallerySyncResolution = 'preserve-both') {
  const plan = await client.engine.preview()
  await client.engine.apply(plan.id, choose(plan, resolution))
  return plan
}

describe('gallery transaction', () => {
  it('leaves a fresh installation without database files untouched on upload failure', async () => {
    const client = device()
    DATABASES.forEach(file => fs.unlinkSync(path.join(client.root, file)))
    const plan = await client.engine.preview()
    remote.commit.mockResolvedValueOnce(false)
    await expect(client.engine.apply(plan.id, {})).rejects.toThrow('upload')
    expect(DATABASES.some(file => fs.existsSync(path.join(client.root, file)))).toBe(false)
    expect(client.deps.refresh).not.toHaveBeenCalled()
    expect(client.deps.saveWatermark).not.toHaveBeenCalled()
  })

  it('validates the backup inside a published bundle as well as its primary', async () => {
    const client = device()
    remote.set(BUNDLE_NAME, encode({ version: 1, primary: base(), backup: { gallery: 'invalid' } }))
    await expect(client.engine.preview()).rejects.toThrow('Invalid gallery')
    expect(remote.commit).not.toHaveBeenCalled()
  })

  it('keeps an external edit that arrives during publication and requires a new preview', async () => {
    const client = device()
    const plan = await client.engine.preview()
    const external = encode(legacy({ id: 'external-edit' }))
    const commit = remote.commit.getMockImplementation()!
    remote.commit.mockImplementationOnce(async (...args) => {
      await fs.writeFile(path.join(client.root, DATABASES[0]), external)
      return commit(...args)
    })
    await expect(client.engine.apply(plan.id, {})).rejects.toThrow('changed during publication')
    expect(client.bytes()[0]).toEqual(external)
    expect(client.deps.replace).not.toHaveBeenCalled()
    expect(client.deps.saveWatermark).not.toHaveBeenCalled()
  })

  it('previews without writes and includes old remote-only records from both primary and backup', async () => {
    const client = device()
    const before = client.bytes()
    remote.set(DATABASES[0], encode(legacy({ id: 'remote-primary-only', updatedAt: 0 })))
    remote.set(DATABASES[1], encode(legacy({ id: 'remote-backup-only', updatedAt: 2 })))
    const plan = await client.engine.preview()
    expect(plan.startingWatermark).toBe(9000)
    expect(plan.counts).toEqual({ addition: 3, update: 0, conflict: 0, deletion: 0 })
    expect(client.bytes()).toEqual(before)
    expect(remote.commit).not.toHaveBeenCalled()
    expect(client.deps.saveWatermark).not.toHaveBeenCalled()

    const result = await client.engine.apply(plan.id, {})
    expect(client.document().gallery.map(item => item.id)).toEqual([
      'common',
      'remote-backup-only',
      'remote-primary-only',
    ])
    expect(client.bytes()[0]).toEqual(client.bytes()[1])
    expect(remote.commit).toHaveBeenCalledOnce()
    expect(client.deps.saveWatermark).toHaveBeenCalledExactlyOnceWith(10000)
    expect(readJournal(client.root, result.snapshotId).status).toBe('committed')
    expect(fs.readFileSync(path.join(snapshotDir(client.root, result.snapshotId), 'local', DATABASES[0]))).toEqual(
      before[0],
    )
  })

  it.each(['local-primary', 'local-backup', 'remote-primary', 'remote-backup'])(
    'validates %s before writing',
    async source => {
      const client = device()
      const invalid = encode({ gallery: [{ id: 'duplicate' }, { id: 'duplicate' }], __gallery_KEY__: { duplicate: 1 } })
      const file = source.endsWith('primary') ? DATABASES[0] : DATABASES[1]
      if (source.startsWith('local')) fs.writeFileSync(path.join(client.root, file), invalid)
      else remote.set(file, invalid)
      const before = client.bytes()
      await expect(client.engine.preview()).rejects.toThrow('Invalid gallery')
      expect(client.bytes()).toEqual(before)
      expect(remote.commit).not.toHaveBeenCalled()
      expect(client.state.watermark).toBe(9000)
    },
  )

  it.each([false, 'throw'])('rejects a %s download result without advancing the watermark', async failure => {
    const client = device()
    const before = client.bytes()
    if (failure === false) remote.read.mockResolvedValueOnce(false as unknown as RemoteFile)
    else remote.read.mockRejectedValueOnce(new Error('secret transport details'))
    await expect(client.engine.preview()).rejects.toThrow(/download|prepare/)
    expect(client.bytes()).toEqual(before)
    expect(remote.commit).not.toHaveBeenCalled()
    expect(client.deps.saveWatermark).not.toHaveBeenCalled()
  })

  it.each(['false', 'throw', 'accepted-then-disconnected', 'unverified'])('rolls back a %s upload', async failure => {
    const client = device()
    const before = client.bytes()
    const plan = await client.engine.preview()
    remote.commit.mockImplementationOnce(async content => {
      if (failure === 'false') return false
      if (failure === 'accepted-then-disconnected' || failure === 'unverified') remote.set(BUNDLE_NAME, content)
      if (failure === 'unverified') {
        remote.read.mockResolvedValueOnce(null)
        return true
      }
      throw new Error('private transport error')
    })
    await expect(client.engine.apply(plan.id, {})).rejects.toThrow(/upload|sync failed|publication/)
    expect(client.bytes()).toEqual(before)
    expect(client.deps.replace).not.toHaveBeenCalled()
    expect(client.deps.saveWatermark).not.toHaveBeenCalled()
    expect(client.state.watermark).toBe(9000)
    expect(readJournal(client.root, plan.id).status).toBe('rolled-back')
    expect(client.engine.exportSnapshot(plan.id)).toBeInstanceOf(Buffer)
  })

  it.each(['throw', 'truncated'])('restores both files after a %s second local write', async failure => {
    const client = device()
    const before = client.bytes()
    const plan = await client.engine.preview()
    client.deps.replace.mockImplementationOnce(writeFile).mockImplementationOnce(async file => {
      await fs.writeFile(file, Buffer.from('interrupted'))
      if (failure === 'throw') throw new Error('interrupted write')
    })
    await expect(client.engine.apply(plan.id, {})).rejects.toThrow(/failed|interrupted/)
    expect(client.bytes()).toEqual(before)
    expect(client.state.watermark).toBe(9000)
    expect(client.deps.saveWatermark).not.toHaveBeenCalled()
    expect(remote.files.has(BUNDLE_NAME)).toBe(true)
    expect(fs.existsSync(path.join(stateDir(client.root), 'pending.json'))).toBe(false)
  })

  it.each(['refresh', 'watermark'])('rolls back when the final %s fails', async failure => {
    const client = device()
    const before = client.bytes()
    const plan = await client.engine.preview()
    if (failure === 'refresh') client.deps.refresh.mockRejectedValueOnce(new Error('refresh failed'))
    else
      client.deps.saveWatermark.mockImplementationOnce(value => {
        client.state.watermark = value
        throw new Error('save interrupted')
      })
    await expect(client.engine.apply(plan.id, {})).rejects.toThrow('sync failed')
    expect(client.bytes()).toEqual(before)
    expect(client.state.watermark).toBe(9000)
    expect(readJournal(client.root, plan.id).status).toBe('rolled-back')
  })

  it('validates staged gzip output before making a remote write', async () => {
    const client = device()
    const plan = await client.engine.preview()
    const original = fs.writeFile.bind(fs)
    vi.spyOn(fs, 'writeFile').mockImplementationOnce(async file => {
      await original(file, Buffer.from('truncated'))
    })
    await expect(client.engine.apply(plan.id, {})).rejects.toThrow('compressed gallery')
    expect(remote.commit).not.toHaveBeenCalled()
    expect(client.deps.replace).not.toHaveBeenCalled()
    expect(client.deps.saveWatermark).not.toHaveBeenCalled()
  })

  it.each(['local', 'remote', 'backup', 'settings', 'watermark'])(
    'rejects a stale plan after %s changes',
    async change => {
      const client = device()
      const plan = await client.engine.preview()
      if (change === 'local') await client.store.updateById('common', { fileName: 'edited.png' })
      if (change === 'remote') remote.set(BUNDLE_NAME, encode({ version: 1, primary: base(), backup: base() }))
      if (change === 'backup') remote.set(DATABASES[1], encode(legacy({ id: 'another' })))
      if (change === 'settings') client.state.config = 'changed'
      if (change === 'watermark') client.state.watermark++
      const before = client.bytes()
      await expect(client.engine.apply(plan.id, {})).rejects.toThrow(/changed/)
      expect(remote.commit).not.toHaveBeenCalled()
      expect(client.bytes()).toEqual(before)
    },
  )

  it('loses a remote compare-and-swap race without overwriting the winning device', async () => {
    const client = device()
    const plan = await client.engine.preview()
    const concurrent = encode({
      version: 1,
      primary: legacy({ id: 'other-device' }),
      backup: legacy({ id: 'other-device' }),
    })
    const commit = remote.commit.getMockImplementation()!
    remote.commit.mockImplementationOnce(async (content, expected) => {
      remote.set(BUNDLE_NAME, concurrent)
      return commit(content, expected)
    })
    await expect(client.engine.apply(plan.id, {})).rejects.toThrow('upload')
    expect(remote.files.get(BUNDLE_NAME)!.content).toEqual(concurrent)
    expect(client.deps.replace).not.toHaveBeenCalled()
  })

  it('serializes concurrent previews with isolated directories and applies a reviewed snapshot only once', async () => {
    const client = device()
    const mkdtemp = vi.spyOn(fs, 'mkdtemp')
    let release!: () => void
    const gate = new Promise<void>(resolve => {
      release = resolve
    })
    let entered!: () => void
    const started = new Promise<void>(resolve => {
      entered = resolve
    })
    remote.read.mockImplementationOnce(async () => {
      entered()
      await gate
      return null
    })
    const first = client.engine.preview()
    await started
    const second = client.engine.preview()
    expect(mkdtemp).toHaveBeenCalledTimes(1)
    release()
    const [a, b] = await Promise.all([first, second])
    const dirs = await Promise.all(mkdtemp.mock.results.map(result => result.value as Promise<string>))
    expect(new Set(dirs).size).toBe(2)
    await client.engine.cancel(a.id)
    expect(fs.existsSync(dirs[0])).toBe(false)
    expect(fs.existsSync(dirs[1])).toBe(true)
    const results = await Promise.allSettled([client.engine.apply(b.id, {}), client.engine.apply(b.id, {})])
    expect(results.map(result => result.status)).toEqual(['fulfilled', 'rejected'])
    expect(remote.commit).toHaveBeenCalledOnce()
    expect(fs.existsSync(dirs[1])).toBe(false)
  })

  it('queues a concurrent gallery edit behind apply without losing it', async () => {
    const client = device()
    const plan = await client.engine.preview()
    let release!: () => void
    let entered!: () => void
    const gate = new Promise<void>(resolve => {
      release = resolve
    })
    const started = new Promise<void>(resolve => {
      entered = resolve
    })
    const commit = remote.commit.getMockImplementation()!
    remote.commit.mockImplementationOnce(async (...args) => {
      entered()
      await gate
      return commit(...args)
    })
    const applying = client.engine.apply(plan.id, {})
    await started
    const editing = client.store.updateById('common', { fileName: 'concurrent.png' })
    release()
    await Promise.all([applying, editing])
    expect(client.document().gallery[0].fileName).toBe('concurrent.png')
    const published = decodeBundle(remote.files.get(BUNDLE_NAME)!.content)[0]
    expect(client.document().__sync.records.common.ancestors).toContain(published.__sync.records.common.revision)
  })

  it('exports a redacted summary and full rollback preimages separately', async () => {
    const client = device(
      'private',
      legacy({
        id: 'private-id',
        fileName: 'private-name.png',
        imgUrl: 'https://user:secret@example.invalid/image?token=secret',
      }),
    )
    const before = client.bytes()
    const plan = await client.engine.preview()
    const summary = client.engine.summary(plan.id)
    expect(summary).not.toMatch(/private-id|private-name|example.invalid|secret|imgUrl/)
    expect(JSON.parse(summary).counts.addition).toBe(1)
    expect(JSON.stringify(plan)).not.toContain('user:secret')
    await client.engine.apply(plan.id, {})
    expect(client.engine.summary(plan.id)).toBe(summary)
    const snapshot = decode(client.engine.exportSnapshot(plan.id))
    expect(Buffer.from(snapshot.local[DATABASES[0]], 'base64')).toEqual(before[0])
    expect(snapshot.startingWatermark).toBe(9000)
  })

  it('recovers a simulated process interruption before another store can observe a partial pair', async () => {
    const client = device()
    const original = client.bytes()
    const plan = await client.engine.preview()
    await client.engine.apply(plan.id, {})
    const journal = readJournal(client.root, plan.id)
    journal.status = 'committing'
    fs.writeJsonSync(path.join(snapshotDir(client.root, plan.id), 'journal.json'), journal)
    fs.writeJsonSync(path.join(stateDir(client.root), 'pending.json'), { id: plan.id })
    fs.writeFileSync(path.join(client.root, DATABASES[1]), 'partial')
    await expect(client.store.get()).rejects.toThrow('recovery')
    recoverGallerySync(client.root, client.deps.recoverWatermark)
    expect(client.bytes()).toEqual(original)
    expect(client.state.watermark).toBe(9000)
    expect(readJournal(client.root, plan.id).status).toBe('rolled-back')
    // Recovery is idempotent and retains the snapshots.
    recoverGallerySync(client.root, client.deps.recoverWatermark)
    expect(client.bytes()).toEqual(original)
  })

  it('does not recover a pending transaction owned by another live process', async () => {
    const client = device()
    const plan = await client.engine.preview()
    await client.engine.apply(plan.id, {})
    const journal = readJournal(client.root, plan.id)
    journal.status = 'committing'
    journal.ownerPid = process.ppid
    fs.writeJsonSync(path.join(snapshotDir(client.root, plan.id), 'journal.json'), journal)
    fs.linkSync(
      path.join(snapshotDir(client.root, plan.id), 'journal.json'),
      path.join(stateDir(client.root), 'pending.json'),
    )
    const before = client.bytes()
    await expect(client.engine.preview()).rejects.toThrow('recovery is incomplete')
    expect(client.bytes()).toEqual(before)
    expect(client.deps.recoverWatermark).not.toHaveBeenCalled()
    expect(fs.existsSync(path.join(stateDir(client.root), 'pending.json'))).toBe(true)
  })

  it('cannot replace or recover a competing pending journal when its exclusive claim fails', async () => {
    const client = device()
    const plan = await client.engine.preview()
    const link = fs.link.bind(fs)
    const competitor = Buffer.from(JSON.stringify({ id: 'another-process' }))
    vi.spyOn(fs, 'link').mockImplementationOnce(async (source, destination) => {
      await fs.writeFile(destination, competitor)
      return link(source, destination)
    })
    await expect(client.engine.apply(plan.id, {})).rejects.toThrow('sync failed')
    expect(fs.readFileSync(path.join(stateDir(client.root), 'pending.json'))).toEqual(competitor)
    expect(client.deps.replace).not.toHaveBeenCalled()
    expect(remote.commit).not.toHaveBeenCalled()
    expect(client.deps.recoverWatermark).not.toHaveBeenCalled()
  })
})

describe('revision and tombstone convergence without accounts', () => {
  it('hashes the persisted JSON representation of optional fields and plugin metadata', async () => {
    const client = device()
    await client.store.insert({
      id: 'plugin-record',
      optional: undefined,
      metadata: { buffer: Buffer.from('fixture'), date: new Date(0) },
    })
    await client.store.refresh()
    const document = client.document()
    const stored = document.gallery.find(item => item.id === 'plugin-record')!
    expect(stored).not.toHaveProperty('optional')
    expect(stored.metadata).toEqual({
      buffer: { type: 'Buffer', data: [...Buffer.from('fixture')] },
      date: '1970-01-01T00:00:00.000Z',
    })
    expect(document.__sync.records['plugin-record'].value).toEqual(stored)
    await sync(client)
    expect((await sync(client)).changes).toEqual([])
  })

  it('uses stable revisions and refuses an implicit legacy timestamp decision', () => {
    expect(revision({ id: 'x', a: 1, b: 2 })).toEqual(revision({ b: 2, id: 'x', a: 1 }))
    const { entries, changes } = planMerge(
      [
        { source: 'local-primary', document: validateDocument(legacy({ id: 'x', fileName: 'local', updatedAt: 5 })) },
        { source: 'remote-primary', document: validateDocument(legacy({ id: 'x', fileName: 'remote', updatedAt: 5 })) },
      ],
      'test',
    )
    expect(changes[0].legacySuggestion).toBe('keep-local')
    expect(() => applyMerge(entries, {})).toThrow('Choose')
    expect(applyMerge(entries, { [changes[0].key]: 'keep-remote' }).gallery[0].fileName).toBe('remote')
  })

  it.each(['keep-local', 'keep-remote', 'preserve-both'] as const)(
    'converges concurrent edits with clock skew using %s and remains stable on repeat sync',
    async choice => {
      const a = device('a'),
        b = device('b')
      await sync(a)
      await sync(b)
      vi.spyOn(Date, 'now').mockReturnValue(9999999999999)
      await a.store.updateById('common', { fileName: 'device-a.png' })
      vi.mocked(Date.now).mockReturnValue(2)
      await b.store.updateById('common', { fileName: 'device-b.png' })
      await sync(a)
      const conflict = await b.engine.preview()
      expect(conflict.counts.conflict).toBe(1)
      await b.engine.apply(conflict.id, choose(conflict, choice))
      await sync(a)
      expect(a.document()).toEqual(b.document())
      const names = a
        .document()
        .gallery.map(item => item.fileName)
        .sort()
      expect(names).toEqual(
        choice === 'preserve-both'
          ? ['device-a.png', 'device-b.png']
          : [choice === 'keep-local' ? 'device-b.png' : 'device-a.png'],
      )
      const stable = canonical(a.document())
      expect((await sync(b)).changes).toEqual([])
      expect((await sync(a)).changes).toEqual([])
      expect(canonical(a.document())).toBe(stable)
    },
  )

  it('propagates an offline deletion despite stale primary and backup records and a skewed clock', async () => {
    const a = device('a'),
      b = device('b')
    await sync(a)
    await sync(b)
    vi.spyOn(Date, 'now').mockReturnValue(0)
    await a.store.removeById('common')
    expect(a.document().__sync.records.common.value).toBeNull()
    await sync(a)
    const plan = await b.engine.preview()
    expect(plan.counts.deletion).toBe(1)
    expect(plan.counts.conflict).toBe(0)
    await b.engine.apply(plan.id, {})
    expect(b.document().gallery).toEqual([])
    expect(a.document()).toEqual(b.document())
    await sync(a)
    await sync(b)
    expect(b.document().gallery).toEqual([])
  })

  it('preserves an offline edit as a stable copy when it conflicts with a deletion', async () => {
    const a = device('a'),
      b = device('b')
    await sync(a)
    await sync(b)
    await a.store.removeMany(['common'])
    await b.store.updateById('common', { fileName: 'offline.png' })
    await sync(a)
    expect((await sync(b)).counts.conflict).toBe(1)
    expect(b.document().__sync.records.common.value).toBeNull()
    expect(b.document().gallery).toHaveLength(1)
    expect(b.document().gallery[0].id).toMatch(/^sync-copy-/)
    await sync(a)
    await sync(b)
    expect(a.document()).toEqual(b.document())
    expect(a.document().gallery).toHaveLength(1)
  })

  it('records batch overwrite deletions atomically and keeps tombstones after reinsertion', async () => {
    const client = device()
    await client.store.overwrite([{ id: 'new' }])
    expect(client.document().__sync.records.common.value).toBeNull()
    const deletedRevision = client.document().__sync.records.common.revision
    await client.store.insert({ id: 'common', fileName: 'restored' })
    expect(client.document().__sync.records.common.ancestors).toContain(deletedRevision)
    const before = client.bytes()
    await expect(client.store.insertMany([{ id: 'valid' }, { id: 42 as unknown as string }])).rejects.toThrow()
    expect(client.bytes()).toEqual(before)
  })

  it('never converts an absent sync input into a tombstone', () => {
    const original = validateDocument(base())
    const { entries } = planMerge(
      [
        { source: 'local-primary', document: documentFrom({}) },
        { source: 'remote-primary', document: original },
      ],
      'test',
    )
    expect(applyMerge(entries, {}).gallery).toEqual(original.gallery)
    const edited = recordMutation(original, { gallery: [{ ...original.gallery[0], fileName: 'edited' }] })
    expect(edited.__sync.records.common.ancestors).toContain(original.__sync.records.common.revision)
    expect(() => validateDocument({ ...edited, gallery: [] })).toThrow('Invalid')
  })
})
