// different platform has different format

// macos
const darwin = [{
  appNameWithPrefix: 'PicList-',
  ext: '.dmg',
  arch: '-arm64',
  'version-file': 'latest-mac.yml'
}, {
  appNameWithPrefix: 'PicList-',
  ext: '.dmg',
  arch: '-x64',
  'version-file': 'latest-mac.yml'
}, {
  appNameWithPrefix: 'PicList-',
  ext: '.dmg',
  arch: '-universal',
  'version-file': 'latest-mac.yml'
}
]

const linux = [{
  appNameWithPrefix: 'PicList-',
  ext: '.AppImage',
  arch: '',
  'version-file': 'latest-linux.yml'
}, {
  appNameWithPrefix: 'piclist_',
  ext: '.snap',
  arch: '_amd64',
  'version-file': 'latest-linux.yml'
}]

// windows
const win32 = [{
  appNameWithPrefix: 'PicList-Setup-',
  ext: '.exe',
  arch: '-ia32',
  'version-file': 'latest.yml'
}, {
  appNameWithPrefix: 'PicList-Setup-',
  ext: '.exe',
  arch: '-x64',
  'version-file': 'latest.yml'
}, {
  appNameWithPrefix: 'PicList-Setup-',
  ext: '.exe',
  arch: '', // 32 & 64
  'version-file': 'latest.yml'
}]

module.exports = {
  darwin,
  linux,
  win32
}
