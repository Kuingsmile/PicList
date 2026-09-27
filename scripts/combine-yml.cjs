const fs = require('node:fs')
const path = require('node:path')
const { parseArgs } = require('node:util')
const yaml = require('js-yaml')

function removeDuplicates(files) {
  if (!files || !Array.isArray(files)) return files

  const seen = new Map()
  return files.filter(file => {
    if (!file || typeof file.url !== 'string' || typeof file.sha512 !== 'string') {
      throw new Error('Invalid updater file entry')
    }
    const previous = seen.get(file.url)
    if (previous) {
      if (previous.sha512 !== file.sha512 || previous.size !== file.size) {
        throw new Error('Conflicting duplicate updater file entries')
      }
      return false
    }
    seen.set(file.url, file)
    return true
  })
}

function combineYmlFiles(sources, distPath, version) {
  let combinedData = null

  for (const source of sources) {
    const ymlFile = path.join(distPath, source.path)
    const stat = fs.lstatSync(ymlFile)
    if (!stat.isFile() || stat.size === 0 || stat.size > 1024 * 1024) {
      throw new Error('Expected a nonempty regular updater manifest of at most 1 MiB')
    }
    const content = fs.readFileSync(ymlFile, 'utf8')
    const data = yaml.load(content)
    if (!data || data.version !== version || !Array.isArray(data.files) || data.files.length === 0) {
      throw new Error('Invalid updater metadata')
    }
    data.files = removeDuplicates(data.files)
    if (data.files.length !== source.files.length || data.files.some(file => !source.files.includes(file.url))) {
      throw new Error('Updater metadata does not match the selected build binaries')
    }

    if (!combinedData) {
      combinedData = data
    } else {
      combinedData.files.push(...data.files)

      if (
        data.releaseDate &&
        (!combinedData.releaseDate || new Date(data.releaseDate) > new Date(combinedData.releaseDate))
      ) {
        combinedData.releaseDate = data.releaseDate
      }
    }
  }

  combinedData.files = removeDuplicates(combinedData.files)
  return yaml.dump(combinedData, { lineWidth: -1 })
}

async function combineSelectedYml(distPath, outputDir, build = 'All') {
  const { selectManifest } = await import('./config.js')
  const manifest = selectManifest(build)
  // Use exact artifact directories, never substring matches or the set of files
  // that happened to arrive. All requires every metadata-producing matrix job.
  // Read and validate every source before writing any combined channel.
  const combined = manifest.metadata.map(metadata => ({
    name: metadata.name,
    content: combineYmlFiles(metadata.sources, distPath, manifest.version),
  }))
  fs.mkdirSync(outputDir, { recursive: true })
  // Refuse a reused output directory containing channels from another selection.
  if (
    fs.readdirSync(outputDir).some(name => /^latest.*\.yml$/.test(name) && !combined.some(file => file.name === name))
  ) {
    throw new Error('Output directory contains an unselected updater channel')
  }
  for (const file of combined) {
    fs.writeFileSync(path.join(outputDir, file.name), file.content, 'utf8')
  }
  return combined.map(file => path.join(outputDir, file.name))
}

async function main() {
  const { values, positionals } = parseArgs({
    allowPositionals: true,
    options: { build: { type: 'string', default: 'All' } },
  })
  if (positionals.length > 2) throw new Error('Expected an input directory and an output directory')
  const [distPath = './yml-artifacts', outputDir = './dist_electron/combined'] = positionals
  const files = await combineSelectedYml(distPath, outputDir, values.build)
  console.log(`Combined ${files.length} expected updater manifests`)
  if (files.length === 0) console.log('No updater YAML is expected for this portable or Snap selection')
}

module.exports = { combineSelectedYml }

if (require.main === module) {
  main().catch(() => {
    // YAML parser errors may contain document contents. Keep diagnostics safe for CI logs.
    console.error('Updater metadata combination failed: check required sources, versions, entries and checksums')
    process.exitCode = 1
  })
}
