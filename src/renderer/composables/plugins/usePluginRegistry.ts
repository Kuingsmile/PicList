import { useStorage } from '@vueuse/core'
import { debounce } from 'lodash-es'
import type { Ref } from 'vue'
import { computed, onBeforeUnmount, onWatcherCleanup, reactive, ref, watch } from 'vue'

import { fetchRegistryJson } from '@/services/pluginRegistry'
import { handleStreamlinePluginName } from '#/utils/strings'
interface PluginRegistryOptions {
  pluginList: Ref<IPicGoPlugin[]>
  pluginNameList: Ref<string[]>
  loading: Ref<boolean>
  getPluginList: () => void
}

export function usePluginRegistry({ pluginList, pluginNameList, loading, getPluginList }: PluginRegistryOptions) {
  const METADATA_CONCURRENCY = 4

  const METADATA_CACHE_TTL_MS = 5 * 60_000

  const searchText = ref('')

  const latestVersionMap = reactive<Record<string, string>>({})

  const updateTimeMap = reactive<Record<string, string>>({})

  const strictSearch = useStorage('plugin-strict-search', true)

  const showBrowseDialog = ref(false)

  const browseSearchText = ref('')

  const browsePlugins = ref<IPicGoPlugin[]>([])

  const loadingBrowse = ref(false)

  let searchController: AbortController | undefined

  let browseController: AbortController | undefined

  let disposed = false

  const metadataQueue = new Set<string>()

  const metadataControllers = new Map<string, AbortController>()

  const metadataFetchedAt = new Map<string, number>()

  const npmSearchText = computed(() => {
    return searchText.value.match('picgo-plugin-')
      ? searchText.value
      : searchText.value !== ''
        ? `picgo-plugin-${searchText.value}`
        : searchText.value
  })

  const filteredBrowsePlugins = computed(() => {
    if (!browseSearchText.value) {
      return browsePlugins.value
    }
    const search = browseSearchText.value.toLowerCase()
    return browsePlugins.value.filter(plugin => {
      return (
        plugin.name.toLowerCase().includes(search) ||
        plugin.fullName.toLowerCase().includes(search) ||
        plugin.description?.toLowerCase().includes(search) ||
        plugin.author?.toLowerCase().includes(search)
      )
    })
  })

  const getSearchResult = debounce(_getSearchResult, 300)

  function queuePluginMetadata(list: IPicGoPlugin[]) {
    for (const { fullName } of list) {
      const fetchedAt = metadataFetchedAt.get(fullName)
      if (fetchedAt !== undefined && Date.now() - fetchedAt < METADATA_CACHE_TTL_MS) continue
      if (!metadataControllers.has(fullName)) metadataQueue.add(fullName)
    }
    loadNextPluginMetadata()
  }

  function loadNextPluginMetadata() {
    while (!disposed && metadataControllers.size < METADATA_CONCURRENCY && metadataQueue.size > 0) {
      const pluginName = metadataQueue.values().next().value!
      metadataQueue.delete(pluginName)
      const controller = new AbortController()
      metadataControllers.set(pluginName, controller)
      void getLatestVersionOfPlugIn(pluginName, controller)
    }
  }

  async function getLatestVersionOfPlugIn(pluginName: string, controller: AbortController) {
    try {
      const data = await fetchRegistryJson(`https://registry.npmjs.com/${encodeURIComponent(pluginName)}`, controller)
      if (disposed || controller.signal.aborted || typeof data['dist-tags']?.latest !== 'string') return
      latestVersionMap[pluginName] = data['dist-tags'].latest
      updateTimeMap[pluginName] = (data.time?.modified || '').split('T')[0]
      metadataFetchedAt.set(pluginName, Date.now())
    } catch {
      if (!controller.signal.aborted) console.error('Failed to fetch plugin metadata')
    } finally {
      metadataControllers.delete(pluginName)
      loadNextPluginMetadata()
    }
  }

  async function _getSearchResult(val: string, strict: boolean, controller: AbortController) {
    try {
      const data = await fetchRegistryJson(
        `https://registry.npmjs.com/-/v1/search?text=${encodeURIComponent(val)}`,
        controller,
      )
      if (controller !== searchController || controller.signal.aborted) return
      pluginList.value = data.objects
        .filter((item: INPMSearchResultObject) => {
          return strict
            ? item.package.name.includes('picgo-plugin-') && item.package.name.includes(val)
            : item.package.name.includes('picgo-plugin-')
        })
        .map((item: INPMSearchResultObject) => {
          return handleSearchResult(item)
        })
    } catch {
      if (controller === searchController && !controller.signal.aborted) console.error('Failed to search plugins')
    } finally {
      if (controller === searchController) {
        loading.value = false
        searchController = undefined
      }
    }
  }

  function handleSearchResult(item: INPMSearchResultObject) {
    const pkg = item.package
    const name = handleStreamlinePluginName(pkg.name)
    let gui = false
    if (pkg.keywords && pkg.keywords.length > 0) {
      if (pkg.keywords.includes('picgo-gui-plugin')) {
        gui = true
      }
    }
    return {
      name,
      date: pkg.date ? pkg.date.split('T')[0] : '',
      fullName: pkg.name,
      author: pkg.author?.name || pkg.publisher?.username || 'unknown',
      description: pkg.description,
      logo: `https://cdn.jsdelivr.net/npm/${pkg.name}/logo.png`,
      config: {},
      homepage: pkg.links ? pkg.links.homepage : '',
      hasInstall: pluginNameList.value.some(plugin => plugin === pkg.name),
      version: pkg.version,
      gui,
      ing: false, // installing or uninstalling
    }
  }

  async function openBrowsePluginsDialog() {
    showBrowseDialog.value = true
    browseSearchText.value = ''
    await fetchAllPlugins()
  }

  async function fetchAllPlugins() {
    if (!showBrowseDialog.value || disposed) return
    browseController?.abort()
    const controller = new AbortController()
    browseController = controller
    loadingBrowse.value = true
    try {
      const data = await fetchRegistryJson(
        'https://registry.npmjs.com/-/v1/search?text=picgo-plugin-&size=250',
        controller,
      )
      if (controller !== browseController || controller.signal.aborted) return
      browsePlugins.value = data.objects
        .filter((item: INPMSearchResultObject) => {
          return item.package.name.startsWith('picgo-plugin-')
        })
        .map((item: INPMSearchResultObject) => {
          return handleSearchResult(item)
        })
        .sort((a: IPicGoPlugin, b: IPicGoPlugin) => {
          return b.fullName.localeCompare(a.fullName)
        })
    } catch {
      if (controller === browseController && !controller.signal.aborted) console.error('Failed to fetch plugins')
    } finally {
      if (controller === browseController) {
        loadingBrowse.value = false
        browseController = undefined
      }
    }
  }
  watch(
    [npmSearchText, strictSearch],
    ([val, strict]) => {
      const controller = val ? new AbortController() : undefined
      onWatcherCleanup(() => {
        getSearchResult.cancel()
        controller?.abort()
        if (searchController === controller) searchController = undefined
      })
      pluginList.value = []
      loading.value = true
      if (val) {
        searchController = controller
        getSearchResult(val, strict, controller!)
      } else {
        getPluginList()
      }
    },
    { flush: 'sync' },
  )

  watch(
    showBrowseDialog,
    visible => {
      if (!visible) return
      document.body.style.overflow = 'hidden'
      onWatcherCleanup(() => {
        document.body.style.overflow = 'auto'
        browseController?.abort()
        browseController = undefined
        loadingBrowse.value = false
      })
    },
    { flush: 'sync' },
  )
  onBeforeUnmount(() => {
    disposed = true
    getSearchResult.cancel()
    searchController?.abort()
    browseController?.abort()
    metadataQueue.clear()
    metadataControllers.forEach(controller => controller.abort())
    metadataControllers.clear()
  })
  return {
    searchText,
    strictSearch,
    latestVersionMap,
    updateTimeMap,
    showBrowseDialog,
    browseSearchText,
    browsePlugins,
    loadingBrowse,
    filteredBrowsePlugins,
    queuePluginMetadata,
    openBrowsePluginsDialog,
  }
}
