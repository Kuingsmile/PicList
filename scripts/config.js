// different platform has different format
import pkg from '../package.json' with { type: 'json' }
import path from 'path'

const version = pkg.version

// macos
const darwin = [
  {
    appNameWithPrefix: 'PicList-',
    ext: '.dmg',
    arch: '-arm64',
    'version-file': 'latest-mac.yml',
    path: 'macos-latest-arm64-dmg-artifacts',
  },
  {
    appNameWithPrefix: 'PicList-',
    ext: '.dmg',
    arch: '-x64',
    'version-file': 'latest-mac.yml',
    path: 'macos-15-intel-x64-dmg-artifacts',
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
    path: path.join(platformConfig.path, fileName),
    blockMapPath: path.join(platformConfig.path, `${fileName}.blockmap`),
  }
})

export default {
  darwin,
  linux,
  win32,
}
