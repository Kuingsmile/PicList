import db from '@core/datastore'

import { generateShortUrl, handleUrlEncodeWithSetting } from '~/utils/common'

import { IPasteStyle } from '#/types/enum'
import { configPaths } from '#/utils/configPaths'

export const formatCustomLink = (customLink: string, item: ImgInfo) => {
  const fileName = item.fileName!.replace(new RegExp(`\\${item.extname}$`), '')
  const url = item.url || item.imgUrl
  const extName = item.extname
  const formatObj = {
    url,
    fileName,
    extName
  }
  const keys = Object.keys(formatObj) as ['url', 'fileName', 'extName']
  keys.forEach(item => {
    if (customLink.indexOf(`$${item}`) !== -1) {
      const reg = new RegExp(`\\$${item}`, 'g')
      customLink = customLink.replace(reg, formatObj[item])
    }
  })
  return customLink
}

export default async (style: IPasteStyle, item: ImgInfo, customLink: string | undefined) => {
  let url = item.url || item.imgUrl
  if (item.type === 'aws-s3' || item.type === 'aws-s3-plist') {
    url = item.imgUrl || item.url || ''
  }
  url = handleUrlEncodeWithSetting(url)
  const useShortUrl = db.get(configPaths.settings.useShortUrl) || false
  if (useShortUrl) {
    url = item.shortUrl && item.shortUrl !== url ? item.shortUrl : await generateShortUrl(url)
  }
  const _customLink = customLink || '![$fileName]($url)'
  const tpl = {
    markdown: `![](${url})`,
    HTML: `<img src="${url}"/>`,
    URL: url,
    UBB: `[IMG]${url}[/IMG]`,
    Custom: formatCustomLink(_customLink, {
      ...item,
      url
    })
  }
  return [tpl[style], useShortUrl ? url : '']
}
