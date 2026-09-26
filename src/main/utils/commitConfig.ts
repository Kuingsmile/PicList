interface ConfigStore {
  getConfig: (key: string) => unknown
  saveConfig: (config: Record<string, any>) => void
  setConfig: (config: Record<string, any>) => void
}

/** PicGo updates its runtime overrides before disk; restore them if the atomic write fails. */
export function commitConfig(store: ConfigStore, config: Record<string, any>): true {
  const previous = Object.fromEntries(Object.keys(config).map(key => [key, structuredClone(store.getConfig(key))]))
  try {
    store.saveConfig(config)
  } catch (error) {
    store.setConfig(previous)
    throw error
  }
  return true
}
