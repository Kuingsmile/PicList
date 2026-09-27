import { execFileSync } from 'node:child_process'
import { readFile, writeFile } from 'node:fs/promises'
import path from 'node:path'
import { pathToFileURL } from 'node:url'
import { parseArgs } from 'node:util'

import { selectFiles } from './config.js'

class ReleaseNotesError extends Error {}

function fail(message) {
  throw new ReleaseNotesError(message)
}

function git(cwd, args) {
  try {
    return execFileSync('git', args, {
      cwd,
      encoding: 'utf8',
      stdio: ['ignore', 'pipe', 'pipe'],
      windowsHide: true,
      timeout: 30_000,
      maxBuffer: 4 * 1024 * 1024,
    })
  } catch {
    // Git errors may contain refs, file contents or credentials. Never log them.
    fail('Cannot resolve release history or source files; check the commit, tags and full checkout')
  }
}

function checkTag(cwd, tag) {
  if (typeof tag !== 'string' || !tag) fail('A release tag is required')
  git(cwd, ['check-ref-format', `refs/tags/${tag}`])
}

export function resolveReleaseContext({ releaseTag, sourceCommit, previousTag, publishedTags, cwd = process.cwd() }) {
  checkTag(cwd, releaseTag)
  if (!/^(?:[a-f\d]{40}|[a-f\d]{64})$/i.test(sourceCommit ?? '')) {
    fail('An immutable source commit SHA is required')
  }
  const commit = git(cwd, ['rev-parse', '--verify', `${sourceCommit}^{commit}`]).trim()
  if (commit !== sourceCommit.toLowerCase()) fail('The source SHA must identify a commit')
  const tags = new Set(git(cwd, ['tag', '--list']).trim().split('\n').filter(Boolean))
  const tagCommit = tag => git(cwd, ['rev-parse', '--verify', `refs/tags/${tag}^{commit}`]).trim()
  // target_commitish cannot move an existing GitHub tag. Refuse misleading notes
  // when a rerun requests a tag that belongs to a different source commit.
  if (tags.has(releaseTag) && tagCommit(releaseTag) !== commit) {
    fail('The release tag already points to a different source commit')
  }

  if (previousTag === undefined) {
    if (!Array.isArray(publishedTags) || publishedTags.some(tag => typeof tag !== 'string')) {
      fail('Provide a previous release tag or the list of published release tags')
    }
    if (git(cwd, ['rev-parse', '--is-shallow-repository']).trim() !== 'false') {
      fail('Finding the previous release requires a full checkout with tags')
    }
    const published = new Set(publishedTags)
    const candidates = git(cwd, ['tag', '--merged', commit])
      .trim()
      .split('\n')
      .filter(tag => tag && tag !== releaseTag && published.has(tag))
    // Only published, reachable releases qualify. Internal tags, the current
    // release, and releases from later or unrelated commits cannot be the base.
    previousTag = candidates.length
      ? git(cwd, [
          'describe',
          '--tags',
          '--abbrev=0',
          `--candidates=${candidates.length}`,
          ...candidates.map(tag => `--match=${tag}`),
          commit,
        ]).trim()
      : ''
  }
  if (previousTag) {
    checkTag(cwd, previousTag)
    if (previousTag === releaseTag) fail('The previous release tag must differ from the current release tag')
    git(cwd, ['merge-base', '--is-ancestor', tagCommit(previousTag), commit])
  }
  return { releaseTag, sourceCommit: commit, previousTag }
}

function selectVerifiedFiles(manifest, sourceVersion) {
  if (
    manifest?.schemaVersion !== 1 ||
    typeof manifest.build !== 'string' ||
    manifest.version !== sourceVersion ||
    !Array.isArray(manifest.binaries)
  ) {
    fail('A verified artifact manifest matching the source version is required')
  }
  const expected = selectFiles(manifest.build, manifest.version)
  const names = new Set()
  for (const file of manifest.binaries) {
    if (
      !expected.some(binary => binary.name === file?.name) ||
      names.has(file.name) ||
      !Number.isSafeInteger(file.size) ||
      file.size <= 0 ||
      typeof file.sha512 !== 'string' ||
      !/^[A-Za-z\d+/]{86}==$/.test(file.sha512)
    ) {
      fail('The artifact manifest has an unknown, duplicate or unverified binary')
    }
    names.add(file.name)
  }
  if (names.size !== expected.length) fail('The artifact manifest omits a selected binary')
  // Presentation and filename data come from the same configuration used by
  // validation and publication; updater YAML and blockmaps are not downloads.
  return expected
}

const urlPart = value => encodeURIComponent(value).replace(/[!'()*]/g, char => `%${char.charCodeAt(0).toString(16)}`)
const markdown = value =>
  value
    .replace(/[&<>]/g, char => ({ '&': '&amp;', '<': '&lt;', '>': '&gt;' })[char])
    .replace(/[\\`*_{}[\]()#+.!|~-]/g, '\\$&')

function downloads(files, baseUrl, releaseTag) {
  const sections = []
  for (const [platform, heading] of [
    ['win32', 'Windows'],
    ['darwin', 'macOS'],
    ['linux', 'Linux'],
  ]) {
    const groups = new Map()
    for (const file of files.filter(file => file.platform === platform)) {
      const arm = ['arm64', 'aarch64'].includes(file.arch)
      let label = platform === 'darwin' ? (arm ? 'Apple Silicon' : 'Intel') : arm ? 'ARM64' : 'x64'
      let format = { exe: 'Installer', dmg: 'DMG', zip: 'ZIP' }[file.format] ?? file.format
      if (platform === 'win32' && ['zip', '7z'].includes(file.format)) {
        format = 'Portable'
        label += ` (${file.format})`
      }
      if (!groups.has(format)) groups.set(format, [])
      groups
        .get(format)
        .push(`[**${label}**](${baseUrl}/releases/download/${urlPart(releaseTag)}/${urlPart(file.name)})`)
    }
    if (groups.size) {
      sections.push(
        `### ${heading}\n\n${[...groups].map(([format, links]) => `- ${format}:\n  ${links.join(' | ')}`).join('\n')}`,
      )
    }
  }
  return sections.join('\n\n')
}

export function generateReleaseNotes({ manifest, repository, cwd = process.cwd(), ...release }) {
  if (!/^[A-Za-z\d_.-]+\/[A-Za-z\d_.-]+$/.test(repository ?? '')) {
    fail('A GitHub repository in owner/name form is required')
  }
  const { releaseTag, sourceCommit, previousTag } = resolveReleaseContext({ ...release, cwd })
  const sourceFile = name => git(cwd, ['show', `${sourceCommit}:${name}`]).trimEnd()
  const sourceVersion = JSON.parse(sourceFile('package.json')).version
  const files = selectVerifiedFiles(manifest, sourceVersion)
  const baseUrl = `https://github.com/${repository}`
  const changelog = previousTag
    ? `**Full Changelog**: [${markdown(previousTag)}...${markdown(releaseTag)}](${baseUrl}/compare/${urlPart(previousTag)}...${sourceCommit})`
    : `**Source history**: [Commits included in this release](${baseUrl}/commits/${sourceCommit})`
  return `# Release ${markdown(releaseTag)}

Version: ${markdown(manifest.version)} · Source: [${sourceCommit.slice(0, 12)}](${baseUrl}/commit/${sourceCommit})

---

## 📦 Download / 下载

${downloads(files, baseUrl, releaseTag)}

---

${sourceFile('currentVersion_en.md')}

---

${sourceFile('currentVersion.md')}

---

${changelog}
`
}

async function main() {
  const { values } = parseArgs({
    options: {
      'release-tag': { type: 'string' },
      'source-commit': { type: 'string' },
      'previous-tag': { type: 'string' },
      'published-tags-file': { type: 'string' },
      manifest: { type: 'string' },
      repository: { type: 'string' },
      output: { type: 'string', default: 'release-notes.md' },
    },
  })
  if (!values.manifest) fail('Pass the verified artifact manifest using --manifest')
  if (values['previous-tag'] !== undefined && values['published-tags-file']) {
    fail('Choose either --previous-tag or --published-tags-file')
  }
  const publishedTags = values['published-tags-file']
    ? (await readFile(values['published-tags-file'], 'utf8')).split(/\r?\n/).filter(Boolean)
    : undefined
  const body = generateReleaseNotes({
    manifest: JSON.parse(await readFile(values.manifest, 'utf8')),
    releaseTag: values['release-tag'],
    sourceCommit: values['source-commit'],
    previousTag: values['previous-tag'],
    publishedTags,
    repository: values.repository,
  })
  await writeFile(values.output, body)
  console.log('Release notes generated from the source commit and verified artifact manifest')
}

if (process.argv[1] && import.meta.url === pathToFileURL(path.resolve(process.argv[1])).href) {
  main().catch(error => {
    console.error(
      error instanceof ReleaseNotesError ? error.message : 'Release notes generation failed; check the inputs',
    )
    process.exitCode = 1
  })
}
