// convert-yaml-to-json.mjs
import fs from 'node:fs/promises'
import path from 'node:path'
import { fileURLToPath } from 'node:url'

import yaml from 'js-yaml'

const __filename = fileURLToPath(import.meta.url)
const __dirname = path.dirname(__filename)

// Change these paths as needed
const inputPath = path.resolve('./resources/i18n/zh-TW.yml')
const outputPath = path.resolve(__dirname, './zh-TW.json')

async function convertYamlToJson (yamlFile, jsonFile) {
  try {
    const fileContent = await fs.readFile(yamlFile, 'utf8')
    const data = yaml.load(fileContent)
    const jsonContent = JSON.stringify(data, null, 2)
    await fs.writeFile(jsonFile, jsonContent, 'utf8')
    console.log(`Converted ${yamlFile} to ${jsonFile}`)
  } catch (err) {
    console.error('Error during conversion:', err)
  }
}

convertYamlToJson(inputPath, outputPath)
