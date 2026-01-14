import path from 'node:path'

import { themesDir } from '@core/datastore/dirs'
import * as fsWalk from '@nodelib/fs.walk'
import AdmZip from 'adm-zip'
import windowManager from 'apis/app/window/windowManager'
import axios from 'axios'
import fs from 'fs-extra'

import { IWindowList } from '~/utils/enum'

let insertedCSSKeyMain: string | undefined

export async function resolveThemes(): Promise<{ key: string; label: string }[]> {
  const files = fsWalk.walkSync(themesDir(), {
    followSymbolicLinks: true,
    fs,
    stats: true,
    throwErrorOnBrokenSymbolicLink: false,
  })
  const result: string[] = []
  files.forEach(item => {
    if (item.stats?.isFile()) {
      result.push(item.path.replace(themesDir() + '/', ''))
    }
  })
  const themes = await Promise.all(
    result
      .filter(file => file.endsWith('.css'))
      .map(async file => {
        const css = (await fs.readFile(file, 'utf-8')) || ''
        let name = file
        if (css.startsWith('/*')) {
          name = css.split('\n')[0].replace('/*', '').replace('*/', '').trim() || file
        }
        return { key: file, label: name }
      }),
  )
  if (themes.find(theme => theme.key === 'default.css')) {
    return themes
  } else {
    return [{ key: 'default.css', label: '默认' }, ...themes]
  }
}

export async function fetchThemes(): Promise<void> {
  const zipUrl = 'https://github.com/Kuingsmile/piclist-themeHub/releases/download/latest/themes.zip'
  const zipData = await axios.get(zipUrl, {
    responseType: 'arraybuffer',
    headers: { 'Content-Type': 'application/octet-stream' },
  })
  const zip = new AdmZip(zipData.data as Buffer)
  zip.extractAllTo(themesDir(), true)
}

export async function importThemes(files: string[]): Promise<void> {
  for (const file of files) {
    if (fs.existsSync(file))
      await fs.copyFile(file, path.join(themesDir(), `${new Date().getTime().toString(16)}-${path.basename(file)}`))
  }
}

export async function readTheme(theme: string): Promise<string> {
  if (!fs.existsSync(path.join(themesDir(), theme))) return ''
  const result = await fs.readFile(path.join(themesDir(), theme), 'utf-8')
  return result
}

export async function applyTheme(theme: string): Promise<void> {
  theme = path.basename(theme)
  console.log('Applying theme:', theme)
  const css = await readTheme(theme)
  if (windowManager.has(IWindowList.SETTING_WINDOW)) {
    try {
      await windowManager.get(IWindowList.SETTING_WINDOW)?.webContents.removeInsertedCSS(insertedCSSKeyMain || '')
      insertedCSSKeyMain = await windowManager.get(IWindowList.SETTING_WINDOW)?.webContents.insertCSS(css)
    } catch (e) {
      console.error(e)
    }
  }
}
