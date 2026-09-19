import os from 'node:os'
import path from 'node:path'
import { gzipSync } from 'node:zlib'

import { DBStore, type IObject } from '@piclist/store'
import fs from 'fs-extra'
import { afterEach, beforeEach, describe, expect, it } from 'vitest'

let tempDir: string
let dbPath: string

beforeEach(() => {
  tempDir = fs.mkdtempSync(path.join(os.tmpdir(), 'piclist-gallery-store-'))
  dbPath = path.join(tempDir, 'piclist.db')
})

afterEach(() => {
  fs.removeSync(tempDir)
})

describe('gallery store v4 compatibility', () => {
  it('reads the v3 gzip layout and preserves existing IDs and creation times during updates', async () => {
    fs.writeFileSync(
      dbPath,
      gzipSync(
        JSON.stringify({
          gallery: [{ id: 'existing', imgUrl: 'https://example.com/old.png', createdAt: 100, updatedAt: 200 }],
          __gallery_KEY__: { existing: 1 },
        }),
      ),
    )
    const db = new DBStore(dbPath, 'gallery')

    expect(await db.getById('existing')).toMatchObject({ id: 'existing', createdAt: 100 })
    await db.updateById('existing', { imgUrl: 'https://example.com/new.png' })
    await db.insertMany([{ id: 'second', imgUrl: 'https://example.com/second.png' }])

    const reloaded = new DBStore(dbPath, 'gallery')
    expect(await reloaded.getById('existing')).toMatchObject({
      id: 'existing',
      imgUrl: 'https://example.com/new.png',
      createdAt: 100,
    })
    expect((await reloaded.get({ orderBy: 'desc', limit: 1 })).data[0].id).toBe('second')
  })

  it('refreshes the existing instance after another writer changes the gallery', async () => {
    const db = new DBStore(dbPath, 'gallery')
    await db.insert({ id: 'first' })
    await new DBStore(dbPath, 'gallery').insert({ id: 'synced' })

    await db.refresh()

    expect((await db.get()).data.map(item => item.id)).toEqual(['first', 'synced'])
  })

  it('persists concurrent uploads and batch removal', async () => {
    const db = new DBStore(dbPath, 'gallery')
    await Promise.all([db.insert({ id: 'first' }), db.insertMany([{ id: 'second' }, { id: 'third' }])])

    expect(await db.removeMany(['first', 'third', 'missing'])).toEqual({ total: 3, success: 2 })
    expect((await new DBStore(dbPath, 'gallery').get()).data.map(item => item.id)).toEqual(['second'])
  })

  it('rejects an invalid batch without losing existing gallery records', async () => {
    const db = new DBStore(dbPath, 'gallery')
    await db.insert({ id: 'existing' })
    const before = fs.readFileSync(dbPath)

    await expect(db.insertMany([{ id: 'valid' }, { id: 42 } as unknown as IObject])).rejects.toMatchObject({
      code: 'INVALID_RECORD',
    })

    expect(fs.readFileSync(dbPath)).toEqual(before)
    expect((await db.get()).data.map(item => item.id)).toEqual(['existing'])
  })
})
