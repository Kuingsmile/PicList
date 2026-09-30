<div align="center">
  <a href="https://piclist.cn">
    <img src="https://imgx.horosama.com/admin_uploads/2022/10/2022_10_05_633d79e401694.png" alt="PicList Logo" width="120" height="120">
  </a>

  <h1>PicList</h1>

  <p>
    <strong>强大的云存储与图床管理工具</strong>
  </p>

  <p>
    <a href="eslint.config.js">
      <img src="https://img.shields.io/badge/code%20style-ESLint-green.svg?style=flat-square" alt="Code Style">
    </a>
    <a href="https://github.com/Kuingsmile/PicList/releases">
      <img src="https://img.shields.io/github/downloads/Kuingsmile/PicList/total.svg?style=flat-square" alt="Downloads">
    </a>
    <a href="https://github.com/Kuingsmile/PicList/releases/latest">
      <img src="https://img.shields.io/github/release/Kuingsmile/PicList.svg?style=flat-square" alt="Release">
    </a>
    <a href="LICENSE">
      <img src="https://img.shields.io/github/license/Kuingsmile/PicList?style=flat-square" alt="License">
    </a>
  </p>

  <p>
    <a href="README_cn.md">简体中文</a> |
    <a href="README.md">English</a>
  </p>
</div>

<br>

<div align="center">
  <img src="https://repobeats.axiom.co/api/embed/9e4ec90b7b50f8e9c10d77439e49e26b303fabed.svg" alt="Repobeats analytics image" width="100%">
</div>

## 📖 简介

**PicList** 是一款高效的云存储和图床平台管理工具，基于 PicGo 深度二次开发。它在 PicGo 上传流程的基础上提供了全面的云存储管理能力和多种实用功能以及全新的轻量化脚本系统。

无论你是需要整理云端文件、同步 Markdown 图片，还是轻松管理多个存储平台，PicList 都能通过其美观的界面和强大的插件/脚本系统，简化你的工作流程。

## ✨ 特色功能

- **📂 全面的云存储管理**：支持在云端查看目录、搜索文件、批量操作以及使用正则表达式批量重命名。
- **🔄 高级同步功能**：支持相册云删除同步，以及通过 WebDAV/Git 在多台设备间同步软件配置/相册。
- **🎨 内置图像处理**：开箱即用的水印添加、图片压缩、缩放、旋转和格式转换功能，单图床粒度控制。
- **📝 脚本系统**：支持自定义各生命周期脚本，满足高级用户的个性化需求，同时无需`node`环境。
- **🌈 主题支持**：内置多种主题，主题仓库[PicList ThemeHub](https://github.com/Kuingsmile/piclist-themeHub)，同时支持自定义主题和背景。
- **🔌 广泛的兼容性**：完美兼容 **Typora**、**Obsidian** 以及大多数现有的 PicGo 插件。
- **🛠️ 强大的实用工具**：支持上传队列、本地/SFTP 图床、预签名 URL 生成等。
- **🌐 全平台支持**：支持 Web 端表单上传，并可与移动端 APP **PicHoro** 配合使用。

## 📸 应用截图

<details open>
<summary><strong>上传界面</strong></summary>
<br>
<div align="center">
  <img src="https://github.com/Kuingsmile/PicList/blob/dev/imgs/upload.webp?raw=true" alt="Upload Interface" width="100%">
</div>
<div align="center">
  <img width="2098" height="1398" alt="Image" src="https://github.com/Kuingsmile/PicList/blob/dev/imgs/anime.webp?raw=true" />
</div>
</details>

<details open>
<summary><strong>更多视图 (相册、设置、任务系统)</strong></summary>
<br>
<table align="center">
  <tr>
    <td><img src="https://github.com/Kuingsmile/PicList/blob/dev/imgs/gallery.webp?raw=true" alt="Gallery"></td>
    <td><img src="https://github.com/Kuingsmile/PicList/blob/dev/imgs/cloud_storage.webp?raw=true" alt="Cloud Storage"></td>
  </tr>
  <tr>
    <td><img src="https://github.com/Kuingsmile/PicList/blob/dev/imgs/settings.webp?raw=true" alt="Settings"></td>
    <td><img src="https://github.com/Kuingsmile/PicList/blob/dev/imgs/task.webp?raw=true" alt="Task"></td>
  </tr>
   <tr>
    <td><img src="https://github.com/Kuingsmile/PicList/blob/dev/imgs/image_editing.webp?raw=true" alt="Settings"></td>
    <td><img src="https://github.com/Kuingsmile/PicList/blob/dev/imgs/dark.webp?raw=true" alt="Task"></td>
  </tr>
</table>
</details>

## 📥 下载安装

### 💻 桌面端应用

|  操作系统   |   安装方式   | 命令 / 链接                                                                                      |
| :---------: | :----------: | :----------------------------------------------------------------------------------------------- |
| **Windows** |  **Winget**  | `winget install Kuingsmile.PicList`                                                              |
|             |  **Scoop**   | `scoop bucket add lemon https://github.com/hoilc/scoop-lemon` <br> `scoop install lemon/piclist` |
|             |  **安装包**  | [下载 .exe](https://github.com/Kuingsmile/PicList/releases/latest)                               |
|  **macOS**  | **Homebrew** | `brew install piclist --cask`                                                                    |
|             |   **DMG**    | [下载 .dmg](https://github.com/Kuingsmile/PicList/releases/latest)                               |
|  **Linux**  |  **安装包**  | [下载 AppImage/Snap/Deb](https://github.com/Kuingsmile/PicList/releases/latest)                  |

### 🐳 Docker / PicList-Core

Docker 运行独立的 PicList-Core 上传服务。此仓库的源码和构建脚本用于 Electron 桌面应用。容器部署请参阅 [PicList-Core](https://github.com/Kuingsmile/PicList-Core) 和 [FAQ](FAQ.md)。

## 🔌 集成与使用

PicList 可以与常用的 Markdown 编辑器无缝集成。

### VSCode

安装 **[VS-PicList](https://marketplace.visualstudio.com/items?itemName=Kuingsmile.vs-piclist)** 插件以获得最佳体验。

### Typora

- **版本 ≥ 1.6.0**：在图像设置中直接选择 **PicList**。
- **版本 < 1.6.0**：设置“上传服务” -> “PicGo(app)”，并将路径指向 PicList 的可执行文件。

### Obsidian

1. 安装 **Image Auto Upload Plugin** 插件。
2. 设置默认上传器为 **PicGo(app)**。
3. API 地址设置：`http://127.0.0.1:36677/upload`

## ☁️ 已支持平台

上传器、相册远端删除和云存储管理分别提供不同能力。上传器来自 PicList-Core 和已安装插件；下表反映当前桌面端的删除适配器和管理客户端。

| 存储平台                 | 相册远端删除 |        云存储管理        |
| :----------------------- | :----------: | :----------------------: |
| **AWS S3**（及兼容 API） |      ✅      |            ✅            |
| **阿里云 OSS**           |      ✅      |            ✅            |
| **腾讯云 COS**           |      ✅      |            ✅            |
| **七牛云 Kodo**          |      ✅      |            ✅            |
| **又拍云**               |      ✅      |            ✅            |
| **GitHub**               |      ✅      |            ✅            |
| **S.EE / Imgur**         |      ✅      |            ✅            |
| **WebDAV / SFTP**        |      ✅      |            ✅            |
| **本地文件系统**         |      ✅      |            ✅            |
| **多吉云**               |      ✅      | 通过 S3 API 的多吉云选项 |
| **兰空图床 / Alist**     |      ✅      |            —             |
| **华为云 OBS**           |      ✅      |            —             |
| **另一台 PicList 服务**  |      ✅      |            —             |

“—”表示没有专用管理客户端。删除能力取决于上传器 ID、凭据和相册记录中的远端文件信息。自定义 API 图床可通过 `onGalleryRemove` 生命周期脚本实现删除。

实现入口：[删除注册表](src/main/apis/delete/allApi.ts)、[管理客户端](src/main/manage/manageApi.ts)。上传器列表和排错说明见 [FAQ](FAQ.md)。

## 🚀 开发说明

完整的源码结构、命令表、JSON 国际化、插件开发和打包流程见 [贡献与开发指南](CONTRIBUTING.md)。主进程服务和 RPC 说明见 [API 指南](src/main/apis/README.md)。

### 环境要求

- Node.js **22.x，至少 22.13.0**（当前核心依赖的版本要求；发布工作流使用 22.x）。
- **Yarn Classic 1.22.x** 和 Git。
- 原生依赖可能需要平台编译工具。Windows 打包和准备实验性插件运行时需要 Visual Studio C++ Build Tools。

### 从源码运行

```bash
git clone https://github.com/Kuingsmile/PicList.git
cd PicList
yarn install --frozen-lockfile

# 启动 Electron 开发模式
yarn dev

# 编译生产代码（不生成安装包），再预览
yarn prebuild
yarn preview
```

安装时会下载主题、安装 Husky 钩子并处理 Electron 原生依赖。开发服务器固定使用 `127.0.0.1:30303`。

`yarn build` 使用 electron-builder 打包，`yarn build:win`、`yarn build:mac`、`yarn build:linux` 选择平台。请先按贡献指南准备对应工具链；Windows 还需运行 `yarn prepare:7za`。编译产物位于 `out/`，安装包和压缩包位于 `dist_electron/`。

## 🔗 相关项目

- **[PicList ThemeHub](https://github.com/Kuingsmile/piclist-themeHub)**: PicList 的主题仓库。
- **[PicList ScriptsHub](https://github.com/Kuingsmile/piclist-ScriptsHub)**：PicList 的脚本仓库。
- **[PicList-Core](https://github.com/Kuingsmile/PicList-Core)**：PicList 的核心 CLI 库。
- **[PicHoro](https://github.com/Kuingsmile/PicHoro)**：PicList 的 Android 移动端 APP。

## 📄 开源协议

本项目遵循 **MIT License** 开源协议。

Copyright (c) 2017-present Molunerfinn
Copyright (c) 2023-present Kuingsmile

---

<div align="center">
  <p>Star Me！ ⭐️</p>

[![Star History Chart](https://api.star-history.com/svg?repos=Kuingsmile/PicList&type=Date)](https://star-history.com/#Kuingsmile/PicList&Date)

</div>
