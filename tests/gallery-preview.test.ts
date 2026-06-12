import { describe, expect, it } from 'vitest'

import {
  getGalleryPreviewSource,
  getJxlPreviewSource,
  JXL_ERROR_PREVIEW_SRC,
  JXL_LOADING_PREVIEW_SRC,
} from '../src/renderer/utils/galleryPreview'

describe('gallery JXL preview helpers', () => {
  it('detects local JPEG XL files from galleryPath, fileName, or extname', () => {
    expect(getJxlPreviewSource({ galleryPath: 'C:\\images\\photo.jxl' })).toBe('C:\\images\\photo.jxl')
    expect(getJxlPreviewSource({ galleryPath: '/tmp/photo', fileName: 'photo.JXL' })).toBe('/tmp/photo')
    expect(getJxlPreviewSource({ galleryPath: '/tmp/photo', extname: 'jxl' })).toBe('/tmp/photo')
  })

  it('detects remote JPEG XL URLs but ignores inline image sources', () => {
    expect(getJxlPreviewSource({ imgUrl: 'https://example.com/photo.jxl' })).toBe('https://example.com/photo.jxl')
    expect(getJxlPreviewSource({ galleryPath: 'data:image/jxl;base64,abc', extname: '.jxl' })).toBe('')
  })

  it('does not decode a non-JXL galleryPath just because metadata says JXL', () => {
    expect(
      getJxlPreviewSource({
        galleryPath: '/tmp/original.png',
        imgUrl: 'https://example.com/uploaded',
        extname: '.jxl',
      }),
    ).toBe('https://example.com/uploaded')

    expect(
      getJxlPreviewSource({
        galleryPath: '/tmp/original.png',
        extname: '.jxl',
      }),
    ).toBe('')
  })

  it('uses cached, loading, and error preview sources for local JXL images', () => {
    const item = { galleryPath: '/tmp/photo.jxl', imgUrl: 'https://example.com/photo.jxl' }

    expect(getGalleryPreviewSource(item, { '/tmp/photo.jxl': 'data:image/png;base64,abc' })).toBe(
      'data:image/png;base64,abc',
    )
    expect(getGalleryPreviewSource(item, {}, { '/tmp/photo.jxl': true })).toBe(JXL_LOADING_PREVIEW_SRC)
    expect(getGalleryPreviewSource(item, {}, {}, { '/tmp/photo.jxl': true })).toBe(JXL_ERROR_PREVIEW_SRC)
  })

  it('can keep the original JXL source after decoder failure when native rendering already worked', () => {
    const item = { galleryPath: '/tmp/photo.jxl', imgUrl: 'https://example.com/photo.jxl' }

    expect(getGalleryPreviewSource(item, {}, {}, { '/tmp/photo.jxl': true }, true)).toBe('/tmp/photo.jxl')
  })

  it('keeps a renderable gallery fallback while a separate JXL source is loading or failed', () => {
    const item = {
      galleryPath: '/tmp/original.png',
      imgUrl: 'https://example.com/photo.jxl',
      extname: '.jxl',
    }

    expect(getGalleryPreviewSource(item, {}, { 'https://example.com/photo.jxl': true })).toBe('/tmp/original.png')
    expect(getGalleryPreviewSource(item, {}, {}, { 'https://example.com/photo.jxl': true })).toBe('/tmp/original.png')
  })

  it('falls back to the original source for non-JXL images', () => {
    expect(
      getGalleryPreviewSource({ galleryPath: '/tmp/photo.png', imgUrl: 'https://example.com/photo.png' }, {}),
    ).toBe('/tmp/photo.png')
  })
})
