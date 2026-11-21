import { readdir, realpath, stat } from 'node:fs/promises'
import http from 'node:http'
import path from 'node:path'

import { escape } from 'lodash-es'

import { streamPreviewFile } from './streamFile'

class FileRequestError extends Error {
  constructor(readonly statusCode: 400 | 403 | 404) {
    super(http.STATUS_CODES[statusCode])
  }
}

function assertWithinRoot(root: string, filePath: string): void {
  const relativePath = path.relative(root, filePath)
  if (relativePath === '..' || relativePath.startsWith(`..${path.sep}`) || path.isAbsolute(relativePath)) {
    throw new FileRequestError(403)
  }
}

async function resolveFilePath(root: string, requestUrl: string | undefined): Promise<string> {
  let pathname: string
  try {
    pathname = decodeURIComponent(requestUrl?.split('?')[0] || '')
  } catch {
    throw new FileRequestError(400)
  }
  if (!pathname.startsWith('/') || pathname.includes('\0')) throw new FileRequestError(400)

  const relativeName = pathname.slice(1)
  if (
    pathname.includes('\\') ||
    path.win32.parse(relativeName).root ||
    (process.platform === 'win32' && relativeName.includes(':'))
  ) {
    throw new FileRequestError(403)
  }

  const filePath = path.resolve(root, relativeName)
  assertWithinRoot(root, filePath)
  const canonicalPath = await realpath(filePath)
  // The root was canonicalized when the listener started. Also check symlink and junction targets.
  assertWithinRoot(root, canonicalPath)
  return canonicalPath
}

async function directoryListing(root: string, directory: string) {
  const relative = path.relative(root, directory).split(path.sep).filter(Boolean)
  const url = '/' + relative.map(encodeURIComponent).join('/')
  const title = escape('/' + relative.join('/'))
  const entries = await readdir(directory, { withFileTypes: true })
  const links = entries
    .filter(entry => entry.isFile() || entry.isDirectory())
    .sort((a, b) => Number(b.isDirectory()) - Number(a.isDirectory()) || a.name.localeCompare(b.name))
    .map(entry => {
      const suffix = entry.isDirectory() ? '/' : ''
      const href = path.posix.join(url, encodeURIComponent(entry.name)) + suffix
      return `<li><a href="${href}">${escape(entry.name)}${suffix}</a></li>`
    })
  if (relative.length) links.unshift(`<li><a href="${path.posix.dirname(url)}">../</a></li>`)
  return `<!doctype html><meta charset="utf-8"><title>${title}</title><h1>${title}</h1><ul>${links.join('')}</ul>`
}

/** Accept a canonical directory so replacing a root symlink cannot expand the published tree. */
export function createFileHandler(root: string, browseDirectories = false): http.RequestListener {
  return async (req, res) => {
    try {
      if (req.method !== 'GET' && req.method !== 'HEAD') {
        res.writeHead(405, { Allow: 'GET, HEAD' }).end()
        return
      }
      const filePath = await resolveFilePath(root, req.url)
      if (browseDirectories) {
        res.setHeader('X-Content-Type-Options', 'nosniff')
        res.setHeader(
          'Content-Security-Policy',
          "sandbox; default-src 'none'; img-src 'self' data:; style-src 'unsafe-inline'",
        )
        if ((await stat(filePath)).isDirectory()) {
          const listing = await directoryListing(root, filePath)
          res.writeHead(200, {
            'Content-Type': 'text/html; charset=utf-8',
            'Content-Length': Buffer.byteLength(listing),
          })
          res.end(req.method === 'HEAD' ? undefined : listing)
          return
        }
      }
      await streamPreviewFile(filePath, res, req.method === 'HEAD')
    } catch (error) {
      if (res.destroyed) return
      if (res.headersSent) {
        res.destroy()
        return
      }
      res.removeHeader('Content-Length')
      const statusCode = error instanceof FileRequestError ? error.statusCode : 404
      res.writeHead(statusCode)
      res.end(`${statusCode} ${http.STATUS_CODES[statusCode]}`)
    }
  }
}
