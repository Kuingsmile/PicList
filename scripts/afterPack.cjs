const fs = require('node:fs')

async function main(context) {
  const localeDir = context.appOutDir + '/locales/'

  fs.readdir(localeDir, function (_err, files) {
    if (!(files && files.length)) return
    for (let i = 0, len = files.length; i < len; i++) {
      if (!(files[i].startsWith('en') || files[i].startsWith('zh'))) {
        fs.unlinkSync(localeDir + files[i])
      }
    }
  })
}

exports.default = main
