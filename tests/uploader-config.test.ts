import { cloneDeep, get, set } from 'lodash-es'
import { beforeEach, describe, expect, it, vi } from 'vitest'

import {
  changeCurrentUploader,
  changeSecondUploader,
  deleteUploaderConfig,
  resetUploaderConfig,
  updateUploaderConfig,
} from '../src/main/utils/handleUploaderConfig'

const state = vi.hoisted(() => ({ config: {} as Record<string, any>, save: vi.fn(), tooltip: vi.fn() }))
vi.mock('@core/picgo', () => ({
  default: {
    getConfig: (key: string) => cloneDeep(get(state.config, key)),
    saveConfig: state.save,
  },
}))
vi.mock('~/utils/common', () => ({
  setTrayToolTip: state.tooltip,
  trimValues: (value: object) =>
    Object.fromEntries(Object.entries(value).map(([key, val]) => [key, typeof val === 'string' ? val.trim() : val])),
}))
vi.mock('~/utils/configPaths', () => import('../src/main/utils/configPaths'))

const primary = { _id: 'primary', _configName: 'Primary', _createdAt: 1, _updatedAt: 1, path: '/primary' }
const secondary = { _id: 'secondary', _configName: 'Backup', _createdAt: 2, _updatedAt: 2, path: '/backup' }

beforeEach(() => {
  vi.clearAllMocks()
  state.config = cloneDeep({
    uploader: { local: { configList: [primary, secondary], defaultId: primary._id } },
    picBed: { uploader: 'local', local: primary, secondUploader: 'local', secondUploaderConfig: secondary },
    settings: { enableSecondUploader: true },
  })
  state.save.mockImplementation((patch: object) => {
    Object.entries(patch).forEach(([key, value]) => set(state.config, key, cloneDeep(value)))
  })
})

describe('selected uploader configuration snapshots', () => {
  it.each([true, false])('syncs edits and renames of the selected backup when enabled=%s', enabled => {
    state.config.settings.enableSecondUploader = enabled
    updateUploaderConfig('local', secondary._id, { path: '/edited', _configName: 'Renamed' })
    expect(state.config.picBed.secondUploaderConfig).toMatchObject({
      _id: secondary._id,
      path: '/edited',
      _configName: 'Renamed',
    })
    expect(state.config.picBed.local).toEqual(primary)
    expect(state.config.uploader.local.defaultId).toBe(primary._id)
  })

  it('syncs primary edits without changing a different backup configuration', () => {
    updateUploaderConfig('local', primary._id, { path: '/edited' })
    expect(state.config.picBed.local.path).toBe('/edited')
    expect(state.config.picBed.secondUploaderConfig).toEqual(secondary)
  })

  it('matches both uploader type and configuration ID before syncing a backup', () => {
    state.config.picBed.secondUploader = 'another-uploader'
    updateUploaderConfig('local', secondary._id, { path: '/edited' })
    expect(state.config.picBed.secondUploaderConfig).toEqual(secondary)
  })

  it('keeps selecting newly created configurations', () => {
    updateUploaderConfig('local', 'new', { _configName: 'New', path: '/new' })
    expect(state.config.uploader.local.defaultId).toBe('new')
    expect(state.config.picBed.local).toMatchObject({ _id: 'new', path: '/new' })
  })

  it('clears and disables a deleted backup', () => {
    deleteUploaderConfig('local', secondary._id)
    expect(state.config.picBed.secondUploader).toBe('')
    expect(state.config.picBed.secondUploaderConfig).toEqual({})
    expect(state.config.settings.enableSecondUploader).toBe(false)
    expect(state.config.uploader.local.configList).toEqual([primary])
  })

  it.each([
    { uploader: 'local', current: 'local' },
    { uploader: undefined, current: 'local' },
    { uploader: 'local', current: 'aliyun' },
  ])('replaces the active default and preserves the backup with uploader=$uploader and current=$current', selection => {
    Object.assign(state.config.picBed, selection)
    deleteUploaderConfig('local', primary._id)
    expect(state.config.picBed.secondUploaderConfig).toEqual(secondary)
    expect(state.config.picBed.local).toEqual(secondary)
    expect(state.config.uploader.local.defaultId).toBe(secondary._id)
    expect(state.config.picBed.current).toBe('local')
    expect(state.config.picBed.uploader).toBe('local')
    expect(state.tooltip).toHaveBeenCalledExactlyOnceWith('local Backup')
    expect(state.config.settings.enableSecondUploader).toBe(true)
  })

  it('leaves the last remaining configuration intact', () => {
    state.config.uploader.local.configList = [secondary]
    deleteUploaderConfig('local', secondary._id)
    expect(state.save).not.toHaveBeenCalled()
    expect(state.config.picBed.secondUploaderConfig).toEqual(secondary)
  })

  it('resets the primary snapshot to one object containing only metadata', () => {
    resetUploaderConfig('local', primary._id)
    expect(state.config.picBed.local).toEqual({
      _id: primary._id,
      _configName: primary._configName,
      _createdAt: 1,
      _updatedAt: 1,
    })
    expect(state.config.uploader.local.configList).toEqual([state.config.picBed.local, secondary])
    expect(state.config.picBed.secondUploaderConfig).toEqual(secondary)
  })

  it('resets both snapshots when the same configuration is selected twice', () => {
    state.config.picBed.secondUploaderConfig = cloneDeep(primary)
    resetUploaderConfig('local', primary._id)
    expect(state.config.picBed.secondUploaderConfig).toEqual(state.config.picBed.local)
    expect(state.config.picBed.secondUploaderConfig.path).toBeUndefined()
  })

  it('resets a backup without changing the primary configuration', () => {
    resetUploaderConfig('local', secondary._id)
    expect(state.config.picBed.secondUploaderConfig.path).toBeUndefined()
    expect(state.config.picBed.secondUploaderConfig._id).toBe(secondary._id)
    expect(state.config.picBed.local).toEqual(primary)
  })

  it('ignores reset requests for missing configurations', () => {
    resetUploaderConfig('local', 'missing')
    expect(state.save).not.toHaveBeenCalled()
  })
})

describe('deleting an inactive uploader default', () => {
  const githubDefault = { ...primary, _id: 'github-default' }
  const githubBackup = { ...secondary, _id: 'github-backup' }
  const aliyun = { ...primary, _id: 'aliyun-profile' }

  beforeEach(() => {
    state.config = cloneDeep({
      uploader: {
        github: { configList: [githubDefault, githubBackup], defaultId: githubDefault._id },
        aliyun: { configList: [aliyun], defaultId: aliyun._id },
      },
      picBed: {
        current: 'aliyun',
        uploader: 'aliyun',
        aliyun,
        github: githubDefault,
        secondUploader: 'github',
        secondUploaderConfig: githubBackup,
      },
      settings: { enableSecondUploader: true },
    })
  })

  it.each([
    { uploader: 'aliyun', current: 'aliyun' },
    { uploader: undefined, current: 'aliyun' },
    { uploader: 'aliyun', current: 'github' },
  ])('keeps Aliyun active with uploader=$uploader and current=$current', selection => {
    Object.assign(state.config.picBed, selection)

    const result = deleteUploaderConfig('github', githubDefault._id)

    expect(result).toEqual({ configList: [githubBackup], defaultId: githubBackup._id })
    expect(state.config.uploader.github).toEqual(result)
    expect(state.config.picBed.github).toEqual(githubBackup)
    expect(state.config.picBed.uploader).toBe(selection.uploader)
    expect(state.config.picBed.current).toBe(selection.current)
    expect(state.config.picBed.aliyun).toEqual(aliyun)
    expect(state.config.uploader.aliyun).toEqual({ configList: [aliyun], defaultId: aliyun._id })
    expect(state.tooltip).not.toHaveBeenCalled()
    expect(state.config.picBed.secondUploader).toBe('github')
    expect(state.config.picBed.secondUploaderConfig).toEqual(githubBackup)
    expect(state.config.settings.enableSecondUploader).toBe(true)
  })

  it('clears a deleted secondary profile without activating its provider', () => {
    state.config.picBed.secondUploaderConfig = cloneDeep(githubDefault)

    deleteUploaderConfig('github', githubDefault._id)

    expect(state.config.picBed.secondUploader).toBe('')
    expect(state.config.picBed.secondUploaderConfig).toEqual({})
    expect(state.config.settings.enableSecondUploader).toBe(false)
    expect(state.config.picBed.github).toEqual(githubBackup)
    expect(state.config.uploader.github.defaultId).toBe(githubBackup._id)
    expect(state.config.picBed.uploader).toBe('aliyun')
    expect(state.config.picBed.current).toBe('aliyun')
    expect(state.tooltip).not.toHaveBeenCalled()
  })
})

describe('uploader selection writes', () => {
  it('saves primary selection, configuration, and default ID together', () => {
    changeCurrentUploader('local', secondary, secondary._id)
    expect(state.save).toHaveBeenCalledExactlyOnceWith({
      'picBed.current': 'local',
      'picBed.uploader': 'local',
      'uploader.local.defaultId': secondary._id,
      'picBed.local': secondary,
    })
    expect(state.tooltip).toHaveBeenCalledWith('local Backup')
  })

  it('saves secondary selection and configuration together', () => {
    changeSecondUploader('local', primary)
    expect(state.save).toHaveBeenCalledExactlyOnceWith({
      'picBed.secondUploader': 'local',
      'picBed.secondUploaderConfig': primary,
    })
  })

  it('leaves existing primary configuration and ID intact when omitted', () => {
    changeCurrentUploader('local')
    expect(state.save).toHaveBeenCalledExactlyOnceWith({ 'picBed.current': 'local', 'picBed.uploader': 'local' })
    expect(state.config.picBed.local).toEqual(primary)
    expect(state.config.uploader.local.defaultId).toBe(primary._id)
  })

  it('leaves the secondary configuration intact when omitted', () => {
    changeSecondUploader('local')
    expect(state.save).toHaveBeenCalledExactlyOnceWith({ 'picBed.secondUploader': 'local' })
    expect(state.config.picBed.secondUploaderConfig).toEqual(secondary)
  })

  it('ignores empty uploader selections', () => {
    changeCurrentUploader('', primary, primary._id)
    changeSecondUploader('', secondary)
    expect(state.save).not.toHaveBeenCalled()
    expect(state.tooltip).not.toHaveBeenCalled()
  })
})
