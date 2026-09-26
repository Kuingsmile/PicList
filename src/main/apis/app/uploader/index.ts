import path from 'node:path'
import util from 'node:util'

import picgo from '@core/picgo'
import logger from '@core/picgo/logger'
import dayjs from 'dayjs'
import { clipboard, Notification } from 'electron'
import fs from 'fs-extra'
import { cloneDeep } from 'lodash-es'
import type { IPicGo, IUploadOptions } from 'piclist'
import writeFile from 'write-file-atomic'

import { t } from '~/i18n'
import { getClipboardFilePath, getUploaderType, showNotification } from '~/utils/common'
import { configPaths } from '~/utils/configPaths'
import { ICOREBuildInEvent } from '~/utils/enum'
import { CLIPBOARD_IMAGE_FOLDER } from '~/utils/static'
import { currentUploadJob, UploadJob, UploadJobError, withUploadJob } from '~/utils/uploadJob'
import { isUploadUrl } from '~/utils/uploadResult'

import { waitForRename } from './rename'

class Uploader {
  constructor() {
    this.init()
  }

  init() {
    picgo.on(ICOREBuildInEvent.NOTIFICATION, (message: any) => {
      new Notification(message).show()
    })

    picgo.on(ICOREBuildInEvent.UPLOAD_PROGRESS, (progress: any) => {
      currentUploadJob()?.reportProgress(progress)
    })

    picgo.on(ICOREBuildInEvent.BEFORE_TRANSFORM, () => {
      if (picgo.getConfig<boolean | undefined>(configPaths.settings.uploadNotification)) {
        const notification = new Notification({
          title: t('main.notification.uploadProgress'),
          body: t('main.notification.uploading'),
        })
        notification.show()
      }
    })

    picgo.helper.beforeUploadPlugins.register('renameFn', {
      handle: async (ctx: IPicGo) => {
        const job = currentUploadJob()
        if (!job) return
        job.throwIfStopped()
        const uploaderType = getUploaderType(ctx)
        const allConfig = ctx.getConfig<any>() || {}

        const globalRename = allConfig.settings?.rename
        const globalAutoRename = allConfig.settings?.autoRename
        const buildInList = allConfig.buildIn?.list || []
        const idSpecificRename = buildInList.find((item: any) => item.id === uploaderType.id)?.manualRename
        const idSpecificAutoRename = buildInList.find((item: any) => item.id === uploaderType.id)?.autoRename
        const rename = idSpecificRename !== undefined ? !!idSpecificRename : !!globalRename
        const autoRename = idSpecificAutoRename !== undefined ? !!idSpecificAutoRename : !!globalAutoRename
        if (autoRename || rename) {
          await Promise.all(
            ctx.output.map(async (item, index) => {
              let name: undefined | string | null
              const fileName = autoRename
                ? `${dayjs().add(index, 'ms').format('YYYYMMDDHHmmssSSS')}${item.extname}`
                : item.fileName || `image${item.extname || ''}`
              if (rename) {
                name = await waitForRename(job, fileName, item.fileName || fileName)
              }
              job.throwIfStopped()
              item.fileName = name || fileName
            }),
          )
        }
      },
    })
  }

  private async getClipboardImagePath(job: UploadJob): Promise<string | false> {
    const imgPath = getClipboardFilePath()
    if (imgPath) return imgPath

    const nativeImage = clipboard.readImage()
    if (nativeImage.isEmpty()) return false

    const buffer = nativeImage.toPNG()
    const baseDir = picgo.baseDir
    const fileName = `${job.context.id}.png`
    const filePath = path.join(baseDir, CLIPBOARD_IMAGE_FOLDER, fileName)
    await writeFile(filePath, buffer)
    return filePath
  }

  async uploadWithBuildInClipboardReturnCtx(
    img?: IUploadOption,
    options?: IUploadOptions,
    job = new UploadJob({ profile: options }),
  ): Promise<IuploadReturnCtxResult> {
    return withUploadJob(
      job,
      async () => {
        let imgPath: string | false = false
        try {
          imgPath = await this.getClipboardImagePath(job)
          job.throwIfStopped()
          if (!imgPath) throw new UploadJobError('failed')
          // Keep the temporary file until the underlying core work really finishes.
          return await this.performUpload(img ?? [imgPath], job)
        } finally {
          if (imgPath === path.join(picgo.baseDir, CLIPBOARD_IMAGE_FOLDER, `${job.context.id}.png`)) {
            await fs.remove(imgPath).catch(() => logger.warn('Unable to remove temporary clipboard image'))
          }
        }
      },
      () => ({ ctx: undefined, backupCtx: undefined }),
    )
  }

  async uploadReturnCtx(
    img?: IUploadOption,
    options?: IUploadOptions,
    job = new UploadJob({ profile: options }),
  ): Promise<IuploadReturnCtxResult> {
    return withUploadJob(
      job,
      () => this.performUpload(img, job),
      () => ({ ctx: undefined, backupCtx: undefined }),
    )
  }

  private async performUpload(img: IUploadOption | undefined, job: UploadJob): Promise<IuploadReturnCtxResult> {
    try {
      job.throwIfStopped()
      const result = { ctx: undefined, backupCtx: undefined } as IuploadReturnCtxResult
      const res = await picgo.uploadReturnCtx(img, job.context.requestedProfile)
      job.throwIfStopped()
      for (const key of ['ctx', 'backupCtx'] as const) {
        const ctx = res[key]
        if (Array.isArray(ctx?.output)) {
          ctx.output = ctx.output.filter(item => isUploadUrl(item?.imgUrl))
          if (ctx.output.length === 0) continue
          const picBeds = ctx.getConfig<IStringKeyMap>('picBed') || {}
          ctx.output.forEach((item: ImgInfo) => {
            item.config = cloneDeep(picBeds[item.type!] || {})
          })
          result[key] = ctx
        }
      }
      if (!result.ctx && !result.backupCtx) throw new UploadJobError('failed')
      return result
    } catch (e: any) {
      if (job.signal.aborted) throw e
      logger.error('Upload failed')
      setTimeout(() => {
        showNotification({
          title: t('main.notification.uploadFailed'),
          body: util.format(e.stack),
          clickToCopy: true,
        })
      }, 500)
      throw e
    }
  }
}

export default new Uploader()
