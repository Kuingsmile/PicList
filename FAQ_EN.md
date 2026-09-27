# FAQ

[简体中文](FAQ.md) | [README](README.md) | [Development guide](CONTRIBUTING_EN.md)

This FAQ originated from PicGo's FAQ. Thanks to PicGo's author, Molunerfinn. For general configuration, see the [user manual](https://piclist.cn/en).

## 1. What is the relationship between PicList and PicGo?

PicList is a desktop application derived from PicGo. Its upload engine is [PicList-Core](https://github.com/Kuingsmile/PicList-Core), installed as the `piclist` dependency. PicList adds cloud storage management, image processing, scripts, and synchronization. It supports PicGo-style integrations and many PicGo plugins; plugin compatibility depends on the plugin and its dependencies.

## 2. Cloud management cannot retrieve a directory

Check `manage.log` for the provider response, then verify the selected management account, endpoint, bucket or path, and permissions. Cloud management has its own account configuration, separate from upload settings. Provider rate limits and temporary network failures can also cause listing errors; retry according to the returned error. See question 9 for log locations.

## 3. Which providers support gallery remote deletion?

The desktop deletion registry supports:

- Aliyun OSS, Tencent COS, Qiniu Kodo, and Upyun.
- AWS S3 / compatible services (`aws-s3` and `aws-s3-plist`).
- GitHub, S.EE (`smms`), and Imgur.
- WebDAV (`webdavplist`), local storage, and built-in SFTP (`sftpplist`).
- Lsky Pro (`lskyplist`), Alist (`alist` and `alistplist`), and another PicList server (`piclist`).
- Doge Cloud (`dogecloud`) and Huawei OBS (`huaweicloud-uploader`) gallery records from the corresponding uploaders.

Deletion requires the credentials and remote-file metadata needed by the adapter. An uploader's presence does not imply that it supports remote deletion or cloud management. The [README provider table](README.md) distinguishes management support, and [allApi.ts](src/main/apis/delete/allApi.ts) lists the deletion adapters. Custom providers can implement an `onGalleryRemove` lifecycle script for their deletion API.

## 4. Can PicList upload videos and other files?

Yes, when the selected storage provider accepts that file type and size. Cloud management includes file uploads, with streaming or multipart support depending on the provider. Image-only services can impose their own restrictions; image processing and preview support also depend on the format.

## 5. Which uploaders and cloud management providers are available?

The current PicList-Core dependency supplies uploaders for Qiniu, S3-compatible services, Tencent COS, Upyun, GitHub, S.EE, Aliyun OSS, Imgur, WebDAV, local storage, SFTP, Lsky Pro, Alist, another PicList server, and advanced custom APIs. The upload settings list also includes uploaders registered by installed plugins.

Cloud management has clients for Aliyun OSS, Tencent COS, Qiniu, Upyun, GitHub, S.EE, Imgur, S3-compatible services, WebDAV, local storage, and SFTP. Doge Cloud is available through the S3 API client's Doge Cloud option. Lsky Pro, Alist, and Gitee do not have dedicated cloud management clients in this source tree.

For other uploaders, see [PicGo's plugin directory](https://github.com/PicGo/Awesome-PicGo). Check plugin compatibility separately from built-in management support.

## 6. Why do GitHub uploads sometimes fail?

Inspect `piclist.log` for the actual response. Check the repository, branch, path, token permissions, provider limits, and network or proxy configuration. A failed upload is not enough to identify one cause. Cloud management uses a separate account configuration, so check its settings independently.

## 7. How do I open the main window on macOS?

Right-click or two-finger tap the PicList menu bar icon and choose **Open Main Window**. The PicList Dock icon also provides this action. The configured startup mode can leave the app running without showing its main window.

## 8. How do I investigate an upload or server error?

1. Open the log from PicList's settings and find the error for the failed operation. Use `manage.log` for cloud management and `piclist.log` for uploads.
2. Check the provider's response. `401` or `403` can indicate credentials, permissions, or a provider policy; other `4xx` responses can indicate a missing resource, an invalid request, or rate limiting.
3. For connection, DNS, timeout, or TLS errors, check the endpoint and PicList's proxy settings. A system proxy does not guarantee that every uploader uses it.
4. For Typora or Obsidian integration, ensure the local HTTP server is enabled and the editor uses its current port. The default upload URL is `http://127.0.0.1:36677/upload`; the server can select a later port when the configured port is occupied. The log reports the active listening port. Non-loopback clients must include the `key` query parameter when a server key is configured; recognized loopback requests receive the key automatically.
5. If the issue persists, report the PicList version, OS, provider, reproduction steps, and a redacted error excerpt. Remove tokens, passwords, and private file contents before sharing.

## 9. Where are configuration, gallery data, and logs stored?

Use the configuration and log controls in PicList's settings to locate the files for your installation. The default directory is Electron's application user-data directory. When a `PORTABLE` marker exists beside the executable, the default directory is `data/` beside that executable.

| File                                            | Purpose                                                        |
| ----------------------------------------------- | -------------------------------------------------------------- |
| `data.json`                                     | Upload and application configuration.                          |
| `manage.json`                                   | Cloud management configuration.                                |
| `piclist.db`                                    | Gallery database, beside the active application configuration. |
| `piclist.log`                                   | Upload/core log.                                               |
| `manage.log`                                    | Cloud management log.                                          |
| `piclist-gui-local.log`, `manage-gui-local.log` | Desktop configuration and GUI diagnostics.                     |

Custom configuration and log paths can change these locations. Core assets and gallery data follow the active application configuration directory; the management logger defaults to the management configuration directory. The GUI file-opening helpers use the default log locations. See [dirs.ts](src/main/apis/core/datastore/dirs.ts) for desktop path resolution.

## 10. How do I run or troubleshoot a development checkout?

Use Node.js 22.x (at least 22.13.0) and Yarn Classic 1.22.x, then run `yarn install --frozen-lockfile` and `yarn dev` from the repository root. The renderer development port is `30303`; it is separate from the upload server port `36677`.

For missing themes, rerun `yarn prepare`. To test the experimental bundled npm option, run `yarn prepare:plugin-runtime`; Windows requires Visual Studio C++ Build Tools. For compilation, checks, platform packaging, and localization, follow the [development guide](CONTRIBUTING_EN.md). There is no `i18n` generation script.

## 11. What if macOS reports a damaged app or the app does not start?

Download the appropriate x64 or arm64 build from the project's [releases](https://github.com/Kuingsmile/PicList/releases) and check that the download completed. If PicList is already running in the menu bar, use question 7 to open its window. For a continuing launch or installation failure, include the macOS version, PicList version, architecture, and exact system message in an issue.

## 12. Why is my watermark missing?

Check that watermarking is enabled for the selected uploader configuration and that the file is not excluded from processing. Configuration-specific settings can override global defaults.

For text watermarks without a custom font path, PicList-Core downloads `simhei.ttf` into `assets/` beside the active application configuration file. If that download fails, watermarking is skipped. Download the [default font](https://release.piclist.cn/simhei.ttf) manually into that `assets/simhei.ttf` location, or choose a readable custom font file in image processing settings. Portable and custom configuration directories change this location. Image watermarks use the configured watermark image instead of this font.

## 13. What should I check for Cloudflare R2 uploads?

Use the S3-compatible uploader and verify the endpoint, bucket, credentials, region, and any proxy settings against your R2 configuration. Inspect `piclist.log` to distinguish provider responses from connection failures. Cloud management has separate S3 API settings. A failed R2 request does not by itself establish that the endpoint is blocked.

## 14. Are all PicGo plugins compatible, and is Node.js required?

Compatibility varies with the plugin's APIs and native dependencies, including its version of `sharp`. Built-in watermarking and gallery remote deletion already cover functionality offered by some older plugins. If a plugin fails, report its exact version and a redacted error excerpt rather than assuming all plugins are compatible.

Plugin installation, updates, and removal use **system npm by default**, so that mode needs Node.js/npm available to PicList. The Plugins page offers an **experimental bundled npm** option that uses PicList's Electron executable and packaged npm runtime. It does not require a separate system npm installation for those operations, but a plugin may still need external build tools. If the bundled runtime cannot start, disable the option to use system npm or reinstall the application. For development, prepare it with `yarn prepare:plugin-runtime`.

## 15. How do I run PicList-Core through Docker?

Docker runs the separate PicList-Core upload server. This desktop repository has no Dockerfile or Compose configuration and its package scripts build Electron applications. Use the container instructions maintained in the [PicList-Core repository](https://github.com/Kuingsmile/PicList-Core) for image, volume, port, and server-key configuration.
