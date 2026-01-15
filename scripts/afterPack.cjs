const fs = require('node:fs')
const path = require('node:path')

async function main(context) {
  const { appOutDir, targets } = context
  const localeDir = appOutDir + '/locales/'

  fs.readdir(localeDir, function (_err, files) {
    if (!(files && files.length)) return
    for (let i = 0, len = files.length; i < len; i++) {
      if (!(files[i].startsWith('en') || files[i].startsWith('zh'))) {
        fs.unlinkSync(localeDir + files[i])
      }
    }
  })
  const isZip = targets.some(target => target.name === 'zip' || target.name === '7z')
  if (isZip) {
    const portablePath = path.join(appOutDir, 'PORTABLE')
    try {
      fs.writeFileSync(portablePath, '')
      console.log('Created portable marker file at', portablePath)
    } catch (err) {
      console.error('Error creating portable marker file:', err)
    }
  }
}

exports.default = main
