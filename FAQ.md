# FAQ

[English](FAQ_EN.md) | [README](README_cn.md) | [开发指南](CONTRIBUTING.md)

本 FAQ 源自 PicGo 的 FAQ，感谢 PicGo 作者 Molunerfinn。常规配置问题请参阅 [官方文档](https://piclist.cn)。

## 1. PicList 和 PicGo 有什么关系？

PicList 是基于 PicGo 开发的桌面应用，上传引擎为以 `piclist` 依赖安装的 [PicList-Core](https://github.com/Kuingsmile/PicList-Core)。PicList 增加了云存储管理、图片处理、脚本和同步功能，支持 PicGo 风格的应用集成和许多 PicGo 插件；具体兼容性取决于插件及其依赖。

## 2. 云存储管理无法获取目录怎么办？

先查看 `manage.log` 中的平台响应，再检查选中的管理账号、端点、存储桶或路径及权限。云存储管理使用独立的账号配置，与上传设置分开。平台限流和临时网络故障也可能造成列表请求失败，应根据实际错误决定是否重试。日志位置见第 9 项。

## 3. 哪些平台支持相册远端删除？

桌面端删除注册表支持：

- 阿里云 OSS、腾讯云 COS、七牛云 Kodo、又拍云。
- AWS S3 及兼容服务（`aws-s3` 和 `aws-s3-plist`）。
- GitHub、S.EE（`smms`）、Imgur。
- WebDAV（`webdavplist`）、本地存储、内置 SFTP（`sftpplist`）。
- 兰空图床（`lskyplist`）、Alist（`alist` 和 `alistplist`）、另一台 PicList 服务（`piclist`）。
- 对应上传器产生的多吉云（`dogecloud`）和华为云 OBS（`huaweicloud-uploader`）相册记录。

删除需要适配器所需的凭据和远端文件信息。支持上传不代表同时支持远端删除或云存储管理。[README 平台表](README_cn.md) 区分了管理能力，[allApi.ts](src/main/apis/delete/allApi.ts) 列出了删除适配器。自定义平台可以通过 `onGalleryRemove` 生命周期脚本调用自己的删除 API。

## 4. 能否上传视频和其他文件？

可以，但所选存储平台必须接受相应的文件类型和大小。云存储管理支持文件上传，是否使用流式或分片上传取决于平台。仅支持图片的服务仍可能限制格式，图片处理和预览能力也取决于文件格式。

## 5. 有哪些上传器和云存储管理平台？

当前 PicList-Core 依赖提供七牛云、S3 兼容服务、腾讯云 COS、又拍云、GitHub、S.EE、阿里云 OSS、Imgur、WebDAV、本地存储、SFTP、兰空图床、Alist、另一台 PicList 服务以及高级自定义 API 上传器。上传设置中还会显示已安装插件注册的上传器。

云存储管理具有阿里云 OSS、腾讯云 COS、七牛云、又拍云、GitHub、S.EE、Imgur、S3 兼容服务、WebDAV、本地存储和 SFTP 客户端。多吉云通过 S3 API 客户端的多吉云选项支持。当前源码没有兰空图床、Alist 或 Gitee 的专用云存储管理客户端。

其他上传器可参考 [PicGo 插件目录](https://github.com/PicGo/Awesome-PicGo)。插件兼容性和内置管理能力需要分别确认。

## 6. GitHub 上传为什么偶尔失败？

请查看 `piclist.log` 中的实际响应，检查仓库、分支、路径、令牌权限、平台限制以及网络或代理配置。仅凭上传失败无法确定唯一原因。云存储管理使用独立账号配置，也应单独检查。

## 7. macOS 上如何打开主窗口？

右键或双指点按菜单栏中的 PicList 图标，选择「打开主窗口」。Dock 栏的 PicList 图标也提供该操作。不同启动模式可能让应用在运行时不显示主窗口。

## 8. 上传失败或服务器报错时如何排查？

1. 从 PicList 设置打开日志，找到对应操作的错误。云存储管理查看 `manage.log`，上传查看 `piclist.log`。
2. 检查平台响应。`401` 或 `403` 可能与凭据、权限或平台策略有关；其他 `4xx` 响应可能表示资源不存在、请求无效或触发限流。
3. 连接、DNS、超时或 TLS 错误应检查端点和 PicList 的代理设置。启用系统代理并不保证所有上传器都会使用该代理。
4. Typora 或 Obsidian 集成失败时，确认本地 HTTP 服务已启用，且编辑器使用当前端口。默认上传地址为 `http://127.0.0.1:36677/upload`；配置端口被占用时，服务可能选择后续端口。日志会记录实际监听端口。配置服务密钥时，非本机回环请求需要添加 `key` 查询参数；识别为本机回环的请求会自动填入密钥。
5. 问题仍然存在时，提供 PicList 版本、操作系统、平台、复现步骤和脱敏后的错误片段。分享前移除令牌、密码和私有文件内容。

## 9. 配置、相册和日志保存在哪里？

通过 PicList 设置中的配置和日志控件定位当前安装使用的文件。默认目录为 Electron 的应用用户数据目录。如果可执行文件旁存在 `PORTABLE` 标记文件，默认目录为同位置的 `data/`。

| 文件                                            | 用途                                 |
| ----------------------------------------------- | ------------------------------------ |
| `data.json`                                     | 上传和应用配置。                     |
| `manage.json`                                   | 云存储管理配置。                     |
| `piclist.db`                                    | 相册数据库，位于当前应用配置文件旁。 |
| `piclist.log`                                   | 上传和核心日志。                     |
| `manage.log`                                    | 云存储管理日志。                     |
| `piclist-gui-local.log`、`manage-gui-local.log` | 桌面配置和 GUI 诊断日志。            |

自定义配置和日志路径会改变部分文件的位置。核心资源和相册数据跟随当前应用配置目录，管理日志默认写入管理配置目录。GUI 打开日志的工具使用默认日志位置。桌面路径解析见 [dirs.ts](src/main/apis/core/datastore/dirs.ts)。

## 10. 如何运行或排查开发环境？

使用 Node.js 22.x（至少 22.13.0）和 pnpm 10.34.6，在仓库根目录运行 `pnpm install --frozen-lockfile` 和 `pnpm dev`。渲染进程开发端口为 `30303`，与上传服务端口 `36677` 不同。

缺少主题时重新运行 `pnpm prepare`。测试实验性内置 npm 时，先运行 `pnpm prepare:plugin-runtime`；Windows 需要 Visual Studio C++ Build Tools。编译、检查、平台打包和国际化流程见 [开发指南](CONTRIBUTING.md)。当前没有 `i18n` 生成脚本。

## 11. macOS 提示应用损坏或无法启动怎么办？

从项目 [发布页面](https://github.com/Kuingsmile/PicList/releases) 下载对应的 x64 或 arm64 安装包，并检查下载是否完整。如果 PicList 已在菜单栏运行，按第 7 项打开窗口。持续出现启动或安装问题时，请在 issue 中提供 macOS 版本、PicList 版本、架构和完整系统提示。

## 12. 为什么没有添加水印？

检查所选上传器配置是否启用了水印，以及文件是否被排除在处理范围之外。具体配置可以覆盖全局默认设置。

文字水印没有设置自定义字体路径时，PicList-Core 会把 `simhei.ttf` 下载到当前应用配置文件旁的 `assets/` 目录。下载失败会跳过水印处理。可以手动下载 [默认字体](https://release.piclist.cn/simhei.ttf) 到该 `assets/simhei.ttf` 位置，或在图片处理设置中选择可读取的自定义字体文件。便携模式和自定义配置目录会改变该位置。图片水印使用配置的水印图片，不依赖该字体。

## 13. Cloudflare R2 上传失败应检查什么？

使用 S3 兼容上传器，按照自己的 R2 配置核对端点、存储桶、凭据、区域和代理设置。通过 `piclist.log` 区分平台响应和连接故障。云存储管理具有独立的 S3 API 配置。单次 R2 请求失败不能直接说明端点被阻断。

## 14. PicGo 插件是否全部兼容，是否需要 Node.js？

兼容性取决于插件使用的 API 和原生依赖，包括 `sharp` 的版本。内置水印和相册远端删除已覆盖部分旧插件提供的功能。插件失败时请提供准确版本和脱敏错误片段，不要假定所有插件都兼容。

插件安装、更新和卸载**默认使用系统 npm**，因此该模式需要 PicList 能访问 Node.js/npm。插件页面提供**实验性内置 npm**选项，使用 PicList 的 Electron 可执行文件和随包附带的 npm 运行时。这些操作不再需要单独安装系统 npm，但插件本身仍可能需要外部编译工具。内置运行时无法启动时，可以关闭该选项改用系统 npm，或重新安装应用。开发环境通过 `pnpm prepare:plugin-runtime` 准备运行时。

## 15. 如何通过 Docker 运行 PicList-Core？

Docker 运行独立的 PicList-Core 上传服务。此桌面仓库没有 Dockerfile 或 Compose 配置，package.json 脚本用于构建 Electron 应用。镜像、卷、端口和服务密钥的配置请以 [PicList-Core 仓库](https://github.com/Kuingsmile/PicList-Core) 维护的容器说明为准。
