// upload dist bundled-app to r2
require('dotenv').config()
const S3Client = require('@aws-sdk/client-s3')
const Upload = require('@aws-sdk/lib-storage')
const pkg = require('../package.json')
const configList = require('./config')
const fs = require('fs')
const path = require('path')

const BUCKET = 'piclist-dl'
const VERSION = pkg.version
const FILE_PATH = 'beta/'
const ACCOUNT_ID = process.env.R2_ACCOUNT_ID
const SECRET_ID = process.env.R2_SECRET_ID
const SECRET_KEY = process.env.R2_SECRET_KEY

const uploadFile = async () => {
  try {
    const platform = process.platform
    if (configList[platform]) {
      for (const [index, config] of configList[platform].entries()) {
        const fileName = `${config.appNameWithPrefix}${VERSION}${config.arch}${config.ext}`
        const distPath = path.join(__dirname, '../dist_electron')
        console.log('[PicList Dist] Uploading...', fileName, `${index + 1}/${configList[platform].length}`)
        const fileStream = fs.createReadStream(path.join(distPath, fileName))
        const options = {
          credentials: {
            accessKeyId: SECRET_ID,
            secretAccessKey: SECRET_KEY
          },
          endpoint: `https://${ACCOUNT_ID}.r2.cloudflarestorage.com`,
          sslEnabled: true,
          region: 'us-east-1'
        }
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
        parallelUploads3.on('httpUploadProgress', (progress) => {
          const progressBar = Math.round((progress.loaded / progress.total) * 100)
          process.stdout.write(`\r${progressBar}% ${fileName}`)
        })
        console.log('\n')
        await parallelUploads3.done()
        console.log(`${fileName} uploaded!`)
      }
    } else {
      console.warn('platform not supported!', platform)
    }
  } catch (err) {
    console.error(err)
  }
}
uploadFile()
