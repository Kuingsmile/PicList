import { createHash, randomUUID } from 'node:crypto'
import { createReadStream } from 'node:fs'
import { appendFile, lstat, readdir, readFile } from 'node:fs/promises'
import path from 'node:path'
import { pathToFileURL } from 'node:url'
import { parseArgs } from 'node:util'

import { CopyObjectCommand, GetObjectCommand, PutObjectCommand, S3Client } from '@aws-sdk/client-s3'
import { Upload } from '@aws-sdk/lib-storage'
import { NodeHttpHandler } from '@smithy/node-http-handler'
import dotenv from 'dotenv'
import semver from 'semver'
import YAML from 'yaml'

import { selectFiles, version } from './config.js'

const BUCKET = 'piclist-dl'
const CONCURRENCY = 3
const MAX_METADATA_SIZE = 1024 * 1024
// CopyObject supports objects up to 5 GiB; larger installers need multipart copy.
const MAX_ARTIFACT_SIZE = 5 * 1024 ** 3
const IMMUTABLE_CACHE = 'public, max-age=31536000, immutable'
const METADATA_CACHE = 'no-cache, no-store, must-revalidate'

class PublicationError extends Error {}

const fail = message => {
  throw new PublicationError(message)
}

async function boundedMap(items, operation) {
  let next = 0
  let failure
  const results = new Array(items.length)
  // Drain in-flight work before returning an error or destroying the shared client.
  await Promise.all(
    Array.from({ length: Math.min(CONCURRENCY, items.length) }, async () => {
      while (!failure && next < items.length) {
        const index = next++
        try {
          results[index] = await operation(items[index])
        } catch (error) {
          failure ??= error
        }
      }
    }),
  )
  if (failure) throw failure
  return results
}

async function digest(body, limit) {
  const hash = createHash('sha512')
  let size = 0
  for await (const chunk of body) {
    size += chunk.length
    if (size > limit) fail('Object exceeds its expected size')
    hash.update(chunk)
  }
  return { size, sha512: hash.digest('base64') }
}

async function inspectFile(filePath, optional = false) {
  let stat
  try {
    stat = await lstat(filePath)
  } catch (error) {
    if (optional && error.code === 'ENOENT') return undefined
    fail('A required release file is missing or unreadable')
  }
  if (!stat.isFile() || stat.size === 0 || stat.size > MAX_ARTIFACT_SIZE) {
    fail('Release files must be nonempty regular files of at most 5 GiB')
  }
  return { filePath, name: path.basename(filePath), ...(await digest(createReadStream(filePath), stat.size)) }
}

function parseMetadata(body) {
  try {
    const document = YAML.parseDocument(body.toString('utf8'))
    if (document.errors.length) fail('Invalid updater YAML')
    const data = document.toJS({ maxAliasCount: 0 })
    if (!data || typeof data !== 'object' || !semver.valid(data.version)) fail('Invalid updater version')
    return data
  } catch {
    // Parser diagnostics can contain file contents; never print them.
    fail('Invalid updater YAML or version')
  }
}

function validateMetadata(data, expectedFiles) {
  if (data.version !== version) fail('Updater metadata version does not match package.json')
  if (!Array.isArray(data.files) || data.files.length === 0) fail('Updater metadata has no files')
  // NSIS web packages are not built by this project. Reject rather than publish unvalidated references.
  if (data.packages !== undefined) fail('Updater packages are not supported by this release manifest')
  const expected = new Map(expectedFiles.map(file => [file.name, file]))
  const seen = new Set()
  for (const entry of data.files) {
    const file = expected.get(entry?.url)
    if (!file || seen.has(entry.url)) fail('Updater metadata has an unknown or duplicate binary reference')
    if (entry.sha512 !== file.sha512 || (entry.size !== undefined && entry.size !== file.size)) {
      fail('Updater metadata checksum or size does not match a release binary')
    }
    seen.add(entry.url)
  }
  if (seen.size !== expected.size) fail('Updater metadata omits a selected binary')
  if (data.path !== undefined || data.sha512 !== undefined) {
    const legacyFile = expected.get(data.path)
    if (!legacyFile || data.sha512 !== legacyFile.sha512) fail('Invalid legacy updater path or checksum')
  }
}

export async function validateManifest({
  artifactDir = './artifacts',
  metadataDir = './dist_electron/combined',
  build = 'All',
} = {}) {
  if (!semver.valid(version)) fail('Invalid package.json release version')
  let selected
  try {
    selected = selectFiles(build)
  } catch {
    fail('Unknown release build selection')
  }
  const binaries = await boundedMap(selected, async file => ({
    ...file,
    ...(await inspectFile(path.join(artifactDir, file.path))),
  }))
  const blockmaps = (
    await boundedMap(selected, file => inspectFile(path.join(artifactDir, file.blockMapPath), true))
  ).filter(Boolean)
  const metadataNames = [...new Set(selected.map(file => file.metadata).filter(Boolean))]
  let entries = []
  try {
    entries = await readdir(metadataDir)
  } catch (error) {
    if (error.code !== 'ENOENT' || metadataNames.length > 0) fail('Required updater metadata directory is unavailable')
  }
  if (entries.some(name => /^latest.*\.yml$/.test(name) && !metadataNames.includes(name))) {
    fail('Updater metadata contains an unselected channel')
  }
  const metadata = await boundedMap(metadataNames, async name => {
    const file = await inspectFile(path.join(metadataDir, name))
    if (file.size > MAX_METADATA_SIZE) fail('Updater metadata exceeds 1 MiB')
    const body = await readFile(file.filePath)
    validateMetadata(
      parseMetadata(body),
      binaries.filter(binary => binary.metadata === name),
    )
    return { ...file, body }
  })
  return { version, build, binaries, blockmaps, metadata }
}

function assertPromotion(manifest, releaseTag) {
  if (manifest.build !== 'All') fail('Only an All build may promote shared latest metadata')
  if (semver.prerelease(manifest.version) || releaseTag !== `v${manifest.version}`) {
    fail('Latest promotion requires a stable version and its matching v<version> GitHub release tag')
  }
}

export function createStorage(
  env = process.env,
  requestHandler = new NodeHttpHandler({ connectionTimeout: 10_000, socketTimeout: 120_000 }),
) {
  if (['R2_SECRET_ID', 'R2_SECRET_KEY', 'R2_ACCOUNT_ID'].some(key => !env[key]?.trim())) {
    fail('R2_SECRET_ID, R2_SECRET_KEY and R2_ACCOUNT_ID are required')
  }
  const client = new S3Client({
    credentials: { accessKeyId: env.R2_SECRET_ID, secretAccessKey: env.R2_SECRET_KEY },
    endpoint: `https://${env.R2_ACCOUNT_ID}.r2.cloudflarestorage.com`,
    region: 'auto',
    maxAttempts: 3,
    retryMode: 'standard',
    requestChecksumCalculation: 'WHEN_REQUIRED',
    responseChecksumValidation: 'WHEN_REQUIRED',
    requestHandler,
  })
  return {
    async upload(file, key) {
      const body = createReadStream(file.filePath)
      try {
        await new Upload({
          client,
          queueSize: 2,
          partSize: 8 * 1024 * 1024,
          leavePartsOnError: false,
          params: {
            Bucket: BUCKET,
            Key: key,
            Body: body,
            ContentLength: file.size,
            ContentType: file.body ? 'application/yaml' : 'application/octet-stream',
            CacheControl: IMMUTABLE_CACHE,
          },
        }).done()
      } finally {
        body.destroy()
      }
    },
    async get(key) {
      try {
        return await client.send(new GetObjectCommand({ Bucket: BUCKET, Key: key }))
      } catch (error) {
        if (error.$metadata?.httpStatusCode === 404) return undefined
        throw error
      }
    },
    async copy(source, key, etag) {
      await client.send(
        new CopyObjectCommand({
          Bucket: BUCKET,
          Key: key,
          CopySource: `${BUCKET}/${source.split('/').map(encodeURIComponent).join('/')}`,
          CopySourceIfMatch: etag,
        }),
      )
    },
    async putMetadata(file, key) {
      await client.send(
        new PutObjectCommand({
          Bucket: BUCKET,
          Key: key,
          Body: file.body,
          ContentLength: file.size,
          ContentType: 'application/yaml',
          CacheControl: METADATA_CACHE,
        }),
      )
    },
    close() {
      client.destroy()
    },
  }
}

async function verify(storage, file, key, optional = false) {
  const result = await storage.get(key)
  if (!result) {
    if (optional) return undefined
    fail('A required storage object is missing')
  }
  try {
    if (result.ContentLength !== file.size || !result.ETag) fail('Storage object size or ETag is invalid')
    const remote = await digest(result.Body, file.size)
    if (remote.size !== file.size || remote.sha512 !== file.sha512) fail('Storage object checksum mismatch')
    return result.ETag
  } finally {
    result.Body?.destroy()
  }
}

async function assertNotOlder(storage, manifest) {
  for (const file of manifest.metadata) {
    const result = await storage.get(`latest/${file.name}`)
    if (!result) continue
    try {
      if (result.ContentLength > MAX_METADATA_SIZE) fail('Existing updater metadata exceeds 1 MiB')
      const chunks = []
      let size = 0
      for await (const chunk of result.Body) {
        size += chunk.length
        if (size > MAX_METADATA_SIZE) fail('Existing updater metadata exceeds 1 MiB')
        chunks.push(chunk)
      }
      const current = parseMetadata(Buffer.concat(chunks))
      if (semver.gt(current.version, manifest.version)) fail('Refusing to replace a newer latest release')
    } finally {
      result.Body?.destroy()
    }
  }
}

export async function publishRelease(options, storageFactory = createStorage) {
  const { mode, publicationId, releaseTag, promoteLatest = false } = options
  if (!['validate', 'stage', 'promote'].includes(mode)) fail('Choose validate, stage or promote')
  if (mode !== 'validate' && !/^[a-zA-Z0-9][a-zA-Z0-9_-]{0,79}$/.test(publicationId ?? '')) {
    fail('A unique publication ID is required for stage and promote')
  }
  // Complete local validation before creating a client or making any storage request.
  const manifest = await validateManifest(options)
  if (mode === 'promote' || promoteLatest) assertPromotion(manifest, releaseTag)
  if (mode === 'validate') return manifest
  const prefix = `releases/${manifest.version}/${publicationId}`
  const artifacts = [...manifest.binaries, ...manifest.blockmaps]
  const storage = storageFactory()
  try {
    if (mode === 'stage') {
      const stageFile = async file => {
        const key = `${prefix}/${file.name}`
        // A retry may reuse identical bytes, but must never overwrite a different staged object.
        if (!(await verify(storage, file, key, true))) {
          await storage.upload(file, key)
          await verify(storage, file, key)
        }
      }
      await boundedMap(artifacts, stageFile)
      await boundedMap(manifest.metadata, stageFile)
    } else {
      // This entire phase must run under the workflow's repository-wide publication lock.
      const etags = new Map()
      await boundedMap([...artifacts, ...manifest.metadata], async file => {
        etags.set(file.name, await verify(storage, file, `${prefix}/${file.name}`))
      })
      await assertNotOlder(storage, manifest)
      // Preflight every compatibility key before copying any. Same-version rebuilds with
      // different bytes must use a new package version, including when upgrading old uploads.
      const existing = new Map()
      await boundedMap(artifacts, async file => {
        existing.set(file.name, await verify(storage, file, `latest/${file.name}`, true))
      })
      await boundedMap(artifacts, async file => {
        if (!existing.get(file.name)) {
          await storage.copy(`${prefix}/${file.name}`, `latest/${file.name}`, etags.get(file.name))
        }
        await verify(storage, file, `latest/${file.name}`)
      })
      // All referenced binaries (and portable archives) are now available and verified.
      // Each PUT is atomic; S3 has no transaction spanning multiple channel objects.
      for (const file of manifest.metadata) {
        await storage.putMetadata(file, `latest/${file.name}`)
        await verify(storage, file, `latest/${file.name}`)
      }
    }
    return manifest
  } catch (error) {
    if (error instanceof PublicationError) throw error
    // SDK errors may include request details; do not log credentials or response bodies.
    fail('Storage publication failed; no further updater metadata was published')
  } finally {
    storage.close()
  }
}

async function main() {
  dotenv.config({ quiet: true })
  const { values, positionals } = parseArgs({
    allowPositionals: true,
    options: {
      build: { type: 'string', default: 'All' },
      'publication-id': { type: 'string' },
      'release-tag': { type: 'string' },
      'promote-latest': { type: 'boolean', default: false },
      'github-output': { type: 'string' },
    },
  })
  if (positionals.length < 1 || positionals.length > 3)
    fail('Usage: upload-to-s3.js <validate|stage|promote> [artifacts] [metadata] [options]')
  const [mode, artifactDir, metadataDir] = positionals
  const manifest = await publishRelease({
    mode,
    artifactDir,
    metadataDir,
    build: values.build,
    publicationId: values['publication-id'],
    releaseTag: values['release-tag'],
    promoteLatest: values['promote-latest'],
  })
  if (values['github-output']) {
    const delimiter = randomUUID()
    const files = [...manifest.binaries, ...manifest.blockmaps, ...manifest.metadata]
      .map(file => file.filePath)
      .join('\n')
    await appendFile(values['github-output'], `files<<${delimiter}\n${files}\n${delimiter}\n`)
  }
  console.log(
    `Release ${mode} succeeded: ${manifest.binaries.length} binaries, ${manifest.blockmaps.length} blockmaps, ${manifest.metadata.length} updater manifests`,
  )
}

if (process.argv[1] && import.meta.url === pathToFileURL(path.resolve(process.argv[1])).href) {
  main().catch(error => {
    console.error(`[ERROR] ${error instanceof PublicationError ? error.message : 'Release publication failed'}`)
    process.exitCode = 1
  })
}
