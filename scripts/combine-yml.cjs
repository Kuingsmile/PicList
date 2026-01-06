const fs = require('fs')
const path = require('path')
const yaml = require('js-yaml')

function removeDuplicates(files) {
  if (!files || !Array.isArray(files)) return files

  const seen = new Set()
  return files.filter(file => {
    if (seen.has(file.url)) {
      return false
    }
    seen.add(file.url)
    return true
  })
}

function combineYmlFiles(ymlFiles, outputPath) {
  if (ymlFiles.length === 0) {
    console.log(`No yml files found for ${outputPath}`)
    return
  }

  let combinedData = null

  for (const ymlFile of ymlFiles) {
    const content = fs.readFileSync(ymlFile, 'utf8')
    const data = yaml.load(content)

    if (!combinedData) {
      combinedData = data
    } else {
      if (data.files && Array.isArray(data.files)) {
        combinedData.files = [...(combinedData.files || []), ...data.files]
      }

      if (
        data.releaseDate &&
        (!combinedData.releaseDate || new Date(data.releaseDate) > new Date(combinedData.releaseDate))
      ) {
        combinedData.releaseDate = data.releaseDate
      }
    }
  }

  if (combinedData && combinedData.files) {
    combinedData.files = removeDuplicates(combinedData.files)
  }

  const ymlContent = yaml.dump(combinedData, { lineWidth: -1 })
  fs.writeFileSync(outputPath, ymlContent, 'utf8')
  console.log(`Created ${outputPath} with ${combinedData?.files?.length || 0} file entries`)
}

function processSingleYmlFile(ymlFile, outputPath) {
  if (!fs.existsSync(ymlFile)) {
    console.log(`File not found: ${ymlFile}`)
    return
  }

  const content = fs.readFileSync(ymlFile, 'utf8')
  const data = yaml.load(content)

  if (data && data.files) {
    data.files = removeDuplicates(data.files)
  }

  const ymlContent = yaml.dump(data, { lineWidth: -1 })
  fs.writeFileSync(outputPath, ymlContent, 'utf8')
  console.log(`Processed ${outputPath} with ${data?.files?.length || 0} file entries`)
}

function findYmlInFolder(basePath, folderPattern, ymlFileName) {
  const folders = fs.existsSync(basePath)
    ? fs.readdirSync(basePath).filter(f => {
        const fullPath = path.join(basePath, f)
        return fs.statSync(fullPath).isDirectory() && f.includes(folderPattern)
      })
    : []

  const ymlFiles = []
  for (const folder of folders) {
    const ymlPath = path.join(basePath, folder, ymlFileName)
    if (fs.existsSync(ymlPath)) {
      ymlFiles.push(ymlPath)
    }
  }
  return ymlFiles
}

function main() {
  const distPath = process.argv[2] || './dist_electron'
  const outputDir = process.argv[3] || './dist_electron/combined'

  console.log(`Processing yml files from: ${distPath}`)
  console.log(`Output directory: ${outputDir}`)

  if (!fs.existsSync(outputDir)) {
    fs.mkdirSync(outputDir, { recursive: true })
  }

  const windowsX64Ymls = findYmlInFolder(distPath, 'windows-x64-yml', 'latest.yml')
  const windowsArm64Ymls = findYmlInFolder(distPath, 'windows-arm64-yml', 'latest.yml')
  const macX64Ymls = findYmlInFolder(distPath, 'macos-x64-yml', 'latest-mac.yml')
  const macArm64Ymls = findYmlInFolder(distPath, 'macos-arm64-yml', 'latest-mac.yml')
  const linuxX64Ymls = findYmlInFolder(distPath, 'linux-x64-yml', 'latest-linux.yml')
  const linuxArm64Ymls = findYmlInFolder(distPath, 'linux-arm64-yml', 'latest-linux-arm64.yml')

  console.log('\nFound yml files:')
  console.log(`Windows x64: ${windowsX64Ymls.map(f => path.basename(path.dirname(f))).join(', ')}`)
  console.log(`Windows ARM64: ${windowsArm64Ymls.map(f => path.basename(path.dirname(f))).join(', ')}`)
  console.log(`macOS x64: ${macX64Ymls.map(f => path.basename(path.dirname(f))).join(', ')}`)
  console.log(`macOS ARM64: ${macArm64Ymls.map(f => path.basename(path.dirname(f))).join(', ')}`)
  console.log(`Linux x64: ${linuxX64Ymls.map(f => path.basename(path.dirname(f))).join(', ')}`)
  console.log(`Linux ARM64: ${linuxArm64Ymls.map(f => path.basename(path.dirname(f))).join(', ')}`)

  const windowsYmls = [...windowsX64Ymls, ...windowsArm64Ymls]
  if (windowsYmls.length > 0) {
    console.log(`\nCombining ${windowsYmls.length} Windows yml files...`)
    combineYmlFiles(windowsYmls, path.join(outputDir, 'latest.yml'))
  } else {
    console.log('\nNo Windows yml files found to combine')
  }

  const macYmls = [...macX64Ymls, ...macArm64Ymls]
  if (macYmls.length > 0) {
    console.log(`\nCombining ${macYmls.length} macOS yml files...`)
    combineYmlFiles(macYmls, path.join(outputDir, 'latest-mac.yml'))
  } else {
    console.log('\nNo macOS yml files found to combine')
  }
  if (linuxX64Ymls.length > 0) {
    console.log('\nProcessing Linux x64 yml file (deduplicate only)...')
    processSingleYmlFile(linuxX64Ymls[0], path.join(outputDir, 'latest-linux.yml'))
  } else {
    console.log('\nNo Linux x64 yml files found')
  }
  if (linuxArm64Ymls.length > 0) {
    console.log('\nProcessing Linux ARM64 yml file (deduplicate only)...')
    processSingleYmlFile(linuxArm64Ymls[0], path.join(outputDir, 'latest-linux-arm64.yml'))
  } else {
    console.log('\nNo Linux ARM64 yml files found')
  }

  console.log('\nYML combination and deduplication complete!')
}

main()
