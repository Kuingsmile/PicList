import 'fake-indexeddb/auto'

import { readFileSync } from 'node:fs'
import { runInNewContext } from 'node:vm'

import ts from 'typescript'
import { afterAll, afterEach, beforeEach, describe, expect, it, vi } from 'vitest'
import { parse } from 'vue/compiler-sfc'

import { fileCacheDbInstance } from '../src/renderer/manage/store/bucketFileDb'
import { IRPCActionType } from '../src/renderer/utils/enum'
import { createBucketHarness } from './bucketPageHarness'

const cacheKey = 'cache-test@bucket@/'
const cachedRecord = { key: cacheKey, value: { fullList: [{ key: 'cached.png', fileName: 'cached.png' }] } }
const remoteFiles = [{ key: 'remote.png', fileName: 'remote.png' }]

function loadActions(page: string, names: string[], dependencies: Record<string, unknown>) {
  const { descriptor } = parse(
    readFileSync(new URL(`../src/renderer/manage/pages/${page}.vue`, import.meta.url), 'utf8'),
  )
  const script = ts.createSourceFile(`${page}.ts`, descriptor.scriptSetup!.content, ts.ScriptTarget.Latest, true)
  // Exercise the actual settings and bucket actions without mounting unrelated UI.
  const code = ts.transpileModule(
    script.statements
      .filter(statement => ts.isFunctionDeclaration(statement) && names.includes(statement.name!.text))
      .map(statement => statement.getText(script))
      .join('\n'),
    { compilerOptions: { target: ts.ScriptTarget.ES2022, module: ts.ModuleKind.None } },
  ).outputText
  return runInNewContext(`${code}\n({ ${names.join(', ')} })`, dependencies)
}

function createSettings() {
  const message = { success: vi.fn(), error: vi.fn() }
  const getIndexDbSize = vi.fn()
  const actions = loadActions('ManageSetting', ['confirmClearDb'], {
    fileCacheDbInstance,
    message,
    getIndexDbSize,
    t: (key: string) => key,
  }) as { confirmClearDb: () => Promise<void> }
  return { ...actions, message, getIndexDbSize }
}

const mounted: ReturnType<typeof createBucketHarness>[] = []
function createBucket() {
  const page = createBucketHarness({ cache: fileCacheDbInstance, remoteFiles })
  mounted.push(page)
  return { ...page, tick: () => page.emit(page.fileListings.request!) }
}

beforeEach(async () => {
  await fileCacheDbInstance.open()
  await Promise.all(fileCacheDbInstance.tables.map(table => table.put(cachedRecord)))
})

afterEach(async () => {
  for (const page of mounted.splice(0)) page.app.unmount()
  vi.restoreAllMocks()
  await fileCacheDbInstance.open()
  await fileCacheDbInstance.transaction('rw', fileCacheDbInstance.tables, () =>
    Promise.all(fileCacheDbInstance.tables.map(table => table.clear())),
  )
})

afterAll(() => fileCacheDbInstance.delete())

describe('clearing the bucket cache', () => {
  it('clears every table and keeps the same connection and table references usable for reads and writes', async () => {
    const settings = createSettings()
    const tables = fileCacheDbInstance.tables
    const connection = fileCacheDbInstance.backendDB()

    await settings.confirmClearDb()
    await vi.waitFor(() => expect(settings.message.success).toHaveBeenCalledOnce())

    expect(fileCacheDbInstance.isOpen()).toBe(true)
    expect(fileCacheDbInstance.backendDB()).toBe(connection)
    for (const table of tables) {
      expect(await table.toArray()).toEqual([])
      await table.put(cachedRecord)
      expect(await table.get(cacheKey)).toEqual(cachedRecord)
    }
    await settings.confirmClearDb()
    await settings.confirmClearDb()
    expect(await Promise.all(tables.map(table => table.count()))).toEqual(tables.map(() => 0))
    expect(settings.getIndexDbSize).toHaveBeenCalledTimes(3)
    expect(settings.message.error).not.toHaveBeenCalled()
  })

  it('rolls back all tables and reports failure if any table cannot be cleared', async () => {
    const settings = createSettings()
    const table = fileCacheDbInstance.tables.at(-1)!
    const clear = table.clear.bind(table)
    vi.spyOn(table, 'clear').mockImplementationOnce(() =>
      clear().then(() => {
        throw new Error('Clear failed')
      }),
    )

    await settings.confirmClearDb()
    await vi.waitFor(() => expect(settings.message.error).toHaveBeenCalledOnce())

    expect(settings.message.success).not.toHaveBeenCalled()
    expect(settings.getIndexDbSize).not.toHaveBeenCalled()
    for (const table of fileCacheDbInstance.tables) {
      expect(await table.get(cacheKey)).toEqual(cachedRecord)
    }
  })

  it('loads remotely after clearing and reuses the newly written cache on the next load', async () => {
    await createSettings().confirmClearDb()
    const page = createBucket()

    await page.resetParam()
    expect(page.sendRPC).toHaveBeenCalledExactlyOnceWith(
      IRPCActionType.MANAGE_GET_BUCKET_LIST_BACKSTAGE,
      'cache-test',
      expect.objectContaining({ paging: false, prefix: '/' }),
    )
    page.tick()
    await vi.waitFor(async () => {
      expect(await fileCacheDbInstance.aliyun.get(cacheKey)).toEqual({
        key: cacheKey,
        value: { fullList: remoteFiles },
      })
    })
    expect(page.currentPageFilesInfo).toEqual(remoteFiles)

    await page.resetParam()
    expect(page.currentPageFilesInfo).toEqual(remoteFiles)
    expect(page.sendRPC).toHaveBeenCalledTimes(1)
    expect(page.warn).not.toHaveBeenCalled()
  })
})

describe('optional bucket cache failures', () => {
  it('uses an available cached listing without requesting remote files', async () => {
    const page = createBucket()

    await page.resetParam()

    expect(page.currentPageFilesInfo).toEqual(cachedRecord.value.fullList)
    expect(page.isShowLoadingPage.value).toBe(false)
    expect(page.sendRPC).not.toHaveBeenCalled()
  })

  it('falls back to remote loading when the cache read rejects', async () => {
    const page = createBucket()
    fileCacheDbInstance.close()

    await page.resetParam()

    expect(page.sendRPC).toHaveBeenCalledOnce()
    expect(page.isLoadingData.value).toBe(true)
    expect(page.warn).toHaveBeenCalledOnce()
  })

  it('finishes a forced remote refresh even if writing the cache rejects', async () => {
    const page = createBucket()
    fileCacheDbInstance.close()

    await page.resetParam(true)
    page.tick()
    await vi.waitFor(() => expect(page.warn).toHaveBeenCalledOnce())

    expect(page.currentPageFilesInfo).toEqual(remoteFiles)
    expect(page.isLoadingData.value).toBe(false)
    expect(page.events.listenerCount('refreshFileTransferList')).toBe(0)
    expect(page.message.success).toHaveBeenCalledExactlyOnceWith('pages.manage.bucket.getFileListSuccess')
    expect(page.message.error).not.toHaveBeenCalled()
  })

  it.each(['automatic refresh', 'pagination', 'forced refresh'])(
    'bypasses cached reads for %s even when the cache is unavailable',
    async mode => {
      const page = createBucket()
      fileCacheDbInstance.close()
      page.isAutoRefresh.value = mode === 'automatic refresh'
      page.paging.value = mode === 'pagination'

      await page.resetParam(mode === 'forced refresh')

      expect(page.warn).not.toHaveBeenCalled()
      if (page.paging.value) {
        expect(page.triggerRPC).toHaveBeenCalledWith(
          IRPCActionType.MANAGE_GET_BUCKET_FILE_LIST,
          'cache-test',
          expect.objectContaining({ kind: 'files' }),
        )
        expect(page.currentPageFilesInfo).toEqual(remoteFiles)
      } else {
        expect(page.sendRPC).toHaveBeenCalledOnce()
      }
    },
  )
})
