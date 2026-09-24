import { randomUUID } from 'node:crypto'
import os from 'node:os'
import path from 'node:path'

import fs from 'fs-extra'
import writeFile from 'write-file-atomic'

import type {
  GallerySyncPlan,
  GallerySyncResolution,
  GallerySyncResult,
  GallerySyncSnapshot,
} from '#/types/gallerySync'

import { withGalleryLock } from './lock'
import {
  applyMerge,
  canonical,
  digest,
  documentFrom,
  GallerySyncError,
  type MergeEntry,
  planMerge,
  validateDocument,
} from './model'
import {
  DATABASES,
  decode,
  decodeBundle,
  encode,
  type Journal,
  readJournal,
  readOptional,
  recoverGallerySync,
  saveJournal,
  snapshotDir,
  stateDir,
} from './storage'
import { BUNDLE_NAME, type GalleryTransport, type RemoteFile } from './transport'

interface Dependencies {
  root: string
  transport: () => GalleryTransport
  configurationKey: () => string
  getWatermark: () => number
  saveWatermark: (value: number) => void | Promise<void>
  recoverWatermark: (value: number) => void
  refresh: () => Promise<unknown>
  now?: () => number
  // Atomic file replacement is injectable for interrupted-write tests.
  replace?: (file: string, data: Buffer) => Promise<unknown>
}
interface Prepared {
  plan: GallerySyncPlan
  startedAt: number
  directory: string
  configKey: string
  local: (Buffer | null)[]
  bundle: RemoteFile | null
  legacy: (RemoteFile | null)[]
  entries: MergeEntry[]
}

const equal = (left: Buffer | null, right: Buffer | null) =>
  left === null ? right === null : right !== null && left.equals(right)
const sameRemote = (left: RemoteFile | null, right: RemoteFile | null) =>
  left === null
    ? right === null
    : right !== null && left.version === right.version && left.content.equals(right.content)

export class GallerySyncTransaction {
  private plans = new Map<string, Prepared>()
  private summaries = new Map<string, string>()
  constructor(private readonly deps: Dependencies) {}
  private now = () => this.deps.now?.() ?? Date.now()
  private recover() {
    recoverGallerySync(this.deps.root, this.deps.recoverWatermark)
  }
  private async readRemote(transport: GalleryTransport, name: string) {
    const result = await transport.read(name)
    if (
      result !== null &&
      (!result || !Buffer.isBuffer(result.content) || typeof result.version !== 'string' || !result.version)
    ) {
      throw new GallerySyncError('Gallery download did not succeed. No changes were applied.')
    }
    return result
  }
  private async localFiles() {
    return Promise.all(DATABASES.map(file => readOptional(path.join(this.deps.root, file))))
  }
  private async discard(id: string) {
    const prepared = this.plans.get(id)
    if (prepared) {
      if (!this.summaries.has(id)) this.summaries.set(id, this.summary(id))
      if (this.summaries.size > 16) this.summaries.delete(this.summaries.keys().next().value!)
      this.plans.delete(id)
      // Only this transaction's mkdtemp directory is ever removed.
      await fs.remove(prepared.directory).catch(() => {})
    }
  }
  cancel(id: string) {
    return withGalleryLock(() => this.discard(id))
  }

  preview(): Promise<GallerySyncPlan> {
    return withGalleryLock(async () => {
      this.recover()
      for (const [id, item] of this.plans) {
        if (this.now() - item.startedAt > 30 * 60_000 || this.plans.size >= 8) await this.discard(id)
      }
      const startedAt = this.now()
      const startingWatermark = this.deps.getWatermark()
      const configKey = this.deps.configurationKey()
      const directory = await fs.mkdtemp(path.join(os.tmpdir(), 'piclist-gallery-sync-'))
      try {
        const transport = this.deps.transport()
        const local = await this.localFiles()
        // Validate both local inputs before starting any remote mutation.
        const localDocs = local.map(content => (content ? validateDocument(decode(content)) : documentFrom({})))
        const bundle = await this.readRemote(transport, BUNDLE_NAME)
        const legacy: (RemoteFile | null)[] = []
        if (bundle === null) {
          for (const file of DATABASES) legacy.push(await this.readRemote(transport, file))
        }
        const remoteDocs = bundle
          ? decodeBundle(bundle.content)
          : legacy.map(item => (item ? validateDocument(decode(item.content)) : documentFrom({})))
        const id = randomUUID()
        const { entries, changes } = planMerge(
          [
            { source: 'local-primary', document: localDocs[0] },
            { source: 'local-backup', document: localDocs[1] },
            { source: 'remote-primary', document: remoteDocs[0] },
            { source: 'remote-backup', document: remoteDocs[1] },
          ],
          id,
        )
        const counts = { addition: 0, update: 0, conflict: 0, deletion: 0 }
        changes.forEach(change => counts[change.kind]++)
        const plan: GallerySyncPlan = { id, startingWatermark, changes, counts, migration: bundle === null }
        this.plans.set(id, { plan, startedAt, directory, configKey, local, bundle, legacy, entries })
        return structuredClone(plan)
      } catch (error) {
        await fs.remove(directory)
        if (error instanceof GallerySyncError) throw error
        throw new GallerySyncError('Unable to prepare gallery sync. No changes were applied.')
      }
    })
  }

  apply(id: string, resolutions: Record<string, GallerySyncResolution>): Promise<GallerySyncResult> {
    return withGalleryLock(async () => {
      this.recover()
      const prepared = this.plans.get(id)
      if (!prepared || this.now() - prepared.startedAt > 30 * 60_000)
        throw new GallerySyncError('This sync plan expired. Preview again.')
      const { plan, local, directory, bundle, entries } = prepared
      let journal: Journal | undefined
      let ownsPending = false
      try {
        if (prepared.configKey !== this.deps.configurationKey() || plan.startingWatermark !== this.deps.getWatermark())
          throw new GallerySyncError('Sync settings or watermark changed. Preview again.')
        const transport = this.deps.transport()
        const currentLocal = await this.localFiles()
        if (currentLocal.some((value, i) => !equal(value, local[i])))
          throw new GallerySyncError('The local gallery changed. Preview again.')
        const merged = applyMerge(entries, resolutions)
        // Stage and re-read both gzip databases before publishing anything.
        for (const file of DATABASES) await fs.writeFile(path.join(directory, file), encode(merged))
        const staged = await Promise.all(DATABASES.map(file => fs.readFile(path.join(directory, file))))
        const documents = staged.map(content => validateDocument(decode(content)))
        const publication = encode({ version: 1, primary: documents[0], backup: documents[1] })
        decodeBundle(publication)
        if (!sameRemote(bundle, await this.readRemote(transport, BUNDLE_NAME)))
          throw new GallerySyncError('The remote gallery changed. Preview again.')
        if (!bundle) {
          for (const [i, file] of DATABASES.entries()) {
            if (!sameRemote(prepared.legacy[i], await this.readRemote(transport, file)))
              throw new GallerySyncError('A remote migration input changed. Preview again.')
          }
        }

        const snapshot = snapshotDir(this.deps.root, id)
        await fs.ensureDir(path.join(snapshot, 'local'))
        await fs.ensureDir(path.join(snapshot, 'remote'))
        for (const [i, file] of DATABASES.entries()) {
          if (local[i]) await writeFile(path.join(snapshot, 'local', file), local[i]!)
          if (prepared.legacy[i]) await writeFile(path.join(snapshot, 'remote', file), prepared.legacy[i]!.content)
        }
        if (bundle) await writeFile(path.join(snapshot, 'remote', BUNDLE_NAME), bundle.content)
        await writeFile(path.join(snapshot, 'staged.db'), publication)
        const summary = this.summary(id, resolutions)
        this.summaries.set(id, summary)
        await writeFile(path.join(snapshot, 'summary.json'), summary)
        journal = {
          id,
          ownerPid: process.pid,
          startingWatermark: plan.startingWatermark,
          watermark: Math.max(prepared.startedAt, plan.startingWatermark + 1),
          existed: local.map(Boolean),
          status: 'prepared',
        }
        await saveJournal(this.deps.root, journal)
        // An exclusive hard link claims the journal without an empty/partially written
        // pointer window. Both paths are on the same filesystem. Never replace another
        // process's pending transaction (including during startup recovery).
        await fs.link(path.join(snapshot, 'journal.json'), path.join(stateDir(this.deps.root), 'pending.json'))
        ownsPending = true

        if (prepared.configKey !== this.deps.configurationKey() || plan.startingWatermark !== this.deps.getWatermark())
          throw new GallerySyncError('Sync settings or watermark changed. Preview again.')
        // One remote compare-and-swap publishes BOTH databases. No create fallback on errors.
        if ((await transport.commit(publication, bundle?.version ?? null)) !== true)
          throw new GallerySyncError('Gallery upload did not succeed. No local changes were applied.')
        const verified = await this.readRemote(transport, BUNDLE_NAME)
        if (!verified || !verified.content.equals(publication))
          throw new GallerySyncError('Remote publication could not be verified. Preview again.')
        decodeBundle(verified.content)
        if (
          prepared.configKey !== this.deps.configurationKey() ||
          plan.startingWatermark !== this.deps.getWatermark() ||
          (await this.localFiles()).some((value, i) => !equal(value, local[i]))
        )
          throw new GallerySyncError('The local gallery or sync settings changed during publication. Preview again.')

        journal.status = 'committing'
        await saveJournal(this.deps.root, journal)
        for (const [i, file] of DATABASES.entries()) {
          await (this.deps.replace ?? writeFile)(path.join(this.deps.root, file), staged[i])
          const written = await fs.readFile(path.join(this.deps.root, file))
          if (!written.equals(staged[i])) throw new GallerySyncError('A local gallery write was interrupted.')
          validateDocument(decode(written))
        }
        await this.deps.refresh()
        if (
          prepared.configKey !== this.deps.configurationKey() ||
          plan.startingWatermark !== this.deps.getWatermark()
        ) {
          throw new GallerySyncError('Sync settings or watermark changed. Preview again.')
        }
        // The starting watermark is captured once. It is diagnostic, never a deletion heuristic.
        await this.deps.saveWatermark(journal.watermark)
        journal.status = 'committed'
        await saveJournal(this.deps.root, journal)
        // A leftover committed journal is safe to clean during startup recovery.
        await fs.remove(path.join(stateDir(this.deps.root), 'pending.json')).catch(() => {})
        return { snapshotId: id, watermark: journal.watermark }
      } catch (error) {
        let failure =
          error instanceof GallerySyncError
            ? error
            : new GallerySyncError(
                'Gallery sync failed. Local changes were rolled back; the snapshot was retained. Preview again.',
              )
        if (journal && ownsPending) {
          try {
            this.recover()
            if (journal.status !== 'prepared') await this.deps.refresh()
          } catch {
            failure = new GallerySyncError(
              'Gallery recovery is incomplete. The rollback snapshot was retained; retry before editing or syncing.',
            )
          }
          failure.snapshotId = id
        }
        throw failure
      } finally {
        await this.discard(id)
      }
    })
  }

  summary(id: string, resolutions: Record<string, GallerySyncResolution> = {}): string {
    const prepared = this.plans.get(id)
    if (!prepared)
      return (
        this.summaries.get(id) ?? fs.readFileSync(path.join(snapshotDir(this.deps.root, id), 'summary.json'), 'utf8')
      )
    return JSON.stringify(
      {
        format: 'piclist-gallery-sync-summary-v1',
        counts: prepared.plan.counts,
        migration: prepared.plan.migration,
        changes: prepared.plan.changes.map((change, index) => ({
          record: index + 1,
          kind: change.kind,
          resolution: change.kind === 'conflict' ? (resolutions[change.key] ?? 'unresolved') : undefined,
          versions: change.versions.map(({ source, deleted }) => ({ source, deleted })),
        })),
      },
      null,
      2,
    )
  }

  exportSnapshot(id: string): Buffer {
    const journal = readJournal(this.deps.root, id)
    const snapshot = snapshotDir(this.deps.root, id)
    return encode({
      format: 'piclist-gallery-rollback-v1',
      startingWatermark: journal.startingWatermark,
      status: journal.status,
      local: Object.fromEntries(
        DATABASES.map((file, i) => [
          file,
          journal.existed[i] ? fs.readFileSync(path.join(snapshot, 'local', file)).toString('base64') : null,
        ]),
      ),
      remote: Object.fromEntries(
        [...DATABASES, BUNDLE_NAME].map(file => {
          const target = path.join(snapshot, 'remote', file)
          return [file, fs.existsSync(target) ? fs.readFileSync(target).toString('base64') : null]
        }),
      ),
    })
  }

  listSnapshots(): GallerySyncSnapshot[] {
    const directory = path.join(stateDir(this.deps.root), 'snapshots')
    if (!fs.existsSync(directory)) return []
    return fs
      .readdirSync(directory)
      .flatMap(id => {
        try {
          const { status, watermark } = readJournal(this.deps.root, id)
          return [{ id, status, watermark }]
        } catch {
          return []
        }
      })
      .sort((a, b) => b.watermark - a.watermark)
      .slice(0, 50)
  }
}

export const configurationKey = (config: unknown) => digest(canonical(config))
