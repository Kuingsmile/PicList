import path from 'node:path'

import { afterEach, beforeEach, describe, expect, it, vi } from 'vitest'

import { matchFileName, replaceFileName } from '../src/renderer/manage/utils/common'
import { splitFileName } from '../src/renderer/manage/utils/fileName'

vi.mock('@/manage/utils/dataSender', () => ({ getConfig: vi.fn() }))
vi.mock('@/manage/utils/icon', () => ({ availableIconList: [] }))
vi.mock('@/manage/utils/linkFormat', () => ({ formatStorageLink: vi.fn() }))
vi.mock('@/utils/common', () => ({ isNeedToShorten: vi.fn(), safeSliceF: vi.fn() }))

beforeEach(() => {
  vi.stubGlobal('window', { node: { path } })
})

afterEach(() => {
  vi.unstubAllGlobals()
})

describe('filename parts', () => {
  it.each([
    ['photo.jpg', 'photo', '.jpg'],
    ['photo.v1.jpg', 'photo.v1', '.jpg'],
    ['archive.tar.gz', 'archive.tar', '.gz'],
    ['README', 'README', ''],
    ['.env', '.env', ''],
    ['.env.local', '.env', '.local'],
    ['photo.', 'photo', '.'],
    ['', '', ''],
    ['.', '.', ''],
    ['..', '..', ''],
  ])('splits %s without losing filename components', (fileName, baseName, extension) => {
    expect(splitFileName(fileName)).toEqual({ baseName, extension })
  })
})

describe('shared single and batch rename behavior', () => {
  it.each([
    ['photo.jpg', 'photo', 'renamed.jpg'],
    ['photo.v1.jpg', 'photo', 'renamed.v1.jpg'],
    ['photo.v1.jpg', 'v1$', 'photo.renamed.jpg'],
    ['archive.tar.gz', '^.+$', 'renamed.gz'],
    ['README', '^README$', 'renamed'],
    ['.env', '^\\.env$', 'renamed'],
    ['.env', 'env', '.renamed'],
    ['.env.local', '^\\.env$', 'renamed.local'],
    ['photo.', 'photo', 'renamed.'],
  ])('matches and renames %s with pattern %s while preserving its extension', (fileName, pattern, expected) => {
    expect(matchFileName(fileName, pattern, false)).toBe(true)
    expect(replaceFileName(fileName, pattern, 'renamed', false)).toBe(expected)
  })

  it.each(['photo.v1.jpg', 'README', '.env', '.env.local'])('keeps %s intact when no text matches', fileName => {
    expect(matchFileName(fileName, 'missing', false)).toBe(false)
    expect(replaceFileName(fileName, 'missing', 'renamed', false)).toBe(fileName)
  })

  it('excludes only the final extension from matching and replacement', () => {
    expect(matchFileName('photo.v1.jpg', '\\.jpg$', false)).toBe(false)
    expect(replaceFileName('photo.v1.jpg', '\\.jpg$', '.png', false)).toBe('photo.v1.jpg')
    expect(matchFileName('.env.local', 'local$', false)).toBe(false)
    expect(replaceFileName('.env.local', 'local$', 'backup', false)).toBe('.env.local')
  })

  it.each(['photo.v1.jpg', 'README', '.env', '.env.local'])(
    'can replace all of %s when including extensions',
    fileName => {
      expect(matchFileName(fileName, '^.+$', true)).toBe(true)
      expect(replaceFileName(fileName, '^.+$', 'renamed.png', true)).toBe('renamed.png')
    },
  )

  it('can match and change the final extension when including extensions', () => {
    expect(matchFileName('photo.v1.jpg', '\\.jpg$', true)).toBe(true)
    expect(replaceFileName('photo.v1.jpg', '\\.jpg$', '.png', true)).toBe('photo.v1.png')
  })
})
