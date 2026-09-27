# Contributing and Development

[简体中文](CONTRIBUTING.md) | [README](README.md) | [FAQ](FAQ_EN.md)

## Requirements and startup

- Use Node.js **22.x, at least 22.13.0**, preferably the latest 22.x patch. The current PicList-Core dependency declares `^22.13.0`, and the release workflow uses `22.x`.
- Use **Yarn Classic 1.22.x** and the committed `yarn.lock`.
- Install Git. Native dependencies may need platform build tools if a prebuilt binary is unavailable. Windows packaging and preparing the experimental plugin runtime require Visual Studio C++ Build Tools, including the compiler for the target architecture.

Run these commands from the repository root:

```bash
git clone https://github.com/Kuingsmile/PicList.git
cd PicList
yarn install --frozen-lockfile
yarn dev
```

Installation runs `postinstall` to install Electron native dependencies and `prepare` to download themes into `resources/theme/` and install Husky hooks. These steps need network access. If the theme download fails, rerun `yarn prepare` after restoring connectivity.

`yarn dev` starts Electron with electron-vite. The renderer development server uses `127.0.0.1:30303` with a strict port, so free that port before starting a second development instance.

## Package scripts

[package.json](package.json) is the source of truth for commands.

| Command                                                | Purpose                                                                                                              |
| ------------------------------------------------------ | -------------------------------------------------------------------------------------------------------------------- |
| `yarn dev`                                             | Start the application in development mode.                                                                           |
| `yarn dev:prod`                                        | Start electron-vite with production mode settings.                                                                   |
| `yarn prebuild`                                        | Compile main, preload, and renderer code into `out/`, without packaging.                                             |
| `yarn preview`                                         | Run Electron using the existing compiled output; run `yarn prebuild` first.                                          |
| `yarn build`                                           | Compile and package with electron-builder for the current platform. Yarn also invokes the `prebuild` lifecycle hook. |
| `yarn build:win`, `yarn build:mac`, `yarn build:linux` | Compile and package for the named platform; accept electron-builder target and architecture arguments.               |
| `yarn typecheck`                                       | Run `vue-tsc --noEmit`.                                                                                              |
| `yarn lint` / `yarn lint:fix`                          | Check JavaScript, TypeScript, Vue, and configured JSON files / apply ESLint fixes.                                   |
| `yarn lint:dpdm` / `yarn lint:dpdm:renderer`           | Check for circular dependencies from the main / renderer entry point.                                                |
| `yarn lint:style`                                      | Run Stylelint on styles under `src/` **with automatic fixes**.                                                       |
| `yarn lint:style:themes`                               | Run Stylelint on `resources/theme/*.css` **with automatic fixes**.                                                   |
| `yarn test:release`                                    | Run Node's test runner on `scripts/tests/*.test.js` for release tooling and packaging hooks.                         |
| `yarn prepare`                                         | Download themes and install Husky hooks.                                                                             |
| `yarn prepare:7za`                                     | Download `resources/7za.exe` for the current Node architecture for Windows builds.                                   |
| `yarn prepare:plugin-runtime`                          | Stage the experimental bundled npm runtime for the current platform and architecture.                                |
| `yarn postinstall` / `yarn postuninstall`              | Run electron-builder's native dependency installation lifecycle hooks.                                               |
| `yarn cz`                                              | Open the configured Commitizen commit prompt.                                                                        |
| `yarn run link`                                        | Print versioned download links using `scripts/link.js`; use `run` to avoid Yarn's built-in linking command.          |
| `yarn release`                                         | Run the configured version bump tool; this changes release metadata.                                                 |
| `yarn winget`                                          | Run the Winget automation script; reserved for release maintenance.                                                  |

There is no general `test` script or `i18n` generation script. `test:release` does not exercise the Electron UI or storage providers.

## Source layout

| Path                                                   | Responsibility                                                                                                                 |
| ------------------------------------------------------ | ------------------------------------------------------------------------------------------------------------------------------ |
| `src/main/index.ts`, `src/main/lifeCycle/`             | Electron entry point, application lifecycle, and updates.                                                                      |
| `src/main/apis/`                                       | Core services, application APIs, plugin GUI APIs, and gallery deletion adapters; see the [API guide](src/main/apis/README.md). |
| `src/main/events/rpc/`                                 | Renderer-to-main RPC dispatch and domain routes.                                                                               |
| `src/main/manage/`                                     | Cloud management providers, listings, transfers, and management configuration.                                                 |
| `src/main/bulkChanges/`, `src/main/utils/gallerySync/` | Bulk operation sessions and gallery synchronization.                                                                           |
| `src/main/server/`, `src/main/fileServer/`             | Upload HTTP API and local file serving.                                                                                        |
| `src/preload/index.ts`                                 | The `window.electron` and `window.node` context bridges.                                                                       |
| `src/renderer/`                                        | Vue UI, pages, components, router, stores, and hooks.                                                                          |
| `src/renderer/manage/`                                 | Cloud management UI and stores.                                                                                                |
| `src/universal/`                                       | Shared RPC, deletion, listing, and bulk operation contracts; global declarations live in `types/`.                             |
| `resources/`, `build/`                                 | Runtime assets and packaging resources; themes and plugin runtime staging are generated.                                       |
| `scripts/`, `scripts/tests/`                           | Preparation, packaging, release automation, and release tooling tests.                                                         |

Keep Electron and provider access in the main process and use the preload bridge from the renderer. Shared RPC contracts are in `src/universal/rpc.ts`; persistent operations use acknowledged `invokeRPC` calls. Action and language constants currently live in `src/main/utils/enum.ts` and `src/renderer/utils/enum.ts`. Configuration path definitions also exist in both processes; keep matching definitions aligned when changing them.

Aliases are configured in [electron.vite.config.js](electron.vite.config.js) and [tsconfig.json](tsconfig.json): `@` → renderer, `~` → main, `#` → universal, `root` → repository root, `apis` → main APIs, and `@core` → core APIs.

## Localization

Both processes use JSON locale files for `en`, `zh-CN`, and `zh-TW`:

- Main process: `src/main/i18n/locales/`, registered in `src/main/i18n/index.ts` with i18next.
- Renderer: `src/renderer/i18n/locales/`, registered in `src/renderer/main.ts` with vue-i18n.

For an existing language, update the corresponding keys in all three locale files for the affected process. Preserve interpolation parameters and keep keys sorted as required by ESLint. Renderer message types are inferred from `src/renderer/i18n/locales/zh-CN.json` in `src/universal/types/i18n.d.ts`; no generated language definition file is required.

For a new language, add JSON files in both locale directories and update both registrations, the locale type and selection logic in `src/renderer/i18n/locale.ts`, the locale type in `src/renderer/main.ts`, both `II18nLanguage` definitions, and `languageList` in `src/renderer/pages/PicGoSetting.vue`. Check language switching in both the UI and main-process notifications.

## Packaging and plugin development

Compiled code goes to `out/`; installers and archives go to `dist_electron/`. Targets, assets, and hooks are configured in [electron-builder.json](electron-builder.json). Use a host with the required platform toolchain; a platform script alone does not provide cross-compilation tools.

For example, on Windows with the required C++ tools installed:

```bash
yarn prepare:7za
yarn build:win nsis --x64 --publish never
```

For a Linux AppImage or a macOS build on the corresponding host:

```bash
yarn build:linux AppImage --x64 --publish never
yarn build:mac default --arm64 --publish never
```

The `beforePack` hook stages the plugin runtime for each packaging target automatically, using the exact npm version pinned in `package.json`. To test the **experimental bundled npm** option in development, run `yarn prepare:plugin-runtime` and enable the option on the Plugins page. It stages files in `build/plugin-runtime/<platform>-<arch>/`, with `win`, `mac`, or `linux` as the platform. System npm remains the default when the option is disabled; changing modes uses the same installed plugins and configuration.

## Checks and submitting changes

For code changes, run the applicable checks before submitting:

```bash
yarn typecheck
yarn lint
yarn lint:dpdm
yarn lint:dpdm:renderer
yarn test:release
```

Use the style scripts when changing styles, and inspect their automatic fixes. For UI, provider, or plugin changes, also exercise the affected behavior in `yarn dev`; the release tests do not cover those flows. Keep credentials and private file contents out of logs, screenshots, and issue reports.

Remove temporary debugging code, stage only the intended files, and use `yarn cz` for the commit prompt. The pre-commit hook runs `yarn lint:fix`, which can modify files; review and stage those fixes as needed. The commit-msg hook validates messages with the project's node-bump-version convention.
