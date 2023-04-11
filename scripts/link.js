const pkg = require('../package.json')
const version = pkg.version
// TODO: use the same name format
const generateURL = (platform, ext, prefix = 'PicList-') => {
  return `https://release.piclist.cn/latest/${prefix}${version}${platform}${ext}`
}

const template = `
### 加速下载地址

####MacOS
[PicList-${version}-arm64.dmg](${generateURL('-arm64', '.dmg', 'PicList-')})
[PicList-${version}-x64.dmg](${generateURL('-x64', '.dmg', 'PicList-')})
[PicList-${version}-universal.dmg](${generateURL('-universal', '.dmg', 'PicList-')})

####Windows
[PicList-Setup-${version}-ia32.exe](${generateURL('-ia32', '.exe', 'PicList-Setup-')})
[PicList-Setup-${version}-x64.exe](${generateURL('-x64', '.exe', 'PicList-Setup-')})
[PicList-Setup-${version}.exe](${generateURL('', '.exe', 'PicList-Setup-')})

####Linux
[PicList-${version}.AppImage](${generateURL('', '.AppImage', 'PicList-')})
[piclist_${version}_amd64.snap](${generateURL('_amd64', '.snap', 'piclist_')})`

console.log(template)
