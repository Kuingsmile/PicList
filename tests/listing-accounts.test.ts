import { readFileSync } from 'node:fs'
import { runInNewContext } from 'node:vm'

import ts from 'typescript'
import { describe, expect, it, vi } from 'vitest'
import { ref } from 'vue'
import { parse } from 'vue/compiler-sfc'

import { ListingSession } from '../src/renderer/manage/utils/listingSession'
import { IRPCActionType } from '../src/renderer/utils/enum'
import type { ListingRequest } from '../src/universal/listing'

const { descriptor } = parse(
  readFileSync(new URL('../src/renderer/manage/pages/ManageMain.vue', import.meta.url), 'utf8'),
)
const script = ts.createSourceFile('ManageMain.ts', descriptor.scriptSetup!.content, ts.ScriptTarget.Latest, true)
const declaration = script.statements.find(
  statement => ts.isFunctionDeclaration(statement) && statement.name?.text === 'getBucketList',
)!
const code = ts.transpileModule(declaration.getText(script), {
  compilerOptions: { target: ts.ScriptTarget.ES2022 },
}).outputText

function createPage() {
  const pending: { request: ListingRequest; resolve: (result: unknown) => void; reject: (error: Error) => void }[] = []
  const sendToMain = vi.fn()
  const bucketListings = new ListingSession({ sendToMain, ipcRendererOn: () => () => {} })
  const state = {
    currentAlias: ref('first'),
    currentPicBedName: ref('aliyun'),
    configMap: ref<{ alias: string } | null>({ alias: 'previous' }),
    currentSelectedBucket: ref('previous-bucket'),
    currentPageInMain: ref('bucket'),
    bucketList: ref({}),
    bucketNameList: ref<string[]>([]),
    isLoadingBucketList: ref(false),
  }
  const triggerRPC = vi.fn(
    (_action: string, _alias: string, request: ListingRequest) =>
      new Promise((resolve, reject) => {
        pending.push({ request, resolve, reject })
      }),
  )
  const getBucketList = runInNewContext(`${code}\ngetBucketList`, {
    ...state,
    unmounted: false,
    bucketListings,
    IRPCActionType,
    window: { electron: { triggerRPC } },
  }) as () => Promise<void>
  return { ...state, pending, getBucketList, triggerRPC, sendToMain, bucketListings }
}

describe('account bucket inventory generations', () => {
  it.each(['success', 'error'])('discards a late old-account %s after a switch', async outcome => {
    const page = createPage()
    const first = page.getBucketList()
    expect(page.currentPageInMain.value).toBe('empty')
    expect(page.configMap.value).toBeNull()
    page.currentAlias.value = 'second'
    const second = page.getBucketList()
    page.pending[1].resolve({
      ...page.pending[1].request,
      fullList: [{ Name: 'new' }],
      success: true,
      finished: true,
      phase: 'complete',
    })
    await second
    if (outcome === 'success')
      page.pending[0].resolve({
        ...page.pending[0].request,
        fullList: [{ Name: 'old' }],
        success: true,
        finished: true,
        phase: 'complete',
      })
    else page.pending[0].reject(new Error('Old account failed'))
    await first
    expect(page.bucketNameList.value).toEqual(['new'])
    expect(page.isLoadingBucketList.value).toBe(false)
    expect(page.sendToMain).toHaveBeenCalledExactlyOnceWith('cancelLoadingFileList', page.pending[0].request)
    expect(page.triggerRPC).toHaveBeenLastCalledWith(
      IRPCActionType.MANAGE_GET_BUCKET_LIST,
      'second',
      expect.objectContaining({
        accountId: 'second',
        provider: 'aliyun',
        kind: 'buckets',
        bucketName: '',
        prefix: '',
        requestId: expect.any(String),
      }),
    )
  })

  it('does not let an old result hide the new account loading indicator', async () => {
    const page = createPage()
    const first = page.getBucketList()
    page.currentAlias.value = 'second'
    const second = page.getBucketList()
    page.pending[0].reject(new Error('Old account failed'))
    await first
    expect(page.isLoadingBucketList.value).toBe(true)
    page.pending[1].reject(new Error('Current account failed'))
    await second
    expect(page.isLoadingBucketList.value).toBe(false)
  })
})
