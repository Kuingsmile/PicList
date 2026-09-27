import { computed, onBeforeUnmount, reactive, ref, type WritableComputedRef } from 'vue'

import { usePicBed } from '@/hooks/useGlobal'
import { getRawData } from '@/utils/common'
import { configPaths } from '@/utils/configPaths'
import { getConfig, saveConfig } from '@/utils/dataSender'
import {
  imageProcessingDefaults,
  type ImageProcessingGlobals,
  type ProcessingGroup,
  type ProcessingOptionValue,
  type ProcessingScope,
  type ResolvedProcessingOption,
  resolveImageProcessingConfig,
} from '@/utils/imageProcessingConfig'

interface UploaderChoice {
  id: string
  name: string
}

export function useImageProcessingSettings(initialConfigId: () => string, initialProvider: () => string) {
  const { picBedG } = usePicBed()
  const globalSettings = ref<ImageProcessingGlobals>({})
  const profiles = ref<IBuildInListItem[]>([])
  const providers = ref<{ type: string; name: string }[]>([])
  const configurations = ref<Record<string, UploaderChoice[]>>({})
  const defaultIds = ref<Record<string, string>>({})
  const selectedProvider = ref('')
  const selectedConfigId = ref('')
  const scope = ref<ProcessingScope>('global')
  const isInitialized = ref(false)
  const loadFailed = ref(false)
  const saveState = ref<'saved' | 'saving' | 'error'>('saved')
  let loadVersion = 0

  // Serial, coalesced writes keep quick scope/provider changes from saving to the wrong target.
  const pending = new Map<string, unknown>()
  let saving: Promise<void> | undefined
  function flushSaves(): Promise<void> {
    if (saving) return saving
    saving = (async () => {
      saveState.value = 'saving'
      while (pending.size) {
        const [key, value] = pending.entries().next().value!
        pending.delete(key)
        let success = false
        try {
          success = await saveConfig(key, value)
        } catch {
          // Keep the draft available for retry without logging settings values.
        }
        if (!success) {
          if (!pending.has(key)) pending.set(key, value)
          saveState.value = 'error'
          return
        }
      }
      saveState.value = 'saved'
    })().finally(() => {
      saving = undefined
    })
    return saving
  }

  function enqueueSave(key: string, value: unknown) {
    pending.set(key, getRawData(value))
    void flushSaves()
  }

  const configurationOptions = computed(() => configurations.value[selectedProvider.value] || [])
  const targetProvider = computed({
    get: () => selectedProvider.value,
    set(value: string) {
      selectedProvider.value = value
      const choices = configurationOptions.value
      selectedConfigId.value = choices.find(item => item.id === defaultIds.value[value])?.id || choices[0]?.id || ''
    },
  })
  const currentProfile = computed(() => profiles.value.find(item => item.id === selectedConfigId.value) || {})
  const previewUploader = computed(() => ({
    type: selectedProvider.value,
    providerName: providers.value.find(item => item.type === selectedProvider.value)?.name || selectedProvider.value,
    id: selectedConfigId.value,
    configName: configurationOptions.value.find(item => item.id === selectedConfigId.value)?.name || '',
  }))
  const settingsByScope = computed(() => ({
    global: resolveImageProcessingConfig(globalSettings.value),
    provider: resolveImageProcessingConfig(globalSettings.value, {}, selectedProvider.value),
    config: resolveImageProcessingConfig(globalSettings.value, currentProfile.value, selectedProvider.value),
  }))
  const effectiveSettings = computed(() => settingsByScope.value.config)
  const editingSettings = computed(() => settingsByScope.value[scope.value])
  const canEdit = computed(
    () =>
      isInitialized.value &&
      (scope.value === 'global' || !!selectedProvider.value) &&
      (scope.value !== 'config' || !!selectedConfigId.value),
  )

  async function initData() {
    const version = ++loadVersion
    // Do not replace an unsaved draft during an external target change.
    if (saving) await saving
    if (pending.size) return
    isInitialized.value = false
    loadFailed.value = false
    try {
      const config = await getConfig<any>()
      if (version !== loadVersion) return
      if (!config) throw new Error('Settings unavailable')
      const buildIn = config.buildIn || {}
      globalSettings.value = {
        compress: buildIn.compress || {},
        watermark: buildIn.watermark || {},
        skipProcess: buildIn.skipProcess || {},
        rename: buildIn.rename || {},
        autoRename: config.settings?.autoRename,
        manualRename: config.settings?.rename,
      }
      profiles.value = buildIn.list || []
      const provider = initialProvider() || config.picBed?.uploader || config.picBed?.current || 'smms'
      const registered = new Map(picBedG.value.map(item => [item.type, item.name]))
      for (const type of [...Object.keys(config.uploader || {}), provider]) {
        if (!registered.has(type)) registered.set(type, type)
      }
      providers.value = [...registered].map(([type, name]) => ({ type, name }))
      const choices: Record<string, UploaderChoice[]> = {}
      const activeIds: Record<string, string> = {}
      for (const { type } of providers.value) {
        const active = config.picBed?.[type]
        activeIds[type] = active?._id || config.uploader?.[type]?.defaultId || ''
        choices[type] = (config.uploader?.[type]?.configList || []).map((item: IUploaderConfigListItem) => ({
          id: item._id,
          name: item._configName || '',
        }))
        if (active?._id && !choices[type].some(item => item.id === active._id)) {
          choices[type].push({ id: active._id, name: active._configName || '' })
        }
      }
      // The provider editor can open processing settings before a new configuration is saved.
      if (initialConfigId() && !choices[provider].some(item => item.id === initialConfigId())) {
        choices[provider].push({ id: initialConfigId(), name: '' })
      }
      configurations.value = choices
      defaultIds.value = activeIds
      targetProvider.value = provider
      if (initialConfigId()) selectedConfigId.value = initialConfigId()
      scope.value = initialConfigId() ? 'config' : 'global'
      isInitialized.value = true
    } catch {
      if (version === loadVersion) loadFailed.value = true
    }
  }

  function supportsProvider(group: ProcessingGroup, key: string) {
    return (group === 'compress' || group === 'watermark') && key !== 'watermarkFontPath'
  }

  function updateSetting(group: ProcessingGroup, key: string, value?: ProcessingOptionValue) {
    if (!canEdit.value || (scope.value === 'provider' && !supportsProvider(group, key))) return
    if (scope.value === 'config') {
      let profile = profiles.value.find(item => item.id === selectedConfigId.value)
      if (!profile) {
        profile = { id: selectedConfigId.value }
        profiles.value.push(profile)
        profile = profiles.value[profiles.value.length - 1]
      }
      const record = group === 'naming' ? profile : ((profile[group] ??= {}) as Record<string, unknown>)
      if (value === undefined) delete (record as Record<string, unknown>)[key]
      else (record as Record<string, unknown>)[key] = getRawData(value)
      if (group !== 'naming' && Object.keys(record).length === 0) delete profile[group]
      if (Object.keys(profile).length === 1) profiles.value = profiles.value.filter(item => item !== profile)
      enqueueSave(configPaths.buildIn.list, profiles.value)
      return
    }
    if (group === 'naming') {
      const field = key as 'autoRename' | 'manualRename'
      globalSettings.value[field] = !!value
      enqueueSave(field === 'autoRename' ? configPaths.settings.autoRename : configPaths.settings.rename, !!value)
      return
    }
    const record = (globalSettings.value[group] ??= {}) as Record<string, unknown>
    if (scope.value === 'provider') {
      const mapKey = `${key}Map`
      const map = (record[mapKey] ??= {}) as Record<string, unknown>
      if (value === undefined) delete map[selectedProvider.value]
      else map[selectedProvider.value] = getRawData(value)
      if (!Object.keys(map).length) delete record[mapKey]
    } else {
      record[key] = getRawData(value)
    }
    enqueueSave(configPaths.buildIn[group], record)
  }

  function fieldModels<T extends Record<string, ProcessingOptionValue>>(group: ProcessingGroup, defaults: T) {
    return Object.fromEntries(
      Object.keys(defaults).map(key => [
        key,
        computed({
          get: () =>
            (editingSettings.value[group] as Record<string, ResolvedProcessingOption>)[key].value as T[keyof T],
          set: (value: ProcessingOptionValue) => updateSetting(group, key, value),
        }),
      ]),
    ) as { [K in keyof T]: WritableComputedRef<T[K]> }
  }
  const form = reactive({
    compress: fieldModels('compress', imageProcessingDefaults.compress),
    watermark: fieldModels('watermark', imageProcessingDefaults.watermark),
    skipProcess: fieldModels('skipProcess', imageProcessingDefaults.skipProcess),
    rename: fieldModels('rename', imageProcessingDefaults.rename),
    naming: fieldModels('naming', imageProcessingDefaults.naming),
  })

  onBeforeUnmount(() => {
    loadVersion++
  })
  return {
    scope,
    providers,
    configurationOptions,
    targetProvider,
    selectedConfigId,
    previewUploader,
    editingSettings,
    effectiveSettings,
    settingsByScope,
    form,
    canEdit,
    isInitialized,
    loadFailed,
    saveState,
    initData,
    updateSetting,
    retrySave: flushSaves,
  }
}
