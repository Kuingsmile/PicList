import pkg from '../package.json' with { type: 'json' }

const version = pkg.version

const generateURL = (platform, ext, prefix = 'PicList-') => {
  return `https://release.piclist.cn/latest/${prefix}${version}${platform}${ext}`
}

const template = `
### 加速下载地址

#### MacOS

- DMG:

[PicList-${version}-x64.dmg](${generateURL('-x64', '.dmg', 'PicList-')}) | [PicList-${version}-arm64.dmg](${generateURL('-arm64', '.dmg', 'PicList-')})

#### Windows

- Installer:
[PicList-Setup-${version}-x64.exe](${generateURL('-x64', '.exe', 'PicList-Setup-')}) | [PicList-Setup-${version}-arm64.exe](${generateURL('-arm64', '.exe', 'PicList-Setup-')})

- Portable:

[PicList-Setup-${version}-x64-portable.zip](${generateURL('-x64-portable', '.zip', 'PicList-Setup-')}) | [PicList-Setup-${version}-arm64-portable.zip](${generateURL('-arm64-portable', '.zip', 'PicList-Setup-')}) | [PicList-Setup-${version}-x64-portable.7z](${generateURL('-x64-portable', '.7z', 'PicList-Setup-')}) | [PicList-Setup-${version}-arm64-portable.7z](${generateURL('-arm64-portable', '.7z', 'PicList-Setup-')})

#### Linux

- AppImage:

[PicList-${version}-x86_64.AppImage](${generateURL('-x86_64', '.AppImage', 'PicList-')}) | [PicList-${version}-arm64.AppImage](${generateURL('-arm64', '.AppImage', 'PicList-')})

- Deb:

[PicList-${version}-amd64.deb](${generateURL('-amd64', '.deb', 'PicList-')}) | [PicList-${version}-arm64.deb](${generateURL('-arm64', '.deb', 'PicList-')})

- Rpm:

[PicList-${version}-x86_64.rpm](${generateURL('-x86_64', '.rpm', 'PicList-')}) | [PicList-${version}-aarch64.rpm](${generateURL('-aarch64', '.rpm', 'PicList-')})

- Snap:

[PicList-${version}-amd64.snap](${generateURL('-amd64', '.snap', 'PicList-')})
`

console.log(template)
