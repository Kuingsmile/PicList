<div align="center">
  <img src="https://imgx.horosama.com/admin_uploads/2022/10/2022_10_05_633d79e401694.png" alt="">
  <h1>PicList</h1>
  <a href="https://github.com/Kuingsmile/PicList/actions">
    <img src="https://img.shields.io/badge/code%20style-standard-green.svg?style=flat-square" alt="">
  </a>
  <a href="https://github.com/Kuingsmile/PicList/releases">
    <img src="https://img.shields.io/github/downloads/Kuingsmile/PicList/total.svg?style=flat-square" alt="">
  </a>
  <a href="https://github.com/Kuingsmile/PicList/actions">
    <img src="https://github.com/Kuingsmile/PicList/actions/workflows/manually.yml/badge.svg" alt="">
  </a>
  <a href="https://github.com/Kuingsmile/PicList/releases/latest">
    <img src="https://img.shields.io/github/release/Kuingsmile/PicList.svg?style=flat-square" alt="">
  </a>
</div>

![Alt](https://repobeats.axiom.co/api/embed/9e4ec90b7b50f8e9c10d77439e49e26b303fabed.svg "Repobeats analytics image")

简体中文 | [English](https://github.com/Kuingsmile/PicList/blob/dev/README.md)

PicList是一款高效的云存储和图床平台管理工具，在PicGo的基础上经过深度的二次开发，不仅完整保留了PicGo的所有功能，还增添了许多新的feature。例如相册支持同步云端删除文件，内置图床额外添加了WebDav、本地图床和SFTP等。PicList同时增加了完整的云存储管理功能，包括云端目录查看、文件搜索、批量上传下载和删除文件，复制多种格式文件链接和图片/markdown/文本/视频预览等，另外还有更加强大的相册和多项功能新增或优化。

## 如何从PicGo迁移

PicList `V1.5.0`以上版本提供 `一键迁移`功能，进入 `设置`页面，然后在 `从PicGo迁移`选项点击右侧按钮即可，迁移后请重启应用生效。

## PicList-Core

PicList的内核使用的是原版PicGo-Core基础上修改的[PicList-core](https://github.com/Kuingsmile/PicList-Core)，为云端删除等功能做了适配，同时，新增了水印添加和图片压缩/缩放/旋转/格式转换等功能，可以通过CLI命令行调用，支持通过`picgo-server`命令开启上传服务器，还有一些其他的功能改动。

如果您希望使用PicList-core，请前往[https://github.com/Kuingsmile/PicList-Core](https://github.com/Kuingsmile/PicList-Core)，或者前往[npm官方地址](https://www.npmjs.com/package/piclist)查看安装说明。

## 特色功能

- 保留了PicGo的所有功能，兼容绝大部分已有的PicGo插件，包括和Typora、Obsidian等软件的搭配
- 新增了多个内置图床，如WebDav、兰空图床、本地图床、SFTP等，原内置imgur图床额外支持登录账号上传
- 相册中可同步删除云端图片，支持所有内置图床和多个插件
- 相册新增了高级搜索和排序，批量修改URL等功能
- 内置水印添加、图片压缩、图片缩放、图片旋转和图片格式转换等功能，同时支持高级重命名
- 上传接口支持表单上传文件，可多电脑共用
- 支持配置同步至Github/Gitee/Gitea仓库
- 支持管理十余种图床，可以在线进行云端目录查看、文件搜索、批量上传、批量下载、删除文件等
- 支持预览多种格式的文件，包括图片、视频、纯文本文件和markdown文件等，具体支持的格式请参考[支持的文件格式列表](https://github.com/Kuingsmile/PicList/blob/dev/supported_format.md)
- 支持启用正则表达式的批量云端文件重命名
- 对于私有存储桶等支持复制预签名链接进行分享
- 支持软件自动更新，支持多种启动模式，还有更多功能细节新增和优化
- 优化了PicGo的界面，解锁了窗口大小限制，同时美化了部分界面布局
- mac平台安装包已签名，从源头解决了PicGo上的安装包已损坏的日经问题

## 如何使用

### 如何在Vscode中使用

请安装我的配套插件 [VS-PicList](https://marketplace.visualstudio.com/items?itemName=Kuingsmile.vs-piclist),相比于vs-picgo插件，该插件直接依赖于PicList桌面端软件，支持多样上传和直接在Vscode中进行云端删除等功能。

### 如何在Typora中使用

#### **1.6.0版本及以上**

**Typora 1.6.0-dev以及以上版本现在已经原生支持PicList了, 但你需要将Typora的语言设置为中文**

1.8.0以下版本的Typora中需要同时设置上传服务PicList和PicGo（app）的路径为PicList的安装路径。

[下载地址](https://typora.io/releases/all)

#### 1.6.0版本以下

Windows:

进入Typora设置界面，选择图像，将上传服务设置为 `PicGo(app)`，然后在 `PicGo路径`中填写PicList的安装路径，如下图所示：

![image](https://user-images.githubusercontent.com/96409857/226522101-b3531b7b-534c-4149-b527-8738d4ebb041.png)

或者，您也可以使用 `npm install piclist`命令安装PicList-core，然后上传服务设置为 `PicGo-Core(command line)`。

### 如何在Obsidian中使用

在社区插件中搜索安装 `Image auto upload Plugin`，然后进入插件设置页面，修改默认上传器为 `PicGo(app)`，设置 `PicGo server`为 `http://127.0.0.1:36677/upload`即可，如下图所示, 此外该插件还额外支持通过PicList进行云端删除，请在删除接口内填入 `http://127.0.0.1:36677/delete`：

![image](https://user-images.githubusercontent.com/96409857/226522718-8378c480-9fb4-4785-87e1-d59808862016.png)

### 如何在Docker中使用

#### docker run

修改`./piclist`为你自己的配置文件`config.json`所在的路径，修改`piclist123456`为你自己的密钥。

```bash
docker run -d \
  --name piclist \
  --restart always \
  -p 36677:36677 \
  -v "./piclist:/root/.piclist" \
  kuingsmile/piclist:latest \
  node /usr/local/bin/picgo-server -k piclist123456
```

#### docker-compose

从piclist-core仓库下载`docker-compose.yml`文件，或者复制以下内容到`docker-compose.yml`文件中：

```yaml
version: '3.3'

services:
  node:
    image: 'kuingsmile/piclist:latest'
    container_name: piclist
    restart: always
    ports:
      - 36677:36677
    volumes:
      - './piclist:/root/.piclist'
    command: node /usr/local/bin/picgo-server -k piclist123456
```

你可以修改`./piclist`为你自己的配置文件`config.json`所在的路径，修改`command`为你自己的密钥。

然后运行

```bash
docker-compose up -d
```

## 已支持平台

|      平台      | 相册云删除 | 云存储管理 |
| :------------: | :--------: | :--------: |
|   内置AList    |     ✔️      |     ✔️      |
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
|    内置SFTP    |     ✔️      |     ✔️      |
|     多吉云     |     ✔️      |     ✔️      |
| PicList(套娃)  |     ✔️      |     ✔️      |
|    兰空图床    |     ✔️      |     ✔️      |
|   自定义图床   |     x      |     x      |

|                                            插件                                            | 相册云删除 |
| :----------------------------------------------------------------------------------------: | :--------: |
|                [picgo-plugin-s3](https://github.com/wayjam/picgo-plugin-s3)                |     ✔️      |
|           [picgo-plugin-alist](https://github.com/jinzhi0123/picgo-plugin-alist)           |     ✔️      |
| [picgo-plugin-huawei-uploader](https://github.com/YunfengGao/picgo-plugin-huawei-uploader) |     ✔️      |
|         [picgo-plugin-dogecloud](https://github.com/w4j1e/picgo-plugin-dogecloud)          |     ✔️      |

## 下载安装

[https://github.com/Kuingsmile/PicList/releases/latest](https://github.com/Kuingsmile/PicList/releases/latest)

### Scoop

感谢[scoop-lemon](https://github.com/hoilc/scoop-lemon)，你可以使用Scoop来安装PicList，只需要执行以下命令即可：

```bash
scoop bucket add lemon https://github.com/hoilc/scoop-lemon
scoop install lemon/piclist
```

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

如果macOS系统安装PicList后显示“文件已损坏”或者安装后打开无响应，请升级到PicList V1.4.1或以上版本。

V1.4.1之后，所有mac安装包都已经使用我的开发者证书签名，不会被macOS系统识别为“恶意软件”，不会出现“文件已损坏”提示。

## 应用截图

![image](https://github.com/Kuingsmile/PicList/assets/96409857/1b76c0c4-753c-4d66-aa24-f805f9c2da15)
![image](https://github.com/Kuingsmile/PicList/assets/96409857/56cf838a-a2eb-40af-96d4-1ffea25400af)
![image](https://github.com/Kuingsmile/PicList/assets/96409857/bca7688a-e07f-4e80-9edd-c224298fa8ab)
![image](https://github.com/Kuingsmile/PicList/assets/96409857/3e48e03d-b0b2-49e2-92a6-a52e0884677d)
![image](https://github.com/Kuingsmile/PicList/assets/96409857/29de0046-1aef-4b28-95a6-b26c6e297c6f)
![image](https://github.com/Kuingsmile/PicList/assets/96409857/e1c04488-2d3a-4e8f-aa26-ce41d0a383e2)

## 开发说明

1. 你需要有 Node、Git 环境，了解 npm 的相关知识。
2. git clone [https://github.com/Kuingsmile/PicList.git](https://github.com/Kuingsmile/PicList.git) 并进入项目。
   `yarn` 下载依赖
   注意如果你没有`yarn`，请去 官网 下载安装后再使用。 用 `npm install` 将导致未知错误！
3. Mac 需要有 `Xcode` 环境，Windows 需要有 `VS` 环境。
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
- [VS-PicList](https://github.com/Kuingsmile/vs-PicList/): 与 PicList 搭配使用的VScode插件

## 交流群

如果有任何问题，可以加入TG群进行交流.

[PicList交流群](https://t.me/+rq8y7wsj7Pg5ZTg1)

![tg](https://pichoro.msq.pub/wechat.png)

## License

本项目基于MIT协议开源，欢迎大家使用和贡献代码，感谢原作者Molunerfinn的开源精神。

[MIT](https://opensource.org/licenses/MIT)

Copyright (c) 2017-present Molunerfinn

Copyright (c) 2023-present Kuingsmile

## Star Me

- Star 趋势  [![GitHub stars](https://img.shields.io/github/stars/kuingsmile/PicList?logo=github&style=social)](https://github.com/kuingsmile/PicList/stargazers)

[![Stargazers over time](https://starchart.cc/kuingsmile/PicList.svg)](https://github.com/kuingsmile/PicList/stargazers)
