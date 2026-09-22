# Experimental bundled npm

The Plugins page offers **Use bundled npm (Experimental)**. It is off by default,
including after upgrading from an older PicList release. With the switch off,
PicList uses the existing PicList-Core system npm handler. There is no automatic
fallback or change to the selection when a command fails.

Both modes use the existing configured data directory, `package.json`, lockfile,
`node_modules`, plugin loader, enabled flags and plugin configuration. Changing
the switch does not move, reinstall or rebuild anything. A plugin installed in
either mode can be updated or removed in the other mode. An operation keeps the
mode selected when it was requested; operations are queued to avoid simultaneous
changes to the shared dependency tree.

## Runtime and packaging

The experimental executor runs the pinned npm CLI using `process.execPath` with
`ELECTRON_RUN_AS_NODE=1`. The environment is applied only to the child process.
Private `node`, `npm` and `npx` launchers support lifecycle scripts; Windows uses
a small native `node.exe` forwarding launcher so direct `spawn('node', ...)`
works without a globally installed Node executable. System PATH is not modified.

`beforePack` stages npm and its bundled dependencies/licenses outside ASAR under
`resources/plugin-runtime`. The `npm` development dependency is deliberately
pinned, and its Node engine requirement must be checked when updating npm or
Electron. Electron's `RunAsNode` fuse must remain enabled.

For development, run `yarn prepare:plugin-runtime` once before enabling the
experiment, and again after changing its resources. Normal builds prepare them
automatically. Windows builds require Visual Studio C++ build tools (including
ARM64 tools when targeting ARM64); those tools are only needed by contributors,
not PicList users. macOS and Linux use executable shell launchers.

## Verification

Run `yarn test:plugin-runtime` to prepare resources and run the focused tests.
The integration test creates a disposable registry and data directory. It covers
an older disabled plugin, configuration preservation, scoped packages and a
transitive dependency, lifecycle scripts invoking `node`/`npm`/`npx`, local folder
imports, and switching between system and bundled package management. The npm
resources are copied outside the repository to detect missing dependencies.

The standalone unit tests also run in the normal Vitest suite; the integration
test is enabled by `PICLIST_PLUGIN_RUNTIME_TEST=1`. Run the integration test on
each supported OS/architecture before release, and smoke-test the actual signed
packages as well as development Electron.

The experimental runtime removes the system Node prerequisite for package
management. Plugins that require Git, Python, compilers or other external tools
still require those tools. Native addons still need Electron-compatible binaries;
switching package managers does not change the runtime used to load plugins.
