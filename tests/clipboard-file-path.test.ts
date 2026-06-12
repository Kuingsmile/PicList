import os from 'node:os'
import path from 'node:path'
import { pathToFileURL } from 'node:url'

import fs from 'fs-extra'
import { afterEach, describe, expect, it } from 'vitest'

import { getClipboardTextFilePath } from '../src/main/utils/clipboardFilePath'

const tempDirs: string[] = []

const createTempFile = (fileName = 'clipboard image.png') => {
  const dir = fs.mkdtempSync(path.join(os.tmpdir(), 'piclist-clipboard-'))
  const filePath = path.join(dir, fileName)
  tempDirs.push(dir)
  fs.writeFileSync(filePath, 'test')
  return filePath
}

afterEach(() => {
  tempDirs.splice(0).forEach(dir => fs.removeSync(dir))
})

describe('getClipboardTextFilePath', () => {
  it('returns an existing absolute file path from clipboard text', () => {
    const filePath = createTempFile()

    expect(getClipboardTextFilePath(`  ${filePath}  `)).toBe(path.normalize(filePath))
  })

  it('unwraps quoted file paths', () => {
    const filePath = createTempFile()

    expect(getClipboardTextFilePath(`"${filePath}"`)).toBe(path.normalize(filePath))
  })

  it('supports file URL text', () => {
    const filePath = createTempFile()

    expect(getClipboardTextFilePath(pathToFileURL(filePath).href)).toBe(path.normalize(filePath))
  })

  it('rejects relative paths, missing files, directories, and multi-line text', () => {
    const filePath = createTempFile()

    expect(getClipboardTextFilePath(path.basename(filePath))).toBe('')
    expect(getClipboardTextFilePath(path.join(os.tmpdir(), 'missing-clipboard-image.png'))).toBe('')
    expect(getClipboardTextFilePath(path.dirname(filePath))).toBe('')
    expect(getClipboardTextFilePath(`${filePath}\n${filePath}`)).toBe('')
  })
})
