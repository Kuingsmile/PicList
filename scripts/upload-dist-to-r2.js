// upload dist bundled-app to r2
require('dotenv').config()

const S3Client = require('@aws-sdk/client-s3')
const Upload = require('@aws-sdk/lib-storage')
const pkg = require('../package.json')
const configList = require('./config')
const fs = require('fs')
const path = require('path')
const yaml = require('js-yaml')
const mime = require('mime-types')

const BUCKET = 'piclist-dl'
const VERSION = pkg.version
const FILE_PATH = 'latest/'
const ACCOUNT_ID = process.env.R2_ACCOUNT_ID
const SECRET_ID = process.env.R2_SECRET_ID
const SECRET_KEY = process.env.R2_SECRET_KEY

const options = {
  credentials: {
    accessKeyId: SECRET_ID,
    secretAccessKey: SECRET_KEY
  },
  endpoint: `https://${ACCOUNT_ID}.r2.cloudflarestorage.com`,
  tls: true,
  region: 'auto'
}

const removeDupField = path => {
  const file = fs.readFileSync(path, 'utf8')
  const data = yaml.load(file)
  const filesMap = {}
  data.files.forEach(file => {
    const key = file.url + file.sha512 + file.size
    filesMap[key] = file
  })
  data.files = Object.values(filesMap)
  const newYml = yaml.dump(data, { lineWidth: -1 })
  fs.writeFileSync(path, newYml, 'utf8')
}

const uploadFile = async () => {
  try {
    const platform = process.platform
    if (!configList[platform]) {
      console.warn('platform not supported!', platform)
      return
    }
    let versionFileHasUploaded = false
    for (const [index, config] of configList[platform].entries()) {
      const fileName = `${config.appNameWithPrefix}${VERSION}${config.arch}${config.ext}`
      const distPath = path.join(__dirname, '../dist_electron')
      const versionFileName = config['version-file']

      console.log('[PicList Dist] Uploading...', fileName, `${index + 1}/${configList[platform].length}`)
      const fileStream = fs.createReadStream(path.join(distPath, fileName))
      const client = new S3Client.S3Client(options)

      const parallelUploads3 = new Upload.Upload({
        client,
        params: {
          Bucket: BUCKET,
          Key: `${FILE_PATH}${fileName}`,
          Body: fileStream,
          ContentType: 'application/octet-stream',
          Metadata: {
            description: 'uploaded by PicList'
          }
        }
      })
      parallelUploads3.on('httpUploadProgress', progress => {
        const progressBar = Math.round((progress.loaded / progress.total) * 100)
        process.stdout.write(`\r${progressBar}% ${fileName}`)
      })
      console.log('\n')
      await parallelUploads3.done()
      console.log(`${fileName} uploaded!`)

      if (!versionFileHasUploaded) {
        console.log('[PicList Version File] Uploading...', versionFileName)
        let versionFilePath
        if (platform === 'win32') {
          versionFilePath = path.join(distPath, 'latest.yml')
        } else if (platform === 'darwin') {
          versionFilePath = path.join(distPath, 'latest-mac.yml')
        } else {
          versionFilePath = path.join(distPath, 'latest-linux.yml')
        }
        removeDupField(versionFilePath)
        const versionFileStream = fs.createReadStream(versionFilePath)
        const uploadVersionFileToRoot = new Upload.Upload({
          client,
          params: {
            Bucket: BUCKET,
            Key: `${versionFileName}`,
            Body: versionFileStream,
            ContentType: mime.lookup(versionFileName),
            Metadata: {
              description: 'uploaded by PicList'
            }
          }
        })
        console.log('\nUploading version file to root...')
        await uploadVersionFileToRoot.done()
        console.log(`${versionFileName} uploaded!`)
        versionFileStream.close()
        const versionFileStream2 = fs.createReadStream(versionFilePath)
        const uploadVersionFileToLatest = new Upload.Upload({
          client,
          params: {
            Bucket: BUCKET,
            Key: `${FILE_PATH}${versionFileName}`,
            Body: versionFileStream2,
            ContentType: mime.lookup(versionFileName),
            Metadata: {
              description: 'uploaded by PicList'
            }
          }
        })
        console.log('\nUploading version file to latest...')
        await uploadVersionFileToLatest.done()
        console.log(`${versionFileName} uploaded!`)
        versionFileStream2.close()
        versionFileHasUploaded = true
      }
    }
  } catch (err) {
    console.error(err)
  }
}
uploadFile()
