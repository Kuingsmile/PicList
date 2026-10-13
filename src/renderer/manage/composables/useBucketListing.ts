import { computed, nextTick, reactive, ref, shallowRef, triggerRef } from 'vue'
import { useI18n } from 'vue-i18n'

import useConfirm from '@/composables/useConfirm'
import useMessage from '@/composables/useMessage'
import { fileCacheDbInstance } from '@/manage/services/bucketDatabase'
import { useManageStore } from '@/manage/stores/manageStore'
import type { BucketFile, ISortTypeList } from '@/manage/types/bucket'
import type { BucketLocation } from '@/manage/types/bucket'
import { appendListingItems, ListingSession } from '@/manage/utils/listingSession'
import { compareFileValues, type FileColumn, fileDate } from '@/utils/fileCollection'
import { IRPCActionType } from '#/constants/rpcActions'
import { type DeleteResult, removeDeletedEntries } from '#/deletion'
import type { ListingRequest, ListingResult } from '#/listing'
import { getRawData } from '#/utils/rawData'
interface BucketListingOptions extends BucketLocation {
  isDisposed: () => boolean
  invalidateListings: () => void
  closeUrlDialog: () => void
  onReset: () => void
  onSorted: () => void
  getColumns: () => FileColumn<BucketFile>[]
}
export function useBucketListing({
  configMap,
  currentPrefix,
  currentPicBedName,
  currentCustomDomain,
  isDisposed,
  invalidateListings,
  closeUrlDialog,
  onReset,
  onSorted,
  getColumns,
}: BucketListingOptions) {
  const manageStore = useManageStore()
  const { t } = useI18n()
  const message = useMessage()
  const confirm = useConfirm()
  const fileListings = new ListingSession(window.electron)

  const isLoadingData = ref(false)

  const isShowLoadingPage = ref(false)

  const currentPageNumber = ref(1)

  // Each entry is the cursor used to load that page, including the first page's empty cursor.
  const pageMarkers = reactive<string[]>([''])

  const lastPageNumber = ref<number | null>(null)

  // Keep the complete inventory outside Vue's deep reactivity; only the visible page is reactive.
  const allPageFiles = shallowRef<BucketFile[] | null>(null)
  const allPagesLoaded = computed(() => allPageFiles.value !== null)
  const totalItemCount = computed(() => allPageFiles.value?.length ?? 0)
  const availablePageCount = computed(() => (allPagesLoaded.value ? (lastPageNumber.value ?? 1) : pageMarkers.length))
  const loadingPage = ref<number | null>(null)
  const isFindingNewest = ref(false)
  const scannedItemCount = ref(0)
  let listingOperation = 0
  let inventoryScope = ''
  let emptyTerminalMarker = ''

  const currentPageFilesInfo = reactive<BucketFile[]>([])

  const sortAscending = ref(localStorage.getItem('sortAscending') !== 'false')

  const searchText = ref('')

  const currentSortType = ref<ISortTypeList>('name')

  const paging = computed(() => manageStore.config.picBed[configMap.value.alias].paging)

  const itemsPerPage = computed(() => manageStore.config.picBed[configMap.value.alias].itemsPerPage)

  const isAutoRefresh = computed(() => manageStore.config.settings.isAutoRefresh ?? false)

  function listingIdentity(kind: ListingRequest['kind'], prefix = currentPrefix.value) {
    return {
      accountId: configMap.value.alias,
      provider: currentPicBedName.value,
      bucketName: configMap.value.bucketName,
      prefix,
      kind,
    }
  }

  function currentInventoryScope() {
    return JSON.stringify([listingIdentity('files', configMap.value.prefix), currentCustomDomain.value])
  }

  async function resetParam(force: boolean = false) {
    if (isDisposed()) return
    if (force && paging.value && allPagesLoaded.value && inventoryScope === currentInventoryScope()) {
      loadNewestFiles()
      return
    }
    invalidateListings()
    listingOperation++
    isShowLoadingPage.value = true
    loadingPage.value = null
    isFindingNewest.value = false
    allPageFiles.value = null
    emptyTerminalMarker = ''
    pageMarkers.splice(0, pageMarkers.length, '')
    lastPageNumber.value = null
    currentPrefix.value = configMap.value.prefix
    const request = fileListings.begin(listingIdentity('files'))
    currentPageNumber.value = 1
    currentPageFilesInfo.length = 0
    onReset()
    searchText.value = ''
    closeUrlDialog()
    sortAscending.value = localStorage.getItem('sortAscending') !== 'false'
    if (!isAutoRefresh.value && !force && !paging.value) {
      const cachedData = await searchExistFileList()
      if (!fileListings.isCurrent(request)) return
      if (cachedData.length > 0) {
        appendListingItems(currentPageFilesInfo, cachedData[0].value.fullList)
        const sortType = (localStorage.getItem('sortType') as ISortTypeList) || 'init'
        sortFile(sortType, false)
        isShowLoadingPage.value = false
        fileListings.complete(request)
        return
      }
    }
    if (paging.value) {
      const res = await getBucketFileList(request)
      if (!res || !fileListings.isCurrent(request)) return
      if (res.success) {
        appendListingItems(currentPageFilesInfo, res.fullList)
        const sortType = (localStorage.getItem('sortType') as ISortTypeList) || 'init'
        sortFile(sortType, false)
        if (!updatePagination(1, res)) message.error(t('pages.manage.bucket.getFileListFailed'))
      } else {
        message.error(t('pages.manage.bucket.getFileListFailed'))
      }
    } else {
      if (getBucketFileListBackStage(request)) message.info(t('pages.manage.bucket.getInBackground'))
    }
    if (fileListings.isCurrent(request)) isShowLoadingPage.value = false
  }

  async function forceRefreshFileList() {
    if (isLoadingData.value) {
      message.error(t('pages.manage.bucket.isLoadingMsg'))
      return
    }
    await resetParam(true)
  }

  function updatePagination(page: number, result: ListingResult) {
    const nextMarker = String(result.nextMarker ?? '')
    if (result.isTruncated && nextMarker && nextMarker === emptyTerminalMarker) {
      pageMarkers.splice(page)
      lastPageNumber.value = page
      return true
    }
    const knownMarkerPage = pageMarkers.indexOf(nextMarker)
    // A broken/cyclic cursor is a failed navigation, never evidence that the folder is complete.
    if (result.isTruncated && (!nextMarker || (knownMarkerPage >= 0 && knownMarkerPage < page))) return false
    if (result.isTruncated) {
      // Keep known pages when revisiting them, but discard cursors invalidated by a changed listing.
      if (pageMarkers[page] !== nextMarker) {
        pageMarkers.splice(page, pageMarkers.length - page, nextMarker)
        lastPageNumber.value = null
        emptyTerminalMarker = ''
      }
    } else {
      pageMarkers.splice(page)
      lastPageNumber.value = page
    }
    return true
  }

  const changePage = async (page: number) => {
    if (
      isDisposed() ||
      !paging.value ||
      isLoadingData.value ||
      isShowLoadingPage.value ||
      !Number.isSafeInteger(page) ||
      page < 1 ||
      page === currentPageNumber.value
    )
      return
    await navigateToPage(page)
  }

  async function goToLastPage() {
    if (isDisposed() || !paging.value || isLoadingData.value || isShowLoadingPage.value) return
    await navigateToPage(lastPageNumber.value ?? Infinity)
  }

  async function navigateToPage(targetPage: number) {
    invalidateListings()
    listingOperation++
    closeUrlDialog()
    if (allPagesLoaded.value) {
      showInventoryPage(targetPage, true)
      return
    }

    isShowLoadingPage.value = true
    // Start at the closest known cursor. Unseen pages must be discovered in provider order.
    let page = Math.min(targetPage, availablePageCount.value)
    let previousPageResult: ListingResult | undefined
    for (;;) {
      loadingPage.value = page
      const request = fileListings.begin(listingIdentity('files'))
      let res = await getBucketFileList(request, page)
      if (!res || !fileListings.isCurrent(request)) return
      // Some providers only reveal the end by returning an empty page after a full one.
      if (res.success && !res.isTruncated && !res.fullList.length && page > 1) {
        emptyTerminalMarker = pageMarkers[page - 1]
        page--
        if (previousPageResult) res = previousPageResult
        else if (currentPageNumber.value === page) res = { ...res, fullList: [...currentPageFilesInfo] }
        else {
          loadingPage.value = page
          const previousRequest = fileListings.begin(listingIdentity('files'))
          res = await getBucketFileList(previousRequest, page)
          if (!res || !fileListings.isCurrent(previousRequest)) return
        }
        res = { ...res, isTruncated: false, nextMarker: '' }
      }
      if (!res.success || !updatePagination(page, res)) {
        isShowLoadingPage.value = false
        loadingPage.value = null
        message.error(t('pages.manage.bucket.getFileListFailed'))
        return
      }
      if (page >= targetPage || lastPageNumber.value === page) {
        currentPageNumber.value = page
        currentPageFilesInfo.length = 0
        appendListingItems(currentPageFilesInfo, res.fullList)
        searchText.value = ''
        sortFile(currentSortType.value, false)
        isShowLoadingPage.value = false
        loadingPage.value = null
        return
      }
      previousPageResult = res
      page++
    }
  }

  function showInventoryPage(page: number, clearSelection = false) {
    const files = allPageFiles.value
    if (!files) return
    if (clearSelection) {
      for (const item of currentPageFilesInfo) item.checked = false
      searchText.value = ''
    }
    lastPageNumber.value = Math.max(1, Math.ceil(files.length / itemsPerPage.value))
    currentPageNumber.value = Math.min(page, lastPageNumber.value)
    currentPageFilesInfo.length = 0
    const offset = (currentPageNumber.value - 1) * itemsPerPage.value
    appendListingItems(currentPageFilesInfo, files.slice(offset, offset + itemsPerPage.value))
    onSorted()
  }

  function showNewestFiles() {
    if (isDisposed() || !paging.value || isLoadingData.value || isShowLoadingPage.value) return
    loadNewestFiles()
  }

  function loadNewestFiles() {
    invalidateListings()
    listingOperation++
    const request = fileListings.begin(listingIdentity('files'))
    const scope = currentInventoryScope()
    const files: BucketFile[] = []
    isLoadingData.value = true
    isShowLoadingPage.value = false
    loadingPage.value = null
    isFindingNewest.value = true
    scannedItemCount.value = 0
    closeUrlDialog()
    try {
      fileListings.subscribe(request, data => {
        appendListingItems(files, data.items)
        scannedItemCount.value = data.total
        if (data.finished) {
          isLoadingData.value = false
          isFindingNewest.value = false
          if (data.success) {
            allPageFiles.value = files
            inventoryScope = scope
            currentPageNumber.value = 1
            searchText.value = ''
            sortAscending.value = false
            sortFile('time', false)
            if (files.some(item => !item.isDir) && !files.some(item => fileDate(item) !== undefined)) {
              message.info(t('pages.manage.bucket.newestTimeUnavailable'))
            }
          } else if (data.phase !== 'cancelled') {
            message.error(t('pages.manage.bucket.getFileListFailed'))
          }
        }
        return nextTick()
      })
      window.electron.sendRPC(IRPCActionType.MANAGE_GET_BUCKET_LIST_BACKSTAGE, request.accountId, {
        ...listingParams(request, 1),
        paging: false,
        marker: '',
      })
    } catch {
      fileListings.cancel()
      isLoadingData.value = false
      isFindingNewest.value = false
      message.error(t('pages.manage.bucket.getFileListFailed'))
    }
  }

  function removeListedEntries(result: DeleteResult) {
    if (!allPageFiles.value) return
    allPageFiles.value = removeDeletedEntries(allPageFiles.value, result)
    showInventoryPage(currentPageNumber.value)
  }

  function sortFile(type: ISortTypeList, toggle = true) {
    // A remembered sort whose column has since been removed falls back to the default order.
    if (type !== 'check' && type !== 'init' && !getColumns().some(column => column.key === type)) type = 'init'
    if (toggle) sortAscending.value = currentSortType.value === type ? !sortAscending.value : type !== 'time'
    currentSortType.value = type
    localStorage.setItem('sortType', type)
    localStorage.setItem('sortAscending', String(sortAscending.value))
    onSorted()
    if (isLoadingData.value) return
    const column = getColumns().find(column => column.key === type)
    const files = allPageFiles.value ?? currentPageFilesInfo
    files.sort((a, b) => {
      if (type === 'check') return Number(!!b.checked) - Number(!!a.checked)
      if (type === 'init') return Number(!!b.isDir) - Number(!!a.isDir) || compareFileValues(a.fileName, b.fileName)
      return compareFileValues(column?.value(a), column?.value(b), sortAscending.value)
    })
    if (allPagesLoaded.value) {
      triggerRef(allPageFiles)
      showInventoryPage(1)
    }
  }

  async function cancelLoading() {
    const operation = listingOperation
    try {
      const result = await confirm.confirm({
        message: t('pages.manage.bucket.notice'),
        title: t('pages.manage.bucket.stopGetFileListMsg'),
        confirmButtonText: t('common.confirm'),
        cancelButtonText: t('common.cancel'),
        type: 'warning',
        center: true,
      })
      if (
        !result ||
        isDisposed() ||
        !fileListings.request ||
        operation !== listingOperation ||
        (!isLoadingData.value && !isShowLoadingPage.value)
      )
        return
      isLoadingData.value = false
      isShowLoadingPage.value = false
      loadingPage.value = null
      isFindingNewest.value = false
      fileListings.cancel()
      if (!allPagesLoaded.value) sortFile(currentSortType.value, false)
      message.success(t('pages.manage.bucket.stopSuccessMsg'))
    } catch (e) {
      console.error(e)
    }
  }

  function getBucketFileListBackStage(request: ListingRequest) {
    isLoadingData.value = true
    try {
      const param = listingParams(request)
      const cacheTarget = { provider: request.provider, key: getTableKeyOfDb() }
      sortFile((localStorage.getItem('sortType') as ISortTypeList) || 'init', false)
      fileListings.subscribe(request, data => {
        appendListingItems(currentPageFilesInfo, data.items)
        // Keep arrival order while loading; filterList searches all received items. Sort the
        // completed (or partial failed) inventory once, preserving object/selection identity.
        if (data.finished) {
          isLoadingData.value = false
          const sortType = (localStorage.getItem('sortType') as ISortTypeList) || 'init'
          sortFile(sortType, false)
          if (data.success) {
            void cacheFileList(cacheTarget, currentPageFilesInfo)
            message.success(t('pages.manage.bucket.getFileListSuccess'))
          } else if (data.phase !== 'cancelled') {
            message.error(t('pages.manage.bucket.partFileListFailed'))
          }
        }
        return nextTick()
      })
      window.electron.sendRPC(IRPCActionType.MANAGE_GET_BUCKET_LIST_BACKSTAGE, request.accountId, param)
      return true
    } catch {
      if (!fileListings.isCurrent(request)) return false
      fileListings.complete(request)
      isLoadingData.value = false
      message.error(t('pages.manage.bucket.getFileListFailed'))
      return false
    }
  }

  async function getBucketFileList(
    request: ListingRequest,
    page = currentPageNumber.value,
  ): Promise<ListingResult | undefined> {
    isLoadingData.value = true
    let result: ListingResult
    try {
      const response = await window.electron.triggerRPC<ListingResult>(
        IRPCActionType.MANAGE_GET_BUCKET_FILE_LIST,
        request.accountId,
        listingParams(request, page),
      )
      if (!response) throw new Error('Missing listing response')
      result = response
    } catch {
      result = { ...request, fullList: [], success: false, finished: true, phase: 'error', error: 'LISTING_FAILED' }
    }
    if (!fileListings.accept(request, result)) return
    isLoadingData.value = false
    return result
  }

  function listingParams(request: ListingRequest, page = currentPageNumber.value) {
    // Nested Vue state must be unwrapped before Electron copies it across the context bridge.
    return getRawData({
      ...request,
      bucketConfig: { ...configMap.value.bucketConfig },
      paging: paging.value,
      marker: pageMarkers[page - 1] ?? '',
      itemsPerPage: itemsPerPage.value,
      customUrl: currentCustomDomain.value,
      currentPage: page,
      cdnUrl: configMap.value.cdnUrl,
      baseDir: configMap.value.baseDir,
      webPath: configMap.value.webPath,
    })
  }

  function getTableKeyOfDb() {
    let tableKey
    if (currentPicBedName.value === 'github') {
      // customUrl is branch
      tableKey = `${configMap.value.alias}@${configMap.value.bucketConfig.githubUsername}@${configMap.value.bucketName}@${currentCustomDomain.value}@${currentPrefix.value}`
    } else {
      tableKey = `${configMap.value.alias}@${configMap.value.bucketName}@${currentPrefix.value}`
    }
    return tableKey
  }

  async function searchExistFileList() {
    try {
      const table = fileCacheDbInstance.table(currentPicBedName.value)
      return await table.where('key').equals(getTableKeyOfDb()).toArray()
    } catch {
      // A cache failure is a miss so remote storage remains accessible.
      console.warn('Failed to read the bucket file cache')
      return []
    }
  }

  async function cacheFileList(target: { provider: string; key: string }, files: any[]) {
    try {
      const table = fileCacheDbInstance.table(target.provider)
      await table.put({
        key: target.key,
        value: JSON.parse(
          JSON.stringify({
            fullList: files,
          }),
        ),
      })
    } catch {
      console.warn('Failed to write the bucket file cache')
    }
  }
  return {
    fileListings,
    isLoadingData,
    isShowLoadingPage,
    currentPageNumber,
    availablePageCount,
    lastPageNumber,
    allPagesLoaded,
    totalItemCount,
    loadingPage,
    isFindingNewest,
    scannedItemCount,
    currentPageFilesInfo,
    searchText,
    sortAscending,
    currentSortType,
    paging,
    resetParam,
    forceRefreshFileList,
    changePage,
    goToLastPage,
    showNewestFiles,
    removeListedEntries,
    sortFile,
    cancelLoading,
    listingParams,
    listingIdentity,
    getTableKeyOfDb,
  }
}
