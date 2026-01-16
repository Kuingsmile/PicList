import dotenv from 'dotenv'
import { fileList } from './config.js'
import fs from 'fs-extra'
import mime from 'mime'
import path from 'node:path'
import { S3Client } from '@aws-sdk/client-s3'
import { Upload } from '@aws-sdk/lib-storage'

dotenv.config()

const bucket = 'piclist-dl'
const folder = `latest/`
const R2_SECRET_ID = process.env.R2_SECRET_ID
const R2_SECRET_KEY = process.env.R2_SECRET_KEY
const R2_ACCOUNT_ID = process.env.R2_ACCOUNT_ID

console.log('fileList to upload:', JSON.stringify(fileList, null, 2))

const ymlFileList = ['latest-mac.yml', 'latest.yml', 'latest-linux.yml', 'latest-linux-arm64.yml']

const args = process.argv.slice(2)
const exePath = args[0] || './artifacts'
const ymlPath = args[1] || './dist_electron/combined'
const idDev = args[2] || true

const S3Options = {
  credentials: {
    accessKeyId: R2_SECRET_ID,
    secretAccessKey: R2_SECRET_KEY,
  },
  endpoint: `https://${R2_ACCOUNT_ID}.r2.cloudflarestorage.com`,
  sslEnabled: true,
  region: 'auto',
}

const uploadFile = async filePath => {
  try {
    console.log('[INFO]: uploading file:', filePath)
    const client = new S3Client(S3Options)
    if (fs.existsSync(filePath)) {
      const uploadDistToS3 = new Upload({
        client,
        params: {
          Bucket: bucket,
          Key: `${folder}${path.basename(filePath)}`,
          Body: fs.createReadStream(filePath),
          ContentType: path.basename(filePath).endsWith('.yml')
            ? mime.getType(path.basename(filePath))
            : 'application/octet-stream',
        },
      })
      uploadDistToS3.on('httpUploadProgress', progress => {
        console.log(`[INFO]: ${path.basename(filePath)} - ${progress.loaded}/${progress.total}`)
      })
      if (idDev) {
        console.log('[DEV]: upload params:', {
          Bucket: bucket,
          Key: `${folder}${path.basename(filePath)}`,
          Body: '<<stream>>',
          ContentType: path.basename(filePath).endsWith('.yml')
            ? mime.getType(path.basename(filePath))
            : 'application/octet-stream',
        })
      } else {
        await uploadDistToS3.done()
      }
    } else {
      console.warn('[Warn] File not found:', filePath)
    }
  } catch (e) {
    console.error('[ERROR]: upload failed:', e)
  }
}

const upload = async () => {
  console.log('[INFO]: Starting upload to S3...')
  console.log('[INFO]: upload exePath:', exePath)
  for (const file of fileList) {
    const installerPath = path.join(exePath, file.path)
    await uploadFile(installerPath)
  }

  console.log('[INFO]: upload blockmap files...')
  for (const file of fileList) {
    const installerPath = path.join(exePath, file.blockMapPath)
    await uploadFile(installerPath)
  }

  for (const ymlFile of ymlFileList) {
    const ymlFilePath = path.join(ymlPath, ymlFile)
    await uploadFile(ymlFilePath)
  }
}

const main = async () => {
  await upload()
}

main()
