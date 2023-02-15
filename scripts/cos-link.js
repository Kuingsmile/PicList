const pkg = require('../package.json')
const version = pkg.version
// TODO: use the same name format
const generateURL = (platform, ext, prefix = 'PicList-') => {
  return `https://release.piclist.cn/${version}/${prefix}${version}${platform}${ext}`
}

const platformExtList = [
  ['-arm64', '.dmg', 'PicList-'],
  ['-x64', '.dmg', 'PicList-'],
  ['', '.AppImage', 'PicList-'],
  ['-ia32', '.exe', 'PicList-Setup-'],
  ['-x64', '.exe', 'PicList-Setup-'],
  ['', '.exe', 'PicList-Setup-'],
  ['_amd64', '.snap', 'piclist_']
]

const links = platformExtList.map(([arch, ext, prefix]) => {
  const markdownLink = `[${prefix}${version}${arch}${ext}](${generateURL(arch, ext, prefix)})`
  return markdownLink
})

console.log(links.join('\n'))
