import crypto from 'node:crypto'
import path from 'node:path'
import { pathToFileURL } from 'node:url'

import fs from 'fs-extra'
import mime from 'mime'
import yaml from 'yaml'

export const nodeBridge = {
  pathToFileURL: (filePath: string) => pathToFileURL(filePath).href,
  path: {
    join: path.join,
    dirname: path.dirname,
    basename: path.basename,
    normalize: path.normalize,
    extname: path.extname,
    sep: path.sep,
    posix: {
      sep: path.posix.sep,
    },
  },
  fs: {
    remove: fs.remove,
    readFile: fs.readFile,
    readFileSync: fs.readFileSync,
    statSync: fs.statSync,
  },
  crypto: {
    randomBytes: crypto.randomBytes,
    createHash: (algorithm: string, text: string | Buffer) => crypto.createHash(algorithm).update(text).digest('hex'),
  },
  yaml: {
    parse: yaml.parseDocument,
  },
  mime: {
    lookup: mime.getType.bind(mime),
  },
}
