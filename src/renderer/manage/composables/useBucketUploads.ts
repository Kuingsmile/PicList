import { ref, watch } from 'vue'
import { useI18n } from 'vue-i18n'

import useMessage from '@/composables/useMessage'
import { saveConfig } from '@/manage/services/configService'
import { useManageStore } from '@/manage/stores/manageStore'
import type { BucketLocation, BucketViewLifecycle } from '@/manage/types/bucket'
import { renameFile } from '@/manage/utils/fileName'
import { IRPCActionType } from '#/constants/rpcActions'
import { isUrl as isValidUrl } from '#/utils/url'
interface BucketUploadOptions
  extends Pick<BucketLocation, 'configMap' | 'currentPrefix' | 'currentCustomDomain'>, BucketViewLifecycle {}
export function useBucketUploads({
  configMap,
  currentPrefix,
  currentCustomDomain,
  getGeneration,
  isDisposed,
}: BucketUploadOptions) {
  const manageStore = useManageStore()
  const { t } = useI18n()
  const message = useMessage()
  const isShowUploadPanel = ref(false)

  const isUploadKeepDirStructure = ref(manageStore.config.settings.isUploadKeepDirStructure ?? true)

  const dialogVisible = ref(false)

  const urlToUpload = ref('')

  async function handleUploadKeepDirChange(value: boolean) {
    if (!(await saveConfig('settings.isUploadKeepDirStructure', value))) return
    manageStore.refreshConfig()
  }

  function showUploadDialog() {
    isShowUploadPanel.value = true
  }

  function renameFileBeforeUpload(filePath: string, fullPath: string): string {
    const fileName = window.node.path.basename(filePath)
    const typeMap = {
      timestampRename: manageStore.config.settings.timestampRename,
      randomStringRename: manageStore.config.settings.randomStringRename,
      customRenameFormat: manageStore.config.settings.customRenameFormat,
      customRename: manageStore.config.settings.customRename,
    }
    return renameFile(typeMap, fileName, () => window.node.fs.readFileSync(fullPath))
  }

  function captureUploadDestination() {
    return Object.freeze({
      alias: configMap.value.alias,
      bucketName: configMap.value.bucketName,
      region: configMap.value.bucketConfig.Location,
      prefix: currentPrefix.value,
      githubBranch: currentCustomDomain.value,
      aclForUpload: manageStore.config.picBed[configMap.value.alias].aclForUpload,
      keepDirStructure: isUploadKeepDirStructure.value,
    })
  }

  function enqueueUploadFiles(files: any[], destination: ReturnType<typeof captureUploadDestination>) {
    const formateduploadPanelFilesList = [] as any[]
    files.forEach((item: any) => {
      formateduploadPanelFilesList.push({
        rawName: item.name,
        path: item.path.replace(/\\/g, '/'),
        size: item.size,
        renamedFileName: renameFileBeforeUpload(item.name, item.path),
        relativePath: item.relativePath ?? '',
      })
    })
    if (destination.keepDirStructure) {
      formateduploadPanelFilesList.forEach((item: any) => {
        item.key = `${destination.prefix}${item.relativePath.substring(0, item.relativePath.lastIndexOf('/'))}/${item.renamedFileName}`
      })
    } else {
      formateduploadPanelFilesList.forEach((item: any) => {
        item.key = destination.prefix + item.renamedFileName
      })
    }
    const param = {
      // tcyun
      fileArray: [] as any[],
    }
    formateduploadPanelFilesList.forEach((item: any) => {
      param.fileArray.push({
        alias: destination.alias,
        bucketName: destination.bucketName,
        region: destination.region,
        key: item.key,
        filePath: item.path,
        fileSize: item.size,
        fileName: item.rawName,
        githubBranch: destination.githubBranch,
        aclForUpload: destination.aclForUpload,
      })
    })
    window.electron.sendRPC(IRPCActionType.MANAGE_UPLOAD_BUCKET_FILE, destination.alias, param)
  }

  function showUrlDialog() {
    dialogVisible.value = true
  }

  async function handleUploadFromUrl() {
    if (isDisposed()) return
    dialogVisible.value = false
    const urlList = [] as string[]
    urlToUpload.value.split('\n').forEach((item: string) => {
      if (item.trim() !== '' && isValidUrl(item.trim())) {
        urlList.push(item.trim())
      }
    })
    if (urlList.length === 0) {
      message.error(t('pages.manage.bucket.inputValidUrlMsg'))
      return
    }
    const destination = captureUploadDestination()
    const generation = getGeneration()
    message.success(t('pages.manage.bucket.startUploadMsg'))
    const res = await window.electron.triggerRPC<IUrlImportFile[]>(
      IRPCActionType.MANAGE_DOWNLOAD_FILE_FROM_URL,
      urlList,
    )
    if (!res?.length) return
    const files = res.map(item => ({
      name: item.fileName,
      path: item.filePath.replace(/\\/g, '/'),
      size: item.fileSize,
    }))
    enqueueUploadFiles(files, destination)
    if (!isDisposed() && generation === getGeneration()) isShowUploadPanel.value = true
  }
  watch(
    () => manageStore.config.settings.isUploadKeepDirStructure,
    value => {
      isUploadKeepDirStructure.value = value ?? true
    },
  )
  function uploadFiles(files: any[]) {
    enqueueUploadFiles(files, captureUploadDestination())
  }
  return {
    isShowUploadPanel,
    isUploadKeepDirStructure,
    dialogVisible,
    urlToUpload,
    handleUploadKeepDirChange,
    showUploadDialog,
    showUrlDialog,
    handleUploadFromUrl,
    uploadFiles,
  }
}
