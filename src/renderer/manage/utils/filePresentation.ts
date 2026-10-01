import { availableIconList } from '@/manage/utils/icon'
import { isNeedToShorten, safeSliceF } from '#/utils/strings'

export function getFileIconPath(fileName: string) {
  const ext = window.node.path.extname(fileName).slice(1).toLowerCase()
  return availableIconList.includes(ext) ? `${ext}.webp` : 'unknown.webp'
}

const units = ['B', 'KB', 'MB', 'GB', 'TB', 'PB']

export function formatFileSize(size: number) {
  if (size === 0) return ''
  const index = Math.floor(Math.log2(size) / 10)
  return `${(size / Math.pow(2, index * 10)).toFixed(2)} ${units[index]}`
}

export function formatFileName(fileName: string, length: number = 20) {
  let ext = window.node.path.extname(fileName)
  ext = ext.length > 5 ? ext.slice(ext.length - 5) : ext
  const name = window.node.path.basename(fileName, ext)
  return isNeedToShorten(fileName, length) ? `${safeSliceF(name, length - 3 - ext.length)}...${ext}` : fileName
}

export function formObjToTableData(obj: any) {
  const exclude = [undefined, null, '', 'transformedConfig']
  return Object.keys(obj)
    .filter(key => !exclude.includes(obj[key]))
    .map(key => ({
      key,
      value: typeof obj[key] === 'object' ? JSON.stringify(obj[key]) : obj[key],
    }))
    .sort((a, b) => a.key.localeCompare(b.key))
}
