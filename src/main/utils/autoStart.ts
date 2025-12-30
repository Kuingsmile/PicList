import os from 'node:os'
import path from 'node:path'

import { app } from 'electron'
import fs from 'fs-extra'

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
      await fs.ensureDir(autostartDir)
      const execPath = process.execPath

      const desktopContent = `[Desktop Entry]
Name=PicList
Exec=${execPath} %U
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
    throw new Error(`Failed to ${enable ? 'enable' : 'disable'} auto-start: ${errorMessage}`)
  }
}

export const isAutoStartEnabled = async (): Promise<boolean> => {
  try {
    if (process.platform !== 'linux') {
      return app.getLoginItemSettings().openAtLogin
    }
    const autostartDir = path.join(os.homedir(), '.config', 'autostart')
    const desktopFile = path.join(autostartDir, 'piclist.desktop')
    return fs.pathExists(desktopFile)
  } catch (error) {
    const errorMessage = error instanceof Error ? error.message : String(error)
    throw new Error(`Failed to check auto-start status: ${errorMessage}`)
  }
}
