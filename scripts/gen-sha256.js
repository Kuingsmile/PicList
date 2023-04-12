const crypto = require('crypto')
const os = require('os')
const path = require('path')
const axios = require('axios')
const fs = require('fs-extra')
const pkg = require('../package.json')
const version = pkg.version

const x64URL = `https://release.piclist.cn/latest/PicList-${version}-x64.dmg`
const arm64URL = `https://release.piclist.cn/latest/PicList-${version}-arm64.dmg`
const x64Path = path.join(os.homedir(), 'Downloads', 'PicList-x64.dmg')
const arm64Path = path.join(os.homedir(), 'Downloads', 'PicList-arm64.dmg')

const downloadAndHash = async (url, path) => {
  try {
    const response = await axios({
      method: 'get',
      url,
      responseType: 'stream'
    })
    const writer = fs.createWriteStream(path)
    response.data.pipe(writer)

    const hash = crypto.createHash('sha256')
    const progressTotal = parseInt(response.headers['content-length'], 10)
    let progressCurrent = 0
    console.log('\n')

    response.data.on('data', (chunk) => {
      hash.update(chunk)
      progressCurrent += chunk.length
      const progressBar = Math.round(progressCurrent / progressTotal * 100)
      process.stdout.write(`\r${progressBar}% ${path}`)
    })

    await new Promise((resolve, reject) => {
      response.data.on('end', () => {
        resolve()
      })
      response.data.on('error', (err) => {
        reject(err)
      })
    })

    console.log(`\n${path} SHA256: ${hash.digest('hex')}`)

    await fs.remove(path)
    console.log(`Deleted ${path}`)
  } catch (err) {
    console.error(`\nError downloading ${url}: ${err.message}`)
  }
}

downloadAndHash(x64URL, x64Path).then(() => {
  downloadAndHash(arm64URL, arm64Path)
}).catch(() => {
  downloadAndHash(arm64URL, arm64Path)
})
