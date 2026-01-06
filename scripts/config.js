// different platform has different format

// macos
const darwin = [
  {
    appNameWithPrefix: 'PicList-',
    ext: '.dmg',
    arch: '-arm64',
    'version-file': 'latest-mac.yml',
  },
  {
    appNameWithPrefix: 'PicList-',
    ext: '.dmg',
    arch: '-x64',
    'version-file': 'latest-mac.yml',
  },
]

const linux = [
  {
    appNameWithPrefix: 'PicList-',
    ext: '.AppImage',
    arch: '-x86_64',
    'version-file': 'latest-linux.yml',
  },
  {
    appNameWithPrefix: 'PicList-',
    ext: '.AppImage',
    arch: '-arm64',
    'version-file': 'latest-linux.yml',
  },
  {
    appNameWithPrefix: 'PicList-',
    ext: '.snap',
    arch: '-amd64',
    'version-file': 'latest-linux.yml',
  },
  {
    appNameWithPrefix: 'PicList-',
    ext: '.deb',
    arch: '-amd64',
    'version-file': 'latest-linux.yml',
  },
  {
    appNameWithPrefix: 'PicList-',
    ext: '.deb',
    arch: '-arm64',
    'version-file': 'latest-linux.yml',
  },
]

// windows
const win32 = [
  {
    appNameWithPrefix: 'PicList-Setup-',
    ext: '.exe',
    arch: '-ia32',
    'version-file': 'latest.yml',
  },
  {
    appNameWithPrefix: 'PicList-Setup-',
    ext: '.exe',
    arch: '-x64',
    'version-file': 'latest.yml',
  },
  {
    appNameWithPrefix: 'PicList-Setup-',
    ext: '.exe',
    arch: '', // 32 & 64
    'version-file': 'latest.yml',
  },
  {
    appNameWithPrefix: 'PicList-Setup-',
    ext: '.exe',
    arch: '-arm64',
    'version-file': 'latest.yml',
  },
]

export default {
  darwin,
  linux,
  win32,
}
