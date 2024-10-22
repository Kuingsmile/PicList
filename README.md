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

[简体中文](https://github.com/Kuingsmile/PicList/blob/dev/README_cn.md) | English

PicList is an efficient cloud storage and image hosting platform management tool. Building upon the foundation of PicGo, it has been deeply modified and enhanced. Not only does it retain all of PicGo's features, but it also adds many new ones. For instance, the album now supports synchronized deletion of files in the cloud. Built-in image hosting options have been expanded to include WebDav, local image hosting, and SFTP. Additionally, PicList introduces comprehensive cloud storage management functions, including cloud directory viewing, file search, batch uploading, downloading, and file deletion, copying links in various formats, and previews for images, markdown, text, and videos. Moreover, it boasts a more powerful album function and numerous other improvements and enhancements.

## How to migrate from PicGo

PicList `V1.5.0` and above versions provide the `one-click migration` function. Enter the `Settings` page, and then click the right button on the `Migrate from PicGo` option to migrate. Please restart the application to take effect after migration.

## PicList-Core

The core of PicList is based on the original PicGo-Core [PicList-core](https://github.com/Kuingsmile/PicList-Core), which is adapted for cloud deletion and other functions, and adds watermark addition and image compression / scaling / rotation / format conversion functions, which can be called through CLI command line, support starting the built-in upload server through `picgo-server`，as well as some other function changes.

if you want to use PicList-core, please go to [https://github.com/Kuingsmile/PicList-Core](https://github.com/Kuingsmile/PicList-Core), or go to [npm official address](https://www.npmjs.com/package/piclist) to view the installation instructions.

## Features

- Retains all the features of PicGo and is compatible with the vast majority of existing PicGo plugins, including integrations with software like Typora and Obsidian.
- Added multiple built-in image hosting platforms, such as WebDav, Lsky Pro, local image hosting, SFTP. The original built-in imgur image host now also supports account login for uploading.
- Within the album, you can synchronize the deletion of cloud images. This is supported across all built-in image hosts and multiple plugins.
- The album now offers advanced search and sorting features, as well as batch URL modification.
- Built-in tools for adding watermarks, compressing images, scaling images, rotating images, and converting image formats are now available. Advanced renaming is also supported.
- Upload interface supports form upload files, can be shared by multiple computers
- Configuration can be synchronized to Github/Gitee/Gitea repositories.
- Manages over ten types of image hosting platforms, allowing online viewing of cloud directories, file searching, batch uploading, batch downloading, file deletion, and more.
- Support previewing multiple formats of files, including pictures, videos, plain text files and markdown files, etc. For the specific formats supported, please refer to [Supported file format list](https://github.com/Kuingsmile/PicList/blob/dev/supported_format.md)
- Supports the use of regular expressions for batch renaming of cloud files.
- For private storage buckets, pre-signed link copying for sharing is available.
- Software auto-updates are available, along with multiple startup modes, and many other feature details have been added and optimized.
- The PicGo interface has been enhanced, window size restrictions have been unlocked, and some interface layouts have been beautified.
- The installation package for the Mac platform is now signed, addressing the recurring issue on PicGo where the installation package was reported as damaged.

## How to use

### How to use in VScode

Please install my matching plugin [VS-PicList](https://marketplace.visualstudio.com/items?itemName=Kuingsmile.vs-piclist), compared with the vs-picgo plugin, the plugin directly depends on the PicList desktop software, supports a variety of uploads and direct cloud deletion in Vscode and other functions.

### How to use in Typora

#### **Version 1.6.0-dev and above**

**Typora 1.6.0-dev and above versions now support PicList natively if you set language of Typora to Chinese.**

If your Typora version is lower than 1.8.0, you need to set the upload service PicList and PicGo (app) to the installation path of PicList at the same time.

[download link](https://typora.io/releases/all)

#### **Version < 1.6.0-dev**

For windows, Enter the Typora settings page, select the image, set the upload service to `PicGo(app)`, and then fill in the installation path of PicList in `PicGo path`, as shown below:

![image](https://user-images.githubusercontent.com/96409857/226522101-b3531b7b-534c-4149-b527-8738d4ebb041.png)

Or, you can also use the `npm install piclist` command to install PicList-core, and then set the upload service to `PicGo-Core(command line)`.

### How to use in Obsidian

In the community plugins, search for and install the Image auto upload Plugin. Next, go to the plugin settings page and change the default uploader to PicGo(app). Set the PicGo server to `http://127.0.0.1:36677/upload` as shown in the image below. Additionally, this plugin also supports cloud-based deletion through PicList. To use this feature, enter `http://127.0.0.1:36677/delete` in the deletion interface.

![image](https://user-images.githubusercontent.com/96409857/226522718-8378c480-9fb4-4785-87e1-d59808862016.png)

### How to use in docker

#### docker run

Change the `./piclist` to your own path, this is the path where you put your `config.json` file, and change the `piclist123456` to your own secret key.

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

download `docker-compose.yml` from piclist-core repo, or copy the following content to `docker-compose.yml`:

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

You can change the `./piclist` to your own path, this is the path where you put your `config.json` file, and change the `command` to your own secret key.

Then run:

```bash
docker-compose up -d
```

## Supported platforms

|          Platform          | Album cloud deletion | Cloud storage management |
| :------------------------: | :------------------: | :----------------------: |
|       Built-in AList       |          ✔️           |            ✔️             |
|           SM.MS            |          ✔️           |            ✔️             |
|           Github           |          ✔️           |            ✔️             |
|           Imgur            |          ✔️           |            ✔️             |
|       Tencent COS V5       |          ✔️           |            ✔️             |
|         Aliyun OSS         |          ✔️           |            ✔️             |
|           Upyun            |          ✔️           |            ✔️             |
|           Qiniu            |          ✔️           |            ✔️             |
| S3 API compatible platform |          ✔️           |            ✔️             |
|           WebDAV           |          ✔️           |            ✔️             |
|           Local            |          ✔️           |            ✔️             |
|       Built-in SFTP        |          ✔️           |            ✔️             |
|         Doge Cloud         |          ✔️           |            ✔️             |
|    PicList(Lasso-Doll)     |          ✔️           |            ✔️             |
|          Lsky Pro          |          ✔️           |            ✔️             |
|    Custom API platform     |          ×           |            ×             |

|                                           Plugin                                           | Album cloud deletion |
| :----------------------------------------------------------------------------------------: | :------------------: |
|                [picgo-plugin-s3](https://github.com/wayjam/picgo-plugin-s3)                |          ✔️           |
|           [picgo-plugin-alist](https://github.com/jinzhi0123/picgo-plugin-alist)           |          ✔️           |
| [picgo-plugin-huawei-uploader](https://github.com/YunfengGao/picgo-plugin-huawei-uploader) |          ✔️           |
|         [picgo-plugin-dogecloud](https://github.com/w4j1e/picgo-plugin-dogecloud)          |          ✔️           |

## Download and install

[https://github.com/Kuingsmile/PicList/releases/latest](https://github.com/Kuingsmile/PicList/releases/latest)

### Scoop

Thanks to [scoop-lemon](https://github.com/hoilc/scoop-lemon), you can use Scoop to install PicList, just execute the following command:

```bash
scoop bucket add lemon https://github.com/hoilc/scoop-lemon
scoop install lemon/piclist
```

### Homebrew

MacOS users can now use Homebrew to install PicList, just execute the following command:

```bash
brew install piclist --cask
```

Uninstall:

```bash
brew uninstall piclist
```

### Mac special instructions

If the macOS system installs PicList and displays "file is damaged" or installs and opens without response, please upgrade to PicList V1.4.1 or above.

After V1.4.1, all mac installation packages have been signed by my developer certificate, will not be recognized by the macOS system as "malicious software", will not appear "file is damaged" prompt.

## Application screenshot

![image](https://github.com/Kuingsmile/PicList/assets/96409857/1b76c0c4-753c-4d66-aa24-f805f9c2da15)
![image](https://github.com/Kuingsmile/PicList/assets/96409857/56cf838a-a2eb-40af-96d4-1ffea25400af)
![image](https://github.com/Kuingsmile/PicList/assets/96409857/bca7688a-e07f-4e80-9edd-c224298fa8ab)
![image](https://github.com/Kuingsmile/PicList/assets/96409857/3e48e03d-b0b2-49e2-92a6-a52e0884677d)
![image](https://github.com/Kuingsmile/PicList/assets/96409857/29de0046-1aef-4b28-95a6-b26c6e297c6f)
![image](https://github.com/Kuingsmile/PicList/assets/96409857/e1c04488-2d3a-4e8f-aa26-ce41d0a383e2)

## Development instructions

1. You need to have Node, Git environment, and understand the related knowledge of npm.
2. git clone [https://github.com/Kuingsmile/PicList.git](https://github.com/Kuingsmile/PicList.git) and enter the project.
   `yarn` download dependencies
   Note that if you don't have `yarn`, please go to the official website to download and install it before using it. Using `npm install` will cause unknown errors!
3. Mac needs `Xcode` environment, Windows needs `VS` environment.
4. If you need to contribute code, you can refer to [contribution guide](https://github.com/Kuingsmile/PicList/blob/dev/CONTRIBUTING_EN.md)

### Development mode

Enter `yarn run dev` to enter development mode, which has hot reload feature. However, it should be noted that the development mode is unstable and there will be process crashes. At this time, you need to:

`ctrl+c` # Exit development mode
`yarn run dev` # Re-enter development mode

Note: After the development mode is running, the application icon of PicList will appear in the application area of the taskbar in the lower right corner of the bottom bar.

### Production mode

If you need to build it yourself, you can start building with `yarn run build`. After the build is successful, the corresponding installation file will appear in the `dist_electron` directory.

## Other related

- [PicList-Core](https://github.com/Kuingsmile/PicList-Core) : A core library based on PicGo-Core for CLI operations and project development
- [PicHoro](https://github.com/Kuingsmile/PicHoro): A mobile APP that works with PicList
- [VS-PicList](https://github.com/Kuingsmile/vs-PicList/): A VScode plugin that works with PicList

## Communication group

If you have any questions, you can join the TG group for communication.

[PicList TG Group](https://t.me/+rq8y7wsj7Pg5ZTg1)

![tg](https://pichoro.msq.pub/wechat.png)

## License

This project is open source under the MIT license. Welcome everyone to use and contribute code. Thank you for the open source spirit of the original author Molunerfinn.

[MIT](https://opensource.org/licenses/MIT)

Copyright (c) 2017-present Molunerfinn

Copyright (c) 2023-present Kuingsmile

## Star Me

- Star  [![GitHub stars](https://img.shields.io/github/stars/kuingsmile/PicList?logo=github&style=social)](https://github.com/kuingsmile/PicList/stargazers)

[![Stargazers over time](https://starchart.cc/kuingsmile/PicList.svg)](https://github.com/kuingsmile/PicList/stargazers)
