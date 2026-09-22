exports.default = async context => {
  const { preparePluginRuntime } = await import('./prepare-plugin-runtime.mjs')
  const architectures = { 1: 'x64', 3: 'arm64' }
  if (!architectures[context.arch]) throw new Error(`Unsupported bundled npm architecture: ${context.arch}`)
  await preparePluginRuntime(context.electronPlatformName, architectures[context.arch])
}
