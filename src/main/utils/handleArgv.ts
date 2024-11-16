import fs from 'fs-extra'
import path from 'path'
import { Logger } from 'piclist'

import { isUrl } from '#/utils/common'

interface IResultFileObject {
  path: string
}
type Result = IResultFileObject[]

const getUploadFiles = (argv = process.argv, cwd = process.cwd(), logger: Logger) => {
  const uploadIndex = argv.indexOf('upload')
  if (uploadIndex === -1) return []
  const fileList = argv.slice(uploadIndex + 1)

  if (fileList.length === 0) return null // for uploading images in clipboard

  return fileList
    .map(item => {
      if (isUrl(item) || path.isAbsolute(item)) return { path: item }

      const resolvedPath = path.join(cwd, item)
      if (fs.existsSync(resolvedPath)) {
        return { path: resolvedPath }
      }
      logger.warn(`cli -> can't get file: ${resolvedPath}, invalid path`)
      return null
    })
    .filter(item => item !== null) as Result
}

export { getUploadFiles }
