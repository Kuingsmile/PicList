import path from 'node:path'

import { themesDir } from '@core/datastore/dirs'
import AdmZip from 'adm-zip'
import axios from 'axios'
import fs from 'fs-extra'

import { randomStringGenerator } from '@/manage/utils/common'
import logger from '~/apis/core/picgo/logger'
import { IWindowList } from '~/utils/enum'

import windowManager from '../window/windowManager'

export async function resolveThemes(): Promise<{ key: string; label: string }[]> {
  const dir = themesDir()
  const entries = await fs.readdir(dir, { withFileTypes: true })
  const themePromises = entries
    .filter(entry => entry.isFile() && entry.name.endsWith('.css'))
    .map(async entry => {
      const filePath = path.join(dir, entry.name)

      let label = entry.name
      let fd
      try {
        fd = await fs.open(filePath, 'r')
        const buffer = Buffer.alloc(256)
        const { bytesRead } = await fs.read(fd, buffer, 0, 256, 0)
        const content = buffer.toString('utf8', 0, bytesRead)
        const match = content.match(/^\/\*\s*(.*?)\s*\*\//)
        if (match && match[1]) {
          label = match[1].trim()
        }
      } catch (e: any) {
        logger.error(e)
      } finally {
        if (fd !== undefined) await fs.close(fd)
      }

      return { key: entry.name, label }
    })

  const themes = await Promise.all(themePromises)

  const hasDefault = themes.some(t => t.key === 'default.css')
  if (!hasDefault) {
    themes.unshift({ key: 'default.css', label: '默认' })
  } else {
    const idx = themes.findIndex(t => t.key === 'default.css')
    const [defaultTheme] = themes.splice(idx, 1)
    themes.unshift(defaultTheme)
  }

  return themes
}

export async function fetchThemes(): Promise<boolean> {
  try {
    const zipUrl = 'https://github.com/Kuingsmile/piclist-themeHub/releases/download/latest/themes.zip'
    const zipData = await axios.get(zipUrl, {
      responseType: 'arraybuffer',
      headers: { 'Content-Type': 'application/octet-stream' },
    })
    const zip = new AdmZip(zipData.data as Buffer)
    zip.extractAllTo(path.join(themesDir()), true)
    return true
  } catch (_e) {
    return false
  }
}

export async function importThemes(files: string[]): Promise<void> {
  for (const file of files) {
    if (fs.existsSync(file))
      await fs.copyFile(file, path.join(themesDir(), `imp-${randomStringGenerator(3)}-${path.basename(file)}`))
  }
}

export async function readTheme(theme: string): Promise<string> {
  if (!fs.existsSync(path.join(themesDir(), theme))) return ''
  const result = await fs.readFile(path.join(themesDir(), theme), 'utf-8')
  return result
}

export async function applyTheme(theme: string): Promise<void> {
  const basePath = path.basename(theme)
  const css = await readTheme(basePath)
  windowManager.get(IWindowList.SETTING_WINDOW)?.webContents.send('THEME_UPDATE', css)
  windowManager.get(IWindowList.UPDATE_WINDOW)?.webContents.send('THEME_UPDATE', css)
  windowManager.get(IWindowList.TRAY_WINDOW)?.webContents.send('THEME_UPDATE', css)
}
