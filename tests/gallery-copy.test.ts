import { describe, expect, it, vi } from 'vitest'

import pasteTemplate, { formatCustomLink } from '../src/main/utils/pasteTemplate'

vi.mock('@core/picgo', () => ({ default: { getConfig: () => false } }))
vi.mock('~/utils/common', () => ({ handleUrlEncodeWithSetting: (url: string) => url, generateShortUrl: vi.fn() }))
vi.mock('~/utils/configPaths', () => ({ configPaths: { settings: {} } }))

describe('gallery copy formatting', () => {
  it('copies standard links from older records without filename metadata', async () => {
    const item = { imgUrl: 'https://example.invalid/image.png' } as ImgInfo
    await expect(pasteTemplate('markdown', item, undefined)).resolves.toEqual([
      '![](https://example.invalid/image.png)',
      '',
    ])
    await expect(pasteTemplate('URL', item, undefined)).resolves.toEqual([item.imgUrl, ''])
    await expect(pasteTemplate('Custom', item, undefined)).resolves.toEqual([
      '![](https://example.invalid/image.png)',
      '',
    ])
  })

  it('falls back to the URL for an unrecognized saved paste style', async () => {
    const item = { imgUrl: 'https://example.invalid/image.png', fileName: 'image.png' } as ImgInfo
    await expect(pasteTemplate('legacy-style', item, undefined)).resolves.toEqual([item.imgUrl, ''])
  })

  it('rejects a record without a URL instead of producing empty clipboard text', async () => {
    await expect(pasteTemplate('URL', {} as ImgInfo, undefined)).rejects.toThrow('no URL to copy')
  })

  it('preserves dollar signs in URLs and strips only the literal filename extension', () => {
    expect(
      formatCustomLink('$fileName $url $extName', {
        fileName: 'photo.png',
        extname: '.png',
        imgUrl: 'https://example.invalid/$&.png',
      } as ImgInfo),
    ).toBe('photo https://example.invalid/$&.png .png')
  })
})
