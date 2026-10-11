const { LogMessageByKey, logMessageLevelByKey } = require('app-builder-lib/out/node-module-collector/moduleManager')

// Shared, resolved dependency references are routine collector diagnostics.
// Keep them available with DEBUG=electron-builder; unresolved references still warn.
logMessageLevelByKey[LogMessageByKey.PKG_DUPLICATE_REF] = 'debug'

module.exports = {
  productName: 'PicList',
  appId: 'com.kuingsmile.piclist',
  beforePack: 'scripts/beforePack.cjs',
  afterPack: 'scripts/afterPack.cjs',
  artifactBuildCompleted: 'scripts/afterArtifactBuild.cjs',
  // Notarization is a macOS step. Registering it on Linux produces a skipped
  // signing warning, and Windows has no Apple notarization to perform.
  ...(process.platform === 'darwin' ? { afterSign: 'scripts/notarize.cjs' } : {}),
  directories: {
    output: 'dist_electron',
    buildResources: 'build',
  },
  asarUnpack: [
    '**/node_modules/sharp/**',
    '**/node_modules/ssh2-no-cpu-features/**',
    '**/node_modules/@img/**',
    '**/node_modules/@resvg/**',
    'resources/**',
  ],
  files: ['out/**/*', 'resources/**', 'package.json', '!**/node_modules/typescript{,/**}'],
  extraResources: [
    {
      from: 'build/plugin-runtime/${os}-${arch}',
      to: 'plugin-runtime',
      filter: ['npm/**', 'bin/**'],
    },
  ],
  dmg: {
    contents: [
      {
        x: 410,
        y: 150,
        type: 'link',
        path: '/Applications',
      },
      {
        x: 130,
        y: 150,
        type: 'file',
      },
    ],
  },
  mac: {
    icon: 'resources/icon.icns',
    extendInfo: {
      LSUIElement: 0,
    },
    target: [
      {
        target: 'default',
        arch: ['x64', 'arm64'],
      },
    ],
    artifactName: 'PicList-${version}-${arch}.${ext}',
    hardenedRuntime: true,
    entitlements: 'build/entitlements.mac.plist',
    entitlementsInherit: 'build/entitlements.mac.plist',
    notarize: false,
  },
  win: {
    icon: 'resources/icon.ico',
    electronLanguages: ['en', 'zh'],
    artifactName: 'PicList-Setup-${version}-${arch}-portable.${ext}',
    verifyUpdateCodeSignature: false,
    // Build for the host by default. Pass --x64 --arm64 to package both architectures.
    target: ['nsis', '7z', 'zip'],
  },
  nsis: {
    artifactName: 'PicList-Setup-${version}-${arch}.exe',
    shortcutName: 'PicList',
    oneClick: false,
    allowToChangeInstallationDirectory: true,
    // Drawn at 2x (328x628, 300x114) because installer.nsh makes the installer DPI-aware.
    installerSidebar: 'build/installerSidebar.bmp',
    installerHeader: 'build/installerHeader.bmp',
    // Match the app's locales; installer.nsh defines its strings for exactly these.
    installerLanguages: ['en_US', 'zh_CN', 'zh_TW'],
    include: 'build/installer.nsh',
  },
  linux: {
    executableName: 'PicList',
    syncDesktopName: true,
    icon: 'build/icons/512x512.png',
    electronLanguages: ['en', 'zh'],
    artifactName: 'PicList-${version}-${arch}.${ext}',
    target: [
      {
        target: 'AppImage',
        arch: ['x64', 'arm64'],
      },
      {
        target: 'deb',
        arch: ['x64', 'arm64'],
      },
      {
        target: 'snap',
        arch: ['x64'],
      },
    ],
    maintainer: 'Kuingsmile',
    category: 'Utility',
  },
}
