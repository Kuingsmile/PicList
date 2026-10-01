import { getConfig } from '@/manage/services/configService'
import { handleUrlEncode } from '#/utils/url'

export function formatStorageLink(
  format: string | undefined,
  url: string,
  fileName: string,
  filePath: string = fileName,
  encodePath = false,
): string {
  if (!format || !/\$(url|fileName|filePath|dir)\b/.test(format)) return url
  const directory = filePath.slice(0, filePath.lastIndexOf('/') + 1)
  const encode = (value: string) => (encodePath ? value.split('/').map(encodeURIComponent).join('/') : value)
  const values: Record<string, string> = {
    url,
    fileName,
    filePath: encode(filePath),
    dir: encode(directory),
  }
  return format.replace(/\$(url|fileName|filePath|dir)\b/g, (_, key: string) => values[key])
}

export async function formatLink(
  url: string,
  fileName: string,
  type: string,
  format?: string,
  filePath?: string,
): Promise<string> {
  const encode = !!(await getConfig('settings.isEncodeUrl'))
  const encodedUrl = encode ? handleUrlEncode(url) : url
  switch (type) {
    case 'markdown':
      return `![${fileName}](${encodedUrl})`
    case 'html':
      return `<img src="${encodedUrl}" alt="${fileName}"/>`
    case 'bbcode':
      return `[img]${encodedUrl}[/img]`
    case 'url':
      return encodedUrl
    case 'markdown-with-link':
      return `[![${fileName}](${encodedUrl})](${encodedUrl})`
    case 'custom':
      return formatStorageLink(format, encodedUrl, fileName, filePath, encode)
    default:
      return encodedUrl
  }
}
