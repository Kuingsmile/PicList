import crypto from 'node:crypto'
import os from 'node:os'
import path from 'node:path'
import vm from 'node:vm'

import { scriptsDir } from '@core/datastore/dirs'
import picgo from '@core/picgo'
import logger from '@core/picgo/logger'
import axios from 'axios'
import fs from 'fs-extra'
import { IPicGo } from 'piclist'

export const scriptLifecycleStages = [
  'onSoftwareOpen',
  'onSoftwareClose',
  'preProcess',
  'beforeTransform',
  'transform',
  'beforeUpload',
  'upload',
  'afterUpload',
  'onUploadSuccess',
  'onGalleryRemove',
  'manualTrigger',
  'uploader.advancedplist',
] as const

function format(data: unknown): string {
  if (data instanceof Error) {
    return `${data.name}: ${data.message}\n${data.stack}`
  }
  try {
    return JSON.stringify(data)
  } catch {
    return String(data)
  }
}

export async function runScript(ctx: IPicGo, script: string, extra: Record<string, any>): Promise<any> {
  try {
    const base64Decode = (str: string): string => Buffer.from(str, 'base64').toString('utf-8')
    const base64Encode = (data: Buffer | string): string =>
      (Buffer.isBuffer(data) ? data : Buffer.from(String(data))).toString('base64')
    const exposedAPI = {
      ctx,
      extra,
      console: Object.freeze({
        log: (...args: unknown[]) => ctx.log.info(args.map(format).join(' ')),
        info: (...args: unknown[]) => ctx.log.info(args.map(format).join(' ')),
        error: (...args: unknown[]) => ctx.log.error(args.map(format).join(' ')),
        debug: (...args: unknown[]) => ctx.log.debug(args.map(format).join(' ')),
      }),
      axios,
      crypto,
      setTimeout,
      setInterval,
      clearTimeout,
      clearInterval,
      fs,
      path,
      base64Decode,
      base64Encode,
      os,
      Buffer,
    }
    vm.createContext(exposedAPI)
    ctx.log.info('start to run script')
    vm.runInContext(script, exposedAPI)
    const promise = vm.runInContext(
      `(async () => {
        const result = main(ctx, extra)
        if (result instanceof Promise) return await result
        return result
      })()`,
      exposedAPI,
    )
    const result = await promise
    ctx.log.info('script executed successfully')
    return result
  } catch (e) {
    ctx.log.error(`script execution failed: ${e}`)
    throw e
  }
}

export async function runScriptInStage(stage: string, ctx: IPicGo, extra: Record<string, any>): Promise<void> {
  const baseDir = scriptsDir()
  const enabledPaths: string[] = []
  let scriptDir: string
  const allConfig = picgo.getConfig<any>() || {}
  const disabledList: string[] = allConfig.scripts?.disabledList || []
  if (stage === 'uploader.advancedplist') {
    scriptDir = path.join(baseDir, 'uploader', 'advancedplist')
    stage = 'uploader/advancedplist'
  } else {
    scriptDir = path.join(baseDir, stage)
  }

  const files = await fs.readdir(scriptDir).catch(() => [])
  if (files.length === 0) {
    return
  }
  for (const file of files) {
    if (file.endsWith('.js')) {
      if (!disabledList.includes(`${stage}/${file}`)) {
        enabledPaths.push(path.join(scriptDir, file))
      }
    }
  }
  if (enabledPaths.length === 0) {
    logger.info(`no enabled scripts found in stage ${stage}`)
    return
  }
  for (const scriptPath of enabledPaths) {
    const scriptContent = fs.readFileSync(scriptPath, 'utf-8')
    try {
      await runScript(ctx, scriptContent, extra)
      logger.info(`script ${scriptPath} in stage ${stage} executed successfully`)
    } catch (e) {
      logger.error(`script ${scriptPath} in stage ${stage} execution failed: ${e}`)
    }
  }
}
