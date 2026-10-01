import path from 'node:path'

import fs from 'fs-extra'

const getExtension = (fileName: string) => path.extname(fileName).slice(1)

export const isImage = (fileName: string) =>
  ['jpg', 'jpeg', 'png', 'gif', 'webp', 'bmp', 'ico', 'svg', 'avif'].includes(
    getExtension(fileName).toLocaleLowerCase(),
  )

export async function getDirectoryTree(currentPath: string): Promise<Record<string, any>> {
  const result: Record<string, any> = {}

  const entries = await fs.readdir(currentPath, { withFileTypes: true })

  await Promise.all(
    entries.map(async entry => {
      const fullPath = path.join(currentPath, entry.name)

      if (entry.isDirectory()) {
        result[entry.name] = await getDirectoryTree(fullPath)
      } else if (entry.isFile()) {
        result[entry.name] = null
      }
    }),
  )

  return result
}
