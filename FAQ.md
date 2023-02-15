# FAQ

该FAQ修改自PicGo的FAQ，感谢PicGo的作者Molunerfinn。

## 常见问题

> 本软件的上传工具部分来自PicGo，基本没有改动，请参考PicGo的 [使用文档](https://picgo.github.io/PicGo-Doc/zh/guide/getting-started.html#%E5%BF%AB%E9%80%9F%E4%B8%8A%E6%89%8B)

## 1. PicList和PicGo有什么关系？

PicList项目fork自PicGo项目，基于PicGo进行了二次开发，添加了如下功能：

注意：以下功能已适配的图床包括：阿里云 OSS、腾讯云 COS、七牛云 Kodo、又拍云、SM.MS、Imgur、GitHub。

- 相册中可同步删除云端图片
- 支持管理所有图床，可以在线进行云端目录查看、文件搜索、批量上传、批量下载、删除文件和图片预览等
- 对于私有存储桶等支持复制预签名链接进行分享
- 优化了PicGo的界面，解锁了窗口大小限制，同时美化了部分界面布局

PicList所有新功能的添加没有影响到PicGo的原有功能，所以你可以在PicList中使用PicGo的所有插件。同时仍然可以配合typora、obsidian等软件进行使用。

## 2. 使用图床管理功能时，出现无法获取目录等错误

请查看日志文件`manage.log`，此外，各平台的API调用基本都有每小时次数限制，如果出现错误，请稍后再试。

## 3. 支持哪些图床远端同步删除

可以，本软件基于PicGo进行了二次开发，添加了远端同步删除功能。但是需要你的图床支持，目前支持的图床有：

- 阿里云 OSS
- 腾讯云 COS
- 七牛云 Kodo
- 又拍云
- SM.MS
- Imgur
- GitHub

## 4. 能否支持上传视频文件

可以，通过新添加的图床管理功能，你可以上传任意格式的文件，包括视频文件。同时，在管理界面内上传时，使用分片上传/流式上传等方式，相对于PicGo内置的转换为base64的方式，上传更快，更稳定。

## 5. 能否支持某某某图床

PicGo本体支持了如下图床：

- `七牛图床`
- `腾讯云 COS`
- `又拍云`
- `GitHub`
- `SM.MS`
- `阿里云 OSS`
- `Imgur`

PicList在上述7个图床之外，计划整合和优化现有插件，内置更多的常用图床。

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

因为 PicList 没有签名，所以会被 macOS 的安全检查所拦下。

1. 安装后打开遇到「文件已损坏」的情况，请按如下方式操作：

信任开发者，会要求输入密码:

```
sudo spctl --master-disable
```

然后放行 PicList :

```
xattr -cr /Applications/PicList.app
```

然后就能正常打开。

如果提示以下内容

```sh
option -r not recognized

usage: xattr [-slz] file [file ...]
       xattr -p [-slz] attr_name file [file ...]
       xattr -w [-sz] attr_name attr_value file [file ...]
       xattr -d [-s] attr_name file [file ...]
       xattr -c [-s] file [file ...]

The first form lists the names of all xattrs on the given file(s).
The second form (-p) prints the value of the xattr attr_name.
The third form (-w) sets the value of the xattr attr_name to attr_value.
The fourth form (-d) deletes the xattr attr_name.
The fifth form (-c) deletes (clears) all xattrs.

options:
  -h: print this help
  -s: act on symbolic links themselves rather than their targets
  -l: print long format (attr_name: attr_value)
  -z: compress or decompress (if compressed) attribute value in zip format
```
执行命令

```
xattr -c /Applications/PicList.app/*
```
