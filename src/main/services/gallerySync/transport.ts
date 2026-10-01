import path from 'node:path'

import { Octokit } from '@octokit/rest'
import axios from 'axios'
import { HttpsProxyAgent } from 'hpagent'
import { AuthType, createClient, type ResponseDataDetailed } from 'webdav'

import { digest, GallerySyncError } from './model'

export const BUNDLE_NAME = 'piclist-gallery-sync-v1.db'
export interface RemoteFile {
  content: Buffer
  version: string
}
export interface GalleryTransport {
  read(name: string): Promise<RemoteFile | null>
  // expected=null means create only. Existing resources must use compare-and-swap.
  commit(content: Buffer, expected: string | null): Promise<boolean>
}

const ok = (status: number) => status >= 200 && status < 300
const failure = () => new GallerySyncError('Gallery transport failed. Check the connection and preview again.')
const missing = (error: any) => Number(error?.status ?? error?.response?.status) === 404

export function createGalleryTransport(config: ISyncConfig): GalleryTransport {
  const { type, username, repo, branch, token } = config
  const proxy = config.proxy ? new HttpsProxyAgent({ proxy: config.proxy, keepAlive: true }) : undefined
  const octokit = type === 'github' ? new Octokit({ auth: token, request: { agent: proxy } }) : undefined
  const webdav =
    type === 'webdav'
      ? createClient(
          /^https?:\/\//i.test(config.webdavEndpoint || '')
            ? config.webdavEndpoint!
            : `${config.webdavSslEnabled === false ? 'http' : 'https'}://${config.webdavEndpoint}`,
          {
            username: config.webdavUsername,
            password: config.webdavPassword,
            ...(config.webdavAuthType === 'digest' ? { authType: AuthType.Digest } : {}),
          },
        )
      : undefined
  const remotePath = (name: string) =>
    [config.webdavSavePath, name].filter(Boolean).join('/').replace(/\\/g, '/').replace(/\/+/g, '/')
  const apiPath = (name: string) =>
    `${type === 'gitee' ? 'https://gitee.com' : (config.endpoint || '').replace(/\/$/, '')}/api/${type === 'gitee' ? 'v5' : 'v1'}/repos/${encodeURIComponent(username)}/${encodeURIComponent(repo)}/contents/${name}`
  const request = { httpsAgent: proxy, headers: type === 'gitee' ? {} : { Authorization: `token ${token}` } }

  return {
    async read(name) {
      try {
        if (webdav) {
          const result = (await webdav.getFileContents(remotePath(name), {
            format: 'binary',
            details: true,
          })) as ResponseDataDetailed<Buffer>
          if (!ok(result.status) || !Buffer.isBuffer(result.data)) throw failure()
          const etag = result.headers.etag
          if (name === BUNDLE_NAME && (typeof etag !== 'string' || !etag || etag.startsWith('W/'))) {
            throw new GallerySyncError('This WebDAV server must provide strong ETags for safe gallery sync.')
          }
          return { content: result.data, version: typeof etag === 'string' ? etag : digest(result.data) }
        }
        if (octokit) {
          const result = await octokit.rest.repos.getContent({ owner: username, repo, path: name, ref: branch })
          if (result.status !== 200 || Array.isArray(result.data) || result.data.type !== 'file') throw failure()
          const { sha, content, encoding } = result.data
          if (!sha) throw failure()
          if (encoding === 'base64' && content) return { content: Buffer.from(content, 'base64'), version: sha }
          const blob = await octokit.rest.git.getBlob({ owner: username, repo, file_sha: sha })
          if (blob.status !== 200 || blob.data.encoding !== 'base64' || !blob.data.content) throw failure()
          return { content: Buffer.from(blob.data.content, 'base64'), version: sha }
        }
        if (type !== 'gitee' && type !== 'gitea') throw failure()
        const result = await axios.get(apiPath(name), {
          ...request,
          params: { ref: branch, ...(type === 'gitee' ? { access_token: token } : {}) },
        })
        if (
          !ok(result.status) ||
          typeof result.data.sha !== 'string' ||
          !result.data.sha ||
          typeof result.data.content !== 'string' ||
          result.data.encoding !== 'base64'
        )
          throw failure()
        return { content: Buffer.from(result.data.content, 'base64'), version: result.data.sha }
      } catch (error) {
        if (missing(error)) return null
        if (error instanceof GallerySyncError) throw error
        // Transport errors can contain credentials, signed URLs and response bodies.
        throw failure()
      }
    },
    async commit(content, expected) {
      try {
        if (webdav) {
          const name = remotePath(BUNDLE_NAME)
          const directory = path.posix.dirname(name)
          if (directory !== '.') await webdav.createDirectory(directory, { recursive: true })
          return (
            (await webdav.putFileContents(name, content, {
              overwrite: expected !== null,
              headers: expected === null ? { 'If-None-Match': '*' } : { 'If-Match': expected },
            })) === true
          )
        }
        const body = {
          content: content.toString('base64'),
          message: 'Commit PicList gallery sync',
          branch,
          ...(expected === null ? {} : { sha: expected }),
        }
        if (octokit) {
          const result = await octokit.rest.repos.createOrUpdateFileContents({
            owner: username,
            repo,
            path: BUNDLE_NAME,
            ...body,
          })
          return ok(result.status)
        }
        if (type !== 'gitee' && type !== 'gitea') throw failure()
        const result = await axios.request({
          ...request,
          url: apiPath(BUNDLE_NAME),
          method: expected === null ? 'post' : 'put',
          data: { ...body, ...(type === 'gitee' ? { access_token: token } : {}) },
        })
        return ok(result.status)
      } catch {
        throw failure()
      }
    },
  }
}
