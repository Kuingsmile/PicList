
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

&emsp;&emsp;fork自PicGo的二次开发项目，保留了PicGo的所有功能的同时，为相册添加了同步云端删除功能，同时增加了完整的云存储管理功能，包括云端目录查看、文件搜索、批量上传下载和删除文件，复制多种格式文件链接和图片/markdown/文本/视频预览等。

## 特色功能

- 保留了PicGo的所有功能，兼容已有的PicGo插件系统，包括和typora、obsidian等的搭配
- 相册中可同步删除云端图片
- 支持管理所有图床，可以在线进行云端目录查看、文件搜索、批量上传、批量下载、删除文件等
- 支持预览多种格式的文件，包括图片、视频、纯文本文件和markdown文件等，具体支持的格式请参考[支持的文件格式列表](https://github.com/Kuingsmile/PicList/blob/dev/supported_format.md)
- 管理界面使用内置数据库缓存目录，加速目录加载速度
- 对于私有存储桶等支持复制预签名链接进行分享
- 优化了PicGo的界面，解锁了窗口大小限制，同时美化了部分界面布局

## 已支持平台

| 平台 | 相册云删除 | 云存储管理 |
| :--: | :--: | :--: |
| SM.MS | :heavy_check_mark: | :heavy_check_mark: |
| Github | :heavy_check_mark: | :heavy_check_mark: |
| Imgur | :heavy_check_mark: | :heavy_check_mark: |
| 腾讯COS V5 | :heavy_check_mark: | :heavy_check_mark: |
| 阿里云OSS | :heavy_check_mark: | :heavy_check_mark: |
| 又拍云 | :heavy_check_mark: | :heavy_check_mark: |
| 七牛云 | :heavy_check_mark: | :heavy_check_mark: |
| S3 API兼容平台 | :heavy_check_mark: | :heavy_check_mark: |
| WebDAV | :heavy_check_mark: | :heavy_check_mark: |

| 插件 | 相册云删除 |
| :--: | :--: |
| [picgo-plugin-s3](https://github.com/wayjam/picgo-plugin-s3) | :heavy_check_mark: |

## 下载安装

[https://github.com/Kuingsmile/PicList/releases/latest](https://github.com/Kuingsmile/PicList/releases/latest)

## 应用截图

![image](https://user-images.githubusercontent.com/96409857/220510112-e524f270-ab56-4e8b-bfb2-eb0a77e559ef.png)
![image](https://user-images.githubusercontent.com/96409857/220510176-8a3f9f19-9182-4b56-b943-fc408ef63f22.png)
![image](https://user-images.githubusercontent.com/96409857/220510302-f193fc77-db1b-4817-81ff-3ab1c3a1f4d3.png)
![image](https://user-images.githubusercontent.com/96409857/220510371-a2fad42e-8063-4014-a691-ca5b66b8cc60.png)
![image](https://user-images.githubusercontent.com/96409857/220510427-b85ffc0a-55cf-43f1-b1b0-ba7776a75de2.png)

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

- [PicGo](https://github.com/Molunerfinn/PicGo) : 原版PicGo项目
- [PicHoro](https://github.com/Kuingsmile/PicHoro): 与PicList搭配使用的手机端APP

## License

本项目基于MIT协议开源，欢迎大家使用和贡献代码，感谢原作者Molunerfinn的开源精神。

[MIT](https://opensource.org/licenses/MIT)

Copyright (c) 2017-present, Molunerfinn  
 
Copyright (c) 2023-present Kuingsmile
