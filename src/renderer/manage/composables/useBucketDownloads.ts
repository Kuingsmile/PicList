import type { Ref } from 'vue'
import { nextTick, reactive, ref } from 'vue'
import { useI18n } from 'vue-i18n'

import useConfirm from '@/composables/useConfirm'
import useMessage from '@/composables/useMessage'
import { useManageStore } from '@/manage/stores/manageStore'
import type { BucketFile, BucketLocation, BucketViewLifecycle } from '@/manage/types/bucket'
import { appendListingItems, ListingSession } from '@/manage/utils/listingSession'
import { IRPCActionType } from '#/constants/rpcActions'
import type { ListingRequest } from '#/listing'
interface BucketDownloadOptions extends BucketLocation, BucketViewLifecycle {
  listingIdentity: (kind: ListingRequest['kind'], prefix?: string) => Omit<ListingRequest, 'requestId'>
  listingParams: (request: ListingRequest) => Record<string, any>
  selectedItems: Ref<BucketFile[]>
  handleCancelCheck: () => void
}
export function useBucketDownloads({
  configMap,
  currentCustomDomain,
  getGeneration,
  isDisposed,
  listingIdentity,
  listingParams,
  selectedItems,
  handleCancelCheck,
}: BucketDownloadOptions) {
  const manageStore = useManageStore()
  const { t } = useI18n()
  const message = useMessage()
  const confirm = useConfirm()
  const downloadListings = new ListingSession(window.electron)

  const isShowDownloadPanel = ref(false)

  const isLoadingDownloadData = ref(false)

  const currentDownloadFileList = reactive([] as any[])

  function showDownloadDialog() {
    isShowDownloadPanel.value = true
  }

  async function handleFolderBatchDownload(item: any) {
    if (isDisposed()) return
    isLoadingDownloadData.value = false
    const request = downloadListings.begin(listingIdentity('download', `/${item.key.replace(/^\/+|\/+$/g, '')}/`))
    const paramGet = listingParams(request)
    const keepStructure = manageStore.config.settings.isDownloadFolderKeepDirStructure !== false
    try {
      const confirmed = await confirm.confirm({
        message: t('pages.manage.bucket.notice'),
        title: t('pages.manage.bucket.downloadFolderNotice'),
        confirmButtonText: t('common.confirm'),
        cancelButtonText: t('common.cancel'),
        type: 'warning',
      })
      if (!downloadListings.isCurrent(request)) return
      if (!confirmed) {
        downloadListings.cancel()
        return
      }
      const defaultDownloadPath = await window.electron.triggerRPC<string>(
        IRPCActionType.MANAGE_GET_DEFAULT_DOWNLOAD_FOLDER,
      )
      if (!downloadListings.isCurrent(request)) return
      const param = {
        downloadPath: manageStore.config.settings.downloadDir || defaultDownloadPath,
        downloadConflictPolicy: manageStore.config.settings.downloadConflictPolicy ?? 'rename',
        maxDownloadFileCount: manageStore.config.settings.maxDownloadFileCount || 5,
        fileArray: [] as any[],
      }
      isLoadingDownloadData.value = true
      currentDownloadFileList.length = 0
      downloadListings.subscribe(request, data => {
        appendListingItems(currentDownloadFileList, data.items)
        if (!data.finished) return nextTick()
        isLoadingDownloadData.value = false
        if (!data.success) {
          if (data.phase !== 'cancelled') message.error(t('pages.manage.bucket.getDownloadListFailed'))
          return
        }
        message.success(t('pages.manage.bucket.getDownloadListSuccess'))
        param.fileArray = currentDownloadFileList.map(item => ({
          alias: request.accountId,
          bucketName: request.bucketName,
          region: paramGet.bucketConfig.Location,
          key: item.key,
          fileName: keepStructure ? item.key.replace(/^\/+|\/+$/g, '') : item.fileName,
          customUrl: paramGet.customUrl,
          downloadUrl: item.downloadUrl,
          githubUrl: item.url,
          githubPrivate: paramGet.bucketConfig.private,
        }))
        window.electron.sendRPC(IRPCActionType.MANAGE_DOWNLOAD_BUCKET_FILE, request.accountId, param)
        isShowDownloadPanel.value = true
      })
      window.electron.sendRPC(IRPCActionType.MANAGE_GET_BUCKET_LIST_RECURSIVELY, request.accountId, paramGet)
    } catch {
      if (!downloadListings.isCurrent(request)) return
      downloadListings.cancel()
      isLoadingDownloadData.value = false
      message.info(t('pages.manage.bucket.canceled'))
    }
  }

  async function handleBatchDownload() {
    if (await downloadFiles(selectedItems.value)) handleCancelCheck()
  }

  async function downloadFiles(files: any[]) {
    const generation = getGeneration()
    const defaultDownloadPath = await window.electron.triggerRPC<string>(
      IRPCActionType.MANAGE_GET_DEFAULT_DOWNLOAD_FOLDER,
    )
    if (isDisposed() || generation !== getGeneration()) return false
    const param = {
      downloadPath: manageStore.config.settings.downloadDir || defaultDownloadPath,
      downloadConflictPolicy: manageStore.config.settings.downloadConflictPolicy ?? 'rename',
      maxDownloadFileCount: manageStore.config.settings.maxDownloadFileCount
        ? manageStore.config.settings.maxDownloadFileCount
        : 5,
      fileArray: [] as any[],
    }
    files.forEach((item: any) => {
      if (!item.isDir) {
        param.fileArray.push({
          alias: configMap.value.alias,
          bucketName: configMap.value.bucketName,
          region: configMap.value.bucketConfig.Location,
          key: item.key,
          fileName: manageStore.config.settings.isDownloadFileKeepDirStructure
            ? item.key.replace(/^\/+|\/+$/g, '')
            : item.fileName,
          customUrl: currentCustomDomain.value,
          downloadUrl: item.downloadUrl,
          githubUrl: item.url,
          githubPrivate: configMap.value.bucketConfig.private,
        })
      }
    })
    window.electron.sendRPC(IRPCActionType.MANAGE_DOWNLOAD_BUCKET_FILE, configMap.value.alias, param)
    isShowDownloadPanel.value = true
    return true
  }

  async function cancelDownloadLoading() {
    const request = downloadListings.request
    try {
      const result = await confirm.confirm({
        message: t('pages.manage.bucket.notice'),
        title: t('pages.manage.bucket.stopGetDownloadListMsg'),
        confirmButtonText: t('common.confirm'),
        cancelButtonText: t('common.cancel'),
        type: 'warning',
        center: true,
      })
      if (!result || !request || !downloadListings.isCurrent(request)) return
      isLoadingDownloadData.value = false
      downloadListings.cancel()
      message.success(t('pages.manage.bucket.stopSuccessMsg'))
    } catch (e) {
      console.error(e)
    }
  }
  return {
    downloadListings,
    isShowDownloadPanel,
    isLoadingDownloadData,
    currentDownloadFileList,
    showDownloadDialog,
    handleFolderBatchDownload,
    handleBatchDownload,
    downloadFiles,
    cancelDownloadLoading,
  }
}
