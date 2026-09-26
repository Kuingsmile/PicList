import picgo from '@core/picgo'
import uploader from 'apis/app/uploader'
import windowManager from 'apis/app/window/windowManager'
import type { WebContents } from 'electron'
import type { IUploadOptions } from 'piclist'

import { configPaths } from '~/utils/configPaths'
import {
  createUploadFinalization,
  finalizeUpload,
  interactiveUploadPreferences,
  type UploadFinalizationPreferences,
} from '~/utils/uploadFinalizer'
import { UploadJob, withUploadJob } from '~/utils/uploadJob'

interface ClipboardUploadPreferences extends UploadFinalizationPreferences {
  useBuiltinClipboard?: boolean
}

export const uploadClipboardFiles = async (
  options?: IUploadOptions,
  job = new UploadJob({ profile: options, origin: windowManager.getAvailableWindow()?.webContents }),
  preferences: ClipboardUploadPreferences = { copy: true, notification: 'individual', clearClipboard: true },
): Promise<IStringKeyMap> =>
  withUploadJob(
    job,
    async () => {
      const useBuiltinClipboard =
        preferences.useBuiltinClipboard ??
        picgo.getConfig<boolean | undefined>(configPaths.settings.useBuiltinClipboard) ??
        true
      const res = useBuiltinClipboard
        ? await uploader.uploadWithBuildInClipboardReturnCtx(undefined, options, job)
        : await uploader.uploadReturnCtx(undefined, options, job)
      job.throwIfStopped()
      const state = createUploadFinalization(res, [], preferences, job.context.id)
      const results = await finalizeUpload(state, {
        contexts: res,
        origin: job.context.origin,
        assertActive: () => job.throwIfStopped(),
      })
      return results[0]
    },
    () => ({ url: '', fullResult: {} }),
  )

export const uploadChoosedFiles = async (
  webContents: WebContents | undefined,
  files: IFileWithPath[],
  options?: IUploadOptions,
  job = new UploadJob({ origin: webContents, profile: options }),
  preferences: UploadFinalizationPreferences = interactiveUploadPreferences,
): Promise<IStringKeyMap[]> =>
  withUploadJob(
    job,
    async () => {
      const input = files.map(item => item.path)
      const rawInput = [...input]
      const res = await uploader.uploadReturnCtx(input, options, job)
      job.throwIfStopped()
      const state = createUploadFinalization(res, rawInput, preferences, job.context.id)
      return finalizeUpload(state, {
        contexts: res,
        origin: job.context.origin,
        assertActive: () => job.throwIfStopped(),
      })
    },
    () => [],
  )
