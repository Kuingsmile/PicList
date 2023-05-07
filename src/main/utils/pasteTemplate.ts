import { IPasteStyle } from '#/types/enum'
import { generateShortUrl } from '#/utils/common'
import db from '~/main/apis/core/datastore'
import { handleUrlEncodeWithSetting } from './common'

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
  url = handleUrlEncodeWithSetting(item.url || item.imgUrl)
  const useShortUrl = db.get('settings.useShortUrl') || false
  if (useShortUrl) {
    url = await generateShortUrl(url)
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
  return tpl[style]
}
