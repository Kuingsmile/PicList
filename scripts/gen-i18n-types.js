import { readFileSync, writeFileSync } from 'node:fs'
import { dirname, join } from 'node:path'
import { fileURLToPath } from 'node:url'

import { load } from 'js-yaml'
const languageFileName = 'zh-CN.yml'

const __filename = fileURLToPath(import.meta.url)
const __dirname = dirname(__filename)

const i18nFolder = join(__dirname, '../resources/i18n')
const typeFolder = join(__dirname, '../src/universal/types')
const languageFile = join(i18nFolder, languageFileName)

const langFile = readFileSync(languageFile, 'utf8')

const obj = load(langFile)

const keys = Object.keys(obj)

const types = `export interface ILocales {
  ${keys.map(key => `${key}: string`).join('\n  ')}
}
export type ILocalesKey = keyof ILocales
`

writeFileSync(join(typeFolder, 'i18n.ts'), types)
