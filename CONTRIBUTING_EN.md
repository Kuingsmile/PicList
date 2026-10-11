# Contributing and Development

[简体中文](CONTRIBUTING.md) | [README](README.md) | [FAQ](FAQ_EN.md)

## Requirements and startup

- Use Node.js **22.x, at least 22.13.0**, preferably the latest 22.x patch. The current PicList-Core dependency declares `^22.13.0`, and the release workflow uses `22.x`.
- Use **pnpm 10.34.6** and the committed `pnpm-lock.yaml`.
- Install Git. Native dependencies may need platform build tools if a prebuilt binary is unavailable. Windows packaging and preparing the experimental plugin runtime require Visual Studio C++ Build Tools, including the compiler for the target architecture.

Run these commands from the repository root:

```bash
git clone https://github.com/Kuingsmile/PicList.git
cd PicList
corepack enable pnpm
pnpm install --frozen-lockfile
pnpm dev
```

When migrating an existing Yarn checkout, start with a clean `node_modules` directory before installing. Keep `pnpm-workspace.yaml`: it preserves dependency overrides, permits the required Electron/esbuild/SSH install scripts, and uses a hoisted layout for Electron packaging and the bundled npm runtime. Do not omit optional dependencies; Sharp's native binaries are optional packages.

Installation runs `postinstall` to install Electron native dependencies and `prepare` to download themes into `resources/theme/` and install Husky composables. These steps need network access. If the theme download fails, rerun `pnpm prepare` after restoring connectivity.

`pnpm dev` starts Electron with electron-vite watch mode. Main-process changes rebuild and restart Electron, resetting in-memory state; preload changes rebuild the preload scripts and reload the renderer windows. Renderer changes use Vite HMR. The renderer development server uses `127.0.0.1:30303` with a strict port, so free that port before starting a second development instance.

## Package scripts

[package.json](package.json) is the source of truth for commands.

| Command                                                | Purpose                                                                                                              |
| ------------------------------------------------------ | -------------------------------------------------------------------------------------------------------------------- |
| `pnpm dev`                                             | Start the application in development mode.                                                                           |
| `pnpm dev:prod`                                        | Start electron-vite with production mode settings.                                                                   |
| `pnpm build:app`                                        | Compile main, preload, and renderer code into `out/`, without packaging.                                             |
| `pnpm preview`                                         | Run Electron using the existing compiled output; run `pnpm build:app` first.                                          |
| `pnpm build`                                           | Compile and package with electron-builder for the current platform. |
| `pnpm build:win`, `pnpm build:mac`, `pnpm build:linux` | Compile and package for the named platform; accept electron-builder target and architecture arguments.               |
| `pnpm typecheck`                                       | Run `vue-tsc --noEmit`.                                                                                              |
| `pnpm lint` / `pnpm lint:fix`                          | Check JavaScript, TypeScript, Vue, and configured JSON files / apply ESLint fixes.                                   |
| `pnpm lint:dpdm` / `pnpm lint:dpdm:renderer`           | Check for circular dependencies from the main / renderer entry point.                                                |
| `pnpm lint:style`                                      | Run Stylelint on styles under `src/` **with automatic fixes**.                                                       |
| `pnpm lint:style:themes`                               | Run Stylelint on `resources/theme/*.css` **with automatic fixes**.                                                   |
| `pnpm prepare`                                         | Download themes and install Husky composables.                                                                       |
| `pnpm prepare:7za`                                     | Download `resources/7za.exe` for the current Node architecture for Windows builds.                                   |
| `pnpm prepare:plugin-runtime`                          | Stage the experimental bundled npm runtime for the current platform and architecture.                                |
| `pnpm postinstall` / `pnpm postuninstall`              | Run electron-builder's native dependency installation lifecycle composables.                                         |
| `pnpm cz`                                              | Open the configured Commitizen commit prompt.                                                                        |
| `pnpm run link`                                        | Print versioned download links using `scripts/link.js`; use `run` to avoid pnpm's built-in linking command.          |
| `pnpm release`                                         | Run the configured version bump tool; this changes release metadata.                                                 |
| `pnpm winget`                                          | Run the Winget automation script; reserved for release maintenance.                                                  |

## Source layout

| Path                                                      | Responsibility                                                                                                                 |
| --------------------------------------------------------- | ------------------------------------------------------------------------------------------------------------------------------ |
| `src/main/index.ts`, `src/main/lifecycle/`                | Electron entry point, application lifecycle, and updates.                                                                      |
| `src/main/apis/`                                          | Core services, application APIs, plugin GUI APIs, and gallery deletion adapters; see the [API guide](src/main/apis/README.md). |
| `src/main/ipc/`                                           | Renderer-to-main RPC dispatch and domain routes.                                                                               |
| `src/main/manage/`                                        | Cloud management providers, listings, transfers, and management configuration.                                                 |
| `src/main/bulkChanges/`, `src/main/services/gallerySync/` | Bulk operation sessions and gallery synchronization.                                                                           |
| `src/main/server/`, `src/main/fileServer/`                | Upload HTTP API and local file serving.                                                                                        |
| `src/preload/index.ts`                                    | The `window.electron` and `window.node` context bridges.                                                                       |
| `src/renderer/`                                           | Vue UI, pages, components, router, stores, and composables.                                                                    |
| `src/renderer/manage/`                                    | Cloud management UI and stores.                                                                                                |
| `src/shared/`                                             | Shared contracts, constants, and safe utilities; process-specific declarations live beside their owners.                       |
| `resources/`, `build/`                                    | Runtime assets and packaging resources; themes and plugin runtime staging are generated.                                       |
| `scripts/`                                                | Preparation, packaging, and release automation.                                                                                |

Keep Electron and provider access in the main process and use the preload bridge from the renderer. Shared RPC contracts are in `src/shared/rpc.ts`; persistent operations use acknowledged `invokeRPC` calls. Shared channels, RPC actions, and UI constants live in `src/shared/constants/`; `src/main/constants.ts` adds main-process actions and window IDs. Configuration path definitions remain process-specific, including their different `buildIn.list` shapes. Keep matching paths aligned without flattening those differences.

Aliases are configured in [electron.vite.config.js](electron.vite.config.js) and [tsconfig.json](tsconfig.json): `@` → renderer, `~` → main, `#` → shared, `root` → repository root, `apis` → main APIs, and `@core` → core APIs.

Use PascalCase for Vue components, `useName.ts` for composables, and camelCase for other modules. Keep renderer RPC, configuration, and database wrappers in `services/`, state in `stores/`, and styles beside their Vue components. Main upload and gallery-sync services live in `src/main/services/`. The preload entry delegates transport, event buffering, themes, and Node helpers to adjacent modules. Vite scopes aliases by process, and ESLint enforces runtime import boundaries.

## Localization

Both processes use JSON locale files for `en`, `zh-CN`, and `zh-TW`:

- Main process: `src/main/i18n/locales/`, registered in `src/main/i18n/index.ts` with i18next.
- Renderer: `src/renderer/i18n/locales/`, registered in `src/renderer/main.ts` with vue-i18n.

For an existing language, update the corresponding keys in all three locale files for the affected process. Preserve interpolation parameters and keep keys sorted as required by ESLint. Renderer message types are inferred from `src/renderer/i18n/locales/zh-CN.json` in `src/renderer/types/i18n.d.ts`; no generated language definition file is required.

For a new language, add JSON files in both locale directories and update both registrations, the locale type and selection logic in `src/renderer/i18n/locale.ts`, the locale type in `src/renderer/main.ts`, the shared `II18nLanguage` definition in `src/shared/constants/app.ts`, and `languageList` in `src/renderer/pages/PicGoSetting.vue`. Check language switching in both the UI and main-process notifications.

## Packaging and plugin development

Compiled code goes to `out/`; installers and archives go to `dist_electron/`. Targets, assets, and composables are configured in [electron-builder.cjs](electron-builder.cjs). Use a host with the required platform toolchain; a platform script alone does not provide cross-compilation tools.

The pnpm configuration installs x64 and ARM64 optional binaries for the host OS. Build Windows on Windows, macOS on macOS, and Linux on a glibc host; CI uses a native runner for each OS/architecture pair. Sharp and its `@img` binaries must remain external to the JavaScript bundle and unpacked from ASAR. Sharp 0.35.5 requires Node-API 9 / Node.js 20.9 or newer; this project's Node 22 requirement and Electron 39 satisfy that requirement. Linux binaries require glibc 2.28 or newer, and x64 requires SSE4.2. The desktop targets do not include 32-bit Windows or musl Linux.

Sharp documents a [Linux/Electron GLib conflict](https://sharp.pixelplumbing.com/install/#electron-and-linux), reproduced by our checks on Ubuntu ARM64 with both 0.34.4 and 0.35.5. The Sharp loader patch selects the official `@img/sharp-wasm32` build only inside Linux Electron. Keep this dependency pinned to the same version as Sharp and retain the patch for both its CommonJS and ESM loaders. Windows, macOS and standalone Node continue to use native Sharp.

The [WebAssembly backend](https://sharp.pixelplumbing.com/install/#webassembly) supports PicList's SVG path-based text watermarks. Its SVG renderer omits text shaping, so the loader patch uses `@resvg/resvg-js` to convert SVG text to vector outlines before processing, including file, buffer, stream and composite inputs. Keep `@resvg` unpacked from ASAR. Sharp's native text input and tiled pyramid output remain unavailable. Large-image throughput and memory limits can differ from the native build. The `Validate native dependencies` workflow checks encoders, SVG text, watermarks, animation, metadata removal and concurrent processing in Electron and from the packaged ASAR on native Windows, macOS and Ubuntu x64/ARM64 runners, and verifies which backend was selected. These checks do not cover every Linux distribution or arbitrary third-party plugins. Sharp 0.35 also changes the AVIF quality scale, so the same quality value can produce different sizes or visual results.

Keep the patches registered in `pnpm-workspace.yaml` when installing or preparing release utilities. The electron-builder patch preserves the desktop dependency graph when the application and core share the `piclist` name, and resolves nested package versions from the hoisted tree. The core patch reads watermark files through Node so Electron can load its bundled logo from ASAR. Remove each patch only after upgrading to an upstream version that includes the fix and rerunning packaged validation.

Windows builds default to the host architecture and produce NSIS, ZIP, and 7z artifacts. Use `pnpm build:win --x64 --arm64 --publish never` to build both architectures explicitly. ARM64 packaging requires the Visual Studio component `Microsoft.VisualStudio.Component.VC.Tools.ARM64`, including its compiler and runtime libraries.

For example, on Windows with the required C++ tools installed:

```bash
pnpm prepare:7za
pnpm build:win nsis --x64 --publish never
```

For a Linux AppImage or a macOS build on the corresponding host:

```bash
pnpm build:linux AppImage --x64 --publish never
pnpm build:mac default --arm64 --publish never
```

The `beforePack` hook stages the plugin runtime for each packaging target automatically, using the exact npm version pinned in `package.json`. To test the **experimental bundled npm** option in development, run `pnpm prepare:plugin-runtime` and enable the option on the Plugins page. It stages files in `build/plugin-runtime/<platform>-<arch>/`, with `win`, `mac`, or `linux` as the platform. System npm remains the default when the option is disabled; changing modes uses the same installed plugins and configuration.

## Checks and submitting changes

For code changes, run the applicable checks before submitting:

```bash
pnpm typecheck
pnpm lint
pnpm lint:dpdm
pnpm lint:dpdm:renderer
```

Use the style scripts when changing styles, and inspect their automatic fixes. For UI, provider, or plugin changes, also exercise the affected behavior in `pnpm dev`; the release tests do not cover those flows. Keep credentials and private file contents out of logs, screenshots, and issue reports.

Remove temporary debugging code, stage only the intended files, and use `pnpm cz` for the commit prompt. The pre-commit hook runs `pnpm lint:fix`, which can modify files; review and stage those fixes as needed. The commit-msg hook validates messages with the project's node-bump-version convention.
