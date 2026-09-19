import { describe, expect, it } from 'vitest'

import { getSupportedPicBedList } from '../src/renderer/manage/utils/constants'
import { formatStorageLink } from '../src/renderer/manage/utils/linkFormat'

describe('cloud manager custom links', () => {
  it('exposes an independently saved template in every storage configuration', () => {
    const schemas = getSupportedPicBedList(key => key)
    for (const schema of Object.values(schemas)) {
      expect(schema.options).toContain('customPasteFormat')
      expect(schema.configOptions.customPasteFormat.default).toBe('')
    }
  })

  it('keeps the complete object path when copying from a nested folder', () => {
    expect(
      formatStorageLink(
        'https://cdn.example.invalid/$filePath',
        'https://s3.example.invalid/a/b/photo.png',
        'photo.png',
        'a/b/photo.png',
      ),
    ).toBe('https://cdn.example.invalid/a/b/photo.png')
    expect(formatStorageLink('$dir$fileName', 'url', 'photo.png', 'a/b/photo.png')).toBe('a/b/photo.png')
  })

  it('supports files at the bucket root and optional path encoding', () => {
    expect(formatStorageLink('$dir$fileName', 'url', 'photo.png')).toBe('photo.png')
    expect(formatStorageLink('$filePath', 'url', 'photo #1.png', 'my photos/photo #1.png', true)).toBe(
      'my%20photos/photo%20%231.png',
    )
  })

  it('replaces only known placeholders and never expands dollar signs in object keys', () => {
    expect(formatStorageLink('$filePath $unknown $url', 'https://example.invalid/$fileName', 'x', 'a/$&.png')).toBe(
      'a/$&.png $unknown https://example.invalid/$fileName',
    )
  })

  it('preserves legacy url and filename templates and empty-template fallback', () => {
    expect(formatStorageLink('![$fileName]($url)', 'https://example.invalid/x.png', 'x.png')).toBe(
      '![x.png](https://example.invalid/x.png)',
    )
    expect(formatStorageLink(undefined, 'https://example.invalid/x.png', 'x.png')).toBe('https://example.invalid/x.png')
  })
})
