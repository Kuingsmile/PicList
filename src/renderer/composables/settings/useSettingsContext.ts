import { inject, type InjectionKey, provide } from 'vue'

import type { useSettingsState } from './useSettingsState'

type SettingsContext = ReturnType<typeof useSettingsState>
const settingsKey: InjectionKey<SettingsContext> = Symbol('settings')

export function provideSettings(settings: SettingsContext) {
  provide(settingsKey, settings)
}

export function useSettingsContext() {
  const settings = inject(settingsKey)
  if (!settings) throw new Error('Settings sections must be rendered inside PicGoSetting.')
  return settings
}
