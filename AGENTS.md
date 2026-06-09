# Repository Guidelines

## Project Structure & Module Organization

PicList is an Electron + Vue + TypeScript app. Electron main-process code lives in `src/main`, including APIs, RPC events, lifecycle hooks, servers, and cloud storage management logic. Renderer UI code lives in `src/renderer`, with pages, components, utilities, store, router, and locale files grouped by feature. Preload bridge code belongs in `src/preload`. Shared global types are under `src/universal/types`. Tests are in `tests/*.test.ts`. Static and packaging assets are in `src/renderer/public`, `resources`, `build`, and `imgs`.

## Build, Test, and Development Commands

This repository uses Yarn 1.x and includes `yarn.lock`; do not add another lockfile unless the package manager is intentionally migrated.

- `yarn`: install dependencies and Electron app deps.
- `yarn dev`: start the Electron/Vite development app.
- `yarn build`: build with `electron-vite` and package the app.
- `yarn build:win`, `yarn build:mac`, `yarn build:linux`: create platform-specific packages.
- `yarn test`: run Vitest tests.
- `yarn lint`: run ESLint across source, scripts, and config files.
- `yarn lint:style`: auto-fix Vue/CSS/SCSS/Less style issues.
- `yarn lint:dpdm` and `yarn lint:dpdm:renderer`: detect circular dependencies.

## Coding Style & Naming Conventions

Use TypeScript and Vue single-file components following existing module boundaries: main-only behavior in `src/main`, renderer-only behavior in `src/renderer`, and exposed bridge code in `src/preload`. Formatting is 2-space indentation, LF endings, UTF-8, single quotes, no semicolons, trailing commas, and 120-column width via Prettier. Prefer camelCase for functions and variables, PascalCase for Vue components and classes, and nearby file naming patterns for CSS.

## Testing Guidelines

Use Vitest for unit tests. Place tests in `tests` with the `*.test.ts` suffix, and name cases after the behavior under test. Add or update tests when changing utilities, crypto helpers, upload/delete behavior, or parsing logic. Run `yarn test` before submitting, and include manual checks for Electron UI or OS integration changes.

## Commit & Pull Request Guidelines

Commit history uses git-cz/node-bump-version messages such as `:sparkles: Feature(custom): ...`, `:hammer: Refactor(custom): ...`, and `:package: Chore(custom): ...`. Use `yarn cz` after staging changes. PRs should describe the change, list validation commands and results, link issues when applicable, and include screenshots for visible UI changes.

## Security & Configuration Tips

Never log secrets, tokens, private prompts, or private file contents. Keep local credentials in ignored environment or app configuration files, and avoid committing generated output from `out`, `dist_electron`, or packaging runs unless maintainers request it.
