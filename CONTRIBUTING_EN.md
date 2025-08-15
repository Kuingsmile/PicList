# Contribution Guidelines

## Installation and startup

Minimum requirements:

- Node.js >= 20
- Yarn >= 1.22

1. Use [yarn](https://yarnpkg.com/) to install dependencies

```bash
yarn
```

then pass

```bash
yarn dev
```

Startup project.

1. Please add code only related to the main process of Electron in the `src/main` directory. Code only related to the rendering process should be added in the `src/renderer` directory. Add code that needs to be exposed to the rendering process in the `src/preload` directory.
2. Please add all global type definitions in `src/universal/types/`, if it is `enum`, please add it in `src/universal/types/enum.ts`.
3. Code related to the management function of the picture bed should be added in the `src/main/manage` and `src/renderer/manage` directory.

## i18n-Main Process

1. Create a language `yml` file under `public/i18n/`, for example `zh-Hans.yml`. Then refer to `zh-CN.yml` or `en.yml` to write language files. Also note that PicList will display the name of the language to the user via `LANG_DISPLAY_LABEL` in the language file.
2. Add a default language to `src/universal/i18n/index.ts`. where `label` is the value of `LANG_DISPLAY_LABEL` in the language file, and `value` is the name of the language file.
3. If you are updating an existing language file, be sure to run `yarn i18n` after the update to ensure that the correct language definition file can be generated.

## Submit code

1. Please check that the code has no extra comments, `console.log` and other debugging code.
2. Before submitting the code, please execute the command `git add . && yarn cz` to invoke [Code Submission Specification Tool](https://github.com/Kuingsmile/node-bump-version). Submit code through this tool.
