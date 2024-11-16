# FAQ

This FAQ has been modified from PicGo's FAQ, and thanks to the author Molunerfinn for PicGo.

## Common Questions

> Please refer to [user manual](https://piclist.cn/en) for general configuration issues.

## 1. What is the relationship between PicList and PicGo?

PicList is forked from the PicGo project and is based on PicGo for secondary development. At the same time, the core function kernel PicGo-Core has been developed for the second time and renamed as [PicList-Core](https://github.com/Kuingsmile/PicList-Core).

The addition of all new features to PicList has not affected PicGo's existing functions, so you can use all PicGo plugins in PicList. At the same time, it can still be used in conjunction with software such as Typora and Obsidian.

## 2. When using the image hosting management function, errors such as "unable to retrieve directory" occur

Please check the log file `manage.log`. In addition, the API calls of various platforms have a limit on the number of calls per hour. If an error occurs, please try again later.

## 3. Which remote image hosting deletion is supported?

Currently, the supported image hosting platforms are:

- Aliyun OSS
- Tencent Cloud COS
- Qiniu Cloud Kodo
- Upyun
- SM.MS
- Imgur
- GitHub
- Webdav
- Aws S3
- Local path
- Built-in SFTP
- Doge Cloud
- Huawei Cloud OBS
- Alist
- Lsky Pro

## 4. Is it possible to upload video files?

Yes. With the newly added image hosting management function, you can upload files of any format, including video files. At the same time, when uploading in the management interface, using methods such as chunked uploading and streaming uploading is faster and more stable compared to the base64 conversion method built into PicGo.

## 5. Does PicList support a certain image hosting platform?

PicList itself supports the following image hosting platforms:

- Qiniu Cloud
- AWS S3 compatible platform
- Tencent Cloud COS
- Upyun
- GitHub
- SM.MS
- Aliyun OSS
- Imgur
- Webdav
- Local path
- SFTP
- Lsky Pro
- PicList (nested)
- Advanced custom image hosting

PicList plans to integrate and optimize existing plugins and embed more commonly used image hosting platforms.

In addition, PicList is compatible with PicGo's plugin system. If you need support for other image hosting platforms, you can refer to the [PicGo third-party plugins](https://github.com/PicGo/Awesome-PicGo). If you still cannot find the image hosting platform you need, please develop a plugin for everyone to use.

## 6. The GitHub image hosting platform sometimes uploads successfully and sometimes fails

The problem with GitHub servers and China's Great Firewall may cause successful or failed uploads. There is no solution.

If you want stability, please use paid cloud storage such as Aliyun and Tencent Cloud. The price is not expensive.

## 7. The main window interface of PicList cannot be opened on Mac

To open the main window, right-click or two-finger tap the PicList icon in the top bar and select "Open Main Window."

Or right-click the PicList icon in the dock and select "Open Main Window."

## 8. Upload failed, or server error

1. PicList's built-in image hosting platforms have been tested, and upload errors are generally not caused by PicList itself. If you are using the GitHub image hosting platform, please refer to the 7th point above.
2. Check PicList's log (the error log can be found by clicking "Open" in PicList Settings -> Set Log File ->), and see if there is any key information in the `[PicList Error]` error message

   1. First search for the error message in the error message by yourself, and you can often Baidu or Google the cause of the problem, so you don't need to open an issue.
   2. If there are `401`, `403` and other `40X` status code words, don't doubt it, it means that your configuration is wrong, check the configuration carefully to see if there are extra spaces, etc.
   3. If there are words such as `HttpError`, `RequestError`, `socket hang up`, etc., it means that this is a network problem, and I cannot help you solve the network problem. Please check your own network, whether there is a proxy, whether the DNS setting is normal, etc.
3. Usually, upload failures caused by network problems are caused by improper proxy settings. If the system proxy is turned on, it is recommended to set the corresponding HTTP proxy in the proxy settings of PicList at the same time.

## 10. After installing the macOS version, there is no main interface

Please find the icon of PicList in the top bar, and then right-click (touchpad two-finger tap, or right-click the mouse) to find the menu of "Open Main Window".

Or right-click on the icon of PicList in the Docker bar to find the menu of "Open Main Window".

## 11. After installing PicList on macOS, it shows "The file is damaged" or there is no response after installing and opening

Please upgrade PicList to version 1.4.1 or above.

## 12. Watermark is not added normally

Before adding a watermark, PicList will check whether the font file exists. If it does not exist, it will automatically download the font file. However, due to network problems, the font file may fail to download, and the watermark will be skipped.

Please check whether the font file under the corresponding path according to your system exists. If it does not exist, please download the font file manually and put it in the corresponding path.

Windows: `%APPDATA%\piclist\assets\simhei.ttf`
Linux: `$XDG_CONFIG_HOME/piclist/assets/simhei.ttf` or `~/.config//assets/simhei.ttf`
MacOS: `~/Library/Application\ Support/picgo/assets/simhei.ttf`

The font file download address: [https://release.piclist.cn/simhei.ttf](https://release.piclist.cn/simhei.ttf)

## 13. Upload failed when using aws-s3 plugin to upload to cloudflare R2

R2's endpoint address will be blocked by GFW sni. After checking piclist.log, adding the corresponding IP address to the proxy list can solve the problem.

## 14. Are all PicGo plugins compatible with PicList?

PicList is compatible with most PicGo plugins. However, since PicList uses an updated version of electron, it is not compatible with the old version of the sharp library, so some plugins may not work.

Known plugins that cannot be used are:

- picgo-plugin-watermark (built-in)
- picgo-plugin-pic-migrater (this plugin will verify the version of PicGo and cannot be used, please use the pic-migrater-piclist plugin)
- picgo-plugin-auto-delete (built-in)

Welcome everyone to test other plugins. If there are plugins that cannot be used, please open an issue for feedback.

## 15. How to run PicList-core through Docker?

### docker run

Change the `./piclist` to your own path, and change the `piclist123456` to your own secret key.

```bash
docker run -d \
  --name piclist \
  --restart always \
  -p 36677:36677 \
  -v "./piclist:/root/.piclist" \
  kuingsmile/piclist:latest \
  node /usr/local/bin/picgo-server -k piclist123456
```

### docker-compose

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

You can change the `volumes` to your own path and change the `command` to your own secret key.

Then run:

```bash
docker-compose up -d
```
