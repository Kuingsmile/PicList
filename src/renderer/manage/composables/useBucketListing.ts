import { computed, nextTick, reactive, ref } from 'vue'
import { useI18n } from 'vue-i18n'

import useConfirm from '@/composables/useConfirm'
import useMessage from '@/composables/useMessage'
import { fileCacheDbInstance } from '@/manage/services/bucketDatabase'
import { useManageStore } from '@/manage/stores/manageStore'
import type { BucketFile, ISortTypeList } from '@/manage/types/bucket'
import type { BucketLocation } from '@/manage/types/bucket'
import { appendListingItems, ListingSession } from '@/manage/utils/listingSession'
import { compareFileValues, type FileColumn } from '@/utils/fileCollection'
import { IRPCActionType } from '#/constants/rpcActions'
import type { ListingRequest, ListingResult } from '#/listing'
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

  const availablePageCount = computed(() => pageMarkers.length)

  const currentPageFilesInfo = reactive<BucketFile[]>([])

  const sortAscending = ref(true)

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

  async function resetParam(force: boolean = false) {
    if (isDisposed()) return
    invalidateListings()
    isShowLoadingPage.value = true
    pageMarkers.splice(0, pageMarkers.length, '')
    lastPageNumber.value = null
    currentPrefix.value = configMap.value.prefix
    const request = fileListings.begin(listingIdentity('files'))
    currentPageNumber.value = 1
    currentPageFilesInfo.length = 0
    onReset()
    searchText.value = ''
    closeUrlDialog()
    sortAscending.value = true
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
        updatePagination(1, res)
      } else {
        message.error(t('pages.manage.bucket.getFileListFailed'))
      }
    } else {
      getBucketFileListBackStage(request)
      message.info(t('pages.manage.bucket.getInBackground'))
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
    if (result.isTruncated && nextMarker && nextMarker !== pageMarkers[page - 1]) {
      // Keep known pages when revisiting them, but discard cursors invalidated by a changed listing.
      if (pageMarkers[page] !== nextMarker) {
        pageMarkers.splice(page, pageMarkers.length - page, nextMarker)
        lastPageNumber.value = null
      }
    } else {
      pageMarkers.splice(page)
      lastPageNumber.value = page
    }
  }

  const changePage = async (page: number) => {
    if (
      isDisposed() ||
      !paging.value ||
      isLoadingData.value ||
      isShowLoadingPage.value ||
      !Number.isSafeInteger(page) ||
      page < 1 ||
      page > availablePageCount.value ||
      page === currentPageNumber.value
    )
      return
    const sortType = (localStorage.getItem('sortType') as ISortTypeList) || 'init'

    invalidateListings()
    const request = fileListings.begin(listingIdentity('files'))
    isShowLoadingPage.value = true
    closeUrlDialog()

    const res = await getBucketFileList(request, page)
    if (!res || !fileListings.isCurrent(request)) return
    isShowLoadingPage.value = false

    if (!res.success) {
      message.error(t('pages.manage.bucket.getFileListFailed'))
      return
    }

    currentPageNumber.value = page
    currentPageFilesInfo.length = 0
    appendListingItems(currentPageFilesInfo, res.fullList)
    searchText.value = ''
    updatePagination(page, res)
    sortFile(sortType, false)
  }

  function sortFile(type: ISortTypeList, toggle = true) {
    // A remembered sort whose column has since been removed falls back to the default order.
    if (type !== 'check' && type !== 'init' && !getColumns().some(column => column.key === type)) type = 'init'
    if (toggle) sortAscending.value = currentSortType.value === type ? !sortAscending.value : true
    currentSortType.value = type
    localStorage.setItem('sortType', type)
    onSorted()
    if (isLoadingData.value) return
    const column = getColumns().find(column => column.key === type)
    currentPageFilesInfo.sort((a, b) => {
      if (type === 'check') return Number(!!b.checked) - Number(!!a.checked)
      if (type === 'init') return Number(!!b.isDir) - Number(!!a.isDir) || compareFileValues(a.fileName, b.fileName)
      return compareFileValues(column?.value(a), column?.value(b), sortAscending.value)
    })
  }

  async function cancelLoading() {
    const request = fileListings.request
    try {
      const result = await confirm.confirm({
        message: t('pages.manage.bucket.notice'),
        title: t('pages.manage.bucket.stopGetFileListMsg'),
        confirmButtonText: t('common.confirm'),
        cancelButtonText: t('common.cancel'),
        type: 'warning',
        center: true,
      })
      if (!result || !request || !fileListings.isCurrent(request)) return
      isLoadingData.value = false
      isShowLoadingPage.value = false
      fileListings.cancel()
      sortFile((localStorage.getItem('sortType') as ISortTypeList) || 'init', false)
      message.success(t('pages.manage.bucket.stopSuccessMsg'))
    } catch (e) {
      console.error(e)
    }
  }

  function getBucketFileListBackStage(request: ListingRequest) {
    const param = listingParams(request)
    const cacheTarget = { provider: request.provider, key: getTableKeyOfDb() }
    isLoadingData.value = true
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
    return {
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
    }
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
    currentPageFilesInfo,
    searchText,
    sortAscending,
    currentSortType,
    paging,
    resetParam,
    forceRefreshFileList,
    changePage,
    sortFile,
    cancelLoading,
    listingParams,
    listingIdentity,
    getTableKeyOfDb,
  }
}
