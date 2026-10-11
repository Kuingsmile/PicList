# 贡献与开发指南

[English](CONTRIBUTING_EN.md) | [README](README_cn.md) | [FAQ](FAQ.md)

## 环境要求与启动

- 使用 **Node.js 22.x，至少 22.13.0**，建议安装 22.x 的最新补丁版本。当前 PicList-Core 依赖声明的版本范围为 `^22.13.0`，发布工作流使用 `22.x`。
- 使用 **pnpm 10.34.6** 和仓库中的 `pnpm-lock.yaml`。
- 安装 Git。原生依赖没有可用的预编译文件时，可能需要平台编译工具。Windows 打包和准备实验性插件运行时需要 Visual Studio C++ Build Tools，以及目标架构对应的编译器。

在仓库根目录执行：

```bash
git clone https://github.com/Kuingsmile/PicList.git
cd PicList
corepack enable pnpm
pnpm install --frozen-lockfile
pnpm dev
```

从已有 Yarn 工作区迁移时，请先清理旧的 `node_modules` 再安装。请保留 `pnpm-workspace.yaml`：它包含依赖版本覆盖、Electron/esbuild/SSH 安装脚本许可，以及 Electron 打包和内置 npm 所需的 hoisted 布局。不要禁用可选依赖，Sharp 的平台原生二进制通过可选依赖安装。

安装时，`postinstall` 会安装 Electron 原生依赖，`prepare` 会将主题下载到 `resources/theme/` 并安装 Husky 钩子。这些步骤需要网络连接。主题下载失败时，恢复网络后重新运行 `pnpm prepare`。

`pnpm dev` 通过 electron-vite 的 watch 模式启动 Electron。主进程变更会重新编译并重启 Electron，内存中的状态会重置；预加载脚本变更会重新编译脚本并刷新渲染进程窗口。渲染进程变更使用 Vite HMR。渲染进程开发服务器固定使用 `127.0.0.1:30303`；启动第二个开发实例前需要释放该端口。

## package.json 脚本

命令以 [package.json](package.json) 为准。

| 命令                                                   | 用途                                                                                     |
| ------------------------------------------------------ | ---------------------------------------------------------------------------------------- |
| `pnpm dev`                                             | 启动开发模式。                                                                           |
| `pnpm dev:prod`                                        | 使用 production 模式配置启动 electron-vite。                                             |
| `pnpm build:app`                                        | 将主进程、预加载脚本和渲染进程编译到 `out/`，不打包。                                    |
| `pnpm preview`                                         | 使用已有编译产物启动 Electron；先运行 `pnpm build:app`。                                  |
| `pnpm build`                                           | 编译并使用 electron-builder 为当前平台打包。  |
| `pnpm build:win`、`pnpm build:mac`、`pnpm build:linux` | 编译并为指定平台打包，可传入 electron-builder 的目标格式和架构参数。                     |
| `pnpm typecheck`                                       | 执行 `vue-tsc --noEmit`。                                                                |
| `pnpm lint` / `pnpm lint:fix`                          | 检查 JavaScript、TypeScript、Vue 和配置范围内的 JSON 文件 / 自动修复 ESLint 问题。       |
| `pnpm lint:dpdm` / `pnpm lint:dpdm:renderer`           | 从主进程 / 渲染进程入口检查循环依赖。                                                    |
| `pnpm lint:style`                                      | 检查 `src/` 下的样式，**会自动修复文件**。                                               |
| `pnpm lint:style:themes`                               | 检查 `resources/theme/*.css`，**会自动修复文件**。                                       |
| `pnpm prepare`                                         | 下载主题并安装 Husky 钩子。                                                              |
| `pnpm prepare:7za`                                     | 按当前 Node 架构下载 Windows 构建所需的 `resources/7za.exe`。                            |
| `pnpm prepare:plugin-runtime`                          | 为当前平台和架构准备实验性内置 npm 运行时。                                              |
| `pnpm postinstall` / `pnpm postuninstall`              | 执行 electron-builder 的原生依赖安装生命周期钩子。                                       |
| `pnpm cz`                                              | 打开配置好的 Commitizen 提交向导。                                                       |
| `pnpm run link`                                        | 通过 `scripts/link.js` 输出当前版本的下载链接；使用 `run` 避免执行 pnpm 内置的链接命令。 |
| `pnpm release`                                         | 执行版本更新工具，会修改发布元数据。                                                     |
| `pnpm winget`                                          | 执行 Winget 自动化脚本，供发布维护使用。                                                 |

## 源码结构

| 路径                                                      | 职责                                                                                              |
| --------------------------------------------------------- | ------------------------------------------------------------------------------------------------- |
| `src/main/index.ts`、`src/main/lifecycle/`                | Electron 入口、应用生命周期和更新。                                                               |
| `src/main/apis/`                                          | 核心服务、应用 API、插件 GUI API 和相册远端删除适配器；参阅 [API 指南](src/main/apis/README.md)。 |
| `src/main/ipc/`                                           | 渲染进程到主进程的 RPC 分发和业务路由。                                                           |
| `src/main/manage/`                                        | 云存储管理平台适配、列表请求、传输和管理配置。                                                    |
| `src/main/bulkChanges/`、`src/main/services/gallerySync/` | 批量操作会话和相册同步。                                                                          |
| `src/main/server/`、`src/main/fileServer/`                | 上传 HTTP API 和本地文件服务。                                                                    |
| `src/preload/index.ts`                                    | `window.electron` 和 `window.node` 上下文桥接。                                                   |
| `src/renderer/`                                           | Vue 界面、页面、组件、路由、状态和 composables。                                                  |
| `src/renderer/manage/`                                    | 云存储管理界面和状态。                                                                            |
| `src/shared/`                                             | 共享的 RPC、删除、列表和批量操作契约；全局声明位于 `types/`。                                     |
| `resources/`、`build/`                                    | 运行时资源和打包资源；主题及插件运行时暂存文件由脚本生成。                                        |
| `scripts/`                                                | 准备、打包和发布自动化脚本。                                                                      |

Electron 和存储平台访问逻辑放在主进程，渲染进程通过 preload 桥接调用。共享 RPC 契约位于 `src/shared/rpc.ts`，持久化操作通过 `invokeRPC` 等待确认。操作和语言常量目前分别位于 `src/main/constants.ts` 与 `src/shared/constants/`。配置路径定义也在两个进程中各有一份，修改时应保持对应定义一致。

路径别名配置在 [electron.vite.config.js](electron.vite.config.js) 和 [tsconfig.json](tsconfig.json)：`@` → 渲染进程，`~` → 主进程，`#` → shared，`root` → 仓库根目录，`apis` → 主进程 API，`@core` → 核心 API。

## 国际化

两个进程均使用 JSON 语言文件，当前语言为 `en`、`zh-CN` 和 `zh-TW`：

- 主进程：`src/main/i18n/locales/`，在 `src/main/i18n/index.ts` 中通过 i18next 注册。
- 渲染进程：`src/renderer/i18n/locales/`，在 `src/renderer/main.ts` 中通过 vue-i18n 注册。

修改现有语言时，在受影响进程的三份语言文件中同步更新对应键，保留插值参数，并按照 ESLint 要求排序。渲染进程的语言类型由 `src/renderer/types/i18n.d.ts` 根据 `src/renderer/i18n/locales/zh-CN.json` 推导，无需生成语言定义文件。

新增语言时，在两处语言目录添加 JSON 文件，更新两处注册、`src/renderer/i18n/locale.ts` 中的语言类型和选择逻辑、`src/renderer/main.ts` 中的语言类型、两处 `II18nLanguage` 定义，以及 `src/renderer/pages/PicGoSetting.vue` 中的 `languageList`。检查界面和主进程通知的语言切换。

## 打包与插件开发

编译产物位于 `out/`，安装包和压缩包位于 `dist_electron/`。目标格式、资源和钩子配置在 [electron-builder.cjs](electron-builder.cjs)。请使用具备对应平台工具链的主机；平台脚本本身不提供交叉编译工具。

pnpm 会为当前系统安装 x64 和 ARM64 可选二进制依赖。Windows、macOS 和 Linux 分别在对应系统上构建；Linux 桌面版使用 glibc，要求 glibc 2.28 及以上，x64 处理器还需要 SSE4.2。Sharp 及其 `@img` 依赖必须保留为外部模块并从 ASAR 解包。Node.js 22 和 Electron 39 满足 Sharp 0.35.5 的运行时要求；桌面版不提供 32 位 Windows 或 musl Linux 构建。

请保留 `pnpm-workspace.yaml` 中登记的补丁：electron-builder 补丁修复桌面应用与核心同名导致的依赖遗漏，以及 hoisted 布局下嵌套依赖版本选择错误；核心补丁通过 Node 读取水印文件，支持 ASAR 内的默认图片。升级到包含相应修复的上游版本并通过打包验证后才能移除补丁。

Sharp 记录了 [Linux/Electron GLib 冲突](https://sharp.pixelplumbing.com/install/#electron-and-linux)，验证中在 Ubuntu ARM64 的 0.34.4 和 0.35.5 上均复现。Sharp 加载器补丁仅在 Linux Electron 中选择官方 `@img/sharp-wasm32` 构建。请将该依赖与 Sharp 固定在相同版本，并保留 CommonJS 和 ESM 两种加载器的补丁。Windows、macOS 和独立 Node 进程继续使用原生 Sharp。

[WebAssembly 后端](https://sharp.pixelplumbing.com/install/#webassembly)支持 PicList 将文字转为 SVG 路径的水印功能，但不支持 Sharp 原生文字输入和金字塔切片输出。大图处理速度和内存限制可能与原生构建不同。`Validate native dependencies` 工作流会在 Windows、macOS 和 Ubuntu 的 x64/ARM64 原生运行器中验证 Electron 和 ASAR 内的编码、水印、动画、元数据清理与并发处理，并确认实际使用的后端；这些检查不代表覆盖全部 Linux 发行版或第三方插件。Sharp 0.35 还调整了 AVIF 质量标尺，相同质量参数可能产生不同体积或观感。

例如，在已安装所需 C++ 工具的 Windows 上执行：

```bash
pnpm prepare:7za
pnpm build:win nsis --x64 --publish never
```

在对应平台主机上构建 Linux AppImage 或 macOS 安装包：

```bash
pnpm build:linux AppImage --x64 --publish never
pnpm build:mac default --arm64 --publish never
```

`beforePack` 钩子会自动为每个打包目标准备插件运行时，使用 `package.json` 中精确固定的 npm 版本。在开发环境中测试**实验性内置 npm**时，先运行 `pnpm prepare:plugin-runtime`，再在插件页面启用该选项。生成文件位于 `build/plugin-runtime/<platform>-<arch>/`，平台名为 `win`、`mac` 或 `linux`。选项关闭时默认使用系统 npm；切换模式沿用同一套已安装插件和配置。

## 检查与提交

修改代码后，提交前运行适用的检查：

```bash
pnpm typecheck
pnpm lint
pnpm lint:dpdm
pnpm lint:dpdm:renderer
```

修改样式时使用对应的样式检查脚本，并检查自动修复结果。修改界面、平台适配或插件时，还应通过 `pnpm dev` 验证相关功能；发布测试不覆盖这些流程。日志、截图和问题报告中不要包含凭据或私有文件内容。

清理临时调试代码，只暂存本次需要提交的文件，然后使用 `pnpm cz` 打开提交向导。pre-commit 钩子会执行 `pnpm lint:fix`，可能修改文件，请检查并按需重新暂存。commit-msg 钩子按照项目的 node-bump-version 规范校验提交信息。
