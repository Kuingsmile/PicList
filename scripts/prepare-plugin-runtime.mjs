import { execFileSync } from 'node:child_process'
import { mkdir, readFile, rm, writeFile } from 'node:fs/promises'
import path from 'node:path'
import { fileURLToPath } from 'node:url'

import { copyNpmRuntime } from './plugin-runtime/copy-npm.mjs'

const root = path.resolve(path.dirname(fileURLToPath(import.meta.url)), '..')
const platformNames = { win32: 'win', darwin: 'mac', linux: 'linux' }

function findWindowsToolchain(arch) {
  if (process.platform !== 'win32') {
    throw new Error('Build the Windows launcher on Windows with Visual Studio C++ tools')
  }
  const vswhere = path.join(process.env['ProgramFiles(x86)'], 'Microsoft Visual Studio', 'Installer', 'vswhere.exe')
  const component =
    arch === 'arm64'
      ? 'Microsoft.VisualStudio.Component.VC.Tools.ARM64'
      : 'Microsoft.VisualStudio.Component.VC.Tools.x86.x64'
  let installation
  try {
    installation = execFileSync(
      vswhere,
      ['-latest', '-products', '*', '-requires', component, '-property', 'installationPath'],
      { encoding: 'utf8', windowsHide: true },
    ).trim()
  } catch (error) {
    throw new Error('Visual Studio Installer and C++ build tools are required to build the bundled Node launcher', {
      cause: error,
    })
  }
  if (!installation) {
    throw new Error(
      `Windows ${arch} packaging requires Visual Studio C++ tools for ${arch}. ` +
        `Install ${component} in Visual Studio Installer's Individual components tab. ` +
        'To build for this computer, run yarn build:win without architecture flags.',
    )
  }
  return {
    vcvars: path.join(installation, 'VC', 'Auxiliary', 'Build', 'vcvarsall.bat'),
    target:
      process.arch === 'arm64' ? (arch === 'arm64' ? 'arm64' : 'arm64_x64') : arch === 'arm64' ? 'x64_arm64' : 'x64',
  }
}

export async function preparePluginRuntime(platform = process.platform, arch = process.arch) {
  if (!platformNames[platform] || !['x64', 'arm64'].includes(arch)) {
    throw new Error(`Unsupported plugin runtime target: ${platform}/${arch}`)
  }
  const npmDir = path.join(root, 'node_modules', 'npm')
  const pkg = JSON.parse(await readFile(path.join(root, 'package.json'), 'utf8'))
  const npm = JSON.parse(await readFile(path.join(npmDir, 'package.json'), 'utf8'))
  if (npm.version !== pkg.devDependencies.npm) throw new Error('Install the pinned npm dependency before packaging')
  // Detect missing cross-compilation tools before replacing any staged runtime.
  const toolchain = platform === 'win32' ? findWindowsToolchain(arch) : undefined
  const destination = path.join(root, 'build', 'plugin-runtime', `${platformNames[platform]}-${arch}`)
  // Only replace this architecture's generated resources, never installed plugins.
  if (path.dirname(path.resolve(destination)) !== path.resolve(root, 'build', 'plugin-runtime')) {
    throw new Error('Unexpected plugin runtime staging path')
  }
  await rm(destination, { recursive: true, force: true })
  const bin = path.join(destination, 'bin')
  await mkdir(bin, { recursive: true })
  await copyNpmRuntime(npmDir, path.join(destination, 'npm'))
  for (const [name, variable] of [
    ['npm', 'PICLIST_NPM_CLI'],
    ['npx', 'PICLIST_NPX_CLI'],
  ]) {
    await writeFile(path.join(bin, name), `#!/bin/sh\nexec "$PICLIST_NODE_EXEC_PATH" "$${variable}" "$@"\n`, {
      mode: 0o755,
    })
    await writeFile(path.join(bin, `${name}.cmd`), `@echo off\r\n"%PICLIST_NODE_EXEC_PATH%" "%${variable}%" %*\r\n`)
  }
  await writeFile(
    path.join(bin, 'node'),
    '#!/bin/sh\nexport ELECTRON_RUN_AS_NODE=1\nexec "$PICLIST_NODE_EXEC_PATH" "$@"\n',
    { mode: 0o755 },
  )
  if (toolchain) {
    const source = path.join(root, 'scripts', 'plugin-runtime', 'node-launcher.c')
    const buildScript = path.join(destination, 'compile-launcher.cmd')
    await writeFile(
      buildScript,
      `@echo off\r\ncall "${toolchain.vcvars}" ${toolchain.target} >nul\r\nif errorlevel 1 exit /b 1\r\ncl /nologo /O2 /MT /W4 "${source}" /Fe:"${path.join(bin, 'node.exe')}" /Fo:"${path.join(destination, 'node-launcher.obj')}" /link /SUBSYSTEM:CONSOLE\r\n`,
    )
    execFileSync(process.env.ComSpec || 'cmd.exe', ['/d', '/c', 'compile-launcher.cmd'], {
      cwd: destination,
      stdio: 'inherit',
      windowsHide: true,
    })
  }
  console.log(`Prepared experimental plugin runtime: ${platformNames[platform]}-${arch}, npm ${npm.version}`)
}

if (process.argv[1] && path.resolve(process.argv[1]) === fileURLToPath(import.meta.url)) {
  await preparePluginRuntime()
}
