import os from 'node:os'
import path from 'node:path'

import fs from 'fs-extra'
import { afterEach, beforeEach, describe, expect, it, vi } from 'vitest'

import ManageDB from '../src/main/manage/datastore/db'

let tempDir: string
let configPath: string

const createDB = () => new ManageDB({ configPath, logger: { error: vi.fn() } } as unknown as IManageApiType)

beforeEach(() => {
  tempDir = fs.mkdtempSync(path.join(os.tmpdir(), 'piclist-manage-db-'))
  configPath = path.join(tempDir, 'manage.json')
})

afterEach(() => {
  fs.removeSync(tempDir)
})

describe('ManageDB with store v4', () => {
  it.each([false, true])('initializes defaults with an existing empty file: %s', existing => {
    if (existing) fs.ensureFileSync(configPath)

    expect(createDB().read()).toEqual({ picBed: {}, settings: {} })
    expect(fs.readJSONSync(configPath)).toEqual({ picBed: {}, settings: {} })
  })

  it('saves several configuration paths while preserving JSON comments', () => {
    fs.writeFileSync(configPath, '{\n// Saved preferences\n"picBed": {}, "settings": {"enabled": false}\n}')
    const db = createDB()

    db.saveConfig({ 'settings.enabled': true, 'settings.extensions': ['png', 'jpg'], 'settings.proxy': null })

    expect(createDB().get('settings')).toEqual({ enabled: true, extensions: ['png', 'jpg'], proxy: null })
    expect(fs.readFileSync(configPath, 'utf8')).toContain('// Saved preferences')
  })

  it('does not persist part of a configuration batch when serialization fails', () => {
    const db = createDB()
    db.set('settings.enabled', false)
    const before = fs.readFileSync(configPath)
    const invalid: Record<string, unknown> = {}
    invalid.self = invalid

    expect(() => db.saveConfig({ 'settings.enabled': true, 'settings.invalid': invalid })).toThrow()

    expect(fs.readFileSync(configPath)).toEqual(before)
    expect(db.get('settings')).toEqual({ enabled: false })
  })

  it('refreshes reads and preserves changes made by another instance during writes', () => {
    const first = createDB()
    const second = createDB()

    first.set('settings.enabled', true)
    second.set('settings.theme', 'dark')
    first.saveConfig({ 'settings.extensions': ['png'] })

    expect(second.get('settings')).toEqual({ enabled: true, theme: 'dark', extensions: ['png'] })
    expect(first.has('settings.theme')).toBe(true)
  })

  it('supports legacy child-path removal and compacts array entries', () => {
    const db = createDB()
    db.saveConfig({ 'settings.theme': 'dark', 'settings.extensions': ['png', 'jpg'] })

    expect(db.unset('settings', 'theme')).toBe(true)
    expect(db.unset('settings.extensions[0]')).toBe(true)
    expect(db.unset('settings.missing')).toBe(false)
    expect(createDB().get('settings')).toEqual({ extensions: ['jpg'] })
  })

  it('rejects invalid configuration roots without overwriting the file', () => {
    fs.writeFileSync(configPath, '[]')

    expect(createDB).toThrow('JSON store root must be an object')
    expect(fs.readFileSync(configPath, 'utf8')).toBe('[]')
  })
})
