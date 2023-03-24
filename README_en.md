
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

[简体中文](https://github.com/Kuingsmile/PicList/blob/dev/README.md) | English

PicList is a cloud storage platform management and file upload tool based on PicGo, which has been deeply redeveloped. It retains all the functions of PicGo, adds the function of synchronous cloud deletion to the album, and adds a complete cloud storage management function, including cloud directory viewing, file search, batch upload and download, and file deletion, copying multiple formats of file links and image/markdown/text/video preview, etc.

## How to migrate from PicGo

PicList `V1.5.0` and above versions provide the `one-click migration` function. Enter the `Settings` page, and then click the right button on the `Migrate from PicGo` option to migrate. Please restart the application to take effect after migration.

## PicList-Core

The core of PicList is based on the original PicGo-Core [PicList-core](https://github.com/Kuingsmile/PicList-Core), which is adapted for cloud deletion and other functions, and adds watermark addition and image compression / scaling / rotation / format conversion functions, which can be called through CLI command line, as well as some other function changes.

if you want to use PicList-core, please go to [https://github.com/Kuingsmile/PicList-Core](https://github.com/Kuingsmile/PicList-Core), or go to [npm official address](https://www.npmjs.com/package/piclist) to view the installation instructions.

## Features

- Maintain all the functions of PicGo, compatible with the existing PicGo plug-in system, including the combination with typora, obsidian and other software
- Synchronous cloud deletion of pictures in the album
- Built-in watermark addition, image compression, image scaling, image rotation and image format conversion functions, support custom configuration, and can be called through CLI command line
- Support management of all cloud storage platforms, can be online to view the cloud directory, file search, batch upload, batch download, delete files and other operations
- Support previewing multiple formats of files, including pictures, videos, plain text files and markdown files, etc. For the specific formats supported, please refer to [Supported file format list](https://github.com/Kuingsmile/PicList/blob/dev/supported_format.md)
- Support batch cloud file renaming based on regular expressions
- The management interface uses the built-in database cache directory to accelerate the directory loading speed
- For private storage buckets and other cloud storage platforms that support copying pre-signed links for sharing
- Optimized the PicGo interface, unlocked the window size limit, and beautified the interface layout
- The installation package of the mac platform has been signed, and the installation package has been corrupted from the source to solve the daily problem of PicGo's installation package has been corrupted

### How to use in Typora

Enter the Typora settings page, select the image, set the upload service to `PicGo(app)`, and then fill in the installation path of PicList in `PicGo path`, as shown below:

![image](https://user-images.githubusercontent.com/96409857/226522101-b3531b7b-534c-4149-b527-8738d4ebb041.png)

Or, you can also use the `npm install piclist` command to install PicList-core, and then set the upload service to `PicGo-Core(command line)`.

### How to use in Obsidian

Search and install `Image auto upload Plugin` in the community plugin, then enter the plugin settings page, modify the default uploader to `PicGo(app)`, set `PicGo server` to `http://127.0.0.1:36677/upload`, as shown below:

![image](https://user-images.githubusercontent.com/96409857/226522718-8378c480-9fb4-4785-87e1-d59808862016.png)

## Supported platforms

|          Platform          | Album cloud deletion | Cloud storage management |
| :------------------------: | :------------------: | :----------------------: |
|           SM.MS            |  :heavy_check_mark:  |    :heavy_check_mark:    |
|           Github           |  :heavy_check_mark:  |    :heavy_check_mark:    |
|           Imgur            |  :heavy_check_mark:  |    :heavy_check_mark:    |
|       Tencent COS V5       |  :heavy_check_mark:  |    :heavy_check_mark:    |
|         Aliyun OSS         |  :heavy_check_mark:  |    :heavy_check_mark:    |
|           Upyun            |  :heavy_check_mark:  |    :heavy_check_mark:    |
|           Qiniu            |  :heavy_check_mark:  |    :heavy_check_mark:    |
| S3 API compatible platform |  :heavy_check_mark:  |    :heavy_check_mark:    |
|           WebDAV           |  :heavy_check_mark:  |    :heavy_check_mark:    |

|                            Plugin                            | Album cloud deletion |
| :----------------------------------------------------------: | :------------------: |
| [picgo-plugin-s3](https://github.com/wayjam/picgo-plugin-s3) |  :heavy_check_mark:  |

## Download and install

[https://github.com/Kuingsmile/PicList/releases/latest](https://github.com/Kuingsmile/PicList/releases/latest)

### Mac special instructions

If the macOS system installs PicList and displays "file is damaged" or installs and opens without response, please upgrade to PicList V1.4.1 or above.

After V1.4.1, all mac installation packages have been signed by my developer certificate, will not be recognized by the macOS system as "malicious software", will not appear "file is damaged" prompt.

### Mac App Store

PicList currently provides free Mac version installation packages on Github, and is also on the Mac App Store. If you want to install through the Mac App Store, please go to [Mac App Store](https://apps.apple.com/app/piclist-基于picgo的图片管理工具/id6446192094) to download.

需要注意的是，Mac App Store中，你需要支付 `一元` 人民币，才能使用，这是由于苹果开发者账号需要 99 美元/年的费用，同时Github中下载的mac安装包能够签名避免被macOS系统识别为「恶意软件」也需要这个开发者账号。
You need to pay $ 1 to use it in the Mac App Store, because the Apple developer account needs to pay 99 US dollars per year, and the Mac installation package downloaded from Github can be signed to avoid being recognized by the macOS system as "malicious software", which also requires this developer account.

If PicList is helpful to you, you are welcome to purchase it through the Mac App Store, which is the best support for me.

Mac App Store version and Github version are synchronized, there will be no additional features.

**Of course, if you don't want to pay, you can also download the free installation package through Github to install.**

## Application screenshot

![image](https://user-images.githubusercontent.com/96409857/222900642-f1d04a41-f025-4f3c-b838-bae770e0b929.png)
![image](https://user-images.githubusercontent.com/96409857/222900656-6bb33045-6672-4c4d-ac34-1b9ba86011cc.png)
![image](https://user-images.githubusercontent.com/96409857/220510112-e524f270-ab56-4e8b-bfb2-eb0a77e559ef.png)
![image](https://user-images.githubusercontent.com/96409857/220510176-8a3f9f19-9182-4b56-b943-fc408ef63f22.png)
![image](https://user-images.githubusercontent.com/96409857/220510302-f193fc77-db1b-4817-81ff-3ab1c3a1f4d3.png)
![image](https://user-images.githubusercontent.com/96409857/220510371-a2fad42e-8063-4014-a691-ca5b66b8cc60.png)
![image](https://user-images.githubusercontent.com/96409857/220510427-b85ffc0a-55cf-43f1-b1b0-ba7776a75de2.png)

## WeChat group

<img src="https://pichoro.msq.pub/wechat.png" alt="" width="350" height="350" />

## Development instructions

1. You need to have Node, Git environment, and understand the related knowledge of npm.
2. git clone [https://github.com/Kuingsmile/PicList.git](https://github.com/Kuingsmile/PicList.git) and enter the project.
`yarn` download dependencies
Note that if you don't have yarn, please go to the official website to download and install it before using it. Using npm install will cause unknown errors!
3. Mac needs Xcode environment, Windows needs VS environment.
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

## License

This project is open source under the MIT license. Welcome everyone to use and contribute code. Thank you for the open source spirit of the original author Molunerfinn.

[MIT](https://opensource.org/licenses/MIT)

Copyright (c) 2017-present, Molunerfinn  
 
Copyright (c) 2023-present Kuingsmile
