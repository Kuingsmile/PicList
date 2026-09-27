// Expected filenames follow electron-builder.json, including each format's architecture spelling.
import path from 'node:path'

import pkg from '../package.json' with { type: 'json' }

export const version = pkg.version

// Keep x64 first for the combined manifest's legacy path/sha512 fields.
const darwin = [
  {
    appNameWithPrefix: 'PicList-',
    ext: '.dmg',
    arch: '-x64',
    'version-file': 'latest-mac.yml',
    path: 'macos-15-intel-x64-dmg-artifacts',
  },
  {
    appNameWithPrefix: 'PicList-',
    ext: '.dmg',
    arch: '-arm64',
    'version-file': 'latest-mac.yml',
    path: 'macos-latest-arm64-dmg-artifacts',
  },
  {
    appNameWithPrefix: 'PicList-',
    ext: '.zip',
    arch: '-arm64',
    'version-file': 'latest-mac.yml',
    path: 'macos-latest-arm64-dmg-artifacts',
  },
  {
    appNameWithPrefix: 'PicList-',
    ext: '.zip',
    arch: '-x64',
    'version-file': 'latest-mac.yml',
    path: 'macos-15-intel-x64-dmg-artifacts',
  },
]

const linux = [
  {
    appNameWithPrefix: 'PicList-',
    ext: '.AppImage',
    arch: '-x86_64',
    'version-file': 'latest-linux.yml',
    path: 'ubuntu-latest-x64-AppImage-artifacts',
  },
  {
    appNameWithPrefix: 'PicList-',
    ext: '.AppImage',
    arch: '-arm64',
    'version-file': 'latest-linux-arm64.yml',
    path: 'ubuntu-24.04-arm-arm64-AppImage-artifacts',
  },
  {
    appNameWithPrefix: 'PicList-',
    ext: '.deb',
    arch: '-amd64',
    'version-file': 'latest-linux.yml',
    path: 'ubuntu-latest-x64-deb-artifacts',
  },
  {
    appNameWithPrefix: 'PicList-',
    ext: '.deb',
    arch: '-arm64',
    'version-file': 'latest-linux-arm64.yml',
    path: 'ubuntu-24.04-arm-arm64-deb-artifacts',
  },
  {
    appNameWithPrefix: 'PicList-',
    ext: '.rpm',
    arch: '-x86_64',
    'version-file': 'latest-linux.yml',
    path: 'ubuntu-latest-x64-rpm-artifacts',
  },
  {
    appNameWithPrefix: 'PicList-',
    ext: '.rpm',
    arch: '-aarch64',
    'version-file': 'latest-linux-arm64.yml',
    path: 'ubuntu-24.04-arm-arm64-rpm-artifacts',
  },
  {
    appNameWithPrefix: 'PicList-',
    ext: '.snap',
    arch: '-amd64',
    path: 'ubuntu-latest-x64-snap-artifacts',
  },
]

// windows
const win32 = [
  {
    appNameWithPrefix: 'PicList-Setup-',
    ext: '.exe',
    arch: '-x64',
    'version-file': 'latest.yml',
    path: 'windows-latest-x64-nsis-artifacts',
  },
  {
    appNameWithPrefix: 'PicList-Setup-',
    ext: '.exe',
    arch: '-arm64',
    'version-file': 'latest.yml',
    path: 'windows-11-arm-arm64-nsis-artifacts',
  },
  {
    appNameWithPrefix: 'PicList-Setup-',
    ext: '.zip',
    arch: '-x64-portable',
    path: 'windows-latest-x64-zip-artifacts',
  },
  {
    appNameWithPrefix: 'PicList-Setup-',
    ext: '.zip',
    arch: '-arm64-portable',
    path: 'windows-11-arm-arm64-zip-artifacts',
  },
  {
    appNameWithPrefix: 'PicList-Setup-',
    ext: '.7z',
    arch: '-x64-portable',
    path: 'windows-latest-x64-7z-artifacts',
  },
  {
    appNameWithPrefix: 'PicList-Setup-',
    ext: '.7z',
    arch: '-arm64-portable',
    path: 'windows-11-arm-arm64-7z-artifacts',
  },
]

export const generateFileName = (platformConfig, version) => {
  return `${platformConfig.appNameWithPrefix}${version}${platformConfig.arch}${platformConfig.ext}`
}

export const fileList = [...darwin, ...linux, ...win32].map(platformConfig => {
  const fileName = generateFileName(platformConfig, version)
  return {
    name: fileName,
    build: platformConfig.path.replace(/-artifacts$/, ''),
    metadata: platformConfig['version-file'],
    path: path.join(platformConfig.path, fileName),
    blockMapPath: path.join(platformConfig.path, `${fileName}.blockmap`),
  }
})

export const selectFiles = (build = 'All') => {
  const selected = build === 'All' ? fileList : fileList.filter(file => file.build === build)
  if (selected.length === 0) throw new Error('Unknown release build selection')
  return selected
}

// A macOS "dmg" selection runs the default target (DMG + ZIP). Windows ZIP/7z
// archives are portable and have no updater YAML; Snap updates through its store.
// Missing metadata is allowed only for those selections, never inferred from disk.
export const selectManifest = (build = 'All') => {
  const binaries = selectFiles(build)
  const metadata = new Map()
  for (const file of binaries) {
    if (!file.metadata) continue
    if (!metadata.has(file.metadata)) metadata.set(file.metadata, { name: file.metadata, sources: [] })
    const channel = metadata.get(file.metadata)
    let source = channel.sources.find(source => source.build === file.build)
    if (!source) {
      source = { build: file.build, path: path.join(`${file.build}-yml`, file.metadata), files: [] }
      channel.sources.push(source)
    }
    source.files.push(file.name)
  }
  return { build, version, binaries, metadata: [...metadata.values()] }
}

export default {
  darwin,
  linux,
  win32,
}
