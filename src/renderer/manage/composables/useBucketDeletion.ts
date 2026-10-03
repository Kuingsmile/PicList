import type { Ref } from 'vue'
import { computed, reactive, ref } from 'vue'
import { useI18n } from 'vue-i18n'

import useConfirm from '@/composables/useConfirm'
import useMessage from '@/composables/useMessage'
import { fileCacheDbInstance } from '@/manage/services/bucketDatabase'
import type { BucketFile, BucketLocation, BucketViewLifecycle } from '@/manage/types/bucket'
import { applyDeletionResult, type DeletionState, retryDeletionTargets } from '@/manage/utils/deletion'
import { IRPCActionType } from '#/constants/rpcActions'
import { type DeleteResult, type DeleteTarget, failedDeletion, removeDeletedEntries } from '#/deletion'
interface BucketDeletionOptions extends BucketLocation, BucketViewLifecycle {
  currentPageFilesInfo: BucketFile[]
  selectedItems: Ref<BucketFile[]>
  isLoadingData: Ref<boolean>
  getTableKeyOfDb: () => string
}
export function useBucketDeletion({
  configMap,
  currentPrefix,
  currentPicBedName,
  currentCustomDomain,
  getGeneration,
  isDisposed,
  currentPageFilesInfo,
  selectedItems,
  isLoadingData,
  getTableKeyOfDb,
}: BucketDeletionOptions) {
  const { t } = useI18n()
  const message = useMessage()
  const confirm = useConfirm()
  const isDeleting = ref(false)

  const deletingTargets = ref<{ scope: string; keys: Set<string> }>({ scope: '', keys: new Set() })

  const deletionStates = reactive(new Map<string, DeletionState>())

  const activeDeletionState = computed(() => deletionStates.get(deletionScope()) || { failed: [], pendingFolders: [] })

  const failedDeletionKeys = computed(() => new Set(activeDeletionState.value.failed.map(item => item.key)))

  async function handleBatchDeleteInfo() {
    await confirmDeletion(selectedItems.value.map(item => ({ key: item.key, isDir: item.isDir, DeleteHash: item.sha })))
  }

  async function handleDeleteFile(item: any) {
    await confirmDeletion([{ key: item.key, isDir: item.isDir, DeleteHash: item.sha }])
  }

  function deletionScope() {
    return JSON.stringify([
      configMap.value.alias,
      currentPicBedName.value,
      configMap.value.bucketName,
      currentPicBedName.value === 'github' ? currentCustomDomain.value : '',
    ])
  }

  async function confirmDeletion(targets: DeleteTarget[]) {
    if (isDeleting.value || isLoadingData.value || targets.length === 0) return
    const scope = deletionScope()
    try {
      const result = await confirm.confirm({
        message: t('pages.manage.bucket.willDeleteMsg', { num: targets.length }),
        title: t('pages.manage.bucket.notice'),
        confirmButtonText: t('common.confirm'),
        cancelButtonText: t('common.cancel'),
        type: 'warning',
        center: true,
      })
      if (result && scope === deletionScope()) await performDeletion(targets)
    } catch {
      message.info(t('pages.manage.bucket.canceled'))
    }
  }

  async function retryFailedDeletions() {
    await performDeletion(retryDeletionTargets(activeDeletionState.value))
  }

  async function performDeletion(targets: DeleteTarget[]) {
    if (isDeleting.value || isLoadingData.value || targets.length === 0) return
    isDeleting.value = true
    const scope = deletionScope()
    const generation = getGeneration()
    deletingTargets.value = { scope, keys: new Set(targets.map(item => item.key)) }
    const accountId = configMap.value.alias
    const provider = currentPicBedName.value
    const cachePrefix = getTableKeyOfDb().slice(0, -currentPrefix.value.length)
    const param = {
      bucketName: configMap.value.bucketName,
      region: configMap.value.bucketConfig.Location,
      githubBranch: currentCustomDomain.value,
      items: targets,
    }
    if (!deletionStates.has(scope)) deletionStates.set(scope, { failed: [], pendingFolders: [] })
    const state = deletionStates.get(scope)!
    message.info(t('pages.manage.bucket.deletingMsg'))
    try {
      let result: DeleteResult
      try {
        const response = await window.electron.triggerRPC<DeleteResult>(
          IRPCActionType.MANAGE_DELETE_BUCKET_ITEMS,
          accountId,
          param,
        )
        if (
          !response ||
          !Array.isArray(response.deleted) ||
          !Array.isArray(response.failed) ||
          !Array.isArray(response.deletedFolders)
        ) {
          throw new Error('Missing deletion results')
        }
        result = response
      } catch {
        result = failedDeletion(targets, t('pages.manage.bucket.deleteFailed'))
      }
      const confirmed = applyDeletionResult(state, targets, result)
      if (!isDisposed() && scope === deletionScope() && generation === getGeneration()) {
        const retained = removeDeletedEntries(currentPageFilesInfo, confirmed)
        const retainedEntries = new Set(retained)
        for (let index = currentPageFilesInfo.length - 1; index >= 0; index--) {
          if (!retainedEntries.has(currentPageFilesInfo[index])) currentPageFilesInfo.splice(index, 1)
        }
      }
      try {
        // Update cached parent and child listings in the captured bucket, even after navigation.
        await fileCacheDbInstance
          .table(provider)
          .where('key')
          .startsWith(cachePrefix)
          .modify((entry: any) => {
            if (Array.isArray(entry.value.fullList)) {
              entry.value.fullList = removeDeletedEntries(entry.value.fullList, confirmed)
            }
          })
      } catch {
        // Cache errors must not turn confirmed remote deletions into retry candidates.
        console.warn('Failed to update the bucket file cache after deletion')
      }
      if (isDisposed() || scope !== deletionScope()) return
      if (result.failed.length === 0) message.success(t('pages.manage.bucket.deleteSuccess'))
      else if (result.deleted.length === 0 && result.deletedFolders.length === 0)
        message.error(t('pages.manage.bucket.deleteFailed'))
      else
        message.warning(
          t('pages.manage.bucket.deleteMultiMsg', { success: result.deleted.length, failed: result.failed.length }),
        )
    } finally {
      isDeleting.value = false
      deletingTargets.value = { scope: '', keys: new Set() }
    }
  }
  return {
    isDeleting,
    deletingTargets,
    activeDeletionState,
    failedDeletionKeys,
    handleBatchDeleteInfo,
    handleDeleteFile,
    deletionScope,
    retryFailedDeletions,
  }
}
