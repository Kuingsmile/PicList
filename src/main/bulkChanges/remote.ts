import { constants } from 'node:fs'
import fs from 'node:fs/promises'
import path from 'node:path'

import { CopyObjectCommand, DeleteObjectCommand, HeadObjectCommand } from '@aws-sdk/client-s3'
import qiniu from 'qiniu'

import SSHClient from '~/utils/sshClient'

import type { BulkCandidate, BulkContext } from '../../universal/bulkChanges'
import type { BulkAdapter, BulkObject } from './session'

const filesystemProviders = new Set(['local', 'sftp', 'webdavplist', 'upyun'])

export function remoteKey(provider: string, key: string, windows = process.platform === 'win32'): string {
  if (provider === 'local' && windows) {
    return path.win32.normalize(key.replace(/^\/+([a-zA-Z]:)/, '$1')).toLowerCase()
  }
  if (filesystemProviders.has(provider)) return path.posix.resolve('/', key)
  // Object keys are opaque: do not lowercase, decode percent escapes, or collapse slashes.
  return key
}

export function validRemoteTarget(item: BulkCandidate, windows = process.platform === 'win32'): boolean {
  const { target, context } = item
  if (!target || target.endsWith('/') || /[\u0000-\u001f\u007f]/u.test(target)) return false
  if (context.provider === 'aliyun' && (/^[\\/]/.test(target) || Buffer.byteLength(target) > 1023)) return false
  if (context.provider === 's3plist' && Buffer.byteLength(target) > 1024) return false
  if (context.provider === 'tcyun' && Buffer.byteLength(target) > 850) return false
  if (context.provider === 'qiniu' && Buffer.byteLength(target) > 750) return false
  if (filesystemProviders.has(context.provider)) {
    const isWindows = context.provider === 'local' && windows
    const parts = target.split(isWindows ? /[\\/]/ : /\//)
    if (parts.some(part => part === '.' || part === '..' || (isWindows ? part.length : Buffer.byteLength(part)) > 255))
      return false
    if (isWindows) {
      if (target.endsWith('\\')) return false
      return parts.every(
        (part, index) =>
          !part ||
          (/^[a-zA-Z]:$/.test(part) && (index === 0 || (index === 1 && parts[0] === ''))) ||
          (!/[<>:"|?*]/.test(part) &&
            !/[. ]$/.test(part) &&
            !/^(con|prn|aux|nul|com[1-9]|lpt[1-9])(?:\.|$)/i.test(part)),
      )
    }
  }
  return true
}

function status(error: any): number | undefined {
  return error?.$metadata?.httpStatusCode ?? error?.statusCode ?? error?.status ?? error?.response?.status
}

async function existing(read: () => Promise<BulkObject>, provider: string): Promise<BulkObject | undefined> {
  try {
    return await read()
  } catch (error: any) {
    if (
      (provider === 'local' && error?.code === 'ENOENT') ||
      (provider === 'sftp' && error?.code === 2) ||
      (provider === 'qiniu' && status(error) === 612) ||
      (!['local', 'sftp', 'qiniu'].includes(provider) && status(error) === 404)
    )
      return undefined
    throw error
  }
}

function checked(response: any): void {
  const code =
    response?.$metadata?.httpStatusCode ?? response?.statusCode ?? response?.res?.status ?? response?.res?.statusCode
  if (typeof code !== 'number' || code < 200 || code >= 300) throw new Error('Provider did not confirm the operation')
}

const version = (...parts: unknown[]) => JSON.stringify(parts)
const encodeKey = (key: string) => key.split('/').map(encodeURIComponent).join('/')

/** The client is constructed once from the account configuration at preview time. */
export async function createRemoteAdapter(context: BulkContext, client: any): Promise<BulkAdapter> {
  const { provider, bucketName, region } = context
  let read: (key: string) => Promise<BulkObject | undefined>
  let write: BulkAdapter['write']
  let removeSource: BulkAdapter['removeSource']
  if (provider === 's3plist') {
    await client.getDogeCloudToken()
    const sdk = client.createS3Client({ ...client.baseOptions, region: region || client.baseOptions.region })
    read = key =>
      existing(async () => {
        const result = await sdk.send(new HeadObjectCommand({ Bucket: bucketName, Key: key }))
        checked(result)
        return { version: version(result.VersionId, result.ETag, result.ContentLength, result.LastModified) }
      }, provider)
    write = async (item, overwrite) => {
      checked(
        await sdk.send(
          new CopyObjectCommand({
            Bucket: bucketName,
            Key: item.target,
            CopySource: `${encodeURIComponent(bucketName)}/${encodeKey(item.source)}`,
            // Fail closed on S3-compatible endpoints that reject conditional copies.
            ...(!overwrite ? { IfNoneMatch: '*' } : {}),
          }),
        ),
      )
    }
    removeSource = async item => {
      checked(await sdk.send(new DeleteObjectCommand({ Bucket: bucketName, Key: item.source })))
    }
  } else if (provider === 'aliyun') {
    const sdk = client.getNewCtx(region, bucketName)
    read = key =>
      existing(async () => {
        const result = await sdk.head(key)
        checked(result)
        const headers = result.res.headers
        return {
          version: version(
            headers.etag,
            headers['content-length'],
            headers['last-modified'],
            headers['x-oss-version-id'],
          ),
        }
      }, provider)
    write = async (item, overwrite) => {
      checked(await sdk.copy(item.target, item.source, { headers: { 'x-oss-forbid-overwrite': String(!overwrite) } }))
    }
    removeSource = async item => {
      checked(await sdk.delete(item.source))
    }
  } else if (provider === 'tcyun') {
    const base = { Bucket: bucketName, Region: region }
    read = key =>
      existing(async () => {
        const result = await client.ctx.headObject({ ...base, Key: key })
        checked(result)
        return {
          version: version(
            result.ETag,
            result.headers['content-length'],
            result.headers['last-modified'],
            result.headers['x-cos-version-id'],
          ),
        }
      }, provider)
    write = async (item, overwrite) => {
      checked(
        await client.ctx.putObjectCopy({
          ...base,
          Key: item.target,
          CopySource: `${bucketName}.cos.${region}.myqcloud.com/${encodeKey(item.source)}`,
          Headers: { 'x-cos-forbid-overwrite': String(!overwrite) },
        }),
      )
    }
    removeSource = async item => {
      checked(await client.ctx.deleteObject({ ...base, Key: item.source }))
    }
  } else if (provider === 'qiniu') {
    const sdk = new qiniu.rs.BucketManager(client.mac, new qiniu.conf.Config())
    const request = (operation: (callback: (error: any, body: any, info: any) => void) => void) =>
      new Promise<any>((resolve, reject) => {
        operation((error, body, info) => {
          if (error || info?.statusCode !== 200) reject({ statusCode: info?.statusCode ?? error?.statusCode })
          else resolve(body)
        })
      })
    read = key =>
      existing(async () => {
        const result = await request(callback => sdk.stat(bucketName, key, callback))
        return { version: version(result.hash, result.fsize, result.putTime) }
      }, provider)
    write = async (item, overwrite) => {
      await request(callback =>
        sdk.move(bucketName, item.source, bucketName, item.target, { force: overwrite }, callback),
      )
    }
  } else if (provider === 'webdavplist') {
    read = key =>
      existing(async () => {
        const result = await client.ctx.stat(key)
        return {
          version: version(result.etag, result.size, result.lastmod),
          identity: result.filename ? JSON.stringify([context, result.filename]) : undefined,
          isDirectory: result.type !== 'file',
        }
      }, provider)
    write = async (item, overwrite) => {
      await client.ctx.moveFile(item.source, item.target, { overwrite })
    }
  } else if (provider === 'upyun') {
    read = key =>
      existing(async () => {
        const result = await client.cli.headFile(`/${key.replace(/^\/+/, '')}`)
        if (result === false) throw Object.assign(new Error('Object is absent'), { statusCode: 404 })
        if (!result || !result.type) throw new Error('Invalid metadata response')
        return {
          version: version(result['Content-Md5'], result.size, result.date),
          isDirectory: result.type !== 'file',
        }
      }, provider)
    write = async item => {
      // The SDK's move() builds its source header with node:path.join, which uses backslashes on Windows.
      if (!(await client.renameBucketFile({ oldKey: item.source, newKey: item.target }))) {
        throw new Error('Provider did not confirm the move')
      }
    }
  } else if (provider === 'local') {
    read = key =>
      existing(async () => {
        const result = await fs.lstat(client.transBack(key))
        return {
          version: version(result.dev, result.ino, result.size, result.mtimeMs),
          identity: version(result.dev, result.ino),
          isDirectory: !result.isFile(),
        }
      }, provider)
    write = async (item, overwrite) => {
      await fs.copyFile(
        client.transBack(item.source),
        client.transBack(item.target),
        overwrite ? 0 : constants.COPYFILE_EXCL,
      )
    }
    removeSource = async item => {
      await fs.unlink(client.transBack(item.source))
    }
  } else if (provider === 'sftp') {
    const withConnection = async <T>(action: (ssh: SSHClient) => Promise<T>): Promise<T> => {
      const ssh = new SSHClient()
      try {
        await ssh.connect(client.config)
        return await action(ssh)
      } finally {
        ssh.close()
      }
    }
    read = key =>
      existing(
        () =>
          withConnection(async ssh => {
            const result = await ssh.lstat(`/${key.replace(/^\/+/, '')}`)
            return { version: version(result.size, result.mtime, result.mode), isDirectory: !result.isFile() }
          }),
        provider,
      )
    write = async (item, overwrite) => {
      await withConnection(ssh =>
        ssh.renameFile(`/${item.source.replace(/^\/+/, '')}`, `/${item.target.replace(/^\/+/, '')}`, overwrite),
      )
    }
  } else {
    throw new Error('Unsupported rename provider')
  }
  return {
    kind: 'remote-rename',
    identity: (item, key) => JSON.stringify([item.context, remoteKey(provider, key)]),
    validate: validRemoteTarget,
    source: item => read(item.source),
    target: item => read(item.target),
    write,
    removeSource,
  }
}
