import { nextTick } from 'vue'
import { useI18n } from 'vue-i18n'

import useConfirm from '@/composables/useConfirm'
import useMessage from '@/composables/useMessage'
import { getConfig } from '@/services/configService'
import $$db from '@/services/galleryDatabase'
import ALLApi from '@/services/galleryDeletionService'
import { configPaths } from '@/utils/configPaths'
import { picBedsCanbeDeleted } from '@/utils/static'
import { IRPCActionType } from '#/constants/rpcActions'
import { getRawData } from '#/utils/rawData'
interface GalleryActionOptions {
  choosedList: IObjT<boolean>
  updateGallery: () => Promise<boolean>
  refresh: () => void
}
export function useGalleryActions({ choosedList, updateGallery, refresh }: GalleryActionOptions) {
  const { t } = useI18n()
  const message = useMessage()
  const { confirm } = useConfirm()
  type IResult<T> = T & {
    id: string
    createdAt: number
    updatedAt: number
  }

  async function copy(item: ImgInfo) {
    let result: [string, string] | undefined
    try {
      result = await window.electron.triggerRPC<[string, string]>(IRPCActionType.GALLERY_PASTE_TEXT, getRawData(item))
      if (!result?.[0]?.trim()) throw new Error('Missing gallery link')
    } catch {
      message.error(t('pages.gallery.copyLinkFailed'))
      return
    }
    message.success(t('pages.gallery.copyLinkSucceed'))
    if (result[1] && item.id) {
      try {
        if (await $$db.updateById(item.id, { shortUrl: result[1] })) await updateGallery()
      } catch {
        // Copy has already succeeded; retaining a short URL is optional caching.
      }
    }
  }

  async function remove(item: ImgInfo, _: number) {
    if (!item.id) return

    try {
      const confirmed = await confirm({
        title: t('pages.gallery.notice'),
        message: t('pages.gallery.confirmRemove'),
        type: 'warning',
        confirmButtonText: t('common.confirm'),
        cancelButtonText: t('common.cancel'),
        center: true,
      })
      if (!confirmed) return
      const file = await $$db.getById<ImgInfo>(item.id!)
      if (!file) {
        delete choosedList[item.id]
        await updateGallery()
        return
      }
      const isNeedDeleteCloudFile =
        (await getConfig(configPaths.settings.deleteCloudFile)) &&
        picBedsCanbeDeleted.includes(file.type || 'placeholder')
      if (isNeedDeleteCloudFile) {
        let deleted = false
        try {
          deleted = await ALLApi.delete(getRawData(file))
        } catch {
          // A failed cloud request must leave the local record available for retry.
        }
        if (!deleted) {
          message.error(`${item.fileName} ${t('pages.gallery.cloudDeleteFailed')}`)
          return
        }
      }
      await $$db.removeById(item.id!)
      delete choosedList[item.id]
      window.electron.sendRPC(IRPCActionType.GALLERY_REMOVE_RUN_SCRIPTS, getRawData(item))
      const args = getRawData(file)
      window.electron.sendRPC(IRPCActionType.GALLERY_REMOVE_FILES, [args])
      await updateGallery()
      nextTick(() => {
        refresh()
      })
      message.success(
        isNeedDeleteCloudFile
          ? `${item.fileName} ${t('pages.gallery.cloudDeleteSucceed')}`
          : t('pages.gallery.operationSucceed'),
      )
    } catch {
      message.error(t('pages.gallery.operationFailed'))
    }
  }

  async function multiRemove() {
    const imageIDList = Object.keys(choosedList).filter(id => choosedList[id])
    if (!imageIDList.length) return

    try {
      const confirmed = await confirm({
        title: t('pages.gallery.notice'),
        message: t('pages.gallery.confirmRemove'),
        type: 'warning',
        confirmButtonText: t('common.confirm'),
        cancelButtonText: t('common.cancel'),
        center: true,
      })
      if (!confirmed) return
      const files: IResult<ImgInfo>[] = []
      let failedCount = 0
      const isDeleteCloudFile = await getConfig(configPaths.settings.deleteCloudFile)
      for (const key of imageIDList) {
        let file: IResult<ImgInfo> | undefined
        try {
          file = await $$db.getById<ImgInfo>(key)
          if (!file) {
            delete choosedList[key]
            continue
          }
          const isNeedDeleteCloudFile = isDeleteCloudFile && picBedsCanbeDeleted.includes(file.type || 'placeholder')
          if (isNeedDeleteCloudFile && !(await ALLApi.delete(file))) {
            failedCount++
            continue
          }
          await $$db.removeById(key)
        } catch {
          failedCount++
          continue
        }
        files.push(file)
        delete choosedList[key]
        window.electron.sendRPC(IRPCActionType.GALLERY_REMOVE_RUN_SCRIPTS, getRawData(file))
      }

      if (files.length) {
        window.electron.sendRPC(IRPCActionType.GALLERY_REMOVE_FILES, getRawData(files))
      }
      await updateGallery()
      nextTick(() => {
        refresh()
      })
      const summary = t('pages.gallery.removeSummary', { removed: files.length, failed: failedCount })
      if (failedCount && files.length) {
        message.warning(summary)
      } else if (failedCount) {
        message.error(summary)
      } else if (files.length) {
        message.success(summary)
      } else {
        message.info(summary)
      }
    } catch {
      message.error(t('pages.gallery.operationFailed'))
    }
  }

  async function multiCopy() {
    if (Object.values(choosedList).some(item => item)) {
      const copyString: string[] = []
      const shortUrls: { id: string; shortUrl: string }[] = []
      const imageIDList = Object.keys(choosedList).filter(id => choosedList[id])
      try {
        for (const imageIDListItem of imageIDList) {
          const item = await $$db.getById<ImgInfo>(imageIDListItem)
          if (item) {
            const result = await window.electron.triggerRPC<[string, string]>(
              IRPCActionType.GALLERY_PASTE_TEXT,
              getRawData(item),
              false,
            )
            if (!result?.[0]?.trim()) {
              message.error(t('pages.gallery.copyLinkFailed'))
              return
            }
            copyString.push(result[0])
            if (result[1] && item.id) shortUrls.push({ id: item.id, shortUrl: result[1] })
          }
        }
        if (!copyString.length) {
          message.error(t('pages.gallery.copyLinkFailed'))
          return
        }
        window.electron.clipboard.writeText(copyString.join('\n'))
      } catch {
        message.error(t('pages.gallery.copyLinkFailed'))
        return
      }
      for (const id of imageIDList) delete choosedList[id]
      message.success(t('pages.gallery.copyLinkSucceed'))
      let galleryChanged = false
      for (const { id, shortUrl } of shortUrls) {
        try {
          if (await $$db.updateById(id, { shortUrl })) galleryChanged = true
        } catch {
          // Cache failures do not invalidate the clipboard contents.
        }
      }
      if (galleryChanged) await updateGallery()
    }
  }
  return { copy, remove, multiRemove, multiCopy }
}
