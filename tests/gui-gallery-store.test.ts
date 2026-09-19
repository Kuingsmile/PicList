import os from 'node:os'
import path from 'node:path'

import { DBStore, type IObject } from '@piclist/store'
import fs from 'fs-extra'
import { afterEach, beforeEach, describe, expect, it, vi } from 'vitest'

import GuiApi from '../src/main/apis/gui'

let tempDir: string
let store: DBStore

vi.mock('@core/bus/apis', () => ({}))
vi.mock('@core/datastore', () => ({ GalleryDB: { getInstance: () => store } }))
vi.mock('@core/datastore/dirs', () => ({}))
vi.mock('@core/picgo', () => ({ default: {} }))
vi.mock('apis/app/uploader', () => ({ default: {} }))
vi.mock('electron', () => ({}))
vi.mock('~/events/constant', () => ({}))
vi.mock('~/i18n', () => ({ t: (key: string) => key }))
vi.mock('~/utils/common', () => ({}))
vi.mock('~/utils/enum', () => ({}))
vi.mock('~/utils/pasteTemplate', () => ({ default: vi.fn() }))
vi.mock('~/utils/runScript', () => ({}))
vi.mock('~/utils/uploadResult', () => import('../src/main/utils/uploadResult'))

beforeEach(async () => {
  tempDir = fs.mkdtempSync(path.join(os.tmpdir(), 'piclist-gui-gallery-'))
  store = new DBStore(path.join(tempDir, 'piclist.db'), 'gallery')
  await store.insertMany([{ id: 'first' }, { id: 'second' }])
})

afterEach(() => {
  vi.restoreAllMocks()
  fs.removeSync(tempDir)
})

const destructiveCalls = {
  removeById: (db: DBStore) => db.removeById('first'),
  removeMany: (db: DBStore) => db.removeMany(['first', 'second']),
  overwrite: (db: DBStore) => db.overwrite([{ id: 'replacement' }]),
}

describe('plugin gallery confirmations with store v4', () => {
  it.each(Object.entries(destructiveCalls))('leaves the gallery unchanged when %s is declined', async (_, call) => {
    const gui = GuiApi.getInstance()
    const confirmation = vi.spyOn(gui, 'showMessageBox').mockResolvedValue({ result: 1, checkboxChecked: false })

    await expect(call(gui.galleryDB)).resolves.toBeUndefined()

    expect(confirmation).toHaveBeenCalledOnce()
    expect((await store.get()).data.map(item => item.id)).toEqual(['first', 'second'])
  })

  it.each(Object.entries(destructiveCalls))('executes %s after one confirmation', async (method, call) => {
    const gui = GuiApi.getInstance()
    const confirmation = vi.spyOn(gui, 'showMessageBox').mockResolvedValue({ result: 0, checkboxChecked: false })

    await call(gui.galleryDB)

    expect(confirmation).toHaveBeenCalledOnce()
    const expected = method === 'overwrite' ? ['replacement'] : method === 'removeById' ? ['second'] : []
    expect((await store.get()).data.map(item => item.id)).toEqual(expected)
  })

  it('propagates confirmation failures to the plugin', async () => {
    const gui = GuiApi.getInstance()
    vi.spyOn(gui, 'showMessageBox').mockRejectedValue(new Error('Dialog unavailable'))

    await expect(gui.galleryDB.removeMany(['first'])).rejects.toThrow('Dialog unavailable')
    expect(await store.count()).toBe(2)
  })

  it('propagates store validation failures after confirmation', async () => {
    const gui = GuiApi.getInstance()
    vi.spyOn(gui, 'showMessageBox').mockResolvedValue({ result: 0, checkboxChecked: false })

    await expect(gui.galleryDB.overwrite([{ id: 42 } as unknown as IObject])).rejects.toMatchObject({
      code: 'INVALID_RECORD',
    })
    expect(await store.count()).toBe(2)
  })
})
