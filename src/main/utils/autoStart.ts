import os from 'node:os'
import path from 'node:path'

import { app } from 'electron'
import fs from 'fs-extra'

const getLinuxExecPath = (): string => process.env.APPIMAGE || process.execPath

const isUsableExecutable = async (execPath: string): Promise<boolean> => {
  // Desktop Entry executable names cannot contain '=' or unescaped control characters.
  if (!path.posix.isAbsolute(execPath) || /[=\x00-\x08\x0b\x0c\x0e-\x1f\x7f]/.test(execPath)) {
    return false
  }
  try {
    if (!(await fs.stat(execPath)).isFile()) {
      return false
    }
    await fs.access(execPath, fs.constants.X_OK)
    return true
  } catch {
    return false
  }
}

const getDesktopExec = (execPath: string): string => {
  // Exec quoting is decoded AFTER Desktop Entry string escaping, so escape both layers.
  // Literal percent signs must also survive field-code expansion; %U stays a separate argument.
  const quotedPath = execPath.replace(/["`$\\]/g, '\\$&').replace(/%/g, '%%')
  const escapedPath = quotedPath
    .replace(/\\/g, '\\\\')
    .replace(/\n/g, '\\n')
    .replace(/\r/g, '\\r')
    .replace(/\t/g, '\\t')
  return `"${escapedPath}" %U`
}

const hasMatchingDesktopEntry = (content: string, execPath: string): boolean => {
  let inDesktopEntry = false
  const entries = new Map<string, string>()
  for (const line of content.split(/\r?\n/)) {
    const trimmed = line.trim()
    if (trimmed.startsWith('[')) {
      inDesktopEntry = trimmed === '[Desktop Entry]'
    } else if (inDesktopEntry && !trimmed.startsWith('#')) {
      const separator = trimmed.indexOf('=')
      if (separator > 0) {
        entries.set(trimmed.slice(0, separator).trim(), trimmed.slice(separator + 1).trim())
      }
    }
  }
  if (
    entries.get('Type') !== 'Application' ||
    entries.get('Hidden') === 'true' ||
    entries.get('X-GNOME-Autostart-enabled') === 'false'
  ) {
    return false
  }

  // Accept the old unquoted format only when the path needs no quoting or escaping.
  // Matching the current stable executable also rejects mount paths that still exist this session.
  const exec = entries.get('Exec')
  return exec === getDesktopExec(execPath) || (!/[\s"'`\\><~|&;$*?#()%]/.test(execPath) && exec === `${execPath} %U`)
}

export const setAutoStart = async (enable: boolean): Promise<void> => {
  try {
    if (process.platform !== 'linux') {
      app.setLoginItemSettings({
        openAtLogin: enable,
      })
      return
    }

    const autostartDir = path.join(os.homedir(), '.config', 'autostart')
    const desktopFile = path.join(autostartDir, 'piclist.desktop')

    if (enable) {
      const execPath = getLinuxExecPath()
      if (!(await isUsableExecutable(execPath))) {
        throw new Error(
          'Auto-start target must be an existing executable file with a valid absolute Desktop Entry path',
        )
      }
      await fs.ensureDir(autostartDir)

      const desktopContent = `[Desktop Entry]
Name=PicList
Exec=${getDesktopExec(execPath)}
Terminal=false
Type=Application
Icon=piclist
StartupWMClass=PicList
X-AppImage-Version=${app.getVersion()}
Comment=A powerful cloud storage manage tool.
Categories=Utility;
StartupNotify=true
`
      await fs.writeFile(desktopFile, desktopContent, 'utf8')
      await fs.chmod(desktopFile, 0o755)
    } else {
      if (await fs.pathExists(desktopFile)) {
        await fs.remove(desktopFile)
      }
    }
  } catch (error) {
    const errorMessage = error instanceof Error ? error.message : String(error)
    throw new Error(`Failed to ${enable ? 'enable' : 'disable'} auto-start: ${errorMessage}`, { cause: error })
  }
}

export const isAutoStartEnabled = async (): Promise<boolean> => {
  try {
    if (process.platform !== 'linux') {
      return app.getLoginItemSettings().openAtLogin
    }
    const autostartDir = path.join(os.homedir(), '.config', 'autostart')
    const desktopFile = path.join(autostartDir, 'piclist.desktop')
    if (!(await fs.pathExists(desktopFile))) {
      return false
    }
    const execPath = getLinuxExecPath()
    const content = await fs.readFile(desktopFile, 'utf8')
    return hasMatchingDesktopEntry(content, execPath) && (await isUsableExecutable(execPath))
  } catch (error) {
    const errorMessage = error instanceof Error ? error.message : String(error)
    throw new Error(`Failed to check auto-start status: ${errorMessage}`, { cause: error })
  }
}
