const crypto = require('crypto')
const os = require('os')
const path = require('path')
const axios = require('axios')
const fs = require('fs-extra')
const pkg = require('../package.json')
const version = process.argv[2] || pkg.version

// Configuration
const BASE_URL = `https://github.com/Kuingsmile/PicList/releases/download/v${version}`
const DOWNLOAD_DIR = process.argv[3] || path.join(os.homedir(), 'Downloads')
// File information
const files = [
  {
    name: 'PicList-x64.dmg',
    url: `${BASE_URL}/PicList-${version}-x64.dmg`
  },
  {
    name: 'PicList-arm64.dmg',
    url: `${BASE_URL}/PicList-${version}-arm64.dmg`
  }
]

/**
 * Create progress bar string
 */
function getProgressBar(current, total, length = 20) {
  const progress = Math.round((current / total) * length)
  const percentage = Math.round((current / total) * 100)
  const bar = '█'.repeat(progress) + '░'.repeat(length - progress)
  return `[${bar}] ${percentage}% (${formatBytes(current)}/${formatBytes(total)})`
}

/**
 * Format bytes to human-readable format
 */
function formatBytes(bytes, decimals = 2) {
  if (bytes === 0) return '0 Bytes'
  const k = 1024
  const sizes = ['Bytes', 'KB', 'MB', 'GB']
  const i = Math.floor(Math.log(bytes) / Math.log(k))
  return parseFloat((bytes / Math.pow(k, i)).toFixed(decimals)) + ' ' + sizes[i]
}

/**
 * Download file and calculate SHA256 hash
 */
async function downloadAndHash(fileInfo) {
  const { url, name } = fileInfo
  const filePath = path.join(DOWNLOAD_DIR, name)

  console.log(`\nStarting download: ${name} from ${url}`)

  try {
    const response = await axios({
      method: 'get',
      url,
      responseType: 'stream'
    })

    const writer = fs.createWriteStream(filePath)
    response.data.pipe(writer)

    const hash = crypto.createHash('sha256')
    const progressTotal = parseInt(response.headers['content-length'], 10)
    let progressCurrent = 0

    response.data.on('data', chunk => {
      hash.update(chunk)
      progressCurrent += chunk.length
      process.stdout.write(`\r${name}: ${getProgressBar(progressCurrent, progressTotal)}`)
    })

    await new Promise((resolve, reject) => {
      writer.on('finish', resolve)
      writer.on('error', reject)
      response.data.on('error', reject)
    })

    const hashValue = hash.digest('hex')
    console.log(`\n✅ ${name} SHA256: ${hashValue}`)

    // Write hash to a file for reference
    await fs.writeFile(`${filePath}.sha256`, hashValue)
    console.log(`Hash saved to ${filePath}.sha256`)

    if (process.argv.includes('--keep-files')) {
      console.log(`Keeping file: ${filePath}`)
    } else {
      await fs.remove(filePath)
      console.log(`Deleted: ${filePath}`)
    }

    return { name, hash: hashValue }
  } catch (err) {
    console.error(`\n❌ Error processing ${name}: ${err.message}`)
    throw err
  }
}

/**
 * Main function
 */
async function main() {
  console.log(`Generating SHA256 hashes for PicList v${version}`)
  console.log(`Download directory: ${DOWNLOAD_DIR}`)

  try {
    // Ensure download directory exists
    await fs.ensureDir(DOWNLOAD_DIR)

    // Start all downloads concurrently
    const results = await Promise.allSettled(files.map(downloadAndHash))

    // Output summary
    console.log('\n===== SUMMARY =====')
    results.forEach((result, index) => {
      const fileName = files[index].name
      if (result.status === 'fulfilled') {
        console.log(`✅ ${fileName}: ${result.value.hash}`)
      } else {
        console.log(`❌ ${fileName}: Failed - ${result.reason.message}`)
      }
    })

    // Check if all downloads were successful
    if (results.some(r => r.status === 'rejected')) {
      process.exit(1)
    }
  } catch (err) {
    console.error(`\nCritical error: ${err.message}`)
    process.exit(1)
  }
}

main()
