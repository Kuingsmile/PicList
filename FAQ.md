# FAQ

该FAQ修改自PicGo的FAQ，感谢PicGo的作者Molunerfinn。

## 常见问题

> 本软件的上传工具部分来自PicGo，基本没有改动，请参考PicGo的 [使用文档](https://picgo.github.io/PicGo-Doc/zh/guide/getting-started.html#%E5%BF%AB%E9%80%9F%E4%B8%8A%E6%89%8B)

## 1. PicList和PicGo有什么关系？

PicList项目fork自PicGo项目，基于PicGo进行了二次开发，同时核心功能内核PicGo-Core也进行了二次开发，重命名为[PicList-Core](https://github.com/Kuingsmile/PicList-Core)。

PicList所有新功能的添加没有影响到PicGo的原有功能，所以你可以在PicList中使用PicGo的所有插件。同时仍然可以配合typora、obsidian等软件进行使用。

## 2. 使用图床管理功能时，出现无法获取目录等错误

请查看日志文件`manage.log`，此外，各平台的API调用基本都有每小时次数限制，如果出现错误，请稍后再试。

## 3. 支持哪些图床远端同步删除

目前支持的图床有：

- 阿里云 OSS
- 腾讯云 COS
- 七牛云 Kodo
- 又拍云
- SM.MS
- Imgur
- GitHub
- Webdav
- Aws S3

## 4. 能否支持上传视频文件

可以，通过新添加的图床管理功能，你可以上传任意格式的文件，包括视频文件。同时，在管理界面内上传时，使用分片上传/流式上传等方式，相对于PicGo内置的转换为base64的方式，上传更快，更稳定。

## 5. 能否支持某某某图床

PicList本体支持了如下图床：

- `七牛图床`
- `腾讯云 COS`
- `又拍云`
- `GitHub`
- `SM.MS`
- `阿里云 OSS`
- `Imgur`
- `Webdav`

PicList计划整合和优化现有插件，内置更多的常用图床。

此外，PicList兼容PicGo的插件系统，需要其他图床支持可以参考目前已有的PicGo三方 [插件](https://github.com/PicGo/Awesome-PicGo)，如果还是没有你所需要的图床欢迎开发一个插件供大家使用。

## 6. Github 图床有时能上传，有时上传失败

1. GitHub 图床不支持上传同名文件，如果有同名文件上传，会报错。建议开启 `时间戳重命名` 避免同名文件。
2. GitHub 服务器和国内 GFW 的问题会导致有时上传成功，有时上传失败，无解。想要稳定请使用付费云存储，如阿里云、腾讯云等，价格也不会贵。

## 7. Mac 上无法打开 PicList 的主窗口界面

PicList 在 Mac 上是一个顶部栏应用，在 dock 栏是不会有图标的。要打开主窗口，请右键或者双指点按顶部栏 PicList 图标，选择「打开详细窗口」即可打开主窗口。

## 8. 上传失败，或者是服务器出错

1. PicList 自带的图床都经过测试，上传出错一般都不是 PicList 自身的原因。如果你用的是 GitHub 图床请参考上面的第 7 点。
2. 检查 PicList 的日志（报错日志可以在 PicList 设置 -> 设置日志文件 -> 点击打开 后找到），看看 `[PicList Error]` 的报错信息里有什么关键信息
   1. 先自行搜索 error 里的报错信息，往往你能百度或者谷歌出问题原因，不必开 issue。
   2. 如果有带有 `401` 、`403` 等 `40X` 状态码字样的，不用怀疑，就是你配置写错了，仔细检查配置，看看是否多了空格之类的。
   3. 如果带有 `HttpError`、`RequestError` 、 `socket hang up` 等字样的说明这是网络问题，我无法帮你解决网络问题，请检查你自己的网络，是否有代理，DNS 设置是否正常等。
3. 通常网络问题引起的上传失败都是因为代理设置不当导致的。如果开启了系统代理，建议同时也在 PicList 的代理设置中设置对应的HTTP代理。

## 10. macOS版本安装完之后没有主界面

请找到PicList在顶部栏的图标，然后右键（触摸板双指点按，或者鼠标右键），即可找到「打开详细窗口」的菜单。

## 11. macOS系统安装完PicList显示「文件已损坏」或者安装完打开没有反应

请升级PicList 1.4.1或以上版本，自1.4.1开始，PicList已经经过Apple的签名，不会再出现这种情况。

## 12. 水印没有正常添加

PicList在添加水印前会先检查字体文件是否存在，如果不存在会自动下载字体文件，但是由于网络问题，可能会导致字体文件下载失败，此时会跳过水印添加。

请根据自己的系统检查对应路径下的字体文件是否存在，如果不存在，请手动下载字体文件，然后放到对应的路径下。

Windows: `%APPDATA%\piclist\assets\simhei.ttf`
Linux: `$XDG_CONFIG_HOME/piclist/assets/simhei.ttf` or `~/.config//assets/simhei.ttf`
macOS: `~/Library/Application\ Support/picgo/assets/simhei.ttf`

字体文件下载地址：[https://release.piclist.cn/simhei.ttf](https://release.piclist.cn/simhei.ttf)