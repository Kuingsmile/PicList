import { describe, expect, it } from 'vitest'

import { appendThumbnailSuffix } from '../src/renderer/manage/utils/thumbnailUrl'

describe('appendThumbnailSuffix', () => {
  it('keeps the original URL when the suffix is empty', () => {
    const url = 'https://example.com/image.png'

    expect(appendThumbnailSuffix(url, '')).toBe(url)
    expect(appendThumbnailSuffix(url)).toBe(url)
  })

  it('appends query-style suffixes to URLs without query strings', () => {
    expect(appendThumbnailSuffix('https://example.com/image.png', '?imageMogr2/thumbnail/200x200')).toBe(
      'https://example.com/image.png?imageMogr2/thumbnail/200x200',
    )
  })

  it('converts query-style suffixes to additional parameters when the URL already has a query string', () => {
    expect(appendThumbnailSuffix('https://example.com/image.png?version=1', '?imageMogr2/thumbnail/200x200')).toBe(
      'https://example.com/image.png?version=1&imageMogr2/thumbnail/200x200',
    )
  })

  it('normalizes ampersand-prefixed suffixes when the URL has no query string', () => {
    expect(appendThumbnailSuffix('https://example.com/image.png', '&x-oss-process=image/resize,w_200')).toBe(
      'https://example.com/image.png?x-oss-process=image/resize,w_200',
    )
  })

  it('appends path-style suffixes unchanged', () => {
    expect(appendThumbnailSuffix('https://example.com/image.png', '/thumbnail/200x200')).toBe(
      'https://example.com/image.png/thumbnail/200x200',
    )
  })
})
