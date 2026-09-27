# 贡献与开发指南

[English](CONTRIBUTING_EN.md) | [README](README_cn.md) | [FAQ](FAQ.md)

## 环境要求与启动

- 使用 **Node.js 22.x，至少 22.13.0**，建议安装 22.x 的最新补丁版本。当前 PicList-Core 依赖声明的版本范围为 `^22.13.0`，发布工作流使用 `22.x`。
- 使用 **Yarn Classic 1.22.x** 和仓库中的 `yarn.lock`。
- 安装 Git。原生依赖没有可用的预编译文件时，可能需要平台编译工具。Windows 打包和准备实验性插件运行时需要 Visual Studio C++ Build Tools，以及目标架构对应的编译器。

在仓库根目录执行：

```bash
git clone https://github.com/Kuingsmile/PicList.git
cd PicList
yarn install --frozen-lockfile
yarn dev
```

安装时，`postinstall` 会安装 Electron 原生依赖，`prepare` 会将主题下载到 `resources/theme/` 并安装 Husky 钩子。这些步骤需要网络连接。主题下载失败时，恢复网络后重新运行 `yarn prepare`。

`yarn dev` 通过 electron-vite 启动 Electron。渲染进程开发服务器固定使用 `127.0.0.1:30303`；启动第二个开发实例前需要释放该端口。

## package.json 脚本

命令以 [package.json](package.json) 为准。

| 命令                                                   | 用途                                                                                     |
| ------------------------------------------------------ | ---------------------------------------------------------------------------------------- |
| `yarn dev`                                             | 启动开发模式。                                                                           |
| `yarn dev:prod`                                        | 使用 production 模式配置启动 electron-vite。                                             |
| `yarn prebuild`                                        | 将主进程、预加载脚本和渲染进程编译到 `out/`，不打包。                                    |
| `yarn preview`                                         | 使用已有编译产物启动 Electron；先运行 `yarn prebuild`。                                  |
| `yarn build`                                           | 编译并使用 electron-builder 为当前平台打包。Yarn 还会自动执行 `prebuild` 生命周期钩子。  |
| `yarn build:win`、`yarn build:mac`、`yarn build:linux` | 编译并为指定平台打包，可传入 electron-builder 的目标格式和架构参数。                     |
| `yarn typecheck`                                       | 执行 `vue-tsc --noEmit`。                                                                |
| `yarn lint` / `yarn lint:fix`                          | 检查 JavaScript、TypeScript、Vue 和配置范围内的 JSON 文件 / 自动修复 ESLint 问题。       |
| `yarn lint:dpdm` / `yarn lint:dpdm:renderer`           | 从主进程 / 渲染进程入口检查循环依赖。                                                    |
| `yarn lint:style`                                      | 检查 `src/` 下的样式，**会自动修复文件**。                                               |
| `yarn lint:style:themes`                               | 检查 `resources/theme/*.css`，**会自动修复文件**。                                       |
| `yarn test:release`                                    | 使用 Node 测试运行器执行 `scripts/tests/*.test.js`，覆盖发布工具和打包钩子。             |
| `yarn prepare`                                         | 下载主题并安装 Husky 钩子。                                                              |
| `yarn prepare:7za`                                     | 按当前 Node 架构下载 Windows 构建所需的 `resources/7za.exe`。                            |
| `yarn prepare:plugin-runtime`                          | 为当前平台和架构准备实验性内置 npm 运行时。                                              |
| `yarn postinstall` / `yarn postuninstall`              | 执行 electron-builder 的原生依赖安装生命周期钩子。                                       |
| `yarn cz`                                              | 打开配置好的 Commitizen 提交向导。                                                       |
| `yarn run link`                                        | 通过 `scripts/link.js` 输出当前版本的下载链接；使用 `run` 避免执行 Yarn 内置的链接命令。 |
| `yarn release`                                         | 执行版本更新工具，会修改发布元数据。                                                     |
| `yarn winget`                                          | 执行 Winget 自动化脚本，供发布维护使用。                                                 |

当前没有通用的 `test` 脚本或 `i18n` 生成脚本。`test:release` 不测试 Electron 界面或存储平台功能。

## 源码结构

| 路径                                                   | 职责                                                                                              |
| ------------------------------------------------------ | ------------------------------------------------------------------------------------------------- |
| `src/main/index.ts`、`src/main/lifeCycle/`             | Electron 入口、应用生命周期和更新。                                                               |
| `src/main/apis/`                                       | 核心服务、应用 API、插件 GUI API 和相册远端删除适配器；参阅 [API 指南](src/main/apis/README.md)。 |
| `src/main/events/rpc/`                                 | 渲染进程到主进程的 RPC 分发和业务路由。                                                           |
| `src/main/manage/`                                     | 云存储管理平台适配、列表请求、传输和管理配置。                                                    |
| `src/main/bulkChanges/`、`src/main/utils/gallerySync/` | 批量操作会话和相册同步。                                                                          |
| `src/main/server/`、`src/main/fileServer/`             | 上传 HTTP API 和本地文件服务。                                                                    |
| `src/preload/index.ts`                                 | `window.electron` 和 `window.node` 上下文桥接。                                                   |
| `src/renderer/`                                        | Vue 界面、页面、组件、路由、状态和 hooks。                                                        |
| `src/renderer/manage/`                                 | 云存储管理界面和状态。                                                                            |
| `src/universal/`                                       | 共享的 RPC、删除、列表和批量操作契约；全局声明位于 `types/`。                                     |
| `resources/`、`build/`                                 | 运行时资源和打包资源；主题及插件运行时暂存文件由脚本生成。                                        |
| `scripts/`、`scripts/tests/`                           | 准备、打包、发布自动化脚本和发布工具测试。                                                        |

Electron 和存储平台访问逻辑放在主进程，渲染进程通过 preload 桥接调用。共享 RPC 契约位于 `src/universal/rpc.ts`，持久化操作通过 `invokeRPC` 等待确认。操作和语言常量目前分别位于 `src/main/utils/enum.ts` 与 `src/renderer/utils/enum.ts`。配置路径定义也在两个进程中各有一份，修改时应保持对应定义一致。

路径别名配置在 [electron.vite.config.js](electron.vite.config.js) 和 [tsconfig.json](tsconfig.json)：`@` → 渲染进程，`~` → 主进程，`#` → universal，`root` → 仓库根目录，`apis` → 主进程 API，`@core` → 核心 API。

## 国际化

两个进程均使用 JSON 语言文件，当前语言为 `en`、`zh-CN` 和 `zh-TW`：

- 主进程：`src/main/i18n/locales/`，在 `src/main/i18n/index.ts` 中通过 i18next 注册。
- 渲染进程：`src/renderer/i18n/locales/`，在 `src/renderer/main.ts` 中通过 vue-i18n 注册。

修改现有语言时，在受影响进程的三份语言文件中同步更新对应键，保留插值参数，并按照 ESLint 要求排序。渲染进程的语言类型由 `src/universal/types/i18n.d.ts` 根据 `src/renderer/i18n/locales/zh-CN.json` 推导，无需生成语言定义文件。

新增语言时，在两处语言目录添加 JSON 文件，更新两处注册、`src/renderer/i18n/locale.ts` 中的语言类型和选择逻辑、`src/renderer/main.ts` 中的语言类型、两处 `II18nLanguage` 定义，以及 `src/renderer/pages/PicGoSetting.vue` 中的 `languageList`。检查界面和主进程通知的语言切换。

## 打包与插件开发

编译产物位于 `out/`，安装包和压缩包位于 `dist_electron/`。目标格式、资源和钩子配置在 [electron-builder.json](electron-builder.json)。请使用具备对应平台工具链的主机；平台脚本本身不提供交叉编译工具。

例如，在已安装所需 C++ 工具的 Windows 上执行：

```bash
yarn prepare:7za
yarn build:win nsis --x64 --publish never
```

在对应平台主机上构建 Linux AppImage 或 macOS 安装包：

```bash
yarn build:linux AppImage --x64 --publish never
yarn build:mac default --arm64 --publish never
```

`beforePack` 钩子会自动为每个打包目标准备插件运行时，使用 `package.json` 中精确固定的 npm 版本。在开发环境中测试**实验性内置 npm**时，先运行 `yarn prepare:plugin-runtime`，再在插件页面启用该选项。生成文件位于 `build/plugin-runtime/<platform>-<arch>/`，平台名为 `win`、`mac` 或 `linux`。选项关闭时默认使用系统 npm；切换模式沿用同一套已安装插件和配置。

## 检查与提交

修改代码后，提交前运行适用的检查：

```bash
yarn typecheck
yarn lint
yarn lint:dpdm
yarn lint:dpdm:renderer
yarn test:release
```

修改样式时使用对应的样式检查脚本，并检查自动修复结果。修改界面、平台适配或插件时，还应通过 `yarn dev` 验证相关功能；发布测试不覆盖这些流程。日志、截图和问题报告中不要包含凭据或私有文件内容。

清理临时调试代码，只暂存本次需要提交的文件，然后使用 `yarn cz` 打开提交向导。pre-commit 钩子会执行 `yarn lint:fix`，可能修改文件，请检查并按需重新暂存。commit-msg 钩子按照项目的 node-bump-version 规范校验提交信息。
