import { EventEmitter } from 'node:events'
import { readFileSync } from 'node:fs'
import { runInNewContext } from 'node:vm'

import ts from 'typescript'
import { vi } from 'vitest'
import { computed, createRenderer, onBeforeUnmount, reactive, ref, watch } from 'vue'
import { parse } from 'vue/compiler-sfc'

import { ListingSession } from '../src/renderer/manage/utils/listingSession'
import { IRPCActionType } from '../src/renderer/utils/enum'
import { listingChannels, type ListingRequest, type ListingResult } from '../src/universal/listing'

const names = [
  'resetParam',
  'searchExistFileList',
  'cacheFileList',
  'getTableKeyOfDb',
  'getBucketFileListBackStage',
  'getBucketFileList',
  'listingParams',
  'listingIdentity',
  'invalidateListings',
  'startRefreshUploadTask',
  'stopRefreshUploadTask',
  'startRefreshDownloadTask',
  'stopRefreshDownloadTask',
  'handleFolderBatchDownload',
  'cancelLoading',
  'cancelDownloadLoading',
  'initCustomDomainList',
  'handleChangeCustomUrl',
  'changePage',
] as const
type BucketActions = Record<(typeof names)[number], (...args: any[]) => any>
const { descriptor } = parse(
  readFileSync(new URL('../src/renderer/manage/pages/BucketPage.vue', import.meta.url), 'utf8'),
)
const script = ts.createSourceFile('BucketPage.ts', descriptor.scriptSetup!.content, ts.ScriptTarget.Latest, true)

// Mount the production actions and lifecycle in a minimal Vue component, without unrelated UI.
const renderer = createRenderer({
  createElement: () => ({}),
  createText: () => ({}),
  createComment: () => ({}),
  insert() {},
  remove() {},
  setText() {},
  setElementText() {},
  patchProp() {},
  parentNode: () => null,
  nextSibling: () => null,
})

export function createBucketHarness(
  options: {
    cache?: any
    events?: EventEmitter
    watchConfig?: boolean
    remoteFiles?: any[]
    rpc?: (...args: any[]) => Promise<any>
  } = {},
) {
  const config = {
    alias: 'cache-test',
    picBedName: 'aliyun',
    bucketName: 'bucket',
    bucketConfig: { Location: 'test' },
    prefix: '/',
  }
  const props = reactive({ configMap: config })
  const state = {
    configMap: ref({ ...config }),
    currentPrefix: ref('/'),
    currentCustomDomain: ref('https://example.invalid'),
    customDomainList: ref([]),
    isAutoRefresh: ref(false),
    paging: ref(false),
    isLoadingData: ref(false),
    isLoadingDownloadData: ref(false),
    isShowLoadingPage: ref(true),
    pagingMarker: ref(''),
    currentPageNumber: ref(1),
    itemsPerPage: ref(50),
    searchText: ref(''),
    urlToUpload: ref(''),
    dialogVisible: ref(false),
    isShowImagePreview: ref(false),
    previewedImage: ref(''),
    isShowFileInfo: ref(false),
    isShowCreateFolderDialog: ref(false),
    newFolderName: ref(''),
    lastChoosed: ref(-1),
    fileSortExtReverse: ref(false),
    fileSortNameReverse: ref(false),
    fileSortSizeReverse: ref(false),
    fileSortTimeReverse: ref(false),
    currentPageFilesInfo: [] as any[],
    currentDownloadFileList: [] as any[],
    pagingMarkerStack: [] as string[],
    isShowUploadPanel: ref(false),
    isShowDownloadPanel: ref(false),
    refreshUploadTaskId: ref<ReturnType<typeof setInterval>>(),
    refreshDownloadTaskId: ref<ReturnType<typeof setInterval>>(),
    uploadTaskList: ref([]),
    downloadTaskList: ref([]),
  }
  const events = options.events ?? new EventEmitter()
  const message = { info: vi.fn(), success: vi.fn(), error: vi.fn() }
  const warn = vi.fn()
  const sendRPC = vi.fn()
  const sendToMain = vi.fn()
  const triggerRPC = vi.fn(
    options.rpc ??
      (async (action: string, _alias?: string, request?: ListingRequest): Promise<any> => {
        if (action === IRPCActionType.MANAGE_GET_BUCKET_FILE_LIST) {
          return { ...request, fullList: options.remoteFiles ?? [], success: true, finished: true, phase: 'complete' }
        }
        if (action === IRPCActionType.MANAGE_GET_DEFAULT_DOWNLOAD_FOLDER) return '/downloads'
        return []
      }),
  )
  const bridge = {
    sendRPC,
    sendToMain,
    triggerRPC,
    ipcRendererOn: (channel: string, listener: (...args: any[]) => void) => {
      events.on(channel, listener)
      return () => {
        events.removeListener(channel, listener)
      }
    },
  }
  const fileListings = new ListingSession(bridge)
  const downloadListings = new ListingSession(bridge)
  const confirm = { confirm: vi.fn().mockResolvedValue(true) }
  const cache = options.cache ?? {
    table: () => ({ where: () => ({ equals: () => ({ toArray: async () => [] }) }), put: vi.fn() }),
  }
  const context = {
    ...state,
    props,
    currentPicBedName: computed(() => state.configMap.value.picBedName),
    fileListings,
    downloadListings,
    viewGeneration: 0,
    unmounted: false,
    scrollTimeout: undefined,
    fileCacheDbInstance: cache,
    IRPCActionType,
    message,
    confirm,
    console: { warn, error: vi.fn() },
    sortFile: vi.fn(),
    t: (key: string) => key,
    localStorage: { getItem: () => null },
    window: { electron: bridge },
    document: { removeEventListener: vi.fn() },
    handleDetectShiftKey: vi.fn(),
    setInterval,
    clearInterval,
    clearTimeout,
    onBeforeUnmount,
    watch,
    getConfig: vi.fn(async () => ({ 'cache-test': {} })),
    saveConfig: vi.fn(),
    manageStore: {
      config: { settings: {}, picBed: { 'cache-test': {} } as Record<string, any> },
      refreshConfig: vi.fn(),
    },
  }
  const selected = script.statements.filter(statement => {
    if (ts.isFunctionDeclaration(statement)) return names.some(name => name === statement.name!.text)
    if (ts.isVariableStatement(statement))
      return statement.declarationList.declarations.some(d => d.name.getText(script) === 'changePage')
    if (!ts.isExpressionStatement(statement) || !ts.isCallExpression(statement.expression)) return false
    if (statement.expression.expression.getText(script) === 'onBeforeUnmount') return true
    return !!options.watchConfig && statement.expression.arguments[0]?.getText(script).includes('props.configMap')
  })
  const code = ts.transpileModule(selected.map(s => s.getText(script)).join('\n'), {
    compilerOptions: { target: ts.ScriptTarget.ES2022, module: ts.ModuleKind.None },
  }).outputText
  let actions!: BucketActions
  const app = renderer.createApp({
    setup() {
      actions = runInNewContext(`${code}\n({ ${names.join(', ')} })`, context)
      return () => null
    },
  })
  app.mount({})
  const emit = (request: ListingRequest, result: Partial<ListingResult> = {}) =>
    events.emit(listingChannels(request.kind).result, {
      ...request,
      fullList: options.remoteFiles ?? [],
      success: true,
      finished: true,
      phase: 'complete',
      ...result,
    })
  return {
    ...actions,
    ...state,
    app,
    props,
    message,
    confirm,
    sendRPC,
    sendToMain,
    triggerRPC,
    warn,
    events,
    emit,
    fileListings,
    downloadListings,
    context,
  }
}
