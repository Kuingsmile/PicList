#!/usr/bin/env node

import { readdirSync, readFileSync, writeFileSync } from 'node:fs'
import { basename, dirname, extname, join, relative } from 'node:path'
import { fileURLToPath } from 'node:url'
import { load, dump } from 'js-yaml'

const __filename = fileURLToPath(import.meta.url)
const __dirname = dirname(__filename)

const LOCALE_DIR = join(__dirname, '../public/i18n')
const SRC_DIR = join(__dirname, '../src')

// Parse command line arguments
const args = process.argv.slice(2)
const isVerbose = args.includes('--verbose') || args.includes('-v')
const shouldDelete = args.includes('--delete') || args.includes('-d')
const isDryRun = args.includes('--dry-run')

const colors = {
  reset: '\x1b[0m',
  bright: '\x1b[1m',
  red: '\x1b[31m',
  green: '\x1b[32m',
  yellow: '\x1b[33m',
  blue: '\x1b[34m',
  magenta: '\x1b[35m',
  cyan: '\x1b[36m'
}

function colorize(text, color) {
  return `${colors[color]}${text}${colors.reset}`
}

console.log(`\n🔍 Analyzing i18n keys in ${LOCALE_DIR} and source files in ${SRC_DIR}`)
if (shouldDelete) {
  console.log(colorize(`🗑️  Delete mode enabled ${isDryRun ? '(DRY RUN)' : ''}`, 'yellow'))
}
console.log('')

function flattenKeys(obj, prefix = '') {
  const keys = []

  for (const [key, value] of Object.entries(obj)) {
    const fullKey = prefix ? `${prefix}.${key}` : key

    if (typeof value === 'object' && value !== null && !Array.isArray(value)) {
      keys.push(...flattenKeys(value, fullKey))
    } else {
      keys.push(fullKey)
    }
  }

  return keys
}

function readLocaleFile(filePath) {
  try {
    const content = readFileSync(filePath, 'utf8')
    return load(content) || {}
  } catch (error) {
    console.error(colorize(`Error reading ${filePath}: ${error.message}`, 'red'))
    return {}
  }
}

function getAllI18nKeys() {
  const localeFiles = readdirSync(LOCALE_DIR).filter(file => file.endsWith('.yml'))
  const allKeys = new Set()
  const localeData = {}

  console.log(colorize('\n📁 Found locale files:', 'blue'))

  for (const file of localeFiles) {
    const filePath = join(LOCALE_DIR, file)
    const locale = basename(file, '.yml')
    const data = readLocaleFile(filePath)
    const keys = flattenKeys(data)

    localeData[locale] = {
      file: filePath,
      keys,
      data
    }

    keys.forEach(key => allKeys.add(key))

    console.log(`  ${colorize('✓', 'green')} ${file} (${keys.length} keys)`)
  }

  return {
    allKeys: Array.from(allKeys).sort(),
    localeData
  }
}

function findFiles(dir, extensions = ['.vue', '.ts', '.js']) {
  const files = []

  function walk(currentDir) {
    try {
      const entries = readdirSync(currentDir, { withFileTypes: true })

      for (const entry of entries) {
        const fullPath = join(currentDir, entry.name)

        if (entry.isDirectory()) {
          if (!['node_modules', '.git', 'dist', 'build', 'target', 'dist_electron'].includes(entry.name)) {
            walk(fullPath)
          }
        } else if (entry.isFile()) {
          const ext = extname(entry.name)
          if (extensions.includes(ext)) {
            files.push(fullPath)
          }
        }
      }
    } catch (error) {
      console.warn(colorize(`Warning: Cannot read directory ${currentDir}: ${error.message}`, 'yellow'))
    }
  }

  walk(dir)
  return files
}

function findKeyUsage(keys) {
  const usage = {}
  const dynamicPatterns = []

  keys.forEach(key => {
    usage[key] = {
      used: false,
      files: [],
      patterns: [],
      dynamicMatch: false
    }
  })

  console.log(colorize('\n🔍 Searching for key usage in source files...', 'blue'))

  const sourceFiles = findFiles(SRC_DIR)

  console.log(`  Found ${sourceFiles.length} source files to analyze`)

  const searchPatterns = [
    /\$T\s*\(\s*['"`]([^'"`]+)['"`]/g,
    /(?:^|[^a-zA-Z$])T\s*\(\s*['"`]([^'"`]+)['"`]/g,
    /\{\{\s*\$T\s*\(\s*['"`]([^'"`]+)['"`]/g,
    /i18nManager\.T\s*\(\s*['"`]([^'"`]+)['"`]/g
  ]

  const dynamicPattern = /\$T\s*\(\s*`([^`]*\$\{[^}]+\}[^`]*)`/g

  sourceFiles.forEach(filePath => {
    try {
      const content = readFileSync(filePath, 'utf8')
      const relativePath = relative(join(__dirname, '..'), filePath)

      searchPatterns.forEach((pattern, patternIndex) => {
        let match
        while ((match = pattern.exec(content)) !== null) {
          const key = match[1]
          if (usage[key]) {
            usage[key].used = true
            if (!usage[key].files.includes(relativePath)) {
              usage[key].files.push(relativePath)
            }
            if (!usage[key].patterns.includes(patternIndex)) {
              usage[key].patterns.push(patternIndex)
            }
          }
        }
      })

      let dynamicMatch
      while ((dynamicMatch = dynamicPattern.exec(content)) !== null) {
        const templateString = dynamicMatch[1]

        const staticParts = templateString.split(/\$\{[^}]+\}/)

        const patternInfo = {
          template: templateString,
          file: relativePath,
          staticParts
        }

        if (!dynamicPatterns.some(p => p.template === templateString && p.file === relativePath)) {
          dynamicPatterns.push(patternInfo)
        }

        keys.forEach(key => {
          if (matchesDynamicPattern(key, staticParts)) {
            if (usage[key]) {
              usage[key].used = true
              usage[key].dynamicMatch = true
              if (!usage[key].files.includes(relativePath)) {
                usage[key].files.push(relativePath)
              }
              if (!usage[key].patterns.includes('dynamic')) {
                usage[key].patterns.push('dynamic')
              }
            }
          }
        })
      }
    } catch (error) {
      console.error(colorize(`Error reading ${filePath}: ${error.message}`, 'red'))
    }
  })

  usage._dynamicPatterns = dynamicPatterns

  return usage
}

function matchesDynamicPattern(key, staticParts) {
  if (staticParts.length === 0) return false

  let keyIndex = 0

  for (let i = 0; i < staticParts.length; i++) {
    const part = staticParts[i]

    if (part === '') {
      if (i < staticParts.length - 1) {
        const nextPart = staticParts[i + 1]
        if (nextPart) {
          const nextIndex = key.indexOf(nextPart, keyIndex)
          if (nextIndex === -1) return false
          keyIndex = nextIndex
        }
      }
      continue
    }

    if (i === 0) {
      if (!key.startsWith(part)) return false
      keyIndex = part.length
    } else if (i === staticParts.length - 1) {
      if (part && !key.endsWith(part)) return false
    } else {
      const index = key.indexOf(part, keyIndex)
      if (index === -1) return false
      keyIndex = index + part.length
    }
  }

  return true
}

function findLocaleInconsistencies(localeData) {
  const locales = Object.keys(localeData)
  const inconsistencies = {}

  if (locales.length < 2) {
    return inconsistencies
  }

  locales.forEach(locale => {
    const currentKeys = new Set(localeData[locale].keys)
    inconsistencies[locale] = {
      missing: [],
      extra: []
    }

    locales.forEach(otherLocale => {
      if (locale !== otherLocale) {
        localeData[otherLocale].keys.forEach(key => {
          if (!currentKeys.has(key) && !inconsistencies[locale].missing.includes(key)) {
            inconsistencies[locale].missing.push(key)
          }
        })
      }
    })

    localeData[locale].keys.forEach(key => {
      const existsInOthers = locales.some(
        otherLocale => locale !== otherLocale && localeData[otherLocale].keys.includes(key)
      )
      if (!existsInOthers) {
        inconsistencies[locale].extra.push(key)
      }
    })
  })

  return inconsistencies
}

function deleteUnusedKeys(unusedKeys, localeData, isDryRun = false) {
  const results = {}

  Object.entries(localeData).forEach(([locale, data]) => {
    results[locale] = {
      deleted: [],
      errors: []
    }

    try {
      const updatedData = { ...data.data }

      unusedKeys.forEach(key => {
        if (key in updatedData) {
          if (!isDryRun) {
            delete updatedData[key]
          }
          results[locale].deleted.push(key)
        }
      })

      if (!isDryRun && results[locale].deleted.length > 0) {
        const yamlContent = dump(updatedData, {
          indent: 2,
          lineWidth: -1,
          noRefs: true,
          sortKeys: false
        })
        writeFileSync(data.file, yamlContent, 'utf8')
      }
    } catch (error) {
      results[locale].errors.push(`Failed to process ${locale}: ${error.message}`)
    }
  })

  return results
}

function main() {
  console.log(colorize('🌐 PicList - I18n Usage Analyzer', 'cyan'))
  console.log(colorize('==================================', 'cyan'))

  const { allKeys, localeData } = getAllI18nKeys()

  console.log(colorize(`\n📊 Total unique keys found: ${allKeys.length}`, 'yellow'))
  const usage = findKeyUsage(allKeys)
  const dynamicPatterns = usage._dynamicPatterns || []
  delete usage._dynamicPatterns

  const usedKeys = allKeys.filter(key => usage[key].used)
  const unusedKeys = allKeys.filter(key => !usage[key].used)
  const dynamicallyUsedKeys = usedKeys.filter(key => usage[key].dynamicMatch)
  const staticUsedKeys = usedKeys.filter(key => !usage[key].dynamicMatch)

  const inconsistencies = findLocaleInconsistencies(localeData)

  console.log(colorize('\n📈 Usage Summary:', 'blue'))
  console.log(`  ${colorize('✓', 'green')} Used keys: ${usedKeys.length}`)
  console.log(`    ${colorize('→', 'cyan')} Static usage: ${staticUsedKeys.length}`)
  console.log(`    ${colorize('→', 'magenta')} Dynamic usage: ${dynamicallyUsedKeys.length}`)
  console.log(`  ${colorize('✗', 'red')} Unused keys: ${unusedKeys.length}`)
  console.log(`  ${colorize('📊', 'yellow')} Usage rate: ${((usedKeys.length / allKeys.length) * 100).toFixed(1)}%`)

  if (dynamicPatterns.length > 0) {
    console.log(colorize('\n🔮 Dynamic I18n Patterns Detected:', 'magenta'))
    console.log(colorize('===================================', 'magenta'))

    dynamicPatterns.forEach((pattern, index) => {
      console.log(colorize(`\n${index + 1}. Template: \`${pattern.template}\``, 'cyan'))
      console.log(`   File: ${pattern.file}`)
      console.log(`   Static parts: [${pattern.staticParts.map(p => `"${p}"`).join(', ')}]`)

      const matchingKeys = allKeys.filter(key => matchesDynamicPattern(key, pattern.staticParts))
      if (matchingKeys.length > 0) {
        console.log(
          `   ${colorize('Matches', 'green')} (${matchingKeys.length}): ${matchingKeys.slice(0, 5).join(', ')}${
            matchingKeys.length > 5 ? '...' : ''
          }`
        )
      }
    })
  }

  if (unusedKeys.length > 0) {
    console.log(colorize('\n🗑️  Unused I18n Keys:', 'red'))
    console.log(colorize('====================', 'red'))

    const groupedUnused = {}
    unusedKeys.forEach(key => {
      const namespace = key.includes('.') ? key.split('.')[0] : 'ROOT'
      if (!groupedUnused[namespace]) {
        groupedUnused[namespace] = []
      }
      groupedUnused[namespace].push(key)
    })

    Object.entries(groupedUnused).forEach(([namespace, keys]) => {
      console.log(colorize(`\n[${namespace}] - ${keys.length} unused keys:`, 'yellow'))
      keys.forEach(key => {
        console.log(`  ${colorize('✗', 'red')} ${key}`)
      })
    })
  } else {
    console.log(colorize('\n🎉 No unused keys found! All i18n keys are being used.', 'green'))
  }

  const hasInconsistencies = Object.values(inconsistencies).some(inc => inc.missing.length > 0 || inc.extra.length > 0)

  if (hasInconsistencies) {
    console.log(colorize('\n⚠️  Locale Inconsistencies:', 'yellow'))
    console.log(colorize('=========================', 'yellow'))

    Object.entries(inconsistencies).forEach(([locale, data]) => {
      if (data.missing.length > 0 || data.extra.length > 0) {
        console.log(colorize(`\n[${locale}.yml]:`, 'cyan'))

        if (data.missing.length > 0) {
          console.log(colorize(`  Missing ${data.missing.length} keys:`, 'red'))
          data.missing.forEach(key => {
            console.log(`    ${colorize('✗', 'red')} ${key}`)
          })
        }

        if (data.extra.length > 0) {
          console.log(colorize(`  Extra ${data.extra.length} keys:`, 'blue'))
          data.extra.forEach(key => {
            console.log(`    ${colorize('!', 'blue')} ${key}`)
          })
        }
      }
    })
  }

  if (isVerbose) {
    console.log(colorize('\n📋 Sample Used Keys (first 10):', 'blue'))
    console.log(colorize('=================================', 'blue'))

    usedKeys.slice(0, 10).forEach(key => {
      const files = usage[key].files.slice(0, 3)
      const moreFiles = usage[key].files.length > 3 ? ` (+${usage[key].files.length - 3} more)` : ''
      const usageType = usage[key].dynamicMatch ? colorize('(dynamic)', 'magenta') : colorize('(static)', 'cyan')
      console.log(`  ${colorize('✓', 'green')} ${key} ${usageType}`)
      console.log(`    Used in: ${files.join(', ')}${moreFiles}`)
    })

    if (dynamicallyUsedKeys.length > 0) {
      console.log(colorize('\n🔮 Dynamic Key Usage Details:', 'magenta'))
      console.log(colorize('=============================', 'magenta'))

      dynamicallyUsedKeys.slice(0, 5).forEach(key => {
        const files = usage[key].files.slice(0, 2)
        console.log(`  ${colorize('✨', 'magenta')} ${key}`)
        console.log(`    Files: ${files.join(', ')}`)
      })

      if (dynamicallyUsedKeys.length > 5) {
        console.log(`    ... and ${dynamicallyUsedKeys.length - 5} more dynamic keys`)
      }
    }
  }

  if (shouldDelete && unusedKeys.length > 0) {
    console.log(colorize('\n🗑️  Deleting Unused Keys:', 'yellow'))
    console.log(colorize('=========================', 'yellow'))

    if (isDryRun) {
      console.log(colorize('🔍 DRY RUN MODE - No files will be modified', 'cyan'))
    }

    const deletionResults = deleteUnusedKeys(unusedKeys, localeData, isDryRun)

    Object.entries(deletionResults).forEach(([locale, result]) => {
      console.log(colorize(`\n[${locale}.yml]:`, 'cyan'))
      if (result.deleted.length > 0) {
        console.log(colorize(`  Deleted ${result.deleted.length} keys:`, 'green'))
        result.deleted.forEach(key => {
          console.log(`    ${colorize('✓', 'green')} ${key}`)
        })
      }
      if (result.errors.length > 0) {
        console.log(colorize(`  Errors ${result.errors.length}:`, 'red'))
        result.errors.forEach(error => {
          console.log(`    ${colorize('✗', 'red')} ${error}`)
        })
      }
    })

    if (!isDryRun) {
      console.log(colorize('\n✨ Deletion complete! Remember to regenerate type definitions.', 'green'))
      console.log(colorize('💡 Run `yarn i18n` to update TypeScript types', 'blue'))
    }
  }

  console.log(colorize('\n✨ Analysis complete!', 'cyan'))

  if (unusedKeys.length > 0 && !shouldDelete) {
    console.log(colorize('\n💡 Tips:', 'blue'))
    console.log(colorize('- Run with --verbose (-v) flag to see usage details of used keys', 'blue'))
    console.log(colorize('- Run with --delete (-d) flag to automatically remove unused keys', 'blue'))
    console.log(colorize('- Run with --delete --dry-run to preview what would be deleted', 'blue'))
  } else if (unusedKeys.length === 0) {
    console.log(colorize('\n💡 Tip: Run with --verbose (-v) flag to see usage details of used keys', 'blue'))
  }

  if (unusedKeys.length > 0 && !shouldDelete) {
    process.exit(1)
  }
}

main()
