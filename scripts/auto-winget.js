import { execFile } from 'node:child_process'
import { lstat, mkdir, mkdtemp, readdir, readFile, rename, rm, writeFile } from 'node:fs/promises'
import path from 'node:path'
import { fileURLToPath, pathToFileURL } from 'node:url'
import { parseArgs } from 'node:util'

import axios from 'axios'
import dotenv from 'dotenv'
import semver from 'semver'
import yaml from 'yaml'

const repositoryRoot = fileURLToPath(new URL('..', import.meta.url))
const packageId = 'Kuingsmile.PicList'
const architectures = ['x64', 'arm64']
const manifestFiles = [
  [`${packageId}.installer.yaml`, 'installer'],
  [`${packageId}.locale.en-US.yaml`, 'defaultLocale'],
  [`${packageId}.yaml`, 'version'],
]

class WingetError extends Error {}

function fail(message) {
  throw new WingetError(message)
}

function safeLogger(logger, secrets) {
  const tokens = [...new Set(secrets.filter(token => typeof token === 'string' && token.length))].sort(
    (a, b) => b.length - a.length,
  )
  const redact = value => {
    let text = typeof value === 'string' || Buffer.isBuffer(value) ? value.toString() : ''
    for (const token of tokens) text = text.replaceAll(token, '[REDACTED]')
    return text
  }
  return {
    log: value => logger.log(redact(value)),
    error: value => logger.error(redact(value)),
  }
}

// Do not inherit unrelated credentials or Node debug settings into either tool.
function childEnvironment(environment) {
  const allowed = new Set([
    'path',
    'pathext',
    'systemroot',
    'windir',
    'comspec',
    'temp',
    'tmp',
    'userprofile',
    'appdata',
    'localappdata',
    'programdata',
    'allusersprofile',
    'home',
    'lang',
    'lc_all',
  ])
  return Object.fromEntries(
    Object.keys(environment)
      .filter(key => allowed.has(key.toLowerCase()))
      .map(key => [key, environment[key]]),
  )
}

// Exported for fake-child regression tests. Never log an Error, its command,
// spawnargs, stack, or arbitrary properties, even after a failed spawn.
export function runChild({ file, args, environment, secrets = [], logger = console, execute = execFile }) {
  const log = safeLogger(logger, secrets)
  return new Promise(resolve => {
    try {
      const child = execute(
        file,
        args,
        {
          shell: false,
          windowsHide: true,
          env: environment,
          encoding: 'utf8',
          timeout: 120_000,
          maxBuffer: 4 * 1024 * 1024,
        },
        (error, stdout, stderr) => {
          // execFile buffers complete streams before redaction, including tokens
          // split across child output chunks. Nothing is piped to the terminal.
          if (stdout) log.log(stdout)
          if (stderr) log.error(stderr)
          if (error) log.error('Winget child process failed; raw process diagnostics were suppressed.')
          resolve(!error)
        },
      )
      // Commands must not wait for interactive credentials or confirmation.
      child.stdin?.end()
    } catch {
      log.error('Unable to start Winget child process; raw process diagnostics were suppressed.')
      resolve(false)
    }
  })
}

function validateRelease(release, version) {
  if (release?.tag_name !== `v${version}` || release.draft !== false || !Array.isArray(release.assets)) {
    fail('The GitHub response is not the expected published release tag.')
  }
  return architectures.map(architecture => {
    const name = `PicList-Setup-${version}-${architecture}.exe`
    const matches = release.assets.filter(asset => asset?.name === name)
    if (matches.length !== 1) fail(`The release must contain exactly one ${architecture} installer.`)
    const asset = matches[0]
    if (typeof asset.digest !== 'string' || asset.digest.length !== 71 || !/^sha256:[a-f\d]{64}$/i.test(asset.digest)) {
      fail(`The ${architecture} installer must have a valid SHA-256 digest.`)
    }
    const url = `https://github.com/Kuingsmile/PicList/releases/download/v${version}/${name}`
    if (
      typeof asset.browser_download_url !== 'string' ||
      asset.browser_download_url.replace(
        /^https:\/\/github\.com\/kuingsmile\/piclist\//i,
        'https://github.com/Kuingsmile/PicList/',
      ) !== url
    ) {
      fail(`The ${architecture} installer URL does not belong to the expected release.`)
    }
    return { Architecture: architecture, InstallerUrl: url, InstallerSha256: asset.digest.slice(7).toUpperCase() }
  })
}

async function readManifestSet(directory, version) {
  const entries = await readdir(directory, { withFileTypes: true })
  if (
    entries.length !== manifestFiles.length ||
    entries.some(entry => !entry.isFile() || !manifestFiles.some(([name]) => name === entry.name))
  ) {
    fail('The template must contain exactly the three expected regular manifest files.')
  }
  const documents = []
  for (const [name, type] of manifestFiles) {
    let document
    let data
    try {
      document = yaml.parseDocument(await readFile(path.join(directory, name), 'utf8'))
      if (document.errors.length) fail('Invalid manifest YAML.')
      data = document.toJS({ maxAliasCount: 0 })
    } catch {
      fail('A manifest contains invalid YAML; parser diagnostics were suppressed.')
    }
    if (
      data?.PackageIdentifier !== packageId ||
      data.PackageVersion !== version ||
      data.ManifestType !== type ||
      typeof data.ManifestVersion !== 'string' ||
      !semver.valid(data.ManifestVersion)
    ) {
      fail('Manifest identity, version, type, or schema version is inconsistent.')
    }
    documents.push(document)
  }
  if (new Set(documents.map(document => document.get('ManifestVersion'))).size !== 1) {
    fail('The manifests must use the same schema version.')
  }
  if (documents[1].get('PackageLocale') !== 'en-US' || documents[2].get('DefaultLocale') !== 'en-US') {
    fail('The default locale must match across the manifest set.')
  }
  const installers = documents[0].get('Installers')?.toJSON()
  if (
    !Array.isArray(installers) ||
    installers.length !== architectures.length ||
    architectures.some(architecture => installers.filter(item => item?.Architecture === architecture).length !== 1)
  ) {
    fail('The installer manifest must contain exactly one x64 and one arm64 installer.')
  }
  return documents
}

async function exists(filePath) {
  try {
    return await lstat(filePath)
  } catch (error) {
    if (error.code === 'ENOENT') return undefined
    throw error
  }
}

async function checkDestination(target, staged) {
  const stat = await exists(target)
  if (!stat) return false
  if (!stat.isDirectory() || stat.isSymbolicLink())
    fail('The destination already exists and is not a regular directory.')
  const entries = await readdir(target, { withFileTypes: true })
  if (
    entries.length !== manifestFiles.length ||
    entries.some(entry => !entry.isFile() || !manifestFiles.some(([name]) => name === entry.name))
  ) {
    fail('The destination already exists with conflicting files; it was not changed.')
  }
  for (const [name] of manifestFiles) {
    if (!(await readFile(path.join(target, name))).equals(await readFile(path.join(staged, name)))) {
      fail('The destination already exists with different manifests; it was not changed.')
    }
  }
  return true
}

async function prepareManifests({ rootDir, version, installers, dryRun, run, renameDirectory }) {
  const manifestRoot = path.join(rootDir, '.winget', 'manifests', 'k', 'Kuingsmile', 'PicList')
  const target = path.join(manifestRoot, version)
  const versions = (await readdir(manifestRoot, { withFileTypes: true }))
    .filter(entry => entry.isDirectory() && semver.valid(entry.name) === entry.name && semver.lte(entry.name, version))
    .map(entry => entry.name)
    .sort(semver.rcompare)
  if (!versions.length) fail('No suitable existing manifest template was found.')
  const documents = await readManifestSet(path.join(manifestRoot, versions[0]), versions[0])
  for (const document of documents) document.set('PackageVersion', version)
  documents[0].set(
    'Installers',
    documents[0]
      .get('Installers')
      .toJSON()
      .map(installer => ({ ...installer, ...installers.find(item => item.Architecture === installer.Architecture) })),
  )

  // A sibling directory keeps staging and destination on the same filesystem.
  // Publish the whole set with one rename; never rename or rewrite the template.
  const temporary = await mkdtemp(path.join(manifestRoot, '.winget-staging-'))
  try {
    const staged = path.join(temporary, version)
    await mkdir(staged)
    for (const [index, [name]] of manifestFiles.entries()) {
      await writeFile(path.join(staged, name), documents[index].toString(), { encoding: 'utf8', flag: 'wx' })
    }
    const generated = await readManifestSet(staged, version)
    for (const installer of generated[0].get('Installers').toJSON()) {
      const expected = installers.find(item => item.Architecture === installer.Architecture)
      if (installer.InstallerUrl !== expected.InstallerUrl || installer.InstallerSha256 !== expected.InstallerSha256) {
        fail('A generated installer URL or checksum does not match the validated release.')
      }
    }
    // WinGet performs full schema and cross-manifest validation before any commit.
    if (!(await run('winget.exe', ['validate', '--manifest', staged, '--disable-interactivity']))) {
      fail('The complete manifest set failed WinGet validation; local manifests were not changed.')
    }
    const alreadyApplied = await checkDestination(target, staged)
    if (!dryRun && !alreadyApplied) await renameDirectory(staged, target)
    return target
  } finally {
    // Only this invocation's mkdtemp directory is removed, never a version directory.
    await rm(temporary, { recursive: true, force: true })
  }
}

function loadDotEnv(rootDir) {
  const environment = {}
  dotenv.config({ path: path.join(rootDir, '.env'), processEnv: environment, quiet: true, debug: false })
  return environment
}

export async function main(
  argv = process.argv.slice(2),
  {
    rootDir = repositoryRoot,
    environment = process.env,
    loadEnvironment = loadDotEnv,
    request = axios.get,
    execute = execFile,
    renameDirectory = rename,
    logger = console,
  } = {},
) {
  let log = safeLogger(logger, [])
  try {
    const { values } = parseArgs({
      args: argv,
      options: { 'dry-run': { type: 'boolean', default: false }, help: { type: 'boolean', default: false } },
    })
    if (values.help) {
      log.log(
        'Usage: node scripts/auto-winget.js [--dry-run]\nDry runs validate without credentials, changes, or submission.',
      )
      return 0
    }
    const dryRun = values['dry-run']
    // Parent-process debug hooks can log spawn options or HTTP headers before
    // our redaction runs. Fail before loading credentials when tracing is on.
    if (environment.NODE_DEBUG || environment.NODE_DEBUG_NATIVE || environment.DEBUG) {
      fail('Disable NODE_DEBUG, NODE_DEBUG_NATIVE, and DEBUG before running Winget automation.')
    }
    // Importing this module, --help, and --dry-run never load .env or read tokens.
    let token
    let secrets = []
    if (!dryRun) {
      const stored = environment.WINGET_CREATE_GITHUB_TOKEN || environment.GH_TOKEN ? {} : loadEnvironment(rootDir)
      secrets = [
        environment.WINGET_CREATE_GITHUB_TOKEN,
        environment.GH_TOKEN,
        stored.WINGET_CREATE_GITHUB_TOKEN,
        stored.GH_TOKEN,
      ]
      token = secrets.find(value => typeof value === 'string' && value.length)
      log = safeLogger(logger, secrets)
      if (!token || /\s/.test(token))
        fail('A nonempty GH_TOKEN or WINGET_CREATE_GITHUB_TOKEN is required for submission.')
    }
    const { version } = JSON.parse(await readFile(path.join(rootDir, 'package.json'), 'utf8'))
    if (typeof version !== 'string' || semver.valid(version) !== version) fail('Invalid package.json release version.')
    let release
    try {
      const response = await request(
        `https://api.github.com/repos/Kuingsmile/PicList/releases/tags/${encodeURIComponent(`v${version}`)}`,
        {
          headers: {
            Accept: 'application/vnd.github+json',
            'X-GitHub-Api-Version': '2022-11-28',
            ...(token ? { Authorization: `Bearer ${token}` } : {}),
          },
          timeout: 30_000,
          maxRedirects: 0,
        },
      )
      release = response.data
    } catch {
      // Axios errors can contain Authorization headers and response bodies.
      fail('Unable to fetch the exact GitHub release; local manifests were not changed.')
    }
    const installers = validateRelease(release, version)
    const baseEnvironment = childEnvironment(environment)
    const run = (file, args, submission = false) =>
      runChild({
        file,
        args,
        // Supported credential transport: https://github.com/microsoft/winget-create/blob/main/doc/token.md
        // Never fall back to --token: it exposes the token in process lists and tool logs.
        environment: submission ? { ...baseEnvironment, WINGET_CREATE_GITHUB_TOKEN: token } : baseEnvironment,
        secrets,
        logger: log,
        execute,
      })
    const target = await prepareManifests({ rootDir, version, installers, dryRun, run, renameDirectory })
    if (dryRun) {
      log.log(
        'Dry run succeeded: both installers and the complete manifest set are valid. No files changed or PR submitted.',
      )
      return 0
    }
    if (!(await run('wingetcreate.exe', ['submit', '--prtitle', `PicList v${version}`, '--no-open', target], true))) {
      fail('Winget submission failed. Validated local manifests were retained for retry.')
    }
    log.log('Winget submission succeeded.')
    return 0
  } catch (error) {
    log.error(
      error instanceof WingetError ? error.message : 'Winget automation failed; raw diagnostics were suppressed.',
    )
    return 1
  }
}

if (process.argv[1] && import.meta.url === pathToFileURL(path.resolve(process.argv[1])).href) {
  process.exitCode = await main()
}
