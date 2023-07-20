<div align="center">
  <img src="https://imgx.horosama.com/admin_uploads/2022/10/2022_10_05_633d79e401694.png" alt="">
  <h1>PicList</h1>
  <a href="https://github.com/Kuingsmile/PicList/actions">
    <img src="https://img.shields.io/badge/code%20style-standard-green.svg?style=flat-square" alt="">
  </a>
  <a href="https://github.com/Kuingsmile/PicList/actions">
    <img src="https://github.com/Kuingsmile/PicList/actions/workflows/manually.yml/badge.svg" alt="">
  </a>
  <a href="https://github.com/Kuingsmile/PicList/releases/latest">
    <img src="https://img.shields.io/github/release/Kuingsmile/PicList.svg?style=flat-square" alt="">
  </a>
</div>

![Alt](https://repobeats.axiom.co/api/embed/9e4ec90b7b50f8e9c10d77439e49e26b303fabed.svg "Repobeats analytics image")

简体中文 | [English](https://github.com/Kuingsmile/PicList/blob/dev/README_en.md)

PicList是一款云存储/图床平台管理和文件上传工具，基于PicGo的进行了深度二次开发，保留了PicGo的所有功能的同时，为相册添加了同步云端删除功能，同时增加了完整的云存储管理功能，包括云端目录查看、文件搜索、批量上传下载和删除文件，复制多种格式文件链接和图片/markdown/文本/视频预览等，另外还有更加强大的相册和多项功能新增或优化。

## 如何从PicGo迁移

PicList `V1.5.0`以上版本提供 `一键迁移`功能，进入 `设置`页面，然后在 `从PicGo迁移`选项点击右侧按钮即可，迁移后请重启应用生效。

## PicList-Core

PicList的内核使用的是原版PicGo-Core基础上修改的[PicList-core](https://github.com/Kuingsmile/PicList-Core)，为云端删除等功能做了适配，同时，新增了水印添加和图片压缩/缩放/旋转/格式转换等功能，可以通过CLI命令行调用，还有一些其他的功能改动。

如果您希望使用PicList-core，请前往[https://github.com/Kuingsmile/PicList-Core](https://github.com/Kuingsmile/PicList-Core)，或者前往[npm官方地址](https://www.npmjs.com/package/piclist)查看安装说明。

## 特色功能

- 保留了PicGo的所有功能，兼容已有的PicGo插件系统，包括和typora、obsidian等的搭配
- 新增了对webdav上传，imgur账户上传，本地文件夹上传等的支持
- 相册中可同步删除云端图片，同时新增了高级搜索和排序，批量修改URL等功能
- 内置水印添加、图片压缩、图片缩放、图片旋转和图片格式转换等功能，支持自定义配置，且可以通过CLI命令行调用
- 新增配置多端同步功能
- 支持管理所有图床，可以在线进行云端目录查看、文件搜索、批量上传、批量下载、删除文件等
- 支持预览多种格式的文件，包括图片、视频、纯文本文件和markdown文件等，具体支持的格式请参考[支持的文件格式列表](https://github.com/Kuingsmile/PicList/blob/dev/supported_format.md)
- 支持正则表达式的批量云端文件重命名
- 对于私有存储桶等支持复制预签名链接进行分享
- 支持自动更新，无需每次手动下载，支持多种启动模式选择，还有更多功能细节新增和优化
- 优化了PicGo的界面，解锁了窗口大小限制，同时美化了部分界面布局
- mac平台安装包已签名，从源头解决了PicGo上的安装包已损坏的日经问题

### 如何在Typora中使用

#### **1.6.0版本及以上**

**Typora 1.6.0-dev以及以上版本现在已经原生支持PicList了**

下载地址：

[Windows 版本](https://download.typora.io/windows/typora-setup-x64-1.6.0-dev.exe "windows")
[Mac OS版本](https://download.typora.io/mac/Typora-1.6.0-dev.dmg "macOS")

#### 1.6.0版本以下

Windows:

进入Typora设置界面，选择图像，将上传服务设置为 `PicGo(app)`，然后在 `PicGo路径`中填写PicList的安装路径，如下图所示：

![image](https://user-images.githubusercontent.com/96409857/226522101-b3531b7b-534c-4149-b527-8738d4ebb041.png)

或者，您也可以使用 `npm install piclist`命令安装PicList-core，然后上传服务设置为 `PicGo-Core(command line)`。

MacOS:

进入Typora设置界面，选择图像，将上传服务设置为 `Custom Command`，然后在 `Command`中填写 `/Applications/PicList.app/Contents/MacOS/PicList upload`，如下图所示：

![image](https://user-images.githubusercontent.com/96409857/226645570-4c6e06a5-5bd9-40c3-a21d-8446c66325e3.png)

验证上传选项可能会出现问题，可以忽略，直接使用是正常的。

### 如何在Obsidian中使用

在社区插件中搜索安装 `Image auto upload Plugin`，然后进入插件设置页面，修改默认上传器为 `PicGo(app)`，设置 `PicGo server`为 `http://127.0.0.1:36677/upload`即可，如下图所示：

![image](https://user-images.githubusercontent.com/96409857/226522718-8378c480-9fb4-4785-87e1-d59808862016.png)

## 已支持平台

|      平台      | 相册云删除 | 云存储管理 |
| :------------: | :--------: | :--------: |
|     SM.MS      |     ✔️      |     ✔️      |
|     Github     |     ✔️      |     ✔️      |
|     Imgur      |     ✔️      |     ✔️      |
|   腾讯COS V5   |     ✔️      |     ✔️      |
|   阿里云OSS    |     ✔️      |     ✔️      |
|     又拍云     |     ✔️      |     ✔️      |
|     七牛云     |     ✔️      |     ✔️      |
| S3 API兼容平台 |     ✔️      |     ✔️      |
|     WebDAV     |     ✔️      |     ✔️      |
|   本地文件夹   |     ✔️      |     ✔️      |

|                             插件                             | 相册云删除 |
| :----------------------------------------------------------: | :--------: |
| [picgo-plugin-s3](https://github.com/wayjam/picgo-plugin-s3) |     ✔️      |

## 下载安装

[https://github.com/Kuingsmile/PicList/releases/latest](https://github.com/Kuingsmile/PicList/releases/latest)

### Homebrew

MacOS用户现在可以使用Homebrew来安装PicList了，只需要执行以下命令即可：

```bash
brew install piclist --cask
```

卸载命令：

```bash
brew uninstall piclist
```

### Mac特殊说明

如果macOS系统安装完PicList显示「文件已损坏」或者安装完打开没有反应，请升级到PicList V1.4.1以上版本。

从V1.4.1版本开始，所有的mac安装包均经过了我的开发者证书签名，不会再被macOS系统识别为「恶意软件」，不会再出现「文件已损坏」的提示。

### Mac App Store

由于Mac App Store的沙盒机制，导致多项功能无法正常使用，因此不再支持Mac App Store的安装方式。

如果您已经通过Mac App Store购买了PicList，请添加我的微信 `pku_sq_ma`，我会为您退费。

再次感谢您对PicList的支持。

## 应用截图

![image](https://user-images.githubusercontent.com/96409857/222900642-f1d04a41-f025-4f3c-b838-bae770e0b929.png)
![image](https://user-images.githubusercontent.com/96409857/222900656-6bb33045-6672-4c4d-ac34-1b9ba86011cc.png)
![image](https://user-images.githubusercontent.com/96409857/220510112-e524f270-ab56-4e8b-bfb2-eb0a77e559ef.png)
![image](https://user-images.githubusercontent.com/96409857/220510176-8a3f9f19-9182-4b56-b943-fc408ef63f22.png)
![image](https://user-images.githubusercontent.com/96409857/220510302-f193fc77-db1b-4817-81ff-3ab1c3a1f4d3.png)
![image](https://user-images.githubusercontent.com/96409857/220510371-a2fad42e-8063-4014-a691-ca5b66b8cc60.png)
![image](https://user-images.githubusercontent.com/96409857/220510427-b85ffc0a-55cf-43f1-b1b0-ba7776a75de2.png)

## 微信交流群

<img src="https://pichoro.msq.pub/wechat.png" alt="" width="350" height="350" />

## 开发说明

1. 你需要有 Node、Git 环境，了解 npm 的相关知识。
2. git clone [https://github.com/Kuingsmile/PicList.git](https://github.com/Kuingsmile/PicList.git) 并进入项目。
   `yarn` 下载依赖
   注意如果你没有yarn，请去 官网 下载安装后再使用。 用 npm install 将导致未知错误！
3. Mac 需要有 Xcode 环境，Windows 需要有 VS 环境。
4. 如果需要贡献代码，可以参考[贡献指南](https://github.com/Kuingsmile/PicList/blob/dev/CONTRIBUTING.md)。

### 开发模式

输入 `yarn run dev` 进入开发模式，开发模式具有热重载特性。不过需要注意的是，开发模式不稳定，会有进程崩溃的情况。此时需要：

`ctrl+c` # 退出开发模式
`yarn run dev` # 重新进入开发模式
注：Windows 开发模式运行之后会在底部任务栏的右下角应用区出现 PicList 的应用图标。

### 生产模式

如果你需要自行构建，可以 `yarn run build` 开始进行构建。构建成功后，会在 `dist_electron` 目录里出现构建成功的相应安装文件。

注意：如果你的网络环境不太好，可能会出现 `electron-builder` 下载 electron 二进制文件失败的情况。这个时候需要在 `npm run electron:build` 之前指定一下 electron 的源为国内源：

`export ELECTRON_MIRROR="https://npmmirror.com/mirrors/electron/"`

**在 Windows 上，则可以使用 `set ELECTRON_MIRROR=https://npmmirror.com/mirrors/electron/` （无需引号）**

## 其它相关

- [PicList-Core](https://github.com/Kuingsmile/PicList-Core) : 基于 PicGo-Core 二次开发的核心库，用于 CLI 操作和项目开发
- [PicHoro](https://github.com/Kuingsmile/PicHoro): 与 PicList 搭配使用的手机端 APP

## License

本项目基于MIT协议开源，欢迎大家使用和贡献代码，感谢原作者Molunerfinn的开源精神。

[MIT](https://opensource.org/licenses/MIT)

Copyright (c) 2017-present Molunerfinn

Copyright (c) 2023-present Kuingsmile

## Star Me

- Star 趋势  [![GitHub stars](https://img.shields.io/github/stars/kuingsmile/PicList?logo=github&style=social)](https://github.com/kuingsmile/PicList/stargazers)

[![Stargazers over time](https://starchart.cc/kuingsmile/PicList.svg)](https://github.com/kuingsmile/PicList/stargazers)
