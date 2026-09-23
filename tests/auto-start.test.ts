import os from 'node:os'
import path from 'node:path'

import { app } from 'electron'
import fs from 'fs-extra'
import { afterEach, beforeEach, describe, expect, it, vi } from 'vitest'

import { isAutoStartEnabled, setAutoStart } from '../src/main/utils/autoStart'

const state = vi.hoisted(() => ({
  files: new Map<string, string>(),
  targets: new Map<string, 'executable' | 'non-executable' | 'directory'>(),
  nativeAutoStart: false,
}))

vi.mock('electron', () => ({
  app: {
    getVersion: () => '3.5.0',
    setLoginItemSettings: vi.fn(({ openAtLogin }: { openAtLogin: boolean }) => {
      state.nativeAutoStart = openAtLogin
    }),
    getLoginItemSettings: vi.fn(() => ({ openAtLogin: state.nativeAutoStart })),
  },
}))

vi.mock('fs-extra', () => ({
  default: {
    constants: { X_OK: 1 },
    ensureDir: vi.fn(async () => {}),
    chmod: vi.fn(async () => {}),
    pathExists: vi.fn(async (file: string) => state.files.has(file)),
    readFile: vi.fn(async (file: string) => {
      const content = state.files.get(file)
      if (content === undefined) throw new Error('ENOENT')
      return content
    }),
    writeFile: vi.fn(async (file: string, content: string) => {
      state.files.set(file, content)
    }),
    remove: vi.fn(async (file: string) => {
      state.files.delete(file)
    }),
    stat: vi.fn(async (file: string) => {
      if (!state.targets.has(file)) throw new Error('ENOENT')
      return { isFile: () => state.targets.get(file) !== 'directory' }
    }),
    access: vi.fn(async (file: string) => {
      if (state.targets.get(file) !== 'executable') throw new Error('EACCES')
    }),
  },
}))

const originalPlatform = Object.getOwnPropertyDescriptor(process, 'platform')!
const originalExecPath = Object.getOwnPropertyDescriptor(process, 'execPath')!
const installedPath = '/opt/PicList/piclist'
const mountedPath = '/tmp/.mount_PicList123/piclist'
const appImagePath = '/home/test/Applications/PicList 3.5.AppImage'
const desktopFile = path.join('/home/test', '.config', 'autostart', 'piclist.desktop')

const desktopEntry = (exec: string, extra = '') => `[Desktop Entry]\nType=Application\nExec=${exec}\n${extra}`

beforeEach(() => {
  vi.clearAllMocks()
  state.files.clear()
  state.targets.clear()
  state.targets.set(installedPath, 'executable')
  state.nativeAutoStart = false
  Object.defineProperty(process, 'platform', { value: 'linux' })
  Object.defineProperty(process, 'execPath', { value: installedPath })
  vi.stubEnv('APPIMAGE', undefined)
  vi.spyOn(os, 'homedir').mockReturnValue('/home/test')
})

afterEach(() => {
  Object.defineProperty(process, 'platform', originalPlatform)
  Object.defineProperty(process, 'execPath', originalExecPath)
  vi.unstubAllEnvs()
  vi.restoreAllMocks()
})

describe('Linux auto-start', () => {
  it('persists the stable AppImage path and remains enabled after its temporary mount disappears', async () => {
    vi.stubEnv('APPIMAGE', appImagePath)
    Object.defineProperty(process, 'execPath', { value: mountedPath })
    state.targets.set(appImagePath, 'executable')
    state.targets.set(mountedPath, 'executable')

    await setAutoStart(true)

    expect(state.files.get(desktopFile)).toContain(`Exec="${appImagePath}" %U\n`)
    expect(state.files.get(desktopFile)).not.toContain(mountedPath)
    state.targets.delete(mountedPath)
    await expect(isAutoStartEnabled()).resolves.toBe(true)
    expect(fs.access).toHaveBeenCalledWith(appImagePath, fs.constants.X_OK)
  })

  it.each([undefined, ''])('uses process.execPath when APPIMAGE is %s', async appImage => {
    vi.stubEnv('APPIMAGE', appImage)
    Object.defineProperty(process, 'execPath', { value: '/opt/Pic List/piclist' })
    state.targets.set('/opt/Pic List/piclist', 'executable')

    await setAutoStart(true)

    expect(state.files.get(desktopFile)).toContain('Exec="/opt/Pic List/piclist" %U\n')
    await expect(isAutoStartEnabled()).resolves.toBe(true)
  })

  it.each([
    ['/opt/Pic List/piclist', '"/opt/Pic List/piclist" %U'],
    ['/opt/Pic"List/piclist', String.raw`"/opt/Pic\\"List/piclist" %U`],
    ['/opt/$HOME/piclist', String.raw`"/opt/\\$HOME/piclist" %U`],
    ['/opt/`whoami`/piclist', '"/opt/\\\\`whoami\\\\`/piclist" %U'],
    [String.raw`/opt/Pic\List/piclist`, String.raw`"/opt/Pic\\\\List/piclist" %U`],
    ['/opt/100%U/piclist', '"/opt/100%%U/piclist" %U'],
    ["/opt/Pic'List;(test)&/piclist", '"/opt/Pic\'List;(test)&/piclist" %U'],
    ['/opt/Pic\nList\r\t/piclist', String.raw`"/opt/Pic\nList\r\t/piclist" %U`],
  ])('escapes the executable %j using Desktop Entry rules', async (execPath, expectedExec) => {
    vi.stubEnv('APPIMAGE', execPath)
    state.targets.set(execPath, 'executable')

    await setAutoStart(true)

    expect(
      state.files
        .get(desktopFile)
        ?.split('\n')
        .filter(line => line.startsWith('Exec=')),
    ).toEqual([`Exec=${expectedExec}`])
    await expect(isAutoStartEnabled()).resolves.toBe(true)
  })

  it('detects and replaces a legacy AppImage mount target even while that mount still exists', async () => {
    vi.stubEnv('APPIMAGE', appImagePath)
    Object.defineProperty(process, 'execPath', { value: mountedPath })
    state.targets.set(mountedPath, 'executable')
    state.targets.set(appImagePath, 'executable')
    state.files.set(desktopFile, desktopEntry(`${mountedPath} %U`))

    await expect(isAutoStartEnabled()).resolves.toBe(false)
    await setAutoStart(true)
    await expect(isAutoStartEnabled()).resolves.toBe(true)
    expect(state.files.get(desktopFile)).toContain(`Exec="${appImagePath}" %U\n`)
  })

  it('accepts a viable legacy unquoted executable without reserved characters', async () => {
    state.files.set(desktopFile, desktopEntry(`${installedPath} %U`))

    await expect(isAutoStartEnabled()).resolves.toBe(true)
  })

  it.each(['/opt/Pic List/piclist', '/opt/100%U/piclist', '/opt/$HOME/piclist'])(
    'rejects legacy entries whose executable needs escaping: %s',
    async execPath => {
      vi.stubEnv('APPIMAGE', execPath)
      state.targets.set(execPath, 'executable')
      state.files.set(desktopFile, desktopEntry(`${execPath} %U`))

      await expect(isAutoStartEnabled()).resolves.toBe(false)
    },
  )

  it.each(['missing', 'non-executable', 'directory'] as const)('reports a %s target as disabled', async target => {
    await setAutoStart(true)
    if (target === 'missing') state.targets.delete(installedPath)
    else state.targets.set(installedPath, target)

    await expect(isAutoStartEnabled()).resolves.toBe(false)
  })

  it.each(['relative.AppImage', '/missing.AppImage', '/opt/Pic=List.AppImage', '/opt/Pic\0List.AppImage'])(
    'refuses an invalid AppImage target without falling back to process.execPath: %j',
    async appImage => {
      vi.stubEnv('APPIMAGE', appImage)

      await expect(setAutoStart(true)).rejects.toThrow('Failed to enable auto-start')
      expect(fs.writeFile).not.toHaveBeenCalled()
      expect(fs.ensureDir).not.toHaveBeenCalled()
    },
  )

  it.each([
    '',
    '[Desktop Entry]\nType=Application\n',
    desktopEntry('"/old/PicList.AppImage" %U'),
    desktopEntry(`"${installedPath}" %U`, 'Hidden=true\n'),
    desktopEntry(`"${installedPath}" %U`, 'X-GNOME-Autostart-enabled=false\n'),
    `[Desktop Action Open]\nType=Application\nExec="${installedPath}" %U\n`,
    `[Desktop Entry]\nType=Link\nExec="${installedPath}" %U\n`,
  ])('does not consider an unusable desktop entry enabled: %j', async content => {
    state.files.set(desktopFile, content)

    await expect(isAutoStartEnabled()).resolves.toBe(false)
  })

  it('ignores Exec keys in other groups and accepts CRLF line endings', async () => {
    state.files.set(
      desktopFile,
      desktopEntry(`"${installedPath}" %U`, '[Desktop Action Open]\nExec="/other/app"\n').replace(/\n/g, '\r\n'),
    )

    await expect(isAutoStartEnabled()).resolves.toBe(true)
  })

  it('can disable an entry after its executable is removed, and disable again', async () => {
    await expect(isAutoStartEnabled()).resolves.toBe(false)
    await setAutoStart(true)
    state.targets.delete(installedPath)

    await setAutoStart(false)
    await setAutoStart(false)

    expect(state.files.has(desktopFile)).toBe(false)
    await expect(isAutoStartEnabled()).resolves.toBe(false)
  })
})

describe.each(['win32', 'darwin'])('%s auto-start', platform => {
  it('uses Electron login settings without touching Linux desktop entries', async () => {
    Object.defineProperty(process, 'platform', { value: platform })

    await setAutoStart(true)
    expect(app.setLoginItemSettings).toHaveBeenCalledWith({ openAtLogin: true })
    await expect(isAutoStartEnabled()).resolves.toBe(true)
    await setAutoStart(false)
    await expect(isAutoStartEnabled()).resolves.toBe(false)
    expect(app.getLoginItemSettings).toHaveBeenCalled()
    expect(fs.writeFile).not.toHaveBeenCalled()
    expect(fs.stat).not.toHaveBeenCalled()
  })
})
