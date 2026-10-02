import { useStorage } from '@vueuse/core'
import { computed, onBeforeUnmount, ref, watch } from 'vue'
import { useI18n } from 'vue-i18n'

import { usePicBed } from '@/composables/useGlobal'
import useMessage from '@/composables/useMessage'
import { getConfig, saveConfig } from '@/services/configService'
import { configPaths } from '@/utils/configPaths'
import { IRPCActionType } from '#/constants/rpcActions'

export const MAX_FAVORITE_PICBEDS = 6
const LONG_PRESS_DURATION = 500
const LONG_PRESS_RESET_DELAY = 10000

export function useFavoritePicbeds() {
  const { t } = useI18n()
  const message = useMessage()
  const { picBedG, defaultPicBedG, defaultConfigNameG, defaultIdG, updatePicBeds } = usePicBed()
  const favoritePicbeds = useStorage<IFavoritePicbedItem[]>('favorite-picbeds', [])
  const longPressedBadge = ref<string | null>(null)
  let longPressTimer: ReturnType<typeof setTimeout> | undefined
  let longPressResetTimer: ReturnType<typeof setTimeout> | undefined

  const isCurrentPicBedInFavorites = computed(() => favoritePicbeds.value.some(isCurrentPicbed))

  async function validateFavoritePicbeds() {
    if (!favoritePicbeds.value.length) return
    const uploaders = (await getConfig<IUploaderConfig>(configPaths.uploader)) || {}
    const availableFavorites = favoritePicbeds.value.filter(favorite => {
      return (
        Object.keys(uploaders).includes(favorite.type) &&
        uploaders[favorite.type]?.configList.some(
          config => config._id === favorite.id && config._configName === favorite.configName,
        )
      )
    })
    if (JSON.stringify(availableFavorites) !== JSON.stringify(favoritePicbeds.value)) {
      favoritePicbeds.value = availableFavorites
    }
  }

  function addCurrentPicbedToFavorites() {
    favoritePicbeds.value.push({
      id: defaultIdG.value,
      type: defaultPicBedG.value,
      configName: defaultConfigNameG.value,
    })
    message.success(t('pages.upload.picbedAddedToFavorites'))
  }

  function removePicbedFromFavorites(favorite: IFavoritePicbedItem) {
    const index = favoritePicbeds.value.findIndex(
      item => item.type === favorite.type && item.id === favorite.id && item.configName === favorite.configName,
    )
    if (index === -1) return
    favoritePicbeds.value.splice(index, 1)
  }

  async function switchToPicbed(favorite: IFavoritePicbedItem) {
    if (!favorite.id || !favorite.type || !favorite.configName) return

    const uploader = await getConfig<IUploaderConfigItem>(`uploader.${favorite.type}`)
    const targetConfig = uploader?.configList.find(
      config => config._id === favorite.id && config._configName === favorite.configName,
    )
    if (!targetConfig) return

    const saved = await saveConfig({
      [`uploader.${favorite.type}.defaultId`]: favorite.id,
      [`picBed.${favorite.type}`]: targetConfig,
      [configPaths.picBed.current]: favorite.type,
      [configPaths.picBed.uploader]: favorite.type,
    })
    if (!saved) return

    await updatePicBeds()
    const name = getPicbedName(favorite).split('-')[0]
    window.electron.sendRPC(IRPCActionType.TRAY_SET_TOOL_TIP, `${name} ${targetConfig._configName}`)
    message.success(t('pages.upload.picbedSwitched', { name: getPicbedName(favorite) }))
  }

  function getPicbedName(favorite: IFavoritePicbedItem): string {
    if (!picBedG.value || picBedG.value.length === 0) return favorite.configName || 'Default'
    const provider = picBedG.value.find(item => item.type === favorite.type)
    return `${provider ? provider.name : favorite.type}-${favorite.configName}`
  }

  function isCurrentPicbed(favorite: IFavoritePicbedItem): boolean {
    return defaultIdG.value === favorite.id
  }

  function handleBadgeClick(favorite: IFavoritePicbedItem) {
    if (longPressedBadge.value === favorite.id || isCurrentPicbed(favorite)) return
    switchToPicbed(favorite)
  }

  function clearLongPressTimers() {
    clearTimeout(longPressTimer)
    clearTimeout(longPressResetTimer)
    longPressTimer = undefined
    longPressResetTimer = undefined
  }

  function startBadgeLongPress(favorite: IFavoritePicbedItem, event?: TouchEvent) {
    clearLongPressTimers()
    longPressTimer = setTimeout(() => {
      longPressTimer = undefined
      longPressedBadge.value = favorite.id
      event?.preventDefault()
    }, LONG_PRESS_DURATION)
  }

  function endBadgeLongPress() {
    clearLongPressTimers()
    longPressResetTimer = setTimeout(() => {
      longPressResetTimer = undefined
      longPressedBadge.value = null
    }, LONG_PRESS_RESET_DELAY)
  }

  watch(favoritePicbeds, validateFavoritePicbeds, { immediate: true })
  onBeforeUnmount(clearLongPressTimers)

  return {
    favoritePicbeds,
    longPressedBadge,
    isCurrentPicBedInFavorites,
    addCurrentPicbedToFavorites,
    removePicbedFromFavorites,
    getPicbedName,
    isCurrentPicbed,
    handleBadgeClick,
    startBadgeLongPress,
    endBadgeLongPress,
  }
}
