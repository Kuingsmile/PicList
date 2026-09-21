import picgo from '@core/picgo'

import { generateShortUrl, handleUrlEncodeWithSetting } from '~/utils/common'
import { configPaths } from '~/utils/configPaths'

export const formatCustomLink = (customLink: string, item: ImgInfo) => {
  const originalName = item.fileName || ''
  const fileName =
    item.extname && originalName.endsWith(item.extname) ? originalName.slice(0, -item.extname.length) : originalName
  const url = item.url || item.imgUrl
  const extName = item.extname
  const formatObj = {
    url,
    fileName,
    extName,
  }
  const keys = Object.keys(formatObj) as ['url', 'fileName', 'extName']
  keys.forEach(item => {
    if (customLink.indexOf(`$${item}`) !== -1) {
      const reg = new RegExp(`\\$${item}`, 'g')
      customLink = customLink.replace(reg, () => formatObj[item] || '')
    }
  })
  return customLink
}

export default async (style: string, item: ImgInfo, customLink: string | undefined) => {
  let url = item.url || item.imgUrl
  if (item.type === 'aws-s3' || item.type === 'aws-s3-plist') {
    url = item.imgUrl || item.url || ''
  }
  if (typeof url !== 'string' || !url.trim()) throw new Error('Gallery item has no URL to copy')
  url = handleUrlEncodeWithSetting(url)
  const useShortUrl = picgo.getConfig<boolean>(configPaths.settings.useShortUrl) || false
  if (useShortUrl) {
    url = item.shortUrl && item.shortUrl !== url ? item.shortUrl : await generateShortUrl(url)
  }
  const _customLink = customLink || '![$fileName]($url)'
  const tpl: Record<string, string> = {
    markdown: `![](${url})`,
    HTML: `<img src="${url}"/>`,
    URL: url,
    UBB: `[IMG]${url}[/IMG]`,
  }
  const text = style === 'Custom' ? formatCustomLink(_customLink, { ...item, url }) : tpl[style] || url
  return [text, useShortUrl ? url : '']
}
