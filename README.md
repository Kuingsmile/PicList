
<div align="center">
  <img src="http://imgx.horosama.com/admin_uploads/2022/10/2022_10_05_633d79e401694.png" alt="">
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

&emsp;&emsp;fork自PicGo的二次开发项目，保留了PicGo的所有功能的同时，为相册添加了同步云端删除功能，同时增加了完整的云存储管理功能，包括云端目录查看、文件搜索、批量上传下载和删除文件，复制多种格式文件和图片预览等。

## 特色功能

- 保留了PicGo的所有功能，兼容已有的PicGo插件系统，包括和typora、obsidian等的搭配
- 相册中可同步删除云端图片
- 支持管理所有图床，可以在线进行云端目录查看、文件搜索、批量上传、批量下载、删除文件和图片预览等
- 管理界面使用内置数据库缓存目录，加速目录加载速度
- 对于私有存储桶等支持复制预签名链接进行分享
- 优化了PicGo的界面，解锁了窗口大小限制，同时美化了部分界面布局

## 已支持平台

| 平台 | 相册云删除 | 云存储管理 |
| :--: | :--: | :--- |
| SM.MS | :heavy_check_mark: | :heavy_check_mark: |
| Github | :heavy_check_mark: | :heavy_check_mark: |
| Imgur | :heavy_check_mark: | :heavy_check_mark: |
| 腾讯COS V5 | :heavy_check_mark: | :heavy_check_mark: |
| 阿里云OSS | :heavy_check_mark: | :heavy_check_mark: |
| 又拍云 | :heavy_check_mark: | :heavy_check_mark: |
| 七牛云 | :heavy_check_mark: | :heavy_check_mark: |

| 插件 | 相册云删除 |
| :--: | :--: |
| [picgo-plugin-s3](https://github.com/wayjam/picgo-plugin-s3) | :heavy_check_mark: |

## 下载安装

### Github release

[https://github.com/Kuingsmile/PicList/releases](https://github.com/Kuingsmile/PicList/releases)

### CDN加速下载地址

- [PicList-1.0.1-arm64.dmg](https://release.piclist.cn/1.0.1/PicList-1.0.1-arm64.dmg)
- [PicList-1.0.1-x64.dmg](https://release.piclist.cn/1.0.1/PicList-1.0.1-x64.dmg)
- [PicList-1.0.1.AppImage](https://release.piclist.cn/1.0.1/PicList-1.0.1.AppImage)
- [PicList-Setup-1.0.1-ia32.exe](https://release.piclist.cn/1.0.1/PicList-Setup-1.0.1-ia32.exe)
- [PicList-Setup-1.0.1-x64.exe](https://release.piclist.cn/1.0.1/PicList-Setup-1.0.1-x64.exe)
- [PicList-Setup-1.0.1.exe](https://release.piclist.cn/1.0.1/PicList-Setup-1.0.1.exe)
- [piclist_1.0.1_amd64.snap](https://release.piclist.cn/1.0.1/piclist_1.0.1_amd64.snap)

## 应用截图

![image](https://user-images.githubusercontent.com/96409857/219062180-ba6de40b-94bb-45be-a510-c4d231920032.png)
![image](https://user-images.githubusercontent.com/96409857/219063188-d7e0b0e7-6e3c-4deb-8bef-0b2b57d2d7ee.png)
![image](https://user-images.githubusercontent.com/96409857/219063398-9a8607df-a1e2-4121-a652-ebd63b38007b.png)

## 开发说明

1. 你需要有 Node、Git 环境，了解 npm 的相关知识。
2. git clone [https://github.com/Kuingsmile/PicList.git](https://github.com/Kuingsmile/PicList.git) 并进入项目。
yarn 下载依赖。注意如果你没有 yarn，请去 官网 下载安装后再使用。 用 npm install 将导致未知错误！
3. Mac 需要有 Xcode 环境，Windows 需要有 VS 环境。
4. 如果需要贡献代码，可以参考[贡献指南](https://github.com/Kuingsmile/PicList/blob/dev/CONTRIBUTING.md)。

### 开发模式

输入 `yarn run dev` 进入开发模式，开发模式具有热重载特性。不过需要注意的是，开发模式不稳定，会有进程崩溃的情况。此时需要：

ctrl+c # 退出开发模式
yarn run dev # 重新进入开发模式
注：Windows 开发模式运行之后会在底部任务栏的右下角应用区出现 PicGo 的应用图标。

### 生产模式

如果你需要自行构建，可以 `yarn run build` 开始进行构建。构建成功后，会在 dist_electron 目录里出现构建成功的相应安装文件。

注意：如果你的网络环境不太好，可能会出现 electron-builder 下载 electron 二进制文件失败的情况。这个时候需要在 npm run electron:build 之前指定一下 electron 的源为国内源：

export ELECTRON_MIRROR="https://npmmirror.com/mirrors/electron/"

**在 Windows 上，则可以使用 set ELECTRON_MIRROR=https://npmmirror.com/mirrors/electron/ （无需引号）**

## 其它相关

- [PicGo](https://github.com/Molunerfinn/PicGo) : 原版PicGo项目
- [PicHoro](https://github.com/Kuingsmile/PicHoro): 与PicList搭配使用的手机端APP

## License

本项目基于MIT协议开源，欢迎大家使用和贡献代码，感谢原作者Molunerfinn的开源精神。

[MIT](https://opensource.org/licenses/MIT)

Copyright (c) 2017-present, Molunerfinn  
 
Copyright (c) 2023-present Kuingsmile
